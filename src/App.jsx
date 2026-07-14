import CartonMarkTool from './features/carton-mark/CartonMarkTool.jsx';
import HomePage from './features/HomePage.jsx';
import PackingListTool from './features/packing-list/PackingListTool.jsx';

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, '') || '/';
}

export default function App() {
  const path = normalizePath(window.location.pathname);

  if (path === '/carton-mark') return <CartonMarkTool />;
  if (path === '/packing-list') return <PackingListTool />;
  return <HomePage />;
}
