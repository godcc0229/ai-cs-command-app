import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Search,
  Plus,
  BookOpen,
  FileText,
  MessageSquare,
  Clock,
  Database,
  Layers,
  Sparkles,
  Tag,
  Building2,
  User,
  Briefcase,
  DollarSign,
  Send,
  Bot,
  Loader2,
  Trash2,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import type {
  CustomerKBEntry,
  WikiArticle,
  RawDocument,
  ChatMessage,
} from "@/types";

export function KnowledgeBaseModule() {
  const {
    kbEntries,
    wikiArticles,
    rawDocuments,
    addKBEntry,
    updateKBEntry,
    deleteKBEntry,
    deleteWikiArticle,
    deleteRawDocument,
    addWikiArticle,
    addRawDocument,
    addMessageToKB,
    callLLM,
  } = useStore();

  const [activeTab, setActiveTab] = useState("wiki");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    entries: CustomerKBEntry[];
    articles: WikiArticle[];
  }>({ entries: [], articles: [] });

  // AI 问答
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // 编辑模式
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'wiki' | 'raw' | 'kb';
    id: string;
    name: string;
  } | null>(null);

  // 导入聊天记录
  const [chatImportText, setChatImportText] = useState("");
  const [chatImportTargetId, setChatImportTargetId] = useState<string>("");
  const [chatImportLoading, setChatImportLoading] = useState(false);

  // 文件上传
  const [uploadProgress, setUploadProgress] = useState(0);

  // 新建知识库条目
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    companyName: "",
    contactName: "",
    contactPosition: "",
    industry: "",
    hasRecharge: false,
    rechargeTime: "",
    consumption: 0,
    tags: "",
  });

  // 新建消息
  const [selectedEntryForMsg, setSelectedEntryForMsg] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");

  // 新建 Wiki 文章
  const [showWikiForm, setShowWikiForm] = useState(false);
  const [newWiki, setNewWiki] = useState({
    title: "",
    content: "",
    tags: "",
  });

  // 搜索功能
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults({ entries: [], articles: [] });
      return;
    }
    const q = searchQuery.toLowerCase();
    const matchedEntries = kbEntries.filter(
      (e) =>
        e.companyName.toLowerCase().includes(q) ||
        e.contactName.toLowerCase().includes(q) ||
        e.industry.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)) ||
        e.messageHistory.some(
          (m) =>
            m.content.toLowerCase().includes(q) ||
            m.sender.toLowerCase().includes(q)
        )
    );
    const matchedArticles = wikiArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
    setSearchResults({ entries: matchedEntries, articles: matchedArticles });
  };

  // 文件上传处理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const supportedTypes = ['.txt', '.md', '.csv', '.pdf', '.docx', '.xlsx'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      
      setUploadProgress(Math.round(((i) / files.length) * 100));
      
      if (!supportedTypes.includes(ext)) {
        toast.warning(`暂不支持 ${ext} 格式: ${file.name}`);
        continue;
      }

      try {
        let content = '';
        
        if (ext === '.pdf' || ext === '.docx' || ext === '.xlsx') {
          const text = await file.text().catch(() => '');
          if (text.trim()) {
            content = text;
          } else {
            toast.warning(`${file.name}: 此文件格式可能无法完全解析文本内容，建议使用 TXT/MD 格式`);
            content = `[二进制文件: ${file.name}]\n已上传但无法提取文本内容，建议转换成 TXT 或 Markdown 格式后重新上传。`;
          }
        } else {
          content = await file.text();
        }

        const doc: RawDocument = {
          id: `raw-${Date.now()}-${i}`,
          title: file.name.replace(ext, ''),
          content: content.slice(0, 50000),
          source: '用户上传',
          ingestedAt: new Date().toISOString(),
          fileName: file.name,
          fileType: ext.replace('.', ''),
          fileSize: file.size,
        };

        addRawDocument(doc);
        toast.success(`已上传：${file.name}`);
      } catch (err) {
        toast.error(`上传失败：${file.name}`);
        console.error(err);
      }
    }

    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 1500);
    e.target.value = '';
  };

  // AI 问答 - 接入真实LLM，以知识库检索结果为上下文
  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;

    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) {
      toast.error("请先配置并激活 LLM");
      return;
    }

    setAiLoading(true);
    setAiResponse("");

    try {
      // 1. 检索知识库（保留原有检索逻辑）
      const lowerQuery = aiQuery.toLowerCase();
      const relevantArticles = wikiArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.content.toLowerCase().includes(lowerQuery) ||
          a.tags.some((t) => lowerQuery.includes(t.toLowerCase()))
      );
      const relevantCustomers = kbEntries.filter(
        (e) =>
          e.companyName.toLowerCase().includes(lowerQuery) ||
          e.industry.toLowerCase().includes(lowerQuery) ||
          e.contactName.toLowerCase().includes(lowerQuery) ||
          e.tags.some((t) => lowerQuery.includes(t.toLowerCase()))
      );
      const relevantDocs = rawDocuments.filter(
        (d) =>
          d.title.toLowerCase().includes(lowerQuery) ||
          d.content.toLowerCase().includes(lowerQuery)
      );

      // 2. 构建知识库上下文
      let kbContext = "";
      if (relevantArticles.length > 0) {
        kbContext += "\n【相关Wiki文档】\n";
        relevantArticles.slice(0, 3).forEach((a) => {
          kbContext += `- ${a.title}：${a.content.slice(0, 200)}...\n`;
        });
      }
      if (relevantCustomers.length > 0) {
        kbContext += "\n【相关客户信息】\n";
        relevantCustomers.slice(0, 3).forEach((c) => {
          kbContext += `- ${c.companyName}(${c.industry})：对接人${c.contactName}${c.contactPosition ? `-${c.contactPosition}` : ""}，消耗¥${(c.consumption / 10000).toFixed(1)}万，${c.hasRecharge ? "已充值" : "未充值"}\n`;
          if (c.messageHistory.length > 0) {
            kbContext += `  最近沟通：${c.messageHistory.slice(-1)[0].content.slice(0, 100)}...\n`;
          }
        });
      }
      if (relevantDocs.length > 0) {
        kbContext += "\n【已上传文档内容参考】\n";
        relevantDocs.slice(0, 2).forEach((d) => {
          kbContext += `### ${d.title}${d.fileName ? ` (${d.fileName})` : ""}\n`;
          kbContext += d.content.slice(0, 1200) + (d.content.length > 1200 ? "\n...(内容已截断)\n" : "\n");
        });
      } else if (rawDocuments.length > 0) {
        kbContext += `\n【素材库概况】共 ${rawDocuments.length} 份已上传文档，但没有与当前问题直接匹配的内容\n`;
      }

      // 3. 调用真实LLM
      const systemPrompt = "你是AI CS指挥台的智能助手。基于以下从公司知识库检索到的上下文信息，回答用户的问题。回答要具体、有数据支撑、可执行。如果知识库里没有相关信息，如实说明。使用Markdown格式。";
      const userPrompt = `用户问题：${aiQuery}\n\n=== 知识库检索上下文 ===${kbContext || "(未检索到相关内容，请基于通用CS经验回答)"}\n\n请根据以上上下文回答用户问题。`;

      const result = await callLLM(userPrompt, systemPrompt);
      if (!result.success) {
        toast.error(result.error || "LLM调用失败");
        return;
      }

      setAiResponse(result.content);
    } catch (err) {
      toast.error("AI问答过程出错");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // 创建知识库条目
  const handleCreateEntry = () => {
    if (!newEntry.companyName.trim()) {
      toast.error("请填写企业名称");
      return;
    }
    const entry: CustomerKBEntry = {
      id: `kb-${Date.now()}`,
      companyName: newEntry.companyName.trim(),
      contactName: newEntry.contactName.trim(),
      contactPosition: newEntry.contactPosition.trim(),
      industry: newEntry.industry.trim() || "未分类",
      hasRecharge: newEntry.hasRecharge,
      rechargeTime: newEntry.rechargeTime || undefined,
      consumption: newEntry.consumption,
      messageHistory: [],
      tags: newEntry.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addKBEntry(entry);
    setNewEntry({
      companyName: "",
      contactName: "",
      contactPosition: "",
      industry: "",
      hasRecharge: false,
      rechargeTime: "",
      consumption: 0,
      tags: "",
    });
    setShowCreateForm(false);
    toast.success(`知识库条目"${entry.companyName}"已创建`);
  };

  // 发送消息到客户对话
  const handleSendMessage = () => {
    if (!selectedEntryForMsg || !newMessage.trim()) {
      toast.error("请选择客户并填写消息内容");
      return;
    }
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: newMessage.trim(),
      sender: "小甲(FDE)",
      timestamp: new Date().toISOString(),
      channel: "wechat",
    };
    addMessageToKB(selectedEntryForMsg, message);
    setNewMessage("");
    toast.success("消息已添加到客户对话记录");
  };

  // 创建 Wiki 文章
  const handleCreateWiki = () => {
    if (!newWiki.title.trim() || !newWiki.content.trim()) {
      toast.error("请填写标题和内容");
      return;
    }
    const article: WikiArticle = {
      id: `wiki-${Date.now()}`,
      title: newWiki.title.trim(),
      entityType: "overview",
      content: newWiki.content.trim(),
      tags: newWiki.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedIds: [],
    };
    addWikiArticle(article);
    setNewWiki({ title: "", content: "", tags: "" });
    setShowWikiForm(false);
    toast.success(`Wiki 文章"${article.title}"已创建`);
  };

  // ===== 编辑条目 =====
  const startEditEntry = (entry: CustomerKBEntry) => {
    setEditingEntryId(entry.id);
    setEditForm({
      companyName: entry.companyName,
      contactName: entry.contactName,
      contactPosition: entry.contactPosition,
      industry: entry.industry,
      consumption: String(entry.consumption),
      tags: entry.tags.join(", "),
    });
  };
  const saveEditEntry = () => {
    if (!editingEntryId) return;
    updateKBEntry(editingEntryId, {
      companyName: editForm.companyName || "",
      contactName: editForm.contactName || "",
      contactPosition: editForm.contactPosition || "",
      industry: editForm.industry || "未分类",
      consumption: Number(editForm.consumption) || 0,
      tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setEditingEntryId(null);
    setEditForm({});
    toast.success("条目已更新");
  };
  const cancelEditEntry = () => { setEditingEntryId(null); setEditForm({}); };

  // ===== 导入聊天记录 + AI角色识别 =====
  const handleChatImport = async () => {
    if (!chatImportText.trim()) { toast.error("请粘贴聊天记录"); return; }
    if (!chatImportTargetId) { toast.error("请选择目标客户"); return }

    const activeConfig = useStore.getState().getActiveLLMConfig();
    if (!activeConfig) { toast.error("请先配置并激活 LLM"); return; }

    setChatImportLoading(true);
    try {
      const prompt = `以下是原始聊天记录，请分析并识别每句话的角色，然后提取为结构化对话。

聊天记录：
${chatImportText}

要求：
1. 识别每句话是谁说的（"客服/运营/FDE/小甲" 或 "客户/对方"）
2. 去掉无关内容（如系统消息、时间戳等）
3. 提取关键信息：客户需求、痛点、情绪

输出JSON数组格式：
[{"sender":"客服|客户","content":"清洗后的消息内容","keyInfo":"关键信息(可选)"}]`;

      const systemPrompt = "你是对话分析专家。从原始聊天文本中准确识别说话人角色，清洗无关信息。严格JSON数组格式。";

      const result = await callLLM(prompt, systemPrompt);
      if (!result.success) { toast.error(result.error || "AI分析失败"); return; }

      let parsed: Record<string, unknown>[];
      try {
        const jsonMatch = result.content.match(/\[[\s\S]*\]/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch { toast.error("解析失败"); return; }

      const messages: ChatMessage[] = parsed.map((item, idx) => ({
        id: `imported-${Date.now()}-${idx}`,
        content: (item.content as string) || "",
        sender: (item.sender as string).includes("客") ? "客户" : "小甲(FDE)",
        timestamp: new Date().toISOString(),
        channel: "other" as const,
      }));

      // 批量添加到目标客户的messageHistory
      messages.forEach((msg) => addMessageToKB(chatImportTargetId, msg));
      setChatImportText("");
      setChatImportTargetId("");
      toast.success(`已导入 ${messages.length} 条对话记录`);
    } finally { setChatImportLoading(false); }
  };

  const formatMoney = (val: number) => {
    if (val >= 10000) return `¥${(val / 10000).toFixed(1)}万`;
    return `¥${val.toLocaleString()}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">知识库</h2>
          <p className="text-sm text-slate-500 mt-1">
            Karpathy Wiki 架构 · 三层知识管理 · {kbEntries.length} 客户 ·{" "}
            {wikiArticles.length} 文章 · {rawDocuments.length} 素材
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="wiki" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Wiki 知识库
          </TabsTrigger>
          <TabsTrigger value="customer-kb" className="gap-2">
            <Database className="w-4 h-4" />
            客户知识库 ({kbEntries.length})
          </TabsTrigger>
          <TabsTrigger value="raw" className="gap-2">
            <FileText className="w-4 h-4" />
            原始素材 ({rawDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="w-4 h-4" />
            AI 问答
          </TabsTrigger>
        </TabsList>

        {/* Wiki 知识库 */}
        <TabsContent value="wiki">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {wikiArticles.map((article) => (
                <Card
                  key={article.id}
                  className={`border-0 shadow-sm hover:shadow-md transition-shadow group ${article.isSample ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        {article.title}
                        {article.isSample && (
                          <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-500">演示</Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {!article.isSample && (
                          <button
                            onClick={() => setDeleteTarget({ type: 'wiki', id: article.id, name: article.title })}
                            className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                          </button>
                        )}
                        {article.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      更新于{" "}
                      {new Date(article.updatedAt).toLocaleDateString("zh-CN")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {article.content}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {wikiArticles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <BookOpen className="w-10 h-10 mb-3" />
                  <p className="text-sm">暂无 Wiki 文章</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* 新建 Wiki 按钮 */}
              <Button
                onClick={() => setShowWikiForm(!showWikiForm)}
                variant="outline"
                className="w-full gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                新建 Wiki 文章
              </Button>

              {showWikiForm && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      新建 Wiki 文章
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">标题</Label>
                      <Input
                        value={newWiki.title}
                        onChange={(e) =>
                          setNewWiki({ ...newWiki, title: e.target.value })
                        }
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">内容 (Markdown)</Label>
                      <Textarea
                        value={newWiki.content}
                        onChange={(e) =>
                          setNewWiki({ ...newWiki, content: e.target.value })
                        }
                        rows={6}
                        className="mt-1 resize-none text-sm font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">标签 (逗号分隔)</Label>
                      <Input
                        value={newWiki.tags}
                        onChange={(e) =>
                          setNewWiki({ ...newWiki, tags: e.target.value })
                        }
                        className="mt-1 h-8 text-sm"
                        placeholder="AI, 电商, 客户分析"
                      />
                    </div>
                    <Button
                      onClick={handleCreateWiki}
                      className="w-full gap-2"
                      size="sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      发布文章
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* 架构说明 */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-blue-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    Karpathy Wiki 架构
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>
                      <strong>raw/</strong> 原始素材 ({rawDocuments.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>
                      <strong>wiki/</strong> 编译知识 ({wikiArticles.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>
                      <strong>KB/</strong> 客户知识 ({kbEntries.length})
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-slate-500">
                      AI 回答时自动检索三层知识库，
                      结合上下文生成精准回复。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 客户知识库 */}
        <TabsContent value="customer-kb">
          <div className="space-y-4">
            {/* 搜索 */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="搜索客户、联系人、行业、消息记录..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleSearch} className="gap-2">
                    <Search className="w-4 h-4" />
                    搜索
                  </Button>
                  <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    新建条目
                  </Button>
                </div>

                {/* 搜索结果 */}
                {(searchResults.entries.length > 0 ||
                  searchResults.articles.length > 0) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium mb-2">
                      搜索结果：{searchResults.entries.length} 客户 ·{" "}
                      {searchResults.articles.length} 文章
                    </p>
                    {searchResults.entries.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className="text-xs text-blue-600 mb-1 flex items-center gap-1"
                      >
                        <Building2 className="w-3 h-3" />
                        {e.companyName} - {e.contactName}
                      </div>
                    ))}
                    {searchResults.articles.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="text-xs text-blue-600 flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        {a.title}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 新建表单 */}
            {showCreateForm && (
              <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    新建客户知识库条目
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">企业名称 *</Label>
                      <Input
                        value={newEntry.companyName}
                        onChange={(e) =>
                          setNewEntry({
                            ...newEntry,
                            companyName: e.target.value,
                          })
                        }
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">所属行业</Label>
                      <Input
                        value={newEntry.industry}
                        onChange={(e) =>
                          setNewEntry({ ...newEntry, industry: e.target.value })
                        }
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">对接人姓名</Label>
                      <Input
                        value={newEntry.contactName}
                        onChange={(e) =>
                          setNewEntry({
                            ...newEntry,
                            contactName: e.target.value,
                          })
                        }
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">对接人岗位</Label>
                      <Input
                        value={newEntry.contactPosition}
                        onChange={(e) =>
                          setNewEntry({
                            ...newEntry,
                            contactPosition: e.target.value,
                          })
                        }
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">是否充值</Label>
                      <div className="flex gap-4 mt-1">
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            checked={newEntry.hasRecharge}
                            onChange={() =>
                              setNewEntry({ ...newEntry, hasRecharge: true })
                            }
                          />
                          是
                        </label>
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            checked={!newEntry.hasRecharge}
                            onChange={() =>
                              setNewEntry({ ...newEntry, hasRecharge: false })
                            }
                          />
                          否
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">
                        {newEntry.hasRecharge ? "充值时间" : "消耗金额 (¥)"}
                      </Label>
                      {newEntry.hasRecharge ? (
                        <Input
                          type="date"
                          value={newEntry.rechargeTime}
                          onChange={(e) =>
                            setNewEntry({
                              ...newEntry,
                              rechargeTime: e.target.value,
                            })
                          }
                          className="mt-1 h-8 text-sm"
                        />
                      ) : (
                        <Input
                          type="number"
                          value={newEntry.consumption || ""}
                          onChange={(e) =>
                            setNewEntry({
                              ...newEntry,
                              consumption: Number(e.target.value),
                            })
                          }
                          className="mt-1 h-8 text-sm"
                          placeholder="0"
                        />
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">标签 (逗号分隔)</Label>
                      <Input
                        value={newEntry.tags}
                        onChange={(e) =>
                          setNewEntry({ ...newEntry, tags: e.target.value })
                        }
                        className="mt-1 h-8 text-sm"
                        placeholder="重点客户, AI行业"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                    >
                      取消
                    </Button>
                    <Button size="sm" onClick={handleCreateEntry}>
                      创建条目
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 知识库列表 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {kbEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className={`border-0 shadow-sm hover:shadow-md transition-shadow ${entry.isSample ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        {editingEntryId === entry.id ? (
                          <Input value={editForm.companyName || ""} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} className="h-6 text-sm w-40" />
                        ) : (
                          entry.companyName
                        )}
                        {entry.isSample && (
                          <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-500">演示</Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge className={`text-[10px] ${entry.hasRecharge ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-700"}`}>
                          {entry.hasRecharge ? "已充值" : "未充值"}
                        </Badge>
                        {editingEntryId !== entry.id && (
                          <div className="flex gap-0.5">
                            <button onClick={() => startEditEntry(entry)} className="p-1 hover:bg-slate-200 rounded"><Edit3 className="w-3.5 h-3.5 text-slate-400" /></button>
                            <button onClick={() => setDeleteTarget({ type: 'kb', id: entry.id, name: entry.companyName })} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {editingEntryId === entry.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-[10px]">对接人</Label><Input value={editForm.contactName || ""} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} className="h-7 text-xs mt-0.5" /></div>
                          <div><Label className="text-[10px]">岗位</Label><Input value={editForm.contactPosition || ""} onChange={(e) => setEditForm({ ...editForm, contactPosition: e.target.value })} className="h-7 text-xs mt-0.5" /></div>
                          <div><Label className="text-[10px]">行业</Label><Input value={editForm.industry || ""} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} className="h-7 text-xs mt-0.5" /></div>
                          <div><Label className="text-[10px]">消耗</Label><Input type="number" value={editForm.consumption || ""} onChange={(e) => setEditForm({ ...editForm, consumption: e.target.value })} className="h-7 text-xs mt-0.5" /></div>
                        </div>
                        <div><Label className="text-[10px]">标签</Label><Input value={editForm.tags || ""} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} className="h-7 text-xs mt-0.5" placeholder="逗号分隔" /></div>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" h-7 text-xs onClick={cancelEditEntry}>取消</Button>
                          <Button size="sm" h-7 text-xs onClick={saveEditEntry}>保存</Button>
                        </div>
                      </div>
                    ) : (
                    <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <User className="w-3 h-3" />
                        {entry.contactName}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Briefcase className="w-3 h-3" />
                        {entry.contactPosition}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Tag className="w-3 h-3" />
                        {entry.industry}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <DollarSign className="w-3 h-3" />
                        {formatMoney(entry.consumption)}
                      </div>
                    </div>

                    {entry.rechargeTime && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        充值时间：{entry.rechargeTime}
                      </p>
                    )}

                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* 消息记录 */}
                    {entry.messageHistory.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          最近消息
                        </p>
                        {entry.messageHistory.slice(-2).map((msg) => (
                          <div
                            key={msg.id}
                            className="text-xs text-slate-600 bg-slate-50 p-2 rounded mb-1"
                          >
                            <span className="font-medium text-slate-700">
                              {msg.sender}：
                            </span>
                            {msg.content}
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {new Date(msg.timestamp).toLocaleString("zh-CN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 发送消息入口 */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <Input
                        placeholder="添加对话记录..."
                        value={
                          selectedEntryForMsg === entry.id ? newMessage : ""
                        }
                        onChange={(e) => {
                          setSelectedEntryForMsg(entry.id);
                          setNewMessage(e.target.value);
                        }}
                        onFocus={() => setSelectedEntryForMsg(entry.id)}
                        className="h-7 text-xs"
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={handleSendMessage}
                        disabled={
                          selectedEntryForMsg !== entry.id || !newMessage.trim()
                        }
                      >
                        <Send className="w-3 h-3" />
                        发送
                      </Button>
                    </div>

                    {/* 聊天记录导入入口 */}
                    {chatImportTargetId === entry.id ? (
                      <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200 space-y-2">
                        <p className="text-[10px] text-purple-600 font-medium">粘贴聊天记录，AI自动识别角色</p>
                        <Textarea
                          value={chatImportText}
                          onChange={(e) => setChatImportText(e.target.value)}
                          rows={3}
                          className="text-xs resize-none font-mono"
                          placeholder="粘贴企微/微信聊天记录..."
                        />
                        <div className="flex gap-1">
                          <Button size="sm" className="h-6 text-[10px] gap-1" onClick={handleChatImport} disabled={chatImportLoading || !chatImportText.trim()}>
                            {chatImportLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                            AI识别导入
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => { setChatImportTargetId(""); setChatImportText(""); }}>取消</Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setChatImportTargetId(entry.id)}
                        className="mt-1 w-full text-[10px] text-purple-500 hover:text-purple-700 hover:bg-purple-50 py-1 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> 导入聊天记录（AI识别）
                      </button>
                    )}
                    </>)}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 删除确认弹窗 */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {deleteTarget?.type === 'wiki' && '确认删除 Wiki 文章'}
                    {deleteTarget?.type === 'raw' && '确认删除原始素材'}
                    {deleteTarget?.type === 'kb' && '确认删除知识库条目'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {deleteTarget?.type === 'wiki' && `确定要删除 Wiki 文章"${deleteTarget.name}"吗？删除后无法恢复。`}
                    {deleteTarget?.type === 'raw' && `确定要删除原始素材"${deleteTarget.name}"吗？删除后无法恢复。`}
                    {deleteTarget?.type === 'kb' && `删除后该客户"${deleteTarget.name}"的所有对话记录和关联数据将被清除，无法恢复。确定要删除吗？`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    if (!deleteTarget) return;
                    if (deleteTarget.type === 'wiki') { deleteWikiArticle(deleteTarget.id); toast.success("Wiki 文章已删除"); }
                    if (deleteTarget.type === 'raw') { deleteRawDocument(deleteTarget.id); toast.success("原始素材已删除"); }
                    if (deleteTarget.type === 'kb') { deleteKBEntry(deleteTarget.id); toast.success("条目已删除"); }
                    setDeleteTarget(null);
                  }}>确认删除</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>

        {/* 原始素材 */}
        <TabsContent value="raw">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                原始素材层 (raw/) — 上传文档作为 AI 问答的知识来源
              </p>
              <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                <input
                  type="file"
                  className="hidden"
                  accept=".txt,.md,.csv,.pdf,.docx,.xlsx"
                  multiple
                  onChange={handleFileUpload}
                />
                <Plus className="w-3.5 h-3.5" /> 上传文档
              </label>
            </div>

            {/* 格式提示 */}
            <div className="text-xs text-slate-400 bg-slate-50 p-2 rounded flex items-center gap-3 flex-wrap">
              <span>支持:</span>
              <Badge variant="secondary" className="text-[9px]">TXT</Badge>
              <Badge variant="secondary" className="text-[9px]">MD</Badge>
              <Badge variant="secondary" className="text-[9px]">CSV</Badge>
              <Badge variant="secondary" className="text-[9px]">PDF</Badge>
              <span className="text-slate-300">|</span>
              <span>建议用 TXT/MD 格式以获得最佳效果</span>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="flex items-center gap-2 text-xs text-purple-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                正在解析文件...
              </div>
            )}

            {rawDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                <Database className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm font-medium">暂无原始素材</p>
                <p className="text-xs mt-1">点击「上传文档」添加知识文件，AI 问答时将自动参考</p>
              </div>
            ) : (
              rawDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className={`border-0 shadow-sm border-l-4 border-l-amber-400 group ${doc.isSample ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-500" />
                        {doc.title}
                        {doc.isSample && (
                          <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-500">演示</Badge>
                        )}
                        {doc.fileType && (
                          <Badge variant="outline" className="text-[9px]">{doc.fileType.toUpperCase()}</Badge>
                        )}
                      </CardTitle>
                      {!doc.isSample && (
                        <button
                          onClick={() => setDeleteTarget({ type: 'raw', id: doc.id, name: doc.title })}
                          className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {doc.fileName && <span>{doc.fileName}</span>}
                      {(doc.fileName || doc.source)} · {doc.ingestedAt}
                      {doc.fileSize && <span> · {(doc.fileSize / 1024).toFixed(1)}KB</span>}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-purple-600 hover:text-purple-700 list-none flex items-center gap-1 w-fit">
                        展开预览 <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
                      </summary>
                      <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded max-h-60 overflow-y-auto">
                        {doc.content}
                      </div>
                    </details>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* AI 问答 */}
        <TabsContent value="ai">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI 智能问答
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    先检索公司知识库（Wiki + 客户KB + 原始素材），再结合上下文生成回答
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="输入问题，AI 将先检索知识库再回答..."
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAIQuery();
                        }
                      }}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleAIQuery}
                    className="gap-2"
                    disabled={aiLoading || !aiQuery.trim()}
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        检索知识库中...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        提问
                      </>
                    )}
                  </Button>

                  {aiResponse && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-semibold text-purple-700">
                          AI 回答
                        </span>
                        <Badge className="text-[10px] bg-purple-100 text-purple-700">
                          基于知识库检索
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {aiResponse}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 知识库统计 */}
            <div className="space-y-3">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold">
                    知识库概览
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Wiki 文章</span>
                    <span className="font-semibold text-slate-700">
                      {wikiArticles.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">客户条目</span>
                    <span className="font-semibold text-slate-700">
                      {kbEntries.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">原始素材</span>
                    <span className="font-semibold text-slate-700">
                      {rawDocuments.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">总消息记录</span>
                    <span className="font-semibold text-slate-700">
                      {kbEntries.reduce(
                        (s, e) => s + e.messageHistory.length,
                        0
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-4 text-xs text-slate-600">
                  <p className="font-semibold text-purple-700 mb-2">
                    Karpathy Wiki 工作流
                  </p>
                  <ol className="space-y-1 list-decimal list-inside">
                    <li>原始素材存入 raw/</li>
                    <li>LLM 编译为 wiki/ 文章</li>
                    <li>客户数据维护在 KB/</li>
                    <li>AI 回答时三层联合检索</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
