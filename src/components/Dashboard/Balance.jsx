import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { endpoints } from '../../config/api';
import { FaUser, FaUsers, FaCalendar } from 'react-icons/fa';
import { FaChevronDown } from 'react-icons/fa';
import { Menu } from '@headlessui/react';
import { QRCodeSVG } from 'qrcode.react';
import { IoNotificationsOutline } from "react-icons/io5";
import { FaTimes } from 'react-icons/fa';

// Add these imports at the top
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CgSpinner } from "react-icons/cg";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Balance() {
  const { theme, isDark } = useTheme();
  const [balances, setBalances] = useState(null);
  const [allAccounts, setAllAccounts] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('this-month');
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  // Update the default value
  const [calculationType, setCalculationType] = useState('combined'); // Changed default to combined
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [editAmount, setEditAmount] = useState(0);
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const [showOnlyMine, setShowOnlyMine] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics'); // Add this line
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Format: YYYY-MM
  const [recipientAccount, setRecipientAccount] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);



  // Add this effect to close dropdown when clicking outside
  useEffect(() => {
    const closeDropdown = (e) => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [isOpen]);

  // Add this state
  const [dailyExpenses, setDailyExpenses] = useState([]);

  // Modify the fetchBalances function to also fetch activities
  const fetchBalances = async () => {
    try {
      setIsLoading(true);
      const accessToken = localStorage.getItem('access_token');

      // Add date filter variables
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      // Fetch both balances and activities
      const [balancesResponse, activitiesResponse] = await Promise.all([
        axios.get(`${endpoints.balances}?type=${calculationType}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        axios.get(endpoints.activity, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ]);

      setBalances(balancesResponse.data.data.balances);
      setAllAccounts(balancesResponse.data.data.accounts);
      setSettlements(balancesResponse.data.data.settlements);

      // Process activities into daily expenses
      // Add new state for month filter

      // Modify the activities processing in fetchBalances
      const activities = activitiesResponse.data.data;
      const filteredActivities = activities.filter(activity => {
        const activityDate = new Date(activity.date);

        switch (dateRange) {
          case 'this-month':
            return activityDate >= firstDayOfMonth;
          case 'last-month':
            return activityDate >= firstDayOfLastMonth && activityDate <= lastDayOfLastMonth;
          case 'all-time':
            return true;
          default:
            return true;
        }
      });

      // First, modify the dailyTotals reduction to include expense names
      const dailyTotals = filteredActivities.reduce((acc, activity) => {
        const date = new Date(activity.date);
        const formattedDate = window.innerWidth < 768
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        if (!acc[formattedDate]) {
          acc[formattedDate] = {
            amount: 0,
            expenses: []
          };
        }

        let amount;
        if (showOnlyMine) {
          amount = activity.splits[loggedInUser.username] || 0;
        } else {
          amount = parseFloat(activity.amount);
        }

        acc[formattedDate].amount += parseFloat(amount);
        acc[formattedDate].expenses.push({
          name: activity.name,
          amount: showOnlyMine ? activity.splits[loggedInUser.username] : activity.amount
        });

        return acc;
      }, {});

      // Update the sorting to work with the new structure
      const sortedDailyExpenses = Object.entries(dailyTotals)
        .map(([date, data]) => ({
          date,
          amount: data.amount,
          expenses: data.expenses
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .reverse();

      setDailyExpenses(sortedDailyExpenses);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      fetchNotifications();
      setIsLoading(false);
    }
  };

  // Function to fetch recipient's accounts
  const fetchRecipientAccount = async (username) => {
    try {
      const accounts = allAccounts[username] || []; // Get accounts for the user, or empty array if not found
      const primaryAccount = accounts.find(acc => acc.is_primary);
      const firstAccount = primaryAccount ? { ...primaryAccount.account_details } : (accounts.length > 0 ? { ...accounts[0].account_details } : {});
      setRecipientAccount(firstAccount);
      console.log(firstAccount)
      // Pre-generate QR value
      if (firstAccount) {
        const qrData = JSON.stringify(firstAccount);
        setQrValue(qrData);
      }
    } catch (error) {
      console.error('Error fetching recipient account:', error);
    }
  };


  useEffect(() => {
    fetchBalances();
  }, [calculationType, showOnlyMine, dateRange]);
  // Update the handleSettle function to use editAmount
  const handleSettle = async () => {
    setIsSubmitting(true);
    try {
      const accessToken = localStorage.getItem('access_token');

      if (calculationType === 'individual') {
        // Handle individual settlement as before
        const response = await axios.post(endpoints.settlements, {
          from_user: selectedSettlement.from,
          to_user: selectedSettlement.to,
          amount: parseFloat(editAmount)
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.data.success) {
          await fetchBalances();
          setShowSettleModal(false);
          setSelectedSettlement(null);
          setEditAmount(0);
        }
      } else {
        // Handle combined settlement by processing individual settlements
        const settlementPromises = selectedSettlement.individual_settlements.map(settlement => {
          return axios.post(endpoints.settlements, {
            from_user: settlement.from,
            to_user: settlement.to,
            amount: parseFloat(settlement.amount)
          }, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
        });

        await Promise.all(settlementPromises);
        await fetchBalances();
        setShowSettleModal(false);
        setSelectedSettlement(null);
        setEditAmount(0);
      }
    } catch (err) {
      setError('Failed to process settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  //function to send settlement request
  const sendSettlementRequest = async () => {
    setIsSubmitting(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.post(endpoints.settlementRequest, {
        from_user: selectedSettlement.from,
        to_user: selectedSettlement.to,
        amount: parseFloat(editAmount)
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.data.success) {
        await fetchBalances();
        setShowSettleModal(false);
        setSelectedSettlement(null);
        setEditAmount(0);
      }
    } catch (err) {
      setError('Failed to send settlement request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.get(endpoints.notifications, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (showNotifications) {
      // fetchNotifications();
    }
  }, [showNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      setLoadingNotifications(prev => ({ ...prev, [notificationId]: true }));
      const accessToken = localStorage.getItem('access_token');
      await axios.post(endpoints.markRead(notificationId), {}, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setLoadingNotifications(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  // Update the amount section in the modal
  <div>
    <p className={`text-sm ${theme.textSecondary} font-['Inter'] mb-1`}>Amount</p>
    <input
      type="number"
      value={editAmount}
      onChange={(e) => setEditAmount(e.target.value)}
      className={`w-full ${theme.input} ${theme.text} px-4 py-2 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
      min="0"
      step="0.01"
      required
    />
  </div>

  // const calculateTotalPositiveNet = () => {
  //   if (!balances) return 0;
  //   return Object.values(balances)
  //     .reduce((total, user) => total + (user.net > 0 ? user.net : 0), 0);
  // };

  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!balances) return (
    <div className="flex flex-col w-full items-center justify-center min-h-screen gap-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400"></div>
      <h1 className="text-xl font-medium text-gray-600 dark:text-gray-300">
        Loading...
      </h1>
    </div>
  );

  return (
    <div className="max-w-full mx-auto relative">
      {/* Background Gradient */}
      <div className={`fixed inset-0 bg-gradient-to-br -z-10`} />
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 mb-2 pt-5">
        <h1 className={`text-2xl font-light ${theme.text} pl-12 lg:pl-0 hidden sm:block`}>Overview</h1>
        <div className="flex flex-row items-center justify-end gap-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <div className="relative inline-flex items-center" title="Toggle between your expenses and all expenses">
              <input
                id="show-mine-toggle"
                type="checkbox"
                checked={showOnlyMine}
                onChange={(e) => setShowOnlyMine(e.target.checked)}
                className="sr-only peer"
              />
              <label
                htmlFor="show-mine-toggle"
                className={`w-16 h-8 flex items-center rounded-full cursor-pointer relative
                  ${isDark ? 'bg-gray-700' : 'bg-gray-200'}
                  peer-checked:after:translate-x-8
                  after:content-[''] after:absolute after:top-1 after:left-1
                  after:bg-white after:rounded-full after:h-6 after:w-6
                  after:transition-all after:duration-300 ease-in-out
                  peer-checked:bg-purple-500`}
              >
                <FaUser className={`absolute left-2 text-xs ${showOnlyMine ? 'text-white' : 'text-gray-500'}`} />
                <FaUsers className={`absolute right-2 text-xs ${!showOnlyMine ? 'text-gray-500' : 'text-white'}`} />
              </label>
            </div>

            {/* Add Notifications Icon */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full hover:bg-purple-500/10 transition-colors relative`}
            >
              <IoNotificationsOutline className={`w-6 h-6 ${theme.text}`} />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
          </div>

          {/* Add Notifications Panel */}
          {showNotifications && (
            <div className="fixed inset-0 z-50 overflow-hidden" onClick={() => setShowNotifications(false)}>
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm">
                <div
                  className={`absolute right-4 top-16 w-80 md:w-96 lg:w-[30rem] rounded-2xl ${theme.card} border ${theme.border} shadow-xl`}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className={`text-lg font-medium ${theme.text}`}>Notifications</h3>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b ${theme.border} hover:bg-purple-500/10 cursor-pointer flex justify-between items-start`}
                        >
                          <div>
                            <p className={`${theme.text} text-sm`}>{notification.message}</p>
                            <span className={`${theme.textSecondary} text-xs`}>
                              {new Date(notification.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className={`p-1.5 rounded-full hover:bg-purple-500/10 transition-all ${theme.textSecondary} hover:text-purple-500`}
                            title="Mark as read"
                            disabled={loadingNotifications[notification.id]}
                          >
                            {loadingNotifications[notification.id] ? (
                              <CgSpinner className="w-4 h-4 animate-spin" />
                            ) : (
                              <FaTimes className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className={`p-8 text-center ${theme.textSecondary}`}>
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <div className="relative inline-block w-32">
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                  }}
                  className={`flex items-center justify-between w-full ${theme.input} backdrop-blur-xl border ${theme.inputBorder} rounded-2xl py-3 px-4 text-sm ${theme.text} focus:outline-none ${theme.inputFocus}`}
                >
                  {calculationType.charAt(0).toUpperCase() + calculationType.slice(1)}
                  <FaChevronDown className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className={`absolute mt-1 w-full rounded-xl border ${theme.border} ${theme.card} backdrop-blur-xl shadow-lg z-50`}>
                    {['combined', 'individual'].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setCalculationType(type);
                          setIsOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${theme.text} ${calculationType === type ? 'bg-purple-500/20' : ''} hover:bg-purple-500/10 transition-colors first:rounded-t-xl last:rounded-b-xl`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update the Overview Cards filter */}
      {/* Overview Cards */}
      {Object.entries(balances)
        .filter(([name, data]) => (!showOnlyMine || name === loggedInUser.username) && data.net !== 0)
        .length > 0 ? (
        <div className="grid gap-2 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 mb-6 max-h-[35vh] overflow-y-auto">
          {Object.entries(balances)
            .filter(([name, data]) => (!showOnlyMine || name === loggedInUser.username) && data.net !== 0)
            .map(([name, data]) => (
              <div
                key={name}
                className={`backdrop-blur-md bg-purple-900/5 rounded-2xl border ${theme.border} p-2 lg:p-4 md:p-4 relative before:absolute before:inset-0 t before:rounded-2xl before:pointer-events-none`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg ${theme.text} transition-colors`}>{name}</h3>
                  <div className={`px-2.5 py-1 rounded-lg text-xs ${data.net >= 0
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/20 text-red-600"
                    }`}>
                    {data.net >= 0 ? "To Receive" : "To Pay"}
                  </div>
                </div>

                <div className={`flex justify-between items-center ${theme.input} p-4 rounded-xl border-t ${theme.border}`}>

                  <div className="flex flex-col">
                    <div className={`text-base sm:text-lg md:text-xl font-medium ${data.net >= 0 ? "text-green-400" : "text-red-400"}`}>
                      <h3 className="text-sm sm:text-base md:text-lg whitespace-nowrap">
                        {data.net >= 0 ? "Total Receiveable" : "Total payable"}
                      </h3>
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl whitespace-nowrap">
                        Rs {Math.abs(data.net).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.net >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                    <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className={`${theme.input} backdrop-blur-md bg-white/10 dark:bg-black/10 rounded-2xl p-8 text-center border ${theme.border} mb-6`}>
          <div className={theme.textSecondary}>✨ You're all done!</div>
          <p className={`text-sm ${theme.textSecondary} mt-2`}>
            Go to <span className="text-purple-400">Expenses</span> to add new transactions
          </p>
        </div>
      )}

      {/* Settlements Section */}
      <div className={`mb-4 flex-1 flex flex-col ${showOnlyMine ? 'lg:h-[55vh] md:h-[45vh]' : 'lg:h-[40vh] md:h-[40vh]'
        } h-[45vh]`}>
        {/* Tabs */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${activeTab === 'metrics'
              ? `${theme.text} bg-purple-500/20`
              : `${theme.textSecondary} hover:bg-purple-500/10`
              }`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${activeTab === 'settlements'
              ? `${theme.text} bg-purple-500/20`
              : `${theme.textSecondary} hover:bg-purple-500/10`
              }`}
          >
            Settlements
          </button>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
          </div>
        ) : activeTab === 'settlements' ? (
          <div className={`backdrop-blur-xl bg-black/5 rounded-2xl border ${theme.border} h-max-[50vh] relative before:rounded-2xl before:pointer-events-none overflow-hidden`}>
            <div className="border divide-y divide-gray-400/10 border-gray-400/10 h-full overflow-y-auto">              {settlements
              .filter(settlement =>
                !showOnlyMine ||
                settlement.from === loggedInUser.username ||
                settlement.to === loggedInUser.username
              )
              .length > 0 ? (
              settlements
                .filter(settlement =>
                  !showOnlyMine ||
                  settlement.from === loggedInUser.username ||
                  settlement.to === loggedInUser.username
                )
                .map((settlement, index) => (
                  <div key={index} className={`p-4 flex items-center justify-between ${theme.cardHover} transition-all`}>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <span className={`${theme.text} text-sm`}>{settlement.from}</span>
                        <div className={`flex items-center space-x-2 ${theme.textSecondary}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                        <span className={`${theme.text} text-sm`}>{settlement.to}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="border border-gray-300/10 shadow-md px-4 py-2 rounded-xl">
                        <div className={`${theme.text}`}>{settlement.amount.toFixed(0)}</div>
                      </div>
                      <button
                        onClick={async () => { // Make the onClick handler async
                          setSelectedSettlement(settlement);
                          setEditAmount(settlement.amount);

                          try {
                            await fetchRecipientAccount(settlement.to); // Wait for the account to be fetched
                            setShowSettleModal(true); // Show the modal *after* the account is fetched
                          } catch (error) {
                            // Handle error, e.g., display an error message to the user
                            console.error("Error fetching account:", error);
                            alert("Error fetching recipient account. Please try again later."); // Example error handling
                          }
                        }}
                        disabled={settlement.from !== loggedInUser.username && settlement.to !== loggedInUser.username} // Simplified condition
                        title={settlement.to !== loggedInUser.username ? "Only the recipient can settle" : ""} // Simplified condition
                        className={`md:px-6 lg:px-6 px-3 py-3 rounded-xl text-sm transition-all 
                            ${settlement.to === loggedInUser.username || settlement.from === loggedInUser.username
                            ? 'bg-green-600/80 text-white hover:bg-green-600'
                            : 'bg-green-500/70 text-white hover:bg-green-500/70 cursor-not-allowed opacity-50'
                          }`}
                      >
                        Settle {/* Simplified text */}
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className={`p-8 text-center ${theme.textSecondary}`}>
                <div>✨ All settled up!</div>
                <p className="text-sm mt-2">No settlements required at the moment</p>
              </div>
            )}
            </div>
          </div>
        ) : (
          // In the metrics tab content, update the grid to include the chart
          <div className={` bg-gradient-to-l backdrop-blur-md h-full rounded-2xl border ${theme.border} lg:mb-8`}>
            <div className={`rounded-xl h-full lg:p-4 border ${theme.border}`}>
              <div className={`rounded-xl h-[calc(100%-2rem)] p-1 ${theme.border} flex flex-col`}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h3 className={`text-lg ${theme.text}`}>Daily Expenses</h3>
                  <Menu as="div" className="relative">
                    <Menu.Button className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${theme.input} ${theme.text} border ${theme.border}`}>
                      <FaCalendar className="w-4 h-4" />
                      <span>{dateRange === 'this-month' ? 'This Month' :
                        dateRange === 'last-month' ? 'Last Month' :
                          dateRange === 'all-time' ? 'All Time' : 'Custom Range'}</span>
                    </Menu.Button>
                    <Menu.Items className={`absolute right-0 mt-2 w-48 rounded-xl ${theme.card} border ${theme.border} shadow-lg z-50`}>
                      <div className="p-1">
                        {[
                          { id: 'this-month', name: 'This Month' },
                          { id: 'last-month', name: 'Last Month' },
                          { id: 'all-time', name: 'All Time' },
                        ].map((option) => (
                          <Menu.Item key={option.id}>
                            {({ active }) => (
                              <button
                                onClick={() => setDateRange(option.id)}
                                className={`${active ? 'bg-purple-500/20' : ''} ${dateRange === option.id ? 'bg-purple-500/20' : ''
                                  } group flex w-full items-center rounded-lg px-4 py-2 text-sm ${theme.text}`}
                              >
                                {option.name}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Menu>
                </div>

                {/* Chart container adjustments */}
                <div className={`mb-4 flex-1 flex flex-col ${showOnlyMine ? 'lg:h-[30vh] md:h-[35vh] h-[45vh] ' : 'lg:h-[30vh] md:h-[20vh]'
                  }`}>
                  <Line
                    data={{
                      labels: dailyExpenses.map(item => item.date),
                      datasets: [
                        {
                          label: 'Daily Expenses',
                          data: dailyExpenses.map(item => item.amount),
                          borderColor: 'rgb(147, 51, 234)',
                          backgroundColor: 'rgba(147, 51, 234, 0.5)',
                          tension: 0.4,
                        },
                      ],
                    }}
                    // Update the Line chart options
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                      },
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          enabled: true,
                          mode: 'nearest',
                          intersect: false,
                          position: 'nearest',
                          bodySpacing: 4,
                          bodyFont: {
                            size: 12
                          },
                          titleFont: {
                            size: 12
                          },
                          padding: 10,
                          displayColors: false,
                          callbacks: {
                            label: (context) => {
                              const dayData = dailyExpenses[context.dataIndex];
                              const expenseNames = dayData.expenses.map(exp => exp.name);
                              const lines = [];

                              // Add total first
                              lines.push('Total: Rs ' + context.parsed.y.toFixed(2));

                              // Split items into multiple lines with max 2-3 items per line
                              const itemsPerLine = window.innerWidth < 768 ? 2 : 3;
                              for (let i = 0; i < expenseNames.length; i += itemsPerLine) {
                                const chunk = expenseNames.slice(i, i + itemsPerLine);
                                lines.push(chunk.join(', '));
                              }

                              return lines;
                            }
                          }
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          },
                          ticks: {
                            color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                            callback: (value) => `${value}`
                          }
                        },
                        x: {
                          grid: {
                            display: false,
                          },
                          ticks: {
                            color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                            maxRotation: 45,
                            minRotation: 45
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ... existing metric cards ... */}
            </div>
            {/* </div> */}
          </div>
        )}
      </div>

      {/* Settlement Modal remains the same ... */}
      {showSettleModal && selectedSettlement && (
        <div className="fixed inset-0  flex items-center justify-center z-50">
          <div className={`${theme.card} backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-md w-full border ${theme.border}`}>
            <h3 className={`text-xl font-light font-['Inter'] ${theme.text} mb-6`}>Confirm Settlement</h3>
            <div className="flex flex-col items-center justify-center mt-4 p-4 bg-black/10 rounded-xl">
              {qrValue && (Object.keys(JSON.parse(qrValue)).length > 0) ? (
                <>
                  <QRCodeSVG
                    value={qrValue}
                    size={200}
                    level="H"
                    bgColor={`transparent`}
                    fgColor={`${theme.color}`}
                    includeMargin={true}
                    className="mb-4"
                  />
                  {/* <div className="text-center text-sm text-gray-600">
                    <p>Scan to get payment details</p>
                    <p className="font-semibold mt-2">
                      {recipientAccount.account_type === 'bank' 
                        ? recipientAccount.account_details.accountType
                        : 'eSewa'}
                    </p>
                  </div> */}
                </>
              ) : (
                <div className={`text-center ${theme.textSecondary}`}>
                  No payment methods available
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className={`text-sm ${theme.textSecondary} font-['Inter'] mb-1`}>From</p>
                <p className={`font-['Inter'] ${theme.text}`}>{selectedSettlement.from}</p>
              </div>
              <div>
                <p className={`text-sm ${theme.textSecondary} font-['Inter'] mb-1`}>To</p>
                <p className={`font-['Inter'] ${theme.text}`}>{selectedSettlement.to}</p>
              </div>
              <div>
                <p className={`text-sm ${theme.textSecondary} font-['Inter'] mb-1`}>Amount</p>
                <div
                  className={`w-full ${theme.input} ${theme.text} px-4 py-2 rounded-xl border ${theme.inputBorder} bg-opacity-50`}
                >
                  {editAmount}
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowSettleModal(false)}
                  className={`flex-1 px-4 py-2 border ${theme.border} rounded-lg font-['Inter'] ${theme.textSecondary} ${theme.cardHover} transition-colors`}
                >
                  Cancel
                </button>
                {selectedSettlement.to == loggedInUser.username ? (
                  <button
                    onClick={handleSettle}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded-lg font-['Inter'] hover:bg-yellow-300 transition-colors"
                  >
                    {isSubmitting ? (
                      <><div className="flex justify-center items-center gap-2">
                          <span>Settling</span>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-400"></div>
                          </div>
                      </>
                    ) : (
                      'Confirm Settlement'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={sendSettlementRequest}
                    className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded-lg font-['Inter'] hover:bg-yellow-300 transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="flex justify-center items-center gap-2">
                        <span>Sending</span>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-400"></div>
                        </div>
                      </>
                    ) : (
                      'Send Settlement request'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )
      }
    </div>
  );
}

export default Balance;