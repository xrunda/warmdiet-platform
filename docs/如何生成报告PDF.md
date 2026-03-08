# 如何生成「金鹏科技论坛-三餐管家-研究报告」PDF

## 方法一：用浏览器打印为 PDF（推荐）

1. **生成 HTML**
   ```bash
   npm run report:html
   ```
   或直接运行：
   ```bash
   node docs/md-to-html-report.cjs
   ```

2. **用浏览器打开**
   - 打开 `docs/金鹏科技论坛-三餐管家-研究报告.html`（双击或用 Chrome / Edge / Safari 打开）。
   - 图片路径为相对路径 `md/xxx`，请确保从 **`docs` 目录所在位置** 打开该 HTML（不要移动 HTML 与 `md` 文件夹的相对关系）。

3. **另存为 PDF**
   - **Mac**：按 `Cmd + P`，目标选择「另存为 PDF」。
   - **Windows**：按 `Ctrl + P`，目标选择「另存为 PDF」或「Microsoft Print to PDF」。
   - 建议勾选「背景图形」以便保留样式。

生成的 PDF 会保留封面、标题、正文和图片的排版。

---

## 方法二：用 Python + WeasyPrint 直接生成 PDF

若已安装 Python 和 WeasyPrint，可用项目中的脚本直接生成 PDF：

```bash
pip3 install markdown2 weasyprint
cd docs
python3 build_report_pdf.py
```

会生成 `docs/金鹏科技论坛-三餐管家-研究报告.pdf`。图片通过 `base_url` 解析为 `docs/md/` 下的文件。

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `金鹏科技论坛-三餐管家-研究报告.md` | 报告正文（Markdown） |
| `md-to-html-report.cjs` | 将 MD 转为单页 HTML 的脚本 |
| `金鹏科技论坛-三餐管家-研究报告.html` | 运行脚本后生成的 HTML（用于打印为 PDF） |
| `pdf-style.css` | 可选：若用其他工具转 PDF，可参考的样式 |
| `build_report_pdf.py` | 可选：Python + WeasyPrint 直接出 PDF 的脚本 |
