export const englishMessages = new Map<string, string>([
  ['加载异常', 'Loading error'],
  ['页面加载失败', 'Could not load this page'],
  ['请稍后重试或刷新页面。', 'Try again in a moment or refresh the page.'],
  ['重新加载', 'Reload'],
  ['浏览全部热点', 'Browse all stories'],
  ['页面不存在', 'Page not found'],
  [
    '链接可能已失效，返回首页继续浏览热点。',
    'This link may have expired. Return home to keep browsing.'
  ],
  ['返回首页', 'Back to home'],
  ['关于本站', 'About'],
  ['关于 AI 热榜', 'About Today’s Headlines'],
  ['多平台公开资讯与技术动态聚合站。', 'Public news and technology updates from across the web.'],
  ['收录范围', 'What we cover'],
  [
    '汇总 35 个以上公开平台与官方博客，覆盖 AI、科技、国内新闻、社交、财经与游戏六个频道， 以及开源排行与 Skills 榜单。站内提供原文跳转、中文翻译、要点总结与 RSS 订阅。',
    'We bring together more than 35 public platforms and official blogs across AI, technology, news, social, finance, and gaming, along with open-source and skill rankings. You can open the original sources, read AI summaries, or subscribe by RSS. Chinese translations are available in the Chinese interface.'
  ],
  ['运作方式', 'How it works'],
  ['公开信源', 'Public sources'],
  ['官方 RSS 与公开榜单', 'Official RSS feeds and public rankings'],
  ['定时抓取', 'Scheduled fetching'],
  ['提取标题、链接与发布时间', 'Extract titles, links, and publication dates'],
  ['归档入库', 'Archiving'],
  ['去重整理并更新热点流', 'Deduplicate stories and update the feed'],
  ['阅读订阅', 'Read and subscribe'],
  ['搜索、阅读或 RSS / MCP 获取', 'Search and read on the site, or use RSS and MCP'],
  ['查看数据流图', 'View the data flow diagram'],
  ['版权与时效', 'Copyright and updates'],
  [
    '标题、摘要与正文来自各平台公开页面，版权归原作者及对应平台所有。站内保留出处与原文链接； 抓取按固定间隔执行，存在同步延迟，内容若被原站修改或撤回，以原站为准。',
    'Titles, excerpts, and articles come from public pages. Copyright belongs to the original authors and platforms. We credit and link to the source. Updates are fetched at set intervals, so check the original for edits or removals.'
  ],
  ['常见问题', 'Frequently asked questions'],
  ['内容多久更新一次？', 'How often is content updated?'],
  [
    'AI 核心来源（OpenAI、Anthropic、DeepSeek、Google AI、智谱 GLM、Qwen 等）每 2 小时检查更新； 科技、新闻、社交、财经、游戏与 Skills 榜单每 6 小时同步一次。',
    'Major AI sources such as OpenAI, Anthropic, DeepSeek, Google AI, Zhipu GLM, and Qwen are checked every two hours. Technology, news, social, finance, gaming, and skill rankings sync every six hours.'
  ],
  ['如何通过 RSS 订阅？', 'How do I subscribe via RSS?'],
  ['访问与隐私', 'Access and privacy'],
  ['隐私说明', 'Privacy notice'],
  ['服务条款', 'Terms of service'],
  ['反馈与联系', 'Feedback and contact'],
  ['最近更新：', 'Last updated:'],
  ['更新日期：', 'Updated:'],
  ['2026 年 10 月 23 日', 'October 23, 2026'],
  ['AI 最新动态', 'Latest AI updates'],
  ['AI 大模型评测榜', 'AI model benchmarks'],
  ['查看榜单', 'View rankings'],
  ['暂时无法读取日报', 'Could not load the daily briefing'],
  ['请稍后重新加载。', 'Try reloading in a moment.'],
  ['返回最新日报', 'Back to the latest briefing'],
  ['该期日报不存在', 'Briefing not found'],
  ['返回最新日报 →', 'Latest briefing →'],
  ['今日日报', 'Daily briefing'],
  ['暂无日报', 'No briefings yet'],
  ['返回全部热点 →', 'All stories →'],
  ['财经', 'Finance'],
  ['我的关注', 'Following'],
  [
    '无法保存偏好，请检查浏览器是否允许本地存储。',
    'Could not save your preferences. Check whether your browser allows local storage.'
  ],
  [
    '关注或隐藏平台来源，配置保存在本地浏览器。',
    'Follow or hide sources. Your preferences are saved in this browser.'
  ],
  ['管理文章来源 · 已关注', 'Manage sources · Following'],
  [' 个', ''],
  ['关注', 'Follow'],
  ['隐藏', 'Hide'],
  ['浏览全部未隐藏来源', 'Show all visible sources'],
  ['只看未读', 'Unread only'],
  ['依据最近 100 条本地阅读记录过滤', 'Uses the last 100 articles in your local reading history'],
  [
    '还没有关注任何来源，请先展开「管理文章来源」，或勾选「浏览全部未隐藏来源」。',
    'You haven’t followed any sources yet. Open Manage sources or turn on Show all visible sources.'
  ],
  ['游戏', 'Gaming'],
  ['GitHub 中文开源排行', 'Trending Chinese-language projects on GitHub'],
  ['全部热点', 'All stories'],
  ['AI 模型评测榜', 'AI model benchmarks'],
  ['每 4 小时更新', 'Updated every 4 hours'],
  ['接入 MCP 服务', 'Connect to the MCP service'],
  ['科技资讯', 'Technology news'],
  ['AI 动态', 'AI updates'],
  ['社交热榜', 'Social trends'],
  ['综合新闻', 'General news'],
  ['财经热点', 'Finance headlines'],
  ['游戏动态', 'Gaming updates'],
  ['Skills 排行', 'Skill rankings'],
  ['全网热点早报', 'Morning news briefing'],
  [
    '获取全平台最新的 100 条热点新闻，从中挑选出今天最重要的 5 个科技与社会热点并做晨报汇总。',
    'Fetch the 100 latest stories across all platforms. Pick the five most important technology and social stories today and summarize them in a morning briefing.'
  ],
  ['科技与开源动态', 'Technology and open source'],
  [
    '查询掘金（juejin）和 GitHub Trending（github）最新的热门项目与文章，并简要概括技术趋势。',
    'Find the latest popular projects and articles on Juejin (juejin) and GitHub Trending (github), then briefly summarize the technology trends.'
  ],
  ['追踪 AI 与大模型发布', 'Track AI and model releases'],
  [
    '使用 get_news 查询 OpenAI、ChatGPT 或 DeepSeek 的最新发布日志与产品动态。',
    'Use get_news to find the latest release notes and product updates from OpenAI, ChatGPT, or DeepSeek.'
  ],
  ['财经市场速览', 'Financial market overview'],
  [
    '以 finance 分类查询今天最新的 30 条财经热点，整理出市场重点关注的主题。',
    'Find today’s 30 latest stories in the finance category and summarize the topics markets are watching.'
  ],
  [
    '将本站接入 Codex CLI、Claude Code、Cursor 等客户端，在对话中直接查询已收录热点。',
    'Connect Codex CLI, Claude Code, Cursor, or another client to find stories from the site in your chat.'
  ],
  ['客户端接入', 'Client setup'],
  ['工具接口', 'Tool reference'],
  [
    '按平台或分类查询热点；不传参数时默认返回全平台最新 100 条。',
    'Find stories by platform or category. With no arguments, the tool returns the 100 latest stories across all platforms.'
  ],
  ['参数名', 'Parameter'],
  ['类型', 'Type'],
  ['必填', 'Required'],
  ['默认值', 'Default'],
  ['说明', 'Description'],
  ['否', 'No'],
  ['全平台', 'All platforms'],
  ['返回条数（1～100）。', 'Number of results (1–100).'],
  ['平台与频道 ID', 'Platform and channel IDs'],
  ['提问示例', 'Example prompts'],
  ['国内新闻', 'News'],
  ['新闻', 'News'],
  ['无账号浏览', 'Browse without an account'],
  [
    '浏览、搜索及点击外部链接时的数据处理方式。',
    'How we handle data when you browse, search, or open external links.'
  ],
  [
    '本站无需注册或登录，不收集姓名、手机号或邮箱。页面启用 Google AdSense 广告与 Google Analytics 访问统计时，相关脚本会通过 Cookie 处理设备与访问信息。',
    'You can use the site without signing up or logging in. We do not collect your name, phone number, or email address. When Google AdSense or Google Analytics is enabled, its scripts use cookies to process device and visit information.'
  ],
  ['本地偏好与阅读记录', 'Local preferences and reading history'],
  [
    '明暗主题、关注来源、稍后读与最近 100 条浏览记录仅保存在你的浏览器本地存储中，不会上传到服务器；清除浏览器数据后主题恢复默认深色。',
    'Your theme, followed sources, reading list, and 100 most recent history entries stay in your browser’s local storage. They are not sent to the server. Clearing browser data resets the theme to dark.'
  ],
  ['站内搜索', 'Site search'],
  [
    '搜索关键词与页码会发送给后端用于匹配标题与摘要，不在个人账号下保存历史。关键词会出现在请求日志中，请勿输入密码或敏感信息。',
    'Search terms and page numbers are sent to the server to match titles and excerpts. Search history is not tied to a personal account. Search terms appear in request logs, so avoid entering passwords or sensitive information.'
  ],
  ['访问日志', 'Access logs'],
  [
    '服务器与网络传输节点会接收必要的 IP、请求路径与浏览器信息，用于安全防护和排查故障。',
    'Servers and network intermediaries receive the IP address, request path, and browser information needed for security and troubleshooting.'
  ],
  ['外部链接', 'External links'],
  [
    '在离站提示中点击“继续访问”后，浏览器将跳转到第三方原站并受对方隐私政策约束。',
    'When you select Continue on the external link prompt, your browser opens the original third-party site, where that site’s privacy policy applies.'
  ],
  [
    '站内展示的标题、摘要与正文均来自公开页面与订阅源，著作权归原作者及原平台所有，本站保留署名与原始链接。',
    'Titles, excerpts, and articles come from public pages and feeds. Copyright belongs to the original authors and platforms. We credit the sources and link to the originals.'
  ],
  [
    '数据按定时任务同步，可能落后于原站更新；译文与 AI 总结由模型生成，仅作辅助阅读，事实以原站原文为准。',
    'Scheduled updates can lag behind the source. Machine translations and AI summaries are reading aids. Check the original for the facts.'
  ],
  [
    'RSS 订阅（/feeds/*.xml）、llms.txt 与 MCP 接口仅供个人阅读与常规频率工具调用，请勿高频并发抓取。',
    'RSS feeds (/feeds/*.xml), llms.txt, and MCP are for personal reading and ordinary tool use. Avoid frequent concurrent requests.'
  ],
  ['修订记录', 'Revision history'],
  ['稍后读', 'Read later'],
  [
    '收藏文章与最近 100 条本地阅读记录。',
    'Saved articles and your last 100 locally stored reading history entries.'
  ],
  ['阅读列表分类', 'Reading list tabs'],
  ['浏览记录', 'Reading history'],
  ['确认清空？', 'Confirm clearing?'],
  ['清空稍后读', 'Clear reading list'],
  ['清空记录', 'Clear history'],
  ['暂无收藏文章', 'No saved articles'],
  ['阅读时点击「稍后读」即可存入这里。', 'Select Read later on an article to save it here.'],
  ['暂无浏览记录', 'No reading history'],
  [
    '打开过的站内文章会保留在这里，最多 100 条。',
    'Up to 100 articles you’ve opened on the site appear here.'
  ],
  ['移出稍后读', 'Remove from reading list'],
  ['加入稍后读', 'Save for later'],
  ['删除此条记录', 'Remove this history entry'],
  ['热门 Skills', 'Trending skills'],
  ['skills.sh · 每 6 小时更新', 'skills.sh · Updated every 6 hours'],
  ['大家在聊什么', 'Social trends'],
  ['社交', 'Social'],
  ['社交热点', 'Social trends'],
  ['科技热门', 'Technology headlines'],
  ['科技', 'Technology'],
  ['科技热点', 'Technology headlines'],
  ['暂时无法加载 Skill', 'Could not load this skill'],
  ['请稍后重试或返回榜单列表。', 'Try again in a moment or return to the rankings.'],
  ['重试', 'Retry'],
  ['返回 Skills', 'Back to skills'],
  ['正在加载 Skill', 'Loading skill'],
  ['面包屑', 'Breadcrumb'],
  ['累计安装', 'Total installs'],
  ['热门榜', 'Popular rank'],
  ['近 24 小时安装', 'Installs in the last 24 hours'],
  ['趋势榜', 'Trending rank'],
  ['当前未进入榜单', 'Currently unranked'],
  ['来源信息', 'Source information'],
  ['网站提供', 'Website'],
  ['来源仓库', 'Source repository'],
  ['来源网站', 'Source website'],
  ['采集时间', 'Fetched at'],
  ['本站首次收录', 'First listed'],
  ['目录', 'Contents'],
  ['Skill 目录', 'Skill contents'],
  ['暂未收录 SKILL.md', 'SKILL.md is unavailable'],
  ['查看来源', 'View source'],
  ['同仓库 Skills', 'Skills in this repository'],
  ['AI 时间轴', 'AI timeline'],
  ['正在加载时间轴', 'Loading the timeline'],
  ['AI 时间轴 · 更早事件', 'AI timeline · Earlier events'],
  ['返回 AI 时间轴', 'Back to the AI timeline'],
  ['相关来源', 'Sources'],
  ['暂无可用的关联来源。', 'No related sources available.'],
  ['关联事件', 'Related events'],
  ['返回', 'Back'],
  ['· 历史文章', '· Article archive'],
  ['历史文章分页', 'Archive pagination'],
  ['下一页', 'Next page'],
  ['已存稍后读', 'Saved for later'],
  ['正在加载文章', 'Loading article'],
  ['查看原文', 'View original'],
  ['阅读原文', 'Read original'],
  ['同来源文章', 'More from this source'],
  [
    '无法保存阅读位置，请检查浏览器本地存储设置。',
    'Could not save your reading position. Check your browser’s local storage settings.'
  ],
  ['预计阅读 {count} 分钟', '{count} min read'],
  ['继续上次阅读 ·', 'Resume reading ·'],
  ['文章目录 · {count} 节', 'Contents · {count} sections'],
  ['文章目录', 'Article contents'],
  ['暂时无法搜索，请重试', 'Search is unavailable. Try again.'],
  ['搜索文章', 'Search articles'],
  ['关闭搜索', 'Close search'],
  ['搜索标题和摘要', 'Search titles and excerpts'],
  ['搜索标题和摘要…', 'Search titles and excerpts…'],
  ['清空关键词', 'Clear search term'],
  ['频道', 'Channels'],
  ['全部频道', 'All channels'],
  ['来源', 'Source'],
  ['全部来源', 'All sources'],
  ['时间', 'Time'],
  ['不限', 'Any time'],
  ['近 24 小时', 'Last 24 hours'],
  ['近 7 天', 'Last 7 days'],
  ['按标题和摘要检索', 'Search titles and excerpts'],
  ['输入中…', 'Typing…'],
  ['检索中…', 'Searching…'],
  ['{count} 条匹配 · 按发布时间', 'Matches: {count} · Newest first'],
  ['未找到匹配内容', 'No matches found'],
  ['加载中…', 'Loading…'],
  ['更多', 'More'],
  ['Tab 切换 · Enter 打开 · Esc 关闭', 'Tab to move · Enter to open · Esc to close'],
  ['搜索', 'Search'],
  ['搜索文章或关键词…', 'Search articles or keywords…'],
  ['生成总结超时，请稍后重试', 'The summary took too long. Try again in a moment.'],
  ['暂时无法生成总结，请稍后重试', 'Could not generate a summary. Try again in a moment.'],
  ['AI 总结', 'AI summary'],
  ['正在生成总结', 'Generating summary'],
  ['收起 AI 总结', 'Collapse AI summary'],
  ['展开 AI 总结', 'Expand AI summary'],
  ['重试 AI 总结', 'Retry AI summary'],
  ['生成 AI 总结', 'Generate AI summary'],
  ['生成中…', 'Generating…'],
  ['收起', 'Collapse'],
  ['展开', 'Expand'],
  ['生成总结', 'Generate summary'],
  ['正在提炼要点…', 'Finding key points…'],
  ['基于 SKILL.md 提炼', 'Based on SKILL.md'],
  ['基于来源摘要提炼', 'Based on the source excerpt'],
  ['基于正文提炼', 'Based on the full text'],
  ['文章不存在', 'Article not found'],
  ['文章参数无效', 'Invalid article parameters'],
  ['Skill 参数无效', 'Invalid skill parameters'],
  ['Skill 未找到', 'Skill not found'],
  ['暂未收录 SKILL.md，无法生成总结', 'SKILL.md is unavailable, so a summary can’t be generated.'],
  ['SKILL.md 内容过长，请阅读原文', 'SKILL.md is too long to summarize. View the original.'],
  ['总结任务较多，请稍后重试', 'The summary service is busy. Try again in a moment.'],
  [
    '总结服务暂不可用，请检查 ai-base 配置或稍后重试',
    'The summary service is unavailable. Try again in a moment.'
  ],
  [
    '文章内容少于 200 字，无需生成总结',
    'Articles under 200 characters are too short to summarize.'
  ],
  [
    '文章内容超过总结长度限制，请查看原文',
    'This article is too long to summarize. View the original.'
  ],
  ['暂时无法翻译，请稍后重试', 'Could not translate. Try again in a moment.'],
  ['翻译超时，请稍后重试', 'Translation took too long. Try again in a moment.'],
  ['文章内容', 'Article content'],
  ['文章摘要', 'Article excerpt'],
  ['摘要', 'Excerpt'],
  ['暂无站内正文，可点击“查看原文”阅读。', 'The full text is available at the original source.'],
  ['视频接口请求失败 ({status})', 'Video request failed ({status})'],
  ['未获取到视频播放流', 'No video stream available'],
  ['央视新闻视频', 'CCTV News video'],
  ['视频信息加载失败', 'Could not load video information'],
  ['当前浏览器不支持播放该格式视频', 'This browser can’t play this video format'],
  ['播放器初始化失败', 'Could not start the video player'],
  ['无法加载视频', 'Could not load the video'],
  ['正在加载央视新闻视频...', 'Loading CCTV News video…'],
  ['央视新闻 · 视频报道', 'CCTV News · Video'],
  ['播放视频: {title}', 'Play video: {title}'],
  ['点击即可在线播放高清视频新闻', 'Select play to watch the video.'],
  ['文章封面', 'Article cover'],
  ['预览图片：{label}', 'Preview image: {label}'],
  ['图片预览', 'Image preview'],
  ['关闭图片预览', 'Close image preview'],
  ['来源：', 'Source:'],
  ['来源暂缺', 'Source unavailable'],
  ['暂无已发布的 AI 事件', 'No published AI events yet'],
  ['查看 AI 频道 →', 'AI channel →'],
  ['AI 事件时间轴', 'AI event timeline'],
  ['详情与来源 →', 'Details and sources →'],
  ['加载失败，请重试', 'Could not load. Try again.'],
  ['已显示全部事件', 'All events shown'],
  ['加载更多', 'Load more'],
  ['更早事件 →', 'Earlier events →'],
  ['暂无内容', 'No content yet'],
  ['暂时无法加载', 'Could not load'],
  ['请稍后刷新', 'Refresh in a moment'],
  ['{count} 条内容', 'Items: {count}'],
  ['编程语言', 'Programming language'],
  ['编程语言：', 'Programming language:'],
  ['已到底部', 'You’ve reached the end'],
  ['暂无未读文章', 'No unread articles'],
  ['查看更早内容', 'Browse earlier stories'],
  ['频道快速切换', 'Quick channel navigation'],
  ['各频道最新', 'Latest by channel'],
  ['定制我的关注 →', 'Manage followed sources →'],
  ['进入', 'Open'],
  ['暂无更新', 'No updates yet'],
  ['查看今日要闻摘要与往期归档。', 'Read today’s top stories or browse past briefings.'],
  ['进入日报', 'Read the briefing'],
  ['模型评测', 'Model benchmarks'],
  ['全榜 →', 'Full rankings →'],
  ['主流大模型基准实测排名。', 'Benchmarks for leading AI models.'],
  ['开源排行', 'Open-source rankings'],
  ['热门交汇', 'Trending across sources'],
  ['更新延迟', 'Updates delayed'],
  ['篇聚合', 'stories'],
  ['热点排行暂不可用', 'Trending stories are unavailable'],
  ['暂未发现符合条件的热点', 'No matching stories yet'],
  ['源交汇', 'sources'],
  [
    '在终端执行以下命令，添加服务到 OpenAI Codex CLI：',
    'Run this command to add the service to OpenAI Codex CLI:'
  ],
  ['或在 Codex 配置文件中添加：', 'Or add it to your Codex configuration:'],
  [
    '添加后，在终端运行 codex mcp list 可查看连接状态与可用工具。',
    'Run codex mcp list to check the connection and available tools.'
  ],
  [
    '在终端执行以下命令，注册到 Claude Code CLI：',
    'Run this command to register the service with Claude Code CLI:'
  ],
  [
    '添加后，在终端运行 claude mcp list 可查看已启用的工具。',
    'Run claude mcp list to see the enabled tools.'
  ],
  [
    '在项目根目录执行以下命令生成配置文件：',
    'Run this command from the project root to generate the configuration:'
  ],
  [
    '或手动创建/编辑配置文件，或在 Cursor Settings -> Features -> MCP 中添加：',
    'You can also edit the config file or add the service under Features → MCP in Cursor Settings:'
  ],
  [
    '在 Windsurf 全局配置中添加远程 MCP 服务：',
    'Add the remote MCP service to your global Windsurf configuration:'
  ],
  [
    '使用 mcp-remote 桥接远程 Streamable HTTP 服务：',
    'Use mcp-remote to connect to the remote Streamable HTTP service:'
  ],
  [
    'macOS 路径: ~/Library/Application Support/Claude/claude_desktop_config.json | Windows 路径: %APPDATA%\\Claude\\claude_desktop_config.json',
    'macOS: ~/Library/Application Support/Claude/claude_desktop_config.json | Windows: %APPDATA%\\Claude\\claude_desktop_config.json'
  ],
  ['cURL / 终端直调', 'cURL / terminal'],
  [
    '在终端直接发送 JSON-RPC 2.0 请求调用 get_news 工具：',
    'Send a JSON-RPC 2.0 request from a terminal to call get_news:'
  ],
  ['Streamable HTTP 地址', 'Streamable HTTP URL'],
  ['复制 MCP 服务地址', 'Copy MCP service URL'],
  ['已复制', 'Copied'],
  ['复制地址', 'Copy URL'],
  ['客户端接入配置', 'Client configuration'],
  ['在终端执行以下命令：', 'Run this command in a terminal:'],
  ['复制 {label} 命令', 'Copy {label} command'],
  ['复制命令', 'Copy command'],
  ['配置文件内容：', 'Configuration:'],
  ['复制 {label} 配置', 'Copy {label} configuration'],
  ['复制配置', 'Copy configuration'],
  ['即将打开外部链接', 'Open external link'],
  [
    '将跳转到第三方站点，请注意链接安全。',
    'You’re about to open a third-party site. Check the link before continuing.'
  ],
  ['取消', 'Cancel'],
  ['继续访问', 'Continue'],
  ['已复制订阅地址', 'Feed URL copied'],
  ['请手动复制上方地址', 'Copy the URL above manually.'],
  ['RSS 订阅', 'RSS subscription'],
  ['订阅 {section} RSS', 'Subscribe to {section} via RSS'],
  ['关闭弹窗', 'Close dialog'],
  ['订阅范围', 'Subscription scope'],
  ['整个频道', 'Entire channel'],
  ['自选来源', 'Selected sources'],
  ['按频道筛选', 'Filter by channel'],
  ['已选', 'Selected'],
  ['清空选择', 'Clear selection'],
  ['选择订阅来源', 'Select feed sources'],
  ['Feed 地址', 'Feed URL'],
  ['请选择至少一个来源', 'Select at least one source'],
  ['复制', 'Copy'],
  ['来源筛选', 'Filter by source'],
  ['加载中', 'Loading'],
  ['正在加载…', 'Loading…'],
  ['部分来源暂时无法加载，请稍后再试。', 'Some sources are unavailable. Try again in a moment.'],
  ['暂时无法加载，请稍后再试。', 'Could not load. Try again in a moment.'],
  ['暂无内容。', 'No content yet.'],
  ['视图', 'View'],
  ['专题', 'Explore'],
  ['站点信息', 'Site information'],
  ['关于', 'About'],
  ['隐私', 'Privacy'],
  ['今日热点首页', 'Today’s Headlines home'],
  ['今日热点', 'Today’s Headlines'],
  ['打开频道目录', 'Open channel menu'],
  ['关闭目录', 'Close menu'],
  ['移动端导航', 'Mobile navigation'],
  ['热点', 'Stories'],
  ['日报', 'Briefing'],
  ['跳到正文', 'Skip to content'],
  ['安装命令', 'Install command'],
  ['安装', 'Install'],
  ['请手动复制下方命令', 'Copy the command below manually.'],
  ['阅读', 'Read'],
  ['原文', 'Original'],
  ['未找到匹配的 Skill', 'No matching skills'],
  ['清除筛选', 'Clear filters'],
  ['搜索 Skills', 'Search skills'],
  ['筛选名称或仓库…', 'Filter by name or repository…'],
  ['清除搜索', 'Clear search'],
  ['列表', 'List'],
  ['卡片', 'Cards'],
  ['总榜', 'Overall'],
  ['上升最快', 'Fastest growing'],
  ['总计', 'Total'],
  ['全部', 'All'],
  ['切换为浅色', 'Switch to light theme'],
  ['切换为深色', 'Switch to dark theme'],
  ['浅色白瓷', 'Light'],
  ['午夜深蓝', 'Dark'],
  ['日报往期', 'Past briefings'],
  ['往期', 'Archive'],
  ['最新', 'Latest'],
  ['← 上月', '← Previous month'],
  ['下月 →', 'Next month →'],
  ['本月', 'This month'],
  ['日期切换 ▾', 'Choose date ▾'],
  ['阅读 {date} 日报', 'Read briefing for {date}'],
  ['头条', 'Top story'],
  ['往期 ·', 'Archive ·'],
  ['覆盖', 'Covers'],
  ['总览', 'Overview'],
  ['今日概览', 'Today’s overview'],
  [
    '依据站内收录自动整理，请以原文为准 ·',
    'Compiled from indexed stories. Check the original sources. ·'
  ],
  ['相邻期次', 'Adjacent briefings'],
  ['← 上一期', '← Previous issue'],
  ['下一期 →', 'Next issue →'],
  ['原始', 'Raw'],
  ['折算', 'Normalized'],
  ['综合评分', 'Overall score'],
  ['排名', 'Rank'],
  ['输入 ¥', 'Input ¥'],
  ['/ 输出 ¥', '/ Output ¥'],
  ['· 缓存 ¥{price}', '· Cached ¥{price}'],
  ['/ 百万 Token', '/ million tokens'],
  ['暂无官方定价', 'Official pricing unavailable'],
  ['分项成绩', 'Category scores'],
  ['实测明细', 'Benchmark results'],
  ['未测基准（', 'Untested benchmarks ('],
  [
    '折算分为跨公开评测集换算后的统一分值，便于横向对比。',
    'Normalized scores put results from different public benchmarks on a common scale for comparison.'
  ],
  ['搜索模型', 'Search models'],
  ['筛选模型或机构…', 'Filter by model or provider…'],
  ['评测维度', 'Benchmark category'],
  ['未找到匹配模型', 'No matching models'],
  ['OpenAI 最新动态与官方文章', 'Latest OpenAI news and official articles'],
  ['{name}：{description}。', '{name}: {description}.'],
  ['ChatGPT 更新日志与新功能', 'ChatGPT release notes and new features'],
  [
    'OpenAI、ChatGPT、Anthropic、DeepSeek、GLM、Gemini 与 Qwen 的官方动态',
    'Official updates from OpenAI, ChatGPT, Anthropic, DeepSeek, GLM, Gemini, and Qwen'
  ],
  [
    '开发者社区、开源项目与科技媒体的当前热点',
    'Trending stories from developer communities, open-source projects, and technology publications'
  ],
  [
    '新华社、央视、中新网、澎湃、界面、百度与国际深度新闻报道',
    'News from Xinhua, CCTV, China News Service, The Paper, Jiemian, Baidu, and international outlets'
  ],
  [
    '视频、问答、极客社区与数字文化平台的当前热门内容',
    'Trending posts from video, Q&A, technology, and digital culture platforms'
  ],
  [
    '市场快讯、商业新闻、宏观分析与财经媒体的当前热点',
    'Market updates, business news, macroeconomic analysis, and finance headlines'
  ],
  [
    '游戏媒体、深度评论、独立游戏与主机平台动态',
    'Gaming news, criticism, indie games, and console updates'
  ],
  ['当前热门与增长最快的 AI Agent Skills', 'The most popular and fastest-growing AI agent skills'],
  ['Skills 排行榜', 'Skill rankings'],
  ['每周热门中文开源项目', 'Weekly trending Chinese-language open-source projects'],
  ['热门技术讨论', 'Trending technology discussions'],
  ['本周热门文章', 'Popular articles this week'],
  ['热门科技资讯', 'Trending technology news'],
  ['科技与商业热门资讯', 'Trending technology and business news'],
  ['GitHub 官方文章与产品动态', 'Official GitHub articles and product updates'],
  [
    'Cloudflare 官方技术文章与产品动态',
    'Official Cloudflare engineering articles and product updates'
  ],
  ['前沿科技商业与大模型特稿', 'Features on the technology business and AI models'],
  [
    'NVIDIA 官方中文技术博客与企业动态',
    'NVIDIA’s Chinese-language engineering blog and company news'
  ],
  ['AMD 官方中文新闻与新闻稿', 'Official AMD news and press releases in Chinese'],
  ['AI 新闻与分析，英文全文', 'AI news and analysis in English'],
  [
    'Arm 官方新闻稿与技术博客，英文全文',
    'Official Arm press releases and engineering articles in English'
  ],
  ['Ed Zitron 的科技产业评论', 'Ed Zitron’s commentary on the technology industry'],
  ['中国科技、芯片与政策分析', 'Analysis of technology, chips, and policy in China'],
  ['软件安全研究与工程实践', 'Software security research and engineering practices'],
  ['大型科技公司与产业报道', 'Coverage of major technology companies and the industry'],
  ['软件工程团队与开发实务', 'Software engineering teams and development practices'],
  ['创业公司与科技投资报道', 'Coverage of startups and technology investing'],
  ['Vercel 官方博客与更新日志', 'Official Vercel blog and changelog'],
  ['JavaScript 工具链与开源项目动态', 'JavaScript tooling and open-source updates'],
  ['芯片架构与性能分析', 'Chip architecture and performance analysis'],
  ['Linear 产品、设计与团队实践', 'Linear product updates, design, and team practices'],
  ['Ars Technica 的科技与 AI 报道', 'Technology and AI coverage from Ars Technica'],
  ['独立科技调查与报道', 'Independent technology reporting and investigations'],
  ['Bun 官方版本发布与更新说明', 'Official Bun releases and changelogs'],
  ['Rust 官方博客与版本发布动态', 'Official Rust blog and release updates'],
  ['Go 语言官方技术博客与生态更新', 'Official Go engineering blog and ecosystem updates'],
  ['Svelte 与 SvelteKit 官方博客动态', 'Official blog updates for Svelte and SvelteKit'],
  [
    'TypeScript 官方发布说明与语言特性解析',
    'Official TypeScript release notes and language features'
  ],
  ['Swift 官方语言更新与工程博客', 'Official Swift language updates and engineering blog'],
  ['Kotlin 官方博客、多平台与工具链动态', 'Official Kotlin blog, multiplatform news, and tooling'],
  ['Netflix 工程团队架构与系统实践博客', 'Architecture and systems work from Netflix Engineering'],
  ['Meta 工程团队系统、基础设施与 AI 实践', 'Systems, infrastructure, and AI engineering at Meta'],
  [
    'Web 前端工程、CSS 与交互设计长文',
    'In-depth articles on frontend engineering, CSS, and interaction design'
  ],
  [
    'JavaScript 生态与前端工具精选周刊',
    'Weekly picks from the JavaScript ecosystem and frontend tooling'
  ],
  [
    'Go 语言社区开源库与工程实践周刊',
    'Weekly open-source libraries and engineering practices from the Go community'
  ],
  ['Rust 社区每周进展、RFC 与热门项目汇总', 'Weekly Rust community updates, RFCs, and projects'],
  ['网络安全深度调查与漏洞事件报道', 'Cybersecurity investigations and vulnerability coverage'],
  [
    '麻省理工科技评论前沿科技与 AI 报道',
    'Emerging technology and AI coverage from MIT Technology Review'
  ],
  [
    '科技爱好者周刊，记录每周值得分享的科技内容',
    'A weekly selection of noteworthy technology stories'
  ],
  [
    'Chrome 官方开发者博客，涵盖 Web 平台、DevTools 与端侧 AI',
    'The official Chrome developer blog covering the web platform, DevTools, and on-device AI'
  ],
  ['当前安装量领先的 Skills', 'Skills with the most installs'],
  ['过去 24 小时增长最快的 Skills', 'Fastest-growing skills over the last 24 hours'],
  ['新华网新闻', 'Xinhua news'],
  ['央视国内新闻', 'Domestic news from CCTV'],
  ['中新网滚动新闻', 'Latest China News Service stories'],
  ['澎湃新闻热榜', 'Trending stories from The Paper'],
  ['界面新闻中国频道', 'China coverage from Jiemian News'],
  ['百度实时热搜', 'Trending searches on Baidu'],
  [
    '非营利调查新闻与公共利益深度报道，英文全文',
    'Nonprofit investigative journalism and public-interest reporting in English'
  ],
  [
    '气候、能源与环境调查新闻，英文全文',
    'Climate, energy, and environmental investigations in English'
  ],
  [
    '全球非西方世界科技、产业与社会深度报道，英文全文',
    'In-depth English-language coverage of technology, industry, and society beyond the West'
  ],
  [
    '全球政经、科技与商业深度新闻资讯，英文全文',
    'In-depth global politics, economics, technology, and business coverage in English'
  ],
  [
    '官方新闻与开发者工程博客，英文全文',
    'Official news and developer engineering posts in English'
  ],
  ['产品更新日志', 'Product changelog'],
  ['官方文章与研究', 'Official articles and research'],
  ['官方公告', 'Official announcements'],
  ['模型与平台更新', 'Model and platform updates'],
  ['官方文章', 'Official articles'],
  ['Google Antigravity 官方博客与产品动态', 'Official Google Antigravity blog and product updates'],
  ['Groq 官方博客与新闻', 'Official Groq blog and news'],
  ['Cohere 官方博客英文全文', 'Official Cohere blog posts in English'],
  ['MiniMax 官方博客与新闻动态，英文全文', 'Official MiniMax blog and news in English'],
  [
    'Kimi 官方研究博客与开源模型发布，英文全文',
    'Official Kimi research blog and open-source model releases in English'
  ],
  [
    'vLLM 官方技术博客、版本发布与模型适配指南，英文全文',
    'Official vLLM engineering posts, releases, and model integration guides in English'
  ],
  [
    'Modal 官方工程博客、AI 基础设施与沙箱技术，英文全文',
    'Official Modal engineering blog on AI infrastructure and sandboxing, in English'
  ],
  [
    '官方语音 AI 研究、产品动态与客户案例',
    'Official voice AI research, product updates, and customer stories'
  ],
  [
    '企业级 AI Agent 平台官方新闻、研究与工程实践全文',
    'Official enterprise AI agent platform news, research, and engineering articles'
  ],
  [
    '机器学习研究博客、工程长文与论文摘要全文',
    'Machine learning research posts, engineering articles, and paper summaries'
  ],
  [
    'AI 模型发布、推理工程与系统研究博客全文',
    'AI model releases, inference engineering, and systems research'
  ],
  [
    '前 OpenAI 安全主管技术深度长文',
    'In-depth engineering articles by a former OpenAI safety lead'
  ],
  ['LLM 与 AI 开发者前沿专栏', 'Recent developments in LLMs for AI developers'],
  ['AI 模型能力与安全评估研究', 'Research on AI model capabilities and safety evaluations'],
  ['伯克利人工智能研究实验室博客', 'Berkeley Artificial Intelligence Research blog'],
  ['Sebastian Raschka 的大模型技术专栏', 'Sebastian Raschka’s articles on large language models'],
  ['AWS 机器学习工程与实践', 'Machine learning engineering and practices from AWS'],
  ['前沿 AI 安全研究', 'Frontier AI safety research'],
  [
    'Nathan Lambert 的开放模型与 AI 研究专栏',
    'Nathan Lambert’s articles on open models and AI research'
  ],
  ['Jack Clark 的 AI 研究与政策周报', 'Jack Clark’s weekly newsletter on AI research and policy'],
  ['AI 工程访谈与行业动态', 'AI engineering interviews and industry news'],
  ['AI、科技与研究者长访谈', 'Long-form interviews on AI, technology, and research'],
  ['全站热门视频', 'Trending videos across the site'],
  ['知乎热门问题', 'Trending questions on Zhihu'],
  ['数码与科技讨论', 'Discussion of devices and technology'],
  ['热门社区话题', 'Trending community topics'],
  ['数字生活社区文章', 'Community articles on digital life'],
  ['今日头条热门话题', 'Trending topics on Toutiao'],
  [
    '数字消费、产品文化与生活方式社区报道',
    'Coverage of consumer technology, product culture, and lifestyle'
  ],
  ['实用软件推荐与数字效率工具社区', 'Software recommendations and digital productivity tools'],
  [
    '中文开源、极客与互联网社区资讯',
    'Chinese-language news on open source, technology, and internet communities'
  ],
  [
    '数字生活技巧、效率实践与消费社区指南，英文全文',
    'Digital life tips, productivity, and consumer guides in English'
  ],
  [
    '数字版权、流媒体政策与 P2P 社区文化报道，英文全文',
    'English-language coverage of digital copyright, streaming policy, and P2P communities'
  ],
  [
    '互联网生态与苹果社区观察评论，英文全文',
    'Commentary on the web and Apple community in English'
  ],
  ['市场与商业热门文章', 'Trending articles on markets and business'],
  ['热门财经新闻', 'Trending financial news'],
  ['市场快讯', 'Market updates'],
  ['财经头条', 'Finance headlines'],
  ['证券市场要闻', 'Securities market news'],
  [
    '财富商业、科技公司与全球市场深度报道，英文全文',
    'Fortune’s in-depth business, technology company, and global market reporting in English'
  ],
  [
    '全球加密金融、监管与 DeFi 机构市场报道，英文全文',
    'Global crypto finance, regulation, and institutional DeFi reporting in English'
  ],
  [
    'Tyler Cowen 经济学、市场制度与宏观研究专栏，英文全文',
    'Tyler Cowen’s English-language articles on economics, markets, and macroeconomic research'
  ],
  [
    'Barry Ritholtz 宏观市场策略与财富管理观察，英文全文',
    'Barry Ritholtz’s English-language commentary on market strategy and wealth management'
  ],
  [
    '每日金融市场、量化与资产配置深度文摘，英文全文',
    'Daily roundup on financial markets, quantitative investing, and asset allocation, in English'
  ],
  [
    'Nick Maggiulli 数据驱动投资、收益与个人理财长文，英文全文',
    'Nick Maggiulli’s English-language articles on data-driven investing, returns, and personal finance'
  ],
  [
    'Laura Shin 加密货币市场、行业公司与政策深度报道，英文全文',
    'Laura Shin’s in-depth English-language coverage of crypto markets, companies, and policy'
  ],
  [
    'Robinhood 旗下全球金融市场资讯与 Sherwood Snacks 每日早报，英文全文',
    'Global market news from Robinhood’s Sherwood and the daily Sherwood Snacks briefing, in English'
  ],
  ['游戏新闻与新品资讯', 'Gaming news and new releases'],
  ['游戏文化与编辑文章', 'Gaming culture and editorial features'],
  ['热门游戏新闻', 'Trending gaming news'],
  ['游戏资讯与行业动态', 'Gaming news and industry updates'],
  ['独立游戏与开发者文章', 'Indie games and developer articles'],
  ['严肃游戏人文与产业深度特稿', 'In-depth features on gaming culture and the industry'],
  [
    '海外游戏美术、VFX、图形技术与开发者专访全文',
    'Game art, VFX, graphics technology, and developer interviews'
  ],
  ['IGN 游戏报道与评测', 'Gaming news and reviews from IGN'],
  ['PC 游戏新闻与评测', 'PC gaming news and reviews'],
  [
    'PlayStation 官方繁体中文游戏动态',
    'Official PlayStation gaming updates in Traditional Chinese'
  ],
  ['Xbox 官方游戏与平台动态', 'Official Xbox game and platform updates'],
  ['游戏产业报道与市场分析', 'Gaming industry reporting and market analysis'],
  ['游戏新闻与文化特稿', 'Gaming news and cultural features'],
  [
    '独立编辑运营的游戏行业深度报道与评论，英文全文',
    'Independent gaming industry reporting and commentary in English'
  ],
  [
    'Ars Technica 游戏主机、PC 硬件与游戏产业专题，英文全文',
    'Ars Technica features on consoles, PC hardware, and the gaming industry, in English'
  ],
  [
    '角色扮演游戏评测、新闻与专题专栏，英文全文',
    'Role-playing game reviews, news, and features in English'
  ],
  [
    'PlayStation 生态游戏资讯、评测与新游动态，英文全文',
    'PlayStation gaming news, reviews, and releases in English'
  ],
  [
    'Steam Deck、掌机 PC 与独立游戏深度报道，英文全文',
    'In-depth coverage of Steam Deck, handheld PCs, and indie games, in English'
  ],
  ['关注{source}', 'Follow {source}'],
  ['隐藏{source}', 'Hide {source}'],
  ['稍后读（{count} 篇）', 'Read later ({count})'],
  ['内容来自 {source}，完整内容以原文为准。', 'From {source}. See the original for the full text.'],
  ['{count} 期', 'Issues: {count}'],
  ['条事件 ·', 'events ·'],
  ['篇来源', 'sources'],
  ['项基准 · 覆盖率', 'benchmarks · Coverage'],
  ['浏览 {name}', 'Browse {name}'],
  ['{count} 条', '{count} results'],
  ['{shown} / {total} 条', '{shown} / {total} results'],
  ['{shown} / {total} 款', '{shown} / {total} models'],
  ['共 {total} 款', '{total} models'],
  [
    '今日热点 - AI、科技、新闻、财经与游戏热榜',
    'Today’s Headlines – AI, technology, news, finance, and gaming'
  ],
  [
    '可在顶部「RSS」弹窗复制全站或分频道的 RSS 2.0 地址（如 /feeds/ai.xml），粘贴到阅读器使用。AI 客户端可接入',
    'Use the RSS menu at the top to copy the site-wide or channel RSS 2.0 URL, such as /feeds/ai.xml, into your reader. AI clients can connect through the'
  ],
  ['MCP 接口', 'MCP service'],
  [
    '浏览无需登录。数据处理与外链跳转规则见',
    'You can browse without signing in. For data handling and external links, see the'
  ],
  ['与', 'and'],
  ['由', 'Maintained by'],
  [
    '维护。链接失效、排版异常或信源增补反馈，请提交到',
    '. Report broken links and layout issues, or suggest new sources, on'
  ],
  ['。', '.'],
  ['平台 ID（如', 'Platform ID (such as'],
  ['）或频道名（如', ') or channel name (such as'],
  ['、', ', '],
  ['）。', ').'],
  ['分', 'points'],
  ['项', 'benchmarks'],
  ['第 {rank} 名', '#{rank}'],
  ['未测基准（{count}）', 'Untested benchmarks ({count})'],
  ['本月 {count} 期', 'Issues this month: {count}'],
  ['管理文章来源 · 已关注 {count} 个', 'Manage sources · Following {count}'],
  ['一', 'Mon'],
  ['二', 'Tue'],
  ['三', 'Wed'],
  ['四', 'Thu'],
  ['五', 'Fri'],
  ['六', 'Sat'],
  ['日', 'Sun'],
  ['综合', 'Overall'],
  ['代码与编程', 'Coding'],
  ['编程', 'Coding'],
  ['逻辑科研', 'Scientific reasoning'],
  ['科研', 'Scientific reasoning'],
  ['专业办公 Agent', 'Workplace agents'],
  ['专业办公', 'Professional work'],
  ['知识问答', 'Knowledge and Q&A'],
  ['真人盲选', 'Human preference'],
  ['评测', 'Benchmark'],
  ['请输入至少 2 个字或字符', 'Enter at least 2 characters.'],
  ['关键词请控制在 80 个字符以内', 'Use 80 characters or fewer.'],
  ['请去掉星号后再搜索', 'Remove asterisks to search.'],
  ['链接已停止放行', 'Link unavailable'],
  [
    '目标地址无效或不是可访问的 Web 链接，本站没有继续提供跳转入口。',
    'This destination is invalid or unavailable.'
  ],
  ['返回热点列表', 'Back to stories'],
  [
    '即将离开今日热点，请注意账号财产安全',
    'You’re leaving Today’s Headlines. Take care with account and payment information.'
  ]
])
