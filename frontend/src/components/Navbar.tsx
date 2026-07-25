import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 border-b glass-panel border-darkBorder">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 flex-shrink-0 text-white font-bold text-lg tracking-wide hover:opacity-90">
              <Shield className="w-6 h-6 text-accentIndigo animate-pulse" />
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                HeroCRM
              </span>
            </Link>
            {user && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4 sm:items-center">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-slate-800 text-white border-b-2 border-accentIndigo'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              </div>
            )}
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:gap-4">
            <Link
              to="/"
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/')
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              Public Lead Form
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-full border border-darkBorder transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-accentIndigo/20 flex items-center justify-center border border-accentIndigo/30">
                    <User className="w-3.5 h-3.5 text-accentIndigo" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 max-w-[120px] truncate">{user.name}</span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {user.role}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-850 focus:outline-none transition-colors border border-transparent hover:border-darkBorder"
                  title="Logout"
                >
                  <LogOut className="w-4.5 h-4.5 text-slate-450 hover:text-rose-450" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-accentIndigo to-indigo-650 rounded-md hover:shadow-lg hover:shadow-accentIndigo/20 transition-all hover:opacity-95"
              >
                Login
              </Link>
            )}
          </div>

          <div className="flex items-center sm:hidden">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="sm:hidden bg-darkBg/95 border-b border-darkBorder">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user && (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/dashboard') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
            )}
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Public Lead Form
            </Link>
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/profile') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  My Profile ({user.name})
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-rose-450 hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-accentIndigo text-center"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
