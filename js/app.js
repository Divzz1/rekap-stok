import { state, on } from './state.js';
import { showApp, showAuthView } from './utils.js';
import { initAuth, logout, updateUserUI } from './auth.js';
import {
  loadCategories, initCategory, openCategoryModal, closeCategoryModal,
  addCategory, deleteCategory,
} from './category.js';
import {
  loadStockData, initStock, renderStats, renderTable, resetForm,
  editRow, deleteRow, exportCSV,
} from './stock.js';
import { renderChart } from './chart.js';

/* Expose fungsi ke window agar bisa dipanggil dari inline onclick di HTML */
window.logout = logout;
window.editRow = editRow;
window.deleteRow = deleteRow;
window.resetForm = resetForm;
window.exportCSV = exportCSV;
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;

function render() {
  renderStats();
  renderChart();
  renderTable();
}

async function loadAppData() {
  const loading = document.getElementById('loadingState');
  const empty = document.getElementById('emptyState');
  loading.classList.remove('hidden');
  empty.classList.add('hidden');
  await Promise.all([loadCategories(), loadStockData()]);
  loading.classList.add('hidden');
  render();
}

// Subscribe ke perubahan data
on('stockChanged', render);
on('categoryChanged', render);

// Init modul
initStock();
initCategory();

// Init auth + flow utama
initAuth({
  onLogin: async () => {
    updateUserUI();
    showApp();
    resetForm();
    await loadAppData();
  },
  onLogout: () => {
    showAuthView('loginView');
  },
  onRecovery: () => {
    showAuthView('resetView');
  },
});

// Expose showAuthView untuk link "Lupa password / Buat akun" di HTML
window.showAuthView = showAuthView;