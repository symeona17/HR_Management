import React from 'react';
import Link from 'next/link';

type NavBarProps = {
  showSearch?: boolean;
  onSearchChange?: (value: string) => void;
};

const NavBar: React.FC<NavBarProps> = ({ showSearch, onSearchChange }) => (
  <div
    style={{
      width: '100%',
      height: 100,
      left: 0,
      top: 0,
      position: 'absolute',
      background: 'white',
      outline: '2px #D9D9D9 solid',
      outlineOffset: '-2px',
      zIndex: 10,
    }}
  >
    {/* Search Box */}
    {showSearch && (
      <div
        style={{
          width: 396,
          height: 39,
          left: 220,
          top: 30,
          position: 'absolute',
          background: '#D9D9D9',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 16,
          boxSizing: 'border-box',
        }}
      >
        <img
          src="/search.png"
          alt="Search"
          style={{ width: 24, height: 24, marginRight: 8, display: 'block' }}
        />
        <input
          type="text"
          placeholder="Search"
        onChange={e => onSearchChange?.(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 18,
            fontFamily: 'Montserrat',
            width: '100%',
          }}
        />
      </div>
    )}
    {/* Navigation */}
    <div style={{ width: 731, height: 60, right: 30, top: 20, position: 'absolute' }}>
      <div style={{ width: 537, height: 33, left: 0, top: 14, position: 'absolute' }}>
        <div style={{ width: 179, height: 33, left: 0, top: 0, position: 'absolute' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ width: 179, height: 33, textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#717171', fontSize: 22, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '22px', wordWrap: 'break-word', cursor: 'pointer' }}>Dashboard</div>
          </Link>
        </div>
        <div style={{ width: 179, height: 33, left: 179, top: 0, position: 'absolute' }}>
          <Link href="/employees" style={{ textDecoration: 'none' }}>
            <div style={{ width: 179, height: 33, textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#717171', fontSize: 22, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '22px', wordWrap: 'break-word', cursor: 'pointer' }}>Employees</div>
          </Link>
        </div>
        <div style={{ width: 179, height: 33, left: 358, top: 0, position: 'absolute' }}>
          <Link href="/trainings" style={{ textDecoration: 'none' }}>
            <div style={{ width: 179, height: 33, textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#717171', fontSize: 22, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '22px', wordWrap: 'break-word', cursor: 'pointer' }}>Trainings</div>
          </Link>
        </div>
      </div>
    </div>
    {/* Bell Icon */}
    <div style={{ width: 60, height: 60, right: 110, top: 20, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/bell.png" alt="Notifications" style={{ height: 32, objectFit: 'contain', display: 'block' }} />
    </div>
    {/* Person Icon */}
    <div style={{ width: 40, height: 40, right: 50, top: 30, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/person.png" alt="Profile" style={{ height: 32, objectFit: 'contain', display: 'block' }} />
    </div>
    {/* Logo */}
    <div style={{ width: 100, height: 36, left: 43, top: 32, position: 'absolute' }}>
      <div style={{ left: 0, top: 0, position: 'absolute', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 8, display: 'inline-flex' }}>
        <Link href="/">
          <img style={{ width: 100, height: 36, cursor: 'pointer' }} src="/logo.png" alt="Logo" />
        </Link>
      </div>
    </div>
  </div>
);

export default NavBar;