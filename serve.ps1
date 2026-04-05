$root = 'C:\Users\Admin\Documents\tech---premi\tech---premi-main'
$prefix = 'http://localhost:8000/'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $root on $prefix"
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $path = $request.Url.AbsolutePath.TrimStart('/').Replace('/', '\')
        if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }
        $filePath = Join-Path $root $path
        if (-not (Test-Path $filePath -PathType Leaf)) {
            $response.StatusCode = 404
            $response.ContentType = 'text/plain'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
            $response.OutputStream.Write($buffer,0,$buffer.Length)
            $response.Close()
            continue
        }
        switch ([IO.Path]::GetExtension($filePath).ToLower()) {
            '.html' { $response.ContentType = 'text/html' }
            '.css' { $response.ContentType = 'text/css' }
            '.js' { $response.ContentType = 'application/javascript' }
            '.svg' { $response.ContentType = 'image/svg+xml' }
            '.png' { $response.ContentType = 'image/png' }
            '.jpg' { $response.ContentType = 'image/jpeg' }
            '.jpeg' { $response.ContentType = 'image/jpeg' }
            '.json' { $response.ContentType = 'application/json' }
            default { $response.ContentType = 'application/octet-stream' }
        }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes,0,$bytes.Length)
        $response.Close()
    } catch {
        Write-Error $_
    }
}
$listener.Stop()
