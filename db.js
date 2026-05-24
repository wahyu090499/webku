require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Schemas ──
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
  name: String,
  createdAt: { type: Date, default: Date.now }
});

const ContentSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
}, { strict: false });

const GallerySchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  caption: String,
  order: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now }
});

const PackageSchema = new mongoose.Schema({
  name: String,
  icon: String,
  price: String,
  priceNote: String,
  features: [String],
  note: String,
  highlight: Boolean,
  order: { type: Number, default: 99 }
});

const TestimonialSchema = new mongoose.Schema({
  name: String,
  business: String,
  text: String,
  rating: { type: Number, default: 5 },
  order: { type: Number, default: 99 }
});

// ── Models ──
const User = mongoose.model('User', UserSchema);
const Content = mongoose.model('Content', ContentSchema);
const Gallery = mongoose.model('Gallery', GallerySchema);
const Package = mongoose.model('Package', PackageSchema);
const Testimonial = mongoose.model('Testimonial', TestimonialSchema);

// ── DB wrapper (compatible dengan kode lama yang pakai callback) ──
const db = {
  users: {
    findOne: (query, cb) => User.findOne(query).lean().then(d => cb(null, d)).catch(e => cb(e)),
    find: (query) => ({ sort: (s) => ({ exec: (cb) => User.find(query).sort(s).lean().then(d => cb(null, d)).catch(e => cb(e)) }) }),
    insert: (data, cb) => new User(data).save().then(d => cb && cb(null, d)).catch(e => cb && cb(e)),
    update: (query, update, opts, cb) => {
      const data = update.$set || update;
      User.findOneAndUpdate(query, data, { upsert: opts.upsert, new: true }).then(d => cb && cb(null, d)).catch(e => cb && cb(e));
    },
    remove: (query, opts, cb) => User.deleteOne(query).then(() => cb && cb(null)).catch(e => cb && cb(e)),
    count: (query, cb) => User.countDocuments(query).then(n => cb(null, n)).catch(e => cb(e)),
  },
  content: {
    findOne: (query, cb) => Content.findOne(query).lean().then(d => cb(null, d)).catch(e => cb(e)),
    update: (query, update, opts, cb) => {
      const data = update.$set || update;
      Content.findOneAndUpdate(query, data, { upsert: true, new: true }).then(d => cb && cb(null, d)).catch(e => cb && cb(e));
    },
    insert: (data, cb) => new Content(data).save().then(d => cb && cb(null, d)).catch(e => cb && cb(e)),
  },
  gallery: {
    findOne: (query, cb) => Gallery.findOne(query).lean().then(d => cb(null, d)).catch(e => cb(e)),
    find: (query) => ({ sort: (s) => ({ exec: (cb) => Gallery.find(query).sort(s).lean().then(d => cb(null, d)).catch(e => cb(e)) }) }),
    insert: (data, cb) => new Gallery(data).save().then(d => cb && cb(null, d)).catch(e => cb && cb(e)),
    update: (query, update, opts, cb) => {
      const data = update.$set || update;
      Gallery.findOneAndUpdate(query, data, { new: true }).then(d => cb && cb(null, d)).catch(e => cb && cb(e));
    },
    remove: (query, opts, cb) => Gallery.deleteOne(query).then(() => cb && cb(null)).catch(e => cb && cb(e)),
    count: (query, cb) => Gallery.countDocuments(query).then(n => cb(null, n)).catch(e => cb(e)),
  },
  packages: {
    findOne: (query, cb) => Package.findOne(query).lean().then(d => cb(null, d)).catch(e => cb(e)),
    find: (query) => ({ sort: (s) => ({ exec: (cb) => Package.find(query).sort(s).lean().then(d => cb(null, d)).catch(e => cb(e)) }) }),
    insert: (data, cb) => new Package(data).save().then(d => cb && cb(null, d)).catch(e => cb && cb(e)),
    update: (query, update, opts, cb) => {
      const data = update.$set || update;
      Package.findOneAndUpdate(query, data, { upsert: opts && opts.upsert, new: true }).then(d => cb && cb(null, d)).catch(e => cb && cb(e));
    },
    remove: (query, opts, cb) => Package.deleteOne(query).then(() => cb && cb(null)).catch(e => cb && cb(e)),
    count: (query, cb) => Package.countDocuments(query).then(n => cb(null, n)).catch(e => cb(e)),
  },
  testimonials: {
    findOne: (query, cb) => Testimonial.findOne(query).lean().then(d => cb(null, d)).catch(e => cb(e)),
    find: (query) => ({ sort: (s) => ({ exec: (cb) => Testimonial.find(query).sort(s).lean().then(d => cb(null, d)).catch(e => cb(e)) }) }),
    insert: (data, cb) => new Testimonial(data).save().then(d => cb && cb(null, d)).catch(e => cb && cb(e)),
    update: (query, update, opts, cb) => {
      const data = update.$set || update;
      Testimonial.findOneAndUpdate(query, data, { new: true }).then(d => cb && cb(null, d)).catch(e => cb && cb(e));
    },
    remove: (query, opts, cb) => Testimonial.deleteOne(query).then(() => cb && cb(null)).catch(e => cb && cb(e)),
    count: (query, cb) => Testimonial.countDocuments(query).then(n => cb(null, n)).catch(e => cb(e)),
  },
};

// ── Init & Seed ──
async function initDB() {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URL || 'mongodb://localhost:27017/webku';
  
  await mongoose.connect(mongoUrl);
  console.log('✅ MongoDB connected');

  // Seed admin
  const adminExists = await User.findOne({ username: 'admin' });
  if (!adminExists) {
    await new User({ username: 'admin', password: bcrypt.hashSync('admin123', 10), role: 'admin', name: 'Administrator' }).save();
    console.log('✅ Default admin created: admin / admin123');
  }

  // Seed content
  const contents = [
    { key: 'hero', title: 'Wujudkan Website Impian UMKM Anda', subtitle: 'Jasa pembuatan website profesional dengan penawaran GRATIS terbatas. Desain modern, mobile-friendly, dan siap pakai!', cta: 'Dapatkan Website Gratis', ctaWhatsapp: '6281234567890' },
    { key: 'about', title: 'Tentang Kami', name: 'Wahyu Arif', tagline: 'Web Developer & Digital Solution', bio: 'Lulusan SMK RPL dan kursus siap kerja PKBPI dengan predikat lulusan terbaik 2019. Saat ini aktif sebagai mahasiswa S1 Manajemen Universitas Terbuka sekaligus berpengalaman sebagai SPV Tim Technical Support.', phone: '6282334160625', email: '', instagram: '', facebook: '' },
    { key: 'stats', websites: '20+', clients: '15+', years: '2+', satisfaction: '100%' },
    { key: 'freeOffer', title: 'Website GRATIS Terbatas!', subtitle: 'Kami tanggung biaya pembuatan. Kamu hanya bayar hosting & domain per tahun!', priceHosting: 'Mulai dari Rp 300.000/tahun', note: 'Slot terbatas! Segera hubungi kami sebelum penuh.' },
    { key: 'contact', title: 'Siap Go Digital?', subtitle: 'Hubungi kami sekarang dan dapatkan konsultasi GRATIS!' },
    { key: 'footer', copyright: '© 2025 WebKu. All rights reserved.' },
  ];
  for (const c of contents) {
    await Content.findOneAndUpdate({ key: c.key }, c, { upsert: true });
  }
  console.log('✅ Default content initialized');

  // Seed packages
  const pkgCount = await Package.countDocuments();
  if (pkgCount === 0) {
    await Package.insertMany([
      { name: 'Paket GRATIS', icon: '🎁', price: 'GRATIS', priceNote: 'Biaya pembuatan ditanggung', features: ['Desain Layout Profesional (Desktop & Mobile)', 'Halaman Admin Konfigurasi Konten', 'Integrasi Tombol WhatsApp & Sosial Media', 'Galeri Dokumentasi', 'Responsive Design'], note: '', highlight: true, order: 1 },
      { name: 'Paket Starter', icon: '🚀', price: 'Rp 500.000', priceNote: 'Sekali bayar', features: ['Semua fitur Paket Gratis', 'Custom Domain Setup', 'Form Kontak', 'Google Maps Integration', 'SEO Basic', 'Support 1 Bulan'], note: '', highlight: false, order: 2 },
      { name: 'Paket Pro', icon: '💎', price: 'Rp 1.500.000', priceNote: 'Sekali bayar', features: ['Semua fitur Starter', 'E-Katalog Produk', 'Blog / Artikel', 'Google Analytics', 'Custom Email Domain', 'Priority Support 3 Bulan'], note: 'Paling Populer!', highlight: false, order: 3 },
    ]);
    console.log('✅ Default packages initialized');
  }

  // Seed testimonials
  const testiCount = await Testimonial.countDocuments();
  if (testiCount === 0) {
    await Testimonial.insertMany([
      { name: 'Ibu Sari', business: 'Toko Kue Sari', text: 'Website kami jadi lebih profesional dan banyak pelanggan yang tahu lewat Google. Terima kasih!', rating: 5, order: 1 },
      { name: 'Pak Budi', business: 'Bengkel Budi Motor', text: 'Prosesnya cepat dan hasilnya memuaskan. Sekarang customer bisa lihat harga dan foto langsung dari web.', rating: 5, order: 2 },
      { name: 'Mbak Dewi', business: 'Salon Cantik Dewi', text: 'Gratis tapi kualitasnya premium! Admin panelnya mudah dipakai bahkan untuk yang awam teknologi.', rating: 5, order: 3 },
    ]);
    console.log('✅ Default testimonials initialized');
  }
}

module.exports = { db, initDB };
