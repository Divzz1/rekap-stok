import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vggxtpyduiiaazoloylx.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_kQifdwQIic-ycFJBLPa8Og_TvOSw13Z';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let tempStokData = []; 
let masterTipeAktif = '';

/* =========================================
   UI & NAVIGATION
========================================= */
window.toggleAuth = (type) => {
  document.getElementById('authError').classList.add('hidden');
  document.getElementById('loginBox').classList.toggle('hidden', type === 'register');
  document.getElementById('registerBox').classList.toggle('hidden', type === 'login');
};

window.showPage = (pageId, el) => {
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

  if (pageId === 'dashboard') loadDashboard();
  if (pageId.startsWith('master')) loadMasterData(pageId.replace('master', '').toLowerCase());
  if (pageId === 'masterProduk') loadProducts();
  if (pageId === 'stok') loadStokPage();
  if (pageId === 'history') loadHistory();
  if (pageId === 'inputKeluar') loadDropdownProduk();
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

/* =========================================
   AUTH
========================================= */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email: document.getElementById('loginEmail').value, 
    password: document.getElementById('loginPass').value 
  });
  if (error) { document.getElementById('authError').textContent = error.message; document.getElementById('authError').classList.remove('hidden'); }
  else initApp(data.user);
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.auth.signUp({ 
    email: document.getElementById('regEmail').value, 
    password: document.getElementById('regPass').value,
    options: { data: { nama: document.getElementById('regNama').value } }
  });
  if (error) { document.getElementById('authError').textContent = error.message; document.getElementById('authError').classList.remove('hidden'); }
  else { alert('Registrasi berhasil! Silakan login.'); toggleAuth('login'); }
});

window.logout = async () => { await supabase.auth.signOut(); location.reload(); };

function initApp(user) {
  currentUser = user;
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  document.getElementById('userNameDisplay').textContent = user.email.split('@')[0];
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('id-ID', options);
  
  const firstGroup = document.querySelector('.menu-group');
  if(firstGroup) toggleSubmenu(firstGroup.querySelector('.menu-item'));
  
  loadDashboard();
}

supabase.auth.getSession().then(({ data: { session } }) => { if (session) initApp(session.user); });

/* =========================================
   DASHBOARD (NILAI ASET & LOW STOCK)
========================================= */
async function loadDashboard() {
  const { data: products } = await supabase.from('products').select('*');
  const { data: pos } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }).limit(5);
  const { data: outs } = await supabase.from('stock_out').select('*, products(nama)').order('created_at', { ascending: false }).limit(5);
  
  if (products) {
    document.getElementById('statTotalProduk').textContent = products.length;
    document.getElementById('statLowStok').textContent = products.filter(p => p.stok < 10).length;
    
    // Hitung Total Nilai Aset
    let nilaiAset = 0;
    products.forEach(p => { nilaiAset += (p.stok * p.harga_jual); });
    document.getElementById('statNilaiAset').textContent = 'Rp ' + nilaiAset.toLocaleString('id-ID');
  }

  if (pos) document.getElementById('dashPOTable').innerHTML = pos.map(po => `<tr><td>${new Date(po.tanggal).toLocaleDateString('id-ID')}</td><td>${po.no_po}</td><td>${po.total_item} Item</td></tr>`).join('') || '<tr><td colspan="3" align="center">Belum ada data</td></tr>';
  
  if (outs) document.getElementById('dashOutTable').innerHTML = outs.map(o => `<tr><td>${new Date(o.tanggal).toLocaleDateString('id-ID')}</td><td>${o.products?.nama || '-'}</td><td>${o.jumlah}</td></tr>`).join('') || '<tr><td colspan="3" align="center">Belum ada data</td></tr>';
}

/* =========================================
   BARANG MASUK (PO)
========================================= */
window.tambahKeTabelSementara = async () => {
  const sku = document.getElementById('inputSkuCepat').value;
  const jml = parseInt(document.getElementById('inputJmlCepat').value);
  const harga = parseFloat(document.getElementById('inputHargaCepat').value);

  if (!sku || !jml || !harga) return alert('Isi SKU, Jumlah, dan Harga dengan benar.');

  const { data: prod, error } = await supabase.from('products').select('*').eq('sku', sku).single();
  if (error || !prod) return alert('SKU tidak ditemukan di database!');

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
  if (tempStokData.length === 0) return alert('Belum ada data.');
  const noPo = 'PO-' + Date.now().toString().slice(-6);
  const today = new Date().toISOString().split('T')[0];

  const { data: po, error: poErr } = await supabase.from('purchase_orders').insert({ no_po: noPo, tanggal: today, total_item: tempStokData.length }).select().single();
  if (poErr) return alert('Gagal membuat PO: ' + poErr.message);

  for (let item of tempStokData) {
    await supabase.from('po_items').insert({ po_id: po.id, product_id: item.id, jumlah: item.jumlahBeli, harga: item.hargaBeli });
    await supabase.from('products').update({ stok: item.stok + item.jumlahBeli }).eq('id', item.id);
  }
  alert('Barang masuk berhasil disimpan!');
  tempStokData = []; renderTempStok(); loadDashboard();
};

/* =========================================
   BARANG KELUAR (STOCK OUT)
========================================= */
async function loadDropdownProduk() {
  const select = document.getElementById('outProdukId');
  const { data } = await supabase.from('products').select('id, sku, nama, stok').gt('stok', 0).order('nama');
  
  if (!data || data.length === 0) {
    select.innerHTML = '<option value="">Tidak ada stok tersedia</option>'; return;
  }
  select.innerHTML = data.map(p => `<option value="${p.id}">${p.sku} - ${p.nama} (Sisa: ${p.stok})</option>`).join('');
}

document.getElementById('formKeluar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const prodId = document.getElementById('outProdukId').value;
  const jml = parseInt(document.getElementById('outJumlah').value);
  
  const { data: prod } = await supabase.from('products').select('stok').eq('id', prodId).single();
  if (prod.stok < jml) return alert('Gagal: Stok tidak mencukupi! Sisa stok saat ini: ' + prod.stok);

  const payload = {
    user_id: currentUser.id,
    product_id: prodId,
    jumlah: jml,
    tanggal: document.getElementById('outTanggal').value,
    keterangan: document.getElementById('outKet').value
  };

  const { error } = await supabase.from('stock_out').insert(payload);
  if (error) return alert('Gagal: ' + error.message);

  // Update stok produk (kurangi)
  await supabase.from('products').update({ stok: prod.stok - jml }).eq('id', prodId);
  
  alert('Barang keluar berhasil dicatat!');
  e.target.reset();
  loadDashboard();
});

/* =========================================
   MASTER DATA & PRODUK
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
  closeModal('modalMaster'); loadMasterData(masterTipeAktif);
};

async function loadMasterData(tipe) {
  const tableId = 'tableMaster' + tipe.charAt(0).toUpperCase() + tipe.slice(1);
  const tbody = document.getElementById(tableId);
  if (!tbody) return;

  const { data } = await supabase.from('master_data').select('*').eq('tipe', tipe).order('nama');
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Belum ada data.</td></tr>`; return;
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

window.bukaDetailProduk = () => {
  document.getElementById('formProduk').reset();
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
    stok: 0, // Stok awal 0, diisi lewat PO
    user_id: currentUser.id
  };

  const { error } = await supabase.from('products').insert(payload);
  if (error) return alert('Gagal simpan: ' + error.message);
  closeModal('modalProduk'); loadProducts();
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
   STOK & HISTORY
========================================= */
async function loadStokPage() {
  const tbody = document.getElementById('tableStok');
  const { data } = await supabase.from('products').select('sku, nama, lokasi, stok').order('stok', { ascending: true });
  if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada stok.</td></tr>'; return; }
  tbody.innerHTML = data.map(p => `<tr><td>${p.sku}</td><td>${p.nama}</td><td>${p.lokasi || '-'}</td><td><b>${p.stok}</b></td></tr>`).join('');
}

async function loadHistory() {
  const tbody = document.getElementById('tableHistory');
  
  // Ambil data masuk
  const { data: ins } = await supabase.from('purchase_orders').select('*, po_items(jumlah, products(nama))');
  // Ambil data keluar
  const { data: outs } = await supabase.from('stock_out').select('*, products(nama)');
  
  let history = [];
  
  if (ins) {
    ins.forEach(po => {
      po.po_items.forEach(item => {
        history.push({ tanggal: po.tanggal, tipe: 'Masuk (PO)', produk: item.products?.nama, jumlah: item.jumlah, ket: po.no_po, created: po.created_at });
      });
    });
  }
  
  if (outs) {
    outs.forEach(o => {
      history.push({ tanggal: o.tanggal, tipe: 'Keluar', produk: o.products?.nama, jumlah: o.jumlah, ket: o.keterangan, created: o.created_at });
    });
  }

  // Urutkan berdasarkan tanggal terbaru
  history.sort((a, b) => new Date(b.created) - new Date(a.created));

  if (history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada history.</td></tr>'; return;
  }

  tbody.innerHTML = history.map(h => `
    <tr>
      <td>${new Date(h.tanggal).toLocaleDateString('id-ID')}</td>
      <td><span class="badge ${h.tipe.includes('Masuk') ? 'success' : 'warning'}">${h.tipe}</span></td>
      <td>${h.produk || '-'}</td>
      <td>${h.jumlah}</td>
      <td>${h.ket || '-'}</td>
    </tr>
  `).join('');
}
