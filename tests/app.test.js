import { describe, it, expect, beforeEach } from 'vitest';
import { navigate, getCurrentRoute, applyTheme, initApp } from '../js/app.js';

// 重置 DOM 与 storage
beforeEach(() => {
  document.body.innerHTML = `
    <nav id="top-nav" class="top-nav">
      <button class="nav-link" data-nav="home">首页</button>
      <button class="nav-link" data-nav="leaderboard">排行榜</button>
      <button class="nav-link" data-nav="manual">游戏说明</button>
      <button class="nav-link" data-nav="settings">设置</button>
    </nav>
    <main id="page-root"></main>
    <div id="modal-root"></div>
  `;
  window.localStorage.clear();
  try { sessionStorage.clear(); } catch (e) {}
});

describe('app - applyTheme', () => {
  it('给 body 加上对应的 theme class', () => {
    applyTheme('dark');
    expect(document.body.classList.contains('theme-dark')).toBe(true);
    expect(document.body.classList.contains('theme-classic')).toBe(false);
  });

  it('切换主题时移除旧 class', () => {
    applyTheme('classic');
    applyTheme('neon');
    expect(document.body.classList.contains('theme-classic')).toBe(false);
    expect(document.body.classList.contains('theme-neon')).toBe(true);
  });
});

describe('app - navigate 路由切换', () => {
  it('切换到 home 在容器内出现首页标题', () => {
    navigate('home');
    const root = document.getElementById('page-root');
    expect(root.querySelector('.pixel-title')).toBeTruthy();
    expect(root.querySelector('.pixel-title').textContent).toBe('俄罗斯方块');
    expect(getCurrentRoute()).toBe('home');
  });

  it('切换到 leaderboard 出现表格与 Tab', () => {
    navigate('leaderboard');
    const root = document.getElementById('page-root');
    expect(root.querySelector('.lb-table')).toBeTruthy();
    expect(root.querySelectorAll('.tab').length).toBeGreaterThan(0);
  });

  it('切换到 manual 出现游戏说明卡片', () => {
    navigate('manual');
    const root = document.getElementById('page-root');
    expect(root.querySelectorAll('.card').length).toBe(5);
  });

  it('切换到 settings 出现 6 张设置卡片', () => {
    navigate('settings');
    const root = document.getElementById('page-root');
    expect(root.querySelectorAll('.card').length).toBe(6);
  });

  it('切换到 game 时隐藏顶部导航', () => {
    navigate('game');
    const nav = document.getElementById('top-nav');
    expect(nav.style.display).toBe('none');
  });

  it('切换到 home 时显示顶部导航', () => {
    navigate('game');
    navigate('home');
    const nav = document.getElementById('top-nav');
    expect(nav.style.display).toBe('flex');
  });

  it('未知路由不切换不报错', () => {
    navigate('home');
    expect(() => navigate('nonexistent')).not.toThrow();
    expect(getCurrentRoute()).toBe('home');
  });

  it('sessionStorage 保存当前路由', () => {
    navigate('leaderboard');
    expect(sessionStorage.getItem('tetris:currentRoute')).toBe('leaderboard');
  });
});

describe('app - initApp 绑定导航按钮', () => {
  it('点击 data-nav 按钮触发切换', () => {
    initApp();
    // 默认进入 home
    expect(getCurrentRoute()).toBe('home');
    // 点击排行榜按钮
    const btn = document.querySelector('[data-nav="leaderboard"]');
    btn.dispatchEvent(new Event('click'));
    expect(getCurrentRoute()).toBe('leaderboard');
  });
});
