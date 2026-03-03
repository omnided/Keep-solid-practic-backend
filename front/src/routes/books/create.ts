import { createFileRoute } from '@tanstack/react-router'
import { CreateBookPage } from '../../pages/CreateBookPage'

export const Route = createFileRoute('/books/create')({
  component: CreateBookPage,
})