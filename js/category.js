import { supabase } from './config.js';
import { state, emit } from './state.js';
import { escHtml } from './utils.js';

export async function loadCategories() {
  const { data } = await supabase.from('categories').select('*').order('nama');
  state.categories = data || [];
  updateCategorySelects();
}

function updateCategorySelects() {
  const selectForm = document.getElementById('inputKategori');
  const selectFilter = document.getElementById('filterKategori');
  const curVal = selectForm.value, curFilter = selectFilter.value;
  selectForm.innerHTML = '<option value="">— Pilih Kategori —</option>' +
    state.categories.map(c => `<option value="${c.id}">${escHtml(c.nama)}</option>`).join('');
  selectForm.value = curVal;
  selectFilter.innerHTML = '<option value="">Semua Kategori</option>' +
    state.categories.map(c => `<option value="${c.id}">${escHtml(c.nama)}</option>`).join('');
  selectFilter.value = curFilter;
}

export function openCategoryModal() {
  renderCategoryList();
  document.getElementById('categoryModal').classList.remove('hidden');
}

export function closeCategoryModal() {
  document.getElementById('categoryModal').classList.add('hidden');
}

export function renderCategoryList() {
  const list = document.getElementById('categoryList');
  if (state.categories.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding:14px; color:#94a3b8; font-size:13px;">Belum ada kategori</div>';
    return;
  }
  list.innerHTML = state.categories.map(c => `
    <div class="list-item"><span>${escHtml(c.nama)}</span>
      <button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.id})">Hapus</button>
    </div>`).join('');
}

export async function addCategory() {
  const input = document.getElementById('newCategoryInput');
  const nama = input.value.trim();
  if (!nama) return;
  const { error } = await supabase.from('categories').insert({ nama });
  if (error) { alert('Gagal: ' + error.message); return; }
  input.value = '';
  await loadCategories();
  renderCategoryList();
  emit('categoryChanged');
}

export async function deleteCategory(id) {
  if (!confirm('Hapus kategori ini? Barang dengan kategori ini akan jadi "tanpa kategori".')) return;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) { alert('Gagal: ' + error.message); return; }
  await loadCategories();
  renderCategoryList();
  emit('categoryChanged');
}

export function initCategory() {
  document.getElementById('categoryModal').addEventListener('click', (e) => {
    if (e.target.id === 'categoryModal') closeCategoryModal();
  });
}