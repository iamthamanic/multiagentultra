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
  Upload,
  Tree,
  Tabs,
  Progress,
  message,
  Divider
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import {
  PlusOutlined,
  SearchOutlined,
  DatabaseOutlined,
  FileOutlined,
  FolderOutlined,
  UploadOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  BranchesOutlined,
  NodeIndexOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
  LinkOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Dragger } = Upload;

interface KnowledgeItem {
  id: string;
  name: string;
  type: 'document' | 'url' | 'text' | 'folder';
  parentId?: string;
  size?: number;
  format?: string;
  uploadDate: string;
  status: 'processing' | 'indexed' | 'failed';
  vectorCount?: number;
  embedding_model?: string;
  content_preview?: string;
}

interface VectorIndex {
  id: string;
  name: string;
  description: string;
  documents: number;
  vectors: number;
  dimensions: number;
  last_updated: string;
  status: 'active' | 'rebuilding' | 'error';
}

export default function KnowledgePage() {
  const [selectedTab, setSelectedTab] = useState('documents');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [vectorIndices, setVectorIndices] = useState<VectorIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Load knowledge data
  useEffect(() => {
    loadKnowledgeData();
    loadVectorIndices();
  }, []);

  const loadKnowledgeData = async () => {
    try {
      // Try to fetch from API
      const response = await fetch('http://localhost:8888/api/v1/knowledge');
      if (response.ok) {
        const data = await response.json();
        setKnowledgeItems(data);
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      // Fallback demo data
      const demoItems: KnowledgeItem[] = [
        {
          id: '1',
          name: 'Company Guidelines',
          type: 'folder',
          uploadDate: '2024-01-15T10:00:00Z',
          status: 'indexed'
        },
        {
          id: '2',
          name: 'Brand Guidelines.pdf',
          type: 'document',
          parentId: '1',
          size: 2548000,
          format: 'pdf',
          uploadDate: '2024-01-15T10:30:00Z',
          status: 'indexed',
          vectorCount: 245,
          embedding_model: 'text-embedding-ada-002',
          content_preview: 'This document outlines the brand guidelines for our company...'
        },
        {
          id: '3',
          name: 'Writing Style Guide.docx',
          type: 'document',
          parentId: '1',
          size: 1024000,
          format: 'docx',
          uploadDate: '2024-01-16T14:20:00Z',
          status: 'indexed',
          vectorCount: 156,
          embedding_model: 'text-embedding-ada-002'
        },
        {
          id: '4',
          name: 'API Documentation',
          type: 'url',
          uploadDate: '2024-01-18T09:15:00Z',
          status: 'indexed',
          vectorCount: 892,
          embedding_model: 'text-embedding-ada-002',
          content_preview: 'https://docs.company.com/api'
        },
        {
          id: '5',
          name: 'Product Knowledge Base',
          type: 'text',
          uploadDate: '2024-01-20T11:45:00Z',
          status: 'processing',
          content_preview: 'Comprehensive product information and FAQs...'
        }
      ];
      setKnowledgeItems(demoItems);
    }
  };

  const loadVectorIndices = async () => {
    try {
      const response = await fetch('http://localhost:8888/api/v1/vector-indices');
      if (response.ok) {
        const data = await response.json();
        setVectorIndices(data);
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      // Fallback demo data
      const demoIndices: VectorIndex[] = [
        {
          id: 'main-index',
          name: 'Main Knowledge Index',
          description: 'Primary knowledge base for all company documents',
          documents: 156,
          vectors: 15420,
          dimensions: 1536,
          last_updated: '2024-01-21T15:30:00Z',
          status: 'active'
        },
        {
          id: 'product-index',
          name: 'Product Information',
          description: 'Product-specific knowledge and documentation',
          documents: 89,
          vectors: 8934,
          dimensions: 1536,
          last_updated: '2024-01-20T12:15:00Z',
          status: 'active'
        },
        {
          id: 'support-index',
          name: 'Customer Support KB',
          description: 'Customer support articles and FAQs',
          documents: 234,
          vectors: 12456,
          dimensions: 1536,
          last_updated: '2024-01-21T14:20:00Z',
          status: 'rebuilding'
        }
      ];
      setVectorIndices(demoIndices);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'indexed': case 'active': return 'success';
      case 'processing': case 'rebuilding': return 'processing';
      case 'failed': case 'error': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string, format?: string) => {
    if (type === 'folder') return <FolderOutlined />;
    if (type === 'url') return <LinkOutlined />;
    if (format === 'pdf') return <FilePdfOutlined />;
    if (format === 'docx' || format === 'doc') return <FileWordOutlined />;
    if (format?.startsWith('image')) return <FileImageOutlined />;
    return <FileTextOutlined />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const buildTreeData = (items: KnowledgeItem[]): DataNode[] => {
    const itemMap = new Map<string, DataNode>();
    const roots: DataNode[] = [];

    // Create nodes
    items.forEach(item => {
      const node: DataNode = {
        key: item.id,
        title: (
          <div className="flex items-center space-x-2">
            {getTypeIcon(item.type, item.format)}
            <span>{item.name}</span>
            <Tag color={getStatusColor(item.status)}>
              {item.status}
            </Tag>
          </div>
        ),
        children: []
      };
      itemMap.set(item.id, node);
    });

    // Build hierarchy
    items.forEach(item => {
      const node = itemMap.get(item.id)!;
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!;
        parent.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const documentsColumns: ColumnsType<KnowledgeItem> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <div className="flex items-center space-x-2">
          {getTypeIcon(record.type, record.format)}
          <div>
            <Text strong>{text}</Text>
            {record.content_preview && (
              <>
                <br />
                <Text type="secondary" className="text-xs">
                  {record.content_preview.substring(0, 100)}...
                </Text>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      filters: [
        { text: 'Document', value: 'document' },
        { text: 'URL', value: 'url' },
        { text: 'Text', value: 'text' },
        { text: 'Folder', value: 'folder' },
      ],
      onFilter: (value, record) => record.type === value,
      render: (type, record) => (
        <Tag color="blue">
          {type === 'document' && record.format ? record.format.toUpperCase() : type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Indexed', value: 'indexed' },
        { text: 'Processing', value: 'processing' },
        { text: 'Failed', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size) => formatFileSize(size),
    },
    {
      title: 'Vectors',
      dataIndex: 'vectorCount',
      key: 'vectorCount',
      width: 100,
      render: (count) => count ? count.toLocaleString() : '-',
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      width: 120,
      sorter: (a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime(),
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown menu={{
          items: [
            { key: 'view', icon: <EyeOutlined />, label: 'View' },
            { key: 'download', icon: <DownloadOutlined />, label: 'Download' },
            { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
            { type: 'divider' },
            { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true },
          ]
        }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const indicesColumns: ColumnsType<VectorIndex> = [
    {
      title: 'Index Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" className="text-xs">
            {record.description}
          </Text>
        </div>
      ),
    },
    {
      title: 'Documents',
      dataIndex: 'documents',
      key: 'documents',
      width: 120,
      render: (count) => count.toLocaleString(),
    },
    {
      title: 'Vectors',
      dataIndex: 'vectors',
      key: 'vectors',
      width: 120,
      render: (count) => count.toLocaleString(),
    },
    {
      title: 'Dimensions',
      dataIndex: 'dimensions',
      key: 'dimensions',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'last_updated',
      key: 'last_updated',
      width: 150,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: () => (
        <Dropdown menu={{
          items: [
            { key: 'rebuild', icon: <BranchesOutlined />, label: 'Rebuild' },
            { key: 'export', icon: <DownloadOutlined />, label: 'Export' },
            { key: 'settings', icon: <EditOutlined />, label: 'Settings' },
          ]
        }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = searchText === '' || 
      item.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    totalItems: knowledgeItems.length,
    indexed: knowledgeItems.filter(i => i.status === 'indexed').length,
    processing: knowledgeItems.filter(i => i.status === 'processing').length,
    totalVectors: knowledgeItems.reduce((sum, item) => sum + (item.vectorCount || 0), 0),
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <Title level={2} className="!mb-2 flex items-center space-x-2">
                  <DatabaseOutlined />
                  <span>Knowledge Base</span>
                </Title>
                <Text type="secondary">
                  Manage documents and vector indices for hierarchical RAG system
                </Text>
              </div>
              <Button 
                type="primary" 
                icon={<UploadOutlined />}
                size="large"
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload Documents
              </Button>
            </div>
          </div>

          {/* Stats */}
          <Row gutter={16} className="mb-6">
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Total Items" 
                  value={stats.totalItems}
                  prefix={<FileOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Indexed" 
                  value={stats.indexed}
                  prefix={<NodeIndexOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Processing" 
                  value={stats.processing}
                  prefix={<BranchesOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic 
                  title="Vector Count" 
                  value={stats.totalVectors}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Main Content */}
          <Card>
            <Tabs 
              activeKey={selectedTab} 
              onChange={setSelectedTab}
              items={[
                {
                  key: 'documents',
                  label: 'Documents',
                  children: (
                    <>
                      {/* Filters */}
                      <Row gutter={16} align="middle" className="mb-4">
                        <Col xs={24} sm={8}>
                          <Search
                            placeholder="Search documents..."
                            allowClear
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                          />
                        </Col>
                        <Col xs={24} sm={4}>
                          <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: '100%' }}
                          >
                            <Option value="all">All Status</Option>
                            <Option value="indexed">Indexed</Option>
                            <Option value="processing">Processing</Option>
                            <Option value="failed">Failed</Option>
                          </Select>
                        </Col>
                        <Col xs={24} sm={4}>
                          <Select
                            value={typeFilter}
                            onChange={setTypeFilter}
                            style={{ width: '100%' }}
                          >
                            <Option value="all">All Types</Option>
                            <Option value="document">Documents</Option>
                            <Option value="url">URLs</Option>
                            <Option value="text">Text</Option>
                            <Option value="folder">Folders</Option>
                          </Select>
                        </Col>
                        <Col xs={24} sm={8}>
                          <div className="flex justify-end">
                            <Text type="secondary">
                              {filteredItems.length} items
                            </Text>
                          </div>
                        </Col>
                      </Row>

                      <Table
                        columns={documentsColumns}
                        dataSource={filteredItems}
                        rowKey="id"
                        pagination={{
                          total: filteredItems.length,
                          pageSize: 10,
                          showSizeChanger: true,
                          showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} documents`,
                        }}
                        rowSelection={{
                          selectedRowKeys: selectedItems,
                          onChange: (selectedRowKeys) => setSelectedItems(selectedRowKeys as string[]),
                        }}
                      />
                    </>
                  )
                },
                {
                  key: 'tree',
                  label: 'Tree View',
                  children: (
                    <Tree
                      treeData={buildTreeData(knowledgeItems)}
                      defaultExpandAll
                      showIcon
                      className="knowledge-tree"
                    />
                  )
                },
                {
                  key: 'indices',
                  label: 'Vector Indices',
                  children: (
                    <Table
                      columns={indicesColumns}
                      dataSource={vectorIndices}
                      rowKey="id"
                      pagination={false}
                    />
                  )
                }
              ]}
            />
          </Card>

          {/* Upload Modal */}
          <Modal
            title="Upload Documents"
            open={isUploadModalOpen}
            onCancel={() => setIsUploadModalOpen(false)}
            footer={null}
            width={600}
          >
            <div className="space-y-4">
              <Dragger
                name="files"
                multiple
                action="/api/v1/knowledge/upload"
                onChange={(info) => {
                  const { status } = info.file;
                  if (status === 'done') {
                    message.success(`${info.file.name} uploaded successfully.`);
                  } else if (status === 'error') {
                    message.error(`${info.file.name} upload failed.`);
                  }
                }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag files to this area to upload
                </p>
                <p className="ant-upload-hint">
                  Support for single or bulk upload. Supported formats: PDF, DOCX, TXT, MD
                </p>
              </Dragger>
              
              <Divider>Or</Divider>
              
              <Input.TextArea
                placeholder="Paste text content directly..."
                rows={6}
              />
              
              <Input
                placeholder="Or enter a URL to scrape..."
                prefix={<LinkOutlined />}
              />
            </div>
          </Modal>
        </div>
      </div>
    </AppLayout>
  );
}