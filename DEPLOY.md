# 部署说明

### 前置条件
- 请确保已安装 [Docker](https://www.docker.com/) 和 Docker Compose。

### 快速开始
1. 在项目根目录下打开终端。
2. 运行启动命令：
   ```bash
   docker-compose up
   ```
3. 等待启动完成后，打开浏览器访问：[http://localhost:5173](http://localhost:5173)

### 开发说明
- **热更新**：本项目配置为开发模式。当您修改 `src/` 目录下的代码时，浏览器会自动刷新，无需重启容器。
- **安装依赖**：如果您在 `package.json` 中添加了新依赖，请运行以下命令重新构建镜像：
  ```bash
  docker-compose up --build
  ```
- **停止运行**：
  - 在终端按 `Ctrl+C` 停止当前进程。
  - 或运行 `docker-compose down` 彻底移除容器。
