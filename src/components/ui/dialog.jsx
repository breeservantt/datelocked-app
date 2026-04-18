export const Dialog = ({ children }) => <div>{children}</div>;

export const DialogContent = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

export const DialogHeader = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

export const DialogTitle = ({ children, className = "" }) => (
  <h2 className={className}>{children}</h2>
);

export const DialogDescription = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

export const DialogTrigger = ({ children, className = "", ...props }) => (
  <button className={className} {...props}>
    {children}
  </button>
);