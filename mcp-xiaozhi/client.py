from __future__ import annotations

import logging
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

        headers = {"Content-Type": "application/json"}
        if settings.patient_token:
            headers["Authorization"] = f"Bearer {settings.patient_token}"
        self.session.headers.update(headers)

    def _request(self, method: str, path: str, json_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        logger.info("[API-REQ] %s %s payload=%s", method, path, json_data)
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
