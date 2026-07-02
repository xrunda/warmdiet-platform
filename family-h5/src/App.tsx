import React, { useEffect, useState } from 'react';
import {
  Edit2,
  FileText,
  Plus,
  Share2,
  Utensils,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { BottomNav } from './components/ui';
import { MealEntrySheet, NoteEntrySheet, ShareReportDialog, RecordSheet } from './components/sheets';
import { HomeScreen } from './screens/HomeScreen';
import { LogScreen } from './screens/LogScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ReportScreen } from './screens/ReportScreen';
import { ConsultScreen } from './screens/ConsultScreen';
import { LoginPage } from './LoginPage';
import { isLoggedIn } from './api';
import { subscribeToAuthExpired } from './authSession';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [elderMode, setElderMode] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showMealEntry, setShowMealEntry] = useState(false);
  const [showNoteEntry, setShowNoteEntry] = useState(false);
  const [showShareReport, setShowShareReport] = useState(false);
  const [showRecordSheet, setShowRecordSheet] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setLoading(false);
  }, []);

  useEffect(() => subscribeToAuthExpired(() => setLoggedIn(false)), []);

  const handleLoginSuccess = () => {
    setLoggedIn(true);
  };

  const handleLogout = () => {
    import('./api').then(({ logout }) => {
      logout();
      setLoggedIn(false);
    });
  };

  useEffect(() => {
    document.documentElement.style.fontSize = elderMode ? '17px' : '16px';
    return () => { document.documentElement.style.fontSize = '16px'; };
  }, [elderMode]);

  useEffect(() => { setShowQuickActions(false); }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-3">加载中...</p>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={cn('h-screen flex flex-col overflow-hidden bg-brand-bg font-sans', elderMode && 'elder-mode')}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {activeTab === 'home' && (
            <HomeScreen
              onTabChange={setActiveTab}
              elderMode={elderMode}
              onOpenElderMode={() => setElderMode((p) => !p)}
              onOpenRecordSheet={() => setShowRecordSheet(true)}
            />
          )}
          {activeTab === 'report' && <ReportScreen />}
          {activeTab === 'consult' && <ConsultScreen />}
          {activeTab === 'settings' && <SettingsScreen elderMode={elderMode} onElderModeChange={setElderMode} onLogout={handleLogout} />}
        </motion.div>
      </AnimatePresence>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} elderMode={elderMode} />

      {/* FAB */}
      {activeTab === 'home' && (
        <>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setShowQuickActions((p) => !p)}
            className={cn(
              'fixed right-5 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-200/50 z-50 active:scale-90 transition-transform',
              elderMode ? 'bottom-28 p-5' : 'bottom-24 p-4'
            )}
          >
            <Plus className={cn('w-6 h-6 transition-transform duration-200', showQuickActions && 'rotate-45')} />
          </motion.button>

          <AnimatePresence>
            {showQuickActions && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setShowQuickActions(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.97 }}
                  className={cn('fixed right-5 z-50 w-56', elderMode ? 'bottom-52' : 'bottom-44')}
                >
                  <div className="bg-white border border-gray-100 rounded-[22px] shadow-2xl shadow-gray-200/50 p-2 space-y-1">
                    {[
                      { icon: Utensils, label: '手动补录饮食', action: () => { setShowQuickActions(false); setShowMealEntry(true); } },
                      { icon: Edit2, label: '添加特殊备注', action: () => { setShowQuickActions(false); setShowNoteEntry(true); } },
                      { icon: Share2, label: '分享报告给家人', action: () => { setShowQuickActions(false); setShowShareReport(true); } },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-800 hover:bg-indigo-50 transition-colors text-left"
                      >
                        <item.icon className="w-4 h-4 text-indigo-500" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Global Modals */}
      <MealEntrySheet open={showMealEntry} onClose={() => setShowMealEntry(false)} />
      <NoteEntrySheet open={showNoteEntry} onClose={() => setShowNoteEntry(false)} />
      <ShareReportDialog open={showShareReport} onClose={() => setShowShareReport(false)} />
      <RecordSheet open={showRecordSheet} onClose={() => setShowRecordSheet(false)} />
    </div>
  );
}
