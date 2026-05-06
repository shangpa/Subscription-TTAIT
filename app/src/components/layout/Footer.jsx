import { Link } from 'react-router-dom';

const S = {
  footer: { borderTop: '1px solid rgba(0,0,0,0.08)', padding: '32px 24px', background: '#f2f2f2' },
  inner: { maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 48, flexWrap: 'wrap' },
  colTitle: { fontSize: 12, fontWeight: 600, color: '#222', marginBottom: 12 },
  colLink: { fontSize: 13, color: '#6a6a6a', marginBottom: 8, cursor: 'pointer' },
  right: { marginLeft: 'auto' },
  copy: { fontSize: 12, color: '#6a6a6a' },
};

export default function Footer() {
  return (
    <footer style={S.footer}>
      <div style={S.inner}>
        <div>
          <p style={S.colTitle}>서비스</p>
          <p style={S.colLink}>서비스 소개</p>
          <p style={S.colLink}>공고 목록</p>
          <p style={S.colLink}>맞춤 추천</p>
        </div>
        <div>
          <p style={S.colTitle}>지원</p>
          <p style={S.colLink}>이용약관</p>
          <p style={S.colLink}>개인정보처리방침</p>
          <p style={S.colLink}>문의</p>
        </div>
        <div style={S.right}>
          <p style={S.copy}>2026 청약알리미. 공공임대주택 정보 플랫폼</p>
        </div>
      </div>
    </footer>
  );
}
