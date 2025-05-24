import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { endpoints } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

function ExpenseDetail() {
    const { theme, isDark } = useTheme();
    const { activityId } = useParams();
    const navigate = useNavigate();
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchActivityDetails = async () => {
            try {
                const accessToken = localStorage.getItem('access_token');
                const response = await axios.get(`${endpoints.expenses}${activityId}/`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                setActivity(response.data.data);
            } catch (err) {
                setError('Failed to fetch activity details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

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

    return (
        <div className="h-full flex items-center">
            {loading ? (
          <div className={`mb-4 flex-1 flex flex-col lg:h-[45vh] md:h-[45vh] h-[50vh] lg:p-4 md:p-4 rounded-2xl before:inset-0 before:bg-gradient-to-b before:from-white/[0.08] before:to-transparent shadow-md flex items-center justify-center`}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
              {/* <p className={`text-sm ${theme.textSecondary}`}>Loading settlements...</p> */}
            </div>
          </div>
        ) :(
            <div className={`${isDark ? ' bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-white'} shadow-md rounded-xl overflow-hidden h-[95vh] w-full p-4 shadow-md`}>
                {/* Combined Payer and Expense Details Card */}
                <div className={` ${isDark ? 'bg-[#ffffff08]': 'bg-gray-50 border' } rounded-lg mb-2 p-4`}>
                <button 
                    onClick={() => navigate(-1)}
                    className={` p-2 rounded-full hover:bg-purple-200  transition-colors ${theme.text}`}
                >
                    <FaArrowLeft className="w-10 h-4" />
                </button>
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
                                    <p className={`text-xl font-bold ${theme.text}`}>{activity.group}</p>
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
        </div>
    );
}

export default ExpenseDetail;