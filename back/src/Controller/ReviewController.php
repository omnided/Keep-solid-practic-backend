<?php

namespace App\Controller;

use App\Repository\ReviewRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

#[Route('/api/reviews')]
class ReviewController extends AbstractController
{ 
    public function __construct(
        private ReviewRepository $reviewRepository
    ) {}
    #[Route('/{id}', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function addReview(int $id, Request $request): JsonResponse
    {
        // 1. Достаем ID текущего пользователя из токена
        $user = $this->getUser();
        $userId = $user->getId();

        // 2. Читаем JSON, который прислал клиент
        $data = json_decode($request->getContent(), true);

        // Проверяем, что клиент прислал хотя бы оценку
        if (!isset($data['rating'])) {
            return $this->json(['message' => 'Необходимо указать оценку (rating)'], Response::HTTP_BAD_REQUEST);
        }
        
        $rating = (int) $data['rating'];
        $comment = $data['comment'] ?? null; // Комментарий может быть пустым

        // 3. Отправляем в базу
        $this->reviewRepository->addReview($id, $userId, $rating, $comment);

        return $this->json(['message' => 'Отзыв успешно добавлен!'], Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function getReviews(int $id): JsonResponse
    {
        $reviews = $this->reviewRepository->getReviewsForBook($id);
        return $this->json($reviews);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteReview(int $id, Request $request): JsonResponse
    {
        $user = $this->getUser();
        $userId = $user->getId();

        $success = $this->reviewRepository->deleteReview($id, $userId);

        if (!$success) {
            return $this->json(['message' => 'Отзыв не найден или не принадлежит вам'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['message' => 'Отзыв успешно удален']);
    }
}

?>
