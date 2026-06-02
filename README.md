# P2Portal

P2Portal 是一个 P2P 文件传输工具，支持通过 6 位验证码在发送端和接收端之间建立连接并传输文件。

项目默认优先使用 PeerJS 建立 P2P 直连；当直连不可用时，可切换到 WebSocket 中继模式，由自部署的中继服务转发传输数据。

## 功能特性

- 发送文件 / 接收文件两种使用模式
- 6 位数字验证码配对
- PeerJS P2P 直连传输
- WebSocket 中继传输兜底
- 文件分片传输与接收端重组
- 可在界面中配置 PeerJS 信令服务器和中继服务器地址
- Docker Compose 一键部署前端和中继服务

## 技术栈

### 前端

- React 19
- TypeScript
- Vite
- MUI / Emotion
- PeerJS
- anime.js

### 中继服务

- Go 1.22
- gorilla/websocket

## 项目结构

```text
.
├── client/              # 前端应用
├── relay-server/        # Go WebSocket 中继服务
└── docker-compose.yml   # Docker Compose 部署配置
```

## 本地使用

### 启动前端

```bash
cd client
npm install
npm run dev
```

常用前端脚本：

```bash
npm run build    # 构建生产版本
npm run lint     # 运行 ESLint
npm run preview  # 预览生产构建
```

### 启动中继服务

```bash
cd relay-server
go run .
```

中继服务默认监听 `8080` 端口。

### 使用流程

1. 打开发送端页面，选择“发送文件”。
2. 发送端生成 6 位验证码。
3. 接收端选择“接收文件”，输入相同验证码。
4. 优先尝试 P2P 直连；如直连失败，可按界面提示切换到中继模式。
5. 发送端选择文件后开始传输，接收端完成后下载文件。

## 配置说明

### 前端环境变量

前端使用 Vite 环境变量配置默认信令服务器和中继服务器。

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_SIGNALING_SERVER` | `0.peerjs.com` | PeerJS 信令服务器地址 |
| `VITE_SIGNALING_PORT` | `443` | PeerJS 信令服务器端口 |
| `VITE_SIGNALING_SECURE` | `true` | 是否使用安全连接；设置为 `false` 时关闭 |
| `VITE_SIGNALING_PATH` | `/` | PeerJS 信令服务路径 |
| `VITE_RELAY_SERVER_URL` | 空 / 示例环境值 | WebSocket 中继服务地址 |

中继地址示例：

```env
VITE_RELAY_SERVER_URL=ws://your-server:8081
```

如果通过 HTTPS 访问前端，建议中继服务也通过 `wss://` 暴露，避免浏览器拦截混合内容。

前端设置面板中的配置会保存在浏览器 `localStorage`，键名为 `p2portal_settings`。界面中的配置会覆盖构建时环境变量提供的默认值。

> 注意：Vite 环境变量会在前端构建时注入。使用 Docker 镜像部署时，如需修改默认中继地址，应在构建镜像前配置环境变量或在页面设置中手动配置。

### 中继服务环境变量

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `RELAY_PORT` | `8080` | 中继服务监听端口 |
| `RELAY_MAX_TRANSFER_SIZE` | `104857600` | 中继模式单次传输大小限制，默认 100MB |

## Docker 部署

根目录提供了 `docker-compose.yml`，包含前端静态站点和 Go 中继服务。

```bash
docker compose up --build
```

默认端口映射：

| 服务 | 宿主机端口 | 容器端口 | 说明 |
| --- | --- | --- | --- |
| `p2portal` | `8080` | `80` | 前端站点 |
| `relay-server` | `8081` | `8080` | WebSocket 中继服务 |

部署完成后：

- 前端访问：`http://localhost:8080`
- 中继地址：`ws://localhost:8081`
- 健康检查：`GET http://localhost:8081/health`，正常返回 `ok`

## 中继接口

中继服务提供以下接口：

```text
GET /health
GET /ws?room=<6位数字>&role=sender|receiver
```

参数说明：

- `room`：6 位数字房间码，与前端验证码一致。
- `role`：连接角色，只能是 `sender` 或 `receiver`。

中继服务只负责转发 WebSocket 消息，不会持久化或存储文件。

## 注意事项

- 验证码必须是 6 位数字。
- 同一个房间内，`sender` 和 `receiver` 各只能有一个连接。
- 发送端和接收端必须使用相同验证码。
- 单文件最大限制为 500MB。
- 中继模式默认单次传输限制为 100MB。
- 中继模式不是文件存储服务，只在双方连接期间转发数据。
- 空闲房间会定期清理：每 1 分钟扫描一次，超过 5 分钟无活动会被清理。
- 当前中继服务允许所有 WebSocket 来源连接。公网部署时建议在反向代理、防火墙或服务端配置中增加访问控制。
- 默认中继地址需要根据实际部署环境调整。局域网、公网、HTTP/HTTPS 场景下对应的 `ws://` 或 `wss://` 地址可能不同。
