import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Loader2,
  Calendar,
  Target,
  Flag,
  CheckCircle2,
  Clock,
  Zap,
  Copy,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { DailyReport, SprintPlanDay } from "@/types";

// 15天冲刺计划默认数据
const DEFAULT_SPRINT_DAYS: SprintPlanDay[] = Array.from({ length: 15 }, (_, i) => {
  const day = i + 1;
  let phase: 1 | 2 | 3;
  if (day <= 5) phase = 1;
  else if (day <= 10) phase = 2;
  else phase = 3;

  const planData: Record<number, { focus: string; aiHelps: string; acceptance: string }> = {
    1: { focus: "盘60个客户，分层", aiHelps: "AI分层+推优先级", acceptance: "客户表填满" },
    2: { focus: "推B层(充值没)催使用", aiHelps: "AI批量生成催使用话术", acceptance: "5个客户开始用" },
    3: { focus: "推C层(试用没充值)", aiHelps: "AI诊断不充值原因+生成活术", acceptance: "3个客户充值" },
    4: { focus: "继续推C层", aiHelps: "AI继续诊断+话术", acceptance: "累计8个充值" },
    5: { focus: "阶段复盘", aiHelps: "AI分析转化率瓶颈", acceptance: "累计12个充值" },
    6: { focus: "推D层(没试用)激活", aiHelps: "AI批量生激活话术", acceptance: "10个客户开始试用" },
    7: { focus: "推C层催充值", aiHelps: "AI诊断+话术", acceptance: "累计20个充值" },
    8: { focus: "推D层+E层", aiHelps: "AI生激活+挽回话术", acceptance: "累计28个充值" },
    9: { focus: "推C层催充值", aiHelps: "AI诊断+话术", acceptance: "累计35个充值" },
    10: { focus: "阶段复盘", aiHelps: "AI分析+预警", acceptance: "累计40个充值" },
    11: { focus: "全力推C层充值", aiHelps: "AI诊断+话术+预警", acceptance: "累计45个充值" },
    12: { focus: "全力推+救流失", aiHelps: "AI预警+挽回方案", acceptance: "累计50个充值" },
    13: { focus: "全力推", aiHelps: "AI诊断+话术", acceptance: "累计54个充值" },
    14: { focus: "最后冲刺", aiHelps: "AI排优先级", acceptance: "累计58个充值" },
    15: { focus: "收尾+验收", aiHelps: "AI生成复盘", acceptance: "60个充值=30万" },
  };

  const data = planData[day] || { focus: "", aiHelps: "", acceptance: "" };
  return {
    day,
    phase,
    focus: data.focus,
    aiHelps: data.aiHelps,
    acceptance: data.acceptance,
    status: "pending" as const,
  };
});

export function ReportOutputModule() {
  const { callLLM, addDailyReport, deleteDailyReport, dailyReports, sprintPlan, setSprintPlan, updateSprintDay, dailyMetricsList, workspaceTracker } = useStore();
  const [activeTab, setActiveTab] = useState("report");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({
    recharges: "",
    pushed: "",
    trialToRecharge: "",
    activatedTrial: "",
    cardPoint: "",
    tomorrowFocus: "",
    tomorrowCount: "",
  });

  // 初始化冲刺计划
  const handleInitSprint = () => {
    const plan = {
      id: `sprint-${Date.now()}`,
      title: "15天CS冲刺计划",
      startDate: new Date().toISOString().split("T")[0],
      targetRevenue: 300000,
      targetClients: 60,
      days: DEFAULT_SPRINT_DAYS,
      createdAt: new Date().toISOString(),
    };
    setSprintPlan(plan);
    toast.success("15天冲刺计划已初始化");
  };

  // 从工作台数据自动填充日报表单
  const autoFillData = useMemo(() => {
    const rechargedToday = workspaceTracker.filter((r) => r.hasRecharged).length;
    const totalCustomers = workspaceTracker.length;
    const trialNotRecharged = workspaceTracker.filter((r) => !r.hasRecharged && r.customerName).length;
    const atRiskCount = workspaceTracker.filter((r) => r.riskLevel === "high").length;
    return { rechargedToday, totalCustomers, trialNotRecharged, atRiskCount };
  }, [workspaceTracker]);

  // 应用自动填充
  const handleAutoFill = () => {
    setReportForm((prev) => ({
      ...prev,
      recharges: prev.recharges || String(autoFillData.rechargedToday),
      pushed: prev.pushed || String(autoFillData.totalCustomers),
      trialToRecharge: prev.trialToRecharge || String(autoFillData.trialNotRecharged),
    }));
    toast.success("已从工作台数据自动填充");
  };

  // AI自动生成日报
  const handleAutoGenerate = async () => {
    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) { toast.error("请先配置LLM"); return; }

    setLoading(true);
    try {
      const latestMetrics = dailyMetricsList[0];
      const dayNum = dailyReports.length + 1;

      const prompt = `请生成第${dayNum}天的CS日报。格式如下：

【CS日报 Day ${dayNum}】
1. 今日充值：X个（累计X个，距60个还差X个）
2. 今日动作：推了X个客户，X个试用→充值，X个激活→试用
3. 明天重点：推X个试用客户充值
卡点：（如果有问题的话）

参考数据：
${latestMetrics ? `今日新充值${latestMetrics.newRecharges}个，累计${latestMetrics.cumulativeRecharges}个，试用未充值${latestMetrics.trialNotRecharged}个，充值未使用${latestMetrics.rechargedNotUsing}个` : "无历史数据"}
${sprintPlan ? `当前处于第${Math.min(dayNum, 5) <= 5 ? '一' : Math.min(dayNum, 10) <= 10 ? '二' : '三'}阶段` : ""}

输出JSON：{"title":"...","todayRecharges":数字,"todayRechargesCumulative":数字,"todayRechargesGap":数字,"todayActionsPushed":数字,"todayTrialToRecharge":数字,"todayActivatedTrial":数字,"tomorrowFocus":"...","tomorrowTargetCount":数字,"cardPoint":"...","sprintPhase":"phase1|phase2|phase3","content":"完整日报文本"}`;

      const result = await callLLM(prompt, "你是CS日报撰写专家。简洁有力，只报关键数据和行动。严格JSON格式。");
      if (!result.success) { toast.error(result.error || "失败"); return; }

      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        addDailyReport({ id: `report-${Date.now()}`, date: `Day ${dayNum}`, ...parsed, createdAt: new Date().toISOString() } as DailyReport);
        toast.success(`日报 Day ${dayNum} 已生成`);
      } catch { toast.error("解析失败"); }
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="w-6 h-6 text-indigo-600" />汇报输出</h2>
        <p className="text-sm text-slate-500 mt-1">日报(3数) + 15天冲刺计划 &middot; 模块八</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="report" className="gap-2"><FileText className="w-4 h-4" />日报</TabsTrigger>
          <TabsTrigger value="sprint" className="gap-2"><Target className="w-4 h-4" />15天计划</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><Calendar className="w-4 h-4" />历史 ({dailyReports.length})</TabsTrigger>
        </TabsList>

        {/* 日报 Tab */}
        <TabsContent value="report">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" /> 生成今日日报
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" placeholder="今日充值" value={reportForm.recharges} onChange={(e) => setReportForm({ ...reportForm, recharges: e.target.value })} className="h-8 text-sm text-center font-bold" />
                  <Input type="number" placeholder="推送客户" value={reportForm.pushed} onChange={(e) => setReportForm({ ...reportForm, pushed: e.target.value })} className="h-8 text-sm text-center" />
                  <Input type="number" placeholder="试→充" value={reportForm.trialToRecharge} onChange={(e) => setReportForm({ ...reportForm, trialToRecharge: e.target.value })} className="h-8 text-sm text-center" />
                </div>
                <Textarea placeholder="卡点（可选）..." value={reportForm.cardPoint} onChange={(e) => setReportForm({ ...reportForm, cardPoint: e.target.value })} rows={2} className="text-xs resize-none" />
                <Button onClick={handleAutoGenerate} disabled={loading} className="w-full gap-2">{loading ? <><Loader2 className="w-4 h-4 animate-spin" />生成中...</> : <><Sparkles className="w-4 h-4" />AI 自动生成日报</>}</Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={handleAutoFill}><Zap className="w-3.5 h-3.5" />从工作台自动填充</Button>
                  <span className="text-[10px] text-slate-400 flex items-center">或手动填写后保存</span>
                </div>
              </CardContent>
            </Card>

            {/* 最新日报预览 */}
            <Card className={`border-0 shadow-sm ${dailyReports[0] ? "border-l-4 border-l-indigo-500" : ""}`}>
              <CardContent className="p-4">
                {dailyReports[0] ? (function () {
                  const r = dailyReports[0];
                  return (
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">{r.reportTitle || r.date}</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-2 rounded-lg bg-green-50 text-center"><p className="text-lg font-bold text-green-600">+{r.todayRecharges}</p><p className="text-[10px] text-slate-500">今日充值</p></div>
                        <div className="p-2 rounded-lg bg-blue-50 text-center"><p className="text-lg font-bold text-blue-600">{r.todayRechargesCumulative}</p><p className="text-[10px] text-slate-500">累计</p></div>
                        <div className="p-2 rounded-lg bg-red-50 text-center"><p className="text-lg font-bold text-red-500">{r.todayRechargesGap}</p><p className="text-[10px] text-slate-500">距目标差</p></div>
                      </div>
                      {r.content && (
                        <div className="p-3 bg-slate-50 rounded text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{r.content}</div>
                      )}
                      {r.cardPoint && (
                        <div className="p-2 bg-yellow-50 rounded border border-yellow-200 text-xs text-yellow-800 flex items-start gap-1.5"><Flag className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{r.cardPoint}</div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400"><Calendar className="w-10 h-10 mb-2" /><p className="text-sm">暂无日报</p></div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 15天计划 Tab */}
        <TabsContent value="sprint">
          {!sprintPlan ? (
            <Card className="border-0 shadow-sm max-w-md mx-auto">
              <CardContent className="py-12 text-center space-y-4">
                <Target className="w-12 h-12 mx-auto text-indigo-400" />
                <p className="text-sm text-slate-600">15天冲刺计划尚未创建</p>
                <p className="text-xs text-slate-400">目标：60个客户 &times; ¥5000 = ¥30万</p>
                <Button onClick={handleInitSprint}><Zap className="w-4 h-4 mr-2" />初始化15天计划</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* 阶段概览 */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Phase 1 (Day 1-5)", sub: "冲试用&rightarrow;充值转化", color: "bg-blue-500", days: [1, 2, 3, 4, 5] },
                  { label: "Phase 2 (Day 6-10)", sub: "冲全链路", color: "bg-emerald-500", days: [6, 7, 8, 9, 10] },
                  { label: "Phase 3 (Day 11-15)", sub: "冲刺60个", color: "bg-red-500", days: [11, 12, 13, 14, 15] },
                ].map((ph) => (
                  <Card key={ph.label} className="border-0 shadow-sm overflow-hidden">
                    <div className={`h-1.5 ${ph.color}`} />
                    <CardContent className="p-3">
                      <p className="text-xs font-bold text-slate-700">{ph.label}</p>
                      <p className="text-[10px] text-slate-500">{ph.sub}</p>
                      <div className="mt-2 space-y-0.5">
                        {ph.days.map((d) => {
                          const dayData = sprintPlan!.days[d - 1];
                          return (
                            <div key={d} className="flex items-center justify-between text-[10px]">
                              <span>Day {d}</span>
                              <span className={`inline-flex items-center gap-0.5 ${dayData.status === "completed" ? "text-green-600" : dayData.status === "in_progress" ? "text-blue-600" : "text-slate-400"}`}>
                                {dayData.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : dayData.status === "in_progress" ? <Clock className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current inline-block" />}
                                {dayData.actualResult || dayData.acceptance}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 详细表格 */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">每日详细计划</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[360px]">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b">
                          <th className="p-2 text-left font-semibold w-14">天数</th>
                          <th className="p-2 text-left font-semibold">阶段</th>
                          <th className="p-2 text-left font-semibold">你干什么</th>
                          <th className="p-2 text-left font-semibold">AI 帮你什么</th>
                          <th className="p-2 text-left font-semibold">验收标准</th>
                          <th className="p-2 text-left font-semibold w-20">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sprintPlan.days.map((sd) => (
                          <tr key={sd.day} className="border-b hover:bg-slate-50">
                            <td className="p-2 font-bold">Day {sd.day}</td>
                            <td className="p-2"><Badge variant="outline" className="text-[9px]">{sd.phase === 1 ? "P1" : sd.phase === 2 ? "P2" : "P3"}</Badge></td>
                            <td className="p-2">{sd.focus}</td>
                            <td className="p-2 text-slate-600">{sd.aiHelps}</td>
                            <td className="p-2 text-green-700">{sd.acceptance}</td>
                            <td className="p-2">
                              <select
                                className="text-[10px] border rounded px-1 py-0.5"
                                value={sd.status}
                                onChange={(e) => updateSprintDay(sd.day, { status: e.target.value as SprintPlanDay["status"] })}
                              >
                                <option value="pending">待做</option>
                                <option value="in_progress">进行中</option>
                                <option value="completed">完成</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="text-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <p className="text-sm font-bold text-indigo-700">目标: 60个客户 = ¥30万</p>
                <p className="text-[10px] text-slate-500 mt-1">每天平均 4 个充值 &middot; AI帮你管60个，你重点盯TOP10</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 历史日报 */}
        <TabsContent value="history">
          <ScrollArea className="h-[480px]">
            <div className="space-y-3 pr-2">
              {dailyReports.slice().reverse().map((r) => (
                <Card key={r.id} className="border-0 shadow-sm hover:shadow transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{r.reportTitle || r.date}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => copyText(r.content || "")}><Copy className="w-4 h-4 text-slate-400" /></button>
                        <button onClick={() => setDeleteTarget(r.id)} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                      </div>
                    </div>
                    {r.content && <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed">{r.content}</p>}
                  </CardContent>
                </Card>
              ))}
              {dailyReports.length === 0 && <div className="text-center py-16 text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2" /><p className="text-sm">暂无日报记录</p></div>}
            </div>
          </ScrollArea>

          {/* 删除确认弹窗 */}
          <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除日报</AlertDialogTitle>
                <AlertDialogDescription>删除后无法恢复，确定要删除这条日报记录吗？</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => { if (deleteTarget) { deleteDailyReport(deleteTarget); toast.success("日报已删除"); setDeleteTarget(null); } }}>确认删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );

  function copyText(t: string) { navigator.clipboard.writeText(t); toast.success("已复制"); }
}
