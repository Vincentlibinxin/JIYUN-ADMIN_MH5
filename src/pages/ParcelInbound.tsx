import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { scanImageData, ZBarSymbolType } from '@undecaf/zbar-wasm';
import { api } from '../lib/api';
import styles from './ParcelInbound.module.css';

interface ItemEntry {
  name: string;
  quantity: string;
  value: string;
}

/* 1D barcode types we accept */
const BARCODE_1D = new Set([
  ZBarSymbolType.ZBAR_CODE128,
  ZBarSymbolType.ZBAR_CODE39,
  ZBarSymbolType.ZBAR_CODE93,
  ZBarSymbolType.ZBAR_EAN13,
  ZBarSymbolType.ZBAR_EAN8,
  ZBarSymbolType.ZBAR_UPCA,
  ZBarSymbolType.ZBAR_UPCE,
  ZBarSymbolType.ZBAR_I25,
  ZBarSymbolType.ZBAR_CODABAR,
  ZBarSymbolType.ZBAR_DATABAR,
  ZBarSymbolType.ZBAR_DATABAR_EXP,
]);

export default function ParcelInbound() {
  const navigate = useNavigate();

  // Form state
  const [trackingNumber, setTrackingNumber] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [items, setItems] = useState<ItemEntry[]>([{ name: '', quantity: '1', value: '' }]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Scanner state
  const [scanning, setScanning] = useState(false);
  const scanVideoRef = useRef<HTMLVideoElement | null>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number>(0);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanRegionId = 'barcode-scanner-region';

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => { stopScan(); };
  }, []);

  // --- Barcode Scanner (ZBar WASM, 1D only) ---
  const startScan = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      // Try to enable continuous autofocus
      const track = stream.getVideoTracks()[0];
      try {
        await (track as any).applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
      } catch { /* not supported, ok */ }

      scanStreamRef.current = stream;

      const container = document.getElementById(scanRegionId);
      if (!container) return;

      // Create video element
      const video = document.createElement('video');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.style.width = '100%';
      video.style.borderRadius = '8px';
      video.srcObject = stream;
      container.innerHTML = '';
      container.appendChild(video);
      scanVideoRef.current = video;
      await video.play();

      // Hidden canvas for frame capture
      const canvas = document.createElement('canvas');
      scanCanvasRef.current = canvas;

      setScanning(true);

      // Warm up ZBar WASM
      try {
        const warmCanvas = document.createElement('canvas');
        warmCanvas.width = 2; warmCanvas.height = 2;
        const wCtx = warmCanvas.getContext('2d')!;
        const wImg = wCtx.getImageData(0, 0, 2, 2);
        await scanImageData(wImg);
      } catch { /* warmup ok */ }

      // Scan loop
      const tick = async () => {
        if (!scanVideoRef.current || !scanStreamRef.current) return;
        const v = scanVideoRef.current;
        if (v.videoWidth === 0) {
          scanTimerRef.current = window.setTimeout(tick, 200);
          return;
        }
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(v, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        try {
          const symbols = await scanImageData(imgData);
          const match = symbols.find(s => BARCODE_1D.has(s.type));
          if (match) {
            const decoded = match.decode();
            setTrackingNumber(decoded);
            stopScan();
            return;
          }
        } catch (e: any) {
          console.error('[ZBar scan error]', e);
        }
        scanTimerRef.current = window.setTimeout(tick, 200);
      };
      scanTimerRef.current = window.setTimeout(tick, 300);
    } catch {
      setScanning(false);
      setError('无法启动摄像头，请检查权限设置');
    }
  }, []);

  const stopScan = useCallback(() => {
    clearTimeout(scanTimerRef.current);
    if (scanStreamRef.current) {
      scanStreamRef.current.getTracks().forEach(t => t.stop());
      scanStreamRef.current = null;
    }
    if (scanVideoRef.current) {
      scanVideoRef.current.remove();
      scanVideoRef.current = null;
    }
    scanCanvasRef.current = null;
    setScanning(false);
  }, []);

  // --- Camera capture ---
  const openCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      setError('无法打开摄像头，请检查权限');
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setPhotos(prev => [...prev, file]);
      setPhotoPreviews(prev => [...prev, URL.createObjectURL(file)]);
    }, 'image/jpeg', 0.85);
  }, []);

  // --- File picker ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - photos.length;
    const toAdd = files.slice(0, remaining);
    setPhotos(prev => [...prev, ...toAdd]);
    setPhotoPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoPreviews[idx]);
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // --- Items ---
  const updateItem = (idx: number, field: keyof ItemEntry, value: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setItems(prev => [...prev, { name: '', quantity: '1', value: '' }]);
  };

  // --- Submit ---
  const handleSubmit = async () => {
    setError('');
    if (!trackingNumber.trim()) {
      setError('请输入或扫描包裹单号');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('tracking_number', trackingNumber.trim());
      if (weight) fd.append('weight', weight);
      if (length) fd.append('length_cm', length);
      if (width) fd.append('width_cm', width);
      if (height) fd.append('height_cm', height);

      const validItems = items.filter(it => it.name.trim());
      if (validItems.length > 0) {
        fd.append('items', JSON.stringify(validItems.map(it => ({
          name: it.name.trim(),
          quantity: Number(it.quantity) || 1,
          value: Number(it.value) || 0,
        }))));
      }

      photos.forEach(file => fd.append('files', file));

      await api.parcels.inbound(fd);
      navigate('/parcels', { replace: true });
    } catch (err: any) {
      setError(err.message || '入库失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/parcels')}>←</button>
        <div className={styles.topTitle}>包裹入库</div>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* Section 1: Tracking Number */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>📦 包裹单号</div>
          <div className={styles.scanArea}>
            <div id={scanRegionId} className={styles.scanVideo} />
            <div className={styles.scanBtnRow}>
              {!scanning ? (
                <button className={styles.scanBtn} onClick={startScan}>📷 扫描条码</button>
              ) : (
                <button className={styles.scanBtnStop} onClick={stopScan}>⏹ 停止扫描</button>
              )}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>手动输入单号</label>
            <input
              className={styles.input}
              placeholder="请输入包裹单号"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: Weight & Dimensions */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>⚖️ 重量与尺寸</div>
          <div className={styles.formGroup}>
            <label className={styles.label}>重量 (kg)</label>
            <input
              className={styles.input}
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="请输入重量"
              value={weight}
              onChange={e => setWeight(e.target.value)}
            />
          </div>
          <div className={styles.sizeRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>长 (cm)</label>
              <input className={styles.input} type="number" inputMode="decimal" placeholder="长" value={length} onChange={e => setLength(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>宽 (cm)</label>
              <input className={styles.input} type="number" inputMode="decimal" placeholder="宽" value={width} onChange={e => setWidth(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>高 (cm)</label>
              <input className={styles.input} type="number" inputMode="decimal" placeholder="高" value={height} onChange={e => setHeight(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 3: Items */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>🏷️ 物品信息</div>
          {items.map((item, idx) => (
            <div key={idx} className={styles.itemRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>物品名称</label>
                <input className={styles.input} placeholder="名称" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} />
              </div>
              <div className={styles.formGroup} style={{ maxWidth: 70 }}>
                <label className={styles.label}>数量</label>
                <input className={styles.input} type="number" inputMode="numeric" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
              </div>
              <div className={styles.formGroup} style={{ maxWidth: 90 }}>
                <label className={styles.label}>价值</label>
                <input className={styles.input} type="number" inputMode="decimal" placeholder="¥" value={item.value} onChange={e => updateItem(idx, 'value', e.target.value)} />
              </div>
              {items.length > 1 && (
                <button className={styles.removeItemBtn} onClick={() => removeItem(idx)}>✕</button>
              )}
            </div>
          ))}
          <button className={styles.addItemBtn} onClick={addItem}>+ 添加物品</button>
        </div>

        {/* Section 4: Photos */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>📸 拍照上传（最多10张）</div>
          <div className={styles.photoGrid}>
            {photoPreviews.map((src, idx) => (
              <div key={idx} className={styles.photoThumb}>
                <img src={src} alt={`photo-${idx}`} />
                <button className={styles.photoRemove} onClick={() => removePhoto(idx)}>✕</button>
              </div>
            ))}
            {photos.length < 10 && (
              <>
                <div className={styles.photoAdd} onClick={openCamera}>
                  <span className={styles.photoAddIcon}>📷</span>
                  <span>拍照</span>
                </div>
                <div className={styles.photoAdd} onClick={() => fileInputRef.current?.click()}>
                  <span className={styles.photoAddIcon}>🖼️</span>
                  <span>相册</span>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>

        {/* Submit */}
        <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
          {submitting ? <div className={styles.spinner} /> : '✅ 确认入库'}
        </button>
      </div>

      {/* Camera Modal */}
      {cameraOpen && (
        <div className={styles.cameraOverlay}>
          <div className={styles.cameraPreview}>
            <video ref={cameraVideoRef} playsInline muted />
          </div>
          <div className={styles.cameraBtnRow}>
            <button className={styles.closeCameraBtn} onClick={closeCamera}>✕</button>
            <button className={styles.captureBtn} onClick={capturePhoto} />
          </div>
        </div>
      )}
    </div>
  );
}
