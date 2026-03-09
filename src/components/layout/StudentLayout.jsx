import BottomNav from './BottomNav';

const StudentLayout = ({ children, showNav = true }) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans', sans-serif" }}>
      <main className={`flex-1 ${showNav ? 'pb-20 md:pb-0' : ''}`}>{children}</main>

      {showNav && <BottomNav />}
    </div>
  );
};

export default StudentLayout;
