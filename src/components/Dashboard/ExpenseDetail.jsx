import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { endpoints } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { FiMoreVertical } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import EditExpenseModal from './EditExpenseModal';

function ExpenseDetail() {
    const { theme, isDark } = useTheme();
    const { activityId } = useParams();
    const navigate = useNavigate();
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const loggedInUser = JSON.parse(localStorage.getItem('user'));; // Adjust if your user info is stored differently

    // Move fetchActivityDetails outside useEffect so it can be called after edit
    const fetchActivityDetails = async () => {
        try {
            const accessToken = localStorage.getItem('access_token');
            const response = await axios.get(`${endpoints.expenses}${activityId}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            setActivity(response.data.data);
            // console.log(loggedInUser.username)
            // console.log(response.data.data)
        } catch (err) {
            setError('Failed to fetch activity details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchActivityDetails();
    }, [activityId]);
    if (error) return <div className={`${theme.text} p-4`}>{error}</div>;

    const getRandomColor = () => {
        const colors = ['#FF6384', '#36A2EB', '#4BC0C0', '#9966FF', '#A8E86F', '#FFCE56', '#FF9F40', '#FF5733', '#7FDBFF', '#87CEEB'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const PayerIcon = ({ name }) => {
        const bgColor = getRandomColor();
        const textColor = bgColor === '#FFCE56' ? '#000000' : '#FFFFFF';
        
        return (
            <div className="items-center">
                <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: bgColor }}
                >
                    {name.toUpperCase()}
                </div>
            </div>
        );
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const accessToken = localStorage.getItem('access_token');
            await axios.delete(`${endpoints.expenses}${activityId}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            // Invalidate expenses queries here if using React Query, SWR, etc.
            // Example for React Query: queryClient.invalidateQueries(['expenses']);
            navigate(-1); // Go back after delete
            toast.success("successfully deleted expense")
        } catch (err) {
            if (err.response && err.response.status === 403) {
                toast.error('This expense is already referenced in a previous settlement, cannot delete');
                setDeleting(false);
                setShowDeleteModal(false)
            } else {
                setError('Failed to delete expense');
                setDeleting(false);
                setShowDeleteModal(false)
            }
            setDeleting(false);
        }
    };

    return (
        <div className="h-full flex items-center">
            {loading ? (
          <div className={`mb-4 flex-1 flex flex-col lg:h-[45vh] md:h-[45vh] h-[50vh] lg:p-4 md:p-4 rounded-2xl before:inset-0 before:bg-gradient-to-b before:from-white/[0.08] before:to-transparent shadow-md flex items-center justify-center`}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
            </div>
          </div>
        ) :(
            <div className={`${isDark ? ' bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-white'} shadow-md rounded-xl overflow-hidden h-[95vh] w-full p-4 shadow-md`}>
                {/* Combined Payer and Expense Details Card */}
                <div className={` ${isDark ? 'bg-[#ffffff08]': 'bg-gray-50 border' } rounded-lg mb-2 p-4`}>
                    <div className='flex justify-between items-center'>
                <button 
                    onClick={() => navigate(-1)}
                    className={` p-2 rounded-full hover:bg-purple-200  transition-colors ${theme.text}`}
                >
                    <FaArrowLeft className="w-10 h-4" />
                </button>
                {/* Three-dot menu for edit/delete */}
                {loggedInUser.username === activity.created_by &&(
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen((open) => !open)}
                            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                        >
                            <FiMoreVertical className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                        </button>
                        {menuOpen && (
                            <div className={`absolute right-0 mt-2 w-32 rounded-lg shadow-lg z-20 ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                                <button
                                    onClick={() => { setShowEditModal(true); setMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2 rounded-t-lg font-semibold transition-colors ${isDark ? 'text-blue-400 hover:bg-gray-800' : 'text-blue-700 hover:bg-blue-50'}`}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => { if (loggedInUser.username === activity.created_by) { setShowDeleteModal(true); setMenuOpen(false); } }}
                                    disabled={loggedInUser.username !== activity.created_by}
                                    className={`w-full text-left px-4 py-2 rounded-b-lg font-semibold transition-colors ${loggedInUser.username !== activity.created_by ? (isDark ? 'text-gray-500 bg-gray-900 cursor-not-allowed' : 'text-gray-400 bg-white cursor-not-allowed') : (isDark ? 'text-red-400 hover:bg-gray-800' : 'text-red-700 hover:bg-red-50')}`}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
                    </div>
                    <div className="flex flex-col items-center space-y-6">
                    <h1 className={`text-xl font-bold mb-2 text-center ${theme.text}`}>{activity.name}</h1>
                        {/* Redesigned Payer Section Start */}
                        <div className="flex flex-col items-center gap-2 mb-4">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold shadow-lg border-4 border-purple-300" style={{ backgroundColor: getRandomColor(), color: '#fff' }}>
                                    {activity.paid_by.charAt(0).toUpperCase()}
                                </div>
                                <span className="absolute bottom-0 right-0 bg-purple-500 text-white text-xs px-2 py-1 rounded-full shadow">Payer</span>
                            </div>
                            <span className={`mt-2 text-lg font-semibold ${theme.text}`}>{activity.paid_by}</span>
                            <span className={`text-sm mt-1 ${theme.textSecondary}`}>
                                Expense created by: <span className="font-medium">{activity.created_by}</span>
                            </span>
                        </div>
                        {/* Redesigned Payer Section End */}
                        <div className="w-full border-t border-gray-500/20 pt-6">
                            <div className="grid grid-cols-3 gap-6 mx-auto max-w-2xl">
                                <div className="text-center">
                                    <p className={`${theme.textSecondary} mb-2`}>Amount</p>
                                    <p className={`text-xl font-bold ${theme.text}`}>{activity.amount} NPR</p>
                                </div>
                                <div className="text-center">
                                    <p className={`${theme.textSecondary} mb-2`}>Date</p>
                                    <p className={`text-xl font-bold ${theme.text}`}>
                                        {new Date(activity.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className={`${theme.textSecondary} mb-2`}>Group</p>
                                    <p className={`text-xl font-bold ${theme.text}`}>{activity.group_name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Splits Section */}
                <div className={`${isDark ? 'bg-[#ffffff08]': 'bg-gray-50 border ' }  rounded-xl text-center max-h-[50vh] overflow-auto no-scrollbar relative`}>
                    <div className={`text-xl font-bold mb-4 ${theme.text} ${isDark ? 'bg-[#111827]': 'bg-gray-200' } sticky top-0  backdrop-blur-md z-10 pt-4 pb-2 border-t border-gray-500/40 rounded-xl`}>Individual expenses</div>
                    <div className="space-y-3 pb-4">
                        {Object.entries(activity.splits).map(([user, amount]) => (
                            <div 
                                key={user} 
                                className={`flex justify-between items-center p-4 px-10 rounded-lg ${theme.cardHover} transition-transform transform hover:scale-[1.01]`}
                            >
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: getRandomColor() }}
                                    >
                                        {user.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`${theme.text}`}>{user}</span>
                                </div>
                                <span className={`${theme.text} font-semibold`}>
                                    {amount} NPR
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className={`rounded-xl p-8 shadow-lg w-full max-w-md ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}` }>
              <h2 className="text-lg font-bold mb-4">Confirm Deletion</h2>
              <p className="mb-6">Are you sure you want to delete this expense? This action cannot be undone.</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
        {showEditModal && (
          <EditExpenseModal
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              fetchActivityDetails();
            }}
            initialExpense={activity}
            activityId={activityId}
          />
        )}
        </div>
    );
}

export default ExpenseDetail;