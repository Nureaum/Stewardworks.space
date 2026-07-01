'use client';

import React, { useState, useEffect } from 'react';
import { Search, Shield, User as UserIcon, AlertCircle, Loader2, Plus, X, Eye, EyeOff } from 'lucide-react';
import { useAdminLoading } from '@/context/AdminLoadingContext';

interface Profile {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role?: string;
  role_name?: string;
  created_at?: string;
}

export default function UserManagement({ isMainAdmin = false }: { isMainAdmin?: boolean }) {
  const { setIsLoading } = useAdminLoading();
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ 
    email: '', 
    first_name: '', 
    last_name: '', 
    role: 'participant', 
    password: '' 
  });
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    console.log("UserManagement mounted, fetching users...");
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    console.log("fetchUsers called");
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/users');
      console.log("fetchUsers response status:", res.status);
      if (!res.ok) {
        const errText = await res.text();
        console.log("fetchUsers error response:", errText);
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      console.log("fetchUsers success, count:", data.users?.length);
      setUsers(data.users || []);
    } catch (err: any) {
      console.error("fetchUsers caught error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setIsAdding(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add user');
      }

      setAddFormData({ email: '', first_name: '', last_name: '', role: 'participant', password: '' });
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRoleChange = async (userId: string, currentRole: string, email: string) => {
    if (!isMainAdmin) {
      alert("Only the Main Admin can change user roles.");
      return;
    }
    
    const newRole = currentRole === 'admin' ? 'participant' : 'admin';
    try {
      setUpdatingId(userId);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole, email }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update role');
      }
      
      const { user: updatedUser } = await res.json();
      
      // Update local state (userId here is clerk_user_id)
      setUsers(users.map(u => u.clerk_user_id === userId ? { ...u, role: newRole, role_name: newRole } : u));
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    const name = (u.full_name || `${u.first_name || ''} ${u.last_name || ''}`).toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-6 rounded-2xl flex items-start gap-4">
        <AlertCircle size={24} />
        <div>
          <h3 className="font-black uppercase tracking-widest">Error Loading Users</h3>
          <p className="text-sm mt-1 opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-black text-steward-dark uppercase tracking-tight">User Management</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Total Users: {users.length}</p>
        </div>
        
        {/* Actions & Search */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {isMainAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-steward-dark text-steward-gold px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
              <Plus size={16} /> Add User
            </button>
          )}
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-steward-gold focus:border-transparent transition-all text-sm font-bold"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">User</th>
              <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Role</th>
              <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Phone</th>
              <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {filteredUsers.map((u) => {
              const currentRole = u.role || 'participant';
              const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';
              const isUpdating = updatingId === u.id;
              const isUserMainAdmin = currentRole === 'super_admin';
              const canEditRole = isMainAdmin && !isUserMainAdmin;
              
              return (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-steward-gold/20 rounded-full flex items-center justify-center text-steward-dark font-black">
                        {u.full_name ? u.full_name.charAt(0).toUpperCase() : (u.email ? u.email.charAt(0).toUpperCase() : '?')}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{u.full_name || `${u.first_name} ${u.last_name}`.trim() || 'Unknown Name'}</div>
                        <div className="text-xs text-gray-500 flex flex-col gap-1">
                           <span>{u.email}</span>
                           {isUserMainAdmin && <span className="bg-steward-gold/20 text-steward-dark text-[9px] px-2 py-0.5 rounded uppercase font-black w-fit">Super Admin</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-[10px] leading-5 font-black uppercase tracking-widest rounded-full border ${isAdmin ? 'bg-steward-dark text-steward-gold border-steward-dark' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {isAdmin ? (
                        <span className="flex items-center gap-1"><Shield size={10} /> Admin</span>
                      ) : (
                        <span className="flex items-center gap-1"><UserIcon size={10} /> Participant</span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {u.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canEditRole ? (
                      <button
                        onClick={() => handleRoleChange(u.clerk_user_id, currentRole, u.email)}
                        disabled={isUpdating}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${isAdmin ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-steward-dark border-steward-dark/20 hover:bg-steward-dark/5'} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto`}
                      >
                        {isUpdating && <Loader2 size={12} className="animate-spin" />}
                        {isAdmin ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                    ) : (
                       <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                         {isUserMainAdmin ? 'Protected' : 'No Access'}
                       </span>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold text-sm">
                  No users found matching "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-black text-steward-dark uppercase tracking-tight mb-6">Add New User</h3>

            {addError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={addFormData.first_name}
                    onChange={(e) => setAddFormData({ ...addFormData, first_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-steward-gold focus:border-transparent outline-none transition-all font-bold text-sm"
                    placeholder="First name"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={addFormData.last_name}
                    onChange={(e) => setAddFormData({ ...addFormData, last_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-steward-gold focus:border-transparent outline-none transition-all font-bold text-sm"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-steward-gold focus:border-transparent outline-none transition-all font-bold text-sm"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Role</label>
                <select
                  value={addFormData.role}
                  onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-steward-gold focus:border-transparent outline-none transition-all font-bold text-sm"
                >
                  <option value="participant">Participant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 pr-10 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-steward-gold focus:border-transparent outline-none transition-all font-bold text-sm"
                    placeholder="Create a password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full bg-steward-dark text-steward-gold py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
              >
                {isAdding && <Loader2 size={16} className="animate-spin" />}
                {isAdding ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
