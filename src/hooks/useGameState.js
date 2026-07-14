import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_COLORS } from '../data/gameConfig';
import { supabase } from '../lib/supabase';
import { getDateKey } from '../utils/date';
import {
  completeTask,
  createId,
  getCategoryProgress,
  getCheckInStreak,
  getDailyXpSeries,
  getEarnedXp,
  getGeneralMetrics,
  getLevel,
  getTodaySummary,
  getTotalGold,
  getWeeklySummary,
  redeemReward
} from '../utils/game';
import { exportState, importState, loadState, normalizeState, saveState } from '../utils/storage';

function withTimestamp(state) {
  return { ...state, updatedAt: new Date().toISOString() };
}

export function useGameState(user) {
  const [state, setState] = useState(loadState);
  const [reward, setReward] = useState(null);
  const [toast, setToast] = useState(null);
  const [syncStatus, setSyncStatus] = useState(user ? 'connecting' : 'local');
  const [cloudReady, setCloudReady] = useState(false);
  const stateRef = useRef(state);
  const lastSyncedAt = useRef(null);
  const today = useMemo(() => new Date(), []);

  const commitState = useCallback((update) => {
    setState((current) => withTimestamp(typeof update === 'function' ? update(current) : update));
  }, []);

  useEffect(() => {
    stateRef.current = state;
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!supabase || !user) {
      setCloudReady(false);
      setSyncStatus('local');
      return undefined;
    }

    let active = true;
    let channel;

    async function initializeCloudState() {
      setSyncStatus('connecting');
      const { data, error } = await supabase
        .from('game_states')
        .select('state, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!active) return;
      if (error) {
        setSyncStatus('error');
        return;
      }

      if (data) {
        const remoteState = normalizeState({ ...data.state, updatedAt: data.updated_at });
        lastSyncedAt.current = data.updated_at;
        stateRef.current = remoteState;
        setState(remoteState);
      } else {
        const localState = stateRef.current;
        const { error: uploadError } = await supabase.from('game_states').upsert({
          user_id: user.id,
          state: localState,
          updated_at: localState.updatedAt
        });
        if (uploadError) {
          setSyncStatus('error');
          return;
        }
        lastSyncedAt.current = localState.updatedAt;
      }

      channel = supabase
        .channel(`game-state-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'game_states', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const row = payload.new;
            if (!row?.state || !row.updated_at) return;
            if (new Date(row.updated_at) <= new Date(stateRef.current.updatedAt)) return;
            const remoteState = normalizeState({ ...row.state, updatedAt: row.updated_at });
            lastSyncedAt.current = row.updated_at;
            stateRef.current = remoteState;
            setState(remoteState);
            setSyncStatus('synced');
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') setSyncStatus('synced');
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setSyncStatus('error');
        });

      setCloudReady(true);
      setSyncStatus('synced');
    }

    initializeCloudState();

    return () => {
      active = false;
      setCloudReady(false);
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!supabase || !user || !cloudReady || state.updatedAt === lastSyncedAt.current) return undefined;

    setSyncStatus('syncing');
    const timer = window.setTimeout(async () => {
      const { error } = await supabase.from('game_states').upsert({
        user_id: user.id,
        state,
        updated_at: state.updatedAt
      });

      if (error) {
        setSyncStatus('error');
        return;
      }
      lastSyncedAt.current = state.updatedAt;
      setSyncStatus('synced');
    }, 500);

    return () => window.clearTimeout(timer);
  }, [cloudReady, state, user]);

  const derived = useMemo(() => {
    const totalXp = getEarnedXp(state);
    return {
      totalXp,
      gold: getTotalGold(state),
      level: getLevel(totalXp),
      todaySummary: getTodaySummary(state, today),
      weeklySummary: getWeeklySummary(state, today),
      categoryProgress: getCategoryProgress(state, today),
      streak: getCheckInStreak(state, today),
      metrics: getGeneralMetrics(state),
      dailyXp: getDailyXpSeries(state),
      dateKey: getDateKey(today)
    };
  }, [state, today]);

  function onCompleteTask(task) {
    const result = completeTask(state, task, today);
    if (!result.reward) return;
    commitState(result.state);
    setReward({ ...result.reward, title: task.name });
  }

  function onSaveTask(input) {
    const task = {
      id: input.id || createId('task'),
      name: input.name.trim(),
      categoryId: input.categoryId,
      taskType: input.taskType ?? 'daily',
      xp: Math.max(0, Number(input.xp) || 0),
      gold: Math.max(0, Number(input.gold) || 0),
      schedule: {
        type: input.taskType === 'daily' ? (input.schedule?.type ?? 'daily') : 'anytime',
        days: input.taskType === 'daily' && input.schedule?.type === 'weekdays' ? [...(input.schedule.days ?? [])] : []
      },
      enabled: input.enabled ?? true
    };
    commitState((current) => ({
      ...current,
      tasks: current.tasks.some((item) => item.id === task.id)
        ? current.tasks.map((item) => (item.id === task.id ? task : item))
        : [...current.tasks, task]
    }));
    setToast(input.id ? '任务已更新' : '任务已创建');
  }

  function onToggleTask(taskId) {
    commitState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, enabled: !task.enabled } : task))
    }));
  }

  function onDeleteTask(taskId) {
    commitState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== taskId) }));
    setToast('任务已删除，历史完成记录保留');
  }

  function onSaveReward(input) {
    const item = {
      id: input.id || createId('reward'),
      name: input.name.trim(),
      cost: Math.max(0, Number(input.cost) || 0),
      description: input.description?.trim() ?? '',
      enabled: input.enabled ?? true
    };
    commitState((current) => ({
      ...current,
      rewards: current.rewards.some((rewardItem) => rewardItem.id === item.id)
        ? current.rewards.map((rewardItem) => (rewardItem.id === item.id ? item : rewardItem))
        : [...current.rewards, item]
    }));
    setToast(input.id ? '奖励已更新' : '奖励已创建');
  }

  function onToggleReward(rewardId) {
    commitState((current) => ({
      ...current,
      rewards: current.rewards.map((item) => (item.id === rewardId ? { ...item, enabled: !item.enabled } : item))
    }));
  }

  function onDeleteReward(rewardId) {
    commitState((current) => ({ ...current, rewards: current.rewards.filter((item) => item.id !== rewardId) }));
    setToast('奖励已删除，历史兑换记录保留');
  }

  function onSaveCategory(input) {
    const category = {
      id: input.id || createId('category'),
      name: input.name.trim(),
      weight: Math.max(0, Number(input.weight) || 0),
      color: input.color || CATEGORY_COLORS[state.categories.length % CATEGORY_COLORS.length]
    };
    commitState((current) => ({
      ...current,
      categories: current.categories.some((item) => item.id === category.id)
        ? current.categories.map((item) => (item.id === category.id ? category : item))
        : [...current.categories, category]
    }));
    setToast(input.id ? '分类已更新' : '分类已创建');
  }

  function onDeleteCategory(categoryId) {
    if (state.tasks.some((task) => task.categoryId === categoryId)) {
      setToast('该分类下还有任务，请先移动或删除这些任务');
      return false;
    }
    commitState((current) => ({ ...current, categories: current.categories.filter((item) => item.id !== categoryId) }));
    setToast('分类已删除');
    return true;
  }

  function onSaveMainQuest(input) {
    const quest = {
      id: input.id || createId('quest'),
      name: input.name.trim(),
      period: input.period.trim(),
      target: Math.max(0, Number(input.target) || 0),
      current: Math.max(0, Number(input.current) || 0),
      unit: input.unit.trim(),
      showOnDashboard: input.showOnDashboard ?? true
    };
    commitState((current) => ({
      ...current,
      mainQuests: current.mainQuests.some((item) => item.id === quest.id)
        ? current.mainQuests.map((item) => (item.id === quest.id ? quest : item))
        : [...current.mainQuests, quest]
    }));
    setToast(input.id ? '主线任务已更新' : '主线任务已创建');
  }

  function onDeleteMainQuest(questId) {
    commitState((current) => ({ ...current, mainQuests: current.mainQuests.filter((item) => item.id !== questId) }));
    setToast('主线任务已删除');
  }

  function onRedeemReward(item) {
    const result = redeemReward(state, item);
    if (result.success) commitState(result.state);
    setToast(result.success ? `已兑换：${item.name}` : '金币不足，先继续完成任务');
  }

  async function onExport() {
    await navigator.clipboard?.writeText(exportState(state));
    setToast('备份数据已复制到剪贴板');
  }

  function onImport(json) {
    try {
      commitState(importState(json));
      setToast('数据导入成功');
    } catch {
      setToast('导入失败，请检查 JSON 内容');
    }
  }

  return {
    state,
    reward,
    setReward,
    toast,
    setToast,
    syncStatus,
    rewards: state.rewards.filter((item) => item.enabled),
    ...derived,
    onCompleteTask,
    onSaveTask,
    onToggleTask,
    onDeleteTask,
    onSaveReward,
    onToggleReward,
    onDeleteReward,
    onSaveCategory,
    onDeleteCategory,
    onSaveMainQuest,
    onDeleteMainQuest,
    onRedeemReward,
    onExport,
    onImport
  };
}
