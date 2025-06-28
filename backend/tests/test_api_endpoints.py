import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from main import app
from models.schemas import Project, Crew, Agent, User
from app.core.database import get_db


class TestProjectEndpoints:
    """Test suite for Project API endpoints"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def client(self, mock_db):
        """Test client with mocked database"""
        def override_get_db():
            return mock_db
        
        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()
    
    @pytest.fixture
    def sample_project(self):
        """Sample project for testing"""
        project = Mock(spec=Project)
        project.id = 1
        project.name = "Test Project"
        project.description = "Test Description"
        project.status = "active"
        project.crews = []
        return project
    
    def test_get_projects_empty(self, client, mock_db):
        """Test getting projects when none exist"""
        mock_db.query.return_value.offset.return_value.limit.return_value.all.return_value = []
        mock_db.query.return_value.count.return_value = 0
        
        response = client.get("/api/v1/projects")
        
        assert response.status_code == 200
        data = response.json()
        assert data["projects"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["size"] == 10
    
    def test_get_projects_success(self, client, mock_db, sample_project):
        """Test successful project retrieval"""
        mock_db.query.return_value.offset.return_value.limit.return_value.all.return_value = [sample_project]
        mock_db.query.return_value.count.return_value = 1
        
        response = client.get("/api/v1/projects")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["projects"]) == 1
        assert data["total"] == 1
    
    def test_get_project_by_id_not_found(self, client, mock_db):
        """Test getting non-existent project"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = client.get("/api/v1/projects/999")
        
        assert response.status_code == 404
        assert "Project not found" in response.json()["detail"]
    
    def test_get_project_by_id_success(self, client, mock_db, sample_project):
        """Test successful project retrieval by ID"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_project
        
        response = client.get("/api/v1/projects/1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["name"] == "Test Project"
    
    def test_create_project_success(self, client, mock_db):
        """Test successful project creation"""
        # Mock database operations
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Mock created project
        created_project = Mock(spec=Project)
        created_project.id = 1
        created_project.name = "New Project"
        created_project.description = "New Description"
        created_project.status = "active"
        
        # Mock refresh to set the created project
        def mock_refresh(obj):
            obj.id = 1
            obj.name = "New Project"
            obj.description = "New Description"
            obj.status = "active"
        
        mock_db.refresh.side_effect = mock_refresh
        
        project_data = {
            "name": "New Project",
            "description": "New Description"
        }
        
        response = client.post("/api/v1/projects", json=project_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Project"
        assert data["description"] == "New Description"
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
    
    def test_create_project_validation_error(self, client, mock_db):
        """Test project creation with validation errors"""
        project_data = {
            "name": "",  # Empty name should fail validation
            "description": "Valid description"
        }
        
        response = client.post("/api/v1/projects", json=project_data)
        
        assert response.status_code == 422
    
    def test_update_project_not_found(self, client, mock_db):
        """Test updating non-existent project"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        update_data = {"name": "Updated Name"}
        response = client.put("/api/v1/projects/999", json=update_data)
        
        assert response.status_code == 404
    
    def test_update_project_success(self, client, mock_db, sample_project):
        """Test successful project update"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_project
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        update_data = {"name": "Updated Project"}
        response = client.put("/api/v1/projects/1", json=update_data)
        
        assert response.status_code == 200
        assert sample_project.name == "Updated Project"
        mock_db.commit.assert_called_once()
    
    def test_delete_project_not_found(self, client, mock_db):
        """Test deleting non-existent project"""
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = None
        
        response = client.delete("/api/v1/projects/999")
        
        assert response.status_code == 404
    
    def test_delete_project_success(self, client, mock_db, sample_project):
        """Test successful project deletion"""
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = sample_project
        mock_db.delete = Mock()
        mock_db.commit = Mock()
        
        response = client.delete("/api/v1/projects/1")
        
        assert response.status_code == 200
        assert "successfully deleted" in response.json()["message"]
        mock_db.delete.assert_called_once_with(sample_project)
        mock_db.commit.assert_called_once()


class TestCrewEndpoints:
    """Test suite for Crew API endpoints"""
    
    @pytest.fixture
    def mock_db(self):
        return Mock(spec=Session)
    
    @pytest.fixture
    def client(self, mock_db):
        def override_get_db():
            return mock_db
        
        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()
    
    @pytest.fixture
    def sample_crew(self):
        crew = Mock(spec=Crew)
        crew.id = 1
        crew.project_id = 1
        crew.name = "Test Crew"
        crew.description = "Test Crew Description"
        crew.status = "active"
        crew.agents = []
        crew.tasks = []
        return crew
    
    def test_get_crews_success(self, client, mock_db, sample_crew):
        """Test successful crew retrieval"""
        mock_db.query.return_value.offset.return_value.limit.return_value.all.return_value = [sample_crew]
        mock_db.query.return_value.count.return_value = 1
        
        response = client.get("/api/v1/crews")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["crews"]) == 1
        assert data["total"] == 1
    
    def test_create_crew_success(self, client, mock_db):
        """Test successful crew creation"""
        # Mock project exists
        mock_project = Mock(spec=Project)
        mock_project.id = 1
        mock_db.query.return_value.filter.return_value.first.return_value = mock_project
        
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        def mock_refresh(obj):
            obj.id = 1
            obj.project_id = 1
            obj.name = "New Crew"
            obj.description = "New Description"
            obj.status = "active"
        
        mock_db.refresh.side_effect = mock_refresh
        
        crew_data = {
            "project_id": 1,
            "name": "New Crew",
            "description": "New Description"
        }
        
        response = client.post("/api/v1/crews", json=crew_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Crew"
        assert data["project_id"] == 1
    
    def test_create_crew_invalid_project(self, client, mock_db):
        """Test crew creation with invalid project ID"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        crew_data = {
            "project_id": 999,
            "name": "New Crew",
            "description": "New Description"
        }
        
        response = client.post("/api/v1/crews", json=crew_data)
        
        assert response.status_code == 404
        assert "Project not found" in response.json()["detail"]


class TestAgentEndpoints:
    """Test suite for Agent API endpoints"""
    
    @pytest.fixture
    def mock_db(self):
        return Mock(spec=Session)
    
    @pytest.fixture
    def client(self, mock_db):
        def override_get_db():
            return mock_db
        
        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()
    
    @pytest.fixture
    def sample_agent(self):
        agent = Mock(spec=Agent)
        agent.id = 1
        agent.crew_id = 1
        agent.name = "Test Agent"
        agent.role = "Researcher"
        agent.goal = "Research test data"
        agent.backstory = "Expert researcher"
        return agent
    
    def test_get_agents_success(self, client, mock_db, sample_agent):
        """Test successful agent retrieval"""
        mock_db.query.return_value.offset.return_value.limit.return_value.all.return_value = [sample_agent]
        mock_db.query.return_value.count.return_value = 1
        
        response = client.get("/api/v1/agents")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["agents"]) == 1
        assert data["total"] == 1
    
    def test_create_agent_success(self, client, mock_db):
        """Test successful agent creation"""
        # Mock crew exists
        mock_crew = Mock(spec=Crew)
        mock_crew.id = 1
        mock_db.query.return_value.filter.return_value.first.return_value = mock_crew
        
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        def mock_refresh(obj):
            obj.id = 1
            obj.crew_id = 1
            obj.name = "New Agent"
            obj.role = "Researcher"
            obj.goal = "Research"
            obj.backstory = "Expert"
        
        mock_db.refresh.side_effect = mock_refresh
        
        agent_data = {
            "crew_id": 1,
            "name": "New Agent",
            "role": "Researcher",
            "goal": "Research",
            "backstory": "Expert"
        }
        
        response = client.post("/api/v1/agents", json=agent_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Agent"
        assert data["role"] == "Researcher"


class TestHealthEndpoints:
    """Test suite for health check endpoints"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        client = TestClient(app)
        response = client.get("/api/v1/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "MultiAgent Ultra API"
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        client = TestClient(app)
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "MultiAgent Ultra API is running" in data["message"]


class TestErrorHandling:
    """Test suite for error handling"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_404_endpoint(self, client):
        """Test non-existent endpoint"""
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404
    
    def test_invalid_json(self, client):
        """Test invalid JSON in request body"""
        response = client.post(
            "/api/v1/projects",
            data="invalid json",
            headers={"content-type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_validation_error(self, client):
        """Test request validation errors"""
        # Missing required fields
        response = client.post("/api/v1/projects", json={})
        assert response.status_code == 422
        
        error_data = response.json()
        assert "detail" in error_data


class TestPagination:
    """Test suite for pagination functionality"""
    
    @pytest.fixture
    def mock_db(self):
        return Mock(spec=Session)
    
    @pytest.fixture
    def client(self, mock_db):
        def override_get_db():
            return mock_db
        
        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()
    
    def test_pagination_parameters(self, client, mock_db):
        """Test pagination with custom parameters"""
        mock_db.query.return_value.offset.return_value.limit.return_value.all.return_value = []
        mock_db.query.return_value.count.return_value = 0
        
        response = client.get("/api/v1/projects?page=2&size=5")
        
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 2
        assert data["size"] == 5
        
        # Verify offset and limit were called correctly
        mock_db.query.return_value.offset.assert_called_with(5)  # (page-1) * size
        mock_db.query.return_value.offset.return_value.limit.assert_called_with(5)
    
    def test_pagination_bounds(self, client, mock_db):
        """Test pagination boundary conditions"""
        mock_db.query.return_value.offset.return_value.limit.return_value.all.return_value = []
        mock_db.query.return_value.count.return_value = 0
        
        # Test maximum page size
        response = client.get("/api/v1/projects?size=1000")
        assert response.status_code == 200
        data = response.json()
        assert data["size"] == 100  # Should be capped at max
        
        # Test minimum page size
        response = client.get("/api/v1/projects?size=0")
        assert response.status_code == 200
        data = response.json()
        assert data["size"] == 1  # Should be minimum 1