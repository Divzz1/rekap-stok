import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vggxtpyduiiaazoloylx.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_kQifdwQIic-ycFJBLPa8Og_TvOSw13Z';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let tempStokData = []; 
let masterTipeAktif = '';
let isEditingProduk = false;
let chartInstance = null;

/* SPLASH & LOADER */
function hideSplash() {
  const splash = document.getElementById('splashScreen');
  if(splash) { splash.classList.add('fade-out'); setTimeout(() => splash.remove(), 600); }
}
function showLoader() { document.getElementById('globalLoader').classList.remove('hidden'); }
function hideLoader() { document.getElementById('globalLoader').classList.add('hidden'); }
window.addEventListener('load', () => { setTimeout(hideSplash, 1000); });

/* UI & NAVIGATION */
window.toggleSidebar = () => {
  if (window.innerWidth > 1024) {
    document.querySelector('.app-layout').classList.toggle('sidebar-closed');
  } else {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
  }
};
window.toggleProfileMenu = (event) => { event.stopPropagation(); document.getElementById('profileDropdown').classList.toggle('hidden'); };
document.addEventListener('click', (event) => {
  const dropdown = document.getElementById('profileDropdown');
  const container = document.querySelector('.profile-dropdown-container');
  if (dropdown && !dropdown.classList.contains('hidden')) { if (!container.contains(event.target)) dropdown.classList.add('hidden'); }
});
window.toggleAuth = (type) => {
  document.getElementById('authError').classList.add('hidden');
  document.getElementById('loginBox').classList.toggle('hidden', type === 'register');
  document.getElementById('registerBox').classList.toggle('hidden', type === 'login');
};

window.showPage = (pageId, el) => {
  showLoader();
  if (window.innerWidth <= 1024) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  }
  document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden'));
  const target = document.getElementById(`page-${pageId}`);
  
  setTimeout(() => {
    if (target) {
      target.classList.remove('hidden');
      target.style.animation = 'none';
      target.offsetHeight; 
      target.style.animation = 'slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    }
    document.querySelectorAll('.menu-item, .submenu a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');
    document.getElementById('globalSearch').value = '';

    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'laporanAset') loadLaporanAset();
    if (pageId.startsWith('master') && pageId !== 'masterProduk') loadMasterData(pageId.replace('master', '').toLowerCase());
    if (pageId === 'masterProduk') loadProducts();
    if (pageId === 'stok') loadStokPage();
    if (pageId === 'history') loadHistory();
    if (pageId === 'settings') loadSettingsData();
    if (pageId === 'inputMasuk') loadDropdownProdukMasuk(); 
    if (pageId === 'inputKeluar') {
      loadDropdownProduk();
      document.getElementById('outTanggal').value = new Date().toISOString().split('T')[0];
    }
    hideLoader();
  }, 300);
};

window.toggleSubmenu = (element) => {
  const submenu = element.nextElementSibling;
  const arrow = element.querySelector('.arrow');
  if (submenu) { submenu.classList.toggle('open'); arrow.style.transform = submenu.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)'; }
};
window.closeModal = (modalId) => document.getElementById(modalId).classList.add('hidden');
window.closeModalOutside = (event, modalId) => { if (event.target.id === modalId) closeModal(modalId); };
window.filterTable = () => {
  const input = document.getElementById('globalSearch').value.toLowerCase();
  const activePage = document.querySelector('.page-view:not(.hidden)');
  if (!activePage) return;
  const rows = activePage.querySelectorAll('table tbody tr');
  rows.forEach(row => { const text = row.innerText.toLowerCase(); row.style.display = text.includes(input) ? '' : 'none'; });
};

/* ANIMASI ANGKA */
function animateValue(obj, start, end, duration, isRupiah = false) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 4);
    const currentVal = Math.floor(easeProgress * (end - start) + start);
    obj.innerHTML = isRupiah ? 'Rp ' + currentVal.toLocaleString('id-ID') : currentVal;
    if (progress < 1) window.requestAnimationFrame(step);
    else obj.innerHTML = isRupiah ? 'Rp ' + end.toLocaleString('id-ID') : end;
  };
  window.requestAnimationFrame(step);
}

/* DARK MODE */
window.toggleDarkMode = () => {
  const html = document.documentElement; const icon = document.getElementById('themeIcon');
  if (html.getAttribute('data-theme') === 'dark') { html.removeAttribute('data-theme'); icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); localStorage.setItem('theme', 'light'); } 
  else { html.setAttribute('data-theme', 'dark'); icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); localStorage.setItem('theme', 'dark'); }
  if(document.getElementById('page-dashboard').classList.contains('hidden') === false) loadDashboard();
};
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.addEventListener("DOMContentLoaded", () => { const icon = document.getElementById('themeIcon'); if(icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); } });
}

/* AUTHENTICATION */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault(); showLoader();
  const { data, error } = await supabase.auth.signInWithPassword({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPass').value });
  hideLoader();
  if (error) { document.getElementById('authError').textContent = error.message; document.getElementById('authError').classList.remove('hidden'); } else { initApp(data.user); }
});
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault(); showLoader();
  const { error } = await supabase.auth.signUp({ email: document.getElementById('regEmail').value, password: document.getElementById('regPass').value, options: { data: { nama: document.getElementById('regNama').value } } });
  hideLoader();
  if (error) { document.getElementById('authError').textContent = error.message; document.getElementById('authError').classList.remove('hidden'); } else { alert('Registrasi berhasil! Silakan login.'); toggleAuth('login'); }
});
window.logout = async () => { showLoader(); await supabase.auth.signOut(); location.reload(); };

async function initApp(user) {
  currentUser = user;
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  document.getElementById('year').textContent = new Date().getFullYear();
  
  let { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (!data) {
    const defaultNama = user.email.split('@')[0];
    const { data: newData } = await supabase.from('profiles').upsert({ id: user.id, nama: defaultNama, nama_perusahaan: 'Inventory' }).select().single();
    data = newData;
  }
  updateUIProfile(data);
  
  const firstGroup = document.querySelector('.menu-group');
  if(firstGroup) toggleSubmenu(firstGroup.querySelector('.menu-item'));
  showPage('dashboard', document.querySelector('.menu-item'));
}
function updateUIProfile(data) {
  if (!data) return;
  document.getElementById('userNameDisplay').textContent = data.nama || currentUser.email.split('@')[0];
  document.getElementById('footerCompanyName').textContent = data.nama_perusahaan || 'Inventory';
  document.getElementById('sidebarBrandName').textContent = data.nama_perusahaan || 'Inventory';
  const footerLogo = document.getElementById('footerBrandLogoText');
  if(footerLogo) footerLogo.textContent = data.nama_perusahaan || 'Inventory';

  const avatarImg = document.getElementById('userAvatarImg');
  const avatarPlaceholder = document.querySelector('.avatar-placeholder');
  if (data.avatar_url) { avatarImg.src = data.avatar_url; avatarImg.style.display = 'block'; avatarPlaceholder.style.display = 'none'; } 
  else { avatarImg.style.display = 'none'; avatarPlaceholder.style.display = 'flex'; }

  const logoImg = document.getElementById('sidebarLogoImg');
  const logoPlaceholder = document.querySelector('.brand-logo-placeholder');
  if (data.logo_url) { logoImg.src = data.logo_url; logoImg.style.display = 'block'; logoPlaceholder.style.display = 'none'; } 
  else { logoImg.style.display = 'none'; logoPlaceholder.style.display = 'block'; }
}
supabase.auth.getSession().then(({ data: { session } }) => { if (session) initApp(session.user); });

/* SETTINGS */
async function loadSettingsData() {
  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
  if (data) {
    document.getElementById('settingCompanyName').value = data.nama_perusahaan || 'Inventory';
    document.getElementById('settingUsername').value = data.nama || currentUser.email.split('@')[0];
    if(data.logo_url) { document.getElementById('previewLogo').src = data.logo_url; document.getElementById('previewLogo').style.display = 'block'; }
    if(data.avatar_url) { document.getElementById('previewAvatar').src = data.avatar_url; document.getElementById('previewAvatar').style.display = 'block'; }
  }
}
async function uploadImage(file, folder) {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;
  const { error: uploadError } = await supabase.storage.from('inventory-images').upload(filePath, file);
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('inventory-images').getPublicUrl(filePath);
  return data.publicUrl;
}
document.getElementById('formSettings').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; btn.disabled = true;
  const newCompany = document.getElementById('settingCompanyName').value;
  const newUsername = document.getElementById('settingUsername').value;
  const logoFile = document.getElementById('inputLogo').files[0];
  const avatarFile = document.getElementById('inputAvatar').files[0];
  try {
    let logoUrl = null; let avatarUrl = null;
    if (logoFile) logoUrl = await uploadImage(logoFile, 'logos');
    if (avatarFile) avatarUrl = await uploadImage(avatarFile, 'avatars');
    let updateData = { id: currentUser.id, nama: newUsername, nama_perusahaan: newCompany };
    if (logoUrl) updateData.logo_url = logoUrl;
    if (avatarUrl) updateData.avatar_url = avatarUrl;
    const { data, error } = await supabase.from('profiles').upsert(updateData).select().single();
    if (error) throw error;
    alert('Pengaturan berhasil disimpan!');
    updateUIProfile(data);
    document.getElementById('inputLogo').value = ''; document.getElementById('inputAvatar').value = '';
    if(data.logo_url) { document.getElementById('previewLogo').src = data.logo_url; document.getElementById('previewLogo').style.display = 'block'; }
    if(data.avatar_url) { document.getElementById('previewAvatar').src = data.avatar_url; document.getElementById('previewAvatar').style.display = 'block'; }
  } catch (error) { alert('Gagal menyimpan: ' + error.message); } finally { btn.innerHTML = originalText; btn.disabled = false; }
});

/* LOGIKA DASHBOARD (LABA BERSIH) */
async function loadDashboard() {
  const { data: products } = await supabase.from('products').select('*').order('nama').limit(5);
  const { data: allProducts } = await supabase.from('products').select('stok, harga_jual, harga_beli');
  
  if (allProducts) {
    let totalLaba = 0;
    allProducts.forEach(p => {
      const margin = (p.harga_jual || 0) - (p.harga_beli || 0);
      if(margin > 0 && p.stok > 0) totalLaba += (p.stok * margin);
    });
    const lowStok = allProducts.filter(p => p.stok < 10).length;
    
    animateValue(document.getElementById('statTotalProduk'), 0, allProducts.length, 1000);
    animateValue(document.getElementById('statLowStok'), 0, lowStok, 1000);
    animateValue(document.getElementById('statNilaiAset'), 0, totalLaba, 1500, true);
  }

  if (products) {
    const labels = products.map(p => p.nama);
    const dataStok = products.map(p => p.stok);
    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('dashboardChart').getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: 'Sisa Stok', data: dataStok, backgroundColor: '#2563eb', borderRadius: 6, barThickness: 'flex', maxBarThickness: 35 }] },
      options: { responsive: true, maintainAspectRatio: false, layout: { padding: { bottom: 10 } }, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false, drawBorder: false }, ticks: { color: textColor } }, x: { grid: { display: false, drawBorder: false }, ticks: { color: textColor, font: { size: 11 }, maxRotation: 45, minRotation: 45 } } } }
    });
  }

  const { data: ins } = await supabase.from('purchase_orders').select('tanggal, po_items(jumlah, products(nama))').order('created_at', { ascending: false }).limit(3);
  const { data: outs } = await supabase.from('stock_out').select('tanggal, jumlah, products(nama)').order('created_at', { ascending: false }).limit(3);
  
  let history = [];
  if (ins) ins.forEach(po => po.po_items.forEach(item => history.push({ tgl: po.tanggal, tipe: 'Masuk', nama: item.products?.nama, qty: item.jumlah })));
  if (outs) outs.forEach(o => history.push({ tgl: o.tanggal, tipe: 'Keluar', nama: o.products?.nama, qty: o.jumlah }));
  
  history.sort((a,b) => new Date(b.tgl) - new Date(a.tgl));
  document.getElementById('dashHistoryTable').innerHTML = history.slice(0,5).map(h => `
    <tr><td>${new Date(h.tgl).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})}</td><td><span class="badge ${h.tipe === 'Masuk' ? 'success' : 'warning'}">${h.tipe}</span></td><td>${h.nama || '-'}</td><td class="text-right"><b>${h.qty}</b></td></tr>
  `).join('') || '<tr><td colspan="4" align="center">Belum ada aktivitas</td></tr>';
}

/* LOGIKA LAPORAN ASET */
async function loadLaporanAset() {
  const tbody = document.getElementById('tableLaporanAset');
  const { data } = await supabase.from('products').select('*').order('nama');
  
  if (!data || data.length === 0) { 
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Belum ada data produk.</td></tr>'; 
    return; 
  }
  
  let totalModal = 0, totalOmzet = 0, totalLaba = 0;
  
  tbody.innerHTML = data.map(p => {
    const stok = p.stok || 0;
    const hBeli = p.harga_beli || 0;
    const hJual = p.harga_jual || 0;
    
    const subModal = stok * hBeli;
    const subOmzet = stok * hJual;
    const subLaba = subOmzet - subModal;
    
    totalModal += subModal;
    totalOmzet += subOmzet;
    totalLaba += subLaba;
    
    return `
      <tr>
        <td><b>${p.sku}</b></td><td>${p.nama}</td><td class="text-right">${stok}</td>
        <td class="text-right">Rp ${hBeli.toLocaleString('id-ID')}</td><td class="text-right">Rp ${hJual.toLocaleString('id-ID')}</td>
        <td class="text-right" style="color: #d97706;">Rp ${subModal.toLocaleString('id-ID')}</td>
        <td class="text-right">Rp ${subOmzet.toLocaleString('id-ID')}</td>
        <td class="text-right" style="color: #16a34a; font-weight: bold;">Rp ${subLaba.toLocaleString('id-ID')}</td>
      </tr>
    `;
  }).join('');
  
  animateValue(document.getElementById('statTotalModal'), 0, totalModal, 1000, true);
  animateValue(document.getElementById('statTotalOmzet'), 0, totalOmzet, 1000, true);
  animateValue(document.getElementById('statTotalLaba'), 0, totalLaba, 1000, true);
}

/* BARANG MASUK (PO) - FITUR DROPDOWN & AUTO HARGA BELI */
async function loadDropdownProdukMasuk() {
  const select = document.getElementById('inProdukId');
  if (!select) return;
  const { data } = await supabase.from('products').select('id, sku, nama, stok, harga_beli').order('nama');
  if (!data || data.length === 0) { select.innerHTML = '<option value="">Belum ada produk di Master Data</option>'; return; }
  select.innerHTML = '<option value="">-- Pilih Produk --</option>' + 
    data.map(p => `<option value="${p.id}" data-harga="${p.harga_beli || 0}">${p.sku} - ${p.nama} (Sisa: ${p.stok})</option>`).join('');
}

window.suggestHargaBeli = () => {
  const select = document.getElementById('inProdukId');
  const hargaInput = document.getElementById('inputHargaCepat');
  if (!select.value) { hargaInput.value = ''; return; }
  const selectedOption = select.options[select.selectedIndex];
  const hargaBeliTerakhir = parseFloat(selectedOption.getAttribute('data-harga')) || 0;
  
  if (hargaBeliTerakhir > 0) { hargaInput.value = hargaBeliTerakhir; } 
  else { hargaInput.value = ''; }
};

window.tambahKeTabelSementara = async () => {
  const produkId = document.getElementById('inProdukId').value;
  const jml = parseInt(document.getElementById('inputJmlCepat').value);
  const harga = parseFloat(document.getElementById('inputHargaCepat').value);

  if (!produkId || !jml || !harga) return alert('Pilih produk, isi Jumlah, dan Harga dengan benar.');

  const { data: prod, error } = await supabase.from('products').select('*').eq('id', produkId).single();
  if (error || !prod) return alert('Produk tidak ditemukan di database!');

  const existingIndex = tempStokData.findIndex(item => item.id === prod.id);
  if (existingIndex !== -1) {
    tempStokData[existingIndex].jumlahBeli = jml;
    tempStokData[existingIndex].hargaBeli = harga;
  } else {
    tempStokData.push({ ...prod, jumlahBeli: jml, hargaBeli: harga });
  }
  
  renderTempStok();
  document.getElementById('inProdukId').value = '';
  document.getElementById('inputJmlCepat').value = '';
  document.getElementById('inputHargaCepat').value = '';
};

function renderTempStok() {
  const tbody = document.getElementById('tempStokTable');
  if (tempStokData.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px;">Belum ada barang.</td></tr>'; return; }
  tbody.innerHTML = tempStokData.map((item, index) => `
    <tr><td><b>${item.sku}</b></td><td>${item.nama}</td><td>${item.lokasi || '-'}</td><td>${item.jumlahBeli}</td><td>Rp ${item.hargaBeli.toLocaleString('id-ID')}</td>
    <td><button class="btn-sm red" onclick="hapusTempStok(${index})"><i class="fa-solid fa-trash"></i></button></td></tr>
  `).join('');
}

window.hapusTempStok = (index) => { tempStokData.splice(index, 1); renderTempStok(); };

window.simpanStokMassal = async () => {
  if (tempStokData.length === 0) return alert('Belum ada data untuk disimpan.');
  showLoader();
  const noPo = 'PO-' + Date.now().toString().slice(-6);
  const today = new Date().toISOString().split('T')[0];

  const { data: po, error: poErr } = await supabase.from('purchase_orders').insert({ no_po: noPo, tanggal: today, total_item: tempStokData.length }).select().single();
  if (poErr) { hideLoader(); return alert('Gagal: ' + poErr.message); }

  for (let item of tempStokData) {
    await supabase.from('po_items').insert({ po_id: po.id, product_id: item.id, jumlah: item.jumlahBeli, harga: item.hargaBeli });
    await supabase.from('products').update({ stok: item.stok + item.jumlahBeli, harga_beli: item.hargaBeli }).eq('id', item.id);
  }
  hideLoader();
  alert('Transaksi Masuk Berhasil Disimpan!');
  tempStokData = []; renderTempStok(); loadDashboard();
};

/* BARANG KELUAR */
async function loadDropdownProduk() {
  const select = document.getElementById('outProdukId');
  const { data } = await supabase.from('products').select('id, sku, nama, stok').gt('stok', 0).order('nama');
  if (!data || data.length === 0) { select.innerHTML = '<option value="">Tidak ada stok tersedia</option>'; return; }
  select.innerHTML = data.map(p => `<option value="${p.id}">${p.sku} - ${p.nama} (Sisa: ${p.stok})</option>`).join('');
}

document.getElementById('formKeluar').addEventListener('submit', async (e) => {
  e.preventDefault(); showLoader();
  const prodId = document.getElementById('outProdukId').value;
  const jml = parseInt(document.getElementById('outJumlah').value);
  const { data: prod } = await supabase.from('products').select('stok').eq('id', prodId).single();
  if (prod.stok < jml) { hideLoader(); return alert(`Gagal: Stok tidak mencukupi! Sisa: ${prod.stok}`); }

  const payload = { user_id: currentUser.id, product_id: prodId, jumlah: jml, tanggal: document.getElementById('outTanggal').value, keterangan: document.getElementById('outKet').value };
  const { error } = await supabase.from('stock_out').insert(payload);
  if (error) { hideLoader(); return alert('Gagal: ' + error.message); }

  await supabase.from('products').update({ stok: prod.stok - jml }).eq('id', prodId);
  hideLoader(); alert('Barang Keluar Berhasil Dicatat!'); e.target.reset(); loadDashboard();
});

/* MASTER DATA DLL */
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
  tbody.innerHTML = data.map((d, i) => `<tr><td>${i+1}.</td><td>${d.nama}</td><td><button class="btn-sm red" onclick="hapusMaster(${d.id}, '${tipe}')">Hapus</button></td></tr>`).join('');
}
window.hapusMaster = async (id, tipe) => { if (!confirm('Hapus data ini?')) return; await supabase.from('master_data').delete().eq('id', id); loadMasterData(tipe); };

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
      document.getElementById('prodHargaBeli').value = p.harga_beli || 0;
      document.getElementById('prodHarga').value = p.harga_jual || 0;
    });
  }
  document.getElementById('modalProduk').classList.remove('hidden');
};

document.getElementById('formProduk').addEventListener('submit', async (e) => {
  e.preventDefault(); showLoader();
  const payload = {
    sku: document.getElementById('prodSku').value, nama: document.getElementById('prodNama').value,
    merk: document.getElementById('prodMerk').value, lokasi: document.getElementById('prodLokasi').value,
    jenis: document.getElementById('prodJenis').value, ukuran: document.getElementById('prodUkuran').value,
    status: document.getElementById('prodStatus').value, harga_beli: parseFloat(document.getElementById('prodHargaBeli').value) || 0,
    harga_jual: parseFloat(document.getElementById('prodHarga').value) || 0, user_id: currentUser.id
  };

  const id = document.getElementById('prodId').value;
  let error;
  if (id) { const { error: err } = await supabase.from('products').update(payload).eq('id', id); error = err; } 
  else { payload.stok = 0; const { error: err } = await supabase.from('products').insert(payload); error = err; }

  hideLoader();
  if (error) return alert('Gagal: ' + error.message);
  closeModal('modalProduk'); loadProducts(); loadDashboard();
});

async function loadProducts() {
  const tbody = document.getElementById('tableMasterProduk');
  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Belum ada produk.</td></tr>'; return; }
  
  tbody.innerHTML = data.map(p => `
    <tr>
      <td><b>${p.sku}</b></td><td>${p.nama}</td><td>${p.lokasi || '-'}</td>
      <td><span class="badge ${p.status === 'Tersedia' ? 'success' : 'danger'}">${p.status}</span></td>
      <td>${p.stok}</td>
      <td>Rp ${(p.harga_beli || 0).toLocaleString('id-ID')}</td>
      <td>Rp ${(p.harga_jual || 0).toLocaleString('id-ID')}</td>
      <td>
        <button class="btn-sm outline" onclick="bukaDetailProduk(${p.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-sm red" onclick="hapusProduk(${p.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

window.hapusProduk = async (id) => { if (!confirm('Hapus produk ini?')) return; await supabase.from('products').delete().eq('id', id); loadProducts(); loadDashboard(); };

async function loadStokPage() {
  const tbody = document.getElementById('tableStok');
  const { data } = await supabase.from('products').select('sku, nama, lokasi, stok').order('stok', { ascending: true });
  if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada stok.</td></tr>'; return; }
  tbody.innerHTML = data.map(p => {
    const isLow = p.stok < 10;
    const badgeClass = isLow ? 'danger' : 'success';
    const icon = isLow ? '<i class="fa-solid fa-triangle-exclamation"></i> ' : '<i class="fa-solid fa-check"></i> ';
    return `<tr><td><b>${p.sku}</b></td><td>${p.nama}</td><td>${p.lokasi || '-'}</td><td><span class="badge ${badgeClass}" style="font-size: 13px; padding: 8px 14px;">${icon} ${p.stok}</span></td></tr>`;
  }).join('');
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
  tbody.innerHTML = history.map(h => `<tr><td>${new Date(h.tanggal).toLocaleDateString('id-ID')}</td><td><span class="badge ${h.tipe.includes('Masuk') ? 'success' : 'warning'}">${h.tipe}</span></td><td>${h.produk || '-'}</td><td>${h.jumlah}</td><td>${h.ket || '-'}</td></tr>`).join('');
}

/* EXPORT EXCEL */
window.exportHistoryToExcel = async () => {
  const { data: ins } = await supabase.from('purchase_orders').select('*, po_items(jumlah, products(nama))');
  const { data: outs } = await supabase.from('stock_out').select('*, products(nama)');
  let history = [];
  if (ins) ins.forEach(po => po.po_items.forEach(item => history.push({ tanggal: po.tanggal, tipe: 'Masuk (PO)', produk: item.products?.nama, jumlah: item.jumlah, ket: po.no_po, created: po.created_at })));
  if (outs) outs.forEach(o => history.push({ tanggal: o.tanggal, tipe: 'Keluar', produk: o.products?.nama, jumlah: o.jumlah, ket: o.keterangan, created: o.created_at }));
  history.sort((a, b) => new Date(b.created) - new Date(a.created));
  if (history.length === 0) return alert('Belum ada data history untuk diexport!');

  const btn = document.querySelector('#page-history .btn-primary');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses Excel...'; btn.disabled = true;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('History Transaksi');
    worksheet.columns = [
      { header: 'No', key: 'no', width: 8 }, { header: 'Tanggal', key: 'tanggal', width: 15 }, { header: 'Tipe Transaksi', key: 'tipe', width: 18 },
      { header: 'Nama Produk', key: 'produk', width: 30 }, { header: 'Jumlah (Qty)', key: 'jumlah', width: 15 }, { header: 'Keterangan / No PO', key: 'ket', width: 30 }
    ];
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    history.forEach((item, index) => {
      const row = worksheet.addRow({ no: index + 1, tanggal: new Date(item.tanggal).toLocaleDateString('id-ID'), tipe: item.tipe, produk: item.produk || '-', jumlah: item.jumlah, ket: item.ket || '-' });
      row.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 11 };
        cell.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
      if (index % 2 === 1) row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; });
      const tipeCell = row.getCell('tipe'); const jmlCell = row.getCell('jumlah');
      tipeCell.alignment = { vertical: 'middle', horizontal: 'center' }; jmlCell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (item.tipe.includes('Masuk')) {
        tipeCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF16A34A' } }; tipeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; jmlCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF16A34A' } };
      } else {
        tipeCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFDC2626' } }; tipeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; jmlCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFDC2626' } };
      }
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `History_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
  } catch (error) { alert('Gagal membuat Excel: ' + error.message); } 
  finally { btn.innerHTML = originalText; btn.disabled = false; }
};
