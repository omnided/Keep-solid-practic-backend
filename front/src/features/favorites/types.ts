export type Genre = {
    user_id: number;
    book_id: number;
    added_at: string;
};

export type FavoriteBookRequest = {
    user_id: number;
};

export type FavoriteBook = {
    id: number;
    title: string;
    photo: string | null;
    published_year: number;
    description: string;
    genres: string[];
};

