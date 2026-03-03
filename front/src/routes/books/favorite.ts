import { createFileRoute } from '@tanstack/react-router'
import { FavoritesPage } from '../../pages/FavoritesPage'

export const Route = createFileRoute('/books/favorite')({
  component: FavoritesPage,
})