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
    if len(raw.encode("utf-8")) <= 1000:
        return data
    return {
        "success": True,
        "message": "返回内容较长，已裁剪",
        "preview": raw[:500],
    }


def _build_foods(food_names: List[str]) -> List[Dict[str, Any]]:
    foods: List[Dict[str, Any]] = []
    for name in food_names:
        n = name.strip()
        if not n:
            continue
        foods.append(
            {
                "name": n,
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
) -> dict:
    """当用户主动上报血压或血糖时，使用该工具写入生命体征。

    参数说明：
    - metric_type: blood_pressure 或 blood_glucose
    - 血压时提供 systolic_value + diastolic_value
    - 血糖时提供 glucose_value，可选 glucose_context（fasting/post_meal/random/before_sleep/unknown）
    """
    logger.info(
        "[TOOL-IN] record_vitals metric_type=%s systolic=%s diastolic=%s glucose=%s context=%s",
        metric_type,
        systolic_value,
        diastolic_value,
        glucose_value,
        glucose_context,
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
        if glucose_value <= 0:
            msg = "血糖参数无效：请提供大于 0 的 glucose_value"
            logger.error("[TOOL-ERR] record_vitals validation err=%s", msg)
            return {"success": False, "error": msg}
    payload: Dict[str, Any] = {
        "metricType": metric_type,
        "sourceType": settings.voice_source_type,
        "sourceText": source_text.strip() if isinstance(source_text, str) and source_text.strip() else None,
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
                "glucoseValue": glucose_value,
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
        return _safe_response({"success": True, "result": result})
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
