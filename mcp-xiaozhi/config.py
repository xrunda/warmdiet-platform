import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    mcp_service_name: str = os.getenv("MCP_SERVICE_NAME", "WarmDietMCP")
    api_base_url: str = os.getenv("WARMDIET_API_BASE_URL", "http://localhost:4000/api").rstrip("/")
    patient_token: str = os.getenv("WARMDIET_PATIENT_TOKEN", "")
    patient_id: str = os.getenv("WARMDIET_PATIENT_ID", "patient_test_001")
    voice_source_type: str = os.getenv("VOICE_SOURCE_TYPE", "xiaoai_voice")


settings = Settings()
