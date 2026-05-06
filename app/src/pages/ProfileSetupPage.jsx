import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const S = {
  wrap: { maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' },
  stepBar: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 },
  stepDot: (state) => ({
    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
    background: state === 'done' ? '#222' : state === 'current' ? '#ff385c' : '#f2f2f2',
    color: state === 'done' || state === 'current' ? '#fff' : '#6a6a6a',
  }),
  stepLine: (done) => ({ flex: 1, height: 2, background: done ? '#222' : 'rgba(0,0,0,0.1)' }),
  stepLabel: (active) => ({ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#222' : '#6a6a6a', marginTop: 4, textAlign: 'center' }),
  title: { fontSize: 24, fontWeight: 700, color: '#222', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6a6a6a', marginBottom: 32, lineHeight: 1.6 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#222', marginBottom: 8 },
  input: {
    width: '100%', height: 52, padding: '0 16px', border: '1.5px solid #c1c1c1', borderRadius: 12,
    fontSize: 15, color: '#222', background: '#fff', transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  select: {
    width: '100%', height: 52, padding: '0 16px', border: '1.5px solid #c1c1c1', borderRadius: 12,
    fontSize: 15, color: '#222', background: '#fff', cursor: 'pointer',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  field: { marginBottom: 16 },
  radioGroup: { display: 'flex', gap: 12 },
  radioLabel: (selected) => ({
    flex: 1, padding: '14px 0', borderRadius: 12, border: `1.5px solid ${selected ? '#ff385c' : '#c1c1c1'}`,
    background: selected ? '#fff0f3' : '#fff', cursor: 'pointer', textAlign: 'center',
    fontSize: 14, fontWeight: selected ? 600 : 400, color: selected ? '#ff385c' : '#222',
    transition: 'all 0.15s',
  }),
  counter: { display: 'flex', alignItems: 'center', gap: 16 },
  counterBtn: {
    width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #c1c1c1', background: '#fff',
    cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  counterVal: { fontSize: 18, fontWeight: 600, color: '#222', minWidth: 40, textAlign: 'center' },
  chipGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  chip: (sel) => ({
    padding: '14px 8px', borderRadius: 12, border: `1.5px solid ${sel ? '#ff385c' : '#c1c1c1'}`,
    cursor: 'pointer', textAlign: 'center', background: sel ? '#fff0f3' : '#fff', transition: 'all 0.15s',
  }),
  checkbox: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 14, color: '#222', cursor: 'pointer' },
  btnRow: { display: 'flex', gap: 12, marginTop: 32 },
  prevBtn: {
    height: 56, padding: '0 24px', borderRadius: 12, border: 'none', background: '#f2f2f2',
    fontSize: 16, fontWeight: 600, color: '#222', cursor: 'pointer',
  },
  nextBtn: {
    flex: 1, height: 56, borderRadius: 12, border: 'none', background: '#222', color: '#fff',
    fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
  },
  submitBtn: {
    flex: 1, height: 56, borderRadius: 12, border: 'none', background: '#ff385c', color: '#fff',
    fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
  },
};

const focusStyle = (e) => { e.target.style.borderColor = '#222'; e.target.style.boxShadow = '0 0 0 3px rgba(34,34,34,0.08)'; };
const blurStyle = (e) => { e.target.style.borderColor = '#c1c1c1'; e.target.style.boxShadow = 'none'; };

const CATS = [
  { code: 'YOUTH', label: '청년', emoji: '👤' },
  { code: 'NEWLYWED', label: '신혼부부', emoji: '💑' },
  { code: 'HOMELESS', label: '무주택', emoji: '🏠' },
  { code: 'ELDERLY', label: '고령자', emoji: '👴' },
  { code: 'LOW_INCOME', label: '저소득', emoji: '💰' },
  { code: 'MULTI_CHILD', label: '다자녀', emoji: '👨‍👩‍👧‍👦' },
];

const REGIONS = ['서울특별시','부산광역시','대구광역시','인천광역시','광주광역시','대전광역시','울산광역시','세종특별자치시','경기도','강원특별자치도','충청북도','충청남도','전북특별자치도','전라남도','경상북도','경상남도','제주특별자치도'];

export default function ProfileSetupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const api = useApi();
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    age: '', maritalStatus: 'SINGLE', marriageYears: '',
    childrenCount: 0, householdSize: 1,
    isHomeless: false, isLowIncome: false, isElderly: false,
    isRecipient: false, isNearPoverty: false, isSingleParentFamily: false,
    categories: [],
    monthlyAverageIncome: '', totalAssets: '', vehicleAssetAmount: '',
    preferredRegionLevel1: '', preferredRegionLevel2: '',
    preferredHouseType: '', preferredSupplyType: '',
    maxDeposit: '', maxMonthlyRent: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/api/me');
        if (res.ok) {
          const d = await res.json();
          setForm(prev => ({
            ...prev,
            age: d.age ?? '', maritalStatus: d.maritalStatus || 'SINGLE',
            marriageYears: d.marriageYears ?? '', childrenCount: d.childrenCount ?? 0,
            householdSize: d.householdSize ?? 1,
            isHomeless: d.isHomeless ?? false, isLowIncome: d.isLowIncome ?? false,
            isElderly: d.isElderly ?? false,
            isRecipient: d.isRecipient ?? false, isNearPoverty: d.isNearPoverty ?? false,
            isSingleParentFamily: d.isSingleParentFamily ?? false,
            categories: d.categories || [],
            monthlyAverageIncome: d.monthlyAverageIncome ?? '', totalAssets: d.totalAssets ?? '',
            vehicleAssetAmount: d.vehicleAssetAmount ?? '',
            preferredRegionLevel1: d.preferredRegionLevel1 || '',
            preferredRegionLevel2: d.preferredRegionLevel2 || '',
            preferredHouseType: d.preferredHouseType || '',
            preferredSupplyType: d.preferredSupplyType || '',
            maxDeposit: d.maxDeposit ?? '', maxMonthlyRent: d.maxMonthlyRent ?? '',
          }));
        }
      } catch { /* new user */ }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const toggleCat = (code) => set('categories', form.categories.includes(code) ? form.categories.filter(c => c !== code) : [...form.categories, code]);

  const formatMoney = (val) => {
    const num = String(val).replace(/[^0-9]/g, '');
    return num ? Number(num).toLocaleString() : '';
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        age: form.age ? Number(form.age) : null,
        marriageYears: form.marriageYears ? Number(form.marriageYears) : null,
        monthlyAverageIncome: form.monthlyAverageIncome ? Number(String(form.monthlyAverageIncome).replace(/,/g, '')) : null,
        totalAssets: form.totalAssets ? Number(String(form.totalAssets).replace(/,/g, '')) : null,
        vehicleAssetAmount: form.vehicleAssetAmount ? Number(String(form.vehicleAssetAmount).replace(/,/g, '')) : null,
        maxDeposit: form.maxDeposit ? Number(String(form.maxDeposit).replace(/,/g, '')) : null,
        maxMonthlyRent: form.maxMonthlyRent ? Number(String(form.maxMonthlyRent).replace(/,/g, '')) : null,
      };
      const res = await api.put('/api/me/profile', body);
      if (res.ok) {
        toast('프로필이 저장되었습니다');
        // Refresh user data
        login(token);
        navigate('/recommendations', { replace: true });
      } else {
        toast('프로필 저장에 실패했습니다', 'error');
      }
    } catch {
      toast('서버 오류가 발생했습니다', 'error');
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  const stepState = (s) => s < step ? 'done' : s === step ? 'current' : 'pending';

  return (
    <div style={S.wrap}>
      {/* Step indicator */}
      <div style={S.stepBar}>
        {[1, 2, 3].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none', gap: 8 }}>
            <div>
              <div style={S.stepDot(stepState(s))}>{s < step ? '\u2713' : s}</div>
              <p style={S.stepLabel(s === step)}>{['기본 정보', '자격 조건', '선호 조건'][i]}</p>
            </div>
            {i < 2 && <div style={{ ...S.stepLine(s < step), marginTop: -16 }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div>
          <h1 style={S.title}>기본 정보</h1>
          <p style={S.subtitle}>맞춤 공고 추천을 위한 기본 정보를 입력해주세요.</p>

          <div style={S.field}>
            <label style={S.label}>나이 *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input style={{ ...S.input, width: 120 }} type="number" placeholder="나이" min="19"
                value={form.age} onChange={e => set('age', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              <span style={{ fontSize: 14, color: '#6a6a6a' }}>세</span>
            </div>
            <p style={{ fontSize: 12, color: '#6a6a6a', marginTop: 4 }}>만 19세 이상</p>
          </div>

          <div style={S.field}>
            <label style={S.label}>결혼 상태 *</label>
            <div style={S.radioGroup}>
              {[['SINGLE', '미혼'], ['MARRIED', '기혼'], ['OTHER', '기타']].map(([v, l]) => (
                <div key={v} style={S.radioLabel(form.maritalStatus === v)} onClick={() => set('maritalStatus', v)}>{l}</div>
              ))}
            </div>
          </div>

          {form.maritalStatus === 'MARRIED' && (
            <div style={S.field}>
              <label style={S.label}>결혼 기간</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input style={{ ...S.input, width: 120 }} type="number" placeholder="0" min="0"
                  value={form.marriageYears} onChange={e => set('marriageYears', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                <span style={{ fontSize: 14, color: '#6a6a6a' }}>년</span>
              </div>
            </div>
          )}

          <div style={S.row}>
            <div>
              <label style={S.label}>자녀 수 *</label>
              <div style={S.counter}>
                <button style={S.counterBtn} onClick={() => set('childrenCount', Math.max(0, form.childrenCount - 1))}>-</button>
                <span style={S.counterVal}>{form.childrenCount}명</span>
                <button style={S.counterBtn} onClick={() => set('childrenCount', form.childrenCount + 1)}>+</button>
              </div>
            </div>
            <div>
              <label style={S.label}>가구원 수</label>
              <div style={S.counter}>
                <button style={S.counterBtn} onClick={() => set('householdSize', Math.max(1, form.householdSize - 1))}>-</button>
                <span style={S.counterVal}>{form.householdSize}명</span>
                <button style={S.counterBtn} onClick={() => set('householdSize', form.householdSize + 1)}>+</button>
              </div>
            </div>
          </div>

          <div style={S.btnRow}>
            <button style={S.nextBtn} onClick={() => setStep(2)}
              onMouseEnter={e => e.currentTarget.style.background = '#111'}
              onMouseLeave={e => e.currentTarget.style.background = '#222'}>
              다음 단계
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Qualifications */}
      {step === 2 && (
        <div>
          <h1 style={S.title}>자격 조건</h1>
          <p style={S.subtitle}>해당하는 항목을 모두 선택하세요.</p>

          <div style={S.field}>
            {[
              ['isHomeless', '무주택자'], ['isLowIncome', '저소득자'],
              ['isElderly', '고령자 (만 65세 이상)'], ['isRecipient', '기초수급자'],
              ['isNearPoverty', '차상위계층'], ['isSingleParentFamily', '한부모가족'],
            ].map(([key, label]) => (
              <label key={key} style={S.checkbox}>
                <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>

          <div style={S.field}>
            <label style={S.label}>수혜 대상 카테고리 (복수 선택 가능)</label>
            <div style={S.chipGrid}>
              {CATS.map(c => (
                <div key={c.code} style={S.chip(form.categories.includes(c.code))} onClick={() => toggleCat(c.code)}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{c.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: form.categories.includes(c.code) ? '#ff385c' : '#222' }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>월평균 소득 (선택)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input style={S.input} type="text" placeholder="0"
                value={formatMoney(form.monthlyAverageIncome)} onChange={e => set('monthlyAverageIncome', e.target.value.replace(/,/g, ''))}
                onFocus={focusStyle} onBlur={blurStyle} />
              <span style={{ fontSize: 14, color: '#6a6a6a', flexShrink: 0 }}>원</span>
            </div>
          </div>

          <div style={S.row}>
            <div>
              <label style={S.label}>총 자산 (선택)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input style={S.input} type="text" placeholder="0"
                  value={formatMoney(form.totalAssets)} onChange={e => set('totalAssets', e.target.value.replace(/,/g, ''))}
                  onFocus={focusStyle} onBlur={blurStyle} />
                <span style={{ fontSize: 14, color: '#6a6a6a', flexShrink: 0 }}>원</span>
              </div>
            </div>
            <div>
              <label style={S.label}>차량 자산가액 (선택)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input style={S.input} type="text" placeholder="0"
                  value={formatMoney(form.vehicleAssetAmount)} onChange={e => set('vehicleAssetAmount', e.target.value.replace(/,/g, ''))}
                  onFocus={focusStyle} onBlur={blurStyle} />
                <span style={{ fontSize: 14, color: '#6a6a6a', flexShrink: 0 }}>원</span>
              </div>
            </div>
          </div>

          <div style={S.btnRow}>
            <button style={S.prevBtn} onClick={() => setStep(1)}>이전</button>
            <button style={S.nextBtn} onClick={() => setStep(3)}
              onMouseEnter={e => e.currentTarget.style.background = '#111'}
              onMouseLeave={e => e.currentTarget.style.background = '#222'}>
              다음 단계
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preferences */}
      {step === 3 && (
        <div>
          <h1 style={S.title}>선호 조건</h1>
          <p style={S.subtitle}>원하는 조건을 설정하면 더 정확한 추천을 받을 수 있습니다.</p>

          <div style={S.row}>
            <div>
              <label style={S.label}>시/도</label>
              <select style={S.select} value={form.preferredRegionLevel1}
                onChange={e => { set('preferredRegionLevel1', e.target.value); set('preferredRegionLevel2', ''); }}>
                <option value="">선택하세요</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>시/군/구</label>
              <input style={S.input} type="text" placeholder="시/군/구 입력"
                value={form.preferredRegionLevel2} onChange={e => set('preferredRegionLevel2', e.target.value)}
                onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>

          <div style={S.row}>
            <div>
              <label style={S.label}>선호 주택 유형</label>
              <select style={S.select} value={form.preferredHouseType}
                onChange={e => set('preferredHouseType', e.target.value)}>
                <option value="">전체</option>
                <option value="아파트">아파트</option>
                <option value="오피스텔">오피스텔</option>
                <option value="다세대">다세대</option>
                <option value="단독주택">단독주택</option>
              </select>
            </div>
            <div>
              <label style={S.label}>선호 공급 유형</label>
              <select style={S.select} value={form.preferredSupplyType}
                onChange={e => set('preferredSupplyType', e.target.value)}>
                <option value="">전체</option>
                <option value="임대">임대</option>
                <option value="분양">분양</option>
                <option value="매입임대">매입임대</option>
              </select>
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>최대 보증금</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input style={S.input} type="text" placeholder="0"
                value={formatMoney(form.maxDeposit)} onChange={e => set('maxDeposit', e.target.value.replace(/,/g, ''))}
                onFocus={focusStyle} onBlur={blurStyle} />
              <span style={{ fontSize: 14, color: '#6a6a6a', flexShrink: 0 }}>만원</span>
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>최대 월세</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input style={S.input} type="text" placeholder="0"
                value={formatMoney(form.maxMonthlyRent)} onChange={e => set('maxMonthlyRent', e.target.value.replace(/,/g, ''))}
                onFocus={focusStyle} onBlur={blurStyle} />
              <span style={{ fontSize: 14, color: '#6a6a6a', flexShrink: 0 }}>만원</span>
            </div>
          </div>

          <div style={S.btnRow}>
            <button style={S.prevBtn} onClick={() => setStep(2)}>이전</button>
            <button style={S.submitBtn} onClick={handleSubmit} disabled={saving}
              onMouseEnter={e => e.currentTarget.style.background = '#e00b41'}
              onMouseLeave={e => e.currentTarget.style.background = '#ff385c'}>
              {saving ? '저장 중...' : '프로필 저장 완료'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
