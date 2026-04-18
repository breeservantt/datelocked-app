import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex flex-wrap gap-4 p-4 bg-gray-900 text-white">
      <Link to="/">Home</Link>
      <Link to="/chat">Chat</Link>
      <Link to="/memories">Memories</Link>
      <Link to="/goals">Goals</Link>
      <Link to="/dating">Dating</Link>
      <Link to="/nightin">NightIn</Link>
      <Link to="/verify-status">Verify Status</Link>
      <Link to="/settings">Settings</Link>
      <Link to="/login">Login</Link>
    </nav>
  );
}