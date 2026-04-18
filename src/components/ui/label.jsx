export const Label = ({ children, className = "", ...props }) => (
  <label className={className} {...props}>
    {children}
  </label>
);