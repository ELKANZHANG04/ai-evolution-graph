export type ViewId = 'timeline' | 'graph' | 'feed' | 'insights' | 'about';

export interface ViewMeta {
  id: ViewId;
  label: string;
  en: string;
  hint: string;
}

export const VIEWS: ViewMeta[] = [
  { id: 'timeline', label: '演进时间轴', en: 'Timeline', hint: '块面积 = 影响力' },
  { id: 'graph', label: '关系图谱', en: 'Graph', hint: '谁影响了谁' },
  { id: 'feed', label: '最新动态', en: 'Feed', hint: '今天发生了什么' },
  { id: 'insights', label: '思想库', en: 'Insights', hint: '值得记住的观点' },
  { id: 'about', label: '关于', en: 'About', hint: '数据与评分标准' },
];

const VIEW_IDS = new Set<string>(VIEWS.map((view) => view.id));

export interface RouteState {
  view: ViewId;
  params: URLSearchParams;
}

/** 解析 #/timeline?entry=chatgpt-2022 形式的 hash 路由 */
export function parseHash(hash: string): RouteState {
  const raw = hash.replace(/^#/, '').replace(/^\//, '');
  const [pathPart, queryPart = ''] = raw.split('?');
  const view = (pathPart || 'timeline').trim() as ViewId;
  return {
    view: VIEW_IDS.has(view) ? view : 'timeline',
    params: new URLSearchParams(queryPart),
  };
}

export function buildHash(view: ViewId, params?: URLSearchParams | Record<string, string | undefined>): string {
  const search = params instanceof URLSearchParams ? params : toParams(params);
  const query = search.toString();
  return `#/${view}${query ? `?${query}` : ''}`;
}

export function toParams(input?: URLSearchParams | Record<string, string | undefined>): URLSearchParams {
  if (input instanceof URLSearchParams) return input;
  const params = new URLSearchParams();
  if (input) {
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && value !== null && value !== '') params.set(key, value);
    }
  }
  return params;
}
