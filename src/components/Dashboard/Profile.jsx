import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { endpoints } from '../../config/api';
import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaLocationDot,
    FaBuildingColumns,
    FaWallet
} from 'react-icons/fa6';
import { QRCodeSVG } from 'qrcode.react';
import bankData from '../../data/bankData.json';
import Select from 'react-select';

function Profile() {
    const { theme, isDark } = useTheme();
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('accounts');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const [accountType, setAccountType] = useState('bank');
    const [accountDetails, setAccountDetails] = useState({
        accountNumber: '',
        accountName: '',
        bankCode: '',
        accountType: '',
        eSewa_id: '',
        name: '',
        Khalti_ID: ''
    });
    const [isPrimary, setIsPrimary] = useState(false);

    const bankOptions = bankData.list.map(bank => ({
        value: bank.bank,
        label: bank.bank
    }));

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const accessToken = localStorage.getItem('access_token');
                const response = await axios.get(endpoints.profile, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                setProfileData(response.data.data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching profile:', error);
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleAddAccount = async () => {
        try {
            const accessToken = localStorage.getItem('access_token');
            const response = await axios.post(`${endpoints.accounts}`, {
                account_type: accountType,
                account_details: accountDetails,
                is_primary: isPrimary
            }, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.data.success) {
                // Refresh profile data or handle success
                setShowAddAccountModal(false);
            }
        } catch (error) {
            console.error('Error adding account:', error);
        }
    };

    const handleBankChange = (e) => {
        const selectedBank = bankData.list.find(bank => bank.bank === e.target.value);
        setAccountDetails({ ...accountDetails, bankCode: selectedBank ? selectedBank.swift_code : '' });
    };

    const QRModal = ({ account, onClose }) => (
        <div className="fixed inset-0 flex items-center justify-center  backdrop-blur-sm z-50" onClick={onClose}>
            <div className={`${theme.card} backdrop-blur-md justify-center p-6 rounded-2xl max-w-sm w-full mx-4 border ${theme.border}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-semibold ${theme.text}`}>Scan to Pay</h3>
                    <button onClick={onClose} className={`${theme.textSecondary} hover:${theme.text}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="rounded-xl flex justify-center items-center">
                    <QRCodeSVG
                        value={JSON.stringify(account.account_details)}
                        size='h-max'
                        bgColor='transparent'
                        fgColor={theme.color}
                        level="H"
                        includeMargin={true}
                    />
                </div>
                <div className={`text-center mt-4 ${theme.text}`}>
                    <p className="font-semibold">{account.account_type === 'bank' ? account.account_details.bankCode : account.account_type}</p>
                    <p className="text-sm mt-1">
                        {account.account_type === 'bank' ? account.account_details.accountNumber :
                            account.account_type === 'esewa' ? account.account_details.eSewa_id :
                                account.account_details.Khalti_ID}
                    </p>
                </div>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'accounts':
                return (
                    <div className={`h-[60vh] ${theme.card} rounded-2xl p-6 backdrop-blur-xl border ${theme.border}`}>
                        <h2 className={`text-xl font-semibold mb-4 ${theme.text}`}>Payment Methods</h2>
                        <button
                            onClick={() => setShowAddAccountModal(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg mb-4"
                        >
                            Add Payment Method
                        </button>
                        <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '40vh' }}>
                            {profileData.accounts.map((account) => {
                                const bankName = account.account_type === 'bank'
                                    ? bankData.list.find(bank => bank.swift_code === account.account_details.bankCode)?.bank
                                    : null;
                                return (
                                    <div
                                        key={account.id}
                                        className={`${theme.input} rounded-xl p-4 cursor-pointer hover:bg-purple-500/10 transition-colors`}
                                        onClick={() => setSelectedAccount(account)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                {account.account_type === 'bank' ? (
                                                    <FaBuildingColumns className={`${theme.text}`} />
                                                ) : (
                                                    <FaWallet className={`${theme.text}`} />
                                                )}
                                                <span className={`font-semibold ${theme.text}`}>
                                                    {account.account_type === 'bank' ? bankName : account.account_type === 'esewa' ? 'ESewa' : 'Khalti'}
                                                </span>
                                            </div>
                                            {account.is_primary && (
                                                <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-lg">Primary</span>
                                            )}
                                        </div>
                                        <div className={`text-sm ${theme.textSecondary} ml-8`}>
                                            {
                                                account.account_type === 'bank' ?
                                                    <>
                                                        <p>Account: {account.account_details.accountNumber}</p>
                                                        <p>Name: {account.account_details.accountName}</p>
                                                        <p>Bank Code: {account.account_details.bankCode}</p>
                                                    </>
                                                    : account.account_type === 'esewa' ?
                                                        <>
                                                            <p>eSewa ID: {account.account_details.eSewa_id}</p>
                                                            <p>Name: {account.account_details.name}</p>
                                                        </>
                                                        :
                                                        <>
                                                            <p>Khalti ID: {account.account_details.Khalti_ID}</p>
                                                            <p>Name: {account.account_details.name}</p>
                                                        </>
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {selectedAccount && (
                            <QRModal
                                account={selectedAccount}
                                onClose={() => setSelectedAccount(null)}
                            />
                        )}
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center flex-1">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className={`${theme.card} rounded-2xl p-6 mb-6 backdrop-blur-xl border ${theme.border}`}>
                    <div className="flex items-center space-x-4">
                        <div className={`w-20 h-20 rounded-full ${theme.input} flex items-center justify-center`}>
                            <FaUser className={`w-8 h-8 ${theme.text}`} />
                        </div>
                        <div>
                            <h1 className={`text-2xl font-semibold ${theme.text}`}>
                                {profileData.user.first_name} {profileData.user.last_name}
                            </h1>
                            <p className={`${theme.textSecondary}`}>@{profileData.user.username}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-6 overflow-x-auto">
                    {[
                        { id: 'accounts', label: 'Payment Methods' },
                        // { id: 'activity', label: 'Activity' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-xl font-['Inter'] transition-all ${activeTab === tab.id
                                ? `bg-purple-800 text-white backdrop-blur-xl`
                                : `${theme.input} ${theme.text} hover:bg-purple-400/30`
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {renderTabContent()}

                {/* Add Account Modal */}
                {showAddAccountModal && (
                    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className={`${theme.card}  rounded-2xl border ${theme.border} p-6 rounded-2xl shadow-xl max-w-md w-full grid grid-cols-1  gap-4 items-start`}>
                            <h3 className={`${theme.text} font-light mb-4`}>Add Payment Method</h3>
                            <div className="mb-4">
                                <label className={`${theme.text} block mb-2`}>Account Type</label>
                                <Select
                                    value={{ value: accountType, label: accountType.charAt(0).toUpperCase() + accountType.slice(1) }}
                                    onChange={(selectedOption) => setAccountType(selectedOption.value)}
                                    options={[
                                        { value: 'bank', label: 'Bank' },
                                        { value: 'esewa', label: 'eSewa' },
                                        { value: 'khalti', label: 'Khalti' }
                                    ]}
                                    placeholder="Select bank or wallet"
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    styles={{
                                        control: (base) => ({
                                          ...base,
                                          background: 'transparent',
                                          backdropFilter: 'blur(100px)',
                                          borderRadius: '0.75rem',
                                          padding: '0.375rem 1rem',
                                          cursor: 'pointer',
                                          fontSize: '1.125rem',
                                          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                                          boxShadow: 'none',
                                          '&:hover': {
                                            borderWidth: '1.5px',
                                            borderColor: isDark ? 'from-black via-gray-900 to-gray-800' : 'from-white via-purple-100 to-purple-50'
                                          }
                                        }),
                                        menu: (base) => ({
                                          ...base,
                                          background: isDark ? '#212937' : '#ffffff 50%',
                                          borderRadius: '0.75rem',
                                          backdropFilter: 'blur(100px)',
                                          marginTop: '0.5rem',
                                          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                        }),
                                        option: (base, { isFocused, isSelected }) => ({
                                          ...base,
                                          background: isFocused 
                                            ? isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6'
                                            : isSelected 
                                              ? isDark ? 'rgba(255, 255, 255, 0.05)' : '#e5e7eb'
                                              : 'transparent',
                                          color: isDark ? '#fff' : '#374151',
                                          cursor: 'pointer',
                                          '&:active': {
                                            background: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e5e7eb'
                                          }
                                        }),
                                        singleValue: (base) => ({
                                          ...base,
                                          color: isDark ? '#fff' : '#374151'
                                        }),
                                        placeholder: (base) => ({
                                          ...base,
                                          color: '#6B7280',
                                          fontSize: '1.125rem'
                                        }),
                                        input: (base) => ({
                                          ...base,
                                          color: isDark ? '#fff' : '#374151'
                                        }),
                                        dropdownIndicator: (base) => ({
                                          ...base,
                                          color: '#6B7280',
                                          '&:hover': {
                                            color: isDark ? '#fff' : '#374151'
                                          }
                                        })
                                    }}
                                />
                            </div>
                            {/* Conditional form fields based on account type */}
                            {accountType === 'bank' && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Account Number"
                                        value={accountDetails.accountNumber}
                                        onChange={(e) => setAccountDetails({ ...accountDetails, accountNumber: e.target.value })}
                                        className={`flex-1 bg-transparent ${theme.text} px-6 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500 w-full`} />
                                    <input
                                        type="text"
                                        placeholder="Account Name"
                                        value={accountDetails.accountName}
                                        onChange={(e) => setAccountDetails({ ...accountDetails, accountName: e.target.value })}
                                        className={`flex-1 bg-transparent ${theme.text} px-6 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500 w-full`} />


                                    <Select
                                        value={bankOptions.find(option => option.value === accountDetails.bankCode)}
                                        onChange={selectedOption => handleBankChange({ target: { value: selectedOption.value } })}
                                        options={bankOptions}
                                        placeholder="Select bank"
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (base) => ({
                                              ...base,
                                              background: 'transparent',
                                              backdropFilter: 'blur(100px)',
                                              borderRadius: '0.75rem',
                                              padding: '0.375rem 1rem',
                                              cursor: 'pointer',
                                              fontSize: '1.125rem',
                                              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                                              boxShadow: 'none',
                                              '&:hover': {
                                                borderWidth: '1.5px',
                                                borderColor: isDark ? 'from-black via-gray-900 to-gray-800' : 'from-white via-purple-100 to-purple-50'
                                              }
                                            }),
                                            menu: (base) => ({
                                              ...base,
                                              background: isDark ? '#212937' : '#ffffff 50%',
                                              borderRadius: '0.75rem',
                                              backdropFilter: 'blur(100px)',
                                              marginTop: '0.5rem',
                                              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                            }),
                                            option: (base, { isFocused, isSelected }) => ({
                                              ...base,
                                              background: isFocused 
                                                ? isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6'
                                                : isSelected 
                                                  ? isDark ? 'rgba(255, 255, 255, 0.05)' : '#e5e7eb'
                                                  : 'transparent',
                                              color: isDark ? '#fff' : '#374151',
                                              cursor: 'pointer',
                                              '&:active': {
                                                background: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e5e7eb'
                                              }
                                            }),
                                            singleValue: (base) => ({
                                              ...base,
                                              color: isDark ? '#fff' : '#374151'
                                            }),
                                            placeholder: (base) => ({
                                              ...base,
                                              color: '#6B7280',
                                              fontSize: '1.125rem'
                                            }),
                                            input: (base) => ({
                                              ...base,
                                              color: isDark ? '#fff' : '#374151'
                                            }),
                                            dropdownIndicator: (base) => ({
                                              ...base,
                                              color: '#6B7280',
                                              '&:hover': {
                                                color: isDark ? '#fff' : '#374151'
                                              }
                                            })
                                        }}
                                    />
                                </>
                            )}
                            {accountType === 'esewa' && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="eSewa ID"
                                        value={accountDetails.eSewa_id}
                                        onChange={(e) => setAccountDetails({ ...accountDetails, eSewa_id: e.target.value })}
                                        className={`flex-1 ${theme.input} ${theme.text} px-6 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500 w-full`} />
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={accountDetails.name}
                                        onChange={(e) => setAccountDetails({ ...accountDetails, name: e.target.value })}
                                        className={`flex-1 ${theme.input} ${theme.text} px-6 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500 w-full`} />
                                </>
                            )}
                            {accountType === 'khalti' && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Khalti ID"
                                        value={accountDetails.Khalti_ID}
                                        onChange={(e) => setAccountDetails({ ...accountDetails, Khalti_ID: e.target.value })}
                                        className={`flex-1 ${theme.input} ${theme.text} px-6 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500 w-full`} />
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={accountDetails.name}
                                        onChange={(e) => setAccountDetails({ ...accountDetails, name: e.target.value })}
                                        className={`flex-1 ${theme.input} ${theme.text} px-6 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500 w-full`} />
                                </>
                            )}
                            <div className="mb-4 flex items-start">
                                <label className={`${theme.text} `}>primary account
                                    <input
                                        type="checkbox"
                                        checked={isPrimary}
                                        onChange={(e) => setIsPrimary(e.target.checked)}
                                        className={`text-lg placeholder-gray-500 w-full`} />
                                    {/* Set as Primary */}
                                </label>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowAddAccountModal(false)}
                                    className="px-4 py-2 bg-gray-300 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddAccount}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg"
                                >
                                    Add Account
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile;