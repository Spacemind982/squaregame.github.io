// 游戏主控制器：状态机、主循环、计分、等级、消行、游戏结束
import { Board } from './Board.js';
import { Piece, Bag } from './Piece.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import {
  SCORE_TABLE, LINES_PER_LEVEL, LEVEL_SPEED, DIFFICULTY_MULTIPLIER, MAX_SCORES,
  TETROMINOES
} from '../constants.js';
import { loadSettings, saveScore, saveStats } from '../storage.js';
import { formatDate } from '../utils/format.js';
import { play as playSfx } from '../audio/AudioEngine.js';

const STATE = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LINE_CLEARING: 'lineClearing',
  GAME_OVER: 'gameOver'
};

export class Tetris {
  constructor(opts = {}) {
    this.board = new Board();
    this.bag = new Bag();
    this.renderer = opts.renderer;
    this.miniRenderers = opts.miniRenderers || {};
    this.onStateChange = opts.onStateChange || (() => {});
    this.onGameOver = opts.onGameOver || (() => {});
    this.onStatsUpdate = opts.onStatsUpdate || (() => {});

    const settings = opts.settings || loadSettings();
    this.settings = settings;
    this.input = new Input(settings);

    this.state = STATE.IDLE;
    this.score = 0;
    this.level = settings.startLevel || 1;
    this.lines = 0;
    this.dropAccumulator = 0;
    this.lastTime = 0;
    this.rafId = null;

    this.currentPiece = null;
    this.nextPieces = this.bag.peek(settings.previewCount || 3);
    this.holdPiece = null;
    this.holdUsed = false;
  }

  // 注册输入动作
  _bindInput() {
    this.input.on('left', () => this._move(-1, 0));
    this.input.on('right', () => this._move(1, 0));
    this.input.on('rotate', () => this._rotate());
    this.input.on('softDrop', () => this._softDrop());
    this.input.on('hardDrop', () => this._hardDrop());
    this.input.on('hold', () => this._hold());
    this.input.on('pause', () => this.togglePause());
  }

  start() {
    if (this.state !== STATE.IDLE && this.state !== STATE.GAME_OVER) return;
    this.board.reset();
    this.score = 0;
    this.level = this.settings.startLevel || 1;
    this.lines = 0;
    this.holdPiece = null;
    this.holdUsed = false;
    this.bag = new Bag();
    this.nextPieces = this.bag.peek(this.settings.previewCount || 3);
    this._spawnNext();
    this._setState(STATE.PLAYING);
    this._render();
    this.input.attach();
    this._loop(performance.now());
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.input.detach();
    this._setState(STATE.IDLE);
  }

  togglePause() {
    if (this.state === STATE.PLAYING) {
      this._setState(STATE.PAUSED);
      if (this.rafId) cancelAnimationFrame(this.rafId);
      playSfx('pause');
    } else if (this.state === STATE.PAUSED) {
      this._setState(STATE.PLAYING);
      this.lastTime = performance.now();
      this._loop(this.lastTime);
      playSfx('pause');
    }
  }

  _setState(s) {
    this.state = s;
    this.onStateChange(s);
  }

  _spawnNext() {
    const type = this.bag.next();
    // 同步保持 nextPieces 长度
    this.nextPieces = this.bag.peek(this.settings.previewCount || 3);
    this.currentPiece = new Piece(type);
    this.holdUsed = false;

    if (this.board.isOverflow(this.currentPiece)) {
      this._gameOver();
    }
  }

  _move(dx, dy) {
    if (this.state !== STATE.PLAYING || !this.currentPiece) return;
    const nx = this.currentPiece.x + dx;
    const ny = this.currentPiece.y + dy;
    if (this.board.isValid(this.currentPiece.shape, nx, ny)) {
      this.currentPiece.x = nx;
      this.currentPiece.y = ny;
      this._render();
      playSfx('move');
    }
  }

  _rotate() {
    if (this.state !== STATE.PLAYING || !this.currentPiece) return;
    const newShape = this.currentPiece.getRotatedShape();
    if (this.board.isValid(newShape, this.currentPiece.x, this.currentPiece.y)) {
      this.currentPiece.rotate();
      this._render();
      playSfx('rotate');
    }
  }

  _softDrop() {
    if (this.state !== STATE.PLAYING || !this.currentPiece) return;
    if (this.board.isValid(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y + 1)) {
      this.currentPiece.y++;
      this.score += 1;
      this._render();
      this.onStatsUpdate(this.getStats());
      playSfx('softDrop');
    } else {
      this._lock();
    }
  }

  _hardDrop() {
    if (this.state !== STATE.PLAYING || !this.currentPiece) return;
    const dy = this.board.dropDistance(this.currentPiece);
    this.currentPiece.y += dy;
    this.score += dy * 2;
    playSfx('hardDrop');
    this._lock();
  }

  _hold() {
    if (this.state !== STATE.PLAYING || !this.currentPiece || this.holdUsed) return;
    if (this.holdPiece) {
      const tmp = this.holdPiece.type;
      this.holdPiece = new Piece(this.currentPiece.type);
      this.currentPiece = new Piece(tmp);
    } else {
      this.holdPiece = new Piece(this.currentPiece.type);
      this._spawnNext();
    }
    this.holdUsed = true;
    this._render();
    playSfx('hold');
  }

  _lock() {
    const ok = this.board.lock(this.currentPiece);
    if (!ok) {
      this._gameOver();
      return;
    }
    playSfx('lock');
    const full = this.board.getFullLines();
    if (full.length > 0) {
      this._clearLines(full);
    } else {
      this._spawnNext();
      this._render();
    }
  }

  _clearLines(lines) {
    // 数据立即更新（计分、行数、升级）—— 同步以便测试与逻辑正确
    this.lines += lines.length;
    this.score += SCORE_TABLE[lines.length] * this.level;
    const newLevel = Math.floor(this.lines / LINES_PER_LEVEL) + (this.settings.startLevel || 1);
    const leveledUp = newLevel > this.level;
    if (leveledUp) this.level = newLevel;

    this._setState(STATE.LINE_CLEARING);
    if (this.renderer) this.renderer.flashLines(lines);
    this.onStatsUpdate(this.getStats());

    // 播放消行音效
    playSfx('clear' + lines.length);
    if (leveledUp) playSfx('levelUp');

    // 短延时后真正消除行并生成新方块（保留视觉闪烁）
    setTimeout(() => {
      this.board.clearLines(lines);
      this._spawnNext();
      if (this.state === STATE.LINE_CLEARING) this._setState(STATE.PLAYING);
      this._render();
    }, 200);
  }

  _gameOver() {
    this._setState(STATE.GAME_OVER);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.input.detach();
    playSfx('gameOver');
    // 写入统计
    saveStats({
      totalGames: 1, // 在原值上加 1，需先读再加
    });
    // 由于 saveStats 是合并写，totalGames 是覆盖；改为读取再加
    const stats = this._accumulateStats();
    saveStats(stats);
    this.onGameOver(this.getStats());
  }

  _accumulateStats() {
    // 在 storage.js 之上做增量
    const prev = (() => {
      try {
        const raw = window.localStorage.getItem('tetris_stats');
        return raw ? JSON.parse(raw) : { totalGames: 0, highScore: 0, totalLines: 0 };
      } catch (e) { return { totalGames: 0, highScore: 0, totalLines: 0 }; }
    })();
    return {
      totalGames: (prev.totalGames || 0) + 1,
      highScore: Math.max(prev.highScore || 0, this.score),
      totalLines: (prev.totalLines || 0) + this.lines
    };
  }

  saveScore(name) {
    saveScore({ name, score: this.score, level: this.level, date: formatDate() });
  }

  getStats() {
    return { score: this.score, level: this.level, lines: this.lines };
  }

  _loop(time) {
    if (this.state !== STATE.PLAYING) return;
    if (!this.lastTime) this.lastTime = time;
    const dt = time - this.lastTime;
    this.lastTime = time;
    this.dropAccumulator += dt;
    const interval = this._dropInterval();
    if (this.dropAccumulator >= interval) {
      this.dropAccumulator = 0;
      this._gravity();
    }
    this.rafId = requestAnimationFrame((t) => this._loop(t));
  }

  _dropInterval() {
    const base = LEVEL_SPEED[Math.min(this.level, 10)] || 150;
    const mul = DIFFICULTY_MULTIPLIER[this.settings.difficulty] || 1;
    return base * mul;
  }

  _gravity() {
    if (!this.currentPiece) return;
    if (this.board.isValid(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y + 1)) {
      this.currentPiece.y++;
      this._render();
    } else {
      this._lock();
    }
  }

  _render() {
    if (!this.renderer) return;
    this.renderer.drawBoard(this.board);
    if (this.currentPiece && this.state === STATE.PLAYING) {
      this.renderer.drawGhost(this.currentPiece, this.board);
      this.renderer.drawPiece(this.currentPiece);
    }
    if (this.miniRenderers.hold && this.holdPiece) {
      this.miniRenderers.hold.drawPiece(this.holdPiece);
    }
    if (this.miniRenderers.next) {
      // 简化：每次只画第一个 next
      this.miniRenderers.next.drawPiece(this.nextPieces[0] ? new Piece(this.nextPieces[0]) : null);
    }
    this.onStatsUpdate(this.getStats());
  }
}

export { STATE };
