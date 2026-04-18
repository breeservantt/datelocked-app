export const Progress = ({ value = 0, className = "" }) => (
  <div className={className}>
    <div style={{ width: `${value}%` }} />
  </div>
);