import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/common/Toast';

const STATUS_OPTIONS = [
  ['', '전체'],
  ['COLLECTED', '수집됨'],
  ['IMPORTED', 'import 완료'],
  ['FAILED', '실패'],
  ['SKIPPED', '제외'],
];

const STATUS_BADGE = {
  COLLECTED: ['수집됨', '#eff6ff', '#1d4ed8'],
  IMPORTED: ['import 완료', '#f0fdf4', '#166534'],
  FAILED: ['실패', '#fff0f3', '#e00b41'],
  SKIPPED: ['제외', '#f2f2f2', '#6a6a6a'],
};

const DEDUPE_BADGE = {
  NEW: ['신규', '#fff0f3', '#ff385c'],
  UNCHANGED_SKIP_GEMINI: ['변경 없음', '#f2f2f2', '#6a6a6a'],
  CHANGED_REPARSE: ['변경 감지', '#fff7ed', '#c2410c'],
  FAILED_RETRY: ['실패 재시도', '#fff0f3', '#e00b41'],
  FORCE_REPARSE: ['강제 재파싱', '#fff7ed', '#c2410c'],
  NO_PDF: ['PDF 없음', '#fff7ed', '#c2410c'],
  LAND_SKIP: ['토지 제외', '#f2f2f2', '#6a6a6a'],
};

const S = {
  container: { maxWidth: 1280, margin: '0 auto', padding: '32px 24px 120px' },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#6a6a6a', marginBottom: 16 },
  hero: { background: '#fff', borderRadius: 20, padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-card)', display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start' },
  card: { background: '#fff', borderRadius: 20, padding: 24, marginBottom: 20, boxShadow: 'var(--shadow-card)' },
  title: { fontSize: 28, fontWeight: 700, color: '#222', margin: '0 0 10px' },
  desc: { fontSize: 14, color: '#6a6a6a', lineHeight: 1.7, margin: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#222', margin: '0 0 16px' },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#6a6a6a', marginBottom: 6 },
  input: { width: 130, height: 44, padding: '0 13px', border: '1.5px solid #c1c1c1', borderRadius: 10, fontSize: 14, color: '#222', background: '#fff' },
  select: { height: 44, padding: '0 13px', border: '1.5px solid #c1c1c1', borderRadius: 10, fontSize: 14, color: '#222', background: '#fff' },
  row: { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' },
  btn: { height: 42, padding: '0 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 16 },
  tableWrap: { overflowX: 'auto', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16 },
  table: { width: '100%', minWidth: 980, borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 14px', background: '#fafafa', borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6a6a6a', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' },
  td: { padding: '14px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: 13, verticalAlign: 'middle' },
  stickyBar: { position: 'fixed', left: '50%', bottom: 20, transform: 'translateX(-50%)', zIndex: 100, width: 'min(920px, calc(100vw - 32px))', borderRadius: 20, background: '#222', color: '#fff', boxShadow: 'rgba(0,0,0,.2) 0 12px 32px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  modalBackdrop: { position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { width: 'min(480px, 100%)', borderRadius: 22, background: '#fff', boxShadow: 'rgba(0,0,0,.2) 0 20px 60px', padding: 24 },
};

function normalizeCandidates(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.candidates)) return data.candidates;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data?.candidates)) return data.data.candidates;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
}

function getTotalCount(data, fallback) {
  return data?.totalCount ?? data?.totalElements ?? data?.total ?? data?.data?.totalCount ?? fallback;
}

function parseError(data, fallback) {
  return data?.message || data?.error || data?.detail || fallback;
}

function Badge({ map, value }) {
  const [label, bg, color] = map[value] || [value || '-', '#f2f2f2', '#6a6a6a'];
  return <span style={{ display: 'inline-flex', borderRadius: 999, padding: '5px 10px', background: bg, color, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>{label}</span>;
}

function Pill({ children, bg = '#f2f2f2', color = '#6a6a6a' }) {
  return <span style={{ display: 'inline-flex', borderRadius: 999, padding: '5px 10px', background: bg, color, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>{children}</span>;
}

function Button({ children, tone = 'secondary', disabled, onClick }) {
  const palette = {
    primary: ['#ff385c', '#fff'],
    dark: ['#222', '#fff'],
    danger: ['#fff0f3', '#e00b41'],
    secondary: ['#f2f2f2', '#222'],
    ghost: ['#fff', '#222'],
  }[tone];
  return (
    <button style={{ ...S.btn, background: palette[0], color: palette[1], opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer', border: tone === 'ghost' ? '1px solid rgba(0,0,0,.12)' : 'none' }} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function SummaryCard({ label, value, sub, tone = 'neutral' }) {
  const bg = { info: '#eff6ff', success: '#f0fdf4', warning: '#fff7ed', danger: '#fff0f3', neutral: '#fafafa' }[tone];
  return (
    <div style={{ borderRadius: 16, padding: 16, background: bg, border: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ color: '#6a6a6a', fontSize: 12, fontWeight: 700 }}>{label}</div>
      <div style={{ color: '#222', fontSize: 26, fontWeight: 800, marginTop: 4 }}>{value ?? 0}</div>
      {sub && <div style={{ color: '#6a6a6a', fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ResultPanel({ result, onReview, onRefresh }) {
  if (!result) return null;
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <h2 style={S.sectionTitle}>Step 3. 실행 결과</h2>
          <p style={S.desc}>import 성공은 공개 완료가 아닙니다. announcement_eligibility.reviewStatus가 APPROVED 또는 CORRECTED가 되어야 public API에 노출됩니다.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button tone="secondary" onClick={onRefresh}>후보 목록 새로고침</Button>
          <Button tone="dark" onClick={onReview}>검수 대기 목록 보기</Button>
        </div>
      </div>
      {Number(result.failed || 0) > 0 && (
        <div style={{ marginTop: 16, borderRadius: 14, background: '#fff0f3', color: '#e00b41', padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>
          일부 후보 처리가 실패했습니다. 실패 panId, 외부 API, Gemini quota 또는 파싱 오류를 확인해주세요.
        </div>
      )}
      <div style={S.summaryGrid}>
        <SummaryCard label="fetched" value={result.fetched} tone="info" />
        <SummaryCard label="scanned" value={result.scanned} tone="info" />
        <SummaryCard label="skippedLand" value={result.skippedLand} tone="warning" />
        <SummaryCard label="unchanged" value={result.unchanged} sub="실패 아님" tone="info" />
        <SummaryCard label="geminiSkipped" value={result.geminiSkipped} sub="비용 절감" tone="success" />
        <SummaryCard label="imported" value={result.imported} sub="저장/import 성공" tone="success" />
        <SummaryCard label="reparsed" value={result.reparsed} tone="warning" />
        <SummaryCard label="failed" value={result.failed} tone={Number(result.failed || 0) > 0 ? 'danger' : 'neutral'} />
      </div>
    </div>
  );
}

export default function AdminImportPage() {
  const navigate = useNavigate();
  const api = useApi();
  const toast = useToast();

  const [collectPage, setCollectPage] = useState(1);
  const [collectSize, setCollectSize] = useState(10);
  const [listPage, setListPage] = useState(0);
  const [listSize, setListSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('COLLECTED');
  const [candidates, setCandidates] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState([]);
  const [force, setForce] = useState(false);
  const [collectResult, setCollectResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForceModal, setShowForceModal] = useState(false);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const loadCandidates = async (showToast = false) => {
    setLoadingList(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams({ page: String(listPage), size: String(listSize) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/api/admin/import/lh/candidates?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseError(data, '후보 목록을 불러오지 못했습니다'));
      const list = normalizeCandidates(data);
      setCandidates(list);
      setTotalCount(getTotalCount(data, list.length));
      setSelected(prev => prev.filter(id => list.some(item => item.id === id)));
      if (showToast) toast('후보 목록을 새로고침했습니다');
    } catch (e) {
      setCandidates([]);
      setTotalCount(0);
      setErrorMsg(e.message || '후보 목록을 불러오지 못했습니다');
    }
    setLoadingList(false);
  };

  useEffect(() => {
    loadCandidates(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPage, listSize, statusFilter]);

  const handleCollect = async () => {
    setCollecting(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/api/admin/import/lh/candidates/collect?page=${collectPage}&size=${collectSize}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseError(data, '후보 수집에 실패했습니다'));
      setCollectResult(data);
      const list = normalizeCandidates(data);
      if (list.length) {
        setCandidates(list);
        setTotalCount(getTotalCount(data, list.length));
      } else {
        await loadCandidates(false);
      }
      toast('LH 후보 수집이 완료되었습니다. 이 단계에서는 Gemini를 호출하지 않습니다.');
    } catch (e) {
      setErrorMsg(e.message || '후보 수집에 실패했습니다');
      toast(e.message || '후보 수집에 실패했습니다', 'error');
    }
    setCollecting(false);
  };

  const toggleCandidate = (item) => {
    if (!item.canParse) return;
    setSelected(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
  };

  const executeImport = async (forceValue) => {
    if (!selected.length) return;
    setImporting(true);
    setShowForceModal(false);
    setErrorMsg('');
    try {
      const res = await api.post('/api/admin/import/lh/selected', { candidateIds: selected, force: forceValue });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseError(data, '선택 import에 실패했습니다'));
      setImportResult(data);
      setSelected([]);
      setForce(false);
      toast('선택 import가 완료되었습니다. 공개 전 관리자 검수가 필요합니다.');
      await loadCandidates(false);
    } catch (e) {
      setErrorMsg(e.message || '선택 import에 실패했습니다');
      toast(e.message || '선택 import에 실패했습니다', 'error');
    }
    setImporting(false);
  };

  const handleImport = () => {
    if (force) setShowForceModal(true);
    else executeImport(false);
  };

  return (
    <div style={S.container}>
      <button style={S.backBtn} onClick={() => navigate('/admin')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#6a6a6a" strokeWidth="2" width="16" height="16"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        관리자 대시보드
      </button>

      <section style={S.hero}>
        <div>
          <div style={{ color: '#ff385c', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>LH 후보 기반 IMPORT</div>
          <h1 style={S.title}>LH 후보 수집/import 콘솔</h1>
          <p style={S.desc}>
            LH 후보 수집 API는 <b>lh_import_candidate</b> 테이블에 후보만 저장합니다. 후보 수집/목록 조회 단계에서는 Gemini를 호출하지 않습니다.<br />
            선택 import API는 <b>candidateIds</b>로 선택된 후보만 정식 announcement로 저장/갱신하고, dedupeStatus와 fingerprint를 기준으로 Gemini 호출 여부를 결정합니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/admin/review?status=PENDING')}>검수 대기 목록</Button>
          <Button tone="dark" onClick={() => navigate('/admin')}>관리자 대시보드</Button>
        </div>
      </section>

      {errorMsg && <div style={{ ...S.card, background: '#fff0f3', color: '#e00b41', fontWeight: 700 }}>{errorMsg}</div>}

      <section style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={S.sectionTitle}>Step 1. 후보 수집</h2>
            <p style={S.desc}>LH 목록/원문/PDF URL을 후보로 저장합니다. AI 파싱과 Gemini 호출은 선택 import 전까지 발생하지 않습니다.</p>
          </div>
          <Pill bg="#eff6ff" color="#1d4ed8">Gemini 호출 없음</Pill>
        </div>
        <div style={{ ...S.row, marginTop: 18 }}>
          <div>
            <label style={S.label}>page</label>
            <input style={S.input} type="number" min="1" value={collectPage} onChange={e => setCollectPage(Number(e.target.value))} />
          </div>
          <div>
            <label style={S.label}>size</label>
            <input style={S.input} type="number" min="1" max="50" value={collectSize} onChange={e => setCollectSize(Number(e.target.value))} />
          </div>
          <Button tone="primary" disabled={collecting} onClick={handleCollect}>{collecting ? '수집 중...' : '후보 수집 실행'}</Button>
        </div>
        {collectResult && (
          <div style={S.summaryGrid}>
            <SummaryCard label="fetched" value={collectResult.fetched} tone="info" />
            <SummaryCard label="scanned" value={collectResult.scanned} tone="info" />
            <SummaryCard label="skippedLand" value={collectResult.skippedLand} tone="warning" />
          </div>
        )}
      </section>

      <section style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <h2 style={S.sectionTitle}>Step 2. 후보 목록</h2>
            <p style={S.desc}>canParse=false 후보는 선택할 수 없습니다. 토지 공고, PDF 없음, 기존 저장 여부와 중복 판단을 확인한 뒤 import할 후보만 선택하세요.</p>
          </div>
          <div style={S.row}>
            <div>
              <label style={S.label}>status</label>
              <select style={S.select} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setListPage(0); }}>
                {STATUS_OPTIONS.map(([v, l]) => <option key={v || 'ALL'} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>page</label>
              <input style={S.input} type="number" min="0" value={listPage} onChange={e => setListPage(Number(e.target.value))} />
            </div>
            <div>
              <label style={S.label}>size</label>
              <input style={S.input} type="number" min="1" max="100" value={listSize} onChange={e => setListSize(Number(e.target.value))} />
            </div>
            <Button onClick={() => loadCandidates(true)} disabled={loadingList}>{loadingList ? '조회 중...' : '후보 조회'}</Button>
          </div>
        </div>

        <div style={{ color: '#6a6a6a', fontSize: 13, marginBottom: 10 }}>총 {totalCount}건</div>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {['선택', '후보 ID', '공고명', '지역', '상태', '중복 판단', '검수 포인트', '링크'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {candidates.map(item => {
                const disabled = !item.canParse;
                return (
                  <tr key={item.id} style={disabled ? { opacity: 0.55 } : null}>
                    <td style={S.td}><input type="checkbox" disabled={disabled} checked={selectedSet.has(item.id)} onChange={() => toggleCandidate(item)} /></td>
                    <td style={S.td}>#{item.id}</td>
                    <td style={S.td}>
                      <div style={{ maxWidth: 340, fontWeight: 700, color: '#222', lineHeight: 1.4 }}>{item.title || '-'}</div>
                      <div style={{ color: '#6a6a6a', fontSize: 12, marginTop: 4 }}>{item.panId || '-'}</div>
                    </td>
                    <td style={S.td}>{item.region || '-'}</td>
                    <td style={S.td}><Badge map={STATUS_BADGE} value={item.status} /></td>
                    <td style={S.td}><Badge map={DEDUPE_BADGE} value={item.dedupeStatus} /></td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {item.canParse ? <Pill bg="#f0fdf4" color="#166534">import 가능</Pill> : <Pill>import 불가</Pill>}
                        {item.isLandNotice && <Pill>토지 공고 제외</Pill>}
                        {item.alreadyImported && <Pill bg="#eff6ff" color="#1d4ed8">기존 저장됨</Pill>}
                        {!item.pdfUrl && <Pill bg="#fff7ed" color="#c2410c">PDF 없음</Pill>}
                      </div>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {item.pdfUrl ? <a href={item.pdfUrl} target="_blank" rel="noreferrer" style={{ color: '#222', fontWeight: 700 }}>PDF</a> : <span style={{ color: '#c1c1c1' }}>PDF</span>}
                        {item.sourceNoticeUrl ? <a href={item.sourceNoticeUrl} target="_blank" rel="noreferrer" style={{ color: '#222', fontWeight: 700 }}>원문</a> : <span style={{ color: '#c1c1c1' }}>원문</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loadingList && candidates.length === 0 && (
                <tr><td style={{ ...S.td, textAlign: 'center', color: '#6a6a6a' }} colSpan="8">조회된 후보가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ResultPanel result={importResult} onReview={() => navigate('/admin/review?status=PENDING')} onRefresh={() => loadCandidates(true)} />

      <section style={{ ...S.card, background: '#f9fafb' }}>
        <h2 style={S.sectionTitle}>운영 주의사항</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#6a6a6a', fontSize: 14, lineHeight: 1.8 }}>
          <li>선택 import가 성공해도 바로 public에 노출되지 않습니다.</li>
          <li>announcement_eligibility.reviewStatus가 APPROVED 또는 CORRECTED가 되어야 public API에서 보입니다.</li>
          <li>AdminReviewDetailPage의 units[]는 announcement_unit 기반 관리자 검수용 데이터입니다.</li>
          <li>rawText, sourceUnitKey는 admin-only 필드이므로 public 화면에 노출하면 안 됩니다.</li>
        </ul>
      </section>

      {selected.length > 0 && (
        <div style={S.stickyBar}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{selected.length}개 후보 선택됨</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.72)' }}>선택 import 단계에서 dedupeStatus/fingerprint에 따라 Gemini 호출이 결정됩니다.</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
            <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} /> 강제 재파싱
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button tone="ghost" onClick={() => setSelected([])}>선택 해제</Button>
            <Button tone="primary" disabled={importing} onClick={handleImport}>{importing ? 'import 중...' : '선택 후보 import'}</Button>
          </div>
        </div>
      )}

      {showForceModal && (
        <div style={S.modalBackdrop} role="dialog" aria-modal="true">
          <div style={S.modal}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff7ed', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 20 }}>강제 재파싱을 실행할까요?</h3>
            <p style={S.desc}>강제 재파싱은 변경 없는 공고도 Gemini를 다시 호출할 수 있습니다. 비용이 발생할 수 있으니 정말 필요한 경우에만 실행하세요.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 22 }}>
              <Button onClick={() => setShowForceModal(false)}>취소</Button>
              <Button tone="danger" disabled={importing} onClick={() => executeImport(true)}>강제 재파싱 실행</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
