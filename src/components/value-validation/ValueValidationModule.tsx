import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Loader2,
  Calendar,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import type { DailyMetrics } from "@/types";

export function ValueValidationModule() {
  const { callLLM, addDailyMetrics, dailyMetricsList } = useStore();
  const [form, setForm] = useState({
    newRecharges: "",
    trialNotRecharged: "",
    rechargedNotUsing: "",
    churnRisk: "",
  });
  const [loading, setLoading] = useState(false);
  const [latestResult, setLatestResult] = useState<DailyMetrics | null>(null);

  // 计算累计值
  const cumulativeData = dailyMetricsList.reduce(
    (acc, m) => ({
      recharges: acc.recharges + m.newRecharges,
      days: acc.days + 1,
    }),
    { recharges: 0, days: 0 }
  );

  const handleAnalyze = async () => {
    if (!form.newRecharges && !form.trialNotRecharged && !form.rechargedNotUsing) {
      toast.error("请至少填写一个数据项");
      return;
    }

    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) {
      toast.error("请先在系统设置中配置并激活 LLM");
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const prevCumulative = cumulativeData.recharges;
      const prevDays = dailyMetricsList.length;
      const newRechargeCount = parseInt(form.newRecharges) || 0;

      const prompt = `今天是${today}，请分析今天的CS数据：

今日客户数据：
- 新充值：${form.newRecharges || "0"}个（距60个目标还差${Math.max(0, 60 - prevCumulative - newRechargeCount)}个）
- 试用未充值：${form.trialNotRecharged || "0"}个
- 充值未使用：${form.rechargedNotUsing || "0"}个
- 流失风险：${form.churnRisk || "0"}个

历史累计：已过${prevDays}天，累计充值${prevCumulative}个

请输出JSON：
{
  "cumulativeRecharges": 累计充值数(数字),
  "targetGap": 距60目标差多少个(数字),
  "daysRemaining": 剩余天数(假设15天总周期)(数字),
  "dailyRateNeeded": 每天需要充值几个才能达标(数字，保留一位小数),
  "currentDailyRate": 当前日均充值数(数字，保留一位小数),
  "trialToRechargeRate": 试用→充值转化率估算(数字0-100),
  "activationToTrialRate": 开通→试用转化率估算(数字0-100),
  "cardAnalysis": "卡点分析(2-3句话)",
  "tomorrowSuggestion": "明日建议(1-2句话，具体可操作)",
  "focusTier": "明天重点推哪一层(A/B/C/D/E)",
  "riskAlert": 是否严重不达标(true/false)
}`;

      const systemPrompt = "你是CS数据分析专家。基于输入的每日数据，计算进度、识别卡点、给出明日建议。输出严格JSON格式。";

      const result = await callLLM(prompt, systemPrompt);

      if (!result.success) {
        toast.error(result.error || "AI 分析失败");
        return;
      }

      let parsed: Record<string, unknown>;
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch {
        toast.error("解析失败");
        return;
      }

      const metrics: DailyMetrics = {
        id: `metrics-${Date.now()}`,
        date: today,
        newRecharges: parseInt(form.newRecharges) || 0,
        trialNotRecharged: parseInt(form.trialNotRecharged) || 0,
        rechargedNotUsing: parseInt(form.rechargedNotUsing) || 0,
        churnRisk: parseInt(form.churnRisk) || 0,
        cumulativeRecharges: (parsed.cumulativeRecharges as number) || (prevCumulative + newRechargeCount),
        targetGap: (parsed.targetGap as number) || Math.max(0, 60 - prevCumulative - newRechargeCount),
        daysRemaining: (parsed.daysRemaining as number) || Math.max(0, 15 - dailyMetricsList.length - 1),
        dailyRateNeeded: (parsed.dailyRateNeeded as number) || 4.0,
        currentDailyRate: (parsed.currentDailyRate as number) || ((prevCumulative + newRechargeCount) / Math.max(1, dailyMetricsList.length + 1)),
        trialToRechargeRate: (parsed.trialToRechargeRate as number) || 0,
        activationToTrialRate: (parsed.activationToTrialRate as number) || 0,
        cardAnalysis: (parsed.cardAnalysis as string) || result.content.slice(0, 300),
        tomorrowSuggestion: (parsed.tomorrowSuggestion as string) || "",
        focusTier: (parsed.focusTier as string) || "C",
        riskAlert: (parsed.riskAlert as boolean) || false,
        createdAt: new Date().toISOString(),
      };

      addDailyMetrics(metrics);
      setLatestResult(metrics);
      toast.success("价值验证分析完成");
    } finally {
      setLoading(false);
    }
  };

  // 简单柱状图渲染
  const renderMiniChart = () => {
    const recent = dailyMetricsList.slice(0, 10).reverse();
    const maxVal = Math.max(...recent.map((m) => m.newRecharges), 5);
    return (
      <div className="flex items-end gap-1 h-24">
        {recent.map((m) => (
          <div key={m.id} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full bg-blue-500 rounded-t min-h-[2px]"
              style={{ height: `${(m.newRecharges / maxVal) * 80}px` }}
            />
            <span className="text-[9px] text-slate-400">{m.date.slice(5)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-600" />
            价值验证
          </h2>
          <p className="text-sm text-slate-500 mt-1">每天盯1个数 &middot; 转化率分析与趋势追踪</p>
        </div>
        <Badge variant="outline" className="text-xs">模块七</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左：数据输入 */}
        <Card className="lg:col-span-1 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              输入今日数据 ({new Date().toLocaleDateString("zh-CN")})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">新充值</Label>
              <Input type="number" placeholder="今天几个充值了?" value={form.newRecharges}
                onChange={(e) => setForm({ ...form, newRecharges: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">试用未充值</Label>
              <Input type="number" placeholder="试用中但没充值的" value={form.trialNotRecharged}
                onChange={(e) => setForm({ ...form, trialNotRecharged: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">充值未使用</Label>
              <Input type="number" placeholder="充了但没怎么用" value={form.rechargedNotUsing}
                onChange={(e) => setForm({ ...form, rechargedNotUsing: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">流失风险</Label>
              <Input type="number" placeholder="可能流失的客户" value={form.churnRisk}
                onChange={(e) => setForm({ ...form, churnRisk: e.target.value })} className="h-9 text-sm" />
            </div>

            <Button onClick={handleAnalyze} disabled={loading} className="w-full gap-2" size="lg">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />AI 分析中...</> : <><BarChart3 className="w-4 h-4" />开始价值验证</>}
            </Button>
          </CardContent>
        </Card>

        {/* 右：结果展示 */}
        <div className="lg:col-span-2 space-y-4">
          {(latestResult || dailyMetricsList[0]) && (function () {
            const r = latestResult || dailyMetricsList[0];
            const progress = Math.min(100, ((r.cumulativeRecharges / 60) * 100));
            const isOnTrack = r.currentDailyRate >= r.dailyRateNeeded;

            return (
              <>
                {/* 核心指标卡片 */}
                <Card className={`border-0 shadow-sm ${r.riskAlert ? "border-l-4 border-l-red-500" : ""}`}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{r.cumulativeRecharges}</p>
                        <p className="text-xs text-slate-500">累计充值</p>
                        <p className="text-[10px] text-red-400">距60差{r.targetGap}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{r.newRecharges}</p>
                        <p className="text-xs text-slate-500">今日新增</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-bold ${isOnTrack ? "text-green-600" : "text-red-500"}`}>
                          {r.currentDailyRate.toFixed(1)}
                        </p>
                        <p className="text-xs text-slate-500">当前日均</p>
                        <p className="text-[10px]">需{r.dailyRateNeeded.toFixed(1)}/天</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-orange-600">{r.daysRemaining}</p>
                        <p className="text-xs text-slate-500">剩余天数</p>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-600">进度 {r.cumulativeRecharges}/60</span>
                        <span className={`text-xs font-semibold ${isOnTrack ? "text-green-600" : "text-red-500"}`}>
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {r.riskAlert && (
                      <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        严重不达标！需要加快节奏
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 卡点分析 & 建议 */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" /> 卡点分析
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span>开通→试用转化率</span>
                          <span className={r.activationToTrialRate < 40 ? "text-red-500 font-semibold" : "text-green-600"}>
                            {r.activationToTrialRate}%
                            {r.activationToTrialRate < 40 && <AlertTriangle className="inline w-3 h-3 ml-1" />}
                          </span>
                        </div>
                        <Progress value={r.activationToTrialRate} className="h-1.5" />
                        <div className="flex justify-between items-center text-xs">
                          <span>试用→充值转化率</span>
                          <span className={r.trialToRechargeRate < 20 ? "text-red-500 font-semibold" : "text-green-600"}>
                            {r.trialToRechargeRate}%
                            {r.trialToRechargeRate < 20 && <AlertTriangle className="inline w-3 h-3 ml-1" />}
                          </span>
                        </div>
                        <Progress value={r.trialToRechargeRate} className="h-1.5" />
                      </div>
                      <p className="text-xs text-slate-600 mt-3 leading-relaxed">{r.cardAnalysis}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> 明日建议
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-2">
                        <p className="text-xs text-yellow-800 leading-relaxed">{r.tomorrowSuggestion || "暂无建议"}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">重点推:</span>
                        <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
                          {r.focusTier}层
                        </Badge>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-400 text-xs">客户</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 趋势图 */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> 近期充值趋势
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dailyMetricsList.length > 0 ? (
                      renderMiniChart()
                    ) : (
                      <p className="text-xs text-slate-400 py-8 text-center">暂无历史数据</p>
                    )}
                  </CardContent>
                </Card>
              </>
            );
          })()}

          {!latestResult && dailyMetricsList.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Target className="w-12 h-12 mb-3" />
                <p className="text-sm">请输入今日数据开始价值验证</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
