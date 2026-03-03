<?php

namespace App\Controller;

use App\Repository\FavoriteRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/favorites')]
class FavoriteController extends AbstractController
{
    public function __construct(
        private FavoriteRepository $favoriteRepository
    ) {}

    #[Route('', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        $favorites = $this->favoriteRepository->getUserFavorites($user->getId());
        return $this->json($favorites);
    }

    // ТЗ: "добавление книги в избранное - требует логин"
    #[Route('/{bookId}', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')] // Защищаем роут. ROLE_USER есть у всех залогиненных.
    public function addFavorite(int $bookId): JsonResponse
    {
        // Магия! Достаем текущего авторизованного пользователя
        $user = $this->getUser();

        // Пробуем добавить книгу
        $success = $this->favoriteRepository->add($user->getId(), $bookId);

        if (!$success) {
            return $this->json(['message' => 'Книга уже в избранном'], 400);
        }

        return $this->json(['message' => 'Книга добавлена в избранное'], 201);
    }

    // ТЗ: "удаление книги из избранного - требует логин + только свой список"
    #[Route('/{bookId}', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function removeFavorite(int $bookId): JsonResponse
    {
        $user = $this->getUser();

        // Мы передаем ID текущего юзера в запрос DELETE. 
        // Таким образом, юзер физически не сможет удалить чужую запись!
        $success = $this->favoriteRepository->remove($user->getId(), $bookId);

        if (!$success) {
            return $this->json(['message' => 'Книги нет в вашем избранном'], 404);
        }

        return $this->json(['message' => 'Книга удалена из избранного']);
    }
}