import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import apiClient from "../../lib/axios";
import { Book } from "./types";
import { CreateBook } from "./types";
import { DetailBook } from "./types";

const getBooks = async (): Promise<Book[]> => {
  const response = await apiClient.get('/books');
  return response.data;
};

const getBookById = async (id: number): Promise<DetailBook> => {
  const response = await apiClient.get(`/books/${id}`);
  return response.data;
};

const listGenres = async (): Promise<string[]> => {
    const response = await apiClient.get('/books/genres');
    return response.data;
};

const uploadBookPhoto = async ({ id, formData }: { id: number; formData: FormData }): Promise<void> => {
    // Axios сам поставит нужный Content-Type для FormData
    await apiClient.post(`/books/${id}/photo`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

const listAuthors = async (): Promise<string[]> => {
    const response = await apiClient.get('/books/authors');
    return response.data;
};

const getBookAverageRating = async (id: number): Promise<number> => {
    const response = await apiClient.get(`/books/${id}/rating`);
    return response.data;
};

const createBook = async (newBook: CreateBook): Promise<Book> => {
    const response = await apiClient.post('/books', newBook);
    return response.data;
};

const uploadCsv = async (): Promise<void> => {
    await apiClient.get('/export/csv', {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

const deleteBook = async (id: number): Promise<void> => {
    await apiClient.delete(`/books/${id}`);
};

const deleteBookPhoto = async ({ bookId, url }: { bookId: number; url: string }): Promise<void> => {
    await apiClient.delete(`/books/${bookId}/photo`, { 
        data: { url } 
    });
};

export const useDeleteBookPhoto = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBookPhoto,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['books', variables.bookId] });
        },
    });
};

export const useBooks = () => useQuery<Book[]>({ queryKey: ['books'], queryFn: getBooks });

export const useBook = (id: number) => useQuery<DetailBook>({ queryKey: ['books', id], queryFn: () => getBookById(id) });

export const useBookAverageRating = (id: number) => useQuery<number>({ queryKey: ['books', id, 'rating'], queryFn: () => getBookAverageRating(id) });

export const useGenres = () => useQuery<string[]>({ queryKey: ['genres'], queryFn: listGenres });

export const useAuthors = () => useQuery<string[]>({ queryKey: ['authors'], queryFn: listAuthors });

const exportBooksCsv = async (): Promise<Blob> => {
    // ВАЖНО: responseType: 'blob' говорит Axios, что мы качаем бинарный файл, а не JSON
    const response = await apiClient.get('/books/export/csv', { // <-- Замени на свой реальный URL роута
        responseType: 'blob', 
    });
    return response.data;
};

// 2. React Query Хук
export const useExportBooksCsv = () => {
    return useMutation({
        mutationFn: exportBooksCsv,
        onSuccess: (data) => {
            // Создаем виртуальную ссылку на скачанный файл в памяти браузера
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Имя файла (можешь поменять на любое)
            link.setAttribute('download', 'catalog.csv'); 
            
            // "Невидимо" кликаем по ссылке, чтобы начать скачивание
            document.body.appendChild(link);
            link.click();
            
            // Убираем за собой мусор
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        },
        onError: () => {
            alert('Не удалось сформировать архив. Инквизиция перехватила свиток!');
        }
    });
};


export const useUploadBookPhoto = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: uploadBookPhoto,
        onSuccess: (_, variables) => {
            // Инвалидируем кэш конкретной книги и общего списка, чтобы фото обновилось сразу
            queryClient.invalidateQueries({ queryKey: ['books', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};

export const useUploadCsv = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: uploadCsv,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};

export const useCreateBook = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    return useMutation({
        mutationFn: createBook,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            navigate({to: '/books/books'});
        },
    });
};

export const useDeleteBook = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBook,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};