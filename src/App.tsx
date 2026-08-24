import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Workspace } from "@/components/layout/Workspace";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/store/useStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

function App() {
  const theme = useStore((s) => s.systemSettings.theme);

  // 注册全局键盘快捷键
  useKeyboardShortcuts();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-slate-900">
      {/* 左侧导航栏 */}
      <Sidebar />

      {/* 主工作区 */}
      <Workspace />

      {/* Toast 通知 */}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default App;
