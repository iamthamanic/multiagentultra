import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.core.auth import auth_service
from main import app
import tempfile
import os

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
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

def test_password_hashing():
    """Test password hashing and verification"""
    password = "test_password_123"
    hashed = auth_service.get_password_hash(password)
    
    assert hashed != password
    assert auth_service.verify_password(password, hashed)
    assert not auth_service.verify_password("wrong_password", hashed)

def test_jwt_token_creation_and_verification():
    """Test JWT token creation and verification"""
    test_data = {"sub": 1, "email": "test@example.com"}
    token = auth_service.create_access_token(test_data)
    
    assert token is not None
    assert isinstance(token, str)
    
    # Verify token
    payload = auth_service.verify_token(token)
    assert payload["sub"] == 1
    assert payload["email"] == "test@example.com"

def test_user_registration(client):
    """Test user registration endpoint"""
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "SecurePass123"
    }
    
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["username"] == user_data["username"]
    assert "password" not in data
    assert data["is_active"] is True

def test_user_registration_duplicate_email(client):
    """Test user registration with duplicate email"""
    user_data = {
        "email": "duplicate@example.com",
        "username": "user1",
        "password": "SecurePass123"
    }
    
    # First registration should succeed
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 200
    
    # Second registration with same email should fail
    user_data["username"] = "user2"
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 400

def test_user_login(client):
    """Test user login endpoint"""
    # First register a user
    user_data = {
        "email": "login@example.com",
        "username": "loginuser",
        "password": "SecurePass123"
    }
    client.post("/api/v1/auth/register", json=user_data)
    
    # Now try to login
    login_data = {
        "email": "login@example.com",
        "password": "SecurePass123"
    }
    
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data
    assert data["username"] == "loginuser"

def test_user_login_invalid_credentials(client):
    """Test user login with invalid credentials"""
    login_data = {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401

def test_protected_endpoint_without_token(client):
    """Test accessing protected endpoint without token"""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 403  # No authorization header

def test_protected_endpoint_with_token(client):
    """Test accessing protected endpoint with valid token"""
    # Register and login
    user_data = {
        "email": "protected@example.com",
        "username": "protecteduser",
        "password": "SecurePass123"
    }
    client.post("/api/v1/auth/register", json=user_data)
    
    login_response = client.post("/api/v1/auth/login", json={
        "email": "protected@example.com",
        "password": "SecurePass123"
    })
    token = login_response.json()["access_token"]
    
    # Access protected endpoint
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["email"] == "protected@example.com"
    assert data["username"] == "protecteduser"

def test_password_validation():
    """Test password validation function"""
    from app.core.auth import validate_password
    
    # Valid passwords
    assert validate_password("SecurePass123")
    assert validate_password("MyStrongP@ssw0rd")
    
    # Invalid passwords
    assert not validate_password("short")  # Too short
    assert not validate_password("nouppercase123")  # No uppercase
    assert not validate_password("NOLOWERCASE123")  # No lowercase
    assert not validate_password("NoNumbers")  # No numbers
    assert not validate_password("")  # Empty

def test_token_refresh(client):
    """Test token refresh endpoint"""
    # Register and login
    user_data = {
        "email": "refresh@example.com",
        "username": "refreshuser",
        "password": "SecurePass123"
    }
    client.post("/api/v1/auth/register", json=user_data)
    
    login_response = client.post("/api/v1/auth/login", json={
        "email": "refresh@example.com",
        "password": "SecurePass123"
    })
    token = login_response.json()["access_token"]
    
    # Refresh token
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/v1/auth/refresh", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["access_token"] != token  # Should be a new token