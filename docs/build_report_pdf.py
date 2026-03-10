#!/usr/bin/env python3
"""
将 金鹏科技论坛-三餐管家-研究报告.md 转为带目录的精美 PDF。
使用外部 CSS 样式文件并改进功能，包括更好的中文支持和图片处理。
依赖：pip install markdown2 weasyprint
"""
import re
import os
import sys
from pathlib import Path

DIR = Path(__file__).resolve().parent
DEFAULT_MD_PATH = DIR / "金鹏科技论坛-三餐管家-研究报告.md"
MD_FOR_PDF = DIR / "_report_for_pdf.md"

# 中文数字 -> 阿拉伯数字（仅处理章节）
MAP = {"一": "1", "二": "2", "三": "3", "四": "4", "五": "5", "六": "6", "七": "7", "八": "8", "九": "9", "十": "10"}
def replace_heading(m):
    pre, rest = m.group(1), m.group(2).strip()
    if pre in MAP:
        return f"\n## {MAP[pre]}. {rest}\n"
    return m.group(0)

def extract_meta(text: str):
    def pick(pattern, default=""):
        m = re.search(pattern, text, flags=re.MULTILINE)
        return m.group(1).strip() if m else default

    title = pick(r"^#\s+(.+)$", "研究报告")
    subtitle = pick(r"^##\s+(.+)$", "")
    project_name = pick(r"\*\*项目名称：\*\*\s*(.+)$", "三餐管家")
    group = pick(r"\*\*组别：\*\*\s*(.+)$", "小学高")
    category = pick(r"\*\*项目类别：\*\*\s*(.+)$", "社会科学")

    return {
        "title": title,
        "subtitle": subtitle,
        "project_name": project_name,
        "group": group,
        "category": category,
    }


def main():
    md_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_MD_PATH

    if not md_path.exists():
        print(f"找不到 {md_path}")
        return 1

    text = md_path.read_text(encoding="utf-8")
    # ## 一、 标题 -> ## 1. 标题（便于后续若用带目录的转换器）
    text = re.sub(r"\n## ([一二三四五六七八九十]+)、\s*(.+?)\n", replace_heading, text)
    
    # 处理文档内容，确保中文正确显示
    MD_FOR_PDF.write_text(text, encoding="utf-8")
    print("已生成", MD_FOR_PDF.name)

    # 使用 weasyprint 直接转 HTML -> PDF，便于设置 base_url
    try:
        import markdown2
        from weasyprint import HTML, CSS
    except ImportError:
        print("请安装: pip install markdown2 weasyprint")
        return 1

    html_body = markdown2.markdown(
        text,
        extras=["fenced-code-blocks", "tables", "break-on-newline", "code-friendly", "strike", "task_list", "cuddled-lists"],
    )
    
    # 读取外部CSS样式
    css_path = DIR / "pdf-style.css"
    if css_path.exists():
        custom_css = CSS(filename=css_path)
        stylesheets = [custom_css]
    else:
        # 默认样式
        style = """
        @page { size: A4; margin: 2cm; }
        body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 11pt; line-height: 1.75; color: #1a1a1a; }
        h1 { font-size: 22pt; margin: 1em 0 0.5em; }
        h2 { font-size: 14pt; margin: 1.2em 0 0.5em; color: #2c5282; page-break-after: avoid; }
        h3 { font-size: 12pt; margin: 0.8em 0 0.4em; page-break-after: avoid; }
        p { margin: 0.4em 0; text-align: justify; }
        img { max-width: 100%; height: auto; border-radius: 6px; margin: 0.5em 0; }
        table { width: 100%; border-collapse: collapse; margin: 0.8em 0; font-size: 10pt; }
        th, td { border: 1px solid #e2e8f0; padding: 6px 8px; }
        th { background: #f7fafc; }
        strong { font-weight: 600; }
        """
        stylesheets = [CSS(string=style)]
    
    full = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Diet Management Research Report</title>
</head>
<body>
    {html_body}
</body>
</html>"""

    if len(sys.argv) > 2:
        out_pdf = Path(sys.argv[2]).resolve()
    else:
        out_pdf = DIR / f"{md_path.stem}.pdf"

    # base_url 设为当前 Markdown 所在目录，兼容 docs/ 与 docs/0309/ 下的相对图片路径
    HTML(string=full, base_url=str(md_path.parent)).write_pdf(str(out_pdf), stylesheets=stylesheets)
    print("已生成 PDF:", out_pdf)
    MD_FOR_PDF.unlink(missing_ok=True)
    return 0

if __name__ == "__main__":
    sys.exit(main())
