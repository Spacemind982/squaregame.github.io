import { describe, it, expect } from 'vitest';
import { Piece, Bag } from '../js/game/Piece.js';
import { TETROMINOES, COLS } from '../js/constants.js';

describe('Bag - 7-bag 随机生成器', () => {
  it('每次 next() 返回 7 种之一', () => {
    const bag = new Bag();
    const types = Object.keys(TETROMINOES);
    for (let i = 0; i < 30; i++) {
      expect(types).toContain(bag.next());
    }
  });

  it('前 7 块必包含全部 7 种', () => {
    for (let trial = 0; trial < 10; trial++) {
      const bag = new Bag();
      const got = new Set();
      for (let i = 0; i < 7; i++) got.add(bag.next());
      expect(got.size).toBe(7);
    }
  });

  it('peek 不消耗队列', () => {
    const bag = new Bag();
    const peeked = bag.peek(3);
    expect(peeked.length).toBe(3);
    const n1 = bag.next();
    expect(n1).toBe(peeked[0]);
  });
});

describe('Piece - 创建与旋转', () => {
  it('初始位置在顶部居中', () => {
    const p = new Piece('T');
    expect(p.x).toBe(Math.floor((COLS - p.shape[0].length) / 2));
    expect(p.y).toBe(0);
    expect(p.type).toBe('T');
    expect(p.rotation).toBe(0);
  });

  it('rotate() 顺时针切换 4 个旋转状态', () => {
    const p = new Piece('T');
    expect(p.rotation).toBe(0);
    p.rotate();
    expect(p.rotation).toBe(1);
    p.rotate();
    expect(p.rotation).toBe(2);
    p.rotate();
    expect(p.rotation).toBe(3);
    p.rotate();
    expect(p.rotation).toBe(0); // 循环
  });

  it('rotate 后 shape 与 TETROMINOES 表一致', () => {
    const p = new Piece('I');
    p.rotate();
    expect(p.shape).toEqual(TETROMINOES.I[1]);
  });

  it('getCells 返回填充单元格的绝对坐标', () => {
    const p = new Piece('O');
    const cells = p.getCells();
    // O 形 [[1,1],[1,1]]，4 个填充单元格
    expect(cells.length).toBe(4);
    // 所有 cell 应该在棋盘范围内
    for (const { x, y } of cells) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(COLS);
      expect(y).toBeGreaterThanOrEqual(0);
    }
  });

  it('clone 产生独立副本', () => {
    const p = new Piece('L');
    const c = p.clone();
    expect(c.type).toBe(p.type);
    expect(c.x).toBe(p.x);
    c.rotate();
    expect(c.rotation).toBe(1);
    expect(p.rotation).toBe(0); // 原件不变
  });

  it('getRotatedShape 不修改当前 shape', () => {
    const p = new Piece('T');
    const before = JSON.parse(JSON.stringify(p.shape));
    p.getRotatedShape();
    expect(p.shape).toEqual(before);
  });

  it('I 方块所有 4 个旋转状态均不空', () => {
    const p = new Piece('I');
    for (let i = 0; i < 4; i++) {
      const cells = p.getCells();
      expect(cells.length).toBeGreaterThan(0);
      p.rotate();
    }
  });

  it('7 种方块均能正确实例化与旋转', () => {
    for (const type of Object.keys(TETROMINOES)) {
      const p = new Piece(type);
      expect(p.shape).toEqual(TETROMINOES[type][0]);
      for (let i = 0; i < 4; i++) {
        expect(p.shape).toEqual(TETROMINOES[type][i]);
        p.rotate();
      }
    }
  });
});
