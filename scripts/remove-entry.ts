import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { ENTRIES_DIR, ROOT } from './lib/load-entries';

const archiveDir = path.join(ROOT, 'data', 'archive');

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const skipConfirm = args.includes('--yes');
  let id = args.find((arg) => !arg.startsWith('--'));

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    if (!id) {
      console.log('\n现有条目：');
      const files = fs
        .readdirSync(ENTRIES_DIR)
        .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
        .sort();
      for (const file of files) console.log(`  · ${file.replace(/\.md$/, '')}`);
      id = (await rl.question('\n要删除/归档的条目 id：')).trim();
    }
    if (!id) throw new Error('未指定 id');

    const source = path.join(ENTRIES_DIR, `${id}.md`);
    if (!fs.existsSync(source)) throw new Error(`条目不存在：data/entries/${id}.md`);

    if (!skipConfirm) {
      const answer = (await rl.question(`确认归档 ${id} ？（移到 data/archive/，可随时恢复；y/N）`)).trim();
      if (!answer.toLowerCase().startsWith('y')) {
        console.log('已取消');
        return;
      }
    }

    fs.mkdirSync(archiveDir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    const dest = path.join(archiveDir, `${id}-${stamp}.md`);
    fs.renameSync(source, dest);

    console.log(`\n✓ 已归档：${path.relative(process.cwd(), dest)}`);
    console.log('下一步：npm run validate && npm run data:build\n');
  } finally {
    rl.close();
  }
}

main().catch((error: unknown) => {
  console.error(`\n✗ ${(error as Error).message}\n`);
  process.exitCode = 1;
});
