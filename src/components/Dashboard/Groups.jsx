import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { endpoints } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

function Groups() {
  const { theme } = useTheme();
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.get(endpoints.groups, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      setGroups(response.data.data);
    } catch (err) {
      setError('Failed to fetch groups');
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className={`${theme.card} rounded-2xl border ${theme.border} w-full my-4 lg:my-0 shadow-2xl`}>
        <div className="p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-2xl font-light ${theme.text}`}>Groups</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 text-white rounded-xl bg-purple-500/50 hover:bg-purple-500/60 transition-all"
            >
              Create New Group
            </button>
          </div>

          {error && (
            <div className="bg-[#ff000014] backdrop-blur-xl border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-base mb-6">
              {error}
            </div>
          )}

          {groups.length === 0 ? (
            <div className={`${theme.input} backdrop-blur-md bg-white/10 dark:bg-black/10 rounded-2xl p-8 text-center border ${theme.border}`}>
              <div className={theme.textSecondary}>👍 No groups found</div>
              <p className={`text-sm ${theme.textSecondary}`}>Please Create a group before adding expenses</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              {groups.map(group => (
                <div
                  key={group.id}
                  onClick={() => handleGroupClick(group.id)}
                  className={`${theme.input} backdrop-blur-xl rounded-2xl border ${theme.inputBorder} p-4 cursor-pointer hover:bg-white/5 transition-all`}
                >
                  <h3 className={`${theme.text} text-xl font-medium mb-4`}>{group.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.members.map(member => (
                      <span
                        key={member}
                        className={`px-3 py-1.5 rounded-lg text-sm ${theme.input} ${theme.textSecondary}`}
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`${theme.card} backdrop-blur-md bg-white/10 dark:bg-black/10 p-8 rounded-2xl shadow-xl max-w-md w-full border ${theme.border}`}>
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
                  className={`flex-1 px-4 py-2 border ${theme.border} rounded-lg ${theme.textSecondary} ${theme.cardHover} transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-500/50 text-white rounded-lg hover:bg-purple-500/60 transition-colors"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Groups;