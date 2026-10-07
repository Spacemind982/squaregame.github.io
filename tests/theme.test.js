import { describe, it, expect, beforeEach } from 'vitest';
import {
  THEMES, DEFAULT_THEME, getTheme, listThemes,
  applyTheme, getPieceColor, initTheme
} from '../js/themes.js';
import { saveSettings, loadSettings, _resetAllForTest } from '../js/storage.js';

beforeEach(() => {
  _resetAllForTest();
  // 清空 body class 与 CSS 变量
  document.body.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
  document.documentElement.style.cssText = '';
  // 初始化 DOM 容器（用于集成测试）
  document.body.innerHTML = `
    <nav id="top-nav" class="top-nav"></nav>
    <main id="page-root"></main>
    <div id="modal-root"></div>
  `;
});

describe('themes - 定义', () => {
  it('三套主题：classic / dark / neon', () => {
    expect(Object.keys(THEMES).sort()).toEqual(['classic', 'dark', 'neon']);
  });

  it('每套主题包含完整 CSS 变量', () => {
    const required = ['--bg', '--fg', '--panel', '--border', '--primary', '--title-fg', '--accent', '--board-bg', '--grid', '--shadow'];
    for (const name of Object.keys(THEMES)) {
      const vars = THEMES[name].vars;
      for (const k of required) {
        expect(vars[k], `${name} 缺少 ${k}`).toBeDefined();
      }
    }
  });

  it('每套主题包含 7 种方块颜色', () => {
    const pieces = ['I','O','T','S','Z','L','J'];
    for (const name of Object.keys(THEMES)) {
      const colors = THEMES[name].pieceColors;
      for (const p of pieces) {
        expect(colors[p], `${name} 缺少 ${p}`).toBeDefined();
      }
    }
  });

  it('DEFAULT_THEME 是 classic', () => {
    expect(DEFAULT_THEME).toBe('classic');
  });
});

describe('themes - getTheme / listThemes', () => {
  it('getTheme 返回指定主题', () => {
    expect(getTheme('dark').name).toBe('暗黑');
    expect(getTheme('neon').name).toBe('霓虹');
  });

  it('getTheme 未知主题回退到默认', () => {
    expect(getTheme('nonexistent').name).toBe(THEMES[DEFAULT_THEME].name);
  });

  it('listThemes 返回所有主题', () => {
    const list = listThemes();
    expect(list.length).toBe(3);
    expect(list.map(t => t.key).sort()).toEqual(['classic', 'dark', 'neon']);
  });
});

describe('themes - applyTheme', () => {
  it('切换到 dark 设置 body class', () => {
    applyTheme('dark');
    expect(document.body.classList.contains('theme-dark')).toBe(true);
    expect(document.body.classList.contains('theme-classic')).toBe(false);
  });

  it('切换到 neon 设置 body class', () => {
    applyTheme('neon');
    expect(document.body.classList.contains('theme-neon')).toBe(true);
  });

  it('注入 CSS 变量到 documentElement', () => {
    applyTheme('neon');
    const bg = document.documentElement.style.getPropertyValue('--bg');
    expect(bg).toBe(THEMES.neon.vars['--bg']);
  });

  it('切换主题会保存到设置', () => {
    applyTheme('dark');
    expect(loadSettings().theme).toBe('dark');
  });

  it('多次切换只保留当前 class', () => {
    applyTheme('dark');
    applyTheme('neon');
    applyTheme('classic');
    expect(document.body.classList.contains('theme-classic')).toBe(true);
    expect(document.body.classList.contains('theme-dark')).toBe(false);
    expect(document.body.classList.contains('theme-neon')).toBe(false);
  });

  it('CSS 变量随主题变化', () => {
    applyTheme('classic');
    const bg1 = document.documentElement.style.getPropertyValue('--bg');
    applyTheme('dark');
    const bg2 = document.documentElement.style.getPropertyValue('--bg');
    expect(bg1).not.toBe(bg2);
  });
});

describe('themes - getPieceColor', () => {
  it('根据当前设置的主题返回对应颜色', () => {
    saveSettings({ theme: 'classic' });
    const c1 = getPieceColor('I');
    saveSettings({ theme: 'neon' });
    const c2 = getPieceColor('I');
    expect(c1).toBe(THEMES.classic.pieceColors.I);
    expect(c2).toBe(THEMES.neon.pieceColors.I);
    expect(c1).not.toBe(c2);
  });

  it('未知方块类型返回兜底色', () => {
    saveSettings({ theme: 'classic' });
    expect(getPieceColor('X')).toBe('#888');
  });
});

describe('themes - initTheme', () => {
  it('从设置读取主题并应用', () => {
    saveSettings({ theme: 'neon' });
    initTheme();
    expect(document.body.classList.contains('theme-neon')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--bg')).toBe(THEMES.neon.vars['--bg']);
  });

  it('设置无主题时使用默认', () => {
    initTheme();
    expect(document.body.classList.contains('theme-classic')).toBe(true);
  });
});

describe('themes - 与设置页集成', () => {
  it('从设置页切换主题后 CSS 变量更新', async () => {
    const { navigate } = await import('../js/app.js');
    navigate('settings');
    const root = document.getElementById('page-root');
    const darkBtn = root.querySelector('[data-theme="dark"]');
    darkBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(loadSettings().theme).toBe('dark');
    expect(document.body.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--bg')).toBe(THEMES.dark.vars['--bg']);
  });
});
