const fs = require('fs');
const content = fs.readFileSync('src/data/sampleData.ts', 'utf8');
const newArticles = `
  { id: "wiki-kb-002", title: "无限画布·使用指南", entityType: "concept", content: "# 使用指南\n\n## 账号与登录\n注册：手机号+短信验证码，30秒完成。\n\n## 画布基础操作\n平移：空格+鼠标拖拽 | 缩放：滚轮 | 节点创建：双击空白\n连线：右侧圆点到左侧圆点 | 撤销Ctrl+Z最多50步\n\n## 核心节点\n图片：Seedream 5.0/4.5, Nano Banana Pro(会员), GPT Image 2\n视频：Seedance 2.0/Fast, Veo 3.1, HappyHorse\n文本：GPT-5.5, Gemini 3.1 Pro | 语音：专业TTS多音色", tags: ["使用指南","操作手册"], createdAt: "2026-07-18T00:00:00Z", updatedAt: "2026-07-18T00:00:00Z", relatedIds: ["wiki-kb-001","wiki-kb-003"] },
  { id: "wiki-kb-003", title: "无限画布·创作技巧", entityType: "concept", content: "# 创作技巧\n\n## 画质提示词\n杰作最高画质超高分辨率真人写实电影级光影大光比浅景深禁止AI感\n\n## 漫剧标准\n开篇必须抛出冲突|每集220-280字|主角标签极端清晰\n\n## 工作流\n故事方向→AI编导剧本→导演评分→拆分镜→批量生图→批量生视频→配音对口型→合成导出", tags: ["创作技巧","提示词","漫剧"], createdAt: "2026-07-18T00:00:00Z", updatedAt: "2026-07-18T00:00:00Z", relatedIds: ["wiki-kb-001"] },
  { id: "wiki-kb-004", title: "商务销售QA", entityType: "overview", content: "# 商务QA\nQ1代理？不是套壳，底层模型发动机我们做整车生产线\nQ2和可灵区别？它们偏生成一段视频我们偏整条内容生产流程\nQ3替代真人？分场景漫剧产品场景稳定性高极度写实不稳定\nQ4价格？积分制按模型x分辨率x时长\nQ5版权？自有素材可商用第三方IP需确认授权", tags: ["商务QA","销售话术","竞品对比"], createdAt: "2026-07-18T00:00:00Z", updatedAt: "2026-07-18T00:00:00Z", relatedIds: ["wiki-kb-001"] },
  { id: "wiki-kb-005", title: "积分计费规则", entityType: "concept", content: "# 计费规则\n图片Seedream5.0=25积分/张 NanoBananaPro2K=100积分(会员)\n视频Seedance2.0 1080p=375积分/秒 Fast720p=110积分/秒 Veo3.1 1080p=140积分/秒\n文本1积分/千字 语音普通1积分/百字对口型2积分/百字\n高清放大2倍20积分 姿势编辑250-400积分/次\n先预扣再结算失败自动退款积分永久有效79元万积分体验套餐", tags: ["定价","积分","计费"], createdAt: "2026-07-18T00:00:00Z", updatedAt: "2026-07-18T00:00:00Z", relatedIds: ["wiki-kb-004"] },
  { id: "wiki-kb-006", title: "常见问题FAQ", entityType: "concept", content: "# FAQ\n账号：验证码收不到检查拦截等60秒|作品云端保存不丢失\n操作：节点不见了点适应屏幕|连线检查右到左|批量下载框选导出ZIP\nAI效果：生成失败检查余额敏感词切换模型|角色一致性无法100%保证\n版权：自有素材可商用第三方IP需确认授权|未经授权不会训练模型\n积分：79元万积分体验套餐一次|失败自动退还|永久有效", tags: ["FAQ","常见问题","故障排除"], createdAt: "2026-07-18T00:00:00Z", updatedAt: "2026-07-18T00:00:00Z", relatedIds: ["wiki-kb-002","wiki-kb-005"] },
`;
const insertPos = content.lastIndexOf('];');
fs.writeFileSync('src/data/sampleData.ts', content.slice(0, insertPos) + newArticles + content.slice(insertPos));
console.log('Done');
