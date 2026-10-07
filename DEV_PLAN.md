# 俄罗斯方块游戏 APP 开发计划（DEV_PLAN）

> 文档版本：v1.0
> 创建日期：2026-10-07
> 依据：PRD.md v1.0
> 状态：可执行的施工蓝图

---

## 一、目录与文件结构

```
d:\TraeCode\Tankgame\
├── index.html                  # 单页应用入口（包含 5 个页面的 DOM 结构）
├── css\
│   ├── style.css               # 全局样式 + 布局 + 组件样式
│   ├── themes.css              # 三套主题（classic / dark / neon）
│   └── pixel-font.css          # 像素风字体 @font-face
├── js\
│   ├── app.js                  # 应用入口、页面路由、初始化
│   ├── storage.js              # localStorage 封装（CRUD）
│   ├── constants.js            # 方块定义、计分表、等级速度表
│   ├── game\
│   │   ├── Tetris.js           # 游戏主控制器（状态机、循环）
│   │   ├── Board.js            # 棋盘逻辑（碰撞、消行）
│   │   ├── Piece.js            # 方块类（形状、旋转、移动）
│   │   ├── Renderer.js         # Canvas 渲染（方块、网格、幽灵、动画）
│   │   └── Input.js            # 键盘输入处理（含自定义键位）
│   ├── pages\
│   │   ├── home.js             # 首页
│   │   ├── game.js             # 游戏页（装配三栏 UI、绑定按钮）
│   │   ├── leaderboard.js      # 排行榜（筛选、排序、渲染）
│   │   ├── manual.js           # 游戏说明
│   │   └── settings.js         # 设置页（音效、按键、主题、数据）
│   ├── audio\
│   │   └── AudioEngine.js     # Web Audio 合成音效 + BGM
│   └── utils\
│       ├── dom.js              # DOM 操作辅助
│       └── format.js           # 日期/分数格式化
└── assets\
    └── (无，音效与图形均由代码生成)
```

**设计原则**
- 单 HTML 入口 + 多 JS 模块（用原生 ES Module，无构建工具）
- 每个模块单一职责，可独立测试
- 零运行时依赖（不引入任何第三方库）

---

## 二、模块职责与接口契约

### 2.1 storage.js（数据层）
```javascript
// 提供以下函数（其他模块只读不直接操作 localStorage）
loadSettings()             // 返回合并默认值后的 settings 对象
saveSettings(partial)      // 浅合并并保存
loadScores()               // 返回数组（最多50条，已排序）
saveScore({name, score, level, date})  // 插入并截断
clearScores()
loadStats() / saveStats(partial) / clearStats()
exportAll()                // 返回 {settings, scores, stats} JSON 字符串
importAll(jsonString)      // 校验后覆盖
```

### 2.2 constants.js（常量表）
- `TETROMINOES`：7 种方块的 4 个旋转状态矩阵
- `COLORS`：每种方块的颜色（含三套主题映射）
- `SCORE_TABLE`：[0, 100, 300, 500, 800]
- `LINES_PER_LEVEL`：10
- `LEVEL_SPEED`：1~20 级对应的下落间隔（毫秒）
- `DEFAULT_SETTINGS`：默认设置对象（与 PRD 4.1 一致）

### 2.3 game/Board.js
- `class Board`：10×20 二维数组
- `isValidPosition(piece, offset)`：碰撞检测
- `lockPiece(piece)`：固化到棋盘
- `getFullLines()`：返回可消除行号
- `clearLines(lines)`：消除并下移
- `isOverflow()`：判断是否游戏结束（顶部溢出）

### 2.4 game/Piece.js
- `class Piece`：type / rotation / x / y
- `rotate(clockwise)`：返回新形状
- `getCells()`：返回当前形状的坐标列表
- `spawn()`：初始位置（顶部居中）

### 2.5 game/Renderer.js
- `constructor(canvas, options)`
- `drawBoard(board)`：绘制棋盘
- `drawPiece(piece)`：绘制当前方块
- `drawGhost(piece, board)`：绘制幽灵方块
- `drawNext(pieces, count)`：绘制 Next 预览
- `drawHold(piece)`：绘制 Hold
- `flashLines(lines)`：消行闪烁动画
- `clear()`

### 2.6 game/Input.js
- 监听 keydown，按 settings.keys 映射动作
- 触发回调：onLeft / onRight / onRotate / onSoftDrop / onHardDrop / onHold / onPause
- 支持 DAS（自动重复延迟）和 ARR（重复速率）
- 防止浏览器默认行为（如方向键滚动）

### 2.7 game/Tetris.js（主控制器）
- 状态机：`idle / playing / paused / lineClearing / gameOver`
- 主循环：requestAnimationFrame + 累积时间
- 串联 Board / Piece / Renderer / Input
- 触发计分、等级、消行动画、游戏结束

### 2.8 audio/AudioEngine.js
- 单例，懒加载 AudioContext（首次用户交互后）
- `playSfx(name)`：move / rotate / hardDrop / clear / levelUp / gameOver
- `startBgm()` / `stopBgm()`：合成简单循环
- 音量受 settings 控制，实时响应

### 2.9 pages/*.js
- 每个 page 暴露 `mount(container)` 与 `unmount()` 
- 页面切换由 app.js 调用：先 unmount 当前页，再 mount 目标页

### 2.10 app.js
- 路由表：`{ home, game, leaderboard, manual, settings }`
- `navigate(name)`：切换页面
- 初始化时加载 settings、应用主题、注册导航事件
- 暴露全局 `App.navigate` 给 HTML onclick 使用

---

## 三、分阶段任务清单

### 阶段 1：基础框架（里程碑 1）

**目标**：5 个空页面可正常切换，localStorage 可读写

| # | 任务 | 产出 |
|---|---|---|
| 1.1 | 创建 `index.html`，包含 5 个 page-container 与顶部导航 | 静态 HTML 骨架 |
| 1.2 | 编写 `css/style.css`：布局、按钮、卡片基础样式 | 视觉框架 |
| 1.3 | 实现 `js/storage.js` 与 `DEFAULT_SETTINGS` | 可读写的存储层 |
| 1.4 | 实现 `js/app.js` 路由与 `navigate()` | 页面切换可用 |
| 1.5 | 5 个 `pages/*.js` 提供 mount/unmount 占位 | 切换无报错 |

**阶段验收**：点击导航可在 5 个页面间切换；刷新后当前页保留；Console 可调用 `storage.loadSettings()`。

---

### 阶段 2：游戏核心（里程碑 2）

**目标**：能玩起来——方块下落、移动、旋转、消行、游戏结束

| # | 任务 | 产出 |
|---|---|---|
| 2.1 | `constants.js`：7 种方块矩阵 + 颜色 + 旋转状态 | 常量表 |
| 2.2 | `Board.js`：碰撞检测 + 固化 + 消行 + 溢出判定 | 棋盘逻辑 |
| 2.3 | `Piece.js`：方块类，含旋转算法 | 方块对象 |
| 2.4 | `Renderer.js`：Canvas 绘制棋盘与方块 | 渲染层 |
| 2.5 | `Input.js`：键盘监听 + DAS/ARR | 输入层 |
| 2.6 | `Tetris.js`：状态机 + 主循环 + 计分 | 主控制器 |
| 2.7 | `pages/game.js`：三栏 UI 装配 + 绑定 | 可玩 |

**阶段验收**：能开始游戏，方块按默认速度下落，方向键/旋转/硬降/软降正常，行可消除并加分，堆到顶部触发 game over。

---

### 阶段 3：进阶功能（里程碑 3）

**目标**：Hold、幽灵方块、Next 预览、等级系统

| # | 任务 | 产出 |
|---|---|---|
| 3.1 | Hold 框 UI 与逻辑（暂存/取出，每块仅一次） | Hold 可用 |
| 3.2 | Next 队列（7-bag 随机算法）+ 预览渲染 | Next 可用 |
| 3.3 | 幽灵方块计算与半透明渲染 | 投影可见 |
| 3.4 | 等级系统：消行累计 + 速度表 + 升级动画 | 等级递增 |
| 3.5 | 危险线警告（堆叠超过阈值时顶部闪烁） | 警告可见 |
| 3.6 | 消行闪烁动画 + 升级提示动画 | 动画完成 |
| 3.7 | 游戏结束模态框：分数/等级 + 昵称输入 | 流程完整 |

**阶段验收**：Hold/幽灵/Next 全部工作；消 10 行升级且变快；游戏结束可输入昵称。

---

### 阶段 4：外围页面（里程碑 4）

**目标**：首页、排行榜、说明、设置页全部完成

| # | 任务 | 产出 |
|---|---|---|
| 4.1 | `pages/home.js`：标题动画 + 4 按钮 + 底部信息 | 首页完成 |
| 4.2 | `pages/leaderboard.js`：Tab 筛选 + 表头排序 + 50 条列表 | 排行榜完成 |
| 4.3 | `pages/manual.js`：5 个说明卡片 + 方块图示 | 说明完成 |
| 4.4 | `pages/settings.js` 音效区：开关 + 音量滑块 | 音效设置 |
| 4.5 | `pages/settings.js` 按键区：7 项自定义 + 恢复默认 | 按键设置 |
| 4.6 | `pages/settings.js` 主题区：3 主题切换 + 预览数 + 网格线 | 显示设置 |
| 4.7 | `pages/settings.js` 难度区：起始等级 1~10 + 倍率 | 难度设置 |
| 4.8 | `pages/settings.js` 统计区：3 项数据 + 清空 | 统计显示 |
| 4.9 | `pages/settings.js` 数据区：清空/导出/导入 | 数据管理 |

**阶段验收**：5 个页面功能完整；设置改动即时保存；主题切换实时生效；按键自定义可重映射；导入导出 JSON 正常。

---

### 阶段 5：音效系统（里程碑 5）

**目标**：音效与 BGM 全部由代码合成，可独立开关与调节

| # | 任务 | 产出 |
|---|---|---|
| 5.1 | `AudioEngine.js`：AudioContext 初始化 + 音量总线 | 引擎就绪 |
| 5.2 | 6 种音效合成函数（方波/三角波短音） | 音效可用 |
| 5.3 | BGM 合成：简单循环旋律 | BGM 可用 |
| 5.4 | 在 Tetris.js 触发点调用 playSfx | 游戏内集成 |
| 5.5 | 设置页音量/开关与引擎实时联动 | 设置生效 |

**阶段验收**：移动/旋转/消行/升级/结束均有声音；BGM 可独立开关；音量滑块实时调整。

---

### 阶段 6：主题系统（里程碑 6）

**目标**：3 套主题可切换并实时生效

| # | 任务 | 产出 |
|---|---|---|
| 6.1 | `css/themes.css`：用 CSS 变量定义 classic/dark/neon | 变量层 |
| 6.2 | 方块颜色按主题映射（constants 中扩展） | 三套配色 |
| 6.3 | 主题切换时给 body 加 class + 重绘 Canvas | 实时切换 |
| 6.4 | 启动时读取 settings.theme 应用 | 持久化 |

**阶段验收**：三主题视觉差异明显；切换无需刷新；刷新后保持上次选择。

---

### 阶段 7：数据管理 + 收尾（里程碑 7）

**目标**：导入导出、清空、二次确认，整体打磨

| # | 任务 | 产出 |
|---|---|---|
| 7.1 | 导出 JSON（下载 tetris-data.json） | 导出可用 |
| 7.2 | 导入 JSON（文件选择 + 校验 + 覆盖） | 导入可用 |
| 7.3 | 清空按钮二次确认弹窗组件 | 防误删 |
| 7.4 | 首页标题像素下落动画 | 视觉点缀 |
| 7.5 | 全局快捷键（Esc 返回首页） | 体验优化 |
| 7.6 | 响应式微调（适配常见 PC 分辨率） | 视觉稳定 |

**阶段验收**：导出文件可在另台机器导入恢复；清空均需二次确认；动画流畅无卡顿。

---

### 阶段 8：测试与验收（里程碑 8）

**目标**：对照 PRD 第八节 13 条验收标准逐项验证

| # | 测试场景 | 通过标准 |
|---|---|---|
| 8.1 | 页面切换 | 5 页面任意切换无错乱 |
| 8.2 | 游戏全流程 | 开始→暂停→继续→结束无异常 |
| 8.3 | 7 种方块 | 每种方块旋转/消除正常 |
| 8.4 | Hold/幽灵/Next | 三功能正常 |
| 8.5 | 等级系统 | 消 10 行升级，速度变快 |
| 8.6 | 计分 | 单/双/三/四行 + 软硬降加分正确 |
| 8.7 | 排行榜存档 | 输入昵称后存入并显示 |
| 8.8 | 排行榜筛选排序 | Tab 与表头排序正常 |
| 8.9 | 设置即时生效 | 改动后立即可见效果 |
| 8.10 | 主题切换 | 三主题实时切换 |
| 8.11 | 按键自定义 | 7 项可重映射且生效 |
| 8.12 | 持久化 | 刷新/关闭/重启后数据保留 |
| 8.13 | 导入导出 + 清空 | 全部正常，清空有二次确认 |
| 8.14 | 音效与 BGM | 独立开关与音量调节有效 |

---

## 四、技术决策与约定

### 4.1 模块加载
- 使用浏览器原生 ES Module（`<script type="module">`）
- 无构建步骤，无打包工具
- 文件直接以 `file://` 协议可运行（注意：ES Module 在 file:// 下部分浏览器受限，建议用简易 HTTP 服务器打开）

### 4.2 渲染策略
- 主游戏区用 Canvas 2D（性能优于 DOM）
- Hold/Next 预览也用小型 Canvas
- 其他 UI 用 DOM + CSS
- 主循环用 requestAnimationFrame，固定时间步进

### 4.3 随机算法
- 采用 **7-bag 算法**：每 7 个方块为一袋，袋内随机洗牌，保证每 7 块必含全部 7 种

### 4.4 旋转中心
- 标准 SRS（Super Rotation System）简化版：以方块矩阵中心为旋转轴
- 不实现墙踢（Wall Kick）高级特性，保持简单

### 4.5 DAS / ARR
- DAS（Delayed Auto Shift）：长按 170ms 后开始连续触发
- ARR（Auto Repeat Rate）：连续触发间隔 50ms
- 软降按住时连续触发，每格 +1 分

### 4.6 等级速度表（毫秒/格）
| 等级 | 间隔 | 等级 | 间隔 |
|---|---|---|---|
| 1 | 800 | 6 | 350 |
| 2 | 720 | 7 | 280 |
| 3 | 630 | 8 | 220 |
| 4 | 550 | 9 | 180 |
| 5 | 470 | 10+ | 150 |

### 4.7 命名约定
- 文件名：小写 + 连字符（kebab-case）或 PascalCase（类文件）
- 变量/函数：camelCase
- 常量：UPPER_SNAKE_CASE
- CSS 类：BEM 风格简化（block__element--modifier）

### 4.8 错误处理
- localStorage 读写 try/catch，失败时 console.warn 并用默认值
- 导入 JSON 严格校验字段，非法时弹错误提示
- AudioContext 创建失败时静默降级（无声）

---

## 五、风险与缓解

| 风险 | 缓解措施 |
|---|---|
| file:// 下 ES Module 受限 | 启动时给出"建议用本地 HTTP 服务器"提示；或退化为单文件 IIFE 方案 |
| Canvas 在高 DPI 屏幕模糊 | 使用 `devicePixelRatio` 缩放 Canvas 像素 |
| 长时间游戏内存增长 | 主循环退出时取消 rAF，事件监听解绑 |
| 自定义按键冲突 | 监听时检测重复并提示 |
| 7-bag 可预测性 | 不做加密，纯本地游戏无需防作弊 |

---

## 六、执行顺序建议

按里程碑 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 顺序推进。

每个里程碑完成后：
1. 跑一遍本里程碑的"阶段验收"
2. 提交一次（如使用 git）
3. 再进入下一里程碑

**关键路径**：里程碑 2（游戏核心）是项目成败关键，建议优先攻克，先有一个能玩的版本，再做外围。

---

## 七、首次可玩 Demo 标准（阶段 2 完成后）

达成以下即视为"最小可玩版本"：
- 能从首页点「开始游戏」进入游戏页
- 方块自动下落、可移动旋转
- 行可消除、计分正确
- 游戏结束有反馈（不必有昵称输入，可暂时返回首页）

后续里程碑在此基础之上叠加功能。

---

**文档结束**
