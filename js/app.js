import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vggxtpyduiiaazoloylx.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_kQifdwQIic-ycFJBLPa8Og_TvOSw13Z';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  user: null, profile: null, categories: [], products: [], transactions: [],
  chartInstance: null, recoveryMode: false
};

const fmt = (n) => Number(n).toLocaleString('id-ID');
const fmtRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = (s) => { if (!s) return '-'; const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); };
const escHtml = (s) => { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };
const hideAllAlerts = () => document.querySelectorAll('.alert').forEach(a => a.classList.add('hidden'));

function translateError(msg) {
  if (!msg) return 'Terjadi kesalahan.';
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email atau password salah.';
  if (m.includes('user already registered')) return 'Email sudah terdaftar.';
  if (m.includes('email not confirmed')) return 'Email belum diverifikasi.';
  if (m.includes('rate limit')) return 'Terlalu banyak percobaan.';
  if (m.includes('stok tidak mencukupi')) return 'Gagal: Stok tidak mencukupi untuk transaksi ini.';
  return msg;
}

window.showAuthView = (viewId) => {
  document.querySelectorAll('.auth-view').forEach(v => v.classList.add('hidden'));
  document.getElementById(viewId).classList.remove('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appScreen').classList.add('hidden');
  hideAllAlerts();
};

function showApp() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
}

async function loadProfile() {
  if (!state.user) return;
  const { data } = await supabase.from('profiles').select('nama').eq('id', state.user.id).maybeSingle();
  state.profile = data;
}

function updateUserUI() {
  const name = state.profile?.nama || state.user?.email?.split('@')[0] || 'User';
  document.getElementById('userName').textContent = name;
  document.getElementById('userEmail').textContent = state.user?.email || '';
}

window.logout = async () => { if (confirm('Yakin ingin logout?')) await supabase.auth.signOut(); };

function btnLoading(btn, text) { btn.dataset.orig = btn.textContent; btn.disabled = true; btn.textContent = text; }
function btnRestore(btn) { btn.disabled = false; btn.textContent = btn.dataset.orig; }

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn'), err = document.getElementById('loginError');
  err.classList.add('hidden'); btnLoading(btn, 'Memuat...');
  const { error } = await supabase.auth.signInWithPassword({ email: document.getElementById('loginEmail').value.trim(), password: document.getElementById('loginPass').value });
  btnRestore(btn);
  if (error) { err.textContent = translateError(error.message); err.classList.remove('hidden'); }
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('signupBtn'), err = document.getElementById('signupError'), ok = document.getElementById('signupSuccess');
  err.classList.add('hidden'); ok.classList.add('hidden'); btnLoading(btn, 'Memuat...');
  const { data, error } = await supabase.auth.signUp({ 
    email: document.getElementById('signupEmail').value.trim(), 
    password: document.getElementById('signupPass').value,
    options: { data: { nama: document.getElementById('signupNama').value.trim() } }
  });
  btnRestore(btn);
  if (error) { err.textContent = translateError(error.message); err.classList.remove('hidden'); return; }
  if (data.user && !data.session) { ok.textContent = '✓ Akun dibuat! Cek email verifikasi.'; ok.classList.remove('hidden'); setTimeout(() => showAuthView('loginView'), 3500); }
});

document.getElementById('forgotForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('forgotBtn'), err = document.getElementById('forgotError'), ok = document.getElementById('forgotSuccess');
  err.classList.add('hidden'); ok.classList.add('hidden'); btnLoading(btn, 'Mengirim...');
  const { error } = await supabase.auth.resetPasswordForEmail(document.getElementById('forgotEmail').value.trim(), { redirectTo: window.location.origin + window.location.pathname });
  btnRestore(btn);
  if (error) { err.textContent = translateError(error.message); err.classList.remove('hidden'); }
  else { ok.textContent = '✓ Link reset dikirim. Cek email.'; ok.classList.remove('hidden'); }
});

document.getElementById('resetForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('resetBtn'), err = document.getElementById('resetError'), ok = document.getElementById('resetSuccess');
  err.classList.add('hidden'); ok.classList.add('hidden');
  if (document.getElementById('resetPass').value !== document.getElementById('resetPassConfirm').value) { err.textContent = 'Password tidak sama!'; err.classList.remove('hidden'); return; }
  btnLoading(btn, 'Menyimpan...');
  const { error } = await supabase.auth.updateUser({ password: document.getElementById('resetPass').value });
  btnRestore(btn);
  if (error) { err.textContent = translateError(error.message); err.classList.remove('hidden'); return; }
  ok.textContent = '✓ Password diubah! Silakan login.'; ok.classList.remove('hidden');
  state.recoveryMode = false; history.replaceState(null, '', window.location.pathname);
  setTimeout(async () => { await supabase.auth.signOut(); showAuthView('loginView'); }, 2000);
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') { state.recoveryMode = true; showAuthView('resetView'); return; }
  if (event === 'SIGNED_OUT') { state.user = null; state.profile = null; state.recoveryMode = false; showAuthView('loginView'); return; }
  if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
    if (state.recoveryMode) { showAuthView('resetView'); return; }
    state.user = session.user;
    loadProfile().then(() => { updateUserUI(); showApp(); loadData(); });
  } else if (!session && !state.recoveryMode) { showAuthView('loginView'); }
});

async function loadData() {
  document.getElementById('loadingState').classList.remove('hidden');
  const [catRes, prodRes, txRes] = await Promise.all([
    supabase.from('categories').select('*').order('nama'),
    supabase.from('products').select('*, categories(nama)').order('nama'),
    supabase.from('transactions').select('*, products(nama, harga_modal, category_id, categories(nama)), profiles(nama)').order('tanggal', { ascending: false }).order('created_at', { ascending: false })
  ]);
  state.categories = catRes.data || [];
  state.products = prodRes.data || [];
  state.transactions = txRes.data || [];
  document.getElementById('loadingState').classList.add('hidden');
  renderDashboard();
  renderProductTable();
}

function getProductStock(productId) {
  return state.transactions.filter(t => t.product_id === productId).reduce((sum, t) => {
    if (t.tipe === 'masuk') return sum + t.jumlah;
    if (t.tipe === 'keluar') return sum - t.jumlah;
    return sum + t.jumlah;
  }, 0);
}

function renderDashboard() {
  let totalMasuk = 0, totalKeluar = 0, totalNilai = 0;
  state.transactions.forEach(t => {
    if (t.tipe === 'masuk') totalMasuk += t.jumlah;
    else if (t.tipe === 'keluar') totalKeluar += t.jumlah;
    else if (t.tipe === 'penyesuaian') {
      if (t.jumlah > 0) totalMasuk += t.jumlah; else totalKeluar += Math.abs(t.jumlah);
    }
  });
  state.products.forEach(p => { const stok = getProductStock(p.id); if (stok > 0) totalNilai += (stok * p.harga_modal); });
  
  document.getElementById('statBarang').textContent = state.products.length;
  document.getElementById('statMasuk').textContent = fmt(totalMasuk);
  document.getElementById('statKeluar').textContent = fmt(totalKeluar);
  document.getElementById('statNilai').textContent = fmtRupiah(totalNilai);

  const lowStock = state.products.filter(p => getProductStock(p.id) <= p.min_stok);
  const banner = document.getElementById('lowStockBanner');
  if (lowStock.length > 0) {
    banner.classList.remove('hidden');
    document.getElementById('lowStockText').textContent = `Terdapat ${lowStock.length} produk yang stoknya di bawah batas minimum. Segera lakukan pembelian!`;
  } else { banner.classList.add('hidden'); }

  const prodOptions = '<option value="">— Pilih Produk —</option>' + state.products.map(p => `<option value="${p.id}">${escHtml(p.nama)} (Stok: ${getProductStock(p.id)})</option>`).join('');
  document.getElementById('inputProduct').innerHTML = prodOptions;
  
  const catOptions = '<option value="">Semua Kategori</option>' + state.categories.map(c => `<option value="${c.id}">${escHtml(c.nama)}</option>`).join('');
  document.getElementById('reportKategori').innerHTML = catOptions;
  document.getElementById('prodKategori').innerHTML = state.categories.map(c => `<option value="${c.id}">${escHtml(c.nama)}</option>`).join('');

  renderChart();
  renderTable();
}

function renderChart() {
  const map = {};
  state.categories.forEach(c => { map[c.nama] = 0; });
  state.products.forEach(p => {
    const cat = p.categories?.nama || 'Tanpa Kategori';
    map[cat] = (map[cat] || 0) + getProductStock(p.id);
  });
  const labels = Object.keys(map), values = Object.values(map);
  const COLORS = ['#111827', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#1F2937', '#4B5563', '#E5E7EB'];
  
  if (state.chartInstance) state.chartInstance.destroy();
  state.chartInstance = new Chart(document.getElementById('stockChart'), {
    type: 'bar',
    data: { labels: labels.length ? labels : ['Belum ada'], datasets: [{ label: 'Stok', data: values.length ? values : [0], backgroundColor: COLORS.slice(0, Math.max(1, labels.length)), borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

function renderTable() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const filtered = state.transactions.filter(t => (t.products?.nama || '').toLowerCase().includes(q));
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');

  if (filtered.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  tbody.innerHTML = filtered.map(t => {
    const qtyClass = t.tipe === 'masuk' ? 'green' : t.tipe === 'keluar' ? 'red' : 'gray';
    const qtyStr = t.tipe === 'keluar' ? `-${t.jumlah}` : (t.jumlah > 0 ? `+${t.jumlah}` : t.jumlah);
    const user = t.profiles?.nama || 'User';
    return `<tr>
      <td>${fmtDate(t.tanggal)}</td>
      <td><b>${escHtml(t.products?.nama || 'Produk Dihapus')}</b></td>
      <td><span class="pill ${qtyClass}">${t.tipe}</span></td>
      <td><b>${qtyStr}</b></td>
      <td>${escHtml(t.keterangan || '-')}</td>
      <td>${escHtml(user)}</td>
      <td class="text-right">
        <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${t.id})">Hapus</button>
      </td>
    </tr>`;
  }).join('');
}

document.getElementById('transactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const productId = Number(document.getElementById('inputProduct').value);
  const tipe = document.getElementById('inputTipe').value;
  const jumlah = parseInt(document.getElementById('inputJml').value);
  
  if (!jumlah || jumlah === 0) return alert('Jumlah tidak boleh 0.');
  if (tipe === 'masuk' && jumlah < 0) return alert('Jumlah masuk tidak boleh minus.');
  if (tipe === 'keluar' && jumlah < 0) return alert('Jumlah keluar tidak boleh minus.');

  // VALIDASI FRONTEND: Cegah stok minus baik untuk keluar maupun penyesuaian negatif
  if (tipe === 'keluar' || (tipe === 'penyesuaian' && jumlah < 0)) {
    const currentStock = getProductStock(productId);
    const jumlahKeluar = Math.abs(jumlah);
    if (jumlahKeluar > currentStock) {
      return alert(`Gagal: Stok tidak mencukupi! Sisa stok saat ini adalah ${currentStock}.`);
    }
  }

  btnLoading(btn, 'Menyimpan...');
  const rec = {
    product_id: productId,
    user_id: state.user.id,
    tipe: tipe,
    jumlah: jumlah,
    tanggal: document.getElementById('inputTgl').value,
    keterangan: document.getElementById('inputKet').value.trim()
  };

  const { error } = await supabase.from('transactions').insert(rec);
  btnRestore(btn);
  
  if (error) { alert('Gagal: ' + translateError(error.message)); return; }
  e.target.reset();
  document.getElementById('inputTgl').value = new Date().toISOString().slice(0,10);
  await loadData();
});

window.deleteTransaction = async (id) => {
  if (!confirm('Hapus transaksi ini? Saldo stok akan dikembalikan.')) return;
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return alert('Gagal: ' + translateError(error.message));
  await loadData();
};

window.openProductModal = () => { renderProductTable(); document.getElementById('productModal').classList.remove('hidden'); };
window.closeProductModal = () => document.getElementById('productModal').classList.add('hidden');
window.showAddProductForm = () => { 
  document.getElementById('productForm').reset(); 
  document.getElementById('prodId').value = ''; 
  document.getElementById('productForm').classList.remove('hidden'); 
};
window.hideProductForm = () => document.getElementById('productForm').classList.add('hidden');

function renderProductTable() {
  const tbody = document.getElementById('productTableBody');
  if (state.products.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada produk</td></tr>'; return; }
  tbody.innerHTML = state.products.map(p => {
    const stock = getProductStock(p.id);
    return `<tr>
      <td><b>${escHtml(p.nama)}</b></td>
      <td>${p.categories?.nama ? `<span class="pill blue">${escHtml(p.categories.nama)}</span>` : '-'}</td>
      <td><strong>${stock}</strong></td>
      <td>${p.min_stok}</td>
      <td>${fmtRupiah(p.harga_modal)}</td>
      <td class="text-right">
        <div class="actions-cell">
          <button class="btn btn-outline btn-sm" onclick="openStockCard(${p.id})">Kartu Stok</button>
          <button class="btn btn-secondary btn-sm" onclick="editProduct(${p.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Hapus</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('prodId').value;
  const rec = {
    nama: document.getElementById('prodNama').value.trim(),
    category_id: Number(document.getElementById('prodKategori').value),
    min_stok: parseInt(document.getElementById('prodMin').value) || 0,
    harga_modal: parseFloat(document.getElementById('prodHarga').value) || 0
  };
  let error;
  if (id) ({ error } = await supabase.from('products').update(rec).eq('id', id));
  else { rec.user_id = state.user.id; ({ error } = await supabase.from('products').insert(rec)); }
  
  if (error) { alert('Gagal: ' + translateError(error.message)); return; }
  hideProductForm();
  await loadData();
});

window.editProduct = (id) => {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('prodId').value = p.id;
  document.getElementById('prodNama').value = p.nama;
  document.getElementById('prodKategori').value = p.category_id || '';
  document.getElementById('prodMin').value = p.min_stok;
  document.getElementById('prodHarga').value = p.harga_modal;
  document.getElementById('productForm').classList.remove('hidden');
};

window.deleteProduct = async (id) => {
  if (!confirm('Hapus produk ini? Semua riwayat transaksinya juga akan terhapus!')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return alert('Gagal: ' + translateError(error.message));
  await loadData();
};

window.openStockCard = (productId) => {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;
  document.getElementById('stockCardTitle').textContent = `Kartu Stok: ${prod.nama}`;
  
  let txs = state.transactions.filter(t => t.product_id === productId);
  txs.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal) || new Date(a.created_at) - new Date(b.created_at));

  let balance = 0;
  const tbody = document.getElementById('stockCardBody');
  if (txs.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">Belum ada transaksi</td></tr>'; }
  else {
    tbody.innerHTML = txs.map(t => {
      let inQty = 0, outQty = 0;
      if (t.tipe === 'masuk') { inQty = t.jumlah; balance += t.jumlah; }
      else if (t.tipe === 'keluar') { outQty = t.jumlah; balance -= t.jumlah; }
      else if (t.tipe === 'penyesuaian') {
        if (t.jumlah > 0) inQty = t.jumlah; else outQty = Math.abs(t.jumlah);
        balance += t.jumlah;
      }
      return `<tr>
        <td>${fmtDate(t.tanggal)}</td>
        <td><span class="pill ${t.tipe === 'masuk' ? 'green' : t.tipe === 'keluar' ? 'red' : 'gray'}">${t.tipe}</span></td>
        <td>${inQty > 0 ? `<span class="pill green">+${inQty}</span>` : '-'}</td>
        <td>${outQty > 0 ? `<span class="pill red">-${outQty}</span>` : '-'}</td>
        <td><b>${balance}</b></td>
        <td>${escHtml(t.keterangan || '-')}</td>
        <td>${escHtml(t.profiles?.nama || 'User')}</td>
      </tr>`;
    }).join('');
  }
  document.getElementById('stockCardModal').classList.remove('hidden');
};
window.closeStockCardModal = () => document.getElementById('stockCardModal').classList.add('hidden');

let parsedImportData = [];
window.openImportModal = () => { document.getElementById('importPreview').classList.add('hidden'); document.getElementById('csvFileInput').value = ''; parsedImportData = []; document.getElementById('importModal').classList.remove('hidden'); };
window.closeImportModal = () => document.getElementById('importModal').classList.add('hidden');

document.getElementById('csvFileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => parseCSV(event.target.result);
  reader.readAsText(file);
});

function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return alert('File CSV kosong atau tidak valid.');
  
  const header = lines[0].toLowerCase();
  if (!header.includes('nama') || !header.includes('kategori') || !header.includes('stok') || !header.includes('min') || !header.includes('harga')) {
    return alert('Format header CSV tidak sesuai. Pastikan ada: Nama Produk, Kategori, Stok Awal, Min Stok, Harga Modal');
  }

  parsedImportData = [];
  const tbody = document.getElementById('importTableBody');
  tbody.innerHTML = '';
  const existingNames = new Set(state.products.map(p => p.nama.toLowerCase()));

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (!cols[0]) continue;
    
    const nama = cols[0];
    let status = 'Valid', isValid = true;

    if (existingNames.has(nama.toLowerCase())) { status = 'Duplikat (Nama sudah ada)'; isValid = false; }
    else { existingNames.add(nama.toLowerCase()); }

    const katNama = cols[1];
    if (!state.categories.find(c => c.nama.toLowerCase() === katNama.toLowerCase())) { status = isValid ? 'Kategori baru' : status; }

    parsedImportData.push({ nama, kategoriNama: katNama, stokAwal: parseInt(cols[2])||0, minStok: parseInt(cols[3])||0, harga: parseFloat(cols[4])||0, isValid, status });
    tbody.innerHTML += `<tr>
      <td>${escHtml(nama)}</td><td>${escHtml(katNama)}</td><td>${cols[2]||0}</td><td>${cols[3]||0}</td><td>${cols[4]||0}</td>
      <td><span class="pill ${isValid ? 'green' : 'red'}">${status}</span></td>
    </tr>`;
  }
  document.getElementById('importPreview').classList.remove('hidden');
}

window.processImport = async () => {
  const toImport = parsedImportData.filter(d => d.isValid);
  if (toImport.length === 0) return alert('Tidak ada data valid untuk diimpor.');

  const btn = document.querySelector('#importPreview button'); btnLoading(btn, 'Memproses...');

  const newCats = [...new Set(toImport.map(d => d.kategoriNama))].filter(name => !state.categories.find(c => c.nama.toLowerCase() === name.toLowerCase()));
  for (let cat of newCats) { await supabase.from('categories').insert({ nama: cat, user_id: state.user.id }); }
  const { data: updatedCats } = await supabase.from('categories').select('*');

  for (let item of toImport) {
    const cat = updatedCats.find(c => c.nama.toLowerCase() === item.kategoriNama.toLowerCase());
    const { data: prod, error } = await supabase.from('products').insert({
      nama: item.nama, category_id: cat ? cat.id : null, min_stok: item.minStok, harga_modal: item.harga, user_id: state.user.id
    }).select().single();

    if (!error && item.stokAwal > 0) {
      await supabase.from('transactions').insert({
        product_id: prod.id, user_id: state.user.id, tipe: 'masuk', jumlah: item.stokAwal, tanggal: new Date().toISOString().slice(0,10), keterangan: 'Saldo Awal (Impor CSV)'
      });
    }
  }
  btnRestore(btn);
  alert('Impor berhasil!');
  closeImportModal();
  await loadData();
};

window.openCategoryModal = () => { renderCategoryList(); document.getElementById('categoryModal').classList.remove('hidden'); };
window.closeCategoryModal = () => document.getElementById('categoryModal').classList.add('hidden');
function renderCategoryList() {
  const list = document.getElementById('categoryList');
  list.innerHTML = state.categories.length === 0 ? '<div class="text-center" style="color:#94a3b8; padding:14px;">Belum ada kategori</div>' :
    state.categories.map(c => `<div class="list-item"><span>${escHtml(c.nama)}</span><button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.id})">Hapus</button></div>`).join('');
}
window.addCategory = async () => {
  const input = document.getElementById('newCategoryInput'); if (!input.value.trim()) return;
  const { error } = await supabase.from('categories').insert({ nama: input.value.trim(), user_id: state.user.id });
  if (error) return alert('Gagal: ' + translateError(error.message));
  input.value = ''; await loadData(); renderCategoryList();
};
window.deleteCategory = async (id) => {
  if (!confirm('Hapus kategori?')) return;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return alert('Gagal: ' + translateError(error.message));
  await loadData(); renderCategoryList();
};

window.switchPage = (pageId, el) => {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); el.classList.add('active');
  document.getElementById('page-dashboard').classList.add('hidden');
  document.getElementById('page-report').classList.add('hidden');
  
  if (pageId === 'dashboard') {
    document.getElementById('page-dashboard').classList.remove('hidden');
    document.getElementById('pageTitle').textContent = 'Ikhtisar Inventaris';
    renderDashboard();
  } else if (pageId === 'report') {
    document.getElementById('page-report').classList.remove('hidden');
    document.getElementById('pageTitle').textContent = 'Laporan Periode';
    const today = new Date(); const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('reportStart').value = firstDay.toISOString().slice(0,10);
    document.getElementById('reportEnd').value = today.toISOString().slice(0,10);
  }
};

window.generateReport = () => {
  const start = document.getElementById('reportStart').value;
  const end = document.getElementById('reportEnd').value;
  const catId = document.getElementById('reportKategori').value;
  if (!start || !end) return alert('Pilih tanggal mulai dan selesai.');

  let filtered = state.transactions.filter(t => t.tanggal >= start && t.tanggal <= end && (!catId || String(t.products?.category_id) === String(catId)));
  let totalMasuk = 0, totalKeluar = 0, nilaiMasuk = 0, nilaiKeluar = 0;
  const tbody = document.getElementById('reportTableBody');

  if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada transaksi.</td></tr>'; }
  else {
    tbody.innerHTML = filtered.map(t => {
      const harga = t.products?.harga_modal || 0; let totalNilai = 0;
      if (t.tipe === 'masuk') { totalMasuk += t.jumlah; nilaiMasuk += t.jumlah * harga; totalNilai = t.jumlah * harga; }
      else if (t.tipe === 'keluar') { totalKeluar += t.jumlah; nilaiKeluar += t.jumlah * harga; totalNilai = t.jumlah * harga; }
      else if (t.tipe === 'penyesuaian') {
        if (t.jumlah > 0) { totalMasuk += t.jumlah; nilaiMasuk += t.jumlah * harga; totalNilai = t.jumlah * harga; }
        else { totalKeluar += Math.abs(t.jumlah); nilaiKeluar += Math.abs(t.jumlah) * harga; totalNilai = Math.abs(t.jumlah) * harga; }
      }
      return `<tr>
        <td>${fmtDate(t.tanggal)}</td><td>${escHtml(t.products?.nama || '-')}</td><td>${t.products?.categories?.nama || '-'}</td>
        <td><span class="pill ${t.tipe === 'masuk' ? 'green' : t.tipe === 'keluar' ? 'red' : 'gray'}">${t.tipe}</span></td>
        <td>${t.jumlah}</td><td>${fmtRupiah(harga)}</td><td>${fmtRupiah(totalNilai)}</td>
      </tr>`;
    }).join('');
  }
  document.getElementById('repMasuk').textContent = totalMasuk;
  document.getElementById('repKeluar').textContent = totalKeluar;
  document.getElementById('repNilaiMasuk').textContent = fmtRupiah(nilaiMasuk);
  document.getElementById('repNilaiKeluar').textContent = fmtRupiah(nilaiKeluar);
};

window.exportCSV = () => {
  if (state.transactions.length === 0) return alert('Belum ada data transaksi.');
  const header = ['Tanggal','Nama Produk','Tipe','Jumlah','Harga Modal','Total Nilai','Keterangan','User'];
  const rows = [header];
  state.transactions.forEach(t => {
    const harga = t.products?.harga_modal || 0;
    let total = Math.abs(t.jumlah) * harga;
    rows.push([t.tanggal, t.products?.nama || '-', t.tipe, t.jumlah, harga, total, t.keterangan || '-', t.profiles?.nama || 'User']);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `laporan-stok-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
};
