# WarmDiet 阿里云 K8s 部署完整指南

## 📋 前置准备

### 1. 阿里云资源准备

#### 1.1 创建容器镜像服务（ACR）
1. 登录 [阿里云容器镜像服务](https://cr.console.aliyun.com/)
2. 创建命名空间（个人版或企业版）
3. 记录命名空间名称

#### 1.2 创建容器服务 ACK（Kubernetes）
1. 登录 [阿里云容器服务](https://cs.console.aliyun.com/)
2. 创建 Kubernetes 集群
   - 版本：推荐 1.24+
   - 节点规格：2核4GB 起步
   - 节点数量：至少 2 个（高可用）
3. 等待集群创建完成

#### 1.3 配置 kubectl
```bash
# 下载并安装 kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# 配置 kubeconfig
# 方式 1: 通过阿里云控制台下载 kubeconfig 文件
# 方式 2: 通过阿里云 CLI
```

验证连接：
```bash
kubectl get nodes
```

#### 1.4 准备域名（可选）
如果需要通过域名访问：
1. 购买域名（阿里云域名）
2. 配置 DNS 解析到 ACK SLB 公网 IP
3. 申请 SSL 证书（阿里云 SSL 证书服务）

---

## 🚀 部署步骤

### 步骤 1: 配置密钥

修改 `k8s/secret.yaml`：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: warmdiet-secret
  namespace: warmdiet
type: Opaque
stringData:
  # JWT 密钥（必须修改为随机字符串）
  JWT_SECRET: "$(openssl rand -base64 32)"

  # GEMINI API 密钥（可选）
  GEMINI_API_KEY: ""

  # 数据库路径
  DATABASE_PATH: "/app/data/warmdiet.db"
```

### 步骤 2: 配置镜像地址

修改 `k8s/deployment.yaml` 中的镜像地址：

```yaml
image: registry.cn-hangzhou.aliyuncs.com/your-namespace/warmdiet:latest
```

### 步骤 3: 配置域名（可选）

修改 `k8s/ingress.yaml` 中的域名：

```yaml
spec:
  tls:
  - hosts:
    - warmdiet.example.com  # 替换为你的域名
    secretName: warmdiet-tls
  rules:
  - host: warmdiet.example.com  # 替换为你的域名
```

如果使用 HTTP（无证书），删除 `tls` 部分。

### 步骤 4: 执行部署脚本

```bash
# 一键部署
./k8s/deploy.sh
```

或者手动执行：

```bash
# 1. 构建镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/your-namespace/warmdiet:latest .

# 2. 登录 ACR
docker login --username=your_username registry.cn-hangzhou.aliyuncs.com

# 3. 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/warmdiet:latest

# 4. 部署到 K8s
kubectl apply -f k8s/
```

---

## 📊 验证部署

### 检查 Pod 状态

```bash
kubectl get pods -n warmdiet -w
```

预期输出：
```
NAME                         READY   STATUS    RESTARTS   AGE
warmdiet-7d6b8c9f4b-abc123   1/1     Running   0          2m
warmdiet-7d6b8c9f4b-def456   1/1     Running   0          2m
```

### 检查 Service

```bash
kubectl get svc -n warmdiet
```

### 检查 Ingress

```bash
kubectl get ingress -n warmdiet
```

### 测试访问

```bash
# 获取 Pod IP
POD_IP=$(kubectl get pods -n warmdiet -o jsonpath='{.items[0].status.podIP}')

# 测试健康检查
curl http://$POD_IP:3001/health
```

预期输出：
```json
{
  "status": "ok",
  "timestamp": "2026-03-06T...",
  "environment": "production"
}
```

---

## 🔧 运维操作

### 查看日志

```bash
# 查看所有 Pod 日志
kubectl logs -f -n warmdiet -l app=warmdiet

# 查看指定 Pod 日志
kubectl logs -f -n warmdiet <pod-name>

# 查看最近 100 行日志
kubectl logs --tail=100 -n warmdiet <pod-name>
```

### 进入 Pod

```bash
kubectl exec -it -n warmdiet <pod-name> -- sh
```

### 扩缩容

手动扩缩容：
```bash
# 扩容到 5 个副本
kubectl scale deployment warmdiet --replicas=5 -n warmdiet

# 缩容到 2 个副本
kubectl scale deployment warmdiet --replicas=2 -n warmdiet
```

查看 HPA 状态：
```bash
kubectl get hpa -n warmdiet
```

### 更新应用

```bash
# 方式 1: 更新镜像版本
kubectl set image deployment/warmdiet warmdiet=registry.cn-hangzhou.aliyuncs.com/your-namespace/warmdiet:v2 -n warmdiet

# 方式 2: 修改 YAML 文件后重新应用
kubectl apply -f k8s/deployment.yaml

# 查看滚动更新状态
kubectl rollout status deployment/warmdiet -n warmdiet

# 回滚到上一个版本
kubectl rollout undo deployment/warmdiet -n warmdiet
```

### 备份数据库

```bash
# 从 Pod 备份数据库
kubectl cp -n warmdiet <pod-name>:/app/data/warmdiet.db ./backup_$(date +%Y%m%d_%H%M%S).db

# 或使用 kubectl exec
kubectl exec -n warmdiet <pod-name> -- cat /app/data/warmdiet.db > backup.db
```

### 恢复数据库

```bash
# 恢复数据库到 Pod
kubectl cp ./backup.db -n warmdiet <pod-name>:/app/data/warmdiet.db

# 重启 Pod 使其生效
kubectl rollout restart deployment/warmdiet -n warmdiet
```

---

## 📈 监控和告警

### 阿里云监控

1. 登录 [阿里云容器服务](https://cs.console.aliyun.com/)
2. 选择集群 → 监控
3. 查看 Pod、Node、Service 的监控指标

### 告警配置

在阿里云控制台配置告警规则：
- CPU 使用率 > 80%
- 内存使用率 > 80%
- Pod 重启次数 > 3
- Pod 处于 Pending 状态超过 5 分钟

---

## 🔒 安全配置

### 1. 网络策略

创建 `k8s/network-policy.yaml`：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: warmdiet-network-policy
  namespace: warmdiet
spec:
  podSelector:
    matchLabels:
      app: warmdiet
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3001
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
```

### 2. 资源限制

已在 `k8s/deployment.yaml` 中配置：
- requests: 256Mi 内存, 250m CPU
- limits: 512Mi 内存, 500m CPU

### 3. Pod 安全策略

启用 Pod 安全标准：
```yaml
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: false
          capabilities:
            drop:
            - ALL
```

---

## 🆘 故障排查

### Pod 无法启动

```bash
# 查看 Pod 详情
kubectl describe pod <pod-name> -n warmdiet

# 查看 Pod 日志
kubectl logs <pod-name> -n warmdiet

# 查看事件
kubectl get events -n warmdiet --sort-by='.lastTimestamp'
```

常见问题：
- **ImagePullBackOff**: 检查镜像地址是否正确，是否登录 ACR
- **CrashLoopBackOff**: 检查应用日志，确认环境变量配置
- **Pending**: 检查资源配额、PVC 是否创建成功

### 服务无法访问

```bash
# 检查 Service
kubectl describe svc warmdiet-service -n warmdiet
kubectl get endpoints warmdiet-service -n warmdiet

# 检查 Ingress
kubectl describe ingress warmdiet-ingress -n warmdiet

# 测试 Service
kubectl port-forward -n warmdiet svc/warmdiet-service 8080:80
```

### 性能问题

```bash
# 查看 Pod 资源使用
kubectl top pods -n warmdiet

# 查看 Node 资源使用
kubectl top nodes

# 查看资源限制
kubectl describe pod <pod-name> -n warmdiet | grep -A 5 Limits
```

---

## 📚 参考文档

- [阿里云容器服务文档](https://help.aliyun.com/product/56036)
- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [Docker 官方文档](https://docs.docker.com/)

---

## 🆘 技术支持

如有问题，请：
1. 检查日志和事件
2. 参考 [故障排查](#故障排查) 章节
3. 提交 Issue 到 GitHub 仓库

---

*最后更新：2026-03-06*