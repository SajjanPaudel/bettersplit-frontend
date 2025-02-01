import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';

function AddExpenseModal({ onClose, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [expense, setExpense] = useState({
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paid_by: '',
    splits: [{ user: '', amount: '' }]
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get('http://127.0.0.1:8000/api/users/', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        setUsers(response.data.data);
        if (response.data.data.length > 0) {
          setExpense(prev => ({
            ...prev,
            paid_by: response.data.data[0].id
          }));
        }
      } catch (err) {
        setError('Failed to fetch users');
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem('access_token');
      await axios.post('http://127.0.0.1:8000/api/split/expenses/', expense, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      onSuccess();
    } catch (err) {
      setError('Failed to add expense');
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

  const handleAmountChange = (value) => {
    const newAmount = value;
    setExpense(prev => {
      const equalAmount = newAmount ? (parseFloat(newAmount) / (selectedUsers.length || 1)).toFixed(2) : '';
      return {
        ...prev,
        amount: newAmount,
        splits: selectedUsers.map(userId => ({
          user: userId,
          amount: equalAmount
        }))
      };
    });
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start lg:items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1A1A1F] rounded-2xl w-full max-w-2xl my-4 lg:my-0">
        <div className="p-4 lg:p-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-lg"
            >
              ← Back
            </button>
            <button
              type="submit"
              form="expense-form"
              className="px-4 lg:px-6 py-2.5 bg-[#ffffff14] text-white rounded-xl hover:bg-[#ffffff1f] transition-all"
            >
              Save
            </button>
          </div>

          {error && (
            <div className="bg-[#ff000014] backdrop-blur-xl border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-base mb-6">
              {error}
            </div>
          )}

          <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="bg-[#ffffff0a] backdrop-blur-xl rounded-2xl border border-[#ffffff1a] p-4 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-4 items-start">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Description</div>
                    <input
                      type="text"
                      placeholder="What was this expense for?"
                      value={expense.name}
                      onChange={(e) => setExpense(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1 bg-[#ffffff0a] text-white px-6 py-3 rounded-xl border border-[#ffffff1a] focus:border-[#ffffff33] focus:outline-none text-lg placeholder-gray-500 w-full"
                      required
                    />
                  </div>

                  <div>
                    <div className="text-gray-400 text-sm mb-1">Date</div>
                    <input
                      type="date"
                      value={expense.date}
                      onChange={(e) => setExpense(prev => ({ ...prev, date: e.target.value }))}
                      className="w-48 bg-[#ffffff0a] text-white px-4 py-3 rounded-xl border border-[#ffffff1a] focus:border-[#ffffff33] focus:outline-none cursor-pointer appearance-none"
                      style={{ colorScheme: 'dark' }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Paid by</div>
                      <select
                        value={expense.paid_by}
                        onChange={(e) => setExpense(prev => ({ ...prev, paid_by: e.target.value }))}
                        className="w-full bg-[#ffffff0a] text-white px-6 py-3 rounded-xl border border-[#ffffff1a] focus:border-[#ffffff33] focus:outline-none text-lg appearance-none cursor-pointer bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNCA2TDggMTBMMTIgNiIgc3Ryb2tlPSIjOTA5MDkwIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-no-repeat bg-[center_right_1rem]"
                        required
                      >
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Total Amount</div>
                      <input
                        type="number"
                        placeholder="Amount"
                        value={expense.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="w-full bg-[#ffffff0a] text-white px-6 py-3 rounded-xl border border-[#ffffff1a] focus:border-[#ffffff33] focus:outline-none text-lg placeholder-gray-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-sm mb-2">Split with</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {users.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelection(user.id)}
                          className={`px-4 py-2 rounded-xl text-sm transition-all ${
                            selectedUsers.includes(user.id)
                              ? 'bg-[#ffffff14] text-white'
                              : 'bg-[#ffffff0a] text-gray-400 hover:bg-[#ffffff14]'
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

            <div className="bg-[#ffffff0a] backdrop-blur-xl rounded-2xl border border-[#ffffff1a] p-2 space-y-6">
              <div className="space-y-1">
                {expense.splits.map((split, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1 text-white px-6 py-2 rounded-xl bg-[#ffffff0a] border border-[#ffffff1a]">
                      {users.find(u => u.id === split.user)?.first_name} {users.find(u => u.id === split.user)?.last_name}
                    </div>
                    <input
                      type="number"
                      value={split.amount}
                      onChange={(e) => updateSplit(index, 'amount', e.target.value)}
                      className="w-40 bg-[#ffffff0a] text-white px-6 py-2 rounded-xl border border-[#ffffff1a] focus:border-[#ffffff33] focus:outline-none"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddExpenseModal;