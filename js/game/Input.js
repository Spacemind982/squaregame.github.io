// 键盘输入处理 + DAS/ARR
import { DAS, ARR } from '../constants.js';

export class Input {
  constructor(settings) {
    this.keys = settings.keys;
    this.handlers = {};
    this.dasTimers = {};
    this.arrTimers = {};
    this.activeKeys = new Set();
  }

  updateSettings(settings) {
    this.keys = settings.keys;
  }

  // 注册动作回调
  on(action, fn) {
    this.handlers[action] = fn;
  }

  // 根据按键 code 反查动作名
  _actionFromCode(code) {
    for (const [action, c] of Object.entries(this.keys)) {
      if (c === code) return action;
    }
    return null;
  }

  handleKeyDown(code) {
    if (this.activeKeys.has(code)) {
      // 已按下，不重复触发单次动作
      return false;
    }
    this.activeKeys.add(code);
    const action = this._actionFromCode(code);
    if (!action) return false;

    // 单次触发
    this._trigger(action);

    // 对于可重复的动作（left/right/softDrop），启动 DAS
    if (action === 'left' || action === 'right' || action === 'softDrop') {
      this._startDAS(action);
    }
    return true;
  }

  handleKeyUp(code) {
    this.activeKeys.delete(code);
    const action = this._actionFromCode(code);
    if (action && (action === 'left' || action === 'right' || action === 'softDrop')) {
      this._stopDAS(action);
    }
  }

  _trigger(action) {
    const fn = this.handlers[action];
    if (fn) fn();
  }

  _startDAS(action) {
    this._stopDAS(action);
    this.dasTimers[action] = setTimeout(() => {
      // DAS 结束后启动 ARR
      this.arrTimers[action] = setInterval(() => this._trigger(action), ARR);
    }, DAS);
  }

  _stopDAS(action) {
    if (this.dasTimers[action]) {
      clearTimeout(this.dasTimers[action]);
      this.dasTimers[action] = null;
    }
    if (this.arrTimers[action]) {
      clearInterval(this.arrTimers[action]);
      this.arrTimers[action] = null;
    }
  }

  // 绑定到 document
  attach() {
    this._keydown = (e) => {
      // 阻止方向键滚动
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
      this.handleKeyDown(e.code);
    };
    this._keyup = (e) => this.handleKeyUp(e.code);
    document.addEventListener('keydown', this._keydown);
    document.addEventListener('keyup', this._keyup);
  }

  detach() {
    if (this._keydown) document.removeEventListener('keydown', this._keydown);
    if (this._keyup) document.removeEventListener('keyup', this._keyup);
    Object.keys(this.dasTimers).forEach(a => this._stopDAS(a));
  }
}
