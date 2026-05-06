import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnnouncementCard from '../components/common/AnnouncementCard';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/common/Toast';
import { formatPrice, calcDday, getDdayColor } from '../components/common/AnnouncementCard';
import StatusBadge from '../components/common/StatusBadge';

const SCORE_COLOR = (score) => {
  if (score >= 80) return '#22C55E';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const api = useApi();
  const { profileCompleted } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/recommendations?page=${page - 1}&size=20`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.content || []);
          setTotalPages(data.totalPages || 0);
          setTotalCount(data.totalElements || 0);
        }
      } catch { /* handled */ }
      setLoading(false);
    };
    load();
  }, [page]);

  if (!profileCompleted) {
    return (
      <EmptyState icon="📋" title="프로필을 먼저 작성해주세요"
        description="프로필을 작성하면 맞춤 공고를 추천받을 수 있습니다."
        actionLabel="프로필 설정하기" onAction={() => navigate('/profile/setup')} />
    );
  }

  if (loading) return <LoadingSpinner />;

  const handleToggleFavorite = async (id) => {
    try {
      const item = recommendations.find(r => (r.announcement?.announcementId || r.announcementId) === id);
      const a = item?.announcement || item;
      if (a?.favorited) {
        await api.del(`/api/me/favorites/${id}`);
        toast('즐겨찾기가 해제되었습니다');
      } else {
        await api.post('/api/me/favorites', { announcementId: id });
        toast('즐겨찾기에 추가되었습니다');
      }
      setRecommendations(prev => prev.map(r => {
        const aId = r.announcement?.announcementId || r.announcementId;
        if (aId !== id) return r;
        if (r.announcement) return { ...r, announcement: { ...r.announcement, favorited: !r.announcement.favorited } };
        return { ...r, favorited: !r.favorited };
      }));
    } catch { toast('오류가 발생했습니다', 'error'); }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#222', marginBottom: 8 }}>맞춤공고 추천</h1>
      <p style={{ fontSize: 14, color: '#6a6a6a', marginBottom: 24 }}>회원님의 프로필을 기반으로 추천된 공고입니다</p>
      <p style={{ fontSize: 14, color: '#6a6a6a', marginBottom: 32 }}>
        총 <strong style={{ color: '#222' }}>{totalCount}</strong>건의 맞춤 공고
      </p>

      {recommendations.length === 0 ? (
        <EmptyState icon="🔍" title="현재 조건에 맞는 공고가 없습니다"
          description="프로필을 수정하면 더 많은 공고를 추천받을 수 있습니다."
          actionLabel="프로필 수정" onAction={() => navigate('/profile/setup')} />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {recommendations.map(rec => {
              const a = rec.announcement || rec;
              const score = rec.matchScore ?? 0;
              const maxScore = 135;
              const pct = Math.round((score / maxScore) * 100);
              const dday = calcDday(a.applicationEndDate);

              return (
                <div key={a.announcementId}
                  style={{
                    background: '#fff', borderRadius: 20, padding: 24,
                    boxShadow: 'var(--shadow-card)', cursor: 'pointer', transition: 'transform 0.2s',
                  }}
                  onClick={() => navigate(`/announcements/${a.announcementId}`)}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  {/* Score bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: SCORE_COLOR(score) }}>매칭 {score}/{maxScore}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: SCORE_COLOR(score), width: `${pct}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                    <button
                      style={{ marginLeft: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); handleToggleFavorite(a.announcementId); }}
                    >
                      <svg viewBox="0 0 24 24" fill={a.favorited ? '#ff385c' : 'none'} stroke={a.favorited ? '#ff385c' : '#c1c1c1'} strokeWidth="2" width="22" height="22">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#222', marginBottom: 8, lineHeight: 1.4 }}>{a.noticeName}</h3>
                  <p style={{ fontSize: 13, color: '#6a6a6a', marginBottom: 8 }}>
                    {a.providerName}{a.regionLevel1 ? ` | ${a.regionLevel1}${a.regionLevel2 ? ' ' + a.regionLevel2 : ''}` : ''}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                    {a.depositAmount != null && <span style={{ fontSize: 14, fontWeight: 500 }}>보증금: {formatPrice(a.depositAmount)}만원</span>}
                    {a.monthlyRentAmount != null && <span style={{ fontSize: 14, fontWeight: 500 }}>월세: {formatPrice(a.monthlyRentAmount)}만원</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a.applicationStartDate && (
                      <span style={{ fontSize: 12, color: '#6a6a6a' }}>신청: {a.applicationStartDate} ~ {a.applicationEndDate}</span>
                    )}
                    <StatusBadge status={a.noticeStatus} />
                  </div>

                  {/* Match reasons */}
                  {rec.matchReasons?.length > 0 && (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: '#f9fafb', borderRadius: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#6a6a6a', marginBottom: 8 }}>추천 이유:</p>
                      {rec.matchReasons.map((r, i) => (
                        <p key={i} style={{ fontSize: 13, color: '#222', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#22C55E' }}>&#10003;</span> {r}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
