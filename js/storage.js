// localStorage 封装：所有数据读写均通过此模块
import { DEFAULT_SETTINGS, DEFAULT_STATS, MAX_SCORES } from './constants.js';

const KEYS = {
  SETTINGS: 'tetris_settings',
  SCORES:   'tetris_scores',
  STATS:    'tetris_stats'
};

// 测试与生产环境兼容的 localStorage 取值
function getStorage() {
  // jsdom 提供 window.localStorage；node 直接运行时无 storage
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof global !== 'undefined' && global.localStorage) return global.localStorage;
  return null;
}

function safeParse(raw, fallback) {
  if (raw == null) return fallback;
  try { return JSON.parse(raw); } catch (e) { return fallback; }
}

function safeWrite(key, value) {
  try {
    const s = getStorage();
    if (s) s.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[storage] write failed:', key, e);
  }
}

function safeRead(key, fallback) {
  try {
    const s = getStorage();
    if (!s) return fallback;
    return safeParse(s.getItem(key), fallback);
  } catch (e) {
    return fallback;
  }
}

// ===== Settings =====
export function loadSettings() {
  const stored = safeRead(KEYS.SETTINGS, {});
  // 深度合并：保证字段完整，新增字段有默认值
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    keys: { ...DEFAULT_SETTINGS.keys, ...(stored.keys || {}) }
  };
}

export function saveSettings(partial) {
  const current = loadSettings();
  const next = {
    ...current,
    ...partial,
    keys: partial && partial.keys ? { ...current.keys, ...partial.keys } : current.keys
  };
  safeWrite(KEYS.SETTINGS, next);
  return next;
}

export function resetSettings() {
  safeWrite(KEYS.SETTINGS, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

// ===== Scores =====
export function loadScores() {
  const arr = safeRead(KEYS.SCORES, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveScore(entry) {
  const list = loadScores();
  // entry: {name, score, level, date}
  list.push({ ...entry, rank: 0 });
  // 按分数降序排序
  list.sort((a, b) => b.score - a.score);
  // 截断到 MAX_SCORES 条
  const trimmed = list.slice(0, MAX_SCORES).map((item, idx) => ({ ...item, rank: idx + 1 }));
  safeWrite(KEYS.SCORES, trimmed);
  return trimmed;
}

export function clearScores() {
  safeWrite(KEYS.SCORES, []);
}

// ===== Stats =====
export function loadStats() {
  const stored = safeRead(KEYS.STATS, {});
  return { ...DEFAULT_STATS, ...stored };
}

export function saveStats(partial) {
  const next = { ...loadStats(), ...partial };
  safeWrite(KEYS.STATS, next);
  return next;
}

export function clearStats() {
  safeWrite(KEYS.STATS, DEFAULT_STATS);
}

// ===== 全量导入导出 =====
export function exportAll() {
  return JSON.stringify({
    settings: loadSettings(),
    scores:   loadScores(),
    stats:    loadStats()
  });
}

export function importAll(jsonString) {
  let data;
  try { data = JSON.parse(jsonString); } catch (e) {
    throw new Error('JSON 解析失败：' + e.message);
  }
  if (typeof data !== 'object' || data === null) throw new Error('数据格式非法');
  // 至少含一个可识别字段
  const hasAny = 'settings' in data || 'scores' in data || 'stats' in data;
  if (!hasAny) throw new Error('未发现可导入的字段（settings/scores/stats）');

  // 校验结构
  if (data.settings !== undefined && (typeof data.settings !== 'object' || data.settings === null)) {
    throw new Error('settings 字段格式非法');
  }
  if (data.scores !== undefined && !Array.isArray(data.scores)) {
    throw new Error('scores 字段必须为数组');
  }
  if (data.stats !== undefined && (typeof data.stats !== 'object' || data.stats === null)) {
    throw new Error('stats 字段格式非法');
  }

  if (data.settings) safeWrite(KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...data.settings });
  if (Array.isArray(data.scores)) {
    // 校验每条记录结构
    const valid = data.scores.filter(s => s && typeof s === 'object' && typeof s.score === 'number');
    safeWrite(KEYS.SCORES, valid.slice(0, MAX_SCORES));
  }
  if (data.stats)    safeWrite(KEYS.STATS,    { ...DEFAULT_STATS, ...data.stats });
  return {
    settings: loadSettings(),
    scores:   loadScores(),
    stats:    loadStats()
  };
}

export function clearAll() {
  clearScores();
  clearStats();
  resetSettings();
}

// 仅供测试用：清空所有键
export function _resetAllForTest() {
  try {
    const s = getStorage();
    if (!s) return;
    s.removeItem(KEYS.SETTINGS);
    s.removeItem(KEYS.SCORES);
    s.removeItem(KEYS.STATS);
  } catch (e) {}
}
