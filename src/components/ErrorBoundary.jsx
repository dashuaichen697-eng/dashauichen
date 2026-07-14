import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[StellarRPG] 页面渲染失败', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-void px-5 text-white">
        <section className="w-full max-w-sm rounded-lg border border-gold/25 bg-obsidian p-5 shadow-gold">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">Stellar RPG</p>
          <h1 className="mt-3 text-2xl font-black">页面加载失败</h1>
          <p className="mt-3 text-sm leading-6 text-white/62">
            应用遇到运行错误，已在控制台输出具体信息。请先刷新页面；如果是 iPhone 桌面版，删除旧图标后用 Safari 重新添加。
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-black/35 p-3 text-xs text-amberline/75">
            {this.state.error?.message ?? 'Unknown error'}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 h-11 w-full rounded-lg bg-gold font-black text-void"
          >
            重新加载
          </button>
        </section>
      </div>
    );
  }
}
