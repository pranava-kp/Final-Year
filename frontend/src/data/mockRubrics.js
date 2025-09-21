// Mock rubrics data for development and testing
export const mockRubrics = [
  {
    id: 1,
    name: "Programming Problem Solving",
    description: "Rubric for evaluating programming problem-solving skills",
    domain: "programming",
    criteria: {
      "problem_understanding": {
        "weight": 0.2,
        "description": "Understanding of the problem requirements",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Demonstrates complete understanding of problem requirements and constraints"
          },
          "good": {
            "score": 3,
            "description": "Shows good understanding with minor gaps"
          },
          "satisfactory": {
            "score": 2,
            "description": "Basic understanding but misses some key aspects"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Limited understanding of the problem"
          }
        }
      },
      "algorithm_design": {
        "weight": 0.3,
        "description": "Quality of algorithm design and approach",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Optimal algorithm with clear logic and efficient approach"
          },
          "good": {
            "score": 3,
            "description": "Good algorithm with minor inefficiencies"
          },
          "satisfactory": {
            "score": 2,
            "description": "Working algorithm but not optimal"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Poor algorithm design or incorrect approach"
          }
        }
      },
      "code_quality": {
        "weight": 0.25,
        "description": "Code readability, structure, and best practices",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Clean, well-structured code following best practices"
          },
          "good": {
            "score": 3,
            "description": "Good code structure with minor issues"
          },
          "satisfactory": {
            "score": 2,
            "description": "Functional code but lacks clarity or structure"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Poor code quality, hard to read or understand"
          }
        }
      },
      "testing_edge_cases": {
        "weight": 0.15,
        "description": "Consideration of edge cases and error handling",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Comprehensive handling of edge cases and errors"
          },
          "good": {
            "score": 3,
            "description": "Good consideration of most edge cases"
          },
          "satisfactory": {
            "score": 2,
            "description": "Basic edge case handling"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Little to no consideration of edge cases"
          }
        }
      },
      "communication": {
        "weight": 0.1,
        "description": "Explanation of approach and thought process",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Clear, detailed explanation of approach and reasoning"
          },
          "good": {
            "score": 3,
            "description": "Good explanation with minor gaps"
          },
          "satisfactory": {
            "score": 2,
            "description": "Basic explanation of approach"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Poor or unclear explanation"
          }
        }
      }
    },
    created_at: "2024-01-10T10:00:00Z",
    updated_at: "2024-01-15T14:30:00Z",
    created_by: "admin",
    is_active: true
  },
  {
    id: 2,
    name: "System Design Interview",
    description: "Rubric for evaluating system design capabilities",
    domain: "system-design",
    criteria: {
      "requirements_gathering": {
        "weight": 0.2,
        "description": "Ability to gather and clarify requirements",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Asks insightful questions and clarifies all requirements"
          },
          "good": {
            "score": 3,
            "description": "Asks relevant questions with minor omissions"
          },
          "satisfactory": {
            "score": 2,
            "description": "Basic requirement gathering"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Fails to gather important requirements"
          }
        }
      },
      "high_level_design": {
        "weight": 0.25,
        "description": "Overall system architecture and component design",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Well-structured architecture with clear component separation"
          },
          "good": {
            "score": 3,
            "description": "Good architecture with minor issues"
          },
          "satisfactory": {
            "score": 2,
            "description": "Basic architecture but lacks some clarity"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Poor or confusing architecture"
          }
        }
      },
      "scalability": {
        "weight": 0.2,
        "description": "Consideration of scalability and performance",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Comprehensive scalability strategy with specific techniques"
          },
          "good": {
            "score": 3,
            "description": "Good scalability considerations"
          },
          "satisfactory": {
            "score": 2,
            "description": "Basic scalability awareness"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Little consideration of scalability"
          }
        }
      },
      "data_storage": {
        "weight": 0.15,
        "description": "Database design and data modeling decisions",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Optimal database choices with clear data modeling"
          },
          "good": {
            "score": 3,
            "description": "Good database design with minor issues"
          },
          "satisfactory": {
            "score": 2,
            "description": "Basic database considerations"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Poor database design choices"
          }
        }
      },
      "trade_offs": {
        "weight": 0.2,
        "description": "Understanding and discussion of trade-offs",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Clear understanding of trade-offs with justified decisions"
          },
          "good": {
            "score": 3,
            "description": "Good awareness of trade-offs"
          },
          "satisfactory": {
            "score": 2,
            "description": "Basic understanding of some trade-offs"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Little awareness of design trade-offs"
          }
        }
      }
    },
    created_at: "2024-01-12T09:15:00Z",
    updated_at: "2024-01-12T09:15:00Z",
    created_by: "admin",
    is_active: true
  },
  {
    id: 3,
    name: "Database Knowledge Assessment",
    description: "Rubric for evaluating database and SQL knowledge",
    domain: "databases",
    criteria: {
      "sql_syntax": {
        "weight": 0.3,
        "description": "Correctness of SQL syntax and query structure",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Perfect SQL syntax with optimal query structure"
          },
          "good": {
            "score": 3,
            "description": "Correct syntax with minor inefficiencies"
          },
          "satisfactory": {
            "score": 2,
            "description": "Mostly correct syntax with some errors"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Significant syntax errors"
          }
        }
      },
      "query_optimization": {
        "weight": 0.25,
        "description": "Understanding of query optimization techniques",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Demonstrates advanced optimization techniques"
          },
          "good": {
            "score": 3,
            "description": "Good understanding of basic optimization"
          },
          "satisfactory": {
            "score": 2,
            "description": "Limited optimization awareness"
          },
          "needs_improvement": {
            "score": 1,
            "description": "No consideration of optimization"
          }
        }
      },
      "database_design": {
        "weight": 0.25,
        "description": "Database schema design and normalization",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Excellent schema design with proper normalization"
          },
          "good": {
            "score": 3,
            "description": "Good design with minor issues"
          },
          "satisfactory": {
            "score": 2,
            "description": "Basic design understanding"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Poor design choices"
          }
        }
      },
      "theoretical_knowledge": {
        "weight": 0.2,
        "description": "Understanding of database concepts and theory",
        "levels": {
          "excellent": {
            "score": 4,
            "description": "Deep understanding of database theory"
          },
          "good": {
            "score": 3,
            "description": "Good theoretical knowledge"
          },
          "satisfactory": {
            "score": 2,
            "description": "Basic theoretical understanding"
          },
          "needs_improvement": {
            "score": 1,
            "description": "Limited theoretical knowledge"
          }
        }
      }
    },
    created_at: "2024-01-08T16:20:00Z",
    updated_at: "2024-01-14T11:45:00Z",
    created_by: "admin",
    is_active: false
  }
];

export const mockRubricStats = {
  total: 3,
  active: 2,
  inactive: 1,
  by_domain: {
    programming: 1,
    "system-design": 1,
    databases: 1
  }
};

// Mock API responses for rubrics
export const getMockRubrics = (filters = {}) => {
  let filteredRubrics = [...mockRubrics];

  // Apply filters
  if (filters.domain && filters.domain !== 'all') {
    filteredRubrics = filteredRubrics.filter(rubric => rubric.domain === filters.domain);
  }
  
  if (filters.status && filters.status !== 'all') {
    const isActive = filters.status === 'active';
    filteredRubrics = filteredRubrics.filter(rubric => rubric.is_active === isActive);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredRubrics = filteredRubrics.filter(rubric => 
      rubric.name.toLowerCase().includes(searchLower) ||
      rubric.description.toLowerCase().includes(searchLower) ||
      rubric.domain.toLowerCase().includes(searchLower)
    );
  }

  // Calculate stats for filtered results
  const stats = {
    total: filteredRubrics.length,
    active: filteredRubrics.filter(rubric => rubric.is_active).length,
    inactive: filteredRubrics.filter(rubric => !rubric.is_active).length,
    by_domain: {}
  };

  // Count by domain
  filteredRubrics.forEach(rubric => {
    stats.by_domain[rubric.domain] = (stats.by_domain[rubric.domain] || 0) + 1;
  });

  return {
    rubrics: filteredRubrics,
    stats: stats
  };
};

// Template for new rubric
export const newRubricTemplate = {
  name: "",
  description: "",
  domain: "programming",
  criteria: {
    "criterion_1": {
      "weight": 0.5,
      "description": "Description of the first criterion",
      "levels": {
        "excellent": {
          "score": 4,
          "description": "Excellent performance description"
        },
        "good": {
          "score": 3,
          "description": "Good performance description"
        },
        "satisfactory": {
          "score": 2,
          "description": "Satisfactory performance description"
        },
        "needs_improvement": {
          "score": 1,
          "description": "Needs improvement description"
        }
      }
    },
    "criterion_2": {
      "weight": 0.5,
      "description": "Description of the second criterion",
      "levels": {
        "excellent": {
          "score": 4,
          "description": "Excellent performance description"
        },
        "good": {
          "score": 3,
          "description": "Good performance description"
        },
        "satisfactory": {
          "score": 2,
          "description": "Satisfactory performance description"
        },
        "needs_improvement": {
          "score": 1,
          "description": "Needs improvement description"
        }
      }
    }
  },
  is_active: true
};