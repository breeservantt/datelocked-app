import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#f3edf1]">
      <main>{children}</main>
    </div>
  );
}