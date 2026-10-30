import { useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import { ImportanceBadge } from '../common/Badges';
import type { Entry } from '../../lib/types';
import type { ThoughtBranchData, ThoughtStepData } from '../../lib/thoughtChains';
import { categoryColor, primaryCategory } from '../../theme/categories';
import './mindmap.css';

export interface ThemeMindMapProps {
  themeId: string;
  themeTitle: string;
  branches: ThoughtBranchData[];
  selectedId: string | null;
  onSelect: (entry: Entry) => void;
}

/** 布局常量（px） */
const PAD = 10;
const ROOT_W = 208;
const ROOT_H = 92;
const BRANCH_W = 148;
const BRANCH_H = 30;
const LEAF_W = 236;
const LEAF_H = 72;
const LEAF_GAP = 12;
const ROW_GAP = 16;
const GAP_ROOT = 56;
const GAP_BRANCH = 40;

const MIN_SCALE = 0.6;
const MAX_SCALE = 1.3;
const SCALE_STEP = 0.1;

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 左侧根 → 右列节点的三次贝塞尔曲线 */
function curve(x1: number, y1: number, x2: number, y2: number): string {
  const mid = (x1 + x2) / 2;
  return `M ${round(x1)} ${round(y1)} C ${round(mid)} ${round(y1)}, ${round(mid)} ${round(y2)}, ${round(x2)} ${round(y2)}`;
}

function yearOf(date: string): string {
  return date.slice(0, 4);
}

function shortTitle(entry: Entry): string {
  const claim = entry.thought_claim?.trim();
  const raw = claim || entry.title;
  const chars = [...raw];
  return chars.length > 42 ? `${chars.slice(0, 42).join('')}…` : raw;
}

interface LayoutLeaf {
  step: ThoughtStepData;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
}

interface LayoutBranch {
  label: string;
  count: number;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  leaves: LayoutLeaf[];
}

interface Layout {
  width: number;
  height: number;
  rootX: number;
  rootY: number;
  branches: LayoutBranch[];
}

/**
 * 布局：根在最左；子方向（分支）纵向排开；每个子方向的想法横向排成一行（时间倒序）。
 * 与看板类似但多了「根 → 子方向」两层结构，横向滚动查看每条分支的全部想法。
 */
function computeLayout(branches: ThoughtBranchData[]): Layout {
  const rowCount = Math.max(1, branches.length);
  const rowHeight = LEAF_H + ROW_GAP;
  const height = PAD * 2 + rowCount * rowHeight;
  const rootX = PAD;
  const rootY = Math.round(height / 2 - ROOT_H / 2);
  const branchX = rootX + ROOT_W + GAP_ROOT;
  const leafStartX = branchX + BRANCH_W + GAP_BRANCH;
  const maxLeaves = branches.reduce((max, branch) => Math.max(max, branch.steps.length), 0);
  const width = leafStartX + Math.max(1, maxLeaves) * (LEAF_W + LEAF_GAP) + PAD;

  const layoutBranches: LayoutBranch[] = branches.map((branch, rowIndex) => {
    const rowTop = PAD + rowIndex * rowHeight;
    const branchY = Math.round(rowTop + LEAF_H / 2 - BRANCH_H / 2);
    const leaves: LayoutLeaf[] = branch.steps.map((step, index) => ({
      step,
      x: leafStartX + index * (LEAF_W + LEAF_GAP),
      y: rowTop,
      fromX: branchX + BRANCH_W,
      fromY: branchY + BRANCH_H / 2,
    }));
    return {
      label: branch.label,
      count: branch.steps.length,
      x: branchX,
      y: branchY,
      fromX: rootX + ROOT_W,
      fromY: rootY + ROOT_H / 2,
      leaves,
    };
  });

  return { width, height, rootX, rootY, branches: layoutBranches };
}

/** 每个主题一张思维导图：主题（根）→ 子方向（分支）→ 思想节点（时间倒序） */
export function ThemeMindMap({
  themeId,
  themeTitle,
  branches,
  selectedId,
  onSelect,
}: ThemeMindMapProps): JSX.Element {
  const layout = useMemo(() => computeLayout(branches), [branches]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // 主题切换或分支变化时，回到 100% 并滚到左上角
  useEffect(() => {
    setScale(1);
    const node = scrollRef.current;
    if (node) node.scrollTo({ left: 0, top: 0 });
  }, [themeId, branches]);

  const fit = () => {
    const node = scrollRef.current;
    if (!node) return;
    const availW = node.clientWidth - 8;
    const availH = node.clientHeight - 8;
    const next = Math.min(1, availW / layout.width, availH / layout.height);
    setScale(round(Math.max(MIN_SCALE, next)));
    node.scrollTo({ left: 0, top: 0 });
  };

  const zoom = (direction: 1 | -1) => {
    setScale((value) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, value + direction * SCALE_STEP));
      return round(next);
    });
  };

  const leafCards = (step: ThoughtStepData, index: number): JSX.Element => (
    <button
      key={step.entry.id}
      type="button"
      className={`mm-leaf${step.entry.type === 'insight' ? ' is-insight' : ''}${
        step.entry.importance >= 9 ? ' is-breakthrough' : ''
      }${step.entry.importance >= 10 ? ' is-landmark' : ''}${
        selectedId === step.entry.id ? ' is-selected' : ''
      }`}
      style={{ borderLeftColor: categoryColor(primaryCategory(step.entry.categories)) }}
      data-entry-id={step.entry.id}
      data-date={step.entry.date}
      data-importance={step.entry.importance}
      title={`${step.entry.title}\n${step.entry.summary}`}
      aria-label={`${step.entry.title}（${step.entry.date}）· 影响力 ${step.entry.importance}/10`}
      onClick={() => onSelect(step.entry)}
    >
      <span className="mm-leaf-top">
        <span className="mm-leaf-year mono">{yearOf(step.entry.date)}</span>
        <span className={`mm-leaf-kind${step.entry.type === 'insight' ? ' is-insight' : ''}`}>
          {step.entry.type === 'insight' ? '思想' : step.entry.type === 'product' ? '产品' : '事件'}
        </span>
        <ImportanceBadge value={step.entry.importance} />
      </span>
      <span className="mm-leaf-title">{shortTitle(step.entry)}</span>
    </button>
  );

  return (
    <div className="mm">
      <div className="mm-toolbar">
        <span className="mm-hint">思维导图 · 根 → 子方向 → 思想（最新在前）· 长分支可左右滚动</span>
        <div className="mm-zoom" role="group" aria-label="缩放">
          <button type="button" className="mm-zoom-btn" aria-label="缩小" onClick={() => zoom(-1)}>
            −
          </button>
          <button type="button" className="mm-zoom-btn is-fit" onClick={fit}>
            适配
          </button>
          <button type="button" className="mm-zoom-btn" aria-label="放大" onClick={() => zoom(1)}>
            +
          </button>
          <span className="mm-zoom-value mono" aria-live="polite">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      <div className="mm-scroll" ref={scrollRef}>
        <div
          className="mm-canvas"
          style={{ width: round(layout.width * scale), height: round(layout.height * scale) }}
        >
          <div
            className="mm-paper"
            style={{
              width: layout.width,
              height: layout.height,
              transform: `scale(${scale})`,
            }}
          >
            <svg className="mm-edges" width={layout.width} height={layout.height} aria-hidden="true">
              {layout.branches.flatMap((branch) => [
                <path
                  key={`${branch.label}-root`}
                  d={curve(branch.fromX, branch.fromY, branch.x, branch.y + BRANCH_H / 2)}
                  className="mm-edge is-branch"
                />,
                ...branch.leaves.map((leaf) => (
                  <path
                    key={`${leaf.step.entry.id}-edge`}
                    d={curve(leaf.fromX, leaf.fromY, leaf.x, leaf.y + LEAF_H / 2)}
                    className="mm-edge"
                  />
                )),
              ])}
            </svg>

            <div
              className="mm-root"
              style={{ left: layout.rootX, top: layout.rootY, width: ROOT_W, minHeight: ROOT_H }}
            >
              <span className="mm-root-kicker mono">思想主题</span>
              <span className="mm-root-title">{themeTitle}</span>
              <span className="mm-root-meta mono">{branches.reduce((sum, b) => sum + b.steps.length, 0)} 步</span>
            </div>

            {layout.branches.map((branch) => (
              <div key={branch.label}>
                <div
                  className="mm-branch"
                  style={{ left: branch.x, top: branch.y, width: BRANCH_W, height: BRANCH_H }}
                >
                  <span className="mm-branch-label">{branch.label}</span>
                  <span className="mm-branch-count mono">{branch.count}</span>
                </div>
                {branch.leaves.map((leaf, index) => (
                  <div
                    key={leaf.step.entry.id}
                    style={{ position: 'absolute', left: leaf.x, top: leaf.y, width: LEAF_W }}
                  >
                    <div
                      style={{
                        width: LEAF_W,
                        height: LEAF_H,
                        position: 'relative',
                      }}
                    >
                      {leafCards(leaf.step, index)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 移动端：导图横向信息少，降级为按分支分组的列表 */}
      <div className="mm-mobile">
        {branches.map((branch) => (
          <div className="mm-mobile-branch" key={branch.label}>
            <p className="mm-mobile-label">
              {branch.label}
              <span className="mono">{branch.steps.length}</span>
            </p>
            {branch.steps.map((step, index) => (
              <button
                key={step.entry.id}
                type="button"
                className="mm-mobile-row"
                style={{ borderLeftColor: categoryColor(primaryCategory(step.entry.categories)) }}
                onClick={() => onSelect(step.entry)}
              >
                <span className="mm-mobile-year mono">{yearOf(step.entry.date)}</span>
                <span className="mm-mobile-title">
                  {index === 0 && branch.steps.length > 1 ? <span className="mm-mobile-new">最新</span> : null}
                  {shortTitle(step.entry)}
                </span>
                <ImportanceBadge value={step.entry.importance} />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
