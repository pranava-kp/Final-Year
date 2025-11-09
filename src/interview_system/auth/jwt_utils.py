# src/interview_system/auth/jwt_utils.py

from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt, ExpiredSignatureError
from interview_system.config.auth_config import settings
import logging

# --- Configuration ---
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Short-lived access token
REFRESH_TOKEN_EXPIRE_DAYS = 7     # Long-lived refresh token

def create_access_token(data: dict) -> str:
    """
    Creates a new, short-lived access token.
    
    Args:
        data: A dictionary containing the claims to encode in the token (e.g., user ID).
        
    Returns:
        A signed JWT access token as a string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """
    Creates a new, long-lived refresh token.
    
    Args:
        data: A dictionary containing the claims to encode in the token (e.g., user ID).
        
    Returns:
        A signed JWT refresh token as a string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# You will add a decode/validate function here later
# for the get_current_user dependency.
def verify_token(token: str) -> dict | None:
    """
    Decodes and validates a JWT token.
    
    Args:
        token: The JWT token string.
        
    Returns:
        The token's payload as a dictionary if valid, otherwise None.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        # Token is expired
        logging.warning("Token verification failed: Signature has expired.")
        return None
    except JWTError as e:
        # This catches all other errors, including:
        # - Invalid signature (key mismatch)
        # - Malformed token
        # - etc.
        logging.error(f"Token verification failed: {e}")
        return None