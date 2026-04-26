// src/api.js
import axios from 'axios';

// The Vite proxy will forward /api requests to the backend server.
const API_BASE_URL = '/api';

export const analyzeDataset = async (file, targetColumn, protectedAttributes) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetColumn', targetColumn || '');
    formData.append('protectedAttributes', JSON.stringify(protectedAttributes || []));

    const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error analyzing dataset:", error);
    throw error;
  }
};

export const fetchHistory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/history`);
    return response.data;
  } catch (error) {
    console.error("Error fetching history:", error);
    throw error;
  }
};

export const explainWithAI = async (question, context) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/explain`, {
      question,
      context
    });
    return response.data.explanation;
  } catch (error) {
    console.error("Error generating explanation:", error);
    throw error;
  }
};
