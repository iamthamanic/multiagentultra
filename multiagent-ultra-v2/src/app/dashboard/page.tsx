'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Badge, 
  Button, 
  List, 
  Avatar, 
  Space,
  Alert,
  Spin,
  Divider
} from 'antd';
import { 
  ProjectOutlined, 
  TeamOutlined, 
  RobotOutlined, 
  ThunderboltOutlined,
  PlusOutlined,
  DatabaseOutlined,
  PlayCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/store';
import { 
  setBackendConnection,
  setProjects,
  setCrews,
  setAgents,
  setProjectsLoading,
  setCrewsLoading,
  setAgentsLoading,
  setProjectsError
} from '@/store/slices/multiAgentSlice';
import type { Project, Crew, Agent } from '@/store/slices/multiAgentSlice';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const {
    projects,
    crews,
    agents,
    loading,
    errors,
    backendConnection,
    stats
  } = useAppSelector(state => state.multiAgent);

  // Check backend connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:8888');
        dispatch(setBackendConnection(response.ok));
      } catch (error) {
        dispatch(setBackendConnection(false));
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [dispatch]);

  // Load data
  useEffect(() => {
    if (backendConnection) {
      loadProjects();
      loadCrews();
      loadAgents();
    }
  }, [backendConnection, dispatch]);

  const loadProjects = async () => {
    dispatch(setProjectsLoading(true));
    try {
      const response = await fetch('http://localhost:8888/api/v1/projects');
      if (response.ok) {
        const data = await response.json();
        dispatch(setProjects(data));
      } else {
        throw new Error('Failed to load projects');
      }
    } catch (error) {
      dispatch(setProjectsError(error instanceof Error ? error.message : 'Unknown error'));
      // Fallback demo data for development
      dispatch(setProjects([
        { id: 1, name: 'Demo Project 1', status: 'active', created_at: '2024-01-01', updated_at: '2024-01-15' },
        { id: 2, name: 'Content Generator', status: 'active', created_at: '2024-01-10', updated_at: '2024-01-20' },
        { id: 3, name: 'Data Analysis', status: 'completed', created_at: '2024-01-05', updated_at: '2024-01-18' },
      ] as Project[]));
    }
  };

  const loadCrews = async () => {
    dispatch(setCrewsLoading(true));
    try {
      const response = await fetch('http://localhost:8888/api/v1/crews');
      if (response.ok) {
        const data = await response.json();
        dispatch(setCrews(data));
      } else {
        throw new Error('Failed to load crews');
      }
    } catch (error) {
      // Fallback demo data
      dispatch(setCrews([
        { id: 1, name: 'Content Team', project_id: 1, status: 'active', agents_count: 3 },
        { id: 2, name: 'Research Team', project_id: 2, status: 'active', agents_count: 2 },
        { id: 3, name: 'Analytics Team', project_id: 3, status: 'inactive', agents_count: 4 },
      ] as Crew[]));
    }
  };

  const loadAgents = async () => {
    dispatch(setAgentsLoading(true));
    try {
      const response = await fetch('http://localhost:8888/api/v1/agents');
      if (response.ok) {
        const data = await response.json();
        dispatch(setAgents(data));
      } else {
        throw new Error('Failed to load agents');
      }
    } catch (error) {
      // Fallback demo data
      dispatch(setAgents([
        { id: 1, name: 'Writer Agent', crew_id: 1, role: 'Content Writer', status: 'active' },
        { id: 2, name: 'Editor Agent', crew_id: 1, role: 'Content Editor', status: 'busy' },
        { id: 3, name: 'SEO Agent', crew_id: 1, role: 'SEO Specialist', status: 'active' },
        { id: 4, name: 'Researcher Agent', crew_id: 2, role: 'Data Researcher', status: 'active' },
        { id: 5, name: 'Analyst Agent', crew_id: 2, role: 'Data Analyst', status: 'inactive' },
      ] as Agent[]));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'busy': return 'warning';
      case 'completed': return 'default';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const recentProjects = projects.slice(0, 5);
  const isLoading = loading.projects || loading.crews || loading.agents;

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <Title level={2} className="!mb-2">
                MultiAgent Ultra Dashboard
              </Title>
              <Text type="secondary">
                Übersicht über alle CrewAI Multi-Agent Aktivitäten
              </Text>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                status={backendConnection ? 'success' : 'error'} 
                text={backendConnection ? 'Backend Online' : 'Backend Offline'}
              />
            </div>
          </div>
        </div>

        {/* Connection Error */}
        {!backendConnection && (
          <Alert
            type="warning"
            message="Backend Connection Lost"
            description="Unable to connect to FastAPI backend. Using demo data for preview."
            showIcon
            className="mb-6"
          />
        )}

        {/* Error Display */}
        {errors.projects && (
          <Alert
            type="error"
            message="Data Loading Error"
            description={errors.projects}
            showIcon
            closable
            className="mb-6"
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="mb-6">
            <div className="flex items-center justify-center py-8">
              <Space>
                <Spin size="large" />
                <Text>Loading Dashboard Data...</Text>
              </Space>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <Row gutter={[24, 24]} className="mb-8">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Projects"
                value={stats.totalProjects}
                prefix={<ProjectOutlined style={{ color: '#3b82f6' }} />}
                valueStyle={{ color: '#1f2937' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Crews"
                value={stats.totalCrews}
                prefix={<TeamOutlined style={{ color: '#10b981' }} />}
                valueStyle={{ color: '#1f2937' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Agents"
                value={stats.totalAgents}
                prefix={<RobotOutlined style={{ color: '#8b5cf6' }} />}
                valueStyle={{ color: '#1f2937' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Tasks"
                value={stats.activeTasks}
                prefix={<ThunderboltOutlined style={{ color: '#f59e0b' }} />}
                valueStyle={{ color: '#1f2937' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* Recent Projects */}
          <Col xs={24} lg={12}>
            <Card
              title="Recent Projects"
              extra={<Button type="text" icon={<PlusOutlined />}>New Project</Button>}
            >
              {recentProjects.length > 0 ? (
                <List
                  dataSource={recentProjects}
                  renderItem={(project) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            style={{ backgroundColor: '#3b82f6' }}
                            icon={<ProjectOutlined />}
                          />
                        }
                        title={
                          <div className="flex items-center justify-between">
                            <Text strong>{project.name}</Text>
                            <Badge 
                              status={getStatusColor(project.status)} 
                              text={project.status}
                            />
                          </div>
                        }
                        description={`Project #${project.id} • Created ${new Date(project.created_at).toLocaleDateString()}`}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div className="text-center py-8">
                  <Text type="secondary">No projects found</Text>
                  <br />
                  <Button type="primary" icon={<PlusOutlined />} className="mt-4">
                    Create First Project
                  </Button>
                </div>
              )}
            </Card>
          </Col>

          {/* Quick Actions */}
          <Col xs={24} lg={12}>
            <Card title="Quick Actions">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Button 
                    type="dashed" 
                    block 
                    size="large" 
                    icon={<ProjectOutlined />}
                    className="h-16"
                  >
                    <div className="text-left">
                      <div className="font-medium">New Project</div>
                      <div className="text-sm text-gray-500">Create a new MultiAgent project</div>
                    </div>
                  </Button>
                </Col>
                <Col span={24}>
                  <Button 
                    type="dashed" 
                    block 
                    size="large" 
                    icon={<TeamOutlined />}
                    className="h-16"
                  >
                    <div className="text-left">
                      <div className="font-medium">New Crew</div>
                      <div className="text-sm text-gray-500">Add a new agent crew</div>
                    </div>
                  </Button>
                </Col>
                <Col span={24}>
                  <Button 
                    type="dashed" 
                    block 
                    size="large" 
                    icon={<DatabaseOutlined />}
                    className="h-16"
                  >
                    <div className="text-left">
                      <div className="font-medium">Knowledge Base</div>
                      <div className="text-sm text-gray-500">Manage hierarchical RAG system</div>
                    </div>
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Active Crews */}
        {crews.filter(c => c.status === 'active').length > 0 && (
          <Card title="Active Crews" className="mt-6">
            <Row gutter={[16, 16]}>
              {crews.filter(c => c.status === 'active').map(crew => (
                <Col xs={24} sm={12} lg={8} key={crew.id}>
                  <Card size="small">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text strong>{crew.name}</Text>
                        <br />
                        <Text type="secondary">{crew.agents_count} agents</Text>
                      </div>
                      <Button 
                        type="primary" 
                        icon={<PlayCircleOutlined />} 
                        size="small"
                      >
                        View
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}
        </div>
      </div>
    </AppLayout>
  );
}