export type ViewId = 'mainline' | 'explore' | 'chapter' | 'thoughts' | 'feed' | 'about';

export interface ViewMeta {
  id: ViewId;
  label: string;
  en: string;
  hint: string;
}

export const VIEWS: ViewMeta[] = [
  { id: 'mainline', label: '主线', en: 'Mainline', hint: '5 个阶段 · 24 个里程碑 · 突破点' },
  { id: 'thoughts', label: '思想看板', en: 'Ideas', hint: '7 个主题：思想如何递进与推翻' },
  { id: 'feed', label: '最新动态', en: 'Feed', hint: '今天发生了什么（M3）' },
  { id: 'about', label: '关于', en: 'About', hint: '数据与评分标准' },
];

const VIEW_IDS = new Set<string>([...VIEWS.map((view) => view.id), 'chapter', 'explore']);

export interface RouteState {
  view: ViewId;
  params: URLSearchParams;
}

/** 旧深链兼容：#/timeline → #/explore?mode=timeline，#/graph → #/explore?mode=graph，#/insights → #/thoughts */
const LEGACY: Record<string, { view: ViewId; mode?: string }> = {
  timeline: { view: 'explore', mode: 'timeline' },
  graph: { view: 'explore', mode: 'graph' },
  insights: { view: 'thoughts' },
};

/** 解析 #/mainline?entry=chatgpt-2022 形式的 hash 路由 */
export function parseHash(hash: string): RouteState {
  const raw = hash.replace(/^#/, '').replace(/^\//, '');
  const [pathPart, queryPart = ''] = raw.split('?');
  const params = new URLSearchParams(queryPart);
  const path = (pathPart || 'mainline').trim();
  const legacy = LEGACY[path];
  const view: ViewId = legacy ? legacy.view : ((VIEW_IDS.has(path) ? path : 'mainline') as ViewId);
  if (legacy?.mode && !params.get('mode')) params.set('mode', legacy.mode);
  return { view, params };
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
