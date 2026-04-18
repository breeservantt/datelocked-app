export const Checkbox = ({ checked = false, className = "", ...props }) => (
  <input
    type="checkbox"
    checked={checked}
    className={className}
    {...props}
  />
);