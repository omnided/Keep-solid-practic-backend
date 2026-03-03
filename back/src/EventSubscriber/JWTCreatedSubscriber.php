<?php

namespace App\EventSubscriber;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
// Замени на путь к твоей сущности User, если она лежит в другом месте
use App\Security\User; 

class JWTCreatedSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        // Говорим Symfony: "Когда будешь создавать JWT токен, вызови метод onJWTCreated"
        return [
            Events::JWT_CREATED => 'onJWTCreated',
        ];
    }

    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        // 1. Достаем юзера, для которого сейчас генерируется токен
        $user = $event->getUser();

        // Если это не наш юзер (а, например, админ из другой таблицы), ничего не делаем
        if (!$user instanceof User) {
            return;
        }

        // 2. Достаем текущую начинку токена (там сейчас только username/email и роли)
        $payload = $event->getData();

        // 3. ДОБАВЛЯЕМ СВОИ ПОЛЯ! 
        // Вызывай геттеры из твоего класса User
        $payload['id'] = $user->getId();
        
        // Можешь добавить что угодно, хоть имя, хоть аватарку:
        $payload['username'] = $user->getName();
        $payload['email'] = $user->getEmail();
        $payload['roles'] = $user->getRoles();

        // 4. Запихиваем обновленную начинку обратно в токен
        $event->setData($payload);
    }
}