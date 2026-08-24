import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Eye,
  Repeat,
  Heart,
  Loader2,
  Copy,
  MessageSquare,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { FlowPhase, FlowOutput, ActivationMessage, FollowUpDiagnosis, RepurchaseAnalysis, CareMessage as CareMsg } from "@/types";

const PHASE_CONFIG: Record<FlowPhase, {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  systemPrompt: string;
}> = {
  activation: {
    icon: <Zap className="w-4 h-4" />,
    title: "Phase 1 激活",
    subtitle: "AI批量生成激活话术，推动试用客户开始使用",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    systemPrompt: `你是CS（客户成功）专家，擅长写短小精悍的激活消息。
要求：
1. 每条消息不超过30字
2. 必须包含具体行动点（如"点击这里试试"、"看这个案例"）
3. 根据客户类型定制（电商商家侧重素材投放、代理商侧重交付能力、品牌方侧重内容标准）
4. 语气友好但有推动力

输出JSON数组格式：[{"customerName":"名称","customerType":"类型","message":"激活话术(<30字)","actionItem":"具体行动"}]`,
  },
  followup: {
    icon: <Eye className="w-4 h-4" />,
    title: "Phase 2 跟随",
    subtitle: "诊断试用未充值客户的卡点，给出跟进策略",
    color: "text-orange-600 bg-orange-50 border-orange-200",
    systemPrompt: `你是CS诊断专家。分析每个试用但未充值客户可能的原因并给出建议。

常见原因方向：
- 不知道怎么用（需要Demo/教程）
- 觉得价值不明确（需要案例/ROI）
- 内部决策慢（需要推一把）
- 在竞品对比（需要差异化）
- 预算问题（需要灵活方案）

输出JSON数组格式：[{"customerName":"名称","diagnosis":"未充值原因诊断(一句话)","suggestedApproach":"建议跟进方式(一句话)"}]`,
  },
  repurchase: {
    icon: <Repeat className="w-4 h-4" />,
    title: "Phase 3 复购",
    subtitle: "分析低使用率已充值客户，生成催使用话术+流失预警",
    color: "text-purple-600 bg-purple-50 border-purple-200",
    systemPrompt: `你是CS续费专家。对已充值但低使用的客户进行分析。

输出JSON数组格式：
[{"customerName":"名称","usageAnalysis":"使用情况分析(为什么用得少)","nudgeMessage":"催使用话术(友好提醒+行动建议)","churnRisk":"high|medium|low"}]

churnRisk判断：
- high: 充值后几乎没登录或消耗极低
- medium: 偶尔使用但不深入
- low: 有一定活跃度只是不够高`,
  },
  care: {
    icon: <Heart className="w-4 h-4" />,
    title: "Phase 4 客情",
    subtitle: "为VIP客户生成个性化关怀消息，维护关系促进复购",
    color: "text-red-500 bg-red-50 border-red-200",
    systemPrompt: `你是CS关怀专家。为VIP客户写一条温暖但不油腻的关怀消息。

要求：
1. 消息自然像人写的，不要模板感
2. 提到具体业务场景（如"最近XX项目进展如何"）
3. 提供帮助而非推销
4. 30字左右

输出JSON数组格式：[{"customerName":"名称","customerType":"类型","message":"关怀消息(30字左右)","businessContext":"结合的业务背景"}]`,
  },
};

export function ValueDeliveryModule() {
  const { callLLM, addFlowOutput, flowOutputs, clearFlowOutputs } = useStore();
  const [activePhase, setActivePhase] = useState<FlowPhase>("activation");
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  // 筛选当前阶段的输出
  const currentOutputs = flowOutputs.filter((o) => o.phase === activePhase);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error("请输入客户数据");
      return;
    }

    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) {
      toast.error("请先在系统设置中配置并激活 LLM");
      return;
    }

    setLoading(true);
    try {
      const config = PHASE_CONFIG[activePhase];
      const result = await callLLM(inputText.trim(), config.systemPrompt);

      if (!result.success) {
        toast.error(result.error || "AI 生成失败");
        return;
      }

      // 解析 JSON
      let parsed: Record<string, unknown>[];
      try {
        const jsonMatch = result.content.match(/\[[\s\S]*\]/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        toast.error("返回格式解析失败");
        return;
      }

      // 根据阶段转换类型
      const newOutputs: FlowOutput[] = parsed.map((item, idx) => {
        const base = { id: `${activePhase}-${Date.now()}-${idx}`, phase: activePhase, generatedAt: new Date().toISOString() };
        switch (activePhase) {
          case "activation":
            return { ...base, customerName: item.customerName as string, customerType: item.customerType as string, message: item.message as string, actionItem: item.actionItem as string } as ActivationMessage;
          case "followup":
            return { ...base, customerName: item.customerName as string, diagnosis: item.diagnosis as string, suggestedApproach: item.suggestedApproach as string } as FollowUpDiagnosis;
          case "repurchase":
            return { ...base, customerName: item.customerName as string, usageAnalysis: item.usageAnalysis as string, nudgeMessage: item.nudgeMessage as string, churnRisk: (item.churnRisk || "medium") as "high" | "medium" | "low" } as RepurchaseAnalysis;
          case "care":
            return { ...base, customerName: item.customerName as string, customerType: item.customerType as string, message: item.message as string, businessContext: item.businessContext as string } as CareMsg;
        }
      });

      newOutputs.forEach((o) => addFlowOutput(o));
      toast.success(`生成了 ${newOutputs.length} 条${config.title}内容`);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制");
  };

  const renderOutputCard = (output: FlowOutput) => {
    switch (output.phase) {
      case "activation": {
        const o = output as ActivationMessage;
        return (
          <div key={o.id} className="p-3 rounded-lg border border-blue-100 bg-white space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{o.customerName}</span>
              <Badge variant="outline" className="text-[10px]">{o.customerType}</Badge>
            </div>
            <div className="p-2 bg-blue-50 rounded text-sm text-slate-700">&ldquo;{o.message}&rdquo;</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />{o.actionItem}
              </span>
              <button onClick={() => copyText(o.message)} className="text-slate-400 hover:text-slate-600"><Copy className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        );
      }
      case "followup": {
        const o = output as FollowUpDiagnosis;
        return (
          <div key={o.id} className="p-3 rounded-lg border border-orange-100 bg-white space-y-2">
            <span className="text-sm font-semibold text-slate-800">{o.customerName}</span>
            <div className="p-2 bg-orange-50 rounded text-sm text-slate-700">{o.diagnosis}</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <Eye className="w-3 h-3" />{o.suggestedApproach}
              </span>
              <button onClick={() => copyText(o.diagnosis + "\n→ " + o.suggestedApproach)} className="text-slate-400 hover:text-slate-600"><Copy className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        );
      }
      case "repurchase": {
        const o = output as RepurchaseAnalysis;
        const riskColor = o.churnRisk === "high" ? "bg-red-100 text-red-700 border-red-200" : o.churnRisk === "medium" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-green-100 text-green-700 border-green-200";
        const riskLabel = o.churnRisk === "high" ? "高流失风险" : o.churnRisk === "medium" ? "中风险" : "正常";
        return (
          <div key={o.id} className="p-3 rounded-lg border border-purple-100 bg-white space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{o.customerName}</span>
              <Badge className={`text-[10px] ${riskColor} border`}>{riskLabel}</Badge>
            </div>
            <div className="text-xs text-slate-600">{o.usageAnalysis}</div>
            <div className="p-2 bg-purple-50 rounded text-sm text-slate-700">&ldquo;{o.nudgeMessage}&rdquo;</div>
            <button onClick={() => copyText(o.nudgeMessage)} className="text-xs text-slate-400 hover:text-slate-600">复制</button>
          </div>
        );
      }
      case "care": {
        const o = output as CareMsg;
        return (
          <div key={o.id} className="p-3 rounded-lg border border-red-100 bg-white space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{o.customerName}</span>
              <Badge variant="outline" className="text-[10px]">{o.customerType}</Badge>
            </div>
            <div className="p-2 bg-red-50 rounded text-sm text-slate-700">&ldquo;{o.message}&rdquo;</div>
            <div className="text-xs text-slate-500">{o.businessContext}</div>
            <button onClick={() => copyText(o.message)} className="text-xs text-slate-400 hover:text-slate-600">复制关怀消息</button>
          </div>
        );
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-purple-600" />
            价值传递 / 流程重构
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            四阶段工作流加速 &middot; AI 批量生成个性化话术
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => { clearFlowOutputs(activePhase); toast.success("已清空"); }}
        >
          <Trash2 className="w-4 h-4" />
          清空当前阶段
        </Button>
      </div>

      {/* Phase 切换 */}
      <Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as FlowPhase)}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          {(Object.keys(PHASE_CONFIG) as FlowPhase[]).map((phase) => {
            const cfg = PHASE_CONFIG[phase];
            const count = flowOutputs.filter((o) => o.phase === phase).length;
            return (
              <TabsTrigger key={phase} value={phase} className="gap-1.5 text-xs">
                {cfg.icon}
                {cfg.title.split(" ")[1]}
                {count > 0 && <Badge variant="secondary" className="ml-1 text-[9px] px-1 h-4">{count}</Badge>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(PHASE_CONFIG) as FlowPhase[]).map((phase) => {
          const cfg = PHASE_CONFIG[phase];
          return (
            <TabsContent key={phase} value={phase}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* 输入区 */}
                <Card className={`lg:col-span-2 border ${cfg.color.split(" ").slice(1).join(" ")}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      {cfg.icon}
                      {cfg.title}: {cfg.subtitle.split("·")[0]}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">{cfg.subtitle}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder={
                        phase === "activation"
                          ? "每行一个试用客户:\nXX公司 | 电商商家 | 开通7天 | 登录2次"
                          : phase === "followup"
                          ? "每行一个试用未充值客户:\nYY传媒 | 品牌方 | 试用14天 | 看了Demo但没动静"
                          : phase === "repurchase"
                          ? "每行一个低使用率已充值客户:\nZZ科技 | 代理商 | 充值5000 | 只用了200\nAA电商 | 电商商家 | 充值3000 | 上周后再没用过"
                          : "每行一个VIP客户:\nBB集团 | 品牌方 | 充值10000 | 日均500\nCC传媒 | 代理商 | 充值8000 | 合作愉快"
                      }
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={8}
                      className="resize-none text-sm"
                    />
                    <Button
                      onClick={handleGenerate}
                      disabled={loading || !inputText.trim()}
                      className="w-full gap-2"
                    >
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" />AI 生成中...</> : <><Plus className="w-4 h-4" />AI 生成{cfg.title.split(" ")[1]}内容</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* 输出区 */}
                <Card className="lg:col-span-3 border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span>生成结果 ({currentOutputs.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[420px]">
                      <div className="space-y-3 pr-2">
                        {currentOutputs.length > 0 ? (
                          currentOutputs.map(renderOutputCard)
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <MessageSquare className="w-10 h-10 mb-3" />
                            <p className="text-sm">输入客户数据开始 AI 生成</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
