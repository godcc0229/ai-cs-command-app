import type {
  Customer,
  TierAnalysisRecord,
  CustomerKBEntry,
  ChatMessage,
  TaskCard,
  TaskBatch,
  DeliveryDesign,
  WikiArticle,
  RawDocument,
} from "@/types";

// ===== 示例客户数据 =====
export const sampleCustomers: Customer[] = [
  {
    id: "cust-001",
    companyName: "智途科技有限公司",
    contact: { name: "张明远", position: "CEO" },
    industry: "AI/人工智能",
    tier: "A",
    hasRecharge: true,
    rechargeDate: "2026-06-15",
    consumption: 580000,
    notes: "长期战略合作伙伴，已签约年度框架协议。对AI解决方案需求强劲，预算充裕。",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-07-15T14:30:00Z",
    isSample: true,
  },
  {
    id: "cust-002",
    companyName: "云帆电商集团",
    contact: { name: "李婷", position: "运营总监" },
    industry: "电子商务",
    tier: "A",
    hasRecharge: true,
    rechargeDate: "2026-05-20",
    consumption: 420000,
    notes: "电商直播业务核心客户，需要定制化内容营销方案。合作频次高。",
    createdAt: "2026-02-15T09:00:00Z",
    updatedAt: "2026-07-16T11:00:00Z",
    isSample: true,
  },
  {
    id: "cust-003",
    companyName: "星辰教育科技",
    contact: { name: "王建国", position: "CTO" },
    industry: "在线教育",
    tier: "B",
    hasRecharge: true,
    rechargeDate: "2026-04-10",
    consumption: 180000,
    notes: "教育行业潜力客户，对AI内容生成有明确需求。正在进行POC测试。",
    createdAt: "2026-03-20T10:00:00Z",
    updatedAt: "2026-07-14T09:00:00Z",
    isSample: true,
  },
  {
    id: "cust-004",
    companyName: "绿源健康管理",
    contact: { name: "陈思雨", position: "市场经理" },
    industry: "大健康",
    tier: "B",
    hasRecharge: false,
    consumption: 95000,
    notes: "健康行业新客户，正在评估产品价值。需要更多案例展示和试用支持。",
    createdAt: "2026-04-05T11:00:00Z",
    updatedAt: "2026-07-13T16:00:00Z",
    isSample: true,
  },
  {
    id: "cust-005",
    companyName: "锐步体育用品",
    contact: { name: "赵磊", position: "品牌总监" },
    industry: "体育用品",
    tier: "C",
    hasRecharge: false,
    consumption: 28000,
    notes: "初步接触阶段，对AI短视频生成感兴趣。预算有限，需要引导。",
    createdAt: "2026-05-18T13:00:00Z",
    updatedAt: "2026-07-12T10:30:00Z",
    isSample: true,
  },
  {
    id: "cust-006",
    companyName: "锦程金融服务",
    contact: { name: "周雅文", position: "副总裁" },
    industry: "金融科技",
    tier: "A",
    hasRecharge: true,
    rechargeDate: "2026-03-01",
    consumption: 750000,
    notes: "金融行业标杆客户，年消耗最高。对数据安全要求极高。",
    createdAt: "2025-11-20T08:00:00Z",
    updatedAt: "2026-07-17T10:00:00Z",
    isSample: true,
  },
  {
    id: "cust-007",
    companyName: "新视界传媒",
    contact: { name: "林小曼", position: "内容负责人" },
    industry: "文化传媒",
    tier: "B",
    hasRecharge: true,
    rechargeDate: "2026-06-01",
    consumption: 150000,
    notes: "内容生产型客户，对AI视频剪辑和文案生成依赖度高。",
    createdAt: "2026-03-10T09:30:00Z",
    updatedAt: "2026-07-16T15:00:00Z",
    isSample: true,
  },
  {
    id: "cust-008",
    companyName: "安居房产服务",
    contact: { name: "黄志强", position: "销售副总" },
    industry: "房地产",
    tier: "C",
    hasRecharge: false,
    consumption: 15000,
    notes: "传统行业转型客户，对AI工具认识不足。需要深度培训和引导。",
    createdAt: "2026-06-01T14:00:00Z",
    updatedAt: "2026-07-10T08:00:00Z",
    isSample: true,
  },
];

// ===== 示例分层分析记录 =====
export const sampleTierRecords: TierAnalysisRecord[] = [
  {
    id: "tier-001",
    customerId: "cust-001",
    customerName: "智途科技有限公司",
    previousTier: "B",
    currentTier: "A",
    analysisDate: "2026-07-15",
    reason: "季度消耗突破50万，签约年度框架协议，升级为A层重点客户",
    consumptionLevel: "high",
    isSample: true,
  },
  {
    id: "tier-002",
    customerId: "cust-002",
    customerName: "云帆电商集团",
    previousTier: "B",
    currentTier: "A",
    analysisDate: "2026-07-16",
    reason: "电商直播业务爆发，月度消耗增长300%，升级为A层",
    consumptionLevel: "high",
    isSample: true,
  },
  {
    id: "tier-003",
    customerId: "cust-003",
    customerName: "星辰教育科技",
    previousTier: "C",
    currentTier: "B",
    analysisDate: "2026-07-14",
    reason: "完成POC测试，首次充值并进入正式合作阶段，升级为B层",
    consumptionLevel: "medium",
    isSample: true,
  },
  {
    id: "tier-004",
    customerId: "cust-006",
    customerName: "锦程金融服务",
    previousTier: "A",
    currentTier: "A",
    analysisDate: "2026-07-17",
    reason: "季度复审，保持A层级。消耗稳定增长，客户满意度高",
    consumptionLevel: "high",
    isSample: true,
  },
  {
    id: "tier-005",
    customerId: "cust-007",
    customerName: "新视界传媒",
    previousTier: "C",
    currentTier: "B",
    analysisDate: "2026-07-16",
    reason: "完成首次充值，内容生产需求明确，升级为B层",
    consumptionLevel: "medium",
    isSample: true,
  },
];

// ===== 示例聊天消息 =====
export const sampleMessages: Record<string, ChatMessage[]> = {
  "cust-001": [
    {
      id: "msg-001",
      content: "张总，关于AI内容生成的定制需求，我们下周可以安排一次深入的技术交流吗？",
      sender: "小甲(FDE)",
      timestamp: "2026-07-15T10:30:00Z",
      channel: "wechat",
    },
    {
      id: "msg-002",
      content: "好的，我们技术团队正好有几个新的应用场景想和你们探讨。下周三下午可以吗？",
      sender: "张明远(CEO)",
      timestamp: "2026-07-15T10:35:00Z",
      channel: "wechat",
    },
  ],
  "cust-003": [
    {
      id: "msg-003",
      content: "王总，POC测试报告已经出来了，效果超出预期。我们什么时候可以推进正式合作？",
      sender: "小甲(FDE)",
      timestamp: "2026-07-13T14:00:00Z",
      channel: "wechat",
    },
    {
      id: "msg-004",
      content: "报告我看过了，确实不错。让运营同事准备一下合同，我们尽快签约。",
      sender: "王建国(CTO)",
      timestamp: "2026-07-13T14:15:00Z",
      channel: "wechat",
    },
  ],
};

// ===== 示例知识库条目 =====
export const sampleKBEntries: CustomerKBEntry[] = [
  {
    id: "kb-001",
    companyName: "智途科技有限公司",
    contactName: "张明远",
    contactPosition: "CEO",
    industry: "AI/人工智能",
    hasRecharge: true,
    rechargeTime: "2026-06-15",
    consumption: 580000,
    messageHistory: sampleMessages["cust-001"] || [],
    tags: ["战略客户", "AI行业", "年度框架"],
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-07-15T14:30:00Z",
    isSample: true,
  },
  {
    id: "kb-002",
    companyName: "云帆电商集团",
    contactName: "李婷",
    contactPosition: "运营总监",
    industry: "电子商务",
    hasRecharge: true,
    rechargeTime: "2026-05-20",
    consumption: 420000,
    messageHistory: [],
    tags: ["电商直播", "高消耗", "定制化需求"],
    createdAt: "2026-02-15T09:00:00Z",
    updatedAt: "2026-07-16T11:00:00Z",
    isSample: true,
  },
  {
    id: "kb-003",
    companyName: "星辰教育科技",
    contactName: "王建国",
    contactPosition: "CTO",
    industry: "在线教育",
    hasRecharge: true,
    rechargeTime: "2026-04-10",
    consumption: 180000,
    messageHistory: sampleMessages["cust-003"] || [],
    tags: ["教育行业", "POC完成", "潜力客户"],
    createdAt: "2026-03-20T10:00:00Z",
    updatedAt: "2026-07-14T09:00:00Z",
    isSample: true,
  },
];

// ===== 示例 Wiki 文章（Karpathy 风格） =====
export const sampleWikiArticles: WikiArticle[] = [
  {
    id: "wiki-001",
    title: "AI电商行业客户分析",
    entityType: "overview",
    content: `# AI电商行业客户分析

## 行业概况
AI电商行业是当前增长最快的细分市场之一。客户主要需求集中在AI内容生成、智能客服、数据分析等方面。

## 核心客户画像
- **A层客户**：年消耗50万以上，已建立深度合作
- **B层客户**：年消耗10-50万，正在深化合作
- **C层客户**：年消耗10万以下，处于培育期

## 关键洞察
1. AI内容生成是最高频需求，占比超过60%
2. 金融和电商行业客户付费意愿最强
3. 教育行业客户增长潜力最大`,
    tags: ["AI", "电商", "客户分析", "行业洞察"],
    createdAt: "2026-07-10T08:00:00Z",
    updatedAt: "2026-07-17T10:00:00Z",
    relatedIds: ["wiki-002", "wiki-003"],
  },
  {
    id: "wiki-002",
    title: "客户分层标准操作规程",
    entityType: "concept",
    content: `# 客户分层标准操作规程 (SOP)

## 分层维度
1. **消耗金额**：近3个月总消耗
2. **合作深度**：是否签约框架/年度协议
3. **增长潜力**：行业发展趋势与客户规模
4. **付费意愿**：是否已充值及充值频率

## 层级定义
### A层 - 战略客户
- 条件：消耗≥30万/季 OR 签约年度框架
- 服务：专属FDE + 商务经理 + TAM
- 频率：每周同步

### B层 - 成长客户
- 条件：消耗10-30万/季 OR 已充值
- 服务：FDE + 运营支持
- 频率：双周同步

### C层 - 培育客户
- 条件：消耗<10万/季 且 未充值
- 服务：标准化支持
- 频率：月度回访`,
    tags: ["SOP", "客户分层", "运营标准"],
    createdAt: "2026-07-08T09:00:00Z",
    updatedAt: "2026-07-17T09:00:00Z",
    relatedIds: ["wiki-001"],
  },
  {
    id: "wiki-003",
    title: "交付设计最佳实践",
    entityType: "concept",
    content: `# 交付设计最佳实践

## 交付流程
1. **需求确认** → 商务+运营联合沟通
2. **方案设计** → FDE主责，内容团队配合
3. **内部评审** → 跨团队Review
4. **客户交付** → 商务主导，FDE支持
5. **效果跟踪** → 运营持续跟进

## 文档模板
交付方案应包含：
- 客户需求概述
- 技术方案说明
- 预期效果评估
- 时间节点规划
- 资源配置清单

## 常见问题
- 需求不明确：启动前务必确认MRD
- 方案超纲：控制交付范围，避免过度承诺
- 沟通断层：每周至少一次客户同步`,
    tags: ["交付", "最佳实践", "SOP"],
    createdAt: "2026-07-05T10:00:00Z",
    updatedAt: "2026-07-17T11:00:00Z",
    relatedIds: ["wiki-001", "wiki-002"],
  },
  // ===== 内置：无限画布产品知识库 V2.0 =====
  {
    id: "wiki-kb-001",
    title: "无限画布·产品概览与定位",
    entityType: "overview",
    content: `# 无限画布产品概览

## 定位
**对外一句话：** 一块画布，把文案、图片、视频、语音和AI模型串起来，帮创作者和内容团队批量生产短视频、广告、漫剧、商品展示等视觉素材。

**进阶定位：** 从一个故事想法，到一条可发布的视频内容。不是单点生成工具，而是**AI智能编导 + 视频生产平台**。

## 核心差异（与普通AI工具）
| 维度 | 普通AI工具（可灵/即梦/Vidu等） | 无限画布 |
|------|-------------------------------|----------|
| **输入** | 提示词→生成单图/单视频 | 故事方向/脚本→整条内容生产流程 |
| **流程** | 用户自行编剧、分镜、配音、剪辑 | 系统自动完成剧本生成、诊断、分镜拆解、视频生成、配音对口型 |
| **判断** | 无，全靠用户自行判断好坏 | 内置AI导演评分系统，诊断节奏、钩子、爽点 |
| **批量** | 逐个生成 | 支持分镜组批量生成、局部重生成 |

## 适用场景
短剧创业者 / 剪辑师短视频团队 / 广告素材团队 / 小说推文漫剧IP运营 / 自媒体AI博主 / 教育培训

## 竞品对比标准口径
可灵/即梦/Vidu = 视频生成引擎（单条视频）| 无限画布 = 内容生产车间（整条链路）`,
    tags: ["无限画布", "产品定位", "竞品对比"],
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
    relatedIds: ["wiki-kb-002", "wiki-kb-003", "wiki-kb-004"],
  },
  {
    id: "wiki-kb-002",
    title: "无限画布·使用指南",
    entityType: "concept",
    content: "# 使用指南\n\n## 账号与登录\n注册：手机号+短信验证码，30秒完成。支持短信验证码/密码登录。多设备云端保存。\n\n## 画布基础操作\n平移：空格+鼠标拖拽 | 缩放：滚轮 | 节点创建：双击空白/右键添加/拖线到空白/拖拽外部文件\n连线：从右侧圆点拖到左侧圆点（输出到输入）| 撤销/重做：Ctrl+Z / Ctrl+Shift+Z（最多50步）\n\n## 核心节点功能\n### 图片生成\n模型：Seedream 5.0/4.5, Nano Banana Pro(会员), GPT Image 2\n工具：抠图、姿势编辑、扩图、高清放大(2x/4x/8x)\n\n### 视频生成\n模式：首尾帧/多图参考/动作模仿/文字生视频\n模型：Seedance 2.0(全能)/Fast(性价比), Veo 3.1, HappyHorse\n工具：截帧、裁剪、高清放大、对口型\n\n### 文本生成\n模型：GPT-5.5, Gemini 3.1 Pro\n能力：剧本编写、提示词反推、润色、翻译、风格迁移\n\n### 语音合成\n引擎：专业TTS，多音色 | 调节：情绪(10种)、语速、音量、语调",
    tags: ["使用指南", "操作手册", "入门教程"],
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
    relatedIds: ["wiki-kb-001", "wiki-kb-003"],
  },
  {
    id: "wiki-kb-003",
    title: "无限画布·创作技巧",
    entityType: "concept",
    content: "# 创作技巧与最佳实践\n\n## 视频画质提升通用提示词\n杰作，最高画质，超高分辨率，真人写实，实拍质感，真实皮肤纹理，电影级光影，大光比，浅景深背景虚化，禁止AI感，禁止建模感\n\n## 漫剧剧本标准\n开篇（0-3秒）：必须抛出冲突（欠债/背叛/羞辱），禁止铺垫日常\n节奏：单集至少1次小冲突，每3-4集一次反转\n台词量：每集220-280字（太多AI配音急促，太少内容单薄）\n人设：主角标签极端清晰，反派脸谱化不深度刻画\n\n## 反推提示词模板\n用Seedance 2.0生成的AI视频，请拆分成不同分镜，对每个分镜分析画面风格、主体、动作描述、镜头变化、人物台词等，最后给出生成类似视频的完整提示词\n\n## AI短剧工作流\n故事方向 -> AI智能编导生成剧本 -> 导演评分系统诊断 -> 一键拆分镜 -> 批量生成图片分镜 -> 批量生成视频片段 -> 配音/对口型/字幕 -> 多轨合成导出成片",
    tags: ["创作技巧", "提示词", "漫剧", "工作流"],
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
    relatedIds: ["wiki-kb-001", "wiki-kb-002"],
  },
  {
    id: "wiki-kb-004",
    title: "商务销售QA与话术",
    entityType: "overview",
    content: "# 商务销售QA与话术\n\n## Q1: 你们是代理吗？\n不是套壳。底层模型是发动机，我们做的是整车和生产线——智能编导能力 + 画布式工作流 + 批量生产 + 后期能力。\n\n## Q2: 和可灵/即梦有什么区别？\n它们偏生成一段视频，我们偏完成一条内容生产流程。短剧和广告素材不是只有生成，前面有剧本分镜，后面有配音字幕口型合成和批量测试。\n\n## Q3: 生成的视频能替代真人拍摄吗？\n分场景。漫剧/小说推文/产品场景稳定性高；极度接近真人拍摄目前行业仍不稳定。建议先用高性价比场景验证。\n\n## Q4: 价格怎么算？\n积分制，按模型x分辨率x时长计算。先做任务拆解预估成本比拍脑袋报价更准确。\n成本排序：漫剧 < 产品展示 < 剧情短视频 < 真人写实（最高）\n\n## Q5: 版权归属？\n客户自有素材和合法生成内容可用于自身业务，涉及第三方IP需单独确认授权。\n\n## IP授权流程\n大明星：提前授权（肖像书+身份证+照片）-> 整合压缩包 -> 等待通过\n小达人：先用系统，被拦截后再补授权",
    tags: ["商务QA", "销售话术", "竞品对比", "定价"],
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
    relatedIds: ["wiki-kb-001", "wiki-kb-005"],
  },
  {
    id: "wiki-kb-005",
    title: "积分计费规则",
    entityType: "concept",
    content: "# 积分与计费详细规则\n\n## 图片模型计费\nSeedream 5.0/4.5: 所有尺寸 25积分/张\nNano Banana Pro: 2K以下100积分/张, 4K为200积分/张（需会员）\nGPT Image 2: 所有尺寸 120积分/张\n\n## 视频模型计费（每秒积分 x 时长）\nSeedance 2.0: 480p=70, 720p=150, 1080p=375（需会员）\nSeedance 2.0 Fast: 480p=55, 720p=110（性价比之选）\nVeo 3.1: 720p=140, 1080p=140, 4K=280（音频翻倍）\n\n## 文本模型: GPT-5.5 / Gemini 3.1 Pro = 1积分/千字（预扣1积分，多退少补）\n\n## 语音合成: 普通配音1积分/百字 | 对口型配音2积分/百字\n\n## 工具\n高清放大：2倍20积分, 4倍40积分, 8倍80积分\n姿势编辑：250-400积分/次 | 对口型：最低100积分/次\n\n## 计费机制\n先预扣再结算 | 失败自动退款 | 积分永久有效 | 79元/万积分试用套餐",
    tags: ["定价", "积分", "计费规则", "费用说明"],
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
    relatedIds: ["wiki-kb-004"],
  },
  {
    id: "wiki-kb-006",
    title: "常见问题FAQ",
    entityType: "concept",
    content: "# 常见问题 FAQ\n\n## 账号登录类\nQ: 短信验证码收不到？A: 检查拦截，等60秒重发\nQ: 能多设备同时登录？A: 可以，但避免同时编辑同一画布\nQ: 作品会丢失吗？A: 全部保存在云端\n\n## 画布操作类\nQ: 节点不见了？A: 点击「适应屏幕」\nQ: 连线连不上？A: 检查方向（右到左），确认上游已生成\nQ: 怎么批量下载？A: 框选节点->工具栏「批量下载」-> 导出ZIP\n\n## AI生成效果类\nQ: 生成失败？A: 检查余额/敏感词/参考图质量，尝试切换模型\nQ: 角色一致性？A: 通过设定图+参考图控制，行业无法100%保证不跑偏\nQ: 产品细节准确性？A: 上传真实产品图，纯AI可能偏差\n\n## 版权与商用\nQ: 版权归谁？A: 自有素材和合法生成可用于业务，第三方IP需确认授权\nQ: 能训练模型吗？A: 未经授权不会，以隐私政策为准\n\n## 积分类\nQ: 注册送积分？A: 有79元/万积分体验套餐（每个账号一次）\nQ: 失败退积分？A: 系统自动退还 | 有效期：永久有效",
    tags: ["FAQ", "常见问题", "故障排除", "账号问题"],
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
    relatedIds: ["wiki-kb-002", "wiki-kb-005"],
  },
];
export const sampleRawDocs: RawDocument[] = [
  {
    id: "raw-001",
    title: "2026年Q2客户分析报告",
    content: `# 2026年Q2客户分析报告

## 总体数据
- 活跃客户总数：32家
- 季度新增客户：8家
- 季度总消耗：¥4,200,000
- 客户留存率：87.5%

## 分层分布
- A层：5家（占比15.6%），消耗占比62%
- B层：12家（占比37.5%），消耗占比28%
- C层：15家（占比46.9%），消耗占比10%

## 行业分布
1. AI/人工智能：8家
2. 电子商务：7家
3. 在线教育：5家
4. 金融科技：4家
5. 大健康：3家
6. 其他：5家`,
    source: "内部报告",
    ingestedAt: "2026-07-10T08:00:00Z",
    isSample: true,
  },
  {
    id: "raw-002",
    title: "客户分层规则V2.0",
    content: `# 客户分层规则 V2.0

## 更新要点
1. 增加"充值状态"作为分层辅助指标
2. A层门槛从25万调整为30万/季
3. 新增"增长潜力"评估维度
4. 引入自动升降级机制

## 自动升降级规则
- 连续2个季度达标上一层级 → 自动升级
- 连续2个季度未达当前层级 → 自动降级
- 新客户首季度暂不参与评级`,
    source: "运营团队",
    ingestedAt: "2026-07-05T14:00:00Z",
    isSample: true,
  },
];

// ===== 示例任务卡片 =====
export const sampleTasks: TaskCard[] = [
  {
    id: "task-001",
    sequenceNumber: 1,
    batchId: "batch-001",
    customerName: "智途科技有限公司",
    customerProblem: "需要定制化AI内容生成方案，要求支持多语言输出和品牌风格定制",
    requiredRoles: ["商务", "FDE", "内容"],
    urgency: "紧急",
    deadline: "2026-07-20",
    status: "in_progress",
    createdAt: "2026-07-17T09:00:00Z",
    isSample: true,
  },
  {
    id: "task-002",
    sequenceNumber: 2,
    batchId: "batch-001",
    customerName: "云帆电商集团",
    customerProblem: "电商直播AI文案生成需求激增，需要扩容方案和运营支持",
    requiredRoles: ["运营", "FDE"],
    urgency: "高",
    deadline: "2026-07-22",
    status: "pending",
    createdAt: "2026-07-17T09:00:00Z",
    isSample: true,
  },
  {
    id: "task-003",
    sequenceNumber: 3,
    batchId: "batch-001",
    customerName: "绿源健康管理",
    customerProblem: "希望了解AI短视频在健康行业的应用案例，并获取试用账号",
    requiredRoles: ["商务", "内容"],
    urgency: "中",
    deadline: "2026-07-25",
    status: "pending",
    createdAt: "2026-07-17T09:00:00Z",
    isSample: true,
  },
  {
    id: "task-004",
    sequenceNumber: 4,
    batchId: "batch-001",
    customerName: "星辰教育科技",
    customerProblem: "POC测试通过后需要签订正式合同，并规划教育行业解决方案包",
    requiredRoles: ["商务", "运营", "FDE"],
    urgency: "高",
    deadline: "2026-07-21",
    status: "in_progress",
    createdAt: "2026-07-17T09:00:00Z",
    isSample: true,
  },
  {
    id: "task-005",
    sequenceNumber: 5,
    batchId: "batch-001",
    customerName: "新视界传媒",
    customerProblem: "AI视频剪辑输出质量需优化，要求支持4K分辨率和批量处理",
    requiredRoles: ["FDE", "内容"],
    urgency: "中",
    deadline: "2026-07-24",
    status: "pending",
    createdAt: "2026-07-17T09:00:00Z",
    isSample: true,
  },
];

export const sampleBatches: TaskBatch[] = [
  {
    id: "batch-001",
    name: "2026年7月第3周客户需求批次",
    createdAt: "2026-07-17T09:00:00Z",
    taskIds: ["task-001", "task-002", "task-003", "task-004", "task-005"],
    isSample: true,
  },
];

// ===== 示例交付设计 =====
export const sampleDeliveries: DeliveryDesign[] = [
  {
    id: "del-001",
    customerId: "cust-001",
    customerName: "智途科技有限公司",
    designType: "solution",
    title: "多语言AI内容生成解决方案",
    content: `## 需求分析
智途科技需要一套支持多语言输出的AI内容生成方案，要求具备品牌风格定制能力。

## 技术方案
1. 基于大模型的多语言微调
2. 品牌风格模型训练
3. API接口标准化输出

## 交付计划
- 方案评审：7月22日
- 技术实现：7月23日-8月5日
- 客户测试：8月6日-8月10日
- 正式交付：8月15日`,
    status: "draft",
    assignedTo: ["商务", "FDE", "内容"],
    createdAt: "2026-07-17T08:00:00Z",
    updatedAt: "2026-07-17T08:00:00Z",
    isSample: true,
  },

];
