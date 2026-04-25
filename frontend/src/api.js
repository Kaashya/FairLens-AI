// src/api.js

const mockAnalysisResult = {
  bias_score: 72,
  verdict: "High Bias Detected",
  flagged_columns: ["gender", "age"],
  metrics: {
    demographic_parity_diff: 0.34,
    disparate_impact: 0.61,
    class_imbalance: 0.78
  },
  group_stats: {
    gender: { "Male": 0.82, "Female": 0.48 },
    age: { "<30": 0.71, "30-50": 0.65, ">50": 0.41 }
  },
  ai_explanation: "Your dataset shows significant gender bias, where 'Male' applicants have an 82% positive outcome rate compared to 48% for 'Female' applicants. This disparate impact is flagged by the system as it may cause your model to discriminate."
};

const mockHistory = [
  { id: 1, dataset_name: "Loan_Applications_2023.csv", bias_score: 72, timestamp: "2024-05-12T10:30:00Z", flagged_columns: ["gender", "age"] },
  { id: 2, dataset_name: "Hiring_Data_Q1.csv", bias_score: 35, timestamp: "2024-05-10T14:15:00Z", flagged_columns: ["race"] },
  { id: 3, dataset_name: "Medical_Records_Sample.csv", bias_score: 12, timestamp: "2024-05-08T09:00:00Z", flagged_columns: [] }
];

export const analyzeDataset = async (file, targetColumn, protectedAttributes) => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockAnalysisResult);
    }, 2000);
  });
};

export const fetchHistory = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockHistory);
    }, 1000);
  });
};

export const explainWithAI = async (question, context) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`This is a generated AI explanation regarding: "${question}". Based on your dataset metrics, I recommend reweighting the samples or applying fairness constraints during training.`);
    }, 1500);
  });
};
