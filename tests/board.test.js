import { describe, it, expect, beforeEach } from 'vitest';
import { Board } from '../js/game/Board.js';
import { Piece } from '../js/game/Piece.js';
import { COLS, ROWS } from '../js/constants.js';

let board;
beforeEach(() => {
  board = new Board();
});

describe('Board - 初始化', () => {
  it('棋盘尺寸正确', () => {
    expect(board.cols).toBe(COLS);
    expect(board.rows).toBe(ROWS);
  });

  it('初始网格全为 null', () => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        expect(board.grid[r][c]).toBeNull();
      }
    }
  });

  it('reset 清空棋盘', () => {
    board.grid[0][0] = 'T';
    board.reset();
    expect(board.grid[0][0]).toBeNull();
  });
});

describe('Board - 碰撞检测 isValid', () => {
  it('合法位置返回 true', () => {
    const p = new Piece('I');
    expect(board.isValid(p.shape, 0, 0)).toBe(true);
  });

  it('超出左边界返回 false', () => {
    const p = new Piece('I');
    expect(board.isValid(p.shape, -1, 0)).toBe(false);
  });

  it('超出右边界返回 false', () => {
    const p = new Piece('I');
    expect(board.isValid(p.shape, COLS, 0)).toBe(false);
  });

  it('超出底部返回 false', () => {
    const p = new Piece('O');
    expect(board.isValid(p.shape, 0, ROWS)).toBe(false);
  });

  it('顶部位置 y<0 允许（出生位置）', () => {
    const p = new Piece('O');
    // y=-1 表示部分超出顶部，但只要其他格子合法就允许
    expect(board.isValid(p.shape, 0, -1)).toBe(true);
  });

  it('已固化方块处冲突返回 false', () => {
    board.grid[5][0] = 'T';
    const p = new Piece('O');
    expect(board.isValid(p.shape, 0, 5)).toBe(false);
  });
});

describe('Board - 固化 lock', () => {
  it('将方块写入网格', () => {
    const p = new Piece('O');
    p.x = 0; p.y = ROWS - 2;
    const ok = board.lock(p);
    expect(ok).toBe(true);
    expect(board.grid[ROWS - 2][0]).toBe('O');
    expect(board.grid[ROWS - 1][0]).toBe('O');
  });

  it('lock 顶部越界返回 false（游戏结束）', () => {
    const p = new Piece('O');
    p.x = 0; p.y = -2; // 整块在棋盘上方
    const ok = board.lock(p);
    expect(ok).toBe(false);
  });
});

describe('Board - 消行 clearLines', () => {
  it('getFullLines 返回填满的行', () => {
    // 填满倒数第1行
    board.grid[ROWS - 1].fill('O');
    const full = board.getFullLines();
    expect(full).toEqual([ROWS - 1]);
  });

  it('未填满的行不返回', () => {
    board.grid[ROWS - 1][0] = null;
    board.grid[ROWS - 1].fill('O');
    board.grid[ROWS - 1][3] = null; // 留空
    expect(board.getFullLines()).toEqual([]);
  });

  it('clearLines 消除指定行并下移', () => {
    // 填满最后一行
    board.grid[ROWS - 1].fill('O');
    // 倒数第2行也部分填
    board.grid[ROWS - 2][0] = 'T';
    board.clearLines([ROWS - 1]);
    // 最后一行应该被空行替换（因为上方下移）
    expect(board.grid[ROWS - 1][0]).toBe('T');
    expect(board.grid[ROWS - 2][0]).toBeNull(); // 顶部补空
  });

  it('同时消除多行保持顺序', () => {
    board.grid[ROWS - 1].fill('O');
    board.grid[ROWS - 2].fill('O');
    board.grid[ROWS - 3].fill('O');
    board.clearLines([ROWS - 3, ROWS - 2, ROWS - 1]);
    expect(board.grid[ROWS - 1].every(v => v === null)).toBe(true);
    expect(board.grid[ROWS - 2].every(v => v === null)).toBe(true);
  });
});

describe('Board - dropDistance（幽灵方块）', () => {
  it('空棋盘上 O 方块下落距离 = ROWS - 2', () => {
    const p = new Piece('O');
    const d = board.dropDistance(p);
    expect(d).toBe(ROWS - 2); // 高度2，底部是 ROWS，所以下落 ROWS-2
  });

  it('有障碍时停止于其上方', () => {
    const p = new Piece('O');
    p.x = 0; p.y = 0;
    // 在第 5 行第 0 列放置障碍
    board.grid[5][0] = 'T';
    const d = board.dropDistance(p);
    // O 方块占据 y=0,1，下落到 y=3,4，正下方 y=5 是障碍，所以 dy=3
    expect(d).toBe(3);
  });
});

describe('Board - isOverflow（游戏结束判定）', () => {
  it('新方块在出生位置合法 → false', () => {
    const p = new Piece('T');
    expect(board.isOverflow(p)).toBe(false);
  });

  it('出生位置被占用 → true', () => {
    // 在出生位置预先放方块
    const p = new Piece('O');
    board.grid[0][p.x] = 'X';
    expect(board.isOverflow(p)).toBe(true);
  });
});

describe('Board - isDanger（危险线）', () => {
  it('空棋盘无危险', () => {
    expect(board.isDanger()).toBe(false);
  });

  it('顶部 4 行有方块时返回 true', () => {
    board.grid[2][3] = 'O';
    expect(board.isDanger()).toBe(true);
  });

  it('第 5 行以下不算危险', () => {
    board.grid[4][0] = 'O';
    expect(board.isDanger()).toBe(false);
  });
});
