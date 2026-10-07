import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSettings, saveSettings, saveScore, saveStats,
  loadScores, loadStats, exportAll, importAll, clearAll,
  _resetAllForTest
} from '../js/storage.js';
import { navigate } from '../js/app.js';

beforeEach(() => {
  _resetAllForTest();
  document.body.innerHTML = `
    <nav id="top-nav" class="top-nav"></nav>
    <main id="page-root"></main>
    <div id="modal-root"></div>
  `;
});

function click(el) {
  if (!el) throw new Error('el is null');
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('导入导出 - exportAll', () => {
  it('导出包含 settings / scores / stats 三段', () => {
    saveSettings({ theme: 'dark' });
    saveScore({ name: 'A', score: 100, level: 3, date: '2026-01-01' });
    saveStats({ totalGames: 5, highScore: 100, totalLines: 20 });
    const json = exportAll();
    const data = JSON.parse(json);
    expect(data.settings.theme).toBe('dark');
    expect(data.scores.length).toBe(1);
    expect(data.stats.totalGames).toBe(5);
  });

  it('空数据也能导出', () => {
    const json = exportAll();
    const data = JSON.parse(json);
    expect(data.scores).toEqual([]);
    expect(data.stats.totalGames).toBe(0);
  });
});

describe('导入导出 - importAll 校验', () => {
  it('正常 JSON 导入成功', () => {
    const json = JSON.stringify({
      settings: { theme: 'neon' },
      scores: [{ name: 'X', score: 200, level: 5, date: '2026-02-02' }],
      stats: { totalGames: 3, highScore: 200, totalLines: 10 }
    });
    const result = importAll(json);
    expect(result.settings.theme).toBe('neon');
    expect(result.scores.length).toBe(1);
    expect(result.stats.totalGames).toBe(3);
  });

  it('非法 JSON 抛错', () => {
    expect(() => importAll('not json')).toThrow();
  });

  it('非对象数据抛错', () => {
    expect(() => importAll('"string"')).toThrow();
    expect(() => importAll('123')).toThrow();
    expect(() => importAll('null')).toThrow();
  });

  it('无可识别字段抛错', () => {
    expect(() => importAll('{}')).toThrow();
    expect(() => importAll(JSON.stringify({ foo: 'bar' }))).toThrow();
  });

  it('settings 字段格式非法抛错', () => {
    expect(() => importAll(JSON.stringify({ settings: 'invalid' }))).toThrow();
    expect(() => importAll(JSON.stringify({ settings: null }))).toThrow();
  });

  it('scores 字段非数组抛错', () => {
    expect(() => importAll(JSON.stringify({ scores: 'invalid' }))).toThrow();
    expect(() => importAll(JSON.stringify({ scores: 123 }))).toThrow();
  });

  it('stats 字段格式非法抛错', () => {
    expect(() => importAll(JSON.stringify({ stats: 'invalid' }))).toThrow();
  });

  it('只导入部分字段也成功', () => {
    // 先填充
    saveStats({ totalGames: 10, highScore: 999, totalLines: 50 });
    // 仅导入 stats
    const json = JSON.stringify({ stats: { totalGames: 1, highScore: 100, totalLines: 5 } });
    importAll(json);
    expect(loadStats().totalGames).toBe(1);
  });

  it('scores 中结构错误的条目被过滤', () => {
    const json = JSON.stringify({
      scores: [
        { name: 'A', score: 100, level: 1, date: '2026-01-01' },
        { name: 'B' }, // 缺 score
        null,
        'invalid',
        { name: 'C', score: 200, level: 2, date: '2026-01-02' }
      ]
    });
    importAll(json);
    expect(loadScores().length).toBe(2);
  });

  it('导入后往返一致：导出再导入', () => {
    saveSettings({ theme: 'dark', sound: false });
    saveScore({ name: 'A', score: 100, level: 1, date: '2026-01-01' });
    saveScore({ name: 'B', score: 200, level: 2, date: '2026-01-02' });
    saveStats({ totalGames: 7, highScore: 200, totalLines: 30 });
    const json = exportAll();
    _resetAllForTest();
    importAll(json);
    expect(loadSettings().theme).toBe('dark');
    expect(loadSettings().sound).toBe(false);
    expect(loadScores().length).toBe(2);
    expect(loadStats().totalGames).toBe(7);
  });
});

describe('导入导出 - 设置页 UI', () => {
  it('点击导出按钮触发 Blob 与下载', async () => {
    // mock URL.createObjectURL 与 a.click
    let createObjectURLCalled = 0;
    const origURL = window.URL.createObjectURL;
    const origRevoke = window.URL.revokeObjectURL;
    window.URL.createObjectURL = () => { createObjectURLCalled++; return 'blob:fake'; };
    window.URL.revokeObjectURL = () => {};
    // 通过原型替换 HTMLAnchorElement.click，阻止真实导航
    const proto = HTMLAnchorElement.prototype;
    const origClick = Object.getOwnPropertyDescriptor(proto, 'click');
    Object.defineProperty(proto, 'click', { value: () => {}, configurable: true });

    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('#btn-export'));
    // showAlert 是 async，等待微任务
    await new Promise(r => setTimeout(r, 50));

    expect(createObjectURLCalled).toBe(1);

    // 恢复
    window.URL.createObjectURL = origURL;
    window.URL.revokeObjectURL = origRevoke;
    if (origClick) Object.defineProperty(proto, 'click', origClick);
  });

  it('点击恢复默认弹出二次确认 - 确认', async () => {
    saveSettings({ theme: 'neon', sound: false });
    saveScore({ name: 'A', score: 100, level: 1, date: '2026-01-01' });
    saveStats({ totalGames: 5, highScore: 999, totalLines: 30 });

    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('#btn-reset-all'));
    // 第一层确认
    const okBtn = document.querySelector('#modal-root .btn--danger');
    click(okBtn);
    await Promise.resolve();
    await Promise.resolve();
    // 第二层提示
    const alertOk = document.querySelector('#modal-root .btn--primary');
    if (alertOk) click(alertOk);
    await new Promise(r => setTimeout(r, 10));

    // 数据被清空
    expect(loadSettings().theme).toBe('classic');
    expect(loadSettings().sound).toBe(true);
    expect(loadScores().length).toBe(0);
    expect(loadStats().totalGames).toBe(0);
  });

  it('点击恢复默认弹出二次确认 - 取消', async () => {
    saveSettings({ theme: 'neon' });
    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('#btn-reset-all'));
    const cancelBtn = document.querySelector('#modal-root .modal__actions .btn:not(.btn--danger)');
    click(cancelBtn);
    await Promise.resolve();
    await Promise.resolve();
    // 数据未变
    expect(loadSettings().theme).toBe('neon');
  });
});

describe('导入导出 - clearAll', () => {
  it('清空所有数据并重置设置', () => {
    saveSettings({ theme: 'dark', sound: false });
    saveScore({ name: 'A', score: 100, level: 1, date: '2026-01-01' });
    saveStats({ totalGames: 5, highScore: 999, totalLines: 30 });

    clearAll();

    const s = loadSettings();
    expect(s.theme).toBe('classic');
    expect(s.sound).toBe(true);
    expect(loadScores().length).toBe(0);
    expect(loadStats().totalGames).toBe(0);
  });
});
