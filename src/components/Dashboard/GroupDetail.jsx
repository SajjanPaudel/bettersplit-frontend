import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { endpoints } from '../../config/api';
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';

function GroupDetail() {
    const { id } = useParams();
    const { theme } = useTheme();
    const [group, setGroup] = useState({ members: [], expenses: [] });
    const [error, setError] = useState('');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('user'))?.username;
    const [activities, setActivities] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expandedRows, setExpandedRows] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
        fetchGroupDetails();
    }, [id]);

    const toggleRow = (rowId) => {
        setExpandedRows(prev => {
            const newExpandedRows = new Set();
            if (!prev.has(rowId)) {
                newExpandedRows.add(rowId);
            }
            return newExpandedRows;
        });
    };

    const loggedInUser = JSON.parse(localStorage.getItem('user'));

    const calculateOwed = (expense) => {
        if (expense.paid_by === currentUser) {
            return Object.entries(expense.splits)
                .reduce((total, [user, amount]) => {
                    if (user !== currentUser) {
                        return total + parseFloat(amount);
                    }
                    return total;
                }, 0);
        }
        return -parseFloat(expense.splits[currentUser] || 0);
    };

    const fetchGroupDetails = async () => {
        try {
            const accessToken = localStorage.getItem('access_token');
            const response = await axios.get(`${endpoints.groups}${id}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            setGroup(response.data.data);
        } catch (err) {
            setError('Failed to fetch group details');
        }
    };

    const handleSearch = async (email) => {
        if (!email) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const accessToken = localStorage.getItem('access_token');
            const response = await axios.get(`${endpoints.userSearch}?email=${email}&group_id=${id}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            setSearchResults(response.data.data);
            setError('');
        } catch (err) {
            setError('Failed to search users');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddMember = async (userEmail) => {
        try {
            const accessToken = localStorage.getItem('access_token');
            await axios.post(`${endpoints.groups}${id}/add_member/`, {
                email: userEmail
            }, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            setSearchEmail('');
            setSearchResults([]);
            setShowAddMemberModal(false);
            fetchGroupDetails();
            toast.success(`${userEmail} added successfully`);
        } catch (err) {
            toast.error(`Failed to add ${userEmail}`);
        }
    };

    const handleRemoveMember = async (userName) => {
        try {
            const accessToken = localStorage.getItem('access_token');
            await axios.post(`${endpoints.groups}${id}/remove_member/`, {
                username: userName
            }, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            fetchGroupDetails();
            toast.success(`${userName} removed from the group successfully`);
        } catch (err) {
            toast.error(`Failed to remove ${userName}`);
        }
    };

    const handleDeleteGroup = async () => {
        try {
            const accessToken = localStorage.getItem('access_token');
            await axios.delete(`${endpoints.groups}${id}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            toast.success('Group deleted successfully');
            navigate('/dashboard/groups');
        } catch (err) {
            toast.error('Failed to delete group');
        }
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
        data: group.expenses || [], // Use expenses from group data
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
    });



    // Remove the error state and error display from JSX since we're using toast now
    // Update the onClick handler in the search results
    {
        searchResults.map(user => (
            <div
                key={user.id}
                onClick={() => handleAddMember(user.id, user.email)}
                className={`p-4 flex items-center justify-between cursor-pointer ${theme.cardHover}`}
            >
                <div className={`${theme.text}`}>{user.username}</div>
                <div className={`text-sm ${theme.textSecondary}`}>{user.email}</div>
            </div>
        ))
    }

    // Update the Add Member Modal JSX
    if (!group) return (
        <div className={`${theme.card} rounded-2xl border ${theme.border} w-full my-4 lg:my-0 shadow-2xl p-6`}>
            <div className={`${theme.text}`}>Loading...</div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className={`${theme.card} rounded-2xl border ${theme.border} w-full my-4 lg:my-0 shadow-2xl`}>
                <div className="p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6">
                        {/* Left side: Heading */}
                        <h1 className={`text-2xl font-light ${theme.text}`}>{group.name}</h1>

                        {/* Right side: Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowAddMemberModal(true)}
                                className="px-4 py-2.5 text-white rounded-xl bg-green-500 hover:bg-green-600 transition-all"
                            >
                                Add Member
                            </button>
                            {group.created_by === loggedInUser.username && (
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-4 py-2.5 text-white rounded-xl bg-red-500 hover:bg-red-600 transition-all"
                                >
                                    Delete Group
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={`${theme.input} backdrop-blur-xl rounded-2xl border ${theme.inputBorder} p-6`}>
                        <h3 className={`${theme.text} text-xl font-medium mb-4`}>Members</h3>
                        <div className="flex flex-wrap gap-2">
                            {group.members.map(member => (
                                <span
                                    key={member.id}
                                    className={`px-3 py-1.5 rounded-lg text-sm text-white bg-green-500 hover:bg-green-600 flex items-center gap-2`}
                                >
                                    {member.username}
                                    {group.created_by === loggedInUser.username && (
                                        <>
                                            <FaTimes
                                                className="w-3 h-3 border rounded-full cursor-pointer hover:text-red-400 transition-colors"
                                                onClick={() => setShowRemoveMemberModal(member.username)}
                                            />
                                            {showRemoveMemberModal === member.username && (
                                                <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
                                                    <div className={`${theme.card} backdrop-blur-md  p-8 rounded-2xl shadow-xl max-w-md w-full border ${theme.border}`}>
                                                        <h3 className={`text-xl font-light ${theme.text} mb-6`}>Remove Member</h3>
                                                        <p className={`${theme.textSecondary} mb-6`}>
                                                            Are you sure you want to remove {member.username} from the group?
                                                        </p>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    handleRemoveMember(member.username);
                                                                    setShowRemoveMemberModal(null);
                                                                }}
                                                                className="flex-1 px-4 py-2.5 text-white rounded-xl bg-red-500 hover:bg-red-600 transition-all"
                                                            >
                                                                Remove
                                                            </button>
                                                            <button
                                                                onClick={() => setShowRemoveMemberModal(null)}
                                                                className={`flex-1 px-4 py-2.5 border bg-gray-600 text-white hover:bg-gray-700 ${theme.border} rounded-xl ${theme.textSecondary} transition-colors`}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`${theme.card} backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-md w-full border ${theme.border}`}>
                        <h3 className={`text-xl font-light ${theme.text} mb-6`}>Add Member</h3>
                        {error && (
                            <div className="bg-[#ff000014] backdrop-blur-xl border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
                                {error}
                            </div>
                        )}
                        <div className="mb-6 flex gap-2">
                            <input
                                type="email"
                                placeholder="Search by email"
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                className={`flex-1 ${theme.input} ${theme.text} px-4 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
                            />
                            <button
                                onClick={() => handleSearch(searchEmail)}
                                className="px-6 py-3 text-white rounded-xl bg-purple-500 hover:bg-purple-600 transition-all"
                            >
                                Search
                            </button>
                        </div>

                        {isSearching && (
                            <div className={`text-sm ${theme.textSecondary} text-center mb-4`}>
                                Searching...
                            </div>
                        )}

                        {searchResults.length > 0 && (
                            <div className={`max-h-60 overflow-y-auto mb-6 divide-y ${theme.divider}`}>
                                {searchResults.map(user => (
                                    <div
                                        key={user.email}
                                        onClick={() => handleAddMember(user.email)}
                                        className={`p-4 flex items-center justify-between cursor-pointer ${theme.cardHover}`}
                                    >
                                        <div className={theme.text}>{user.username}</div>
                                        <div className={`text-sm ${theme.textSecondary}`}>{user.email}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setShowAddMemberModal(false);
                                setSearchEmail('');
                                setSearchResults([]);
                            }}
                            className={`w-full px-4 py-2 border ${theme.border} rounded-lg ${theme.textSecondary} ${theme.cardHover} transition-colors`}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}


            {showDeleteModal && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`${theme.card} backdrop-blur-md  p-8 rounded-2xl shadow-xl max-w-md w-full border ${theme.border}`}>
                        <h3 className={`text-xl font-semibold ${theme.text} mb-6`}>Delete Group</h3>
                        <p className={`${theme.textSecondary} mb-6`}>
                            Are you sure you want to delete this group? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteGroup}
                                className="flex-1 px-4 py-2.5 text-white rounded-xl bg-red-500 hover:bg-red-600 transition-all"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className={`flex-1 px-4 py-2.5 border ${theme.border} rounded-xl ${theme.textSecondary} ${theme.cardHover} transition-colors`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className='p-4'>
                <h1 className={`${theme.text}`}>Group expenses</h1>
            </div>
            <div className="flex-1 h-[30vh] md:h-[40vh] overflow-hidden">
                <div className={`backdrop-blur-xl rounded-2xl border ${theme.border} shadow-2xl relative before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none`}>
                    <div className="max-h-[500px] overflow-y-auto rounded-2xl">
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
        </div>



    );
}

export default GroupDetail;