import { BarChart3, CheckSquare, Gem, LayoutDashboard, Settings } from 'lucide-react';

const items = [
  { id: 'dashboard', label: '首页', icon: LayoutDashboard },
  { id: 'tasks', label: '任务', icon: CheckSquare },
  { id: 'stats', label: '统计', icon: BarChart3 },
  { id: 'shop', label: '商城', icon: Gem },
  { id: 'settings', label: '设置', icon: Settings }
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/20 bg-void/95 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs transition ${
                selected ? 'bg-gold text-void shadow-glow' : 'text-amberline/70 hover:bg-gold/10 hover:text-amberline'
              }`}
              aria-label={item.label}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
