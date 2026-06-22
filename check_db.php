<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$f = \App\Models\A10::find(1);
if ($f) {
    file_put_contents('a10_db_dump.json', json_encode($f->form_a10, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo "Dumped form_a10 of ID 1 to a10_db_dump.json\n";
} else {
    echo "No A10 found with ID 1\n";
}
