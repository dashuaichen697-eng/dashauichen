export const LEVELS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 500 },
  { level: 3, xp: 1500 },
  { level: 4, xp: 3000 },
  { level: 5, xp: 5000 },
  { level: 6, xp: 10000 },
  { level: 7, xp: 20000 }
];

export const DEFAULT_CATEGORIES = [
  { id: 'health', name: '健康', weight: 30, color: '#49d17d' },
  { id: 'ip', name: 'IP', weight: 20, color: '#f4d27a' },
  { id: 'learning', name: '学习', weight: 10, color: '#5dd9ff' },
  { id: 'brazil', name: '巴西业务', weight: 40, color: '#ff6b35' }
];

export const DEFAULT_TASK_TEMPLATES = [
  { id: 'task-wall-stand', name: '靠墙站 10 分钟', categoryId: 'health', taskType: 'daily', xp: 5, gold: 5, schedule: { type: 'daily', days: [] }, enabled: true },
  { id: 'task-strength', name: '撸铁 10 分钟', categoryId: 'health', taskType: 'daily', xp: 5, gold: 5, schedule: { type: 'daily', days: [] }, enabled: true },
  { id: 'task-run', name: '跑步 5 公里', categoryId: 'health', taskType: 'daily', xp: 10, gold: 10, schedule: { type: 'daily', days: [] }, enabled: true },
  { id: 'task-video-shoot', name: '视频拍摄 1 个', categoryId: 'ip', taskType: 'daily', xp: 5, gold: 5, schedule: { type: 'weekdays', days: [1, 3, 5] }, enabled: true },
  { id: 'task-video-publish', name: '视频剪辑和发布 1 个', categoryId: 'ip', taskType: 'daily', xp: 10, gold: 10, schedule: { type: 'weekdays', days: [2, 4, 6] }, enabled: true },
  { id: 'task-reading', name: '读书 20 分钟', categoryId: 'learning', taskType: 'daily', xp: 10, gold: 10, schedule: { type: 'weekdays', days: [6, 0] }, enabled: true },
  { id: 'task-business-stage', name: '推动一个卖家到商务阶段', categoryId: 'brazil', taskType: 'longTerm', xp: 5, gold: 5, schedule: { type: 'anytime', days: [] }, enabled: true },
  { id: 'task-sign-seller', name: '签约一个卖家', categoryId: 'brazil', taskType: 'longTerm', xp: 5, gold: 5, schedule: { type: 'anytime', days: [] }, enabled: true },
  { id: 'task-ship-seller', name: '卖家走货', categoryId: 'brazil', taskType: 'longTerm', xp: 10, gold: 10, schedule: { type: 'anytime', days: [] }, enabled: true },
  { id: 'task-container', name: '卖家走 1 条柜子', categoryId: 'brazil', taskType: 'longTerm', xp: 50, gold: 50, schedule: { type: 'anytime', days: [] }, enabled: true },
  { id: 'task-product', name: '优化一个产品并跑通', categoryId: 'brazil', taskType: 'longTerm', xp: 20, gold: 20, schedule: { type: 'anytime', days: [] }, enabled: true }
];

export const DEFAULT_MAIN_QUESTS = [
  { id: 'quest-running', name: '健康跑步', period: '2026年', target: 120, current: 5, unit: '公里', showOnDashboard: true },
  { id: 'quest-ip', name: '个人IP', period: '2026年', target: 72, current: 3, unit: '个视频', showOnDashboard: true },
  { id: 'quest-brazil', name: '巴西远征', period: '2026年', target: 24, current: 0, unit: '条柜', showOnDashboard: true }
];

export const DEFAULT_REWARDS = [
  { id: 'coffee', name: '喝一杯咖啡', cost: 30, description: '给今天的努力加一点香气。', enabled: true },
  { id: 'book', name: '买一本书', cost: 50, description: '兑换一本真正想读的书。', enabled: true },
  { id: 'meal', name: '吃一顿喜欢的饭', cost: 399, description: '认真享受一顿喜欢的饭。', enabled: true },
  { id: 'brazil-fund', name: '巴西考察基金', cost: 30000, description: '积累下一次巴西考察的专项基金。', enabled: true }
];

export const ACHIEVEMENTS = [
  { id: 'first-task', title: '征程启航', description: '完成第 1 个任务' },
  { id: 'streak-7', title: '稳定引擎', description: '连续打卡 7 天' },
  { id: 'tasks-50', title: '行动派', description: '累计完成 50 个任务' },
  { id: 'xp-500', title: '星际旅人', description: '累计获得 500 XP' }
];

export const MOTIVATIONS = [
  '今天不是普通打卡，是把未来往前推一格。',
  '稳定输出的人，会慢慢拥有复利。',
  '先完成，再变强。今天也要升一点级。',
  '长期目标很远，但今天的动作必须清晰。',
  '每一次完成，都是人生配置开始生效。'
];

export const CATEGORY_COLORS = ['#49d17d', '#f4d27a', '#5dd9ff', '#ff6b35', '#d783ff', '#ff7f9f', '#7cc8ff'];

export const WEEKDAYS = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 0, label: '日' }
];
