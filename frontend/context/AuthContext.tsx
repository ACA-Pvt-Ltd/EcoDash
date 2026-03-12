import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { ENDPOINTS, STORAGE_KEYS } from '@/constants/config';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  points?: number;
  cashEarned?: number;
  qrCode?: string;
  role: string;
  totalWasteDisposed?: number;
  totalWasteCollected?: number;
  totalTransactions?: number;
  acceptedWasteTypes?: string[];
  badges?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<User | undefined>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: () => {},
  refreshUser: async () => undefined,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [storedToken, storedUser] = await AsyncStorage.multiGet([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
      ]);

      if (storedToken[1] && storedUser[1]) {
        setToken(storedToken[1]);
        setUser(JSON.parse(storedUser[1]));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      // Reduce initial loading time
      setTimeout(() => setLoading(false), 100);
    }
  };

  const login = async (email: string, password: string, role: string) => {
    try {
      console.log('🔐 Login attempt started');
      console.log('📧 Email:', email);
      console.log('👤 Role:', role);
      console.log('🌐 API URL:', ENDPOINTS.LOGIN);
      
      const response: any = await api.post(ENDPOINTS.LOGIN, {
        email,
        password,
        role,
      });

      console.log('📥 Response received:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('✅ Login successful');
        // api.ts interceptor already returns response.data, so response is the whole object
        const { data, token: authToken } = response;
        
        console.log('💾 Saving to AsyncStorage...');
        console.log('🔑 Token:', authToken?.substring(0, 20) + '...');
        console.log('👤 User data:', JSON.stringify(data, null, 2));
        
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.TOKEN, authToken],
          [STORAGE_KEYS.USER, JSON.stringify(data)],
          [STORAGE_KEYS.USER_ROLE, role],
        ]);

        setToken(authToken);
        setUser(data);
        console.log('✅ Login process completed successfully');
      } else {
        console.log('❌ Login failed - response.success is false');
        console.log('📝 Error message:', response.message);
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.log('❌ Login error caught:', error);
      console.log('📝 Error message:', error.message);
      console.log('📝 Full error:', JSON.stringify(error, null, 2));
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData: any) => {
    try {
      console.log('📝 Registration attempt started');
      console.log('👤 User data:', JSON.stringify(userData, null, 2));
      console.log('🌐 API URL:', ENDPOINTS.REGISTER);
      
      const response: any = await api.post(ENDPOINTS.REGISTER, userData);

      console.log('📥 Response received:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('✅ Registration successful');
        // api.ts interceptor already returns response.data, so response is the whole object
        const { data, token: authToken } = response;
        
        console.log('💾 Saving to AsyncStorage...');
        console.log('🔑 Token:', authToken?.substring(0, 20) + '...');
        console.log('👤 User data:', JSON.stringify(data, null, 2));
        
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.TOKEN, authToken],
          [STORAGE_KEYS.USER, JSON.stringify(data)],
          [STORAGE_KEYS.USER_ROLE, userData.role || 'user'],
        ]);

        setToken(authToken);
        setUser(data);
        console.log('✅ Registration process completed successfully');
      } else {
        console.log('❌ Registration failed - response.success is false');
        console.log('📝 Error message:', response.message);
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.log('❌ Registration error caught:', error);
      console.log('📝 Error message:', error.message);
      console.log('📝 Full error:', JSON.stringify(error, null, 2));
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.USER_ROLE,
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data from server...');
      const response: any = await api.get(ENDPOINTS.ME);
      
      if (response.success && response.data) {
        console.log('✅ User data refreshed');
        const updatedUser = response.data;
        setUser(updatedUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        return updatedUser;
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
