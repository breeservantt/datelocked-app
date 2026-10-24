export const Badge = ({ children, className = "", variant = "default" }) => (
  <span className={className} data-variant={variant}>
    {children}
  </span>
);