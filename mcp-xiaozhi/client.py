from __future__ import annotations

import logging
from urllib.parse import urlsplit
from typing import Any, Dict, Optional

import requests

from config import settings


logger = logging.getLogger("warmdiet_mcp.client")


class WarmDietApiError(Exception):
    pass


class WarmDietApiClient:
    def __init__(self) -> None:
        self.base_url = settings.api_base_url
        self.patient_id = settings.patient_id
        self.session = requests.Session()
        self._refreshed_demo_token = False

        headers = {"Content-Type": "application/json"}
        if settings.patient_token:
            headers["Authorization"] = f"Bearer {settings.patient_token}"
        self.session.headers.update(headers)

    def _maybe_refresh_demo_token(self) -> bool:
        if self._refreshed_demo_token:
            return False

        parsed = urlsplit(self.base_url)
        if parsed.hostname not in {"localhost", "127.0.0.1"}:
            return False

        demo_url = f"{parsed.scheme}://{parsed.netloc}/api/demo/patient-token"
        logger.info("[API-AUTH] refreshing demo token via %s", demo_url)

        try:
            resp = requests.post(demo_url, timeout=10)
            payload = resp.json()
        except Exception as ex:  # noqa: BLE001
            logger.error("[API-AUTH] failed to refresh demo token: %s", ex)
            return False

        token = payload.get("data", {}).get("token")
        patient_id = payload.get("data", {}).get("patientId")
        if not resp.ok or not payload.get("success") or not token:
            logger.error("[API-AUTH] demo token refresh rejected: status=%s body=%s", resp.status_code, payload)
            return False

        if patient_id and patient_id != self.patient_id:
            logger.warning("[API-AUTH] demo token patient mismatch: expected=%s actual=%s", self.patient_id, patient_id)
            return False

        self.session.headers["Authorization"] = f"Bearer {token}"
        self._refreshed_demo_token = True
        logger.info("[API-AUTH] demo token refreshed for patient=%s", self.patient_id)
        return True

    def _request(self, method: str, path: str, json_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        logger.info("[API-REQ] %s %s payload=%s", method, path, json_data)
        resp = self.session.request(method=method, url=url, json=json_data, timeout=15)

        if resp.status_code == 401 and self._maybe_refresh_demo_token():
            logger.info("[API-RETRY] %s %s after demo token refresh", method, path)
            resp = self.session.request(method=method, url=url, json=json_data, timeout=15)

        try:
            payload = resp.json()
        except Exception as ex:  # noqa: BLE001
            raise WarmDietApiError(f"API 返回非 JSON: {resp.text[:200]}") from ex

        if not resp.ok or not payload.get("success", False):
            logger.error("[API-ERR] %s %s status=%s body=%s", method, path, resp.status_code, payload)
            raise WarmDietApiError(payload.get("error") or payload.get("message") or f"请求失败: {resp.status_code}")

        logger.info("[API-OK] %s %s status=%s", method, path, resp.status_code)
        return payload.get("data")

    def record_meal(self, meal_payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("POST", f"/meals/patient/{self.patient_id}", json_data=meal_payload)

    def record_vitals(self, vitals_payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("POST", f"/patients/{self.patient_id}/vital-measurements", json_data=vitals_payload)

    def append_conversation_log(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("POST", f"/patients/{self.patient_id}/conversation-logs", json_data=payload)

    def get_today_summary(self) -> Dict[str, Any]:
        return self._request("GET", f"/patients/{self.patient_id}/dashboard")

    def get_glucose_follow_up(self, glucose_value: float, glucose_context: str = "unknown", measured_at: str = "") -> Dict[str, Any]:
        """根据血糖值获取低打扰追问建议"""
        params = f"glucoseValue={glucose_value}&glucoseContext={glucose_context}"
        if measured_at:
            params += f"&measuredAt={measured_at}"
        return self._request("GET", f"/patients/{self.patient_id}/glucose-follow-up?{params}")

    def get_meal_suggestion(self, mode: str = "set", meal_type: str | None = None) -> Dict[str, Any]:
        """获取用餐指引建议"""
        import time
        payload: Dict[str, Any] = {"mode": mode, "nonce": int(time.time())}
        if meal_type:
            payload["mealType"] = meal_type
        return self._request("POST", f"/reports/patient/{self.patient_id}/tomorrow-guide", json_data=payload)
