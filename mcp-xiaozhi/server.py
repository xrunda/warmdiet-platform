from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict, List

from mcp.server.fastmcp import FastMCP

from client import WarmDietApiClient, WarmDietApiError
from config import settings


logger = logging.getLogger("warmdiet_mcp")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

mcp = FastMCP(settings.mcp_service_name)
api_client = WarmDietApiClient()

logger.info(
    "[BOOT] service=%s api_base=%s patient_id=%s voice_source=%s",
    settings.mcp_service_name,
    settings.api_base_url,
    settings.patient_id,
    settings.voice_source_type,
)


def _safe_response(data: Dict[str, Any]) -> Dict[str, Any]:
    raw = json.dumps(data, ensure_ascii=False)
    if len(raw.encode("utf-8")) <= 3000:
        return data
    return {
        "success": True,
        "message": "返回内容较长，已裁剪",
        "preview": raw[:1500],
    }


# 中英文食物名称映射表（用于将 LLM 翻译的英文转回中文）
FOOD_NAME_TRANSLATION = {
    # 主食
    "porridge": "粥",
    "rice": "米饭",
    "noodles": "面条",
    "noodle": "面条",
    "bread": "面包",
    "steamed bread": "馒头",
    "steamed_bread": "馒头",
    "corn": "玉米",
    "sweet potato": "红薯",
    "sweet_potato": "红薯",
    "oatmeal": "燕麦",
    "oats": "燕麦",
    "congee": "粥",
    "millet porridge": "小米粥",
    "millet_congee": "小米粥",
    "millet": "小米",
    "whole wheat bread": "全麦面包",
    "whole_wheat_bread": "全麦面包",
    "glutinous rice": "糯米",
    
    # 蛋白质
    "egg": "鸡蛋",
    "eggs": "鸡蛋",
    "steamed egg": "蒸蛋",
    "steamed_egg": "蒸蛋",
    "boiled egg": "煮鸡蛋",
    "boiled_egg": "煮鸡蛋",
    "tofu": "豆腐",
    "fish": "鱼肉",
    "chicken breast": "鸡胸肉",
    "chicken_breast": "鸡胸肉",
    "lean pork": "瘦肉",
    "lean_meat": "瘦肉",
    "pork": "猪肉",
    "beef": "牛肉",
    "shrimp": "虾仁",
    "milk": "牛奶",
    "soy milk": "豆浆",
    "soy_milk": "豆浆",
    
    # 蔬菜
    "spinach": "菠菜",
    "cabbage": "白菜",
    "bok choy": "小白菜",
    "broccoli": "西兰花",
    "carrot": "胡萝卜",
    "tomato": "番茄",
    "cucumber": "黄瓜",
    "lettuce": "生菜",
    "vegetable": "蔬菜",
    "vegetables": "蔬菜",
    "greens": "青菜",
    "winter melon": "冬瓜",
    "potato": "土豆",
    "eggplant": "茄子",
    "mushroom": "蘑菇",
    "mushrooms": "蘑菇",
    
    # 肉类
    "pork belly": "五花肉",
    "red braised pork": "红烧肉",
    "braised pork": "红烧肉",
    "steamed chicken": "蒸鸡",
    "steamed fish": "清蒸鱼",
    "fish fillet": "鱼片",
    "ribs": "排骨",
    
    # 汤品
    "soup": "汤",
    "vegetable soup": "蔬菜汤",
    "seaweed egg soup": "紫菜蛋花汤",
    "fish soup": "鱼汤",
    "bone soup": "骨头汤",
    "tomato egg soup": "番茄蛋汤",
    "winter melon soup": "冬瓜汤",
    
    # 水果
    "apple": "苹果",
    "banana": "香蕉",
    "orange": "橙子",
    "pear": "梨",
    "watermelon": "西瓜",
    "grape": "葡萄",
    "fruit": "水果",
    
    # 其他
    "salad": "沙拉",
    "rice porridge": "粥",
    "corn porridge": "玉米粥",
    "red bean porridge": "红豆粥",
    "green bean porridge": "绿豆粥",
    "walnut": "核桃",
    "peanut": "花生",
    "sesame": "芝麻",
    "honey": "蜂蜜",
    "sugar": "糖",
    "salt": "盐",
    "oil": "油",
    "soy sauce": "酱油",
    "vinegar": "醋",
    "garlic": "大蒜",
    "ginger": "姜",
    "onion": "洋葱",
    "pepper": "辣椒",
    "chili": "辣椒",
}

def _translate_food_name(name: str) -> str:
    """将英文食物名称翻译回中文"""
    # 先检查是否已经是中文
    if any('\u4e00' <= c <= '\u9fff' for c in name):
        return name
    
    # 转换为小写进行匹配
    lower_name = name.lower().strip()
    
    # 直接匹配
    if lower_name in FOOD_NAME_TRANSLATION:
        return FOOD_NAME_TRANSLATION[lower_name]
    
    # 尝试匹配带下划线的版本
    if lower_name in FOOD_NAME_TRANSLATION:
        return FOOD_NAME_TRANSLATION[lower_name]
    
    # 尝试部分匹配（如 "lean pork stir-fry" -> "瘦肉"）
    for eng, chi in FOOD_NAME_TRANSLATION.items():
        if eng in lower_name or lower_name in eng:
            return chi
    
    # 如果找不到翻译，返回原始名称
    return name


def _build_foods(food_names: List[str]) -> List[Dict[str, Any]]:
    foods: List[Dict[str, Any]] = []
    for name in food_names:
        n = name.strip()
        if not n:
            continue
        # 翻译食物名称为中文
        chinese_name = _translate_food_name(n)
        foods.append(
            {
                "name": chinese_name,
                "amount": 1,
                "unit": "份",
                "calories": 100,
                "protein": 5,
                "carbs": 15,
                "fat": 3,
            }
        )
    return foods


def _drop_none(d: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in d.items() if v is not None}


@mcp.tool()
def record_meal(
    meal_type: str,
    food_names: str,
    meal_time: str = "",
    meal_date: str = "",
    notes: str = "",
) -> dict:
    """当用户描述自己吃了什么时，使用该工具记录餐食。

    参数说明：
    - meal_type: breakfast/lunch/dinner/snack
    - food_names: 食物名称，使用英文逗号分隔，如“小米粥,鸡蛋”
    - meal_time: 可选，格式 HH:MM；不填则用当前时间
    - meal_date: 可选，格式 YYYY-MM-DD；不填则用今天
    - notes: 可选备注
    """
    logger.info(
        "[TOOL-IN] record_meal meal_type=%s food_names=%s meal_time=%s meal_date=%s",
        meal_type,
        food_names,
        meal_time,
        meal_date,
    )
    now = datetime.now()
    final_meal_time = meal_time or now.strftime("%H:%M")
    final_meal_date = meal_date or now.strftime("%Y-%m-%d")
    foods = _build_foods(food_names.split(","))

    payload = {
        "mealType": meal_type,
        "mealDate": final_meal_date,
        "mealTime": final_meal_time,
        "foods": foods,
        "nutritionScore": 75,
        "calories": max(100, len(foods) * 100),
        "notes": notes.strip() if isinstance(notes, str) and notes.strip() else None,
    }
    payload = _drop_none(payload)

    try:
        result = api_client.record_meal(payload)
        logger.info("[TOOL-OK] record_meal meal_type=%s food_names=%s", meal_type, food_names)
        return _safe_response({"success": True, "result": result})
    except WarmDietApiError as ex:
        logger.error("[TOOL-ERR] record_meal err=%s", ex)
        return {"success": False, "error": str(ex)}


@mcp.tool()
def record_vitals(
    metric_type: str,
    systolic_value: int = 0,
    diastolic_value: int = 0,
    glucose_value: float = 0,
    glucose_context: str = "unknown",
    measured_at: str = "",
    source_text: str = "",
    notes: str = "",
) -> dict:
    """当用户主动上报血压或血糖时，使用该工具写入生命体征。

    参数说明：
    - metric_type: blood_pressure 或 blood_glucose
    - 血压时提供 systolic_value + diastolic_value
    - 血糖时提供 glucose_value，可选 glucose_context（fasting/post_meal/random/before_sleep/unknown）
    - notes: 可选，补录细节（如餐后多久、服用药物名称等）

    重要：当记录血糖后，返回结果中可能包含 follow_up 字段。
    如果 follow_up.should_ask 为 true，你必须按照 follow_up.prompt_for_ai 中的指令，
    用自然对话的方式逐个追问患者。追问时注意：
    - 如果 urgency 为 high 或 advice.level 为 urgent，优先告知安全提醒
    - 每次只问一个问题，不要一次问完所有问题
    - 标记为"可以跳过"的问题，如果患者不想回答可以跳过
    - 用温和关心的语气，不要像审问
    """
    logger.info(
        "[TOOL-IN] record_vitals metric_type=%s systolic=%s diastolic=%s glucose=%s context=%s notes=%s",
        metric_type,
        systolic_value,
        diastolic_value,
        glucose_value,
        glucose_context,
        notes,
    )

    if metric_type not in ("blood_pressure", "blood_glucose"):
        msg = "metric_type 仅支持 blood_pressure 或 blood_glucose"
        logger.error("[TOOL-ERR] record_vitals validation err=%s", msg)
        return {"success": False, "error": msg}

    if metric_type == "blood_pressure":
        if systolic_value < 40 or diastolic_value < 30:
            msg = "血压参数无效：请同时提供有效的收缩压(>=40)和舒张压(>=30)"
            logger.error("[TOOL-ERR] record_vitals validation err=%s", msg)
            return {"success": False, "error": msg}
    else:
        is_follow_up_supplement = glucose_value <= 0 and (
            (isinstance(glucose_context, str) and glucose_context.strip().lower() not in ("", "unknown"))
            or (isinstance(source_text, str) and source_text.strip())
        )
        if glucose_value <= 0 and not is_follow_up_supplement:
            msg = "血糖参数无效：请提供大于 0 的 glucose_value，或提供追问补录信息（如 glucose_context）"
            logger.error("[TOOL-ERR] record_vitals validation err=%s", msg)
            return {"success": False, "error": msg}
    payload: Dict[str, Any] = {
        "metricType": metric_type,
        "sourceType": settings.voice_source_type,
        "sourceText": source_text.strip() if isinstance(source_text, str) and source_text.strip() else None,
        "notes": notes.strip() if isinstance(notes, str) and notes.strip() else None,
    }

    if metric_type == "blood_pressure":
        payload.update(
            {
                "systolicValue": systolic_value,
                "diastolicValue": diastolic_value,
                "unit": "mmHg",
            }
        )
    else:
        payload.update(
            {
                "glucoseValue": glucose_value if glucose_value > 0 else None,
                "glucoseContext": glucose_context,
                "unit": "mmol/L",
            }
        )

    if measured_at:
        payload["measuredAt"] = measured_at

    payload = _drop_none(payload)

    try:
        result = api_client.record_vitals(payload)
        logger.info("[TOOL-OK] record_vitals metric_type=%s", metric_type)

        response: Dict[str, Any] = {"success": True, "result": result}

        # 血糖记录后自动调用追问 SOP
        if metric_type == "blood_glucose" and glucose_value > 0:
            try:
                follow_up = api_client.get_glucose_follow_up(
                    glucose_value=glucose_value,
                    glucose_context=glucose_context,
                    measured_at=measured_at,
                )
                if follow_up and follow_up.get("shouldAskFollowUp"):
                    questions = follow_up.get("questions", [])
                    advice = follow_up.get("advice", {})
                    urgency = follow_up.get("urgency", "low")

                    # 构建给 AI 的追问指令
                    follow_up_texts = []
                    if advice and advice.get("level") == "urgent":
                        follow_up_texts.append(f"⚠️ 紧急提醒：{advice.get('summary', '')}")
                    elif advice and advice.get("level") == "attention":
                        follow_up_texts.append(f"⚡ 注意：{advice.get('summary', '')}")

                    for q in questions:
                        opts = "、".join(q.get("options", []))
                        skip_hint = "（可以跳过）" if q.get("allowSkip") else ""
                        follow_up_texts.append(f"请追问患者：{q['question']} 选项：{opts}{skip_hint}")

                    response["follow_up"] = {
                        "should_ask": True,
                        "urgency": urgency,
                        "intent": follow_up.get("intent", ""),
                        "summary": follow_up.get("summary", ""),
                        "advice": advice,
                        "questions": questions,
                        "prompt_for_ai": "\n".join(follow_up_texts),
                    }
                    response["message"] = (
                        f"血糖已记录。{follow_up.get('summary', '')}\n"
                        + "\n".join(follow_up_texts)
                    )
                    logger.info(
                        "[FOLLOW-UP] glucose=%.1f context=%s urgency=%s intent=%s questions=%d",
                        glucose_value, glucose_context, urgency,
                        follow_up.get("intent", ""), len(questions),
                    )
                else:
                    response["follow_up"] = {"should_ask": False}
                    response["message"] = "血糖已记录，数值在合理范围内。"
            except Exception as fu_err:
                logger.warning("[FOLLOW-UP-ERR] glucose follow-up failed: %s", fu_err)
                response["follow_up"] = {"should_ask": False, "error": str(fu_err)}

        elif metric_type == "blood_glucose":
            response["follow_up"] = {"should_ask": False}
            response["message"] = "血糖追问信息已补充保存。"

        return _safe_response(response)
    except WarmDietApiError as ex:
        logger.error("[TOOL-ERR] record_vitals err=%s", ex)
        return {"success": False, "error": str(ex)}


@mcp.tool()
def append_conversation_log(
    role: str,
    content: str,
    timestamp: str = "",
    log_date: str = "",
) -> dict:
    """当需要保留语音对话上下文时，使用该工具写入对话日志。

    参数说明：
    - role: user 或 assistant
    - content: 对话文本
    - timestamp: 可选，HH:MM 或 HH:MM:SS
    - log_date: 可选，YYYY-MM-DD
    """
    logger.info(
        "[TOOL-IN] append_conversation_log role=%s timestamp=%s log_date=%s content_preview=%s",
        role,
        timestamp,
        log_date,
        content[:80],
    )
    payload = {
        "role": role,
        "content": content,
        "timestamp": timestamp.strip() if isinstance(timestamp, str) and timestamp.strip() else None,
        "logDate": log_date.strip() if isinstance(log_date, str) and log_date.strip() else None,
        "extra": {
            "source": "xiaozhi_mcp",
        },
    }
    payload = _drop_none(payload)

    try:
        result = api_client.append_conversation_log(payload)
        logger.info("[TOOL-OK] append_conversation_log role=%s", role)
        return _safe_response({"success": True, "result": result})
    except WarmDietApiError as ex:
        logger.error("[TOOL-ERR] append_conversation_log err=%s", ex)
        return {"success": False, "error": str(ex)}


# 餐次英文→中文映射
MEAL_TYPE_MAP = {
    "breakfast": "早餐",
    "lunch": "午餐",
    "dinner": "晚餐",
}


@mcp.tool()
def get_meal_suggestion(
    meal_type: str = "",
) -> dict:
    """当用户询问建议吃什么、该吃什么、饮食建议时，使用该工具获取用餐指引。

    适用问题举例：
    - 早上吃什么？明天早上吃什么？早餐建议？
    - 中午吃什么？明天中午吃什么？午餐吃什么？
    - 晚上吃什么？明天晚上吃什么？晚餐吃什么？
    - 今天吃什么？明天吃什么？最近建议吃什么？
    - 有什么饮食建议？该怎么吃？

    参数说明：
    - meal_type: 可选。breakfast 表示早餐，lunch 表示午餐，dinner 表示晚餐；
      不填或填 all 则返回三餐完整建议方案。
    """
    logger.info("[TOOL-IN] get_meal_suggestion meal_type=%s", meal_type)

    mt = meal_type.strip().lower() if meal_type else ""

    try:
        if mt in MEAL_TYPE_MAP:
            # 查询单餐建议
            chinese_type = MEAL_TYPE_MAP[mt]
            data = api_client.get_meal_suggestion(mode="single", meal_type=chinese_type)
            result = {
                "success": True,
                "meal_type": chinese_type,
                "menu": data.get("menu", ""),
                "reason": data.get("reason", ""),
                "time": data.get("time", ""),
                "message": f"建议{chinese_type}吃：{data.get('menu', '')}。{data.get('reason', '')}",
            }
        else:
            # 查询三餐完整建议
            data = api_client.get_meal_suggestion(mode="set")
            plan = data.get("plan", [])
            meals_text = []
            plan_list = []
            for item in plan:
                meals_text.append(
                    f"{item.get('type', '')}（{item.get('time', '')}）：{item.get('menu', '')}。{item.get('reason', '')}"
                )
                plan_list.append({
                    "meal_type": item.get("type", ""),
                    "time": item.get("time", ""),
                    "menu": item.get("menu", ""),
                    "reason": item.get("reason", ""),
                })
            result = {
                "success": True,
                "plan": plan_list,
                "message": "以下是为您推荐的三餐方案：\n" + "\n".join(meals_text),
            }

        logger.info("[TOOL-OK] get_meal_suggestion meal_type=%s", meal_type)
        return _safe_response(result)
    except WarmDietApiError as ex:
        logger.error("[TOOL-ERR] get_meal_suggestion err=%s", ex)
        return {"success": False, "error": str(ex)}


@mcp.tool()
def get_today_summary() -> dict:
    """当用户询问“今天情况如何/今日总结”时，使用该工具获取仪表盘摘要。"""
    logger.info("[TOOL-IN] get_today_summary")
    try:
        data = api_client.get_today_summary()
        summary = {
            "success": True,
            "patient": (data or {}).get("patient", {}).get("name", ""),
            "healthScore": (data or {}).get("healthScore", 0),
            "mealCount": len((data or {}).get("meals", [])),
            "alertCount": len((data or {}).get("alerts", [])),
            "latestBloodPressure": ((data or {}).get("vitals", {}) or {}).get("latestBloodPressure"),
            "latestBloodGlucose": ((data or {}).get("vitals", {}) or {}).get("latestBloodGlucose"),
        }
        logger.info("[TOOL-OK] get_today_summary")
        return _safe_response(summary)
    except WarmDietApiError as ex:
        logger.error("[TOOL-ERR] get_today_summary err=%s", ex)
        return {"success": False, "error": str(ex)}


if __name__ == "__main__":
    logger.info("Starting MCP service: %s", settings.mcp_service_name)
    mcp.run(transport="stdio")
