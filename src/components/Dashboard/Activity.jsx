import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaPlus } from 'react-icons/fa';
import AddExpenseModal from './AddExpenseModal';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useTheme } from '../../context/ThemeContext';
import { endpoints } from '../../config/api';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function Activity() {
  const [showModal, setShowModal] = useState(false);
  const [activities, setActivities] = useState([]);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('user'))?.username;
  const { theme, isDark } = useTheme();
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.get(endpoints.activity, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      setActivities(response.data.data);
    } catch (err) {
      setError('Failed to fetch activities');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRow = (rowId) => {
    setExpandedRows(prev => {
      const newExpandedRows = new Set();
      if (!prev.has(rowId)) {
        newExpandedRows.add(rowId);
      }
      return newExpandedRows;
    });
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get(endpoints.groups, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        setGroups(response.data.data);
      } catch (err) {
        setError('Failed to fetch users');
      }
    };
    fetchGroups();
  }, []);

  const calculateOwed = (activity) => {
    if (activity.paid_by === currentUser) {
      return Object.entries(activity.splits)
        .reduce((total, [user, amount]) => {
          if (user !== currentUser) {
            return total + parseFloat(amount);
          }
          return total;
        }, 0);
    }
    return -parseFloat(activity.splits[currentUser] || 0);
  };

  const columns = useMemo(
    () => [
      {
        header: 'Date',
        accessorFn: row => new Date(row.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
      },
      {
        header: 'Place',
        accessorKey: 'name',
      },
      {
        header: 'Amount',
        accessorFn: row => `Rs ${parseFloat(row.amount).toFixed(2)}`,
      },
      {
        header: 'Paid By',
        accessorKey: 'paid_by',
      },
      {
        header: 'You are owed',
        cell: ({ row }) => {
          const amount = calculateOwed(row.original);
          return (
            <span className={amount >= 0 ? 'text-green-600' : 'text-red-600'}>
              Rs {Math.abs(amount).toFixed(2)}
              {amount >= 0 ? ' (to receive)' : ' (to pay)'}
            </span>
          );
        },
      },
    ],
    [currentUser]
  );

  // Remove the slice from table initialization
  const table = useReactTable({
    data: activities, // Show all activities instead of just 5
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="min-h-screen flex flex-col sm:p-2 md:p-4 lg:p-6">
      <div className="flex flex-col flex-1">
        {/* Header Section */}
        <div className={`flex flex-col gap-4 p-4 backdrop-blur-md sticky top-0 z-20 rounded-xl ${theme.card}`}>
          {/* Mobile view */}
          <div className="flex flex-col justify-end  items-end gap-4 sm:hidden w-full">
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search activities..."
              className={`w-50 px-4 py-3 ${theme.input} ${theme.text} rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
            />

            {groups.length > 0 ? (
              <Link
                to="/dashboard/add-expense"
                className={`w-full px-6 py-3 rounded-xl text-sm transition-all whitespace-nowrap ${isDark
                  ? "bg-green-500/30 text-green-200 hover:bg-green-500/40"
                  : "bg-green-500/70 text-white hover:bg-green-500/30"
                  }`}
              >
                Add
              </Link>
            ) : (
              <button
                disabled
                title="Create a group before adding Expense"
                className="w-full px-6 py-3 rounded-xl text-sm transition-all whitespace-nowrap bg-green-500/30 cursor-not-allowed text-white"
              >
                Add
              </button>
            )}
          </div>

          {/* Desktop view */}
          <div className="sm:flex hidden flex-row items-start justify-start w-full gap-4">
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search activities..."
              className={`w-64 h-[2.75rem] px-4 ${theme.input} ${theme.text} rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
            />


            {groups.length > 0 ? (
              <Link
                to="/dashboard/add-expense"
                className={`w-max px-6 py-3 rounded-xl text-sm transition-all whitespace-nowrap bg-green-500 text-white hover:bg-green-600 `}
              >
                Add
              </Link>
            ) : (
              <button
                disabled
                title="Create a group before adding Expense"
                className="w-full px-6 py-3 rounded-xl text-sm transition-all whitespace-nowrap bg-green-500/30 cursor-not-allowed text-white"
              >
                Add
              </button>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className={`mb-4 flex-1 flex flex-col lg:h-[45vh] md:h-[45vh] h-[50vh] lg:p-4 md:p-4 rounded-2xl before:inset-0 before:bg-gradient-to-b before:from-white/[0.08] before:to-transparent shadow-md flex items-center justify-center`}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
              {/* <p className={`text-sm ${theme.textSecondary}`}>Loading settlements...</p> */}
            </div>
          </div>
        ) : (
          <div className="mt-6 flex-1 ">
            <div className="md:h-[80vh] lg:h-[80vh] h-[70dvh] shadow-2xl overflow-y-auto rounded-2xl">
              {activities.length === 0 ? (
                <div className={`${theme.input} p-8 sm:p-12 text-center min-h-[50vh] flex flex-col items-center justify-center`}>
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${theme.textSecondary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className={`text-2xl font-medium ${theme.textSecondary}`}>Looks like there's no activities</div>
                  <p className={`text-sm ${theme.textSecondary} max-w-md`}>
                    Start by creating a group and adding expenses to track your shared payments and settlements
                  </p>
                  <Link to="/dashboard/add-expense" className={`p-2 bg-green-500 text-white rounded-2xl`}>
                    Go to Expenses →
                  </Link>
                </div>
              ) : (
                <div className="relative h-full">
                  <table className="w-full min-w-[800px]">
                    <thead className={`sticky top-0 ${theme.card} z-10 backdrop-blur-xl`}>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th
                              key={header.id}
                              className={`px-4 py-5 text-left text-sm font-semibold ${theme.textSecondary} tracking-wider first:pl-8 last:pr-8`}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className={`divide-y ${theme.border}`}>
                      {table.getRowModel().rows.map(row => (
                        <>
                          <tr
                            key={row.id}
                            className={`${theme.cardHover} transition-colors cursor-pointer`}
                            onClick={() => toggleRow(row.id)}
                          >
                            {row.getVisibleCells().map((cell, index) => (
                              <td
                                key={cell.id}
                                className={`px-4 py-4 text-sm first:pl-6 last:pr-6 ${cell.column.id === 'name' ? `font-medium ${theme.text}` : theme.textSecondary
                                  }`}
                              >
                                {index === 0 && (
                                  <span className="inline-block mr-5">
                                    {expandedRows.has(row.id) ? (
                                      <FaChevronUp className={`${theme.textSecondary}`} />
                                    ) : (
                                      <FaChevronDown className={`${theme.textSecondary}`} />
                                    )}
                                  </span>
                                )}
                                {cell.column.id !== 'Split Details' && flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                          {expandedRows.has(row.id) && (
                            <tr>
                              <td colSpan={columns.length} className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-2">
                                  {Object.entries(row.original.splits).map(([person, amount], index) => {
                                    const bgColors = [
                                      'bg-blue-500/10 border-blue-500/20',
                                      'bg-purple-500/10 border-purple-500/20',
                                      'bg-green-500/10 border-green-500/20',
                                      'bg-orange-500/10 border-orange-500/20',
                                      'bg-pink-500/10 border-pink-500/20'
                                    ];
                                    const colorIndex = index % bgColors.length;
                                    return (
                                      <div
                                        key={person}
                                        className={`px-4 py-3 rounded-xl ${bgColors[colorIndex]} border flex justify-between items-center`}
                                      >
                                        <span className={`${theme.text}`}>{person} - {parseFloat(amount).toFixed(2)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AddExpenseModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchActivities();
          }}
        />
      )}
    </div>
  );
}

export default Activity;