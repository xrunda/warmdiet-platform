import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Edit2,
  FileText,
  History,
  Link,
  MoreVertical,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { BottomSheet, LoadingSpinner } from '../components/ui';
import { renderFormattedTextH5, fileToDataUrl } from '../utils';
import type { AIConsultationReportItem, BufferedFile } from '../types/app';
import {
  createAIConsultation,
  fetchAIConsultations,
  deleteAIConsultation,
  updateAIConsultation,
  retryAIConsultationHtml,
} from '../api';

let _consultReports: AIConsultationReportItem[] = [];
let _consultPendingTasks: any[] = [];
let _consultBuffer: BufferedFile[] = [];
let _consultInitialized = false;


export const ConsultScreen = () => {
  const [reports, setReports] = useState<AIConsultationReportItem[]>(_consultReports);
  const [uploading, setUploading] = useState(false);
  const [buffer, setBuffer] = useState<BufferedFile[]>(_consultBuffer);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>(_consultPendingTasks);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('consult_pinned') || '[]')); } catch { return new Set(); }
  });
  const [galleryData, setGalleryData] = useState<{ images: string[]; index: number } | null>(null);
  const [detailReport, setDetailReport] = useState<AIConsultationReportItem | null>(null);
  const [expandedSummaryIds, setExpandedSummaryIds] = useState<Set<string>>(new Set());

  // 同步状态到模块级变量
  useEffect(() => { _consultReports = reports; }, [reports]);
  useEffect(() => { _consultPendingTasks = pendingTasks; }, [pendingTasks]);
  useEffect(() => { _consultBuffer = buffer; }, [buffer]);

  const getRiskTone = (riskLevel: AIConsultationReportItem['riskLevel']) => {
    if (riskLevel === 'high') return 'bg-red-50 text-red-600 border-red-100';
    if (riskLevel === 'medium') return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  };

  // 将 API 返回的数据映射为前端类型
  const mapApiReport = (r: any): AIConsultationReportItem => {
    // 如果 consultationSummary 为空，尝试从 modelAnalysis 提取摘要
    let summary = r.consultationSummary || r.summary || '';
    if (!summary && r.modelAnalysis && typeof r.modelAnalysis === 'object') {
      // 尝试从每个模型的分析中取第一段作为摘要
      const analyses = Object.values(r.modelAnalysis) as string[];
      const firstAnalysis = analyses.find((a) => typeof a === 'string' && a.length > 0);
      if (firstAnalysis) {
        summary = firstAnalysis.slice(0, 200) + (firstAnalysis.length > 200 ? '...' : '');
      }
    }
    if (!summary && r.extractedContent) {
      summary = String(r.extractedContent).slice(0, 150) + '...';
    }
    return {
      id: r.id,
      title: r.title || 'AI 会诊报告',
      hospitalName: r.hospitalName || '',
      reportUrl: r.htmlReportUrl || r.reportUrl || '',
      createdAt: r.createdAt || r.created_at || '',
      status: r.status || 'pending',
      riskLevel: r.riskLevel || r.risk_level || 'low',
      tags: r.tags || [],
      summary,
      sourceMaterials: r.sourceFiles || r.sourceMaterials || [],
    };
  };

  // 加载报告列表和检查进行中的任务
  const loadReports = useCallback(async () => {
    try {
      const list = await fetchAIConsultations();
      const mapped = (list || []).map(mapApiReport);
      setReports(mapped);
      
      // 打印每个任务的 ID 和状态
      mapped.forEach((r) => {
        console.log(`[AI会诊] id=${r.id} status=${r.status} title="${r.title}"`);
      });
      
      // 检查是否有进行中的任务（status 为 pending 或 processing）
      const pending = mapped.filter((report) => report.status === 'pending' || report.status === 'processing');
      setPendingTasks(pending);
      
      if (pending.length > 0) {
        console.log(`[AI会诊] 🔄 ${pending.length} 个任务进行中，5秒后自动刷新...`);
      }
    } catch (e) {
      console.error('Failed to fetch consultations:', e);
    }
  }, []);

  // 组件挂载时加载报告
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // 自动轮询：如果有 pending/processing 任务，每5秒刷新一次
  useEffect(() => {
    if (pendingTasks.length === 0) return;
    const timer = setInterval(() => {
      console.log(`[AI会诊] ⏱ 轮询刷新中...`);
      loadReports();
    }, 5000);
    return () => clearInterval(timer);
  }, [pendingTasks.length, loadReports]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 将选中的文件添加到缓冲区
    const newFiles: BufferedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await fileToDataUrl(file);
        newFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          dataUrl,
          file,
        });
      } catch (e) {
        console.error('Failed to read file:', e);
      }
    }

    setBuffer((prev) => [...prev, ...newFiles]);
    // 清空 input 以便再次选择相同文件
    event.target.value = '';
  };

  const handleRemoveFromBuffer = (id: string) => {
    setBuffer((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearBuffer = () => {
    setBuffer([]);
  };

  const handleSubmitBuffer = async () => {
    if (buffer.length === 0) return;

    try {
      setUploading(true);
      const filesPayload = buffer.map((f) => ({
        name: f.name,
        type: 'image' as const,
        content: f.dataUrl,
      }));
      
      const result = await createAIConsultation({
        files: filesPayload,
      });
      
      // 清空缓冲区
      setBuffer([]);
      
      // 刷新报告列表
      await loadReports();
      
      // 显示友好的提示信息
      alert('上传成功！AI 正在后台生成会诊报告，您可继续使用其他功能。报告生成完成后会通知您。');
    } catch (e) {
      console.error('Failed to create consultation:', e);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const openImagePreview = (url: string, name: string) => {
    setPreviewImage({ url, name });
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-brand-bg pb-24 hide-scrollbar">
      <header className="relative bg-gradient-to-br from-fuchsia-600 via-violet-600 to-indigo-700 px-5 pt-safe pb-6 overflow-hidden">
        <div className="relative z-10 flex items-center justify-between py-3">
          <h1 className="text-xl font-bold text-white">AI会诊</h1>
          <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition">
            <History className="w-5 h-5" />
          </button>
        </div>
        <div className="relative z-10 rounded-[24px] border border-white/15 bg-white/10 backdrop-blur-sm p-4 mt-3 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold">上传检查单，获取 AI 会诊解读</p>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">患者自行上传化验单、检查报告后，系统调用润思平台异步生成独立 H5 会诊报告，便于自己查看，也便于医生随诊参考。</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
            multiple
          />
          <button 
            onClick={handleUploadClick}
            disabled={uploading}
            className="mt-4 w-full rounded-2xl bg-white text-indigo-700 py-3 text-sm font-bold shadow-lg shadow-indigo-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? '上传中...' : '上传检查单并发起 AI 会诊'}
          </button>
        </div>
      </header>

      {/* 进行中的任务 */}
      {pendingTasks.length > 0 && (
        <div className="p-4 -mt-2">
          <section className="bg-white rounded-[22px] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-base font-bold text-gray-900">进行中的任务</h3>
              </div>
              <button
                onClick={loadReports}
                className="text-xs font-bold text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> 刷新
              </button>
            </div>
            <div className="space-y-3">
              {pendingTasks.map((task: any) => (
                <div key={task.id} className="rounded-[18px] border border-amber-100 bg-[linear-gradient(135deg,#fffbf0_0%,#fff7e6_100%)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{task.title || '会诊报告生成中'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          提交于 {new Date(task.createdAt || task.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-600 whitespace-nowrap">
                      生成中...
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="w-1/3 h-full bg-amber-400 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-amber-600 mt-2">AI 正在分析检查单，报告生成完成后将自动显示在下方列表。</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 缓冲池区域 */}
      {buffer.length > 0 && (
        <div className="p-4 -mt-2">
          <section className="bg-white rounded-[22px] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">待上传检查单 ({buffer.length} 项)</h3>
                <p className="text-xs text-gray-400 mt-1">您可以继续添加或预览检查单</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClearBuffer}
                  disabled={uploading}
                  className="text-xs font-bold text-red-500 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 disabled:opacity-50"
                >
                  清空
                </button>
                <button
                  onClick={handleSubmitBuffer}
                  disabled={uploading}
                  className="text-xs font-bold text-white px-3 py-1.5 rounded-lg bg-indigo-600 shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {uploading ? '上传中...' : '全部上传'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {buffer.map((file) => (
                <div key={file.id} className="relative group">
                  <div 
                    className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden cursor-pointer hover:border-indigo-300 transition-colors"
                    onClick={() => openImagePreview(file.dataUrl, file.name)}
                  >
                    {file.dataUrl ? (
                      <img 
                        src={file.dataUrl} 
                        alt={file.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromBuffer(file.id);
                    }}
                    disabled={uploading}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="p-4 space-y-4 -mt-2">
        <section className="bg-white rounded-[22px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">我的会诊报告</h3>
              <p className="text-xs text-gray-400 mt-1">可直接在微信或医生端打开完整 H5 报告</p>
            </div>
            <span className="text-xs font-bold text-indigo-600">{reports.length} 份</span>
          </div>

          <div className="space-y-3">
            {[...reports].sort((a, b) => {
              const aPinned = pinnedIds.has(a.id) ? 1 : 0;
              const bPinned = pinnedIds.has(b.id) ? 1 : 0;
              return bPinned - aPinned;
            }).map((report) => {
              const isPinned = pinnedIds.has(report.id);
              return (
              <div key={report.id} className={cn('rounded-[22px] border bg-[linear-gradient(135deg,#ffffff_0%,#faf7ff_100%)] p-4 relative', isPinned ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-100')}>
                {isPinned && <div className="absolute top-3 left-3 text-indigo-500 text-xs font-bold">📌 置顶</div>}
                <div className="flex items-start justify-between gap-2">
                  <div className={cn('flex-1 min-w-0', isPinned && 'mt-4')}>
                    <p className="text-sm font-bold text-gray-900 truncate">{report.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(report.createdAt).toLocaleString('zh-CN')} · {report.hospitalName}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', getRiskTone(report.riskLevel))}>
                      {report.riskLevel === 'high' ? '重点关注' : report.riskLevel === 'medium' ? '需观察' : '平稳'}
                    </span>
                    {/* 三点菜单 */}
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === report.id ? null : report.id)}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpenId === report.id && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-0 top-full mt-1 z-[61] w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 p-1.5 space-y-0.5">
                            <button
                              onClick={async () => {
                                const newName = window.prompt('修改报告名称', report.title);
                                if (newName && newName.trim()) {
                                  try {
                                    await updateAIConsultation(report.id, { title: newName.trim() });
                                    setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, title: newName.trim() } : r));
                                  } catch (e) {
                                    console.error('修改报告名称失败:', e);
                                    alert('修改失败，请重试');
                                  }
                                }
                                setMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-400" /> 修改名称
                            </button>
                            <button
                              onClick={() => {
                                setPinnedIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(report.id)) { next.delete(report.id); } else { next.add(report.id); }
                                  localStorage.setItem('consult_pinned', JSON.stringify([...next]));
                                  return next;
                                });
                                setMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                            >
                              <span className="text-sm">{isPinned ? '📌' : '📌'}</span> {isPinned ? '取消置顶' : '置顶报告'}
                            </button>
                            <button
                              onClick={() => {
                                const text = `${report.title}\n\n${report.summary || ''}`;
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(text).then(() => alert('报告摘要已复制')).catch(() => alert('复制失败'));
                                } else {
                                  const textarea = document.createElement('textarea');
                                  textarea.value = text;
                                  textarea.style.position = 'fixed';
                                  textarea.style.opacity = '0';
                                  document.body.appendChild(textarea);
                                  textarea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textarea);
                                  alert('报告摘要已复制');
                                }
                                setMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                            >
                              <Copy className="w-3.5 h-3.5 text-gray-400" /> 复制文字版
                            </button>
                            <button
                              onClick={() => {
                                const url = report.reportUrl || window.location.href;
                                navigator.clipboard?.writeText(url).then(() => alert('链接已复制')).catch(() => alert(url));
                                setMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                            >
                              <Link className="w-3.5 h-3.5 text-gray-400" /> 复制报告链接
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={async () => {
                                if (window.confirm('确定要删除这份报告吗？')) {
                                  try {
                                    await deleteAIConsultation(report.id);
                                    setReports((prev) => prev.filter((r) => r.id !== report.id));
                                  } catch (e) {
                                    console.error('删除报告失败:', e);
                                    alert('删除失败，请重试');
                                  }
                                }
                                setMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> 删除报告
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {(report.tags || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(report.tags || []).map((tag) => (
                      <span key={tag} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-100">{tag}</span>
                    ))}
                  </div>
                )}

                {report.summary && (
                  <div className="mt-3">
                    {!expandedSummaryIds.has(report.id) ? (
                      <p className="text-sm leading-relaxed text-gray-500 line-clamp-2">
                        {report.summary.replace(/[#*\-•]/g, '').replace(/\n+/g, ' ').trim().slice(0, 80)}
                        {report.summary.length > 80 ? '…' : ''}
                      </p>
                    ) : (
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 max-h-[400px] overflow-y-auto">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-xs font-bold text-indigo-600">AI 会诊分析全文</span>
                        </div>
                        {renderFormattedTextH5(report.summary)}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setExpandedSummaryIds(prev => {
                          const next = new Set(prev);
                          if (next.has(report.id)) next.delete(report.id); else next.add(report.id);
                          return next;
                        })}
                        className={cn(
                          'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition',
                          expandedSummaryIds.has(report.id)
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        )}
                      >
                        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', expandedSummaryIds.has(report.id) && 'rotate-180')} />
                        {expandedSummaryIds.has(report.id) ? '收起文字版' : '展开文字版'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  {report.status === 'completed' && report.reportUrl ? (
                    <a
                      href={report.reportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-2xl bg-indigo-600 text-white text-center py-3 text-sm font-bold shadow-lg shadow-indigo-200"
                    >
                      查看完整报告
                    </a>
                  ) : report.status === 'completed' ? (
                    <button
                      onClick={() => setDetailReport(report)}
                      className="flex-1 rounded-2xl bg-indigo-600 text-white text-center py-3 text-sm font-bold shadow-lg shadow-indigo-200"
                    >
                      查看分析摘要
                    </button>
                  ) : report.status === 'pending' || report.status === 'processing' ? (
                    <button
                      disabled
                      className="flex-1 rounded-2xl bg-amber-100 text-amber-600 text-center py-3 text-sm font-bold border border-amber-200"
                    >
                      <Clock className="w-4 h-4 inline mr-1" />报告生成中...
                    </button>
                  ) : report.status === 'failed' ? (
                    <button
                      disabled
                      className="flex-1 rounded-2xl bg-red-50 text-red-500 text-center py-3 text-sm font-bold border border-red-100"
                    >
                      生成失败
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 rounded-2xl bg-gray-100 text-gray-400 text-center py-3 text-sm font-bold"
                    >
                      暂无报告
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const materials = report.sourceMaterials || [];
                      if (materials.length === 0) { alert('暂无原始素材'); return; }
                      // 提取图片内容：content 字段存储了原始 base64 数据
                      const imgs = materials.map((m: any) => typeof m === 'string' ? m : m?.content || m?.url || '').filter(Boolean);
                      if (imgs.length === 0) { alert('历史素材不含原始图片数据（旧报告未保存图片内容）'); return; }
                      if (imgs.length === 1) {
                        openImagePreview(imgs[0], '原始素材');
                      } else {
                        setGalleryData({ images: imgs, index: 0 });
                      }
                    }}
                    className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 bg-white"
                  >
                    历史素材 {(report.sourceMaterials || []).length}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 图片预览模态框 */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={closeImagePreview}>
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={closeImagePreview}
              className="absolute -top-12 right-0 text-white p-2 rounded-full hover:bg-white/10 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="bg-white rounded-2xl overflow-hidden">
              <img 
                src={previewImage.url} 
                alt={previewImage.name} 
                className="w-full max-h-[80vh] object-contain"
              />
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900 truncate">{previewImage.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 报告详情底部弹窗 */}
      <BottomSheet open={!!detailReport} onClose={() => setDetailReport(null)} title={detailReport?.title || 'AI 分析结果'}>
        {detailReport && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className={cn('rounded-full border px-2.5 py-1 text-xs font-bold', getRiskTone(detailReport.riskLevel))}>
                {detailReport.riskLevel === 'high' ? '重点关注' : detailReport.riskLevel === 'medium' ? '需观察' : '平稳'}
              </span>
              <span className="text-xs text-gray-400">{new Date(detailReport.createdAt).toLocaleString('zh-CN')}</span>
            </div>
            {(detailReport.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {detailReport.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-100">{tag}</span>
                ))}
              </div>
            )}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <p className="text-sm font-bold text-gray-900">AI 分析结论</p>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">{renderFormattedTextH5(detailReport.summary || '暂无分析结论')}</div>
            </div>
            {detailReport.reportUrl && (
              <a
                href={detailReport.reportUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-2xl bg-indigo-600 text-white text-center py-3.5 text-sm font-bold shadow-lg shadow-indigo-200"
              >
                打开完整 H5 报告
              </a>
            )}
            <button
              onClick={() => {
                const text = `${detailReport.title}\n${detailReport.summary}`;
                navigator.clipboard?.writeText(text).then(() => alert('已复制到剪贴板')).catch(() => {});
              }}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-600"
            >
              复制分析结论
            </button>
          </div>
        )}
      </BottomSheet>

      {/* 多图画廊预览 */}
      {galleryData && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setGalleryData(null)}>
          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setGalleryData(null)} className="absolute top-6 right-6 text-white/80 p-2 rounded-full hover:bg-white/10 transition z-10">
              <X className="w-6 h-6" />
            </button>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-bold z-10">
              {galleryData.index + 1} / {galleryData.images.length}
            </div>
            {galleryData.index > 0 && (
              <button
                onClick={() => setGalleryData((g) => g ? { ...g, index: g.index - 1 } : null)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {galleryData.index < galleryData.images.length - 1 && (
              <button
                onClick={() => setGalleryData((g) => g ? { ...g, index: g.index + 1 } : null)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            <div className="px-16 max-w-4xl w-full">
              <img
                src={galleryData.images[galleryData.index]}
                alt={`素材 ${galleryData.index + 1}`}
                className="w-full max-h-[85vh] object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== MAIN APP ==========