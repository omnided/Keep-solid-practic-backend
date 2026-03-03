export type review = {
    id: number;
    username: string;
    photo: string | null;
    rating: number;
    comment: string;
    created_at: string;
    user_email: string;
};

export type CreateReviewRequest = {
    user_id: number;
    rating: number;
    comment: string;
};