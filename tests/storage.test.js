import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSettings, saveSettings, resetSettings,
  loadScores, saveScore, clearScores,
  loadStats, saveStats, clearStats,
  exportAll, importAll, clearAll, _resetAllForTest
} from '../js/storage.js';
import { DEFAULT_SETTINGS, DEFAULT_STATS, MAX_SCORES } from '../js/constants.js';

beforeEach(() => {
  _resetAllForTest();
});

describe('storage - Settings', () => {
  it('首次加载返回默认设置', () => {
    const s = loadSettings();
    expect(s).toEqual(DEFAULT_SETTINGS);
  });

  it('部分保存合并到默认值', () => {
    saveSettings({ sound: false });
    const s = loadSettings();
    expect(s.sound).toBe(false);
    expect(s.bgm).toBe(true); // 其他字段保持默认
    expect(s.keys.left).toBe('ArrowLeft');
  });

  it('嵌套 keys 对象部分保存', () => {
    saveSettings({ keys: { left: 'KeyA' } });
    const s = loadSettings();
    expect(s.keys.left).toBe('KeyA');
    expect(s.keys.right).toBe('ArrowRight'); // 其他按键保持
  });

  it('resetSettings 恢复默认', () => {
    saveSettings({ sound: false, theme: 'dark' });
    resetSettings();
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('storage - Scores', () => {
  it('首次加载为空数组', () => {
    expect(loadScores()).toEqual([]);
  });

  it('saveScore 按分数降序排序', () => {
    saveScore({ name: 'A', score: 100, level: 1, date: '2026-01-01' });
    saveScore({ name: 'B', score: 300, level: 1, date: '2026-01-02' });
    saveScore({ name: 'C', score: 200, level: 1, date: '2026-01-03' });
    const list = loadScores();
    expect(list[0].name).toBe('B');
    expect(list[1].name).toBe('C');
    expect(list[2].name).toBe('A');
  });

  it(`排行榜最多保留 ${MAX_SCORES} 条`, () => {
    for (let i = 0; i < MAX_SCORES + 10; i++) {
      saveScore({ name: 'P' + i, score: i, level: 1, date: '2026-01-01' });
    }
    const list = loadScores();
    expect(list.length).toBe(MAX_SCORES);
    // 最高分保留在第一条
    expect(list[0].score).toBe(MAX_SCORES + 9);
  });

  it('保存后每条记录包含 rank 字段', () => {
    saveScore({ name: 'X', score: 100, level: 1, date: '2026-01-01' });
    const list = loadScores();
    expect(list[0].rank).toBe(1);
  });

  it('clearScores 清空排行榜', () => {
    saveScore({ name: 'X', score: 100, level: 1, date: '2026-01-01' });
    clearScores();
    expect(loadScores()).toEqual([]);
  });
});

describe('storage - Stats', () => {
  it('首次加载返回默认统计', () => {
    expect(loadStats()).toEqual(DEFAULT_STATS);
  });

  it('部分保存合并到默认', () => {
    saveStats({ totalGames: 5 });
    expect(loadStats().totalGames).toBe(5);
    expect(loadStats().highScore).toBe(0);
  });

  it('clearStats 恢复默认', () => {
    saveStats({ totalGames: 10, highScore: 999 });
    clearStats();
    expect(loadStats()).toEqual(DEFAULT_STATS);
  });
});

describe('storage - 导入导出', () => {
  it('exportAll 返回包含三组数据的 JSON 字符串', () => {
    saveScore({ name: 'X', score: 100, level: 1, date: '2026-01-01' });
    saveStats({ totalGames: 3 });
    const json = exportAll();
    const data = JSON.parse(json);
    expect(data).toHaveProperty('settings');
    expect(data).toHaveProperty('scores');
    expect(data).toHaveProperty('stats');
    expect(data.scores.length).toBe(1);
    expect(data.stats.totalGames).toBe(3);
  });

  it('importAll 解析合法 JSON 并覆盖数据', () => {
    const json = JSON.stringify({
      settings: { sound: false },
      scores: [{ name: 'Imp', score: 999, level: 8, date: '2026-01-01', rank: 1 }],
      stats: { totalGames: 7, highScore: 999, totalLines: 100 }
    });
    importAll(json);
    expect(loadSettings().sound).toBe(false);
    expect(loadScores().length).toBe(1);
    expect(loadScores()[0].name).toBe('Imp');
    expect(loadStats().totalGames).toBe(7);
  });

  it('importAll 拒绝非法 JSON', () => {
    expect(() => importAll('not a json')).toThrow();
  });

  it('importAll 拒绝非对象数据', () => {
    expect(() => importAll(JSON.stringify(123))).toThrow();
  });
});

describe('storage - clearAll', () => {
  it('清空所有数据', () => {
    saveScore({ name: 'X', score: 100, level: 1, date: '2026-01-01' });
    saveStats({ totalGames: 3 });
    saveSettings({ sound: false });
    clearAll();
    expect(loadScores()).toEqual([]);
    expect(loadStats()).toEqual(DEFAULT_STATS);
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
