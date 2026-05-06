const S = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '32px 0' },
  btn: (active, disabled) => ({
    width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: disabled ? 'default' : 'pointer',
    fontSize: 14, fontWeight: active ? 700 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? '#222' : 'transparent', color: active ? '#fff' : disabled ? '#c1c1c1' : '#222',
    transition: 'background 0.15s',
  }),
};

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div style={S.wrap}>
      <button style={S.btn(false, page === 1)} disabled={page === 1}
        onClick={() => onPageChange(page - 1)}>{'\u2039'}</button>
      {pages.map(n => (
        <button key={n} style={S.btn(n === page, false)}
          onClick={() => onPageChange(n)}>{n}</button>
      ))}
      <button style={S.btn(false, page === totalPages)} disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}>{'\u203A'}</button>
    </div>
  );
}
