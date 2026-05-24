const Datastore = require('@seald-io/nedb');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = {
  users: new Datastore({ filename: path.join(__dirname, 'data/users.db'), autoload: true }),
  content: new Datastore({ filename: path.join(__dirname, 'data/content.db'), autoload: true }),
  gallery: new Datastore({ filename: path.join(__dirname, 'data/gallery.db'), autoload: true }),
  testimonials: new Datastore({ filename: path.join(__dirname, 'data/testimonials.db'), autoload: true }),
  packages: new Datastore({ filename: path.join(__dirname, 'data/packages.db'), autoload: true }),
};

async function initDB() {
  // Create default admin
  const adminExists = await new Promise(r => db.users.findOne({ username: 'admin' }, (e, doc) => r(doc)));
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.users.insert({ username: 'admin', password: hash, role: 'admin', name: 'Administrator', createdAt: new Date() });
    console.log('✅ Default admin created: admin / admin123');
  }

  // Default site content
  const contentExists = await new Promise(r => db.content.findOne({ key: 'hero' }, (e, doc) => r(doc)));
  if (!contentExists) {
    const defaults = [
      { key: 'hero', title: 'Wujudkan Website Impian UMKM Anda', subtitle: 'Jasa pembuatan website profesional dengan penawaran GRATIS terbatas. Desain modern, mobile-friendly, dan siap pakai!', cta: 'Dapatkan Website Gratis', ctaWhatsapp: '6281234567890' },
      { key: 'about', title: 'Tentang Kami', name: 'Rizky Pratama', tagline: 'Web Developer & Digital Solution', bio: 'Lulusan SMK RPL dan kursus siap kerja PKBPI dengan predikat lulusan terbaik 2019. Saat ini aktif sebagai mahasiswa S1 Manajemen Universitas Terbuka sekaligus berpengalaman sebagai SPV Tim Technical Support. Dengan latar belakang di bidang teknologi dan manajemen, saya hadir untuk membantu UMKM Go Digital!', phone: '6281234567890', email: 'hello@webku.id', instagram: 'webku.id', facebook: 'webku.id' },
      { key: 'stats', websites: '20+', clients: '15+', years: '2+', satisfaction: '100%' },
      { key: 'freeOffer', title: 'Website GRATIS Terbatas!', subtitle: 'Kami tanggung biaya pembuatan. Kamu hanya bayar hosting & domain per tahun!', priceHosting: 'Mulai dari Rp 300.000/tahun', note: 'Slot terbatas! Segera hubungi kami sebelum penuh.' },
      { key: 'contact', title: 'Siap Go Digital?', subtitle: 'Hubungi kami sekarang dan dapatkan konsultasi GRATIS!' },
      { key: 'footer', copyright: '© 2025 WebKu. All rights reserved.' },
    ];
    defaults.forEach(d => db.content.insert(d));
    console.log('✅ Default content initialized');
  }

  // Default packages
  const pkgExists = await new Promise(r => db.packages.findOne({}, (e, doc) => r(doc)));
  if (!pkgExists) {
    const packages = [
      { name: 'Paket GRATIS', icon: '🎁', price: 'GRATIS', priceNote: 'Biaya pembuatan ditanggung', features: ['Desain Layout Profesional (Desktop & Mobile)', 'Halaman Admin Konfigurasi Konten', 'Integrasi Tombol WhatsApp & Sosial Media', 'Galeri Dokumentasi', 'Responsive Design'], note: 'Hanya bayar hosting & domain ±Rp300rb/tahun', highlight: true, order: 1 },
      { name: 'Paket Starter', icon: '🚀', price: 'Rp 500.000', priceNote: 'Sekali bayar', features: ['Semua fitur Paket Gratis', 'Custom Domain Setup', 'Form Kontak', 'Google Maps Integration', 'SEO Basic', 'Support 1 Bulan'], note: '', highlight: false, order: 2 },
      { name: 'Paket Pro', icon: '💎', price: 'Rp 1.500.000', priceNote: 'Sekali bayar', features: ['Semua fitur Starter', 'E-Katalog Produk', 'Blog / Artikel', 'Google Analytics', 'Custom Email Domain', 'Priority Support 3 Bulan'], note: 'Paling Populer!', highlight: false, order: 3 },
    ];
    packages.forEach(p => db.packages.insert(p));
    console.log('✅ Default packages initialized');
  }

  // Default testimonials
  const testiExists = await new Promise(r => db.testimonials.findOne({}, (e, doc) => r(doc)));
  if (!testiExists) {
    const testimonials = [
      { name: 'Ibu Sari', business: 'Toko Kue Sari', text: 'Website kami jadi lebih profesional dan banyak pelanggan yang tahu lewat Google. Terima kasih!', rating: 5, order: 1 },
      { name: 'Pak Budi', business: 'Bengkel Budi Motor', text: 'Prosesnya cepat dan hasilnya memuaskan. Sekarang customer bisa lihat harga dan foto langsung dari web.', rating: 5, order: 2 },
      { name: 'Mbak Dewi', business: 'Salon Cantik Dewi', text: 'Gratis tapi kualitasnya premium! Admin panelnya mudah dipakai bahkan untuk yang awam teknologi.', rating: 5, order: 3 },
    ];
    testimonials.forEach(t => db.testimonials.insert(t));
    console.log('✅ Default testimonials initialized');
  }
}

module.exports = { db, initDB };
