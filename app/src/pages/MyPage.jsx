import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getCategoryLabel } from '../components/common/CategoryTag';
import { formatPrice } from '../components/common/AnnouncementCard';

const S = {
  container: { maxWidth: 800, margin: '0 auto', padding: '32px 24px 80px' },
  title: { fontSize: 26, fontWeight: 700, color: '#222', marginBottom: 32 },
  card: {
    background: '#fff', borderRadius: 20, padding: 28, marginBottom: 20,
    boxShadow: 'var(--shadow-card)',
  },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#222', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.08)' },
  infoRow: { display: 'flex', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' },
  infoLabel: { width: 120, fontSize: 13, color: '#6a6a6a', flexShrink: 0 },
  infoValue: { fontSize: 14, fontWeight: 500, color: '#222' },
  editBtn: {
    display: 'block', margin: '16px auto 0', padding: '10px 24px', borderRadius: 12,
    border: '1px solid #c1c1c1', background: '#fff', fontSize: 14, fontWeight: 500,
    color: '#222', cursor: 'pointer', transition: 'border-color 0.15s',
  },
  linkCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
    borderRadius: 12, background: '#f9fafb', cursor: 'pointer', marginBottom: 8,
    transition: 'background 0.15s',
  },
  logoutBtn: {
    width: '100%', height: 48, borderRadius: 12, border: '1px solid #c1c1c1', background: '#fff',
    fontSize: 15, fontWeight: 500, color: '#6a6a6a', cursor: 'pointer', marginTop: 24,
  },
};

const MARITAL_LABELS = { SINGLE: '미혼', MARRIED: '기혼', OTHER: '기타' };

export default function MyPage() {
  const { user, logout, profileCompleted } = useAuth();
  const api = useApi();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/me');
        if (res.ok) setProfile(await res.json());
      } catch { /* handled */ }
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <LoadingSpinner />;

  const p = profile || {};

  return (
    <div style={S.container}>
      <h1 style={S.title}>마이페이지</h1>

      {/* Account Info */}
      <div style={S.card}>
        <h2 style={S.cardTitle}>계정 정보</h2>
        {[
          ['아이디', p.loginId],
          ['이메일', p.email],
          ['휴대폰', p.phone],
        ].map(([l, v]) => (
          <div key={l} style={S.infoRow}>
            <span style={S.infoLabel}>{l}</span>
            <span style={S.infoValue}>{v || '-'}</span>
          </div>
        ))}
      </div>

      {/* Profile Summary */}
      <div style={S.card}>
        <h2 style={S.cardTitle}>내 프로필 요약</h2>

        {!profileCompleted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 14, color: '#6a6a6a', marginBottom: 16 }}>프로필을 작성해주세요</p>
            <button onClick={() => navigate('/profile/setup')}
              style={{
                padding: '12px 28px', borderRadius: 12, background: '#ff385c', color: '#fff',
                fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>
              프로필 설정하기
            </button>
          </div>
        ) : (
          <>
            {[
              ['나이', p.age ? `${p.age}세` : '-'],
              ['결혼 상태', MARITAL_LABELS[p.maritalStatus] || '-'],
              ['자녀 수', p.childrenCount != null ? `${p.childrenCount}명` : '-'],
              ['무주택자', p.isHomeless ? '예' : '아니오'],
            ].map(([l, v]) => (
              <div key={l} style={S.infoRow}>
                <span style={S.infoLabel}>{l}</span>
                <span style={S.infoValue}>{v}</span>
              </div>
            ))}

            {p.categories?.length > 0 && (
              <div style={S.infoRow}>
                <span style={S.infoLabel}>카테고리</span>
                <span style={S.infoValue}>{p.categories.map(c => getCategoryLabel(c)).join(', ')}</span>
              </div>
            )}

            {[
              ['선호 지역', [p.preferredRegionLevel1, p.preferredRegionLevel2].filter(Boolean).join(' ') || '-'],
              ['최대 보증금', p.maxDeposit != null ? `${formatPrice(p.maxDeposit)}만원` : '-'],
              ['최대 월세', p.maxMonthlyRent != null ? `${formatPrice(p.maxMonthlyRent)}만원` : '-'],
            ].map(([l, v]) => (
              <div key={l} style={S.infoRow}>
                <span style={S.infoLabel}>{l}</span>
                <span style={S.infoValue}>{v}</span>
              </div>
            ))}

            <button style={S.editBtn} onClick={() => navigate('/profile/setup')}>프로필 수정</button>
          </>
        )}
      </div>

      {/* Quick Links */}
      <div style={S.card}>
        <h2 style={S.cardTitle}>바로가기</h2>
        {[
          ['맞춤공고 추천', '/recommendations'],
          ['즐겨찾기 목록', '/favorites'],
        ].map(([label, path]) => (
          <div key={label} style={S.linkCard} onClick={() => navigate(path)}
            onMouseEnter={e => e.currentTarget.style.background = '#f2f2f2'}
            onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#222' }}>{label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="#6a6a6a" strokeWidth="2" width="16" height="16">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        ))}
      </div>

      <button style={S.logoutBtn} onClick={handleLogout}>로그아웃</button>
    </div>
  );
}
