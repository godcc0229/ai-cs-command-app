import { useState, useRef } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Check,
  Eye,
  EyeOff,
  TestTube,
  Download,
  Upload,
  Database,
  Cpu,
  Power,
  X,
  Key,
  Hash,
  Server,
  HardDrive,
  RefreshCw,
  Bookmark,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import type { LLMProvider } from "@/types";

const providerDefaults: Record<
  LLMProvider,
  { name: string; baseUrl: string; model: string; maxTokens: number }
> = {
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
    maxTokens: 4096,
  },
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    maxTokens: 4096,
  },
  anthropic: {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1/messages",
    model: "claude-3-5-sonnet-20241022",
    maxTokens: 4096,
  },
  qwen: {
    name: "通义千问",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    model: "qwen-plus",
    maxTokens: 4096,
  },
  doubao: {
    name: "豆包",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    model: "doubao-pro-32k",
    maxTokens: 4096,
  },
  wenxin: {
    name: "文心一言",
    baseUrl: "https://qianfan.baidubce.com/v2/chat/completions",
    model: "ernie-4.0-8k",
    maxTokens: 4096,
  },
  glm: {
    name: "智谱 GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    model: "glm-4-plus",
    maxTokens: 4096,
  },
  custom: {
    name: "自定义",
    baseUrl: "",
    model: "",
    maxTokens: 4096,
  },
};

export function SettingsModule() {
  const {
    llmConfigs,
    systemSettings,
    addLLMConfig,
    deleteLLMConfig,
    setActiveLLM,
    testLLMConnection,
    updateSystemSettings,
    exportAllData,
    importAllData,
    customers,
    tasks,
  } = useStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 新建表单
  const [newConfig, setNewConfig] = useState({
    name: "",
    provider: "deepseek" as LLMProvider,
    model: "deepseek-chat",
    apiKey: "",
    baseUrl: "https://api.deepseek.com/chat/completions",
    maxTokens: 4096,
  });

  const activeConfig = llmConfigs.find((c) => c.isActive);

  const handleProviderChange = (provider: LLMProvider) => {
    const defaults = providerDefaults[provider];
    setNewConfig((prev) => ({
      ...prev,
      provider,
      name: defaults.name,
      baseUrl: defaults.baseUrl,
      model: defaults.model,
      maxTokens: defaults.maxTokens,
    }));
  };

  const handleCreate = () => {
    if (!newConfig.name.trim() || !newConfig.apiKey.trim()) {
      toast.error("请填写配置名称和 API Key");
      return;
    }
    addLLMConfig({
      name: newConfig.name.trim(),
      provider: newConfig.provider,
      model: newConfig.model.trim(),
      apiKey: newConfig.apiKey.trim(),
      baseUrl: newConfig.baseUrl.trim(),
      maxTokens: newConfig.maxTokens,
      isActive: llmConfigs.length === 0, // 第一个自动激活
    });
    setNewConfig({
      name: "",
      provider: "deepseek",
      model: "deepseek-chat",
      apiKey: "",
      baseUrl: "https://api.deepseek.com/chat/completions",
      maxTokens: 4096,
    });
    setShowCreateForm(false);
    toast.success(`模型配置"${newConfig.name}"已添加`);
  };

  const handleTest = async (id: string) => {
    const config = llmConfigs.find((c) => c.id === id);
    if (!config) {
      toast.error("配置不存在，请刷新页面重试");
      return;
    }
    if (!config.apiKey || config.apiKey.trim() === "") {
      toast.error("API Key 未填写，请先输入有效的 API Key");
      return;
    }

    setTestingId(id);
    toast.loading(`正在测试 ${config.name} 的连接...`, { id: `test-${id}` });

    try {
      const result = await testLLMConnection(id);
      setTestingId(null);

      if (result.success) {
        toast.success(`✅ ${result.message}`, { id: `test-${id}` });
      } else {
        toast.error(`❌ 测试失败：${result.message}`, { id: `test-${id}`, duration: 5000 });
      }
    } catch (error) {
      setTestingId(null);
      const msg = error instanceof Error ? error.message : "未知异常";
      toast.error(`⚠️ 测试过程发生错误：${msg}`, { id: `test-${id}`, duration: 5000 });
    }
  };

  const handleDelete = (id: string) => {
    const config = llmConfigs.find((c) => c.id === id);
    if (!config) return;
    if (confirm(`确认删除配置"${config.name}"？`)) {
      deleteLLMConfig(id);
      toast.success(`已删除配置"${config.name}"`);
    }
  };

  const handleSetActive = (id: string) => {
    setActiveLLM(id);
    const config = llmConfigs.find((c) => c.id === id);
    if (config) {
      updateSystemSettings({ activeLLMId: id });
      toast.success(`已切换到"${config.name}"`);
    }
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-cs-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("数据已导出");
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importAllData(text)) {
        toast.success("数据已导入");
      } else {
        toast.error("导入失败：文件格式不正确");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = () => {
    if (confirm("确认清空所有 LLM 配置？此操作不可恢复。")) {
      llmConfigs.forEach((c) => deleteLLMConfig(c.id));
      toast.success("已清空所有配置");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">系统配置</h2>
          <p className="text-sm text-slate-500 mt-1">
            管理大模型 · API 配置 · 全局设置
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <HardDrive className="w-3 h-3" />
            {systemSettings.storeLocation === "localStorage"
              ? "本地存储"
              : "IndexedDB"}
          </Badge>
        </div>
      </div>

      {/* 当前活跃模型卡片 */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-green-50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
                <Power className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-700 font-medium">
                  当前活跃模型
                </p>
                <p className="text-lg font-bold text-emerald-900 mt-0.5">
                  {activeConfig
                    ? `${activeConfig.name.toUpperCase()} · ${activeConfig.model}`
                    : "尚未配置活跃模型"}
                </p>
                {activeConfig && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Endpoint: {activeConfig.baseUrl}
                  </p>
                )}
              </div>
            </div>
            <Badge className="bg-emerald-500 text-white">
              {activeConfig ? "运行中" : "未配置"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="llm" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="llm" className="gap-2">
            <Cpu className="w-4 h-4" />
            大模型配置 ({llmConfigs.length})
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="w-4 h-4" />
            数据管理
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <SettingsIcon className="w-4 h-4" />
            系统设置
          </TabsTrigger>
        </TabsList>

        {/* 大模型配置 */}
        <TabsContent value="llm">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    大模型配置
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    添加多个 LLM 配置，随时切换使用。API Key
                    安全存储在浏览器本地。
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="gap-2"
                  size="sm"
                >
                  {showCreateForm ? (
                    <>
                      <X className="w-4 h-4" />
                      取消
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      新增配置
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 新建配置表单 */}
              {showCreateForm && (
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
                  <p className="text-sm font-semibold text-blue-700">
                    新建 LLM 配置
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">服务商</Label>
                      <Select
                        value={newConfig.provider}
                        onValueChange={(v) =>
                          handleProviderChange(v as LLMProvider)
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(providerDefaults).map(
                            ([key, val]) => (
                              <SelectItem key={key} value={key}>
                                {val.name}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">配置名称 *</Label>
                      <Input
                        value={newConfig.name}
                        onChange={(e) =>
                          setNewConfig({
                            ...newConfig,
                            name: e.target.value,
                          })
                        }
                        className="mt-1 h-8 text-sm"
                        placeholder="如：主力模型"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">模型名称</Label>
                      <Input
                        value={newConfig.model}
                        onChange={(e) =>
                          setNewConfig({
                            ...newConfig,
                            model: e.target.value,
                          })
                        }
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">最大 Tokens</Label>
                      <Input
                        type="number"
                        value={newConfig.maxTokens}
                        onChange={(e) =>
                          setNewConfig({
                            ...newConfig,
                            maxTokens: Number(e.target.value),
                          })
                        }
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">API Endpoint</Label>
                      <Input
                        value={newConfig.baseUrl}
                        onChange={(e) =>
                          setNewConfig({
                            ...newConfig,
                            baseUrl: e.target.value,
                          })
                        }
                        className="mt-1 h-8 text-sm font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">API Key *</Label>
                      <Input
                        type="password"
                        value={newConfig.apiKey}
                        onChange={(e) =>
                          setNewConfig({
                            ...newConfig,
                            apiKey: e.target.value,
                          })
                        }
                        className="mt-1 h-8 text-sm font-mono"
                        placeholder="sk-..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                    >
                      取消
                    </Button>
                    <Button size="sm" onClick={handleCreate}>
                      <Save className="w-3.5 h-3.5 mr-1" />
                      保存配置
                    </Button>
                  </div>
                </div>
              )}

              {/* 配置列表 */}
              {llmConfigs.map((config) => (
                <div
                  key={config.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    config.isActive
                      ? "border-emerald-300 bg-emerald-50/30"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          config.isActive ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      >
                        <Cpu className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {config.name}
                          </span>
                          {config.isActive && (
                            <Badge className="text-[10px] bg-emerald-500 text-white">
                              主力
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            {providerDefaults[config.provider].name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {config.model} · Max:{config.maxTokens}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!config.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleSetActive(config.id)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          启用
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => handleTest(config.id)}
                        disabled={testingId === config.id}
                      >
                        {testingId === config.id ? (
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <TestTube className="w-3 h-3 mr-1" />
                        )}
                        测试
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(config.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Server className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-500">Endpoint:</span>
                      <span className="text-slate-700 font-mono truncate">
                        {config.baseUrl}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Key className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-500">API Key:</span>
                      <span className="text-slate-700 font-mono">
                        {showApiKey[config.id]
                          ? config.apiKey
                          : "•".repeat(Math.min(20, config.apiKey.length))}
                      </span>
                      <button
                        onClick={() =>
                          setShowApiKey((prev) => ({
                            ...prev,
                            [config.id]: !prev[config.id],
                          }))
                        }
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {showApiKey[config.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-500">Max:</span>
                      <span className="text-slate-700">{config.maxTokens}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 空状态 */}
              {llmConfigs.length === 0 && !showCreateForm && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Cpu className="w-10 h-10 mb-3" />
                  <p className="text-sm">尚未配置任何大模型</p>
                  <Button
                    variant="link"
                    className="mt-2 text-sm"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加第一个配置
                  </Button>
                </div>
              )}

              {llmConfigs.length > 0 && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    清空所有配置
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 数据管理 */}
        <TabsContent value="data">
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-500" />
                  数据管理
                </CardTitle>
                <p className="text-xs text-slate-500">
                  所有数据存储在浏览器本地，支持备份与恢复
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">
                      数据存储位置
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      localStorage（本地浏览器）
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      零外部依赖，不会上传到任何服务器
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">
                      数据规模
                    </p>
                    <div className="text-xs text-slate-700 mt-1 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        LLM 配置：{llmConfigs.length} 个
                      </div>
                      <div className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        客户数据：{customers.length} 条
                      </div>
                      <div className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        任务卡：{tasks.length} 张
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <p className="text-xs text-slate-500 font-medium">
                    支持的数据类型
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      "LLM 配置", "知识库(Wiki/客户/素材)",
                      "客户数据", "任务卡",
                      "交付设计", "交付路径",
                      "工作台跟踪", "组织协同任务",
                      "客情关怀批次", "日报&冲刺计划",
                      "场景筛选结果", "价值传递输出",
                      "价值验证指标", "系统设置&面板状态",
                    ].map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] bg-white"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-500" />
                  备份与恢复
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={handleExport} className="gap-2" size="sm">
                    <Download className="w-4 h-4" />
                    导出全部数据
                  </Button>
                  <Button
                    onClick={handleImport}
                    variant="outline"
                    className="gap-2"
                    size="sm"
                  >
                    <Upload className="w-4 h-4" />
                    导入备份数据
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  导出的 JSON 文件包含全部数据，可用于迁移或恢复
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 系统设置 */}
        <TabsContent value="system">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                全局系统设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    自动同步分层数据
                  </p>
                  <p className="text-xs text-slate-500">
                    客户分层变更时自动同步至知识库
                  </p>
                </div>
                <button
                  onClick={() =>
                    updateSystemSettings({ autoSync: !systemSettings.autoSync })
                  }
                  className={`w-11 h-6 rounded-full transition-colors ${
                    systemSettings.autoSync ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      systemSettings.autoSync ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-800 mb-2">主题</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSystemSettings({ theme: "light" })}
                    className={`flex-1 py-2 text-sm rounded ${
                      systemSettings.theme === "light"
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    浅色
                  </button>
                  <button
                    onClick={() => updateSystemSettings({ theme: "dark" })}
                    className={`flex-1 py-2 text-sm rounded ${
                      systemSettings.theme === "dark"
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    深色
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-800 mb-2">语言</p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateSystemSettings({ language: "zh-CN" })
                    }
                    className={`flex-1 py-2 text-sm rounded ${
                      systemSettings.language === "zh-CN"
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    简体中文
                  </button>
                  <button
                    onClick={() => updateSystemSettings({ language: "en" })}
                    className={`flex-1 py-2 text-sm rounded ${
                      systemSettings.language === "en"
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
