// 排行榜（含 Tab 筛选 + 表头排序）
import { h } from '../utils/dom.js';
import { loadScores } from '../storage.js';
import { LEADERBOARD_FILTERS } from '../constants.js';

export const leaderboardPage = {
  mount(root, { navigate }) {
    const scores = loadScores();
    let currentFilter = 'all';
    let sortKey = 'score';
    let sortDir = 'desc';

    const tabs = h('div', { class: 'tabs' },
      LEADERBOARD_FILTERS.map(f =>
        h('button', { class: 'tab', 'data-filter': f.key }, f.label)
      )
    );

    const tableWrap = h('div', { class: 'table-wrap' }, [
      h('table', { class: 'lb-table' }, [
        h('thead', {}, h('tr', {}, [
          h('th', { 'data-sort': 'rank' }, '#'),
          h('th', { 'data-sort': 'name' }, '昵称'),
          h('th', { 'data-sort': 'score' }, '分数'),
          h('th', { 'data-sort': 'level' }, '等级'),
          h('th', { 'data-sort': 'date' }, '日期')
        ])),
        h('tbody', {})
      ])
    ]);

    const backBtn = h('button', { class: 'btn', 'data-nav': 'home' }, '返回首页');

    root.appendChild(h('div', { class: 'page page--leaderboard' }, [
      h('h2', { class: 'page-title' }, '🏆 排行榜'),
      tabs,
      tableWrap,
      backBtn
    ]));

    const tbody = root.querySelector('.lb-table tbody');

    function getSorted() {
      const f = LEADERBOARD_FILTERS.find(x => x.key === currentFilter) || LEADERBOARD_FILTERS[0];
      let data = scores.filter(s => s.level >= f.min && s.level <= f.max);
      // 排序
      data = [...data].sort((a, b) => {
        const va = a[sortKey]; const vb = b[sortKey];
        if (typeof va === 'string') {
          return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        }
        return sortDir === 'asc' ? va - vb : vb - va;
      });
      return data;
    }

    function render() {
      const data = getSorted();
      while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
      if (data.length === 0) {
        tbody.appendChild(h('tr', {}, h('td', { colspan: '5', class: 'lb-empty' }, '暂无记录，去玩一局吧')));
        return;
      }
      data.forEach((s, i) => {
        const tr = h('tr', { class: i < 3 ? `lb-rank lb-rank--${i+1}` : 'lb-rank' }, [
          h('td', {}, String(s.rank || i + 1)),
          h('td', {}, s.name),
          h('td', {}, String(s.score)),
          h('td', {}, String(s.level)),
          h('td', {}, s.date)
        ]);
        tbody.appendChild(tr);
      });
    }
    render();

    // Tab 切换
    root.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        root.querySelectorAll('.tab').forEach(x => x.classList.remove('tab--active'));
        t.classList.add('tab--active');
        currentFilter = t.dataset.filter;
        render();
      });
    });
    root.querySelector('.tab').classList.add('tab--active');

    // 表头排序：点击切换排序键，再次点击翻转方向
    root.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (sortKey === key) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortKey = key;
          sortDir = (key === 'score' || key === 'level') ? 'desc' : 'asc';
        }
        render();
      });
    });

    // 返回
    root.querySelector('[data-nav="home"]').addEventListener('click', () => navigate('home'));

    return () => {};
  },
  unmount() {}
};
