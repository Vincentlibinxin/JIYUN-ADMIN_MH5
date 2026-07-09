export interface SelectedLogisticsProvider {
  id: number;
  name: string;
}

const STORAGE_KEY = 'selectedLogisticsProvider';

export function getSelectedLogisticsProvider(): SelectedLogisticsProvider | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SelectedLogisticsProvider>;
    if (!parsed || !Number.isInteger(parsed.id) || Number(parsed.id) <= 0) return null;
    return {
      id: Number(parsed.id),
      name: String(parsed.name || ''),
    };
  } catch {
    return null;
  }
}

export function setSelectedLogisticsProvider(provider: SelectedLogisticsProvider): void {
  if (!Number.isInteger(provider.id) || provider.id <= 0) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    id: provider.id,
    name: provider.name || '',
  }));
}

export function clearSelectedLogisticsProvider(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
