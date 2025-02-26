import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { endpoints } from '../../config/api';
import { FaUser, FaUsers, FaChevronDown } from 'react-icons/fa';
import bankData from '../../data/bankData.json';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

function Dashboard() {
    const { theme, isDark } = useTheme();
    const [balances, setBalances] = useState(null);
    const [settlements, setSettlements] = useState([]);
    const [error, setError] = useState('');
    const [showOnlyMine, setShowOnlyMine] = useState(true);
    const [expandedSettlements, setExpandedSettlements] = useState(new Set());
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [editAmount, setEditAmount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    const [recipientAccount, setRecipientAccount] = useState(null);
    const [qrValue, setQrValue] = useState('');
    const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
    const [calculationType, setCalculationType] = useState('combined');
    const [allAccounts, setAllAccounts] = useState(null);
    const [activeTab, setActiveTab] = useState('settlements');
    const [dailyExpenses, setDailyExpenses] = useState([]);
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

    const getBankName = (bankCode) => {
        const bank = bankData.list.find(bank => bank.swift_code === bankCode);
        return bank ? bank.bank : bankCode;
    };

    const fetchActivities = async () => {
        try {
            const accessToken = localStorage.getItem('access_token');
            const params = {};
            
            if (dateRange.startDate && dateRange.endDate) {
                params.start_date = dateRange.startDate.toISOString().split('T')[0];
                params.end_date = dateRange.endDate.toISOString().split('T')[0];
            }

            const response = await axios.get(endpoints.simpleActivity, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params
            });

            const activities = response.data.data;
            const dailyTotals = activities.reduce((acc, activity) => {
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

            const sortedDailyExpenses = Object.entries(dailyTotals)
                .map(([date, data]) => ({
                    date,
                    amount: data.amount,
                    expenses: data.expenses
                }))
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .reverse();

            setDailyExpenses(sortedDailyExpenses);
        } catch (err) {
            console.error('Failed to fetch activities:', err);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchActivities();
    }, []);

    useEffect(() => {
        fetchActivities();
    }, [showOnlyMine, dateRange.startDate, dateRange.endDate]);


    const [balancesLoading, setBalancesLoading] = useState(true);
    const [settlementsLoading, setSettlementsLoading] = useState(true);
    const [accountsLoading, setAccountsLoading] = useState(true);

    const fetchDashboardData = async () => {
        const accessToken = localStorage.getItem('access_token');
        const headers = { 'Authorization': `Bearer ${accessToken}` };

        // Fetch balances
        const fetchBalances = async () => {
            try {
                setBalancesLoading(true);
                const response = await axios.get(endpoints.simple_balances, { headers });
                setBalances(response.data.data);
            } catch (err) {
                setError('Failed to fetch balances');
            } finally {
                setBalancesLoading(false);
            }
        };

        // Fetch settlements
        const fetchSettlements = async () => {
            try {
                setSettlementsLoading(true);
                const response = await axios.get(endpoints.simple_settlements, { headers });
                setSettlements(response.data.data);
            } catch (err) {
                setError('Failed to fetch settlements');
            } finally {
                setSettlementsLoading(false);
            }
        };

        // Fetch accounts
        const fetchAccounts = async () => {
            try {
                setAccountsLoading(true);
                const response = await axios.get(endpoints.simple_accounts, { 
                    headers,
                    params: {
                        type: 'all'
                    }
                });
                setAllAccounts(response.data.data);
            } catch (err) {
                setError('Failed to fetch accounts');
            } finally {
                setAccountsLoading(false);
            }
        };

        // Start all fetches concurrently
        fetchBalances();
        fetchSettlements();
        fetchAccounts();
    };

    const handleSettle = async () => {
        setIsSubmitting(true);
        try {
            const accessToken = localStorage.getItem('access_token');
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
            setShowSettleModal(false);
            setSelectedSettlement(null);
            setEditAmount(0);
            toast.success('Settlement processed successfully');
        } catch (err) {
            // setError('Failed to process settlement');
            toast.error('Failed to process settlement');
        } finally {

            setIsSubmitting(false);
        }
    };

    const fetchRecipientAccount = async (username) => {
        try {
            const accounts = allAccounts[username] || []; // Get accounts for the user, or empty array if not found
            console.log(accounts)
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


    const renderBalanceCard = (username, data) => (
        <div
            key={username}
            className={`backdrop-blur-md bg-purple-900/5 rounded-2xl border ${theme.border} p-4 relative`}
        >
            <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg ${theme.text}`}>{username}</h3>
                <div className={`px-2.5 py-1 rounded-lg text-xs ${data.net >= 0
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/20 text-red-600"
                    }`}>
                    {data.net >= 0 ? "To Receive" : "To Pay"}
                </div>
            </div>
            <div className={`${theme.input} p-4 rounded-xl border-t ${theme.border}`}>
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className={`text-sm ${theme.textSecondary}`}>Net Balance</span>
                        <span className={`text-xl font-semibold ${data.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            Rs {Math.abs(data.net).toFixed(2)}
                        </span>
                    </div>
                    {/* <div className="flex flex-col items-end">
                        <span className={`text-sm ${theme.textSecondary}`}>Total Paid</span>
                        <span className={`${theme.text}`}>Rs {data.paid.toFixed(2)}</span>
                    </div> */}
                </div>
            </div>
        </div>
    );

    const toggleSettlementExpansion = (settlementId) => {
        setExpandedSettlements(prev => {
            const newSet = new Set(prev);
            if (newSet.has(settlementId)) {
                newSet.delete(settlementId);
            } else {
                newSet.add(settlementId);
            }
            return newSet;
        });
    };

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
                setShowSettleModal(false);
                setSelectedSettlement(null);
                setEditAmount(0);
                toast.success('Settlement request sent successfully');
            }
        } catch (err) {
            // setError('Failed to send settlement request');
            toast.error('Failed to send settlement request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSettlementCard = (settlement) => {
        const settlementId = `${settlement.from}-${settlement.to}`;
        const isExpanded = expandedSettlements.has(settlementId);
        const hasIndividualSettlements = settlement.individual_settlements && settlement.individual_settlements.length > 1;

        return (
            <div
                key={settlementId}
                className={`${theme.card} rounded-2xl border ${theme.border} p-4 cursor-pointer transition-all duration-200 hover:bg-purple-500/5`}
            >
                <div className="flex justify-between items-center mb-3">
                    <div
                        className="flex items-center flex-1"
                        onClick={() => hasIndividualSettlements && toggleSettlementExpansion(settlementId)}
                    >
                        {hasIndividualSettlements && (
                            <div className="mr-3">
                                {isExpanded ? (
                                    <FaChevronDown className={`${theme.textSecondary} transition-transform transform rotate-180`} />
                                ) : (
                                    <FaChevronDown className={`${theme.textSecondary} transition-transform`} />
                                )}
                            </div>
                        )}
                        <div className="flex items-center space-x-2">
                            <span className={`${theme.text} font-medium`}>{settlement.from}</span>
                            <span className={theme.textSecondary}>→</span>
                            <span className={`${theme.text} font-medium`}>{settlement.to}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-lg text-sm bg-purple-500/10 text-purple-500`}>
                            Rs {settlement.amount.toFixed(2)}
                        </div>
                        <button
                            onClick={async () => {
                                setSelectedSettlement(settlement);
                                setShowSettleModal(true);
                                setEditAmount(settlement.amount)
                                try {
                                    await fetchRecipientAccount(settlement.to); // Wait for the account to be fetched
                                    setShowSettleModal(true); // Show the modal *after* the account is fetched
                                } catch (error) {
                                    // Handle error, e.g., display an error message to the user
                                    console.error("Error fetching account:", error);
                                    alert("Error fetching recipient account. Please try again later."); // Example error handling
                                }
                            }}
                            className="px-4 py-1 text-sm text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                        >
                            Settle
                        </button>
                    </div>
                </div>
                {isExpanded && settlement.individual_settlements.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {settlement.individual_settlements.map((indSettlement, index) => (
                            <div
                                key={index}
                                className={`${theme.input} rounded-lg p-2 text-sm flex justify-between items-center`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className={theme.textSecondary}>
                                    {indSettlement.from} → {indSettlement.to}
                                </span>
                                <span className={theme.text}>Rs {indSettlement.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (error) return <div className="p-4 text-red-600">{error}</div>;

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className={`text-2xl font-light ${theme.text}`}>Dashboard</h1>
                <div className="flex items-center space-x-4">
                    <div className="relative inline-flex items-center">
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
                </div>
            </div>

            <div className="overflow-x-auto pb-4 mb-6 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                <div className="flex space-x-4 min-w-max ">
                    {balancesLoading ? (
                        Array(3).fill(0).map((_, index) => (
                            <div key={index} className={`backdrop-blur-md bg-purple-900/5 rounded-2xl border ${theme.border} p-4 relative animate-pulse w-[300px]`}>
                                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        Object.entries(balances)
                            .filter(([username]) => !showOnlyMine || username === loggedInUser.username)
                            .map(([username, data]) => (
                                <div key={username} className="w-[300px]">
                                    {renderBalanceCard(username, data)}
                                </div>
                            ))
                    )}
                </div>
            </div>

            <div>
                <div className="flex space-x-2 mb-4">
                    <button
                        onClick={() => setActiveTab('settlements')}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${activeTab === 'settlements'
                            ? `bg-purple-800 text-white backdrop-blur-xl`
                            : `${theme.input} ${theme.text} hover:bg-purple-500/10`
                            }`}
                    >
                        Settlements
                    </button>
                    <button
                        onClick={() => setActiveTab('metrics')}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${activeTab === 'metrics'
                            ? `bg-purple-800 text-white backdrop-blur-xl`
                            : `${theme.input} ${theme.text} hover:bg-purple-400/30`
                            }`}
                    >
                        Metrics
                    </button>
                </div>

                {activeTab === 'settlements' ? (
                    <div>
                        {/* <h2 className={`text-xl font-light ${theme.text} mb-4`}>Recent Settlements</h2> */}
                        <div className="space-y-4 overflow-y-auto h-[calc(100vh-350px)] scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                            {settlementsLoading ? (
                                Array(3).fill(0).map((_, index) => (
                                    <div key={index} className={`${theme.card} rounded-2xl border ${theme.border} px-2 py-4 animate-pulse`}>
                                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                                    </div>
                                ))
                            ) : (
                                settlements
                                    .filter(settlement => !showOnlyMine ||
                                        settlement.from === loggedInUser.username ||
                                        settlement.to === loggedInUser.username)
                                    .sort((a, b) => {
                                        // Sort by number of individual settlements (descending)
                                        const aCount = a.individual_settlements?.length || 0;
                                        const bCount = b.individual_settlements?.length || 0;
                                        return bCount - aCount;
                                    })
                                    .map(settlement => renderSettlementCard(settlement))
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className={`bg-gradient-to-l backdrop-blur-md h-full rounded-2xl border ${theme.border} lg:mb-8`}>
                                <div className="flex gap-4 p-2">
                                    <input
                                        type="date"
                                        value={dateRange.startDate ? dateRange.startDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value) : null;
                                            setDateRange(prev => ({ ...prev, startDate: date }));
                                        }}
                                        className={`${theme.input} ${theme.text} px-4 py-1 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
                                    />
                                    <input
                                        type="date"
                                        value={dateRange.endDate ? dateRange.endDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value) : null;
                                            setDateRange(prev => ({ ...prev, endDate: date }));
                                        }}
                                        className={`${theme.input} ${theme.text} px-4 py-1 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
                                    />
                                </div>
                            <div className="h-[400px] p-4 pb-8">
                                <Line
                                    data={{
                                        labels: dailyExpenses.map(expense => new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                                        datasets: [{
                                            label: 'Daily Expenses',
                                            data: dailyExpenses.map(expense => expense.amount),
                                            borderColor: 'rgb(147, 51, 234)',
                                            backgroundColor: 'rgba(147, 51, 234, 0.5)',
                                            // fill: true,
                                            tension: 0.4
                                        }]
                                    }}
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
                                                display: true,
                                                labels: {
                                                    color: isDark ? '#fff' : '#374151'
                                                }
                                            }
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
                )}
            </div>

            {/* Settlement Modal */}
            {showSettleModal && selectedSettlement && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`${theme.card} backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-md w-full border ${theme.border}`}>
                        <h3 className={`text-xl font-light font-['Inter'] ${theme.text} mb-6`}>Confirm Settlement</h3>
                        <div className="flex flex-col items-center justify-center mt-4 p-4 rounded-xl">
                            {recipientAccount && allAccounts[selectedSettlement.to]?.length > 0 ? (
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

                                    {/* Account Selection Dropdown */}
                                    <select
                                        className={`w-full mb-4 ${theme.input} ${theme.text} px-4 py-2 rounded-xl border ${theme.inputBorder}`}
                                        onChange={(e) => {
                                            const index = parseInt(e.target.value);
                                            setSelectedAccountIndex(index);
                                            const account = allAccounts[selectedSettlement.to][index];
                                            setRecipientAccount(account.account_details);
                                            setQrValue(JSON.stringify(account.account_details));
                                        }}
                                        value={selectedAccountIndex}
                                    >
                                        {allAccounts[selectedSettlement.to].map((account, index) => (
                                            <option key={account.id} value={index}>
                                                {account.account_type === 'esewa'
                                                    ? ('eSewa') : account.account_type === 'khalti' ? ('Khalti')
                                                        : getBankName(account.account_details.bankCode)}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Account Details */}
                                    <div className={`text-center ${theme.text}`}>
                                        {allAccounts[selectedSettlement.to][selectedAccountIndex].account_type === 'esewa' ? (
                                            <p className="font-semibold"> Esewa Id: {recipientAccount.eSewa_id}</p>
                                        ) : allAccounts[selectedSettlement.to][selectedAccountIndex].account_type === 'khalti' ? (
                                            <p className="font-semibold"> Khalti Id: {recipientAccount.khalti_id}</p>
                                        ) : (
                                            <p className="font-semibold"> Acc No: {recipientAccount.accountNumber}</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className={`text-center ${theme.textSecondary}`}>
                                    No payment methods available
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className='grid grid-cols-2 gap-2'>
                                <p className={`w-full ${theme.input} ${theme.text} px-4 py-2 rounded-xl border ${theme.inputBorder} bg-opacity-50`}>From {selectedSettlement.from}</p>
                                {/* <p className={`font-['Inter'] ${theme.text}`}>{selectedSettlement.from}</p> */}
                                {/* </div> */}
                                {/* <div> */}
                                <p className={`w-full ${theme.input} ${theme.text} px-4 py-2 rounded-xl border ${theme.inputBorder} bg-opacity-50`}>To {selectedSettlement.to}</p>
                                {/* <p className={`font-['Inter'] ${theme.text}`}>{selectedSettlement.to}</p> */}
                            </div>
                            <div>
                                <p className={`text-sm ${theme.textSecondary} font-['Inter'] mb-1`}>Amount</p>
                                {calculationType === 'individual' ? (
                                    <input
                                        type="number"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        className={`w-full ${theme.input} ${theme.text} px-4 py-2 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
                                        min="0"
                                        step="0.01"
                                    />
                                ) : (
                                    <div className={`w-full ${theme.input} ${theme.text} px-4 py-2 rounded-xl border ${theme.inputBorder} bg-opacity-50`}>
                                        {editAmount.toFixed(0)}
                                    </div>
                                )}
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
            )}
        </div>
    );
}

export default Dashboard;