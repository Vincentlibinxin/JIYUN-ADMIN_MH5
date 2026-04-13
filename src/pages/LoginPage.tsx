import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../lib/auth';
import { ApiRequestError } from '../lib/api';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatRetry = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}分${r}秒` : `${r}秒`;
  };

  const handleFinish = async (values: { username: string; password: string }) => {
    setError('');
    setLoading(true);
    try {
      await login(values.username.trim(), values.password);
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #141414 0%, #1f1f1f 50%, #141414 100%)',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,130,32,0.12) 0%, transparent 70%)',
        top: -80, right: -80, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,130,32,0.06) 0%, transparent 70%)',
        bottom: -60, left: -60, pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 360,
        background: 'rgba(30,30,30,0.9)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(245,130,32,0.15)', borderRadius: 16,
        padding: '28px 24px 20px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 60, height: 60, borderRadius: 12, marginBottom: 10 }} />
          <Title level={4} style={{ margin: 0, color: '#f0f0f0', letterSpacing: 1 }}>榕台海峡快运</Title>
        </div>

        <Divider style={{ margin: '12px 0', borderColor: 'rgba(245,130,32,0.2)' }}>
          <Text style={{ fontSize: 10, color: '#666', letterSpacing: 3 }}>ADMIN PORTAL</Text>
        </Divider>

        <Form name="login" onFinish={handleFinish} size="middle" style={{ marginTop: 8 }}>
          {error && (
            <Form.Item style={{ marginBottom: 12 }}>
              <Alert message={error} type="error" showIcon closable onClose={() => setError('')} />
            </Form.Item>
          )}

          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]} style={{ marginBottom: 12 }}>
            <Input prefix={<UserOutlined />} placeholder="用户名" autoComplete="username" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} style={{ marginBottom: 16 }}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" autoComplete="current-password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block icon={<LoginOutlined />}
              style={{ height: 40, fontWeight: 600, letterSpacing: 2 }}>
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Text style={{ fontSize: 10, color: '#444', letterSpacing: 1 }}>© 2026 RONGTAI STRAIT EXPRESS</Text>
        </div>
      </div>
    </div>
  );
}
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
