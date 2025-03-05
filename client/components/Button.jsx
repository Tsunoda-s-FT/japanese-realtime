export default function Button({ 
  icon, 
  children, 
  onClick, 
  className = "", 
  disabled = false 
}) {
  return (
    <button
      className={`text-white rounded-full p-3 min-h-12 min-w-12 flex items-center justify-center gap-1 hover:opacity-90 active:opacity-80 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {icon}
      {children && <span className="ml-1 mr-1">{children}</span>}
    </button>
  );
}
