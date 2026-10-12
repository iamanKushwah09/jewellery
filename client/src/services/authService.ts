import api from './api';
import { User } from '../types';

export class AuthService {
  static async login(credentials: any): Promise<any> {
    const response = await api.post<any>('/store/customer/login', credentials);
    const { token, ...user } = response.data;
    // Store tokens and user info
    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userInfo', JSON.stringify(user));
    }
    return response.data;
  }

  // Send registration OTP
  static async sendOtp(email: string): Promise<any> {
    const response = await api.post<any>('/store/customer/send-otp', { email });
    return response.data;
  }

  // Register user with OTP
  static async register(userData: any): Promise<any> {
    const response = await api.post<any>('/store/customer/register', userData);
    const { token } = response.data;
    if (token) localStorage.setItem('authToken', token);
    return response.data;
  }

  // Logout user
  static async logout(): Promise<void> {
    // Clear tokens and user info
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
  }

  // Forgot password
  static async forgotPassword(email: string): Promise<void> {
    await api.put('/store/customer/forget-password', { email });
  }

  // Reset password
  static async resetPassword(body: any): Promise<void> {
    await api.put('/store/customer/reset-password', body);
  }

  // Change password
  static async changePassword(body: any): Promise<void> {
    await api.post('/store/customer/change-password', body);
  }

  // Get current user profile
  static async getCurrentUser(userId: string): Promise<User> {
    const response = await api.get<User>(`/customer/${userId}`);
    return response.data;
  }

  // Update user profile
  static async updateProfile(userId: string, profileData: any): Promise<User> {
    const response = await api.put<User>(`/customer/${userId}`, profileData);
    return response.data;
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  // Get stored token
  static getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Clear all auth data
  static clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }
}

export default AuthService;