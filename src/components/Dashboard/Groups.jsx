import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { endpoints } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

function Groups() {
  const { theme, isDark } = useTheme();
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredMember, setHoveredMember] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [allAccounts, setAllAccounts] = useState({});
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState({});

  useEffect(() => {
    fetchGroups();
    fetchAccounts();
  }, []);

  const fetchGroups = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.get(endpoints.groups, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      setGroups(response.data.data);
      setIsLoading(false)
    } catch (err) {
      setError('Failed to fetch groups');
    }
  };

  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true);
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.get(endpoints.simple_accounts, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: { type: 'all' }
      });
      setAllAccounts(response.data.data || {});
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      }
      setError('Failed to fetch accounts');
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem('access_token');
      await axios.post(endpoints.groups, {
        name: newGroupName,
        members: []
      }, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      setNewGroupName('');
      setShowCreateModal(false);
      fetchGroups();
      toast.success(`${newGroupName} created successfully `);
    } catch (err) {
      toast.error('Group creation unsuccessful');
    }
  };

  const handleGroupClick = (groupId) => {
    navigate(`/dashboard/groups/${groupId}`);
  };

  // Helper to get account object for a username and account id
  const getAccountForUser = (username, accountId) => {
    const userAccounts = allAccounts[username] || allAccounts[username?.toLowerCase()] || [];
    if (!userAccounts.length) return null;
    if (accountId) return userAccounts.find(acc => acc.id === accountId) || userAccounts[0];
    return userAccounts.find(acc => acc.is_primary) || userAccounts[0];
  };

  return (
    <div className="h-full flex items-center">
      <div className="flex flex-col flex-1 h-[calc(100vh-3rem)]">
        {/* Header Card */}
        <div className={`${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-white'} rounded-xl border ${theme.border} w-full p-6 shadow-md`}>
          <div className="flex justify-between items-center">
            <h1 className={`md:text-2xl lg:text-2xl text-lg font-light ${theme.text}`}>Groups</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 text-white rounded-xl bg-purple-500 hover:bg-purple-600 transition-all"
            >
              Create New Group
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        {isLoading ? (
          <div className={`flex ${isDark ? 'bg-gradient-to-br items-center justify-center from-gray-900 via-gray-900 to-gray-800' : 'bg-white'} rounded-xl border ${theme.border} w-full h-[calc(100vh-8rem)] mt-2  overflow-auto shadow-md`}>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400"></div>
          </div>) : (
          <div className={`${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-white'} rounded-xl border ${theme.border} w-full h-[calc(100vh-8rem)] mt-2  overflow-auto shadow-md`}>
            <div className="p-6">
              {error && (
                <div className="bg-[#ff000014] backdrop-blur-xl border border-red-500/20 text-red-400 px-6 py-4 rounded-xl text-base mb-6">
                  {error}
                </div>
              )}
              {groups.length === 0 ? (
                <div className={`${theme.input} backdrop-blur-md bg-white/10 dark:bg-black/10 rounded-xl p-8 text-center border ${theme.border}`}>
                  <div className={theme.textSecondary}>👍 No groups found</div>
                  <p className={`text-sm ${theme.textSecondary}`}>Please Create a group before adding expenses</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                  {groups.map(group => (
                    <div
                      key={group.id}
                      onClick={() => handleGroupClick(group.id)}
                      className={`${theme.input} backdrop-blur-xl rounded-xl border ${theme.inputBorder} p-4 cursor-pointer hover:bg-white/5 transition-all flex flex-col`}
                    >
                      <div className="mb-4">
                        <h3 className={`${theme.text} font-bold text-xl font-medium border-b ${theme.border}`}>{group.name}</h3>
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          {group.members.map(member => {
                            const userAccounts = allAccounts[member.username] || allAccounts[member.username?.toLowerCase()] || [];
                            const selectedId = selectedAccount[member.id] || (userAccounts.find(acc => acc.is_primary)?.id || userAccounts[0]?.id);
                            const primary = getAccountForUser(member.username, selectedId);
                            return (
                              <div
                                key={member.id}
                                className="relative inline-flex flex-col items-center"
                                onMouseEnter={() => {
                                  setHoveredMember(member.id);
                                  setQrValue(primary ? JSON.stringify(primary.account_details) : '');
                                }}
                                onMouseLeave={() => {
                                  setHoveredMember(null);
                                  setQrValue('');
                                }}
                              >
                                <span
                                  className={`px-3 py-1.5 rounded-xl text-sm bg-green-500 text-white ${theme.textSecondary}`}
                                >
                                  {member.username}
                                </span>
                                {/* QR Tooltip */}
                                {hoveredMember === member.id && primary && (
                                  <div className={`z-50 mt-1 p-3 rounded-xl shadow-lg flex flex-col items-center min-w-[220px] border w-max
                                  ${isDark ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-900'} absolute top-7  left-1/2 -translate-x-1/2`}
                                  >
                                    {userAccounts.length > 1 && (
                                      <select
                                        className={`mb-2 px-2 py-1 rounded border text-xs focus:outline-none
                                        ${isDark ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'}`}
                                        value={selectedId}
                                        onClick={e => e.stopPropagation()}
                                        onChange={e => {
                                          setSelectedAccount(prev => ({ ...prev, [member.id]: Number(e.target.value) }));
                                          const acc = userAccounts.find(acc => acc.id === Number(e.target.value));
                                          setQrValue(acc ? JSON.stringify(acc.account_details) : '');
                                        }}
                                      >
                                        {userAccounts.map(acc => (
                                          <option key={acc.id} value={acc.id}>
                                            {acc.account_type?.toUpperCase()} {acc.account_details?.bankCode || acc.account_details?.eSewa_id || acc.account_details?.Khalti_ID || ''}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    <QRCodeSVG
                                      value={qrValue}
                                      size={200}
                                      level="H"
                                      bgColor="transparent"
                                      fgColor={theme.color}
                                      includeMargin={true}
                                      className="mb-2"
                                    />
                                    <span className={`text-xs mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Scan to pay</span>
                                    <div className={`text-xs text-center mt-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                      <div className="font-semibold mb-1">{primary.account_type?.toUpperCase()}</div>
                                      {primary.account_type === 'bank' && (
                                        <>
                                          <div>Bank Code: {primary.account_details?.bankCode}</div>
                                          <div>Account No: {primary.account_details?.accountNumber}</div>
                                          <div>Name: {primary.account_details?.accountName}</div>
                                        </>
                                      )}
                                      {primary.account_type === 'esewa' && (
                                        <>
                                          <div>Name: {primary.account_details?.name}</div>
                                          <div>eSewa ID: {primary.account_details?.eSewa_id}</div>
                                        </>
                                      )}
                                      {primary.account_type === 'khalti' && (
                                        <>
                                          <div>Name: {primary.account_details?.name}</div>
                                          <div>Khalti ID: {primary.account_details?.Khalti_ID}</div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className={`mt-4 pt-3 text-sm font-semibold ${theme.textSecondary} border-t ${theme.border}`}>
                        Created by: <span className='font-bold'>{group.created_by}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
        }

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`${theme.card} backdrop-blur-md p-8 rounded-xl shadow-md max-w-md w-full border ${theme.border}`}>
              <h3 className={`text-xl font-light ${theme.text} mb-6`}>Create New Group</h3>
              <form onSubmit={handleCreateGroup}>
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Group Name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className={`w-full ${theme.input} ${theme.text} px-4 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none`}
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className={`flex-1 px-4 py-2 border ${theme.border} rounded-xl ${theme.textSecondary} ${theme.cardHover} transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Groups;