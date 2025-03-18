import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { endpoints } from '../../config/api';
import { Link } from 'react-router-dom';
import { FaCalculator } from 'react-icons/fa';
import { hr } from 'framer-motion/client';

function AddExpense() {
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcResult, setCalcResult] = useState('');
  const [fullHistory, setFullHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user'))?.username;

  const removeBill = (indexToRemove) => {
    setExpenses(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  const [expenses, setExpenses] = useState([{
    id: 0,
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payers: [], // Add payers array
    splits: [],
    selectedUsers: [],
    group: ''
  }]);


  const [groupMembers, setGroupMembers] = useState([]);

  // Modify the group selection handler
  const handleGroupSelect = (selected) => {
    setSelectedGroup(selected.id);
    // Update group members when a group is selected
    setGroupMembers(selected.members || []);

    // Find the current user in the group members
    const currentUserMember = selected.members?.find(member => member.username === currentUser);

    // If current user is found in the group, set them as the default payer for all expenses
    if (currentUserMember) {
      setExpenses(prev => prev.map(exp => {
        // Calculate equal amount for payers if there's a total amount
        const totalAmount = parseFloat(exp.amount) || 0;

        return {
          ...exp,
          payers: [{
            user: currentUserMember.id,
            amount: totalAmount.toString()
          }]
        };
      }));
    }
  };

  const handlePayerSelection = (expenseIndex, userId) => {
    setExpenses(prev => prev.map((exp, i) => {
      if (i !== expenseIndex) return exp;

      const existingPayer = exp.payers.find(p => p.user === userId);
      const newPayers = existingPayer
        ? exp.payers.filter(p => p.user !== userId)
        : [...exp.payers, { user: userId, amount: '0' }];

      // Calculate equal amount for payers if there's a total amount
      const totalAmount = parseFloat(exp.amount) || 0;
      const equalAmount = newPayers.length > 0
        ? (totalAmount / newPayers.length).toFixed(2)
        : '0';

      // Distribute amount equally among payers
      const updatedPayers = newPayers.map(payer => ({
        ...payer,
        amount: equalAmount
      }));

      return {
        ...exp,
        payers: updatedPayers
      };
    }));
  };

  const handlePayerAmountChange = (expenseIndex, userId, value) => {
    setExpenses(prev => prev.map((exp, i) => {
      if (i !== expenseIndex) return exp;

      const totalAmount = parseFloat(exp.amount) || 0;
      const newPayers = exp.payers.map(payer => {
        if (payer.user === userId) {
          return { ...payer, amount: value, isManuallySet: true };
        }
        return payer;
      });

      // Calculate total of manually set amounts
      const manualPayers = newPayers.filter(p => p.isManuallySet);
      const manualTotal = manualPayers.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      // Calculate remaining amount for automatic distribution
      const remainingAmount = totalAmount - manualTotal;
      const autoPayers = newPayers.filter(p => !p.isManuallySet);

      // Distribute remaining amount among non-manual payers
      if (autoPayers.length > 0) {
        const equalShare = (remainingAmount / autoPayers.length).toFixed(2);
        autoPayers.forEach(payer => {
          payer.amount = equalShare;
        });
      }

      return {
        ...exp,
        payers: newPayers
      };
    }));
  };
  const handleCalcButtonClick = (value) => {
    if (value === '=') {
      try {
        const result = eval(calcResult).toString();
        setFullHistory(prev => [...prev, `${calcResult} = ${result}`]);
        setCalcResult(result);
      } catch (error) {
        setCalcResult('Error');
      }
    } else if (value === 'C') {
      setCalcResult('');
      setFullHistory([]);
    } else if (value === '⌫') {
      setCalcResult(prev => prev.slice(0, -1));
    } else if (value === '%') {
      try {
        const result = (eval(calcResult) / 100).toString();
        setFullHistory(prev => [...prev, `${calcResult}% = ${result}`]);
        setCalcResult(result);
      } catch (error) {
        setCalcResult('Error');
      }
    } else {
      setCalcResult(prev => prev + value);
    }
  };

  const addNewExpense = () => {
    setExpenses(prev => [...prev, {
      id: prev.length,
      name: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payers: [], // Add payers array
      splits: [],
      selectedUsers: [],
      group: ''
    }]);
  };

  // Move handleSubmit here, before the return statement
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const accessToken = localStorage.getItem('access_token');

      if (!selectedGroup) {
        setError('Please select a group');
        return;
      }

      // Validate all expenses
      for (const exp of expenses) {
        if (!exp.name || !exp.amount || exp.payers.length === 0 || exp.selectedUsers.length === 0) {
          setError('Please fill in all required fields for each expense');
          return;
        }

        // Validate payers total amount matches expense amount
        const payersTotal = exp.payers.reduce((sum, payer) => sum + parseFloat(payer.amount || 0), 0);
        if (Math.abs(payersTotal - parseFloat(exp.amount)) > 0.01) {
          setError('Total amount paid must equal the expense amount');
          return;
        }
      }

      // Submit all expenses
      const submissionPromises = expenses.map(exp => {
        const expenseData = {
          name: exp.name,
          amount: parseFloat(exp.amount),
          date: exp.date,
          payers: exp.payers,
          splits: exp.splits,
          group: selectedGroup
        };

        return axios.post(endpoints.expenses, expenseData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      });

      await Promise.all(submissionPromises);
      navigate('/dashboard');

    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to add expenses');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update initial state to set first user as default paid_by
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get(endpoints.users, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        setUsers(response.data.data);
      } catch (err) {
        // setError('Failed to fetch users');
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get(endpoints.groups, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        setGroups(response.data.data);
      } catch (err) {
        // setError('Failed to fetch users');
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const handleSplitAmountChange = (expenseIndex, splitIndex, value) => {
    setExpenses(prev => prev.map((exp, i) => {
      if (i !== expenseIndex) return exp;

      const totalAmount = parseFloat(exp.amount) || 0;
      const newSplits = [...exp.splits];

      // Update the changed split amount
      newSplits[splitIndex] = {
        ...newSplits[splitIndex],
        amount: value,
        isManuallySet: true // Mark this split as manually set
      };

      // Calculate total of manually set amounts
      const manualSplits = newSplits.filter(split => split.isManuallySet);
      const manualTotal = manualSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);

      // Calculate remaining amount for automatic distribution
      const remainingAmount = totalAmount - manualTotal;
      const autoSplits = newSplits.filter(split => !split.isManuallySet);

      // Distribute remaining amount among non-manual splits
      if (autoSplits.length > 0) {
        const equalShare = (remainingAmount / autoSplits.length).toFixed(2);
        autoSplits.forEach(split => {
          split.amount = equalShare;
        });
      }

      return {
        ...exp,
        splits: newSplits
      };
    }));
  };

  const toggleAllMembers = (index) => {
    setExpenses(prev => prev.map((exp, i) => {
      if (i !== index) return exp;

      const allSelected = exp.selectedUsers.length === groupMembers.length;
      const newSelectedUsers = allSelected ? [] : groupMembers.map(m => m.id);
      const equalAmount = allSelected ? '' : (parseFloat(exp.amount) / groupMembers.length || 0).toFixed(2);

      return {
        ...exp,
        selectedUsers: newSelectedUsers,
        splits: groupMembers.map(member => ({
          user: member.id,
          amount: allSelected ? '' : equalAmount
        }))
      };
    }));
  };

  // Add new state for multiple expenses
  // Update the state management
  // Remove the single expense state and keep only the expenses array state

  // Add handler for amount change per expense
  const handleAmountChange = (index, value) => {
    setExpenses(prev => prev.map((exp, i) => {
      if (i !== index) return exp;

      // Handle arithmetic calculations
      if (value.endsWith(' ') && /[+\-*/]/.test(value)) {
        try {
          const expression = value.trim();
          const result = eval(expression).toString();
          value = result;
        } catch (error) {
          value = value.trim();
        }
      }

      const equalSplitAmount = value
        ? (parseFloat(value) / (exp.selectedUsers.length || 1)).toFixed(2)
        : '';

      const equalPayerAmount = value
        ? (parseFloat(value) / (exp.payers.length || 1)).toFixed(2)
        : '';

      return {
        ...exp,
        amount: value,
        // Update splits with equal amounts
        splits: exp.selectedUsers.map(userId => ({
          user: userId,
          amount: equalSplitAmount
        })),
        // Update payers with equal amounts
        payers: exp.payers.map(payer => ({
          ...payer,
          amount: equalPayerAmount
        }))
      };
    }));
  };

  // Update expense handlers
  const handleExpenseUpdate = (index, field, value) => {
    setExpenses(prev => prev.map((exp, i) =>
      i === index ? { ...exp, [field]: value } : exp
    ));
  };

  const handleUserSelection = (expenseIndex, userId) => {
    setExpenses(prev => prev.map((exp, i) => {
      if (i !== expenseIndex) return exp;

      const isSelected = exp.selectedUsers.includes(userId);
      const newSelectedUsers = isSelected
        ? exp.selectedUsers.filter(id => id !== userId)
        : [...exp.selectedUsers, userId];

      const equalAmount = exp.amount
        ? (parseFloat(exp.amount) / (newSelectedUsers.length || 1)).toFixed(2)
        : '';

      return {
        ...exp,
        selectedUsers: newSelectedUsers,
        splits: newSelectedUsers.map(id => ({
          user: id,
          amount: equalAmount
        }))
      };
    }));
  };

  // Update the JSX return
  return (
    // Update the outer container structure
    <div className="h-full flex items-center">
      <div className={`${isDark ? ' bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-white'} rounded-xl overflow-hidden h-[95vh] w-full p-2 shadow-md`}>
        {isLoading ? (
          <div className={`h-full p- lg:p-8 flex flex-col gap-6`}>
            {/* Group selector skeleton */}
            <div className="flex items-center gap-4 w-48">
              <div className={`h-10 ${isDark ? 'bg-black/15' : 'bg-gray-200'} rounded-md w-full animate-pulse`}></div>
            </div>

            {/* Expense form skeleton */}
            <div className="space-y-4">
              <div className={`rounded-2xl border ${theme.border} p-4 space-y-4`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className={`h-10 ${isDark ? 'bg-black/15' : 'bg-gray-200'} rounded-md w-full animate-pulse`}></div>
                  <div className={`h-10 ${isDark ? 'bg-black/15' : 'bg-gray-200'} rounded-md w-full animate-pulse`}></div>
                  <div className={`h-10 ${isDark ? 'bg-black/15' : 'bg-gray-200'} rounded-md w-full animate-pulse`}></div>
                </div>
              </div>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className={` backdrop-blur-md h-full dark:bg-black/10 rounded-xl p-4 text-center border ${theme.border} flex flex-col items-center space-y-6`}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${theme.textSecondary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={`text-2xl font-medium ${theme.textSecondary}`}>Before You add expenses</div>
            <p className={`text-sm ${theme.textSecondary} max-w-md`}>
              Start by creating a group and adding expenses to track your shared payments and settlements
            </p>
            <Link to="/dashboard/groups" className={`p-2 bg-green-500 text-white rounded-2xl`}>
              Go to Groups →
            </Link>
          </div>
        ) : (
          <div className="px-2 py-4 lg:p-8 md:p-8 flex flex-col h-full">
            {/* Header buttons - removing this section */}
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              {/* Button will be moved next to the group selector */}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-[#ff000014] backdrop-blur-xl border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-base mb-6 flex-shrink-0">
                {error}
              </div>
            )}

            <form id="expense-form" onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden" noValidate>
              {/* Group selector with Save All button */}
              <div className='flex-shrink-0 mb-4 flex items-center gap-4 '>
                <div className="flex-grow w-fit">
                  <Select
                    value={groups.find(group => group.id === selectedGroup)}
                    onChange={handleGroupSelect}
                    options={groups}
                    getOptionLabel={(option) => option.name}
                    getOptionValue={(option) => option.id}
                    placeholder="Select Group"
                    className="react-select-container w-fit"
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
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 lg:px-6 py-2.5 text-white rounded-xl bg-green-500 hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white/100"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save All'
                  )}
                </button>
              </div>
              {/* Scrollable expenses container */}
              <div className="flex-1 overflow-y-auto">
                <div className={`grid lg:grid-cols-1 gap-2 gap-y-4 pt-2 rounded-2xl`}>
                  {expenses.map((exp, index) => (

                    <div key={exp.id} className={`rounded-2xl shadow-md p-2 space-y-6 relative border ${theme.border} ${isDark ? "bg-gradient-to-bl from-black/20 to-gray-700/20" : "bg-gradient-to-br"}`}> {/* Added relative positioning */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start relative"> {/* Added relative positioning */}
                        <div className='mt-0'>
                          <input
                            type="text"
                            placeholder="Expense name"
                            value={exp.name}
                            onChange={(e) => handleExpenseUpdate(index, 'name', e.target.value)}
                            className={`flex-1 bg-transparent ${theme.text} px-6 py-3 rounded-xl border ${theme.border} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500 w-full`}
                            required
                          />
                        </div>

                        <div className='relative'>
                          <div className="h-full w-full">
                            <DatePicker
                              selected={new Date(exp.date)}
                              onChange={(date) => handleExpenseUpdate(index, 'date', date.toISOString().split('T')[0])}
                              maxDate={new Date()}
                              dateFormat="MMM d, yyyy"
                              className={`w-full bg-transparent ${theme.text} px-6 py-3 rounded-xl border ${theme.border} ${theme.inputFocus} focus:outline-none cursor-pointer text-lg`}
                              placeholderText="Select date"
                              required
                              wrapperClassName="w-full  relative"
                              popperClassName="date-picker-popper"
                            />
                          </div>
                        </div>

                        <div className="relative group flex items-center gap-2">
                          <div className="relative group flex-1">
                            <input
                              type="text"
                              pattern="[0-9\+\-\*\/\(\)\.\s]*"
                              placeholder="Amount"
                              value={exp.amount}
                              onChange={(e) => handleAmountChange(index, e.target.value)}
                              className={`w-full bg-transparent ${theme.text} px-6 py-3 rounded-xl border ${theme.border} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500`}
                              required
                            />
                            <div className={`absolute -bottom-50 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10`}>
                              <div className={`w-3 h-3 ${theme.card} border ${theme.border} transform rotate-45 absolute -top-1.5 left-1/2 -translate-x-1/2`}></div>
                              <div className={`${theme.card} backdrop-blur-xl p-3 rounded-xl border ${theme.border} shadow-md w-48`}>
                                <div className={`text-sm ${theme.text}`}>
                                  Quick Tip: You can do arithmetic calculations!
                                </div>
                                <div className={`text-xs ${theme.textSecondary} mt-1`}>
                                  Try: 100+200, 500/2, etc. just add a space to calculate
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={index === 0 ? addNewExpense : () => removeBill(index)}
                            className={`p-2 w-10 h-10 rounded-full hidden md:block ${
                              index === 0
                                ? "text-white bg-green-500/50 hover:bg-green-500/80"
                                : "text-white bg-red-500/50 hover:bg-red-500/80"
                            } transition-colors`}
                          >
                            {index === 0 ? "+" : "−"}
                          </button>
                        </div>
                      </div>
                      {selectedGroup && (
                        <>
                          <div className="col-span-full animate-slide-down">
                            {/* <div className="mb-2 text-sm text-gray-500">Who paid?</div> */}
                            <div className="flex flex-wrap gap-2">
                              <span className={`relative px-4 py-2 rounded-2xl text-sm border border-purple-500 ${theme.text}`}>
                                Paid By <span className={`${theme.text}`}> → </span>
                              </span>
                              {selectedGroup ? (
                                groupMembers.map(user => {
                                  const isPayer = exp.payers.some(p => p.user === user.id);
                                  const payer = exp.payers.find(p => p.user === user.id);

                                  return (
                                    <div key={user.id} className="flex items-center">
                                      <button
                                        type="button"
                                        onClick={() => handlePayerSelection(index, user.id)}
                                        className={`px-4 py-2 rounded-l-2xl text-sm transition-all ${isPayer
                                          ? `bg-purple-800 text-white`
                                          : ` rounded-r-2xl ${theme.input} ${theme.textSecondary} ${theme.hoverBg}`
                                          }`}
                                      >
                                        {user.first_name}
                                      </button>
                                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isPayer ? 'w-24 opacity-100 rounded-r-2xl' : 'w-0 opacity-0'
                                        }`}>
                                        <input
                                          type="number"
                                          value={payer?.amount || ''}
                                          onChange={(e) => handlePayerAmountChange(index, user.id, e.target.value)}
                                          className={`${theme.text} bg-purple-800/20 px-2 py-2  focus:outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                        // placeholder="Amount"
                                        />
                                      </div>
                                      <div className={`rounded-r-xl transition-all duration-300 ${isPayer ? 'w-1 bg-purple-800/50' : 'w-0'
                                        }`}></div>
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-sm text-gray-500"></span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 opacity-0 animate-slide-down-delay">
                            <span className={`relative flex gap-2 px-4 py-2 rounded-2xl text-sm border border-green-500 ${theme.text}`}>
                              Paid For <span className={`${theme.text}`}>
                                <button
                                  type="button"
                                  onClick={() => toggleAllMembers(index)}
                                  className={`flex items-center justify-center w-4 h-4 p-2 rounded-md border-2 ${exp.selectedUsers.length === groupMembers.length
                                    ? 'bg-green-500 border-green-600'
                                    : 'bg-transparent border-green-500/50'
                                    } transition-colors`}
                                >
                                </button>
                              </span>
                            </span>
                            {selectedGroup ? (
                              groupMembers.map(user => {
                                const isSelected = exp.selectedUsers.includes(user.id);
                                const split = exp.splits.find(s => s.user === user.id);

                                return (
                                  <div key={user.id} className="flex items-center">
                                    <button
                                      type="button"
                                      onClick={() => handleUserSelection(index, user.id)}
                                      className={`px-4 py-2 rounded-l-2xl text-sm transition-all ${isSelected
                                        ? `bg-green-800 text-white`
                                        : ` rounded-r-2xl ${theme.input} ${theme.textSecondary} ${theme.hoverBg}`
                                        }`}
                                    >
                                      {user.first_name}
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSelected ? ' rounded-r-2xl w-24 opacity-100' : 'w-0 opacity-0'}`}>
                                      <input
                                        type="number"
                                        value={split?.amount || ''}
                                        onChange={(e) => handleSplitAmountChange(index, exp.splits.findIndex(s => s.user === user.id), e.target.value)}
                                        className={`w-24 ${theme.text} bg-green-700/10 px-2 py-2  rounded-r-2xl focus:outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                      // placeholder="Amount"
                                      />
                                    </div>
                                    <div className={`rounded-r-2xl transition-all duration-300 ${isSelected ? 'bg-green-800/50 ' : 'w-0'}`}></div>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-sm text-gray-500"></span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
      <button
        onClick={() => setShowCalculator(!showCalculator)}
        className="fixed bottom-10 right-8 py-2 px-1 rounded-md bg-purple-500/50 hover:bg-purple-500/60 text-white transition-all shadow-md"
      >
        <FaCalculator className="text-3xl rounded-sm" />
      </button>

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed bottom-24 right-6 z-5">
          <div className={`${theme.card} backdrop-blur-xl p-4 rounded-2xl border ${theme.border} shadow-md w-80`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className={`text-lg font-medium ${theme.text}`}>Calculator</h3>
                <p className={`text-xs ${theme.textSecondary}`}>Tip: click calculator icon to minimize</p>
              </div>
              <button
                onClick={() => setShowCalculator(false)}
                className={`${theme.textSecondary} hover:text-red-400`}
              >
                ×
              </button>
            </div>

            <div className={`w-full mb-4 ${theme.input} ${theme.text} px-4 py-2 rounded-xl flex flex-col`}>
              <div className={`text-sm ${theme.textSecondary} max-h-32 overflow-y-auto space-y-1`}>
                {fullHistory.map((hist, index) => (
                  <div key={index} className="text-right">{hist}</div>
                ))}
              </div>
              <div className="text-right text-2xl overflow-x-auto mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {calcResult || '0'}
              </div>
            </div>

            <div className={`grid ${theme.text} grid-cols-4 gap-2`}>
              {[
                '%', '(', ')', 'C',
                '7', '8', '9', '/',
                '4', '5', '6', '*',
                '1', '2', '3', '-',
                '⌫', '0', '=', '+'
              ].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleCalcButtonClick(btn)}
                  className={`${btn === '='
                    ? 'bg-purple-500/50 hover:bg-purple-500/60 text-white'
                    : btn === 'C'
                      ? 'bg-red-500/50 hover:bg-red-500/60 text-white'
                      : btn === '⌫'
                        ? 'bg-yellow-500/50 hover:bg-yellow-500/60 text-white'
                        : `${theme.input} hover:bg-purple-500/10`
                    } p-3 rounded-xl text-lg transition-all`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddExpense;