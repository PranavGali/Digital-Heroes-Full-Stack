import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, ShieldAlert, LogOut, ArrowLeft, KeyRound, Award } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex-grow px-4 py-12 mx-auto max-w-3xl sm:px-6 lg:px-8">
      {/* Back to dashboard link */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs text-slate-450 hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Main card */}
      <div className="glass-panel rounded-2xl border border-darkBorder/60 overflow-hidden shadow-2xl">
        <div className="p-8">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 border-b border-darkBorder/40 pb-8">
            <div className="w-20 h-20 rounded-full bg-accentIndigo/10 flex items-center justify-center border-2 border-accentIndigo/30">
              <User className="w-10 h-10 text-accentIndigo" />
            </div>
            <div className="text-center sm:text-left flex-grow">
              <span className={`text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full ${
                user?.role === 'admin' 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {user?.role} Account
              </span>
              <h1 className="text-2xl font-bold text-white mt-2">{user?.name}</h1>
              <p className="text-sm text-slate-400 mt-1">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 border border-darkBorder hover:border-red-500/30 hover:bg-red-500/5 text-slate-300 hover:text-red-400 rounded-lg text-sm font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>

          <div className="mt-8 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-accentIndigo" /> Security Role Permissions
            </h2>

            {user?.role === 'admin' ? (
              <div className="p-4 bg-slate-900/40 border border-darkBorder/30 rounded-xl space-y-3 text-sm text-slate-300 leading-relaxed">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <ShieldAlert className="w-4.5 h-4.5" />
                  <span>Administrative Privilege Enabled</span>
                </div>
                <p>
                  As an administrator, you have full ownership rights to manage the Lead Management System:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
                  <li>View all database leads and operational records</li>
                  <li>Assign lead ownership to staff members</li>
                  <li>Update lead profile attributes and pipeline status</li>
                  <li>Add and view internal team notes</li>
                  <li>Review comprehensive activity timelines for any lead</li>
                </ul>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/40 border border-darkBorder/30 rounded-xl space-y-3 text-sm text-slate-300 leading-relaxed">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <KeyRound className="w-4.5 h-4.5" />
                  <span>Member Access Privileges</span>
                </div>
                <p>
                  Your account is assigned a Member role. You are authorized to manage assigned client assets:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
                  <li>View your assigned leads (unauthorized leads are hidden)</li>
                  <li>Update pipeline status and contact details for assigned leads</li>
                  <li>Log comments and notes on your assigned leads</li>
                  <li>Review activity logs and timelines for your assigned leads</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
