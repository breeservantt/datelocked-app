export const Tabs = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

export const TabsList = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

export const TabsTrigger = ({ children, className = "", ...props }) => (
  <button className={className} {...props}>
    {children}
  </button>
);

export const TabsContent = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);