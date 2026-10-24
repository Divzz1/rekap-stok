import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vggxtpyduiiaazoloylx.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_kQifdwQIic-ycFJBLPa8Og_TvOSw13Z';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let tempStokData = []; // Untuk menyimpan data input stok sementara di tabel

/* =========================================
   UI NAVIGASI
========================================= */
window.showPage = (pageId) => {
  document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.remove('hidden');
  
  // Update active state di sidebar (khusus submenu)
  document.querySelectorAll('.submenu a').forEach(el => el.classList.remove('active'));
  if(event && event.target && event.target.tagName === 'A') {
    event.target.classList.add('active');
  }
};

window.toggleSubmenu = (element) => {
  const submenu = element.nextElementSibling;
  const arrow = element.querySelector('.arrow');
  submenu.classList.toggle('open');
  if (submenu.classList.contains('open')) {
    arrow.style.transform = 'rotate(180deg)';
  } else {
    arrow.style.transform = 'rotate(0deg)';
  }
};

window.closeModal = (modalId) => {
  document.getElementById(modalId).classList.add('hidden');
};

window.openModalMaster = () => {
  document.getElementById('modalMaster').classList.remove('hidden');
};

/* =========================================
   LOGIKA INPUT STOK (TABEL SEMENTARA)
========================================= */
window.tambahKeTabelSementara = () => {
  const sku = document.getElementById('inputSkuCepat').value;
  const jml = parseInt(document.getElementById('inputJmlCepat').value);
  const harga = parseFloat(document.getElementById('inputHargaCepat').value);

  if (!sku || !jml || !harga) return alert('Isi SKU, Jumlah, dan Harga dengan benar.');

  // Simulasi data produk yang diambil (Di aplikasi nyata, ini query ke DB berdasarkan SKU)
  const dummyProduct = {
    sku: sku,
    nama: 'Produk ' + sku,
    merk: 'Part PLFC',
    ukuran: 'PLFC 1000',
    jenis: 'Circle Plate',
    rincian: 'Circle Plate CR',
    jumlah: jml,
    hargaJual: harga
  };

  tempStokData.push(dummyProduct);
  renderTempStok();

  // Reset input
  document.getElementById('inputSkuCepat').value = '';
  document.getElementById('inputJmlCepat').value = '';
  document.getElementById('inputHargaCepat').value = '';
};

function renderTempStok() {
  const tbody = document.getElementById('tempStokTable');
  tbody.innerHTML = '';
  
  tempStokData.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td><a href="#" style="color: #2563eb; text-decoration: underline;" onclick="bukaDetailProduk('${item.sku}'); return false;">${item.sku}</a></td>
        <td>${item.nama}</td>
        <td>${item.merk}</td>
        <td>${item.ukuran}</td>
        <td>${item.jenis}</td>
        <td>${item.rincian}</td>
        <td>${item.jumlah}</td>
        <td>Rp ${item.hargaJual.toLocaleString('id-ID')}</td>
        <td><button class="btn-sm blue" style="background:#dc2626;" onclick="hapusTempStok(${index})"><i class="fa-solid fa-trash"></i></button></td>
      </tr>
    `;
  });
}

window.hapusTempStok = (index) => {
  tempStokData.splice(index, 1);
  renderTempStok();
};

window.simpanStokMassal = async () => {
  if (tempStokData.length === 0) return alert('Belum ada data untuk disimpan.');
  alert('Data berhasil disimpan! (Logika database sedang dalam pengembangan)');
  tempStokData = [];
  renderTempStok();
};

window.bukaDetailProduk = (sku) => {
  // Isi form modal dengan data dummy (bisa disambungkan ke DB nanti)
  document.getElementById('prodSku').value = sku;
  document.getElementById('prodNama').value = 'Jaw Crusher';
  document.getElementById('prodMerk').value = '-';
  document.getElementById('prodUkuran').value = '250x400';
  document.getElementById('prodJenis').value = 'Jaw Plate MN 18 STD';
  document.getElementById('prodDetail').value = '1 Fixed Jawplate MN 18 STD';
  document.getElementById('prodJumlah').value = '1';
  document.getElementById('prodHarga').value = '1000000';
  
  document.getElementById('modalProduk').classList.remove('hidden');
};

/* =========================================
   AUTHENTICATION
========================================= */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  
  err.classList.add('hidden');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    err.textContent = error.message;
    err.classList.remove('hidden');
  } else {
    currentUser = data.user;
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    
    // Buka submenu Inventory secara default
    setTimeout(() => {
        const invMenu = document.querySelectorAll('.menu-group')[0];
        if(invMenu) invMenu.querySelector('.menu-item').click();
    }, 100);
  }
});

window.logout = async () => {
  await supabase.auth.signOut();
  location.reload();
};

// Cek sesi saat load
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user;
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
  }
});
