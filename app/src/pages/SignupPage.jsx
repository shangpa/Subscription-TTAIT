import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  hint: { fontSize: 12, color: '#6a6a6a', marginTop: 4 },
  errorHint: { fontSize: 12, color: '#ff385c', marginTop: 4 },
  submitBtn: {
    width: '100%', height: 56, borderRadius: 12, background: '#222', border: 'none', cursor: 'pointer',
    fontSize: 16, fontWeight: 600, color: '#fff', marginTop: 8, transition: 'background 0.2s',
  },
};

const focusStyle = (e) => { e.target.style.borderColor = '#222'; e.target.style.boxShadow = '0 0 0 3px rgba(34,34,34,0.08)'; };
const blurStyle = (e) => { e.target.style.borderColor = '#c1c1c1'; e.target.style.boxShadow = 'none'; };

export default function SignupPage() {
  const [form, setForm] = useState({ loginId: '', password: '', passwordConfirm: '', phone: '', email: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.loginId) errs.loginId = '아이디를 입력해주세요';
    if (!form.password) errs.password = '비밀번호를 입력해주세요';
    else if (form.password.length < 8) errs.password = '비밀번호는 8자 이상이어야 합니다';
    if (form.password !== form.passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않습니다';
    if (!form.phone) errs.phone = '휴대폰 번호를 입력해주세요';
    if (!form.email) errs.email = '이메일을 입력해주세요';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = '올바른 이메일 형식이 아닙니다';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: form.loginId, password: form.password,
          phone: form.phone, email: form.email,
        }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setServerError(data.message || '이미 사용 중인 아이디 또는 이메일입니다');
        return;
      }
      if (!res.ok) {
        setServerError('회원가입 중 오류가 발생했습니다');
        return;
      }
      const data = await res.json();
      login(data.accessToken);
      toast('회원가입이 완료되었습니다');
      navigate('/profile/setup', { replace: true });
    } catch {
      setServerError('서버에 연결할 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    ...S.input,
    borderColor: errors[field] ? '#ff385c' : '#c1c1c1',
    boxShadow: errors[field] ? '0 0 0 3px rgba(255,56,92,0.12)' : 'none',
  });

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h1 style={S.title}>회원가입</h1>
        <p style={S.subtitle}>청약알리미에 가입하고 맞춤 공고 알림을 받아보세요.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>아이디</label>
            <input style={inputStyle('loginId')} type="text" placeholder="아이디를 입력하세요" maxLength={50}
              value={form.loginId} onChange={set('loginId')} onFocus={focusStyle} onBlur={blurStyle} />
            {errors.loginId && <p style={S.errorHint}>{errors.loginId}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>비밀번호</label>
            <input style={inputStyle('password')} type="password" placeholder="비밀번호를 입력하세요" maxLength={100}
              value={form.password} onChange={set('password')} onFocus={focusStyle} onBlur={blurStyle} />
            {errors.password ? <p style={S.errorHint}>{errors.password}</p> : <p style={S.hint}>8자 이상 입력해주세요</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>비밀번호 확인</label>
            <input style={inputStyle('passwordConfirm')} type="password" placeholder="비밀번호를 다시 입력하세요"
              value={form.passwordConfirm} onChange={set('passwordConfirm')} onFocus={focusStyle} onBlur={blurStyle} />
            {errors.passwordConfirm && <p style={S.errorHint}>{errors.passwordConfirm}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>휴대폰 번호</label>
            <input style={inputStyle('phone')} type="tel" placeholder="010-0000-0000" maxLength={30}
              value={form.phone} onChange={set('phone')} onFocus={focusStyle} onBlur={blurStyle} />
            {errors.phone && <p style={S.errorHint}>{errors.phone}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>이메일</label>
            <input style={inputStyle('email')} type="email" placeholder="example@email.com" maxLength={100}
              value={form.email} onChange={set('email')} onFocus={focusStyle} onBlur={blurStyle} />
            {errors.email ? <p style={S.errorHint}>{errors.email}</p> : <p style={S.hint}>맞춤공고 알림이 이 주소로 발송됩니다</p>}
          </div>

          {serverError && <p style={{ fontSize: 13, color: '#ff385c', marginBottom: 8 }}>{serverError}</p>}

          <button type="submit" style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}
            onMouseEnter={e => e.currentTarget.style.background = '#111'}
            onMouseLeave={e => e.currentTarget.style.background = '#222'}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p style={{ fontSize: 14, color: '#6a6a6a', textAlign: 'center', marginTop: 24 }}>
          이미 계정이 있으신가요? <Link to="/login" style={{ color: '#222', fontWeight: 600 }}>로그인</Link>
        </p>
      </div>
    </div>
  );
}
