// VibeCoding — PostToolUse: 前端格式化
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
const file = input?.tool_input?.file_path || '';

try {
  if (file.match(/\.(ts|tsx|js|jsx|vue)$/)) {
    // oxlint (Rust 工具，快速 lint)
    if (fs.existsSync('node_modules/.bin/oxlint')) {
      execSync(`npx oxlint --fix "${file}"`, { timeout: 3000 });
    }
    // eslint (详细检查)
    if (fs.existsSync('node_modules/.bin/eslint')) {
      execSync(`npx eslint --fix "${file}"`, { timeout: 5000 });
    }
    // oxfmt (Rust 工具，快速格式化)
    if (fs.existsSync('node_modules/.bin/oxfmt')) {
      execSync(`npx oxfmt "${file}"`, { timeout: 3000 });
    }
  }
} catch {}
process.exit(0);