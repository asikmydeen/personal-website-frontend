import React, { useState, useEffect, useCallback } from 'react';
import { listInvitedUsers, inviteUser, updateUserRole, removeUserAccess } from '../../services/collaborationService'; // Adjust path

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer'); // Default role
  const [inviting, setInviting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // This service should ideally fetch users YOU have invited to collaborate on YOUR items,
      // or if you are an admin, all users in a system you manage.
      // The current `listInvitedUsers` might need context (e.g., itemId, or global admin scope)
      const response = await listInvitedUsers(); // Assuming this lists users relevant to the current admin/user
      if (response.success && response.data.users) {
        setUsers(response.data.users);
      } else {
        setError(response.error || 'Failed to load users.');
        setUsers([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching users.');
      console.error('Fetch users error:', err);
      setUsers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      alert('Please enter an email address.');
      return;
    }
    setInviting(true);
    setError('');
    try {
      // The inviteUser service might need more context, e.g., what item they are being invited to, or system-wide invite
      const response = await inviteUser(inviteEmail, inviteRole /*, optional_item_id */);
      if (response.success) {
        alert(`Invitation sent to ${inviteEmail}`);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('viewer');
        fetchUsers(); // Refresh user list
      } else {
        setError(response.error || 'Failed to send invitation.');
      }
    } catch (err) {
      setError('An unexpected error occurred during invitation.');
      console.error('Invite user error:', err);
    }
    setInviting(false);
  };

  const handleUpdateRole = async (userId, newRole) => {
    // Placeholder: In a real app, you might have a dropdown or modal to select new role
    if (window.confirm(`Change role for user ID ${userId.slice(-5)} to ${newRole}?`)) {
        setLoading(true);
        try {
            const response = await updateUserRole(userId, newRole /*, optional_item_id */);
            if (response.success) {
                fetchUsers();
            } else {
                alert(response.error || "Failed to update role.");
            }
        } catch (e) {
            alert("Error updating role.");
        }
        setLoading(false);
    }
  };

  const handleRemoveAccess = async (userId, userEmail) => {
    if (window.confirm(`Are you sure you want to remove access for ${userEmail}?`)) {
      setLoading(true);
      try {
        const response = await removeUserAccess(userId /*, optional_item_id */);
        if (response.success) {
          fetchUsers(); // Refresh the list
        } else {
          setError(response.error || 'Failed to remove access.');
        }
      } catch (err) {
        setError('An unexpected error occurred during access removal.');
        console.error('Remove access error:', err);
      }
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return <div className="p-4 text-center">Loading user management...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Access Management</h1>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Invite New User
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}

      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
            <form onSubmit={handleInviteUser}>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Invite User to Collaborate</h2>
              {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md mb-2">{error}</p>}
              <div>
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700">Email Address*</label>
                <input 
                  type="email" 
                  id="inviteEmail" 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="user@example.com"
                />
              </div>
              <div className="mt-3">
                <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700">Role*</label>
                <select 
                  id="inviteRole" 
                  value={inviteRole} 
                  onChange={(e) => setInviteRole(e.target.value)} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  {/* Add other roles as defined by your system */}
                  {/* <option value="admin">Admin (for specific item)</option> */}
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">Note: The invited user will receive an email. They may need to register if they don't have an account.</p>
              <div className="flex justify-end space-x-3 mt-4 pt-3 border-t">
                <button type="button" onClick={() => {setShowInviteModal(false); setError('');}} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={inviting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {users.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs" title={user.email}>{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* Placeholder for role editing - could be a dropdown */}
                    <select value={user.role} onChange={(e) => handleUpdateRole(user.id, e.target.value)} className="text-sm p-1 border border-gray-300 rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        {/* <option value="admin">Admin</option> */}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {user.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleRemoveAccess(user.id, user.email)} className="text-red-600 hover:text-red-900">Remove Access</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <p className="text-center text-gray-500 py-10 text-lg">No users have been invited or granted access yet.</p>
      )}
    </div>
  );
};

export default UserManagementPage;

