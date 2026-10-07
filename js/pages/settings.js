// 设置页：完整交互（音效、按键、主题、显示、难度、统计、数据管理）
import { h } from '../utils/dom.js';
import {
  loadSettings, saveSettings, resetSettings,
  loadStats, saveStats, clearStats,
  loadScores, clearScores, exportAll, importAll,
  clearAll
} from '../storage.js';
import { DEFAULT_SETTINGS } from '../constants.js';
import { showConfirm, showAlert } from '../utils/confirm.js';
import { applyTheme } from '../themes.js';

// 主题切换实时生效（实际渲染由 app.js 的 applyTheme 负责）
let applyThemeFn = null;

export const settingsPage = {
  mount(root, { navigate }) {
    let s = loadSettings();
    let stats = loadStats();
    let scores = loadScores();

    const keyRow = (label, key) => h('div', { class: 'key-row' }, [
      h('span', { class: 'key-row__label' }, label),
      h('span', { class: 'key-row__key', id: `key-${key}` }, displayKeyCode(s.keys[key])),
      h('button', { class: 'btn btn--small', 'data-rebind': key }, '改')
    ]);

    root.appendChild(h('div', { class: 'page page--settings' }, [
      h('h2', { class: 'page-title' }, '数据与设置'),

      // 一、音效
      h('section', { class: 'card' }, [
        h('h3', { class: 'card__title' }, '一、音效设置'),
        h('div', { class: 'row' }, [h('label', {}, '音效'), h('input', { type: 'checkbox', id: 'sfx-toggle', ...(s.sound ? { checked: 'checked' } : {}) })]),
        h('div', { class: 'row' }, [h('label', {}, '音效音量'), h('input', { type: 'range', id: 'sfx-vol', min: '0', max: '1', step: '0.01', value: String(s.soundVolume) }), h('span', { id: 'sfx-vol-val' }, String(s.soundVolume.toFixed(2)))]),
        h('div', { class: 'row' }, [h('label', {}, '背景音乐'), h('input', { type: 'checkbox', id: 'bgm-toggle', ...(s.bgm ? { checked: 'checked' } : {}) })]),
        h('div', { class: 'row' }, [h('label', {}, 'BGM 音量'), h('input', { type: 'range', id: 'bgm-vol', min: '0', max: '1', step: '0.01', value: String(s.bgmVolume) }), h('span', { id: 'bgm-vol-val' }, String(s.bgmVolume.toFixed(2)))])
      ]),

      // 二、按键自定义
      h('section', { class: 'card' }, [
        h('h3', { class: 'card__title' }, '二、按键自定义'),
        keyRow('左移', 'left'),
        keyRow('右移', 'right'),
        keyRow('旋转', 'rotate'),
        keyRow('软降', 'softDrop'),
        keyRow('硬降', 'hardDrop'),
        keyRow('暂存', 'hold'),
        keyRow('暂停', 'pause'),
        h('button', { class: 'btn btn--small', id: 'btn-reset-keys' }, '恢复默认')
      ]),

      // 三、主题与显示
      h('section', { class: 'card' }, [
        h('h3', { class: 'card__title' }, '三、主题与显示'),
        h('div', { class: 'row' }, [
          h('label', {}, '主题'),
          ...['classic', 'dark', 'neon'].map(t =>
            h('button', { class: `btn btn--small ${s.theme === t ? 'btn--active' : ''}`, 'data-theme': t }, themeLabel(t))
          )
        ]),
        h('div', { class: 'row' }, [
          h('label', {}, '下一块预览数'),
          ...[1, 3, 5].map(n =>
            h('button', { class: `btn btn--small ${s.previewCount === n ? 'btn--active' : ''}`, 'data-preview': String(n) }, String(n))
          )
        ]),
        h('div', { class: 'row' }, [h('label', {}, '网格线'), h('input', { type: 'checkbox', id: 'grid-toggle', ...(s.gridLines ? { checked: 'checked' } : {}) })])
      ]),

      // 四、难度
      h('section', { class: 'card' }, [
        h('h3', { class: 'card__title' }, '四、难度设置'),
        h('div', { class: 'row' }, [
          h('label', {}, '起始等级'),
          h('button', { class: 'btn btn--small', id: 'level-down' }, '-'),
          h('span', { id: 'level-value' }, String(s.startLevel)),
          h('button', { class: 'btn btn--small', id: 'level-up' }, '+')
        ]),
        h('div', { class: 'row' }, [
          h('label', {}, '难度倍率'),
          ...['normal', 'fast', 'extreme'].map(d =>
            h('button', { class: `btn btn--small ${s.difficulty === d ? 'btn--active' : ''}`, 'data-diff': d }, diffLabel(d))
          )
        ])
      ]),

      // 五、统计
      h('section', { class: 'card' }, [
        h('h3', { class: 'card__title' }, '五、统计数据'),
        h('div', {}, `总游戏场次：${stats.totalGames}`),
        h('div', {}, `历史最高分：${stats.highScore}`),
        h('div', {}, `累计消行：${stats.totalLines}`),
        h('button', { class: 'btn btn--small btn--danger', id: 'btn-clear-stats' }, '清空统计数据')
      ]),

      // 六、数据管理
      h('section', { class: 'card' }, [
        h('h3', { class: 'card__title' }, '六、数据管理'),
        h('div', {}, `排行榜记录：${scores.length} 条`),
        h('button', { class: 'btn btn--small btn--danger', id: 'btn-clear-scores' }, '清空排行榜'),
        h('button', { class: 'btn btn--small', id: 'btn-export' }, '导出数据为 JSON'),
        h('button', { class: 'btn btn--small', id: 'btn-import' }, '导入数据'),
        h('input', { type: 'file', id: 'import-file', accept: '.json', style: { display: 'none' } }),
        h('hr', { class: 'divider' }),
        h('button', { class: 'btn btn--small btn--danger', id: 'btn-reset-all' }, '恢复全部默认设置')
      ]),

      h('button', { class: 'btn', 'data-nav': 'home' }, '返回首页')
    ]));

    // ====== 交互绑定 ======
    const rebind = (event) => {}; // 占位避免 lint

    // 1. 音效开关与音量
    function bindToggle(id, key) {
      const el = root.querySelector('#' + id);
      el.addEventListener('change', () => {
        s = saveSettings({ [key]: el.checked });
        emitChange(key);
      });
    }
    function bindVolume(id, key, valId) {
      const el = root.querySelector('#' + id);
      const valEl = root.querySelector('#' + valId);
      el.addEventListener('input', () => {
        const v = parseFloat(el.value);
        valEl.textContent = v.toFixed(2);
        s = saveSettings({ [key]: v });
        emitChange(key);
      });
    }
    bindToggle('sfx-toggle', 'sound');
    bindToggle('bgm-toggle', 'bgm');
    bindVolume('sfx-vol', 'soundVolume', 'sfx-vol-val');
    bindVolume('bgm-vol', 'bgmVolume', 'bgm-vol-val');

    // 2. 按键自定义
    let rebindingKey = null;
    function setKeyDisplay(action, code) {
      const el = root.querySelector(`#key-${action}`);
      if (el) el.textContent = displayKeyCode(code);
    }
    root.querySelectorAll('[data-rebind]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (rebindingKey) return;
        rebindingKey = btn.dataset.rebind;
        btn.textContent = '按键中...';
        const keyEl = root.querySelector(`#key-${rebindingKey}`);
        if (keyEl) keyEl.textContent = '按键中...';
      });
    });
    // 监听按键
    const keyListener = (e) => {
      if (!rebindingKey) return;
      e.preventDefault();
      // 检查冲突
      const conflictAction = Object.entries(s.keys).find(([a, c]) => c === e.code && a !== rebindingKey);
      if (conflictAction) {
        showAlert(`按键 ${displayKeyCode(e.code)} 已被 ${actionLabel(conflictAction[0])} 占用`);
        return;
      }
      s = saveSettings({ keys: { [rebindingKey]: e.code } });
      setKeyDisplay(rebindingKey, e.code);
      root.querySelector(`[data-rebind="${rebindingKey}"]`).textContent = '改';
      rebindingKey = null;
      emitChange('keys');
    };
    document.addEventListener('keydown', keyListener);

    // 恢复默认
    root.querySelector('#btn-reset-keys').addEventListener('click', async () => {
      const ok = await showConfirm('确定恢复所有按键到默认值？', { confirmText: '恢复' });
      if (!ok) return;
      s = saveSettings({ keys: DEFAULT_SETTINGS.keys });
      for (const k of Object.keys(DEFAULT_SETTINGS.keys)) setKeyDisplay(k, DEFAULT_SETTINGS.keys[k]);
      emitChange('keys');
    });

    // 3. 主题与显示
    root.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeName = btn.dataset.theme;
        // applyTheme 会同时更新 body class、注入 CSS 变量、保存设置
        applyTheme(themeName);
        s = loadSettings();
        // 更新激活态
        root.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('btn--active', b === btn));
        emitChange('theme');
      });
    });
    root.querySelectorAll('[data-preview]').forEach(btn => {
      btn.addEventListener('click', () => {
        s = saveSettings({ previewCount: parseInt(btn.dataset.preview, 10) });
        root.querySelectorAll('[data-preview]').forEach(b => b.classList.toggle('btn--active', b === btn));
        emitChange('previewCount');
      });
    });
    root.querySelector('#grid-toggle').addEventListener('change', (e) => {
      s = saveSettings({ gridLines: e.target.checked });
      emitChange('gridLines');
    });

    // 4. 难度
    root.querySelector('#level-up').addEventListener('click', () => {
      const v = Math.min(10, s.startLevel + 1);
      s = saveSettings({ startLevel: v });
      root.querySelector('#level-value').textContent = String(v);
      emitChange('startLevel');
    });
    root.querySelector('#level-down').addEventListener('click', () => {
      const v = Math.max(1, s.startLevel - 1);
      s = saveSettings({ startLevel: v });
      root.querySelector('#level-value').textContent = String(v);
      emitChange('startLevel');
    });
    root.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        s = saveSettings({ difficulty: btn.dataset.diff });
        root.querySelectorAll('[data-diff]').forEach(b => b.classList.toggle('btn--active', b === btn));
        emitChange('difficulty');
      });
    });

    // 5. 统计清空
    root.querySelector('#btn-clear-stats').addEventListener('click', async () => {
      const ok = await showConfirm('确定清空所有统计数据？此操作不可恢复。', { confirmText: '清空' });
      if (!ok) return;
      clearStats();
      stats = loadStats();
      root.querySelector('#btn-clear-stats').parentElement.querySelector('div:nth-child(2)').textContent = `总游戏场次：${stats.totalGames}`;
      // 简化：重新挂载以刷新
      navigate('settings');
    });

    // 6. 数据管理
    root.querySelector('#btn-clear-scores').addEventListener('click', async () => {
      const ok = await showConfirm('确定清空整个排行榜？此操作不可恢复。', { confirmText: '清空' });
      if (!ok) return;
      clearScores();
      navigate('settings');
    });

    root.querySelector('#btn-export').addEventListener('click', () => {
      const json = exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: 'tetris-data.json' });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showAlert('已导出到默认下载目录');
    });

    root.querySelector('#btn-import').addEventListener('click', () => {
      root.querySelector('#import-file').click();
    });
    root.querySelector('#import-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        importAll(text);
        await showAlert('导入成功');
        navigate('settings');
      } catch (err) {
        await showAlert('导入失败：' + err.message);
      }
    });

    // 恢复全部默认设置：清空所有数据 + 重置设置
    root.querySelector('#btn-reset-all').addEventListener('click', async () => {
      const ok = await showConfirm(
        '将清空排行榜、统计数据并恢复所有设置到默认值。此操作不可恢复，是否继续？',
        { title: '恢复默认', confirmText: '恢复默认' }
      );
      if (!ok) return;
      clearAll();
      await showAlert('已恢复全部默认设置');
      navigate('settings');
    });

    // 返回首页
    root.querySelector('[data-nav="home"]').addEventListener('click', () => navigate('home'));

    // 监听设置变化
    const listeners = new Set();
    function onSettingsChange(fn) { listeners.add(fn); }
    function emitChange(key) {
      for (const fn of listeners) {
        try { fn(s, key); } catch (e) {}
      }
    }

    // 卸载清理
    return () => {
      document.removeEventListener('keydown', keyListener);
      listeners.clear();
    };
  },
  unmount() {}
};

// 工具：将 keyCode 转为可读名
function displayKeyCode(code) {
  if (!code) return '-';
  const map = {
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    Space: '空格'
  };
  if (map[code]) return map[code];
  // 形如 KeyA → A，Digit1 → 1
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

function themeLabel(t) {
  return { classic: '经典灰白', dark: '暗黑', neon: '霓虹' }[t] || t;
}

function diffLabel(d) {
  return { normal: '标准', fast: '快速', extreme: '极限' }[d] || d;
}

function actionLabel(a) {
  return {
    left: '左移', right: '右移', rotate: '旋转', softDrop: '软降',
    hardDrop: '硬降', hold: '暂存', pause: '暂停'
  }[a] || a;
}
