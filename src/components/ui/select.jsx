export const Select = ({ children, className = "", ...props }) => (
  <select className={className} {...props}>
    {children}
  </select>
);

export const SelectContent = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

export const SelectItem = ({ children, value, className = "" }) => (
  <option value={value} className={className}>
    {children}
  </option>
);

export const SelectTrigger = ({ children, className = "", ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const SelectValue = ({ placeholder }) => <span>{placeholder}</span>;