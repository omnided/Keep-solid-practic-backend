<?php

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, Origin, X-Requested-With');

// 2. УБИВАЕМ PREFLIGHT-ЗАПРОС ДО ТОГО, КАК ОН ДОЙДЕТ ДО ФРЕЙМВОРКА
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // 204 No Content - идеальный статус для OPTIONS
    exit;
}

use App\Kernel;

require_once dirname(__DIR__).'/vendor/autoload_runtime.php';


return function (array $context) {
    return new Kernel($context['APP_ENV'], (bool) $context['APP_DEBUG']);
};
