import { CheckCircle2, Coins, Lock } from 'lucide-react';
import { ACHIEVEMENTS } from '../data/gameConfig';

export default function Shop({ game }) {
  const { rewards, gold, state, onRedeemReward } = game;
  const achieved = new Set(state.achievements);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gold/20 bg-obsidian p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">奖励商城</h1>
            <p className="mt-2 text-sm text-white/55">把自律兑换成看得见的奖励。</p>
          </div>
          <div className="rounded-lg bg-gold px-3 py-2 font-black text-void">{gold} 金币</div>
        </div>
      </section>

      <section className="space-y-3">
        {rewards.map((item) => {
          const affordable = gold >= item.cost;
          return (
            <div key={item.id} className="rounded-lg border border-gold/15 bg-black/24 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-white">{item.name}</h2>
                  {item.description && <p className="mt-1 text-xs leading-5 text-white/45">{item.description}</p>}
                  <div className="mt-1 flex items-center gap-1 text-sm text-gold">
                    <Coins size={15} />
                    {item.cost} 金币
                  </div>
                </div>
                <button
                  onClick={() => onRedeemReward(item)}
                  disabled={!affordable}
                  className={`h-10 rounded-lg px-4 text-sm font-bold ${
                    affordable ? 'bg-gold text-void' : 'bg-white/10 text-white/35'
                  }`}
                >
                  兑换
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {!rewards.length && <div className="rounded-lg border border-dashed border-gold/20 p-6 text-center text-sm text-white/45">暂无启用的奖励，请到“设置”中添加。</div>}

      <section className="glass-panel rounded-lg p-4">
        <h2 className="text-lg font-black text-white">成就系统</h2>
        <div className="mt-4 space-y-3">
          {ACHIEVEMENTS.map((item) => {
            const done = achieved.has(item.id);
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-lg bg-black/24 p-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${done ? 'bg-gold text-void' : 'bg-white/10 text-white/35'}`}>
                  {done ? <CheckCircle2 size={20} /> : <Lock size={18} />}
                </div>
                <div>
                  <div className="font-bold text-white">{item.title}</div>
                  <div className="text-xs text-white/50">{item.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
