import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Plus,
  Search,
  Clock,
  PenLine,
  CheckCircle2,
  Eye,
  Send,
  Users,
  ArrowRight,
  Sparkles,
  Loader2,
  Route,
  Copy,
  Trash2,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import type { DeliveryDesign, CollaboratorRole, DeliveryPath } from "@/types";

const roleLabels: Record<CollaboratorRole, string> = {
  商务: "商务",
  运营: "运营",
  内容: "内容",
  FDE: "FDE",
};

const roleColors: Record<CollaboratorRole, string> = {
  商务: "bg-blue-100 text-blue-700",
  运营: "bg-emerald-100 text-emerald-700",
  内容: "bg-purple-100 text-purple-700",
  FDE: "bg-orange-100 text-orange-700",
};

const statusIcons = {
  draft: <PenLine className="w-3.5 h-3.5" />,
  review: <Eye className="w-3.5 h-3.5" />,
  final: <CheckCircle2 className="w-3.5 h-3.5" />,
};

const statusLabels = {
  draft: "草稿",
  review: "评审中",
  final: "已定稿",
};

const statusColors = {
  draft: "bg-slate-100 text-slate-700",
  review: "bg-amber-100 text-amber-700",
  final: "bg-emerald-100 text-emerald-700",
};

export function DeliveryDesignModule() {
  const { deliveries, customers, addDelivery, updateDelivery, deleteDelivery, callLLM, deliveryPaths, addDeliveryPath } = useStore();
  const [activeTab, setActiveTab] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  // AI路径生成状态
  const [pathCustomerType, setPathCustomerType] = useState("");
  const [pathLoading, setPathLoading] = useState(false);
  const [generatedPaths, setGeneratedPaths] = useState<DeliveryPath[]>([]);
  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  // AI对话历史生成交付方案
  const [chatHistory, setChatHistory] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // 新建设计表单
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [designType, setDesignType] = useState<
    DeliveryDesign["designType"]
  >("solution");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [assignedRoles, setAssignedRoles] = useState<CollaboratorRole[]>([]);

  const toggleRole = (role: CollaboratorRole) => {
    setAssignedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleCreate = () => {
    if (!selectedCustomerId || !title.trim() || !content.trim()) {
      toast.error("请填写客户、标题和方案内容");
      return;
    }
    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) return;

    const delivery: DeliveryDesign = {
      id: `del-${Date.now()}`,
      customerId: selectedCustomerId,
      customerName: customer.companyName,
      designType,
      title: title.trim(),
      content: content.trim(),
      status: "draft",
      assignedTo: assignedRoles.length > 0 ? assignedRoles : ["FDE"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDelivery(delivery);
    setTitle("");
    setContent("");
    setAssignedRoles([]);
    setActiveTab("list");
    toast.success(`交付设计"${title}"已创建`);
  };

  const handleStatusChange = (
    id: string,
    newStatus: DeliveryDesign["status"]
  ) => {
    updateDelivery(id, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    toast.success(`状态已更新为：${statusLabels[newStatus]}`);
  };

  // AI生成3条交付路径
  const handleGeneratePaths = async () => {
    if (!pathCustomerType) {
      toast.error("请选择客户类型");
      return;
    }
    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) { toast.error("请先配置并激活 LLM"); return; }

    setPathLoading(true);
    try {
      const prompt = `为"${pathCustomerType}"类型客户，帮我生成3条标准交付路径（从开通到充值5000元）：

路径A：电商商家（卖货的，要素材+投放）
路径B：代理商（服务客户的，要交付能力）
路径C：品牌方（要统一内容标准）

每条路径包含：
1. 从开通到充值需要几步
2. 每步CS做什么
3. 每步AI帮什么
4. 每步的产出是什么
5. 预计几天到充值

输出JSON数组格式：
[{"pathType":"A|B|C","pathName":"路径名","targetCustomerType":"目标客户类型","steps":[{"stepNumber":数字,"title":"步骤名","csAction":"CS做什么","aiAction":"AI做什么","output":"产出"}],"estimatedDaysToValue":数字}]`;

      const systemPrompt = "你是CS交付设计专家。为不同类型客户设计从开通到充值的标准化交付路径。每条路径要具体可执行，步骤清晰。严格JSON数组格式。";

      const result = await callLLM(prompt, systemPrompt);
      if (!result.success) { toast.error(result.error || "失败"); return; }

      let parsed: Record<string, unknown>[];
      try {
        const jsonMatch = result.content.match(/\[[\s\S]*\]/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch { toast.error("解析失败"); return; }

      const paths: DeliveryPath[] = (parsed as Record<string, unknown>[]).map((item, idx) => ({
        id: `path-${Date.now()}-${idx}`,
        pathType: (item.pathType || "A") as "A" | "B" | "C",
        pathName: item.pathName as string,
        targetCustomerType: item.targetCustomerType as string,
        steps: (item.steps as Array<Record<string, unknown>>).map((s) => ({
          stepNumber: s.stepNumber as number,
          title: s.title as string,
          csAction: s.csAction as string,
          aiAction: s.aiAction as string,
          output: s.output as string,
        })),
        estimatedDaysToValue: item.estimatedDaysToValue as number || 7,
        generatedAt: new Date().toISOString(),
      }));

      setGeneratedPaths(paths);
      paths.forEach((p) => addDeliveryPath(p));
      toast.success(`生成了 ${paths.length} 条${pathCustomerType}交付路径`);
    } finally { setPathLoading(false); }
  };

  const filteredDeliveries = deliveries.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 基于聊天记录AI生成交付方案
  const handleGenerateFromChat = async () => {
    if (!chatHistory.trim()) { toast.error("请粘贴与客户的对话记录"); return; }
    if (!selectedCustomerId) { toast.error("请先在上方选择关联客户"); return; }

    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) { toast.error("请先配置并激活 LLM"); return; }

    setChatLoading(true);
    try {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      const prompt = `以下是CS（我）与客户"${customer?.companyName}"的聊天记录，请分析并生成一份定制化的交付方案。

聊天记录：
${chatHistory}

要求：
1. 先分析客户的真实需求和痛点（从对话中提取）
2. 识别客户类型（电商商家/代理商/品牌方等）
3. 生成一份针对性的交付方案，包含：方案标题、需求分析、具体交付内容（分3-5个阶段）、预计周期、成功指标

输出JSON格式：
{"title":"方案标题","designType":"solution|proposal|report","content":"完整方案Markdown文本","analysis":"需求分析摘要","customerType":"识别出的客户类型","estimatedDays":数字}`;

      const systemPrompt = "你是CS交付设计专家。擅长从真实的客户对话中挖掘深层需求，并转化为可执行的交付方案。严格JSON格式输出。";

      const result = await callLLM(prompt, systemPrompt);
      if (!result.success) { toast.error(result.error || "生成失败"); return; }

      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        if (parsed.title && parsed.content) {
          const delivery: DeliveryDesign = {
            id: `del-${Date.now()}`,
            customerId: selectedCustomerId,
            customerName: customer?.companyName || "未知客户",
            designType: (parsed.designType || "solution") as DeliveryDesign["designType"],
            title: parsed.title,
            content: parsed.content,
            status: "draft",
            assignedTo: ["FDE"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          addDelivery(delivery);
          setActiveTab("list");
          setChatHistory("");
          toast.success(`已生成交付方案"${parsed.title}"`);
        }
      } catch { toast.error("解析方案失败"); }
    } finally { setChatLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">交付设计</h2>
          <p className="text-sm text-slate-500 mt-1">
            方案设计 · 评审管理 · 客户交付
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list" className="gap-2">
            <FileText className="w-4 h-4" />
            设计列表 ({deliveries.length})
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2">
            <Plus className="w-4 h-4" />
            新建方案
          </TabsTrigger>
          <TabsTrigger value="ai-paths" className="gap-2">
            <Route className="w-4 h-4" />
            AI 路径生成
            {deliveryPaths.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[9px] px-1 h-4 scale-90">{deliveryPaths.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai-chat" className="gap-2">
            <Sparkles className="w-4 h-4" />
            AI 对话生成方案
          </TabsTrigger>
        </TabsList>

        {/* 设计列表 */}
        <TabsContent value="list">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  全部交付设计
                </CardTitle>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="搜索设计..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 h-8 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[480px]">
                <div className="px-4 pb-4 space-y-2">
                  {filteredDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-[10px] ${
                              delivery.designType === "solution"
                                ? "bg-blue-100 text-blue-700"
                                : delivery.designType === "proposal"
                                ? "bg-purple-100 text-purple-700"
                                : delivery.designType === "report"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {delivery.designType === "solution"
                              ? "解决方案"
                              : delivery.designType === "proposal"
                              ? "提案"
                              : delivery.designType === "report"
                              ? "报告"
                              : "其他"}
                          </Badge>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${statusColors[delivery.status]}`}
                          >
                            {statusIcons[delivery.status]}
                            {statusLabels[delivery.status]}
                          </span>
                        </div>
                        <button onClick={() => setDeleteTarget(delivery.id)} className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                      </div>
                          <h3 className="text-sm font-semibold text-slate-800">
                            {delivery.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {delivery.customerName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        {delivery.assignedTo.map((role) => (
                          <span
                            key={role}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${roleColors[role]}`}
                          >
                            {roleLabels[role]}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 mb-3 line-clamp-3 whitespace-pre-wrap">
                        {delivery.content}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {new Date(delivery.updatedAt).toLocaleDateString(
                            "zh-CN"
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {delivery.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() =>
                                handleStatusChange(delivery.id, "review")
                              }
                            >
                              <Send className="w-3 h-3" />
                              提交评审
                            </Button>
                          )}
                          {delivery.status === "review" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() =>
                                handleStatusChange(delivery.id, "final")
                              }
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              确认定稿
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredDeliveries.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <FileText className="w-10 h-10 mb-3" />
                      <p className="text-sm">暂无交付设计</p>
                      <Button
                        variant="link"
                        className="mt-2 text-sm"
                        onClick={() => setActiveTab("create")}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        创建首个方案
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 删除确认弹窗 */}
          <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除交付设计</AlertDialogTitle>
                <AlertDialogDescription>删除后无法恢复，确定要删除这条交付设计方案吗？</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => { if (deleteTarget) { deleteDelivery(deleteTarget); toast.success("交付设计已删除"); setDeleteTarget(null); } }}>确认删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* 新建方案 */}
        <TabsContent value="create">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                新建交付方案
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">选择客户</Label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择目标客户" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.companyName} ({c.tier}层)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">方案类型</Label>
                  <Select
                    value={designType}
                    onValueChange={(v) =>
                      setDesignType(v as DeliveryDesign["designType"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solution">解决方案</SelectItem>
                      <SelectItem value="proposal">提案</SelectItem>
                      <SelectItem value="report">报告</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">方案标题</Label>
                <Input
                  placeholder="输入方案标题..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">协同岗位</Label>
                <div className="flex flex-wrap gap-2">
                  {(
                    ["商务", "运营", "内容", "FDE"] as CollaboratorRole[]
                  ).map((role) => (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        assignedRoles.includes(role)
                          ? roleColors[role] + " ring-1 ring-offset-1"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      {roleLabels[role]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">方案内容</Label>
                <Textarea
                  placeholder="详细描述交付方案，包括需求分析、技术方案、预期效果、时间节点..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="resize-none font-mono text-sm"
                />
              </div>

              <Button onClick={handleCreate} className="gap-2">
                <ArrowRight className="w-4 h-4" />
                创建交付设计
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI 路径生成 Tab */}
        <TabsContent value="ai-paths">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* 输入区 */}
            <Card className="border-0 shadow-sm lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  AI 生成交付路径
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-slate-500">选择客户类型，AI 将生成 3 条从开通到充值的标准化路径：</p>
                {["电商商家", "代理商", "品牌方", "短剧创业者", "剪辑团队"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPathCustomerType(type)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      pathCustomerType === type
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    {type}
                  </button>
                ))}
                <Button onClick={handleGeneratePaths} disabled={pathLoading || !pathCustomerType} className="w-full gap-2 mt-2">
                  {pathLoading ? <><Loader2 className="w-4 h-4 animate-spin" />生成中...</> : <><Route className="w-4 h-4" />AI 生成3条路径</>}
                </Button>
                {deliveryPaths.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 mb-1.5">历史路径 ({deliveryPaths.length})</p>
                    {deliveryPaths.slice(0, 5).map((p) => (
                      <button key={p.id} onClick={() => setGeneratedPaths([p])} className="block w-full text-left px-2 py-1.5 rounded text-xs hover:bg-slate-50 truncate">
                        路径{p.pathType}: {p.targetCustomerType} ({p.estimatedDaysToValue}天)
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* 结果展示 */}
            <div className="lg:col-span-3 space-y-4">
              {generatedPaths.length > 0 ? generatedPaths.map((path, idx) => {
                const colors = ["border-blue-300 bg-blue-50", "border-green-300 bg-green-50", "border-purple-300 bg-purple-50"];
                return (
                  <Card key={path.id} className={`border ${colors[idx % 3]}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center text-xs font-bold">{path.pathType}</span>
                          路径{path.pathType}: {path.pathName}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{path.targetCustomerType}</Badge>
                          <Badge className="text-xs bg-orange-100 text-orange-700 border-0">{path.estimatedDaysToValue}天</Badge>
                          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(path, null, 2))}><Copy className="w-3.5 h-3.5 text-slate-400" /></button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {path.steps.map((step) => (
                          <div key={step.stepNumber} className="flex gap-3 p-2 rounded-lg bg-white/60 border border-slate-100">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{step.stepNumber}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                              <div className="grid grid-cols-3 gap-2 text-xs mt-1">
                                <div className="bg-blue-50 p-1.5 rounded"><span className="font-medium text-blue-700">CS:</span> {step.csAction}</div>
                                <div className="bg-emerald-50 p-1.5 rounded"><span className="font-medium text-emerald-700">AI:</span> {step.aiAction}</div>
                                <div className="bg-amber-50 p-1.5 rounded"><span className="font-medium text-amber-700">产出:</span> {step.output}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              }) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-16 text-center space-y-3">
                    <Route className="w-12 h-12 mx-auto text-slate-300" />
                    <p className="text-sm text-slate-500">选择客户类型开始生成</p>
                    <p className="text-xs text-slate-400">AI 将为该类型客户生成 3 条标准交付路径</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* AI 对话生成交付方案 */}
        <TabsContent value="ai-chat">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  粘贴对话记录，AI 自动生成交付方案
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">选择关联客户</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger><SelectValue placeholder="选择目标客户" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.companyName} ({c.tier}层)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">粘贴聊天记录</Label>
                  <Textarea
                    placeholder="粘贴你与客户的聊天记录（微信/企微/电话沟通内容均可），AI将自动识别角色、分析需求并生成交付方案..."
                    value={chatHistory}
                    onChange={(e) => setChatHistory(e.target.value)}
                    rows={10}
                    className="resize-none text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400">AI 会自动识别哪句话是客服说的、哪句是客户说的，然后提取需求生成方案</p>
                </div>
                <Button onClick={handleGenerateFromChat} disabled={chatLoading || !chatHistory.trim() || !selectedCustomerId} className="w-full gap-2">
                  {chatLoading ? <><Loader2 className="w-4 h-4 animate-spin" />AI 分析中...</> : <><Sparkles className="w-4 h-4" />AI 生成交付方案</>}
                </Button>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-blue-50/30">
              <CardContent className="p-6 space-y-4 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Bot className="w-4 h-4 text-purple-500" />使用说明</h3>
                <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside">
                  <li>选择一个已有关联的客户（或先去工作台添加）</li>
                  <li>粘贴与该客户的真实对话记录，格式不限</li>
                  <li>点击"AI 生成交付方案"，等待分析完成</li>
                  <li>AI 自动识别角色 → 提取需求 → 生成定制化方案</li>
                  <li>方案自动保存到"设计列表"，可进一步编辑和提交评审</li>
                </ol>
                <div className="pt-2 border-t border-purple-100">
                  <p className="text-[10px] text-slate-400">支持来源：企业微信聊天记录导出、微信聊天复制、电话会议纪要等任何文本格式</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
