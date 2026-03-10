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

    #[Route('/{bookId}', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')] 
    public function addFavorite(int $bookId): JsonResponse
    {
        $user = $this->getUser();

        $success = $this->favoriteRepository->add($user->getId(), $bookId);

        if (!$success) {
            return $this->json(['message' => 'Книга уже в избранном'], 400);
        }

        return $this->json(['message' => 'Книга добавлена в избранное'], 201);
    }

    #[Route('/{bookId}', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function removeFavorite(int $bookId): JsonResponse
    {
        $user = $this->getUser();
        $success = $this->favoriteRepository->remove($user->getId(), $bookId);

        if (!$success) {
            return $this->json(['message' => 'Книги нет в вашем избранном'], 404);
        }

        return $this->json(['message' => 'Книга удалена из избранного']);
    }
}