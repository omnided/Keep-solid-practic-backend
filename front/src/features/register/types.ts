export type RegisterRequest = {
    username: string;
    email: string;
    password: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type User = {
    email: string;
    password: string;
};

export interface LoginResponse {
  token: string;
}