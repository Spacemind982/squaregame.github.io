// 主题系统：定义三套主题变量 + 切换函数
import { loadSettings, saveSettings } from './storage.js';

export const THEMES = {
  classic: {
    name: '经典灰白',
    vars: {
      '--bg': '#f5f5f5',
      '--fg': '#222',
      '--panel': '#ffffff',
      '--border': '#ccc',
      '--primary': '#2d7',
      '--title-fg': '#222',
      '--accent': '#fa3',
      '--board-bg': '#eaeaea',
      '--grid': '#d0d0d0',
      '--shadow': 'rgba(0,0,0,0.15)'
    },
    pieceColors: {
      I: '#00d4ff', O: '#ffd500', T: '#b14eff',
      S: '#21d642', Z: '#ff3b3b', L: '#ff8b1f', J: '#1f6dff'
    }
  },
  dark: {
    name: '暗黑',
    vars: {
      '--bg': '#0f1115',
      '--fg': '#e6e6e6',
      '--panel': '#1a1d24',
      '--border': '#2c3140',
      '--primary': '#5a9',
      '--title-fg': '#f5f5f5',
      '--accent': '#ffa940',
      '--board-bg': '#050608',
      '--grid': '#1f242d',
      '--shadow': 'rgba(0,0,0,0.6)'
    },
    pieceColors: {
      I: '#4dd0ff', O: '#ffe14d', T: '#c979ff',
      S: '#52e07a', Z: '#ff6b6b', L: '#ffa652', J: '#5a8eff'
    }
  },
  neon: {
    name: '霓虹',
    vars: {
      '--bg': '#0a0420',
      '--fg': '#f0e6ff',
      '--panel': 'rgba(20,10,40,0.85)',
      '--border': '#7a3bff',
      '--primary': '#ff2ad4',
      '--title-fg': '#fff',
      '--accent': '#2afff0',
      '--board-bg': '#0a0420',
      '--grid': '#2a0f60',
      '--shadow': 'rgba(255,42,212,0.4)'
    },
    pieceColors: {
      I: '#00ffe0', O: '#ffea00', T: '#c800ff',
      S: '#39ff14', Z: '#ff0040', L: '#ff8c00', J: '#0080ff'
    }
  }
};

export const DEFAULT_THEME = 'classic';

export function getTheme(name) {
  return THEMES[name] || THEMES[DEFAULT_THEME];
}

export function listThemes() {
  return Object.keys(THEMES).map(k => ({ key: k, name: THEMES[k].name }));
}

// 应用主题到 document.body（添加 class + 注入 CSS 变量）
export function applyTheme(name) {
  const theme = getTheme(name);
  // body class
  document.body.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
  document.body.classList.add('theme-' + name);
  // 注入 CSS 变量
  const style = document.documentElement.style;
  for (const [k, v] of Object.entries(theme.vars)) {
    style.setProperty(k, v);
  }
  // 保存
  saveSettings({ theme: name });
  return theme;
}

// 取当前主题色（用于 renderer）
export function getPieceColor(type) {
  const s = loadSettings();
  const theme = getTheme(s.theme);
  return theme.pieceColors[type] || '#888';
}

// 初始化：从设置读取并应用
export function initTheme() {
  const s = loadSettings();
  applyTheme(s.theme || DEFAULT_THEME);
}
