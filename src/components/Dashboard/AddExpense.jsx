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
      navigate('/dashboard/activity');

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
    <div className="max-w-6xl mx-auto h-screen overflow-hidden py-4">
      <div className={` rounded-2xl border ${theme.border} w-full h-full shadow-2xl relative flex flex-col`}>
        {isLoading ? (
          <div className="flex flex-col w-full items-center justify-center min-h-screen gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400"></div>
            <h1 className="text-xl font-medium text-gray-600 dark:text-gray-300">
              Loading...
            </h1>
          </div>
        ) : groups.length === 0 ? (
          <div className={` backdrop-blur-md h-full dark:bg-black/10 rounded-3xl p-4 text-center border ${theme.border} flex flex-col items-center space-y-6`}>
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
          <div className="p-6 lg:p-8 flex flex-col h-full">
            {/* Header buttons */}
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <button
                type="submit"
                form="expense-form"
                disabled={isSubmitting}
                className="px-4 lg:px-6 py-2.5 text-white rounded-xl bg-green-500/50 hover:bg-green-500/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

              <button
                type="button"
                onClick={addNewExpense}
                className="hidden lg:block px-4 py-2.5 text-white rounded-xl bg-purple-500/50 hover:bg-purple-500/60 transition-all"
              >
                Add Another Bill
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-[#ff000014] backdrop-blur-xl border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-base mb-6 flex-shrink-0">
                {error}
              </div>
            )}

            <form id="expense-form" onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden" noValidate>
              {/* Group selector */}
              <div className='flex-shrink-0 mb-4'>

                // Update the Select component
                <Select
                  value={groups.find(group => group.id === selectedGroup)}
                  onChange={handleGroupSelect}
                  options={groups}
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => option.id}
                  placeholder="Select Group"
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
                  required
                />
              </div>
              {/* Scrollable expenses container */}
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid lg:grid-cols-1 gap-4">

                  {expenses.map((exp, index) => (
                    <div key={exp.id} className={` backdrop-blur-lg bg-gray/20 rounded-2xl border border-gray-300/5 shadow-lg pb-2 px-2 space-y-6`}>
                      <div className="flex justify-end items-center">
                        {expenses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBill(index)}
                            className="px-3 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                        <div className='mt-0'>
                          <input
                            type="text"
                            placeholder="Expense name"
                            value={exp.name}
                            onChange={(e) => handleExpenseUpdate(index, 'name', e.target.value)}
                            className={`flex-1 bg-transparent ${theme.text} px-6 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500 w-full`}
                            required
                          />
                        </div>

                        <div>
                          <div className="h-full w-full">
                            <DatePicker
                              selected={new Date(exp.date)}
                              onChange={(date) => handleExpenseUpdate(index, 'date', date.toISOString().split('T')[0])}
                              maxDate={new Date()}
                              dateFormat="MMM d, yyyy"
                              className={`w-full bg-transparent ${theme.text} px-6 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none cursor-pointer text-lg`}
                              placeholderText="Select date"
                              required
                              wrapperClassName="w-full"
                            />
                          </div>
                        </div>
                        <div className="relative group">
                          <input
                            type="text"
                            pattern="[0-9\+\-\*\/\(\)\.\s]*"
                            placeholder="Amount"
                            value={exp.amount}
                            onChange={(e) => handleAmountChange(index, e.target.value)}
                            className={`w-full bg-transparent ${theme.text} px-6 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500`}
                            required
                          />
                          <div className={`absolute -bottom-50 left-1/2 transform -translate-x-1/2  opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}>
                            <div className={`w-3 h-3 ${theme.card} border ${theme.border} transform rotate-45 absolute -top-1.5 left-1/2 -translate-x-1/2`}></div>
                            <div className={`${theme.card} backdrop-blur-xl p-3 rounded-xl border ${theme.border} shadow-lg w-48`}>
                              <div className={`text-sm ${theme.text}`}>
                                Quick Tip: You can do arithmetic calculations!
                              </div>
                              <div className={`text-xs ${theme.textSecondary} mt-1`}>
                                Try: 100+200, 500/2, etc. just add a space to calculate
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-full">
                          {/* <div className="mb-2 text-sm text-gray-500">Who paid?</div> */}
                          <div className="flex flex-wrap gap-2">
                            <span className="relative px-4 py-2 rounded-2xl text-sm bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                              Paid By <span className='text-green-800'> → </span>
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
                                        ? `bg-purple-800/50 text-white`
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
                                        placeholder="Amount"
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


                      </div>
                      <hr className='border border-gray-600' />
                      {/* <div className="mb-2 text-sm text-gray-500">Paid For?</div> */}
                      <div className="flex flex-wrap gap-1">
                        <span className="relative px-4 py-2 rounded-2xl text-sm bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                          Paid For <span className='text-green-800'> → </span>
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
                                    ? `bg-green-800/50 text-white`
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
                                    placeholder="Amount"
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
        className="fixed bottom-10 right-12 p-4 rounded-full bg-purple-500/50 hover:bg-purple-500/60 text-white transition-all shadow-lg"
      >
        <FaCalculator className="text-xl" />
      </button>

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed bottom-24 right-6 z-50">
          <div className={`${theme.card} backdrop-blur-xl p-4 rounded-2xl border ${theme.border} shadow-xl w-80`}>
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