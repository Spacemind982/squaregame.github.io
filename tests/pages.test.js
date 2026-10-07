import { describe, it, expect, beforeEach } from 'vitest';
import { navigate } from '../js/app.js';
import {
  loadSettings, saveSettings, saveScore, saveStats, clearStats, loadStats, _resetAllForTest
} from '../js/storage.js';
import { DEFAULT_SETTINGS } from '../js/constants.js';

beforeEach(() => {
  _resetAllForTest();
  document.body.innerHTML = `
    <nav id="top-nav" class="top-nav"></nav>
    <main id="page-root"></main>
    <div id="modal-root"></div>
  `;
  try { sessionStorage.clear(); } catch (e) {}
});

// 工具：模拟点击
function click(el) {
  if (!el) throw new Error('el is null');
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}
function change(el) {
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
function input(el) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('home page', () => {
  it('显示标题与 4 个按钮', () => {
    navigate('home');
    const root = document.getElementById('page-root');
    expect(root.querySelector('.pixel-title').textContent).toBe('俄罗斯方块');
    const buttons = root.querySelectorAll('.home__buttons .btn');
    expect(buttons.length).toBe(4);
    expect(buttons[0].textContent).toBe('开始游戏');
  });

  it('显示历史最高分', () => {
    saveStats({ highScore: 12345, totalGames: 7 });
    navigate('home');
    const root = document.getElementById('page-root');
    expect(root.textContent).toContain('12345');
    expect(root.textContent).toContain('7');
  });
});

describe('leaderboard page - Tab 筛选与排序', () => {
  beforeEach(() => {
    saveScore({ name: 'A', score: 100, level: 2, date: '2026-01-01' });
    saveScore({ name: 'B', score: 500, level: 5, date: '2026-01-02' });
    saveScore({ name: 'C', score: 900, level: 9, date: '2026-01-03' });
  });

  it('默认显示全部，按分数降序', () => {
    navigate('leaderboard');
    const root = document.getElementById('page-root');
    const rows = root.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    // 第一行分数最大
    expect(rows[0].textContent).toContain('900');
    expect(rows[0].textContent).toContain('C');
  });

  it('点击 Tab 等级 1-3 只显示低等级', () => {
    navigate('leaderboard');
    const root = document.getElementById('page-root');
    const tabs = root.querySelectorAll('.tab');
    // tab 顺序：all, low(1-3), mid(4-7), high(8+)
    click(tabs[1]);
    const rows = root.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('A');
  });

  it('点击 Tab 等级 8+ 只显示高等级', () => {
    navigate('leaderboard');
    const root = document.getElementById('page-root');
    const tabs = root.querySelectorAll('.tab');
    click(tabs[3]);
    const rows = root.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('C');
  });

  it('点击表头切换排序方向', () => {
    navigate('leaderboard');
    const root = document.getElementById('page-root');
    // 默认按 score desc → 900 500 100
    let rows = root.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('900');
    // 点击分数表头：变为 asc
    click(root.querySelector('th[data-sort="score"]'));
    rows = root.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('100');
    // 再次点击：回到 desc
    click(root.querySelector('th[data-sort="score"]'));
    rows = root.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('900');
  });

  it('点击表头按日期排序', () => {
    navigate('leaderboard');
    const root = document.getElementById('page-root');
    click(root.querySelector('th[data-sort="date"]'));
    const rows = root.querySelectorAll('tbody tr');
    // 日期 asc：01-01 在前
    expect(rows[0].textContent).toContain('2026-01-01');
  });

  it('空状态显示提示', () => {
    _resetAllForTest();
    navigate('leaderboard');
    const root = document.getElementById('page-root');
    expect(root.querySelector('.lb-empty').textContent).toContain('暂无记录');
  });
});

describe('manual page', () => {
  it('显示 5 个说明卡片', () => {
    navigate('manual');
    const root = document.getElementById('page-root');
    expect(root.querySelectorAll('.card').length).toBe(5);
  });

  it('方块介绍包含 7 种', () => {
    navigate('manual');
    const root = document.getElementById('page-root');
    const names = root.querySelectorAll('.piece-name');
    const types = Array.from(names).map(n => n.textContent);
    expect(types).toEqual(expect.arrayContaining(['I','O','T','S','Z','L','J']));
  });
});

describe('settings page - 音效与显示设置', () => {
  it('点击音效开关切换并保存', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    const toggle = root.querySelector('#sfx-toggle');
    expect(toggle.checked).toBe(true); // 默认开
    toggle.checked = false;
    change(toggle);
    expect(loadSettings().sound).toBe(false);
  });

  it('拖动音量滑块保存', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    const vol = root.querySelector('#sfx-vol');
    vol.value = '0.5';
    input(vol);
    expect(loadSettings().soundVolume).toBeCloseTo(0.5, 2);
  });

  it('点击主题按钮保存并切换 body class', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    const darkBtn = root.querySelector('[data-theme="dark"]');
    click(darkBtn);
    expect(loadSettings().theme).toBe('dark');
    expect(document.body.classList.contains('theme-dark')).toBe(true);
  });

  it('点击预览数 1 保存', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('[data-preview="1"]'));
    expect(loadSettings().previewCount).toBe(1);
  });

  it('点击网格线开关保存', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    const grid = root.querySelector('#grid-toggle');
    grid.checked = false;
    change(grid);
    expect(loadSettings().gridLines).toBe(false);
  });

  it('点击起始等级 + 与 -', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('#level-up'));
    expect(loadSettings().startLevel).toBe(2);
    click(root.querySelector('#level-up'));
    click(root.querySelector('#level-up'));
    click(root.querySelector('#level-down'));
    expect(loadSettings().startLevel).toBe(3);
  });

  it('起始等级上限 10', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    saveSettings({ startLevel: 10 });
    // 重新挂载以反映最新设置
    navigate('home');
    navigate('settings');
    click(root.querySelector('#level-up'));
    expect(loadSettings().startLevel).toBe(10);
  });

  it('起始等级下限 1', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('#level-down'));
    expect(loadSettings().startLevel).toBe(1);
  });

  it('点击难度倍率切换', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('[data-diff="extreme"]'));
    expect(loadSettings().difficulty).toBe('extreme');
  });
});

describe('settings page - 按键自定义', () => {
  it('点击改按钮进入按键监听状态', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    const btn = root.querySelector('[data-rebind="left"]');
    click(btn);
    expect(btn.textContent).toBe('按键中...');
  });

  it('按键按下后保存新键位', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('[data-rebind="left"]'));
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    expect(loadSettings().keys.left).toBe('KeyA');
    // 按键显示更新
    const keyEl = root.querySelector('#key-left');
    expect(keyEl.textContent).toBe('A');
  });

  it('冲突时拒绝并提示', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('[data-rebind="left"]'));
    // 按下已被 right 使用的 ArrowRight
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    expect(loadSettings().keys.left).toBe('ArrowLeft'); // 未改变
  });
});

describe('settings page - 清空操作（二次确认）', () => {
  it('清空统计数据二次确认 - 取消', async () => {
    saveStats({ totalGames: 5, highScore: 999, totalLines: 30 });
    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('#btn-clear-stats'));
    // 此时模态出现
    const cancelBtn = document.querySelector('#modal-root .modal__actions .btn:not(.btn--danger)');
    click(cancelBtn);
    await Promise.resolve();
    await Promise.resolve();
    // 数据应保留
    expect(loadStats().totalGames).toBe(5);
  });

  it('清空统计数据二次确认 - 确认', async () => {
    saveStats({ totalGames: 5, highScore: 999, totalLines: 30 });
    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('#btn-clear-stats'));
    const okBtn = document.querySelector('#modal-root .btn--danger');
    click(okBtn);
    await Promise.resolve();
    await Promise.resolve();
    expect(loadStats().totalGames).toBe(0);
    expect(loadStats().highScore).toBe(0);
  });

  it('清空排行榜二次确认 - 确认', async () => {
    saveScore({ name: 'X', score: 100, level: 1, date: '2026-01-01' });
    navigate('settings');
    const root = document.getElementById('page-root');
    click(root.querySelector('#btn-clear-scores'));
    const okBtn = document.querySelector('#modal-root .btn--danger');
    click(okBtn);
    await Promise.resolve();
    await Promise.resolve();
    // 重新进入设置页时排行榜为 0
    navigate('home');
    navigate('settings');
    expect(root.textContent).toContain('排行榜记录：0 条');
  });
});
