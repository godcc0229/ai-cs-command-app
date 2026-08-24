import { useEffect, useCallback } from "react";
import { useStore } from "@/store/useStore";
import type { ModuleType } from "@/types";

// 模块类型到快捷键映射
const moduleKeyMap: Record<string, ModuleType> = {
  "1": "dashboard",
  "2": "scenario-filter",
  "3": "value-delivery",
  "4": "delivery-design",
  "5": "value-validation",
  "6": "customer-care",
  "7": "report-output",
  "8": "workspace-tracker",
  "9": "team-coordination",
  "0": "knowledge-base",
  "-": "task-card",
};

const moduleLabels: Record<string, string> = {
  dashboard: "首页仪表盘",
  "scenario-filter": "场景筛选",
  "value-delivery": "价值传递",
  "delivery-design": "交付设计",
  "value-validation": "价值验证",
  "customer-care": "客情关怀",
  "report-output": "汇报输出",
  "workspace-tracker": "工作台",
  "team-coordination": "组织协同",
  knowledgeBase: "知识库",
  taskCard: "任务卡",
  "task-card": "任务卡",
  settings: "系统设置",
};

export function useKeyboardShortcuts() {
  const openPanel = useStore((s) => s.openPanel);
  const closePanel = useStore((s) => s.closePanel);
  const panels = useStore((s) => s.panels);
  const activePanelId = useStore((s) => s.activePanelId);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K: 快速打开面板搜索（预留）
      if (modKey && e.key === "k") {
        e.preventDefault();
        // TODO: 实现命令面板
        return;
      }

      // Cmd/Ctrl + W: 关闭当前面板
      if (modKey && e.key === "w") {
        e.preventDefault();
        if (activePanelId && panels.length > 0) {
          const idx = panels.findIndex((p) => p.id === activePanelId);
          if (panels.length > 1) {
            const nextIdx = idx > 0 ? idx - 1 : Math.min(idx + 1, panels.length - 1);
            useStore.getState().setActivePanel(panels[nextIdx].id);
          }
          closePanel(activePanelId);
        }
        return;
      }

      // 数字键 1-9, 0, -: 快速打开/切换模块
      if (!modKey && moduleKeyMap[e.key]) {
        e.preventDefault();
        const moduleType = moduleKeyMap[e.key];
        openPanel(moduleType, moduleLabels[moduleType] || moduleType);
        return;
      }

      // Escape: 无操作（可扩展为关闭弹窗等）
    },
    [openPanel, closePanel, panels, activePanelId]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
