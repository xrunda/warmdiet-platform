/**
 * 医生端统一操作按钮组件
 * 用于统一管理退出登录、返回等按钮的样式和位置
 */

import React from 'react';
import { LogOut, ArrowLeft, X, type LucideIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { buttonStyles } from '../../styles/buttonStyles';

// ==================== 退出登录按钮 ====================

export function LogoutButton({ className = '', showLabel = true, fullWidth = false }: {
  className?: string;
  showLabel?: boolean;
  fullWidth?: boolean;
}) {
  const { logout } = useAuth();

  const defaultClassName = buttonStyles.logout.base;
  const finalClassName = [
    defaultClassName,
    fullWidth ? buttonStyles.logout.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      onClick={logout}
      className={finalClassName}
      aria-label="退出登录"
    >
      <LogOut className={buttonStyles.logout.iconSize} />
      {showLabel && <span>退出登录</span>}
    </button>
  );
}

// ==================== 返回按钮 ====================

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  icon?: LucideIcon;
  iconSize?: number;
}

export function BackButton({
  onClick,
  label = '返回',
  className = '',
  icon: Icon = ArrowLeft,
  iconSize = 16
}: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${buttonStyles.secondary.base} ${buttonStyles.secondary.light} ${className}`}
      aria-label={label}
    >
      <Icon style={{ width: iconSize, height: iconSize }} />
      {label}
    </button>
  );
}

// ==================== 关闭按钮（用于弹窗） ====================

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
  size?: number;
}

export function CloseButton({ onClick, className = '', size = 18 }: CloseButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`border-none bg-transparent cursor-pointer text-slate-400 hover:text-slate-600 transition-colors ${className}`}
      style={{ fontSize: size, lineHeight: 1, padding: 4 }}
      aria-label="关闭"
    >
      ✕
    </button>
  );
}

// ==================== 主要操作按钮 ====================

interface PrimaryButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'blue' | 'green';
  disabled?: boolean;
  loading?: boolean;
}

export function PrimaryButton({
  onClick,
  children,
  className = '',
  variant = 'blue',
  disabled = false,
  loading = false
}: PrimaryButtonProps) {
  const variantClass = buttonStyles.primary[variant];
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${buttonStyles.primary.base} ${variantClass} ${disabledClass} ${className}`}
    >
      {loading ? '处理中...' : children}
    </button>
  );
}

// ==================== 次要操作按钮 ====================

interface SecondaryButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
  disabled?: boolean;
}

export function SecondaryButton({
  onClick,
  children,
  className = '',
  variant = 'light',
  disabled = false
}: SecondaryButtonProps) {
  const variantClass = buttonStyles.secondary[variant];
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${buttonStyles.secondary.base} ${variantClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
}

// ==================== 文字按钮 ====================

interface TextButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'blue' | 'gray';
}

export function TextButton({
  onClick,
  children,
  className = '',
  variant = 'blue'
}: TextButtonProps) {
  const variantClass = buttonStyles.text[variant];

  return (
    <button
      onClick={onClick}
      className={`${buttonStyles.text.base} ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
}
