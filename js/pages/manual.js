// 游戏说明
import { h } from '../utils/dom.js';
import { TETROMINOES } from '../constants.js';

export const manualPage = {
  mount(root, { navigate }) {
    // 方块图示
    const piecesGrid = h('div', { class: 'pieces-grid' },
      Object.keys(TETROMINOES).map(type => {
        const shape = TETROMINOES[type][0];
        const cells = h('div', { class: 'piece-mini' },
          shape.flatMap((row, ri) =>
            row.map((v, ci) => h('div', {
              class: `piece-cell ${v ? 'piece-cell--on' : ''} piece-${type}`
            }))
          )
        );
        return h('div', { class: 'piece-block' }, [cells, h('span', { class: 'piece-name' }, type)]);
      })
    );

    const cards = [
      h('section', { class: 'card' }, [
        h('h3', { class: 'card__title' }, '一、游戏目标'),
        h('p', {}, '消除横向填满的行，阻止方块堆到顶部。')
      ]),
      h('section', { class: 'card' }, [
        h('h3', { class: 'card__title' }, '二、方块介绍'),
        piecesGrid
      ]),
      h('section', { class: 'card' }, [
        h('h3', { class: 'card__title' }, '三、操作键位'),
        h('ul', {}, [
          h('li', {}, '← →   左右移动'),
          h('li', {}, '↑     顺时针旋转'),
          h('li', {}, '↓     软降（加速下落）'),
          h('li', {}, '空格   硬降（直接落底）'),
          h('li', {}, 'C     暂存当前方块'),
          h('li', {}, 'P     暂停 / 继续')
        ])
      ]),
      h('section', { class: 'card' }, [
        h('h3', { class: 'card__title' }, '四、计分规则'),
        h('ul', {}, [
          h('li', {}, '单行 100 × 等级'),
          h('li', {}, '双行 300 × 等级'),
          h('li', {}, '三行 500 × 等级'),
          h('li', {}, '四行 800 × 等级（俄罗斯）'),
          h('li', {}, '软降 +1 / 硬降 +2 每格')
        ])
      ]),
      h('section', { class: 'card' }, [
        h('h3', { class: 'card__title' }, '五、特殊功能'),
        h('ul', {}, [
          h('li', {}, '下一块预览：显示未来方块'),
          h('li', {}, 'Hold：暂存并换取方块'),
          h('li', {}, '幽灵方块：显示落点投影'),
          h('li', {}, '每累计消除 10 行升级，速度加快')
        ])
      ])
    ];

    root.appendChild(h('div', { class: 'page page--manual' }, [
      h('h2', { class: 'page-title' }, '📖 游戏说明'),
      ...cards,
      h('button', { class: 'btn', 'data-nav': 'home' }, '返回首页')
    ]));

    root.querySelector('[data-nav="home"]').addEventListener('click', () => navigate('home'));

    return () => {};
  },
  unmount() {}
};
