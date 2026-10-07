// Canvas 渲染器：棋盘、当前方块、幽灵方块、Next/Hold
import { COLS, ROWS, COLORS, TETROMINOES } from '../constants.js';
import { loadSettings } from '../storage.js';

export class Renderer {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = opts.cellSize || 30;
    this.showGrid = opts.gridLines !== false;
    // 设置画布逻辑尺寸
    canvas.width = COLS * this.cellSize;
    canvas.height = ROWS * this.cellSize;
  }

  setCellSize(size) {
    this.cellSize = size;
    this.canvas.width = COLS * size;
    this.canvas.height = ROWS * size;
  }

  // 获取当前主题对应的颜色表
  getColors() {
    const s = loadSettings();
    return COLORS[s.theme] || COLORS.classic;
  }

  clear() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawGridLines() {
    if (!this.showGrid) return;
    const { ctx, cellSize, canvas } = this;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(canvas.width, r * cellSize);
      ctx.stroke();
    }
  }

  drawCell(x, y, color, alpha = 1) {
    const { ctx, cellSize } = this;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    // 内描边
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
    ctx.globalAlpha = 1;
  }

  drawBoard(board) {
    this.clear();
    this.drawGridLines();
    const colors = this.getColors();
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const v = board.grid[r][c];
        if (v) this.drawCell(c, r, colors[v]);
      }
    }
  }

  drawPiece(piece, ghost = false) {
    const colors = this.getColors();
    const color = colors[piece.type];
    const cells = piece.getCells();
    for (const { x, y } of cells) {
      if (y < 0) continue;
      this.drawCell(x, y, color, ghost ? 0.25 : 1);
    }
  }

  drawGhost(piece, board) {
    const dy = board.dropDistance(piece);
    const ghostPiece = piece.clone();
    ghostPiece.y += dy;
    this.drawPiece(ghostPiece, true);
  }

  // 闪烁消行
  flashLines(lines) {
    const { ctx, cellSize } = this;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const r of lines) {
      ctx.fillRect(0, r * cellSize, this.canvas.width, cellSize);
    }
  }
}

// 小型渲染器：用于 Next/Hold 预览
export class MiniRenderer {
  constructor(canvas, type) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = 20;
  }

  drawPiece(piece) {
    if (!piece) return this.clear();
    const colors = (loadSettings(), COLORS.classic);
    const settings = loadSettings();
    const palette = COLORS[settings.theme] || COLORS.classic;
    const shape = piece.shape;
    // 计算实际边界，让方块居中
    let minR = shape.length, maxR = -1, minC = shape[0].length, maxC = -1;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          minR = Math.min(minR, r); maxR = Math.max(maxR, r);
          minC = Math.min(minC, c); maxC = Math.max(maxC, c);
        }
      }
    }
    const w = maxC - minC + 1, h = maxR - minR + 1;
    const offsetX = (this.canvas.width - w * this.cellSize) / 2;
    const offsetY = (this.canvas.height - h * this.cellSize) / 2;
    this.clear();
    const ctx = this.ctx;
    ctx.fillStyle = palette[piece.type];
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (shape[r][c]) {
          ctx.fillRect(offsetX + (c - minC) * this.cellSize, offsetY + (r - minR) * this.cellSize, this.cellSize - 2, this.cellSize - 2);
        }
      }
    }
  }

  clear() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
