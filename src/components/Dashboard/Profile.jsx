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
import QrScanner from 'react-qr-scanner';
import jsQR from 'jsqr';

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
        eSewa_id: '',
        name: '',
        Khalti_ID: ''
    });
    const [isPrimary, setIsPrimary] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scannerError, setScannerError] = useState('');

    // Add this new function to handle image uploads

    // Add state for camera access
    const [showCamera, setShowCamera] = useState(false);

    const handleBankChange = (selectedOption) => {
        const selectedBank = bankData.list.find(bank => bank.bank === selectedOption.value);
        const matchedBank = bankData.list.find(bank => bank.bank === bankName);
        setAccountDetails({ 
            ...accountDetails, 
            bankCode: selectedBank ? selectedBank.swift_code : '',
            swiftCode: matchedBank ? matchedBank.swift_code : "" 
        });
    };

    // Update the QRScannerModal component
    const QRScannerModal = () => (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`${theme.card} rounded-2xl border ${theme.border} p-6 shadow-xl max-w-md w-full`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-semibold ${theme.text}`}>Scan QR Code</h3>
                    <button 
                        onClick={() => setShowScanner(false)}
                        className={`${theme.textSecondary} hover:${theme.text}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="relative space-y-4">
                    <div className="flex flex-col gap-4 items-center">
                        <label className="px-4 py-2 bg-purple-500 text-white rounded-lg cursor-pointer hover:bg-purple-600 transition-colors flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            Upload QR Image
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </label>
                        <button
                            onClick={() => setShowCamera(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                            Use Camera
                        </button>
                    </div>
                    {showCamera && (
                        <div>
                            <QrScanner
                                onScan={handleScan}
                                onError={handleScanError}
                                style={{ width: '100%' }}
                                constraints={{
                                    video: { facingMode: 'environment' }
                                }}
                            />
                        </div>
                    )}
                    {scannerError && (
                        <p className="text-red-500 text-sm mt-2">{scannerError}</p>
                    )}
                </div>
            </div>
        </div>
    );
    const handleScan = (data) => {
        if (data) {
            try {
                const parsedData = JSON.parse(data.text);
                const detectedType = determineAccountType(parsedData);
                
                if (!detectedType) {
                    setScannerError('Invalid account type in QR code');
                    return;
                }

                setAccountType(detectedType);

                // For bank accounts, find the matching bank option
                if (detectedType === 'bank' && parsedData.bankCode) {
                    const matchingBank = bankData.list.find(b => b.swift_code === parsedData.bankCode);
                    if (matchingBank) {
                        // Set the bank name for display in the select input
                        setAccountDetails({
                            ...parsedData,
                            bankCode: matchingBank.bank // Set the bank name for the select input
                        });
                    } else {
                        setAccountDetails(parsedData);
                    }
                } else {
                    setAccountDetails(parsedData);
                }

                setShowScanner(false);
                setShowAddAccountModal(true);
            } catch (error) {
                console.error('Error parsing QR code:', error);
                setScannerError('Invalid QR code format');
            }
        }
    }

    const handleScanError = (err) => {
        console.error(err);
        setScannerError('Error scanning QR code');
    };

    const determineAccountType = (data) => {
        if (data.bankCode && data.accountNumber) return 'bank';
        if (data.eSewa_id) return 'esewa';
        if (data.Khalti_ID) return 'khalti';
        return null;
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                        try {
                            const parsedData = JSON.parse(code.data);
                            const detectedType = determineAccountType(parsedData);

                            if (!detectedType) {
                                setScannerError('Invalid account type in QR code');
                                return;
                            }

                            setAccountType(detectedType);

                            if (detectedType === 'bank' && parsedData.bankCode) {
                                const matchingBank = bankData.list.find(b => b.swift_code === parsedData.bankCode);
                                if (matchingBank) {
                                    setAccountDetails({
                                        ...parsedData,
                                        bankCode: matchingBank.bank
                                    });
                                } else {
                                    setAccountDetails(parsedData);
                                }
                            } else {
                                setAccountDetails(parsedData);
                            }

                            setShowScanner(false);
                            setShowAddAccountModal(true);
                        } catch (error) {
                            setScannerError('Invalid QR code format');
                        }
                    } else {
                        setScannerError('No QR code found in image');
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

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

    // Add new state for loading
        const [isSubmitting, setIsSubmitting] = useState(false);
    
        const handleAddAccount = async () => {
            try {
                setIsSubmitting(true);
                const accessToken = localStorage.getItem('access_token');

                // Prepare account details based on account type
                let finalAccountDetails = {};
                const selectedBank = bankData.list.find(bank => bank.bank === accountDetails.bankCode);
                if (accountType === 'bank') {
                    finalAccountDetails = {
                        accountNumber: accountDetails.accountNumber || '',
                        accountName: accountDetails.accountName || '',
                        bankCode: selectedBank ? selectedBank.swift_code : '',
                    };
                    console.log(finalAccountDetails)
                } else if (accountType === 'esewa') {
                    finalAccountDetails = {
                        eSewa_id: accountDetails.eSewa_id || '',
                        name: accountDetails.name || '',
                    };
                } else if (accountType === 'khalti') {
                    finalAccountDetails = {
                        Khalti_ID: accountDetails.Khalti_ID || '',
                        name: accountDetails.name || '',
                    };
                }

                const response = await axios.post(`${endpoints.accounts}`, {
                    account_type: accountType,
                    account_details: finalAccountDetails,
                    is_primary: isPrimary
                }, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                if (response.data.success) {
                    const profileResponse = await axios.get(endpoints.profile, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    setProfileData(profileResponse.data.data);
                    setShowAddAccountModal(false);
                    setAccountDetails({
                        bankCode: "",
                        swiftCode: ""
                    });
                }
            } catch (error) {
                console.error('Error adding account:', error);
            } finally {
                setIsSubmitting(false);
            }
        };
    
        // Update the Add Account button in the modal
        <button
            onClick={handleAddAccount}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
            {isSubmitting ? (
                <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                </>
            ) : (
                'Add Account'
            )}
        </button>

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
                                                    {account.account_type === 'bank' 
                                                        ? bankData.list.find(b => b.swift_code === account.account_details.bankCode)?.bank 
                                                        : account.account_type === 'esewa' 
                                                            ? 'ESewa' 
                                                            : 'Khalti'}
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
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto lg:px-4 md:px-4 px-1 lg:py-8 md:py-8 sm:py-3">
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
                        <div className={`${theme.card} rounded-2xl border ${theme.border} p-6 rounded-2xl shadow-xl max-w-md w-full grid grid-cols-1 gap-4 items-start`}>
                            <div className="flex justify-between items-center">
                                <h3 className={`${theme.text} font-light mb-4`}>Add Payment Method</h3>
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="px-4 py-2 bg-purple-500 text-white rounded-lg flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
                                    </svg>
                                    Scan QR
                                </button>
                            </div>
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
                            {/* <div className="mb-4 flex items-start">
                                <label className={`${theme.text} `}>primary account
                                    <input
                                        type="checkbox"
                                        checked={isPrimary}
                                        onChange={(e) => setIsPrimary(e.target.checked)}
                                        className={`text-lg placeholder-gray-500 w-full`} />

                                </label>
                            </div> */}
                            {/* Update the Add Account button in the modal */}
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowAddAccountModal(false)}
                                    className="px-4 py-2 bg-gray-300 rounded-lg"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddAccount}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Account'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {showScanner && <QRScannerModal />}
            </div>
        </div>
    );
}

export default Profile;