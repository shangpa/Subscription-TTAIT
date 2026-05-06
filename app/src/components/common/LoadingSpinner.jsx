export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', minHeight: 300 }}>
      <div style={{
        width: 40, height: 40, border: '3px solid #f2f2f2', borderTop: '3px solid #ff385c',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
