import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  User,
  Activity as ActivityIcon,
  MessageSquare,
  Clock,
  Sparkles,
  Send,
  AlertCircle,
} from 'lucide-react';

interface NoteItem {
  _id: string;
  content: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface ActivityItem {
  _id: string;
  type: 'created' | 'status_change' | 'assigned' | 'note_added' | 'updated';
  description: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface LeadDetailsData {
  lead: {
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
  };
  notes: NoteItem[];
  activities: ActivityItem[];
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<LeadDetailsData | null>(null);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notes appending state
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Status changing state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchLeadDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/leads/${id}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load lead details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await apiClient.get('/users');
      if (response.data.success) {
        setUsersList(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load user list.', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchLeadDetails();
    fetchUsers();
  }, [fetchLeadDetails, fetchUsers]);

  // Handle status update
  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await apiClient.put(`/leads/${id}`, { status: newStatus });
      fetchLeadDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle lead assignment update
  const handleAssignChange = async (userId: string) => {
    try {
      await apiClient.put(`/leads/${id}/assign`, {
        assignedTo: userId === 'unassigned' ? null : userId,
      });
      fetchLeadDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update owner.');
    }
  };

  // Handle new note submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setSubmittingNote(true);
    setNoteError(null);

    try {
      await apiClient.post(`/leads/${id}/notes`, { content: noteContent });
      setNoteContent('');
      fetchLeadDetails(); // Reload to populate notes and activity logs
    } catch (err: any) {
      setNoteError(err.response?.data?.message || 'Failed to append note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow py-24 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 rounded-full border-accentIndigo border-t-transparent animate-spin"></div>
        <p className="text-sm font-medium tracking-wide">Syncing data file...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-grow px-4 py-12 mx-auto max-w-3xl text-center">
        <div className="glass-panel p-8 rounded-xl border border-darkBorder/60 text-red-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Lead</h2>
          <p className="text-slate-400 text-sm mb-6">{error || 'Lead data not found.'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-darkBorder text-white text-sm font-semibold rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { lead, notes, activities } = data;
  const statuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

  const getStatusStepClass = (step: string, current: string) => {
    const isCurrent = step === current;
    const isWon = current === 'Won';
    const isLost = current === 'Lost';

    if (isCurrent) {
      if (isWon) return 'bg-emerald-500 text-white ring-4 ring-emerald-500/20';
      if (isLost) return 'bg-rose-500 text-white ring-4 ring-rose-500/20';
      return 'bg-accentIndigo text-white ring-4 ring-accentIndigo/20';
    }

    return 'bg-slate-800 text-slate-400 border border-darkBorder hover:bg-slate-750';
  };

  return (
    <div className="flex-grow px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      {/* Back Button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-slate-450 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Lead Roster
      </Link>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Pipeline (2 cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="glass-panel rounded-xl border border-darkBorder/50 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-850 px-2 py-0.5 rounded border border-darkBorder">
                  Lead Profile
                </span>
                <h1 className="text-2xl font-bold text-white mt-2">{lead.name}</h1>
                <p className="text-sm text-slate-400 mt-1">{lead.company || 'No Company Linked'}</p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-1.5">
                <span className="text-xs text-slate-500">Pipeline Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  lead.status === 'Won' 
                    ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                    : lead.status === 'Lost' 
                    ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' 
                    : 'bg-accentIndigo/10 text-accentIndigo border-accentIndigo/20'
                }`}>
                  {lead.status}
                </span>
              </div>
            </div>

            {/* Pipeline Stage Selector */}
            <div className="mt-8 pt-6 border-t border-darkBorder/40">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Update Pipeline Phase
              </p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(s)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${getStatusStepClass(
                      s,
                      lead.status
                    )}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Details Overview Card */}
          <div className="glass-panel rounded-xl border border-darkBorder/50 p-6 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-darkBorder/40 pb-3">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-800/80 rounded-lg flex items-center justify-center border border-darkBorder">
                  <Mail className="w-4.5 h-4.5 text-slate-450" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Email address</p>
                  <a href={`mailto:${lead.email}`} className="text-sm font-medium text-slate-200 hover:text-accentIndigo">
                    {lead.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-800/80 rounded-lg flex items-center justify-center border border-darkBorder">
                  <Phone className="w-4.5 h-4.5 text-slate-450" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Phone Number</p>
                  <a href={`tel:${lead.phone}`} className="text-sm font-medium text-slate-200 hover:text-accentIndigo">
                    {lead.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-800/80 rounded-lg flex items-center justify-center border border-darkBorder">
                  <Building className="w-4.5 h-4.5 text-slate-450" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Company</p>
                  <p className="text-sm font-medium text-slate-200">{lead.company || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-800/80 rounded-lg flex items-center justify-center border border-darkBorder">
                  <Sparkles className="w-4.5 h-4.5 text-slate-450" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Lead Source</p>
                  <p className="text-sm font-medium text-slate-200">{lead.source || 'Public Webform'}</p>
                </div>
              </div>
            </div>

            {/* Assignment Section */}
            <div className="pt-6 border-t border-darkBorder/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-800/80 rounded-lg flex items-center justify-center border border-darkBorder">
                  <User className="w-4.5 h-4.5 text-slate-450" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Assigned Owner</p>
                  <p className="text-sm font-medium text-slate-200">
                    {lead.assignedTo ? lead.assignedTo.name : <span className="text-amber-500/80">Unassigned</span>}
                  </p>
                </div>
              </div>

              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Reassign:</span>
                  <select
                    className="px-2.5 py-1.5 bg-slate-900 border border-darkBorder rounded text-xs text-slate-350 focus:outline-none focus:ring-1 focus:ring-accentIndigo cursor-pointer"
                    value={lead.assignedTo?._id || 'unassigned'}
                    onChange={(e) => handleAssignChange(e.target.value)}
                  >
                    <option value="unassigned">Unassigned</option>
                    {usersList.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  * Reach out to administrator to request transfer.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Notes & Timeline (1 col wide) */}
        <div className="space-y-6">
          {/* Notes Panel */}
          <div className="glass-panel rounded-xl border border-darkBorder/50 p-6 flex flex-col max-h-[450px]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-indigo-400" /> Internal Notes
            </h2>

            {/* Note Entry Form */}
            <form onSubmit={handleAddNote} className="mb-4">
              {noteError && (
                <div className="p-2 bg-red-500/10 border border-red-500/25 rounded-lg text-[10px] text-red-400 mb-2">
                  {noteError}
                </div>
              )}
              <div className="relative">
                <textarea
                  placeholder="Write a comment..."
                  rows={2}
                  required
                  className="block w-full px-3 py-2 bg-slate-900/80 border border-darkBorder/80 hover:border-slate-650 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentIndigo resize-none"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={submittingNote || !noteContent.trim()}
                  className="absolute bottom-2 right-2 p-1 bg-accentIndigo hover:opacity-90 disabled:opacity-40 text-white rounded cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="overflow-y-auto flex-grow space-y-3.5 pr-1">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-slate-550 text-xs italic">
                  No internal notes appended yet.
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note._id} className="p-3 bg-slate-900/40 rounded-lg border border-darkBorder/30">
                    <div className="flex justify-between items-center mb-1 text-[10px]">
                      <span className="font-semibold text-slate-350">{note.userId?.name || 'Staff User'}</span>
                      <span className="text-slate-500 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(note.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-pre-line">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Timeline Panel */}
          <div className="glass-panel rounded-xl border border-darkBorder/50 p-6 flex flex-col max-h-[400px]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <ActivityIcon className="w-4.5 h-4.5 text-indigo-400" /> Activity Timeline
            </h2>

            {/* Timeline Stream */}
            <div className="overflow-y-auto flex-grow pr-1 space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-550 text-xs italic">
                  No history logged.
                </div>
              ) : (
                <div className="relative pl-4 border-l-2 border-slate-800 space-y-4.5">
                  {activities.map((act) => (
                    <div key={act._id} className="relative text-xs">
                      {/* Timeline Dot Indicator */}
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-accentIndigo border border-darkBg ring-4 ring-darkBg" />
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-medium leading-relaxed">{act.description}</span>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mt-1">
                          {act.userId && (
                            <span className="font-medium text-slate-400">{act.userId.name}</span>
                          )}
                          <span>&bull;</span>
                          <span>
                            {new Date(act.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;
