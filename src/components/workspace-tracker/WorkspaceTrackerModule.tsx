import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutGrid,
  Download,
  Upload,
  Plus,
  Trash2,
  Search,
  Filter,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export function WorkspaceTrackerModule() {
  const { workspaceTracker, setWorkspaceTracker, addTrackerRow, updateTrackerRow, deleteTrackerRow, customers } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  // 过滤数据
  const filteredData = useMemo(() => {
    return workspaceTracker.filter((row) => {
      const matchSearch = !searchQuery || row.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRisk = riskFilter === "all" || row.riskLevel === riskFilter;
      return matchSearch && matchRisk;
    });
  }, [workspaceTracker, searchQuery, riskFilter]);

  // 从客户列表导入
  const handleImportFromCustomers = () => {
    if (customers.length === 0) {
      toast.error("暂无客户数据");
      return;
    }
    if (window.confirm(`确定导入 ${customers.length} 个客户到工作台？`)) {
      const newRows = customers.map((c) => ({
        id: `track-${c.id}`,
        customerName: c.companyName,
        customerType: c.customerType || c.industry,
        openDate: c.createdAt.split("T")[0],
        hasRecharged: c.hasRecharge,
        rechargeAmount: c.consumption,
        dailyConsumption: c.dailyConsumption || 0,
        lastLogin: c.lastLoginDate || "-",
        lastContact: c.lastContactDate || "-",
        currentStage: c.currentStage || (c.hasRecharge ? "使用中" : "试用中"),
        blockPoint: c.blockPoint || "",
        nextStep: c.nextStep || "",
        riskLevel: c.riskLevel || "low",
        updatedAt: new Date().toISOString(),
      }));
      setWorkspaceTracker(newRows);
      toast.success(`已导入 ${newRows.length} 个客户`);
    }
  };

  // 添加空行
  const handleAddRow = () => {
    const newRow = {
      id: `track-new-${Date.now()}`,
      customerName: "",
      customerType: "",
      openDate: new Date().toISOString().split("T")[0],
      hasRecharged: false,
      rechargeAmount: 0,
      dailyConsumption: 0,
      lastLogin: "-",
      lastContact: "-",
      currentStage: "",
      blockPoint: "",
      nextStep: "",
      riskLevel: "low" as const,
      updatedAt: new Date().toISOString(),
    };
    addTrackerRow(newRow);
    setEditingId(newRow.id);
  };

  // 开始编辑
  const startEdit = (id: string) => {
    const row = workspaceTracker.find((r) => r.id === id);
    if (!row) return;
    setEditForm({ ...row as unknown as Record<string, string> });
    setEditingId(id);
  };

  // 自动推断充值状态：当有消耗或充值金额时自动标记为已充值
  const handleConsumptionChange = (field: "rechargeAmount" | "dailyConsumption", value: string) => {
    const numValue = Number(value) || 0;
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };
      // 自动推断：如果有充值金额或日均消耗>0，则自动设置已充值
      if (numValue > 0) {
        updated.hasRecharged = "true";
      }
      return updated;
    });
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingId) return;
    updateTrackerRow(editingId, {
      customerName: editForm.customerName || "",
      customerType: editForm.customerType || "",
      openDate: editForm.openDate || "",
      hasRecharged: editForm.hasRecharged === "true",
      rechargeAmount: Number(editForm.rechargeAmount) || 0,
      dailyConsumption: Number(editForm.dailyConsumption) || 0,
      lastLogin: editForm.lastLogin || "-",
      lastContact: editForm.lastContact || "-",
      currentStage: editForm.currentStage || "",
      blockPoint: editForm.blockPoint || "",
      nextStep: editForm.nextStep || "",
      riskLevel: (editForm.riskLevel || "low") as "high" | "medium" | "low",
    });
    setEditingId(null);
    setEditForm({});
    toast.success("已保存");
  };

  // 风险Badge
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "high": return <Badge className="text-[10px] bg-red-100 text-red-700 border-0">高风险</Badge>;
      case "medium": return <Badge className="text-[10px] bg-yellow-100 text-yellow-700 border-0">中风险</Badge>;
      default: return <Badge className="text-[10px] bg-green-100 text-green-700 border-0">正常</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-teal-600" />
            工具落地 / 工作台
          </h2>
          <p className="text-sm text-slate-500 mt-1">最简客户跟踪表 &middot; 每日操作中央看板 &middot; 模块四</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleImportFromCustomers}>
            <Download className="w-4 h-4" /> 导入客户
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleAddRow}>
            <Plus className="w-4 h-4" /> 添加行
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <Input placeholder="搜索客户名..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 w-48 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部风险</SelectItem>
                  <SelectItem value="high">高风险</SelectItem>
                  <SelectItem value="medium">中风险</SelectItem>
                  <SelectItem value="low">正常</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-slate-500">{filteredData.length}/{workspaceTracker.length} 条记录</span>
          </div>
        </CardContent>
      </Card>

      {/* 数据表格 */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <ScrollArea className="h-[480px]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white">
              <TableRow>
                <TableHead className="text-xs font-semibold w-32">客户名</TableHead>
                <TableHead className="text-xs font-semibold w-20">类型</TableHead>
                <TableHead className="text-xs font-semibold w-20">开通</TableHead>
                <TableHead className="text-xs font-semibold w-14">充值</TableHead>
                <TableHead className="text-xs font-semibold w-16">充值金额</TableHead>
                <TableHead className="text-xs font-semibold w-16">日均消耗</TableHead>
                <TableHead className="text-xs font-semibold w-18">最后登录</TableHead>
                <TableHead className="text-xs font-semibold w-18">最后沟通</TableHead>
                <TableHead className="text-xs font-semibold w-20">当前阶段</TableHead>
                <TableHead className="text-xs font-semibold w-24">卡点</TableHead>
                <TableHead className="text-xs font-semibold w-24">下一步</TableHead>
                <TableHead className="text-xs font-semibold w-16">风险</TableHead>
                <TableHead className="text-xs font-semibold w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) =>
                editingId === row.id ? (
                  <TableRow key={row.id} className="bg-blue-50/50">
                    <TableCell><Input value={editForm.customerName || ""} onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })} className="h-7 text-xs" /></TableCell>
                    <TableCell><Input value={editForm.customerType || ""} onChange={(e) => setEditForm({ ...editForm, customerType: e.target.value })} className="h-7 text-xs" /></TableCell>
                    <TableCell><Input type="date" value={editForm.openDate || ""} onChange={(e) => setEditForm({ ...editForm, openDate: e.target.value })} className="h-7 text-xs" /></TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${editForm.hasRecharged === "true" ? "text-green-600" : "text-slate-400"}`}>
                        {editForm.hasRecharged === "true" ? "✓ 已充值" : "未充值"}
                      </span>
                      {(Number(editForm.rechargeAmount) > 0 || Number(editForm.dailyConsumption) > 0) && (
                        <span className="text-[9px] text-blue-500 ml-1">自动</span>
                      )}
                    </TableCell>
                    <TableCell><Input type="number" value={editForm.rechargeAmount || ""} onChange={(e) => handleConsumptionChange("rechargeAmount", e.target.value)} className="h-7 text-xs w-16" placeholder="0" /></TableCell>
                    <TableCell><Input type="number" value={editForm.dailyConsumption || ""} onChange={(e) => handleConsumptionChange("dailyConsumption", e.target.value)} className="h-7 text-xs w-16" placeholder="0" /></TableCell>
                    <TableCell><Input type="date" value={editForm.lastLogin || ""} onChange={(e) => setEditForm({ ...editForm, lastLogin: e.target.value })} className="h-7 text-xs w-28" /></TableCell>
                    <TableCell><Input type="date" value={editForm.lastContact || ""} onChange={(e) => setEditForm({ ...editForm, lastContact: e.target.value })} className="h-7 text-xs w-28" /></TableCell>
                    <TableCell>
                      <select className="h-7 text-xs border rounded px-1.5 w-24" value={editForm.currentStage || ""} onChange={(e) => setEditForm({ ...editForm, currentStage: e.target.value })}>
                        <option value="">选择</option>
                        {["试用中", "使用中", "充值后活跃", "即将流失", "已流失"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </TableCell>
                    <TableCell><Input value={editForm.blockPoint || ""} onChange={(e) => setEditForm({ ...editForm, blockPoint: e.target.value })} className="h-7 text-xs w-24" placeholder="卡点..." /></TableCell>
                    <TableCell><Input value={editForm.nextStep || ""} onChange={(e) => setEditForm({ ...editForm, nextStep: e.target.value })} className="h-7 text-xs w-24" placeholder="下一步..." /></TableCell>
                    <TableCell>
                      <select className="h-7 text-xs border rounded px-1.5 w-16" value={editForm.riskLevel || "low"} onChange={(e) => setEditForm({ ...editForm, riskLevel: e.target.value })}>
                        <option value="low">正常</option>
                        <option value="medium">中风险</option>
                        <option value="high">高风险</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600" onClick={saveEdit}><CheckCircle2 className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-400" onClick={() => setEditingId(null)}>取消</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={row.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-sm text-slate-800">{row.customerName || "-"}</TableCell>
                    <TableCell className="text-xs">{row.customerType || "-"}</TableCell>
                    <TableCell className="text-xs text-slate-500">{row.openDate}</TableCell>
                    <TableCell>{row.hasRecharged ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <span className="text-slate-300">-</span>}</TableCell>
                    <TableCell className={`text-xs font-medium ${row.rechargeAmount > 0 ? "text-green-700" : "text-slate-400"}`}>{row.rechargeAmount > 0 ? `¥${row.rechargeAmount}` : "-"}</TableCell>
                    <TableCell className="text-xs text-slate-500">{row.dailyConsumption > 0 ? `¥${row.dailyConsumption}` : "-"}</TableCell>
                    <TableCell className="text-xs">{row.lastLogin}</TableCell>
                    <TableCell className="text-xs">{row.lastContact}</TableCell>
                    <TableCell className="text-xs"><Badge variant="outline" className="text-[9px]">{row.currentStage || "-"}</Badge></TableCell>
                    <TableCell className="text-xs max-w-[100px] truncate">{row.blockPoint || "-"}</TableCell>
                    <TableCell className="text-xs max-w-[100px] truncate text-blue-600">{row.nextStep || "-"}</TableCell>
                    <TableCell>{getRiskBadge(row.riskLevel)}</TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <button onClick={() => startEdit(row.id)} className="p-1 hover:bg-slate-200 rounded"><Edit3 className="w-3.5 h-3.5 text-slate-400" /></button>
                        <button onClick={() => { deleteTrackerRow(row.id); toast.success("已删除"); }} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5 text-slate-400" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {workspaceTracker.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center space-y-3">
            <LayoutGrid className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm text-slate-500">工作台为空</p>
            <p className="text-xs text-slate-400">从客户列表导入或手动添加开始跟踪</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={handleImportFromCustomers}><Upload className="w-4 h-4 mr-1.5" />导入客户</Button>
              <Button size="sm" onClick={handleAddRow}><Plus className="w-4 h-4 mr-1.5" />添加行</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计概览 */}
      {workspaceTracker.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          <Card className="border-0 shadow-sm p-3 text-center"><p className="text-lg font-bold text-slate-800">{workspaceTracker.length}</p><p className="text-[10px] text-slate-500">总客户数</p></Card>
          <Card className="border-0 shadow-sm p-3 text-center"><p className="text-lg font-bold text-green-600">{workspaceTracker.filter((r) => r.hasRecharged).length}</p><p className="text-[10px] text-slate-500">已充值</p></Card>
          <Card className="border-0 shadow-sm p-3 text-center"><p className="text-lg font-bold text-orange-500">{workspaceTracker.filter((r) => r.riskLevel === "high").length}</p><p className="text-[10px] text-slate-500">高风险</p></Card>
          <Card className="border-0 shadow-sm p-3 text-center"><p className="text-lg font-bold text-blue-600">{workspaceTracker.filter((r) => r.nextStep).length}</p><p className="text-[10px] text-slate-500">有下一步</p></Card>
          <Card className="border-0 shadow-sm p-3 text-center"><p className="text-lg font-bold text-purple-600">{workspaceTracker.filter((r) => r.blockPoint).length}</p><p className="text-[10px] text-slate-500">有卡点</p></Card>
        </div>
      )}
    </div>
  );
}
