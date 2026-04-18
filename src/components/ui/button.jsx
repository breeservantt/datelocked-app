export const Button = ({ children, className = "", ...props }) => (
  <button className={className} {...props}>
    {children}
  </button>
);