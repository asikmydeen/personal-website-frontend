import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Grid, Badge, Tooltip } from 'antd';
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
import useStore from '../../store/useStore';

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
        <strong>Abode</strong>
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
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const location = useLocation();
  const screens = useBreakpoint();

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--playful-page-background))' }}>
        <Content style={{ margin: '24px 16px', padding: 24, background: 'hsl(var(--playful-card-background))', color: 'hsl(var(--playful-content-text-color))' }}>
          {children}
        </Content>
      </div>
    );
  }

  const userMenu = (
    <Menu>
      <Menu.Item key="profile">
        <Link to="/profile">Profile</Link>
      </Menu.Item>
      <Menu.Item key="logout" onClick={() => useStore.getState().logout()}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: 'hsl(var(--playful-page-background))' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth={screens.lg ? 80 : 0}
        zeroWidthTriggerStyle={{ top: 12 }}
        style={{
          background: 'hsl(var(--playful-sider-background))',
          minHeight: '100vh',
          position: 'fixed',
          left: 0,
          zIndex: 10,
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
        className="playful-sider"
      >
        <div
          style={{
            height: 64,
            margin: 16,
            background: 'hsl(var(--playful-sider-logo-background))',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            paddingLeft: collapsed ? 0 : 16,
            color: 'hsl(var(--playful-sider-logo-text-color))',
            fontWeight: 'bold',
            fontSize: 18,
            userSelect: 'none',
          }}
        >
          {!collapsed ? 'Abode' : '🏠'}
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
            icon: <span role="img" aria-label={item.label}>{item.icon}</span>,
            label: <Link to={item.to} style={{ fontWeight: 'bold' }}>{item.label}</Link>,
          }))}
        />
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? (screens.lg ? '80px' : '0px') : '200px',
          transition: 'margin-left 0.2s',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >
        <Header
          style={{
            padding: '0 24px',
            background: 'hsl(var(--playful-header-background))',
            color: 'hsl(var(--playful-header-text-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 9,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: 20, marginRight: 24, cursor: 'pointer', color: 'hsl(var(--playful-header-text-color))' },
            })}
            <Title level={4} style={{ margin: 0, color: 'hsl(var(--playful-header-text-color))' }}>
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
          <Dropdown overlay={userMenu} placement="bottomRight" arrow>
            <Avatar size="large" style={{ cursor: 'pointer', backgroundColor: 'hsl(var(--playful-sider-logo-background))', color: 'hsl(var(--playful-sider-logo-text-color))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span role="img" aria-label="User Menu" style={{ fontSize: '24px' }}>👤</span>
            </Avatar>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: 'hsl(var(--playful-card-background))',
            color: 'hsl(var(--playful-content-text-color))',
            minHeight: 280,
            overflow: 'auto',
            borderRadius: 'var(--radius)',
            border: '1px solid hsl(var(--playful-card-border-color))'
          }}
        >
          {children}
        </Content>
        <Footer style={{
          textAlign: 'center',
          background: 'hsl(var(--playful-header-background))',
          color: 'hsl(var(--playful-header-text-color))',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '40px', /* Match the height of sidebar's collapse trigger */
          marginTop: 'auto',
          marginLeft: 0,
          marginRight: 0,
          marginBottom: 0,
          borderRadius: 0,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
          fontSize: '12px'
        }}>
          <FooterStatus />
        </Footer>
      </Layout>
    </Layout>
  );
};

export default LayoutComponent;
