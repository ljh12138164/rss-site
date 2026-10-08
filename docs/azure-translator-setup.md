# Azure Translator F0 配置指南

本文用于本站的「Azure 优先、本地 MTran 回退」翻译功能。步骤依次为：创建资源 → 取得密钥 → 写入配置 → 重新创建 Web 容器 → 验证。官方资料核实日期：2026-10-08。

## 1. 创建免费 Translator 资源

1. 登录 [Azure 门户](https://portal.azure.com/)。需要一个有效 Azure 订阅；没有账号时先按 [Azure 注册页面](https://azure.microsoft.com/free/)开通。
2. 选择「创建资源 / Create a resource」，搜索 **Translator**，创建 **Translator 单服务资源**。
3. 按下表填写。

| 字段 | 填写方式 |
| --- | --- |
| Subscription / 订阅 | 选择你的 Azure 订阅 |
| Resource group / 资源组 | 使用现有资源组，或新建，例如 `rss-site` |
| Region / 区域 | 优先选择 `Global`；若选择具体区域，后续必须填写对应区域代码 |
| Name / 名称 | 填写可用名称，例如 `rss-site-translator` |
| Pricing tier / 定价层 | **Free F0** |

4. 点击「Review + create / 查看并创建」，确认定价层是 **F0** 后创建。
5. 完成后点击「Go to resource / 转到资源」。

每个订阅只能有一个免费层资源。如果看不到 F0，先检查该订阅是否已创建免费 Translator 资源，或是否选择了正确的单服务资源类型。本站调用标准 NMT 文本翻译，不需要创建 LLM 部署。详见 [微软资源创建指南](https://learn.microsoft.com/en-us/azure/ai-services/translator/how-to/create-translator-resource)。

F0 每订阅月免费 200 万字符，用尽后停止服务，下个订阅月恢复；本站此时自动回退本地。切换到收费层会采用对应计费方式。详见 [微软 Translator FAQ](https://www.microsoft.com/en-us/translator/business/faq/)。

## 2. 找到 Key 和区域

在刚创建的 Translator 资源左侧打开：

**Resource Management / 资源管理 → Keys and Endpoint / 密钥和终结点**。

- 复制 **Key 1 或 Key 2** 中任意一个，作为 `AZURE_TRANSLATOR_KEY`。
- 若资源区域为 Global，省略 `AZURE_TRANSLATOR_REGION` 即可。
- 若资源在具体区域，填写页面提供的 Location/Region 代码，例如 `eastasia`。填写实际区域，不能照抄示例或用资源组的区域代替。

本站固定使用 `https://api.cognitive.microsofttranslator.com`，不用另填 endpoint。[微软认证说明](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/authentication)规定 regional resource 需要区域头，global resource 可省略。

本指南适用于 `portal.azure.com` 的 Azure 公有云资源。当前实现没有自定义 endpoint 设置，不适用于世纪互联 Azure 中国区或仅允许专用网络访问的资源。

## 3. 配置生产服务器

先确认包含 Azure 翻译功能的版本已经部署。只给旧版镜像添加变量，不会让旧代码支持 Azure。

仓库的部署脚本将站点放在 `/opt/stacks/rss-site`。通过管理员 SSH 或 Workbench 进入服务器，然后编辑已有配置：

```bash
sudoedit /opt/stacks/rss-site/runtime.env
```

保留原有 Supabase、站点和其他变量，添加以下内容。把占位符换成真正的 Key；同名变量若已存在，直接修改，避免重复添加。

**Global 资源：**

```dotenv
AZURE_TRANSLATOR_KEY=替换为Key1或Key2
```

**具体区域资源：**

```dotenv
AZURE_TRANSLATOR_KEY=替换为Key1或Key2
AZURE_TRANSLATOR_REGION=eastasia
```

密钥只写在服务器的 `runtime.env`，不要加 `NEXT_PUBLIC_` 前缀。`/opt/stacks/rss-site/.env` 存放部署镜像的 `IMAGE_TAG`，Azure 密钥应写入 **runtime.env**。

保存后执行：

```bash
sudo docker compose --project-directory /opt/stacks/rss-site up -d --no-deps --force-recreate --pull never --wait --wait-timeout 90 web
sudo docker compose --project-directory /opt/stacks/rss-site ps
curl --fail --silent --show-error http://127.0.0.1:18104/healthz
```

这会重新创建 Web 容器，读取更新后的 `runtime.env`，继续使用已有镜像、Redis 和模型卷，并等待 Web 健康检查。**只执行 `docker compose restart web` 不会更新容器环境变量**。更新 Key 不需要重新构建镜像，但 Web 会短暂重启。参见 Docker 官方的 [up](https://docs.docker.com/reference/cli/docker/compose/up/) 和 [restart](https://docs.docker.com/reference/cli/docker/compose/restart/) 说明。

首次安装且没有部署目录时，应先完成本站的部署流程；这里的命令是给已经部署的站点更新配置。

## 4. 验证 Azure 确实能翻译

### 先直接验证 Key、区域与网络

在生产服务器完整执行下面的命令。它在 Web 容器内读取现有配置，只翻译一条固定短句，输出 HTTP 状态和译文，不输出密钥。

```bash
sudo docker compose --project-directory /opt/stacks/rss-site exec -T web bun -e '
const key = process.env.AZURE_TRANSLATOR_KEY?.trim();
const region = process.env.AZURE_TRANSLATOR_REGION?.trim();
if (!key) {
  console.error("AZURE_TRANSLATOR_KEY 未配置");
  process.exit(1);
}
try {
  const response = await fetch(
    "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hans&textType=plain",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Ocp-Apim-Subscription-Key": key,
        ...(region && region !== "global" ? { "Ocp-Apim-Subscription-Region": region } : {})
      },
      body: JSON.stringify([{ Text: "The translation service is ready." }]),
      signal: AbortSignal.timeout(20000)
    }
  );
  console.log("Azure HTTP:", response.status);
  if (!response.ok) process.exit(1);
  const payload = await response.json();
  const text = payload[0]?.translations?.find(item => item.to === "zh-Hans")?.text;
  if (typeof text !== "string" || !text.trim()) {
    console.error("响应缺少简体中文译文");
    process.exit(1);
  }
  console.log("译文:", text);
} catch {
  console.error("Azure 请求失败，请检查网络连接或超时");
  process.exit(1);
}
'
```

成功标准：出现 `Azure HTTP: 200` 和中文译文。译文具体措辞可能变化。这条检查直接调用 Azure，没有本地回退，也不经过译文缓存，因此能确认 Azure 本身可用。

### 再验证网站

1. 打开一篇未翻译过的英文文章或英文 AI 事件，点击「翻译为中文」。
2. 确认译文、原文/双语切换、段落和链接正常。
3. 在 Azure 资源的 Metrics / 指标中查看请求或用量变化，辅助确认站点调用；指标可能延迟显示。
4. 如网站触发回退，在服务器查看：

   ```bash
   sudo docker compose --project-directory /opt/stacks/rss-site logs --since 10m web
   ```

   Azure 调用失败时会记录：

   ```text
   [translation] Azure unavailable; using local translation for 60 seconds
   ```

启动日志中的 `Azure translation configured; local fallback model will load on demand.` 只说明检测到配置，**不代表 Key 已验证成功**。网页返回中文也可能来自本地或缓存，所以应先完成上面的直接接口检查。

## 5. 本地开发配置

编辑仓库中的 `apps/web/.env.local`，加入同样的 Key 和区域。已有 `.env.local` 时直接编辑，不要用示例文件覆盖现有配置；没有时才从 `apps/web/.env.example` 复制。

```dotenv
AZURE_TRANSLATOR_KEY=替换为Key1或Key2
# Global 资源省略下一行；具体区域资源填写实际区域代码。
AZURE_TRANSLATOR_REGION=eastasia
```

停止并重新启动开发服务：

```powershell
pnpm --filter @rss-site/web dev
```

配置由 Next 服务端读取，不需要传给 `server/api`、Cloudflare Worker 或浏览器，也不需要放进 GitHub 的 Docker 构建参数。

## 6. 常见问题

| 现象 | 检查与处理 |
| --- | --- |
| 直接检查提示 Key 未配置 | 确认编辑的是 `runtime.env`，变量没有被 `#` 注释，并已重新创建 Web 容器 |
| Azure HTTP 401 / 403 | 检查 Key 是否来自 Translator 资源、区域是否匹配、资源网络设置和订阅状态；403 也可能与免费额度耗尽有关 |
| Azure HTTP 429 | 可能触发速率限制；本站冷却 60 秒后再尝试，期间使用本地 |
| Azure HTTP 5xx / 超时 | 检查服务器到固定 Azure endpoint 的连通性；本站自动回退 |
| Key 修改后仍使用旧 Key | 重新创建容器，不是仅 restart |
| 直接检查成功，但旧文章没产生 Azure 用量 | 译文可能命中 7 天缓存；选未翻译过的英文内容验证，无需清空整个 Redis |
| 修改配置后仍出现冷却日志 | 修复配置后重新创建容器会重置当前进程冷却；之后再用新文章验证 |
| 长文仍调用本地模型 | 正文超过单次 50,000 字符限制时直接本地回退，HTML 包裹也计入长度 |
| 首次回退比较慢 | 需要按需加载模型；模型卷为空时还需下载模型文件，已有卷会继续复用 |

本站不会自动升级 Azure 计费层级。未配置 Key 时完全走本地；Azure 成功时不加载本地模型；回退生成的译文也缓存 7 天。

实现与已有检查结果见 [开发记录](development/azure-translation-fallback.md)。本指南中的生产操作尚未代用户执行。
