// Small formatting utilities shared across the frontend
export const fmtNumber = (v: any, digits = 2) => {
  if (v === null || v === undefined) return 'N/A';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : 'N/A';
};

export default fmtNumber;
