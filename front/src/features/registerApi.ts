import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from "../lib/axios";
import { RegisterRequest } from "./register/types";
import { User } from "./register/types";

const register = async (data: RegisterRequest): Promise<User> => {
  const response = await apiClient.post(`/register/`, data);
  return response.data.data;
};

export const useRegister = () => {
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      console.log("Registration successful");
      // Можна додати редірект на сторінку логіну або іншу дію
    },
    onError: (error) => {
      console.error("Registration failed:", error);
      // Тут можна додати тост з помилкою
    }
  });
};