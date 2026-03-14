# 医生端统一按钮组件

## 概述

本目录包含医生端通用的按钮组件，用于统一管理按钮样式和行为。

## 组件列表

### 1. LogoutButton - 退出登录按钮

用于侧边栏底部的退出登录操作，样式为深色背景。

```tsx
import { LogoutButton } from '../common/ActionButtons';

// 默认用法
<LogoutButton />

// 全宽模式（侧边栏底部）
<LogoutButton fullWidth />

// 仅图标模式
<LogoutButton showLabel={false} />

// 自定义样式
<LogoutButton className="mt-4" />
```

### 2. BackButton - 返回按钮

用于页面顶部的返回操作，样式为浅色背景。

```tsx
import { BackButton } from '../common/ActionButtons';

// 默认用法
<BackButton onClick={handleBack} />

// 自定义文字
<BackButton onClick={handleBack} label="返回患者列表" />

// 自定义图标
<BackButton onClick={handleBack} icon={ArrowLeft} label="返回" />

// 自定义样式
<BackButton onClick={handleBack} className="ml-auto" />
```

### 3. CloseButton - 关闭按钮

用于弹窗、模态框的关闭操作。

```tsx
import { CloseButton } from '../common/ActionButtons';

// 默认用法
<CloseButton onClick={handleClose} />

// 自定义大小
<CloseButton onClick={handleClose} size={20} />

// 自定义样式
<CloseButton onClick={handleClose} className="absolute top-4 right-4" />
```

### 4. PrimaryButton - 主要操作按钮

用于最重要的操作，如提交、保存等。支持蓝色和绿色两种主题。

```tsx
import { PrimaryButton } from '../common/ActionButtons';

// 蓝色主题（默认）
<PrimaryButton onClick={handleSubmit}>提交</PrimaryButton>

// 绿色主题
<PrimaryButton onClick={handleSubmit} variant="green">确认</PrimaryButton>

// 禁用状态
<PrimaryButton onClick={handleSubmit} disabled>提交</PrimaryButton>

// 加载状态
<PrimaryButton onClick={handleSubmit} loading>提交</PrimaryButton>
```

### 5. SecondaryButton - 次要操作按钮

用于次要操作，如取消、重置等。支持浅色和深色两种主题。

```tsx
import { SecondaryButton } from '../common/ActionButtons';

// 浅色主题（默认）
<SecondaryButton onClick={handleCancel}>取消</SecondaryButton>

// 深色主题
<SecondaryButton onClick={handleCancel} variant="dark">取消</SecondaryButton>
```

### 6. TextButton - 文字按钮

用于轻量级操作，如链接形式的操作。

```tsx
import { TextButton } from '../common/ActionButtons';

// 蓝色文字（默认）
<TextButton onClick={handleEdit}>编辑</TextButton>

// 灰色文字
<TextButton onClick={handleEdit} variant="gray">删除</TextButton>
```

## 样式配置

所有按钮样式由 `src/styles/buttonStyles.ts` 统一管理。如需调整全局按钮样式，请修改该文件。

### 样式分类

- **退出登录按钮** - 深色半透明背景，红色 hover 效果
- **返回按钮** - 浅色背景，灰色边框
- **关闭按钮** - 无背景，灰色文字
- **主要按钮** - 渐变背景，带阴影效果
- **次要按钮** - 边框样式，浅色或深色主题
- **文字按钮** - 无背景，仅文字颜色变化

## 最佳实践

1. **退出登录按钮** - 仅用于侧边栏底部，使用 `fullWidth` 属性
2. **返回按钮** - 用于页面顶部导航，通常与 `onBack` 配合使用
3. **关闭按钮** - 用于弹窗/模态框，统一使用 ✕ 符号
4. **主要按钮** - 用于最重要的操作，每个页面通常只有一个
5. **次要按钮** - 用于次要操作，可与主要按钮成对出现
6. **文字按钮** - 用于轻量级操作，如表格中的编辑/删除链接

## 统一导出

可以通过公共索引文件导入所有组件：

```tsx
import {
  LogoutButton,
  BackButton,
  CloseButton,
  PrimaryButton,
  SecondaryButton,
  TextButton,
} from '../common';
```
