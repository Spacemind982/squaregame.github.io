// 方块类：形状、旋转、移动
import { TETROMINOES, COLS } from '../constants.js';

// 7-bag 随机生成器：保证每 7 块必含全部 7 种
export class Bag {
  constructor() {
    this.queue = [];
    this.refill();
  }
  refill() {
    const types = Object.keys(TETROMINOES);
    // Fisher-Yates 洗牌
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    this.queue.push(...types);
  }
  next() {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift();
  }
  peek(n) {
    while (this.queue.length < n) this.refill();
    return this.queue.slice(0, n);
  }
}

export class Piece {
  constructor(type) {
    this.type = type;
    this.rotation = 0;
    this.shape = TETROMINOES[type][0];
    // 起始位置：顶部居中
    this.x = Math.floor((COLS - this.shape[0].length) / 2);
    this.y = 0;
  }

  // 顺时针旋转：返回新形状矩阵
  getRotatedShape() {
    const nextRot = (this.rotation + 1) % 4;
    return TETROMINOES[this.type][nextRot];
  }

  // 应用旋转
  rotate() {
    this.rotation = (this.rotation + 1) % 4;
    this.shape = TETROMINOES[this.type][this.rotation];
  }

  // 返回当前形状所有填充单元格的绝对坐标
  getCells(offsetX = 0, offsetY = 0, shape = null) {
    const s = shape || this.shape;
    const cells = [];
    for (let r = 0; r < s.length; r++) {
      for (let c = 0; c < s[r].length; c++) {
        if (s[r][c]) cells.push({ x: this.x + c + offsetX, y: this.y + r + offsetY });
      }
    }
    return cells;
  }

  clone() {
    const p = new Piece(this.type);
    p.rotation = this.rotation;
    p.shape = this.shape.map(row => [...row]);
    p.x = this.x;
    p.y = this.y;
    return p;
  }
}
