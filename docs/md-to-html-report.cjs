#!/usr/bin/env node
/**
 * 将 金鹏科技论坛-三餐管家-研究报告.md 转为精美单页 HTML，便于浏览器打开后“打印 → 另存为 PDF”。
 * 运行：node docs/md-to-html-report.cjs
 * 然后打开 docs/金鹏科技论坛-三餐管家-研究报告.html，按 Cmd+P（Mac）或 Ctrl+P（Win）→ 另存为 PDF。
 */
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname);
const mdPath = path.join(docsDir, '金鹏科技论坛-三餐管家-研究报告.md');
const outPath = path.join(docsDir, '金鹏科技论坛-三餐管家-研究报告.html');

let md = fs.readFileSync(mdPath, 'utf-8');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function md2html(text) {
  let html = '';
  const lines = text.split(/\r?\n/);
  let i = 0;
  const next = () => lines[i++];

  while (i < lines.length) {
    let line = next();
    if (line === '') {
      html += '\n';
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      html += '<hr>\n';
      continue;
    }
    const imgMatch = line.match(/^!\[([^\]]*)\]\((([^)]+))\)\s*$/);
    if (imgMatch) {
      html += `<figure><img src="${esc(imgMatch[2])}" alt="${esc(imgMatch[1])}" loading="lazy"></figure>\n`;
      continue;
    }
    if (line.startsWith('# ')) {
      html += `<h1>${esc(line.slice(2))}</h1>\n`;
      continue;
    }
    if (line.startsWith('## ')) {
      html += `<h2>${esc(line.slice(3))}</h2>\n`;
      continue;
    }
    if (line.startsWith('### ')) {
      html += `<h3>${esc(line.slice(4))}</h3>\n`;
      continue;
    }
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      const tag = /^[\s:-]+$/.test(cells[0]) ? 'th' : 'td';
      const cellHtml = (c) => {
        let s = c.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => '<img src="' + esc(url) + '" alt="' + esc(alt) + '">');
        return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      };
      html += '<tr>' + cells.map(c => `<${tag}>${cellHtml(c)}</${tag}>`).join('') + '</tr>\n';
      continue;
    }
    if (line.match(/^[-*]\s+/)) {
      const content = line.replace(/^[-*]\s+/, '');
      html += `<li>${content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>\n`;
      continue;
    }
    const para = line;
    html += `<p>${para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>\n`;
  }
  // 对段落内的非标签内容做 HTML 转义（保护已有 <strong> 等标签）
  html = html.replace(/<p>([\s\S]*?)<\/p>/g, (_, inner) => {
    const escaped = inner
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/&lt;(\/?)strong&gt;/g, '<$1strong>');
    return '<p>' + escaped + '</p>';
  });

  html = html.replace(/(<tr>[\s\S]*?<\/tr>\n)+/g, (m) => '<table class="app-table">' + m + '</table>\n');
  html = html.replace(/(<li>[\s\S]*?<\/li>\n)+/g, (m) => '<ul>' + m + '</ul>\n');

  return html;
}

const metaEnd = md.indexOf('\n---\n');
const bodyStart = metaEnd >= 0 ? metaEnd + 5 : 0;
const body = md.slice(bodyStart);
const bodyHtml = md2html(body);

const title = '金鹏科技论坛 · 三餐管家 · 研究报告';
const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      font-size: 11pt;
      line-height: 1.78;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 2.5rem 3rem;
      background: #fff;
    }
    @media print {
      body { padding: 1.2rem 1.8rem; font-size: 10.5pt; }
      .no-print { display: none; }
      h2 { page-break-after: avoid; }
      figure, table { page-break-inside: avoid; }
    }
    .cover {
      text-align: center;
      padding: 3rem 0 2rem;
      border-bottom: 2px solid #2c5282;
      margin-bottom: 2rem;
    }
    .cover h1 {
      font-family: 'Noto Serif SC', serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.4rem;
    }
    .cover .subtitle {
      font-size: 1rem;
      color: #4a5568;
      margin-bottom: 1.2rem;
    }
    .cover .meta {
      font-size: 0.9rem;
      color: #718096;
      line-height: 1.8;
    }
    h1 { font-size: 1.35rem; margin: 1.8rem 0 0.6rem; color: #1a1a1a; }
    h2 {
      font-size: 1.15rem;
      font-weight: 600;
      color: #2c5282;
      margin: 1.5rem 0 0.5rem;
      padding-bottom: 0.2rem;
    }
    h3 { font-size: 1.05rem; margin: 1rem 0 0.4rem; color: #2d3748; }
    p { margin: 0.45rem 0; text-align: justify; }
    figure { margin: 0.6rem 0; text-align: center; }
    figure img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .inline-img { max-width: 100%; height: auto; border-radius: 6px; vertical-align: middle; }
    table.app-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.8rem 0;
      font-size: 10pt;
    }
    table.app-table td, table.app-table th {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      text-align: center;
      vertical-align: middle;
    }
    table.app-table th { background: #f7fafc; font-weight: 600; }
    table.app-table img { max-width: 160px; }
    ul { margin: 0.5rem 0 0.8rem 1.2rem; }
    li { margin: 0.2rem 0; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.2rem 0; }
    strong { font-weight: 600; color: #1a1a1a; }
    .print-hint {
      position: fixed;
      top: 12px;
      right: 12px;
      background: #2c5282;
      color: #fff;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 9999;
    }
  </style>
</head>
<body>
  <p class="print-hint no-print">打印为 PDF：<kbd>Cmd+P</kbd>（Mac）或 <kbd>Ctrl+P</kbd>（Win）→ 目标选「另存为 PDF」</p>
  <div class="cover">
    <h1>帮奶奶“管住嘴、记性好”</h1>
    <p class="subtitle">——我和爸爸开发的「三餐管家」：用AI帮奶奶管理术后饮食和吃药</p>
    <div class="meta">
      <strong>作者：</strong>李思慧 &nbsp;|&nbsp; <strong>学校：</strong>海淀实验二小 &nbsp;|&nbsp; <strong>年级：</strong>五年级<br>
      <strong>辅导老师：</strong>xxx、xxx &nbsp;|&nbsp; <strong>技术协助（爸爸）：</strong>李光 &nbsp;|&nbsp; <strong>完成时间：</strong>2025年12月
    </div>
  </div>
  <main>
${bodyHtml}
  </main>
</body>
</html>`;

fs.writeFileSync(outPath, fullHtml, 'utf-8');
console.log('已生成:', outPath);
console.log('用浏览器打开该 HTML 文件，按 Cmd+P（Mac）或 Ctrl+P（Win），选择「另存为 PDF」即可。');
