// Mock data for development and testing
export const mockReviewQueueItems = [
  {
    id: 1,
    question_text: "Implement a binary search algorithm in Python",
    domain: "algorithms",
    difficulty: "medium",
    status: "pending",
    expected_answer: "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
    evaluation_criteria: {
      "correctness": "Algorithm should correctly find the target element",
      "time_complexity": "Should be O(log n)",
      "edge_cases": "Should handle empty arrays and element not found cases"
    },
    suggested_by: "john_doe",
    created_at: "2024-01-15T10:30:00Z",
    reviewed_at: null,
    review_notes: null
  },
  {
    id: 2,
    question_text: "Explain the difference between SQL JOIN types",
    domain: "databases",
    difficulty: "easy",
    status: "approved",
    expected_answer: "INNER JOIN returns only matching records from both tables. LEFT JOIN returns all records from the left table and matching records from the right table. RIGHT JOIN returns all records from the right table and matching records from the left table. FULL OUTER JOIN returns all records when there's a match in either table.",
    evaluation_criteria: {
      "completeness": "Should cover all major JOIN types",
      "accuracy": "Explanations should be technically correct",
      "examples": "Bonus points for providing examples"
    },
    suggested_by: "jane_smith",
    created_at: "2024-01-14T14:20:00Z",
    reviewed_at: "2024-01-15T09:15:00Z",
    review_notes: "Good fundamental question, approved for easy difficulty level"
  },
  {
    id: 3,
    question_text: "Design a scalable chat application architecture",
    domain: "system-design",
    difficulty: "hard",
    status: "rejected",
    expected_answer: "A scalable chat application would require: 1) Load balancers for distributing traffic, 2) WebSocket servers for real-time communication, 3) Message queues for handling high throughput, 4) Database sharding for user data and message storage, 5) CDN for media files, 6) Caching layer for frequently accessed data, 7) Microservices architecture for different features.",
    evaluation_criteria: {
      "scalability": "Should address horizontal scaling concerns",
      "real_time": "Must include real-time communication strategy",
      "data_storage": "Should consider message persistence and retrieval",
      "performance": "Should address latency and throughput optimization"
    },
    suggested_by: "mike_wilson",
    created_at: "2024-01-13T16:45:00Z",
    reviewed_at: "2024-01-14T11:30:00Z",
    review_notes: "Too broad for a single question, needs to be more specific"
  },
  {
    id: 4,
    question_text: "Implement a LRU (Least Recently Used) cache",
    domain: "data-structures",
    difficulty: "medium",
    status: "pending",
    expected_answer: "class LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.cache = {}\n        self.order = []\n    \n    def get(self, key):\n        if key in self.cache:\n            self.order.remove(key)\n            self.order.append(key)\n            return self.cache[key]\n        return -1\n    \n    def put(self, key, value):\n        if key in self.cache:\n            self.order.remove(key)\n        elif len(self.cache) >= self.capacity:\n            oldest = self.order.pop(0)\n            del self.cache[oldest]\n        \n        self.cache[key] = value\n        self.order.append(key)",
    evaluation_criteria: {
      "correctness": "Should implement both get and put operations correctly",
      "efficiency": "Should be O(1) for both operations (with proper implementation)",
      "data_structure": "Should use appropriate data structures (HashMap + Doubly Linked List)"
    },
    suggested_by: "sarah_johnson",
    created_at: "2024-01-12T13:15:00Z",
    reviewed_at: null,
    review_notes: null
  },
  {
    id: 5,
    question_text: "What is the difference between var, let, and const in JavaScript?",
    domain: "programming",
    difficulty: "easy",
    status: "approved",
    expected_answer: "var has function scope and is hoisted, can be redeclared and updated. let has block scope, is hoisted but not initialized, can be updated but not redeclared in same scope. const has block scope, is hoisted but not initialized, cannot be updated or redeclared, must be initialized at declaration.",
    evaluation_criteria: {
      "scope": "Should explain scoping differences",
      "hoisting": "Should mention hoisting behavior",
      "mutability": "Should explain reassignment rules"
    },
    suggested_by: "alex_brown",
    created_at: "2024-01-11T09:30:00Z",
    reviewed_at: "2024-01-12T08:45:00Z",
    review_notes: "Fundamental JavaScript concept, good for beginners"
  }
];

export const mockStats = {
  total: 5,
  pending: 2,
  approved: 2,
  rejected: 1
};

// Mock API responses
export const getMockReviewQueueItems = (filters = {}) => {
  let filteredItems = [...mockReviewQueueItems];

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    filteredItems = filteredItems.filter(item => item.status === filters.status);
  }
  
  if (filters.domain && filters.domain !== 'all') {
    filteredItems = filteredItems.filter(item => item.domain === filters.domain);
  }
  
  if (filters.difficulty && filters.difficulty !== 'all') {
    filteredItems = filteredItems.filter(item => item.difficulty === filters.difficulty);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.question_text.toLowerCase().includes(searchLower) ||
      item.domain.toLowerCase().includes(searchLower) ||
      item.expected_answer.toLowerCase().includes(searchLower)
    );
  }

  // Calculate stats for filtered results
  const stats = {
    total: filteredItems.length,
    pending: filteredItems.filter(item => item.status === 'pending').length,
    approved: filteredItems.filter(item => item.status === 'approved').length,
    rejected: filteredItems.filter(item => item.status === 'rejected').length
  };

  return {
    items: filteredItems,
    stats: stats
  };
};