# Rekap Stok Barang Tim

Aplikasi rekap stok barang dengan multi-user, kategori, dan grafik.
Stack: HTML + CSS + JavaScript (frontend) + Supabase (database & auth).

## Struktur

- `index.html` — halaman utama
- `css/style.css` — styling
- `js/config.js` — kredensial Supabase (EDIT DI SINI)
- `js/state.js` — state global & event bus
- `js/utils.js` — helper
- `js/auth.js` — login/signup/forgot/reset
- `js/category.js` — CRUD kategori
- `js/stock.js` — CRUD stok
- `js/chart.js` — grafik
- `js/app.js` — orkestrator

## Setup

1. Buka [supabase.com](https://supabase.com) → New Project (pilih region Singapore).
2. Settings → API → copy **Project URL** dan **anon public key**.
3. Edit `js/config.js`, ganti `SUPABASE_URL` dan `SUPABASE_ANON_KEY`.
4. Buka SQL Editor di Supabase, jalankan skrip SQL di bawah.
5. Authentication → Providers → Email:
   - Enable Email provider ✅
   - **Confirm email: OFF** (agar bisa langsung login)
6. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (atau domain produksi)
   - Redirect URLs: tambahkan `http://localhost:3000/*` dan domain produksi

## Skrip SQL (jalankan di Supabase SQL Editor)

Lihat file `supabase.sql` di bawah — copy-paste seluruh isinya lalu Run.

## Jalankan Lokal

ES modules butuh HTTP server (tidak bisa buka file:// langsung).

- VS Code: pakai ekstensi **Live Server** → klik kanan `index.html` → Open with Live Server.
- Atau: `python -m http.server 3000` di folder proyek, buka `http://localhost:3000`.

## Deploy (gratis)

- **Vercel**: upload ke GitHub → import di vercel.com → Deploy.
- **Netlify**: drag folder ke [netlify.com/drop](https://app.netlify.com/drop).
- Setelah deploy, tambahkan URL-nya ke Supabase → Authentication → URL Configuration.

## Catatan

- Supabase free tier pause setelah 7 hari idle. Buka dashboard 1x untuk bangunkan.
- Email reset password gratis dibatasi 4/jam.
- Data dibagi bersama (semua user login bisa lihat semua data — cocok untuk tim internal).
