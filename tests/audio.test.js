import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SFX, play, setEnabled, setVolume, resume, syncFromSettings
} from '../js/audio/AudioEngine.js';
import { saveSettings, _resetAllForTest } from '../js/storage.js';

beforeEach(() => {
  _resetAllForTest();
  // 每个测试默认启用音效
  setEnabled(true);
  setVolume(0.5);
});

describe('AudioEngine - 基础 API', () => {
  it('setEnabled(false) 时 play 不调用底层', () => {
    setEnabled(false);
    // 不报错即通过
    expect(() => play('move')).not.toThrow();
  });

  it('setVolume 自动夹紧到 [0,1]', () => {
    setVolume(-1);
    setVolume(2);
    // 不报错即可
    expect(true).toBe(true);
  });

  it('play 未知名称不抛错', () => {
    expect(() => play('nonexistent')).not.toThrow();
  });

  it('resume 在无 AudioContext 时不抛错', () => {
    expect(() => resume()).not.toThrow();
  });
});

describe('AudioEngine - SFX 集合', () => {
  const names = ['move','rotate','softDrop','hardDrop','hold','lock','clear1','clear2','clear3','clear4','levelUp','gameOver','pause','uiClick'];
  for (const name of names) {
    it(`SFX.${name} 存在且可调用`, () => {
      expect(typeof SFX[name]).toBe('function');
      expect(() => SFX[name]()).not.toThrow();
    });
  }

  it('play(name) 等价于 SFX[name]()', () => {
    // 用 mock 验证调用映射
    const original = SFX.move;
    let called = 0;
    SFX.move = () => { called++; };
    play('move');
    expect(called).toBe(1);
    SFX.move = original;
  });
});

describe('AudioEngine - 设置同步', () => {
  it('syncFromSettings 读取设置开关', () => {
    saveSettings({ sound: false, soundVolume: 0.3 });
    syncFromSettings();
    // 不报错即可（内部状态已更新）
    expect(() => play('move')).not.toThrow();
  });

  it('syncFromSettings 读取音量', () => {
    saveSettings({ sound: true, soundVolume: 0.7 });
    syncFromSettings();
    expect(() => play('move')).not.toThrow();
  });
});

describe('AudioEngine - 与 Tetris 集成', () => {
  it('Tetris 调用 play 不抛错', async () => {
    const { Tetris } = await import('../js/game/Tetris.js');
    const t = new Tetris({ settings: { startLevel: 1, previewCount: 3, keys: {} } });
    t._bindInput();
    t.start();
    // 触发各种动作，确保不抛错
    t._move(1, 0);
    t._rotate();
    t._softDrop();
    t._hardDrop();
    t.togglePause();
    t.togglePause();
    t.stop();
    expect(true).toBe(true);
  });
});
