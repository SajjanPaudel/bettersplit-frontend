import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

function Balance() {
  const { theme ,isDark} = useTheme();
  const [balances, setBalances] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [error, setError] = useState('');
  const [calculationType, setCalculationType] = useState('individual'); // Changed default to individual
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  const fetchBalances = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.get(`http://127.0.0.1:8000/api/split/expenses/balances?type=${calculationType}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      setBalances(response.data.data.balances);
      setSettlements(response.data.data.settlements);
      setError(''); // Clear any existing errors
    } catch (err) {
      setError('Failed to fetch balances');
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [calculationType]);

  const handleSettle = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.post('http://127.0.0.1:8000/api/split/expenses/settle/', {
        from_user: selectedSettlement.from,
        to_user: selectedSettlement.to,
        amount: selectedSettlement.amount
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.data.success) {
        await fetchBalances(); // Fetch updated balances
        setShowSettleModal(false);
        setSelectedSettlement(null);
      }
    } catch (err) {
      setError('Failed to process settlement');
    }
  };

  const calculateTotalPositiveNet = () => {
    if (!balances) return 0;
    return Object.values(balances)
      .reduce((total, user) => total + (user.net > 0 ? user.net : 0), 0);
  };

  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!balances) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-[1400px] mx-auto relative">
      {/* Background Gradient */}
      <div className={`fixed inset-0 bg-gradient-to-br ${
        isDark 
          ? 'from-black via-blue-900 to-gray-900' 
          : 'from-white via-blue-100 to-blue-50'
      } -z-10`} />
      
      <div className="flex justify-between mb-2 pt-1">
        <h1 className={`text-2xl font-light ${theme.text} pl-12 lg:pl-0`}>Overview</h1>
        <div className="flex items-center space-x-2">
          <span className={theme.textSecondary}>Type:</span>
          <div className="relative inline-block w-32">
            <select
              value={calculationType}
              onChange={(e) => setCalculationType(e.target.value)}
              className={`block w-full ${theme.input} backdrop-blur-xl border ${theme.inputBorder} rounded-2xl py-3 px-4 text-sm ${theme.text} focus:outline-none ${theme.inputFocus}`}
            >
              <option value="individual">Individual</option>
              <option value="net">Net</option>
            </select>
          </div>
        </div>
      </div>
          
      {/* Overview Cards */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-3 mb-6 max-h-[40vh] md:max-h-none overflow-y-auto md:overflow-visible">
        {Object.entries(balances).map(([name, data]) => (
          <div className={`${theme.card} backdrop-blur-md bg-white/10 dark:bg-black/10 rounded-2xl border ${theme.border} p-4 lg:p-8 relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.08] before:to-transparent before:rounded-2xl before:pointer-events-none`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg ${theme.text} transition-colors`}>{name}</h3>
              <div className={`px-2.5 py-1 rounded-lg text-xs ${
                data.net >= 0 
                  ? "bg-green-500/10 text-green-400" 
                  : "bg-red-500/10 text-red-400"
              }`}>
                {data.net >= 0 ? "To Receive" : "To Pay"}
              </div>
            </div>

            <div className={`flex justify-between items-center ${theme.input} p-4 rounded-xl border-t ${theme.border}`}>
              <div>
                <div className={theme.textSecondary}>Net Balance</div>
                <div className={`text-xl font-medium ${data.net >= 0 ? "text-green-400" : "text-red-400"}`}>
                  Rs {Math.abs(data.net).toFixed(2)}
                </div>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                data.net >= 0 ? "bg-green-500/10" : "bg-red-500/10"
              }`}>
                <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Settlements Section */}
      <div className="mb-4 flex-1 flex flex-col h-[50vh] md:h-auto">
        <h2 className={`text-xl font-light ${theme.text} mb-4`}>
          {calculationType === 'net' ? 'Net Settlements' : 'Individual Settlements'}
        </h2>
        {settlements.length > 0 ? (
          <div className={`${theme.card} backdrop-blur-xl rounded-2xl border ${theme.border} h-full shadow-2xl relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent before:rounded-2xl before:pointer-events-none overflow-hidden`}>
            <div className={`divide-y ${theme.border} h-full overflow-y-auto`}>
              {settlements.map((settlement, index) => (
                <div key={index} className={`p-4 flex items-center justify-between ${theme.cardHover} transition-all`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <span className={theme.text}>{settlement.from}</span>
                      <div className={`flex items-center space-x-2 ${theme.textSecondary}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                      <span className={theme.text}>{settlement.to}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className={`${theme.input} px-4 py-2 rounded-xl`}>
                      {/* <div className={`text-sm ${theme.textSecondary} mb-0.5`}>Amount</div> */}
                      <div className={`font-medium ${theme.text}`}>Rs {settlement.amount.toFixed(2)}</div>
                    </div>
                    <button
                      onClick={() => {
                        if (calculationType === 'individual') {
                          setSelectedSettlement(settlement);
                          setShowSettleModal(true);
                        }
                      }}
                      disabled={calculationType === 'net'}
                      className={`px-6 py-3 rounded-xl text-sm transition-all ${
                        calculationType === 'individual'
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          : `${theme.input} ${theme.textSecondary} cursor-not-allowed`
                      }`}
                    >
                      {calculationType === 'individual' ? 'Settle' : 'Settle'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`${theme.input} backdrop-blur-md bg-white/10 dark:bg-black/10 rounded-2xl p-8 text-center border ${theme.border}`}>
            <div className={theme.textSecondary}>👍 All settled up!</div>
            <p className={`text-sm ${theme.textSecondary}`}>No settlements required at the moment</p>
          </div>
        )}
      </div>

      {/* Settlement Modal with enhanced glass effect */}
      {showSettleModal && selectedSettlement && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`${theme.card} backdrop-blur-md bg-white/10 dark:bg-black/10 p-8 rounded-2xl shadow-xl max-w-md w-full border ${theme.border}`}>
            <h3 className={`text-xl font-light font-['Inter'] ${theme.text} mb-6`}>Confirm Settlement</h3>
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
                <p className={`font-['Inter'] ${theme.text}`}> Rs {selectedSettlement.amount.toFixed(2)}</p>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowSettleModal(false)}
                  className={`flex-1 px-4 py-2 border ${theme.border} rounded-lg font-['Inter'] ${theme.textSecondary} ${theme.cardHover} transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSettle}
                  className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded-lg font-['Inter'] hover:bg-yellow-300 transition-colors"
                >
                  Confirm Settlement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Balance;