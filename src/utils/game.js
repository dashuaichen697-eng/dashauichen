import { ACHIEVEMENTS, LEVELS, MOTIVATIONS, WEEKDAYS } from '../data/gameConfig';
import { addDays, getDateKey, getWeekRange, isSameOrBeforeDay, parseDateKey } from './date';

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isTaskActiveOnDate(task, date = new Date()) {
  if (!task.enabled || task.taskType !== 'daily') return false;
  if (task.schedule?.type === 'weekdays') return (task.schedule.days ?? []).includes(date.getDay());
  return task.schedule?.type === 'daily';
}

export function getTasksForDate(tasks, date = new Date()) {
  return tasks.filter((task) => isTaskActiveOnDate(task, date));
}

export function getLongTermTasks(tasks) {
  return tasks.filter((task) => task.enabled && ['longTerm', 'custom'].includes(task.taskType));
}

export function getScheduleLabel(schedule = {}) {
  if (schedule.type === 'daily') return '每日';
  if (schedule.type === 'anytime') return '不限周期';
  if (schedule.type === 'weekdays') {
    const labels = WEEKDAYS.filter((day) => (schedule.days ?? []).includes(day.value)).map((day) => day.label);
    return labels.length ? `每周${labels.join('、')}` : '未选择日期';
  }
  return '不限周期';
}

function allCompletions(state) {
  return Object.values(state.completions).flatMap((items) => Object.values(items));
}

export function getEarnedXp(state) {
  return allCompletions(state).reduce((sum, item) => sum + Number(item.awardedXp ?? 0), 0);
}

export function getEarnedGold(state) {
  return allCompletions(state).reduce((sum, item) => sum + Number(item.awardedGold ?? 0), 0);
}

export function getSpentGold(state) {
  return state.redemptions.reduce((sum, item) => sum + Number(item.cost ?? 0), 0);
}

export function getTotalGold(state) {
  return getEarnedGold(state) - getSpentGold(state);
}

export function getLevel(totalXp) {
  const current = [...LEVELS].reverse().find((item) => totalXp >= item.xp) ?? LEVELS[0];
  const next = LEVELS.find((item) => item.xp > totalXp);
  const progress = next ? Math.round(((totalXp - current.xp) / (next.xp - current.xp)) * 100) : 100;
  return { current, next, progress };
}

export function hasCompletionOnDate(state, dateKey) {
  return Object.keys(state.completions[dateKey] ?? {}).length > 0;
}

export function getCheckInStreak(state, throughDate = new Date()) {
  let count = 0;
  let cursor = new Date(throughDate);
  while (hasCompletionOnDate(state, getDateKey(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function getNewAchievements(state) {
  const completions = allCompletions(state);
  const totalXp = getEarnedXp(state);
  const currentIds = new Set(state.achievements);
  const matches = [
    completions.length >= 1 && 'first-task',
    getCheckInStreak(state) >= 7 && 'streak-7',
    completions.length >= 50 && 'tasks-50',
    totalXp >= 500 && 'xp-500'
  ].filter(Boolean);
  return ACHIEVEMENTS.filter((item) => matches.includes(item.id) && !currentIds.has(item.id));
}

export function completeTask(state, task, date = new Date()) {
  const dateKey = getDateKey(date);
  if (state.completions[dateKey]?.[task.id]) return { state, reward: null };

  const beforeLevel = getLevel(getEarnedXp(state)).current.level;
  const completion = {
    taskId: task.id,
    name: task.name,
    categoryId: task.categoryId,
    taskType: task.taskType,
    awardedXp: Number(task.xp),
    awardedGold: Number(task.gold),
    completedAt: new Date().toISOString()
  };
  const nextState = {
    ...state,
    completions: {
      ...state.completions,
      [dateKey]: { ...(state.completions[dateKey] ?? {}), [task.id]: completion }
    }
  };
  const afterLevel = getLevel(getEarnedXp(nextState)).current.level;
  const achievements = getNewAchievements(nextState);
  nextState.achievements = [...new Set([...state.achievements, ...achievements.map((item) => item.id)])];

  return {
    state: nextState,
    reward: {
      xp: completion.awardedXp,
      gold: completion.awardedGold,
      leveledUp: afterLevel > beforeLevel ? afterLevel : null,
      achievements
    }
  };
}

export function redeemReward(state, reward) {
  if (getTotalGold(state) < reward.cost) return { state, success: false };
  return {
    state: {
      ...state,
      redemptions: [...state.redemptions, { id: createId('redemption'), title: reward.name ?? reward.title, cost: reward.cost, redeemedAt: new Date().toISOString() }]
    },
    success: true
  };
}

export function getCompletionsBetween(state, start, end) {
  return Object.entries(state.completions)
    .filter(([dateKey]) => {
      const date = parseDateKey(dateKey);
      return isSameOrBeforeDay(start, date) && isSameOrBeforeDay(date, end);
    })
    .flatMap(([dateKey, tasks]) => Object.values(tasks).map((task) => ({ ...task, dateKey })));
}

export function getCategoryProgress(state, date = new Date()) {
  const tasks = getTasksForDate(state.tasks, date);
  const dateKey = getDateKey(date);
  return state.categories.map((category) => {
    const categoryTasks = tasks.filter((task) => task.categoryId === category.id);
    const done = categoryTasks.filter((task) => state.completions[dateKey]?.[task.id]).length;
    return {
      ...category,
      done,
      total: categoryTasks.length,
      rate: categoryTasks.length ? Math.round((done / categoryTasks.length) * 100) : 0
    };
  });
}

export function getTodaySummary(state, date = new Date()) {
  const dateKey = getDateKey(date);
  const tasks = getTasksForDate(state.tasks, date);
  const completions = tasks
    .map((task) => state.completions[dateKey]?.[task.id])
    .filter(Boolean);
  const completedCount = tasks.filter((task) => state.completions[dateKey]?.[task.id]).length;
  return {
    dateKey,
    tasks,
    completions,
    completedCount,
    totalCount: tasks.length,
    progress: tasks.length ? Math.round((completedCount / tasks.length) * 100) : 100,
    xp: completions.reduce((sum, item) => sum + Number(item.awardedXp ?? 0), 0),
    gold: completions.reduce((sum, item) => sum + Number(item.awardedGold ?? 0), 0),
    motivation: MOTIVATIONS[date.getDate() % MOTIVATIONS.length]
  };
}

export function getWeeklySummary(state, date = new Date()) {
  const { start, end } = getWeekRange(date);
  const effectiveEnd = date < end ? date : end;
  const dailyTaskIds = new Set(state.tasks.filter((task) => task.taskType === 'daily').map((task) => task.id));
  const completions = getCompletionsBetween(state, start, effectiveEnd)
    .filter((completion) => dailyTaskIds.has(completion.taskId));
  let planned = 0;
  let cursor = new Date(start);
  while (getDateKey(cursor) <= getDateKey(effectiveEnd)) {
    planned += getTasksForDate(state.tasks, cursor).length;
    cursor = addDays(cursor, 1);
  }
  return {
    xp: completions.reduce((sum, item) => sum + Number(item.awardedXp ?? 0), 0),
    gold: completions.reduce((sum, item) => sum + Number(item.awardedGold ?? 0), 0),
    completed: completions.length,
    planned,
    rate: planned ? Math.round((completions.length / planned) * 100) : 0
  };
}

export function getDailyXpSeries(state, days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(new Date(), index - days + 1);
    const dateKey = getDateKey(date);
    const xp = Object.values(state.completions[dateKey] ?? {}).reduce((sum, item) => sum + Number(item.awardedXp ?? 0), 0);
    return { dateKey, label: `${date.getMonth() + 1}/${date.getDate()}`, xp };
  });
}

export function getGeneralMetrics(state) {
  const completions = allCompletions(state);
  return {
    totalCompletions: completions.length,
    activeTasks: state.tasks.filter((task) => task.enabled).length,
    categories: state.categories.length,
    mainQuests: state.mainQuests.length
  };
}
