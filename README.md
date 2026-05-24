# WebKu – Website Marketing Jasa Pembuatan Website

Website marketing profesional untuk memasarkan jasa pembuatan website, lengkap dengan Admin Panel.

## 🚀 Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Jalankan server
node server.js

# 3. Buka di browser
http://localhost:3000
```

## 🔐 Login Admin

- **URL**: http://localhost:3000/admin
- **Username**: `admin`
- **Password**: `admin123`

> ⚠️ Segera ganti password setelah login pertama kali di menu **Manajemen User**!

## 📋 Fitur

### Landing Page
- Hero section dengan CTA WhatsApp
- Penawaran Website GRATIS (highlight)
- Daftar paket layanan (editable)
- Galeri portfolio
- Testimoni klien
- Section About Me
- Tombol WhatsApp floating
- Desain dark modern, responsif mobile

### Admin Panel
- **Dashboard** – ringkasan statistik & panduan cepat
- **Edit Konten** – ubah semua teks landing page (hero, about, stats, dll)
- **Galeri** – upload/hapus foto portfolio dengan caption
- **Paket Layanan** – tambah/edit/hapus paket harga
- **Testimoni** – kelola testimonial klien
- **Manajemen User** – tambah user dengan role:
  - `admin` – akses penuh
  - `editor` – edit konten, tidak bisa hapus paket atau kelola user

## 📁 Struktur Project

```
webku/
├── server.js          # Entry point
├── db.js              # Database setup (NeDB)
├── routes/
│   ├── landing.js     # Landing page route
│   ├── admin.js       # Admin routes
│   └── auth.js        # Login/logout
├── middleware/
│   └── auth.js        # Auth & role check
├── views/
│   ├── landing.ejs    # Landing page
│   └── admin/         # Admin views
├── public/
│   └── uploads/       # Foto yang diupload
└── data/              # Database files (auto-created)
```

## ⚙️ Konfigurasi Port

Secara default berjalan di port **3000**. Untuk mengubah:

```bash
PORT=8080 node server.js
```

## 🔧 Tips Deployment

- Untuk VPS/hosting, gunakan **PM2** agar server tetap berjalan:
  ```bash
  npm install -g pm2
  pm2 start server.js --name webku
  pm2 save
  ```
- Untuk custom domain, setup **Nginx** sebagai reverse proxy ke port 3000.

## 🌐 Deployment ke Hosting (RumahWeb / Niagahoster / dll)

### Persiapan
```bash
# 1. Buat file .env dari template
copy .env.example .env   # Windows
cp .env.example .env     # Linux/Mac

# 2. Edit .env - isi SESSION_SECRET dengan string acak panjang
# 3. Set NODE_ENV=production
# 4. Set SITE_URL=https://domain-kamu.com
```

### Setting .env untuk Production
```
PORT=3000
SESSION_SECRET=isi-dengan-64-karakter-acak-yang-tidak-bisa-ditebak
NODE_ENV=production
SITE_NAME=Nama Website Kamu
SITE_URL=https://domain-kamu.com
```

### Jalankan dengan PM2 (Recommended)
```bash
npm install -g pm2
pm2 start server.js --name webku
pm2 startup        # auto start saat server restart
pm2 save
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name domain-kamu.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Fitur Keamanan
- **Helmet.js** — HTTP security headers
- **Rate Limiting** — Anti brute force login (max 10x per 15 menit)
- **CSRF Protection** — Double-submit token di semua form
- **Session Cookie** — Session hilang saat browser ditutup
- **HTTPOnly Cookie** — Tidak bisa diakses JavaScript
- **Compression** — Gzip untuk performa lebih baik

## 🔍 SEO
- Meta tags lengkap (description, keywords, author)
- Open Graph (Facebook/WhatsApp share preview)
- Twitter Card
- Schema.org LocalBusiness structured data
- robots.txt otomatis
- sitemap.xml otomatis
- Update SITE_URL di .env agar sitemap benar
