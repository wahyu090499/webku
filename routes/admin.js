const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/gallery');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only images allowed'));
}});

const getContent = (key) => new Promise(r => db.content.findOne({ key }, (e, doc) => r(doc || {})));
const getAll = (collection, sort = {}) => new Promise(r => collection.find({}).sort(sort).exec((e, docs) => r(docs || [])));

// LOGIN PAGE
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin/dashboard');
  res.render('admin/login', { error: req.query.error });
});

// DASHBOARD
router.get('/dashboard', requireAuth, async (req, res) => {
  const [galleryCount, testiCount, pkgCount] = await Promise.all([
    new Promise(r => db.gallery.count({}, (e, n) => r(n || 0))),
    new Promise(r => db.testimonials.count({}, (e, n) => r(n || 0))),
    new Promise(r => db.packages.count({}, (e, n) => r(n || 0))),
  ]);
  res.render('admin/dashboard', { user: req.session.user, galleryCount, testiCount, pkgCount });
});

// ====== CONTENT EDITOR ======
router.get('/content', requireAuth, async (req, res) => {
  const [hero, about, stats, freeOffer, contact, footer] = await Promise.all([
    getContent('hero'), getContent('about'), getContent('stats'),
    getContent('freeOffer'), getContent('contact'), getContent('footer'),
  ]);
  res.render('admin/content', { user: req.session.user, hero, about, stats, freeOffer, contact, footer, success: req.query.success });
});

router.post('/content/:key', requireAuth, (req, res) => {
  const { key } = req.params;
  const data = { ...req.body, key };
  db.content.update({ key }, { $set: data }, { upsert: true }, (err) => {
    res.redirect('/admin/content?success=1');
  });
});

// ====== GALLERY ======
router.get('/gallery', requireAuth, async (req, res) => {
  const gallery = await getAll(db.gallery, { order: 1 });
  res.render('admin/gallery', { user: req.session.user, gallery, success: req.query.success, error: req.query.error });
});

router.post('/gallery/upload', requireAuth, upload.array('images', 10), (req, res) => {
  // CSRF check untuk multipart (token sudah di-parse oleh multer)
  const token = req.body._csrf;
  if (!token || token !== req.session.csrfToken) {
    return res.redirect('/admin/gallery?error=csrf');
  }
  const files = req.files;
  if (!files || files.length === 0) return res.redirect('/admin/gallery?error=1');
  
  const insertions = files.map((f, i) => new Promise(resolve => {
    const maxOrder = i;
    db.gallery.insert({
      filename: f.filename,
      originalName: f.originalname,
      path: '/uploads/gallery/' + f.filename,
      caption: req.body.caption || '',
      order: Date.now() + i,
      uploadedAt: new Date(),
    }, resolve);
  }));
  
  Promise.all(insertions).then(() => res.redirect('/admin/gallery?success=1'));
});

router.post('/gallery/delete/:id', requireAuth, (req, res) => {
  db.gallery.findOne({ _id: req.params.id }, (err, item) => {
    if (item) {
      const filePath = path.join(__dirname, '../public', item.path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      db.gallery.remove({ _id: req.params.id }, {}, () => res.redirect('/admin/gallery?success=1'));
    } else {
      res.redirect('/admin/gallery');
    }
  });
});

router.post('/gallery/caption/:id', requireAuth, (req, res) => {
  db.gallery.update({ _id: req.params.id }, { $set: { caption: req.body.caption } }, {}, () => {
    res.json({ ok: true });
  });
});

// ====== PACKAGES ======
router.get('/packages', requireAuth, async (req, res) => {
  const packages = await getAll(db.packages, { order: 1 });
  res.render('admin/packages', { user: req.session.user, packages, success: req.query.success });
});

router.post('/packages/save', requireAuth, (req, res) => {
  const { _id, name, icon, price, priceNote, note, highlight, features, order } = req.body;
  const featuresArr = typeof features === 'string' ? features.split('\n').filter(f => f.trim()) : (features || []);
  const data = { name, icon, price, priceNote, note, highlight: highlight === 'on', features: featuresArr, order: parseInt(order) || 99 };
  
  if (_id) {
    db.packages.update({ _id }, { $set: data }, {}, () => res.redirect('/admin/packages?success=1'));
  } else {
    db.packages.insert(data, () => res.redirect('/admin/packages?success=1'));
  }
});

router.post('/packages/delete/:id', requireAuth, requireAdmin, (req, res) => {
  db.packages.remove({ _id: req.params.id }, {}, () => res.redirect('/admin/packages?success=1'));
});

// ====== TESTIMONIALS ======
router.get('/testimonials', requireAuth, async (req, res) => {
  const testimonials = await getAll(db.testimonials, { order: 1 });
  res.render('admin/testimonials', { user: req.session.user, testimonials, success: req.query.success });
});

router.post('/testimonials/save', requireAuth, (req, res) => {
  const { _id, name, business, text, rating, order } = req.body;
  const data = { name, business, text, rating: parseInt(rating) || 5, order: parseInt(order) || 99 };
  
  if (_id) {
    db.testimonials.update({ _id }, { $set: data }, {}, () => res.redirect('/admin/testimonials?success=1'));
  } else {
    db.testimonials.insert(data, () => res.redirect('/admin/testimonials?success=1'));
  }
});

router.post('/testimonials/delete/:id', requireAuth, (req, res) => {
  db.testimonials.remove({ _id: req.params.id }, {}, () => res.redirect('/admin/testimonials?success=1'));
});

// ====== USER MANAGEMENT (Admin only) ======
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  const users = await new Promise(r => db.users.find({}, (e, docs) => r(docs || [])));
  res.render('admin/users', { user: req.session.user, users, success: req.query.success });
});

router.post('/users/save', requireAuth, requireAdmin, (req, res) => {
  const { _id, username, password, name, role } = req.body;
  const data = { username, name, role };
  if (password) data.password = bcrypt.hashSync(password, 10);
  
  if (_id) {
    db.users.update({ _id }, { $set: data }, {}, () => res.redirect('/admin/users?success=1'));
  } else {
    if (!password) return res.redirect('/admin/users?error=nopass');
    data.password = bcrypt.hashSync(password, 10);
    data.createdAt = new Date();
    db.users.insert(data, () => res.redirect('/admin/users?success=1'));
  }
});

router.post('/users/delete/:id', requireAuth, requireAdmin, (req, res) => {
  if (req.params.id === req.session.user._id) return res.redirect('/admin/users');
  db.users.remove({ _id: req.params.id }, {}, () => res.redirect('/admin/users?success=1'));
});

module.exports = router;
