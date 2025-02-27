import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
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
    onLogout(false);
    navigate('/login');
  };

  return (
    <div className={`flex h-screen bg-gradient-to-br ${isDark
      ? 'from-black via-gray-900 to-gray-800'
      : 'from-white via-purple-100 to-purple-50'
      } px-4`}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`lg:hidden fixed top-4 z-50 p-2 rounded-xl flex items-center justify-center ${theme.input} ${theme.text}`}
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
      <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative left-0 top-0 h-full w-64 ${theme.textSecondary} flex flex-col rounded-3xl mr-4 shadow-2xl border ${theme.border} transition-transform duration-300 ease-in-out z-40 before:bg-gradient-to-b before:from-white/[0.08] before:to-transparent backdrop-blur-md `}>
        {/* Logo Section */}
        <div className="p-5">
          <div className="flex items-center justify-center space-x-2 lg:mb-12 md:mb-12 lg:mt-4 md:mt-4 mb-5 mt-10">
            <div className="text-2xl relative flex flex-col">
              <div className="flex">
                <span className={`${theme.text}`}>BETTER</span>
                <span className="text-purple-500 font-bold">SPLIT</span>
              </div>
              <div className="flex -mt-1 opacity-60 blur-[1px] transform -skew-x-5">
                <span className="text-purple-500 font-bold">SPLIT</span>
                <span className={`${theme.text}`}>BETTER</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={`px-6 flex-1 ${theme.text}`}>

        <Link
            to="dashboard"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${currentPath === 'dashboard'
              ? `bg-purple-800 text-white backdrop-blur-xl ${theme.text}`
              : `hover:bg-purple-400/30 hover:text-white hover:backdrop-blur-xl hover:${theme.text}`
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <span className="font-['Inter'] font-light">Dashboard V2</span>
          </Link>

          {/* <Link
            to="balance"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${currentPath === 'balance'
              ? `bg-purple-800 text-white backdrop-blur-xl `
              : `hover:bg-purple-400/30 hover:text-white hover:backdrop-blur-xl`
              }`}
          >
            <FaChartPie className="w-5 h-5" />
            <span className={`font-['Inter'] `}>Dashboard</span>
          </Link> */}

          <Link
            to="activity"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${currentPath === 'activity'
              ? `bg-purple-800 text-white backdrop-blur-xl ${theme.text}`
              : `hover:bg-purple-400/30 hover:text-white hover:backdrop-blur-xl hover:${theme.text}`
              }`}
          >
            <FaHistory className="w-5 h-5" />
            <span className="font-['Inter'] font-light">Activity</span>
          </Link>

          {/* Apply same pattern to other links */}
          <Link
            to="add-expense"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${currentPath === 'add-expense'
              ? `bg-purple-800 text-white backdrop-blur-xl ${theme.text}`
              : `hover:bg-purple-400/30 hover:text-white hover:backdrop-blur-xl hover:${theme.text}`
              }`}
          >
            <FaPlus className="w-5 h-5" />
            <span className="font-['Inter'] font-light">Add Expense</span>
          </Link>

          <Link
            to="settlements"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${currentPath === 'settlements'
              ? `bg-purple-800 text-white backdrop-blur-xl ${theme.text}`
              : `hover:bg-purple-400/30 hover:text-white hover:backdrop-blur-xl hover:${theme.text}`
              }`}
          >
            <FaExchangeAlt className="w-5 h-5" />
            <span className="font-['Inter'] font-light">Settlements</span>
          </Link>

          <Link
            to="groups"
            className={`flex items-center space-x-4 px-6 py-5 rounded-2xl mb-2 transition-all ${currentPath === 'groups'
              ? `bg-purple-800 text-white backdrop-blur-xl ${theme.text}`
              : `hover:bg-purple-400/30 hover:text-white hover:backdrop-blur-xl hover:${theme.text}`
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <span className="font-['Inter'] font-light">Groups</span>
          </Link>
        </nav>

        {/* Theme Toggle */}
        <div className="px-6 mb-4 flex items-center justify-between">
          <span className={`font-['Inter'] font-light ${theme.text}`}>
            {isDark ? ' Turn Light mode' : 'Turn Dark mode'}
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
              className={`absolute w-6 h-6 rounded-full bg-white transform transition-transform duration-300 top-1 ${isDark ? 'translate-x-9' : 'translate-x-1'
                }`}
            />
          </button>
        </div>

        {/* Profile Section */}
        <div className={`p-4 border-t ${theme.border} rounded-b-3xl`}>
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard/profile"
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                currentPath === 'profile' 
                  ? 'bg-purple-800 text-white backdrop-blur-xl'
                  : 'hover:bg-purple-400/30 hover:text-white hover:backdrop-blur-xl'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="font-['Inter'] font-light">{JSON.parse(localStorage.getItem('user'))?.username || 'User'}</span>
            </Link>
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
      <div className={`flex-1 overflow-hidden min-w-0 bg-gradient-to-br sm:p-2 md:p-4 lg:p-4`}>
        <Outlet />
      </div>

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;