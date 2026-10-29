import type { JSX, ReactNode } from 'react';
import './drawer.css';

export interface MarkdownLiteProps {
  text: string;
  className?: string;
}

type MarkdownBlock =
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'rule' };

const LIST_ITEM_RE = /^[-*]\s+/;

/** 行内 **加粗** → React 节点；不解析任意 HTML，天然转义，无 XSS 面。 */
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));
    nodes.push(<strong key={`strong-${index}`}>{match[1]}</strong>);
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/** 极简 Markdown：## / ### 小标题、- 列表、**加粗**、段落、--- 分隔线。 */
function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ kind: 'heading', level: 3, text: line.slice(4).trim() });
      index += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({ kind: 'heading', level: 2, text: line.slice(3).trim() });
      index += 1;
      continue;
    }

    // 单个 # 也当二级标题处理（我们的正文不依赖层级语义）
    if (line.startsWith('# ')) {
      blocks.push({ kind: 'heading', level: 2, text: line.slice(2).trim() });
      index += 1;
      continue;
    }

    if (line === '---' || line === '***' || line === '___') {
      blocks.push({ kind: 'rule' });
      index += 1;
      continue;
    }

    if (LIST_ITEM_RE.test(line)) {
      const items: string[] = [];
      while (index < lines.length) {
        const itemLine = lines[index].trim();
        if (!LIST_ITEM_RE.test(itemLine)) break;
        items.push(itemLine.replace(LIST_ITEM_RE, ''));
        index += 1;
      }
      if (items.length > 0) {
        blocks.push({ kind: 'list', items });
        continue;
      }
    }

    // 段落：连续非空行合并（遇到标题/列表/分隔线/空行结束）
    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (
        !next ||
        next.startsWith('# ') ||
        next.startsWith('## ') ||
        next.startsWith('### ') ||
        LIST_ITEM_RE.test(next) ||
        next === '---' ||
        next === '***' ||
        next === '___'
      ) {
        break;
      }
      paragraph.push(next);
      index += 1;
    }
    blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}

export function MarkdownLite({ text, className }: MarkdownLiteProps): JSX.Element | null {
  const blocks = parseMarkdown(text);
  if (blocks.length === 0) return null;

  return (
    <div className={className ? `drawer-md ${className}` : 'drawer-md'}>
      {blocks.map((block, blockIndex) => {
        if (block.kind === 'heading') {
          return block.level === 3 ? (
            <h4 key={blockIndex} className="drawer-md-h3">
              {renderInline(block.text)}
            </h4>
          ) : (
            <h3 key={blockIndex} className="drawer-md-h2">
              {renderInline(block.text)}
            </h3>
          );
        }

        if (block.kind === 'list') {
          return (
            <ul key={blockIndex} className="drawer-md-ul">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="drawer-md-li">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === 'rule') {
          return <hr key={blockIndex} className="drawer-md-hr" />;
        }

        return (
          <p key={blockIndex} className="drawer-md-p">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
