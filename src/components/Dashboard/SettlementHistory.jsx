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

function SettlementHistory() {
  const { theme } = useTheme();
  const [settlements, setSettlements] = useState([]);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get('http://127.0.0.1:8000/api/split/expenses/settlements_history', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        setSettlements(response.data.data);
      } catch (err) {
        setError('Failed to fetch settlement history');
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
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-light ${theme.text} pl-12 lg:pl-0`}>Settlement History</h1>
        <input
          type="text"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Search settlements..."
          className={`px-4 py-2 ${theme.input} ${theme.text} rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
        />
      </div>

      <div className={`${theme.input} backdrop-blur-xl rounded-2xl border ${theme.border} overflow-hidden h-[calc(100vh-180px)]`}>
        <div className="overflow-y-auto h-full">
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
        </div>
      </div>
    </div>
  );
}

export default SettlementHistory;