import CartonMarkTool from './features/carton-mark/CartonMarkTool.jsx';
import HomePage from './features/HomePage.jsx';
import PackingListTool from './features/packing-list/PackingListTool.jsx';
import { getRoutePath } from './lib/routes.js';
import { useEffect, useState } from 'react';

export default function App() {
  const [path, setPath] = useState(() => getCurrentPath());

  useEffect(() => {
    const updatePath = () => setPath(getCurrentPath());

    window.addEventListener('hashchange', updatePath);
    window.addEventListener('popstate', updatePath);

    return () => {
      window.removeEventListener('hashchange', updatePath);
      window.removeEventListener('popstate', updatePath);
    };
  }, []);

  if (path === '/carton-mark') return <CartonMarkTool />;
  if (path === '/packing-list') return <PackingListTool />;
  return <HomePage />;
}

function getCurrentPath() {
  return getRoutePath({
    baseUrl: import.meta.env.BASE_URL,
    hash: window.location.hash,
    pathname: window.location.pathname
  });
}
