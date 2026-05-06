import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { useAuth } from '../../contexts/AuthContext';

export function formatPrice(amount) {
  if (amount == null) return '-';
  return Number(amount).toLocaleString();
}

export function calcDday(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return 'D-Day';
  return `D-${diff}`;
}

export function getDdayColor(endDate) {
  if (!endDate) return '#6a6a6a';
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  if (diff <= 7) return '#EF4444';
  if (diff <= 14) return '#F59E0B';
  return '#6a6a6a';
}

export default function AnnouncementCard({ announcement, onToggleFavorite }) {
  const [hov, setHov] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const a = announcement;
  const aid = a.announcementId;
  const dday = calcDday(a.applicationEndDate);
  const ddayColor = getDdayColor(a.applicationEndDate);

  const handleClick = () => navigate(`/announcements/${aid}`);

  const handleFavorite = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    onToggleFavorite?.(aid);
  };

  return (
    <div
      style={{
        cursor: 'pointer', borderRadius: 20, overflow: 'hidden', background: '#fff',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? 'var(--shadow-card)' : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={handleClick}
    >
      <div style={{
        position: 'relative', width: '100%', paddingTop: '66.67%', background: '#f2f2f2',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 44, transform: hov ? 'scale(1.03)' : 'scale(1)', transition: 'transform 0.3s',
          opacity: a.noticeStatus === 'CLOSED' ? 0.5 : 1,
        }}>
          🏢
        </div>
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <StatusBadge status={a.noticeStatus} />
        </div>
        <button
          style={{
            position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={handleFavorite}
        >
          <svg viewBox="0 0 24 24" fill={a.favorited ? 'rgba(255,56,92,0.9)' : 'none'}
            stroke="white" strokeWidth="2" width="22" height="22"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <div style={{ padding: '10px 4px 12px' }}>
        <p style={{ fontSize: 13, color: '#6a6a6a', fontWeight: 400, marginBottom: 3 }}>
          {a.providerName}{a.regionLevel1 ? ` | ${a.regionLevel1}${a.regionLevel2 ? ' ' + a.regionLevel2 : ''}` : ''}
        </p>
        <h3 style={{
          fontSize: 14, fontWeight: 600, color: '#222', lineHeight: 1.4, letterSpacing: '-0.2px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 4,
        }}>
          {a.noticeName}
        </h3>
        {(a.depositAmount != null || a.monthlyRentAmount != null) && (
          <p style={{ fontSize: 14, color: '#222', fontWeight: 500, marginBottom: 3 }}>
            {a.depositAmount != null && `보증금 ${formatPrice(a.depositAmount)}만`}
            {a.depositAmount != null && a.monthlyRentAmount != null && ' | '}
            {a.monthlyRentAmount != null && `월세 ${formatPrice(a.monthlyRentAmount)}만`}
          </p>
        )}
        {a.applicationStartDate && (
          <p style={{ fontSize: 12, color: '#6a6a6a', marginBottom: 2 }}>
            {a.applicationStartDate} ~ {a.applicationEndDate}
          </p>
        )}
        {dday && (
          <p style={{ fontSize: 12, color: ddayColor, fontWeight: 600 }}>
            마감 {dday}
          </p>
        )}
      </div>
    </div>
  );
}
