import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Grid, Badge, Tooltip, Drawer } from 'antd';
import { isIOS } from '@/core/platform';
import './menu-button.css'; // We'll create this file next
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
import useStore from '@core/store/useStore';
import ThemeSwitcher from '../theme/ThemeSwitcher';
import LogoSvg from './LogoSvg';

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
  const isMobile = !screens.md;
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

  // Mobile drawer for navigation
  const MobileDrawer = () => (
    <Drawer
      placement="left"
      onClose={() => setMobileMenuOpen(false)}
      open={mobileMenuOpen}
      width={250}
      bodyStyle={{ padding: 0, background: 'transparent' }}
      headerStyle={{ display: 'none' }}
      className="glass-sidebar"
    >
      <div
        style={{
          height: 80,
          margin: 12,
          marginBottom: '1rem',
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
          collapsed={false}
          style={{
            width: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{
          background: 'transparent'
        }}
        className="sidebar-menu mobile-sidebar-menu"
        items={navigation.map(item => ({
          key: item.key,
          icon: <span role="img" aria-label={item.label}>{item.icon}</span>,
          label: <Link to={item.to} className="sidebar-text-link" style={{ fontWeight: 'bold' }}>{item.label}</Link>
        }))}
      />
    </Drawer>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Mobile Drawer */}
      {isMobile && <MobileDrawer />}

      {/* Desktop Sidebar - hidden on mobile */}
      {!isMobile && (
        <Sider
          collapsible={false}
          collapsed={collapsed}
          breakpoint="lg"
          collapsedWidth={screens.lg ? 100 : 0}
          style={{
            background: 'transparent',
            minHeight: '100vh',
            position: 'fixed',
            left: 0,
            zIndex: 10,
            display: isMobile ? 'none' : 'block',
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
            position: 'sticky',
            top: 0,
            zIndex: 9,
            width: '100%',
            height: isMobile ? '56px' : '64px',
          }}
          className="glass-header"
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isMobile ? (
              <button
                className={`menu-toggle-button ${isIOSDevice ? 'ios-menu-button' : ''}`}
                onClick={() => setMobileMenuOpen(true)}
                onTouchStart={() => setMobileMenuOpen(true)}
                style={{
                  fontSize: 20,
                  marginRight: 16,
                  cursor: 'pointer',
                  color: 'hsl(var(--playful-header-text-color))',
                  background: 'transparent',
                  border: 'none',
                  padding: isIOSDevice ? '16px' : '12px',  // Even larger touch target for iOS
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
                  outline: 'none', // Remove outline
                  touchAction: 'manipulation', // Optimize for touch
                  userSelect: 'none', // Prevent text selection
                  marginLeft: isIOSDevice ? '-16px' : '-12px', // Offset the padding to maintain visual alignment
                  // iOS-specific enhancements
                  ...(isIOSDevice && {
                    position: 'relative',
                    zIndex: 100, // Ensure it's above other elements
                    transform: 'translateZ(0)', // Force hardware acceleration
                    borderRadius: '8px', // Rounded corners for visual feedback
                  })
                }}
                aria-label="Open menu"
              >
                <MenuUnfoldOutlined style={isIOSDevice ? { pointerEvents: 'none' } : {}} />
              </button>
            ) : (
              <button
                className={`menu-toggle-button trigger ${isIOSDevice ? 'ios-menu-button' : ''}`}
                onClick={() => setCollapsed(!collapsed)}
                onTouchStart={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: 20,
                  marginRight: 24,
                  cursor: 'pointer',
                  color: 'hsl(var(--playful-header-text-color))',
                  background: 'transparent',
                  border: 'none',
                  padding: isIOSDevice ? '16px' : '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                  outline: 'none',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  marginLeft: isIOSDevice ? '-16px' : '-12px',
                  ...(isIOSDevice && {
                    position: 'relative',
                    zIndex: 100,
                    transform: 'translateZ(0)',
                    borderRadius: '8px',
                  })
                }}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ?
                  <MenuUnfoldOutlined style={isIOSDevice ? { pointerEvents: 'none' } : {}} /> :
                  <MenuFoldOutlined style={isIOSDevice ? { pointerEvents: 'none' } : {}} />
                }
              </button>
            )}
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
          fontSize: isMobile ? '10px' : '12px'
        }}
        className="glass-header responsive-footer"
        >
          <FooterStatus />
        </Footer>
      </Layout>
    </Layout>
  );
};

export default LayoutComponent;
