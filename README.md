# STOKAPP - Sistem Rekap Stok Barang

Aplikasi web untuk mengelola inventaris barang pribadi/kelompok kecil. Data antar pengguna **terisolasi dengan aman** (RLS), dilengkapi fitur pencatatan transaksi, laporan, dan validasi stok minus.

Dibuat menggunakan HTML, CSS, Vanilla JavaScript, dan Supabase.

## Fitur Utama
1. **Autentikasi Multi-User**: Login, daftar akun, dan reset password. Data tiap user terpisah secara aman (Row Level Security).
2. **Manajemen Produk & Kategori**: Mengatur master barang, harga modal, dan batas minimum stok.
3. **Peringatan Stok Menipis**: Banner otomatis muncul di dashboard.
4. **Pencatatan Transaksi**: Mencatat barang masuk, barang keluar, dan penyesuaian.
5. **Validasi Stok Ganda**: Mencegah stok minus melalui validasi di aplikasi (frontend) *dan* trigger di database (backend).
6. **Kartu Stok**: Riwayat kronologis perubahan stok lengkap dengan saldo berjalan.
7. **Impor & Ekspor CSV**: Memasukkan data produk massal & ekspor laporan.
8. **Laporan Periode**: Filter laporan berdasarkan tanggal dan kategori beserta kalkulasi nilai uang.

## Struktur Direktori
rekap-stok/
├── index.html
├── database.sql      <-- (Skrip SQL utama)
├── README.md
├── css/
│   └── style.css
└── js/
    └── app.js        <-- Semua logika aplikasi

## Cara Setup (Development)

### 1. Buat Proyek Supabase
1. Buat proyek baru di supabase.com.
2. Buka menu SQL Editor.
3. Buka file database.sql di folder ini. Copy seluruh isinya, paste ke SQL Editor, lalu klik Run.
Skrip ini otomatis membuat tabel profiles, categories, products, transactions, RLS Policies, dan Trigger validasi stok.

### 2. Konfigurasi Autentikasi
1. Buka menu Authentication -> Providers -> Email.
2. Pastikan Enable Email Provider menyala.
3. Buka menu URL Configuration, atur Site URL ke http://localhost:3000 dan tambahkan ke Redirect URLs (http://localhost:3000/**).

### 3. Hubungkan Aplikasi ke Database
1. DBuka Project Settings -> API.
2. Copy Project URL dan Publishable/Anon Key.
3. Buka file js/app.js, cari baris paling atas, dan sesuaikan nilainya:
   const SUPABASE_URL = 'URL_SUPABASE_KAMU';
   const SUPABASE_ANON_KEY = 'ANON_KEY_SUPABASE_KAMU';

### 4. Jalankan Aplikasi
Karena menggunakan JavaScript Modules, kamu harus menjalankannya lewat server lokal:
 - VS Code: Install ekstensi Live Server, klik kanan index.html -> Open with Live Server.
 - CLI: Jalankan python -m http.server 3000 di terminal, lalu buka http://localhost:3000.

## Cara Deploy (Gratis)

1. Upload folder ke repositori GitHub.
2. Buka Vercel / Netlify, import repositori tersebut.
3. Klik Deploy.
4. Salin URL Vercel yang didapat, lalu pergi ke Supabase -> Authentication -> URL Configuration untuk memperbarui Site URL dan Redirect URLs.

## Format Impor CSV
Pastikan file .csv memiliki header dengan format berikut:
Nama Produk,Kategori,Stok Awal,Min Stok,Harga Modal