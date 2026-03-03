import { FavoriteBook, FavoriteBookRequest } from './types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import apiClient from "../../lib/axios"; // Використовуємо абсолютний імпорт


const getFavoriteBooks = async (): Promise<FavoriteBook[]> => {
    const response = await apiClient.get('/favorites');
    return response.data;
};

const addFavoriteBook = async (bookId: number): Promise<void> => {
    const response = await apiClient.post(`/favorites/${bookId}`);
    return response.data;
};

export const useAddFavoriteBook = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    return useMutation({
        mutationFn: (bookId: number) => addFavoriteBook(bookId), // Здесь нужно передать реальные данные
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favoriteBooks'] });
        },
    });
};

const deleteFavoriteBook = async (id: number): Promise<void> => {
    await apiClient.delete(`/favorites/${id}`);
};

export const useDeleteFavoriteBook = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteFavoriteBook,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favoriteBooks'] });
            
        },
    });
};

export const useFavoriteBooks = () => useQuery<FavoriteBook[]>({ queryKey: ['favoriteBooks'], queryFn: getFavoriteBooks });