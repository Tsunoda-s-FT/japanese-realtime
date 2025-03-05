import React, { forwardRef } from "react";

/**
 * テキスト入力フィールドコンポーネント
 */
const TextInput = forwardRef(({ 
  value, 
  onChange, 
  placeholder = "", 
  disabled = false, 
  onKeyDown,
  className = "",
  ...props 
}, ref) => {
  return (
    <input
      ref={ref}
      type="text"
      className={`
        w-full px-4 py-3 
        border border-slate-300 rounded-full 
        text-slate-800 placeholder-slate-400
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:opacity-60 disabled:bg-slate-50
        ${className}
      `}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onKeyDown={onKeyDown}
      {...props}
    />
  );
});

TextInput.displayName = "TextInput";

export default TextInput;