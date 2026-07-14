import { DEFAULT_CATEGORIES, DEFAULT_MAIN_QUESTS, DEFAULT_REWARDS, DEFAULT_TASK_TEMPLATES } from '../data/gameConfig';

const STORAGE_KEY = 'stellar-rpg-state-v1';
const SCHEMA_VERSION = 3;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialState() {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    categories: clone(DEFAULT_CATEGORIES),
    tasks: clone(DEFAULT_TASK_TEMPLATES),
    rewards: clone(DEFAULT_REWARDS),
    mainQuests: clone(DEFAULT_MAIN_QUESTS),
    completions: {},
    redemptions: [],
    achievements: [],
    createdAt: now,
    updatedAt: now
  };
}

function normalizeCompletions(completions = {}) {
  return Object.fromEntries(
    Object.entries(completions).map(([dateKey, items]) => [
      dateKey,
      Object.fromEntries(
        Object.entries(items ?? {}).map(([taskId, item]) => [
          taskId,
          {
            ...item,
            taskId,
            name: item.name ?? item.title ?? '历史任务',
            categoryId: item.categoryId ?? item.category ?? '',
            awardedXp: Number(item.awardedXp ?? item.baseXp ?? 0),
            awardedGold: Number(item.awardedGold ?? Math.floor(Number(item.awardedXp ?? item.baseXp ?? 0) / 10))
          }
        ])
      )
    ])
  );
}

function migrateLegacyTasks(value) {
  const legacyCustom = Array.isArray(value.customTasks) ? value.customTasks : [];
  return [
    ...clone(DEFAULT_TASK_TEMPLATES),
    ...legacyCustom.map((task) => ({
      id: task.id ?? createId('task'),
      name: task.name ?? task.title ?? '自定义任务',
      categoryId: task.categoryId ?? task.category ?? 'brazil',
      taskType: 'custom',
      xp: Number(task.xp ?? 0),
      gold: Number(task.gold ?? Math.floor(Number(task.xp ?? 0) / 10)),
      schedule: task.schedule ?? { type: 'anytime', days: [] },
      enabled: task.enabled ?? true
    }))
  ];
}

function inferTaskType(task) {
  if (['daily', 'longTerm', 'custom'].includes(task.taskType)) return task.taskType;
  if (task.categoryId === 'brazil' && task.schedule?.type === 'anytime') return 'longTerm';
  return task.schedule?.type === 'anytime' ? 'custom' : 'daily';
}

function normalizeTasks(tasks) {
  return tasks.map((task) => ({
    ...task,
    taskType: inferTaskType(task),
    schedule: task.schedule ?? { type: 'anytime', days: [] },
    enabled: task.enabled ?? true
  }));
}

function normalizeRewards(rewards) {
  return rewards.map((reward) => ({
    ...reward,
    id: reward.id ?? createId('reward'),
    name: reward.name ?? reward.title ?? '未命名奖励',
    cost: Math.max(0, Number(reward.cost ?? 0)),
    description: reward.description ?? '',
    enabled: reward.enabled ?? true
  }));
}

export function normalizeState(value = {}) {
  const initial = createInitialState();
  const migrated = value.schemaVersion !== SCHEMA_VERSION || !Array.isArray(value.tasks) || !Array.isArray(value.categories);
  return {
    ...initial,
    ...value,
    schemaVersion: SCHEMA_VERSION,
    categories: clone(Array.isArray(value.categories) ? value.categories : DEFAULT_CATEGORIES),
    tasks: clone(normalizeTasks(Array.isArray(value.tasks) ? value.tasks : migrateLegacyTasks(value))),
    rewards: clone(normalizeRewards(Array.isArray(value.rewards) ? value.rewards : DEFAULT_REWARDS)),
    mainQuests: clone(Array.isArray(value.mainQuests) ? value.mainQuests : DEFAULT_MAIN_QUESTS),
    completions: normalizeCompletions(value.completions),
    redemptions: Array.isArray(value.redemptions) ? value.redemptions : [],
    achievements: Array.isArray(value.achievements) ? value.achievements : [],
    createdAt: value.createdAt ?? initial.createdAt,
    updatedAt: migrated ? new Date().toISOString() : (value.updatedAt ?? value.createdAt ?? initial.updatedAt)
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportState(state) {
  return JSON.stringify(state, null, 2);
}

export function importState(json) {
  return normalizeState({ ...JSON.parse(json), updatedAt: new Date().toISOString() });
}
