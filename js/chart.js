import { state } from './state.js';
import { fmt } from './utils.js';

const COLORS = ['#111827', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#1F2937', '#4B5563', '#E5E7EB'];

export function renderChart() {
  const map = {};
  state.categories.forEach(c => { map[c.nama] = 0; });
  state.stockItems.forEach(d => {
    const cat = d.categories?.nama || 'Tanpa Kategori';
    map[cat] = (map[cat] || 0) + (Number(d.jml_masuk) || 0) - (Number(d.jml_keluar) || 0);
  });

  const labels = Object.keys(map);
  const values = Object.values(map);
  const bgColors = labels.map((_, i) => COLORS[i % COLORS.length]);

  if (state.chartInstance) state.chartInstance.destroy();

  state.chartInstance = new Chart(document.getElementById('stockChart'), {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['Belum ada data'],
      datasets: [{
        label: 'Stok Akhir',
        data: values.length ? values : [0],
        backgroundColor: bgColors.length ? bgColors : [COLORS[0]],
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `Stok: ${fmt(ctx.parsed.y)}` } },
      },
      scales: { y: { beginAtZero: true, ticks: { callback: (v) => fmt(v) } } },
    },
  });
}