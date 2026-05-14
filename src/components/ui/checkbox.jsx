import React from "react";

export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  className = "",
  id,
}) {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onCheckedChange?.(!checked);
      }}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white transition ${
        checked ? "border-rose-500 bg-rose-500" : ""
      } ${disabled ? "opacity-50" : ""} ${className}`}
    >
      {checked ? (
        <span className="h-2 w-2 rounded-sm bg-white" />
      ) : null}
    </button>
  );
}

export default Checkbox;