import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Grid, Badge, Tooltip, Drawer } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudOutlined,
  FileOutlined,
  CreditCardOutlined,
  KeyOutlined,
  BookOutlined,
  SoundOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { isIOS } from '@/core/platform';
import useStore from '@core/store/useStore';
import ThemeSwitcher from '../theme/ThemeSwitcher';
import LogoSvg from './LogoSvg';
import './menu-button.css';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

// Footer Status Component
const FooterStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [cachingState, setCachingState] = useState('active');
  const [fileCount, setFileCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState('synced');

  // Access data from store
  const notes = useStore(state => state.notes);
  const bookmarks = useStore(state => state.bookmarks);
  const passwords = useStore(state => state.passwords);
  const cards = useStore(state => state.cards);
  const voiceMemos = useStore(state => state.voiceMemos);

  // Calculate total items
  const totalItems = notes.length + bookmarks.length + passwords.length + cards.length + voiceMemos.length;

  // Mock fetch data on component mount
  useEffect(() => {
    // Simulate data fetching delay
    const timer = setTimeout(() => {
      setFileCount(totalItems || Math.floor(Math.random() * 100) + 5);
    }, 800);

    return () => clearTimeout(timer);
  }, [totalItems]);

  return (
    <>
      <div className="footer-left">
        <Tooltip title={`Connection Status: ${connectionStatus}`}>
          <span style={{ display: 'flex', alignItems: 'center', marginRight: 12 }}>
            {connectionStatus === 'online' ? (
              <Badge status="success" text={<CheckCircleOutlined style={{ fontSize: '14px', color: '#52c41a' }} />} />
            ) : (
              <Badge status="error" text={<CloseCircleOutlined style={{ fontSize: '14px', color: '#f5222d' }} />} />
            )}
          </span>
        </Tooltip>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <LogoSvg
            height="20px"
            className="sidebar-logo"
            collapsed={false}
          />
        </div>
      </div>

      <div className="footer-center" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Tooltip title="Files and Items">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FileOutlined style={{ marginRight: 4 }} />
            <span>{fileCount}</span>
          </div>
        </Tooltip>

        <Tooltip title="Cloud Sync Status">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CloudOutlined style={{ marginRight: 4 }} />
            <span>{syncStatus === 'syncing' ? <LoadingOutlined /> : 'Synced'}</span>
          </div>
        </Tooltip>

        <Tooltip title="Cache Status">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {cachingState === 'active' ? 'Cached' : 'No Cache'}
          </div>
        </Tooltip>
      </div>

      <div className="footer-right">
        <Tooltip title="Current Year">
          <span>©{new Date().getFullYear()}</span>
        </Tooltip>
      </div>
    </>
  );
};

// Navigation items with updated names
const navigation = [
  { key: '/', label: 'Home', icon: '🏠', to: '/' },
  { key: '/photos', label: 'Photos', icon: '📸', to: '/photos' },
  { key: '/files', label: 'Files', icon: '📦', to: '/files' },
  { key: '/notes', label: 'Notes', icon: '📝', to: '/notes' },
  { key: '/bookmarks', label: 'Bookmarks', icon: '🔖', to: '/bookmarks' },
  { key: '/passwords', label: 'Passwords', icon: '🔑', to: '/passwords' },
  { key: '/wallet', label: 'Wallet', icon: '💳', to: '/wallet' },
  { key: '/voice-memos', label: 'Voice Memos', icon: '🎤', to: '/voice-memos' },
  { key: '/resume', label: 'Resume', icon: '📄', to: '/resume' },
];

const LayoutComponent = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const location = useLocation();
  const screens = useBreakpoint();
  // Define breakpoints more precisely to avoid overlap
  const isMobile = !screens.md;
  const isSmallScreen = !screens.sm;
  const isIOSDevice = isIOS();

  // Close mobile menu when location changes
  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [location.pathname]);

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        <Content
          style={{
            margin: isMobile ? '16px 0' : '24px 0',
            padding: isMobile ? '16px 8px' : '24px 16px',
            background: 'transparent',
            color: 'hsl(var(--playful-content-text-color))',
            border: 'none',
            borderRadius: 'var(--radius)',
            width: '100%'
          }}
          className="glass-effect"
        >
          {children}
        </Content>
      </div>
    );
  }

  const userMenuItems = [
    {
      key: 'profile',
      label: <Link to="/profile">Profile</Link>,
    },
    {
      key: 'logout',
      label: 'Logout',
      onClick: () => useStore.getState().logout(),
    }
  ];

  // No Mobile drawer - using only the floating action button for mobile

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* No Mobile Drawer - using only the floating action button for mobile */}

      {/* Desktop Sidebar - only visible on non-mobile */}
      {!isMobile && (
        <Sider
          collapsible={false}
          collapsed={collapsed}
          breakpoint="lg"
          collapsedWidth={screens.lg ? 100 : 80}
          style={{
            background: 'transparent',
            minHeight: '100vh',
            position: 'fixed',
            left: 0,
            zIndex: 10,
            display: 'block',
          }}
          className="playful-sider glass-sidebar"
        >
          <div
            style={{
              height: 80,
              margin: 12,
              marginBottom: '1.5rem',
              backgroundColor: 'transparent',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--playful-sider-logo-text-color))',
              userSelect: 'none',
            }}
          >
            <LogoSvg
              height="100%"
              className="sidebar-logo"
              collapsed={collapsed}
              style={{
                width: '100%',
                objectFit: 'contain',
                transition: 'width 0.4s, height 0.4s'
              }}
            />
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{
              background: 'transparent'
            }}
            className="sidebar-menu"
            items={navigation.map(item => ({
              key: item.key,
              icon: collapsed ? (
                <Link to={item.to} className="sidebar-icon-link">
                  <span role="img" aria-label={item.label}>{item.icon}</span>
                </Link>
              ) : (
                <span role="img" aria-label={item.label}>{item.icon}</span>
              ),
              label: <Link to={item.to} className="sidebar-text-link" style={{ fontWeight: 'bold' }}>{item.label}</Link>
            }))}
          />
        </Sider>
      )}
      <Layout
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? (screens.lg ? '100px' : '0px') : '200px'),
          transition: 'margin-left 0.2s',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >
        <Header
          style={{
            padding: isMobile ? '0 16px' : '0 24px',
            background: 'transparent',
            color: 'hsl(var(--playful-header-text-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            top: 0,
            zIndex: 1000,
            width: '100%',
            height: isMobile ? '56px' : '64px',
            display: isMobile ? 'none' : 'flex' /* Hide header on mobile to avoid duplicate menu buttons */
          }}
          className="glass-header"
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Standard menu button for desktop only */}
            {!isMobile && (
              <button
                className="menu-button"
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: 20,
                  marginRight: 24,
                  cursor: 'pointer',
                  color: 'hsl(var(--playful-header-text-color))',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            )}
            {/* No mobile menu button in header - using floating action button instead */}
            <Title level={isMobile ? 5 : 4} style={{ margin: 0, color: 'hsl(var(--playful-header-text-color))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {{
                '/': 'Home',
                '/photos': 'Photos',
                '/files': 'Files',
                '/notes': 'Notes',
                '/bookmarks': 'Bookmarks',
                '/passwords': 'Password Manager',
                '/wallet': 'Digital Wallet',
                '/voice-memos': 'Voice Memos',
                '/resume': 'Resume',
                '/profile': 'Profile',
              }[location.pathname] || 'Home'}
            </Title>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
            <ThemeSwitcher />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Avatar size={isMobile ? "default" : "large"} style={{ cursor: 'pointer', backgroundColor: 'hsl(var(--playful-sider-logo-background))', color: 'hsl(var(--playful-sider-logo-text-color))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span role="img" aria-label="User Menu" style={{ fontSize: isMobile ? '18px' : '24px' }}>👤</span>
              </Avatar>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: isMobile ? '16px 0' : '24px 0',
            padding: isMobile ? '16px 0' : '24px 0', // Remove horizontal padding to allow full width
            background: 'transparent',
            color: 'hsl(var(--playful-content-text-color))',
            minHeight: 280,
            overflow: 'auto',
            borderRadius: 'var(--radius)',
            border: 'none',
            width: '100%',
            maxWidth: '100%'
          }}
          className="glass-effect"
        >
          {children}
        </Content>
        <Footer style={{
          textAlign: 'center',
          background: 'transparent',
          color: 'hsl(var(--playful-header-text-color))',
          padding: isMobile ? '0 8px' : '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: isMobile ? '32px' : '40px',
          marginTop: 'auto',
          marginLeft: 0,
          marginRight: 0,
          marginBottom: 0,
          borderRadius: 0,
          fontSize: isMobile ? '10px' : '12px',
          display: 'flex'
        }}
        className="glass-header responsive-footer"
        >
          <FooterStatus />
        </Footer>

        {/* iOS Floating Action Button and Menu - restored as per user preference */}
        {isMobile && (
          <>
            {/* Floating Action Button - only shown when menu is closed */}
            {!mobileMenuOpen && (
              <button
                className="ios-fab"
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  position: 'fixed',
                  bottom: '30px',
                  right: '30px',
                  width: '60px',
                  height: '60px',
                  borderRadius: '30px',
                  backgroundColor: '#4CAF50',
                  border: 'none',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  zIndex: 2000
                }}
              >
                ≡
              </button>
            )}

            {/* Fan-out Menu */}
            {mobileMenuOpen && (
              <div
                className="ios-fan-overlay"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)'
                }}
              >
                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '30px',
                    backgroundColor: '#4CAF50',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    zIndex: 2001
                  }}
                >
                  ≡
                </button>
                <div style={{
                  position: 'fixed',
                  right: 0,
                  bottom: 0,
                  top: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'flex-end',
                  paddingRight: '20px',
                  paddingBottom: '100px',
                }}>
                  {/* Menu Items */}
                  {navigation.map(item => (
                    <Link
                      key={item.key}
                      to={item.to}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        textDecoration: 'none',
                        padding: '10px 0'
                      }}
                    >
                      <div style={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        marginRight: '10px'
                      }}>
                        {item.label}
                      </div>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '30px',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}>
                        {item.icon}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {/* End of content section */}
      </Layout>
    </Layout>
  );
};

export default LayoutComponent;
