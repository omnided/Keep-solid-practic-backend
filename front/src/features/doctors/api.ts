import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import apiClient from "../../lib/axios"; // Використовуємо абсолютний імпорт
import { doctor } from "./types"; // Описуємо тип в окремому файлі
import { MutateDoctorRequest } from "./types"; // Імпортуємо типи

// Функції для API-запитів
const getDoctors = async (): Promise<doctor[]> => {
  const response = await apiClient.get('/doctor');
  return response.data.data;
};

const getDoctorById = async (id: number): Promise<doctor> => {
  const response = await apiClient.get(`/doctor/${id}`);
  return response.data.data;
};

const createDoctor = async (newDoctor: Omit<MutateDoctorRequest, 'id'>): Promise<MutateDoctorRequest> => {
    const response = await apiClient.post('/doctor', newDoctor);
    return response.data.data;
};

const updateDoctor = async ({ id, data }: { id: number, data: Partial<MutateDoctorRequest> }): Promise<MutateDoctorRequest> => {

    const response = await apiClient.put(`/doctor/${id}`, data);
    return response.data.data;
};


const deleteDoctor = async (id: number): Promise<void> => {
    await apiClient.delete(`/doctor/${id}`);
};
export const useDoctors = () => useQuery<doctor[]>({ queryKey: ['doctors'], queryFn: getDoctors });

export const useDoctor = (id: number) => useQuery<doctor>({ queryKey: ['doctors', id], queryFn: () => getDoctorById(id) });
export const useCreateDoctor = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: createDoctor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            navigate({ to: '/doctors/doctors' });
        },
    });
};

export const useUpdateDoctor = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: updateDoctor,
        onSuccess: (updatedDoctor) => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            queryClient.setQueryData(['doctors', updatedDoctor.id], updatedDoctor);
            navigate({ to: '/doctors/doctors' });
        },
    });
};

export const useDeleteDoctor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteDoctor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
        },
    });
};

