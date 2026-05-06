import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/common/Toast';

const S = {
  container: { maxWidth: 800, margin: '0 auto', padding: '32px 24px 80px' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
    border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#6a6a6a', marginBottom: 16,
  },
  card: { background: '#fff', borderRadius: 20, padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-card)' },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#222', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.08)' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#222', marginBottom: 8 },
  required: { color: '#ff385c' },
  input: {
    width: '100%', height: 48, padding: '0 16px', border: '1.5px solid #c1c1c1', borderRadius: 12,
    fontSize: 14, color: '#222', background: '#fff', transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  select: {
    width: '100%', height: 48, padding: '0 16px', border: '1.5px solid #c1c1c1', borderRadius: 12,
    fontSize: 14, color: '#222', background: '#fff', cursor: 'pointer',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  field: { marginBottom: 16 },
  radioGroup: { display: 'flex', gap: 12 },
  radioLabel: (sel) => ({
    flex: 1, padding: '12px 0', borderRadius: 12, border: `1.5px solid ${sel ? '#ff385c' : '#c1c1c1'}`,
    background: sel ? '#fff0f3' : '#fff', cursor: 'pointer', textAlign: 'center',
    fontSize: 14, fontWeight: sel ? 600 : 400, color: sel ? '#ff385c' : '#222', transition: 'all 0.15s',
  }),
  submitBtn: {
    width: '100%', height: 56, borderRadius: 12, border: 'none', background: '#ff385c', color: '#fff',
    fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', marginTop: 8,
  },
  errorText: { fontSize: 12, color: '#ff385c', marginTop: 4 },
};

const focusStyle = (e) => { e.target.style.borderColor = '#222'; e.target.style.boxShadow = '0 0 0 3px rgba(34,34,34,0.08)'; };
const blurStyle = (e) => { e.target.style.borderColor = '#c1c1c1'; e.target.style.boxShadow = 'none'; };

const REGIONS = ['서울특별시','부산광역시','대구광역시','인천광역시','광주광역시','대전광역시','울산광역시','세종특별자치시','경기도','강원특별자치도','충청북도','충청남도','전북특별자치도','전라남도','경상북도','경상남도','제주특별자치도'];

export default function AdminAnnouncementNewPage() {
  const navigate = useNavigate();
  const api = useApi();
  const toast = useToast();

  const [form, setForm] = useState({
    noticeName: '', providerName: '', noticeStatus: 'OPEN',
    regionLevel1: '', regionLevel2: '', fullAddress: '', complexName: '',
    depositAmount: '', monthlyRentAmount: '', supplyHouseholdCount: '',
    applicationStartDate: '', applicationEndDate: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.noticeName.trim()) errs.noticeName = '공고명을 입력해주세요';
    if (!form.providerName.trim()) errs.providerName = '공급 기관명을 입력해주세요';
    if (!form.regionLevel1) errs.regionLevel1 = '시/도를 선택해주세요';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body = {
        ...form,
        depositAmount: form.depositAmount ? Number(form.depositAmount) : null,
        monthlyRentAmount: form.monthlyRentAmount ? Number(form.monthlyRentAmount) : null,
        supplyHouseholdCount: form.supplyHouseholdCount ? Number(form.supplyHouseholdCount) : null,
        applicationStartDate: form.applicationStartDate || null,
        applicationEndDate: form.applicationEndDate || null,
      };
      const res = await api.post('/api/admin/announcements', body);
      if (res.status === 201 || res.ok) {
        toast('공고가 등록되었습니다. 검수 대기 목록에 추가됩니다.');
        navigate('/admin');
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.message || '등록에 실패했습니다', 'error');
      }
    } catch {
      toast('서버 오류가 발생했습니다', 'error');
    }
    setSubmitting(false);
  };

  const inputStyle = (field) => ({
    ...S.input,
    borderColor: errors[field] ? '#ff385c' : '#c1c1c1',
  });

  return (
    <div style={S.container}>
      <button style={S.backBtn} onClick={() => navigate('/admin')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#6a6a6a" strokeWidth="2" width="16" height="16"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        관리자 대시보드
      </button>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#222', marginBottom: 32 }}>수동 공고 등록</h1>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>기본 정보</h2>
          <div style={S.field}>
            <label style={S.label}>공고명 <span style={S.required}>*</span></label>
            <input style={inputStyle('noticeName')} type="text" placeholder="공고명을 입력하세요"
              value={form.noticeName} onChange={set('noticeName')} onFocus={focusStyle} onBlur={blurStyle} />
            {errors.noticeName && <p style={S.errorText}>{errors.noticeName}</p>}
          </div>
          <div style={S.field}>
            <label style={S.label}>공급 기관명 <span style={S.required}>*</span></label>
            <input style={inputStyle('providerName')} type="text" placeholder="예: LH, SH 등"
              value={form.providerName} onChange={set('providerName')} onFocus={focusStyle} onBlur={blurStyle} />
            {errors.providerName && <p style={S.errorText}>{errors.providerName}</p>}
          </div>
          <div style={S.field}>
            <label style={S.label}>모집 상태 <span style={S.required}>*</span></label>
            <div style={S.radioGroup}>
              {[['OPEN', '모집중'], ['SCHEDULED', '모집예정'], ['CLOSED', '모집마감']].map(([v, l]) => (
                <div key={v} style={S.radioLabel(form.noticeStatus === v)}
                  onClick={() => setForm(prev => ({ ...prev, noticeStatus: v }))}>{l}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Region */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>지역 정보</h2>
          <div style={S.row}>
            <div>
              <label style={S.label}>시/도 <span style={S.required}>*</span></label>
              <select style={{ ...S.select, borderColor: errors.regionLevel1 ? '#ff385c' : '#c1c1c1' }}
                value={form.regionLevel1} onChange={set('regionLevel1')}>
                <option value="">선택하세요</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.regionLevel1 && <p style={S.errorText}>{errors.regionLevel1}</p>}
            </div>
            <div>
              <label style={S.label}>시/군/구</label>
              <input style={S.input} type="text" placeholder="시/군/구" value={form.regionLevel2}
                onChange={set('regionLevel2')} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>
          <div style={S.row}>
            <div>
              <label style={S.label}>상세 주소</label>
              <input style={S.input} type="text" placeholder="상세 주소" value={form.fullAddress}
                onChange={set('fullAddress')} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={S.label}>단지명</label>
              <input style={S.input} type="text" placeholder="단지명" value={form.complexName}
                onChange={set('complexName')} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>
        </div>

        {/* Cost */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>비용 정보</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={S.label}>보증금 (만원)</label>
              <input style={S.input} type="number" placeholder="0" value={form.depositAmount}
                onChange={set('depositAmount')} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={S.label}>월세 (만원)</label>
              <input style={S.input} type="number" placeholder="0" value={form.monthlyRentAmount}
                onChange={set('monthlyRentAmount')} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={S.label}>공급 세대수</label>
              <input style={S.input} type="number" placeholder="0" value={form.supplyHouseholdCount}
                onChange={set('supplyHouseholdCount')} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>일정 정보</h2>
          <div style={S.row}>
            <div>
              <label style={S.label}>신청 시작일</label>
              <input style={S.input} type="date" value={form.applicationStartDate}
                onChange={set('applicationStartDate')} />
            </div>
            <div>
              <label style={S.label}>신청 마감일</label>
              <input style={S.input} type="date" value={form.applicationEndDate}
                onChange={set('applicationEndDate')} />
            </div>
          </div>
        </div>

        <button type="submit" style={{ ...S.submitBtn, opacity: submitting ? 0.7 : 1 }}
          disabled={submitting}
          onMouseEnter={e => e.currentTarget.style.background = '#e00b41'}
          onMouseLeave={e => e.currentTarget.style.background = '#ff385c'}>
          {submitting ? '등록 중...' : '등록하기'}
        </button>
      </form>
    </div>
  );
}
