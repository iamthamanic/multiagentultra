'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Input, 
  Select, 
  Modal,
  Typography, 
  Row, 
  Col,
  Statistic,
  Dropdown,
  Avatar,
  Badge,
  Tooltip,
  Progress,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  RobotOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  ProjectOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/store';
import type { Crew, Project, Agent } from '@/store/slices/multiAgentSlice';
import { setCrews, setCrewsLoading, setSelectedCrew } from '@/store/slices/multiAgentSlice';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function CrewsPage() {
  const dispatch = useAppDispatch();
  const { crews, projects, agents, loading } = useAppSelector(state => state.multiAgent);
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<number | 'all'>('all');

  // Load crews on mount
  useEffect(() => {
    loadCrews();
  }, [dispatch]);

  const loadCrews = async () => {
    dispatch(setCrewsLoading(true));
    try {
      const response = await fetch('http://localhost:8888/api/v1/crews');
      if (response.ok) {
        const data = await response.json();
        dispatch(setCrews(data));
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      // Fallback demo data
      const demoCrews: Crew[] = [
        { 
          id: 1, 
          name: 'Content Creation Team', 
          project_id: 1, 
          status: 'active', 
          agents_count: 3 
        },
        { 
          id: 2, 
          name: 'Research & Analysis', 
          project_id: 2, 
          status: 'active', 
          agents_count: 2 
        },
        { 
          id: 3, 
          name: 'Customer Support', 
          project_id: 3, 
          status: 'inactive', 
          agents_count: 4 
        },
        { 
          id: 4, 
          name: 'Data Processing', 
          project_id: 2, 
          status: 'active', 
          agents_count: 2 
        },
        { 
          id: 5, 
          name: 'Quality Assurance', 
          project_id: 1, 
          status: 'inactive', 
          agents_count: 3 
        },
        { 
          id: 6, 
          name: 'Social Media Team', 
          project_id: 5, 
          status: 'active', 
          agents_count: 2 
        },
      ];
      dispatch(setCrews(demoCrews));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || `Project ${projectId}`;
  };

  const getCrewAgents = (crewId: number) => {
    return agents.filter(agent => agent.crew_id === crewId);
  };

  const getActiveAgentsCount = (crewId: number) => {
    return getCrewAgents(crewId).filter(agent => agent.status === 'active').length;
  };

  const handleAction = (action: string, crew: Crew) => {
    switch (action) {
      case 'view':
        dispatch(setSelectedCrew(crew.id));
        message.info(`Viewing crew: ${crew.name}`);
        break;
      case 'edit':
        message.info(`Editing crew: ${crew.name}`);
        break;
      case 'delete':
        Modal.confirm({
          title: 'Delete Crew',
          content: `Are you sure you want to delete "${crew.name}"?`,
          okText: 'Delete',
          okType: 'danger',
          onOk: () => {
            message.success(`Crew "${crew.name}" deleted`);
          },
        });
        break;
      case 'start':
        message.success(`Crew "${crew.name}" started`);
        break;
      case 'pause':
        message.warning(`Crew "${crew.name}" paused`);
        break;
      case 'configure':
        message.info(`Configuring crew: ${crew.name}`);
        break;
    }
  };

  const actionMenuItems = (crew: Crew) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => handleAction('view', crew),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => handleAction('edit', crew),
    },
    {
      key: 'configure',
      icon: <SettingOutlined />,
      label: 'Configure',
      onClick: () => handleAction('configure', crew),
    },
    {
      type: 'divider' as const,
    },
    ...(crew.status === 'active' ? [{
      key: 'pause',
      icon: <PauseCircleOutlined />,
      label: 'Pause',
      onClick: () => handleAction('pause', crew),
    }] : [{
      key: 'start',
      icon: <PlayCircleOutlined />,
      label: 'Start',
      onClick: () => handleAction('start', crew),
    }]),
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: () => handleAction('delete', crew),
    },
  ];

  const columns: ColumnsType<Crew> = [
    {
      title: 'Crew Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => 
        record.name.toLowerCase().includes(value.toString().toLowerCase()),
      render: (text, record) => (
        <div>
          <div className="flex items-center space-x-2">
            <Avatar size="small" icon={<TeamOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <Text strong className="cursor-pointer hover:text-blue-500" 
                  onClick={() => handleAction('view', record)}>
              {text}
            </Text>
          </div>
          <Text type="secondary" className="text-xs ml-6">
            ID: {record.id}
          </Text>
        </div>
      ),
    },
    {
      title: 'Project',
      dataIndex: 'project_id',
      key: 'project_id',
      filters: projects.map(p => ({ text: p.name, value: p.id })),
      filteredValue: projectFilter !== 'all' ? [projectFilter] : null,
      onFilter: (value, record) => record.project_id === value,
      render: (projectId) => (
        <div className="flex items-center space-x-2">
          <ProjectOutlined className="text-gray-400" />
          <Text>{getProjectName(projectId)}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      filteredValue: statusFilter !== 'all' ? [statusFilter] : null,
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Agents',
      key: 'agents',
      width: 150,
      render: (_, record) => {
        const crewAgents = getCrewAgents(record.id);
        const activeCount = getActiveAgentsCount(record.id);
        const totalCount = record.agents_count;
        
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <RobotOutlined className="text-gray-400" />
              <Text>{activeCount}/{totalCount} active</Text>
            </div>
            <Progress 
              percent={(activeCount / totalCount) * 100} 
              size="small" 
              showInfo={false}
              strokeColor={activeCount === totalCount ? '#52c41a' : '#1890ff'}
            />
          </div>
        );
      },
    },
    {
      title: 'Team',
      key: 'team',
      width: 120,
      render: (_, record) => {
        const crewAgents = getCrewAgents(record.id);
        const displayAgents = crewAgents.slice(0, 3);
        const remainingCount = crewAgents.length - displayAgents.length;
        
        return (
          <Avatar.Group size="small" maxCount={3}>
            {displayAgents.map(agent => (
              <Tooltip key={agent.id} title={`${agent.name} (${agent.role})`}>
                <Avatar size="small" icon={<UserOutlined />} />
              </Tooltip>
            ))}
            {remainingCount > 0 && (
              <Tooltip title={`${remainingCount} more agents`}>
                <Avatar size="small" style={{ backgroundColor: '#f56a00' }}>
                  +{remainingCount}
                </Avatar>
              </Tooltip>
            )}
          </Avatar.Group>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown menu={{ items: actionMenuItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const filteredCrews = crews.filter(crew => {
    const matchesSearch = searchText === '' || 
      crew.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || crew.status === statusFilter;
    const matchesProject = projectFilter === 'all' || crew.project_id === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const stats = {
    total: crews.length,
    active: crews.filter(c => c.status === 'active').length,
    inactive: crews.filter(c => c.status === 'inactive').length,
    totalAgents: crews.reduce((sum, crew) => sum + crew.agents_count, 0),
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <Title level={2} className="!mb-2">Crews</Title>
                <Text type="secondary">
                  Manage your agent teams and crew configurations
                </Text>
              </div>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="large"
              >
                New Crew
              </Button>
            </div>
          </div>

          {/* Stats */}
          <Row gutter={16} className="mb-6">
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Total Crews" 
                  value={stats.total}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Active Crews" 
                  value={stats.active}
                  prefix={<PlayCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Inactive Crews" 
                  value={stats.inactive}
                  prefix={<PauseCircleOutlined />}
                  valueStyle={{ color: '#8c8c8c' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Total Agents" 
                  value={stats.totalAgents}
                  prefix={<RobotOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-6">
            <Row gutter={16} align="middle">
              <Col xs={24} sm={8}>
                <Search
                  placeholder="Search crews..."
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                  placeholder="Filter by status"
                >
                  <Option value="all">All Status</Option>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Col>
              <Col xs={24} sm={6}>
                <Select
                  value={projectFilter}
                  onChange={setProjectFilter}
                  style={{ width: '100%' }}
                  placeholder="Filter by project"
                >
                  <Option value="all">All Projects</Option>
                  {projects.map(project => (
                    <Option key={project.id} value={project.id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={4}>
                <div className="flex justify-end">
                  <Text type="secondary">
                    {filteredCrews.length} crews
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Crews Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={filteredCrews}
              rowKey="id"
              loading={loading.crews}
              pagination={{
                total: filteredCrews.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} crews`,
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}