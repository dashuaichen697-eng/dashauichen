import { Cloud, Eye, EyeOff, LoaderCircle, LogIn, Rocket } from 'lucide-react';
import { useState } from 'react';

export default function Auth({ auth }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const action = mode === 'signin' ? auth.signIn : auth.signUp;
      const { data, error } = await action(email.trim(), password);

      if (error) {
        const messages = {
          'Invalid login credentials': '邮箱或密码不正确；如果这个邮箱已经注册，请使用原密码登录或点击忘记密码。',
          'Email not confirmed': '这个旧账号尚未确认，请重新注册或联系管理员处理。',
          'User already registered': '这个邮箱已经注册，请切换到登录。',
        };
        setMessage(messages[error.message] || error.message);
      } else if (mode === 'signup' && data.user?.identities?.length === 0) {
        setMode('signin');
        setMessage('这个邮箱已经注册，请直接登录；忘记密码可点击下方按钮。');
      } else if (mode === 'signup' && !data.session) {
        setMessage('账号已创建，请切换到登录。');
      }
    } catch {
      setMessage('连接暂时失败，请检查网络后重试。');
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setMessage('请先填写邮箱，再点击忘记密码。');
      return;
    }

    setBusy(true);
    setMessage('');
    const { error } = await auth.resetPassword(targetEmail);
    setMessage(error ? error.message : '密码重置邮件已发送，请到邮箱中打开。');
    setBusy(false);
  }

  return (
    <main className="star-field flex min-h-screen items-center justify-center px-5 py-10 text-white">
      <section className="w-full max-w-sm rounded-lg border border-gold/25 bg-obsidian p-5 shadow-gold">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">Stellar RPG</p>
            <h1 className="mt-2 text-3xl font-black leading-tight">陈百万的星际征程</h1>
            <p className="mt-2 text-sm text-amberline/70">登录后，电脑与 iPhone 实时同步</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-void shadow-glow">
            <Rocket size={24} />
          </div>
        </div>

        <div className="mt-6 flex rounded-lg bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`h-10 flex-1 rounded-md text-sm font-bold ${mode === 'signin' ? 'bg-gold text-void' : 'text-white/55'}`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`h-10 flex-1 rounded-md text-sm font-bold ${mode === 'signup' ? 'bg-gold text-void' : 'text-white/55'}`}
          >
            注册
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="邮箱"
            className="h-12 w-full rounded-lg border border-gold/15 bg-black/30 px-3 text-white outline-none focus:border-gold"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength="6"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="密码（至少 6 位）"
              className="h-12 w-full rounded-lg border border-gold/15 bg-black/30 px-3 pr-12 text-white outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center text-white/55"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold font-black text-void shadow-glow disabled:opacity-60"
          >
            {busy ? <LoaderCircle className="animate-spin" size={19} /> : <LogIn size={19} />}
            {mode === 'signin' ? '登录并同步' : '创建同步账号'}
          </button>
          {mode === 'signin' && (
            <button
              type="button"
              disabled={busy}
              onClick={resetPassword}
              className="h-9 w-full text-sm font-bold text-amberline/75 disabled:opacity-50"
            >
              忘记密码
            </button>
          )}
        </form>

        {message && <p className="mt-4 rounded-lg bg-white/5 p-3 text-sm text-amberline">{message}</p>}

        <div className="mt-5 flex items-center gap-2 border-t border-gold/10 pt-4 text-xs text-white/45">
          <Cloud size={15} />
          同一个账号登录电脑和 iPhone，数据会自动同步。
        </div>
      </section>
    </main>
  );
}
