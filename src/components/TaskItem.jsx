import { Check, Coins, Repeat2 } from 'lucide-react';
import { getScheduleLabel } from '../utils/game';

export default function TaskItem({ task, done, onComplete, compact = false }) {
  return (
    <div className={`rounded-lg border p-4 ${done ? 'border-emerald/25 bg-emerald/10' : 'border-gold/15 bg-black/24'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-amberline/60">
            <Repeat2 size={13} />
            <span>{getScheduleLabel(task.schedule)}</span>
          </div>
          <h3 className="mt-1 break-words text-base font-bold text-white">{task.name}</h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-gold">
            <span>+{task.xp} XP</span>
            <span className="flex items-center gap-1"><Coins size={14} />+{task.gold}</span>
          </p>
        </div>
      </div>
      <button
        onClick={() => onComplete(task)}
        disabled={done}
        className={`${compact ? 'mt-3 h-10' : 'mt-4 h-11'} flex w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition ${
          done ? 'bg-emerald/20 text-emerald' : 'bg-gold text-void shadow-glow active:scale-[.99]'
        }`}
      >
        <Check size={18} />
        {done ? '已完成' : '完成任务'}
      </button>
    </div>
  );
}
