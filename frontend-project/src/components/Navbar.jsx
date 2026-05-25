import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/sales', label: 'Sales', icon: '💰' },
  { to: '/stock', label: 'Stock', icon: '📋' },
  { to: '/reports', label: 'Reports', icon: '📈' },
];

const Navbar = ({ children }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
      isActive
        ? 'bg-indigo-50/10 text-white shadow-sm border border-white/5'
        : 'text-indigo-200/60 hover:bg-white/5 hover:text-indigo-100'
    }`;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-gradient-to-b from-indigo-950 via-indigo-900 to-indigo-950 text-white flex flex-col transform transition-transform duration-300 ease-out md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 h-16 px-5 border-b border-indigo-800/30 flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight">DAB Enterprise</span>
            <p className="text-[10px] text-indigo-300/60 leading-tight">Management System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-full" />}
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all duration-200 ${isActive ? 'bg-indigo-500/20 shadow-sm' : ''}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-indigo-800/30 flex-shrink-0">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-indigo-200/60 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base">
              🚪
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="md:ml-60 min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <button className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" onClick={() => setOpen(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="hidden md:block" />
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/20">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </>
  );
};

export default Navbar;
