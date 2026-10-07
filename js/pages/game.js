// 游戏页：装配 Tetris 实例 + 三栏 UI + 模态框
import { h } from '../utils/dom.js';
import { Tetris, STATE } from '../game/Tetris.js';
import { Renderer, MiniRenderer } from '../game/Renderer.js';
import { loadSettings, saveScore, saveStats, loadStats } from '../storage.js';
import { pad } from '../utils/format.js';

export const gamePage = {
  mount(root, { navigate }) {
    // 1. 渲染静态 HTML 骨架
    root.appendChild(
      h('div', { class: 'page page--game' }, [
        h('div', { class: 'game-layout' }, [
          h('aside', { class: 'game-side game-side--left' }, [
            h('div', { class: 'panel' }, [
              h('h3', { class: 'panel__title' }, 'HOLD'),
              h('canvas', { id: 'hold-canvas', width: '120', height: '120' })
            ]),
            h('div', { class: 'panel stats' }, [
              h('div', { class: 'stat' }, [h('span', {}, '分数'), h('div', { id: 'stat-score', class: 'stat__value' }, '000000')]),
              h('div', { class: 'stat' }, [h('span', {}, '等级'), h('div', { id: 'stat-level', class: 'stat__value' }, '1')]),
              h('div', { class: 'stat' }, [h('span', {}, '行数'), h('div', { id: 'stat-lines', class: 'stat__value' }, '0')])
            ])
          ]),
          h('main', { class: 'game-main' }, [
            h('canvas', { id: 'board-canvas', width: '300', height: '600' }),
            h('div', { id: 'pause-overlay', class: 'pause-overlay' }, h('div', { class: 'pause-overlay__text' }, '已暂停'))
          ]),
          h('aside', { class: 'game-side game-side--right' }, [
            h('div', { class: 'panel' }, [
              h('h3', { class: 'panel__title' }, 'NEXT'),
              h('canvas', { id: 'next-canvas', width: '120', height: '320' })
            ]),
            h('div', { class: 'game-controls' }, [
              h('button', { class: 'btn btn--small', id: 'btn-pause' }, '暂停'),
              h('button', { class: 'btn btn--small', id: 'btn-restart' }, '重新开始'),
              h('button', { class: 'btn btn--small', id: 'btn-exit' }, '退出')
            ])
          ])
        ]),
        h('div', { class: 'key-hint' }, '← → 移动 / ↑ 旋转 / ↓ 软降 / 空格 硬降 / C 暂存 / P 暂停')
      ])
    );

    // 2. 创建渲染器与 Tetris 实例
    const settings = loadSettings();
    const boardCanvas = root.querySelector('#board-canvas');
    const holdCanvas = root.querySelector('#hold-canvas');
    const nextCanvas = root.querySelector('#next-canvas');

    const renderer = new Renderer(boardCanvas, { gridLines: settings.gridLines });
    const miniHold = new MiniRenderer(holdCanvas);
    const miniNext = new MiniRenderer(nextCanvas);

    const pauseOverlay = root.querySelector('#pause-overlay');

    let tetris = null;

    // 统计更新回调
    const updateStats = (stats) => {
      const scoreEl = root.querySelector('#stat-score');
      const levelEl = root.querySelector('#stat-level');
      const linesEl = root.querySelector('#stat-lines');
      if (scoreEl) scoreEl.textContent = pad(stats.score, 6);
      if (levelEl) levelEl.textContent = String(stats.level);
      if (linesEl) linesEl.textContent = String(stats.lines);
    };

    // 状态变化回调
    const onStateChange = (state) => {
      if (state === STATE.PAUSED) {
        pauseOverlay.style.display = 'flex';
      } else {
        pauseOverlay.style.display = 'none';
      }
    };

    // 游戏结束回调：显示模态框 + 输入昵称
    const onGameOver = (stats) => {
      showGameOverModal(stats);
    };

    function startNewGame() {
      if (tetris) tetris.stop();
      tetris = new Tetris({
        renderer,
        miniRenderers: { hold: miniHold, next: miniNext },
        settings: loadSettings(),
        onStateChange,
        onStatsUpdate: updateStats,
        onGameOver
      });
      tetris._bindInput();
      tetris.start();
      updateStats(tetris.getStats());
    }

    // 3. 模态框：游戏结束
    function showGameOverModal(stats) {
      const modalRoot = document.getElementById('modal-root');
      if (!modalRoot) return;
      while (modalRoot.firstChild) modalRoot.removeChild(modalRoot.firstChild);

      const input = h('input', { type: 'text', class: 'modal__input', id: 'gameover-name', maxlength: '12', value: 'Player' });
      const scoreText = h('div', { class: 'modal__body' }, [
        h('div', {}, `分数：${pad(stats.score, 6)}`),
        h('div', {}, `等级：${stats.level}`),
        h('div', {}, `消行：${stats.lines}`)
      ]);

      const btn1 = h('button', { class: 'btn btn--primary' }, '保存并查看排行');
      const btn2 = h('button', { class: 'btn' }, '再来一局');
      const btn3 = h('button', { class: 'btn' }, '返回首页');

      btn1.addEventListener('click', () => {
        const name = (root.querySelector('#gameover-name') || input).value.trim() || 'Player';
        tetris.saveScore(name);
        // 累计统计由 Tetris._gameOver 内部已写入，这里再次校准
        saveStats(loadStats());
        closeModal();
        navigate('leaderboard');
      });
      btn2.addEventListener('click', () => {
        closeModal();
        startNewGame();
      });
      btn3.addEventListener('click', () => {
        closeModal();
        navigate('home');
      });

      const box = h('div', { class: 'modal__box' }, [
        h('div', { class: 'modal__title' }, 'GAME OVER'),
        scoreText,
        h('label', {}, '输入昵称：'),
        input,
        h('div', { class: 'modal__actions' }, [btn1, btn2, btn3])
      ]);
      const modal = h('div', { class: 'modal' }, box);
      modalRoot.appendChild(modal);
      setTimeout(() => input.focus(), 0);
    }

    function closeModal() {
      const modalRoot = document.getElementById('modal-root');
      if (modalRoot) while (modalRoot.firstChild) modalRoot.removeChild(modalRoot.firstChild);
    }

    // 4. 按钮绑定
    root.querySelector('#btn-pause').addEventListener('click', () => {
      if (tetris) tetris.togglePause();
    });
    root.querySelector('#btn-restart').addEventListener('click', () => {
      if (tetris) tetris.stop();
      startNewGame();
    });
    root.querySelector('#btn-exit').addEventListener('click', () => {
      if (tetris) tetris.stop();
      navigate('home');
    });

    // 5. 启动游戏
    startNewGame();

    // 卸载清理
    return () => {
      if (tetris) tetris.stop();
      closeModal();
    };
  },
  unmount() {}
};
