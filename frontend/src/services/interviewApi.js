// frontend\src\services\interviewApi.js
import axios from 'axios';

// Create a base axios instance.
// You can (and should) reuse this logic if you already have it in sessionApi.js
const api = axios.create({
  // Get the API base URL from environment variables, with a fallback
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

/**
 * A helper function to create authorization headers.
 * It takes the token from your `useAuth` context.
 * @param {string} token - The user's JWT token
 */
const getAuthHeaders = (token) => {
  if (!token) return {};
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Calls the POST /api/interview/start endpoint.
 * @param {object} data - { resume_text, job_description_text }
 * @param {string} token - The user's auth token
 */
export const startInterviewApi = async (data, token) => {
  try {
    const response = await api.post('/interview/start', data, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    console.error("Error starting interview:", error.response?.data);
    // Throw the detailed error message from the server (e.g., "Failed to generate...")
    throw error.response?.data || new Error("An unknown server error occurred.");
  }
};

/**
 * Calls the POST /api/interview/answer endpoint.
 * @param {object} data - { session_id, answer_text }
 * @param {string} token - The user's auth token
 */
export const sendAnswerApi = async (data, token) => {
  try {
    const response = await api.post('/interview/answer', data, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    console.error("Error sending answer:", error.response?.data);
    throw error.response?.data || new Error("An unknown server error occurred.");
  }
};

/**
 * Calls the GET /api/interview/report/{session_id} endpoint.
 * @param {string} sessionId - The ID of the completed interview
 * @param {string} token - The user's auth token
 */
export const getReportApi = async (sessionId, token) => {
  try {
    // Note the template literal for the GET request URL
    const response = await api.get(`/interview/report/${sessionId}`, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    console.error("Error fetching report:", error.response?.data);
    throw error.response?.data || new Error("An unknown server error occurred.");
  }
};