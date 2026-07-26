'use client';

import React, { useState, useEffect } from 'react';
import { Search, Shield, User as UserIcon, AlertCircle, Loader2, Plus, X, Eye, EyeOff, Mail, Trash2 } from 'lucide-react';
import { useAdminLoading } from '@/context/AdminLoadingContext';
import toast from 'react-hot-toast';

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
  const [roleFilter, setRoleFilter] = useState('all');
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setIsInviting(true);

    try {
      const res = await fetch('/api/admin/invite-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to invite guest');
      }

      setInviteEmail('');
      setIsInviteModalOpen(false);
      toast.success('Guest invited successfully!');
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget || deleteConfirmText !== 'DELETE') return;
    
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget.clerk_user_id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      // Remove user from local state
      setUsers(users.filter(u => u.clerk_user_id !== deleteTarget.clerk_user_id));
      setDeleteTarget(null);
      setDeleteConfirmText('');
    } catch (err: any) {
      toast.error(`Error deleting user: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string, email: string) => {
    if (!isMainAdmin) {
      toast.error("Only the Main Admin can change user roles.");
      return;
    }
    
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
      toast.error(`Error updating role: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    const name = (u.full_name || `${u.first_name || ''} ${u.last_name || ''}`).toLowerCase();
    const email = (u.email || '').toLowerCase();
    const matchesSearch = name.includes(query) || email.includes(query);
    
    const currentRole = u.role || 'participant';
    let matchesRole = true;
    if (roleFilter === 'participants') matchesRole = currentRole === 'participant';
    if (roleFilter === 'admins') matchesRole = currentRole === 'admin';
    if (roleFilter === 'superadmins') matchesRole = currentRole === 'super_admin';
    if (roleFilter === 'guests') matchesRole = currentRole === 'guest';
    
    return matchesSearch && matchesRole;
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
    <div className="animate-[ac-fade_0.3s_ease] w-full">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="m-0 text-[30px] font-[800] text-[#241c12] uppercase tracking-normal">User Management</h1>
          <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-[#9c8d76] uppercase">Total Users: {users.length}</p>
        </div>
        
        {/* Actions */}
        {isMainAdmin && (
          <div className="flex flex-col sm:flex-row gap-[10px] w-full md:w-auto items-center">
            <div className="flex gap-2 h-full">
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-white text-[#241c12] px-6 py-[11px] h-full rounded-[14px] font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-2 hover:bg-[#fbf5e6] transition-colors shadow-[0_4px_12px_rgba(36,28,18,0.05)] border border-[#785a32]/20"
              >
                <Mail size={16} /> Invite Guest
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#241c12] text-[#efd9a8] px-6 py-[11px] h-full rounded-[14px] font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_4px_12px_rgba(36,28,18,0.2)] border border-transparent"
              >
                <Plus size={16} /> Add User
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-[10px] bg-white border border-[#785a32]/16 rounded-[14px] px-[18px] py-[13px] w-full shadow-[0_4px_12px_rgba(120,90,50,0.07)] mb-4 transition-shadow focus-within:shadow-[0_4px_20px_rgba(120,90,50,0.15)] focus-within:border-[#785a32]/30">
        <Search size={20} className="text-[#a89a82]" />
        <input
          type="text"
          className="flex-1 border-none bg-transparent text-[16px] text-[#241c12] focus:outline-none placeholder:text-[#a89a82]"
          placeholder="Search emails, usernames..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Role Filters */}
      <div className="flex flex-wrap gap-2 mt-4">
        {['All', 'Participants', 'Admins', 'Superadmins', 'Guests'].map(filter => (
          <button
            key={filter}
            onClick={() => setRoleFilter(filter.toLowerCase())}
            className={`px-4 py-2 rounded-[12px] text-[11px] font-black uppercase tracking-[0.12em] transition-colors ${roleFilter === filter.toLowerCase() ? 'bg-[#241c12] text-[#efd9a8] shadow-md' : 'bg-white text-[#8a7c66] border border-[#785a32]/20 hover:bg-[#fbf5e6]'}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[22px] mt-[22px] shadow-[0_14px_34px_rgba(120,90,50,0.1)] border border-[#785a32]/10 overflow-x-auto">
        <table className="min-w-full divide-y divide-[#785a32]/10">
          <thead className="bg-[#fbf5e6] border-b border-[#785a32]/10">
            <tr>
              <th scope="col" className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">User</th>
              <th scope="col" className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Role</th>
              <th scope="col" className="px-[28px] py-[18px] text-left text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Phone</th>
              <th scope="col" className="px-[28px] py-[18px] text-right text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em]">Access</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#785a32]/5">
            {filteredUsers.map((u) => {
              const currentRole = u.role || 'participant';
              const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';
              const isUpdating = updatingId === u.clerk_user_id;
              const isUserMainAdmin = currentRole === 'super_admin';
              const canEditRole = isMainAdmin && !isUserMainAdmin;
              
              return (
                <tr key={u.id} className="hover:bg-[#fbf5e6]/30 transition-colors">
                  <td className="px-[28px] py-[18px] whitespace-nowrap">
                    <div className="flex items-center gap-[15px] min-w-0">
                      <div className="flex-shrink-0 h-[42px] w-[42px] bg-[#2f5a37]/10 rounded-[11px] flex items-center justify-center text-[#2f5a37] text-[18px] font-black">
                        {u.full_name ? u.full_name.charAt(0).toUpperCase() : (u.email ? u.email.charAt(0).toUpperCase() : '?')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[15px] text-[#241c12]">{u.full_name || `${u.first_name} ${u.last_name}`.trim() || 'Unknown Name'}</div>
                        <div className="text-[13px] text-[#8a7c66] overflow-hidden text-ellipsis">{u.email}</div>
                        {isUserMainAdmin && (
                           <span className="inline-block mt-[6px] font-mono text-[9.5px] tracking-[0.12em] bg-[#efd9a8] text-[#7a5a1e] px-[9px] py-[3px] rounded-[6px] uppercase">SUPER ADMIN</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-[28px] py-[18px] whitespace-nowrap">
                    <span className={`px-[12px] py-[4px] inline-flex text-[10px] leading-[14px] font-black uppercase tracking-[0.12em] rounded-full border ${isAdmin ? 'bg-[#241c12] text-[#efd9a8] border-[#241c12]' : 'bg-[#fbf5e6] text-[#8a7c66] border-[#efd9a8]'}`}>
                      {isAdmin ? (
                        <span className="flex items-center gap-1"><Shield size={10} /> Admin</span>
                      ) : currentRole === 'guest' ? (
                        <span className="flex items-center gap-1"><UserIcon size={10} /> Guest</span>
                      ) : (
                        <span className="flex items-center gap-1"><UserIcon size={10} /> Participant</span>
                      )}
                    </span>
                  </td>
                  <td className="px-[28px] py-[18px] whitespace-nowrap text-[14px] text-[#8a7c66]">
                    {u.phone || 'N/A'}
                  </td>
                  <td className="px-[28px] py-[18px] whitespace-nowrap text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {canEditRole ? (
                        <>
                          <div className="relative flex items-center">
                            {isUpdating && <Loader2 size={12} className="animate-spin absolute -left-5 text-[#7a5a1e]" />}
                            <select
                              value={currentRole}
                              onChange={(e) => handleRoleChange(u.clerk_user_id, e.target.value, u.email)}
                              disabled={isUpdating}
                              className={`font-mono text-[10px] uppercase tracking-[0.12em] px-[12px] py-[6px] rounded-[8px] border transition-all ${isAdmin ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-[#7a5a1e] border-[#efd9a8] hover:bg-[#fbf5e6]'} disabled:opacity-50 disabled:cursor-not-allowed bg-transparent outline-none cursor-pointer appearance-none`}
                            >
                              <option value="participant">Participant</option>
                              <option value="guest">Guest</option>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Superadmin</option>
                            </select>
                          </div>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="font-mono text-[10px] uppercase tracking-[0.12em] px-[10px] py-[8px] rounded-[8px] border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition-all flex items-center gap-1"
                            title="Delete user"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                         <span className="font-mono text-[10px] tracking-[0.12em] text-[#a89a82] uppercase">
                           {isUserMainAdmin ? 'Protected' : 'No Access'}
                         </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-[28px] py-[40px] text-center text-[#8a7c66] font-bold text-[14px]">
                  No users found matching "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#171009]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fbf5e6] rounded-[22px] p-[34px] max-w-md w-full relative shadow-[0_14px_34px_rgba(120,90,50,0.2)] border border-[#785a32]/10">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-6 top-6 text-[#a89a82] hover:text-[#241c12] transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-[24px] font-[800] text-[#241c12] uppercase tracking-normal mb-6">Add New User</h3>

            {addError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em] mb-[6px]">First Name</label>
                  <input
                    type="text"
                    required
                    value={addFormData.first_name}
                    onChange={(e) => setAddFormData({ ...addFormData, first_name: e.target.value })}
                    className="w-full bg-white border border-[#785a32]/16 rounded-[14px] p-[11px_16px] focus:outline-none focus:ring-1 focus:ring-[#785a32]/30 text-[14.5px] text-[#241c12] placeholder-[#a89a82] transition-all"
                    placeholder="First name"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em] mb-[6px]">Last Name</label>
                  <input
                    type="text"
                    required
                    value={addFormData.last_name}
                    onChange={(e) => setAddFormData({ ...addFormData, last_name: e.target.value })}
                    className="w-full bg-white border border-[#785a32]/16 rounded-[14px] p-[11px_16px] focus:outline-none focus:ring-1 focus:ring-[#785a32]/30 text-[14.5px] text-[#241c12] placeholder-[#a89a82] transition-all"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em] mb-[6px]">Email Address</label>
                <input
                  type="email"
                  required
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  className="w-full bg-white border border-[#785a32]/16 rounded-[14px] p-[11px_16px] focus:outline-none focus:ring-1 focus:ring-[#785a32]/30 text-[14.5px] text-[#241c12] placeholder-[#a89a82] transition-all"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em] mb-[6px]">Role</label>
                <select
                  value={addFormData.role}
                  onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                  className="w-full bg-white border border-[#785a32]/16 rounded-[14px] p-[11px_16px] focus:outline-none focus:ring-1 focus:ring-[#785a32]/30 text-[14.5px] text-[#241c12] transition-all appearance-none"
                >
                  <option value="participant">Participant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em] mb-[6px]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                    className="w-full bg-white border border-[#785a32]/16 rounded-[14px] p-[11px_16px] pr-10 focus:outline-none focus:ring-1 focus:ring-[#785a32]/30 text-[14.5px] text-[#241c12] placeholder-[#a89a82] transition-all"
                    placeholder="Create a password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#a89a82] hover:text-[#241c12] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full bg-[#241c12] text-[#efd9a8] py-[14px] rounded-[14px] font-black uppercase tracking-[0.12em] text-[12px] hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-[24px] flex justify-center items-center gap-2 shadow-[0_6px_16px_rgba(36,28,18,0.2)]"
              >
                {isAdding && <Loader2 size={16} className="animate-spin" />}
                {isAdding ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invite Guest Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-[#171009]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fbf5e6] rounded-[22px] p-[34px] max-w-md w-full relative shadow-[0_14px_34px_rgba(120,90,50,0.2)] border border-[#785a32]/10">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute right-6 top-6 text-[#a89a82] hover:text-[#241c12] transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-[24px] font-[800] text-[#241c12] uppercase tracking-normal mb-6">Invite Guest</h3>
            <p className="text-sm text-[#8a7c66] mb-6">Send an invitation link to a contributor. They will automatically be assigned the Guest role upon signing up.</p>

            {inviteError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em] mb-[6px]">Guest Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white border border-[#785a32]/16 rounded-[14px] p-[11px_16px] focus:outline-none focus:ring-1 focus:ring-[#785a32]/30 text-[14.5px] text-[#241c12] placeholder-[#a89a82] transition-all"
                  placeholder="Enter email address to invite"
                />
              </div>

              <button
                type="submit"
                disabled={isInviting}
                className="w-full bg-[#241c12] text-[#efd9a8] py-[14px] rounded-[14px] font-black uppercase tracking-[0.12em] text-[12px] hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-[24px] flex justify-center items-center gap-2 shadow-[0_6px_16px_rgba(36,28,18,0.2)]"
              >
                {isInviting && <Loader2 size={16} className="animate-spin" />}
                {isInviting ? 'Sending Invite...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-[#171009]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fbf5e6] rounded-[22px] p-[34px] max-w-md w-full relative shadow-[0_14px_34px_rgba(120,90,50,0.2)] border border-red-200">
            <button
              onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}
              className="absolute right-6 top-6 text-[#a89a82] hover:text-[#241c12] transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-[42px] h-[42px] bg-red-100 rounded-[11px] flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-[22px] font-[800] text-[#241c12] uppercase tracking-normal">Delete User</h3>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-[14px] p-4 mb-6">
              <p className="text-[13px] text-red-700 font-bold mb-1">⚠️ This action is permanent and cannot be undone.</p>
              <p className="text-[12px] text-red-600">The user will be removed from both the authentication system (Clerk) and the database. All their data will be lost.</p>
            </div>

            <div className="mb-6">
              <p className="text-[13px] text-[#241c12] font-bold mb-1">You are about to delete:</p>
              <div className="bg-white rounded-[11px] p-3 border border-[#785a32]/10">
                <p className="text-[14px] font-bold text-[#241c12]">{deleteTarget.full_name || `${deleteTarget.first_name} ${deleteTarget.last_name}`.trim() || 'Unknown'}</p>
                <p className="text-[12px] text-[#8a7c66]">{deleteTarget.email}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[11px] font-mono text-[#a89a82] uppercase tracking-[0.16em] mb-[6px]">Type DELETE to confirm</label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full bg-white border border-red-200 rounded-[14px] p-[11px_16px] focus:outline-none focus:ring-1 focus:ring-red-300 text-[14.5px] text-[#241c12] placeholder-[#a89a82] transition-all"
                placeholder="Type DELETE"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}
                className="flex-1 bg-white text-[#241c12] py-[14px] rounded-[14px] font-black uppercase tracking-[0.12em] text-[12px] hover:bg-[#f5f5f5] transition-colors border border-[#785a32]/20"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 bg-red-600 text-white py-[14px] rounded-[14px] font-black uppercase tracking-[0.12em] text-[12px] hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_6px_16px_rgba(220,38,38,0.3)]"
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
