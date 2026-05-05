
Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\Users\Ramoncito\.antigravity\UYARIY-SUMAK\assets\img\Alfabeto-Manual-Argentino-LSA-CAS-1086x1536.png"
$outputPath = "c:\Users\Ramoncito\.antigravity\UYARIY-SUMAK\assets\alphabet_test\"

if (!(Test-Path $outputPath)) { New-Item -ItemType Directory -Path $outputPath }

$img = [System.Drawing.Image]::FromFile($sourcePath)

# Configuración de la grilla (Ajustada)
$startX = 30
$startY = 180
$cellW = 210
$cellH = 205

$alphabet = @(
    @("a", "b", "c", "ch", "d"),
    @("e", "f", "g", "h", "i"),
    @("j", "k", "l", "m", "n"),
    @("nn", "o", "p", "q", "r"),
    @("s", "t", "u", "v", "w"),
    @("x", "y", "z")
)

for ($row = 0; $row -lt $alphabet.Length; $row++) {
    for ($col = 0; $col -lt $alphabet[$row].Length; $col++) {
        $char = $alphabet[$row][$col]
        
        $x = $startX + ($col * $cellW)
        $y = $startY + ($row * $cellH)
        
        # Ajustes especiales
        if ($row -eq 4) {
            if ($col -ge 3) { $x += 20 } # Ajuste para V y W
        }
        if ($row -eq 5) {
            $x += $cellW # Desplazar a las columnas centrales
            $y += 40    # Bajar un poco por los labels de la fila superior
        }
        
        $rect = New-Object System.Drawing.Rectangle($x, $y, 200, 200)
        $bmp = New-Object System.Drawing.Bitmap(200, 200)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        
        $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, 200, 200)), $rect, [System.Drawing.GraphicsUnit]::Pixel)
        
        $savePath = Join-Path $outputPath "$char.png"
        $bmp.Save($savePath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $g.Dispose()
        $bmp.Dispose()
        Write-Host "Guardado: $char.png (x=$x, y=$y)"
    }
}

$img.Dispose()
Write-Host "¡Proceso de prueba completado!"
