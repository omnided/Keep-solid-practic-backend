import { createFileRoute } from "@tanstack/react-router";
import { BookPage } from "../../pages/BookPage"

export const Route = createFileRoute("/books/$id")({
  component: BookPage,
});