const fs = require('fs');
const content = fs.readFileSync('src/data/sampleData.ts', 'utf8');

const newArticles = `
  {
    id: "wiki-kb-002",
    title: "无限画布·使用指南",
    entityType: "concept",
    content: ` + "`" + `# 使用指南

## 账号与登录
注册：手机号+短信验证码，30秒完成。支持短信验证码/密码登录。多设备云端保存。

## 画布基础操作
平移：空格+鼠标拖拽 | 缩放：滚轮 | 节点创建：双击空白/右键添加
连线：右侧圆点→左侧圆点（输出到输入）| 撤销：Ctrl+Z（最多50步）

## 核心节点
图片生成：Seedream 5.0/4.5, Nano Banana Pro(会员), GPT Image 2
视频生成：Seedance 2.0/2.0 Fast, Veo 3.1, HappyHorse
文本生成：GPT-5.5, Gemini 3.1 Pro
语音合成：专业TTS，10种音色` + "`" + `,
    tags: ["使用指南", "操作手册", "入门教程"],
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
    relatedIds: ["wiki-kb-001", "wiki-kb-003"],
  },
  {
    id: "wiki-kb-003",
    title: "无限画布·创作技巧",
    entityType: "concept",
    content: ` + "`" + `# 创作技巧与最佳实践

## 视频画质提升通用提示词
杰作，最高画质，超高分辨率，真人写实，实拍质感，真实皮肤纹理，电影级光影，大光比，浅景深背景虚化，禁止AI感

## 漫剧剧本标准
开篇（0-3秒）：必须抛出冲突，禁止铺垫日常
节奏：单集至少1次小冲突，每3-4集一次反转
台词量：每集220-280字

## AI短剧工作流
故事方向 → AI编导剧本 → 导演评分诊断 → 拆分镜 → 批量生图 → 批量生视频 → 配音/对口型 → 合成导出` + "`" + `,
    tags: ["创作技巧", "提示词", "漫剧", "工作流"],
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
    relatedIds: ["wiki-kb-001", "wiki-kb-002"],
  },
  {
    id: "wiki-kb-004",
    title: "商务销售QA与话术",
    entityType: "overview",
    content: ` + "`" + `# 商务销售QA

Q1: 你们是代理吗？A: 不是套壳。底层模型是发动机，我们做的是整车和生产线。
Q2: 和可灵即梦区别？A: 它们偏生成一段视频，我们偏完成整条内容生产流程。
Q3: 能替代真人吗？A: 分场景，漫剧/产品场景稳定性高，极度写实目前不稳定。
Q4: 价格怎么算？A: 积分制，按模型×分辨率×时长计算。
Q5: 版权归属？A: 自有素材可商用，第三方IP需确认授权。
IP授权：大明星提前授权(肖像书+身份证+照片)，小达人先用系统被拦截再补` + "`" + `,
    tags: ["商务QA", "销售话术", "竞品对比"],
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
    relatedIds: ["wiki-kb-001", "wiki-kb-005"],
  },
  {
    id: "wiki-kb-005",
    title: "积分计费规则",
    entityType: "concept",
    content: ` + "`" + `# 积分与计费规则

图片: Seedream 5.0=25积分/张, Nano Banana Pro 2K=100积分/张(会员)
视频: Seedance 2.0 1080p=375积分/秒, Fast 720p=110积分/秒, Veo 3.1 1080p=140积分/秒
文本: GPT-5.5/Gemini 3.1 = 1积分/千字
语音: 普通1积分/百字, 对口型2积分/百字
工具: 高清放大2倍20积分, 姿势编辑250-400积分/次
机制: 先预扣再结算 | 失败自动退款 | 积分永久有效` + "`" + `,
    tags: ["定价", "积分", "计费规则", "费用说明"],
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
    relatedIds: ["wiki-kb-004"],
  },
  {
    id: "wiki-kb-006",
    title: "常见问题FAQ",
    entityType: "concept",
    content: ` + "`" + `# 常见问题FAQ

账号类: 验证码收不到检查拦截等60秒重发 | 多设备可以同时登录 | 作品云端保存不丢失
操作类: 节点不见了点适应屏幕 | 连线连不上检查右到左方向 | 批量下载框选节点后导出ZIP
AI效果: 生成失败检查余额/敏感词切换模型 | 角色一致性无法100%保证
版权: 自有素材可商用 第三方IP需确认授权 | 未经授权不会用于模型训练
积分: 79元/万积分体验套餐每个账号一次 | 失败自动退还 | 永久有效` + "`" + `,
    tags: ["FAQ", "常见问题", "故障排除"],
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
    relatedIds: ["wiki-kb-002", "wiki-kb-005"],
  },
`;

const insertPos = content.lastIndexOf('];');
const newContent = content.slice(0, insertPos) + newArticles + content.slice(insertPos);
fs.writeFileSync('src/data/sampleData.ts', newContent);
console.log('Inserted 5 KB articles successfully');
