import { FaTimes } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import '../../index.css'
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { endpoints } from '../../config/api';
import { toast } from'react-hot-toast';

function AddExpenseModal({ onClose, onSuccess }) {
  const { theme, isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');

  const [expense, setExpense] = useState({
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paid_by: '',
    splits: [{ user: '', amount: '' }],
    selectedUsers: [],
    group: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get(endpoints.users, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        setUsers(response.data.data);
      } catch (err) {
        setError('Failed to fetch users');
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
        setError('Failed to fetch users');
      }
    };
    fetchGroups();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!selectedGroup) {
        setError('Please select a group');
        return;
      }

      for (const exp of expense) {
        exp.amount= parseFloat(exp.amount);
        if (!exp.name || !exp.amount || !exp.paid_by || exp.selectedUsers.length === 0) {
          setError('Please fill in all required fields for each expense');
          return;
        }
      }

      await axios.post(endpoints.expenses, expense, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      onSuccess();
      toast.success('Expense added successfully');
    } catch (err) {
      toast.error('Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelection = (userId) => {
    const isSelected = selectedUsers.includes(userId);
    const newSelectedUsers = isSelected
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];

    setSelectedUsers(newSelectedUsers);

    const equalAmount = expense.amount ? (parseFloat(expense.amount) / (newSelectedUsers.length || 1)).toFixed(2) : '';
    setExpense(prev => ({
      ...prev,
      splits: newSelectedUsers.map(id => ({
        user: id,
        amount: equalAmount
      }))
    }));
  };

  // Update handleAmountChange
  const handleAmountChange = (value) => {
    // Check if the value ends with a space and contains arithmetic operations
    if (value.endsWith(' ') && /[+\-*/]/.test(value)) {
      try {
        // Remove the space and evaluate the expression
        const expression = value.trim();
        const result = eval(expression).toString();
        value = result;
      } catch (error) {
        // If evaluation fails, keep the original value without the space
        value = value.trim();
      }
    }

    const equalAmount = value
      ? (parseFloat(value) / (selectedUsers.length || 1)).toFixed(2)
      : '';

    setExpense(prev => ({
      ...prev,
      amount: value,
      splits: selectedUsers.map(userId => ({
        user: userId,
        amount: equalAmount
      }))
    }));
  };

  // Update handleSplitAmountChange
  const handleSplitAmountChange = (splitIndex, value) => {
    const totalAmount = parseFloat(expense.amount) || 0;
    const newSplits = [...expense.splits];

    // Update the changed split amount
    newSplits[splitIndex] = {
      ...newSplits[splitIndex],
      amount: value,
      isManuallySet: true
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

    setExpense(prev => ({
      ...prev,
      splits: newSplits
    }));
  };

  const updateSplit = (index, field, value) => {
    setExpense(prev => ({
      ...prev,
      splits: prev.splits.map((split, i) =>
        i === index ? { ...split, [field]: value } : split
      )
    }));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 rounded-2xl backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className={`${theme.card} rounded-2xl border ${theme.border} w-full max-w-2xl my-4 lg:my-0 shadow-2xl relative before:absolute before:inset-0 before:bg-gradient-to-b  before:rounded-2xl before:pointer-events-none`}>
        <div className="p-6 lg:p-8 relative">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={onClose}
              className={`${theme.textSecondary} hover:${theme.text} transition-colors text-lg`}
            >
              <FaTimes className="text-xl" />
            </button>
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
                  'Save'
                )}
              </button>
          </div>

          {error && (
            <div className="bg-[#ff000014] backdrop-blur-xl border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-base mb-6">
              {error}
            </div>
          )}

          <form id="expense-form" onSubmit={handleSubmit} className="space-y-2">
            <div>
              <div className={`${theme.input} backdrop-blur-xl rounded-2xl border ${theme.inputBorder} p-4 space-y-6`}>
              <div className="grid grid-cols-1 gap-4 items-start">
                    <div>
                      <Select
                        value={groups.find(group => group.id === expense.group)}
                        onChange={(selected) => setExpense(prev => ({ ...prev, group: selected.id }))}
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
                  </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-4 items-start">
                  <div>
                    {/* <div className={theme.textSecondary}>Description</div> */}
                    <input
                      type="text"
                      placeholder="What was this expense for?"
                      value={expense.name}
                      onChange={(e) => setExpense(prev => ({ ...prev, name: e.target.value }))}
                      className={`flex-1 ${theme.input} ${theme.text} px-6 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500 w-full`}
                      required
                    />
                  </div>

                  <div>
                    <DatePicker
                      selected={new Date(expense.date)}
                      onChange={(date) => setExpense(prev => ({ 
                        ...prev, 
                        date: date.toISOString().split('T')[0] 
                      }))}
                      maxDate={new Date()}
                      dateFormat="MMM d, yyyy"
                      className={`w-48 ${theme.input} ${theme.text} px-4 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none cursor-pointer`}
                      placeholderText="Select date"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {/* <div className={theme.textSecondary}>Paid by</div> */}
                      <Select
                      value={users.find(user => user.id === expense.paid_by)}
                      onChange={(selected) => setExpense(prev => ({ ...prev, paid_by: selected.id }))}
                      options={users}
                      getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                      getOptionValue={(option) => option.id}
                      placeholder="Who paid?"
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
                    <div>
                      {/* <div className={theme.textSecondary}>Total Amount</div> */}
                      {/* Update the amount input */}
                        <input
                          type="text"
                          pattern="[0-9+\-*/.() ]*"
                          placeholder="Amount"
                          value={expense.amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className={`w-full ${theme.input} ${theme.text} px-6 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputFocus} focus:outline-none text-lg placeholder-gray-500`}
                          required
                        />

                    </div>
                  </div>

                  <div>
                    {/* <div className={theme.textSecondary}>Split with</div> */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {users.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelection(user.id)}
                          className={`px-4 py-2 rounded-xl text-sm transition-all ${
                            selectedUsers.includes(user.id)
                              ? `bg-green-800/50 text-white`
                              : `${theme.input} ${theme.textSecondary} ${theme.hoverBg}`
                          }`}
                        >
                          {user.first_name} {user.last_name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {selectedUsers.length > 0 && (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4`}>
                {expense.splits.map((split, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-green-800/50 text-white/70">
                    <div className={`w-1/2 ${theme.text} px-6 py-2 rounded-xl ${theme.input} border ${theme.inputBorder}`}>
                      {users.find(u => u.id === split.user)?.first_name} 
                    </div>
                    <input
                      type="number"
                      value={split.amount}
                      onChange={(e) => handleSplitAmountChange(index, e.target.value)}
                      className={`w-1/2 ${theme.text} px-6 py-2 rounded-xl ${theme.input} border ${theme.inputBorder}`}
                      required
                    />
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddExpenseModal;