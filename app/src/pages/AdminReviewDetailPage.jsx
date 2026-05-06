import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const S = {
  container: { maxWidth: 1000, margin: '0 auto', padding: '32px 24px 80px' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
    border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#6a6a6a', marginBottom: 16,
  },
  card: { background: '#fff', borderRadius: 20, padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-card)' },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#222', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.08)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#222', marginBottom: 8 },
  value: { fontSize: 14, color: '#222', fontWeight: 500, marginBottom: 16 },
  input: {
    width: '100%', height: 44, padding: '0 12px', border: '1.5px solid #c1c1c1', borderRadius: 12,
    fontSize: 14, color: '#222', background: '#fff',
  },
  select: {
    width: '100%', height: 44, padding: '0 12px', border: '1.5px solid #c1c1c1', borderRadius: 12,
    fontSize: 14, color: '#222', background: '#fff', cursor: 'pointer',
  },
  textarea: {
    width: '100%', height: 80, padding: '12px', border: '1.5px solid #c1c1c1', borderRadius: 12,
    fontSize: 14, color: '#222', background: '#fff', resize: 'vertical',
  },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 },
  radioLabel: (sel) => ({
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', borderRadius: 12,
    border: `1.5px solid ${sel ? '#222' : '#c1c1c1'}`, background: sel ? '#f9fafb' : '#fff',
    cursor: 'pointer', transition: 'all 0.15s',
  }),
  submitBtn: {
    padding: '14px 32px', borderRadius: 12, border: 'none', background: '#222', color: '#fff',
    fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
  },
};

const ACTIONS = [
  { value: 'APPROVE', label: '승인 (APPROVE)', desc: 'AI 결과가 정확합니다' },
  { value: 'CORRECT', label: '수정 (CORRECT)', desc: '아래에서 필드를 수정합니다' },
  { value: 'REJECT', label: '거절 (REJECT)', desc: '공고 부적합 또는 파싱 품질 불량' },
  { value: 'REIMPORT', label: '재수집 (REIMPORT)', desc: 'LH API에서 다시 수집합니다' },
];

const MARITAL_OPTIONS = [
  { value: 'ANY', label: 'ANY (무관)' },
  { value: 'SINGLE', label: 'SINGLE (미혼)' },
  { value: 'MARRIED', label: 'MARRIED (기혼)' },
  { value: 'ENGAGED', label: 'ENGAGED (예비신혼)' },
  { value: 'NEWLYWED', label: 'NEWLYWED (신혼)' },
];

export default function AdminReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [corrections, setCorrections] = useState({
    ageMin: '', ageMax: '', maritalTargetType: 'ANY', marriageYearLimit: '',
    homelessRequired: false, lowIncomeRequired: false, elderlyRequired: false,
    elderlyAgeMin: '65', childrenMinCount: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/admin/review/${id}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
          setCorrections({
            ageMin: d.ageMin ?? '',
            ageMax: d.ageMax ?? '',
            maritalTargetType: d.maritalTargetType || 'ANY',
            marriageYearLimit: d.marriageYearLimit ?? '',
            homelessRequired: d.homelessRequired ?? false,
            lowIncomeRequired: d.lowIncomeRequired ?? false,
            elderlyRequired: d.elderlyRequired ?? false,
            elderlyAgeMin: d.elderlyAgeMin ?? '65',
            childrenMinCount: d.childrenMinCount ?? '',
          });
        }
      } catch { /* handled */ }
      setLoading(false);
    };
    load();
  }, [id]);

  const setCorr = (key, val) => setCorrections(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!action) { toast('검수 액션을 선택해주세요', 'error'); return; }
    if ((action === 'CORRECT' || action === 'REJECT') && !memo.trim()) {
      toast('검수 메모를 입력해주세요', 'error'); return;
    }

    setSubmitting(true);
    try {
      const body = { action, note: memo.trim() || null };
      if (action === 'CORRECT') {
        body.corrections = {
          ...corrections,
          ageMin: corrections.ageMin ? Number(corrections.ageMin) : null,
          ageMax: corrections.ageMax ? Number(corrections.ageMax) : null,
          marriageYearLimit: corrections.marriageYearLimit ? Number(corrections.marriageYearLimit) : null,
          elderlyAgeMin: corrections.elderlyAgeMin ? Number(corrections.elderlyAgeMin) : null,
          childrenMinCount: corrections.childrenMinCount ? Number(corrections.childrenMinCount) : null,
        };
      }
      const res = await api.post(`/api/admin/review/${id}`, body);
      if (res.ok) {
        toast('검수 처리가 완료되었습니다');
        navigate('/admin/review');
      } else {
        toast('검수 처리에 실패했습니다', 'error');
      }
    } catch {
      toast('서버 오류가 발생했습니다', 'error');
    }
    setSubmitting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <div style={{ textAlign: 'center', padding: 80, color: '#6a6a6a' }}>검수 데이터를 찾을 수 없습니다.</div>;

  // Build raw text from individual raw fields
  const rawTextParts = [
    data.eligibilityRaw && `[자격조건]\n${data.eligibilityRaw}`,
    data.ageRawText && `[나이조건]\n${data.ageRawText}`,
    data.maritalRawText && `[혼인조건]\n${data.maritalRawText}`,
    data.childrenRawText && `[자녀조건]\n${data.childrenRawText}`,
    data.homelessRawText && `[무주택조건]\n${data.homelessRawText}`,
    data.incomeAssetCriteriaRaw && `[소득/자산기준]\n${data.incomeAssetCriteriaRaw}`,
    data.elderlyRawText && `[고령자조건]\n${data.elderlyRawText}`,
    data.specialSupplyRaw && `[특별공급]\n${data.specialSupplyRaw}`,
    data.depositMonthlyRentRaw && `[보증금/월세]\n${data.depositMonthlyRentRaw}`,
    data.supplyHouseholdCountRaw && `[공급세대수]\n${data.supplyHouseholdCountRaw}`,
  ].filter(Boolean).join('\n\n');

  return (
    <div style={S.container}>
      <button style={S.backBtn} onClick={() => navigate('/admin/review')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#6a6a6a" strokeWidth="2" width="16" height="16"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        검수 목록
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#222', marginBottom: 8 }}>
        공고 검수 - ID: {id}
      </h1>
      <p style={{ fontSize: 14, color: '#6a6a6a', marginBottom: 4 }}>공고명: {data.noticeName || '-'}</p>
      <p style={{ fontSize: 14, color: '#6a6a6a', marginBottom: 4 }}>기관: {data.providerName || '-'} | 지역: {data.regionLevel1 || '-'}</p>
      <p style={{ fontSize: 14, color: '#6a6a6a', marginBottom: 24 }}>
        현재 상태: <span style={{ fontWeight: 600, color: '#222' }}>{data.reviewStatus}</span>
      </p>

      {/* AI Parsed Result vs Raw Text */}
      <div style={S.card}>
        <h2 style={S.cardTitle}>AI 파싱 결과</h2>
        <div style={S.grid2}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#222' }}>파싱된 조건</h3>
            {[
              ['보증금', data.depositAmount != null ? `${Number(data.depositAmount).toLocaleString()}만원` : null],
              ['월세', data.monthlyRentAmount != null ? `${Number(data.monthlyRentAmount).toLocaleString()}만원` : null],
              ['공급 세대수', data.supplyHouseholdCount != null ? `${data.supplyHouseholdCount}세대` : null],
              ['세대수 신뢰도', data.supplyHouseholdCountConfidence],
              ['최소 나이', data.ageMin],
              ['최대 나이', data.ageMax],
              ['혼인 조건', data.maritalTargetType],
              ['혼인 기간 제한', data.marriageYearLimit ? `${data.marriageYearLimit}년` : null],
              ['무주택 필수', data.homelessRequired ? '예' : '아니오'],
              ['저소득 필수', data.lowIncomeRequired ? '예' : '아니오'],
              ['고령자 필수', data.elderlyRequired ? '예' : '아니오'],
              ['고령자 기준나이', data.elderlyAgeMin ? `${data.elderlyAgeMin}세` : null],
              ['최소 자녀수', data.childrenMinCount],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span style={{ width: 120, fontSize: 13, color: '#6a6a6a', flexShrink: 0 }}>{l}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#222' }}>{v ?? '-'}</span>
              </div>
            ))}
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#222' }}>원문 텍스트</h3>
            <div style={{ fontSize: 13, color: '#6a6a6a', lineHeight: 1.8, whiteSpace: 'pre-wrap', background: '#f9fafb', padding: 16, borderRadius: 12, maxHeight: 400, overflow: 'auto' }}>
              {rawTextParts || '원문 텍스트 없음'}
            </div>
          </div>
        </div>
      </div>

      {/* Review Action */}
      <div style={S.card}>
        <h2 style={S.cardTitle}>검수 액션</h2>

        <div style={S.radioGroup}>
          {ACTIONS.map(a => (
            <label key={a.value} style={S.radioLabel(action === a.value)} onClick={() => setAction(a.value)}>
              <input type="radio" name="action" checked={action === a.value} onChange={() => setAction(a.value)} style={{ marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>{a.label}</p>
                <p style={{ fontSize: 12, color: '#6a6a6a' }}>{a.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Correction form */}
        {action === 'CORRECT' && (
          <div style={{ padding: 20, background: '#f9fafb', borderRadius: 16, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={S.label}>최소 나이</label>
                <input style={S.input} type="number" value={corrections.ageMin} onChange={e => setCorr('ageMin', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>최대 나이</label>
                <input style={S.input} type="number" value={corrections.ageMax} onChange={e => setCorr('ageMax', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>혼인 조건</label>
                <select style={S.select} value={corrections.maritalTargetType} onChange={e => setCorr('maritalTargetType', e.target.value)}>
                  {MARITAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>혼인 기간 제한 (년)</label>
                <input style={S.input} type="number" value={corrections.marriageYearLimit} onChange={e => setCorr('marriageYearLimit', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
              {[['homelessRequired', '무주택 필수'], ['lowIncomeRequired', '저소득 필수'], ['elderlyRequired', '고령자 필수']].map(([k, l]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#222', cursor: 'pointer' }}>
                  <input type="checkbox" checked={corrections[k]} onChange={e => setCorr(k, e.target.checked)} />
                  {l}
                </label>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <div>
                <label style={S.label}>고령자 기준나이</label>
                <input style={S.input} type="number" value={corrections.elderlyAgeMin} onChange={e => setCorr('elderlyAgeMin', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>최소 자녀수</label>
                <input style={S.input} type="number" value={corrections.childrenMinCount} onChange={e => setCorr('childrenMinCount', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Memo */}
        {(action === 'CORRECT' || action === 'REJECT') && (
          <div style={{ marginBottom: 24 }}>
            <label style={S.label}>검수 메모 (필수)</label>
            <textarea style={S.textarea} placeholder="검수 메모를 입력하세요"
              value={memo} onChange={e => setMemo(e.target.value)} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ ...S.submitBtn, opacity: submitting ? 0.7 : 1 }}
            onClick={handleSubmit} disabled={submitting}
            onMouseEnter={e => e.currentTarget.style.background = '#111'}
            onMouseLeave={e => e.currentTarget.style.background = '#222'}>
            {submitting ? '처리 중...' : '검수 처리 실행'}
          </button>
        </div>
      </div>

      {/* Review History */}
      {data.reviewedBy && (
        <div style={S.card}>
          <h2 style={S.cardTitle}>검수 이력</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 14, color: '#222' }}>검수자: <strong>{data.reviewedBy}</strong></p>
            {data.reviewedAt && <p style={{ fontSize: 13, color: '#6a6a6a' }}>처리일: {new Date(data.reviewedAt).toLocaleString('ko-KR')}</p>}
            {data.reviewNote && <p style={{ fontSize: 13, color: '#6a6a6a' }}>메모: {data.reviewNote}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
