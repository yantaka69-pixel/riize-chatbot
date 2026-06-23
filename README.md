# RIIZE 虚拟聊天模拟器

粉丝向虚拟聊天网页程序 — 选择 RIIZE 成员，体验类似 Bubble/Weverse 私信的虚拟聊天互动。

> **免责声明**：本程序为粉丝向虚拟聊天模拟器，所有回复均由 AI 生成，不代表 RIIZE 成员本人，也不代表官方立场。本程序不提供真实艺人私人信息、联系方式或真实行程。

## 功能特点

- 🎭 **6位RIIZE成员** — Shotaro、Eunseok、Sungchan、Wonbin、Sohee、Anton（固定顺序）
- 💬 **5种聊天模式** — 日常聊天、情绪安慰、学习鼓励、恋爱感陪聊、韩语练习
- 😊 **7种今日心情** — 影响AI回复风格
- 💕 **7档亲密度系统** — 初识粉丝 → 专属陪伴，只增不减
- 📱 **手机优先适配** — iPhone/安卓完美适配
- 🔔 **主动消息** — 每日首聊、亲密度升级、长时间缺席自动触发
- 🔒 **设置管理** — 管理密码保护、API配置、成员人设编辑、数据管理

## 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **后端**: Express.js + TypeScript + better-sqlite3 (SQLite)
- **AI接口**: OpenAI-compatible API（支持配置切换）

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 1. 安装依赖

```bash
cd client && npm install
cd ../server && npm install
```

### 2. 配置环境变量

```bash
cd server
cp .env.example .env
```

编辑 `.env`，填入你的 AI API Key（推荐硅基流动，完全免费）：

```env
# 【推荐】硅基流动 SiliconFlow — 完全免费，不限额度
# 注册地址：https://cloud.siliconflow.cn
# 获取 API Key：登录后 → 左侧菜单「API密钥」→ 创建密钥 → 复制 sk-xxx
OPENAI_API_KEY=sk-你从硅基流动获取的密钥
OPENAI_BASE_URL=https://api.siliconflow.cn/v1
OPENAI_MODEL=Qwen/Qwen2.5-7B-Instruct

# 【备选】DeepSeek — 注册送 $52 免费额度，中文质量最好
# OPENAI_API_KEY=sk-你从DeepSeek获取的key
# OPENAI_BASE_URL=https://api.deepseek.com/v1
# OPENAI_MODEL=deepseek-chat

ADMIN_PASSWORD=admin123
```

> 💡 **获取 API Key 步骤（硅基流动）**：
> 1. 打开 https://cloud.siliconflow.cn → 注册账号（手机号或邮箱）
> 2. 登录后 → 左侧菜单「API密钥」→ 点击「创建密钥」
> 3. 复制生成的 `sk-xxx` 密钥
> 4. 粘贴到 `.env` 文件的 `OPENAI_API_KEY=` 后面
> 5. 保存文件即可

### 3. 初始化数据库

```bash
cd server && npm run db:init
```

### 4. 启动开发服务器

```bash
# 终端1 - 后端
cd server && npm run dev
# 后端运行在 http://localhost:3001

# 终端2 - 前端
cd client && npm run dev
# 前端运行在 http://localhost:5173
```

### 5. 开始使用

浏览器打开 http://localhost:5173

> 如果没有填写有效的 API Key，聊天时将使用本地兜底回复（成员专属的几句预设回复），不会崩溃。

> 也可以在网页的**设置页**（管理密码默认 `admin123`）中在线修改 API Key、切换供应商。

### 6. 生产模式运行（前后端合并）

```bash
# 构建前端
cd client && npm run build

# 构建后端
cd server && npm run build

# 启动生产服务器（Express 同时提供 API 和前端静态文件）
cd server && node dist/index.js
# 访问 http://localhost:3001 即可使用完整功能
```

## 云平台部署（Render 免费）

### 步骤1：准备项目

确保项目能构建成功：
```bash
cd client && npm run build
cd ../server && npm run build
```

### 步骤2：在 Render 创建服务

1. 注册 Render 账号：https://render.com （免费套餐）
2. 点击「New」→「Web Service」
3. 连接你的 GitHub 仓库（或直接上传）
4. 配置：
   - **Build Command**: `cd client && npm install && npm run build && cd ../server && npm install && npm run build`
   - **Start Command**: `cd server && node dist/index.js`
   - **Environment Variables**:
     ```
     OPENAI_API_KEY    = sk-afbfokpvnqdaewryitdtlsznijxpoikdukxaxgfzajkrybih
     OPENAI_BASE_URL   = https://api.siliconflow.cn/v1
     OPENAI_MODEL      = Qwen/Qwen2.5-7B-Instruct
     ADMIN_PASSWORD    = admin123
     PORT              = 10000
     NODE_ENV          = production
     ```
5. 点击「Create Web Service」

> ⚠️ **注意**：SQLite 数据库在 Render 上是 ephemeral 的（重启后数据会丢失）。如果需要持久化数据，建议后续迁移到 PostgreSQL 或 Supabase。

### 步骤3：自定义域名（可选）

Render 默认分配 `xxx.onrender.com` 名。可在设置页绑定自定义域名。

---

## 页面流程

1. **登录页** → 输入昵称（无密码，基于设备ID识别）
2. **心情页** → 选择今日心情（7选项）
3. **成员页** → 选择 RIIZE 成员（显示亲密度、最后消息、红点）
4. **模式页** → 选择聊天模式（5选项）
5. **聊天页** → 与虚拟成员对话

## 亲密度系统

| 等级 | 称呼 | 分数范围 |
|------|------|----------|
| Lv.1 | 初识粉丝 | 0-99 |
| Lv.2 | 熟粉丝 | 100-299 |
| Lv.3 | 常来聊天的人 | 300-599 |
| Lv.4 | 熟悉朋友 | 600-999 |
| Lv.5 | 亲近粉丝 | 1000-1999 |
| Lv.6 | 特别在意的人 | 2000-3999 |
| Lv.7 | 专属陪伴 | 4000+ |

加分规则：发消息+3、每日首聊+10、特殊互动额外加分、只增不减

## 设置页功能

管理密码：默认 `admin123`（可在 .env 配置）

- 修改昵称
- 一键切换 AI 供应商（DeepSeek / 硅基流动 / 智谱清言）
- 配置 API Key / Base URL / 模型名称
- 删除全部聊天记录
- 删除账号全部数据
- 免责声明

## 项目结构

```
riize-chat/
├── client/                    # 前端
│   ├── src/
│   │   ├── contexts/          # AuthContext, ChatContext
│   │   ├── pages/             # LoginPage, MoodPage, MembersPage, ModePage, ChatPage, SettingsPage
│   │   ├── types/             # TypeScript 类型定义
│   │   └ utils/               # API工具、常量数据
│   │   └ App.tsx              # 路由 + Provider
│   │   └ index.css            # Tailwind + 自定义动画
│   │   └ main.tsx
│   │   └ vite.config.ts       # 代理 /api -> localhost:3001
│
├── server/                    # 后端
│   ├── src/
│   │   ├── db/                # SQLite schema + init + seed data
│   │   ├── routes/            # auth, members, chat, settings, intimacy
│   │   ├── services/          # aiService, intimacyService, proactiveMessageService
│   │   └ index.ts             # Express server
│   ├── .env.example
│
└── docs/                      # 文档
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 昵称+设备ID登录 |
| GET | /api/auth/me | 获取当前用户 |
| PUT | /api/auth/mood | 更新心情 |
| PUT | /api/auth/nickname | 更新昵称 |
| GET | /api/members | 成员列表（含用户特定数据） |
| GET | /api/members/:id | 成员详情 |
| POST | /api/members/update | 更新成员配置 |
| POST | /api/chat/message | 发送消息（含mode/mood） |
| GET | /api/chat/history/:userId/:memberId | 获取聊天历史 |
| DELETE | /api/chat/history/:userId/:memberId | 删除聊天记录 |
| GET | /api/intimacy/:userId/:memberId | 获取亲密度 |
| POST | /api/settings/verify-password | 验证管理密码 |
| POST | /api/settings/api-config | 更新API配置 |
| POST | /api/settings/avatar/:memberId | 上传头像 |
| POST | /api/settings/background/:memberId | 上传背景 |

## License

MIT License
