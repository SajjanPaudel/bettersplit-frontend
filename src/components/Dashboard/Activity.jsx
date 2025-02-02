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

function Activity() {
  const [showModal, setShowModal] = useState(false);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('user'))?.username;
  const { theme, isDark } = useTheme();

  const fetchActivities = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8000/api/split/expenses/activity/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      setActivities(response.data.data);
    } catch (err) {
      setError('Failed to fetch activities');
    }
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
        header: 'Description',
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
        header: 'Split Details',
        cell: ({ row }) => (
          <div className="space-y-2 min-w-[200px]">
            {Object.entries(row.original.splits).map(([person, amount], index) => {
              // Array of pleasing background colors
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
                  className="flex items-center gap-3"
                >
                  <span className={`px-3 py-1 rounded-full ${bgColors[colorIndex]} border ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {person}
                  </span>
                  <span className={theme.textSecondary}>|</span>
                  <span className={`px-3 py-1 ${theme.textSecondary}`}>
                    Rs {parseFloat(amount).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        ),
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
    <div className={`mb-2 pt-1`}>
      <div className={`h-screen flex flex-col ${
        isDark 
          ? 'from-black via-blue-900 to-gray-900' 
          : 'from-white via-blue-100 to-blue-50'
      } -z-10 `}>
        <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 p-4 lg:p-8 ${isDark ? theme.background : 'bg-gray-50/80'} sticky top-0 z-20 `}>
          {/* <h1 className={`text-2xl pl-12 lg:pl-0 ${theme.text}`}>Activity</h1> */}
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
  
        <div className="flex-1 overflow-hidden px-4 lg:px-8">
          <div className={`${theme.card} backdrop-blur-xl rounded-2xl border ${theme.border} h-full shadow-2xl relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent before:rounded-2xl before:pointer-events-none`}>
            <div className="overflow-y-auto h-full rounded-2xl">
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
                <tbody className={`divide-y ${theme.border} whitespace-nowrap`}>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className={`${theme.cardHover} transition-colors`}>
                      {row.getVisibleCells().map(cell => (
                        <td 
                          key={cell.id} 
                          className={`px-4 py-5 text-sm first:pl-8 last:pr-8 ${
                            cell.column.id === 'name' ? `font-medium ${theme.text}` : theme.textSecondary
                          }`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
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