export const state = {
  user: null,
  profile: null,
  categories: [],
  stockItems: [],
  editingId: null,
  chartInstance: null,
  recoveryMode: false,
};

// Simple event bus untuk komunikasi antar modul
const bus = new EventTarget();
export function emit(name, detail) { bus.dispatchEvent(new CustomEvent(name, { detail })); }
export function on(name, fn) { bus.addEventListener(name, (e) => fn(e.detail)); }