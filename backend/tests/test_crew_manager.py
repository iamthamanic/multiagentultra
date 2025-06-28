import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.orm import Session

from app.crew.manager import CrewAIManager, CrewActivity
from models.schemas import Crew as CrewModel, Agent as AgentModel, Project as ProjectModel
from crewai import Crew


class TestCrewAIManager:
    """Test suite for CrewAI Manager"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def crew_manager(self, mock_db):
        """Create CrewAI manager instance"""
        with patch('app.crew.manager.HierarchicalRAG'):
            manager = CrewAIManager(mock_db, max_active_crews=5, cleanup_interval=60)
            return manager
    
    @pytest.fixture
    def sample_crew_model(self):
        """Sample crew model for testing"""
        crew = Mock(spec=CrewModel)
        crew.id = 1
        crew.name = "Test Crew"
        crew.project_id = 1
        crew.agents = []
        crew.tasks = []
        crew.status = "active"
        return crew
    
    def test_crew_activity_initialization(self):
        """Test CrewActivity initialization"""
        mock_crew = Mock(spec=Crew)
        activity = CrewActivity(mock_crew)
        
        assert activity.crew == mock_crew
        assert activity.task_count == 0
        assert hasattr(activity, 'last_activity')
        assert hasattr(activity, 'created_at')
    
    def test_crew_activity_update(self):
        """Test CrewActivity update method"""
        mock_crew = Mock(spec=Crew)
        activity = CrewActivity(mock_crew)
        
        old_time = activity.last_activity
        activity.update_activity()
        
        assert activity.last_activity >= old_time
    
    def test_crew_activity_is_inactive(self):
        """Test CrewActivity inactivity check"""
        mock_crew = Mock(spec=Crew)
        activity = CrewActivity(mock_crew)
        
        # Fresh activity should not be inactive
        assert not activity.is_inactive(timeout_seconds=3600)
        
        # Manually set old timestamp
        activity.last_activity = 0
        assert activity.is_inactive(timeout_seconds=3600)
    
    def test_manager_initialization(self, crew_manager):
        """Test CrewAI Manager initialization"""
        assert crew_manager.max_active_crews == 5
        assert crew_manager.cleanup_interval == 60
        assert isinstance(crew_manager.active_crews, dict)
        assert len(crew_manager.active_crews) == 0
    
    @pytest.mark.asyncio
    async def test_create_crew_from_db_not_found(self, crew_manager, mock_db):
        """Test crew creation with non-existent crew ID"""
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="Crew with ID 999 not found"):
            await crew_manager.create_crew_from_db(999)
    
    @pytest.mark.asyncio
    async def test_create_crew_from_db_success(self, crew_manager, mock_db, sample_crew_model):
        """Test successful crew creation from database"""
        # Mock database query
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = sample_crew_model
        
        # Mock RAG context methods
        crew_manager.rag_retriever.get_project_context = AsyncMock(return_value="Project context")
        crew_manager.rag_retriever.get_crew_context = AsyncMock(return_value="Crew context")
        
        # Mock crew creation
        with patch('app.crew.manager.Crew') as mock_crew_class:
            mock_crew_instance = Mock()
            mock_crew_class.return_value = mock_crew_instance
            
            result = await crew_manager.create_crew_from_db(1)
            
            assert result == mock_crew_instance
            crew_manager.rag_retriever.get_project_context.assert_called_once_with(1)
            crew_manager.rag_retriever.get_crew_context.assert_called_once_with(1)
    
    @pytest.mark.asyncio
    async def test_get_crew_status_not_found(self, crew_manager, mock_db):
        """Test get crew status with non-existent crew"""
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = None
        
        result = await crew_manager.get_crew_status(999)
        
        assert result == {"error": "Crew not found"}
    
    @pytest.mark.asyncio
    async def test_get_crew_status_success(self, crew_manager, mock_db, sample_crew_model):
        """Test successful crew status retrieval"""
        # Add some mock agents and tasks
        sample_crew_model.agents = [Mock(), Mock()]
        sample_crew_model.tasks = [
            Mock(status="in_progress"),
            Mock(status="completed"),
            Mock(status="in_progress")
        ]
        
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = sample_crew_model
        
        result = await crew_manager.get_crew_status(1)
        
        expected = {
            "crew_id": 1,
            "name": "Test Crew",
            "status": "active",
            "agents_count": 2,
            "active_tasks": 2,  # Two tasks with in_progress status
            "is_running": False  # Not in active_crews
        }
        
        assert result == expected
    
    @pytest.mark.asyncio
    async def test_cleanup_inactive_crews(self, crew_manager):
        """Test cleanup of inactive crews"""
        # Create mock inactive crew
        mock_crew = Mock(spec=Crew)
        mock_crew.cleanup = Mock()
        
        inactive_activity = CrewActivity(mock_crew)
        inactive_activity.last_activity = 0  # Very old timestamp
        
        crew_manager.active_crews[1] = inactive_activity
        
        await crew_manager.cleanup_inactive_crews()
        
        # Should be cleaned up
        assert 1 not in crew_manager.active_crews
        mock_crew.cleanup.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_cleanup_with_async_cleanup_method(self, crew_manager):
        """Test cleanup with async crew cleanup method"""
        # Create mock crew with async cleanup
        mock_crew = Mock(spec=Crew)
        mock_crew.cleanup = AsyncMock()
        
        inactive_activity = CrewActivity(mock_crew)
        inactive_activity.last_activity = 0
        
        crew_manager.active_crews[1] = inactive_activity
        
        await crew_manager.cleanup_inactive_crews()
        
        assert 1 not in crew_manager.active_crews
        mock_crew.cleanup.assert_called_once()
    
    def test_ensure_capacity(self, crew_manager):
        """Test capacity management"""
        # Fill up beyond capacity
        for i in range(6):  # max_active_crews = 5
            mock_crew = Mock(spec=Crew)
            mock_crew.cleanup = Mock()
            activity = CrewActivity(mock_crew)
            if i == 0:
                activity.last_activity = 0  # Oldest
            crew_manager.active_crews[i] = activity
        
        crew_manager._ensure_capacity()
        
        # Should remove oldest crew (id=0)
        assert 0 not in crew_manager.active_crews
        assert len(crew_manager.active_crews) == 5
    
    def test_get_active_crews_info(self, crew_manager):
        """Test getting active crews information"""
        mock_crew = Mock(spec=Crew)
        activity = CrewActivity(mock_crew)
        activity.task_count = 5
        
        crew_manager.active_crews[1] = activity
        
        info = crew_manager.get_active_crews_info()
        
        assert 1 in info
        assert info[1]["task_count"] == 5
        assert "last_activity" in info[1]
        assert "created_at" in info[1]
        assert "is_inactive" in info[1]
    
    @pytest.mark.asyncio
    async def test_shutdown_cleanup(self, crew_manager):
        """Test proper shutdown and cleanup"""
        # Add some active crews
        mock_crew1 = Mock(spec=Crew)
        mock_crew1.cleanup = Mock()
        crew_manager.active_crews[1] = CrewActivity(mock_crew1)
        
        mock_crew2 = Mock(spec=Crew)
        mock_crew2.cleanup = Mock()
        crew_manager.active_crews[2] = CrewActivity(mock_crew2)
        
        # Mock cleanup task
        crew_manager._cleanup_task = Mock()
        crew_manager._cleanup_task.done.return_value = False
        crew_manager._cleanup_task.cancel = Mock()
        
        await crew_manager.shutdown()
        
        # All crews should be cleaned up
        assert len(crew_manager.active_crews) == 0
        mock_crew1.cleanup.assert_called_once()
        mock_crew2.cleanup.assert_called_once()
        crew_manager._cleanup_task.cancel.assert_called_once()


class TestCrewManagerIntegration:
    """Integration tests for CrewAI Manager"""
    
    @pytest.mark.asyncio
    async def test_full_workflow(self):
        """Test complete workflow from creation to cleanup"""
        with patch('app.crew.manager.HierarchicalRAG') as mock_rag:
            mock_db = Mock(spec=Session)
            manager = CrewAIManager(mock_db, max_active_crews=2, cleanup_interval=1)
            
            # Mock successful crew creation
            crew_model = Mock(spec=CrewModel)
            crew_model.id = 1
            crew_model.project_id = 1
            crew_model.agents = []
            
            mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = crew_model
            
            mock_rag_instance = mock_rag.return_value
            mock_rag_instance.get_project_context = AsyncMock(return_value="context")
            mock_rag_instance.get_crew_context = AsyncMock(return_value="context")
            
            with patch('app.crew.manager.Crew') as mock_crew_class:
                mock_crew = Mock()
                mock_crew_class.return_value = mock_crew
                
                # Create crew
                result = await manager.create_crew_from_db(1)
                assert result == mock_crew
                
                # Test status
                status = await manager.get_crew_status(1)
                assert status["crew_id"] == 1
                
                # Cleanup
                await manager.shutdown()