import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vggxtpyduiiaazoloylx.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_kQifdwQIic-ycFJBLPa8Og_TvOSw13Z';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let tempStokData = []; 
let masterTipeAktif = '';

/* =========================================
   UI NAVIGATION & UTILS
========================================= */
window.toggleAuth = (type) => {
  document.getElementById('authError').classList.add('hidden');
  if (type === 'login') {
    document.getElementById('loginBox').classList.remove('hidden');
    document.getElementById('registerBox').classList.add('hidden');
  } else {
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('registerBox').classList.remove('hidden');
  }
};

window.showPage = (pageId, el) => {
  document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) {
    target.classList.remove('hidden');
    target.style.animation = 'none';
    target.offsetHeight; /* trigger reflow */
    target.style.animation = 'fadeIn 0.4s ease';
  }
  
  document.querySelectorAll('.menu-item, .submenu a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');

  // Load data sesuai halaman
  if (pageId === 'dashboard') loadDashboard();
  if (pageId.startsWith('master')) loadMasterData(pageId.replace('master', '').toLowerCase());
  if (pageId === 'masterProduk') loadProducts();
  if (pageId === 'stok') loadStokPage();
  if (pageId === 'history') loadHistory();
};

window.toggleSubmenu = (element) => {
  const submenu = element.nextElementSibling;
  const arrow = element.querySelector('.arrow');
  if (submenu) {
    submenu.classList.toggle('open');
    arrow.style.transform = submenu.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
  }
};

window.closeModal = (modalId) => {
  document.getElementById(modalId).classList.add('hidden');
};

/* =========================================
   AUTHENTICATION
========================================= */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPass').value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    const err = document.getElementById('authError');
    err.textContent = error.message; err.classList.remove('hidden');
  } else {
    initApp(data.user);
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nama = document.getElementById('regNama').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPass').value;
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nama } } });
  
  if (error) {
    const err = document.getElementById('authError');
    err.textContent = error.message; err.classList.remove('hidden');
  } else {
    alert('Registrasi berhasil! Silakan login (atau cek email jika verifikasi aktif).');
    toggleAuth('login');
  }
});

window.logout = async () => {
  await supabase.auth.signOut();
  location.reload();
};

function initApp(user) {
  currentUser = user;
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  document.getElementById('userNameDisplay').textContent = user.email.split('@')[0];
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('id-ID', options);
  
  // Buka submenu pertama secara default
  const firstGroup = document.querySelector('.menu-group');
  if(firstGroup) toggleSubmenu(firstGroup.querySelector('.menu-item'));
  
  loadDashboard();
}

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) initApp(session.user);
});

/* =========================================
   DASHBOARD
========================================= */
async function loadDashboard() {
  const { data: products } = await supabase.from('products').select('*');
  const { data: pos } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }).limit(5);
  
  if (products) {
    document.getElementById('statTotalProduk').textContent = products.length;
    document.getElementById('statLowStok').textContent = products.filter(p => p.stok < 10).length;
  }

  if (pos && pos.length > 0) {
    document.getElementById('dashPOTable').innerHTML = pos.map(po => `
      <tr><td>${new Date(po.tanggal).toLocaleDateString('id-ID')}</td><td>${po.no_po}</td><td>${po.total_item} Item</td></tr>
    `).join('');
  }

  if (products && products.length > 0) {
    document.getElementById('dashStokTable').innerHTML = products.slice(0,5).map(p => `
      <tr><td>${p.sku}</td><td>${p.nama}</td><td>${p.stok}</td></tr>
    `).join('');
  }
}

/* =========================================
   INPUT STOK (Dengan Database Fetch)
========================================= */
window.tambahKeTabelSementara = async () => {
  const sku = document.getElementById('inputSkuCepat').value;
  const jml = parseInt(document.getElementById('inputJmlCepat').value);
  const harga = parseFloat(document.getElementById('inputHargaCepat').value);

  if (!sku || !jml || !harga) return alert('Isi SKU, Jumlah, dan Harga dengan benar.');

  const { data: prod, error } = await supabase.from('products').select('*').eq('sku', sku).single();

  if (error || !prod) return alert('SKU tidak ditemukan di database Master Produk!');

  tempStokData.push({ ...prod, jumlahBeli: jml, hargaBeli: harga });
  renderTempStok();

  document.getElementById('inputSkuCepat').value = '';
  document.getElementById('inputJmlCepat').value = '';
  document.getElementById('inputHargaCepat').value = '';
};

function renderTempStok() {
  const tbody = document.getElementById('tempStokTable');
  if (tempStokData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">Belum ada barang di daftar.</td></tr>';
    return;
  }
  tbody.innerHTML = tempStokData.map((item, index) => `
    <tr>
      <td><a href="#" style="color: #2563eb; text-decoration: underline;" onclick="bukaDetailProduk('${item.sku}'); return false;">${item.sku}</a></td>
      <td>${item.nama}</td><td>${item.merk || '-'}</td><td>${item.ukuran || '-'}</td><td>${item.jenis || '-'}</td>
      <td>${item.jumlahBeli}</td>
      <td>Rp ${item.hargaBeli.toLocaleString('id-ID')}</td>
      <td><button class="btn-sm red" onclick="hapusTempStok(${index})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');
}

window.hapusTempStok = (index) => { tempStokData.splice(index, 1); renderTempStok(); };

window.simpanStokMassal = async () => {
  if (tempStokData.length === 0) return alert('Belum ada data.');
  
  const noPo = 'PO-' + Date.now().toString().slice(-6);
  const today = new Date().toISOString().split('T')[0];

  const { data: po, error: poErr } = await supabase.from('purchase_orders').insert({
    no_po: noPo, tanggal: today, total_item: tempStokData.length
  }).select().single();

  if (poErr) return alert('Gagal membuat PO: ' + poErr.message);

  for (let item of tempStokData) {
    await supabase.from('po_items').insert({ po_id: po.id, product_id: item.id, jumlah: item.jumlahBeli, harga: item.hargaBeli });
    // Update stok produk
    const newStok = item.stok + item.jumlahBeli;
    await supabase.from('products').update({ stok: newStok }).eq('id', item.id);
  }

  alert('Stok berhasil disimpan!');
  tempStokData = [];
  renderTempStok();
  loadDashboard();
};

/* =========================================
   MASTER DATA (Merk, Jenis, Ukuran)
========================================= */
window.openModalMaster = (tipe) => {
  masterTipeAktif = tipe;
  document.getElementById('modalMasterTitle').textContent = 'Tambah ' + tipe.charAt(0).toUpperCase() + tipe.slice(1);
  document.getElementById('masterNama').value = '';
  document.getElementById('modalMaster').classList.remove('hidden');
};

window.simpanMaster = async () => {
  const nama = document.getElementById('masterNama').value;
  if (!nama) return alert('Nama tidak boleh kosong');
  
  const { error } = await supabase.from('master_data').insert({ tipe: masterTipeAktif, nama });
  if (error) return alert(error.message);
  
  closeModal('modalMaster');
  loadMasterData(masterTipeAktif);
};

async function loadMasterData(tipe) {
  const tableId = 'tableMaster' + tipe.charAt(0).toUpperCase() + tipe.slice(1);
  const tbody = document.getElementById(tableId);
  if (!tbody) return;

  const { data } = await supabase.from('master_data').select('*').eq('tipe', tipe).order('nama');
  
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Belum ada data ${tipe}.</td></tr>`; return;
  }
  tbody.innerHTML = data.map((d, i) => `
    <tr><td>${i+1}.</td><td>${d.nama}</td>
    <td><button class="btn-sm red" onclick="hapusMaster(${d.id}, '${tipe}')">Hapus</button></td></tr>
  `).join('');
}

window.hapusMaster = async (id, tipe) => {
  if (!confirm('Hapus data ini?')) return;
  await supabase.from('master_data').delete().eq('id', id);
  loadMasterData(tipe);
};

/* =========================================
   PRODUK
========================================= */
window.bukaDetailProduk = (sku = '') => {
  document.getElementById('formProduk').reset();
  if (sku) {
    // Ambil data jika edit, atau hanya view (opsional, dibuat simple dulu)
    document.getElementById('prodSku').value = sku;
  }
  document.getElementById('modalProduk').classList.remove('hidden');
};

document.getElementById('formProduk').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    sku: document.getElementById('prodSku').value,
    nama: document.getElementById('prodNama').value,
    merk: document.getElementById('prodMerk').value,
    ukuran: document.getElementById('prodUkuran').value,
    jenis: document.getElementById('prodJenis').value,
    stok: parseInt(document.getElementById('prodJumlah').value),
    harga_jual: parseFloat(document.getElementById('prodHarga').value),
    user_id: currentUser.id
  };

  const { error } = await supabase.from('products').insert(payload);
  if (error) return alert('Gagal simpan produk: ' + error.message);

  closeModal('modalProduk');
  loadProducts();
});

async function loadProducts() {
  const tbody = document.getElementById('tableMasterProduk');
  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Belum ada produk.</td></tr>'; return;
  }
  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.sku}</td><td>${p.nama}</td><td>${p.merk || '-'}</td><td>${p.ukuran || '-'}</td>
      <td>${p.jenis || '-'}</td><td>${p.stok}</td><td>Rp ${p.harga_jual.toLocaleString('id-ID')}</td>
      <td><button class="btn-sm outline" onclick="hapusProduk(${p.id})">Hapus</button></td>
    </tr>
  `).join('');
}

window.hapusProduk = async (id) => {
  if (!confirm('Hapus produk ini?')) return;
  await supabase.from('products').delete().eq('id', id);
  loadProducts();
};

/* =========================================
   STOK & HISTORY PAGE
========================================= */
async function loadStokPage() {
  const tbody = document.getElementById('tableStok');
  const { data } = await supabase.from('products').select('sku, nama, stok').order('stok', { ascending: true });
  
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada stok.</td></tr>'; return;
  }
  tbody.innerHTML = data.map(p => `<tr><td>${p.sku}</td><td>${p.nama}</td><td><b>${p.stok}</b></td></tr>`).join('');
}

async function loadHistory() {
  const tbody = document.getElementById('tableHistory');
  const { data } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
  
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada history.</td></tr>'; return;
  }
  tbody.innerHTML = data.map(po => `
    <tr><td>${new Date(po.tanggal).toLocaleDateString('id-ID')}</td><td>${po.no_po}</td><td>${po.total_item}</td></tr>
  `).join('');
}
