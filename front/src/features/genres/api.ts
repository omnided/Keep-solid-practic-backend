import { useQuery } from '@tanstack/react-query';
import apiClient from "../../lib/axios";
import { Genre } from "./types";
import { Author } from "./types";

const getGenres = async (): Promise<Genre[]> => {
  const response = await apiClient.get('/genre');
  return response.data;
};

const getAuthors = async (): Promise<Author[]> => {
  const response = await apiClient.get('/author');
  return response.data;
};  

export const useGenres = () => useQuery<Genre[]>({ queryKey: ['genres'], queryFn: getGenres });

export const useAuthors = () => useQuery<Author[]>({ queryKey: ['authors'], queryFn: getAuthors });
