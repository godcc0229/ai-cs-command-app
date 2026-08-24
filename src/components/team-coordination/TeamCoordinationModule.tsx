import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Loader2,
  Sparkles,
  Clock,
  UserCheck,
  Briefcase,
  GraduationCap,
  Cpu,
  ArrowRight,
  Copy,
  Filter,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { CoordinatedTask, CoordRole } from "@/types";
import { DEFAULT_COORD_LINES } from "@/types";
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

const ROLE_CONFIG: Record<CoordRole, { label: string; icon: React.ReactNode; color: string }> = {
  FDE: { label: "FDE", icon: <UserCheck className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700 border-blue-200" },
  BD: { label: "BD", icon: <Briefcase className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-700 border-green-200" },
  内容: { label: "内容", icon: <GraduationCap className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-700 border-purple-200" },
  技术: { label: "技术", icon: <Cpu className="w-3.5 h-3.5" />, color: "bg-orange-100 text-orange-700 border-orange-200" },
};

const URGENCY_CONFIG = {
  "紧急": { color: "text-white bg-red-500 border-red-600", dot: "bg-red-400" },
  "高": { color: "text-red-700 bg-red-100 border-red-200", dot: "bg-red-400" },
  "中": { color: "text-yellow-700 bg-yellow-100 border-yellow-200", dot: "bg-yellow-400" },
  "低": { color: "text-slate-700 bg-slate-100 border-slate-200", dot: "bg-slate-300" },
};

export function TeamCoordinationModule() {
  const { callLLM, updateCoordinatedTask, batchAddCoordinatedTasks, coordinatedTasks, deleteCoordinatedTask } = useStore();
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // AI生成任务卡
  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error("请输入客户问题描述");
      return;
    }

    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) {
      toast.error("请先配置并激活 LLM");
      return;
    }

    setLoading(true);
    try {
      // 先按协同线规则分配
      const lines = inputText.trim().split("\n").filter((l) => l.trim());
      const prompt = `以下是${lines.length}个客户的问题，请为每个问题生成一个任务卡。

协同分配规则：
- 不会用/Demo → 分给 FDE
- 素材/教程 → 分给 内容
- 报错/Bug/接口 → 分给 技术
- 续费/加购/转介绍 → 分给 BD

客户问题列表：
${lines.map((l, i) => `${i + 1}. ${l}`).join("\n")}

输出JSON数组，每个元素包含：
{"taskName":"任务名称(简短)","customerName":"从问题描述中提取的客户名","problem":"原问题描述","priority":"紧急|高|中|低","deadline":"建议截止时间(YYYY-MM-DD格式)","acceptanceCriteria":"验收标准(一句话)","assignedTo":"FDE|BD|教练|技术"}`;

      const systemPrompt = "你是CS团队协作调度专家。根据客户问题自动生成跨角色任务卡。严格JSON数组格式。";

      const result = await callLLM(prompt, systemPrompt);
      if (!result.success) { toast.error(result.error || "失败"); return; }

      let parsed: Record<string, unknown>[];
      try {
        const jsonMatch = result.content.match(/\[[\s\S]*\]/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch { toast.error("解析失败"); return; }

      const newTasks: CoordinatedTask[] = parsed.map((item, idx) => ({
        id: `coord-${Date.now()}-${idx}`,
        taskName: item.taskName as string || `任务${idx + 1}`,
        customerName: item.customerName as string || "",
        problem: item.problem as string,
        priority: (item.priority || "中") as CoordinatedTask["priority"],
        deadline: (item.deadline as string) || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        acceptanceCriteria: item.acceptanceCriteria as string || "",
        assignedTo: (item.assignedTo || "FDE") as CoordRole,
        status: "pending",
        createdAt: new Date().toISOString(),
      }));

      batchAddCoordinatedTasks(newTasks);
      toast.success(`生成了 ${newTasks.length} 个协同任务`);
    } finally { setLoading(false); }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteCoordinatedTask(deleteTarget);
      toast.success("任务已删除");
      setDeleteTarget(null);
    }
  };

  // 过滤
  const filteredTasks = coordinatedTasks.filter((t) => {
    const matchRole = roleFilter === "all" || t.assignedTo === roleFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchRole && matchStatus;
  });

  // 按状态分组看板
  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in_progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");

  const KanbanColumn = ({ title, tasks, statusColor, emptyMsg }: { title: string; tasks: typeof pendingTasks; statusColor: string; emptyMsg: string }) => (
    <div className="flex-1 min-w-[260px]">
      <div className={`flex items-center justify-between p-2 rounded-t-lg ${statusColor}`}>
        <span className="text-xs font-semibold">{title}</span>
        <Badge variant="secondary" className="text-[10px]">{tasks.length}</Badge>
      </div>
      <div className="border border-t-0 rounded-b-lg bg-slate-50 p-2 min-h-[320px]">
        <ScrollArea className="h-[310px]">
          <div className="space-y-2 pr-1">
            {tasks.map((task) => {
              const rc = ROLE_CONFIG[task.assignedTo];
              const uc = URGENCY_CONFIG[task.priority];
              return (
                <Card key={task.id} className={`border shadow-sm hover:shadow transition-shadow cursor-pointer relative group ${task.isSample ? "opacity-50" : ""}`}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">{task.taskName}</span>
                        {task.isSample && <Badge variant="secondary" className="text-[9px] shrink-0">演示</Badge>}
                      </div>
                      <Badge className={`text-[9px] ${uc.color} border`}>{task.priority}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">客户: {task.customerName}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{task.problem}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge className={`text-[9px] ${rc.color} border`}>{rc.icon} {rc.label}</Badge>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />{task.deadline}
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-600">验收: {task.acceptanceCriteria}</p>
                    {/* 操作按钮 */}
                    <div className="flex gap-1 pt-1 border-t border-slate-100 mt-1">
                      {task.status !== "completed" && (
                        <>
                          <button onClick={() => updateCoordinatedTask(task.id, { status: "in_progress" })} className="flex-1 py-1 text-[10px] bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded">开始</button>
                          <button onClick={() => updateCoordinatedTask(task.id, { status: "completed" })} className="flex-1 py-1 text-[10px] bg-green-50 text-green-700 hover:bg-green-100 rounded">完成</button>
                        </>
                      )}
                      <button onClick={() => navigator.clipboard.writeText(`${task.taskName}\n客户: ${task.customerName}\n问题: ${task.problem}\n负责人: ${ROLE_CONFIG[task.assignedTo].label}\n截止: ${task.deadline}`)} className="px-1"><Copy className="w-3.5 h-3.5 text-slate-400" /></button>
                      <button
                        onClick={() => setDeleteTarget(task.id)}
                        className="px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除任务"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {tasks.length === 0 && <p className="text-xs text-slate-400 text-center py-6">{emptyMsg}</p>}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 标题 */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-600" />
          组织协同 / 任务调度
        </h2>
        <p className="text-sm text-slate-500 mt-1">AI 跨角色任务调度 &middot; 模块六 &middot; 别在群里喊，用 AI 生任务卡</p>
      </div>

      {/* 协同线对照表 + 输入区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 协同线说明 */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-cyan-600" /> 4条协同线
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(DEFAULT_COORD_LINES || [
                { clientIssue: "不会用/要Demo", assignTo: "FDE" as CoordRole },
                { clientIssue: "素材不行/要教程", assignTo: "教练" as CoordRole },
                { clientIssue: "接口报错/Bug", assignTo: "技术" as CoordRole },
                { clientIssue: "续费/加购/转介绍", assignTo: "BD" as CoordRole },
              ]).map((line, idx) => {
                const rc = ROLE_CONFIG[line.assignTo];
                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-700">{line.clientIssue}</span>
                    <Badge className={`text-[9px] ${rc.color} border`}>{rc.icon} {rc.label}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 输入区 */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">输入客户问题（每行一个）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder={`示例：\n张总不会用画布功能\n李总需要更多素材模板\n王总的接口一直报错\n赵总要续费了\n刘总想了解转介绍的方案`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              className="resize-none text-sm font-mono"
            />
            <Button onClick={handleGenerate} disabled={loading || !inputText.trim()} className="w-full gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />AI 生成任务卡...</> : <><Sparkles className="w-4 h-4" />AI 生成协同任务卡</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              <SelectItem value="FDE">FDE</SelectItem>
              <SelectItem value="BD">BD</SelectItem>
              <SelectItem value="内容">内容</SelectItem>
              <SelectItem value="技术">技术</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="in_progress">进行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-slate-500">{filteredTasks.length}/{coordinatedTasks.length} 个任务</span>
      </div>

      {/* 三栏看板 */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <KanbanColumn title="待处理" tasks={pendingTasks} statusColor="bg-slate-200" emptyMsg="暂无待处理任务" />
        <KanbanColumn title="进行中" tasks={inProgressTasks} statusColor="bg-blue-200" emptyMsg="暂无进行中的任务" />
        <KanbanColumn title="已完成" tasks={completedTasks} statusColor="bg-emerald-200" emptyMsg="暂无已完成的任务" />
      </div>

      {coordinatedTasks.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center space-y-3">
            <Send className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm text-slate-500">暂无协同任务</p>
            <p className="text-xs text-slate-400">输入客户问题开始生成任务卡</p>
          </CardContent>
        </Card>
      )}
      {/* 删除确认弹窗 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除该协同任务吗？此操作不可撤销。</AlertDialogDescription>
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
