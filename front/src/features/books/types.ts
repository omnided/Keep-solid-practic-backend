export type Book = {
  id: number;
  title: string;
  photo: string | null;
  published_year: number;
  description: string;
  genres: string[];
};

export type CreateBook = {
  title: string;
  description: string;
  published_year: number;
  genreNames: string[]; // Был genre_ids: number[]
  authors: { first_name: string; last_name: string }[];
};

export type DetailBook = {
  id: number;
  title: string;
  photo: string[] | null;
  published_year: number;
  description: string;
  genres: string[];
  authors: string[];
};