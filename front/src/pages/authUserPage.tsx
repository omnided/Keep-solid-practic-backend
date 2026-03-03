import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoginUser } from '../features/authApi';

const authSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password must be at least 6 characters long'),
});
type AuthFormData = z.infer<typeof authSchema>;

export function AuthUserPage() {
    const loginUserMutation = useLoginUser();
    const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
        resolver: zodResolver(authSchema),
    });

    const onSubmit = (data: AuthFormData) => {
        const payload = {
            email: data.email,
            password: data.password,
        }
        loginUserMutation.mutate(payload);

    };
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">User Authentication</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                <div>
                    <label htmlFor="email" className="block font-medium">Email</label>
                    <input
                        id="email"
                        type="email"
                        {...register('email')}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                    <label htmlFor="password" className="block font-medium">Password</label>
                    <input
                        id="password"
                        type="password"
                        {...register('password')}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>
                <button 
                    type="submit" 
                    disabled={loginUserMutation.isPending} 
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                    {loginUserMutation.isPending ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}