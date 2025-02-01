import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaChartPie, FaHistory, FaPlus, FaExchangeAlt, FaSignOutAlt } from 'react-icons/fa';
import { useState } from 'react';

function DashboardLayout({ onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    onLogout();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login', { replace: true });
  };

  const location = useLocation();
  const currentPath = location.pathname.split('/')[2] || 'balance';

  return (
    <div className="flex h-screen bg-[#141417] p-4">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#ffffff0a] text-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative left-0 top-0 h-full w-64 bg-[#1A1A1F] text-gray-300 flex flex-col rounded-3xl mr-4 shadow-2xl border border-[#ffffff0a] transition-transform duration-300 ease-in-out z-40`}>
        {/* Logo Section */}
        <div className="p-5">
          <div className="flex items-center justify-center space-x-2 mb-12">
            <div className="text-white text-2xl">⬡</div>
            <div className="text-2xl font-light font-['Inter'] text-white">BetterSplit</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-6 flex-1">
          <Link
            to="balance"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${
              currentPath === 'balance'
                ? 'bg-[#ffffff14] backdrop-blur-xl text-white'
                : 'text-gray-400 hover:bg-[#ffffff0a] hover:text-white'
            }`}
          >
            <FaChartPie className="w-5 h-5" />
            <span className="font-['Inter'] font-light">Dashboard</span>
          </Link>

          <Link
            to="activity"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${
              currentPath === 'activity'
                ? 'bg-[#ffffff14] backdrop-blur-xl text-white'
                : 'text-gray-400 hover:bg-[#ffffff0a] hover:text-white'
            }`}
          >
            <FaHistory className="w-5 h-5" />
            <span className="font-['Inter'] font-light">Activity</span>
          </Link>

          <Link
            to="add-expense"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${
              currentPath === 'add-expense'
                ? 'bg-[#ffffff14] backdrop-blur-xl text-white'
                : 'text-gray-400 hover:bg-[#ffffff0a] hover:text-white'
            }`}
          >
            <FaPlus className="w-5 h-5" />
            <span className="font-['Inter'] font-light">Add Expense</span>
          </Link>

          <Link
            to="settlements"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${
              currentPath === 'settlements'
                ? 'bg-[#ffffff14] backdrop-blur-xl text-white'
                : 'text-gray-400 hover:bg-[#ffffff0a] hover:text-white'
            }`}
          >
            <FaExchangeAlt className="w-5 h-5" />
            <span className="font-['Inter'] font-light">Settlements</span>
          </Link>
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-[#ffffff1a] rounded-b-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="https://ui-avatars.com/api/?name=User&background=random"
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
              <div className="text-white font-light font-['Inter']">
                {JSON.parse(localStorage.getItem('user'))?.username || 'User'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <FaSignOutAlt className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden min-w-0">
        <Outlet />
      </div>

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;