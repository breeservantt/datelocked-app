import Navbar from './components/Navbar';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './lib/AuthContext';

function AppContent() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      {user ? (
        <div style={{ padding: '24px' }}>
          <h2>Welcome to DateLocked</h2>
          <p>You are logged in as: {user.email}</p>
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
