import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const S = {
  header: { position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 24px' },
  inner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, height: 72 },
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', cursor: 'pointer', flexShrink: 0 },
  logoIcon: { width: 32, height: 32, background: '#ff385c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 20, fontWeight: 700, color: '#ff385c', letterSpacing: '-0.3px' },
  nav: { display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', flexShrink: 0 },
  navBtn: (active) => ({
    padding: '8px 16px', height: 40, border: 'none', background: active ? '#f2f2f2' : 'transparent',
    cursor: 'pointer', borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 500,
    color: active ? '#222' : '#6a6a6a', transition: 'background 0.15s',
  }),
  authBtn: {
    padding: '8px 20px', height: 40, border: 'none', background: '#222', color: '#fff',
    cursor: 'pointer', borderRadius: 8, fontSize: 14, fontWeight: 600, transition: 'background 0.2s',
  },
  logoutBtn: {
    padding: '8px 16px', height: 40, border: '1px solid #c1c1c1', background: 'transparent',
    cursor: 'pointer', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#6a6a6a',
    transition: 'border-color 0.15s',
  },
};

export default function Header() {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={S.header}>
      <div style={S.inner}>
        <Link to="/" style={S.logo}>
          <div style={S.logoIcon}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <span style={S.logoText}>청약알리미</span>
        </Link>

        <nav style={S.nav}>
          <button style={S.navBtn(false)} onClick={() => navigate('/announcements')}>공고검색</button>

          {isLoggedIn && (
            <>
              <button style={S.navBtn(false)} onClick={() => navigate('/recommendations')}>맞춤추천</button>
              <button style={S.navBtn(false)} onClick={() => navigate('/favorites')}>즐겨찾기</button>
              <button style={S.navBtn(false)} onClick={() => navigate('/mypage')}>마이페이지</button>
            </>
          )}

          {isAdmin && (
            <button style={S.navBtn(false)} onClick={() => navigate('/admin')}>관리자</button>
          )}

          {isLoggedIn ? (
            <button style={S.logoutBtn} onClick={handleLogout}>로그아웃</button>
          ) : (
            <>
              <button style={S.navBtn(false)} onClick={() => navigate('/login')}>로그인</button>
              <button style={S.authBtn} onClick={() => navigate('/signup')}
                onMouseEnter={e => e.currentTarget.style.background = '#111'}
                onMouseLeave={e => e.currentTarget.style.background = '#222'}>
                회원가입
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
