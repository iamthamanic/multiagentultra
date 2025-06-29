'use client';

import { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Badge } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  RobotOutlined,
  DatabaseOutlined,
  ControlOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/store';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { backendConnection, stats } = useAppSelector(state => state.multiAgent);

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
    },
    {
      key: '/crews',
      icon: <TeamOutlined />,
      label: 'Crews',
    },
    {
      key: '/agents',
      icon: <RobotOutlined />,
      label: 'Agents',
    },
    {
      type: 'divider',
    },
    {
      key: '/knowledge',
      icon: <DatabaseOutlined />,
      label: 'Knowledge Base',
    },
    {
      key: '/mission-control',
      icon: <ControlOutlined />,
      label: 'Mission Control',
    },
    {
      key: '/logs',
      icon: <FileTextOutlined />,
      label: 'Live Logs',
    },
  ];

  const handleMenuSelect = ({ key }: { key: string }) => {
    // Prevent multiple rapid clicks and unnecessary navigation
    if (pathname !== key) {
      console.log('Navigating to:', key);
      router.push(key);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: 'white',
          borderRight: '1px solid #f0f0f0',
        }}
        theme="light"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            {collapsed ? (
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MU</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MU</span>
                </div>
                <span className="font-bold text-gray-800">MultiAgent Ultra</span>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onSelect={handleMenuSelect}
            className="border-none flex-1"
            style={{ backgroundColor: 'transparent' }}
          />

          {/* Connection Status */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Badge 
                status={backendConnection ? 'success' : 'error'} 
                text={collapsed ? '' : (backendConnection ? 'Online' : 'Offline')}
              />
            </div>
          </div>
        </div>
      </Sider>

      <Layout>
        <Header 
          style={{ 
            padding: '0 24px', 
            background: 'white',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* Stats Quick View */}
            {!collapsed && (
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span>{stats.totalProjects} Projects</span>
                <span>{stats.totalCrews} Crews</span>
                <span>{stats.totalAgents} Agents</span>
                <span>{stats.activeTasks} Active</span>
              </div>
            )}

            {/* Notifications */}
            <Button type="text" icon={<BellOutlined />} />

            {/* User Menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Avatar icon={<UserOutlined />} />
                <span className="text-gray-700">Admin</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: 0,
            padding: 0,
            background: '#f5f5f5',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}