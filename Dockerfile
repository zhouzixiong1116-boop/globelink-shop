FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制所有文件
COPY . .

# 创建数据目录
RUN mkdir -p /app/data /app/uploads

# 暴露端口
EXPOSE 3000

# 启动
CMD ["node", "server.js"]
