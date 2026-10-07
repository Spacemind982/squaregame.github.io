// 音效引擎：基于 Web Audio API 合成
// 所有效果在内存中合成，不依赖外部资源
import { loadSettings } from '../storage.js';

let _ctx = null;
let _master = null;
let _enabled = true;
let _volume = 0.5;

function ensureCtx() {
  if (_ctx) return _ctx;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    _ctx = new Ctor();
    _master = _ctx.createGain();
    _master.gain.value = _volume;
    _master.connect(_ctx.destination);
  } catch (e) {
    _ctx = null;
  }
  return _ctx;
}

export function setEnabled(v) { _enabled = !!v; }
export function setVolume(v) {
  _volume = Math.max(0, Math.min(1, v));
  if (_master) _master.gain.value = _volume;
}

// 通用：合成一段音色
function tone({ freq = 440, dur = 0.1, type = 'square', slideTo = null, gain = 0.3, when = 0 } = {}) {
  const ctx = ensureCtx();
  if (!ctx || !_enabled) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  }
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(_master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// 噪声段（用于爆炸/锁墙）
function noise({ dur = 0.2, gain = 0.2, when = 0 } = {}) {
  const ctx = ensureCtx();
  if (!ctx || !_enabled) return;
  const t0 = ctx.currentTime + when;
  const bufSize = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(g).connect(_master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

// === 各种游戏音效 ===
export const SFX = {
  move()   { tone({ freq: 220, dur: 0.04, type: 'square', gain: 0.15 }); },
  rotate() { tone({ freq: 330, dur: 0.05, type: 'square', gain: 0.18 }); },
  softDrop() { tone({ freq: 180, dur: 0.04, type: 'square', gain: 0.12 }); },
  hardDrop() {
    tone({ freq: 420, dur: 0.06, type: 'square', gain: 0.2, slideTo: 80 });
    noise({ dur: 0.12, gain: 0.18, when: 0.02 });
  },
  hold()   { tone({ freq: 392, dur: 0.06, type: 'triangle', gain: 0.18 }); },
  lock()   { tone({ freq: 200, dur: 0.05, type: 'square', gain: 0.18, slideTo: 120 }); },
  clear1() { tone({ freq: 587, dur: 0.12, type: 'square', gain: 0.25 }); },
  clear2() {
    tone({ freq: 587, dur: 0.12, type: 'square', gain: 0.25 });
    tone({ freq: 784, dur: 0.12, type: 'square', gain: 0.25, when: 0.08 });
  },
  clear3() {
    tone({ freq: 587, dur: 0.12, type: 'square', gain: 0.28 });
    tone({ freq: 784, dur: 0.12, type: 'square', gain: 0.28, when: 0.08 });
    tone({ freq: 988, dur: 0.15, type: 'square', gain: 0.28, when: 0.16 });
  },
  clear4() { // Tetris!
    [523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, dur: 0.18, type: 'square', gain: 0.3, when: i * 0.08 })
    );
    noise({ dur: 0.3, gain: 0.18, when: 0.32 });
  },
  levelUp() {
    [392, 494, 587, 784].forEach((f, i) =>
      tone({ freq: f, dur: 0.15, type: 'triangle', gain: 0.25, when: i * 0.06 })
    );
  },
  gameOver() {
    [330, 277, 233, 196, 165].forEach((f, i) =>
      tone({ freq: f, dur: 0.18, type: 'sawtooth', gain: 0.22, when: i * 0.1 })
    );
  },
  pause()  { tone({ freq: 440, dur: 0.08, type: 'sine', gain: 0.2 }); },
  uiClick() { tone({ freq: 660, dur: 0.03, type: 'square', gain: 0.12 }); }
};

// 统一对外 API
export function play(name) {
  const fn = SFX[name];
  if (fn) {
    try { fn(); } catch (e) {}
  }
}

// 在用户首次交互时唤醒 AudioContext（浏览器策略）
export function resume() {
  const ctx = ensureCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// 从设置同步音量与开关
export function syncFromSettings() {
  const s = loadSettings();
  setEnabled(s.sound);
  setVolume(s.soundVolume);
}
