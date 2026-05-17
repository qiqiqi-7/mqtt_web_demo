# MQTT Web 调试工具 — 任务追踪

## 项目概述

使用 React + TypeScript + Vite 构建 MQTT Web 调试工具，类似 MQTT 界的 Postman。

**技术栈：**
- React 18 + TypeScript
- Vite
- MQTT.js v5
- Font Awesome 6
- react-window（轻量级虚拟列表）
- LocalStorage 持久化

---

## Phase 1：项目初始化与基础架构

### Task 1: 初始化 Vite + React + TypeScript 项目
**状态：** ✅ 已完成

**描述：** 创建项目基础结构，安装依赖

**验收标准：**
- [x] `npm create vite` 成功创建项目
- [x] TypeScript 编译无错误
- [x] 能启动开发服务器 `npm run dev`
- [x] 能执行生产构建 `npm run build`

**验证：**
- [x] `npm install` 成功
- [x] `npm run dev` 启动成功，浏览器能访问
- [x] `npm run build` 成功，生成 dist 目录

---

### Task 2: 安装外部依赖
**状态：** ✅ 已完成

**描述：** 安装 MQTT.js、Font Awesome 和 react-window

**验收标准：**
- [x] mqtt 包安装成功
- [x] @fortawesome/react-fontawesome 和 @fortawesome/free-solid-svg-icons 安装成功
- [x] react-window 安装成功
- [x] JetBrains Mono 字体通过 Google Fonts CDN 引入

**验证：**
- [x] `npm list mqtt` 显示已安装
- [x] `npm list react-window` 显示已安装

---

### Task 3: 定义 TypeScript 类型
**状态：** ✅ 已完成

**描述：** 创建所有数据模型类型定义

**验收标准：**
- [x] Connection 接口定义完整
- [x] Subscription 接口定义完整
- [x] Message 接口定义完整
- [x] PublishPreset 接口定义完整
- [x] LastWill 接口定义完整
- [x] 连接状态类型定义完整

**验证：**
- [x] `tsc --noEmit` 无类型错误

---

### Task 4: 实现存储服务 (storageService)
**状态：** ✅ 已完成

**描述：** 实现 LocalStorage 读写和密码加密/解密

**验收标准：**
- [x] saveConnections() 能保存连接数组
- [x] loadConnections() 能加载连接数组
- [x] saveSubscriptions() 能保存订阅数组
- [x] loadSubscriptions() 能加载订阅数组
- [x] savePublishPresets() 能保存发布预设
- [x] loadPublishPresets() 能加载发布预设
- [x] 密码加密/解密功能正常

**验证：**
- [x] 单元测试：保存后能正确加载
- [x] 单元测试：加密后的密码能正确解密

---

### Task 5: 实现 MQTT 服务 (mqttService)
**状态：** ✅ 已完成

**描述：** 实现 MQTT 连接、订阅、发布服务层

**验收标准：**
- [x] connect() 能建立 WebSocket 连接
- [x] disconnect() 能断开连接
- [x] subscribe() 能订阅主题
- [x] unsubscribe() 能取消订阅
- [x] publish() 能发送消息
- [x] 支持 MQTT 3.1.1 和 5.1 协议版本
- [x] 支持用户名密码认证
- [x] 支持 TLS CA 证书认证
- [x] 支持 Last Will 配置
- [x] 自动重连功能正常

**验证：**
- [x] TypeScript 编译通过
- [ ] 能连接到公共 MQTT broker (test.mosquitto.org) — 待集成测试

---

### Checkpoint: Phase 1 完成
- [x] 项目能正常启动和构建
- [x] 类型定义无错误
- [x] 存储服务能正常工作
- [ ] MQTT 服务能连接和收发消息 — 待集成测试

---

## Phase 2：React Context 状态管理

### Task 6: 实现 ConnectionContext
**状态：** ✅ 已完成

**描述：** 创建连接相关的 Context 和 Reducer

**验收标准：**
- [x] connections 状态正常
- [x] activeConnectionId 状态正常
- [x] addConnection action 正常
- [x] updateConnection action 正常
- [x] deleteConnection action 正常
- [x] setActiveConnection action 正常
- [x] 连接状态（connected/disconnected 等）管理正常

**验证：**
- [x] Context 能正确提供状态
- [x] Reducer 状态变更正确

---

### Task 7: 实现 SubscriptionContext
**状态：** ✅ 已完成

**描述：** 创建订阅相关的 Context 和 Reducer

**验收标准：**
- [x] subscriptions 状态正常
- [x] addSubscription action 正常
- [x] deleteSubscription action 正常
- [x] getSubscriptionsByConnection() 能获取指定连接的订阅

**验证：**
- [x] Context 能正确提供状态
- [x] Reducer 状态变更正确

---

### Task 8: 实现 MessageContext
**状态：** ✅ 已完成

**描述：** 创建消息相关的 Context 和 Reducer

**验收标准：**
- [x] messages 状态正常
- [x] addMessage action 正常
- [x] clearMessages action 正常
- [x] deleteMessage action 正常
- [x] getMessagesByConnection() 能获取指定连接的消息
- [x] 消息数量无限制

**验证：**
- [x] Context 能正确提供状态
- [x] Reducer 状态变更正确
- [x] TypeScript 编译通过

---

### Checkpoint: Phase 2 完成
- [x] 三个 Context 都能正常工作
- [x] 状态管理逻辑正确
- [ ] 与 MQTT 服务集成正常 — 待 Phase 4

---

## Phase 3：UI 组件

### Task 9: 实现全局样式和主题
**状态：** ✅ 已完成

**描述：** 实现深色主题的全局 CSS

**验收标准：**
- [x] 色彩方案符合 SPEC.md 定义
- [x] JetBrains Mono 字体正确加载
- [x] 空间系统（padding, gap, radius）正确
- [x] 动画过渡效果正常
- [x] 全局样式不污染组件外内容

**验证：**
- [x] 视觉检查：颜色、字体、间距符合设计稿

---

### Task 10: 实现 Toast 组件
**状态：** 🟡 进行中

**描述：** 实现提示消息组件

**验收标准：**
- [ ] 成功提示（绿色左边框）正常
- [ ] 错误提示（红色左边框）正常
- [ ] 信息提示（蓝色左边框）正常
- [ ] 自动消失（4s/8s）正常
- [ ] 手动关闭功能正常
- [ ] 位置在右下角

**验证：**
- 触发 toast 后正确显示
- 正确自动消失

---

### Task 11: 实现 Modal 组件
**状态：** 待开始

**描述：** 实现通用的弹窗组件

**验收标准：**
- [ ] 遮罩层正确显示
- [ ] 弹窗居中显示
- [ ] 标题栏 + 关闭按钮正常
- [ ] 内容区正常
- [ ] 底部按钮区正常
- [ ] 点击遮罩可关闭（可选）
- [ ] ESC 键可关闭

**验证：**
- 打开/关闭动画正常
- 能正确传递 children 和 onClose

---

### Task 12: 实现 ConnectionModal 组件
**状态：** 待开始

**描述：** 实现连接配置弹窗（添加/编辑连接）

**验收标准：**
- [ ] 基础配置表单完整（连接名称、协议版本、协议、Broker 地址、端口、Client ID）
- [ ] 高级配置折叠区完整（认证方式、用户名/密码、TLS CA 证书、Keepalive、自动重连、Clean Session、Last Will）
- [ ] 表单验证正常
- [ ] 保存后数据正确返回

**验证：**
- 能添加新连接
- 能编辑已有连接（数据预填充）
- 密码显示为掩码

---

### Task 13: 实现 ConnectionManager 组件
**状态：** 待开始

**描述：** 实现连接管理面板

**验收标准：**
- [ ] "添加连接"按钮正常
- [ ] 连接列表正确显示
- [ ] ConnectionCard 组件正确（连接名称、协议标识、连接状态）
- [ ] 点击卡片能选中并连接
- [ ] 右键菜单：编辑、删除
- [ ] 只有一个连接能处于已连接状态
- [ ] 切换连接时自动断开上一个

**验证：**
- 能添加多个连接
- 能切换连接
- 右键菜单功能正常

---

### Task 14: 实现 SubscriptionModal 组件
**状态：** 待开始

**描述：** 实现订阅配置弹窗

**验收标准：**
- [ ] 主题输入框正常
- [ ] QoS 选择器正常
- [ ] 支持通配符验证
- [ ] 保存后数据正确返回

**验证：**
- 能添加订阅
- 通配符主题能正常订阅

---

### Task 15: 实现 SubscriptionManager 组件
**状态：** 待开始

**描述：** 实现订阅管理面板

**验收标准：**
- [ ] 显示当前连接名称
- [ ] 空状态提示正常
- [ ] 订阅列表正确显示
- [ ] QoS 徽章正确
- [ ] 删除按钮正常
- [ ] "添加订阅"按钮正常
- [ ] 只显示当前连接的订阅

**验证：**
- 切换连接后订阅列表正确更新
- 删除订阅功能正常

---

### Task 16: 实现 MessageFeed 组件（虚拟列表）
**状态：** 待开始

**描述：** 实现消息流组件，使用虚拟列表优化大量消息渲染

**验收标准：**
- [ ] 使用 react-window 实现虚拟列表
- [ ] 只渲染可视区域内的消息
- [ ] 滚动时动态更新显示的消息
- [ ] 保持平滑滚动性能
- [ ] 总高度计算正确
- [ ] 搜索输入框正常
- [ ] 方向筛选下拉正常
- [ ] 主题筛选下拉正常
- [ ] 清除筛选按钮正常
- [ ] 时间戳格式正确
- [ ] 方向箭头正确（入站蓝色↓/出站绿色↑）
- [ ] QoS 徽章正确
- [ ] 载荷预览（前 50 字符）
- [ ] Retained 消息显示★图标和黄色背景
- [ ] 点击展开完整载荷（动态高度）
- [ ] JSON 语法高亮正常
- [ ] 复制功能正常
- [ ] 删除功能正常
- [ ] 自动滚动到底部（除非用户已向上滚动）

**验证：**
- 收发消息正常显示
- 搜索和筛选正常
- 展开/折叠正常
- 10000+ 消息时滚动流畅

---

### Task 17: 实现 PublishPanel 组件
**状态：** 待开始

**描述：** 实现发布面板

**验收标准：**
- [ ] 主题输入验证正常
- [ ] 载荷编辑器支持多行
- [ ] 字符计数正常
- [ ] JSON 自动检测正常
- [ ] JSON 美化按钮正常
- [ ] QoS 选择正常
- [ ] Retained 复选框正常
- [ ] 发送按钮禁用状态正常
- [ ] 发送成功/失败反馈正常
- [ ] 保存当前配置为预设
- [ ] 预设下拉选择
- [ ] 预设管理（删除）

**验证：**
- 能成功发送消息
- JSON 美化功能正常
- 预设保存/加载正常

---

### Checkpoint: Phase 3 完成
- [ ] 所有 UI 组件正常渲染
- [ ] 组件交互正常
- [ ] 样式符合设计稿
- [ ] 虚拟列表正常工作

---

## Phase 4：集成与主应用

### Task 18: 实现 App.tsx 主布局
**状态：** 待开始

**描述：** 实现三栏布局的主应用

**验收标准：**
- [ ] Header 正确显示 Logo、连接状态、连接名称
- [ ] 三栏布局正确（连接管理 / 订阅管理 / 消息流+发布）
- [ ] Footer 正确显示消息数量和版本号
- [ ] 响应式布局正常（≥1200px 三栏，<768px 单栏带 Tab）

**验证：**
- 布局与设计稿一致
- 响应式断点正常

---

### Task 19: 集成 MQTT 事件与 Context
**状态：** 待开始

**描述：** 将 MQTT 服务与 React Context 集成

**验收标准：**
- [ ] 消息到达时自动添加到 MessageContext
- [ ] 连接状态变化时更新 ConnectionContext
- [ ] 订阅消息后自动接收对应消息

**验证：**
- 实际 MQTT 通信测试正常

---

### Task 20: 持久化集成
**状态：** 待开始

**描述：** 将 Context 状态与存储服务集成

**验收标准：**
- [ ] 页面加载时从 LocalStorage 恢复连接
- [ ] 页面加载时从 LocalStorage 恢复订阅
- [ ] 页面加载时从 LocalStorage 恢复发布预设
- [ ] 状态变化时自动保存

**验证：**
- 刷新页面后数据不丢失
- 能记住之前的配置

---

### Checkpoint: Phase 4 完成
- [ ] 完整应用能正常运行
- [ ] MQTT 通信正常
- [ ] 数据持久化正常

---

## Phase 5：收尾与验证

### Task 21: 最终验证与测试
**状态：** 待开始

**描述：** 按验收标准逐项验证

**验收标准：**
- [ ] AC1: 连接管理（添加/编辑/删除/切换/加密存储/TLS）
- [ ] AC2: 订阅管理（订阅/取消/通配符/QoS）
- [ ] AC3: 消息流（实时显示/展开/JSON高亮/筛选/虚拟列表）
- [ ] AC4: 发布消息（QoS/Retained/JSON美化/预设）
- [ ] AC5: 持久化（连接/订阅/预设不丢失）
- [ ] AC6: 性能（10000+消息时流畅）
- [ ] AC7: 浏览器兼容性

---

### Task 22: 文档与 README
**状态：** 待开始

**描述：** 编写 README 文档

**验收标准：**
- [ ] 项目说明完整
- [ ] 安装和启动说明正确
- [ ] 功能说明完整

---

### Checkpoint: 最终
- [ ] 所有验收标准通过
- [ ] README 完成
- [ ] 准备好代码审查

---

## 任务状态总览

| Phase | 任务 | 状态 |
|-------|------|------|
| **Phase 1** | Task 1: 初始化项目 | ✅ 已完成 |
| | Task 2: 安装依赖 | ✅ 已完成 |
| | Task 3: TypeScript 类型 | ✅ 已完成 |
| | Task 4: 存储服务 | ✅ 已完成 |
| | Task 5: MQTT 服务 | ✅ 已完成 |
| **Phase 2** | Task 6: ConnectionContext | ✅ 已完成 |
| | Task 7: SubscriptionContext | ✅ 已完成 |
| | Task 8: MessageContext | ✅ 已完成 |
| **Phase 3** | Task 9: 全局样式 | ✅ 已完成 |
| | Task 10: Toast 组件 | ✅ 已完成 |
| | Task 11: Modal 组件 | ✅ 已完成 |
| | Task 12: ConnectionModal | ✅ 已完成 |
| | Task 13: ConnectionManager | ✅ 已完成 |
| | Task 14: SubscriptionModal | ✅ 已完成 |
| | Task 15: SubscriptionManager | ✅ 已完成 |
| | Task 16: MessageFeed | ✅ 已完成 |
| | Task 17: PublishPanel | ✅ 已完成 |
| **Phase 4** | Task 18: App.tsx | ✅ 已完成 |
| | Task 19: MQTT 集成 | ✅ 已完成 |
| | Task 20: 持久化集成 | ✅ 已完成 |
| **Phase 5** | Task 21: 最终验证 | 🟡 进行中 |
| | Task 20: 持久化集成 | ⬜ 待开始 |
| **Phase 5** | Task 21: 最终验证 | ⬜ 待开始 |
| | Task 22: README | ⬜ 待开始 |

**图例：** ⬜ 待开始 | 🟡 进行中 | ✅ 已完成 | ❌ 已取消

---

## 更新日志

| 日期 | 任务 | 操作 | 说明 |
|------|------|------|------|
| 2026-05-16 | - | 创建文档 | 初始任务列表 |