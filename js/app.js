import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vggxtpyduiiaazoloylx.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_kQifdwQIic-ycFJBLPa8Og_TvOSw13Z';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let tempStokData = []; 
let masterTipeAktif = '';
let isEditingProduk = false;
let chartInstance = null;

/* =========================================
   UI & NAVIGATION 
========================================= */
window.toggleSidebar = () => {
  if (window.innerWidth > 1024) {
    document.querySelector('.app-layout').classList.toggle('sidebar-closed');
  } else {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
  }
};

window.toggleProfileMenu = (event) => {
  event.stopPropagation();
  document.getElementById('profileDropdown').classList.toggle('hidden');
};

document.addEventListener('click', (event) => {
  const dropdown = document.getElementById('profileDropdown');
  const container = document.querySelector('.profile-dropdown-container');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (!container.contains(event.target)) {
      dropdown.classList.add('hidden');
    }
  }
});

window.toggleAuth = (type) => {
  document.getElementById('authError').classList.add('hidden');
  document.getElementById('loginBox').classList.toggle('hidden', type === 'register');
  document.getElementById('registerBox').classList.toggle('hidden', type === 'login');
};

window.showPage = (pageId, el) => {
  if (window.innerWidth <= 1024) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  }

  document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) {
    target.classList.remove('hidden');
    target.style.animation = 'none';
    target.offsetHeight; 
    target.style.animation = 'fadeIn 0.4s ease';
  }
  
  document.querySelectorAll('.menu-item, .submenu a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');

  document.getElementById('globalSearch').value = '';

  if (pageId === 'dashboard') loadDashboard();
  if (pageId.startsWith('master') && pageId !== 'masterProduk') loadMasterData(pageId.replace('master', '').toLowerCase());
  if (pageId === 'masterProduk') loadProducts();
  if (pageId === 'stok') loadStokPage();
  if (pageId === 'history') loadHistory();
  if (pageId === 'settings') loadSettingsData();
  if (pageId === 'inputKeluar') {
    loadDropdownProduk();
    document.getElementById('outTanggal').value = new Date().toISOString().split('T')[0];
  }
};

window.toggleSubmenu = (element) => {
  const submenu = element.nextElementSibling;
  const arrow = element.querySelector('.arrow');
  if (submenu) {
    submenu.classList.toggle('open');
    arrow.style.transform = submenu.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
  }
};

window.closeModal = (modalId) => document.getElementById(modalId).classList.add('hidden');
window.closeModalOutside = (event, modalId) => { if (event.target.id === modalId) closeModal(modalId); };

window.filterTable = () => {
  const input = document.getElementById('globalSearch').value.toLowerCase();
  const activePage = document.querySelector('.page-view:not(.hidden)');
  if (!activePage) return;
  const rows = activePage.querySelectorAll('table tbody tr');
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(input) ? '' : 'none';
  });
};

/* =========================================
   AUTHENTICATION
========================================= */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email: document.getElementById('loginEmail').value, 
    password: document.getElementById('loginPass').value 
  });
  if (error) { 
    document.getElementById('authError').textContent = error.message; 
    document.getElementById('authError').classList.remove('hidden'); 
  } else { initApp(data.user); }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.auth.signUp({ 
    email: document.getElementById('regEmail').value, 
    password: document.getElementById('regPass').value,
    options: { data: { nama: document.getElementById('regNama').value } }
  });
  if (error) { 
    document.getElementById('authError').textContent = error.message; 
    document.getElementById('authError').classList.remove('hidden'); 
  } else { 
    alert('Registrasi berhasil! Silakan login.'); 
    toggleAuth('login'); 
  }
});

window.logout = async () => { await supabase.auth.signOut(); location.reload(); };

async function initApp(user) {
  currentUser = user;
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  
  // Load profil dari database
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (data) {
    document.getElementById('userNameDisplay').textContent = data.nama || user.email.split('@')[0];
    if (data.nama_perusahaan) {
      document.getElementById('sidebarBrandName').textContent = data.nama_perusahaan;
    }
  } else {
    document.getElementById('userNameDisplay').textContent = user.email.split('@')[0];
  }
  
  const firstGroup = document.querySelector('.menu-group');
  if(firstGroup) toggleSubmenu(firstGroup.querySelector('.menu-item'));
  
  showPage('dashboard', document.querySelector('.menu-item'));
}

supabase.auth.getSession().then(({ data: { session } }) => { if (session) initApp(session.user); });

/* =========================================
   SETTINGS (BARU)
========================================= */
async function loadSettingsData() {
  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
  if (data) {
    document.getElementById('settingCompanyName').value = data.nama_perusahaan || 'Inventory';
    document.getElementById('settingUsername').value = data.nama || currentUser.email.split('@')[0];
  }
}

document.getElementById('formSettings').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newCompany = document.getElementById('settingCompanyName').value;
  const newUsername = document.getElementById('settingUsername').value;

  const { error } = await supabase.from('profiles').update({
    nama: newUsername,
    nama_perusahaan: newCompany
  }).eq('id', currentUser.id);

  if (error) return alert('Gagal menyimpan: ' + error.message);

  alert('Pengaturan berhasil disimpan!');
  
  // Update UI secara langsung tanpa refresh
  document.getElementById('sidebarBrandName').textContent = newCompany;
  document.getElementById('userNameDisplay').textContent = newUsername;
});

/* =========================================
   LOGIKA DATA (DASHBOARD & CRUD)
========================================= */
async function loadDashboard() {
  const { data: products } = await supabase.from('products').select('*').order('nama').limit(5);
  const { data: allProducts } = await supabase.from('products').select('stok, harga_jual');
  
  if (allProducts) {
    document.getElementById('statTotalProduk').textContent = allProducts.length;
    document.getElementById('statLowStok').textContent = allProducts.filter(p => p.stok < 10).length;
    let nilaiAset = 0;
    allProducts.forEach(p => { nilaiAset += (p.stok * p.harga_jual); });
    document.getElementById('statNilaiAset').textContent = 'Rp ' + nilaiAset.toLocaleString('id-ID');
  }

  if (products) {
    const labels = products.map(p => p.nama);
    const dataStok = products.map(p => p.stok);
    
    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('dashboardChart').getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: 'Sisa Stok', data: dataStok, backgroundColor: '#3b82f6', borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  const { data: ins } = await supabase.from('purchase_orders').select('tanggal, po_items(jumlah, products(nama))').order('created_at', { ascending: false }).limit(3);
  const { data: outs } = await supabase.from('stock_out').select('tanggal, jumlah, products(nama)').order('created_at', { ascending: false }).limit(3);
  
  let history = [];
  if (ins) ins.forEach(po => po.po_items.forEach(item => history.push({ tgl: po.tanggal, tipe: 'Masuk', nama: item.products?.nama, qty: item.jumlah })));
  if (outs) outs.forEach(o => history.push({ tgl: o.tanggal, tipe: 'Keluar', nama: o.products?.nama, qty: o.jumlah }));
  
  history.sort((a,b) => new Date(b.tgl) - new Date(a.tgl));
  document.getElementById('dashHistoryTable').innerHTML = history.slice(0,5).map(h => `
    <tr><td>${new Date(h.tgl).toLocaleDateString('id-ID')}</td>
        <td><span class="badge ${h.tipe === 'Masuk' ? 'success' : 'warning'}">${h.tipe}</span></td>
        <td>${h.nama || '-'}</td><td>${h.qty}</td></tr>
  `).join('') || '<tr><td colspan="4" align="center">Belum ada aktivitas</td></tr>';
}

window.tambahKeTabelSementara = async () => {
  const sku = document.getElementById('inputSkuCepat').value;
  const jml = parseInt(document.getElementById('inputJmlCepat').value);
  const harga = parseFloat(document.getElementById('inputHargaCepat').value);

  if (!sku || !jml || !harga) return alert('Isi SKU, Jumlah, dan Harga dengan benar.');

  const { data: prod, error } = await supabase.from('products').select('*').eq('sku', sku).single();
  if (error || !prod) return alert('SKU tidak ditemukan di Master Produk!');

  tempStokData.push({ ...prod, jumlahBeli: jml, hargaBeli: harga });
  renderTempStok();

  document.getElementById('inputSkuCepat').value = '';
  document.getElementById('inputJmlCepat').value = '';
  document.getElementById('inputHargaCepat').value = '';
};

function renderTempStok() {
  const tbody = document.getElementById('tempStokTable');
  if (tempStokData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Belum ada barang.</td></tr>'; return;
  }
  tbody.innerHTML = tempStokData.map((item, index) => `
    <tr>
      <td>${item.sku}</td><td>${item.nama}</td><td>${item.lokasi || '-'}</td>
      <td>${item.jumlahBeli}</td><td>Rp ${item.hargaBeli.toLocaleString('id-ID')}</td>
      <td><button class="btn-sm red" onclick="hapusTempStok(${index})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');
}

window.hapusTempStok = (index) => { tempStokData.splice(index, 1); renderTempStok(); };

window.simpanStokMassal = async () => {
  if (tempStokData.length === 0) return alert('Belum ada data untuk disimpan.');
  const noPo = 'PO-' + Date.now().toString().slice(-6);
  const today = new Date().toISOString().split('T')[0];

  const { data: po, error: poErr } = await supabase.from('purchase_orders').insert({ no_po: noPo, tanggal: today, total_item: tempStokData.length }).select().single();
  if (poErr) return alert('Gagal: ' + poErr.message);

  for (let item of tempStokData) {
    await supabase.from('po_items').insert({ po_id: po.id, product_id: item.id, jumlah: item.jumlahBeli, harga: item.hargaBeli });
    await supabase.from('products').update({ stok: item.stok + item.jumlahBeli }).eq('id', item.id);
  }
  alert('Transaksi Masuk Berhasil Disimpan!');
  tempStokData = []; renderTempStok(); loadDashboard();
};

async function loadDropdownProduk() {
  const select = document.getElementById('outProdukId');
  const { data } = await supabase.from('products').select('id, sku, nama, stok').gt('stok', 0).order('nama');
  
  if (!data || data.length === 0) { select.innerHTML = '<option value="">Tidak ada stok tersedia</option>'; return; }
  select.innerHTML = data.map(p => `<option value="${p.id}">${p.sku} - ${p.nama} (Sisa: ${p.stok})</option>`).join('');
}

document.getElementById('formKeluar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const prodId = document.getElementById('outProdukId').value;
  const jml = parseInt(document.getElementById('outJumlah').value);
  
  const { data: prod } = await supabase.from('products').select('stok').eq('id', prodId).single();
  if (prod.stok < jml) return alert(`Gagal: Stok tidak mencukupi! Sisa: ${prod.stok}`);

  const payload = { user_id: currentUser.id, product_id: prodId, jumlah: jml, tanggal: document.getElementById('outTanggal').value, keterangan: document.getElementById('outKet').value };
  const { error } = await supabase.from('stock_out').insert(payload);
  if (error) return alert('Gagal: ' + error.message);

  await supabase.from('products').update({ stok: prod.stok - jml }).eq('id', prodId);
  alert('Barang Keluar Berhasil Dicatat!');
  e.target.reset(); loadDashboard();
});

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
  closeModal('modalMaster'); loadMasterData(masterTipeAktif);
};

async function loadMasterData(tipe) {
  const tableId = 'tableMaster' + tipe.charAt(0).toUpperCase() + tipe.slice(1);
  const tbody = document.getElementById(tableId);
  if (!tbody) return;

  const { data } = await supabase.from('master_data').select('*').eq('tipe', tipe).order('nama');
  if (!data || data.length === 0) { tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Belum ada data.</td></tr>`; return; }
  
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

window.bukaDetailProduk = (id = null) => {
  isEditingProduk = id !== null;
  document.getElementById('formProduk').reset();
  document.getElementById('prodId').value = id || '';
  
  document.getElementById('modalProdukTitle').textContent = isEditingProduk ? 'Edit Produk' : 'Tambah Produk Baru';
  document.getElementById('btnSimpanProduk').textContent = isEditingProduk ? 'Update Produk' : 'Simpan Produk';

  if (isEditingProduk) {
    supabase.from('products').select('*').eq('id', id).single().then(({ data: p }) => {
      document.getElementById('prodSku').value = p.sku;
      document.getElementById('prodNama').value = p.nama;
      document.getElementById('prodMerk').value = p.merk || '';
      document.getElementById('prodLokasi').value = p.lokasi || '';
      document.getElementById('prodJenis').value = p.jenis || '';
      document.getElementById('prodUkuran').value = p.ukuran || '';
      document.getElementById('prodStatus').value = p.status || 'Tersedia';
      document.getElementById('prodHarga').value = p.harga_jual;
    });
  }
  document.getElementById('modalProduk').classList.remove('hidden');
};

document.getElementById('formProduk').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    sku: document.getElementById('prodSku').value,
    nama: document.getElementById('prodNama').value,
    merk: document.getElementById('prodMerk').value,
    lokasi: document.getElementById('prodLokasi').value,
    jenis: document.getElementById('prodJenis').value,
    ukuran: document.getElementById('prodUkuran').value,
    status: document.getElementById('prodStatus').value,
    harga_jual: parseFloat(document.getElementById('prodHarga').value),
    user_id: currentUser.id
  };

  const id = document.getElementById('prodId').value;
  let error;

  if (id) {
    const { error: err } = await supabase.from('products').update(payload).eq('id', id);
    error = err;
  } else {
    payload.stok = 0;
    const { error: err } = await supabase.from('products').insert(payload);
    error = err;
  }

  if (error) return alert('Gagal: ' + error.message);
  closeModal('modalProduk'); loadProducts(); loadDashboard();
});

async function loadProducts() {
  const tbody = document.getElementById('tableMasterProduk');
  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Belum ada produk.</td></tr>'; return; }
  
  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.sku}</td><td>${p.nama}</td><td>${p.lokasi || '-'}</td>
      <td><span class="badge ${p.status === 'Tersedia' ? 'success' : 'danger'}">${p.status}</span></td>
      <td>${p.stok}</td><td>Rp ${p.harga_jual.toLocaleString('id-ID')}</td>
      <td>
        <button class="btn-sm outline" onclick="bukaDetailProduk(${p.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-sm red" onclick="hapusProduk(${p.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

window.hapusProduk = async (id) => {
  if (!confirm('Hapus produk ini? Seluruh riwayat PO/Keluar produk ini akan terhapus.')) return;
  await supabase.from('products').delete().eq('id', id);
  loadProducts(); loadDashboard();
};

async function loadStokPage() {
  const tbody = document.getElementById('tableStok');
  const { data } = await supabase.from('products').select('sku, nama, lokasi, stok').order('stok', { ascending: true });
  if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada stok.</td></tr>'; return; }
  tbody.innerHTML = data.map(p => `<tr><td>${p.sku}</td><td>${p.nama}</td><td>${p.lokasi || '-'}</td><td><b>${p.stok}</b></td></tr>`).join('');
}

async function loadHistory() {
  const tbody = document.getElementById('tableHistory');
  const { data: ins } = await supabase.from('purchase_orders').select('*, po_items(jumlah, products(nama))');
  const { data: outs } = await supabase.from('stock_out').select('*, products(nama)');
  
  let history = [];
  if (ins) ins.forEach(po => po.po_items.forEach(item => history.push({ tanggal: po.tanggal, tipe: 'Masuk (PO)', produk: item.products?.nama, jumlah: item.jumlah, ket: po.no_po, created: po.created_at })));
  if (outs) outs.forEach(o => history.push({ tanggal: o.tanggal, tipe: 'Keluar', produk: o.products?.nama, jumlah: o.jumlah, ket: o.keterangan, created: o.created_at }));

  history.sort((a, b) => new Date(b.created) - new Date(a.created));

  if (history.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada history.</td></tr>'; return; }

  tbody.innerHTML = history.map(h => `
    <tr>
      <td>${new Date(h.tanggal).toLocaleDateString('id-ID')}</td>
      <td><span class="badge ${h.tipe.includes('Masuk') ? 'success' : 'warning'}">${h.tipe}</span></td>
      <td>${h.produk || '-'}</td><td>${h.jumlah}</td><td>${h.ket || '-'}</td>
    </tr>
  `).join('');
}
