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
  KanbanSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Timer,
  Users,
  Hash,
  Building2,
  ArrowRight,
  Send,
  Trash2,
  ListChecks,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import type { TaskCard, CollaboratorRole, UrgencyLevel } from "@/types";

const roleLabels: Record<CollaboratorRole, string> = {
  商务: "商务",
  运营: "运营",
  内容: "内容",
  FDE: "FDE",
};

const roleColors: Record<CollaboratorRole, string> = {
  商务: "bg-blue-100 text-blue-700 border-blue-300",
  运营: "bg-emerald-100 text-emerald-700 border-emerald-300",
  内容: "bg-purple-100 text-purple-700 border-purple-300",
  FDE: "bg-orange-100 text-orange-700 border-orange-300",
};

const urgencyConfig: Record<
  UrgencyLevel,
  { color: string; icon: React.ReactNode; label: string }
> = {
  紧急: {
    color: "bg-red-100 text-red-700 border-red-300",
    icon: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
    label: "紧急",
  },
  高: {
    color: "bg-orange-100 text-orange-700 border-orange-300",
    icon: <Timer className="w-3.5 h-3.5 text-orange-500" />,
    label: "高",
  },
  中: {
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
    label: "中",
  },
  低: {
    color: "bg-green-100 text-green-700 border-green-300",
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
    label: "低",
  },
};

const statusConfig = {
  pending: { label: "待处理", color: "bg-slate-100 text-slate-700" },
  in_progress: { label: "进行中", color: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", color: "bg-emerald-100 text-emerald-700" },
};

interface BatchInput {
  customerName: string;
  customerProblem: string;
  requiredRoles: CollaboratorRole[];
  urgency: UrgencyLevel;
  deadline: string;
}

export function TaskCardModule() {
  const { tasks, batches, generateTasksFromBatch, updateTask, deleteTask, deleteTaskBatch } = useStore();
  const [activeTab, setActiveTab] = useState("board");

  // 删除确认状态
  const [deleteTarget, setDeleteTarget] = useState<{ type: "task" | "batch"; id: string; name: string } | null>(null);

  // 批次输入
  const [batchName, setBatchName] = useState("");
  const [batchInputs, setBatchInputs] = useState<BatchInput[]>([
    {
      customerName: "",
      customerProblem: "",
      requiredRoles: [],
      urgency: "中",
      deadline: "",
    },
  ]);

  const addBatchRow = () => {
    setBatchInputs([
      ...batchInputs,
      {
        customerName: "",
        customerProblem: "",
        requiredRoles: [],
        urgency: "中",
        deadline: "",
      },
    ]);
  };

  const removeBatchRow = (index: number) => {
    if (batchInputs.length <= 1) return;
    setBatchInputs(batchInputs.filter((_, i) => i !== index));
  };

  const updateBatchRow = (index: number, updates: Partial<BatchInput>) => {
    setBatchInputs(
      batchInputs.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const toggleRole = (index: number, role: CollaboratorRole) => {
    const current = batchInputs[index].requiredRoles;
    updateBatchRow(index, {
      requiredRoles: current.includes(role)
        ? current.filter((r) => r !== role)
        : [...current, role],
    });
  };

  const handleGenerateTasks = () => {
    // 验证
    const validInputs = batchInputs.filter(
      (input) =>
        input.customerName.trim() &&
        input.customerProblem.trim() &&
        input.requiredRoles.length > 0 &&
        input.deadline
    );

    if (validInputs.length === 0) {
      toast.error("请至少填写一条完整的任务信息");
      return;
    }

    if (!batchName.trim()) {
      toast.error("请填写批次名称");
      return;
    }

    generateTasksFromBatch(batchName.trim(), validInputs);
    setBatchName("");
    setBatchInputs([
      {
        customerName: "",
        customerProblem: "",
        requiredRoles: [],
        urgency: "中",
        deadline: "",
      },
    ]);
    setActiveTab("board");
    toast.success(`批次"${batchName}"已生成 ${validInputs.length} 张任务卡`);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskCard["status"]) => {
    updateTask(taskId, { status: newStatus });
    toast.success(`任务状态已更新为：${statusConfig[newStatus].label}`);
  };

  // 按状态分组
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const getTaskUrgencyOrder = (urgency: UrgencyLevel): number => {
    const order = { 紧急: 0, 高: 1, 中: 2, 低: 3 };
    return order[urgency];
  };

  const renderTaskCard = (task: TaskCard) => {
    const urgency = urgencyConfig[task.urgency];
    const isOverdue =
      task.status !== "completed" && new Date(task.deadline) < new Date();

    return (
      <div key={task.id} className={`group relative ${task.isSample ? "opacity-50 pointer-events-none" : ""}`}>
        {/* 演示标记 */}
        {task.isSample && (
          <Badge className="absolute -top-2 -right-2 z-10 text-[9px] bg-slate-400 text-white px-1.5 py-0">
            演示
          </Badge>
        )}
        <Card
          className={`border-0 shadow-sm hover:shadow-md transition-all ${
            isOverdue ? "ring-2 ring-red-300" : ""
          }`}
        >
        <CardContent className="p-4 space-y-3">
          {/* 序号和紧急程度 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                #{task.sequenceNumber}
              </span>
              {isOverdue && (
                <Badge className="text-[10px] bg-red-500 text-white gap-1">
                  <AlertCircle className="w-3 h-3" />
                  已逾期
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`text-[10px] border ${urgency.color} flex items-center gap-1`}
              >
                {urgency.icon}
                {urgency.label}
              </Badge>
              {/* 删除按钮 - hover 显示，演示数据不显示 */}
              {!task.isSample && (
                <button
                  onClick={() => setDeleteTarget({ type: "task", id: task.id, name: `#${task.sequenceNumber} ${task.customerName}` })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 客户名称 */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-800 truncate">
              {task.customerName}
            </span>
          </div>

          {/* 客户问题 */}
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded">
            {task.customerProblem}
          </p>

          {/* 协同岗位 */}
          <div className="flex flex-wrap gap-1">
            {task.requiredRoles.map((role) => (
              <span
                key={role}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${roleColors[role]}`}
              >
                {roleLabels[role]}
              </span>
            ))}
          </div>

          {/* 限时完成时间 */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-slate-500">
              <Timer className="w-3.5 h-3.5" />
              <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                限时：{task.deadline}
              </span>
            </div>
            <Badge
              className={`text-[10px] ${
                statusConfig[task.status].color
              }`}
            >
              {statusConfig[task.status].label}
            </Badge>
          </div>

          {/* 操作按钮 */}
          {!task.isSample && task.status !== "completed" && (
            <div className="flex gap-1 pt-1 border-t border-slate-100">
              {task.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex-1 gap-1"
                  onClick={() => handleStatusChange(task.id, "in_progress")}
                >
                  <ArrowRight className="w-3 h-3" />
                  开始处理
                </Button>
              )}
              {task.status === "in_progress" && (
                <Button
                  size="sm"
                  className="h-7 text-xs flex-1 gap-1 bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => handleStatusChange(task.id, "completed")}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  标记完成
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">任务卡</h2>
          <p className="text-sm text-slate-500 mt-1">
            批次生成 · 跨团队协同 ·{" "}
            {tasks.filter((t) => t.status !== "completed").length} 项进行中
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="board" className="gap-2">
            <KanbanSquare className="w-4 h-4" />
            任务看板 ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2">
            <Plus className="w-4 h-4" />
            批次生成
          </TabsTrigger>
          <TabsTrigger value="batches" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            历史批次 ({batches.length})
          </TabsTrigger>
        </TabsList>

        {/* 任务看板 - 三栏 */}
        <TabsContent value="board">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 待处理 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">
                  待处理 ({pendingTasks.length})
                </h3>
              </div>
              <ScrollArea className="h-[550px]">
                <div className="space-y-3 pr-2">
                  {pendingTasks
                    .sort(
                      (a, b) =>
                        getTaskUrgencyOrder(a.urgency) -
                        getTaskUrgencyOrder(b.urgency)
                    )
                    .map(renderTaskCard)}
                </div>
              </ScrollArea>
            </div>

            {/* 进行中 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <h3 className="text-sm font-semibold text-slate-700">
                  进行中 ({inProgressTasks.length})
                </h3>
              </div>
              <ScrollArea className="h-[550px]">
                <div className="space-y-3 pr-2">
                  {inProgressTasks
                    .sort(
                      (a, b) =>
                        getTaskUrgencyOrder(a.urgency) -
                        getTaskUrgencyOrder(b.urgency)
                    )
                    .map(renderTaskCard)}
                </div>
              </ScrollArea>
            </div>

            {/* 已完成 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-700">
                  已完成 ({completedTasks.length})
                </h3>
              </div>
              <ScrollArea className="h-[550px]">
                <div className="space-y-3 pr-2">
                  {completedTasks.map(renderTaskCard)}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        {/* 批次生成 */}
        <TabsContent value="create">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                批次生成任务卡
              </CardTitle>
              <p className="text-xs text-slate-500">
                批量输入客户问题及所需协同岗位，系统为每个客户生成专属任务卡。
                协同岗位：商务 · 运营 · 内容 · FDE
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 批次名称 */}
              <div className="flex items-center gap-3">
                <Label className="text-sm flex-shrink-0">批次名称</Label>
                <Input
                  placeholder="如：2026年7月第3周客户需求批次"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* 输入行 */}
              <div className="space-y-3">
                {batchInputs.map((input, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5" />
                        任务 #{index + 1}
                      </span>
                      {batchInputs.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-red-500"
                          onClick={() => removeBatchRow(index)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">客户名称 *</Label>
                        <Input
                          placeholder="企业名称"
                          value={input.customerName}
                          onChange={(e) =>
                            updateBatchRow(index, {
                              customerName: e.target.value,
                            })
                          }
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">紧急程度</Label>
                        <Select
                          value={input.urgency}
                          onValueChange={(v) =>
                            updateBatchRow(index, {
                              urgency: v as UrgencyLevel,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="紧急">🔴 紧急</SelectItem>
                            <SelectItem value="高">🟠 高</SelectItem>
                            <SelectItem value="中">🟡 中</SelectItem>
                            <SelectItem value="低">🟢 低</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">客户问题 *</Label>
                      <Textarea
                        placeholder="描述客户的具体需求和问题..."
                        value={input.customerProblem}
                        onChange={(e) =>
                          updateBatchRow(index, {
                            customerProblem: e.target.value,
                          })
                        }
                        rows={2}
                        className="mt-1 resize-none text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">
                          需协同岗位 *（可多选）
                        </Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(
                            ["商务", "运营", "内容", "FDE"] as CollaboratorRole[]
                          ).map((role) => (
                            <button
                              key={role}
                              onClick={() => toggleRole(index, role)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                                input.requiredRoles.includes(role)
                                  ? roleColors[role]
                                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                              }`}
                            >
                              <Users className="w-3 h-3" />
                              {roleLabels[role]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">限时完成时间 *</Label>
                        <Input
                          type="date"
                          value={input.deadline}
                          onChange={(e) =>
                            updateBatchRow(index, {
                              deadline: e.target.value,
                            })
                          }
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 操作栏 */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBatchRow}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  添加一行
                </Button>
                <Button
                  onClick={handleGenerateTasks}
                  className="gap-2"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                  生成 {batchInputs.filter((i) => i.customerName.trim()).length} 张任务卡
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 历史批次 */}
        <TabsContent value="batches">
          <div className="space-y-4">
            {batches.map((batch) => {
              const batchTasks = tasks.filter((t) => t.batchId === batch.id);
              const completed = batchTasks.filter(
                (t) => t.status === "completed"
              ).length;
              return (
                <Card
                  key={batch.id}
                  className={`border-0 shadow-sm hover:shadow-md transition-shadow ${batch.isSample ? "opacity-50" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {batch.isSample && (
                          <Badge className="text-[9px] bg-slate-400 text-white px-1.5 py-0">演示</Badge>
                        )}
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-blue-500" />
                          {batch.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px]" variant="secondary">
                          共 {batchTasks.length} 张任务卡
                        </Badge>
                        {!batch.isSample && (
                          <button
                            onClick={() => setDeleteTarget({ type: "batch", id: batch.id, name: batch.name })}
                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      创建于{" "}
                      {new Date(batch.createdAt).toLocaleString("zh-CN")}
                      {" · "}
                      完成 {completed}/{batchTasks.length}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {batchTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 p-2 bg-slate-50 rounded text-xs"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              task.status === "completed"
                                ? "bg-emerald-400"
                                : task.status === "in_progress"
                                ? "bg-blue-400"
                                : "bg-slate-400"
                            }`}
                          />
                          <span className="font-medium truncate">
                            #{task.sequenceNumber} {task.customerName}
                          </span>
                          <span className="text-slate-400 ml-auto flex-shrink-0">
                            {task.deadline}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {batches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <ClipboardList className="w-10 h-10 mb-3" />
                <p className="text-sm">暂无历史批次</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 删除确认弹窗 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "task"
                ? `确定要删除任务「${deleteTarget.name}」吗？此操作不可撤销。`
                : deleteTarget
                ? `确定要删除批次「${deleteTarget.name}」及其所有关联任务吗？此操作不可撤销。`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (deleteTarget) {
                  if (deleteTarget.type === "task") {
                    deleteTask(deleteTarget.id);
                    toast.success("任务已删除");
                  } else {
                    deleteTaskBatch(deleteTarget.id);
                    toast.success("批次及其关联任务已删除");
                  }
                  setDeleteTarget(null);
                }
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
