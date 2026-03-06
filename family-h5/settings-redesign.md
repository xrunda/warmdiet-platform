# 设置页面布局重新设计方案

## 🎯 问题分析

**当前问题**：
- 老人阅读模式、设备绑定、授权管理放在最上面
- 这些功能不常用，占用大量空间
- 用户需要滚动才能看到常用的健康档案、用药管理等

**设计目标**：
- 常用功能放在上面（健康档案、用药管理、医嘱信息）
- 不常用功能移到底部或折叠
- 减少视觉干扰，提升用户体验

## 📐 新的布局方案

### 方案 A：折叠式布局（推荐）

```
┌─────────────────────────────────────────────┐
│  个人中心                        [保存修改]  │
│  维护老人健康档案与设备连接                   │
├─────────────────────────────────────────────┤
│                                             │
│  👤 基本信息                                │
│  ├─ 姓名、称呼                              │
│  └─ 年龄、性别                              │
│                                             │
│  📋 健康档案                                │
│  ├─ 基础疾病                                │
│  └─ 手术史                                  │
│                                             │
│  💊 用药管理                                │
│  ├─ 氨氯地平 (降压)                         │
│  └─ 阿托伐他汀 (降脂)                       │
│                                             │
│  🏥 医嘱信息                                │
│  └─ "术后三个月内严禁..."                  │
│                                             │
│  🍽️ 偏好配置                                │
│  ├─ 口味偏好                                │
│  ├─ 喜欢的食物                              │
│  └─ 忌口食物                                │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🔧 系统设置                    [▼]  │   │
│  │ • 老人阅读模式                        │   │
│  │ • 设备绑定                            │   │
│  │ • 授权管理                            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [退出登录]                                 │
└─────────────────────────────────────────────┘
```

**点击展开后**：
```
┌─────────────────────────────────────────────┐
│  🔧 系统设置                              [▲] │
├─────────────────────────────────────────────┤
│                                             │
│  👁️ 老人阅读模式                            │
│  自动放大字体、增大行距并强化信息可读性       │
│  [去开启]                                    │
│                                             │
│  🔊 设备绑定                                │
│  小爱音箱  ● 已连接 (客厅音箱)  [解除绑定]    │
│                                             │
│  🔐 授权管理                    [+ 添加授权]  │
│  已授权医生列表 (2)                          │
│  └─ 👤 王医生 ...                           │
│                                             │
└─────────────────────────────────────────────┘
```

### 方案 B：卡片式横向滚动

```
┌─────────────────────────────────────────────┐
│  个人中心                        [保存修改]  │
│  维护老人健康档案与设备连接                   │
├─────────────────────────────────────────────┤
│                                             │
│  🎯 快捷设置                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐                │
│  │ 👁️ │  │ 🔊 │  │ 🔐 │                │
│  │阅读 │  │设备 │  │授权 │                │
│  │模式 │  │绑定 │  │管理 │                │
│  └─────┘  └─────┘  └─────┘                │
│   [开启]    [已连]   [2人]                 │
│                                             │
│  👤 基本信息                                │
│  ├─ 姓名、称呼                              │
│  └─ 年龄、性别                              │
│                                             │
│  📋 健康档案                                │
│  ├─ 基础疾病                                │
│  └─ 手术史                                  │
│                                             │
│  ...                                        │
└─────────────────────────────────────────────┘
```

### 方案 C：底部抽屉式

```
┌─────────────────────────────────────────────┐
│  个人中心                        [保存修改]  │
│  维护老人健康档案与设备连接                   │
├─────────────────────────────────────────────┤
│                                             │
│  👤 基本信息                                │
│  ├─ 姓名、称呼                              │
│  └─ 年龄、性别                              │
│                                             │
│  📋 健康档案                                │
│  ├─ 基础疾病                                │
│  └─ 手术史                                  │
│                                             │
│  💊 用药管理                                │
│  ├─ 氨氯地平 (降压)                         │
│  └─ 阿托伐他汀 (降脂)                       │
│                                             │
│  🏥 医嘱信息                                │
│  └─ "术后三个月内严禁..."                  │
│                                             │
│  🍽️ 偏好配置                                │
│  ├─ 口味偏好                                │
│  ├─ 喜欢的食物                              │
│  └─ 忌口食物                                │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ [退出登录]  [系统设置 ▶]           │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**点击"系统设置"后弹出底部抽屉**：
```
┌─────────────────────────────────────────────┐
│  系统设置                              [✕]  │
├─────────────────────────────────────────────┤
│                                             │
│  👁️ 老人阅读模式                            │
│  自动放大字体、增大行距并强化信息可读性       │
│  [去开启]                                    │
│                                             │
│  ─────────────────────────────────────      │
│                                             │
│  🔊 设备绑定                                │
│  小爱音箱  ● 已连接 (客厅音箱)  [解除绑定]    │
│                                             │
│  ─────────────────────────────────────      │
│                                             │
│  🔐 授权管理                    [+ 添加授权]  │
│  已授权医生列表 (2)                          │
│  └─ 👤 王医生 ...                           │
│                                             │
└─────────────────────────────────────────────┘
           ↑ 从底部滑出
```

## 🎯 推荐方案：方案 A（折叠式）

### 优点
✅ 节省空间，不常用功能默认折叠
✅ 常用功能在最上面，一目了然
✅ 可以按需展开查看详情
✅ 保持页面整洁，减少视觉干扰
✅ 用户可以控制是否显示

### 缺点
❌ 需要点击才能看到系统设置
❌ 多了一次交互步骤

### 适用场景
- 系统设置功能不常用
- 用户更关注健康档案、用药管理等核心功能
- 希望保持页面简洁

## 📐 详细设计

### 1. 折叠组件结构

```tsx
const SystemSettingsCollapsible = ({
  elderMode,
  onElderModeChange,
  isSpeakerBound,
  setIsSpeakerBound,
}: {
  elderMode: boolean;
  onElderModeChange: (value: boolean) => void;
  isSpeakerBound: boolean;
  setIsSpeakerBound: (value: boolean) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-base text-gray-800">系统设置</h2>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-text-sub" />
        </motion.div>
      </button>

      {/* Content - Expandable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* 老人阅读模式 */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="text-sm font-bold text-text-main">老人阅读模式</h3>
                      <p className="text-xs text-text-sub mt-0.5">
                        放大字体、增大行距
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onElderModeChange(!elderMode)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  >
                    {elderMode ? "已开启" : "去开启"}
                  </button>
                </div>
              </div>

              {/* 设备绑定 */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="text-sm font-bold text-text-main">小爱音箱</h3>
                      <p className="text-xs text-text-sub mt-0.5">
                        {isSpeakerBound ? "已连接" : "未绑定"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSpeakerBound(!isSpeakerBound)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  >
                    {isSpeakerBound ? "解除绑定" : "立即绑定"}
                  </button>
                </div>
              </div>

              {/* 授权管理 */}
              <AuthorizationManagement />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
```

### 2. 完整的 SettingsScreen 布局

```tsx
const SettingsScreen = ({
  elderMode,
  onElderModeChange,
}: {
  elderMode: boolean;
  onElderModeChange: (value: boolean) => void;
}) => {
  const [isSpeakerBound, setIsSpeakerBound] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto bg-brand-bg pb-24 hide-scrollbar">
      {/* Header */}
      <header className="bg-white px-4 pt-safe pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-text-main">个人中心</h1>
          <button className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
            保存修改
          </button>
        </div>
        <p className="text-sm text-text-hint">维护老人健康档案与设备连接</p>
      </header>

      <main className="p-4 space-y-4">
        {/* 👤 基本信息 - 常用功能 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <User className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-base text-gray-800">基本信息</h2>
          </div>
          {/* 基本信息 content */}
        </section>

        {/* 📋 健康档案 - 常用功能 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <History className="w-5 h-5 text-rose-500" />
            <h2 className="font-bold text-base text-gray-800">健康档案</h2>
          </div>
          {/* 健康档案 content */}
        </section>

        {/* 💊 用药管理 - 常用功能 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <Pill className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-base text-gray-800">用药管理</h2>
          </div>
          {/* 用药管理 content */}
        </section>

        {/* 🏥 医嘱信息 - 常用功能 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <Stethoscope className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-base text-gray-800">医嘱信息</h2>
          </div>
          {/* 医嘱信息 content */}
        </section>

        {/* 🍽️ 偏好配置 - 中等频率 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <Utensils className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-base text-gray-800">偏好配置</h2>
          </div>
          {/* 偏好配置 content */}
        </section>

        {/* 🔧 系统设置 - 不常用，折叠式 */}
        <SystemSettingsCollapsible
          elderMode={elderMode}
          onElderModeChange={onElderModeChange}
          isSpeakerBound={isSpeakerBound}
          setIsSpeakerBound={setIsSpeakerBound}
        />

        {/* 退出登录 */}
        <button className="w-full py-4 text-brand-red font-bold text-sm bg-white rounded-2xl shadow-sm border border-red-50">
          退出登录
        </button>
      </main>
    </div>
  );
};
```

## 📊 对比分析

| 方案 | 空间占用 | 易用性 | 视觉效果 | 推荐度 |
|------|---------|--------|---------|--------|
| 方案 A（折叠式） | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 方案 B（横向滚动） | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 方案 C（底部抽屉） | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## 🎯 最终推荐

**使用方案 A（折叠式）**，原因：
1. ✅ 节省空间，不常用功能默认隐藏
2. ✅ 常用功能在最上面，优先展示
3. ✅ 用户可以按需展开，灵活性高
4. ✅ 保持页面整洁，视觉效果好
5. ✅ 符合移动端设计规范