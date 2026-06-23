# RIIZE 虚拟聊天模拟器 - 部署教程

## 部署方案

**推荐：Render（后端）+ Vercel（前端）**

- Render 提供免费后端服务 + 1GB持久化存储
- Vercel 提供免费前端托管
- 总成本：**完全免费**

---

## 第一步：上传代码到 GitHub

### 1.1 创建 GitHub 仓库

1. 登录 https://github.com
2. 点击右上角 "+" → "New repository"
3. 填写：
   - Repository name: `riize-chat`
   - 选择 **Private**（私有仓库）
   - 点击 "Create repository"

### 1.2 上传项目文件

**方式A：使用 GitHub Desktop（推荐新手）**

1. 下载安装 GitHub Desktop
2. Clone 新创建的仓库到本地
3. 复制整个 `riize-chat` 目录内容到仓库
4. Commit 并 Push

**方式B：使用网页上传**

1. 在仓库页面点击 "uploading an existing file"
2. 拖拽所有项目文件上传
3. 点击 "Commit changes"

**需要上传的核心文件：**

```
riize-chat/
├── client/（整个目录）
├── server/（整个目录）
├── docs/
├── README.md
└── render.yaml
```

---

## 第二步：部署后端到 Render

### 2.1 注册 Render

1. 访问 https://render.com
2. 点击 "Get Started" 用 GitHub 账号登录
3. 授权 Render 访问你的 GitHub 仓库

### 2.2 创建后端服务

1. 点击 "New" → "Web Service"
2. 选择 `riize-chat` 仓库
3. 配置：
   - **Name**: `riize-chat-server`
   - **Region**: Singapore（离中国最近）
   - **Branch**: main
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free

4. 点击 "Advanced" → "Add Disk"：
   - Name: `data`
   - Mount Path: `/var/data`
   - Size: 1 GB（免费最大值）

5. 添加环境变量：
   - `OPENAI_API_KEY`: 你的 API Key
   - `ADMIN_PASSWORD`: 设置管理密码（如 `myadmin123`）

6. 点击 "Create Web Service"

### 2.3 等待部署完成

- 部署需要 3-5 分钟
- 成功后会显示 "Live"
- 记下你的服务 URL：`https://riize-chat-server.onrender.com`

---

## 第三步：部署前端到 Vercel

### 3.1 注册 Vercel

1. 访问 https://vercel.com
2. 用 GitHub 账号登录
3. 授权 Vercel 访问仓库

### 3.2 创建前端项目

1. 点击 "Add New" → "Project"
2. 选择 `riize-chat` 仓库
3. 配置：
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. 添加环境变量：
   - `VITE_API_BASE_URL`: `https://riize-chat-server.onrender.com`

5. 点击 "Deploy"

### 3.3 等待部署完成

- 部署需要 1-2 分钟
- 成功后会显示你的网站 URL

---

## 第四步：配置 CORS

回到 Render 后端，确保 CORS 允许 Vercel 前端访问：

在 `server/src/index.ts` 中已配置：
```typescript
app.use(cors({
  origin: ['https://你的vercel域名.vercel.app'],
  credentials: true
}));
```

---

## 部署完成后

### 访问你的网站

- 前端地址：`https://你的项目.vercel.app`
- 后端地址：`https://riize-chat-server.onrender.com`

### 初始化数据库

首次部署后，需要初始化数据库：

1. 在 Render 后端页面点击 "Shell"
2. 运行命令：
```bash
npm run db:init
```

### 注意事项

1. **Render 免费服务限制**：
   - 15分钟无请求会休眠
   - 首次访问需要等待 30秒 启动
   - 每月 750 小时免费时长

2. **OpenAI API Key**：
   - 必须配置才能使用 AI 聊天
   - 建议设置使用限额

3. **管理密码**：
   - 记住你设置的管理密码
   - 用于设置页验证

---

## 常见问题

### Q: 后端启动失败？

检查 Render 日志，常见原因：
- `OPENAI_API_KEY` 未配置
- 数据库初始化未执行

### Q: 前端无法连接后端？

检查：
- `VITE_API_BASE_URL` 是否正确
- CORS 配置是否包含前端域名

### Q: 数据丢失？

Render 免费版磁盘是持久化的，但建议：
- 定期备份重要数据
- 不要删除磁盘

---

## 备选方案：Railway

如果 Render 不满足需求：

1. 访问 https://railway.app
2. 用 GitHub 登录
3. 创建项目，部署后端和前端
4. 每月 $5 免费额度，不休眠

---

## 需要帮助？

遇到问题可以：
1. 查看 Render/Vercel 部署日志
2. 检查环境变量配置
3. 确认 GitHub 仓库文件完整
