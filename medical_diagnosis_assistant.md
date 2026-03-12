#!/usr/bin/env python3
"""
医疗诊断辅助系统
支持多模态数据分析，多模型诊疗建议，会诊汇总
"""

import os
import json
import base64
import requests
import time
from typing import List, Dict, Any, Optional
from pathlib import Path


class MedicalDiagnosisAssistant:
    """医疗诊断辅助系统"""

    # 开放式诊疗分析prompt - 让各模型自由发挥
    DIAGNOSIS_PROMPT_TEMPLATE = """你是一位资深医学专家，拥有丰富的临床经验。请基于以下患者检查数据，进行全面、专业的诊疗分析。

【患者数据】
{patient_data}

请充分发挥你的专业能力，对这份检查报告进行深入分析：
- 对异常指标进行专业解读
- 分析可能的临床问题
- 给出诊疗建议

根据数据特点自由调整输出重点，不需要按固定格式，可以充分发挥你的专业水平。"""

    def __init__(self, api_key: str, backup_api_key: str = None):
        self.api_key = api_key
        self.backup_api_key = backup_api_key
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.models = {
            "gemini": "google/gemini-3.1-pro-preview",
            "deepseek": "deepseek/deepseek-v3.2",
            "kimi": "moonshotai/kimi-k2.5",
            "minimax": "minimax/minimax-m2.5"
        }
        # OCR专用模型列表（按实际成功率排序）
        self.ocr_models = [
            "qwen/qwen3-vl-32b-instruct",       # Qwen视觉语言模型（实际测试成功率100%）
            "nvidia/nemotron-nano-12b-v2-vl",  # NVIDIA的OCR专用模型（成功率70%）
            "qwen/qwen3-vl-8b-instruct",        # Qwen轻量级视觉语言模型
            "z-ai/glm-4.5v",                    # GLM视觉语言模型
            "google/gemini-3.1-pro-preview"     # 默认备用模型
        ]
        # 当前使用的API key索引
        self.current_key_index = 0
        self.api_keys = [self.api_key]
        if self.backup_api_key:
            self.api_keys.append(self.backup_api_key)

    def _encode_image(self, image_path: str) -> str:
        """编码图片为 base64"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def _read_text_file(self, file_path: str) -> str:
        """读取文本文件"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def _read_csv_file(self, file_path: str) -> str:
        """读取 CSV 文件"""
        import csv
        result = []
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                result.append(','.join(row))
        return '\n'.join(result)

    def _call_model(self, model: str, messages: List[Dict], temperature: float = 0.7, max_retries: int = 3, max_tokens: int = 4000) -> str:
        """调用 OpenRouter 模型（带重试机制和API key切换）"""
        data = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        # 遍历所有可用的API key
        for key_index, current_key in enumerate(self.api_keys):
            self.current_key_index = key_index

            headers = {
                "Authorization": f"Bearer {current_key}",
                "Content-Type": "application/json"
            }

            if len(self.api_keys) > 1:
                key_name = f"API Key {key_index + 1}/{len(self.api_keys)}"
            else:
                key_name = "API Key"

            for attempt in range(max_retries):
                try:
                    response = requests.post(self.base_url, headers=headers, json=data)

                    # 处理429速率限制错误
                    if response.status_code == 429:
                        retry_after = response.headers.get('Retry-After', 5)
                        wait_time = int(retry_after) + 2  # 额外等待2秒

                        # 如果这是最后一个API key的最后一次重试，切换到下一个key
                        if attempt == max_retries - 1 and key_index < len(self.api_keys) - 1:
                            print(f"  ⚠ {key_name} 速率限制，切换到备用API Key...")
                            break  # 跳出内层循环，尝试下一个API key

                        print(f"  ⚠ {key_name} 速率限制，等待{wait_time}秒后重试 ({attempt + 1}/{max_retries})...")
                        time.sleep(wait_time)
                        continue

                    response.raise_for_status()
                    result = response.json()
                    return result['choices'][0]['message']['content']

                except requests.exceptions.HTTPError as e:
                    if e.response.status_code == 429 and attempt < max_retries - 1:
                        continue
                    return f"模型调用失败: HTTP {e.response.status_code} - {str(e)}"
                except Exception as e:
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    return f"模型调用失败: {str(e)}"

        return f"模型调用失败: 所有API Key都超过最大重试次数 ({max_retries}次)"

    def _extract_image_with_ocr_retry(self, image_path: str, max_retries: int = 5) -> tuple[str, bool]:
        """
        使用OCR模型提取图片内容，支持重试机制和缓存

        Args:
            image_path: 图片文件路径
            max_retries: 最大重试次数

        Returns:
            (提取的内容, 是否成功)
        """
        from pathlib import Path

        image_file = Path(image_path)
        cache_file = image_file.with_suffix('.md')

        # 检查是否存在缓存的OCR结果
        if cache_file.exists():
            print(f"  [缓存] 发现已有OCR结果文件: {cache_file.name}")
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    cached_content = f.read()
                print(f"  ✓ 使用缓存的OCR结果")
                return cached_content, True
            except Exception as e:
                print(f"  ⚠ 读取缓存文件失败: {str(e)}")
                # 继续执行OCR流程

        # 执行OCR识别
        image_base64 = self._encode_image(image_path)

        for attempt, model in enumerate(self.ocr_models[:max_retries], 1):
            print(f"  [尝试 {attempt}/{max_retries}] 使用模型 {model} 进行OCR识别...")

            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """请完整、准确地提取这张图片中的所有可见内容。只做内容识别和记录，不要进行分析、诊断或建议。

请提取以下内容：
1. 所有文字内容（包括数字、标签、单位、说明文字等）
2. 图表、表格中的所有数据
3. 图像中的所有标注和标记
4. 检查结果和数值
5. 任何其他可见的信息

要求：
- 只描述图片中实际显示的内容
- 不要添加任何分析、解读或判断
- 不要给出诊断建议或医学意见
- 完整记录所有可见信息，不要遗漏"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ]

            try:
                result = self._call_model(model, messages, temperature=0.3)

                # 检查是否成功（简单的判断：结果不为空且不包含"失败"关键词）
                if result and "失败" not in result and len(result) > 50:
                    print(f"  ✓ OCR识别成功（模型: {model}）")

                    # 保存OCR结果到缓存文件
                    try:
                        with open(cache_file, 'w', encoding='utf-8') as f:
                            f.write(result)
                        print(f"  ✓ OCR结果已缓存到: {cache_file.name}")
                    except Exception as e:
                        print(f"  ⚠ 保存缓存文件失败: {str(e)}")

                    return result, True
                else:
                    print(f"  ✗ OCR识别结果不理想，尝试下一个模型...")
            except Exception as e:
                print(f"  ✗ 模型调用异常: {str(e)[:100]}")
                continue

        # 所有尝试都失败
        print(f"  ✗ 所有{max_retries}次OCR识别尝试均失败")
        return f"[警告] 图片 {image_path} 的OCR识别失败，已跳过该图片", False

    def extract_multimodal_content(self, files: List[str]) -> str:
        """提取多模态数据内容"""
        extracted_content = []
        extracted_content.append("=== 患者数据提取结果 ===\n")

        for file_path in files:
            file_path = Path(file_path)
            if not file_path.exists():
                extracted_content.append(f"文件不存在: {file_path}")
                continue

            extracted_content.append(f"\n--- 文件: {file_path.name} ---")

            # 处理图片文件
            if file_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
                print(f"\n处理图片文件: {file_path.name}")
                extracted_content.append("图片文件，使用OCR识别...")
                # 使用OCR重试机制提取图片内容
                description, success = self._extract_image_with_ocr_retry(str(file_path))
                extracted_content.append(description)

            # 处理文本文件
            elif file_path.suffix.lower() in ['.txt', '.md']:
                print(f"处理文本文件: {file_path.name}")
                content = self._read_text_file(str(file_path))
                extracted_content.append(f"文本内容:\n{content}")

            # 处理 CSV 文件
            elif file_path.suffix.lower() == '.csv':
                print(f"处理CSV文件: {file_path.name}")
                content = self._read_csv_file(str(file_path))
                extracted_content.append(f"数据表格:\n{content}")

            # 处理 Word 文档
            elif file_path.suffix.lower() == '.docx':
                print(f"处理Word文档: {file_path.name}")
                extracted_content.append("Word 文档，需要提取内容...")

            else:
                print(f"不支持的文件类型: {file_path.suffix}")
                extracted_content.append(f"不支持的文件类型: {file_path.suffix}")

        return '\n'.join(extracted_content)

    def analyze_with_single_model(self, model_name: str, patient_data: str) -> Dict[str, str]:
        """使用单个模型分析患者数据，返回原始诊疗意见（自由格式）"""
        model_id = self.models.get(model_name)
        if not model_id:
            return {"error": f"未找到模型: {model_name}"}

        # 直接传递完整患者数据，不做拆分
        diagnosis_prompt = self.DIAGNOSIS_PROMPT_TEMPLATE.format(
            patient_data=patient_data
        )

        messages = [
            {
                "role": "user",
                "content": diagnosis_prompt
            }
        ]

        result = self._call_model(model_id, messages, temperature=0.5)

        # 直接返回原始结果，不做结构化解析
        return {"诊疗意见": result}

    def _extract_patient_info(self, patient_data: str) -> str:
        """从患者数据中提取患者信息部分"""
        # 尝试提取患者基本信息（姓名、年龄、性别等）
        lines = patient_data.split('\n')
        patient_info_lines = []
        in_patient_info = False

        keywords = ['患者', '姓名', '年龄', '性别', '男', '女', '病史', '主诉', '现病史']

        for line in lines:
            # 检查是否是患者信息部分
            if '患者信息' in line or '患者资料' in line:
                in_patient_info = True
                continue
            # 检查是否到达下一个主要部分
            if in_patient_info and ('临床发现' in line or '检查结果' in line or '诊断' in line):
                break

            if in_patient_info:
                patient_info_lines.append(line)

        if patient_info_lines:
            return '\n'.join(patient_info_lines[:20])  # 限制长度

        # 如果没有找到明确的患者信息部分，尝试从开头提取
        return '\n'.join(lines[:15])

    def _extract_clinical_findings(self, patient_data: str) -> str:
        """从患者数据中提取临床发现部分"""
        lines = patient_data.split('\n')
        clinical_lines = []
        in_clinical = False

        for line in lines:
            # 检查是否是临床发现部分
            if any(keyword in line for keyword in ['临床发现', '检查结果', '化验结果', '影像学', '检查报告']):
                in_clinical = True
                clinical_lines.append(line)
                continue

            if in_clinical:
                # 检查是否到达下一个主要部分
                if '诊断' in line or '建议' in line or '分析' in line:
                    break
                clinical_lines.append(line)

        if clinical_lines:
            return '\n'.join(clinical_lines[:50])  # 限制长度

        # 如果没有找到明确的临床发现部分，返回原始数据的主要内容
        return '\n'.join(lines[15:50])

    def _parse_diagnosis_result(self, result: str) -> Dict[str, str]:
        """解析诊疗结果，提取各个分析部分"""
        parsed = {
            "智能解读分析": "",
            "临床初步建议": "",
            "后续诊疗建议": ""
        }

        current_section = None
        section_content = []

        lines = result.split('\n')
        for line in lines:
            # 检测章节标题
            lower_line = line.lower()
            if '智能解读' in line or '解读分析' in line:
                if current_section and section_content:
                    parsed[current_section] = '\n'.join(section_content).strip()
                current_section = "智能解读分析"
                section_content = []
            elif '初步建议' in line or '临床建议' in line:
                if current_section and section_content:
                    parsed[current_section] = '\n'.join(section_content).strip()
                current_section = "临床初步建议"
                section_content = []
            elif '后续' in line or '诊疗建议' in line or '进一步' in line:
                if current_section and section_content:
                    parsed[current_section] = '\n'.join(section_content).strip()
                current_section = "后续诊疗建议"
                section_content = []
            else:
                if current_section:
                    section_content.append(line)

        # 保存最后一个部分
        if current_section and section_content:
            parsed[current_section] = '\n'.join(section_content).strip()

        # 如果解析失败，使用整个结果作为智能解读分析
        if not parsed["智能解读分析"]:
            parsed["智能解读分析"] = result

        return parsed

    def analyze_with_all_models(self, patient_data: str, output_dir: str = None) -> Dict[str, Dict[str, str]]:
        """使用所有指定模型进行分析，返回结构化结果并保存每个模型的md文件"""
        results = {}
        print("开始多模型分析...\n")

        model_order = ['gemini', 'deepseek', 'kimi', 'minimax']

        for i, model_name in enumerate(model_order):
            actual_model_id = self.models.get(model_name, model_name)
            print(f"正在使用 {model_name.upper()} 模型分析 (实际模型: {actual_model_id})...")
            result = self.analyze_with_single_model(model_name, patient_data)
            results[model_name] = result

            # 保存单个模型的诊疗报告到md文件
            if output_dir:
                self.save_single_model_report(model_name, result, output_dir)

            print(f"{model_name.upper()} 模型分析完成")

            # 在模型调用之间添加延迟，避免触发速率限制
            if i < len(model_order) - 1:
                print("等待3秒后继续下一个模型...")
                time.sleep(3)

            print()

        return results

    def save_single_model_report(self, model_name: str, diagnosis_result: Dict[str, str], output_dir: str):
        """保存单个模型的诊疗报告到md文件"""
        from datetime import datetime

        # 生成带模型名称和时间的文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_display_name = model_name.upper()
        output_file = os.path.join(output_dir, f"诊疗报告_{model_display_name}_{timestamp}.md")

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# {model_display_name} 模型诊疗报告\n\n")
            f.write(f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("---\n\n")

            # 自由格式的诊疗意见
            f.write("## 诊疗意见\n\n")
            f.write(diagnosis_result.get('诊疗意见', '无') + "\n\n")

        print(f"  ✓ {model_display_name} 模型报告已保存: {os.path.basename(output_file)}")

    def _read_model_report(self, model_name: str, output_dir: str) -> str:
        """读取指定模型的最新诊疗报告"""
        import glob

        model_display_name = model_name.upper()
        pattern = os.path.join(output_dir, f"诊疗报告_{model_display_name}_*.md")

        # 查找最新的报告文件
        files = glob.glob(pattern)
        if not files:
            return f"未找到 {model_display_name} 模型的诊疗报告"

        # 按修改时间排序，取最新的
        latest_file = max(files, key=os.path.getmtime)

        with open(latest_file, 'r', encoding='utf-8') as f:
            return f.read()

    def conduct_consultation(self, output_dir: str = None, model_reports: Dict[str, Dict[str, str]] = None) -> str:
        """进行会诊分析，汇总各模型结果"""
        print("在会诊汇总前等待5秒，避免触发API速率限制...")
        time.sleep(5)

        # 如果没有传入model_reports，尝试从文件读取
        if model_reports is None and output_dir:
            model_reports = {}
            for model_name in ['gemini', 'deepseek', 'kimi', 'minimax']:
                model_reports[model_name] = {
                    '诊疗意见': self._read_model_report(model_name, output_dir)
                }

        # 构建会诊prompt
        consultation_prompt = f"""你是一位主任医师，需要对多位AI专家的诊疗意见进行会诊汇总。

【重要】以下各模型输出是自由格式的诊疗意见，你需要从中提取关键信息，进行综合分析。

【Gemini 诊疗意见】
{model_reports.get('gemini', {}).get('诊疗意见', '无')}

【DeepSeek 诊疗意见】
{model_reports.get('deepseek', {}).get('诊疗意见', '无')}

【Kimi 诊疗意见】
{model_reports.get('kimi', {}).get('诊疗意见', '无')}

【MiniMax 诊疗意见】
{model_reports.get('minimax', {}).get('诊疗意见', '无')}

请从以上自由格式的诊疗意见中提取关键信息，强制输出以下7个固定板块：

## 1. 共识分析
从各模型诊疗意见中，提取一致的、共识性的结论和建议

## 2. 差异分析
分析各模型诊疗结果中的差异点，并给出可能的解释

## 3. 综合诊断
整合所有信息，给出最终的综合性诊断判断

## 4. 诊疗建议
具体的治疗方案、进一步检查建议

## 5. 后续就诊方向
建议就诊科室、随访安排等

## 6. 风险评估
潜在的医疗风险和需要重点关注的问题

## 7. 随诊建议
从各模型诊疗意见中提取随诊相关内容，包括：
- 随访时间安排（如术后1个月、3个月、6个月复查等）
- 复诊需要做的检查项目
- 康复期注意事项
- 日常生活指导
- 需要紧急就医的情况
- 其他随诊注意事项

每个板块都必须有实质性内容，禁止跳过任何板块。"""

        messages = [
            {
                "role": "user",
                "content": consultation_prompt
            }
        ]

        return self._call_model(self.models['gemini'], messages, temperature=0.4, max_retries=5, max_tokens=8000)

    def _get_model_display_name(self, model_name: str) -> str:
        """获取模型的显示名称"""
        display_names = {
            'gemini': 'Gemini',
            'deepseek': 'DeepSeek',
            'kimi': 'Kimi',
            'minimax': 'MiniMax'
        }
        return display_names.get(model_name, model_name.upper())

    def _format_model_report_for_consultation(self, report: Dict[str, str]) -> str:
        """格式化模型报告用于会诊"""
        if not report or report.get('error'):
            return "无报告内容"

        formatted = []
        formatted.append("【智能解读分析】")
        formatted.append(report.get('智能解读分析', '无')[:1500])  # 限制长度

        formatted.append("\n【临床初步建议】")
        formatted.append(report.get('临床初步建议', '无')[:800])

        formatted.append("\n【后续诊疗建议】")
        formatted.append(report.get('后续诊疗建议', '无')[:800])

        return '\n'.join(formatted)

    def full_diagnosis_process(self, files: List[str], output_dir: str = None, generate_html: bool = True) -> Dict[str, Any]:
        """
        完整的诊断流程

        Args:
            files: 文件路径列表
            output_dir: 输出目录
            generate_html: 是否生成HTML报告

        Returns:
            诊断结果字典
        """
        print("=" * 60)
        print("医疗诊断辅助系统启动")
        print("=" * 60)

        # 如果没有指定输出目录，使用第一个文件所在的目录
        if output_dir is None and files:
            first_file = Path(files[0])
            output_dir = str(first_file.parent)

        print(f"\n报告输出目录: {output_dir}")

        # 步骤 1: 提取多模态数据
        print("\n步骤 1: 提取患者数据...")
        patient_data = self.extract_multimodal_content(files)
        print("数据提取完成\n")

        # 步骤 2: 多模型分析（每个模型保存独立的md文件）
        print("步骤 2: 多模型诊疗分析...")
        analysis_results = self.analyze_with_all_models(patient_data, output_dir)

        # 步骤 3: 会诊汇总（使用md文件）
        print("\n步骤 3: 进行会诊汇总...")
        final_consultation = self.conduct_consultation(output_dir, analysis_results)
        print("会诊汇总完成\n")

        # 步骤 4: 生成HTML报告（可选）
        html_report_url = None
        if generate_html:
            html_report_url = self.generate_html_report(final_consultation, output_dir)

        return {
            "patient_data": patient_data,
            "model_analysis": analysis_results,
            "final_consultation": final_consultation,
            "output_dir": output_dir,
            "html_report_url": html_report_url
        }

    def save_report(self, diagnosis_result: Dict[str, Any], output_dir: str = None):
        """保存诊断报告到指定目录"""
        # 如果没有指定目录，使用当前目录
        if output_dir is None:
            output_dir = diagnosis_result.get('output_dir', '.')

        # 生成带时间戳的文件名
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = os.path.join(output_dir, f"诊断报告_{timestamp}.md")

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# 医疗诊断辅助报告\n\n")
            f.write(f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("---\n\n")

            # 1. 患者数据提取结果
            f.write("## 1. 患者数据提取结果\n\n")
            f.write(diagnosis_result['patient_data'])
            f.write("\n\n")

            # 2. 各模型诊疗报告
            f.write("## 2. 各模型诊疗报告\n\n")
            f.write("> 注：各模型的详细诊疗报告已单独保存为MD文件\n\n")

            model_names = {
                'gemini': 'Gemini',
                'deepseek': 'DeepSeek',
                'kimi': 'Kimi',
                'minimax': 'MiniMax'
            }

            for model_key, model_display in model_names.items():
                analysis = diagnosis_result['model_analysis'].get(model_key, {})

                f.write(f"### {model_display} 模型诊疗报告\n\n")

                f.write("**诊疗意见**\n\n")
                f.write(analysis.get('诊疗意见', '无') + "\n\n")

                f.write("---\n\n")

            # 3. 会诊汇总
            f.write("## 3. 会诊汇总\n\n")
            f.write(diagnosis_result['final_consultation'])
            f.write("\n\n")

        print(f"\n完整报告已保存到: {output_file}")

    def generate_html_report(self, consultation_text: str, output_dir: str = None) -> Optional[str]:
        """
        调用API生成HTML格式的会诊报告

        Args:
            consultation_text: 会诊汇总文本内容
            output_dir: 输出目录，用于保存HTML报告链接

        Returns:
            HTML报告的URL，如果生成失败则返回None
        """
        import tempfile

        # API基础URL（需要/api前缀）
        api_base_url = "https://cyberai.dev.xrunda.com/api"

        # 固定参数
        user_id = "1937392131941998594"
        tenant_id = "994637"
        template_id = "10012"

        print("\n" + "=" * 60)
        print("开始生成HTML会诊报告")
        print("=" * 60)

        # 步骤1: 创建任务（使用multipart/form-data格式上传文件）
        print("\n步骤1: 提交会诊报告生成任务...")

        create_url = f"{api_base_url}/ai-consultation/create"

        # 将content写入临时md文件
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as tmp_file:
                tmp_file.write(consultation_text)
                tmp_file_path = tmp_file.name

            # 准备multipart/form-data请求
            with open(tmp_file_path, 'rb') as f:
                files = {
                    'file': ('consultation_report.md', f, 'text/markdown')
                }
                data = {
                    'title': '患者会诊报告',
                    'templateId': template_id,
                    'userId': user_id,
                    'tenantId': tenant_id
                }

                response = requests.post(
                    create_url,
                    files=files,
                    data=data,
                    timeout=30
                )

            # 清理临时文件
            try:
                os.unlink(tmp_file_path)
            except:
                pass

            if response.status_code != 200:
                print(f"  ✗ 创建任务失败: HTTP {response.status_code}")
                print(f"  响应内容: {response.text[:200]}")
                return None

            result = response.json()
            if result.get('code') != 200:
                print(f"  ✗ 创建任务失败: {result.get('msg', '未知错误')}")
                return None

            data = result.get('data', {})
            task_id = data.get('taskId')

            if not task_id:
                print("  ✗ 响应中未找到taskId")
                return None

            print(f"  ✓ 任务创建成功，taskId: {task_id}")
            print(f"  ✓ 任务状态: {data.get('status')}")

        except Exception as e:
            print(f"  ✗ 创建任务时发生异常: {str(e)}")
            return None

        # 步骤2: 轮询查询状态
        print("\n步骤2: 轮询查询任务状态...")

        max_attempts = 200  # 最多尝试200次（10分钟，每次3秒）
        poll_interval = 3  # 每次查询间隔3秒

        for attempt in range(1, max_attempts + 1):
            try:
                status_url = f"{api_base_url}/ai-consultation/status/{task_id}"
                response = requests.get(status_url, timeout=10)

                if response.status_code != 200:
                    print(f"  ⚠ 查询状态失败: HTTP {response.status_code}")
                    time.sleep(poll_interval)
                    continue

                result = response.json()
                if result.get('code') != 200:
                    print(f"  ⚠ 查询状态失败: {result.get('msg')}")
                    time.sleep(poll_interval)
                    continue

                data = result.get('data', {})
                status = data.get('status')
                progress = data.get('progress', 0)

                print(f"  [查询 {attempt}/{max_attempts}] 状态: {status}, 进度: {progress}%")

                # 检查任务状态
                if status == "SUCCEEDED":
                    result_url = data.get('resultUrl')
                    if result_url:
                        print(f"\n  ✓✓✓ 报告生成成功！")
                        print(f"  ✓ 报告URL: {result_url}")
                        print("=" * 60)

                        # 保存HTML报告URL到文件
                        if output_dir:
                            self._save_html_report_url(result_url, output_dir)

                        return result_url
                    else:
                        print(f"  ✗ 任务成功但未找到resultUrl")
                        return None

                elif status == "FAILED":
                    error_msg = data.get('errorMessage', '未知错误')
                    print(f"  ✗ 任务失败: {error_msg}")
                    return None

                elif status in ["PENDING", "PROCESSING"]:
                    # 继续等待
                    time.sleep(poll_interval)
                else:
                    print(f"  ⚠ 未知状态: {status}")
                    time.sleep(poll_interval)

            except Exception as e:
                print(f"  ⚠ 查询状态时发生异常: {str(e)}")
                time.sleep(poll_interval)
                continue

        # 超时
        print(f"  ✗ 任务超时，已尝试 {max_attempts} 次")
        print("=" * 60)
        return None

    def _save_html_report_url(self, url: str, output_dir: str):
        """
        保存HTML报告URL到文件

        Args:
            url: HTML报告URL
            output_dir: 输出目录
        """
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        url_file = os.path.join(output_dir, f"HTML报告链接_{timestamp}.txt")

        try:
            with open(url_file, 'w', encoding='utf-8') as f:
                f.write(f"# HTML会诊报告链接\n\n")
                f.write(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                f.write(f"报告链接:\n{url}\n\n")
                f.write(f"\n提示: 点击上方链接查看HTML格式的会诊报告\n")
            print(f"  ✓ HTML报告链接已保存: {os.path.basename(url_file)}")
        except Exception as e:
            print(f"  ⚠ 保存HTML报告链接失败: {str(e)}")


def get_files_from_path(path: str) -> List[str]:
    """从路径获取文件列表（支持单个文件或文件夹）"""
    path = Path(path)

    if not path.exists():
        print(f"错误: 路径不存在 - {path}")
        return []

    if path.is_file():
        # 如果是单个文件，直接返回
        return [str(path)]

    if path.is_dir():
        # 如果是文件夹，扫描所有支持的文件
        supported_ext = {'.txt', '.md', '.csv', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}

        files = []
        for file_path in path.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in supported_ext:
                files.append(str(file_path))

        # 按文件名排序
        files.sort()
        return files

    return []


def main():
    """主函数"""
    # 配置 API Key
    API_KEY = "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"
    BACKUP_API_KEY = "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"

    # 创建诊断助手（包含备用API key）
    assistant = MedicalDiagnosisAssistant(API_KEY, BACKUP_API_KEY)

    print("=" * 60)
    print("医疗诊断辅助系统")
    print("=" * 60)
    print()
    if BACKUP_API_KEY:
        print(f"已配置 {len(assistant.api_keys)} 个API Key")
    print()

    # 获取路径
    print("请输入患者数据路径（可以是单个文件或文件夹）:")
    print("示例:")
    print("  - 单个文件: /path/to/file.txt")
    print("  - 文件夹: /path/to/patient_data")
    path_input = input("> ").strip()

    if not path_input:
        print("\n未提供路径，使用交互模式...")
        print("请直接输入患者数据:")
        patient_data = input("> ")
        return

    # 获取文件列表
    files = get_files_from_path(path_input)

    if not files:
        print(f"\n错误: 路径中未找到支持的文件 - {path_input}")
        print("支持的文件格式: .txt, .md, .csv, .jpg, .jpeg, .png, .gif, .bmp, .webp")
        return

    print(f"\n找到 {len(files)} 个文件:")
    for i, f in enumerate(files, 1):
        filename = Path(f).name
        print(f"  {i}. {filename}")
    print()

    # 获取输入路径的目录（用于保存报告）
    input_path = Path(path_input)
    if input_path.is_file():
        output_dir = str(input_path.parent)
    else:
        output_dir = str(input_path)

    print(f"报告输出目录: {output_dir}\n")

    # 执行完整诊断流程（传递output_dir，每个模型会生成独立的md文件）
    result = assistant.full_diagnosis_process(files, output_dir)

    # 保存完整报告
    assistant.save_report(result, output_dir)

    # 打印最终会诊结果
    print("\n" + "=" * 60)
    print("最终会诊结果")
    print("=" * 60)
    print(result['final_consultation'])

    # 显示HTML报告信息（已在full_diagnosis_process中生成）
    if result.get('html_report_url'):
        print(f"\n✓ HTML会诊报告链接已保存，可在报告输出目录查看")


if __name__ == "__main__":
    main()