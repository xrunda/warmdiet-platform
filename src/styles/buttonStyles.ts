/**
 * 医生端统一按钮样式配置
 * 用于集中管理各种按钮的样式，方便统一调整
 */

export const buttonStyles = {
  /**
   * 退出登录按钮样式（侧边栏底部）
   */
  logout: {
    base: 'flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-rose-300/20 hover:bg-rose-400/10 hover:text-white',
    fullWidth: 'w-full',
    iconSize: 'h-[18px] w-[18px]',
  },

  /**
   * 主要操作按钮样式
   */
  primary: {
    base: 'flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
    blue: 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-[0_12px_30px_rgba(6,182,212,0.35)] hover:shadow-[0_16px_40px_rgba(6,182,212,0.45)] hover:scale-[1.02]',
    green: 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.35)] hover:shadow-[0_16px_40px_rgba(16,185,129,0.45)] hover:scale-[1.02]',
  },

  /**
   * 次要操作按钮样式
   */
  secondary: {
    base: 'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200',
    light: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]',
    dark: 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-white/20 hover:bg-slate-800/50 hover:shadow-[0_4px_12px_rgba(2,6,23,0.3)]',
  },

  /**
   * 文字按钮样式
   */
  text: {
    base: 'flex items-center gap-2 px-2 py-1.5 text-sm font-medium transition-all duration-200',
    blue: 'text-cyan-400 hover:text-cyan-300',
    gray: 'text-slate-400 hover:text-slate-300',
  },
} as const;

/**
 * 返回按钮样式（页面顶部）
 */
export const backButtonStyle = {
  base: 'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200',
  light: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]',
  dark: 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-white/20 hover:bg-slate-800/50 hover:shadow-[0_4px_12px_rgba(2,6,23,0.3)]',
};
