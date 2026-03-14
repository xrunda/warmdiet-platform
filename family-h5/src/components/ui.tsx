import React, { useState } from 'react';
import {
  Check,
  Copy,
  Home as HomeIcon,
  BarChart2,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// ========== LoadingSpinner ==========

export function LoadingSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-3">加载中...</p>
      </div>
    </div>
  );
}

// ========== CopyTextButton ==========

/** 一键复制按钮：点击后将文本写入剪贴板并显示短暂的"已复制"反馈 */
export function CopyTextButton({ text, label = '一键复制' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('复制失败，请手动选择文字复制');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
        copied
          ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
          : 'border-indigo-200 bg-indigo-50 text-indigo-600 active:scale-[0.96]'
      )}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? '已复制' : label}
    </button>
  );
}

// ========== BottomSheet ==========

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/50 flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="w-full bg-white rounded-t-[28px] max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ========== CenterDialog ==========

export function CenterDialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center px-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm bg-white rounded-[24px] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ========== ImagePreviewDialog ==========

export function ImagePreviewDialog({
  open,
  onClose,
  title,
  image,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  image?: string | null;
}) {
  return (
    <CenterDialog open={open} onClose={onClose}>
      <div className="p-5 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        {image ? (
          <div className="rounded-[20px] overflow-hidden border border-gray-100 bg-gray-50">
            <img src={image} alt={title} className="w-full max-h-[70vh] object-contain bg-white" />
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-sm text-gray-400">
            暂无原图
          </div>
        )}
      </div>
    </CenterDialog>
  );
}

// ========== BottomNav ==========

export const BottomNav = ({
  activeTab,
  onTabChange,
  elderMode,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  elderMode: boolean;
}) => {
  const tabs = [
    { id: 'home', label: '首页', icon: HomeIcon },
    { id: 'report', label: '报告', icon: BarChart2 },
    { id: 'consult', label: 'AI会诊', icon: Sparkles },
    { id: 'settings', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100/80 pb-safe z-50">
      <div className={cn('flex justify-around items-center', elderMode ? 'h-20' : 'h-16')}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center w-1/4 gap-1 transition-all',
                active ? 'text-indigo-600' : 'text-gray-400'
              )}
            >
              <tab.icon
                className={cn(
                  elderMode ? 'w-7 h-7' : 'w-5.5 h-5.5',
                  active && 'drop-shadow-[0_2px_4px_rgba(79,70,229,0.3)]'
                )}
                strokeWidth={active ? 2.4 : 1.8}
              />
              <span className={cn('font-semibold', elderMode ? 'text-sm' : 'text-xs')}>
                {tab.label}
              </span>
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 w-10 h-0.5 bg-indigo-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
