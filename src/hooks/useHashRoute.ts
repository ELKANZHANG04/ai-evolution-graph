import { useCallback, useEffect, useState } from 'react';
import { buildHash, parseHash, type RouteState, type ViewId } from '../lib/hashRoute';

export interface HashRoute extends RouteState {
  navigate: (view: ViewId, params?: URLSearchParams | Record<string, string | undefined>, options?: { replace?: boolean }) => void;
  setParams: (mutate: (params: URLSearchParams) => void, options?: { replace?: boolean }) => void;
}

/**
 * 自研 hash 路由：零依赖、静态托管深链可用。
 * 选中条目、年份、筛选条件都放在 hash 查询串里，浏览器前进/后退天然可用。
 */
export function useHashRoute(): HashRoute {
  const [route, setRoute] = useState<RouteState>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const apply = useCallback((hash: string, replace: boolean) => {
    if (window.location.hash === hash) {
      setRoute(parseHash(hash));
      return;
    }
    if (replace) {
      window.history.replaceState(null, '', hash);
      setRoute(parseHash(hash));
    } else {
      window.location.hash = hash;
    }
  }, []);

  const navigate = useCallback<HashRoute['navigate']>(
    (view, params, options) => {
      apply(buildHash(view, params), options?.replace ?? false);
    },
    [apply],
  );

  const setParams = useCallback<HashRoute['setParams']>(
    (mutate, options) => {
      const next = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
      mutate(next);
      apply(buildHash(parseHash(window.location.hash).view, next), options?.replace ?? false);
    },
    [apply],
  );

  return { ...route, navigate, setParams };
}
