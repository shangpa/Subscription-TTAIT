export default function EmptyState({ icon = '📭', title, description, actionLabel, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#222', marginBottom: 8 }}>{title}</h3>
      {description && <p style={{ fontSize: 14, color: '#6a6a6a', lineHeight: 1.7, marginBottom: 24 }}>{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} style={{
          padding: '12px 28px', borderRadius: 12, background: '#ff385c', color: '#fff',
          fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#e00b41'}
          onMouseLeave={e => e.currentTarget.style.background = '#ff385c'}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
