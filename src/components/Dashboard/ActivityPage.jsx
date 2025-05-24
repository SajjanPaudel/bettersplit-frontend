import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { endpoints } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { FaTshirt, FaGift, FaPizzaSlice,FaCalendarAlt, FaHamburger, FaCoffee, FaIceCream, FaCheese } from 'react-icons/fa';

function ActivityPage() {
  const { theme, isDark } = useTheme();
  const [activities, setActivities] = useState([]);
  const [dateRange, setDateRange] = useState([
    new Date(new Date().setDate(new Date().getDate() - 30)), // Start date: 7 days ago
    new Date() // End date: today
  ]);
  const [startDate, endDate] = dateRange;
  const navigate = useNavigate();
  const loggedInUser = JSON.parse(localStorage.getItem('user'))?.username; // Retrieve logged-in user

  const fetchActivities = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const params = {};

      // Use startDate and endDate from dateRange
      const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
      const end = endDate || new Date();

      // params.start_date = start.toISOString().split('T')[0];
      // params.end_date = end.toISOString().split('T')[0];

      const response = await axios.get(endpoints.activity, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: {
          type : 'me',
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0],
        }
      });

      // Filter activities where the logged-in user is either the payer or a payee
      const filteredActivities = response.data.data

      setActivities(filteredActivities);
    } catch (err) {
      console.error('Failed to fetch activities', err);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [startDate, endDate]); // Ensure useEffect depends on startDate and endDate

  const getActivityIcon = (category) => {

    const foodIcons = [
      <FaPizzaSlice className="text-2xl sm:text-xl" />,
      <FaHamburger className="text-2xl sm:text-xl" />,
      <FaCoffee className="text-2xl sm:text-xl" />,
      <FaIceCream className="text-2xl sm:text-xl" />,
      <FaCheese className="text-2xl sm:text-xl" />,
    ];

    const randomIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)];

    switch (category) {
      case 'Clothes & Fashion':
        return <FaTshirt className="text-2xl sm:text-xl" />;
      case 'Gift':
        return <FaGift className="text-2xl sm:text-xl" />;
      case 'Food':
        return randomIcon;
      default:
        return <FaTshirt className="text-2xl sm:text-xl" />;
    }
  };

  const handleActivityClick = (activityId) => {
      navigate(`/dashboard/expense/${activityId}`);
  };

  const calculateAmount = (activity) => {
    if (activity.paid_by === loggedInUser) {
      // Calculate total amount to be received
      return Object.entries(activity.splits)
        .reduce((total, [user, amount]) => {
          if (user !== loggedInUser) {
            return total + parseFloat(amount);
          }
          return total;
        }, 0);
    } else if (activity.paid_for.includes(loggedInUser)) {
      // Show the split amount the logged-in user owes
      return -parseFloat(activity.splits[loggedInUser] || 0);
    }
    return 0;
  };

  const UserIcon = ({ user }) => {
    let randomColor;
    do {
      randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    } while (randomColor.toLowerCase() === '#000000'); // Ensure the color is not black

    const getContrastColor = (bgColor) => {
      const r = parseInt(bgColor.slice(1, 3), 16);
      const g = parseInt(bgColor.slice(3, 5), 16);
      const b = parseInt(bgColor.slice(5, 7), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? 'black' : 'white';
    };

    const textColor = getContrastColor(randomColor);
    const firstName = user.split(/[_\s]/)[0].toUpperCase(); // Split by underscore or space and take the first word

    return (
      <div className="relative group hidden sm:block">
        <div className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] transition-all duration-500 ease-in-out transform group-hover:w-auto p-1" style={{ backgroundColor: randomColor, color: textColor }}>
          <span className="group-hover:hidden transition-opacity duration-500">{user.charAt(0).toUpperCase()}</span>
          <span className="hidden group-hover:inline ml-1 uppercase transition-opacity duration-500">{firstName}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex items-center">
      <div className={`${isDark ? ' bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-white'} shadow-md rounded-xl overflow-hidden h-[95vh] w-full p-2 shadow-md`}>
        <div className="flex justify-end lg:mr-7 ">
          <h1 className={`text-2xl ${theme.text} hidden sm:block ml-10 mr-auto mt-2 pb-2 `}>Latest Transactions</h1>
        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={(update) => setDateRange(update)}
          placeholderText="Select Date Range"
          className={`${theme.input} text-${theme.color} px-4 py-2 rounded-xl border ${theme.border} focus:outline-none w-[14rem]`} // Ensure width is controlled
          popperPlacement="bottom-start"
        />
      </div>
      <div className="overflow-y-auto max-h-[90vh] no-scrollbar pb-5">
        {activities.map(activity => {
          const amount = calculateAmount(activity);
          return (
            <div
              key={activity.id}
              className={` border ${theme.border} flex items-center mx-auto justify-between lg:w-[95%] py-4 px-2 mb-2 rounded-lg shadow-md cursor-pointer transition-transform transform hover:scale-[1.002]  ${isDark ? 'bg-gray-900/50 hover:border-gray-800/50 hover:shadow-gray-600/5' : 'bg-white hover:shadow-gray-400/40'}`}
              onClick={() => handleActivityClick(activity.id)}
            >
              <div className="flex items-center">
                <div className={`p-4 ${isDark ? 'text-gray-400 border-purple-500/30' : 'text-purple-500'} border rounded-xl mr-4`}>
                  {getActivityIcon('Food')}
                </div>
                <div>
                  <h2 className={`lg:text-lg md:text-lg text-base font-bold ${theme.text}`}>{activity.name}</h2>
                  <div className={`md:text-sm lg:text-sm sm:text-xs ${theme.textSecondary} flex items-center`}>
                    {activity.group}
                    <div className="flex ml-2">
                      {activity.paid_for.map(user => (
                        <UserIcon key={user} user={user} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className={`lg:text-lg md:text-lg text-base font-bold ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {amount >= 0 ? '+' : ''}{Math.abs(amount).toFixed(2)} NPR
                </p>
                <div className="flex items-right justify-center">
                  <FaCalendarAlt className={`${theme.textSecondary} text-md ml-auto mr-1 hidden sm:block`} />
                  <p className={`${theme.textSecondary} text-sm `}>
                  {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

export default ActivityPage;