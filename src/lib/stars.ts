import { useEffect, useState } from 'react';

/**
 * 星标（个人灵感收藏）：
 * - 纯前端 localStorage，无后端；只存在用户本机浏览器。
 * - 用模块级缓存 + 订阅，保证页头/卡片/抽屉/灵感页实时同步。
 */
const STORAGE_KEY = 'aeg.stars.v1';

let cache: string[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function persist(ids: string[]): void {
  cache = ids;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // 隐私模式/配额满：内存态仍然生效
    }
  }
  for (const listener of listeners) listener();
}

/** 当前星标 id 列表（最新加星的在前） */
export function getStarredIds(): string[] {
  if (cache === null) cache = readStorage();
  return cache;
}

export function isStarred(id: string): boolean {
  return getStarredIds().includes(id);
}

/** 切换星标；返回切换后的状态 */
export function toggleStar(id: string): boolean {
  const ids = getStarredIds();
  const has = ids.includes(id);
  persist(has ? ids.filter((item) => item !== id) : [id, ...ids]);
  return !has;
}

export function removeStar(id: string): void {
  if (isStarred(id)) persist(getStarredIds().filter((item) => item !== id));
}

export function clearStars(): void {
  persist([]);
}

export function subscribeStars(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

/** React hook：星标列表 + 切换函数 */
export function useStars(): {
  ids: string[];
  count: number;
  isStarred: (id: string) => boolean;
  toggle: (id: string) => void;
} {
  const [ids, setIds] = useState<string[]>(getStarredIds);

  useEffect(() => {
    const update = () => setIds([...getStarredIds()]);
    update();
    return subscribeStars(update);
  }, []);

  return {
    ids,
    count: ids.length,
    isStarred: (id: string) => ids.includes(id),
    toggle: (id: string) => {
      toggleStar(id);
    },
  };
}
