import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { endpoints } from '../../config/api';
import { Link } from 'react-router-dom';

function SettlementHistory() {
  const { theme, isDark } = useTheme();
  const [settlements, setSettlements] = useState([]);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(13); // Default page size
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);
  const loggedInuser = JSON.parse(localStorage.getItem('user'))

  // Fetch settlements with pagination
  const fetchSettlements = async (newOffset = 0, append = false) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const params = { type: 'me', offset: newOffset, limit };
      const response = await axios.get(endpoints.settlementHistory, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params
      });
      const { data, total: apiTotal, limit: apiLimit, offset: apiOffset } = response.data;
      setTotal(apiTotal);
      setOffset(apiOffset + apiLimit);
      setHasMore(apiOffset + apiLimit < apiTotal);
      if (append) {
        setSettlements(prev => [...prev, ...data]);
      } else {
        setSettlements(data);
      }
    } catch (err) {
      setError('Failed to fetch settlement history');
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchSettlements(0, false).finally(() => setIsLoading(false));
    // eslint-disable-next-line
  }, []);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container || isLoading || isFetchingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        // Near bottom
        setIsFetchingMore(true);
        fetchSettlements(offset, true).finally(() => setIsFetchingMore(false));
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
    // eslint-disable-next-line
  }, [offset, isLoading, isFetchingMore, hasMore]);

  return (
    <div className="flex items-center h-full">
      <div className="flex flex-col flex-1">
        <div className={`lg:w-full md:w-full w-[98vw] p-4 rounded-xl shadow-md border ${theme.border} ${isDark ? ' bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 ' : 'bg-white'}`}>
          <div className="flex justify-between items-center">
            <h1 className={`lg:text-2xl md:text-2xl hidden md:block lg:block font-light ${theme.text}`}>Settlements</h1>
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search settlements..."
              className={`px-4 py-2 ${theme.input} ${theme.text} rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
            />
          </div>
        </div>
        {isLoading ? (
          <div className={`h-[calc(100vh-8rem)] mt-2 shadow-md border ${theme.border} overflow-y-auto no-scrollbar rounded-xl `}>
            <div className="flex flex-col gap-2 p-2">
              {[...Array(limit)].map((_, index) => (
                <div
                  key={index}
                  className={`border ${theme.border} flex items-center justify-between py-4 px-2 mb-1 rounded-lg shadow-md transition-transform transform hover:scale-[1.01] ${isDark ? 'bg-gray-900/50 hover:border-gray-800/50 hover:shadow-gray-600/5' : 'bg-white hover:shadow-gray-400/40'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${theme.text} bg-gray-300/40 rounded w-16 h-5 animate-pulse`}></span>
                    <FaArrowRight className="mx-2 text-gray-400" />
                    <span className={`font-semibold ${theme.text} bg-gray-300/40 rounded w-16 h-5 animate-pulse`}></span>
                  </div>
                  <div className="flex flex-col items-end min-w-[120px]">
                    <span className="bg-gray-300/40 rounded w-20 h-5 animate-pulse mb-1"></span>
                    <div className="flex items-center mt-1">
                      <FaCalendarAlt className={`${theme.textSecondary} text-md mr-1`} />
                      <span className={`bg-gray-300/40 rounded w-16 h-4 animate-pulse`}></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div ref={containerRef} className={`h-[calc(100vh-8rem)] mt-2 shadow-md border ${theme.border} overflow-y-auto no-scrollbar rounded-xl `}>
            <div className="">
              {settlements.length === 0 ? (
                <div className={`${theme.input} backdrop-blur-md  h-full dark:bg-black/10 rounded-3xl p-12 text-center border ${theme.border} flex flex-col items-center justify-center space-y-6`}>
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${theme.textSecondary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className={`text-2xl font-medium ${theme.textSecondary}`}>No Settlements Yet</div>
                  <p className={`text-sm ${theme.textSecondary} max-w-md`}>
                    Start by creating a group and adding expenses to track your shared payments and settlements
                  </p>
                  <Link to="/dashboard/add-expense" className={`p-2 bg-green-500 text-white rounded-2xl`}>
                    Go to Expenses →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 p-5">
                    {settlements.filter(s => {
                      if (!globalFilter) return true;
                      const filter = globalFilter.toLowerCase();
                      return (
                        (s.from_user && s.from_user.toLowerCase().includes(filter)) ||
                        (s.to_user && s.to_user.toLowerCase().includes(filter)) ||
                        (s.amount && String(s.amount).toLowerCase().includes(filter)) ||
                        (s.settled_at && new Date(s.settled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase().includes(filter))
                      );
                    }).map((settlement, idx) => (
                      <div
                        key={settlement.id || idx}
                        className={`group border ${theme.border} flex flex-col sm:flex-row sm:items-center justify-between py-4 px-4 mb-2 rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.005] hover:shadow-xl hover:border-purple-400/20 bg-gradient-to-br ${isDark ? 'from-gray-900/80 via-gray-900/60 to-gray-800/80' : 'from-white via-gray-50 to-green-50'} cursor-pointer`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 min-w-0 flex-1 w-full">
                          <div className="flex flex-row items-center min-w-[100px] sm:min-w-[120px] mb-2 sm:mb-0">
                            <span className={`font-semibold text-sm ${theme.text}`}>{new Date(settlement.settled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 w-full">
                            <span className={`font-semibold text-base truncate max-w-[90px] sm:max-w-[120px] ${theme.text}`}>{settlement.from_user}</span>
                            <FaArrowRight className="mx-2 text-green-400 text-xl shrink-0 hidden sm:inline" />
                            <FaArrowRight className="mx-1 text-green-400 text-base shrink-0 sm:hidden" />
                            <span className={`font-semibold text-base truncate max-w-[90px] sm:max-w-[120px] ${theme.text}`}>{settlement.to_user}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end min-w-[100px] sm:min-w-[120px] mt-2 sm:mt-0">
                          <span className={`font-extrabold text-lg sm:text-xl tracking-wide drop-shadow ${loggedInuser.username === settlement.from_user ? 'text-red-600' : 'text-green-600'}`}>NPR {parseFloat(settlement.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {isFetchingMore && (
                    <div className="py-4 text-center text-sm text-gray-500">Loading more...</div>
                  )}
                  {!hasMore && settlements.length > 0 && (
                    <div className="py-4 text-center text-xs text-gray-400">No more settlements</div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettlementHistory;