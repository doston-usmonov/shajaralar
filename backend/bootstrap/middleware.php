<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;

return function (Middleware $middleware, Application $app) {
    // API routes should not use CSRF protection in this app
    $middleware->validateCsrfTokens(except: [
        'api/*',
        '*' // Temporarily disable all CSRF checks
    ]);
};
