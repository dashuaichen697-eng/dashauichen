import { Cloud, Download, LogOut, Upload } from 'lucide-react';
import { useState } from 'react';
import ProgressBar from '../components/ProgressBar';

export default function Stats({ game }) {
  const [importText, setImportText] = useState('');
  const { dailyXp, weeklySummary, categoryProgress, metrics, totalXp, gold, onExport, onImport, user, cloudConfigured, onSignOut } = game;
  const maxXp = Math.max(...dailyXp.map((item) => item.xp), 1);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gold/20 bg-obsidian p-4">
        <h1 className="text-2xl font-black text-white">数据统计</h1>
        <p className="mt-2 text-sm text-white/55">配置变化不会改写历史完成奖励。</p>
      </section>

      {user && (
        <section className="glass-panel rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald/15 text-emerald"><Cloud size={20} /></div>
            <div className="min-w-0 flex-1"><div className="font-bold text-white">云端账号</div><div className="truncate text-xs text-white/50">{user.email}</div></div>
            <button onClick={onSignOut} className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white/60" aria-label="退出账号"><LogOut size={18} /></button>
          </div>
        </section>
      )}

      <section className="glass-panel rounded-lg p-4">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-black text-white">最近 7 天 XP</h2><span className="text-xs text-amberline/60">本周 {weeklySummary.xp} XP</span></div>
        <div className="flex h-36 items-end gap-2">
          {dailyXp.map((item) => (
            <div key={item.dateKey} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end rounded bg-black/24 p-1"><div className="w-full rounded bg-gold" style={{ height: `${Math.max((item.xp / maxXp) * 100, item.xp ? 8 : 0)}%` }} /></div>
              <span className="text-[11px] text-white/45">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-lg p-4">
        <h2 className="mb-4 font-black text-white">今日分类完成率</h2>
        <div className="space-y-4">
          {categoryProgress.map((item) => <ProgressBar key={item.id} value={item.rate} color={item.color} label={`${item.name} · ${item.done}/${item.total} · 权重 ${item.weight}%`} />)}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Metric label="累计 XP" value={totalXp} />
        <Metric label="可用金币" value={gold} />
        <Metric label="累计完成" value={metrics.totalCompletions} />
        <Metric label="启用任务" value={metrics.activeTasks} />
        <Metric label="任务分类" value={metrics.categories} />
        <Metric label="本周完成率" value={`${weeklySummary.rate}%`} />
      </section>

      <section className="glass-panel rounded-lg p-4">
        <h2 className="font-black text-white">数据备份</h2>
        <p className="mt-1 text-xs text-white/45">{cloudConfigured ? '云端同步开启，同时保留本机副本。' : '当前数据保存在 localStorage。'}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={onExport} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-gold font-bold text-void"><Download size={17} />导出</button>
          <button onClick={() => onImport(importText)} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-white/10 font-bold text-white"><Upload size={17} />导入</button>
        </div>
        <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="粘贴备份 JSON 后点击导入" className="mt-3 h-24 w-full resize-none rounded-lg border border-gold/15 bg-black/30 p-3 text-sm text-white outline-none focus:border-gold" />
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-lg border border-gold/15 bg-black/24 p-4"><div className="text-xs text-amberline/60">{label}</div><div className="mt-2 text-2xl font-black text-white">{value}</div></div>;
}
