import { useStore } from "@/store/useStore";
import { HomeDashboard } from "@/components/dashboard/HomeDashboard";
import { ScenarioFilterModule } from "@/components/scenario-filter/ScenarioFilterModule";
import { ValueDeliveryModule } from "@/components/value-delivery/ValueDeliveryModule";
import { DeliveryDesignModule } from "@/components/delivery-design/DeliveryDesignModule";
import { ValueValidationModule } from "@/components/value-validation/ValueValidationModule";
import { CustomerCareModule } from "@/components/customer-care/CustomerCareModule";
import { ReportOutputModule } from "@/components/report-output/ReportOutputModule";
import { WorkspaceTrackerModule } from "@/components/workspace-tracker/WorkspaceTrackerModule";
import { TeamCoordinationModule } from "@/components/team-coordination/TeamCoordinationModule";
import { KnowledgeBaseModule } from "@/components/knowledge-base/KnowledgeBaseModule";
import { TaskCardModule } from "@/components/task-card/TaskCardModule";
import { SettingsModule } from "@/components/settings/SettingsModule";
import { EmptyState } from "@/components/layout/EmptyState";
import { X } from "lucide-react";

const moduleComponents: Record<string, React.ComponentType> = {
  dashboard: HomeDashboard,
  "scenario-filter": ScenarioFilterModule,
  "value-delivery": ValueDeliveryModule,
  "delivery-design": DeliveryDesignModule,
  "value-validation": ValueValidationModule,
  "customer-care": CustomerCareModule,
  "report-output": ReportOutputModule,
  "workspace-tracker": WorkspaceTrackerModule,
  "team-coordination": TeamCoordinationModule,
  "knowledge-base": KnowledgeBaseModule,
  "task-card": TaskCardModule,
  settings: SettingsModule,
};

export function Workspace() {
  const { panels, activePanelId, closePanel, setActivePanel } = useStore();

  // 关闭面板：如果关闭的是当前激活的面板，自动切换到相邻面板
  const handleClosePanel = (panelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (panels.length <= 1) {
      closePanel(panelId);
      return;
    }
    const idx = panels.findIndex((p) => p.id === panelId);
    if (panelId === activePanelId) {
      const nextIdx = idx > 0 ? idx - 1 : Math.min(idx + 1, panels.length - 1);
      setActivePanel(panels[nextIdx].id);
    }
    closePanel(panelId);
  };

  // 鼠标中键关闭
  const handleMiddleClick = (panelId: string, e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      handleClosePanel(panelId, e);
    }
  };

  if (panels.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* 面板标签栏 */}
      <div className="flex items-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-1 overflow-x-auto">
        {panels.map((panel) => {
          const isActive = panel.id === activePanelId;
          return (
            <button
              key={panel.id}
              className={`group flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300"
              }`}
              onClick={() => setActivePanel(panel.id)}
              onMouseUp={(e) => handleMiddleClick(panel.id, e)}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
              />
              {panel.title}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => handleClosePanel(panel.id, e)}
                className={`ml-0.5 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors ${
                  isActive ? "opacity-70 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                title="关闭面板"
              >
                <X className="w-3 h-3 text-slate-400 group-hover:text-red-500" />
              </span>
            </button>
          );
        })}
      </div>

      {/* 面板内容区 */}
      <div className="flex-1 overflow-hidden relative">
        {panels.map((panel) => {
          const Component = moduleComponents[panel.moduleType];
          const isActive = panel.id === activePanelId;
          return (
            <div
              key={panel.id}
              className="absolute inset-0 overflow-auto"
              style={{ display: isActive ? "block" : "none" }}
            >
              {Component ? <Component /> : <div>未知模块: {panel.moduleType}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
