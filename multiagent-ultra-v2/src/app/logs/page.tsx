'use client';

import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Input, 
  Select, 
  Typography, 
  Row, 
  Col,
  Switch,
  Badge,
  Avatar,
  Timeline,
  Tooltip,
  message,
  Drawer
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileTextOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ClearOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  TeamOutlined,
  ProjectOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/store';
import type { LiveLog } from '@/store/slices/multiAgentSlice';
import { addLiveLog, clearLiveLogs } from '@/store/slices/multiAgentSlice';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function LogsPage() {
  const dispatch = useAppDispatch();
  const { liveLogs, projects, crews, agents, backendConnection } = useAppSelector(state => state.multiAgent);
  
  const [isStreaming, setIsStreaming] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<number | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<LiveLog | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection for live logs
  useEffect(() => {
    if (isStreaming && backendConnection) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => disconnectWebSocket();
  }, [isStreaming, backendConnection]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && tableRef.current) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight;
    }
  }, [liveLogs, autoScroll]);

  // Simulate live logs for demo
  useEffect(() => {
    if (!backendConnection && isStreaming) {
      const interval = setInterval(() => {
        const logTypes = ['info', 'warning', 'error', 'success'] as const;
        const messages = [
          'Agent started task execution',
          'Data processing completed',
          'Connection timeout occurred',
          'Task completed successfully',
          'Starting content generation',
          'API request processed',
          'Warning: Rate limit approaching',
          'Error: Invalid configuration detected',
          'Crew coordination established',
          'Vector embedding generated',
          'Knowledge base updated',
          'Agent collaboration initiated'
        ];

        const randomProject = projects[Math.floor(Math.random() * projects.length)];
        const randomCrew = crews.filter(c => c.project_id === randomProject?.id)[0];
        const randomAgent = agents.filter(a => a.crew_id === randomCrew?.id)[0];

        if (randomProject && randomCrew && randomAgent) {
          const newLog: LiveLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            project_id: randomProject.id,
            crew_id: randomCrew.id,
            agent_id: randomAgent.id,
            message: messages[Math.floor(Math.random() * messages.length)],
            type: logTypes[Math.floor(Math.random() * logTypes.length)]
          };

          dispatch(addLiveLog(newLog));
        }
      }, 2000 + Math.random() * 3000); // Random interval 2-5 seconds

      return () => clearInterval(interval);
    }
  }, [isStreaming, backendConnection, projects, crews, agents, dispatch]);

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:8888/ws?project_id=0');
      
      wsRef.current.onopen = () => {
        message.success('Connected to live log stream');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const logData = JSON.parse(event.data);
          const newLog: LiveLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            project_id: logData.project_id,
            crew_id: logData.crew_id,
            agent_id: logData.agent_id,
            message: logData.message,
            type: logData.type || 'info'
          };
          dispatch(addLiveLog(newLog));
        } catch (error) {
          console.error('Failed to parse log message:', error);
        }
      };

      wsRef.current.onclose = () => {
        if (isStreaming) {
          message.warning('Disconnected from live log stream');
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        message.error('Live log connection error');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const getProjectName = (projectId: number) => {
    return projects.find(p => p.id === projectId)?.name || `Project ${projectId}`;
  };

  const getCrewName = (crewId?: number) => {
    if (!crewId) return '-';
    return crews.find(c => c.id === crewId)?.name || `Crew ${crewId}`;
  };

  const getAgentName = (agentId?: number) => {
    if (!agentId) return '-';
    return agents.find(a => a.id === agentId)?.name || `Agent ${agentId}`;
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'error': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'info': 
      default: return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': 
      default: return 'processing';
    }
  };

  const handleLogClick = (log: LiveLog) => {
    setSelectedLog(log);
    setDrawerVisible(true);
  };

  const handleClearLogs = () => {
    dispatch(clearLiveLogs());
    message.success('Logs cleared');
  };

  const handleExportLogs = () => {
    const filteredLogs = getFilteredLogs();
    const csvContent = [
      'Timestamp,Type,Project,Crew,Agent,Message',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.type}","${getProjectName(log.project_id)}","${getCrewName(log.crew_id)}","${getAgentName(log.agent_id)}","${log.message}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multiagent-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Logs exported successfully');
  };

  const getFilteredLogs = () => {
    return liveLogs.filter(log => {
      const matchesSearch = searchText === '' || 
        log.message.toLowerCase().includes(searchText.toLowerCase()) ||
        getProjectName(log.project_id).toLowerCase().includes(searchText.toLowerCase()) ||
        getCrewName(log.crew_id)?.toLowerCase().includes(searchText.toLowerCase()) ||
        getAgentName(log.agent_id)?.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesLevel = levelFilter === 'all' || log.type === levelFilter;
      const matchesProject = projectFilter === 'all' || log.project_id === projectFilter;
      
      return matchesSearch && matchesLevel && matchesProject;
    });
  };

  const columns: ColumnsType<LiveLog> = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      render: (timestamp) => (
        <Text className="text-xs font-mono">
          {new Date(timestamp).toLocaleTimeString()}
        </Text>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => (
        <div className="flex items-center space-x-1">
          {getLogIcon(type)}
          <Tag color={getLogColor(type)}>
            {type.toUpperCase()}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Source',
      key: 'source',
      width: 200,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-xs">
            <ProjectOutlined className="text-blue-500" />
            <Text className="text-xs">{getProjectName(record.project_id)}</Text>
          </div>
          {record.crew_id && (
            <div className="flex items-center space-x-1 text-xs">
              <TeamOutlined className="text-green-500" />
              <Text className="text-xs">{getCrewName(record.crew_id)}</Text>
            </div>
          )}
          {record.agent_id && (
            <div className="flex items-center space-x-1 text-xs">
              <RobotOutlined className="text-purple-500" />
              <Text className="text-xs">{getAgentName(record.agent_id)}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (message, record) => (
        <Text 
          className="cursor-pointer hover:text-blue-500"
          onClick={() => handleLogClick(record)}
        >
          {message.length > 100 ? `${message.substring(0, 100)}...` : message}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Button 
          type="text" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => handleLogClick(record)}
        />
      ),
    },
  ];

  const filteredLogs = getFilteredLogs();

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <Title level={2} className="!mb-2 flex items-center space-x-2">
                  <FileTextOutlined />
                  <span>Live Logs</span>
                </Title>
                <Text type="secondary">
                  Real-time monitoring of all agent activities and system events
                </Text>
              </div>
              <div className="flex items-center space-x-3">
                <Switch 
                  checked={autoScroll}
                  onChange={setAutoScroll}
                  checkedChildren="Auto Scroll"
                  unCheckedChildren="Manual"
                  size="small"
                />
                <Badge 
                  status={isStreaming ? 'processing' : 'default'} 
                  text={isStreaming ? 'Streaming' : 'Paused'}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <Card className="mb-6">
            <Row gutter={16} align="middle">
              <Col xs={24} sm={6}>
                <Search
                  placeholder="Search logs..."
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Col>
              <Col xs={24} sm={4}>
                <Select
                  value={levelFilter}
                  onChange={setLevelFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">All Levels</Option>
                  <Option value="info">Info</Option>
                  <Option value="warning">Warning</Option>
                  <Option value="error">Error</Option>
                  <Option value="success">Success</Option>
                </Select>
              </Col>
              <Col xs={24} sm={5}>
                <Select
                  value={projectFilter}
                  onChange={setProjectFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">All Projects</Option>
                  {projects.map(project => (
                    <Option key={project.id} value={project.id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={9}>
                <div className="flex justify-end space-x-2">
                  <Button 
                    icon={isStreaming ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    onClick={() => setIsStreaming(!isStreaming)}
                    type={isStreaming ? "default" : "primary"}
                  >
                    {isStreaming ? 'Pause' : 'Resume'}
                  </Button>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={handleExportLogs}
                  >
                    Export
                  </Button>
                  <Button 
                    icon={<ClearOutlined />}
                    onClick={handleClearLogs}
                    danger
                  >
                    Clear
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={() => window.location.reload()}
                  >
                    Refresh
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Logs Table */}
          <Card>
            <div 
              ref={tableRef}
              style={{ 
                maxHeight: '600px', 
                overflowY: 'auto',
                overflowX: 'auto'
              }}
            >
              <Table
                columns={columns}
                dataSource={filteredLogs}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
                rowClassName={(record) => {
                  switch (record.type) {
                    case 'error': return 'bg-red-50 hover:bg-red-100';
                    case 'warning': return 'bg-yellow-50 hover:bg-yellow-100';
                    case 'success': return 'bg-green-50 hover:bg-green-100';
                    default: return 'hover:bg-blue-50';
                  }
                }}
              />
            </div>
            
            <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
              <span>Showing {filteredLogs.length} of {liveLogs.length} logs</span>
              <span>
                Last updated: {liveLogs.length > 0 ? new Date(liveLogs[0].timestamp).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </Card>

          {/* Log Details Drawer */}
          <Drawer
            title="Log Details"
            width={640}
            placement="right"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
          >
            {selectedLog && (
              <div className="space-y-6">
                {/* Log Header */}
                <div className="flex items-center space-x-3">
                  {getLogIcon(selectedLog.type)}
                  <div>
                    <Title level={4} className="!mb-1">
                      {selectedLog.type.toUpperCase()} Log Entry
                    </Title>
                    <Text type="secondary">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </Text>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <Title level={5}>Message</Title>
                  <div className="bg-gray-50 p-4 rounded border">
                    <Text>{selectedLog.message}</Text>
                  </div>
                </div>

                {/* Source Information */}
                <div>
                  <Title level={5}>Source</Title>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <ProjectOutlined className="text-blue-500" />
                      <Text strong>Project:</Text>
                      <Text>{getProjectName(selectedLog.project_id)}</Text>
                    </div>
                    {selectedLog.crew_id && (
                      <div className="flex items-center space-x-2">
                        <TeamOutlined className="text-green-500" />
                        <Text strong>Crew:</Text>
                        <Text>{getCrewName(selectedLog.crew_id)}</Text>
                      </div>
                    )}
                    {selectedLog.agent_id && (
                      <div className="flex items-center space-x-2">
                        <RobotOutlined className="text-purple-500" />
                        <Text strong>Agent:</Text>
                        <Text>{getAgentName(selectedLog.agent_id)}</Text>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <Title level={5}>Metadata</Title>
                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Text strong>Log ID:</Text>
                        <br />
                        <Text className="font-mono">{selectedLog.id}</Text>
                      </div>
                      <div>
                        <Text strong>Type:</Text>
                        <br />
                        <Tag color={getLogColor(selectedLog.type)}>
                          {selectedLog.type.toUpperCase()}
                        </Tag>
                      </div>
                      <div>
                        <Text strong>Timestamp:</Text>
                        <br />
                        <Text className="font-mono">
                          {new Date(selectedLog.timestamp).toISOString()}
                        </Text>
                      </div>
                      <div>
                        <Text strong>Project ID:</Text>
                        <br />
                        <Text>{selectedLog.project_id}</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Drawer>
        </div>
      </div>
    </AppLayout>
  );
}