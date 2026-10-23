import { supabase } from './config.js';
import { state, emit } from './state.js';
import { fmt, fmtDate, escHtml } from './utils.js';

export async function loadStockData() {
  const { data } = await supabase
    .from('stock_items')
    .select('*, categories(nama)')
    .order('created_at', { ascending: false });
  state.stockItems = data || [];
}

export function renderStats() {
  const uniqueNames = new Set(state.stockItems.map(d => d.nama.toLowerCase().trim()));
  const totalMasuk = state.stockItems.reduce((s, d) => s + (Number(d.jml_masuk) || 0), 0);
  const totalKeluar = state.stockItems.reduce((s, d) => s + (Number(d.jml_keluar) || 0), 0);
  document.getElementById('statBarang').textContent = uniqueNames.size;
  document.getElementById('statMasuk').textContent = fmt(totalMasuk);
  document.getElementById('statKeluar').textContent = fmt(totalKeluar);
  document.getElementById('statStok').textContent = fmt(totalMasuk - totalKeluar);
}

export function renderTable() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const filterCat = document.getElementById('filterKategori').value;
  const filtered = state.stockItems.filter(d => {
    const matchQ = d.nama.toLowerCase().includes(q) || (d.keterangan || '').toLowerCase().includes(q);
    const matchCat = !filterCat || String(d.category_id) === String(filterCat);
    return matchQ && matchCat;
  });
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  tbody.innerHTML = filtered.map(d => {
    const total = (Number(d.jml_masuk) || 0) - (Number(d.jml_keluar) || 0);
    const totalClass = total > 0 ? 'pos' : total < 0 ? 'neg' : 'zero';
    return `
      <tr>
        <td><b>${escHtml(d.nama)}</b></td>
        <td>${d.categories?.nama ? `<span class="pill blue">${escHtml(d.categories.nama)}</span>` : '<span class="pill gray">-</span>'}</td>
        <td>${d.jml_masuk > 0 ? `<span class="pill green">+${fmt(d.jml_masuk)}</span>` : '<span class="pill gray">-</span>'}</td>
        <td>${d.tgl_masuk ? fmtDate(d.tgl_masuk) : '-'}</td>
        <td>${d.jml_keluar > 0 ? `<span class="pill red">-${fmt(d.jml_keluar)}</span>` : '<span class="pill gray">-</span>'}</td>
        <td>${d.tgl_keluar ? fmtDate(d.tgl_keluar) : '-'}</td>
        <td class="total-cell ${totalClass}">${total > 0 ? '+' : ''}${fmt(total)}</td>
        <td>${d.keterangan ? escHtml(d.keterangan) : '<span style="color:#cbd5e1">-</span>'}</td>
        <td><div class="actions-cell">
          <button class="btn btn-secondary btn-sm" onclick="editRow(${d.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteRow(${d.id})">🗑️</button>
        </div></td>
      </tr>`;
  }).join('');
}

export function resetForm() {
  state.editingId = null;
  document.getElementById('stockForm').reset();
  document.getElementById('inputJmlMasuk').value = 0;
  document.getElementById('inputJmlKeluar').value = 0;
  document.getElementById('inputTglMasuk').value = new Date().toISOString().slice(0, 10);
  document.getElementById('inputTglKeluar').value = '';
  document.getElementById('formTitle').textContent = 'Tambah Data Stok';
  document.getElementById('submitBtn').textContent = '💾 Simpan';
  document.getElementById('cancelBtn').classList.add('hidden');
}

export function editRow(id) {
  const rec = state.stockItems.find(d => d.id === id);
  if (!rec) return;
  state.editingId = id;
  document.getElementById('inputNama').value = rec.nama;
  document.getElementById('inputKategori').value = rec.category_id || '';
  document.getElementById('inputJmlMasuk').value = rec.jml_masuk;
  document.getElementById('inputTglMasuk').value = rec.tgl_masuk || '';
  document.getElementById('inputJmlKeluar').value = rec.jml_keluar;
  document.getElementById('inputTglKeluar').value = rec.tgl_keluar || '';
  document.getElementById('inputKet').value = rec.keterangan || '';
  document.getElementById('formTitle').textContent = 'Edit Data Stok';
  document.getElementById('submitBtn').textContent = '💾 Update';
  document.getElementById('cancelBtn').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export async function deleteRow(id) {
  if (!confirm('Yakin ingin menghapus data ini?')) return;
  const { error } = await supabase.from('stock_items').delete().eq('id', id);
  if (error) { alert('Gagal hapus: ' + error.message); return; }
  if (state.editingId === id) resetForm();
  await loadStockData();
  emit('stockChanged');
}

export function exportCSV() {
  if (state.stockItems.length === 0) return alert('Belum ada data untuk diexport.');
  const header = ['Nama Barang','Kategori','Jumlah Masuk','Tanggal Masuk','Jumlah Keluar','Tanggal Keluar','Total','Keterangan'];
  const rows = [header];
  state.stockItems.forEach(d => {
    const total = (Number(d.jml_masuk) || 0) - (Number(d.jml_keluar) || 0);
    rows.push([d.nama, d.categories?.nama || '-', d.jml_masuk, d.tgl_masuk || '-', d.jml_keluar, d.tgl_keluar || '-', total, d.keterangan || '-']);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rekap-stok-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const wasEditing = state.editingId;
  const btnLabel = wasEditing ? '💾 Update' : '💾 Simpan';

  const rec = {
    nama: document.getElementById('inputNama').value.trim(),
    category_id: document.getElementById('inputKategori').value
      ? Number(document.getElementById('inputKategori').value) : null,
    jml_masuk: Number(document.getElementById('inputJmlMasuk').value) || 0,
    tgl_masuk: document.getElementById('inputTglMasuk').value || null,
    jml_keluar: Number(document.getElementById('inputJmlKeluar').value) || 0,
    tgl_keluar: document.getElementById('inputTglKeluar').value || null,
    keterangan: document.getElementById('inputKet').value.trim() || null,
  };

  if (!rec.nama) return alert('Nama barang wajib diisi!');
  if (!rec.category_id) return alert('Pilih kategori terlebih dahulu!');
  if (rec.jml_masuk <= 0 && rec.jml_keluar <= 0) {
    return alert('Isi minimal salah satu jumlah masuk atau keluar.');
  }

  const today = new Date().toISOString().slice(0, 10);
  if (rec.jml_masuk > 0 && !rec.tgl_masuk) rec.tgl_masuk = today;
  if (rec.jml_keluar > 0 && !rec.tgl_keluar) rec.tgl_keluar = today;

  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  let error;
  if (wasEditing) {
    ({ error } = await supabase.from('stock_items').update(rec).eq('id', wasEditing));
  } else {
    rec.user_id = state.user.id;
    ({ error } = await supabase.from('stock_items').insert(rec));
  }

  btn.disabled = false;
  btn.textContent = btnLabel;

  if (error) { alert('Gagal menyimpan: ' + error.message); return; }

  resetForm();
  await loadStockData();
  emit('stockChanged');
}

export function initStock() {
  document.getElementById('stockForm').addEventListener('submit', handleSubmit);
  document.getElementById('cancelBtn').addEventListener('click', resetForm);
  document.getElementById('searchInput').addEventListener('input', renderTable);
  document.getElementById('filterKategori').addEventListener('change', renderTable);
  document.getElementById('inputTglMasuk').value = new Date().toISOString().slice(0, 10);
}