import BottomNav from "./BottomNav";

export default function Layout({ children }) {
  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[#f3edf1] pb-24">
        {children}
      </div>
      <BottomNav />
    </>
  );
}