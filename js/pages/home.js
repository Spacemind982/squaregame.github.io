// 首页
import { h } from '../utils/dom.js';
import { loadStats } from '../storage.js';
import { formatDate, pad } from '../utils/format.js';

export const homePage = {
  mount(root, { navigate }) {
    const stats = loadStats();

    const title = h('div', { class: 'home__title' }, [
      h('h1', { class: 'pixel-title' }, '俄罗斯方块'),
      h('p',  { class: 'pixel-subtitle' }, 'TETRIS  CLASSIC')
    ]);

    const buttons = h('div', { class: 'home__buttons' }, [
      h('button', { class: 'btn btn--primary', 'data-nav': 'game' }, '开始游戏'),
      h('button', { class: 'btn', 'data-nav': 'leaderboard' }, '排行榜'),
      h('button', { class: 'btn', 'data-nav': 'manual' }, '游戏说明'),
      h('button', { class: 'btn', 'data-nav': 'settings' }, '数据与设置')
    ]);

    const info = h('div', { class: 'home__info' }, [
      h('div', {}, `历史最高分：${pad(stats.highScore)}`),
      h('div', {}, `总场次：${stats.totalGames}`)
    ]);

    root.appendChild(h('div', { class: 'page page--home' }, [title, buttons, info]));

    // 绑定导航按钮
    root.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.nav));
    });

    return () => { /* 卸载清理 */ };
  },
  unmount() {}
};
