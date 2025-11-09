import axios from 'axios';
import { getMockReviewQueueItems, mockReviewQueueItems } from '../data/mockData';
import { getMockRubrics, mockRubrics } from '../data/mockRubrics';

const API_BASE_URL = 'http://localhost:8000';
const USE_MOCK_DATA = false; // Set to false when backend is ready
const api = axios.create({
  baseURL: `${API_BASE_URL}/admin`, // All calls will go to /admin
});

// 2. Add the MISSING authentication interceptor
// This code runs on *every* request and adds the auth token from localStorage
api.interceptors.request.use(
  (config) => {
    // AuthContext stores the token under 'accessToken' (camelCase)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Review Queue API calls
export const reviewQueueApi = {
  // Get all review queue items with optional filtering
  getItems: async (params = {}) => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return getMockReviewQueueItems(params);
    }
    
    const response = await api.get('/review-queue', { params });
    return response.data;
  },

  // Get a specific review queue item
  getItem: async (itemId) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const item = mockReviewQueueItems.find(item => item.id === itemId);
      if (!item) throw new Error('Item not found');
      return item;
    }
    
    const response = await api.get(`/review-queue/${itemId}`);
    return response.data;
  },

  // Create a new review queue item
  createItem: async (itemData) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const newItem = {
        id: Math.max(...mockReviewQueueItems.map(item => item.id)) + 1,
        ...itemData,
        status: 'pending',
        created_at: new Date().toISOString(),
        reviewed_at: null,
        review_notes: null
      };
      mockReviewQueueItems.push(newItem);
      return newItem;
    }
    
    const response = await api.post('/review-queue', itemData);
    return response.data;
  },

  // Update a review queue item
  updateItem: async (itemId, itemData) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 600));
      const itemIndex = mockReviewQueueItems.findIndex(item => item.id === itemId);
      if (itemIndex === -1) throw new Error('Item not found');
      mockReviewQueueItems[itemIndex] = { ...mockReviewQueueItems[itemIndex], ...itemData };
      return mockReviewQueueItems[itemIndex];
    }
    
    const response = await api.put(`/review-queue/${itemId}`, itemData);
    return response.data;
  },

  // Approve a review queue item
  approveItem: async (itemId, reviewNotes = '') => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 700));
      const itemIndex = mockReviewQueueItems.findIndex(item => item.id === itemId);
      if (itemIndex === -1) throw new Error('Item not found');
      mockReviewQueueItems[itemIndex] = {
        ...mockReviewQueueItems[itemIndex],
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes
      };
      return mockReviewQueueItems[itemIndex];
    }
    
    const response = await api.post(`/review-queue/${itemId}/approve`, {
      review_notes: reviewNotes
    });
    return response.data;
  },

  // Reject a review queue item
  rejectItem: async (itemId, reviewNotes = '') => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 700));
      const itemIndex = mockReviewQueueItems.findIndex(item => item.id === itemId);
      if (itemIndex === -1) throw new Error('Item not found');
      mockReviewQueueItems[itemIndex] = {
        ...mockReviewQueueItems[itemIndex],
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes
      };
      return mockReviewQueueItems[itemIndex];
    }
    
    const response = await api.post(`/review-queue/${itemId}/reject`, {
      review_notes: reviewNotes
    });
    return response.data;
  },

  // Delete a review queue item
  deleteItem: async (itemId) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const itemIndex = mockReviewQueueItems.findIndex(item => item.id === itemId);
      if (itemIndex === -1) throw new Error('Item not found');
      mockReviewQueueItems.splice(itemIndex, 1);
      return { success: true };
    }
    
    const response = await api.delete(`/review-queue/${itemId}`);
    return response.data;
  }
};

// Rubrics API calls
export const rubricsApi = {
  // Get all rubrics with optional filtering
  getRubrics: async (params = {}) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return getMockRubrics(params);
    }
    
    const response = await api.get('/rubrics', { params });
    return response.data;
  },

  // Get a specific rubric
  getRubric: async (rubricId) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const rubric = mockRubrics.find(rubric => rubric.id === rubricId);
      if (!rubric) throw new Error('Rubric not found');
      return rubric;
    }
    
    const response = await api.get(`/rubrics/${rubricId}`);
    return response.data;
  },

  // Create a new rubric
  createRubric: async (rubricData) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const newRubric = {
        id: Math.max(...mockRubrics.map(rubric => rubric.id)) + 1,
        ...rubricData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin'
      };
      mockRubrics.push(newRubric);
      return newRubric;
    }
    
    const response = await api.post('/rubrics', rubricData);
    return response.data;
  },

  // Update a rubric
  updateRubric: async (rubricId, rubricData) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 600));
      const rubricIndex = mockRubrics.findIndex(rubric => rubric.id === rubricId);
      if (rubricIndex === -1) throw new Error('Rubric not found');
      mockRubrics[rubricIndex] = { 
        ...mockRubrics[rubricIndex], 
        ...rubricData,
        updated_at: new Date().toISOString()
      };
      return mockRubrics[rubricIndex];
    }
    
    const response = await api.put(`/rubrics/${rubricId}`, rubricData);
    return response.data;
  },

  // Delete a rubric
  deleteRubric: async (rubricId) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const rubricIndex = mockRubrics.findIndex(rubric => rubric.id === rubricId);
      if (rubricIndex === -1) throw new Error('Rubric not found');
      mockRubrics.splice(rubricIndex, 1);
      return { success: true };
    }
    
    const response = await api.delete(`/rubrics/${rubricId}`);
    return response.data;
  }
};

// Admin stats API calls
export const adminStatsApi = {
  // Get admin dashboard statistics
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  }
};

// Error handler for API calls
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
    return { success: false, error: message, status: error.response.status };
  } else if (error.request) {
    // Request was made but no response received
    return { success: false, error: 'Network error - please check your connection' };
  } else {
    // Something else happened
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};