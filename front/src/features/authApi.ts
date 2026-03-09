import apiClient from '../lib/axios';
import { User } from './doctors/types'; // Твой тип для логина (username, password)
import { useAuthStore } from './authStore'; // <--- Убедись, что файл создан (пункт 1)
import { useMutation } from '@tanstack/react-query';

// Тип данных для входа (обычно только username и password)
// Required<User> подойдет, если User содержит эти поля
const loginUser = async (data: Required<Pick<User, 'email' >>): Promise<string> => {
    const response = await apiClient.post('/auth/login', data);
    
    // response.data.data - это JWT строка
    const token = response.data.data;
    
    // Сохраняем в стор (Zustand сам декодирует юзера внутри setToken)
    useAuthStore.getState().setToken(token);
    
    return token;  
} 

export const useLoginUser = () => {

    return useMutation({
        mutationFn: loginUser,
        onSuccess: () => {
            console.log("Login successful");
            // После логина редиректим на главную или в дашборд
        },
        onError: (error) => {
            console.error("Login failed:", error);
            // Тут можно добавить тост с ошибкой
        }
    });
}

export const useAuth = () => {
  // Достаем нужные поля из стора
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  // Возвращаем объект, который ожидает твой Header и HomePage
  return {
    user,         // Объект пользователя (с role, username)
    isAuth: !!token, // Булевое значение (авторизован или нет)
    token,
    logout,
  };
};