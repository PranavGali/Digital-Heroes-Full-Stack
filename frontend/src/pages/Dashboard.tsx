import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  AlertCircle,
  UserCheck2,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  Mail,
  Phone,
  UserPlus,
  X,
} from 'lucide-react';

interface LeadItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Won' | 'Lost';
  source?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Leads state
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Users list (for assignment dropdown)
  const [usersList, setUsersList] = useState<UserItem[]>([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Lead stats counts
  const [stats, setStats] = useState({
    total: 0,
    newLeads: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    won: 0,
    lost: 0,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLeadError, setNewLeadError] = useState<string | null>(null);
  const [newLeadSubmitting, setNewLeadSubmitting] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'New',
    assignedTo: '',
  });

  // Fetch leads and recalculate stats
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string
      const params: any = {
        page: currentPage,
        limit: 8,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      };

      if (isAdmin && assigneeFilter) {
        params.assignedTo = assigneeFilter;
      }

      const response = await apiClient.get('/leads', { params });
      if (response.data.success) {
        setLeads(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalLeads(response.data.pagination.totalLeads);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch leads.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, assigneeFilter, sortBy, sortOrder, isAdmin]);

  // Separate call to fetch stats without paginated filters
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/leads', {
        params: { limit: 1000 }, // Get all visible leads
      });
      if (response.data.success) {
        const allLeads: LeadItem[] = response.data.data;
        setStats({
          total: allLeads.length,
          newLeads: allLeads.filter((l) => l.status === 'New').length,
          contacted: allLeads.filter((l) => l.status === 'Contacted').length,
          qualified: allLeads.filter((l) => l.status === 'Qualified').length,
          proposal: allLeads.filter((l) => l.status === 'Proposal Sent').length,
          won: allLeads.filter((l) => l.status === 'Won').length,
          lost: allLeads.filter((l) => l.status === 'Lost').length,
        });
      }
    } catch (err) {
      console.error('Failed to compute stats:', err);
    }
  }, []);

  // Fetch Users for assignment
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await apiClient.get('/users');
      if (response.data.success) {
        setUsersList(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load user list for assignments', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads, fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle lead assignment change in table
  const handleAssignChange = async (leadId: string, userId: string) => {
    try {
      await apiClient.put(`/leads/${leadId}/assign`, {
        assignedTo: userId === 'unassigned' ? null : userId,
      });
      fetchLeads();
      fetchStats();
    } catch (err) {
      alert('Error updating assignment.');
    }
  };

  // Handle Modal submission
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewLeadSubmitting(true);
    setNewLeadError(null);

    const { name, email, phone, company, status, assignedTo } = newLeadData;
    if (!name || !email || !phone) {
      setNewLeadError('Name, email, and phone are required.');
      setNewLeadSubmitting(false);
      return;
    }

    try {
      await apiClient.post('/leads', {
        name,
        email,
        phone,
        company: company || undefined,
        status,
        assignedTo: assignedTo || undefined,
      });

      setIsModalOpen(false);
      // Reset form
      setNewLeadData({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'New',
        assignedTo: '',
      });

      // Refetch
      fetchLeads();
      fetchStats();
    } catch (err: any) {
      setNewLeadError(err.response?.data?.message || 'Failed to create lead.');
    } finally {
      setNewLeadSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const base = 'px-2 py-1 rounded-full text-xs font-semibold border ';
    switch (status) {
      case 'New':
        return `${base} bg-blue-500/10 text-blue-400 border-blue-500/20`;
      case 'Contacted':
        return `${base} bg-purple-500/10 text-purple-400 border-purple-500/20`;
      case 'Qualified':
        return `${base} bg-amber-500/10 text-amber-400 border-amber-500/20`;
      case 'Proposal Sent':
        return `${base} bg-indigo-500/10 text-indigo-400 border-indigo-500/20`;
      case 'Won':
        return `${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`;
      case 'Lost':
        return `${base} bg-rose-500/10 text-rose-400 border-rose-500/20`;
      default:
        return `${base} bg-slate-500/10 text-slate-400 border-slate-550`;
    }
  };

  return (
    <div className="flex-grow px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Workspace Dashboard <Sparkles className="w-5 h-5 text-indigo-450 animate-bounce" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Logged in as <span className="font-semibold text-slate-300">{user?.name}</span> ({user?.role})
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 py-2.5 px-4 bg-gradient-to-r from-accentIndigo to-indigo-650 rounded-lg text-sm font-semibold text-white hover:opacity-95 hover:shadow-lg hover:shadow-accentIndigo/15 transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Create New Lead
        </button>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-xl border border-darkBorder/40">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-darkBorder/40">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">New</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.newLeads}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-darkBorder/40">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Contacted</span>
            <Phone className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.contacted}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-darkBorder/40">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Qualified</span>
            <UserCheck2 className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.qualified}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-darkBorder/40">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Proposal</span>
            <Mail className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.proposal}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-darkBorder/40 border-emerald-500/20">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-450">Won</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-450">{stats.won}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-darkBorder/40 border-rose-500/20">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-450">Lost</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-450">{stats.lost}</p>
        </div>
      </div>

      {/* Filter and Table Panel */}
      <div className="glass-panel rounded-xl border border-darkBorder/50 overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 bg-slate-900/30 border-b border-darkBorder/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, company..."
              className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-darkBorder rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentIndigo transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="w-full md:w-auto flex flex-wrap gap-3 items-center justify-end">
            <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              className="px-3 py-2 bg-slate-900 border border-darkBorder rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-accentIndigo cursor-pointer"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>

            {isAdmin && (
              <select
                className="px-3 py-2 bg-slate-900 border border-darkBorder rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-accentIndigo cursor-pointer"
                value={assigneeFilter}
                onChange={(e) => {
                  setAssigneeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {usersList.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            )}

            <select
              className="px-3 py-2 bg-slate-900 border border-darkBorder rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-accentIndigo cursor-pointer"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
                setCurrentPage(1);
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Lead Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 rounded-full border-accentIndigo border-t-transparent animate-spin"></div>
              <p className="text-xs font-medium text-slate-500">Querying records...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-400 gap-2">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-550 gap-2">
              <Users className="w-10 h-10 mb-2 text-slate-600" />
              <p className="text-sm font-medium">No leads found matching current criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-darkBorder/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Lead Name</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4">Assignee</th>}
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-darkBorder/30 text-sm">
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-slate-800/35 transition-colors cursor-pointer group"
                    onClick={() => window.location.href = `/leads/${lead._id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white group-hover:text-accentIndigo transition-colors">
                        {lead.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-350 font-medium">
                      {lead.company || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <span className={getStatusBadge(lead.status)}>{lead.status}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          className="px-2.5 py-1 bg-slate-900 border border-darkBorder/70 rounded text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-accentIndigo cursor-pointer"
                          value={lead.assignedTo?._id || 'unassigned'}
                          onChange={(e) => handleAssignChange(lead._id, e.target.value)}
                        >
                          <option value="unassigned">Unassigned</option>
                          {usersList.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="px-6 py-4 text-xs text-slate-500">{lead.source}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(lead.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/leads/${lead._id}`}
                        className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/70 hover:bg-slate-750 border border-darkBorder/80 px-3 py-1.5 rounded transition-all"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Pagination Controls */}
        {!loading && leads.length > 0 && (
          <div className="px-6 py-4 bg-slate-900/35 border-t border-darkBorder/40 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-300">{leads.length}</span> of{' '}
              <span className="font-semibold text-slate-300">{totalLeads}</span> records
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1.5 bg-slate-800 border border-darkBorder/70 rounded disabled:opacity-40 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center px-2 font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 bg-slate-800 border border-darkBorder/70 rounded disabled:opacity-40 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel border border-darkBorder/80 rounded-2xl p-6 shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-accentIndigo" /> Create New Lead Record
            </h2>

            {newLeadError && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg flex items-start gap-2 text-xs text-red-400 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{newLeadError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Miller"
                    className="block w-full px-3 py-2 bg-slate-900 border border-darkBorder rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-accentIndigo"
                    value={newLeadData.name}
                    onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jane@tech.com"
                    className="block w-full px-3 py-2 bg-slate-900 border border-darkBorder rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-accentIndigo"
                    value={newLeadData.email}
                    onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="555-0133"
                    className="block w-full px-3 py-2 bg-slate-900 border border-darkBorder rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-accentIndigo"
                    value={newLeadData.phone}
                    onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="Tech LLC"
                    className="block w-full px-3 py-2 bg-slate-900 border border-darkBorder rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-accentIndigo"
                    value={newLeadData.company}
                    onChange={(e) => setNewLeadData({ ...newLeadData, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Lead Status
                  </label>
                  <select
                    className="block w-full px-3 py-2 bg-slate-900 border border-darkBorder rounded-lg text-sm text-slate-350 focus:outline-none focus:ring-1 focus:ring-accentIndigo"
                    value={newLeadData.status}
                    onChange={(e) => setNewLeadData({ ...newLeadData, status: e.target.value })}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Assign Owner
                    </label>
                    <select
                      className="block w-full px-3 py-2 bg-slate-900 border border-darkBorder rounded-lg text-sm text-slate-350 focus:outline-none focus:ring-1 focus:ring-accentIndigo"
                      value={newLeadData.assignedTo}
                      onChange={(e) => setNewLeadData({ ...newLeadData, assignedTo: e.target.value })}
                    >
                      <option value="">Leave Unassigned</option>
                      {usersList.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-darkBorder/40 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-darkBorder/80 rounded-lg text-sm text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newLeadSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-accentIndigo hover:opacity-95 text-white text-sm font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {newLeadSubmitting ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
