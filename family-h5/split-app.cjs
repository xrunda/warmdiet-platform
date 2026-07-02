const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const appFile = path.join(srcDir, 'App.tsx');
const lines = fs.readFileSync(appFile, 'utf-8').split('\n');

function extract(start, end) {
  // start is 1-based line number 
  return lines.slice(start - 1, end).join('\n');
}

// ========== components/sheets.tsx ==========
const sheetsImports = `import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Droplets,
  Edit2,
  Eye,
  FileText,
  Heart,
  MessageSquare,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
  Stethoscope,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '../lib/utils';
import { BottomSheet, CenterDialog, LoadingSpinner } from './ui';
import {
  FOOD_LIBRARY,
  fileToDataUrl,
  getVitalTone,
  formatMeasuredTime,
  formatDateLabel,
  formatChatTimestamp,
  translateFoodName,
} from '../utils';
import type { VitalSummary, VitalSummaryItem } from '../types/app';
import {
  createMeal,
  addHealthCondition,
  removeHealthCondition,
  addMedication as addMedicationApi,
  recognizeMedicationImage,
  updateMedication as updateMedicationApi,
  removeMedication as removeMedicationApi,
  updatePreferences as updatePreferencesApi,
  createMedicalOrder as createMedicalOrderApi,
  updateMedicalOrder as updateMedicalOrderApi,
  scanMedicalOrderImage,
  fetchVitalMeasurements,
  fetchTimeline,
} from '../api';
`;

// Extract each sheet component body (without the function signature line)
// MealEntrySheet: 577-766
// NoteEntrySheet: 768-853  
// ShareReportDialog: 855-908
// WeeklyViewSheet: 909-963
// AddMedicationSheet: 964-1196
// AddConditionSheet: 1197-1307
// EditPreferencesSheet: 1308-1422
// EditMedicalOrderSheet: 1423-1597
// VitalSignsSheet: 1598-1841

const sheetsBody = extract(577, 1841);
// RecordSheet: 4374-end
const recordSheetBody = extract(4374, lines.length);

const sheetsContent = sheetsImports + '\n' +
  'export ' + sheetsBody + '\n\n' +
  'export ' + recordSheetBody;

fs.writeFileSync(path.join(srcDir, 'components', 'sheets.tsx'), sheetsContent);
console.log('✅ components/sheets.tsx');

// ========== screens/HomeScreen.tsx ==========
const homeImports = `import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  BellRing,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Droplets,
  Eye,
  FileText,
  Heart,
  MessageSquare,
  Mic,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '../lib/utils';
import { BottomSheet, CenterDialog, LoadingSpinner } from '../components/ui';
import { WeeklyViewSheet, VitalSignsSheet } from '../components/sheets';
import {
  MEAL_SCHEDULES,
  formatTrendDay,
  formatDateLabel,
  formatChatTimestamp,
  formatMeasuredTime,
  formatMealRecordTime,
  parseMealTimeStamp,
  getVitalTone,
  mapApiMealToMeal,
} from '../utils';
import type { Meal, AlertItem, VitalSummary, VitalSummaryItem } from '../types/app';
import { ChatMessage } from '../types';
import {
  fetchDashboard,
  fetchTimeline,
} from '../api';
`;

const homeBody = extract(1844, 2449);
const homeContent = homeImports + '\n' + 'export ' + homeBody;
fs.mkdirSync(path.join(srcDir, 'screens'), { recursive: true });
fs.writeFileSync(path.join(srcDir, 'screens', 'HomeScreen.tsx'), homeContent);
console.log('✅ screens/HomeScreen.tsx');

// ========== screens/LogScreen.tsx ==========
const logImports = `import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Droplets,
  Heart,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LoadingSpinner } from '../components/ui';
import {
  formatDateLabel,
  formatChatTimestamp,
  translateFoodName,
} from '../utils';
import { fetchTimeline } from '../api';
`;

const logBody = extract(2451, 2815);
const logContent = logImports + '\n' + 'export ' + logBody;
fs.writeFileSync(path.join(srcDir, 'screens', 'LogScreen.tsx'), logContent);
console.log('✅ screens/LogScreen.tsx');

// ========== screens/SettingsScreen.tsx ==========
const settingsImports = `import React, { useEffect, useState, useRef } from 'react';
import {
  ChevronRight,
  Edit2,
  Eye,
  Heart,
  History,
  MessageSquare,
  Pill,
  Plus,
  Stethoscope,
  Utensils,
  X,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Check,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LoadingSpinner, ImagePreviewDialog } from '../components/ui';
import {
  AddMedicationSheet,
  AddConditionSheet,
  EditPreferencesSheet,
  EditMedicalOrderSheet,
} from '../components/sheets';
import { AuthorizationManagement } from '../AuthorizationManagement';
import {
  fetchPatientProfile,
  fetchHealthConditions,
  fetchMedications,
  fetchPreferences,
  fetchMedicalOrders,
  removeHealthCondition,
} from '../api';
`;

const settingsBody = extract(2817, 3213);
const settingsContent = settingsImports + '\n' + 'export ' + settingsBody;
fs.writeFileSync(path.join(srcDir, 'screens', 'SettingsScreen.tsx'), settingsContent);
console.log('✅ screens/SettingsScreen.tsx');

// ========== screens/ReportScreen.tsx ==========
const reportImports = `import React, { useEffect, useState } from 'react';
import {
  BarChart2,
  Calendar,
  FileText,
  History,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '../lib/utils';
import { LoadingSpinner } from '../components/ui';
import { formatTrendDay } from '../utils';
import type { TomorrowMealOption } from '../types/app';
import {
  fetchLatestHealthReport,
  fetchTomorrowMealGuide,
} from '../api';
`;

const reportBody = extract(3215, 3540);
const reportContent = reportImports + '\n' + 'export ' + reportBody;
fs.writeFileSync(path.join(srcDir, 'screens', 'ReportScreen.tsx'), reportContent);
console.log('✅ screens/ReportScreen.tsx');

// ========== screens/ConsultScreen.tsx ==========
const consultImports = `import React, { useCallback, useEffect, useState, useRef } from 'react';
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
`;

// ConsultScreen includes the _consult module-level vars (3549-3553)
const consultVars = extract(3549, 3553);
const consultScreenBody = extract(3554, 4232);
const consultContent = consultImports + '\n' + consultVars + '\n\nexport ' + consultScreenBody;
fs.writeFileSync(path.join(srcDir, 'screens', 'ConsultScreen.tsx'), consultContent);
console.log('✅ screens/ConsultScreen.tsx');

// ========== Rewrite App.tsx ==========
const newApp = `import React, { useEffect, useState } from 'react';
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
`;

fs.writeFileSync(appFile, newApp);
console.log('✅ App.tsx (rewritten as thin shell)');

console.log('\\n🎉 Split complete! All files created.');
