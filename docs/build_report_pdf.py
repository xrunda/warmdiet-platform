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
MD_PATH = DIR / "金鹏科技论坛-三餐管家-研究报告.md"
MD_FOR_PDF = DIR / "_report_for_pdf.md"

# 中文数字 -> 阿拉伯数字（仅处理章节）
MAP = {"一": "1", "二": "2", "三": "3", "四": "4", "五": "5", "六": "6", "七": "7", "八": "8", "九": "9", "十": "10"}
def replace_heading(m):
    pre, rest = m.group(1), m.group(2).strip()
    if pre in MAP:
        return f"\n## {MAP[pre]}. {rest}\n"
    return m.group(0)

def create_cover_page():
    """创建封面页HTML"""
    return """
    <div class="cover-page">
        <h1>帮奶奶"管住嘴、记性好"</h1>
        <div class="subtitle">——我和爸爸开发的"三餐管家"：用AI帮奶奶管理术后饮食和吃药</div>
        <div class="author">作者：李思慧</div>
        <div class="school-info">学校：海淀实验二小 五年级</div>
        <div class="info">辅导老师：xxx、xxx</div>
        <div class="info">技术协助（爸爸）：李光</div>
        <div class="date-info">完成时间：2025年12月</div>
    </div>
    <div style="page-break-after: always;"></div>
    """

def main():
    if not MD_PATH.exists():
        print(f"找不到 {MD_PATH}")
        return 1

    text = MD_PATH.read_text(encoding="utf-8")
    # ## 一、 标题 -> ## 1. 标题（便于后续若用带目录的转换器）
    text = re.sub(r"\n## ([一二三四五六七八九十]+)、\s*(.+?)\n", replace_heading, text)
    
    # 添加封面页和结构化内容
    cover_page = create_cover_page()
    
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
    {cover_page}
    {html_body}
</body>
</html>"""

    out_pdf = DIR / "金鹏科技论坛-三餐管家-研究报告.pdf"
    # base_url 设为 docs 目录，这样 md/IMG_xxx 会解析为 docs/md/IMG_xxx
    HTML(string=full, base_url=str(DIR)).write_pdf(str(out_pdf), stylesheets=stylesheets)
    print("已生成 PDF:", out_pdf)
    MD_FOR_PDF.unlink(missing_ok=True)
    return 0

if __name__ == "__main__":
    sys.exit(main())
