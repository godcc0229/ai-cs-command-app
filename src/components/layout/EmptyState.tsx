import { useStore } from "@/store/useStore";
import {
  LayoutDashboard,
  Layers,
  FileText,
  Library,
  KanbanSquare,
  ArrowRight,
} from "lucide-react";

const quickActions = [
  {
    icon: <LayoutDashboard className="w-5 h-5" />,
    label: "打开仪表盘",
    description: "查看客户总览与核心指标",
    moduleType: "dashboard" as const,
  },
  {
    icon: <Layers className="w-5 h-5" />,
    label: "场景筛选",
    description: "每日客户分级与TOP10优先级",
    moduleType: "scenario-filter" as const,
  },
  {
    icon: <FileText className="w-5 h-5" />,
    label: "交付设计",
    description: "创建和管理交付方案",
    moduleType: "delivery-design" as const,
  },
  {
    icon: <Library className="w-5 h-5" />,
    label: "知识库",
    description: "Karpathy Wiki 企业知识库",
    moduleType: "knowledge-base" as const,
  },
  {
    icon: <KanbanSquare className="w-5 h-5" />,
    label: "任务卡",
    description: "批次任务管理与跨团队协同",
    moduleType: "task-card" as const,
  },
];

export function EmptyState() {
  const openPanel = useStore((s) => s.openPanel);

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="text-center max-w-2xl">
        {/* 欢迎区 */}
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">CS</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            欢迎使用 AI CS 指挥台
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            多模块并行工作台，支持客户分层、交付设计、知识库管理和任务协同。
            点击下方模块开始工作，所有模块可同时运行、互不干扰。
          </p>
        </div>

        {/* 快速入口 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.moduleType}
              onClick={() => openPanel(action.moduleType, action.label)}
              className="group flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors flex-shrink-0">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 text-sm flex items-center gap-1">
                  {action.label}
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* 特性提示 */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            多面板并行
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            数据自动同步
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Wiki 知识库
          </span>
        </div>
      </div>
    </div>
  );
}
