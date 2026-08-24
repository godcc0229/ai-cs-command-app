import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Users,
  TrendingUp,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  ArrowUpRight,
  Trash2,
  PieChart,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// 性能优化：将颜色映射表提取到组件外部，避免每次渲染重新创建
const TIER_STYLES: Record<string, { bg: string; text: string; badge: string }> = {
  A: { bg: "bg-red-100", text: "text-red-600", badge: "bg-red-500" },
  B: { bg: "bg-orange-100", text: "text-orange-600", badge: "bg-orange-500" },
  C: { bg: "bg-green-100", text: "text-green-600", badge: "bg-green-500" },
};

const DEFAULT_TIER = { bg: "bg-slate-100", text: "text-slate-600", badge: "bg-slate-300" };

export function HomeDashboard() {
  const { customers, tierRecords, kbEntries, tasks, syncTierToKB, deleteCustomer, deleteTierRecord } =
    useStore();
  const [synced, setSynced] = useState(false);

  // 删除确认对话框状态
  const [deleteTarget, setDeleteTarget] = useState<{ type: "customer" | "record"; id: string; name: string } | null>(null);

  // 性能优化：使用 useMemo 缓存计算结果
  const stats = useMemo(() => ({
    total: customers.length,
    tierA: customers.filter((c) => c.tier === "A").length,
    tierB: customers.filter((c) => c.tier === "B").length,
    tierC: customers.filter((c) => c.tier === "C").length,
    totalConsumption: customers.reduce((s, c) => s + c.consumption, 0),
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    urgentTasks: tasks.filter((t) => t.urgency === "紧急" && t.status !== "completed").length,
  }), [customers, tasks]);

  // 行业分布数据
  const industryData = useMemo(() => {
    const map = new Map<string, number>();
    customers.forEach((c) => map.set(c.industry, (map.get(c.industry) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [customers]);

  // 最近分层记录
  const recentRecords = useMemo(
    () =>
      [...tierRecords]
        .sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime())
        .slice(0, 5),
    [tierRecords]
  );

  const formatMoney = (val: number) => {
    if (val >= 10000) return `¥${(val / 10000).toFixed(1)}万`;
    return `¥${val.toLocaleString()}`;
  };

  const handleSync = () => {
    syncTierToKB();
    setSynced(true);
    toast.success("客户数据已同步至知识库");
    setTimeout(() => setSynced(false), 3000);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    setDeleteTarget({ type: "customer", id, name });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "customer") {
      deleteCustomer(deleteTarget.id);
      toast.success(`已删除客户「${deleteTarget.name}」`);
    } else {
      deleteTierRecord(deleteTarget.id);
      toast.success("已删除分层记录");
    }
    setDeleteTarget(null);
  };

  const handleDeleteRecord = (id: string, name: string) => {
    setDeleteTarget({ type: "record", id, name });
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">首页仪表盘</h2>
          <p className="text-sm text-slate-500 mt-1">
            客户总览 · 数据监控 · 知识库同步
          </p>
        </div>
        <Button
          onClick={handleSync}
          variant={synced ? "outline" : "default"}
          className="gap-2"
          size="sm"
        >
          {synced ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              已同步
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              同步至知识库
            </>
          )}
        </Button>
      </div>

      {/* 核心指标卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">客户总数</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700">A层 {stats.tierA}</Badge>
              <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700">B层 {stats.tierB}</Badge>
              <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">C层 {stats.tierC}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">总消耗</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatMoney(stats.totalConsumption)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">待处理任务</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.pendingTasks}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            {stats.urgentTasks > 0 && (
              <div className="mt-2">
                <Badge className="text-[10px] bg-red-500 text-white"><AlertCircle className="w-3 h-3 mr-1" />{stats.urgentTasks} 项紧急</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 客户分层环形图 */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* CSS 环形图 */}
              <div
                className="w-12 h-12 rounded-full relative flex-shrink-0"
                style={{
                  background: `conic-gradient(#ef4444 0 ${(stats.tierA / Math.max(stats.total, 1)) * 360}deg, #f97316 ${(stats.tierA / Math.max(stats.total, 1)) * 360}deg ${((stats.tierA + stats.tierB) / Math.max(stats.total, 1)) * 360}deg, #22c55e ${((stats.tierA + stats.tierB) / Math.max(stats.total, 1)) * 360}deg 360deg)`,
                }}
              >
                <div className="absolute inset-2 m-auto w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <PieChart className="w-3.5 h-3.5" /> 分层占比
                </p>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[10px] text-red-600 font-medium">A {Math.round((stats.tierA / Math.max(stats.total, 1)) * 100)}%</span>
                  <span className="text-[10px] text-orange-600 font-medium">B {Math.round((stats.tierB / Math.max(stats.total, 1)) * 100)}%</span>
                  <span className="text-[10px] text-green-600 font-medium">C {Math.round((stats.tierC / Math.max(stats.total, 1)) * 100)}%</span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{kbEntries.length}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">知识库</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 下半区 - 双栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 全部客户列表 */}
        <Card className="border-0 shadow-sm dark:bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              全部客户 ({stats.total})
              <div className="flex items-center gap-1 ml-2">
                <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700">A {stats.tierA}</Badge>
                <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700">B {stats.tierB}</Badge>
                <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">C {stats.tierC}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[320px]">
              <div className="px-4 pb-4 space-y-2">
                {customers.map((customer) => {
                  const style = TIER_STYLES[customer.tier] || DEFAULT_TIER;
                  return (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/30 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}>
                          <Building2 className={`w-4 h-4 ${style.text}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{customer.companyName}</p>
                            <Badge className={`text-[9px] ${style.badge} text-white px-1.5`}>{customer.tier}层</Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{customer.contact.name} · {customer.contact.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${style.text}`}>{formatMoney(customer.consumption)}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{customer.industry}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id, customer.companyName)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          title={`删除客户「${customer.companyName}」`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 行业分布 & 最近活动 */}
        <div className="space-y-4">
          {/* 行业分布 */}
          <Card className="border-0 shadow-sm dark:bg-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">行业分布 TOP5</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {industryData.map(([industry, count], idx) => (
                <div key={industry} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500 w-5">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{industry}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{count}家</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${(count / Math.max(stats.total, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 最近分层变更 */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-blue-500" />
                最近分层变更
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[140px]">
                <div className="px-4 pb-4 space-y-2">
                  {recentRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700 truncate">
                          {record.customerName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {record.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-100"
                        >
                          {record.previousTier}
                        </Badge>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                        <Badge
                          className={`text-[10px] ${
                            record.currentTier === "A"
                              ? "bg-red-500"
                              : record.currentTier === "B"
                              ? "bg-orange-500"
                              : "bg-green-500"
                          } text-white`}
                        >
                          {record.currentTier}
                        </Badge>
                        <button
                          onClick={() => handleDeleteRecord(record.id, record.customerName)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          title={`删除分层记录「${record.customerName}」`}
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
        </div>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "customer"
                ? `确定要删除客户「${deleteTarget?.name}」吗？此操作不可撤销。`
                : `确定要删除分层记录「${deleteTarget?.name}」吗？`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
