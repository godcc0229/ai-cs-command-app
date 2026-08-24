import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Filter,
  Sparkles,
  TrendingUp,
  Calendar,
  Star,
  Target,
  Loader2,
  Copy,
  ChevronRight,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { ScenarioTier, TopClient, ScenarioFilterResult } from "@/types";

const TIER_CONFIG: Record<ScenarioTier, { label: string; color: string; bg: string; desc: string }> = {
  A: { label: "战略客户", color: "text-red-700", bg: "bg-red-100 border-red-200", desc: "已充值+高使用，重点维护" },
  B: { label: "成长客户", color: "text-orange-700", bg: "bg-orange-100 border-orange-200", desc: "有潜力，需加速转化" },
  C: { label: "培育客户", color: "text-blue-700", bg: "bg-blue-100 border-blue-200", desc: "试用中，跟进激活" },
  D: { label: "试用客户", color: "text-slate-700", bg: "bg-slate-100 border-slate-200", desc: "刚开通，待激活" },
  E: { label: "待激活", color: "text-gray-500", bg: "bg-gray-100 border-gray-200", desc: "无动作，需触达" },
};

export function ScenarioFilterModule() {
  const { callLLM, addScenarioResult, scenarioResults } = useStore();
  const [rawInput, setRawInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [latestResult, setLatestResult] = useState<ScenarioFilterResult | null>(null);
  const [activeTab, setActiveTab] = useState("filter");

  const handleAnalyze = async () => {
    if (!rawInput.trim()) {
      toast.error("请先粘贴客户数据");
      return;
    }

    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) {
      toast.error("请先在系统设置中配置并激活一个 LLM");
      return;
    }

    setLoading(true);
    try {
      const systemPrompt = `你是CS（客户成功）领域的客户分析专家。你的任务是将一批客户数据按照以下标准分为A-E五个层级，并输出TOP10优先级列表。

分级标准：
- A层（战略客户）：已充值且日均使用活跃，是核心收入来源
- B层（成长客户）：已充值但使用率偏低，或试用中表现出强烈付费意愿
- C层（培育客户）：已在试用中，有一定互动，需要加速激活
- D层（试用客户）：刚刚开通或注册，还没有实质使用
- E层（待激活）：长期无登录、无互动，接近流失

输出要求（严格JSON格式）：
{
  "tierCounts": {"A": 数字, "B": 数字, "C": 数字, "D": 数字, "E": 数字},
  "top10": [
    {"rank": 1, "customerName": "名称", "tier": "A/B/C/D/E", "reason": "为什么是这个层级(一句话)", "suggestedAction": "建议做什么"}
  ],
  "aiAnalysis": "一段整体分析摘要(2-3句话)"
}

注意：top10按优先级排序，A层在前，其次是B层中高潜力的。`;

      const result = await callLLM(rawInput.trim(), systemPrompt);

      if (!result.success) {
        toast.error(result.error || "AI 分析失败");
        return;
      }

      // 解析 AI 返回的 JSON
      let parsed;
      try {
        // 尝试从返回内容提取 JSON
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("无法解析JSON");
        }
      } catch {
        toast.error("AI 返回格式异常，请重试");
        return;
      }

      const top10: TopClient[] = (parsed.top10 || []).map((item: Record<string, unknown>) => ({
        rank: item.rank as number,
        customerName: item.customerName as string,
        tier: (item.tier || "E") as ScenarioTier,
        reason: item.reason as string,
        suggestedAction: item.suggestedAction as string,
      }));

      const filterResult: ScenarioFilterResult = {
        id: `scenario-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        totalClients: (Object.values(parsed.tierCounts || {}) as number[]).reduce((a: number, b: number) => a + b, 0),
        tierCounts: parsed.tierCounts || { A: 0, B: 0, C: 0, D: 0, E: 0 },
        top10,
        rawInput: rawInput.trim(),
        aiAnalysis: parsed.aiAnalysis || result.content.slice(0, 500),
        createdAt: new Date().toISOString(),
      };

      addScenarioResult(filterResult);
      setLatestResult(filterResult);
      setActiveTab("result");
      toast.success(`分析完成！共 ${filterResult.totalClients} 个客户，TOP10 已生成`);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制");
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Filter className="w-6 h-6 text-blue-600" />
            场景筛选
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            每日客户分级与优先排序 &middot; AI 辅助 A-E 五级分层 + TOP10
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          模块二
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="filter" className="gap-2">
            <Sparkles className="w-4 h-4" />
            AI 分析
          </TabsTrigger>
          <TabsTrigger value="result" className="gap-2">
            <Star className="w-4 h-4" />
            分析结果
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Calendar className="w-4 h-4" />
            历史记录 ({scenarioResults.length})
          </TabsTrigger>
        </TabsList>

        {/* AI 分析 Tab */}
        <TabsContent value="filter">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                粘贴今日客户数据
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                将所有客户的简要信息粘贴到下方（每行一个客户），AI 将自动分析分级并输出 TOP10
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`示例格式：\n1. XX公司 | 电商商家 | 已充值5000 | 日均消耗300 | 最后登录今天\n2. YY传媒 | 品牌方 | 试用中 | 登录过2次 | 未充值\n3. ZZ科技 | 代理商 | 开通7天 | 从未登录\n...\n\n支持自由格式，AI会智能解析`}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={12}
                className="resize-none text-sm font-mono"
              />
              <Button
                onClick={handleAnalyze}
                disabled={loading || !rawInput.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 正在分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    开始 AI 场景筛选
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 分析结果 Tab */}
        <TabsContent value="result">
          {!latestResult && scenarioResults.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Target className="w-12 h-12 mb-3" />
                <p className="text-sm">暂无分析结果，请先进行 AI 分析</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(latestResult || scenarioResults[0]) && (function () {
                const r = latestResult || scenarioResults[0];
                return (
                  <>
                    {/* 层级统计 */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">
                            分级统计 - {r.date}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            共 {r.totalClients} 个客户
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-5 gap-3">
                          {(["A", "B", "C", "D", "E"] as ScenarioTier[]).map((tier) => {
                            const cfg = TIER_CONFIG[tier];
                            return (
                              <div key={tier} className={`p-3 rounded-lg border ${cfg.bg}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs font-bold ${cfg.color}`}>{tier}层</span>
                                  <span className="text-lg font-bold">{r.tierCounts[tier] || 0}</span>
                                </div>
                                <p className="text-[10px] text-slate-500">{cfg.label}</p>
                              </div>
                            );
                          })}
                        </div>
                        {/* AI 分析摘要 */}
                        {r.aiAnalysis && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-800 leading-relaxed">{r.aiAnalysis}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* TOP10 列表 */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          TOP10 今日优先处理
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-2 pr-2">
                            {r.top10.map((client) => {
                              const cfg = TIER_CONFIG[client.tier];
                              return (
                                <div
                                  key={client.rank}
                                  className="flex items-start gap-3 p-3 rounded-lg border hover:border-slate-300 transition-colors bg-white"
                                >
                                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center">
                                    {client.rank}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-slate-800">
                                        {client.customerName}
                                      </span>
                                      <Badge className={`text-[10px] ${cfg.bg} ${cfg.color} border-0`}>
                                        {client.tier}层
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">{client.reason}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <ChevronRight className="w-3 h-3 text-green-500" />
                                      <span className="text-xs text-green-700 font-medium">
                                        {client.suggestedAction}
                                      </span>
                                      <button
                                        onClick={() => copyText(`${client.customerName}: ${client.suggestedAction}`)}
                                        className="ml-auto text-slate-400 hover:text-slate-600"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>
          )}
        </TabsContent>

        {/* 历史记录 Tab */}
        <TabsContent value="history">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                历史筛选记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[480px]">
                <div className="space-y-3 pr-2">
                  {scenarioResults.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                      onClick={() => {
                        setLatestResult(record);
                        setActiveTab("result");
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-800">{record.date}</span>
                        <Badge variant="outline" className="text-xs">
                          {record.totalClients} 个客户
                        </Badge>
                      </div>
                      <div className="flex gap-2 mb-2">
                        {(["A", "B", "C", "D", "E"] as ScenarioTier[]).map((tier) => (
                          <span key={tier} className="text-xs text-slate-500">
                            {tier}:{record.tierCounts[tier] || 0}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{record.aiAnalysis}</p>
                    </div>
                  ))}
                  {scenarioResults.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <Calendar className="w-10 h-10 mb-3" />
                      <p className="text-sm">暂无历史记录</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
