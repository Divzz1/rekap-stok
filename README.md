# STOKAPP - Sistem Rekap Stok Barang

Aplikasi web untuk mengelola inventaris barang, mencatat transaksi masuk/keluar, serta memantau laporan stok secara real-time.
Dibuat menggunakan HTML, CSS, Vanilla JavaScript, dan Supabase (sebagai database dan sistem autentikasi).

## Fitur Utama

1. Autentikasi Multi-User: Login, daftar akun, dan reset password via email.
2. Manajemen Produk & Kategori: Mengatur master barang, harga modal, dan batas minimum stok.
3. Peringatan Stok Menipis: Banner otomatis muncul di dashboard jika ada produk yang jumlahnya menyentuh batas minimum.
4. Pencatatan Transaksi: Mencatat barang masuk, barang keluar, dan penyesuaian (stok opname).
5. Kartu Stok: Riwayat perubahan stok berurutan (kronologis) lengkap dengan saldo akhir, user penginput, dan keterangan alasan.
6. Impor & Ekspor CSV: Memasukkan data produk secara massal dari file Excel/CSV (dilengkapi validasi dan preview) dan mengekspor riwayat transaksi.
7. Laporan Periode: Filter laporan berdasarkan rentang tanggal dan kategori, lengkap dengan kalkulasi total nilai uang berdasarkan harga modal.
8. Desain Modern: Antarmuka responsif bergaya SaaS Dashboard (dominan hitam, putih, dan abu-abu).

## Struktur Direktori

rekap-stok/
├── index.html
├── database.sql      (Skrip untuk Supabase)
├── README.md
├── css/
│   └── style.css
└── js/
    └── app.js        (Semua logika aplikasi & koneksi Supabase)

## Cara Setup (Development)

### 1. Buat Proyek Supabase
1. Daftar di supabase.com dan buat proyek baru (pilih region Singapore agar cepat).
2. Buka menu SQL Editor di dashboard Supabase.
3. Buka file database.sql di folder ini, copy seluruh isinya, lalu paste dan Run di SQL Editor. Ini akan membuat tabel profiles, categories, products, dan transactions.

### 2. Konfigurasi Autentikasi
1. Di Supabase, buka menu Authentication -> Providers -> Email.
2. Pastikan Enable Email Provider menyala. (Jika ingin melewati verifikasi email, matikan opsi Confirm email).
3. Buka menu URL Configuration, atur Site URL ke http://localhost:3000 (atau port Live Server kamu), dan tambahkan URL tersebut ke Redirect URLs (contoh: http://localhost:3000/**).

### 3. Hubungkan Aplikasi ke Database
1. Di Supabase, buka Project Settings -> API.
2. Copy Project URL dan Publishable/Anon Key.
3. Buka file js/app.js, cari baris paling atas, dan ganti nilainya:
   const SUPABASE_URL = 'URL_SUPABASE_KAMU';
   const SUPABASE_ANON_KEY = 'ANON_KEY_SUPABASE_KAMU';

### 4. Jalankan Aplikasi
Karena aplikasi menggunakan JavaScript Modules, kamu tidak bisa hanya men-double-click index.html.
- VS Code: Install ekstensi Live Server, lalu klik kanan index.html -> Open with Live Server.
- CLI: Jalankan python -m http.server 3000 di terminal, lalu buka http://localhost:3000.

## Cara Deploy (Gratis)

1. Upload folder proyek ini ke repository GitHub.
2. Buka Vercel atau Netlify, login dengan GitHub, lalu import repository tersebut.
3. Klik Deploy. Kamu akan mendapatkan URL website (contoh: https://rekap-stok.vercel.app).
4. Jangan lupa, kembali ke Supabase -> Authentication -> URL Configuration, lalu ubah Site URL dan tambahkan Redirect URLs dengan URL Vercel yang baru kamu dapatkan.

## Format Impor CSV
Jika ingin menggunakan fitur Impor, pastikan file .csv (bisa dibuat dari Excel) memiliki baris pertama (header) dengan format berikut:
Nama Produk,Kategori,Stok Awal,Min Stok,Harga Modal
