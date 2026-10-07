// 测试环境初始化：为 jsdom 补充 Canvas / AudioContext / localStorage mock
import { vi } from 'vitest';

// Canvas 2D 上下文 mock（强制覆盖 jsdom 的空实现）
function makeCtx() {
  return {
    fillRect: () => {},
    clearRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    measureText: () => ({ width: 0 }),
    drawImage: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => ({ data: [] })
  };
}
HTMLCanvasElement.prototype.getContext = function () {
  if (!this.__mockCtx) this.__mockCtx = makeCtx();
  return this.__mockCtx;
};

// requestAnimationFrame / cancelAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// AudioContext mock
function mockAudioParam() {
  return {
    value: 0,
    setValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
    cancelScheduledValues: () => {},
    setTargetAtTime: () => {}
  };
}
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = { connect: () => {} };
    this.sampleRate = 44100;
  }
  createGain() {
    const node = { connect: () => node, gain: mockAudioParam() };
    return node;
  }
  createOscillator() {
    const node = {
      type: 'sine',
      frequency: mockAudioParam(),
      connect: () => node,
      start: () => {},
      stop: () => {}
    };
    return node;
  }
  createBuffer(channels, length, rate) {
    return { getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() {
    const node = { buffer: null, connect: () => node, start: () => {}, stop: () => {} };
    return node;
  }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// localStorage 默认由 jsdom 提供，但确保清空
beforeEach(() => {
  window.localStorage.clear();
});
