export default function StatusBadge({ status = "", className = "" }) {
  return <span className={className}>{status}</span>;
}