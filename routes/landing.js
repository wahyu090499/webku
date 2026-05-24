const express = require('express');
const router = express.Router();
const { db } = require('../db');

const getContent = (key) => new Promise(r => db.content.findOne({ key }, (e, doc) => r(doc || {})));
const getAll = (collection, sort = {}) => new Promise(r => collection.find({}).sort(sort).exec((e, docs) => r(docs || [])));

router.get('/', async (req, res) => {
  try {
    const [hero, about, stats, freeOffer, contact, footer, packages, gallery, testimonials] = await Promise.all([
      getContent('hero'),
      getContent('about'),
      getContent('stats'),
      getContent('freeOffer'),
      getContent('contact'),
      getContent('footer'),
      getAll(db.packages, { order: 1 }),
      getAll(db.gallery, { order: 1 }),
      getAll(db.testimonials, { order: 1 }),
    ]);

    res.render('landing', { hero, about, stats, freeOffer, contact, footer, packages, gallery, testimonials });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
