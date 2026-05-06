const CATEGORY_STYLES = {
  YOUTH:       { label: '청년',     bg: '#eff6ff', color: '#1d4ed8', border: 'rgba(29,78,216,0.2)' },
  NEWLYWED:    { label: '신혼부부', bg: '#fdf4ff', color: '#7e22ce', border: 'rgba(126,34,206,0.2)' },
  HOMELESS:    { label: '무주택',   bg: '#f0fdf4', color: '#166534', border: 'rgba(22,101,52,0.2)' },
  ELDERLY:     { label: '고령자',   bg: '#fff7ed', color: '#c2410c', border: 'rgba(194,65,12,0.2)' },
  LOW_INCOME:  { label: '저소득',   bg: '#f0fdf4', color: '#166534', border: 'rgba(22,101,52,0.2)' },
  MULTI_CHILD: { label: '다자녀',   bg: '#fdf4ff', color: '#7e22ce', border: 'rgba(126,34,206,0.2)' },
};

export function getCategoryLabel(code) {
  return CATEGORY_STYLES[code]?.label || code;
}

export function getCategoryCode(label) {
  return Object.entries(CATEGORY_STYLES).find(([, v]) => v.label === label)?.[0] || label;
}

export default function CategoryTag({ category, style }) {
  const cfg = CATEGORY_STYLES[category] || { label: category, bg: '#f2f2f2', color: '#222', border: 'transparent' };
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, ...style,
    }}>
      {cfg.label}
    </span>
  );
}
