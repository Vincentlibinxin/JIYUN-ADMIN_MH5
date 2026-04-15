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
