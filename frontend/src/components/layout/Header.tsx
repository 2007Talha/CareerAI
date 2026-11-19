import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  userName?: string;
  avatarUrl?: string;
}

export default function Header({ userName }: HeaderProps) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayName = userName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="app-header">
      {/* Search Input */}
      <div className="header-search">
        <Search className="search-icon" size={17} />
        <input
          type="text"
          placeholder="Search anything..."
          className="search-input"
        />
      </div>

      {/* Right Controls */}
      <div className="header-actions">
        {/* Notification Bell */}
        <button className="header-icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            className="header-user-profile"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="user-avatar">
              <span className="user-avatar-fallback">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="user-name">{displayName}</span>
            <ChevronDown size={16} className="user-dropdown-arrow" />
          </div>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 48,
                right: 0,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                padding: 6,
                minWidth: 160,
                zIndex: 100,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/profile');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'none',
                  color: '#334155',
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <User size={15} />
                My Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'none',
                  color: '#dc2626',
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <LogOut size={15} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
