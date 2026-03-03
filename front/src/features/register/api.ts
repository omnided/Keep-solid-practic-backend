import { RegisterRequest, LoginRequest, LoginResponse } from './types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import apiClient from "../../lib/axios"; // Використовуємо абсолютний імпорт
import { useAuthStore } from '../authStore';

const registerUser = async (data: RegisterRequest): Promise<void> => {
    await apiClient.post('/register', data);
};

const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/login', data);
    return response.data;
};

export const useRegister = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    return useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
            navigate({ to: '/auth/login' });
        },
    });
};

export const useLogin = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate(); // Получаем navigate внутри хука
    const  setToken = useAuthStore((state) => state.setToken);
    return useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
            if (data.token) {
                setToken(data.token);
            }
            navigate({ to: '/books/books' });
        },
    });
};