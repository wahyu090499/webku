require('dotenv').config();
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

// ── Ensure directories ──
const sessionsDir = path.join(__dirname, 'data/sessions');
const uploadsDir = path.join(__dirname, 'public/uploads/gallery');
[sessionsDir, uploadsDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── Compression ──
app.use(compression());

// ── Security headers via Helmet ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── Rate Limiting ──
// General limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Terlalu banyak request. Coba lagi dalam 15 menit.',
}));

// Strict limiter untuk login - anti brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  skipSuccessfulRequests: true,
});

// ── View engine ──
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // penting untuk hosting/proxy

// ── Cookie parser ──
app.use(cookieParser(process.env.SESSION_SECRET || 'webku-secret'));

// ── Session ──
// maxAge = null → session cookie (hilang saat browser ditutup)
app.use(session({
  store: new FileStore({
    path: sessionsDir,
    ttl: 8 * 3600, // 8 jam max meski browser tidak ditutup
    retries: 1,
    logFn: () => {},
  }),
  secret: process.env.SESSION_SECRET || 'webku-secret-fallback',
  resave: false,
  saveUninitialized: false,
  name: 'wk_sid', // jangan pakai nama default 'connect.sid'
  cookie: {
    maxAge: null,       // ← SESSION COOKIE: hilang saat browser ditutup
    httpOnly: true,     // tidak bisa diakses JavaScript
    secure: isProd,     // https only di production
    sameSite: 'lax',
  },
}));

// ── Static files ──
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '1d' : 0,
  etag: true,
}));

// ── Body parsing ──
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

// ── CSRF Protection (double-submit cookie) ──
// Generate CSRF token untuk setiap session
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  // Expose ke semua views
  res.locals.csrfToken = req.session.csrfToken;
  res.locals.siteUrl = SITE_URL;
  res.locals.siteName = process.env.SITE_NAME || 'WebKu';
  next();
});

// Validate CSRF untuk POST requests ke admin & auth
app.use((req, res, next) => {
  if (req.method === 'POST') {
    const isAdminOrAuth = req.path.startsWith('/admin') || req.path.startsWith('/auth');
    // Skip CSRF check untuk upload (multipart) - dilindungi oleh auth middleware
    const isMultipart = req.headers['content-type'] && req.headers['content-type'].includes('multipart');
    if (isAdminOrAuth && !isMultipart) {
      const token = req.body._csrf || req.headers['x-csrf-token'];
      if (!token || token !== req.session.csrfToken) {
        return res.status(403).send('Request tidak valid (CSRF).');
      }
    }
  }
  next();
});

// ── Routes ──
const landingRouter = require('./routes/landing');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');

app.use('/', landingRouter);
app.use('/admin', adminRouter);
app.use('/auth', loginLimiter, authRouter); // rate limit di login

// ── Robots.txt ──
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /auth\nSitemap: ${SITE_URL}/sitemap.xml`);
});

// ── Sitemap ──
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/#gratis</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/#paket</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/#galeri</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE_URL}/#testimoni</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
</urlset>`);
});

// ── 404 & Error Handler ──
app.use((req, res) => res.status(404).render('404'));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(isProd ? 'Terjadi kesalahan pada server.' : err.message);
});

// ── Start ──
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 WebKu berjalan di ${SITE_URL}`);
    console.log(`📊 Admin: ${SITE_URL}/admin`);
    console.log(`🌍 Mode: ${isProd ? 'PRODUCTION' : 'development'}\n`);
  });
}).catch(err => console.error('DB init error:', err));
