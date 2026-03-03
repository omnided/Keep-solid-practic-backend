<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use App\Repository\UserRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Security\User;

class AuthController extends AbstractController
{
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(#[CurrentUser] ?User $user): JsonResponse
    {

        if (null === $user) {
            return $this->json(['message' => 'Missing credentials'], 401);
        }

        // 3. Возвращаем успешный ответ (позже мы добавим сюда выдачу JWT-токена)
        return $this->json([
            'message' => 'Успешный вход!',
            'user'  => $user->getUserIdentifier(),
            'roles' => $user->getRoles(),
        ]);
    }

    #[Route('/api/user-info/{id}', name: 'api_user_info', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getUserInfo(int $id, UserRepository $userRepository, #[CurrentUser] ?User $currentUser): JsonResponse
    {
        // Передаем id из URL напрямую в метод репозитория
        if ($currentUser->getId() !== $id) {
        return $this->json(['message' => 'Forbidden'], 403);
        }
        $userInfo = $userRepository->getUserInfo($id);

        // Если пользователь с таким ID не найден
        if (!$userInfo) {
            return $this->json(['message' => 'User not found'], 404);
        }

        return $this->json($userInfo);
    }

    #[Route('/api/users/{id}/avatar', methods: ['POST'])]
    #[IsGranted('ROLE_USER')] // Защита, чтобы только авторизованные грузили фото
    public function uploadAvatar(int $id, Request $request): JsonResponse
    {
        // 1. Ловим файл из запроса. Обрати внимание: используем ->files, а не ->request
        // 'avatar' — это ключ, по которому фронтенд или Postman пришлет файл
        $file = $request->files->get('avatar');

        if (!$file) {
            return $this->json(['error' => 'Пожалуйста, прикрепите файл'], 400);
        }

        // 2. Генерируем уникальное имя файла
        // Почему? Если два юзера загрузят файл 'me.jpg', второй перезапишет первого.
        // uniqid() создаст что-то вроде '653b8f9a.jpg'
        $extension = $file->guessExtension(); // Умная функция: сама поймет, это png, jpg или gif
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        if (!in_array($extension, $allowedExtensions)) {
            return $this->json(['error' => 'Недопустимый формат файла. Разрешены: jpg, jpeg, png, webp'], 400);
        }
        $newFilename = uniqid() . '.' . $extension;

        // 3. Указываем папку, куда физически положить файл на сервере
        // $this->getParameter('kernel.project_dir') — это путь к корню твоего проекта
        $destination = $this->getParameter('kernel.project_dir') . '/public/uploads/avatars';

        try {
            // 4. ФИЗИЧЕСКИ перемещаем загруженный файл в нашу папку
            $file->move($destination, $newFilename);
            
            // 5. Формируем путь, который будем сохранять в БД и отдавать на фронтенд
            $publicUrl = '/uploads/avatars/' . $newFilename;

            // 6. МАГИЯ БАЗЫ: здесь мы вызываем твой UserPhotoRepository 
            // и передаем туда ID юзера и наш новенький текстовый URL
            $this->userPhotoRepository->addPhoto($id, $publicUrl);

            return $this->json([
                'message' => 'Аватарка успешно загружена!',
                'url' => $publicUrl
            ], 201);

        } catch (\Exception $e) {
            // Если на сервере кончилось место или нет прав на папку
            return $this->json(['error' => 'Ошибка при сохранении файла'], 500);
        }
    }

    #[Route('/api/register', methods: ['POST'])]
    public function register(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher // Тот самый встроенный хэшатор Symfony
    ): JsonResponse {
        // 1. Достаем данные из JSON-запроса
        $data = json_decode($request->getContent(), true);
        $name = $data['username'] ?? null;
        $email = $data['email'] ?? null;
        $plainPassword = $data['password'] ?? null;

        // Базовая валидация
        if (!$email || !$plainPassword) {
            return $this->json(['error' => 'Email и пароль обязательны'], 400);
        }

        if ($userRepository->nameExists($name)) {
            return $this->json(['error' => 'Пользователь с таким username уже существует'], 409);
        }

        if ($userRepository->emailExists($email)) {
            return $this->json(['error' => 'Пользователь с таким email уже существует'], 409);
        }

        // 2. Достаем ID роли 'client'. (Убедись, что такая запись есть в таблице roles!)
        $roleId = $userRepository->getClientRoleId();
        if (!$roleId) {
            return $this->json(['error' => 'Ошибка сервера: Роль клиента не найдена'], 500);
        }

        // 3. Хэшируем пароль. 
        // Хэшеру нужен объект нашего User, чтобы понять, какой алгоритм использовать из security.yaml
        $tempUser = new User(0, (string)$name, $email, '');
        $hashedPassword = $passwordHasher->hashPassword($tempUser, $plainPassword);

        // 4. Сохраняем в базу данных через репозиторий
        $newUserId = $userRepository->create($name, $email, $hashedPassword);

        return $this->json([
            'message' => 'Регистрация прошла успешно!',
            'user_id' => $newUserId
        ], 201);
    }
}