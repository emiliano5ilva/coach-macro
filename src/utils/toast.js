const _subs = new Set();

export function showToast(message, type = 'success', options = {}) {
  const id = Date.now() + Math.random();
  const duration = options.duration || (type === 'pr' ? 5000 : 3000);
  _subs.forEach(fn => fn({ event: 'add', toast: { id, message, type, duration, action: options.action, actionLabel: options.actionLabel || 'Undo' } }));
  setTimeout(() => {
    _subs.forEach(fn => fn({ event: 'remove', id }));
  }, duration + 500);
}

export function subscribeToast(fn) {
  _subs.add(fn);
  return () => _subs.delete(fn);
}
