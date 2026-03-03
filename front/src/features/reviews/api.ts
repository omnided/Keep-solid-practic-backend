import { review, CreateReviewRequest } from './types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import apiClient from "../../lib/axios"; // Використовуємо абсолютний імпорт

export interface CreateReviewPayload {
    id: number;
    // Предполагаю, что из запроса мы выкидываем id, так как он идет в URL
    newReview: Omit<CreateReviewRequest, 'id'>; 
}

const getReviewsForBook = async (id: number): Promise<review[]> => {
    const response = await apiClient.get(`/reviews/${id}`);
    return response.data;
};

const createReview = async (payload: CreateReviewPayload): Promise<review> => {
    // Распаковываем данные внутри
    const { id, newReview } = payload;
    
    // Делаем запрос к твоему идеальному Symfony API
    const response = await apiClient.post(`/reviews/${id}`, newReview);
    
    return response.data;
}

export const useReviewsForBook = (bookId: number) => useQuery<review[]>({ queryKey: ['reviews', bookId], queryFn: () => getReviewsForBook(bookId) });

export const useCreateReview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createReview,   
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
        }
    });
}