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
  message
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  CalendarOutlined,
  TeamOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/store';
import type { Project } from '@/store/slices/multiAgentSlice';
import { setProjects, setProjectsLoading, setSelectedProject } from '@/store/slices/multiAgentSlice';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const { projects, loading, selectedProject, crews, agents } = useAppSelector(state => state.multiAgent);
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [dispatch]);

  const loadProjects = async () => {
    dispatch(setProjectsLoading(true));
    try {
      // Try to fetch from API
      const response = await fetch('http://localhost:8888/api/v1/projects');
      if (response.ok) {
        const data = await response.json();
        dispatch(setProjects(data));
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      // Fallback demo data
      const demoProjects: Project[] = [
        { 
          id: 1, 
          name: 'Content Generation Pipeline', 
          status: 'active', 
          created_at: '2024-01-15T10:00:00Z', 
          updated_at: '2024-01-20T14:30:00Z' 
        },
        { 
          id: 2, 
          name: 'Data Analysis Automation', 
          status: 'active', 
          created_at: '2024-01-10T09:15:00Z', 
          updated_at: '2024-01-19T16:45:00Z' 
        },
        { 
          id: 3, 
          name: 'Customer Support Bot', 
          status: 'completed', 
          created_at: '2024-01-05T11:30:00Z', 
          updated_at: '2024-01-18T12:15:00Z' 
        },
        { 
          id: 4, 
          name: 'Research Assistant', 
          status: 'inactive', 
          created_at: '2024-01-08T14:20:00Z', 
          updated_at: '2024-01-17T10:30:00Z' 
        },
        { 
          id: 5, 
          name: 'Social Media Manager', 
          status: 'active', 
          created_at: '2024-01-12T16:45:00Z', 
          updated_at: '2024-01-21T09:20:00Z' 
        },
      ];
      dispatch(setProjects(demoProjects));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'completed': return 'blue';
      default: return 'default';
    }
  };

  const getProjectCrews = (projectId: number) => {
    return crews.filter(crew => crew.project_id === projectId);
  };

  const getProjectAgents = (projectId: number) => {
    const projectCrews = getProjectCrews(projectId);
    return agents.filter(agent => 
      projectCrews.some(crew => crew.id === agent.crew_id)
    );
  };

  const handleAction = (action: string, project: Project) => {
    switch (action) {
      case 'view':
        dispatch(setSelectedProject(project.id));
        message.info(`Viewing project: ${project.name}`);
        break;
      case 'edit':
        message.info(`Editing project: ${project.name}`);
        break;
      case 'delete':
        Modal.confirm({
          title: 'Delete Project',
          content: `Are you sure you want to delete "${project.name}"?`,
          okText: 'Delete',
          okType: 'danger',
          onOk: () => {
            message.success(`Project "${project.name}" deleted`);
          },
        });
        break;
      case 'start':
        message.success(`Project "${project.name}" started`);
        break;
      case 'pause':
        message.warning(`Project "${project.name}" paused`);
        break;
    }
  };

  const actionMenuItems = (project: Project) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => handleAction('view', project),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => handleAction('edit', project),
    },
    {
      type: 'divider' as const,
    },
    ...(project.status === 'active' ? [{
      key: 'pause',
      icon: <PauseCircleOutlined />,
      label: 'Pause',
      onClick: () => handleAction('pause', project),
    }] : [{
      key: 'start',
      icon: <PlayCircleOutlined />,
      label: 'Start',
      onClick: () => handleAction('start', project),
    }]),
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: () => handleAction('delete', project),
    },
  ];

  const columns: ColumnsType<Project> = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => 
        record.name.toLowerCase().includes(value.toString().toLowerCase()),
      render: (text, record) => (
        <div>
          <Text strong className="cursor-pointer hover:text-blue-500" 
                onClick={() => handleAction('view', record)}>
            {text}
          </Text>
          <br />
          <Text type="secondary" className="text-xs">
            ID: {record.id}
          </Text>
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
        { text: 'Completed', value: 'completed' },
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
      title: 'Teams',
      key: 'crews',
      width: 100,
      render: (_, record) => {
        const projectCrews = getProjectCrews(record.id);
        return (
          <div className="flex items-center space-x-1">
            <TeamOutlined className="text-gray-400" />
            <span>{projectCrews.length}</span>
          </div>
        );
      },
    },
    {
      title: 'Agents',
      key: 'agents',
      width: 100,
      render: (_, record) => {
        const projectAgents = getProjectAgents(record.id);
        return (
          <div className="flex items-center space-x-1">
            <RobotOutlined className="text-gray-400" />
            <span>{projectAgents.length}</span>
          </div>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (date) => (
        <div className="flex items-center space-x-1">
          <CalendarOutlined className="text-gray-400" />
          <span className="text-sm">
            {new Date(date).toLocaleDateString()}
          </span>
        </div>
      ),
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchText === '' || 
      project.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    inactive: projects.filter(p => p.status === 'inactive').length,
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <Title level={2} className="!mb-2">Projects</Title>
                <Text type="secondary">
                  Manage all your MultiAgent projects and workflows
                </Text>
              </div>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="large"
                onClick={() => setIsCreateModalOpen(true)}
              >
                New Project
              </Button>
            </div>
          </div>

          {/* Stats */}
          <Row gutter={16} className="mb-6">
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Total Projects" 
                  value={stats.total}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Active" 
                  value={stats.active}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Completed" 
                  value={stats.completed}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Inactive" 
                  value={stats.inactive}
                  valueStyle={{ color: '#8c8c8c' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-6">
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Search
                  placeholder="Search projects..."
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                  placeholder="Filter by status"
                >
                  <Option value="all">All Status</Option>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="completed">Completed</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} md={10}>
                <div className="flex justify-end">
                  <Text type="secondary">
                    Showing {filteredProjects.length} of {projects.length} projects
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Projects Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={filteredProjects}
              rowKey="id"
              loading={loading.projects}
              pagination={{
                total: filteredProjects.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} projects`,
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}