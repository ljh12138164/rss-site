# 今日热点标识、Google 接入与 Actions 部署

## 范围与决定

用户指定正式域名 `news.ljhboard.cn`，要求参考相邻 blog 项目补齐 GA、AdSense、轻量图标以及 Actions 到服务器的发布。沿用已批准的单实例 Next standalone、容器内 PM2、Compose、SSH 镜像包和回滚设计。

图标使用本地 SVG 火焰，浏览器标签和站点标题共用一个资源。AdSense 使用 blog 发布商 `ca-pub-7441827328189379`，同时提供 ads.txt。GA 使用 `NEXT_PUBLIC_GA_ID`，未提供新闻站 ID 时不发送统计。GA4 使用标准 config 自动 page_view；数据流应开启增强衡量的浏览器历史页面变化，避免同时配置第二套手动 page_view。

## 部署文件

- `.github/workflows/ci-deploy.yml`：PR 只验证；master 推送和手动 workflow_dispatch 在验证成功后部署，经过 production Environment。
- Dockerfile：Actions 内构建 standalone；复制 public 和 static；PM2 单进程运行。
- compose.yaml：仅监听 `127.0.0.1:18104`，内存上限 1 GB，禁止拉镜像。
- deploy/server：受限 SSH 命令和部署脚本，校验包内仅含两个普通文件，加载已验证镜像，健康失败恢复上个版本。
- deploy/host-nginx.conf：放入 news 域名已有 HTTPS server，关闭代理缓存和流式缓冲。

## GitHub 配置

Repository Variables：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`、`NEXT_PUBLIC_GA_ID`（可选）。前两个只能填公开客户端凭据，禁止填 service-role key。

production Environment Variables：`DEPLOY_HOST`、`DEPLOY_PORT`（默认 22）、`DEPLOY_USER`（默认 rss-site-deploy）。Secrets：`DEPLOY_SSH_KEY`、`DEPLOY_KNOWN_HOSTS`。known_hosts 必须通过可信渠道核对；不在 workflow 内自动信任 ssh-keyscan 结果。为 production 设置审批人与 master 分支限制。

## 首次服务器准备

服务器需要 Docker Compose、bash、curl、tar、flock、sudo；不需要 Node 或 pnpm。以下由管理员在审核脚本后执行，仓库文件先传入服务器：

```sh
sudo useradd --create-home --shell /bin/sh rss-site-deploy
sudo install -d -m 755 /opt/stacks/rss-site
sudo install -m 755 deploy/server/deploy-rss-site /usr/local/sbin/deploy-rss-site
sudo install -m 755 deploy/server/rss-site-deploy-gate /usr/local/bin/rss-site-deploy-gate
sudo visudo -cf deploy/server/rss-site-deploy.sudoers
sudo install -m 440 deploy/server/rss-site-deploy.sudoers /etc/sudoers.d/rss-site-deploy
sudo install -m 600 deploy/runtime.env.example /opt/stacks/rss-site/runtime.env
```

编辑 runtime.env 填入实际公开 Supabase 配置和服务端 revalidation 等秘密。保持 root 所有和 600 权限。部署用户不要加入 docker 组。

在该用户的 authorized_keys 中加入 Actions 对应公钥，前缀为：

```text
restrict,command="/usr/local/bin/rss-site-deploy-gate" ssh-ed25519 PUBLIC_KEY
```

为 news.ljhboard.cn 配置 DNS、TLS 与 Nginx 反向代理（18104）。AdSense 后台添加/核验新闻站；子域 ads.txt 如有识别问题，按后台提示配置根域委派。接入脚本不等于广告审核通过。

合并到 master 后自动执行；也可在 Actions 的 Verify and deploy news 中选择 master 并 Run workflow。verify 作业构建并启动镜像验证 healthz、首页、图标和 ads.txt；deploy 下载同一镜像包，通过受限 SSH 执行，最后检查公网 healthz。生产首次部署需要上述服务器准备与 GitHub 参数齐备。

## 验收边界

本地 API 61 项、Web 108 项回归通过，Next 构建生成 55/55 页面及 monorepo standalone server.js。实际启动 standalone 后首页、healthz、icon.svg、ads.txt 均 HTTP 200；首页包含正式域名、图标和 AdSense 脚本，SVG 231 字节。修改的 TypeScript/配置通过 Biome，部署 Shell 通过 bash -n，workflow/Compose 通过 YAML 解析。独立审查未发现代码阻断项；按用户要求将 master push 也接入部署作业。

本机 Docker daemon 未运行，实际 Linux 镜像验证由 Actions verify 作业完成，未声称已在服务器部署。首次没有可回滚镜像时，失败会停止服务并清除失败标签；后续失败恢复先前 Compose 和镜像标签。ISR 缓存保存在当前容器可写层，更新容器会冷启动，数据库数据不受影响。

参考：blog/.github/workflows/ci-deploy.yml 与 deploy/server/deploy-blog；安装版 Next output/scripts 指南；Google 官方 GA4 pageviews 与 AdSense ads.txt 文档。
