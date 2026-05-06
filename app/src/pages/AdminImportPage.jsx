import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/common/Toast';

const S = {
  container: { maxWidth: 700, margin: '0 auto', padding: '32px 24px 80px' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
    border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#6a6a6a', marginBottom: 16,
  },
  card: { background: '#fff', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-card)' },
  desc: { fontSize: 14, color: '#6a6a6a', lineHeight: 1.7, marginBottom: 24 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#222', marginBottom: 8 },
  input: {
    width: 120, height: 48, padding: '0 16px', border: '1.5px solid #c1c1c1', borderRadius: 12,
    fontSize: 14, color: '#222', background: '#fff', textAlign: 'center',
  },
  row: { display: 'flex', gap: 24, marginBottom: 32 },
  startBtn: {
    width: '100%', height: 56, borderRadius: 12, border: 'none', background: '#222', color: '#fff',
    fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
  },
  progress: { width: '100%', height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 12 },
  progressBar: { height: '100%', borderRadius: 4, background: '#ff385c', transition: 'width 0.3s' },
  result: {
    padding: 20, borderRadius: 12, textAlign: 'center', marginTop: 24,
  },
};

export default function AdminImportPage() {
  const [pageNum, setPageNum] = useState(1);
  const [size, setSize] = useState(10);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [resultCount, setResultCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const api = useApi();
  const toast = useToast();

  const handleStart = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await api.post(`/api/admin/import/lh?page=${pageNum}&size=${size}`);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setResultCount(data.count ?? data.imported ?? size);
        setStatus('success');
        toast('수집이 완료되었습니다');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || '수집에 실패했습니다');
        setStatus('error');
      }
    } catch {
      setErrorMsg('서버에 연결할 수 없습니다');
      setStatus('error');
    }
  };

  return (
    <div style={S.container}>
      <button style={S.backBtn} onClick={() => navigate('/admin')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#6a6a6a" strokeWidth="2" width="16" height="16"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        관리자 대시보드
      </button>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#222', marginBottom: 32 }}>LH 공고 수집</h1>

      <div style={S.card}>
        <p style={S.desc}>
          LH API에서 공고 데이터를 수집하고 AI 파싱을 실행합니다.<br />
          수집된 공고는 검수 대기 목록에 자동 추가됩니다.
        </p>

        <div style={S.row}>
          <div>
            <label style={S.label}>페이지 번호</label>
            <input style={S.input} type="number" min="1" value={pageNum}
              onChange={e => setPageNum(Number(e.target.value))} />
          </div>
          <div>
            <label style={S.label}>수집 건수</label>
            <input style={S.input} type="number" min="1" max="50" value={size}
              onChange={e => setSize(Number(e.target.value))} />
          </div>
        </div>

        {status === 'idle' && (
          <button style={S.startBtn} onClick={handleStart}
            onMouseEnter={e => e.currentTarget.style.background = '#111'}
            onMouseLeave={e => e.currentTarget.style.background = '#222'}>
            수집 시작
          </button>
        )}

        {status === 'loading' && (
          <div>
            <div style={S.progress}>
              <div style={{ ...S.progressBar, width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
            <p style={{ fontSize: 14, color: '#6a6a6a', textAlign: 'center' }}>
              LH API에서 공고를 가져오고 있습니다. 잠시 기다려주세요.
            </p>
            <style>{`@keyframes pulse { 0%,100% { width: 30%; } 50% { width: 80%; } }`}</style>
          </div>
        )}

        {status === 'success' && (
          <div style={{ ...S.result, background: '#F0FDF4' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#22C55E', marginBottom: 8 }}>
              &#10003; 수집 완료! {resultCount}건의 공고가 수집되었습니다.
            </p>
            <button onClick={() => navigate('/admin/review?status=PENDING')}
              style={{
                padding: '12px 24px', borderRadius: 12, border: 'none', background: '#222',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8,
              }}>
              검수 목록 보기
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ ...S.result, background: '#FEF2F2' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#EF4444', marginBottom: 12 }}>{errorMsg}</p>
            <button onClick={() => setStatus('idle')}
              style={{
                padding: '10px 20px', borderRadius: 12, border: '1px solid #c1c1c1', background: '#fff',
                fontSize: 14, fontWeight: 500, color: '#222', cursor: 'pointer',
              }}>
              다시 시도
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
