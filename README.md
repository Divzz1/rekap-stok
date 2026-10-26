# Enterprise Inventory System 

Aplikasi web **Inventory Management System** modern yang dirancang untuk mengelola persediaan barang, melacak transaksi, dan menghitung laporan keuangan secara *real-time*. Aplikasi ini memiliki antarmuka bergaya *SaaS (Software as a Service)* yang bersih, responsif, dan dilengkapi dengan fitur keamanan multi-pengguna.

## Fitur Utama
1. **Dashboard Interaktif (Bento Grid)**
   - Ringkasan visual Total SKU, Stok Menipis, dan **Estimasi Laba Bersih** (Pendapatan kotor dikurangi modal).
   - Grafik batang interaktif (Chart.js) untuk 5 produk dengan stok terbanyak.
   - Tabel aktivitas transaksi terakhir.
   - *Card* dapat diklik untuk langsung menuju halaman detail terkait.
2. **Laporan Aset & Keuangan**
   - Halaman khusus untuk melihat rincian finansial dari stok yang ada.
   - Menampilkan Total Modal Tertahan, Total Potensi Penjualan, dan Total Laba Bersih.
   - Tabel rincian per produk (Harga Beli/Modal, Harga Jual, Laba Kotor).
3. **Manajemen Inventory**
   - **Barang Masuk (PO)**: Input massal (keranjang) dengan fitur *dropdown* produk. Otomatis mengisi harga beli terakhir dan memperbarui harga modal di Master Produk.
   - **Barang Keluar**: Pencatatan barang keluar dengan validasi ketat (tidak bisa melebihi sisa stok).
   - **Data Stok**: Menampilkan stok *real-time* dengan indikator warna (Merah jika stok < 10, Hijau jika aman).
4. **Manajemen Master Data**
   - **Produk**: Informasi lengkap meliputi SKU, Nama, Merk, Lokasi, Harga Beli (Modal), dan Harga Jual.
   - **Referensi**: Pengaturan data master untuk Merk, Jenis, Ukuran, dan Lokasi Gudang.
5. **History & Export Excel**
   - Melacak seluruh riwayat transaksi masuk dan keluar secara kronologis.
   - **Export ke Excel**: Mengunduh laporan transaksi langsung ke format `.xlsx` dengan desain tabel yang sudah di-*styling* (warna header, zebra stripes, dan warna khusus untuk tipe masuk/keluar).
6. **UI/UX & Animasi Modern**
   - **Dark Mode / Light Mode**: Beralih tema sesuai kenyamanan mata.
   - **Animasi Premium**: Splash screen, animasi *loading*, efek *hover* pada tombol/kartu, dan transisi halaman yang halus.
   - **Responsif**: Tampilan menyesuaikan layar Desktop, Tablet, dan Mobile (Sidebar *Off-canvas* dengan tombol Hamburger).
   - **Pengaturan Akun**: Ganti Nama Perusahaan, Username, Logo, dan Foto Profil.

## Teknologi yang Digunakan
- **Frontend**: HTML5, CSS3 (Custom Properties/Variables), Vanilla JavaScript (ES6 Modules).
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage).
- **Library**: Chart.js (Grafik), ExcelJS (Export Excel), FontAwesome (Ikon), Google Fonts (Inter).

## Struktur Direktori
rekap-stok/
├── index.html            # Halaman utama aplikasi
├── privacy-policy.html   # Halaman kebijakan privasi
├── terms-conditions.html # Halaman syarat & ketentuan
├── database.sql          # Skrip SQL untuk setup tabel Supabase
├── README.md             # Dokumentasi (File ini)
├── css/
│   └── style.css         # Styling utama & Dark Mode
└── js/
    └── app.js            # Logika aplikasi & koneksi Supabase
    
## Skema Database Utama
Aplikasi ini menggunakan 6 tabel utama di Supabase:
profiles: Menyimpan nama user, nama perusahaan, URL logo, dan avatar.
master_data: Menyimpan referensi kategori (Merk, Jenis, Ukuran, Lokasi).
products: Master produk beserta kolom harga_beli (modal) dan harga_jual.
purchase_orders: Header transaksi barang masuk (PO).
po_items: Detail barang yang masuk pada suatu PO.
stock_out: Riwayat transaksi barang keluar.

## Cara Instalasi & Setup
1. **Setup Database & Storage Supabase**
Buat proyek baru di supabase.com.
Buka menu SQL Editor, copy seluruh isi file database.sql dari repositori ini, lalu klik RUN.
Buka menu Storage, buat Bucket baru dengan nama inventory-images (centang opsi Public bucket). Ini digunakan untuk menyimpan foto profil dan logo perusahaan.
2. **Konfigurasi Autentikasi**
Buka menu Authentication -> Providers -> Email, pastikan fitur ini aktif.
Buka menu URL Configuration, atur Site URL ke http://localhost:3000 (atau port Live Server kamu).
Tambahkan URL tersebut ke Redirect URLs (contoh: http://localhost:3000/**).
3. **Hubungkan Aplikasi ke Supabase**
Buka Project Settings -> API di dashboard Supabase.
Salin Project URL dan Anon/Public Key.
Buka file js/app.js, cari baris paling atas, dan sesuaikan nilainya:
const SUPABASE_URL = 'URL_SUPABASE_KAMU';
const SUPABASE_ANON_KEY = 'ANON_KEY_SUPABASE_KAMU';
4. **Jalankan Aplikasi secara Lokal**
Karena aplikasi ini menggunakan JavaScript Modules, kamu harus menjalankannya lewat server lokal:
VS Code: Install ekstensi Live Server, klik kanan index.html -> Open with Live Server.
CLI: Jalankan python -m http.server 3000 di terminal, lalu buka http://localhost:3000.

## Cara Deploy (Gratis)
1. Upload folder proyek ini ke repositori GitHub.
2. Buka Vercel atau Netlify, login menggunakan akun GitHub, dan import repositori tersebut.
3. Klik Deploy. Kamu akan mendapatkan URL website (contoh: https://rekap-stok-kamu.vercel.app).
4. Penting: Kembali ke Supabase -> Authentication -> URL Configuration, lalu ubah Site URL dan tambahkan Redirect URLs dengan URL Vercel yang baru kamu dapatkan.

## **Catatan Penting
Pastikan browser tidak menyimpan Cache versi lama dengan melakukan Hard Refresh (Ctrl + F5) setelah melakukan deploy ulang pembaruan kode.
Fitur impor/ekspor Excel bekerja paling optimal pada browser modern (Chrome, Edge, Safari).

