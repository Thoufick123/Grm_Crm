<?php
/**
 * AudioConversionService
 * Manages audio storage, validation, format conversions, and metadata extraction.
 * Ensures compatibility between browser MediaRecorder (webm/ogg) and WhatsApp PTT.
 */

class AudioConversionService {
    private $baseUploadDir;
    private $ffmpegPath;

    public function __construct() {
        $this->baseUploadDir = dirname(__DIR__) . '/uploads/voice';
        $this->ensureDirectories();
        $this->ffmpegPath = $this->detectFFmpeg();
    }

    private function ensureDirectories() {
        $dirs = [
            $this->baseUploadDir,
            $this->baseUploadDir . '/original',
            $this->baseUploadDir . '/translated',
            $this->baseUploadDir . '/temp'
        ];
        foreach ($dirs as $dir) {
            if (!is_dir($dir)) {
                @mkdir($dir, 0777, true);
            }
        }
    }

    private function detectFFmpeg() {
        $paths = [
            dirname(__DIR__) . '/bridge/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe',
            'C:\\xampp\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'ffmpeg'
        ];
        foreach ($paths as $p) {
            if ($p === 'ffmpeg') {
                $out = @shell_exec('ffmpeg -version 2>&1');
                if ($out && strpos($out, 'ffmpeg version') !== false) {
                    return 'ffmpeg';
                }
            } elseif (file_exists($p)) {
                return $p;
            }
        }
        return null;
    }

    /**
     * Save uploaded file or base64 audio data to storage
     */
    public function saveUploadedAudio($fileOrData, $subfolder = 'original', $extension = 'webm') {
        $fileName = 'voice_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
        $targetPath = $this->baseUploadDir . '/' . $subfolder . '/' . $fileName;

        if (is_array($fileOrData) && isset($fileOrData['tmp_name'])) {
            if (!move_uploaded_file($fileOrData['tmp_name'], $targetPath)) {
                if (!copy($fileOrData['tmp_name'], $targetPath)) {
                    throw new Exception("Failed to move uploaded audio file.");
                }
            }
        } elseif (is_string($fileOrData)) {
            // Check if base64 data URI
            if (preg_match('/^data:audio\/([a-zA-Z0-9_\-]+);base64,/', $fileOrData, $matches)) {
                $fileOrData = substr($fileOrData, strpos($fileOrData, ',') + 1);
            }
            $binary = base64_decode($fileOrData);
            if ($binary === false || strlen($binary) === 0) {
                throw new Exception("Invalid base64 audio data.");
            }
            file_put_contents($targetPath, $binary);
        } else {
            throw new Exception("Unsupported audio payload.");
        }

        $relativePath = 'uploads/voice/' . $subfolder . '/' . $fileName;
        return [
            'full_path' => $targetPath,
            'relative_path' => $relativePath,
            'file_name' => $fileName,
            'duration' => $this->estimateAudioDuration($targetPath)
        ];
    }

    /**
     * Estimate audio duration in seconds
    /**
     * Executes FFmpeg command reliably across Windows and Linux (handles paths with spaces)
     */
    private function executeFFmpegCmd($args) {
        if (!$this->ffmpegPath) return null;
        $desc = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w']
        ];
        $cmd = '"' . $this->ffmpegPath . '" ' . $args;
        $proc = @proc_open($cmd, $desc, $pipes);
        if (is_resource($proc)) {
            $stdout = stream_get_contents($pipes[1]);
            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[0]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            proc_close($proc);
            return $stdout . "\n" . $stderr;
        }
        return null;
    }

    /**
     * Estimate audio duration in seconds
     */
    public function estimateAudioDuration($filePath, $quickOnly = false) {
        if (!file_exists($filePath)) return 5.0;
        $size = filesize($filePath);
        if ($size <= 0) return 1.0;

        // Quick calculation without spawning child process (32kbps mono audio = 4000 bytes/sec)
        if ($quickOnly) {
            $estimatedSec = round($size / 4000, 1);
            return max(1.0, min(120.0, $estimatedSec));
        }

        // If FFmpeg available, get precise duration
        if ($this->ffmpegPath) {
            $output = $this->executeFFmpegCmd('-i "' . $filePath . '"');
            if ($output && preg_match('/Duration: (\\d{2}):(\\d{2}):(\\d{2}\\.\\d{2})/', $output, $m)) {
                $hours = (float)$m[1];
                $mins = (float)$m[2];
                $secs = (float)$m[3];
                return round(($hours * 3600) + ($mins * 60) + $secs, 2);
            }
        }

        // Reasonable estimation for opus/webm (~32kbps bitrate)
        $estimatedSec = round($size / 4000, 1);
        return max(1.0, min(120.0, $estimatedSec));
    }

    /**
     * Convert audio to WhatsApp PTT compatible opus/ogg if needed
     */
    public function convertToWhatsAppAudio($sourcePath, &$outDuration = null) {
        if (!file_exists($sourcePath)) return $sourcePath;

        $ext = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
        if ($ext === 'ogg' || $ext === 'opus') {
            return $sourcePath;
        }

        if ($this->ffmpegPath) {
            $targetPath = preg_replace('/\.[^.]+$/', '.ogg', $sourcePath);
            $output = $this->executeFFmpegCmd('-y -i "' . $sourcePath . '" -c:a libopus -b:a 32k -ar 48000 -ac 1 "' . $targetPath . '"');
            if ($output && preg_match('/Duration: (\\d{2}):(\\d{2}):(\\d{2}\\.\\d{2})/', $output, $m)) {
                $hours = (float)$m[1];
                $mins = (float)$m[2];
                $secs = (float)$m[3];
                $outDuration = round(($hours * 3600) + ($mins * 60) + $secs, 2);
            }
            if (file_exists($targetPath) && filesize($targetPath) > 0) {
                return $targetPath;
            }
        }

        return $sourcePath;
    }
}

