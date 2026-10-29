import { useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import { CategoryChips, ImportanceBadge } from '../components/common/Badges';
import { EmptyState } from '../components/common/EmptyState';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { HashRoute } from '../hooks/useHashRoute';
import { ENTRIES, META } from '../lib/data';
import { formatDate } from '../lib/format';
import { searchEntries, type SearchFilters } from '../lib/search';
import type { Category } from '../lib/types';
import { CATEGORY_META, CATEGORY_ORDER, categoryColor } from '../theme/categories';
import '../components/search/search.css';

export interface SearchPageProps {
  route: HashRoute;
}

const CATEGORY_SET = new Set<string>(CATEGORY_ORDER);
const YEAR_MIN = 1950;
const YEAR_MAX = 2026;
const IMPORTANCE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const HOT_TAG_COUNT = 12;
const DEBOUNCE_MS = 250;

const YEAR_OPTIONS: number[] = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, index) => YEAR_MIN + index);

function parseCategories(values: string[]): Category[] {
  const selected = new Set<Category>();
  for (const value of values) {
    if (CATEGORY_SET.has(value)) selected.add(value as Category);
  }
  return CATEGORY_ORDER.filter((category) => selected.has(category));
}

function parseNumberParam(value: string | null, min: number, max: number): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return undefined;
  return parsed;
}

/** 只保留 <mark>，防止未来 snippet 变更引入其它标签（search.ts 自身已转义文本） */
function sanitizeSnippet(snippet: string): string {
  return snippet.replace(/<(?!\/?mark\b)[^>]*>/gi, '');
}

interface SearchResultCardProps {
  hit: ReturnType<typeof searchEntries>[number];
  onSelect: (entryId: string) => void;
}

function SearchResultCard({ hit, onSelect }: SearchResultCardProps): JSX.Element {
  const { entry } = hit;
  return (
    <article
      className="search-result"
      role="button"
      tabIndex={0}
      aria-label={`${entry.title}，${entry.date}`}
      style={{ borderLeftColor: categoryColor(entry.categories[0] ?? 'model') }}
      onClick={() => onSelect(entry.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          onSelect(entry.id);
        }
      }}
    >
      <div className="search-result-top">
        <span className="search-result-date mono">{formatDate(entry.date)}</span>
        <ImportanceBadge value={entry.importance} />
        {hit.matchedFields.length > 0 && (
          <span className="search-result-fields">命中：{hit.matchedFields.slice(0, 3).join(' · ')}</span>
        )}
      </div>
      <h2 className="search-result-title">{entry.title}</h2>
      {/* snippet 由 src/lib/search.ts 生成：文本已转义，只含 <mark> 高亮 */}
      <p className="search-result-snippet" dangerouslySetInnerHTML={{ __html: sanitizeSnippet(hit.snippet) }} />
      <div className="search-result-foot">
        <CategoryChips categories={entry.categories} max={4} />
      </div>
    </article>
  );
}

/**
 * 全局搜索 + 组合筛选。
 * 所有状态都写进 URL：q / cat（可重复）/ yf / yt / imin / imax。
 */
export function SearchPage({ route }: SearchPageProps): JSX.Element {
  const { params } = route;
  const setParams = route.setParams;
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = params.get('q') ?? '';
  const categories = useMemo(() => parseCategories(params.getAll('cat')), [params]);
  const yearFrom = parseNumberParam(params.get('yf'), YEAR_MIN, YEAR_MAX);
  const yearTo = parseNumberParam(params.get('yt'), YEAR_MIN, YEAR_MAX);
  const impMin = parseNumberParam(params.get('imin'), 1, 10);
  const impMax = parseNumberParam(params.get('imax'), 1, 10);

  const [input, setInput] = useState(query);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // URL → 输入框（外部导航/热门标签）
  useEffect(() => {
    setInput((previous) => (query !== previous.trim() ? query : previous));
  }, [query]);

  // 输入防抖 → URL（replace，避免历史记录爆炸）
  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed === query.trim()) return;
    const timer = window.setTimeout(() => {
      setParams((next) => {
        if (trimmed) next.set('q', trimmed);
        else next.delete('q');
      }, { replace: true });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input, query, setParams]);

  const commitQuery = (value: string, replace = false) => {
    const trimmed = value.trim();
    setParams((next) => {
      if (trimmed) next.set('q', trimmed);
      else next.delete('q');
    }, { replace });
  };

  const hasQuery = query.trim().length > 0;
  const hasFilters =
    categories.length > 0 ||
    yearFrom !== undefined ||
    yearTo !== undefined ||
    impMin !== undefined ||
    impMax !== undefined;
  const activeFilterCount =
    categories.length +
    (yearFrom !== undefined ? 1 : 0) +
    (yearTo !== undefined ? 1 : 0) +
    (impMin !== undefined ? 1 : 0) +
    (impMax !== undefined ? 1 : 0);

  const result = useMemo(() => {
    if (!hasQuery && !hasFilters) return null;
    const filters: SearchFilters = {
      q: query.trim(),
      categories: categories.length > 0 ? categories : undefined,
      yearFrom,
      yearTo,
      impMin,
      impMax,
    };
    const startedAt = performance.now();
    const hits = searchEntries(ENTRIES, filters);
    return { hits, elapsed: performance.now() - startedAt };
  }, [hasQuery, hasFilters, query, categories, yearFrom, yearTo, impMin, impMax]);

  const hotTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of ENTRIES) {
      for (const tag of entry.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, HOT_TAG_COUNT);
  }, []);

  const toggleCategory = (category: Category) => {
    setParams((next) => {
      const current = parseCategories(next.getAll('cat'));
      const updated = current.includes(category)
        ? current.filter((item) => item !== category)
        : CATEGORY_ORDER.filter((item) => item === category || current.includes(item));
      next.delete('cat');
      for (const item of updated) next.append('cat', item);
    }, { replace: true });
  };

  const setNumericParam = (key: 'yf' | 'yt' | 'imin' | 'imax', value: number | undefined) => {
    setParams((next) => {
      if (value === undefined) next.delete(key);
      else next.set(key, String(value));
    }, { replace: true });
  };

  const resetFilters = () => {
    setParams((next) => {
      next.delete('cat');
      next.delete('yf');
      next.delete('yt');
      next.delete('imin');
      next.delete('imax');
    }, { replace: true });
  };

  const clearQuery = () => {
    setInput('');
    commitQuery('', true);
    inputRef.current?.focus();
  };

  const runHotTag = (tag: string) => {
    setInput(tag);
    setParams((next) => {
      next.set('q', tag);
      next.delete('cat');
      next.delete('yf');
      next.delete('yt');
      next.delete('imin');
      next.delete('imax');
    });
  };

  const openEntry = (entryId: string) => {
    setParams((next) => next.set('entry', entryId));
  };

  const showFilterPanel = !isMobile || filtersOpen;
  const statsLabel = hasQuery ? `“${query.trim()}” 的搜索结果` : '筛选结果';

  return (
    <div className="search-page">
      <header className="search-head">
        <div className="search-copy">
          <p className="search-kicker mono">SEARCH · 全局搜索</p>
          <h1>全局搜索</h1>
          <p className="search-sub">
            在 {META.count} 条事件 / 模型 / 产品 / 思想中做加权搜索，支持类别、年份、影响力组合筛选。
          </p>
        </div>
      </header>

      <div className="search-box">
        <span className="search-box-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={inputRef}
          className="search-input"
          type="search"
          value={input}
          autoFocus
          placeholder="搜索事件、模型、论文、观点…（Enter 立即搜索）"
          aria-label="搜索条目"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitQuery(input);
            }
          }}
        />
        {input.length > 0 && (
          <button type="button" className="search-clear" onClick={clearQuery} aria-label="清空搜索">
            ✕
          </button>
        )}
      </div>

      {isMobile && (
        <button
          type="button"
          className="search-filter-toggle"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((value) => !value)}
        >
          筛选
          {activeFilterCount > 0 && <span className="search-filter-badge mono">{activeFilterCount}</span>}
          <span className="search-filter-caret" aria-hidden="true">
            {filtersOpen ? '▴' : '▾'}
          </span>
        </button>
      )}

      {showFilterPanel && (
        <div className="search-filters" role="group" aria-label="搜索筛选">
          <div className="search-filter-row">
            <span className="search-filter-label">类别</span>
            <div className="search-cats">
              {CATEGORY_ORDER.map((category) => {
                const color = categoryColor(category);
                const active = categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    className={`search-cat${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    style={
                      active
                        ? { borderColor: `${color}aa`, background: `${color}1f`, color: 'var(--text)' }
                        : undefined
                    }
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="search-cat-dot" style={{ background: color }} aria-hidden="true" />
                    {CATEGORY_META[category].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="search-filter-row">
            <span className="search-filter-label">年份</span>
            <label className="search-select-wrap">
              <span className="sr-only">起始年份</span>
              <select
                className="search-select"
                value={yearFrom ?? ''}
                onChange={(event) => setNumericParam('yf', event.target.value ? Number(event.target.value) : undefined)}
              >
                <option value="">不限</option>
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <span className="search-range-sep" aria-hidden="true">
              –
            </span>
            <label className="search-select-wrap">
              <span className="sr-only">结束年份</span>
              <select
                className="search-select"
                value={yearTo ?? ''}
                onChange={(event) => setNumericParam('yt', event.target.value ? Number(event.target.value) : undefined)}
              >
                <option value="">不限</option>
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <span className="search-filter-label search-filter-label-inline">影响力</span>
            <label className="search-select-wrap">
              <span className="sr-only">最低影响力</span>
              <select
                className="search-select"
                value={impMin ?? ''}
                onChange={(event) => setNumericParam('imin', event.target.value ? Number(event.target.value) : undefined)}
              >
                <option value="">不限</option>
                {IMPORTANCE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <span className="search-range-sep" aria-hidden="true">
              –
            </span>
            <label className="search-select-wrap">
              <span className="sr-only">最高影响力</span>
              <select
                className="search-select"
                value={impMax ?? ''}
                onChange={(event) => setNumericParam('imax', event.target.value ? Number(event.target.value) : undefined)}
              >
                <option value="">不限</option>
                {IMPORTANCE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            {hasFilters && (
              <button type="button" className="search-reset" onClick={resetFilters}>
                清空筛选
              </button>
            )}
          </div>
        </div>
      )}

      {result ? (
        <section className="search-results" aria-label="搜索结果">
          <div className="search-stats">
            <strong>{result.hits.length}</strong> 条结果
            <span className="search-stats-sep">·</span>
            <span>{statsLabel}</span>
            <span className="search-stats-sep">·</span>
            <span className="mono">用时 {result.elapsed.toFixed(1)} ms</span>
          </div>

          {result.hits.length > 0 ? (
            <div className="search-result-list">
              {result.hits.map((hit) => (
                <SearchResultCard key={hit.entry.id} hit={hit} onSelect={openEntry} />
              ))}
            </div>
          ) : (
            <div className="search-empty">
              <EmptyState
                title="没有找到匹配的条目"
                description="试试更短或更常见的关键词，或放宽年份 / 影响力 / 类别筛选。"
              />
              {hasFilters && (
                <div className="search-empty-actions">
                  <button type="button" className="search-btn" onClick={resetFilters}>
                    清空筛选条件
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        <section className="search-hot" aria-label="热门标签">
          <div className="search-hot-head">
            <h2 className="search-hot-title">热门标签</h2>
            <span className="search-hot-note">点击标签快速开始搜索；也可以直接在上方输入关键词</span>
          </div>
          <div className="search-hot-list">
            {hotTags.map(([tag, count]) => (
              <button key={tag} type="button" className="search-hot-tag" onClick={() => runHotTag(tag)}>
                <span className="search-hot-hash" aria-hidden="true">
                  #
                </span>
                {tag}
                <span className="search-hot-count mono">{count}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
