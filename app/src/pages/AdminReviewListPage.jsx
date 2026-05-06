import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const TABS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '대기중' },
  { value: 'APPROVED', label: '승인' },
  { value: 'CORRECTED', label: '수정확정' },
  { value: 'REJECTED', label: '거절' },
  { value: 'RE_IMPORT', label: '재수집' },
];

const STATUS_COLORS = {
  PENDING: { bg: '#FFFBEB', color: '#F59E0B' },
  APPROVED: { bg: '#F0FDF4', color: '#22C55E' },
  CORRECTED: { bg: '#EFF6FF', color: '#3B82F6' },
  REJECTED: { bg: '#FEF2F2', color: '#EF4444' },
  RE_IMPORT: { bg: '#FAF5FF', color: '#8B5CF6' },
};

export default function AdminReviewListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const api = useApi();

  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = searchParams.get('status');
    if (s !== null) setStatus(s);
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page - 1));
        params.set('size', '20');
        if (status) params.set('status', status);
        const res = await api.get(`/api/admin/review?${params}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.content || []);
          setTotalPages(data.totalPages || 0);
        }
      } catch { /* handled */ }
      setLoading(false);
    };
    load();
  }, [page, status]);

  const changeStatus = (s) => {
    setStatus(s);
    setPage(1);
    navigate(`/admin/review${s ? `?status=${s}` : ''}`, { replace: true });
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#222', marginBottom: 24 }}>AI 파싱 검수</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button key={tab.value} onClick={() => changeStatus(tab.value)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: status === tab.value ? 600 : 400,
              background: status === tab.value ? '#222' : '#f2f2f2',
              color: status === tab.value ? '#fff' : '#6a6a6a',
              transition: 'all 0.15s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : reviews.length === 0 ? (
        <EmptyState icon="📋" title="검수 항목이 없습니다" />
      ) : (
        <>
          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.08)' }}>
                  {['ID', '공고명', '상태', '검수자', '처리일시'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#6a6a6a', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => {
                  const sc = STATUS_COLORS[r.reviewStatus] || { bg: '#f2f2f2', color: '#6a6a6a' };
                  return (
                    <tr key={r.announcementId || r.id}
                      onClick={() => navigate(`/admin/review/${r.announcementId || r.id}`)}
                      style={{
                        borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer',
                        background: r.reviewStatus === 'PENDING' ? '#FFFDF5' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = r.reviewStatus === 'PENDING' ? '#FFFDF5' : 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#6a6a6a' }}>{r.announcementId || r.id}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500, color: '#222', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.noticeName || '-'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                          {r.reviewStatus}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#6a6a6a' }}>{r.reviewedBy || '-'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6a6a6a' }}>
                        {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString('ko-KR') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
