import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    const result = await logout();

    if (!result.success) {
      alert(result.error?.message || 'Logout failed.');
    }
  };

  return (
    <header style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      <h1>DateLocked</h1>

      {user ? (
        <button onClick={handleLogout}>
          Logout
        </button>
      ) : (
        <span>Not logged in</span>
      )}
    </header>
  );
}
