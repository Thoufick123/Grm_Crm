<?php
$target = 'http://localhost/crm-app/api.php?action=upload_product_image';
$testFile = __DIR__ . '/test.png';
// Create a small 10x10 PNG
$img = imagecreatetruecolor(10, 10);
imagepng($img, $testFile);
imagedestroy($img);

$cfile = new CURLFile($testFile, 'image/png', 'test.png');
$ch = curl_init($target);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['image' => $cfile]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
unlink($testFile);
echo "CODE: $httpCode\nBODY: $res\n";
