import React from "react";

export default function Button({
  children,
  variant = "primary", // primary, secondary, danger, ghost, icon, small
  type = "button",
  onClick,
  disabled = false,
  className = "",
  title = "",
  style = {},
  ...props
}) {
  const baseStyle = "inline-flex items-center justify-center font-semibold transition-all duration-200 outline-none select-none cursor-pointer focus:ring-2 focus:ring-indigo-150 active:scale-98 hover:-translate-y-0.5 hover:shadow-sm";
  
  let variantStyle = "";

  if (variant === "primary") {
    variantStyle = "h-[44px] min-w-[140px] px-6 rounded-xl text-[15px] bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent shadow-xs";
  } else if (variant === "secondary") {
    variantStyle = "h-[44px] min-w-[140px] px-6 rounded-xl text-[15px] bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50/50";
  } else if (variant === "danger") {
    variantStyle = "h-[44px] min-w-[140px] px-6 rounded-xl text-[15px] bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-xs";
  } else if (variant === "ghost") {
    variantStyle = "bg-transparent text-gray-600 border border-transparent hover:bg-gray-50/50";
  } else if (variant === "icon") {
    variantStyle = "h-[44px] w-[44px] rounded-xl bg-transparent border border-gray-300 hover:bg-gray-50/50 hover:scale-105";
  } else if (variant === "small") {
    variantStyle = "h-[32px] px-3 rounded-lg text-xs bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50/50";
  }

  const disabledStyle = disabled ? "opacity-50 cursor-not-allowed pointer-events-none active:scale-100 hover:translate-y-0 hover:shadow-none" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={style}
      className={`${baseStyle} ${variantStyle} ${disabledStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
