import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/common/Toast';

const S = {
  wrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', minHeight: 'calc(100vh - 144px)' },
  card: { width: '100%', maxWidth: 440 },
  title: { fontSize: 24, fontWeight: 700, color: '#222', letterSpacing: '-0.4px', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6a6a6a', marginBottom: 32, lineHeight: 1.6 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#222', marginBottom: 8 },
  input: {
    width: '100%', height: 52, padding: '0 16px', border: '1.5px solid #c1c1c1', borderRadius: 12,
    fontSize: 15, color: '#222', background: '#fff', transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  submitBtn: {
    width: '100%', height: 56, borderRadius: 12, background: '#222', border: 'none', cursor: 'pointer',
    fontSize: 16, fontWeight: 600, color: '#fff', marginTop: 8, transition: 'background 0.2s, transform 0.1s',
  },
  error: { fontSize: 13, color: '#ff385c', marginTop: 8 },
};

const focusStyle = (e) => { e.target.style.borderColor = '#222'; e.target.style.boxShadow = '0 0 0 3px rgba(34,34,34,0.08)'; };
const blurStyle = (e) => { e.target.style.borderColor = '#c1c1c1'; e.target.style.boxShadow = 'none'; };

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId || !password) { setError('아이디와 비밀번호를 입력해주세요'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });
      if (res.status === 401) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다');
        return;
      }
      if (!res.ok) {
        setError('로그인 중 오류가 발생했습니다');
        return;
      }
      const data = await res.json();
      login(data.accessToken);
      toast('로그인되었습니다');

      if (data.profileCompleted === false) {
        navigate('/profile/setup', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      setError('서버에 연결할 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h1 style={S.title}>로그인</h1>
        <p style={S.subtitle}>공공임대주택 공고를 저장하고 맞춤 추천을 받아보세요.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>아이디</label>
            <input style={S.input} type="text" placeholder="아이디를 입력하세요"
              value={loginId} onChange={e => setLoginId(e.target.value)}
              onFocus={focusStyle} onBlur={blurStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>비밀번호</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...S.input, paddingRight: 44 }}
                type={showPw ? 'text' : 'password'} placeholder="비밀번호를 입력하세요"
                value={password} onChange={e => setPassword(e.target.value)}
                onFocus={focusStyle} onBlur={blurStyle} />
              <button type="button"
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6a6a6a', display: 'flex', alignItems: 'center' }}
                onClick={() => setShowPw(s => !s)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          {error && <p style={S.error}>{error}</p>}

          <button type="submit" style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}
            onMouseEnter={e => e.currentTarget.style.background = '#111'}
            onMouseLeave={e => e.currentTarget.style.background = '#222'}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p style={{ fontSize: 14, color: '#6a6a6a', textAlign: 'center', marginTop: 24 }}>
          계정이 없으신가요? <Link to="/signup" style={{ color: '#222', fontWeight: 600 }}>회원가입</Link>
        </p>
      </div>
    </div>
  );
}
