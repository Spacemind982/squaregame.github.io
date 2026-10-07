// 棋盘：碰撞检测、固化、消行、溢出
import { COLS, ROWS } from '../constants.js';

export class Board {
  constructor() {
    this.cols = COLS;
    this.rows = ROWS;
    this.grid = this._empty();
  }

  _empty() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  reset() {
    this.grid = this._empty();
  }

  // 检测给定形状+位置是否合法
  isValid(shape, x, y) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = x + c;
        const ny = y + r;
        if (nx < 0 || nx >= this.cols || ny >= this.rows) return false;
        if (ny < 0) continue; // 顶部允许超出
        if (this.grid[ny][nx]) return false;
      }
    }
    return true;
  }

  // 固化方块到棋盘
  lock(piece) {
    const cells = piece.getCells();
    for (const { x, y } of cells) {
      if (y < 0) {
        // 落到顶部之外 → 游戏结束标志
        return false;
      }
      if (y < this.rows && x >= 0 && x < this.cols) {
        this.grid[y][x] = piece.type;
      }
    }
    return true;
  }

  // 返回填满的行号
  getFullLines() {
    const lines = [];
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r].every(v => v !== null)) lines.push(r);
    }
    return lines;
  }

  // 消除指定行并下移
  clearLines(lines) {
    lines.sort((a, b) => a - b);
    // 从下往上删除并补行
    for (const line of lines) {
      this.grid.splice(line, 1);
      this.grid.unshift(Array(this.cols).fill(null));
    }
  }

  // 判断游戏结束：方块在初始位置就碰撞
  isOverflow(piece) {
    return !this.isValid(piece.shape, piece.x, piece.y);
  }

  // 计算方块下落到底的虚拟位置（用于幽灵方块）
  dropDistance(piece) {
    let dy = 0;
    while (this.isValid(piece.shape, piece.x, piece.y + dy + 1)) {
      dy++;
    }
    return dy;
  }

  // 危险线判定：堆叠到顶部 4 行内
  isDanger() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) return true;
      }
    }
    return false;
  }
}
