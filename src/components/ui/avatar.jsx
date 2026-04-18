export const Avatar = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

export const AvatarImage = ({ src }) => <img src={src} alt="" />;

export const AvatarFallback = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);