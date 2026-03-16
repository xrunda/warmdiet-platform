# 血糖追问 SOP v1.0 — 低打扰智能问诊规范

> 核心原则：**最少必要提问** · **异常才加问** · **风险才深问** · **能推断就不追问**

---

## 一、设计理念

患者上报血糖时，系统不应该像填问卷一样一口气追问很多问题。好的体验是：

- **大多数正常记录 2～3 步完成**，不追问
- **轻度异常** 只补 1 个高价值问题
- **明显异常或高风险** 才启动深度追问（最多 2～3 题）
- **低血糖场景先保安全**，再考虑信息完整性

---

## 二、三层追问架构

### 第 1 层：必问层（所有血糖记录默认执行）

| 序号 | 字段 | 问题 | 交互方式 | 是否必填 |
|------|------|------|----------|----------|
| 1 | `glucoseValue` | 血糖值是多少？ | 数字输入 | ✅ 必填 |
| 2 | `glucoseContext` | 这是空腹、餐前、餐后还是睡前测的？ | 单选按钮 | ✅ 必填 |
| 3 | `postMealDuration` | （仅餐后）大约是饭后多久测的？ | 单选：1小时内 / 约2小时 / 超过2小时 | 可跳过 |

> 💡 系统可根据当前时间自动推荐默认选项（如早上 7 点默认"空腹"，12:30 默认"餐后"）

### 第 2 层：条件追问层（仅异常时触发）

根据血糖值 + 场景 + 近期趋势，系统自动选择最多 1～2 个追问：

#### A. 餐后偏高（餐后 ≥ 10 mmol/L）
| 字段 | 问题 | 交互方式 |
|------|------|----------|
| `mealAmount` | 这餐主食量和平时比怎么样？ | 单选：正常 / 偏多 / 偏少 / 不确定 |
| `highSugarFoods` | 这餐有没有甜食、饮料或水果？ | 多选：甜食 / 含糖饮料 / 水果 / 都没有 |

#### B. 空腹偏高（空腹 ≥ 7 mmol/L）或连续多日异常
| 字段 | 问题 | 交互方式 |
|------|------|----------|
| `medicationStatus` | 今天降糖药或胰岛素有按时使用吗？ | 单选：按时用了 / 漏用了 / 时间推迟了 / 不确定 |
| `stressFactors` | 最近有没有熬夜、发热不适或压力明显增大？ | 多选：熬夜 / 发热感染 / 压力大 / 都没有 |

### 第 3 层：高风险升级层（低血糖或危险值）

#### C. 血糖偏低（< 3.9 mmol/L）
| 字段 | 问题 | 交互方式 | 是否必填 |
|------|------|----------|----------|
| `lowSymptoms` | 现在有没有心慌、手抖、出汗、头晕？ | 多选 | ✅ 必填 |
| `lowSugarHandled` | 已经补充糖分或进食了吗？ | 单选：已补充 / 还没有 / 不确定 | ✅ 必填 |

> ⚠️ 低血糖场景 **优先安全提醒**，不追求信息完整。若 < 3.0 mmol/L 标记为 urgent 级别。

---

## 三、触发规则决策树

```
患者上报血糖值
│
├── glucoseContext == unknown?
│   └── YES → 追问第1层（测量场景 + 餐后时长）
│
├── glucoseValue < 3.9?
│   ├── < 3.0 → urgency=high → 第3层（低血糖症状 + 是否补糖）+ urgent 安全提醒
│   └── 3.0~3.8 → urgency=medium → 第3层 + attention 安全提醒
│
├── context=post_meal & value ≥ 10?
│   ├── ≥ 13 → urgency=high → 第2层A（主食量 + 甜食）
│   └── 10~12.9 → urgency=medium → 第2层A
│
├── context=fasting & value ≥ 7?
│   └── → 第2层B（用药 + 应激因素）
│
├── 近14天 highCount ≥ 3 或 lowCount ≥ 2?
│   └── → 第2层B（用药 + 应激因素）
│
└── 其他（正常范围）
    └── shouldAskFollowUp = false，直接记录 + 简短反馈
```

---

## 四、API 接口

### `GET /api/patients/:id/glucose-follow-up`

根据传入的血糖值和场景，结合患者近期历史记录，动态返回追问建议。

**请求参数（Query String）：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `glucoseValue` | number | ✅ | 血糖值（mmol/L），1～40 |
| `glucoseContext` | string | 否 | `fasting` / `post_meal` / `random` / `before_sleep` / `unknown` |
| `measuredAt` | string | 否 | 测量时间 ISO 格式 |

**响应示例（餐后偏高场景）：**

```json
{
  "success": true,
  "data": {
    "shouldAskFollowUp": true,
    "intent": "meal_details",
    "urgency": "medium",
    "summary": "餐后血糖偏高，优先看看这餐吃了什么，避免一次问太多。",
    "questions": [
      {
        "key": "mealAmount",
        "question": "这餐主食量和平时比怎么样？",
        "inputType": "single_choice",
        "options": ["正常", "偏多", "偏少", "不确定"],
        "required": false,
        "allowSkip": true
      },
      {
        "key": "highSugarFoods",
        "question": "这餐有没有甜食、饮料或水果？",
        "inputType": "multi_choice",
        "options": ["甜食", "含糖饮料", "水果", "都没有"],
        "required": false,
        "allowSkip": true
      }
    ],
    "advice": {
      "level": "info",
      "summary": "建议先回顾主食和甜食摄入，再结合饭后活动情况判断。"
    }
  },
  "message": "已生成血糖追问建议"
}
```

**响应示例（正常血糖，无需追问）：**

```json
{
  "success": true,
  "data": {
    "shouldAskFollowUp": false,
    "intent": "collect_context",
    "urgency": "low",
    "summary": "本次血糖已可完成基础记录，暂不追加追问。",
    "questions": [],
    "advice": {
      "level": "info",
      "summary": "当前以低打扰记录为主，如后续连续异常再追加追问。"
    }
  },
  "message": "当前无需追加追问"
}
```

**响应示例（低血糖紧急场景）：**

```json
{
  "success": true,
  "data": {
    "shouldAskFollowUp": true,
    "intent": "hypoglycemia_risk",
    "urgency": "high",
    "summary": "这次血糖偏低，先确认是否有不适并是否已经补糖。",
    "questions": [
      {
        "key": "lowSymptoms",
        "question": "现在有没有心慌、手抖、出汗、头晕这些低血糖不适？",
        "inputType": "multi_choice",
        "options": ["心慌", "手抖", "出汗", "头晕", "都没有"],
        "required": true,
        "allowSkip": false
      },
      {
        "key": "lowSugarHandled",
        "question": "这次低血糖后，您已经补充糖分或进食了吗？",
        "inputType": "single_choice",
        "options": ["已经补充", "还没有", "不确定"],
        "required": true,
        "allowSkip": false
      }
    ],
    "advice": {
      "level": "urgent",
      "summary": "血糖明显偏低，请尽快补充糖分，若症状明显建议立即联系医生或家属。"
    }
  },
  "message": "已生成血糖追问建议"
}
```

---

## 五、数据类型定义

```typescript
// 追问意图
type GlucoseFollowUpIntent =
  | 'collect_context'       // 补充测量场景
  | 'meal_details'          // 追问饮食细节
  | 'hypoglycemia_risk'     // 低血糖安全确认
  | 'medication_and_stress' // 用药与应激排查

// 追问问题
type GlucoseFollowUpQuestion = {
  key: string;                              // 字段标识
  question: string;                         // 问题文案
  inputType: 'single_choice' | 'multi_choice'; // 交互方式
  options: string[];                        // 选项列表
  required: boolean;                        // 是否必填
  allowSkip: boolean;                       // 是否可跳过
};

// 建议反馈
type GlucoseFollowUpAdvice = {
  level: 'info' | 'attention' | 'urgent';   // 提醒级别
  summary: string;                          // 建议摘要
};

// 完整返回
type GlucoseFollowUpResult = {
  shouldAskFollowUp: boolean;               // 是否需要追问
  intent: GlucoseFollowUpIntent;            // 追问意图
  urgency: 'low' | 'medium' | 'high';      // 紧急程度
  summary: string;                          // 追问原因摘要
  questions: GlucoseFollowUpQuestion[];     // 追问题目列表
  advice?: GlucoseFollowUpAdvice;           // 给患者的即时建议
};
```

---

## 六、前端/语音助手对接建议

### 场景 1：患者通过语音说"血糖 9.6"

1. `vitalSignParser` 提取 `glucoseValue=9.6`，`glucoseContext=unknown`
2. 系统自动调用 `glucose-follow-up?glucoseValue=9.6`
3. 返回 `intent=collect_context`，追问"这是空腹还是餐后？"
4. 患者回答"餐后"
5. 系统再调用 `glucose-follow-up?glucoseValue=9.6&glucoseContext=post_meal`
6. 返回 `shouldAskFollowUp=false`（9.6 餐后在可接受范围），直接记录

### 场景 2：患者说"餐后血糖 12.3"

1. 提取 `glucoseValue=12.3`，`glucoseContext=post_meal`
2. 系统调用 follow-up，返回 `intent=meal_details`
3. 追问"这餐主食量和平时比怎么样？"
4. 患者选"偏多"，系统记录后给出简短建议，结束

### 场景 3：患者说"血糖 2.8"

1. 提取 `glucoseValue=2.8`
2. 系统调用 follow-up，返回 `intent=hypoglycemia_risk`，`urgency=high`
3. **立即显示安全提醒**："血糖明显偏低，请尽快补充糖分"
4. 同时追问是否有症状、是否已补糖
5. 若选"还没有补充"，再次强调安全建议

---

## 七、产品体验守则

| 原则 | 说明 |
|------|------|
| 🎯 单次最多追问 2 题 | 避免患者觉得像审问 |
| ⏭️ 所有非必填题可跳过 | 患者选"跳过"不影响记录 |
| 🧠 能推断就不追问 | 如果刚录过饮食，不重复问吃了什么 |
| ⏰ 利用时间自动推断 | 早上 6～8 点默认空腹，12～14 点默认餐后 |
| 🔬 正常范围不追问 | 大多数记录应该零追问直接完成 |
| 🚨 低血糖先安全后记录 | 安全提醒 > 信息完整性 |
| 📈 连续异常才升级 | 偶发一次不深问，连续 3 天才加问用药/应激 |

---

## 八、小智 AI（MCP）集成

追问 SOP 已自动接入小智 AI 的 `record_vitals` 工具。完整流程如下：

```
患者对小智说："血糖 9.6"
  │
  ├── 小智 LLM 识别意图 → 调用 record_vitals(metric_type="blood_glucose", glucose_value=9.6)
  │
  ├── MCP server.py → 先调 POST /vital-measurements 写入记录
  │                 → 再调 GET /glucose-follow-up?glucoseValue=9.6 获取追问建议
  │
  ├── 返回结果包含 follow_up 字段：
  │   {
  │     "should_ask": true,
  │     "intent": "collect_context",
  │     "prompt_for_ai": "请追问患者：这次血糖是空腹、餐前、餐后还是睡前测的？选项：空腹、餐前、餐后、睡前、不确定"
  │   }
  │
  └── 小智 LLM 读取 prompt_for_ai → 用自然语言追问患者
      → "这次血糖是空腹测的还是饭后测的呀？"
```

**关键实现点：**

| 文件 | 改动 |
|------|------|
| `mcp-xiaozhi/client.py` | 新增 `get_glucose_follow_up()` 方法调用服务端 API |
| `mcp-xiaozhi/server.py` | `record_vitals` 血糖记录后自动调用追问 API，返回 `follow_up` + `prompt_for_ai` |
| `record_vitals` docstring | 增加指令：LLM 收到 `follow_up.should_ask=true` 时必须按指令追问 |

**LLM 追问行为约束（写在工具描述中）：**

- urgency=high 或 advice.level=urgent 时，优先告知安全提醒
- 每次只追问 1 个问题，不要一次问完
- 可跳过的问题患者不想答就跳过
- 用温和关心的语气

---

## 九、代码文件索引

| 文件 | 说明 |
|------|------|
| `server/src/services/glucoseFollowUpService.ts` | 核心决策引擎：根据血糖值+场景+历史趋势生成追问建议 |
| `server/src/controllers/patientController.ts` | `getGlucoseFollowUp` 方法：查询近期记录并调用决策引擎 |
| `server/src/routes/patients.ts` | `GET /:id/glucose-follow-up` 路由注册 |
| `mcp-xiaozhi/client.py` | API 客户端：新增 `get_glucose_follow_up()` |
| `mcp-xiaozhi/server.py` | MCP 工具：`record_vitals` 自动集成追问 SOP |
| `GLUCOSE_FOLLOWUP_SOP.md` | 本文档 |
