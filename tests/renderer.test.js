import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer, MiniRenderer } from '../js/game/Renderer.js';
import { Board } from '../js/game/Board.js';
import { Piece } from '../js/game/Piece.js';
import { COLS, ROWS } from '../js/constants.js';
import { _resetAllForTest } from '../js/storage.js';

let canvas;
beforeEach(() => {
  _resetAllForTest();
  canvas = document.createElement('canvas');
  canvas.width = 300; canvas.height = 600;
});

describe('Renderer - 初始化', () => {
  it('构造后画布逻辑尺寸正确', () => {
    const r = new Renderer(canvas, { cellSize: 30 });
    expect(canvas.width).toBe(COLS * 30);
    expect(canvas.height).toBe(ROWS * 30);
  });

  it('setCellSize 改变画布尺寸', () => {
    const r = new Renderer(canvas, { cellSize: 30 });
    r.setCellSize(20);
    expect(canvas.width).toBe(COLS * 20);
    expect(canvas.height).toBe(ROWS * 20);
  });

  it('getColors 返回当前主题的颜色表', () => {
    const r = new Renderer(canvas);
    const colors = r.getColors();
    expect(colors.I).toBeTruthy();
    expect(colors.O).toBeTruthy();
    expect(colors.T).toBeTruthy();
  });
});

describe('Renderer - 绘制', () => {
  it('drawBoard 不抛错', () => {
    const r = new Renderer(canvas);
    const board = new Board();
    board.grid[10][5] = 'I';
    expect(() => r.drawBoard(board)).not.toThrow();
  });

  it('drawPiece 绘制当前方块不抛错', () => {
    const r = new Renderer(canvas);
    const p = new Piece('T');
    expect(() => r.drawPiece(p)).not.toThrow();
  });

  it('drawGhost 绘制幽灵方块不抛错', () => {
    const r = new Renderer(canvas);
    const board = new Board();
    const p = new Piece('O');
    expect(() => r.drawGhost(p, board)).not.toThrow();
  });

  it('flashLines 不抛错', () => {
    const r = new Renderer(canvas);
    expect(() => r.flashLines([5, 10, 15])).not.toThrow();
  });

  it('clear 不抛错', () => {
    const r = new Renderer(canvas);
    expect(() => r.clear()).not.toThrow();
  });
});

describe('MiniRenderer - Next/Hold 渲染', () => {
  it('drawPiece(null) 调用 clear 不抛错', () => {
    const mini = new MiniRenderer(canvas, 'next');
    expect(() => mini.drawPiece(null)).not.toThrow();
  });

  it('drawPiece 渲染方块不抛错', () => {
    const mini = new MiniRenderer(canvas, 'hold');
    const p = new Piece('I');
    expect(() => mini.drawPiece(p)).not.toThrow();
  });

  it('drawPiece 渲染 7 种方块都不抛错', () => {
    const mini = new MiniRenderer(canvas, 'next');
    const types = ['I', 'O', 'T', 'S', 'Z', 'L', 'J'];
    for (const t of types) {
      const p = new Piece(t);
      expect(() => mini.drawPiece(p)).not.toThrow();
    }
  });
});
