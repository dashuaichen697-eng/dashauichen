import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import RewardModal from './components/RewardModal';
import { useAuth } from './hooks/useAuth';
import { useGameState } from './hooks/useGameState';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Shop from './pages/Shop';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import Tasks from './pages/Tasks';

const pages = {
  dashboard: Dashboard,
  tasks: Tasks,
  stats: Stats,
  shop: Shop,
  settings: Settings
};

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const auth = useAuth();
  const gameState = useGameState(auth.user);
  const game = {
    ...gameState,
    user: auth.user,
    cloudConfigured: auth.configured,
    onSignOut: auth.signOut
  };
  const Page = pages[activePage];

  const { toast, setToast } = game;

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast, setToast]);

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void text-sm text-amberline">
        正在连接星际档案...
      </div>
    );
  }

  if (auth.configured && !auth.user) return <Auth auth={auth} />;

  return (
    <div className="min-h-screen text-white">
      <main className="safe-bottom mx-auto w-full max-w-md px-4 pb-28 pt-[calc(env(safe-area-inset-top)+18px)]">
        <Page game={game} onNavigate={setActivePage} />
      </main>
      <BottomNav active={activePage} onChange={setActivePage} />
      <RewardModal reward={game.reward} onClose={() => game.setReward(null)} />
      {game.toast && (
        <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+16px)] z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg border border-gold/20 bg-obsidian px-4 py-3 text-center text-sm text-amberline shadow-gold">
          {game.toast}
        </div>
      )}
    </div>
  );
}
