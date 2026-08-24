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
  Layers,
  Plus,
  History,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Filter,
  RefreshCw,
  Building2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { CustomerTier, TierAnalysisRecord } from "@/types";

export function CustomerTierModule() {
  const { customers, tierRecords, addTierRecord, syncTierToKB } = useStore();
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [newTier, setNewTier] = useState<CustomerTier>("A");
  const [reason, setReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("analysis");

  // 获取选中的客户
  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);

  // 按层级过滤历史记录
  const tierHistoryA = tierRecords.filter(
    (r) => r.currentTier === "A" || r.previousTier === "A"
  );
  const tierHistoryB = tierRecords.filter(
    (r) => r.currentTier === "B" || r.previousTier === "B"
  );
  const tierHistoryC = tierRecords.filter(
    (r) => r.currentTier === "C" || r.previousTier === "C"
  );

  // 按日期分组
  const groupByDate = (records: TierAnalysisRecord[]) => {
    const groups = new Map<string, TierAnalysisRecord[]>();
    records
      .slice()
      .sort(
        (a, b) =>
          new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime()
      )
      .forEach((r) => {
        const existing = groups.get(r.analysisDate) || [];
        existing.push(r);
        groups.set(r.analysisDate, existing);
      });
    return groups;
  };

  const handleSubmitAnalysis = () => {
    if (!selectedCustomerData || !reason.trim()) {
      toast.error("请选择客户并填写分析理由");
      return;
    }

    const record: TierAnalysisRecord = {
      id: `tier-${Date.now()}`,
      customerId: selectedCustomerData.id,
      customerName: selectedCustomerData.companyName,
      previousTier: selectedCustomerData.tier,
      currentTier: newTier,
      analysisDate: new Date().toISOString().split("T")[0],
      reason: reason.trim(),
      consumptionLevel:
        selectedCustomerData.consumption >= 300000
          ? "high"
          : selectedCustomerData.consumption >= 100000
          ? "medium"
          : "low",
    };

    addTierRecord(record);
    syncTierToKB();
    setReason("");
    toast.success(
      `${selectedCustomerData.companyName} 层级分析已提交：${record.previousTier} → ${record.currentTier}`
    );
  };

  const getTierBadge = (tier: CustomerTier) => {
    const colors: Record<string, string> = {
      A: "bg-red-500 text-white",
      B: "bg-orange-500 text-white",
      C: "bg-green-500 text-white",
      D: "bg-slate-500 text-white",
      E: "bg-gray-400 text-white",
    };
    return (
      <Badge className={`text-[10px] ${colors[tier] || "bg-slate-300"}`}>{tier}层</Badge>
    );
  };

  const getTrendIcon = (prev: CustomerTier, curr: CustomerTier) => {
    const order: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
    if (order[curr] > order[prev])
      return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (order[curr] < order[prev])
      return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  // 搜索过滤
  const filteredCustomers = customers.filter((c) =>
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">客户分层分析</h2>
          <p className="text-sm text-slate-500 mt-1">
            A层 ({customers.filter((c) => c.tier === "A").length}) · B层 (
            {customers.filter((c) => c.tier === "B").length}) · C层 (
            {customers.filter((c) => c.tier === "C").length})
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            syncTierToKB();
            toast.success("数据已同步至知识库");
          }}
        >
          <RefreshCw className="w-4 h-4" />
          同步至知识库
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="analysis" className="gap-2">
            <Layers className="w-4 h-4" />
            分层分析
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            历史记录
          </TabsTrigger>
        </TabsList>

        {/* 分层分析 Tab */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 客户选择面板 */}
            <Card className="border-0 shadow-sm lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  选择客户
                </CardTitle>
                <Input
                  placeholder="搜索客户名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-2 h-8 text-sm"
                />
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[380px]">
                  <div className="px-4 pb-4 space-y-1">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCustomer(c.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                          selectedCustomer === c.id
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 truncate">
                              {c.companyName}
                            </span>
                            {getTierBadge(c.tier)}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {c.contact.name} · {c.industry}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* 分析表单 */}
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {selectedCustomerData
                    ? `分析客户：${selectedCustomerData.companyName}`
                    : "请选择客户进行分析"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCustomerData ? (
                  <>
                    {/* 客户信息概览 */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-500">当前层级</p>
                        <div className="mt-1">
                          {getTierBadge(selectedCustomerData.tier)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">累计消耗</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">
                          ¥{(selectedCustomerData.consumption / 10000).toFixed(1)}万
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">行业</p>
                        <p className="text-sm text-slate-700 mt-1">
                          {selectedCustomerData.industry}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">充值状态</p>
                        <Badge
                          className={`mt-1 text-[10px] ${
                            selectedCustomerData.hasRecharge
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          } text-white`}
                        >
                          {selectedCustomerData.hasRecharge ? "已充值" : "未充值"}
                        </Badge>
                      </div>
                    </div>

                    {/* 层级调整 */}
                    <div className="space-y-2">
                      <Label className="text-sm">调整层级</Label>
                      <Select
                        value={newTier}
                        onValueChange={(v) => setNewTier(v as CustomerTier)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A层 - 战略客户</SelectItem>
                          <SelectItem value="B">B层 - 成长客户</SelectItem>
                          <SelectItem value="C">C层 - 培育客户</SelectItem>
                        </SelectContent>
                      </Select>

                      {selectedCustomerData.tier !== newTier && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                          {getTrendIcon(selectedCustomerData.tier, newTier)}
                          <span>
                            将 {selectedCustomerData.companyName} 从
                            <strong>{selectedCustomerData.tier}层</strong> 调整为{" "}
                            <strong>{newTier}层</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 分析理由 */}
                    <div className="space-y-2">
                      <Label className="text-sm">分层分析与理由</Label>
                      <Textarea
                        placeholder="请详细说明分层调整的原因，包括消耗数据、合作进展、增长潜力等..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <Button
                      onClick={handleSubmitAnalysis}
                      className="w-full gap-2"
                      disabled={!reason.trim()}
                    >
                      <Plus className="w-4 h-4" />
                      提交分层分析
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Layers className="w-12 h-12 mb-3" />
                    <p className="text-sm">请在左侧选择客户开始分析</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 历史记录 Tab */}
        <TabsContent value="history">
          <Tabs defaultValue="A" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="A" className="gap-2">
                <Badge className="text-[10px] bg-red-500 text-white">A</Badge>
                A层记录 ({tierHistoryA.length})
              </TabsTrigger>
              <TabsTrigger value="B" className="gap-2">
                <Badge className="text-[10px] bg-orange-500 text-white">B</Badge>
                B层记录 ({tierHistoryB.length})
              </TabsTrigger>
              <TabsTrigger value="C" className="gap-2">
                <Badge className="text-[10px] bg-green-500 text-white">C</Badge>
                C层记录 ({tierHistoryC.length})
              </TabsTrigger>
            </TabsList>

            {(["A", "B", "C"] as const).map((tier) => {
              const records =
                tier === "A"
                  ? tierHistoryA
                  : tier === "B"
                  ? tierHistoryB
                  : tierHistoryC;
              const dateGroups = groupByDate(records);

              return (
                <TabsContent key={tier} value={tier}>
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {tier}层历史分析记录 - 按日期归档
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[480px]">
                        <div className="px-4 pb-4">
                          {Array.from(dateGroups.entries()).map(
                            ([date, items]) => (
                              <div key={date} className="mb-4">
                                {/* 日期标记 */}
                                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white py-2 z-10">
                                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    {date}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {items.length} 条记录
                                  </span>
                                </div>

                                {/* 记录列表 */}
                                <div className="space-y-2 ml-2 pl-4 border-l-2 border-blue-100">
                                  {items.map((record) => (
                                    <div
                                      key={record.id}
                                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-slate-800">
                                            {record.customerName}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            {getTierBadge(record.previousTier)}
                                            <span className="text-xs text-slate-400">
                                              →
                                            </span>
                                            {getTierBadge(record.currentTier)}
                                          </div>
                                          {getTrendIcon(
                                            record.previousTier,
                                            record.currentTier
                                          )}
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className={`text-[10px] ${
                                            record.consumptionLevel === "high"
                                              ? "border-red-300 text-red-600"
                                              : record.consumptionLevel === "medium"
                                              ? "border-orange-300 text-orange-600"
                                              : "border-green-300 text-green-600"
                                          }`}
                                        >
                                          {record.consumptionLevel === "high"
                                            ? "高消耗"
                                            : record.consumptionLevel === "medium"
                                            ? "中消耗"
                                            : "低消耗"}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-slate-600 leading-relaxed">
                                        {record.reason}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                          {records.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                              <Filter className="w-10 h-10 mb-3" />
                              <p className="text-sm">暂无{tier}层历史记录</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
