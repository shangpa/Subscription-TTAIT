import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import StatusBadge from '../components/common/StatusBadge';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/common/Toast';
import { formatPrice, calcDday, getDdayColor } from '../components/common/AnnouncementCard';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);

  const api = useApi();
  const navigate = useNavigate();
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/me/favorites?page=${page - 1}&size=20`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalCount(data.totalElements || 0);
      }
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const removeFavorite = async (id) => {
    try {
      await api.del(`/api/me/favorites/${id}`);
      toast('즐겨찾기가 해제되었습니다');
      setConfirmId(null);
      setFavorites(prev => prev.filter(f => (f.announcement?.announcementId || f.announcementId) !== id));
      setTotalCount(prev => prev - 1);
    } catch { toast('오류가 발생했습니다', 'error'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#222', marginBottom: 8 }}>즐겨찾기</h1>
      <p style={{ fontSize: 14, color: '#6a6a6a', marginBottom: 32 }}>
        총 <strong style={{ color: '#222' }}>{totalCount}</strong>건
      </p>

      {favorites.length === 0 ? (
        <EmptyState icon="💛" title="즐겨찾기한 공고가 없습니다"
          description="관심 있는 공고를 즐겨찾기하면 마감일 알림을 받을 수 있습니다."
          actionLabel="공고 검색하기" onAction={() => navigate('/announcements')} />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {favorites.map(fav => {
              const a = fav.announcement || fav;
              const aid = a.announcementId;
              const dday = calcDday(a.applicationEndDate);
              const ddayColor = getDdayColor(a.applicationEndDate);

              return (
                <div key={aid} style={{
                  background: '#fff', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)',
                  transition: 'transform 0.2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/announcements/${aid}`)}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#222', marginBottom: 8, lineHeight: 1.4 }}>{a.noticeName}</h3>
                      <p style={{ fontSize: 13, color: '#6a6a6a', marginBottom: 8 }}>
                        {a.providerName}{a.regionLevel1 ? ` | ${a.regionLevel1}${a.regionLevel2 ? ' ' + a.regionLevel2 : ''}` : ''}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                        {a.depositAmount != null && <span style={{ fontSize: 14, fontWeight: 500 }}>보증금: {formatPrice(a.depositAmount)}만원</span>}
                        {a.monthlyRentAmount != null && <span style={{ fontSize: 14, fontWeight: 500 }}>월세: {formatPrice(a.monthlyRentAmount)}만원</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        {a.applicationEndDate && <span style={{ fontSize: 12, color: '#6a6a6a' }}>마감: {a.applicationEndDate}</span>}
                        <StatusBadge status={a.noticeStatus} />
                        {dday && <span style={{ fontSize: 12, fontWeight: 600, color: ddayColor }}>{dday}</span>}
                      </div>
                      {fav.favoritedAt && (
                        <p style={{ fontSize: 12, color: '#6a6a6a' }}>즐겨찾기 추가일: {fav.favoritedAt.split('T')[0]}</p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                    <button onClick={() => navigate(`/announcements/${aid}`)}
                      style={{
                        padding: '10px 20px', borderRadius: 12, border: '1px solid #c1c1c1', background: '#fff',
                        fontSize: 14, fontWeight: 500, color: '#222', cursor: 'pointer',
                      }}>
                      공고 상세보기
                    </button>
                    {confirmId === aid ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => removeFavorite(aid)}
                          style={{
                            padding: '10px 16px', borderRadius: 12, border: 'none', background: '#ff385c',
                            fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
                          }}>확인</button>
                        <button onClick={() => setConfirmId(null)}
                          style={{
                            padding: '10px 16px', borderRadius: 12, border: '1px solid #c1c1c1', background: '#fff',
                            fontSize: 14, fontWeight: 500, color: '#6a6a6a', cursor: 'pointer',
                          }}>취소</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(aid)}
                        style={{
                          padding: '10px 20px', borderRadius: 12, border: '1px solid #ff385c', background: '#fff',
                          fontSize: 14, fontWeight: 500, color: '#ff385c', cursor: 'pointer',
                        }}>
                        즐겨찾기 해제
                      </button>
                    )}
                  </div>
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
