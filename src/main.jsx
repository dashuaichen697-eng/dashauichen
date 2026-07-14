import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles.css';

window.addEventListener('error', (event) => {
  console.error('[CartonMarks] 全局脚本错误', event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[CartonMarks] 未处理异步错误', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
