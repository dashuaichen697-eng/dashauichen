import { ArrowRight, Cloud, CloudOff, Coins, Flag, LoaderCircle, Rocket, Route } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import StatCard from '../components/StatCard';

export default function Dashboard({ game, onNavigate }) {
  const { todaySummary, totalXp, gold, level, streak, syncStatus, state } = game;
  const visibleQuests = state.mainQuests.filter((quest) => quest.showOnDashboard);
  const pendingTasks = todaySummary.tasks.filter((task) => !state.completions[todaySummary.dateKey]?.[task.id]);
  const categoryWeights = Object.fromEntries(state.categories.map((category) => [category.id, Number(category.weight) || 0]));
  const rankedTasks = [...pendingTasks]
    .sort((left, right) => {
      const weightDifference = (categoryWeights[right.categoryId] ?? 0) - (categoryWeights[left.categoryId] ?? 0);
      if (weightDifference) return weightDifference;
      return (Number(right.xp) + Number(right.gold)) - (Number(left.xp) + Number(left.gold));
    });
  const categoryHighlights = rankedTasks.filter((task, index, tasks) => tasks.findIndex((item) => item.categoryId === task.categoryId) === index);
  const priorityTasks = [...categoryHighlights, ...rankedTasks.filter((task) => !categoryHighlights.includes(task))].slice(0, 3);

  return (
    <div className="space-y-4">
      <section className="star-field rounded-lg border border-gold/20 bg-obsidian p-5 shadow-gold">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">Stellar RPG</p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-white">陈百万的星际征程</h1>
            <p className="mt-3 text-base font-bold text-amberline/80">人生 RPG 驾驶舱</p>
            <p className="mt-1 text-sm text-white/55">记录成长、升级与远征</p>
            <SyncBadge status={syncStatus} />
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-void shadow-glow">
            <Rocket size={24} />
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-gold/20 bg-black/30 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-amberline/70">今日完成率</span>
            <span className="font-bold text-white">{todaySummary.progress}%</span>
          </div>
          <div className="mt-3"><ProgressBar value={todaySummary.progress} /></div>
          <p className="mt-3 text-sm text-white/68">{todaySummary.motivation}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="当前等级" value={`LV${level.current.level}`} sub={level.next ? `距下一级 ${level.next.xp - totalXp} XP` : '已达最高等级'} />
        <StatCard label="当前总 XP" value={totalXp} sub={`今日 +${todaySummary.xp}`} />
        <StatCard label="当前金币" value={gold} sub={`今日 +${todaySummary.gold}`} />
        <StatCard label="连续打卡" value={`${streak} 天`} sub={`${todaySummary.completedCount}/${todaySummary.totalCount} 项完成`} />
      </section>

      <section className="glass-panel rounded-lg p-4">
        <div className="mb-4 flex items-center gap-2">
          <Route className="text-gold" size={20} />
          <h2 className="text-lg font-black text-white">主线任务</h2>
        </div>
        {visibleQuests.length ? (
          <div className="space-y-5">
            {visibleQuests.map((quest) => {
              const progress = quest.target > 0 ? Math.round((quest.current / quest.target) * 100) : 0;
              return (
                <div key={quest.id}>
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white">{quest.name}</h3>
                      <p className="mt-0.5 text-xs text-white/45">{quest.period}</p>
                    </div>
                    <div className="text-right text-sm font-bold text-amberline">{quest.current} / {quest.target} {quest.unit}</div>
                  </div>
                  <ProgressBar value={progress} />
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-white/45">在设置中添加并展示主线任务。</p>}
      </section>

      <section className="glass-panel rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Flag className="text-gold" size={20} />
          <h2 className="text-lg font-black text-white">今日战报</h2>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <BattleMetric label="总任务" value={todaySummary.totalCount} />
          <BattleMetric label="已完成" value={todaySummary.completedCount} accent="text-emerald" />
          <BattleMetric label="未完成" value={pendingTasks.length} accent="text-amberline" />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-black/30 p-3">
          <span className="text-sm text-white/55">今日已获得</span>
          <div className="flex items-center gap-3 text-sm font-black text-gold">
            <span>{todaySummary.xp} XP</span>
            <span className="flex items-center gap-1"><Coins size={15} />{todaySummary.gold} 金币</span>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-bold text-amberline/65">待完成重点</h3>
          {priorityTasks.length ? (
            <ul className="mt-3 space-y-2">
              {priorityTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 rounded-lg bg-white/[.035] px-3 py-2.5 text-sm font-bold text-white">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  <span className="min-w-0 flex-1 break-words">{task.name}</span>
                  <span className="shrink-0 text-xs text-white/35">{task.xp} XP</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-lg bg-emerald/10 p-3 text-sm font-bold text-emerald">
              今日任务已全部完成。
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onNavigate('tasks')}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold font-black text-void shadow-glow"
        >
          去完成今日任务
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}

function BattleMetric({ label, value, accent = 'text-white' }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-black/24 p-3 text-center">
      <div className={`text-2xl font-black ${accent}`}>{value}</div>
      <div className="mt-1 text-[11px] text-white/45">{label}</div>
    </div>
  );
}

function SyncBadge({ status }) {
  const states = {
    synced: { label: '云端已同步', icon: Cloud, className: 'text-emerald' },
    syncing: { label: '正在同步', icon: LoaderCircle, className: 'text-gold' },
    connecting: { label: '正在连接', icon: LoaderCircle, className: 'text-gold' },
    error: { label: '离线保存中', icon: CloudOff, className: 'text-ember' },
    local: { label: '本机保存', icon: CloudOff, className: 'text-white/45' }
  };
  const current = states[status] ?? states.local;
  const Icon = current.icon;
  return <div className={`mt-3 flex items-center gap-1.5 text-xs ${current.className}`}><Icon className={status === 'syncing' || status === 'connecting' ? 'animate-spin' : ''} size={14} />{current.label}</div>;
}
