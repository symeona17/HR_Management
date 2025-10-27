import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type NavBarProps = {
  showSearch?: boolean;
  onSearchChange?: (value: string) => void;
};

const NavBar: React.FC<NavBarProps> = ({ showSearch, onSearchChange }) => {
  const [scrolled, setScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [showDropdown, setShowDropdown] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('user_role'));
    }
  }, []);

  return (
    <div
      style={{
        width: '100%',
        minWidth: 320,
        height: scrolled ? 60 : 80,
        left: 0,
        top: 0,
        position: 'fixed',
        background: 'white',
        //outline: '2px #D9D9D9 solid',
        //outlineOffset: '-2px',
        zIndex: 100,
        transition: 'height 0.2s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Flex container for all navbar content */}
      <div
        style={{
          width: '100%',
          minWidth: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          padding: '0 18px',
          boxSizing: 'border-box',
        }}
      >
        {/* Left: Logo + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: windowWidth < 400 ? 4 : 12, minWidth: 0 }}>
          <Link href="/dashboard">
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                width: scrolled ? 70 : 100,
                height: scrolled ? 25 : 36,
                cursor: 'pointer',
                transition: 'width 0.2s, height 0.2s',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Link>
          {showSearch && windowWidth >= 570 && (
            <div
              style={{
                width: windowWidth < 820 ? 90 : windowWidth < 950 ? (0.20 * windowWidth) : (0.28 * windowWidth),
                height: scrolled ? 26 : 34,
                background: '#D9D9D9',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 8,
                boxSizing: 'border-box',
                transition: 'height 0.2s, width 0.2s',
                marginLeft: 20,
              }}
            >
              <img
                src="/search.png"
                alt="Search"
                style={{ width: 16, height: 16, marginRight: 4, display: 'block' }}
              />
              <input
                type="text"
                placeholder="Search"
                onChange={e => onSearchChange?.(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 13,
                  fontFamily: 'Montserrat',
                  width: '100%',
                }}
              />
            </div>
          )}
        </div>

        {/* Center/Right: Nav links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap:
              windowWidth < 400 ? 2 :
              windowWidth < 750 ? 6 :
              windowWidth < 900 ? 14 :
              windowWidth < 1200 ? 28 : 48,
            flex: 1,
            justifyContent: 'flex-end',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={{
              color: '#717171',
              fontSize:
                windowWidth < 400 ? 10 :
                windowWidth < 750 ? 12 :
                scrolled ? 16 : 20,
              fontFamily: 'Montserrat',
              fontWeight: 400,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              transition: 'font-size 0.2s',
              padding: '0 2px',
            }}>Dashboard</div>
          </Link>
          {role !== 'employee' && role !== 'trainer' && (
            <Link href="/employees" style={{ textDecoration: 'none' }}>
              <div style={{
                color: '#717171',
                fontSize:
                  windowWidth < 400 ? 10 :
                  windowWidth < 750 ? 12 :
                  scrolled ? 16 : 20,
                fontWeight: 400,
                fontFamily: 'Montserrat',
                letterSpacing: 1,
                padding: '0 8px',
                cursor: 'pointer',
                transition: 'font-size 0.2s',
              }}>Employees</div>
            </Link>
          )}
          <Link href="/trainings" style={{ textDecoration: 'none' }}>
            <div style={{
              color: '#717171',
              fontSize:
                windowWidth < 400 ? 10 :
                windowWidth < 750 ? 12 :
                scrolled ? 16 : 20,
              fontFamily: 'Montserrat',
              fontWeight: 400,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              transition: 'font-size 0.2s',
              padding: '0 2px',
            }}>Trainings</div>
          </Link>
          <Link href="/analytics" style={{ textDecoration: 'none' }}>
            <div style={{
              color: '#717171',
              fontSize:
                windowWidth < 400 ? 10 :
                windowWidth < 750 ? 12 :
                scrolled ? 16 : 20,
              fontFamily: 'Montserrat',
              fontWeight: 400,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              transition: 'font-size 0.2s',
              padding: '0 2px',
            }}>Analytics</div>
          </Link>
          {role === 'hradmin' && (
            <Link href="/skills" style={{ textDecoration: 'none' }}>
              <div style={{
                color: '#717171',
                fontSize:
                  windowWidth < 400 ? 10 :
                  windowWidth < 750 ? 12 :
                  scrolled ? 16 : 20,
                fontFamily: 'Montserrat',
                fontWeight: 400,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
                transition: 'font-size 0.2s',
                padding: '0 2px',
              }}>Skills</div>
            </Link>
          )}
        </div>

        {/* Far right: Icons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: windowWidth < 400 ? 4 : windowWidth < 750 ? 8 : 18,
            minWidth: 0,
            marginLeft: windowWidth < 400 ? 16 : windowWidth < 750 ? 32 : windowWidth < 1200 ? 56 : 90,
          }}
        >
          <img
            src="/bell.png"
            alt="Notifications"
            style={{ height: windowWidth < 400 ? 16 : scrolled ? 20 : 26, objectFit: 'contain', display: 'block', transition: 'height 0.2s' }}
          />
          <div style={{ position: 'relative' }}>
            <img
              src="/person.png"
              alt="Profile"
              style={{ height: windowWidth < 400 ? 14 : scrolled ? 18 : 24, objectFit: 'contain', display: 'block', transition: 'height 0.2s', cursor: 'pointer' }}
              onClick={() => setShowDropdown((v: boolean) => !v)}
            />
            {showDropdown && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: windowWidth < 400 ? 18 : scrolled ? 22 : 28,
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                minWidth: 120,
                zIndex: 1000,
                padding: '8px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
              }}>
                <a href="/profile" style={{ padding: '8px 16px', fontFamily: 'Montserrat', fontSize: 15, color: '#333', textDecoration: 'none', cursor: 'pointer', borderBottom: '1px solid #eee' }}>Profile</a>
                <div
                  style={{ padding: '8px 16px', fontFamily: 'Montserrat', fontSize: 15, color: '#D92D20', cursor: 'pointer' }}
                  onClick={() => {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user_email');
                    localStorage.removeItem('user_role');
                    window.location.href = '/login';
                  }}
                >Logout</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;

