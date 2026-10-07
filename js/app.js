// 应用入口：路由 + 初始化
import { loadSettings } from './storage.js';
import { homePage } from './pages/home.js';
import { gamePage } from './pages/game.js';
import { leaderboardPage } from './pages/leaderboard.js';
import { manualPage } from './pages/manual.js';
import { settingsPage } from './pages/settings.js';
import { applyTheme as applyThemeVars, initTheme } from './themes.js';

const ROUTES = {
  home:        homePage,
  game:        gamePage,
  leaderboard: leaderboardPage,
  manual:      manualPage,
  settings:    settingsPage
};

const PAGES_WITH_NAV = new Set(['home', 'leaderboard', 'manual', 'settings']);

let currentRoute = null;
let currentCleanup = null;

export function navigate(route) {
  const page = ROUTES[route];
  if (!page) {
    console.warn('[app] 未知路由:', route);
    return;
  }

  // 卸载当前页
  if (currentCleanup) {
    try { currentCleanup(); } catch (e) { console.warn(e); }
    currentCleanup = null;
  }

  // 切换导航栏可见性
  const nav = document.getElementById('top-nav');
  if (nav) nav.style.display = PAGES_WITH_NAV.has(route) ? 'flex' : 'none';

  // 切换页面容器
  const root = document.getElementById('page-root');
  if (!root) throw new Error('找不到 #page-root 容器');

  // 清空
  while (root.firstChild) root.removeChild(root.firstChild);

  // 挂载新页面
  const result = page.mount(root, { navigate });
  currentCleanup = (typeof result === 'function') ? result : (page.unmount || null);
  currentRoute = route;

  // 保存当前页（刷新后保留）
  try {
    sessionStorage.setItem('tetris:currentRoute', route);
  } catch (e) {}
}

export function getCurrentRoute() {
  return currentRoute;
}

export function applyTheme(theme) {
  return applyThemeVars(theme);
}

export function initApp() {
  // 应用主题（注入 CSS 变量 + body class）
  initTheme();

  // 绑定顶部导航
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });

  // 恢复上次路由（默认首页）
  let start = 'home';
  try {
    start = sessionStorage.getItem('tetris:currentRoute') || 'home';
    if (!ROUTES[start]) start = 'home';
  } catch (e) {}
  navigate(start);
}

// 自动初始化（浏览器环境）
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initApp);
}

// 暴露给 HTML onclick 使用
if (typeof window !== 'undefined') {
  window.App = { navigate, initApp, getCurrentRoute, applyTheme };
}
