export function fmt(n) {
  return Number(n).toLocaleString('id-ID');
}

export function fmtDate(s) {
  if (!s) return '-';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

export function translateError(msg) {
  if (!msg) return 'Terjadi kesalahan.';
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email atau password salah.';
  if (m.includes('user already registered')) return 'Email sudah terdaftar. Gunakan email lain atau login.';
  if (m.includes('email not confirmed')) return 'Email belum diverifikasi. Cek inbox Anda.';
  if (m.includes('rate limit')) return 'Terlalu banyak percobaan. Coba lagi nanti.';
  return msg;
}

export function hideAllAlerts() {
  document.querySelectorAll('.alert').forEach(a => a.classList.add('hidden'));
}

export function showAuthView(viewId) {
  document.querySelectorAll('.auth-view').forEach(v => v.classList.add('hidden'));
  document.getElementById(viewId).classList.remove('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appScreen').classList.add('hidden');
  hideAllAlerts();
}

export function showApp() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
}