import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Tetris, STATE } from '../js/game/Tetris.js';
import { COLS, ROWS, SCORE_TABLE } from '../js/constants.js';
import { _resetAllForTest } from '../js/storage.js';

beforeEach(() => {
  _resetAllForTest();
});

// 工厂：用最小依赖构造 Tetris（无 renderer / 无 input.attach）
function makeTetris(opts = {}) {
  const settings = Object.assign({
    startLevel: 1,
    difficulty: 'normal',
    previewCount: 3,
    keys: { left: 'ArrowLeft', right: 'ArrowRight', rotate: 'ArrowUp', softDrop: 'ArrowDown', hardDrop: 'Space', hold: 'KeyC', pause: 'KeyP' }
  }, opts.settings || {});
  return new Tetris({ settings });
}

describe('Tetris - 初始化', () => {
  it('初始状态为 IDLE', () => {
    const t = makeTetris();
    expect(t.state).toBe(STATE.IDLE);
  });

  it('初始分数/行数为 0', () => {
    const t = makeTetris();
    expect(t.score).toBe(0);
    expect(t.lines).toBe(0);
  });

  it('起始等级来自设置', () => {
    const t = makeTetris({ settings: { startLevel: 5, difficulty: 'normal', previewCount: 3, keys: {} } });
    expect(t.level).toBe(5);
  });
});

describe('Tetris - start', () => {
  it('start 后状态变为 PLAYING', () => {
    const t = makeTetris();
    t.start();
    expect(t.state).toBe(STATE.PLAYING);
    expect(t.currentPiece).not.toBeNull();
  });

  it('start 重置统计', () => {
    const t = makeTetris();
    t.score = 999; t.lines = 30; t.level = 5;
    t.start();
    expect(t.score).toBe(0);
    expect(t.lines).toBe(0);
    expect(t.level).toBe(1);
  });

  it('start 生成 next 队列', () => {
    const t = makeTetris();
    t.start();
    expect(t.nextPieces.length).toBe(3);
  });

  it('多次 start 不创建多个 rAF 循环', () => {
    const t = makeTetris();
    t.start();
    const id1 = t.rafId;
    t.start();
    expect(t.rafId).toBe(id1); // 同一个 rAF（仍 PLAYING 时不重复启动）
  });
});

describe('Tetris - 计分', () => {
  it('软降每格 +1', () => {
    const t = makeTetris();
    t.start();
    const before = t.score;
    t._softDrop();
    expect(t.score).toBe(before + 1);
  });

  it('硬降每格 +2', () => {
    const t = makeTetris();
    t.start();
    const before = t.score;
    const dy = t.board.dropDistance(t.currentPiece);
    t._hardDrop();
    expect(t.score).toBe(before + dy * 2);
  });

  it('消除 1 行得分 = 100 × 等级', () => {
    const t = makeTetris({ settings: { startLevel: 1 } });
    t.start();
    // 手动填满最后一行
    for (let c = 0; c < COLS; c++) t.board.grid[ROWS - 1][c] = 'O';
    // 触发消行：用一个 O 方块压顶
    t._clearLines([ROWS - 1]);
    expect(t.score).toBe(100 * 1);
  });

  it('消除 4 行得分 = 800 × 等级', () => {
    const t = makeTetris({ settings: { startLevel: 2 } });
    t.start();
    const lines = [ROWS - 4, ROWS - 3, ROWS - 2, ROWS - 1];
    for (const r of lines) for (let c = 0; c < COLS; c++) t.board.grid[r][c] = 'O';
    t._clearLines(lines);
    expect(t.score).toBe(800 * 2);
  });
});

describe('Tetris - 等级系统', () => {
  it('每 10 行升级', () => {
    const t = makeTetris({ settings: { startLevel: 1 } });
    t.start();
    // 模拟消除 10 行
    t.lines = 9;
    t._clearLines([ROWS - 1]);
    expect(t.level).toBe(2);
  });

  it('起始等级 > 1 时升级基于起始等级', () => {
    const t = makeTetris({ settings: { startLevel: 5 } });
    t.start();
    t.lines = 9;
    t._clearLines([ROWS - 1]);
    // floor(10/10)+5 = 6
    expect(t.level).toBe(6);
  });
});

describe('Tetris - 暂停', () => {
  it('togglePause 在 PLAYING → PAUSED', () => {
    const t = makeTetris();
    t.start();
    t.togglePause();
    expect(t.state).toBe(STATE.PAUSED);
  });

  it('togglePause 在 PAUSED → PLAYING', () => {
    const t = makeTetris();
    t.start();
    t.togglePause();
    t.togglePause();
    expect(t.state).toBe(STATE.PLAYING);
  });

  it('PAUSED 状态下输入不响应', () => {
    const t = makeTetris();
    t.start();
    const before = t.currentPiece.x;
    t.togglePause();
    t._move(-1, 0);
    expect(t.currentPiece.x).toBe(before);
  });
});

describe('Tetris - 移动与旋转', () => {
  it('左移减小 x', () => {
    const t = makeTetris();
    t.start();
    const before = t.currentPiece.x;
    t._move(-1, 0);
    expect(t.currentPiece.x).toBe(before - 1);
  });

  it('右移增大 x', () => {
    const t = makeTetris();
    t.start();
    const before = t.currentPiece.x;
    t._move(1, 0);
    expect(t.currentPiece.x).toBe(before + 1);
  });

  it('撞墙时不动', () => {
    const t = makeTetris();
    t.start();
    // 移到最左
    for (let i = 0; i < COLS; i++) t._move(-1, 0);
    const before = t.currentPiece.x;
    t._move(-1, 0);
    expect(t.currentPiece.x).toBe(before);
  });

  it('旋转切换 rotation', () => {
    const t = makeTetris();
    t.start();
    const before = t.currentPiece.rotation;
    t._rotate();
    expect(t.currentPiece.rotation).not.toBe(before);
  });
});

describe('Tetris - Hold', () => {
  it('首次 Hold 把当前方块存入并生成新方块', () => {
    const t = makeTetris();
    t.start();
    const cur = t.currentPiece.type;
    t._hold();
    expect(t.holdPiece.type).toBe(cur);
    expect(t.holdUsed).toBe(true);
  });

  it('holdUsed 为 true 时再次 Hold 无效', () => {
    const t = makeTetris();
    t.start();
    t._hold();
    const before = t.holdPiece.type;
    t._hold(); // 应无效
    expect(t.holdPiece.type).toBe(before);
  });

  it('已有 Hold 时交换', () => {
    const t = makeTetris();
    t.start();
    t._hold(); // 第一次：存入 cur，新方块 cur2
    const heldType = t.holdPiece.type;
    const curType = t.currentPiece.type;
    t.holdUsed = false; // 模拟新方块落地前手动允许再次
    t._hold();
    expect(t.currentPiece.type).toBe(heldType);
    expect(t.holdPiece.type).toBe(curType);
  });
});

describe('Tetris - 游戏结束', () => {
  it('方块在出生位置碰撞 → GAME_OVER', () => {
    const t = makeTetris();
    t.start();
    // 在出生位置预占
    const p = t.currentPiece;
    for (const { x, y } of p.getCells()) {
      if (y >= 0 && y < ROWS) t.board.grid[y][x] = 'X';
    }
    t._spawnNext();
    expect(t.state).toBe(STATE.GAME_OVER);
  });

  it('onGameOver 回调被调用', () => {
    let called = false;
    const t = new Tetris({
      settings: { startLevel: 1, difficulty: 'normal', previewCount: 3, keys: {} },
      onGameOver: () => { called = true; }
    });
    t.start();
    // 制造游戏结束
    const p = t.currentPiece;
    for (const { x, y } of p.getCells()) {
      if (y >= 0 && y < ROWS) t.board.grid[y][x] = 'X';
    }
    t._spawnNext();
    expect(called).toBe(true);
  });
});

describe('Tetris - Input', () => {
  it('handleKeyDown 触发 left 动作', () => {
    const t = makeTetris();
    t._bindInput();
    t.start();
    const before = t.currentPiece.x;
    t.input.handleKeyDown('ArrowLeft');
    expect(t.currentPiece.x).toBe(before - 1);
  });

  it('handleKeyDown 触发 rotate', () => {
    const t = makeTetris();
    t._bindInput();
    t.start();
    const before = t.currentPiece.rotation;
    t.input.handleKeyDown('ArrowUp');
    expect(t.currentPiece.rotation).not.toBe(before);
  });

  it('未注册的按键不响应', () => {
    const t = makeTetris();
    t._bindInput();
    t.start();
    const before = t.currentPiece.x;
    t.input.handleKeyDown('KeyZ'); // 未绑定
    expect(t.currentPiece.x).toBe(before);
  });

  it('PAUSED 状态下输入不触发', () => {
    const t = makeTetris();
    t._bindInput();
    t.start();
    t.togglePause();
    const before = t.currentPiece.x;
    t.input.handleKeyDown('ArrowLeft');
    expect(t.currentPiece.x).toBe(before);
  });
});

describe('Tetris - 7-bag 公平性', () => {
  it('连续 14 个方块包含每种各 2 个', () => {
    const t = makeTetris();
    t.start();
    const got = [];
    for (let i = 0; i < 14; i++) {
      got.push(t.currentPiece.type);
      t.currentPiece = null;
      t._spawnNext();
    }
    const counts = {};
    for (const ty of got) counts[ty] = (counts[ty] || 0) + 1;
    for (const k of Object.keys(counts)) {
      expect(counts[k]).toBe(2);
    }
  });
});
