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
        return [
            Events::JWT_CREATED => 'onJWTCreated',
        ];
    }

    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }
        $payload = $event->getData();

        $payload['id'] = $user->getId();
        
        $payload['username'] = $user->getName();
        $payload['email'] = $user->getEmail();
        $payload['roles'] = $user->getRoles();

        $event->setData($payload);
    }
}