# mcp-xiaozhi

面向 `xiaozhi.me` 的独立 MCP 服务（stdio 模式），用于把语音侧能力接到现有 `warmdiet-platform` 后台。

## 设计原则

- **无业务存储（stateless）**：不单独建业务数据库。
- MCP 只做：参数校验、调用现有后端 API、返回短 JSON。
- 餐食/对话/生命体征等数据统一写入现有 `server`。

## 已实现工具

- `record_meal`
- `record_vitals`
- `append_conversation_log`
- `get_today_summary`

> 快速注释：
> - `record_meal`：把“吃了什么”写入餐食记录
> - `record_vitals`：把血压/血糖上报写入生命体征
> - `append_conversation_log`：写入一条对话日志并自动尝试提取血压/血糖
> - `get_today_summary`：读取今日健康摘要（分数、餐食数、预警、最新血压血糖）

### 工具说明（功能 / 入参 / 出参）

#### 1) `record_meal`

**功能**
- 当用户说“我刚吃了什么”时，写入一条餐食记录。

**入参**
- `meal_type` (string, 必填): `breakfast | lunch | dinner | snack`
- `food_names` (string, 必填): 食物名称，英文逗号分隔，例如 `"小米粥,鸡蛋,青菜"`
- `meal_time` (string, 选填): `HH:MM`，不传则默认当前时间
- `meal_date` (string, 选填): `YYYY-MM-DD`，不传则默认当天
- `notes` (string, 选填): 备注

**出参**
- 成功：
```json
{
  "success": true,
  "result": {
    "id": "meal_records_xxx",
    "mealType": "breakfast",
    "mealDate": "2026-03-10",
    "mealTime": "08:15",
    "calories": 300
  }
}
```
- 失败：
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

#### 2) `record_vitals`

**功能**
- 当用户上报血压或血糖时，写入生命体征记录。

**入参**
- `metric_type` (string, 必填): `blood_pressure | blood_glucose`
- `systolic_value` (int, 血压时必填): 收缩压
- `diastolic_value` (int, 血压时必填): 舒张压
- `glucose_value` (float, 血糖时必填): 血糖值
- `glucose_context` (string, 选填): `fasting | post_meal | random | before_sleep | unknown`
- `measured_at` (string, 选填): `YYYY-MM-DDTHH:MM:SS`
- `source_text` (string, 选填): 原始语音文本

**出参**
- 成功（示例）：
```json
{
  "success": true,
  "result": {
    "metricType": "blood_pressure",
    "value": "128/76",
    "status": "normal",
    "unit": "mmHg"
  }
}
```
- 失败：
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

#### 3) `append_conversation_log`

**功能**
- 追加一条对话日志；若文本中包含血压/血糖表达，会自动触发解析并写入生命体征。

**入参**
- `role` (string, 必填): `user | assistant`
- `content` (string, 必填): 对话内容
- `timestamp` (string, 选填): `HH:MM` 或 `HH:MM:SS`
- `log_date` (string, 选填): `YYYY-MM-DD`

**出参**
- 成功（示例）：
```json
{
  "success": true,
  "result": {
    "id": "conversation_logs_xxx",
    "role": "user",
    "content": "我刚量了血压128/76",
    "extractedVitals": [
      {
        "metricType": "blood_pressure",
        "value": "128/76"
      }
    ]
  }
}
```
- 失败：
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

#### 4) `get_today_summary`

**功能**
- 获取患者今日摘要（健康分、餐食数量、预警数量、最新血压血糖）。

**入参**
- 无

**出参**
- 成功（示例）：
```json
{
  "success": true,
  "patient": "张三",
  "healthScore": 82,
  "mealCount": 3,
  "alertCount": 1,
  "latestBloodPressure": {
    "value": "128/76",
    "status": "normal"
  },
  "latestBloodGlucose": {
    "value": 6.2,
    "status": "normal"
  }
}
```
- 失败：
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 目录说明

- `server.py`：FastMCP 工具定义入口
- `client.py`：调用 warmdiet API 的轻量客户端
- `config.py`：环境变量配置
- `.env.example`：配置示例

## 使用步骤

1) 安装依赖

```bash
cd /Users/liguang/Documents/xRunda/project/AI/github/warmdiet-platform/mcp-xiaozhi
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2) 配置环境变量

```bash
cp .env.example .env
```

必填项：
- `WARMDIET_PATIENT_TOKEN`（建议使用后端真实患者 token）

开发环境可通过以下命令获取 demo token：

```bash
curl -X POST http://localhost:4000/api/demo/patient-token
```

3) 启动后端（另一个终端）

```bash
cd /Users/liguang/Documents/xRunda/project/AI/github/warmdiet-platform
npm run dev:server
```

4) 启动 MCP 服务（stdio）

```bash
cd /Users/liguang/Documents/xRunda/project/AI/github/warmdiet-platform/mcp-xiaozhi
source .venv/bin/activate
python server.py
```

5) 按小智官方方式桥接到智能体 MCP Endpoint

你可使用官方示例里的 `mcp_pipe.py`：

```bash
export MCP_ENDPOINT="<xiaozhi_agent_mcp_endpoint>"
python mcp_pipe.py server.py
```

> 注：`MCP_ENDPOINT` 是敏感信息，请仅放环境变量，避免提交到仓库。

## 与现有后端的接口约定

- `POST /api/meals/patient/:patientId`
- `POST /api/patients/:id/vital-measurements`（本次新增）
- `POST /api/patients/:id/conversation-logs`（本次新增）
- `GET /api/patients/:id/dashboard`

## 常见问题

1. **MCP 服务要不要自己存数据？**
   - 不需要。推荐全部回写现有 warmdiet 后台。

2. **为什么默认 `VOICE_SOURCE_TYPE=xiaoai_voice`？**
   - 为了兼容当前数据库的 `CHECK` 约束。后续可做 DB 迁移改为 `xiaozhi_voice`/`voice_device`。
