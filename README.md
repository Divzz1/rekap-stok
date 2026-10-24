# Inventory Management System (Enterprise Edition)

Aplikasi web *Inventory Management System* (Sistem Manajemen Persediaan) yang dirancang untuk skala Enterprise. Aplikasi ini mengelola data produk, melacak pergerakan stok masuk (PO) dan stok keluar, menghitung estimasi nilai aset, serta dilengkapi dengan keamanan data antar-pengguna (Multi-User Isolation).

Dibangun menggunakan **HTML, CSS, Vanilla JavaScript (ES Modules)**, dan **Supabase** (sebagai Database Cloud dan sistem Autentikasi).

## 🚀 Fitur Utama

1. **Keamanan Multi-User (Row Level Security)**
   - Sistem login, registrasi, dan reset password.
   - Data antar pengguna **100% terisolasi**. Pengguna A tidak dapat melihat produk, transaksi, atau pengaturan milik Pengguna B.
2. **Dashboard Interaktif**
   - Menampilkan Total SKU, Nilai Aset (Estimasi), dan peringatan Stok Menipis.
   - Grafik (Chart.js) Top 5 Stok Terbanyak.
   - Tabel riwayat aktivitas transaksi terbaru.
3. **Manajemen Inventory**
   - **Barang Masuk (PO)**: Mendukung input multi-item sekaligus (Keranjang) sebelum disimpan ke database, otomatis men-generate Nomor PO.
   - **Barang Keluar**: Pencatatan barang keluar dengan validasi ketat (tidak bisa melebihi sisa stok).
   - **Data Stok**: Melihat sisa stok secara *real-time*.
4. **Master Data**
   - **Produk**: Informasi lengkap (SKU, Nama, Merk, Lokasi, Jenis, Ukuran, Status, Harga Jual).
   - **Referensi**: Pengaturan data master untuk Merk, Jenis, Ukuran, dan Lokasi Gudang.
5. **History (Audit Trail)**
   - Melacak seluruh pergerakan barang (Masuk & Keluar) secara kronologis beserta keterangannya.
6. **Pengaturan (Settings)**
   - Mengubah Nama Perusahaan (tampil di sidebar) dan Username sesuai kebutuhan pengguna.
7. **Desain Responsif & Modern**
   - Layout menyesuaikan Desktop, Tablet, dan Mobile.
   - Sidebar dapat disembunyikan (Collapsible) dengan tombol Hamburger.
   - Animasi UI/UX yang halus (Hover, Modal transitions).

## 📁 Struktur Direktori

rekap-stok/
├── index.html        # Struktur utama aplikasi (UI)
├── database.sql      # Skrip instalasi database Supabase
├── README.md         # Dokumentasi (File ini)
├── css/
│   └── style.css     # Styling & Layout Responsif
└── js/
    └── app.js        # Logika aplikasi & koneksi Supabase
    
## 🗄️ Skema Database (Tabel Utama)
Sistem ini menggunakan 6 tabel utama di Supabase:
1. profiles: Menyimpan data nama user dan nama perusahaan.
2. master_data: Menyimpan referensi (Merk, Jenis, Ukuran, Lokasi).
3. products: Master produk beserta sisa stok saat ini.
4. purchase_orders: Header transaksi barang masuk.
5. po_items: Detail barang apa saja yang masuk pada suatu PO.
6. stock_out: Riwayat transaksi barang keluar.

## 🛠️ Cara Setup (Development)
1. **Setup Database Supabase**
Buat proyek baru di supabase.com.
Buka menu SQL Editor di dashboard Supabase.
Buka file database.sql di folder ini. Copy seluruh isinya, paste ke SQL Editor, lalu klik Run.
(Skrip ini akan membuat semua tabel, relasi, kebijakan keamanan RLS, dan trigger otomatis).
2. **Konfigurasi Autentikasi**
Buka menu Authentication -> Providers -> Email. Pastikan Enable Email Provider menyala.
Buka menu URL Configuration:
Atur Site URL ke http://localhost:3000 (atau port Live Server kamu).
Tambahkan URL tersebut ke Redirect URLs (contoh: http://localhost:3000/**).
3. **Hubungkan Aplikasi ke Database**
Buka Project Settings -> API di Supabase.
Copy Project URL dan Publishable/Anon Key.
Buka file js/app.js, cari baris paling atas, dan sesuaikan nilainya:
const SUPABASE_URL = 'URL_SUPABASE_KAMU';
const SUPABASE_ANON_KEY = 'ANON_KEY_SUPABASE_KAMU';

4. **Jalankan Aplikasi**
Karena aplikasi menggunakan JavaScript Modules, kamu tidak bisa hanya men-double-click index.html. Kamu harus menjalankannya lewat server lokal:
- VS Code: Install ekstensi Live Server, lalu klik kanan index.html -> Open with Live Server.
- CLI: Jalankan python -m http.server 3000 di terminal, lalu buka http://localhost:3000 di browser.

## ☁️ Cara Deploy (Gratis)
1. Upload folder proyek ini ke repository GitHub.
2. Buka Vercel atau Netlify, login dengan GitHub, lalu import repository tersebut.
3. Klik Deploy. Kamu akan mendapatkan URL website (contoh: https://rekap-stok.vercel.app).
4. Penting: Kembali ke Supabase -> Authentication -> URL Configuration, lalu ubah Site URL dan tambahkan Redirect URLs dengan URL Vercel yang baru kamu dapatkan.

## 📝 Catatan
1. Disarankan menggunakan email asli saat mendaftar untuk mempermudah proses reset password.
2. Data yang dihapus (Produk) akan otomatis menghapus riwayat PO dan Barang Keluar terkait (Cascade Delete) untuk menjaga integritas data.
