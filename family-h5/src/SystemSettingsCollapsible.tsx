import React, { useState } from 'react';
import {
  Settings,
  Eye,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { AuthorizationManagement } from './AuthorizationManagement';

interface SystemSettingsCollapsibleProps {
  elderMode: boolean;
  onElderModeChange: (value: boolean) => void;
  isSpeakerBound: boolean;
  setIsSpeakerBound: (value: boolean) => void;
}

export const SystemSettingsCollapsible = ({
  elderMode,
  onElderModeChange,
  isSpeakerBound,
  setIsSpeakerBound,
}: SystemSettingsCollapsibleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-base text-gray-800">系统设置</h2>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-text-sub" />
        </motion.div>
      </button>

      {/* Content - Expandable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* 老人阅读模式 */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-main">老人阅读模式</h3>
                      <p className="text-xs text-text-sub mt-0.5">
                        放大字体、增大行距
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onElderModeChange(!elderMode)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      elderMode
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-200 text-text-sub hover:bg-gray-300"
                    )}
                  >
                    {elderMode ? "已开启" : "去开启"}
                  </button>
                </div>
              </div>

              {/* 设备绑定 */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-main">小爱音箱</h3>
                      <p className={cn(
                        "text-xs mt-0.5",
                        isSpeakerBound ? "text-brand-green font-bold" : "text-text-hint"
                      )}>
                        {isSpeakerBound ? "● 已连接 (客厅音箱)" : "未绑定设备"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSpeakerBound(!isSpeakerBound)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      isSpeakerBound
                        ? "bg-gray-200 text-text-sub hover:bg-gray-300"
                        : "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                    )}
                  >
                    {isSpeakerBound ? "解除绑定" : "立即绑定"}
                  </button>
                </div>
              </div>

              {/* 授权管理 */}
              <AuthorizationManagement />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};