import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(join(process.cwd(), 'package.json'));
const isFixMode = process.argv.includes('--fix');
const IGNORED_PATHS = /(^|\/)(node_modules|public|out|\.next)\//;

function listCssFiles() {
  const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.css'], {
    encoding: 'utf8',
  });
  return output.split('\n').filter((file) => file && !IGNORED_PATHS.test(file));
}

function stripComments(postcss, cssText) {
  const root = postcss.parse(cssText);
  let commentCount = 0;
  root.walkComments((comment) => {
    commentCount += 1;
    comment.remove();
  });
  root.walk((node) => {
    const rawValue = node.raws && node.raws.value;
    if (rawValue && rawValue.raw !== rawValue.value) {
      commentCount += 1;
      delete node.raws.value;
    }
    const rawSelector = node.raws && node.raws.selector;
    if (rawSelector && rawSelector.raw !== rawSelector.value) {
      commentCount += 1;
      delete node.raws.selector;
    }
    const rawParams = node.raws && node.raws.params;
    if (!(rawParams && rawParams.raw !== rawParams.value)) return;
    commentCount += 1;
    delete node.raws.params;
  });
  return { text: root.toString(), commentCount };
}

const cssFiles = listCssFiles();
const postcss = cssFiles.length ? require('postcss') : null;
const results = cssFiles.map((file) => {
  const original = readFileSync(file, 'utf8');
  const { text, commentCount } = stripComments(postcss, original);
  if (isFixMode && commentCount) writeFileSync(file, text);
  return { file, commentCount };
});
const withComments = results.filter((result) => result.commentCount);
withComments.forEach((result) => console.log(`${result.file}: ${result.commentCount} comment(s)`));
const total = withComments.reduce((sum, result) => sum + result.commentCount, 0);
console.log(`${isFixMode ? 'removed' : 'found'} ${total} CSS comment(s) in ${withComments.length} file(s)`);
if (!isFixMode && total) process.exit(1);
