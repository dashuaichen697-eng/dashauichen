import { Award, Coins, Sparkles, Trophy, X } from 'lucide-react';

export default function RewardModal({ reward, onClose }) {
  if (!reward) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
      <div className="reward-pop w-full max-w-sm rounded-lg border border-gold/30 bg-obsidian p-5 text-center shadow-gold">
        <button
          onClick={onClose}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70"
          aria-label="关闭"
        >
          <X size={18} />
        </button>
        <div className="mx-auto mt-1 flex h-20 w-20 items-center justify-center rounded-full bg-gold text-void shadow-glow">
          <Sparkles size={36} />
        </div>
        <h2 className="mt-4 text-xl font-black text-white">奖励到账</h2>
        <p className="mt-1 text-sm text-amberline/70">{reward.title}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-black/30 p-3">
            <Award className="mx-auto text-gold" />
            <div className="mt-1 text-2xl font-black">+{reward.xp}</div>
            <div className="text-xs text-white/50">XP</div>
          </div>
          <div className="rounded-lg bg-black/30 p-3">
            <Coins className="mx-auto text-gold" />
            <div className="mt-1 text-2xl font-black">+{reward.gold}</div>
            <div className="text-xs text-white/50">金币</div>
          </div>
        </div>
        {reward.leveledUp && (
          <div className="mt-3 rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-amberline">
            升级成功：LV{reward.leveledUp}
          </div>
        )}
        {reward.achievements.map((item) => (
          <div key={item.id} className="mt-3 flex items-center gap-3 rounded-lg border border-cyan/30 bg-cyan/10 p-3 text-left">
            <Trophy className="text-cyan" size={20} />
            <div>
              <div className="text-sm font-bold text-cyan">成就达成：{item.title}</div>
              <div className="text-xs text-white/50">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
