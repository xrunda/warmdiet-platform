#!/bin/bash

# WarmDiet K8s 部署脚本

set -e

# 配置变量
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="your-namespace"  # 替换为你的阿里云命名空间
IMAGE_NAME="${REGISTRY}/${NAMESPACE}/warmdiet"
VERSION="latest"

echo "🚀 开始部署 WarmDiet 到阿里云 K8s..."

# 1. 构建 Docker 镜像
echo "📦 构建 Docker 镜像..."
docker build -t ${IMAGE_NAME}:${VERSION} .

# 2. 登录阿里云容器镜像服务
echo "🔐 登录阿里云容器镜像服务..."
echo "请输入阿里云容器镜像服务用户名和密码:"
docker login ${REGISTRY}

# 3. 推送镜像
echo "📤 推送镜像到阿里云..."
docker push ${IMAGE_NAME}:${VERSION}

# 4. 更新 k8s/deployment.yaml 中的镜像版本
echo "📝 更新 Deployment 配置..."
sed -i "s|image:.*warmdiet.*|image: ${IMAGE_NAME}:${VERSION}|" k8s/deployment.yaml

# 5. 部署到 K8s
echo "🚢 部署到 K8s..."

# 创建命名空间
kubectl apply -f k8s/namespace.yaml

# 创建配置和密钥
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 部署应用
kubectl apply -f k8s/deployment.yaml

# 配置存储
kubectl apply -f k8s/pvc.yaml

# 配置 Ingress
kubectl apply -f k8s/ingress.yaml

# 配置自动扩缩容
kubectl apply -f k8s/hpa.yaml

# 6. 等待部署完成
echo "⏳ 等待部署完成..."
kubectl rollout status deployment/warmdiet -n warmdiet

# 7. 显示部署状态
echo ""
echo "✅ 部署完成！"
echo ""
echo "查看部署状态:"
kubectl get deployment -n warmdiet
kubectl get pods -n warmdiet
kubectl get svc -n warmdiet

echo ""
echo "查看日志:"
kubectl logs -f -n warmdiet -l app=warmdiet

echo ""
echo "完成！访问地址: http://your-domain.com"