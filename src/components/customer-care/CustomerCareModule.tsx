import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Heart,
  Loader2,
  Copy,
  Send,
  Users,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Bot,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
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
import type { CareMessage as CareMsgType } from "@/types";

const CARE_TEMPLATES = [
  { id: "usage", label: "使用情况", desc: "询问最近使用体验和进展" },
  { id: "support", label: "提供支持", desc: "主动提供帮助和资源" },
  { id: "business", label: "业务进展", desc: "结合客户业务场景关心进展" },
  { id: "milestone", label: "里程碑", desc: "庆祝合作中的里程碑" },
  { id: "custom", label: "自定义", desc: "自定义关怀方向" },
];

export function CustomerCareModule() {
  const { callLLM, addCareBatch, careBatches, customers, deleteCareBatch, addCustomer } = useStore();
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState("usage");
  const [customContext, setCustomContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<CareMsgType[]>([]);

  // 聊天记录导入 + AI分析
  const [chatRecord, setChatRecord] = useState("");
  const [chatAnalysis, setChatAnalysis] = useState<string>("");
  const [chatAnalyzing, setChatAnalyzing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // 批量导入客户
  const [importText, setImportText] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // 筛选VIP客户(已充值+有消耗)
  const vipCustomers = customers.filter((c) => c.hasRecharge && c.consumption > 0);

  const toggleCustomer = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // AI分析聊天记录
  const handleAnalyzeChat = async () => {
    if (!chatRecord.trim()) { toast.error("请粘贴聊天记录"); return; }
    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) { toast.error("请先配置并激活 LLM"); return; }

    setChatAnalyzing(true);
    try {
      const prompt = `以下是CS（我）与客户的原始聊天记录，请分析并提取关键信息。

聊天记录：
${chatRecord}

请分析以下维度，用简洁的中文回答：
1. **角色识别**：哪句话是客服说的、哪句是客户说的
2. **客户情绪**：积极/中性/消极/焦虑
3. **客户核心需求/痛点**：从对话中提取1-3个
4. **建议关怀方向**：基于对话内容，应该用什么角度去关怀最合适
5. **风险预警**：是否有流失风险或其他需要关注的信号`;

      const systemPrompt = "你是CS客情分析专家。擅长从对话中识别角色、情绪和深层需求。输出结构化分析结果。";

      const result = await callLLM(prompt, systemPrompt);
      if (!result.success) { toast.error(result.error || "分析失败"); return; }
      setChatAnalysis(result.content);
    } finally { setChatAnalyzing(false); }
  };

  const handleGenerate = async () => {
    if (selectedCustomerIds.length === 0) {
      toast.error("请至少选择一个客户");
      return;
    }

    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) {
      toast.error("请先配置并激活 LLM");
      return;
    }

    setLoading(true);
    try {
      const selected = customers.filter((c) => selectedCustomerIds.includes(c.id));
      const template = CARE_TEMPLATES.find((t) => t.id === templateId);

      const prompt = `为以下${selected.length}个VIP客户各写一条关怀消息。

模板方向：${template?.label || "自定义"} - ${template?.desc || customContext}
要求：
1. 每条消息30字左右，自然温暖像人写的，不要模板感
2. 结合客户的实际类型（电商商家/代理商/品牌方等）和业务场景
3. 提供帮助而非推销产品
4. 每条消息包含具体可行动点

客户列表：
${selected.map((c, i) => `${i + 1}. ${c.companyName} | 类型:${c.customerType || c.industry} | 充值¥${c.consumption} | 联系人:${c.contact.name}`).join("\n")}

${chatAnalysis ? `\n=== 聊天记录分析上下文（生成关怀消息时请参考） ===\n${chatAnalysis}\n` : ""}

输出JSON数组：[{"customerName":"名称","customerType":"类型","message":"关怀消息(30字左右)","businessContext":"业务背景说明"}]`;

      const systemPrompt = "你是CS关怀专家。擅长写温暖、个性化、不像群发的关系维护消息。严格JSON格式输出。";

      const result = await callLLM(prompt, systemPrompt);
      if (!result.success) {
        toast.error(result.error || "生成失败");
        return;
      }

      let parsed: Record<string, unknown>[];
      try {
        const jsonMatch = result.content.match(/\[[\s\S]*\]/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        toast.error("解析失败");
        return;
      }

      const newMessages: CareMsgType[] = parsed.map((item, idx) => ({
        id: `care-${Date.now()}-${idx}`,
        customerName: item.customerName as string,
        customerType: item.customerType as string,
        message: item.message as string,
        businessContext: item.businessContext as string,
        phase: "care",
        generatedAt: new Date().toISOString(),
      }));

      setMessages(newMessages);
      addCareBatch({
        id: `batch-${Date.now()}`,
        name: `关怀批次-${new Date().toLocaleDateString("zh-CN")}`,
        customerIds: selectedCustomerIds,
        customerNames: selected.map((c) => c.companyName),
        messages: newMessages,
        template: templateId,
        createdAt: new Date().toISOString(),
      });
      toast.success(`生成了 ${newMessages.length} 条关怀消息`);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteCareBatch(deleteTarget);
      toast.success("批次已删除");
      setDeleteTarget(null);
    }
  };

  // 批量导入 VIP 客户
  const handleImportCustomers = async () => {
    if (!importText.trim()) { toast.error("请粘贴客户信息"); return; }
    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) { toast.error("请先配置并激活 LLM"); return; }

    setImportLoading(true);
    try {
      const prompt = `请解析以下客户信息（可能是JSON、CSV或表格格式），输出一个JSON数组。

客户信息：
${importText}

对每条客户信息，提取以下字段（缺失的用"未知"填充）：
- companyName: 企业名称
- contactName: 联系人姓名
- contactPosition: 职位
- industry: 行业
- consumption: 金额（提取数字部分，可能是"58万"或"580000"等形式，统一转成数字，万转成×10000）
- notes: 备注信息（如果有的话）

输出格式：
[{"companyName":"企业名","contactName":"联系人","contactPosition":"职位","industry":"行业","consumption":580000,"notes":"备注"}]`;

      const systemPrompt = "数据解析助手。严格JSON数组格式输出。勿加其他内容。";
      const result = await callLLM(prompt, systemPrompt);
      if (!result.success) { toast.error(result.error || "解析失败"); return; }

      const jsonMatch = result.content.match(/\[[\s\S]*\]/);
      const parsed: Array<Record<string, unknown>> = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      
      if (parsed.length === 0) { toast.error("未能解析到有效客户"); return; }

      let count = 0;
      for (const item of parsed) {
        if (!item.companyName || item.companyName === "未知") continue;
        addCustomer({
          id: `cust-${Date.now()}-${count}`,
          companyName: item.companyName as string,
          contact: { name: (item.contactName as string) || "待补充", position: (item.contactPosition as string) || "待补充" },
          industry: (item.industry as string) || "其他",
          tier: "B",
          hasRecharge: true,
          consumption: typeof item.consumption === 'number' ? item.consumption : 0,
          notes: (item.notes as string) || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        count++;
      }

      toast.success(`成功导入 ${count} 位客户`);
      setImportText("");
      setShowImport(false);
    } catch (err) {
      toast.error("导入失败，请检查数据格式");
      console.error(err);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 标题 */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          客情关怀
        </h2>
        <p className="text-sm text-slate-500 mt-1">VIP 客户关怀消息批量生成 &middot; 5分钟搞定全部</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：选择+设置 */}
        <div className="space-y-4">
          {/* VIP客户列表 */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-500" />
                  VIP 客户 ({vipCustomers.length})
                </CardTitle>
                <button
                  onClick={() => setShowImport(!showImport)}
                  className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  批量导入
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showImport && (
                <div className="p-3 bg-purple-50 rounded-lg space-y-2">
                  <p className="text-xs text-slate-600">粘贴客户信息（JSON/CSV/表格均可，AI 自动识别）:</p>
                  <Textarea
                    placeholder='示例：智途科技 | 张明远 | CEO | AI行业 | ¥58万&#10;云帆电商 | 李婷 | 运营总监 | 电商 | ¥42万&#10;也可以粘贴 JSON 数组格式'
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={5}
                    className="resize-none text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleImportCustomers}
                      disabled={importLoading || !importText.trim()}
                      className="flex-1 gap-1.5 text-xs bg-purple-500 hover:bg-purple-600"
                    >
                      {importLoading ? <><Loader2 className="w-3 h-3 animate-spin" />解析中</> : <><Sparkles className="w-3 h-3" />AI 导入</>}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { setShowImport(false); setImportText(""); }}>
                      取消
                    </Button>
                  </div>
                </div>
              )}
              <ScrollArea className={showImport ? "h-[160px]" : "h-[240px]"}>
                <div className="space-y-1.5 pr-2">
                  {vipCustomers.map((c) => (
                    <label key={c.id} className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedCustomerIds.includes(c.id) ? "bg-red-50 border border-red-200" : "hover:bg-slate-50"
                    } ${c.isSample ? "opacity-50 pointer-events-none" : ""}`}>
                      <Checkbox checked={selectedCustomerIds.includes(c.id)} onCheckedChange={() => toggleCustomer(c.id)} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-700 truncate block">{c.companyName}</span>
                        <span className="text-xs text-slate-400">¥{c.consumption}</span>
                      </div>
                      {c.isSample && <Badge variant="secondary" className="text-[9px]">演示</Badge>}
                    </label>
                  ))}
                  {vipCustomers.length === 0 && (
                    <p className="text-xs text-slate-400 py-4 text-center">暂无VIP客户，点右上角「批量导入」添加</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 模板选择 */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-pink-500" /> 关怀模板
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CARE_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}: {t.desc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templateId === "custom" && (
                <textarea
                  placeholder="描述关怀方向..."
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border p-2 text-sm resize-none"
                />
              )}
              <Button onClick={handleGenerate} disabled={loading || selectedCustomerIds.length === 0} className="w-full gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />AI 生成中...</> : <><Sparkles className="w-4 h-4" />批量生成关怀消息</>}
              </Button>
            </CardContent>
          </Card>

          {/* 聊天记录导入 + AI分析 */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bot className="w-4 h-4 text-pink-500" />
                聊天记录上下文（可选）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="粘贴与客户的聊天记录（企微/微信/电话沟通内容）...&#10;&#10;AI会自动识别角色、分析情绪和需求，让生成的关怀消息更精准"
                value={chatRecord}
                onChange={(e) => setChatRecord(e.target.value)}
                rows={8}
                className="resize-none text-xs font-mono"
              />
              <Button
                onClick={handleAnalyzeChat}
                disabled={chatAnalyzing || !chatRecord.trim()}
                variant="outline"
                size="sm"
                className="w-full gap-2"
              >
                {chatAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" />AI 分析中...</> : <><Bot className="w-4 h-4" />AI 分析聊天记录</>}
              </Button>
              {chatAnalysis && (
                <div className="p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto">
                  {chatAnalysis}
                </div>
              )}
              {chatAnalysis && (
                <button
                  onClick={() => { setChatAnalysis(""); setChatRecord(""); }}
                  className="text-[10px] text-slate-400 hover:text-red-500 w-full text-center"
                >
                  清除分析结果
                </button>
              )}
            </CardContent>
          </Card>

          {/* 历史批次 */}
          {careBatches.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold">历史批次 ({careBatches.length})</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-1 pr-2">
                    {careBatches.slice(0, 10).map((b) => (
                      <div key={b.id} className={`flex items-center justify-between p-1.5 rounded hover:bg-slate-50 text-xs ${b.isSample ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{b.name}</span>
                          {b.isSample && <Badge variant="secondary" className="text-[9px] shrink-0">演示</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline">{b.messages.length}条</Badge>
                          <button
                            onClick={() => setDeleteTarget(b.id)}
                            className="p-0.5 text-slate-400 hover:text-red-500 rounded"
                            title="删除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：结果展示 */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2"><Send className="w-4 h-4 text-pink-500" /> 关怀消息 ({messages.length})</span>
                {messages.length > 0 && (
                  <button onClick={() => {
                    navigator.clipboard.writeText(messages.map((m) => `${m.customerName}：${m.message}`).join("\n\n"));
                    toast.success("已复制全部消息");
                  }} className="text-xs text-blue-600 hover:text-blue-700">复制全部</button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length > 0 ? (
                <ScrollArea className="h-[520px]">
                  <div className="space-y-3 pr-2">
                    {messages.map((msg) => (
                      <div key={msg.id} className="p-4 rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50/80 to-white space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <span className="text-sm font-semibold text-slate-800">{msg.customerName}</span>
                            <Badge variant="outline" className="text-[10px]">{msg.customerType}</Badge>
                          </div>
                          <button onClick={() => copyText(msg.message)} className="text-slate-400 hover:text-slate-600"><Copy className="w-4 h-4" /></button>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed pl-6">&ldquo;{msg.message}&rdquo;</p>
                        <div className="pl-6 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-slate-500">{msg.businessContext}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm">选择客户并点击生成</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* 删除确认弹窗 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除该关怀批次吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleConfirmDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
