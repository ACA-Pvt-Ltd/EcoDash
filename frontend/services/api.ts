import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '@/constants/config';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    console.log('📦 Request data:', JSON.stringify(config.data, null, 2));
    
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      console.log('🔑 Adding auth token to request');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('⚠️ No auth token found');
    }
    return config;
  },
  (error) => {
    console.log('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.config.url);
    console.log('✅ Status:', response.status);
    console.log('📦 Response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  },
  async (error) => {
    console.log('❌ API Error:', error.config?.url);
    console.log('📝 Error status:', error.response?.status);
    console.log('📝 Error data:', JSON.stringify(error.response?.data, null, 2));
    console.log('📝 Error message:', error.message);
    
    if (error.response?.status === 401) {
      console.log('🚪 Unauthorized - clearing storage');
      // Unauthorized - clear storage and redirect to login
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.USER_ROLE,
      ]);
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
