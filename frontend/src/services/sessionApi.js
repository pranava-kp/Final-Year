import axios from 'axios';

// The base URL for your FastAPI backend
const API_URL = 'http://127.0.0.1:8000';

/**
 * Uploads a resume file to the backend.
 * @param {File} file - The resume file to upload.
 * @param {string} token - The user's JWT authentication token.
 * @returns {Promise<object>} The server's response, containing the file URL.
 */
export const uploadResume = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_URL}/session/upload_resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading resume:", error.response?.data || error.message);
    throw error.response?.data || new Error("An unknown error occurred during file upload.");
  }
};

/**
 * Starts the interview by sending either a file URL or raw text.
 * @param {{ file_url?: string, resume_text?: string }} payload - The data to start with.
 * @param {string} token - The user's JWT authentication token.
 * @returns {Promise<object>} The server's response { raw_text: "..." }.
 */
export const startInterview = async (payload, token) => {
  try {
    const response = await axios.post(`${API_URL}/session/start-interview`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });
    return response.data; // This will now be { raw_text: "..." }
  } catch (error) {
    console.error("Error starting interview:", error.response?.data || error.message);
    throw error.response?.data || new Error("An unknown error occurred while starting.");
  }
};