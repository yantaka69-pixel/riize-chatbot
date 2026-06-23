# RIIZE 虚拟聊天模拟器 - 技术架构文档

## 1. 系统架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser       │────▶│   Express API   │────▶│   SQLite DB     │
│   (React SPA)   │◀────│   (Port 3001)   │◀────│   (Local File)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   OpenAI API    │
                       │   (可配置)       │
                       └─────────────────┘
```

## 2. 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| 样式方案 | TailwindCSS |
| 状态管理 | React Context |
| 后端框架 | Express.js |
| 数据库 | SQLite (better-sqlite3) |
| AI接口 | OpenAI-compatible API |

## 3. 项目结构

```
riize-chat/
├── client/                    # 前端
│   ├── src/
│   │   ├── components/      # UI组件
│   │   ├── pages/           # 页面
│   │   ├── contexts/         # Context
│   │   ├── utils/           # 工具
│   │   └── types/           # 类型
│   └── ...
│
├── server/                    # 后端
│   ├── src/
│   │   ├── routes/          # 路由
│   │   ├── services/        # 服务
│   │   └── db/             # 数据库
│   └── ...
│
└── docs/                     # 文档
```

## 4. API 设计

### 4.1 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 登录/注册 |
| GET | /api/auth/me | 获取当前用户 |
| PUT | /api/auth/mood | 更新心情 |

### 4.2 成员接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/members | 获取成员列表 |
| GET | /api/members/:id | 获取成员详情 |
| PUT | /api/members/:id | 更新成员配置 |

### 4.3 聊天接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/chat | 发送消息 |
| GET | /api/conversations/:memberId | 获取聊天历史 |
| DELETE | /api/conversations/:memberId | 删除成员聊天 |
| DELETE | /api/conversations | 删除全部聊天 |

### 4.4 亲密度接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/intimacy | 获取所有亲密度 |
| GET | /api/intimacy/:memberId | 获取成员亲密度 |

### 4.5 设置接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/settings | 获取设置 |
| PUT | /api/settings | 更新设置 |
| DELETE | /api/account | 删除账号 |

## 5. 数据模型

### 5.1 users 表

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  today_mood TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 members 表

```sql
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  member_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  background_url TEXT,
  note_name TEXT,
  base_prompt TEXT,
  custom_prompt TEXT,
  personality_settings TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 conversations 表

```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  mode TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
);
```

### 5.4 intimacy 表

```sql
CREATE TABLE intimacy (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  intimacy_score INTEGER DEFAULT 0,
  intimacy_level INTEGER DEFAULT 1,
  relationship_title TEXT DEFAULT '初识粉丝',
  last_chat_at DATETIME,
  last_daily_bonus_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (member_id) REFERENCES members(id),
  UNIQUE(user_id, member_id)
);
```

### 5.5 settings 表

```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  api_key TEXT,
  base_url TEXT DEFAULT 'https://api.openai.com/v1',
  model_name TEXT DEFAULT 'gpt-3.5-turbo',
  admin_password_hash TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 6. AI Prompt 设计

### 系统 Prompt 结构

```
[全局安全规则]
[成员基础人设]
[用户自定义人设调整]
[当前聊天模式设定]
[今日心情影响]
[当前关系称呼]
[最近聊天记录上下文]
[用户最新消息]
```

### 成员基础 Prompt

**Shotaro:**
```
你正在扮演 RIIZE 成员 Shotaro 进行虚拟聊天。

【性格特点】
- 温柔开朗
- 鼓励型
- 善于倾听

【说话风格】
- 语气温暖亲切
- 经常鼓励对方
- 会用简单韩语如 "괜찮아", "잘했어"
- 中文为主，偶尔韩语
```

**Wonbin:**
```
你正在扮演 RIIZE 成员 Wonbin 进行虚拟聊天。

【性格特点】
- 安静温柔
- 慢热细腻
- 氛围感强

【说话风格】
- 说话节奏较慢
- 用词细腻
- 偶尔短句
- 偶尔韩语如 "그래", "응"
```

## 7. 亲密度计算

### 等级阈值

| 等级 | 最低分数 |
|------|----------|
| Lv.1 | 0 |
| Lv.2 | 100 |
| Lv.3 | 300 |
| Lv.4 | 600 |
| Lv.5 | 1000 |
| Lv.6 | 2000 |
| Lv.7 | 4000 |

### 分数规则

| 行为 | 分数 |
|------|------|
| 发送消息 | +1~3 |
| 每天首次聊天 | +5 |
| 情绪安慰模式互动 | +3 |
| 韩语练习模式互动 | +3 |

## 8. 环境变量

### 后端 .env

```env
PORT=3001
DATABASE_PATH=./data/riize-chat.db
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
ADMIN_PASSWORD=admin123
```

### 前端 .env

```env
VITE_API_BASE_URL=http://localhost:3001
```

## 9. 错误处理

### API 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

### 降级策略

当 AI API 调用失败时：
1. 自动切换到本地假回复
2. 记录错误日志
3. 返回友好的降级消息
4. 不让页面崩溃

### 本地假回复示例

```typescript
const fallbackReplies = [
  "我这边刚刚有点卡住了，但还是想听你继续说。",
  "抱歉呀，刚刚信号有点不好，你说什么？",
  "等等我，让我想想怎么回复你～",
  "嗯嗯，我知道了，继续说吧！"
];
```
