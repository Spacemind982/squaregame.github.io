// 日期/数字格式化

export function formatDate(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d);
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${m}-${day}`;
}

export function pad(n, width = 6) {
  return String(n).padStart(width, '0');
}
