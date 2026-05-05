"""
Recorta el Alfabeto Manual Argentino (LSA) en imagenes individuales por letra.
Imagen fuente: assets/img/Alfabeto-Manual-Argentino-LSA-CAS-1086x1536.png
Resolucion: 1086 x 1536 px
Layout: 5 columnas x 6 filas (fila 6 tiene solo 3 letras centradas)
"""

import sys, os
# Forzar UTF-8 en stdout para evitar errores en Windows
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from PIL import Image

# ── Rutas ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_PATH  = os.path.join(BASE_DIR, "assets", "img", "Alfabeto-Manual-Argentino-LSA-CAS-1086x1536.png")
OUT_DIR   = os.path.join(BASE_DIR, "assets", "alfabeto_lsa")
os.makedirs(OUT_DIR, exist_ok=True)

# ── Dimensiones de la imagen ────────────────────────────────────────────────
IMG_W, IMG_H = 1086, 1536

# Margenes externos del grid (px) — ajustados midiendo la imagen original
MARGIN_LEFT   = 25
MARGIN_RIGHT  = 25
MARGIN_TOP    = 90
MARGIN_BOTTOM = 50

# Filas 1-5: 5 col | Fila 6: 3 col centradas
COLS_MAIN = 5
ROWS      = 6

# Area util del grid
GRID_W = IMG_W - MARGIN_LEFT - MARGIN_RIGHT
GRID_H = IMG_H - MARGIN_TOP  - MARGIN_BOTTOM

# Alto de cada fila / ancho de cada celda
ROW_H  = GRID_H // ROWS
CELL_W = GRID_W // COLS_MAIN

# Letras del alfabeto LSA argentino en orden fila x columna
LETTERS = [
    # Fila 1
    "A", "B", "C", "CH", "D",
    # Fila 2
    "E", "F", "G", "H", "I",
    # Fila 3
    "J", "K", "L", "M", "N",
    # Fila 4
    "N", "O", "P", "Q", "R",
    # Fila 5
    "S", "T", "U", "V", "W",
    # Fila 6 (3 letras centradas en cols 1,2,3 de 5)
    "X", "Y", "Z",
]

# Nombres correctos (sobreescribe la lista anterior con los nombres reales)
LETTERS = [
    "A", "B", "C", "CH", "D",
    "E", "F", "G", "H", "I",
    "J", "K", "L", "M", "N",
    "Ñ", "O", "P", "Q", "R",
    "S", "T", "U", "V", "W",
    "X", "Y", "Z",
]

# Sin padding extra — las celdas ya estan bien delimitadas
PAD = 5

img = Image.open(SRC_PATH).convert("RGBA")
print(f"Imagen cargada: {img.size}")
print(f"CELL_W={CELL_W}  ROW_H={ROW_H}")

for idx, letter in enumerate(LETTERS):
    row = idx // COLS_MAIN
    col = idx % COLS_MAIN

    # Fila 6: X(col0), Y(col1), Z(col2) estan centradas visualmente
    # en la imagen, ocupan las columnas 1, 2, 3 (de 0 a 4)
    if row == 5:
        col_real = col + 1   # corrimiento de 1 celda a la derecha
        x1 = MARGIN_LEFT + col_real * CELL_W + PAD
    else:
        x1 = MARGIN_LEFT + col * CELL_W + PAD

    y1 = MARGIN_TOP + row * ROW_H + PAD
    x2 = x1 + CELL_W - PAD * 2
    y2 = y1 + ROW_H  - PAD * 2

    # Recorte
    crop = img.crop((x1, y1, x2, y2))

    # Nombre de archivo: A.png, B.png, CH.png, Ñ.png …
    filename = f"{letter}.png"
    out_path = os.path.join(OUT_DIR, filename)
    crop.save(out_path, "PNG")
    print(f"  [{idx+1:02d}] {letter:3s} -> {out_path}")

print(f"\n✅ {len(LETTERS)} letras guardadas en: {OUT_DIR}")
