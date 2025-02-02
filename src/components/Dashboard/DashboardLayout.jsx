import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaChartPie, FaHistory, FaPlus, FaExchangeAlt, FaSignOutAlt } from 'react-icons/fa';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

function DashboardLayout({ onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.split('/').pop();
  const { isDark, toggleTheme, theme } = useTheme();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className={`flex h-screen ${isDark ? theme.background : 'bg-gray-50/80'} p-4`}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl ${theme.input} ${theme.text}`}
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
      <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative left-0 top-0 h-full w-64 ${theme.card} ${theme.textSecondary} flex flex-col rounded-3xl mr-4 shadow-2xl border ${theme.border} transition-transform duration-300 ease-in-out z-40 before:bg-gradient-to-b before:from-white/[0.08] before:to-transparent backdrop-blur-md bg-white/10 dark:bg-black/10`}>
        {/* Logo Section */}
        <div className="p-5">
          <div className="flex items-center justify-center space-x-2 mb-12">
            <div className={theme.text}>⬡</div>
            <div className={`text-2xl font-light font-['Inter'] ${theme.text}`}>BetterSplit</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-6 flex-1">
          <Link
            to="balance"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${
              currentPath === 'balance'
                ? `bg-[#ffffff14] backdrop-blur-xl ${theme.text}`
                : `${theme.textSecondary} hover:bg-[#ffffff0a] hover:${theme.text}`
            }`}
          >
            <FaChartPie className="w-5 h-5" />
            <span className="font-['Inter'] font-light">Dashboard</span>
          </Link>

          <Link
            to="activity"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${
              currentPath === 'activity'
                ? `bg-[#ffffff14] backdrop-blur-xl ${theme.text}`
                : `${theme.textSecondary} hover:bg-[#ffffff0a] hover:${theme.text}`
            }`}
          >
            <FaHistory className="w-5 h-5" />
            <span className="font-['Inter'] font-light">Activity</span>
          </Link>

          {/* Apply same pattern to other links */}
          <Link
            to="add-expense"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${
              currentPath === 'add-expense'
                ? `bg-[#ffffff14] backdrop-blur-xl ${theme.text}`
                : `${theme.textSecondary} hover:bg-[#ffffff0a] hover:${theme.text}`
            }`}
          >
            <FaPlus className="w-5 h-5" />
            <span className="font-['Inter'] font-light">Add Expense</span>
          </Link>

          <Link
            to="settlements"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${
              currentPath === 'settlements'
                ? `bg-[#ffffff14] backdrop-blur-xl ${theme.text}`
                : `${theme.textSecondary} hover:bg-[#ffffff0a] hover:${theme.text}`
            }`}
          >
            <FaExchangeAlt className="w-5 h-5" />
            <span className="font-['Inter'] font-light">Settlements</span>
          </Link>
        </nav>

        {/* Theme Toggle */}
        <div className="px-6 mb-4 flex items-center justify-between">
          <span className={`font-['Inter'] font-light ${theme.text}`}>
            {isDark ? ' Turn Light mode': 'Turn Dark mode' }
          </span>
          <button
            onClick={toggleTheme}
            className={`w-16 h-8 rounded-full relative transition-all duration-300 ${isDark ? 'bg-[#1A1A1F]' : 'bg-gray-200'} border ${theme.border}`}
          >
            <div className={`absolute inset-0 flex items-center ${isDark ? 'justify-start' : 'justify-end'} px-2`}>
              {isDark ? (
                <FaMoon className={`w-4 h-4 ${theme.text}`} />
              ) : (
                <FaSun className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_3px_rgba(234,179,8,0.3)]" />
              )}
            </div>
            <div 
              className={`absolute w-6 h-6 rounded-full bg-white transform transition-transform duration-300 top-1 ${
                isDark ? 'translate-x-9' : 'translate-x-1'
              }`} 
            />
          </button>
        </div>

        {/* Profile Section */}
        <div className={`p-4 border-t ${theme.border} rounded-b-3xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="https://ui-avatars.com/api/?name=User&background=random"
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
              <div className={`font-light font-['Inter'] ${theme.text}`}>
                {JSON.parse(localStorage.getItem('user'))?.username || 'User'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`${theme.textSecondary} hover:${theme.text} transition-colors p-2`}
            >
              <FaSignOutAlt className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden min-w-0">
        <Outlet />
      </div>

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;