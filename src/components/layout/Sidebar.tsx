import { useState } from "react";
import { useStore } from "@/store/useStore";
import type { ModuleType } from "@/types";
import {
  LayoutDashboard,
  Filter,
  MessageSquare,
  FileText,
  BarChart3,
  Heart,
  FileOutput,
  LayoutGrid,
  Users,
  Library,
  KanbanSquare,
  Settings,
  X,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const moduleConfig: {
  type: ModuleType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  // 核心模块
  {
    type: "dashboard",
    label: "首页仪表盘",
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: "总览客户数据与核心指标",
  },
  // CS动作清单模块（按PDF顺序）
  {
    type: "scenario-filter",
    label: "场景筛选",
    icon: <Filter className="w-4 h-4" />,
    description: "每日A-E分层+TOP10优先级（模块二）",
  },
  {
    type: "value-delivery",
    label: "价值传递",
    icon: <MessageSquare className="w-4 h-4" />,
    description: "流程重构·激活/跟随/复购/客情（模块三）",
  },
  {
    type: "delivery-design",
    label: "交付设计",
    icon: <FileText className="w-4 h-4" />,
    description: "AI生成3条客户路径（模块五）",
  },
  {
    type: "value-validation",
    label: "价值验证",
    icon: <BarChart3 className="w-4 h-4" />,
    description: "每天盯1个数·转化率分析（模块七）",
  },
  {
    type: "customer-care",
    label: "客情关怀",
    icon: <Heart className="w-4 h-4" />,
    description: "VIP关怀消息批量生成",
  },
  {
    type: "report-output",
    label: "汇报输出",
    icon: <FileOutput className="w-4 h-4" />,
    description: "日报(3数)+15天冲刺计划（模块八）",
  },
  // 工具与协同
  {
    type: "workspace-tracker",
    label: "工作台",
    icon: <LayoutGrid className="w-4 h-4" />,
    description: "最简客户跟踪表（模块四）",
  },
  {
    type: "team-coordination",
    label: "组织协同",
    icon: <Users className="w-4 h-4" />,
    description: "跨角色AI任务调度（模块六）",
  },
  // 基础能力
  {
    type: "knowledge-base",
    label: "知识库",
    icon: <Library className="w-4 h-4" />,
    description: "Karpathy Wiki 知识库 + AI问答",
  },
  {
    type: "task-card",
    label: "任务卡",
    icon: <KanbanSquare className="w-4 h-4" />,
    description: "批次任务管理与协同看板",
  },
];

export function Sidebar() {
  const { panels, activePanelId, openPanel, setActivePanel, closePanel } =
    useStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-700 transition-all duration-300",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              CS
            </div>
            <span className="font-semibold text-sm">AI CS 指挥台</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <GripVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* 模块启动区 */}
      <div className="p-2 border-b border-slate-700">
        {!collapsed && (
          <div className="text-xs text-slate-400 px-2 py-1 font-medium uppercase tracking-wider">
            功能模块 ({moduleConfig.length})
          </div>
        )}
        <div className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
          {moduleConfig.map((mod) => (
            <Tooltip key={mod.type}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 h-9 text-slate-300 hover:text-slate-100 hover:bg-slate-800",
                    collapsed && "w-9 h-9 justify-center p-0"
                  )}
                  onClick={() => openPanel(mod.type, mod.label)}
                >
                  {mod.icon}
                  {!collapsed && (
                    <>
                      <span className="text-sm truncate">{mod.label}</span>
                      {(mod.type === "scenario-filter" || mod.type === "value-delivery") && (
                        <Badge variant="secondary" className="ml-auto text-[8px] px-1 h-4 scale-90">NEW</Badge>
                      )}
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p>{mod.label}</p>
                  <p className="text-xs text-slate-400">{mod.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>
      </div>

      {/* 已打开面板 */}
      <div className="flex-1 overflow-hidden">
        {!collapsed && panels.length > 0 && (
          <div className="text-xs text-slate-400 px-3 py-2 font-medium uppercase tracking-wider">
            已打开面板 ({panels.length})
          </div>
        )}
        <ScrollArea className="h-full">
          <div className={cn("space-y-0.5 p-1", collapsed && "flex flex-col items-center")}>
            {panels.map((panel) => (
              <Tooltip key={panel.id}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors group",
                      activePanelId === panel.id
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                      collapsed && "w-9 h-9 justify-center p-0"
                    )}
                    onClick={() => setActivePanel(panel.id)}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        activePanelId === panel.id
                          ? "bg-blue-400"
                          : "bg-slate-600"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate text-left">
                          {panel.title}
                        </span>
                        <X
                          className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-red-400 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            closePanel(panel.id);
                          }}
                        />
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    <p>{panel.title}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 底部状态 + 设置按钮 */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-700 text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-between">
            <span>面板数: {panels.length}</span>
            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
              工作中
            </Badge>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            onClick={() => openPanel("settings", "系统设置")}
          >
            <Settings className="w-4 h-4" />
            <span>系统设置</span>
          </Button>
        </div>
      )}
      {collapsed && (
        <div className="p-2 border-t border-slate-700 flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                onClick={() => openPanel("settings", "系统设置")}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>系统设置</p></TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
