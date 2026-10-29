import { useEffect, useRef, useState } from 'react';
import { useHashRoute } from '../../hooks/useHashRoute';

/**
 * 全局搜索入口（页头）：
 * - 桌面：输入框，Enter 跳到 #/search?q=...
 * - 移动端：一个搜索按钮（页头空间有限）
 * - 键盘快捷键 `/` 聚焦
 */
export function HeaderSearch() {
  const route = useHashRoute();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const submit = () => {
    const value = query.trim();
    route.navigate('search', value ? { q: value } : {});
    inputRef.current?.blur();
  };

  return (
    <>
      <form
        className="header-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <span className="header-search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={inputRef}
          className="header-search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索事件 / 思想 / 标签（按 /）"
          aria-label="全局搜索"
        />
        {query && (
          <button
            type="button"
            className="header-search-clear"
            aria-label="清空搜索"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </form>
      <button
        type="button"
        className="header-search-mobile"
        aria-label="打开搜索"
        title="搜索"
        onClick={() => route.navigate('search')}
      >
        ⌕
      </button>
    </>
  );
}
