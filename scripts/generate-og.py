"""Generates the Elenos social/OG preview card (1200x630) as PNG + JPG."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random
import os

W, H = 1200, 630
BG = (0, 0, 0)
INK = (255, 255, 255)
INK_MUTE = (170, 170, 190)
INK_FAINT = (120, 120, 140)
ACCENT = (162, 0, 255)
ACCENT_LIGHT = (196, 102, 255)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "images")
os.makedirs(OUT_DIR, exist_ok=True)

GEORGIA = "C:/Windows/Fonts/georgia.ttf"
GEORGIA_I = "C:/Windows/Fonts/georgiai.ttf"
ARIAL = "C:/Windows/Fonts/arial.ttf"
ARIAL_B = "C:/Windows/Fonts/arialbd.ttf"

img = Image.new("RGB", (W, H), BG)

# Soft purple radial glow, upper-right
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
cx, cy = int(W * 0.82), int(H * 0.22)
max_r = 520
for r in range(max_r, 0, -8):
    t = r / max_r
    alpha = int(55 * (1 - t) ** 2)
    gd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(162, 0, 255, alpha))
glow = glow.filter(ImageFilter.GaussianBlur(60))
img.paste(glow, (0, 0), glow)

# Second, subtler glow, lower-left
glow2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
g2d = ImageDraw.Draw(glow2)
cx2, cy2 = int(W * 0.1), int(H * 0.9)
for r in range(420, 0, -8):
    t = r / 420
    alpha = int(32 * (1 - t) ** 2)
    g2d.ellipse((cx2 - r, cy2 - r, cx2 + r, cy2 + r), fill=(140, 60, 220, alpha))
glow2 = glow2.filter(ImageFilter.GaussianBlur(70))
img.paste(glow2, (0, 0), glow2)

# Stars
random.seed(7)
stars = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(stars)
for _ in range(140):
    x = random.randint(0, W)
    y = random.randint(0, H)
    size = random.choice([1, 1, 1, 1, 2, 2, 3])
    alpha = random.randint(60, 220)
    sd.ellipse((x - size, y - size, x + size, y + size), fill=(255, 255, 255, alpha))
img.paste(stars, (0, 0), stars)

d = ImageDraw.Draw(img)

# Eyebrow mark + label (top-left)
PAD = 70
d.ellipse((PAD, 70, PAD + 14, 84), fill=ACCENT)
eyebrow_font = ImageFont.truetype(ARIAL_B, 22)
d.text((PAD + 28, 67), "ELENOS  \u00B7  SOFTWARE STUDIO", font=eyebrow_font, fill=INK_MUTE)

# Headline (serif)
head_size = 92
head = ImageFont.truetype(GEORGIA, head_size)
head_i = ImageFont.truetype(GEORGIA_I, head_size)

y0 = 230
d.text((PAD, y0), "We build the systems", font=head, fill=INK)

# Line 2: "that compound revenue." with italic + accent "compound"
parts = [("that ", head, INK), ("compound", head_i, ACCENT_LIGHT), (" revenue.", head, INK)]
x = PAD
y1 = y0 + int(head_size * 1.15)
for text, font, fill in parts:
    d.text((x, y1), text, font=font, fill=fill)
    x += d.textlength(text, font=font)

# Thin divider
d.rectangle((PAD, 540, W - PAD, 541), fill=(255, 255, 255, 50))
d.rectangle((PAD, 540, PAD + 80, 541), fill=ACCENT_LIGHT)

# Footer: subtext left, domain right
sub_font = ImageFont.truetype(ARIAL, 20)
d.text((PAD, 565), "Cinematic websites \u00B7 Custom software \u00B7 AI systems", font=sub_font, fill=INK_MUTE)

site_font = ImageFont.truetype(ARIAL_B, 22)
site_text = "elenos.ai"
sw = d.textlength(site_text, font=site_font)
d.text((W - PAD - sw, 563), site_text, font=site_font, fill=INK)

png_path = os.path.join(OUT_DIR, "og-cover.png")
jpg_path = os.path.join(OUT_DIR, "og-cover.jpg")
img.save(png_path, optimize=True)
img.convert("RGB").save(jpg_path, quality=92, optimize=True)
print(f"Wrote {png_path}")
print(f"Wrote {jpg_path}")
