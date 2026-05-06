const STATUS_MAP = {
  OPEN: { label: '모집중', bg: '#22C55E', color: '#fff' },
  SCHEDULED: { label: '모집예정', bg: '#3B82F6', color: '#fff' },
  CLOSED: { label: '모집마감', bg: '#9CA3AF', color: '#fff' },
};

export default function StatusBadge({ status, style }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.CLOSED;
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color, ...style,
    }}>
      {cfg.label}
    </span>
  );
}
