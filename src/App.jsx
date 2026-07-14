import CartonMarkTool from './features/carton-mark/CartonMarkTool.jsx';
import HomePage from './features/HomePage.jsx';
import PackingListTool from './features/packing-list/PackingListTool.jsx';

function normalizePath(pathname) {
  const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const pathWithoutBase = basePath && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  return pathWithoutBase.replace(/\/+$/, '') || '/';
}

export default function App() {
  const hashPath = window.location.hash.startsWith('#/')
    ? window.location.hash.slice(1)
    : '';
  const path = hashPath || normalizePath(window.location.pathname);

  if (path === '/carton-mark') return <CartonMarkTool />;
  if (path === '/packing-list') return <PackingListTool />;
  return <HomePage />;
}
