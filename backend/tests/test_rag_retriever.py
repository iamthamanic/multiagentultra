import pytest
import asyncio
import uuid
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import threading

from app.rag.retriever import HierarchicalRAG
from models.schemas import RAGLevel


class TestHierarchicalRAG:
    """Test suite for Hierarchical RAG system"""
    
    @pytest.fixture
    def mock_chroma_client(self):
        """Mock ChromaDB client"""
        mock_client = Mock()
        mock_collection = Mock()
        mock_client.get_or_create_collection.return_value = mock_collection
        return mock_client, mock_collection
    
    @pytest.fixture
    def mock_sentence_transformer(self):
        """Mock SentenceTransformer"""
        mock_transformer = Mock()
        # Mock embedding as list of floats
        mock_transformer.encode.return_value = [[0.1, 0.2, 0.3]]
        return mock_transformer
    
    @pytest.fixture
    def rag_retriever(self, mock_chroma_client, mock_sentence_transformer):
        """Create RAG retriever with mocked dependencies"""
        mock_client, mock_collection = mock_chroma_client
        
        with patch('app.rag.retriever.chromadb.PersistentClient', return_value=mock_client), \
             patch('app.rag.retriever.SentenceTransformer', return_value=mock_sentence_transformer):
            
            retriever = HierarchicalRAG()
            retriever.project_collection = mock_collection
            retriever.crew_collection = mock_collection
            retriever.agent_collection = mock_collection
            
            return retriever, mock_collection
    
    def test_initialization(self):
        """Test RAG system initialization"""
        with patch('app.rag.retriever.chromadb.PersistentClient') as mock_client_class, \
             patch('app.rag.retriever.SentenceTransformer') as mock_transformer_class:
            
            mock_client = Mock()
            mock_client_class.return_value = mock_client
            
            retriever = HierarchicalRAG()
            
            # Check that client and transformer are initialized
            assert retriever.chroma_client == mock_client
            assert hasattr(retriever, 'embedding_model')
            assert hasattr(retriever, '_lock')
            assert isinstance(retriever._lock, threading.Lock)
    
    @pytest.mark.asyncio
    async def test_add_knowledge_project_level(self, rag_retriever):
        """Test adding knowledge at project level"""
        retriever, mock_collection = rag_retriever
        
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_loop.return_value.run_in_executor = AsyncMock(return_value=[0.1, 0.2, 0.3])
            
            doc_id = await retriever.add_knowledge(
                level=RAGLevel.PROJECT,
                entity_id=1,
                content="Test project knowledge",
                metadata={"source": "test"}
            )
            
            # Verify document was added
            mock_collection.add.assert_called_once()
            call_args = mock_collection.add.call_args
            
            assert call_args[1]["documents"] == ["Test project knowledge"]
            assert call_args[1]["embeddings"] == [[0.1, 0.2, 0.3]]
            assert call_args[1]["metadatas"][0]["entity_id"] == 1
            assert call_args[1]["metadatas"][0]["level"] == "project"
            assert call_args[1]["metadatas"][0]["source"] == "test"
            assert "created_at" in call_args[1]["metadatas"][0]
            
            # Check doc_id format
            assert doc_id.startswith("project_1_")
            assert len(doc_id.split("_")) == 4  # level_entity_timestamp_uuid
    
    @pytest.mark.asyncio
    async def test_add_knowledge_thread_safety(self, rag_retriever):
        """Test thread safety of add_knowledge method"""
        retriever, mock_collection = rag_retriever
        
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_loop.return_value.run_in_executor = AsyncMock(return_value=[0.1, 0.2, 0.3])
            
            # Simulate concurrent calls
            tasks = []
            for i in range(5):
                task = retriever.add_knowledge(
                    level=RAGLevel.PROJECT,
                    entity_id=i,
                    content=f"Content {i}"
                )
                tasks.append(task)
            
            doc_ids = await asyncio.gather(*tasks)
            
            # All should succeed and have unique IDs
            assert len(doc_ids) == 5
            assert len(set(doc_ids)) == 5  # All unique
            
            # Verify all documents were added
            assert mock_collection.add.call_count == 5
    
    @pytest.mark.asyncio
    async def test_add_knowledge_duplicate_handling(self, rag_retriever):
        """Test handling of duplicate document IDs"""
        retriever, mock_collection = rag_retriever
        
        # Mock collection.add to raise exception on first call, succeed on second
        def side_effect(*args, **kwargs):
            if mock_collection.add.call_count == 1:
                raise Exception("Document already exists")
            return None
        
        mock_collection.add.side_effect = side_effect
        
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_loop.return_value.run_in_executor = AsyncMock(return_value=[0.1, 0.2, 0.3])
            
            doc_id = await retriever.add_knowledge(
                level=RAGLevel.PROJECT,
                entity_id=1,
                content="Test content"
            )
            
            # Should retry and succeed
            assert mock_collection.add.call_count == 2
            assert doc_id is not None
    
    def test_get_collection_by_level(self, rag_retriever):
        """Test collection selection by RAG level"""
        retriever, _ = rag_retriever
        
        # Test each level
        project_collection = retriever._get_collection_by_level(RAGLevel.PROJECT)
        crew_collection = retriever._get_collection_by_level(RAGLevel.CREW)
        agent_collection = retriever._get_collection_by_level(RAGLevel.AGENT)
        
        assert project_collection == retriever.project_collection
        assert crew_collection == retriever.crew_collection
        assert agent_collection == retriever.agent_collection
    
    @pytest.mark.asyncio
    async def test_get_project_context_with_query(self, rag_retriever):
        """Test project context retrieval with search query"""
        retriever, mock_collection = rag_retriever
        
        # Mock search results
        mock_collection.query.return_value = {
            'documents': [['Document 1', 'Document 2']],
            'metadatas': [[{'entity_id': 1}, {'entity_id': 1}]]
        }
        
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_loop.return_value.run_in_executor = AsyncMock(return_value=[0.1, 0.2, 0.3])
            
            context = await retriever.get_project_context(
                project_id=1, 
                query="test query", 
                top_k=2
            )
            
            # Verify query was called with correct parameters
            mock_collection.query.assert_called_once()
            call_args = mock_collection.query.call_args[1]
            
            assert call_args['query_embeddings'] == [[0.1, 0.2, 0.3]]
            assert call_args['n_results'] == 2
            assert call_args['where'] == {'entity_id': 1}
            
            # Verify context is returned
            assert "Document 1" in context
            assert "Document 2" in context
    
    @pytest.mark.asyncio
    async def test_get_project_context_without_query(self, rag_retriever):
        """Test project context retrieval without search query"""
        retriever, mock_collection = rag_retriever
        
        # Mock get results
        mock_collection.get.return_value = {
            'documents': ['All project documents', 'More project content'],
            'metadatas': [{'entity_id': 1}, {'entity_id': 1}]
        }
        
        context = await retriever.get_project_context(project_id=1)
        
        # Verify get was called instead of query
        mock_collection.get.assert_called_once_with(
            where={'entity_id': 1},
            limit=5
        )
        mock_collection.query.assert_not_called()
        
        assert "All project documents" in context
        assert "More project content" in context
    
    @pytest.mark.asyncio
    async def test_get_crew_context(self, rag_retriever):
        """Test crew context retrieval"""
        retriever, mock_collection = rag_retriever
        
        mock_collection.get.return_value = {
            'documents': ['Crew document 1', 'Crew document 2']
        }
        
        context = await retriever.get_crew_context(crew_id=1)
        
        mock_collection.get.assert_called_once_with(
            where={'entity_id': 1},
            limit=5
        )
        
        assert "Crew document 1" in context
        assert "Crew document 2" in context
    
    @pytest.mark.asyncio
    async def test_get_agent_context(self, rag_retriever):
        """Test agent context retrieval"""
        retriever, mock_collection = rag_retriever
        
        mock_collection.get.return_value = {
            'documents': ['Agent document 1']
        }
        
        context = await retriever.get_agent_context(agent_id=1)
        
        mock_collection.get.assert_called_once_with(
            where={'entity_id': 1},
            limit=5
        )
        
        assert "Agent document 1" in context
    
    @pytest.mark.asyncio
    async def test_search_knowledge(self, rag_retriever):
        """Test knowledge search functionality"""
        retriever, mock_collection = rag_retriever
        
        mock_collection.query.return_value = {
            'documents': [['Result 1', 'Result 2']],
            'metadatas': [[{'level': 'project', 'entity_id': 1}, {'level': 'crew', 'entity_id': 2}]],
            'distances': [[0.1, 0.3]]
        }
        
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_loop.return_value.run_in_executor = AsyncMock(return_value=[0.1, 0.2, 0.3])
            
            results = await retriever.search_knowledge(
                query="test search",
                level=RAGLevel.PROJECT,
                entity_id=1,
                top_k=2
            )
            
            mock_collection.query.assert_called_once()
            call_args = mock_collection.query.call_args[1]
            
            assert call_args['query_embeddings'] == [[0.1, 0.2, 0.3]]
            assert call_args['n_results'] == 2
            assert call_args['where'] == {'level': 'project', 'entity_id': 1}
            
            assert len(results) == 2
            assert results[0]['content'] == 'Result 1'
            assert results[0]['metadata']['level'] == 'project'
            assert results[0]['distance'] == 0.1
    
    @pytest.mark.asyncio
    async def test_error_handling_in_add_knowledge(self, rag_retriever):
        """Test error handling in add_knowledge method"""
        retriever, mock_collection = rag_retriever
        
        # Mock unrecoverable error
        mock_collection.add.side_effect = Exception("Database connection failed")
        
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_loop.return_value.run_in_executor = AsyncMock(return_value=[0.1, 0.2, 0.3])
            
            with pytest.raises(Exception, match="Database connection failed"):
                await retriever.add_knowledge(
                    level=RAGLevel.PROJECT,
                    entity_id=1,
                    content="Test content"
                )
    
    def test_concurrent_access_thread_safety(self, rag_retriever):
        """Test thread safety with concurrent access"""
        retriever, mock_collection = rag_retriever
        
        # Mock successful operations
        mock_collection.add.return_value = None
        
        results = []
        errors = []
        
        def add_knowledge_sync(i):
            try:
                # Simulate sync version for thread testing
                with retriever._lock:
                    mock_collection.add(
                        documents=[f"Content {i}"],
                        embeddings=[[0.1, 0.2, 0.3]],
                        metadatas=[{"entity_id": i}],
                        ids=[f"test_{i}"]
                    )
                results.append(f"success_{i}")
            except Exception as e:
                errors.append(e)
        
        # Create multiple threads
        threads = []
        for i in range(10):
            thread = threading.Thread(target=add_knowledge_sync, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All operations should succeed
        assert len(results) == 10
        assert len(errors) == 0
        assert mock_collection.add.call_count == 10


class TestRAGIntegration:
    """Integration tests for RAG system"""
    
    @pytest.mark.asyncio
    async def test_full_knowledge_workflow(self):
        """Test complete knowledge management workflow"""
        with patch('app.rag.retriever.chromadb.PersistentClient') as mock_client_class, \
             patch('app.rag.retriever.SentenceTransformer') as mock_transformer_class:
            
            # Setup mocks
            mock_client = Mock()
            mock_collection = Mock()
            mock_client.get_or_create_collection.return_value = mock_collection
            mock_client_class.return_value = mock_client
            
            mock_transformer = Mock()
            mock_transformer.encode.return_value = [[0.1, 0.2, 0.3]]
            mock_transformer_class.return_value = mock_transformer
            
            retriever = HierarchicalRAG()
            
            with patch('asyncio.get_event_loop') as mock_loop:
                mock_loop.return_value.run_in_executor = AsyncMock(return_value=[0.1, 0.2, 0.3])
                
                # Add knowledge
                doc_id = await retriever.add_knowledge(
                    level=RAGLevel.PROJECT,
                    entity_id=1,
                    content="Test knowledge"
                )
                
                assert doc_id is not None
                mock_collection.add.assert_called_once()
                
                # Mock search results
                mock_collection.query.return_value = {
                    'documents': [['Test knowledge']],
                    'metadatas': [[{'entity_id': 1, 'level': 'project'}]],
                    'distances': [[0.1]]
                }
                
                # Search knowledge
                results = await retriever.search_knowledge(
                    query="test",
                    level=RAGLevel.PROJECT,
                    entity_id=1
                )
                
                assert len(results) == 1
                assert results[0]['content'] == 'Test knowledge'