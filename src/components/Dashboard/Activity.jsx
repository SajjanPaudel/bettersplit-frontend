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

function Activity() {
  const [showModal, setShowModal] = useState(false);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('user'))?.username;
  const { theme, isDark } = useTheme();
  const [expandedRows, setExpandedRows] = useState(new Set());

  const fetchActivities = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.get(endpoints.activity, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      setActivities(response.data.data);
    } catch (err) {
      setError('Failed to fetch activities');
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
    <div className={`mb-8 bg-gradient-to-br rounded-2xl`}>
      <div className={`h-screen flex flex-col mb-10 rounded-2xl`}>
        <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 p-4 lg:p-8  backdrop-blur-md  sticky top-0 z-20`}>
          <div className="flex lg:flex-row sm:flex-row gap-4 w-max lg:w-auto">
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search activities..."
              className={`w-full lg:w-auto px-4 py-2 ${theme.input} ${theme.text} rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
            />
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors w-full lg:w-auto"
            >
              <FaPlus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className={`backdrop-blur-xl rounded-2xl border ${theme.border} shadow-2xl relative before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none`}>
            <div className="max-h-[80vh] overflow-y-auto rounded-2xl">
              <table className="w-full">
                <thead className={`sticky top-0 ${theme.card} z-10 whitespace-nowrap rounded-2xl`}>
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
                            className={`px-4 py-5 text-sm first:pl-8 last:pr-8 ${cell.column.id === 'name' ? `font-medium ${theme.text}` : theme.textSecondary
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
                          <td colSpan={columns.length} className="py-4 px-2 transition-all duration-500 ease-in-out transform origin-top">
                            <div className=" grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                                    <span className={`${theme.text}`}>{person} - {parseFloat(amount)}</span>
                                    {/* <span className={`${theme.textSecondary}`}>
                                      {parseFloat(amount).toFixed(2)}
                                    </span> */}
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
          </div>
        </div>
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
    </div>
  );
}

export default Activity;