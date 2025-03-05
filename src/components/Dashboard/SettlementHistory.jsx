import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
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
  const { theme } = useTheme();
  const [settlements, setSettlements] = useState([]);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get(endpoints.settlementHistory, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        setSettlements(response.data.data);
      } catch (err) {
        setError('Failed to fetch settlement history');
      } finally {
        setIsLoading(false); // Set loading to false when done
      }
    };
    fetchSettlements();
  }, []);

  const columns = useMemo(
    () => [
        {
            header: 'Date',
            accessorKey: 'settled_at',
            cell: ({ row }) => new Date(row.original.settled_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
          },
      {
        header: 'From',
        accessorKey: 'from_user',
      },
      {
        header: 'To',
        accessorKey: 'to_user',
      },
      {
        header: 'Amount',
        accessorKey: 'amount',
        cell: ({ row }) => `₹${parseFloat(row.original.amount).toFixed(2)}`,
      },
    ],
    []
  );

  const table = useReactTable({
    data: settlements, // Only take first 10 items
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="max-w-[1400px] mx-auto">
      {isLoading ? (
        <div className="flex flex-col w-full items-center justify-center min-h-screen gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className={`md:text-2xl lg:text-2xl text-lg font-light ${theme.text} pl-12 lg:pl-0 p-6 ` }>Settlements</h1>
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search settlements..."
              className={`px-4 py-2 ${theme.input} ${theme.text} rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
            />
          </div>

          <div className={` backdrop-blur-xl rounded-2xl border ${theme.border} overflow-hidden h-[calc(100vh-180px)]`}>
            <div className="overflow-y-auto h-full">
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
              <table className="w-full">
                <thead className={`sticky top-0 ${theme.card} z-10`}>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className={`px-6 py-5 text-left text-sm font-semibold ${theme.textSecondary} tracking-wider first:pl-8 last:pr-8`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className={`divide-y ${theme.border}`}>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className={`${theme.cardHover} transition-colors`}>
                      {row.getVisibleCells().map(cell => (
                        <td 
                          key={cell.id} 
                          className={`px-6 py-5 text-sm first:pl-8 last:pr-8 ${
                            cell.column.id === 'amount' ? `font-medium ${theme.text}` : theme.textSecondary
                          }`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SettlementHistory;