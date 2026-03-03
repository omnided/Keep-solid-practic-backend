import { userInfo } from './types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import apiClient from "../../lib/axios"; // Використовуємо абсолютний імпорт

const getUserInfo = async (id: number): Promise<userInfo> => {
  const response = await apiClient.get(`/user-info/${id}`);
  return response.data;
};

export const useUserInfo = (id: number | null) => 
  useQuery<userInfo>({ 
    queryKey: ['user', id], 
    queryFn: () => getUserInfo(id!),
    enabled: !!id, // Передаем флаг внутрь React Query
  });