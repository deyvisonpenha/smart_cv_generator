// API Client for SmartCV Backend
// Handles authentication, requests, and type-safe responses

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Types
export interface User {
  id: number;
  email: string;
  subscription_tier: string;
  subscription_status: string;
  subscription_display: string;
  has_pro_access: boolean;
  trial_active: boolean;
  trial_ends_at: string | null;
  remaining_optimizations: number;
  created_at: string;
  updated_at: string;
}

export interface CV {
  id: number;
  slug: string;
  language: string;
  original_text: string;
  optimized_data: any;
  public_url: string;
  completeness: number;
  optimized: boolean;
  optimizations_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobDescription {
  id: number;
  title: string;
  company_name?: string;
  content: string;
  preview: string;
  created_at: string;
  stats?: {
    optimized_cvs_count: number;
    average_match_score: number;
  };
}

export interface Optimization {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  status_display: string;
  match_score: number | null;
  completion_percentage: number;
  processing_duration_humanized: string;
  can_retry: boolean;
  report?: {
    recommendations: string[];
    improvements: string[];
    strengths: string[];
    weaknesses: string[];
    keyword_matches: Record<string, number>;
    missing_skills: string[];
  };
  cv: {
    id: number;
    display_name: string;
  };
  job_description: {
    id: number;
    title: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
  meta?: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

// Token Management
const TOKEN_KEY = 'smartcv_jwt_token';

export const tokenManager = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  isExpired: (): boolean => {
    const token = tokenManager.get();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
};

// HTTP Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = tokenManager.get();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && !tokenManager.isExpired()) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'API request failed');
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data;
  }

  // Authentication
  async signup(email: string, password: string, password_confirmation: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, password_confirmation }),
    });
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<void> {
    await this.request('/logout', { method: 'DELETE' });
    tokenManager.remove();
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/current_user');
  }

  // CVs
  async getCVs(params?: { page?: number; per_page?: number; language?: string }): Promise<ApiResponse<CV[]>> {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<CV[]>>(`/cvs${queryString ? `?${queryString}` : ''}`);
  }

  async getCV(id: number): Promise<{ cv: CV }> {
    return this.request<{ cv: CV }>(`/cvs/${id}`);
  }

  async createCV(data: { original_text: string; language: string }): Promise<{ message: string; cv: CV }> {
    return this.request<{ message: string; cv: CV }>('/cvs', {
      method: 'POST',
      body: JSON.stringify({ cv: data }),
    });
  }

  async updateCV(id: number, data: Partial<CV>): Promise<{ message: string; cv: CV }> {
    return this.request<{ message: string; cv: CV }>(`/cvs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ cv: data }),
    });
  }

  async deleteCV(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/cvs/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateCV(id: number): Promise<{ message: string; cv: CV }> {
    return this.request<{ message: string; cv: CV }>(`/cvs/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Job Descriptions
  async getJobDescriptions(params?: { page?: number; per_page?: number; q?: string }): Promise<ApiResponse<JobDescription[]>> {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<JobDescription[]>>(`/job_descriptions${queryString ? `?${queryString}` : ''}`);
  }

  async getJobDescription(id: number): Promise<{ job_description: JobDescription }> {
    return this.request<{ job_description: JobDescription }>(`/job_descriptions/${id}`);
  }

  async createJobDescription(data: {
    title: string;
    content: string;
    company_name?: string;
  }): Promise<{ message: string; job_description: JobDescription }> {
    return this.request<{ message: string; job_description: JobDescription }>('/job_descriptions', {
      method: 'POST',
      body: JSON.stringify({ job_description: data }),
    });
  }

  async updateJobDescription(id: number, data: Partial<JobDescription>): Promise<{ message: string; job_description: JobDescription }> {
    return this.request<{ message: string; job_description: JobDescription }>(`/job_descriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ job_description: data }),
    });
  }

  async deleteJobDescription(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/job_descriptions/${id}`, {
      method: 'DELETE',
    });
  }

  // Optimizations
  async getOptimizations(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    cv_id?: number;
  }): Promise<ApiResponse<Optimization[]>> {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<Optimization[]>>(`/optimizations${queryString ? `?${queryString}` : ''}`);
  }

  async getOptimization(id: number): Promise<{ optimization: Optimization }> {
    return this.request<{ optimization: Optimization }>(`/optimizations/${id}`);
  }

  async createOptimization(data: {
    cv_id: number;
    job_description_id: number;
  }): Promise<{ message: string; optimization: Optimization }> {
    return this.request<{ message: string; optimization: Optimization }>('/optimizations', {
      method: 'POST',
      body: JSON.stringify({ optimization: data }),
    });
  }

  async getOptimizationStatus(id: number): Promise<{
    id: number;
    status: string;
    completion_percentage: number;
    match_score: number | null;
  }> {
    return this.request(`/optimizations/${id}/status`);
  }

  async regenerateOptimization(id: number): Promise<{ message: string; optimization: Optimization }> {
    return this.request<{ message: string; optimization: Optimization }>(`/optimizations/${id}/regenerate`, {
      method: 'POST',
    });
  }

  async cancelOptimization(id: number): Promise<{ message: string; optimization: Optimization }> {
    return this.request<{ message: string; optimization: Optimization }>(`/optimizations/${id}/cancel`, {
      method: 'POST',
    });
  }

  async getOptimizationStats(): Promise<{ stats: any }> {
    return this.request<{ stats: any }>('/optimizations/stats');
  }

  // Dashboard
  async getDashboard(): Promise<any> {
    return this.request('/dashboard');
  }

  async getDashboardStats(): Promise<any> {
    return this.request('/dashboard/stats');
  }

  // Interactions
  async getInteractions(params?: { category?: string; q?: string }): Promise<ApiResponse<any[]>> {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<any[]>>(`/interactions${queryString ? `?${queryString}` : ''}`);
  }

  async createInteraction(data: {
    question: string;
    answer: string;
    category?: string;
  }): Promise<any> {
    return this.request('/interactions', {
      method: 'POST',
      body: JSON.stringify({ interaction: data }),
    });
  }

  async getInteractionCategories(): Promise<any> {
    return this.request('/interactions/categories');
  }

  async searchInteractions(query: string): Promise<any> {
    return this.request(`/interactions/search?q=${encodeURIComponent(query)}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export default
export default apiClient;
