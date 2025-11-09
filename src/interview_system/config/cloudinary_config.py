from pydantic_settings import BaseSettings, SettingsConfigDict

class CloudinarySettings(BaseSettings):
    """
    Loads and validates Cloudinary credentials from environment variables.
    """
    # This configuration tells Pydantic to look for a .env file.
    model_config = SettingsConfigDict(
        env_file='.env', 
        env_file_encoding='utf-8', 
        extra='ignore'
    )

    # These fields must match the variable names in your .env file
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    CLOUDINARY_FOLDER: str = "resumes" # Default folder if not in .env

# Create a single, importable instance of the settings
settings = CloudinarySettings()