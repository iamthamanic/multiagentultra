'use client';

import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button,
  Select,
  Tag,
  Progress,
  Timeline,
  Alert,
  Space,
  Statistic,
  Badge,
  Avatar,
  Tooltip,
  Switch,
  message
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  ControlOutlined,
  RobotOutlined,
  TeamOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/store';
import type { Project, Crew, Agent } from '@/store/slices/multiAgentSlice';
import { addLiveLog } from '@/store/slices/multiAgentSlice';

const { Title, Text } = Typography;
const { Option } = Select;

interface TaskExecution {
  id: string;
  projectId: number;
  crewId: number;
  agentId: number;
  taskName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  estimatedCompletion?: string;
  logs: string[];
}

export default function MissionControlPage() {
  const dispatch = useAppDispatch();
  const { projects, crews, agents, backendConnection, liveLogs } = useAppSelector(state => state.multiAgent);
  
  const [selectedProject, setSelectedProject] = useState<number | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated task executions for demo
  useEffect(() => {
    // Initialize demo executions
    const demoExecutions: TaskExecution[] = [
      {
        id: '1',
        projectId: 1,
        crewId: 1,
        agentId: 1,
        taskName: 'Generate Blog Post Content',
        status: 'running',
        progress: 75,
        startTime: new Date(Date.now() - 300000).toISOString(),
        estimatedCompletion: new Date(Date.now() + 120000).toISOString(),
        logs: [
          'Task started',
          'Analyzing topic requirements',
          'Generating outline',
          'Writing introduction...'
        ]
      },
      {
        id: '2',
        projectId: 1,
        crewId: 1,
        agentId: 2,
        taskName: 'SEO Optimization',
        status: 'pending',
        progress: 0,
        startTime: new Date().toISOString(),
        logs: ['Task queued', 'Waiting for content input']
      },
      {
        id: '3',
        projectId: 2,
        crewId: 2,
        agentId: 4,
        taskName: 'Data Collection & Analysis',
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 900000).toISOString(),
        logs: [
          'Task started',
          'Data sources identified',
          'Data collection completed',
          'Analysis complete'
        ]
      }
    ];
    setExecutions(demoExecutions);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        // Simulate live updates
        setExecutions(prev => prev.map(exec => {
          if (exec.status === 'running' && exec.progress < 100) {
            const newProgress = Math.min(exec.progress + Math.random() * 10, 100);
            const newLogs = [...exec.logs];
            
            if (newProgress > exec.progress + 5) {
              newLogs.push(`Progress update: ${Math.round(newProgress)}% complete`);
            }
            
            if (newProgress >= 100) {
              newLogs.push('Task completed successfully');
              dispatch(addLiveLog({
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                project_id: exec.projectId,
                crew_id: exec.crewId,
                agent_id: exec.agentId,
                message: `Task "${exec.taskName}" completed successfully`,
                type: 'success'
              }));
            }
            
            return {
              ...exec,
              progress: newProgress,
              status: newProgress >= 100 ? 'completed' as const : exec.status,
              logs: newLogs
            };
          }
          return exec;
        }));
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, dispatch]);

  const getProjectName = (projectId: number) => {
    return projects.find(p => p.id === projectId)?.name || `Project ${projectId}`;
  };

  const getCrewName = (crewId: number) => {
    return crews.find(c => c.id === crewId)?.name || `Crew ${crewId}`;
  };

  const getAgentName = (agentId: number) => {
    return agents.find(a => a.id === agentId)?.name || `Agent ${agentId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'processing';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <ClockCircleOutlined />;
      case 'completed': return <CheckCircleOutlined />;
      case 'failed': return <ExclamationCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const handleExecuteAll = () => {
    setIsExecuting(true);
    message.info('Starting all pending tasks...');
    
    // Simulate execution start
    setExecutions(prev => prev.map(exec => 
      exec.status === 'pending' ? { ...exec, status: 'running' } : exec
    ));
    
    setTimeout(() => {
      setIsExecuting(false);
      message.success('All tasks initiated successfully');
    }, 2000);
  };

  const handlePauseAll = () => {
    message.warning('All running tasks paused');
    setExecutions(prev => prev.map(exec => 
      exec.status === 'running' ? { ...exec, status: 'pending' } : exec
    ));
  };

  const handleStopAll = () => {
    message.error('All tasks stopped');
    setExecutions(prev => prev.map(exec => 
      exec.status === 'running' ? { ...exec, status: 'failed' } : exec
    ));
  };

  const filteredExecutions = selectedProject === 'all' 
    ? executions 
    : executions.filter(exec => exec.projectId === selectedProject);

  const stats = {
    total: executions.length,
    running: executions.filter(e => e.status === 'running').length,
    completed: executions.filter(e => e.status === 'completed').length,
    pending: executions.filter(e => e.status === 'pending').length,
    failed: executions.filter(e => e.status === 'failed').length,
  };

  const recentLogs = liveLogs.slice(0, 10);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <Title level={2} className="!mb-2 flex items-center space-x-2">
                  <ControlOutlined />
                  <span>Mission Control</span>
                </Title>
                <Text type="secondary">
                  Real-time monitoring and control of all agent operations
                </Text>
              </div>
              <div className="flex items-center space-x-3">
                <Switch 
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                  checkedChildren="Auto"
                  unCheckedChildren="Manual"
                />
                <Badge status={backendConnection ? 'success' : 'error'} />
                <Text type="secondary">
                  {backendConnection ? 'Connected' : 'Offline'}
                </Text>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <Card className="mb-6">
            <Row gutter={16} align="middle">
              <Col xs={24} sm={8}>
                <Select
                  value={selectedProject}
                  onChange={setSelectedProject}
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
              <Col xs={24} sm={16}>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    loading={isExecuting}
                    onClick={handleExecuteAll}
                  >
                    Execute All
                  </Button>
                  <Button 
                    icon={<PauseCircleOutlined />}
                    onClick={handlePauseAll}
                  >
                    Pause All
                  </Button>
                  <Button 
                    danger 
                    icon={<StopOutlined />}
                    onClick={handleStopAll}
                  >
                    Stop All
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={() => window.location.reload()}
                  >
                    Refresh
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Stats Overview */}
          <Row gutter={16} className="mb-6">
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Total Tasks" 
                  value={stats.total}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Running" 
                  value={stats.running}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Completed" 
                  value={stats.completed}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Pending" 
                  value={stats.pending}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#8c8c8c' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Active Tasks */}
            <Col xs={24} lg={16}>
              <Card title="Active Task Executions" className="mb-6">
                <div className="space-y-4">
                  {filteredExecutions.map(execution => (
                    <Card size="small" key={execution.id}>
                      <div className="space-y-3">
                        {/* Task Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <Text strong>{execution.taskName}</Text>
                            <br />
                            <Space size="small" className="mt-1">
                              <Tag icon={<ProjectOutlined />} color="blue">
                                {getProjectName(execution.projectId)}
                              </Tag>
                              <Tag icon={<TeamOutlined />} color="green">
                                {getCrewName(execution.crewId)}
                              </Tag>
                              <Tag icon={<RobotOutlined />} color="purple">
                                {getAgentName(execution.agentId)}
                              </Tag>
                            </Space>
                          </div>
                          <div className="text-right">
                            <Badge 
                              status={getStatusColor(execution.status)} 
                              text={execution.status.toUpperCase()}
                            />
                            <br />
                            <Text type="secondary" className="text-xs">
                              Started: {new Date(execution.startTime).toLocaleTimeString()}
                            </Text>
                          </div>
                        </div>

                        {/* Progress */}
                        {execution.status === 'running' && (
                          <Progress 
                            percent={execution.progress} 
                            size="small"
                            format={percent => `${Math.round(percent || 0)}%`}
                          />
                        )}

                        {/* Recent Logs */}
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <Text type="secondary">
                            Latest: {execution.logs[execution.logs.length - 1]}
                          </Text>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-2">
                          <Button size="small" icon={<EyeOutlined />}>
                            Details
                          </Button>
                          {execution.status === 'running' ? (
                            <Button size="small" icon={<PauseCircleOutlined />}>
                              Pause
                            </Button>
                          ) : execution.status === 'pending' ? (
                            <Button size="small" type="primary" icon={<PlayCircleOutlined />}>
                              Start
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {filteredExecutions.length === 0 && (
                    <div className="text-center py-8">
                      <Text type="secondary">No active tasks found</Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* Live Activity Feed */}
            <Col xs={24} lg={8}>
              <Card title="Live Activity Feed" className="mb-6">
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <Timeline mode="left" items={recentLogs.map(log => ({
                    color: log.type === 'success' ? 'green' : 
                           log.type === 'error' ? 'red' : 
                           log.type === 'warning' ? 'orange' : 'blue',
                    children: (
                      <div>
                        <Text className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </Text>
                        <br />
                        <Text>{log.message}</Text>
                      </div>
                    )
                  }))} />
                  
                  {recentLogs.length === 0 && (
                    <div className="text-center py-8">
                      <Text type="secondary">No recent activity</Text>
                    </div>
                  )}
                </div>
              </Card>

              {/* System Status */}
              <Card title="System Status">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Text>Backend Connection</Text>
                    <Badge status={backendConnection ? 'success' : 'error'} />
                  </div>
                  <div className="flex justify-between items-center">
                    <Text>Auto Refresh</Text>
                    <Badge status={autoRefresh ? 'processing' : 'default'} />
                  </div>
                  <div className="flex justify-between items-center">
                    <Text>Active Projects</Text>
                    <Text>{projects.filter(p => p.status === 'active').length}</Text>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text>Running Crews</Text>
                    <Text>{crews.filter(c => c.status === 'active').length}</Text>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text>Active Agents</Text>
                    <Text>{agents.filter(a => a.status === 'active').length}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </AppLayout>
  );
}