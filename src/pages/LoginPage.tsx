import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ApiRequestError, api, type LogisticsProviderOption } from '../lib/api';
import { getSelectedLogisticsProvider, setSelectedLogisticsProvider } from '../lib/logistics';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, logout, admin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [step, setStep] = useState<'credentials' | 'provider'>('credentials');
  const [providers, setProviders] = useState<LogisticsProviderOption[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');

  const goParcelsWithProvider = (provider: LogisticsProviderOption) => {
    setSelectedLogisticsProvider({ id: provider.id, name: provider.name || '' });
    navigate('/parcels', { replace: true });
  };

  const loadProvidersForSelection = async () => {
    const list = await api.logistics.options();
    if (!list.length) {
      throw new Error('当前账号没有可用物流商，请联系管理员');
    }
    setProviders(list);
    if (list.length === 1) {
      goParcelsWithProvider(list[0]);
      return;
    }
    setSelectedProviderId('');
    setStep('provider');
    setError('');
  };

  const confirmProviderAndEnter = () => {
    const id = Number(selectedProviderId);
    const selected = providers.find(p => Number(p.id) === id);
    if (!selected) {
      setError('请选择物流商');
      return;
    }
    goParcelsWithProvider(selected);
  };

  useEffect(() => {
    const selected = getSelectedLogisticsProvider();
    if (admin && selected?.id) {
      navigate('/parcels', { replace: true });
      return;
    }
    if (admin?.logistics_provider_id && admin.logistics_provider_id > 0) {
      setSelectedLogisticsProvider({
        id: admin.logistics_provider_id,
        name: admin.logistics_provider_name || '',
      });
      navigate('/parcels', { replace: true });
      return;
    }
    if (admin) {
      setLoading(true);
      loadProvidersForSelection()
        .catch(async (e: any) => {
          setError(e?.message || '无法加载物流商列表');
          await logout().catch(() => {});
          setStep('credentials');
        })
        .finally(() => setLoading(false));
    }
  }, [admin, navigate, logout]);

  const formatRetry = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}分${r}秒` : `${r}秒`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'provider') {
      confirmProviderAndEnter();
      return;
    }
    if (!username.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      const a = await login(username.trim(), password);
      if (a?.logistics_provider_id && a.logistics_provider_id > 0) {
        setSelectedLogisticsProvider({
          id: a.logistics_provider_id,
          name: a.logistics_provider_name || '',
        });
        navigate('/parcels', { replace: true });
        return;
      }
      await loadProvidersForSelection();
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

          {step === 'credentials' ? (
            <>
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
            </>
          ) : (
            <>
              <div className={styles.providerTitle}>请选择物流商</div>
              <div className={styles.formGroup}>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>🚚</span>
                  <select
                    className={styles.select}
                    value={selectedProviderId}
                    onChange={e => setSelectedProviderId(e.target.value)}
                  >
                    <option value="">请选择物流商</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={async () => {
                  await logout().catch(() => {});
                  setStep('credentials');
                  setProviders([]);
                  setSelectedProviderId('');
                  setPassword('');
                  setError('');
                }}
              >
                返回重新登录
              </button>
            </>
          )}

          <button className={styles.loginBtn} type="submit" disabled={loading}>
            {loading ? <div className={styles.spinner} /> : step === 'credentials' ? '登 录' : '进入包裹列表'}
          </button>
        </form>

        <div className={styles.footer}>© 2026 RONGTAI STRAIT EXPRESS</div>
      </div>
    </div>
  );
}
