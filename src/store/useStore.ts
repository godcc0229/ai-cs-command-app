import { create } from "zustand";
import type {
  Customer,
  TierAnalysisRecord,
  CustomerKBEntry,
  WikiArticle,
  RawDocument,
  TaskCard,
  TaskBatch,
  DeliveryDesign,
  WorkspacePanel,
  ModuleType,
  ChatMessage,
  LLMConfig,
  SystemSettings,
  LLMProvider,
  SprintPlanDay,
  // 新模块类型
  ScenarioFilterResult,
  FlowOutput,
  DeliveryPath,
  DailyMetrics,
  CareBatch,
  DailyReport,
  SprintPlan,
  WorkspaceTrackerRow,
  CoordinatedTask,
  LLMResponse,
} from "@/types";
import {
  sampleCustomers,
  sampleTierRecords,
  sampleKBEntries,
  sampleWikiArticles,
  sampleRawDocs,
  sampleTasks,
  sampleBatches,
  sampleDeliveries,
} from "@/data/sampleData";

interface AppState {
  // ===== 客户数据 =====
  customers: Customer[];
  tierRecords: TierAnalysisRecord[];
  kbEntries: CustomerKBEntry[];
  wikiArticles: WikiArticle[];
  rawDocuments: RawDocument[];

  // ===== 任务卡 =====
  tasks: TaskCard[];
  batches: TaskBatch[];

  // ===== 交付设计 =====
  deliveries: DeliveryDesign[];
  deliveryPaths: DeliveryPath[]; // 新增：AI生成的交付路径

  // ===== 工作区面板 =====
  panels: WorkspacePanel[];
  activePanelId: string | null;

  // ===== LLM 配置 =====
  llmConfigs: LLMConfig[];
  systemSettings: SystemSettings;

  // ===== 场景筛选（模块二）=====
  scenarioResults: ScenarioFilterResult[];

  // ===== 价值传递/流程重构（模块三）=====
  flowOutputs: FlowOutput[];

  // ===== 价值验证（模块七）=====
  dailyMetricsList: DailyMetrics[];

  // ===== 客情关怀（独立模块）=====
  careBatches: CareBatch[];

  // ===== 汇报输出（模块八）=====
  dailyReports: DailyReport[];
  sprintPlan: SprintPlan | null;

  // ===== 工具落地/工作台（模块四）=====
  workspaceTracker: WorkspaceTrackerRow[];

  // ===== 组织协同（模块六）=====
  coordinatedTasks: CoordinatedTask[];

  // ===== 操作 =====
  // 客户操作
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addTierRecord: (record: TierAnalysisRecord) => void;
  deleteTierRecord: (id: string) => void;

  // 知识库操作
  addKBEntry: (entry: CustomerKBEntry) => void;
  updateKBEntry: (id: string, updates: Partial<CustomerKBEntry>) => void;
  deleteKBEntry: (id: string) => void;
  addWikiArticle: (article: WikiArticle) => void;
  addRawDocument: (doc: RawDocument) => void;
  addMessageToKB: (entryId: string, message: ChatMessage) => void;

  // 面板操作
  openPanel: (moduleType: ModuleType, title: string) => void;
  closePanel: (panelId: string) => void;
  setActivePanel: (panelId: string | null) => void;

  // 任务操作
  addTask: (task: TaskCard) => void;
  updateTask: (id: string, updates: Partial<TaskCard>) => void;
  deleteTask: (id: string) => void;
  deleteTaskBatch: (id: string) => void;
  addBatch: (batch: TaskBatch) => void;
  generateTasksFromBatch: (
    batchName: string,
    inputs: {
      customerName: string;
      customerProblem: string;
      requiredRoles: TaskCard["requiredRoles"];
      urgency: TaskCard["urgency"];
      deadline: string;
    }[]
  ) => void;

  // 交付设计操作
  addDelivery: (delivery: DeliveryDesign) => void;
  updateDelivery: (id: string, updates: Partial<DeliveryDesign>) => void;
  deleteDelivery: (id: string) => void;
  addDeliveryPath: (path: DeliveryPath) => void;

  // 自动同步：分层数据 → 知识库
  syncTierToKB: () => void;

  // LLM 配置
  addLLMConfig: (config: Omit<LLMConfig, "id" | "createdAt" | "updatedAt">) => void;
  updateLLMConfig: (id: string, updates: Partial<LLMConfig>) => void;
  deleteLLMConfig: (id: string) => void;
  setActiveLLM: (id: string) => void;
  testLLMConnection: (id: string) => Promise<{ success: boolean; message: string }>;

  // ===== 核心：真实 LLM 调用 =====
  callLLM: (prompt: string, systemPrompt?: string) => Promise<LLMResponse>;
  getActiveLLMConfig: () => LLMConfig | null;

  // ===== 场景筛选操作 =====
  addScenarioResult: (result: ScenarioFilterResult) => void;

  // ===== 流程重构操作 =====
  addFlowOutput: (output: FlowOutput) => void;
  clearFlowOutputs: (phase?: FlowOutput["phase"]) => void;

  // ===== 价值验证操作 =====
  addDailyMetrics: (metrics: DailyMetrics) => void;

  // ===== 客情关怀操作 =====
  addCareBatch: (batch: CareBatch) => void;
  deleteCareBatch: (id: string) => void;

  // ===== 汇报输出操作 =====
  addDailyReport: (report: DailyReport) => void;
  deleteDailyReport: (id: string) => void;
  setSprintPlan: (plan: SprintPlan) => void;
  updateSprintDay: (day: number, updates: Partial<SprintPlanDay>) => void;

  // ===== 工作台操作 =====
  setWorkspaceTracker: (rows: WorkspaceTrackerRow[]) => void;
  addTrackerRow: (row: WorkspaceTrackerRow) => void;
  updateTrackerRow: (id: string, updates: Partial<WorkspaceTrackerRow>) => void;
  deleteTrackerRow: (id: string) => void;

  // ===== 组织协同操作 =====
  addCoordinatedTask: (task: CoordinatedTask) => void;
  deleteCoordinatedTask: (id: string) => void;
  updateCoordinatedTask: (id: string, updates: Partial<CoordinatedTask>) => void;
  batchAddCoordinatedTasks: (tasks: CoordinatedTask[]) => void;

  // 系统设置
  updateSystemSettings: (updates: Partial<SystemSettings>) => void;
  exportAllData: () => string;
  importAllData: (data: string) => boolean;
}

let panelCounter = 0;

// ===== LLM Provider API 映射 =====
function getProviderEndpoint(config: LLMProvider): { url: string; modelKey: string } {
  switch (config) {
    case "deepseek":
      return { url: "https://api.deepseek.com/chat/completions", modelKey: "deepseek-chat" };
    case "openai":
      return { url: "https://api.openai.com/v1/chat/completions", modelKey: "gpt-4o-mini" };
    case "anthropic":
      return { url: "", modelKey: "claude-sonnet-4-20250514" }; // Anthropic uses different format
    case "qwen":
      return { url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", modelKey: "qwen-plus" };
    case "doubao":
      return { url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions", modelKey: "ep-20240601120000-xxxxx" };
    case "wenxin":
      return { url: "https://qianfan.baidubce.com/v2/chat/completions", modelKey: "ernie-4.0-8k" };
    case "glm":
      return { url: "https://open.bigmodel.cn/api/paas/v4/chat/completions", modelKey: "glm-4-flash" };
    case "custom":
      return { url: "", modelKey: "" };
    default:
      return { url: "", modelKey: "" };
  }
}

// ===== 构建请求头 =====
function buildHeaders(config: LLMConfig): Record<string, string> {
  const base: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.provider === "anthropic") {
    base["x-api-key"] = config.apiKey;
    base["anthropic-version"] = "2023-06-01";
  } else if (config.provider === "qwen") {
    base["Authorization"] = `Bearer ${config.apiKey}`;
  } else {
    base["Authorization"] = `Bearer ${config.apiKey}`;
  }

  return base;
}

// ===== 构建请求体 =====
function buildBody(
  config: LLMConfig,
  prompt: string,
  systemPrompt?: string
): Record<string, unknown> {
  if (config.provider === "anthropic") {
    return {
      model: config.model || getProviderEndpoint(config.provider).modelKey,
      max_tokens: config.maxTokens || 2048,
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ],
    };
  }

  return {
    model: config.model || getProviderEndpoint(config.provider).modelKey,
    max_tokens: config.maxTokens || 2048,
    temperature: 0.7,
    messages: [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      { role: "user" as const, content: prompt },
    ],
  };
}

export const useStore = create<AppState>((set, get) => ({
  // ===== 初始状态 =====
  customers: sampleCustomers,
  tierRecords: sampleTierRecords,
  kbEntries: sampleKBEntries,
  wikiArticles: sampleWikiArticles,
  rawDocuments: sampleRawDocs,
  tasks: sampleTasks,
  batches: sampleBatches,
  deliveries: sampleDeliveries,
  deliveryPaths: [],
  panels: [],
  activePanelId: null,
  llmConfigs: [],
  systemSettings: {
    activeLLMId: null,
    storeLocation: "localStorage",
    autoSync: true,
    theme: "light",
    language: "zh-CN",
  },

  // 新模块初始状态
  scenarioResults: [],
  flowOutputs: [],
  dailyMetricsList: [],
  careBatches: [],
  dailyReports: [],
  sprintPlan: null,
  workspaceTracker: [],
  coordinatedTasks: [],

  // ===== 客户操作 =====
  addCustomer: (customer) =>
    set((state) => ({ customers: [...state.customers, customer] })),

  updateCustomer: (id, updates) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    })),

  deleteCustomer: (id) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    })),

  addTierRecord: (record) =>
    set((state) => {
      const newRecords = [...state.tierRecords, record];
      const updatedCustomers = state.customers.map((c) =>
        c.id === record.customerId
          ? { ...c, tier: record.currentTier, updatedAt: new Date().toISOString() }
          : c
      );
      return { tierRecords: newRecords, customers: updatedCustomers };
    }),

  deleteTierRecord: (id) =>
    set((state) => ({
      tierRecords: state.tierRecords.filter((r) => r.id !== id),
    })),

  // ===== 知识库操作 =====
  addKBEntry: (entry) =>
    set((state) => ({ kbEntries: [...state.kbEntries, entry] })),

  updateKBEntry: (id, updates) =>
    set((state) => ({
      kbEntries: state.kbEntries.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      ),
    })),

  deleteKBEntry: (id) =>
    set((state) => ({ kbEntries: state.kbEntries.filter((e) => e.id !== id) })),

  addWikiArticle: (article) =>
    set((state) => ({ wikiArticles: [...state.wikiArticles, article] })),

  deleteWikiArticle: (id) =>
    set((state) => ({ wikiArticles: state.wikiArticles.filter((a) => a.id !== id) })),

  addRawDocument: (doc) =>
    set((state) => ({ rawDocuments: [...state.rawDocuments, doc] })),

  deleteRawDocument: (id) =>
    set((state) => ({ rawDocuments: state.rawDocuments.filter((d) => d.id !== id) })),

  addMessageToKB: (entryId, message) =>
    set((state) => ({
      kbEntries: state.kbEntries.map((e) =>
        e.id === entryId
          ? { ...e, messageHistory: [...e.messageHistory, message] }
          : e
      ),
    })),

  // ===== 面板操作 =====
  openPanel: (moduleType, title) => {
    // 检查是否已存在相同模块类型的面板
    const existingPanel = get().panels.find((p) => p.moduleType === moduleType);
    if (existingPanel) {
      // 如果已存在，直接激活该面板
      set({ activePanelId: existingPanel.id });
      return;
    }

    panelCounter++;
    const panel: WorkspacePanel = {
      id: `panel-${panelCounter}`,
      moduleType,
      title,
    };
    set((state) => ({
      panels: [...state.panels, panel],
      activePanelId: panel.id,
    }));
  },

  closePanel: (panelId) =>
    set((state) => {
      const newPanels = state.panels.filter((p) => p.id !== panelId);
      const newActiveId =
        state.activePanelId === panelId
          ? newPanels.length > 0
            ? newPanels[newPanels.length - 1].id
            : null
          : state.activePanelId;
      return { panels: newPanels, activePanelId: newActiveId };
    }),

  setActivePanel: (panelId) => set({ activePanelId: panelId }),

  // ===== 任务操作 =====
  addTask: (task) =>
    set((state) => ({ tasks: [...state.tasks, task] })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  addBatch: (batch) =>
    set((state) => ({ batches: [...state.batches, batch] })),

  generateTasksFromBatch: (batchName, inputs) => {
    const batchId = `batch-${Date.now()}`;
    const newTasks: TaskCard[] = inputs.map((input, index) => ({
      id: `task-${Date.now()}-${index}`,
      sequenceNumber: index + 1,
      batchId,
      customerName: input.customerName,
      customerProblem: input.customerProblem,
      requiredRoles: input.requiredRoles,
      urgency: input.urgency,
      deadline: input.deadline,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    }));

    const newBatch: TaskBatch = {
      id: batchId,
      name: batchName,
      createdAt: new Date().toISOString(),
      taskIds: newTasks.map((t) => t.id),
    };

    set((state) => ({
      tasks: [...state.tasks, ...newTasks],
      batches: [...state.batches, newBatch],
    }));
  },

  deleteTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

  deleteTaskBatch: (id) =>
    set((state) => {
      const batch = state.batches.find((b) => b.id === id);
      const taskIdsToRemove = batch?.taskIds || [];
      return {
        batches: state.batches.filter((b) => b.id !== id),
        tasks: state.tasks.filter((t) => !taskIdsToRemove.includes(t.id)),
      };
    }),

  // ===== 交付设计操作 =====
  addDelivery: (delivery) =>
    set((state) => ({ deliveries: [...state.deliveries, delivery] })),

  updateDelivery: (id, updates) =>
    set((state) => ({
      deliveries: state.deliveries.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
    })),

  deleteDelivery: (id) =>
    set((state) => ({ deliveries: state.deliveries.filter((d) => d.id !== id) })),

  addDeliveryPath: (path) =>
    set((state) => ({ deliveryPaths: [...state.deliveryPaths, path] })),

  // ===== 自动同步：客户分层 → 知识库 =====
  syncTierToKB: () => {
    const { customers, kbEntries } = get();
    const updatedKB = [...kbEntries];

    customers.forEach((customer) => {
      const existingIdx = updatedKB.findIndex(
        (kb) => kb.companyName === customer.companyName
      );
      const kbData: CustomerKBEntry = {
        id: existingIdx >= 0 ? updatedKB[existingIdx].id : `kb-${customer.id}`,
        companyName: customer.companyName,
        contactName: customer.contact.name,
        contactPosition: customer.contact.position,
        industry: customer.industry,
        hasRecharge: customer.hasRecharge,
        rechargeTime: customer.rechargeDate,
        consumption: customer.consumption,
        messageHistory:
          existingIdx >= 0 ? updatedKB[existingIdx].messageHistory : [],
        tags:
          existingIdx >= 0
            ? updatedKB[existingIdx].tags
            : [customer.tier === "A" ? "重点客户" : customer.tier === "B" ? "成长客户" : "潜力客户"],
        createdAt:
          existingIdx >= 0
            ? updatedKB[existingIdx].createdAt
            : customer.createdAt,
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        updatedKB[existingIdx] = kbData;
      } else {
        updatedKB.push(kbData);
      }
    });

    set({ kbEntries: updatedKB });
  },

  // ===== LLM 配置 =====
  addLLMConfig: (config) =>
    set((state) => {
      const newId = `llm-${Date.now()}`;
      const newConfig: LLMConfig = {
        ...config,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // 如果是第一个配置或显式标记为激活，自动设为活跃模型
      const shouldActivate =
        config.isActive ||
        state.llmConfigs.length === 0;
      return {
        llmConfigs: [...state.llmConfigs, newConfig],
        ...(shouldActivate
          ? { systemSettings: { ...state.systemSettings, activeLLMId: newId } }
          : {}),
      };
    }),

  updateLLMConfig: (id, updates) =>
    set((state) => ({
      llmConfigs: state.llmConfigs.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    })),

  deleteLLMConfig: (id) =>
    set((state) => {
      const newConfigs = state.llmConfigs.filter((c) => c.id !== id);
      const newActiveId =
        state.systemSettings.activeLLMId === id
          ? newConfigs.length > 0
            ? newConfigs[0].id
            : null
          : state.systemSettings.activeLLMId;
      return {
        llmConfigs: newConfigs,
        systemSettings: { ...state.systemSettings, activeLLMId: newActiveId },
      };
    }),

  setActiveLLM: (id) =>
    set((state) => {
      const newConfigs = state.llmConfigs.map((c) => ({
        ...c,
        isActive: c.id === id,
      }));
      return {
        llmConfigs: newConfigs,
        systemSettings: { ...state.systemSettings, activeLLMId: id },
      };
    }),

  testLLMConnection: async (id) => {
    const config = get().llmConfigs.find((c) => c.id === id);
    if (!config) return { success: false, message: "配置不存在" };
    if (!config.apiKey) return { success: false, message: "API Key 未填写" };

    try {
      const endpoint = config.baseUrl || getProviderEndpoint(config.provider).url;
      if (!endpoint) return { success: false, message: "无法确定 API 地址" };

      const headers = buildHeaders(config);
      const body = buildBody(config, "你好，请回复'连接成功'");

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { success: false, message: `HTTP ${response.status}: ${response.statusText}` };
      }

      // 验证响应可解析即可
      await response.json();

      if (config.provider === "anthropic") {
        return { success: true, message: `${config.name} 连接成功` };
      }

      return { success: true, message: `${config.name} 连接成功` };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "未知错误";
      return { success: false, message: `连接失败: ${msg}` };
    }
  },

  // ===== 核心：真实 LLM 调用 =====
  getActiveLLMConfig: () => {
    const state = get();
    const activeId = state.systemSettings.activeLLMId;
    if (!activeId) return null;
    return state.llmConfigs.find((c) => c.id === activeId) || null;
  },

  callLLM: async (prompt, systemPrompt) => {
    const config = get().getActiveLLMConfig();
    if (!config) {
      return {
        success: false,
        content: "",
        error: "未配置或未激活任何 LLM，请先在系统设置中配置大模型",
      };
    }

    if (!config.apiKey) {
      return {
        success: false,
        content: "",
        error: `${config.name} 的 API Key 未填写`,
      };
    }

    try {
      const endpoint = config.baseUrl || getProviderEndpoint(config.provider).url;
      if (!endpoint) {
        return {
          success: false,
          content: "",
          error: `无法确定 ${config.provider} 的 API 地址，请检查配置`,
        };
      }

      const headers = buildHeaders(config);
      const body = buildBody(config, prompt, systemPrompt);

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return {
          success: false,
          content: "",
          error: `API 调用失败 (${response.status}): ${errorText.slice(0, 200)}`,
        };
      }

      const data = await response.json();

      let content = "";
      let usage;

      if (config.provider === "anthropic") {
        content = data.content?.[0]?.text || "";
        usage = data.usage
          ? {
              promptTokens: data.usage.input_tokens,
              completionTokens: data.usage.output_tokens,
              totalTokens: data.usage.input_tokens + data.usage.output_tokens,
            }
          : undefined;
      } else {
        content = data.choices?.[0]?.message?.content || "";
        usage = data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined;
      }

      if (!content) {
        return {
          success: false,
          content: "",
          error: "API 返回了空内容",
        };
      }

      return { success: true, content, usage };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "未知错误";
      return {
        success: false,
        content: "",
        error: `LLM 调用异常: ${msg}`,
      };
    }
  },

  // ===== 场景筛选操作 =====
  addScenarioResult: (result) =>
    set((state) => ({ scenarioResults: [result, ...state.scenarioResults] })),

  // ===== 流程重构操作 =====
  addFlowOutput: (output) =>
    set((state) => ({ flowOutputs: [...state.flowOutputs, output] })),

  clearFlowOutputs: (phase) =>
    set((state) => {
      if (!phase) return { flowOutputs: [] };
      return { flowOutputs: state.flowOutputs.filter((o) => o.phase !== phase) };
    }),

  // ===== 价值验证操作 =====
  addDailyMetrics: (metrics) =>
    set((state) => ({ dailyMetricsList: [metrics, ...state.dailyMetricsList] })),

  // ===== 客情关怀操作 =====
  addCareBatch: (batch) =>
    set((state) => ({ careBatches: [batch, ...state.careBatches] })),

  deleteCareBatch: (id) =>
    set((state) => ({ careBatches: state.careBatches.filter((b) => b.id !== id) })),

  // ===== 汇报输出操作 =====
  addDailyReport: (report) =>
    set((state) => ({ dailyReports: [report, ...state.dailyReports] })),

  deleteDailyReport: (id) =>
    set((state) => ({ dailyReports: state.dailyReports.filter((r) => r.id !== id) })),

  setSprintPlan: (plan) => set({ sprintPlan: plan }),

  updateSprintDay: (day, updates) =>
    set((state) => {
      if (!state.sprintPlan) return {};
      return {
        sprintPlan: {
          ...state.sprintPlan,
          days: state.sprintPlan.days.map((d) =>
            d.day === day ? { ...d, ...updates } : d
          ),
        },
      };
    }),

  // ===== 工作台操作 =====
  setWorkspaceTracker: (rows) => set({ workspaceTracker: rows }),

  addTrackerRow: (row) =>
    set((state) => ({ workspaceTracker: [...state.workspaceTracker, row] })),

  updateTrackerRow: (id, updates) =>
    set((state) => ({
      workspaceTracker: state.workspaceTracker.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  deleteTrackerRow: (id) =>
    set((state) => ({
      workspaceTracker: state.workspaceTracker.filter((r) => r.id !== id),
    })),

  // ===== 组织协同操作 =====
  addCoordinatedTask: (task) =>
    set((state) => ({ coordinatedTasks: [...state.coordinatedTasks, task] })),

  deleteCoordinatedTask: (id) =>
    set((state) => ({ coordinatedTasks: state.coordinatedTasks.filter((t) => t.id !== id) })),

  updateCoordinatedTask: (id, updates) =>
    set((state) => ({
      coordinatedTasks: state.coordinatedTasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  batchAddCoordinatedTasks: (tasks) =>
    set((state) => ({ coordinatedTasks: [...state.coordinatedTasks, ...tasks] })),

  // ===== 系统设置 =====
  updateSystemSettings: (updates) =>
    set((state) => ({
      systemSettings: { ...state.systemSettings, ...updates },
    })),

  exportAllData: () => {
    const state = get();
    return JSON.stringify(
      {
        version: "2.0",
        exportTime: new Date().toISOString(),
        customers: state.customers,
        tierRecords: state.tierRecords,
        kbEntries: state.kbEntries,
        wikiArticles: state.wikiArticles,
        rawDocuments: state.rawDocuments,
        tasks: state.tasks,
        batches: state.batches,
        deliveries: state.deliveries,
        deliveryPaths: state.deliveryPaths,
        llmConfigs: state.llmConfigs,
        systemSettings: state.systemSettings,
        // 新模块数据
        scenarioResults: state.scenarioResults,
        flowOutputs: state.flowOutputs,
        dailyMetricsList: state.dailyMetricsList,
        careBatches: state.careBatches,
        dailyReports: state.dailyReports,
        sprintPlan: state.sprintPlan,
        workspaceTracker: state.workspaceTracker,
        coordinatedTasks: state.coordinatedTasks,
      },
      null,
      2
    );
  },

  importAllData: (data) => {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.version) return false;
      set({
        customers: parsed.customers || [],
        tierRecords: parsed.tierRecords || [],
        kbEntries: parsed.kbEntries || [],
        wikiArticles: parsed.wikiArticles || [],
        rawDocuments: parsed.rawDocuments || [],
        tasks: parsed.tasks || [],
        batches: parsed.batches || [],
        deliveries: parsed.deliveries || [],
        deliveryPaths: parsed.deliveryPaths || [],
        llmConfigs: parsed.llmConfigs || [],
        systemSettings: parsed.systemSettings || get().systemSettings,
        scenarioResults: parsed.scenarioResults || [],
        flowOutputs: parsed.flowOutputs || [],
        dailyMetricsList: parsed.dailyMetricsList || [],
        careBatches: parsed.careBatches || [],
        dailyReports: parsed.dailyReports || [],
        sprintPlan: parsed.sprintPlan || null,
        workspaceTracker: parsed.workspaceTracker || [],
        coordinatedTasks: parsed.coordinatedTasks || [],
      });
      return true;
    } catch {
      return false;
    }
  },
}));

// ===== localStorage 持久化 =====
const STORAGE_KEY = "ai-cs-storage-v2";

function loadFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage() {
  if (typeof window === "undefined") return;
  const state = useStore.getState();
  const data = {
    version: "2.1",
    llmConfigs: state.llmConfigs,
    systemSettings: state.systemSettings,
    customers: state.customers,
    tierRecords: state.tierRecords,
    kbEntries: state.kbEntries,
    wikiArticles: state.wikiArticles,
    rawDocuments: state.rawDocuments,
    tasks: state.tasks,
    batches: state.batches,
    deliveries: state.deliveries,
    deliveryPaths: state.deliveryPaths,
    scenarioResults: state.scenarioResults,
    flowOutputs: state.flowOutputs,
    dailyMetricsList: state.dailyMetricsList,
    careBatches: state.careBatches,
    dailyReports: state.dailyReports,
    sprintPlan: state.sprintPlan,
    workspaceTracker: state.workspaceTracker,
    coordinatedTasks: state.coordinatedTasks,
    // 新增：保存面板状态，确保刷新后恢复
    panels: state.panels,
    activePanelId: state.activePanelId,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("保存到 localStorage 失败:", e);
  }
}

// 初始化时从 localStorage 恢复
const stored = loadFromStorage();
if (stored) {
  useStore.setState({
    llmConfigs: stored.llmConfigs || [],
    systemSettings: stored.systemSettings || {
      activeLLMId: null,
      storeLocation: "localStorage",
      autoSync: true,
      theme: "light",
      language: "zh-CN",
    },
    customers: stored.customers || [],
    tierRecords: stored.tierRecords || [],
    kbEntries: stored.kbEntries || [],
    wikiArticles: stored.wikiArticles || [],
    rawDocuments: stored.rawDocuments || [],
    tasks: stored.tasks || [],
    batches: stored.batches || [],
    deliveries: stored.deliveries || [],
    deliveryPaths: stored.deliveryPaths || [],
    scenarioResults: stored.scenarioResults || [],
    flowOutputs: stored.flowOutputs || [],
    dailyMetricsList: stored.dailyMetricsList || [],
    careBatches: stored.careBatches || [],
    dailyReports: stored.dailyReports || [],
    sprintPlan: stored.sprintPlan || null,
    workspaceTracker: stored.workspaceTracker || [],
    coordinatedTasks: stored.coordinatedTasks || [],
    // 恢复面板状态（如果存在）
    ...(stored.panels ? { panels: stored.panels, activePanelId: stored.activePanelId || null } : {}),
  });
}

// 首次进入自动打开仪表盘：如果没有保存的面板状态，自动打开首页
const initialPanels = useStore.getState().panels;
if (!initialPanels || initialPanels.length === 0) {
  setTimeout(() => {
    useStore.getState().openPanel("dashboard", "首页仪表盘");
  }, 100);
}

// 订阅变化保存
useStore.subscribe(() => {
  saveToStorage();
});
