import { supabase } from './config.js';
import { state } from './state.js';
import { showAuthView, translateError, hideAllAlerts } from './utils.js';

async function loadProfile() {
  if (!state.user) return;
  const { data } = await supabase
    .from('profiles')
    .select('nama')
    .eq('id', state.user.id)
    .maybeSingle();
  state.profile = data;
}

export function updateUserUI() {
  const name = state.profile?.nama || state.user?.email?.split('@')[0] || 'User';
  document.getElementById('userName').textContent = name;
  document.getElementById('userEmail').textContent = state.user?.email || '';
}

export async function logout() {
  if (!confirm('Yakin ingin logout?')) return;
  await supabase.auth.signOut();
}

function btnLoading(btn, loadingText) {
  btn.dataset.original = btn.textContent;
  btn.disabled = true;
  btn.textContent = loadingText;
}
function btnRestore(btn) {
  btn.disabled = false;
  btn.textContent = btn.dataset.original;
}

export function initAuth({ onLogin, onLogout, onRecovery }) {
  // LOGIN
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const err = document.getElementById('loginError');
    err.classList.add('hidden');
    btnLoading(btn, 'Memuat...');
    const { error } = await supabase.auth.signInWithPassword({
      email: document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPass').value,
    });
    btnRestore(btn);
    if (error) { err.textContent = translateError(error.message); err.classList.remove('hidden'); }
  });

  // SIGNUP
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('signupBtn');
    const err = document.getElementById('signupError');
    const ok = document.getElementById('signupSuccess');
    err.classList.add('hidden'); ok.classList.add('hidden');
    btnLoading(btn, 'Memuat...');
    const nama = document.getElementById('signupNama').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPass').value;
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { nama } },
    });
    btnRestore(btn);
    if (error) { err.textContent = translateError(error.message); err.classList.remove('hidden'); return; }
    if (data.user && !data.session) {
      ok.textContent = '✓ Akun berhasil dibuat! Cek email verifikasi, lalu login.';
      ok.classList.remove('hidden');
      setTimeout(() => showAuthView('loginView'), 3500);
    }
  });

  // FORGOT
  document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('forgotBtn');
    const err = document.getElementById('forgotError');
    const ok = document.getElementById('forgotSuccess');
    err.classList.add('hidden'); ok.classList.add('hidden');
    btnLoading(btn, 'Mengirim...');
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.resetPasswordForEmail(
      document.getElementById('forgotEmail').value.trim(), { redirectTo }
    );
    btnRestore(btn);
    if (error) { err.textContent = translateError(error.message); err.classList.remove('hidden'); }
    else { ok.textContent = '✓ Link reset dikirim. Cek email (termasuk spam).'; ok.classList.remove('hidden'); }
  });

  // RESET
  document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('resetBtn');
    const err = document.getElementById('resetError');
    const ok = document.getElementById('resetSuccess');
    err.classList.add('hidden'); ok.classList.add('hidden');
    const pass = document.getElementById('resetPass').value;
    const confirm = document.getElementById('resetPassConfirm').value;
    if (pass !== confirm) { err.textContent = 'Password dan konfirmasi tidak sama!'; err.classList.remove('hidden'); return; }
    if (pass.length < 6) { err.textContent = 'Password minimal 6 karakter.'; err.classList.remove('hidden'); return; }
    btnLoading(btn, 'Menyimpan...');
    const { error } = await supabase.auth.updateUser({ password: pass });
    btnRestore(btn);
    if (error) { err.textContent = translateError(error.message); err.classList.remove('hidden'); return; }
    ok.textContent = '✓ Password berhasil diubah! Silakan login kembali.';
    ok.classList.remove('hidden');
    state.recoveryMode = false;
    history.replaceState(null, '', window.location.pathname);
    setTimeout(async () => { await supabase.auth.signOut(); showAuthView('loginView'); }, 2000);
  });

  // AUTH STATE
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') { state.recoveryMode = true; onRecovery(); return; }
    if (event === 'SIGNED_OUT') {
      state.user = null; state.profile = null; state.recoveryMode = false;
      onLogout(); return;
    }
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
      if (state.recoveryMode) { onRecovery(); return; }
      state.user = session.user;
      loadProfile().then(() => { updateUserUI(); onLogin(); });
    } else if (!session && !state.recoveryMode) {
      onLogout();
    }
  });
}