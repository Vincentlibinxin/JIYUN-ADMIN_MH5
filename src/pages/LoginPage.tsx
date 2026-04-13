import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ApiRequestError } from '../lib/api';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const formatRetry = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}分${r}秒` : `${r}秒`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/parcels', { replace: true });
    } catch (err: any) {
      if (err instanceof ApiRequestError) {
        if (err.status === 429) {
          const secs = Number(err.payload?.retryAfterSeconds || 0);
          setError(`登录尝试过多，请${secs > 0 ? formatRetry(secs) : '稍后'}再试`);
        } else if (err.status === 401) {
          setError('用户名或密码错误');
        } else {
          setError(err.message || '登录失败');
        }
      } else {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('fetch') || msg.includes('network')) {
          setError('无法连接服务器，请检查网络');
        } else {
          setError(err.message || '登录失败');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgGlow} />
      <div className={styles.bgGlow2} />

      <div className={styles.loginBox}>
        <div className={styles.logoWrapper}>
          <img src="/logo.png" alt="Logo" className={styles.logo} />
        </div>

        <div className={styles.title}>榕台海峡快运</div>

        <div className={styles.divider}>
          <div className={styles.dividerLineR} />
          <div className={styles.dividerDot} />
          <span className={styles.dividerText}>ADMIN PORTAL</span>
          <div className={styles.dividerDot} />
          <div className={styles.dividerLine} />
        </div>

        <div className={styles.subtitle}>RONGTAI MOBILE ADMIN</div>

        <form onSubmit={handleSubmit}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>👤</span>
              <input
                className={styles.input}
                type="text"
                placeholder="用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                className={styles.input}
                type={showPwd ? 'text' : 'password'}
                placeholder="密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <span
                style={{ cursor: 'pointer', color: '#64748b', fontSize: 16, userSelect: 'none' }}
                onClick={() => setShowPwd(v => !v)}
              >
                {showPwd ? '🙈' : '👁'}
              </span>
            </div>
          </div>

          <button className={styles.loginBtn} type="submit" disabled={loading}>
            {loading ? <div className={styles.spinner} /> : '登 录'}
          </button>
        </form>

        <div className={styles.footer}>© 2026 RONGTAI STRAIT EXPRESS</div>
      </div>
    </div>
  );
}
