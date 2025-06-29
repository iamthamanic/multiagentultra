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
  Descriptions,
  Drawer,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  RobotOutlined,
  TeamOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  ProjectOutlined,
  SettingOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/store';
import type { Agent, Crew, Project } from '@/store/slices/multiAgentSlice';
import { setAgents, setAgentsLoading } from '@/store/slices/multiAgentSlice';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function AgentsPage() {
  const dispatch = useAppDispatch();
  const { agents, crews, projects, loading } = useAppSelector(state => state.multiAgent);
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [crewFilter, setCrewFilter] = useState<number | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, [dispatch]);

  const loadAgents = async () => {
    dispatch(setAgentsLoading(true));
    try {
      const response = await fetch('http://localhost:8888/api/v1/agents');
      if (response.ok) {
        const data = await response.json();
        dispatch(setAgents(data));
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      // Fallback demo data
      const demoAgents: Agent[] = [
        { 
          id: 1, 
          name: 'Content Writer Agent', 
          crew_id: 1, 
          role: 'Content Writer', 
          status: 'active',
          backstory: 'Expert content writer specialized in creating engaging blog posts and articles.'
        },
        { 
          id: 2, 
          name: 'SEO Optimizer', 
          crew_id: 1, 
          role: 'SEO Specialist', 
          status: 'active',
          backstory: 'Advanced SEO specialist focused on keyword optimization and content ranking.'
        },
        { 
          id: 3, 
          name: 'Editor Agent', 
          crew_id: 1, 
          role: 'Content Editor', 
          status: 'busy',
          backstory: 'Meticulous editor ensuring content quality and consistency.'
        },
        { 
          id: 4, 
          name: 'Research Agent', 
          crew_id: 2, 
          role: 'Data Researcher', 
          status: 'active',
          backstory: 'Data research specialist gathering insights from multiple sources.'
        },
        { 
          id: 5, 
          name: 'Analysis Agent', 
          crew_id: 2, 
          role: 'Data Analyst', 
          status: 'inactive',
          backstory: 'Statistical analysis expert providing data-driven insights.'
        },
        { 
          id: 6, 
          name: 'Support Bot', 
          crew_id: 3, 
          role: 'Customer Support', 
          status: 'active',
          backstory: 'Customer service agent trained in product knowledge and issue resolution.'
        },
        { 
          id: 7, 
          name: 'Escalation Handler', 
          crew_id: 3, 
          role: 'Senior Support', 
          status: 'active',
          backstory: 'Senior support agent handling complex customer escalations.'
        },
        { 
          id: 8, 
          name: 'Data Processor', 
          crew_id: 4, 
          role: 'Data Processor', 
          status: 'busy',
          backstory: 'Automated data processing agent for large-scale data transformations.'
        },
        { 
          id: 9, 
          name: 'QA Tester', 
          crew_id: 5, 
          role: 'Quality Assurance', 
          status: 'inactive',
          backstory: 'Quality assurance specialist ensuring output meets standards.'
        },
        { 
          id: 10, 
          name: 'Social Media Manager', 
          crew_id: 6, 
          role: 'Social Media', 
          status: 'active',
          backstory: 'Social media expert creating engaging content for various platforms.'
        },
      ];
      dispatch(setAgents(demoAgents));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'busy': return 'warning';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleOutlined />;
      case 'busy': return <ClockCircleOutlined />;
      case 'inactive': return <ExclamationCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getCrewName = (crewId: number) => {
    const crew = crews.find(c => c.id === crewId);
    return crew?.name || `Crew ${crewId}`;
  };

  const getProjectName = (crewId: number) => {
    const crew = crews.find(c => c.id === crewId);
    if (!crew) return 'Unknown Project';
    const project = projects.find(p => p.id === crew.project_id);
    return project?.name || `Project ${crew.project_id}`;
  };

  const getAllRoles = () => {
    return [...new Set(agents.map(agent => agent.role))];
  };

  const handleAction = (action: string, agent: Agent) => {
    switch (action) {
      case 'view':
        setSelectedAgent(agent);
        setDrawerVisible(true);
        break;
      case 'edit':
        message.info(`Editing agent: ${agent.name}`);
        break;
      case 'delete':
        Modal.confirm({
          title: 'Delete Agent',
          content: `Are you sure you want to delete "${agent.name}"?`,
          okText: 'Delete',
          okType: 'danger',
          onOk: () => {
            message.success(`Agent "${agent.name}" deleted`);
          },
        });
        break;
      case 'start':
        message.success(`Agent "${agent.name}" activated`);
        break;
      case 'pause':
        message.warning(`Agent "${agent.name}" paused`);
        break;
      case 'configure':
        message.info(`Configuring agent: ${agent.name}`);
        break;
    }
  };

  const actionMenuItems = (agent: Agent) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => handleAction('view', agent),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => handleAction('edit', agent),
    },
    {
      key: 'configure',
      icon: <SettingOutlined />,
      label: 'Configure',
      onClick: () => handleAction('configure', agent),
    },
    {
      type: 'divider' as const,
    },
    ...(agent.status === 'active' || agent.status === 'busy' ? [{
      key: 'pause',
      icon: <PauseCircleOutlined />,
      label: 'Deactivate',
      onClick: () => handleAction('pause', agent),
    }] : [{
      key: 'start',
      icon: <PlayCircleOutlined />,
      label: 'Activate',
      onClick: () => handleAction('start', agent),
    }]),
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: () => handleAction('delete', agent),
    },
  ];

  const columns: ColumnsType<Agent> = [
    {
      title: 'Agent',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => 
        record.name.toLowerCase().includes(value.toString().toLowerCase()) ||
        record.role.toLowerCase().includes(value.toString().toLowerCase()),
      render: (text, record) => (
        <div>
          <div className="flex items-center space-x-3">
            <Avatar 
              size="default" 
              icon={<RobotOutlined />} 
              style={{ backgroundColor: '#722ed1' }} 
            />
            <div>
              <Text strong className="cursor-pointer hover:text-blue-500" 
                    onClick={() => handleAction('view', record)}>
                {text}
              </Text>
              <br />
              <Text type="secondary" className="text-xs">
                ID: {record.id} • {record.role}
              </Text>
            </div>
          </div>
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
        { text: 'Busy', value: 'busy' },
        { text: 'Inactive', value: 'inactive' },
      ],
      filteredValue: statusFilter !== 'all' ? [statusFilter] : null,
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <div className="flex items-center space-x-1">
          {getStatusIcon(status)}
          <Tag color={getStatusColor(status)}>
            {status.toUpperCase()}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Crew',
      dataIndex: 'crew_id',
      key: 'crew_id',
      filters: crews.map(c => ({ text: c.name, value: c.id })),
      filteredValue: crewFilter !== 'all' ? [crewFilter] : null,
      onFilter: (value, record) => record.crew_id === value,
      render: (crewId, record) => (
        <div>
          <div className="flex items-center space-x-2">
            <TeamOutlined className="text-gray-400" />
            <Text>{getCrewName(crewId)}</Text>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <ProjectOutlined className="text-gray-400" />
            <Text type="secondary" className="text-xs">
              {getProjectName(crewId)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      filters: getAllRoles().map(role => ({ text: role, value: role })),
      filteredValue: roleFilter !== 'all' ? [roleFilter] : null,
      onFilter: (value, record) => record.role === value,
      render: (role) => (
        <Tag color="blue">{role}</Tag>
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

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = searchText === '' || 
      agent.name.toLowerCase().includes(searchText.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesCrew = crewFilter === 'all' || agent.crew_id === crewFilter;
    const matchesRole = roleFilter === 'all' || agent.role === roleFilter;
    return matchesSearch && matchesStatus && matchesCrew && matchesRole;
  });

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    busy: agents.filter(a => a.status === 'busy').length,
    inactive: agents.filter(a => a.status === 'inactive').length,
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <Title level={2} className="!mb-2">Agents</Title>
                <Text type="secondary">
                  Manage and monitor individual AI agents across all crews
                </Text>
              </div>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="large"
              >
                New Agent
              </Button>
            </div>
          </div>

          {/* Stats */}
          <Row gutter={16} className="mb-6">
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Total Agents" 
                  value={stats.total}
                  prefix={<RobotOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Active" 
                  value={stats.active}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Busy" 
                  value={stats.busy}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Inactive" 
                  value={stats.inactive}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#8c8c8c' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-6">
            <Row gutter={16} align="middle">
              <Col xs={24} sm={6}>
                <Search
                  placeholder="Search agents..."
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={4}>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                  placeholder="Status"
                >
                  <Option value="all">All Status</Option>
                  <Option value="active">Active</Option>
                  <Option value="busy">Busy</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Col>
              <Col xs={24} sm={5}>
                <Select
                  value={crewFilter}
                  onChange={setCrewFilter}
                  style={{ width: '100%' }}
                  placeholder="Crew"
                >
                  <Option value="all">All Crews</Option>
                  {crews.map(crew => (
                    <Option key={crew.id} value={crew.id}>
                      {crew.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={5}>
                <Select
                  value={roleFilter}
                  onChange={setRoleFilter}
                  style={{ width: '100%' }}
                  placeholder="Role"
                >
                  <Option value="all">All Roles</Option>
                  {getAllRoles().map(role => (
                    <Option key={role} value={role}>
                      {role}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={4}>
                <div className="flex justify-end">
                  <Text type="secondary">
                    {filteredAgents.length} agents
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Agents Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={filteredAgents}
              rowKey="id"
              loading={loading.agents}
              pagination={{
                total: filteredAgents.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} agents`,
              }}
              scroll={{ x: 800 }}
            />
          </Card>

          {/* Agent Details Drawer */}
          <Drawer
            title="Agent Details"
            width={640}
            placement="right"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
          >
            {selectedAgent && (
              <div className="space-y-6">
                {/* Agent Header */}
                <div className="flex items-center space-x-4">
                  <Avatar 
                    size={64} 
                    icon={<RobotOutlined />} 
                    style={{ backgroundColor: '#722ed1' }}
                  />
                  <div>
                    <Title level={3} className="!mb-1">{selectedAgent.name}</Title>
                    <Text type="secondary">{selectedAgent.role}</Text>
                    <br />
                    <Tag color={getStatusColor(selectedAgent.status)} className="mt-2">
                      {selectedAgent.status.toUpperCase()}
                    </Tag>
                  </div>
                </div>

                {/* Agent Info */}
                <Descriptions title="Agent Information" column={1}>
                  <Descriptions.Item label="Agent ID">
                    {selectedAgent.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="Role">
                    {selectedAgent.role}
                  </Descriptions.Item>
                  <Descriptions.Item label="Crew">
                    {getCrewName(selectedAgent.crew_id)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Project">
                    {getProjectName(selectedAgent.crew_id)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedAgent.status)}
                      <Tag color={getStatusColor(selectedAgent.status)}>
                        {selectedAgent.status.toUpperCase()}
                      </Tag>
                    </div>
                  </Descriptions.Item>
                </Descriptions>

                {/* Backstory */}
                {selectedAgent.backstory && (
                  <div>
                    <Title level={4}>Backstory</Title>
                    <Paragraph>{selectedAgent.backstory}</Paragraph>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <Title level={4}>Actions</Title>
                  <Space wrap>
                    <Button icon={<EditOutlined />}>
                      Edit Agent
                    </Button>
                    <Button icon={<SettingOutlined />}>
                      Configure
                    </Button>
                    {selectedAgent.status === 'active' || selectedAgent.status === 'busy' ? (
                      <Button icon={<PauseCircleOutlined />} type="default">
                        Deactivate
                      </Button>
                    ) : (
                      <Button icon={<PlayCircleOutlined />} type="primary">
                        Activate
                      </Button>
                    )}
                    <Button icon={<DeleteOutlined />} danger>
                      Delete
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </Drawer>
        </div>
      </div>
    </AppLayout>
  );
}