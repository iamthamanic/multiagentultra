import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from main import app

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_projects.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    with TestClient(app) as c:
        yield c

def test_create_project(client):
    """Test creating a new project"""
    project_data = {
        "name": "Test Project",
        "description": "A test project for unit testing"
    }
    
    response = client.post("/api/v1/projects/", json=project_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == project_data["name"]
    assert data["description"] == project_data["description"]
    assert data["status"] == "draft"  # Default status
    assert "id" in data
    assert "created_at" in data

def test_create_project_invalid_data(client):
    """Test creating project with invalid data"""
    # Empty name
    response = client.post("/api/v1/projects/", json={"name": "", "description": "Test"})
    assert response.status_code == 422
    
    # Name too long
    response = client.post("/api/v1/projects/", json={
        "name": "x" * 101,  # Exceeds max length
        "description": "Test"
    })
    assert response.status_code == 422
    
    # Missing required name field
    response = client.post("/api/v1/projects/", json={"description": "Test"})
    assert response.status_code == 422

def test_create_duplicate_project(client):
    """Test creating project with duplicate name"""
    project_data = {
        "name": "Duplicate Project",
        "description": "First project"
    }
    
    # First creation should succeed
    response = client.post("/api/v1/projects/", json=project_data)
    assert response.status_code == 200
    
    # Second creation with same name should fail
    project_data["description"] = "Second project"
    response = client.post("/api/v1/projects/", json=project_data)
    assert response.status_code == 400

def test_get_all_projects(client):
    """Test getting all projects"""
    # Create some test projects
    for i in range(3):
        client.post("/api/v1/projects/", json={
            "name": f"Test Project {i}",
            "description": f"Description {i}"
        })
    
    response = client.get("/api/v1/projects/")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3  # At least the 3 we created

def test_get_project_by_id(client):
    """Test getting a specific project by ID"""
    # Create a project
    project_data = {
        "name": "Specific Project",
        "description": "For ID testing"
    }
    
    create_response = client.post("/api/v1/projects/", json=project_data)
    project_id = create_response.json()["id"]
    
    # Get the project by ID
    response = client.get(f"/api/v1/projects/{project_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == project_id
    assert data["name"] == project_data["name"]

def test_get_nonexistent_project(client):
    """Test getting a project that doesn't exist"""
    response = client.get("/api/v1/projects/99999")
    assert response.status_code == 404

def test_get_project_invalid_id(client):
    """Test getting project with invalid ID"""
    response = client.get("/api/v1/projects/0")
    assert response.status_code == 422  # Validation error for ID <= 0
    
    response = client.get("/api/v1/projects/-1")
    assert response.status_code == 422

def test_update_project(client):
    """Test updating a project"""
    # Create a project
    project_data = {
        "name": "Original Project",
        "description": "Original description"
    }
    
    create_response = client.post("/api/v1/projects/", json=project_data)
    project_id = create_response.json()["id"]
    
    # Update the project
    update_data = {
        "name": "Updated Project",
        "description": "Updated description",
        "status": "active"
    }
    
    response = client.put(f"/api/v1/projects/{project_id}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    assert data["status"] == update_data["status"]

def test_update_project_partial(client):
    """Test partial update of a project"""
    # Create a project
    project_data = {
        "name": "Partial Update Project",
        "description": "Original description"
    }
    
    create_response = client.post("/api/v1/projects/", json=project_data)
    project_id = create_response.json()["id"]
    
    # Update only the description
    update_data = {"description": "New description"}
    
    response = client.put(f"/api/v1/projects/{project_id}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == project_data["name"]  # Should remain unchanged
    assert data["description"] == update_data["description"]

def test_update_project_duplicate_name(client):
    """Test updating project with duplicate name"""
    # Create two projects
    client.post("/api/v1/projects/", json={"name": "Project A", "description": "A"})
    create_response = client.post("/api/v1/projects/", json={"name": "Project B", "description": "B"})
    project_b_id = create_response.json()["id"]
    
    # Try to rename Project B to Project A (should fail)
    response = client.put(f"/api/v1/projects/{project_b_id}", json={"name": "Project A"})
    assert response.status_code == 400

def test_delete_project(client):
    """Test deleting a project"""
    # Create a project
    project_data = {
        "name": "Project to Delete",
        "description": "Will be deleted"
    }
    
    create_response = client.post("/api/v1/projects/", json=project_data)
    project_id = create_response.json()["id"]
    
    # Delete the project
    response = client.delete(f"/api/v1/projects/{project_id}")
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["message"]
    
    # Verify project is deleted
    response = client.get(f"/api/v1/projects/{project_id}")
    assert response.status_code == 404

def test_delete_nonexistent_project(client):
    """Test deleting a project that doesn't exist"""
    response = client.delete("/api/v1/projects/99999")
    assert response.status_code == 404

def test_project_validation_edge_cases(client):
    """Test project validation edge cases"""
    # Name with only spaces
    response = client.post("/api/v1/projects/", json={"name": "   ", "description": "Test"})
    assert response.status_code == 422
    
    # Valid name with spaces (should be trimmed)
    response = client.post("/api/v1/projects/", json={"name": "  Valid Name  ", "description": "Test"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Valid Name"  # Should be trimmed
    
    # Description too long
    response = client.post("/api/v1/projects/", json={
        "name": "Test Project",
        "description": "x" * 501  # Exceeds max length
    })
    assert response.status_code == 422

def test_project_status_validation(client):
    """Test project status validation"""
    # Create a project
    project_data = {"name": "Status Test Project", "description": "For status testing"}
    create_response = client.post("/api/v1/projects/", json=project_data)
    project_id = create_response.json()["id"]
    
    # Valid status values
    valid_statuses = ["draft", "active", "completed", "archived"]
    for status in valid_statuses:
        response = client.put(f"/api/v1/projects/{project_id}", json={"status": status})
        assert response.status_code == 200
        assert response.json()["status"] == status
    
    # Invalid status
    response = client.put(f"/api/v1/projects/{project_id}", json={"status": "invalid_status"})
    assert response.status_code == 422