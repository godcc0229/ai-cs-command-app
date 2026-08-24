// ===== 客户层级类型（扩展为A-E五级）=====
export type CustomerTier = "A" | "B" | "C" | "D" | "E";
export type ScenarioTier = "A" | "B" | "C" | "D" | "E";

export interface CustomerContact {
  name: string;
  position: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contact: CustomerContact;
  industry: string;
  customerType?: "电商商家" | "代理商" | "品牌方" | "短剧创业者" | "剪辑团队" | "其他";
  tier: CustomerTier;
  hasRecharge: boolean;
  rechargeDate?: string;
  consumption: number; // 消耗金额 ¥
  dailyConsumption?: number; // 日均消耗
  lastLoginDate?: string;
  lastContactDate?: string;
  currentStage?: string; // 当前阶段
  blockPoint?: string; // 卡点
  nextStep?: string; // 下一步
  riskLevel?: "high" | "medium" | "low"; // 风险等级
  notes: string;
  createdAt: string;
  updatedAt: string;
  isSample?: boolean; // 演示数据标记
}

// ===== 客户分层分析记录 =====
export interface TierAnalysisRecord {
  id: string;
  customerId: string;
  customerName: string;
  previousTier: CustomerTier;
  currentTier: CustomerTier;
  analysisDate: string;
  reason: string;
  consumptionLevel: "high" | "medium" | "low";
  isSample?: boolean;
}

// ===== 场景筛选（模块二）=====
export interface ScenarioFilterResult {
  id: string;
  date: string; // YYYY-MM-DD
  totalClients: number;
  tierCounts: Record<ScenarioTier, number>;
  top10: TopClient[];
  rawInput: string; // 粘贴的原始客户数据
  aiAnalysis: string; // AI 分析摘要
  createdAt: string;
}

export interface TopClient {
  rank: number;
  customerName: string;
  tier: ScenarioTier;
  reason: string;
  suggestedAction: string;
}

// ===== 价值传递/流程重构（模块三）=====
export type FlowPhase = "activation" | "followup" | "repurchase" | "care";

export interface ActivationMessage {
  id: string;
  customerName: string;
  customerType: string;
  message: string; // <30字
  actionItem: string; // 具体行动点
  phase: "activation";
  generatedAt: string;
}

export interface FollowUpDiagnosis {
  id: string;
  customerName: string;
  diagnosis: string; // 未充值原因诊断
  suggestedApproach: string; // 建议跟进方式
  phase: "followup";
  generatedAt: string;
}

export interface RepurchaseAnalysis {
  id: string;
  customerName: string;
  usageAnalysis: string; // 使用情况分析
  nudgeMessage: string; // 催使用话术
  churnRisk: "high" | "medium" | "low"; // 流失风险
  phase: "repurchase";
  generatedAt: string;
}

export interface CareMessage {
  id: string;
  customerName: string;
  customerType: string;
  message: string; // 关怀消息
  businessContext: string; // 结合的业务场景
  phase: "care";
  generatedAt: string;
}

export type FlowOutput = ActivationMessage | FollowUpDiagnosis | RepurchaseAnalysis | CareMessage;

// ===== 交付设计（模块五增强）=====
export interface DeliveryPath {
  id: string;
  pathType: "A" | "B" | "C"; // A=电商商家 B=代理商 C=品牌方
  pathName: string;
  targetCustomerType: string;
  steps: DeliveryStep[];
  estimatedDaysToValue: number;
  generatedAt: string;
}

export interface DeliveryStep {
  stepNumber: number;
  title: string;
  csAction: string; // CS做什么
  aiAction: string; // AI做什么
  output: string; // 产出
}

// ===== 价值验证（模块七）=====
export interface DailyMetrics {
  id: string;
  date: string; // YYYY-MM-DD
  newRecharges: number; // 新充值
  trialNotRecharged: number; // 试用未充值
  rechargedNotUsing: number; // 充值未使用
  churnRisk: number; // 流失风险

  // AI 计算结果
  cumulativeRecharges: number; // 累计充值
  targetGap: number; // 距目标差（60）
  daysRemaining: number; // 剩余天数
  dailyRateNeeded: number; // 每天需充值数
  currentDailyRate: number; // 当前日均

  trialToRechargeRate: number; // 试用→充值转化率
  activationToTrialRate: number; // 开通→试用转化率

  cardAnalysis: string; // 卡点分析
  tomorrowSuggestion: string; // 明日建议
  focusTier: string; // 明日重点推哪层
  riskAlert: boolean; // 是否严重不达标

  createdAt: string;
}

// ===== 客情关怀（独立模块）=====
export interface CareBatch {
  id: string;
  name: string;
  customerIds: string[];
  customerNames: string[];
  messages: CareMessage[];
  template?: string;
  createdAt: string;
  isSample?: boolean;
}

// ===== 汇报输出（模块八）=====
export interface DailyReport {
  id: string;
  date: string; // Day X
  reportTitle: string; // CS日报 Day X

  // 3个核心数字
  todayRecharges: number;
  todayRechargesCumulative: number;
  todayRechargesGap: number;

  todayActionsPushed: number;
  todayTrialToRecharge: number;
  todayActivatedTrial: number;

  tomorrowFocus: string;
  tomorrowTargetCount: number;
  cardPoint: string; // 卡点提示

  sprintPhase: "phase1" | "phase2" | "phase3"; // 1-5天 / 6-10天 / 11-15天
  content: string; // AI生成的完整日报文本
  createdAt: string;
}

export interface SprintPlanDay {
  day: number;
  phase: 1 | 2 | 3;
  focus: string; // 你干什么
  aiHelps: string; // AI帮你什么
  acceptance: string; // 验收标准
  status: "pending" | "in_progress" | "completed";
  actualResult?: string;
}

export interface SprintPlan {
  id: string;
  title: string;
  startDate: string;
  targetRevenue: number; // 30万
  targetClients: number; // 60个
  days: SprintPlanDay[];
  createdAt: string;
}

// ===== 工具落地（模块四 - 工作台）=====
export interface WorkspaceTrackerRow {
  id: string;
  customerName: string;
  customerType: string;
  openDate: string; // 开通日期
  hasRecharged: boolean;
  rechargeAmount: number; // 充值金额
  dailyConsumption: number; // 日均消耗
  lastLogin: string; // 最后登录
  lastContact: string; // 最后沟通
  currentStage: string; // 当前阶段
  blockPoint: string; // 卡点
  nextStep: string; // 下一步
  riskLevel: "high" | "medium" | "low"; // 风险
  updatedAt: string;
}

// ===== 组织协同（模块六）=====
export type CoordRole = "FDE" | "BD" | "内容" | "技术";

export interface CoordinationLine {
  clientIssue: string; // 客户问题
  assignTo: CoordRole; // 任务给谁
}

export interface CoordinatedTask {
  id: string;
  taskName: string;
  customerName: string;
  problem: string;
  priority: UrgencyLevel;
  deadline: string;
  acceptanceCriteria: string;
  assignedTo: CoordRole;
  status: "pending" | "in_progress" | "completed";
  batchId?: string;
  createdAt: string;
  isSample?: boolean;
}

export const DEFAULT_COORD_LINES: CoordinationLine[] = [
  { clientIssue: "不会用/要Demo", assignTo: "FDE" },
  { clientIssue: "素材不行/要教程", assignTo: "内容" },
  { clientIssue: "接口报错/Bug", assignTo: "技术" },
  { clientIssue: "续费/加购/转介绍", assignTo: "BD" },
];

// ===== 知识库相关 =====
export interface WikiArticle {
  id: string;
  title: string;
  entityType: "company" | "contact" | "industry" | "concept" | "overview";
  content: string;
  tags: string[];
  sourceId?: string;
  createdAt: string;
  updatedAt: string;
  relatedIds: string[];
  isSample?: boolean;
}

export interface RawDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  ingestedAt: string;
  fileName?: string;      // 上传的原始文件名
  fileType?: string;      // 文件类型: pdf/txt/md/docx/xlsx
  fileSize?: number;      // 文件大小(bytes)
  isSample?: boolean;
}

export interface WikiSchema {
  version: string;
  structure: {
    entityTypes: string[];
    templates: Record<string, string[]>;
  };
}

// ===== 客户知识库模板 =====
export interface CustomerKBEntry {
  id: string;
  companyName: string;
  contactName: string;
  contactPosition: string;
  industry: string;
  hasRecharge: boolean;
  rechargeTime?: string;
  consumption: number;
  messageHistory: ChatMessage[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  channel: "wechat" | "email" | "phone" | "other";
}

// ===== 任务卡（原有，保持兼容）=====
export type CollaboratorRole = "商务" | "运营" | "内容" | "FDE";

export type UrgencyLevel = "紧急" | "高" | "中" | "低";

export interface TaskCard {
  id: string;
  sequenceNumber: number;
  batchId: string;
  customerName: string;
  customerProblem: string;
  requiredRoles: CollaboratorRole[];
  urgency: UrgencyLevel;
  deadline: string;
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
  isSample?: boolean;
}

export interface TaskBatch {
  id: string;
  name: string;
  createdAt: string;
  taskIds: string[];
  isSample?: boolean;
}

// ===== 工作区面板（扩展所有新模块）=====
export type ModuleType =
  | "dashboard"
  | "scenario-filter"      // 场景筛选（替换原customer-tier）
  | "value-delivery"        // 价值传递/流程重构
  | "delivery-design"
  | "value-validation"      // 价值验证
  | "customer-care"         // 客情关怀
  | "report-output"         // 汇报输出
  | "workspace-tracker"     // 工具落地/工作台
  | "team-coordination"     // 组织协同
  | "knowledge-base"
  | "task-card"
  | "settings";

export interface WorkspacePanel {
  id: string;
  moduleType: ModuleType;
  title: string;
}

// ===== 交付设计（原有，保持兼容）=====
export interface DeliveryDesign {
  id: string;
  customerId: string;
  customerName: string;
  designType: "solution" | "proposal" | "report" | "other";
  title: string;
  content: string;
  status: "draft" | "review" | "final";
  assignedTo: CollaboratorRole[];
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
}

// ===== LLM 配置 =====
export type LLMProvider = "deepseek" | "openai" | "anthropic" | "qwen" | "doubao" | "wenxin" | "glm" | "custom";

export interface LLMConfig {
  id: string;
  name: string;
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseUrl: string;
  maxTokens: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  activeLLMId: string | null;
  storeLocation: "localStorage" | "indexedDB";
  autoSync: boolean;
  theme: "light" | "dark";
  language: "zh-CN" | "en";
}

// ===== LLM 调用相关 =====
export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  success: boolean;
  content: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
