import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const TestEnvAPI = import.meta.env.VITE_API_URL;

function createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
        baseURL: TestEnvAPI,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
    });

    // Response interceptor for error handling
    instance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            // Handle 401 errors (unauthorized)
            if (error.response?.status === 401) {
                // Clear auth state and redirect to login
                useAuthStore.getState().logout();
            }
            return Promise.reject(error);
        }
    );

    return instance;
}

export class BaseApi {
    axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = createAxiosInstance();
    }

    insertToken(): AxiosInstance {
        const token = useAuthStore.getState().token;
        if (token) {
            this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.axiosInstance.defaults.headers.common['Authorization'];
        }
        return this.axiosInstance;
    }

    // Helper method to handle API errors consistently
    protected handleError(error: AxiosError): never {
        if (error.response?.data) {
            throw error.response.data;
        }
        throw {
            success: false,
            message: error.message || 'An unexpected error occurred',
            errors: [error.message || 'Network error'],
        };
    }
}
