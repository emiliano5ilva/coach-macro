import { ERROR_MESSAGES, getErrorMessage } from "./errors.js";
export { ERROR_MESSAGES, getErrorMessage, getAIErrorMessage } from "./errors.js";

export function ErrorMessage({ error, onAction, style }) {
  if (!error) return null;

  const msg = typeof error === 'string'
    ? (ERROR_MESSAGES[error] || ERROR_MESSAGES.unknown)
    : getErrorMessage(error);

  return (
    <div style={{
      background: 'rgba(232,52,28,0.08)',
      border: '1px solid rgba(232,52,28,0.25)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style,
    }}>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
        {msg.title}
      </div>
      <div style={{ color: 'rgba(245,245,240,0.65)', fontSize: 13, lineHeight: 1.55, fontFamily: 'inherit' }}>
        {msg.message}
      </div>
      {msg.action && onAction && (
        <button onClick={onAction} style={{
          background: 'none', border: 'none', color: '#e8341c',
          fontWeight: 600, fontSize: 13, cursor: 'pointer',
          fontFamily: 'inherit', padding: 0, textAlign: 'left', marginTop: 2,
        }}>
          {msg.action} →
        </button>
      )}
    </div>
  );
}
