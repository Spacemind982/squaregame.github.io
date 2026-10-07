// 常量定义：方块、颜色、计分表、等级速度、默认设置

// 7 种经典方块（I/O/T/S/Z/L/J）
// 每种方块的 4 个旋转状态用 4×4 矩阵表示（1=有，0=无）
export const TETROMINOES = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
  ],
  O: [
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]]
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]]
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]]
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]]
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]]
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]]
  ]
};

// 棋盘尺寸
export const COLS = 10;
export const ROWS = 20;

// 方块颜色（按 PRD 主题映射）
export const COLORS = {
  classic: { I: '#00f0f0', O: '#f0f000', T: '#a000f0', S: '#00f000', Z: '#f00000', L: '#f0a000', J: '#0000f0' },
  dark:    { I: '#00d4d4', O: '#d4d400', T: '#a020d4', S: '#20d420', Z: '#d42020', L: '#d47a20', J: '#2020d4' },
  neon:    { I: '#00ffff', O: '#ffff00', T: '#ff00ff', S: '#00ff88', Z: '#ff0066', L: '#ff9500', J: '#0066ff' }
};

// 计分表：消 1/2/3/4 行的分数
export const SCORE_TABLE = [0, 100, 300, 500, 800];

// 每多少行升级
export const LINES_PER_LEVEL = 10;

// 等级→下落间隔（毫秒） 1~10+ 级
export const LEVEL_SPEED = {
  1: 800, 2: 720, 3: 630, 4: 550, 5: 470,
  6: 350, 7: 280, 8: 220, 9: 180, 10: 150
};

// 难度倍率：影响下落速度倍率
export const DIFFICULTY_MULTIPLIER = {
  normal:  1.0,
  fast:    0.7,
  extreme: 0.45
};

// DAS / ARR（毫秒）
export const DAS = 170;
export const ARR = 50;

// 危险线：堆叠达到此行触发警告
export const DANGER_LINE = 4;

// 默认设置
export const DEFAULT_SETTINGS = {
  sound: true,
  soundVolume: 0.7,
  bgm: true,
  bgmVolume: 0.5,
  keys: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    rotate: 'ArrowUp',
    softDrop: 'ArrowDown',
    hardDrop: 'Space',
    hold: 'KeyC',
    pause: 'KeyP'
  },
  theme: 'classic',
  previewCount: 3,
  gridLines: true,
  startLevel: 1,
  difficulty: 'normal'
};

// 排行榜容量上限
export const MAX_SCORES = 50;

// 排行榜筛选区间
export const LEADERBOARD_FILTERS = [
  { key: 'all', label: '全部', min: 1, max: Infinity },
  { key: 'low',  label: '等级 1-3', min: 1, max: 3 },
  { key: 'mid',  label: '等级 4-7', min: 4, max: 7 },
  { key: 'high', label: '等级 8+',  min: 8, max: Infinity }
];

// 默认统计
export const DEFAULT_STATS = {
  totalGames: 0,
  highScore: 0,
  totalLines: 0
};
