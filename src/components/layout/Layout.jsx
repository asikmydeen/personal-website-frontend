import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Grid } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  // UserOutlined, // No longer needed if we use an emoji
} from '@ant-design/icons';
import useStore from '../../store/useStore';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

// Using emojis as placeholders for fun icons for now
const navigation = [
  { key: '/', label: 'My Happy Place', icon: '🏠', to: '/' },
  { key: '/photos', label: 'Memory Lane', icon: '📸', to: '/photos' },
  { key: '/files', label: 'My Treasure Box', icon: '📦', to: '/files' },
  { key: '/resume', label: 'My Awesome Story', icon: '📖', to: '/resume' },
  // Add more navigation items here
];

const LayoutComponent = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const location = useLocation();
  const screens = useBreakpoint();

  if (!isAuthenticated) {
    // If not authenticated, just render children (likely login page)
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--playful-page-background))' }}>
        <Content style={{ margin: '24px 16px', padding: 24, background: 'hsl(var(--playful-card-background))', color: 'hsl(var(--playful-content-text-color))' }}>
          {children}
        </Content>
      </div >
    );
  }

  const userMenu = (

    <Menu>
      <Menu.Item key="profile">
        <Link to="/profile">My Awesome Self</Link>
      </Menu.Item>
      <Menu.Item key="logout" onClick={() => useStore.getState().logout()}>
        See Ya Later!
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
        style={{ background: 'hsl(var(--playful-sider-background))' }}
        className="playful-sider" // Added class for specific Sider styling
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
          {!collapsed ? 'My Fun Zone' : '🚀'}
        </div>
        <Menu
          theme="light" // Changed from dark to light
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ background: 'transparent' }} // Make menu background transparent
          items={navigation.map(item => ({
            key: item.key,
            icon: <span role="img" aria-label={item.label}>{item.icon}</span>, // Removed inline style
            label: <Link to={item.to}>{item.label}</Link>, // Removed inline style
          }))}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: 'hsl(var(--playful-header-background))',
            color: 'hsl(var(--playful-header-text-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px hsla(var(--playful-content-text-color), 0.05)', // Softer shadow
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
                '/': 'My Happy Place',
                '/photos': 'Memory Lane',
                '/files': 'My Treasure Box',
                '/resume': 'My Awesome Story',
                '/profile': 'My Awesome Self',
                // Add more routes and titles as needed
              }[location.pathname] || 'My Happy Place'}
            </Title>
          </div>
          <Dropdown overlay={userMenu} placement="bottomRight" arrow>
            <Avatar size="large" style={{ cursor: 'pointer', backgroundColor: 'hsl(var(--playful-sider-logo-background))', color: 'hsl(var(--playful-sider-logo-text-color))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span role="img" aria-label="User Menu" style={{ fontSize: '24px' }}>🌟</span>
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
            borderRadius: 'var(--radius)', // Using radius from CSS variables
            border: '1px solid hsl(var(--playful-card-border-color))'
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutComponent;
