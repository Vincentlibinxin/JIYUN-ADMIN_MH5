import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Tag, Space, Typography, Spin, Empty, Flex } from 'antd';
import { PlusOutlined, LogoutOutlined, InboxOutlined, ColumnWidthOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

const { Text, Title } = Typography;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:    { label: '待处理', color: 'warning' },
  received:   { label: '已入库', color: 'processing' },
  in_transit: { label: '运输中', color: 'cyan' },
  arrived:    { label: '已到达', color: 'green' },
  delivered:  { label: '已签收', color: 'success' },
  exception:  { label: '异常',   color: 'error' },
};

function formatDate(d: string) {
  if (!d) return '-';
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const h = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

function formatSize(l: number, w: number, h: number) {
  if (!l && !w && !h) return '-';
  return `${l}×${w}×${h} cm`;
}

export default function ParcelList() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParcels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.parcels.list(1, 5);
      setParcels(res.data || []);
    } catch {
      setParcels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadParcels(); }, [loadParcels]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#141414', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: '#1f1f1f',
        borderBottom: '1px solid rgba(245,130,32,0.15)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Title level={5} style={{ margin: 0, color: '#f0f0f0' }}>
          <InboxOutlined style={{ marginRight: 6, color: '#f58220' }} />包裹管理
        </Title>
        <Button size="small" danger ghost icon={<LogoutOutlined />} onClick={handleLogout}>退出</Button>
      </div>

      {/* Inbound button */}
      <div style={{ padding: '12px 14px 6px' }}>
        <Button type="primary" block size="large" icon={<PlusOutlined />}
          onClick={() => navigate('/parcels/inbound')}
          style={{ height: 44, fontWeight: 600, letterSpacing: 2 }}>
          包裹入库
        </Button>
      </div>

      {/* Section title */}
      <div style={{ padding: '8px 14px 4px' }}>
        <Text type="secondary" style={{ fontSize: 12, letterSpacing: 1 }}>最新包裹</Text>
      </div>

      {/* Card list */}
      <div style={{ flex: 1, padding: '4px 14px 20px' }}>
        {loading ? (
          <Flex justify="center" align="center" style={{ paddingTop: 60 }}><Spin /></Flex>
        ) : parcels.length === 0 ? (
          <Empty description="暂无包裹数据" style={{ paddingTop: 40 }} />
        ) : (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {parcels.map((p) => {
              const st = STATUS_MAP[p.status] || { label: p.status, color: 'default' };
              return (
                <Card key={p.id} size="small" style={{ background: '#1f1f1f', border: '1px solid #303030' }}
                  styles={{ body: { padding: '10px 12px' } }}>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                    <Text strong style={{ color: '#f58220', fontSize: 14 }}>{p.tracking_number}</Text>
                    <Tag color={st.color} style={{ margin: 0, fontSize: 11 }}>{st.label}</Tag>
                  </Flex>
                  <Flex gap={14} style={{ marginBottom: 2 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ⚖️ {p.weight ? `${p.weight} kg` : '-'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <ColumnWidthOutlined style={{ marginRight: 3 }} />
                      {formatSize(p.length_cm, p.width_cm, p.height_cm)}
                    </Text>
                  </Flex>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    <ClockCircleOutlined style={{ marginRight: 3 }} />
                    {formatDate(p.created_at)}
                  </Text>
                </Card>
              );
            })}
          </Space>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import styles from './ParcelList.module.css';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:    { label: '待处理', cls: styles.statusPending },
  received:   { label: '已入库', cls: styles.statusReceived },
  in_transit: { label: '运输中', cls: styles.statusDefault },
  arrived:    { label: '已到达', cls: styles.statusDefault },
  delivered:  { label: '已签收', cls: styles.statusDefault },
  exception:  { label: '异常',   cls: styles.statusDefault },
};

function formatDate(d: string) {
  if (!d) return '-';
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const h = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

function formatSize(l: number, w: number, h: number) {
  if (!l && !w && !h) return '-';
  return `${l}×${w}×${h} cm`;
}

export default function ParcelList() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParcels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.parcels.list(1, 5);
      setParcels(res.data || []);
    } catch {
      setParcels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadParcels(); }, [loadParcels]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topTitle}>📦 包裹管理</div>
        <button className={styles.logoutBtn} onClick={handleLogout}>退出</button>
      </div>

      {/* Inbound button */}
      <div className={styles.inboundBtnWrapper}>
        <button className={styles.inboundBtn} onClick={() => navigate('/parcels/inbound')}>
          <span style={{ fontSize: 20 }}>📥</span> 包裹入库
        </button>
      </div>

      <div className={styles.sectionTitle}>最新包裹</div>

      {/* Card list */}
      {loading ? (
        <div className={styles.loading}>加载中...</div>
      ) : parcels.length === 0 ? (
        <div className={styles.empty}>暂无包裹数据</div>
      ) : (
        <div className={styles.cardList}>
          {parcels.map((p) => {
            const st = STATUS_MAP[p.status] || { label: p.status, cls: styles.statusDefault };
            return (
              <div key={p.id} className={styles.card}>
                <div className={styles.cardRow1}>
                  <span className={styles.trackingNo}>{p.tracking_number}</span>
                  <span className={`${styles.status} ${st.cls}`}>{st.label}</span>
                </div>
                <div className={styles.cardRow2}>
                  <span>⚖️ {p.weight ? `${p.weight} kg` : '-'}</span>
                  <span>📐 {formatSize(p.length_cm, p.width_cm, p.height_cm)}</span>
                </div>
                <div className={styles.cardRow3}>
                  🕐 {formatDate(p.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
