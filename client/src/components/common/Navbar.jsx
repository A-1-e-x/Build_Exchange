import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HardHat,
  Menu,
  X,
  User,
  Heart,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  ShoppingBag,
  Inbox,
  FolderTree,
  Bell,
  Check,
  CheckCheck,
  Clock,
  Package,
  Receipt,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, isAuthenticated, role, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      // silently handle background notification error
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkNotificationRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to mark all as read', 'error');
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      handleMarkNotificationRead(notif._id);
    }
    setNotificationsOpen(false);

    if (notif.relatedOrderId) {
      if (role === 'seller') {
        navigate('/seller/orders');
      } else {
        navigate('/orders');
      }
    } else if (notif.relatedRequestId) {
      navigate('/requests');
    }
  };

  const handleLogout = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const getDashboardRoute = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'seller') return '/seller/dashboard';
    return '/buyer/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                Build<span className="text-amber-600">Exchange</span>
              </span>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-600">
                Material Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Home
            </Link>
            <Link
              to="/materials"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/materials')
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Browse Materials
            </Link>

            {isAuthenticated && role === 'buyer' && (
              <>
                <Link
                  to="/orders"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/orders')
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>My Orders</span>
                </Link>
                <Link
                  to="/transactions"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/transactions')
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Transactions
                </Link>
              </>
            )}

            {isAuthenticated && role === 'seller' && (
              <>
                <Link
                  to="/seller/orders"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/seller/orders')
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Orders</span>
                </Link>
                <Link
                  to="/requests"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/requests')
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Inbox className="w-4 h-4 text-amber-600" />
                  <span>Requests</span>
                </Link>
                <Link
                  to="/transactions"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/transactions')
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Transactions
                </Link>
              </>
            )}

            <Link
              to="/about"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              About
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification Bell (Section 18) */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setUserDropdownOpen(false);
                    }}
                    aria-label="Notifications"
                    className="relative p-2.5 rounded-xl text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors focus:outline-none"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-sm animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Menu */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white border border-slate-200/90 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors"
                          >
                            Mark All as Read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                                !notif.isRead ? 'bg-amber-50/40' : ''
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                  !notif.isRead ? 'bg-amber-600 ring-4 ring-amber-100' : 'bg-transparent'
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                                  {notif.message}
                                </p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {!notif.isRead && (
                                <button
                                  onClick={(e) => handleMarkNotificationRead(notif._id, e)}
                                  title="Mark as read"
                                  className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center text-xs text-slate-400">
                            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p>No notifications right now</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sell CTA button for sellers */}
                {role === 'seller' ? (
                  <Link
                    to="/sell"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-sm transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post Material</span>
                  </Link>
                ) : role === 'buyer' ? (
                  <Link
                    to="/favorites"
                    className="p-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Saved Favorites"
                  >
                    <Heart className="w-5 h-5" />
                  </Link>
                ) : null}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all focus:outline-none"
                  >
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-semibold text-slate-900 leading-tight">
                        {user?.name?.split(' ')[0]}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                        {user?.role}
                      </span>
                    </div>
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-amber-300"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-100 shadow-2xl py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-4 py-2.5 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800">
                            {user?.role}
                          </span>
                        </div>

                        <div className="py-1">
                          <Link
                            to={getDashboardRoute()}
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                          </Link>

                          {role === 'buyer' && (
                            <>
                              <Link
                                to="/orders"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <Package className="w-4 h-4" />
                                <span>My Orders</span>
                              </Link>
                              <Link
                                to="/requests"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <Inbox className="w-4 h-4" />
                                <span>My Requests</span>
                              </Link>
                              <Link
                                to="/transactions"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <Receipt className="w-4 h-4" />
                                <span>Transaction History</span>
                              </Link>
                              <Link
                                to="/favorites"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                              >
                                <Heart className="w-4 h-4" />
                                <span>Saved Materials</span>
                              </Link>
                            </>
                          )}

                          {role === 'seller' && (
                            <>
                              <Link
                                to="/seller/orders"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <Package className="w-4 h-4" />
                                <span>Manage Orders</span>
                              </Link>
                              <Link
                                to="/requests"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <Inbox className="w-4 h-4" />
                                <span>Buyer Requests</span>
                              </Link>
                              <Link
                                to="/transactions"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <Receipt className="w-4 h-4" />
                                <span>Transaction History</span>
                              </Link>
                              <Link
                                to="/sell"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <PlusCircle className="w-4 h-4" />
                                <span>Sell Material</span>
                              </Link>
                            </>
                          )}

                          {role === 'admin' && (
                            <>
                              <Link
                                to="/admin/users"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <User className="w-4 h-4" />
                                <span>Manage Users</span>
                              </Link>
                              <Link
                                to="/admin/materials"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <ShoppingBag className="w-4 h-4" />
                                <span>Manage Materials</span>
                              </Link>
                              <Link
                                to="/admin/categories"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <FolderTree className="w-4 h-4" />
                                <span>Manage Categories</span>
                              </Link>
                              <Link
                                to="/admin/ai-monitoring"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                <span>AI Image Monitoring</span>
                              </Link>
                              <Link
                                to="/transactions"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                              >
                                <Receipt className="w-4 h-4" />
                                <span>All Transactions</span>
                              </Link>
                            </>
                          )}

                          <Link
                            to="/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>My Profile</span>
                          </Link>
                        </div>

                        <div className="pt-1 border-t border-slate-100">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-sm transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button & notification bell */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setMobileMenuOpen(false);
                }}
                className="relative p-2 rounded-xl text-slate-600 hover:text-amber-600 hover:bg-amber-50"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setNotificationsOpen(false);
              }}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top duration-150">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-base font-medium ${
              isActive('/') ? 'text-amber-700 bg-amber-50' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </Link>
          <Link
            to="/materials"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-base font-medium ${
              isActive('/materials') ? 'text-amber-700 bg-amber-50' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Browse Materials
          </Link>

          {isAuthenticated ? (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="px-3 py-1 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800">
                  {user?.role}
                </span>
              </div>

              <Link
                to={getDashboardRoute()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-600" />
                <span>Dashboard</span>
              </Link>

              {role === 'buyer' && (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Package className="w-4 h-4 text-amber-600" />
                    <span>My Orders</span>
                  </Link>
                  <Link
                    to="/requests"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Inbox className="w-4 h-4 text-amber-600" />
                    <span>My Requests</span>
                  </Link>
                  <Link
                    to="/transactions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Transaction History</span>
                  </Link>
                  <Link
                    to="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>Saved Materials</span>
                  </Link>
                </>
              )}

              {role === 'admin' && (
                <>
                  <Link
                    to="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <User className="w-4 h-4 text-purple-600" />
                    <span>Manage Users</span>
                  </Link>
                  <Link
                    to="/admin/materials"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span>Manage Materials</span>
                  </Link>
                  <Link
                    to="/admin/categories"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FolderTree className="w-4 h-4 text-emerald-600" />
                    <span>Manage Categories</span>
                  </Link>
                  <Link
                    to="/admin/ai-monitoring"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>AI Image Monitoring</span>
                  </Link>
                </>
              )}

              {role === 'seller' && (
                <>
                  <Link
                    to="/seller/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Package className="w-4 h-4 text-amber-600" />
                    <span>Seller Orders</span>
                  </Link>
                  <Link
                    to="/requests"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Inbox className="w-4 h-4 text-amber-600" />
                    <span>Buyer Requests</span>
                  </Link>
                  <Link
                    to="/transactions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Transactions</span>
                  </Link>
                  <Link
                    to="/sell"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-600" />
                    <span>Sell Material</span>
                  </Link>
                </>
              )}

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>My Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-xl shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
