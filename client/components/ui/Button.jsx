import React from "react";

/**
 * 汎用ボタンコンポーネント
 */
export default function Button({ 
  children, 
  icon, 
  onClick, 
  variant = "primary", 
  size = "default",
  disabled = false,
  fullWidth = false, 
  className = "",
  ...props
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  // バリアント別スタイル
  const variantClasses = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500",
    secondary: "bg-slate-600 hover:bg-slate-700 text-white focus:ring-slate-500",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-500"
  };
  
  // サイズ別スタイル
  const sizeClasses = {
    sm: "text-sm px-3 py-1.5 gap-1.5",
    default: "text-base px-4 py-2.5 gap-2",
    lg: "text-lg px-5 py-3 gap-3",
    icon: "p-2.5" // アイコンのみ
  };
  
  const disabledClasses = disabled 
    ? "opacity-50 cursor-not-allowed pointer-events-none" 
    : "";
  
  const widthClasses = fullWidth ? "w-full" : "";
  
  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.default}
    ${disabledClasses}
    ${widthClasses}
    ${className}
  `;

  return (
    <button
      className={combinedClasses.trim()}
      onClick={onClick}
      disabled={disabled}
      type="button"
      {...props}
    >
      {icon && <span className={children ? "flex-shrink-0" : ""}>{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}