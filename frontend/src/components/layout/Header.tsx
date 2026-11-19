import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  userName?: string;
  avatarUrl?: string;
}

interface DropdownMenuProps {
  onProfile: () => void;
  onLogout: () => void;
}

/**
 * Renders the floating user dropdown action menu.
 * @param props DropdownMenuProps
 * @returns JSX Element
 */
function UserDropdownMenu({ onProfile, onLogout }: DropdownMenuProps) {
  return (
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
        onClick={onProfile}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', color: '#334155', fontSize: '0.86rem', fontWeight: 500, cursor: 'pointer' }}
      >
        <User size={15} /> My Profile
      </button>
      <button
        type="button"
        onClick={onLogout}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', color: '#dc2626', fontSize: '0.86rem', fontWeight: 500, cursor: 'pointer' }}
      >
        <LogOut size={15} /> Log Out
      </button>
    </div>
  );
}

/**
 * Top application header with global search, notifications, and profile menu.
 * @param props HeaderProps
 * @returns JSX Element
 */
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
      <div className="header-search">
        <Search className="search-icon" size={17} />
        <input type="text" placeholder="Search anything..." className="search-input" />
      </div>
      <div className="header-actions">
        <button className="header-icon-btn" aria-label="Notifications"><Bell size={20} /><span className="notification-dot" /></button>
        <div style={{ position: 'relative' }}>
          <div className="header-user-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="user-avatar"><span className="user-avatar-fallback">{displayName.charAt(0).toUpperCase()}</span></div>
            <span className="user-name">{displayName}</span>
            <ChevronDown size={16} className="user-dropdown-arrow" />
          </div>
          {dropdownOpen && <UserDropdownMenu onProfile={() => { setDropdownOpen(false); navigate('/profile'); }} onLogout={() => { setDropdownOpen(false); handleLogout(); }} />}
        </div>
      </div>
    </header>
  );
}
