// frontend\src\services\interviewApi.js
import axios from 'axios';

// Create a base axios instance.
const api = axios.create({
  // This baseURL is correct. It already includes '/api'.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

/**
 * A helper function to create authorization headers.
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
 * Calls the POST /api/interview/sessions endpoint.
 * @param {object} data - { resume_text, job_description }
 * @param {string} token - The user's auth token
 */
export const startInterviewApi = async (data, token) => {
  try {
    // --- CHANGE 1 ---
    // The path was '/interview/start'
    // The correct path is '/interview/sessions'
    // This matches: /api (from baseURL) + /interview (from router) + /sessions (from endpoint)
    const response = await api.post('/interview/sessions', data, getAuthHeaders(token));
    // --- END CHANGE ---
    return response.data;
  } catch (error) {
    console.error("Error starting interview:", error.response?.data);
    throw error.response?.data || new Error("An unknown server error occurred.");
  }
};

/**
 * Calls the POST /api/interview/sessions/{session_id}/answer endpoint.
 * @param {object} data - { session_id, answer_text }
 * @param {string} token - The user's auth token
 */
export const sendAnswerApi = async (data, token) => {
  try {
    // --- CHANGE 2 ---
    // The path was '/interview/answer'
    // The correct path is '/interview/sessions/{session_id}/answer'
    const response = await api.post(
      `/interview/sessions/${data.session_id}/answer`, 
      { answer_text: data.answer_text }, 
      getAuthHeaders(token)
    );
    // --- END CHANGE ---
    return response.data;
  } catch (error) {
    console.error("Error sending answer:", error.response?.data);
    throw error.response?.data || new Error("An unknown server error occurred.");
  }
};

/**
 * Calls the GET /api/interview/sessions/{session_id}/report endpoint.
 * @param {string} sessionId - The ID of the completed interview
 * @param {string} token - The user's auth token
 */
export const getReportApi = async (sessionId, token) => {
  try {
    // --- CHANGE 3 ---
    // The path was '/interview/report/{sessionId}'
    // The correct path is '/interview/sessions/{sessionId}/report'
    const response = await api.get(`/interview/sessions/${sessionId}/report`, getAuthHeaders(token));
    // --- END CHANGE ---
    return response.data;
  } catch (error) {
    console.error("Error getting report:", error.response?.data);
    throw error.response?.data || new Error("An unknown server error occurred.");
  }
};