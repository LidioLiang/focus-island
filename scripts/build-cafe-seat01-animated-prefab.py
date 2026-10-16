from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
CANVAS_SIZE = (1586, 992)
FRAME_COUNT = 6
SCALE = 4


def rgba(color: tuple[int, int, int], alpha: int = 255) -> tuple[int, int, int, int]:
    return (*color, alpha)


def ellipse(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill, outline=None, width: int = 1) -> None:
    draw.ellipse(box, fill=fill, outline=outline, width=width)


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill, outline=None, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_character(frame_index: int) -> Image.Image:
    """Create one full-canvas transparent frame for seat 01.

    The character is intentionally cozy 2D instead of photorealistic. The whole
    prefab remains full-canvas so the frontend can position it without anchors.
    """

    w, h = CANVAS_SIZE
    layer = Image.new("RGBA", (w * SCALE, h * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")

    def sbox(box: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
        return tuple(round(value * SCALE) for value in box)

    def sp(points: list[tuple[int, int]]) -> list[tuple[int, int]]:
        return [(round(x * SCALE), round(y * SCALE)) for x, y in points]

    # Tiny idle motion: body breathes, head nods, hands tap.
    breath = [0, -1, -2, -1, 0, 1][frame_index]
    hand = [0, 1, 0, -1, 0, 1][frame_index]
    head = [0, 0, -1, -1, 0, 1][frame_index]

    # Shared shadow under the full prefab, aligned to the bar-stool area.
    shadow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow, "RGBA")
    shadow_draw.ellipse(sbox((360, 438, 510, 500)), fill=rgba((25, 18, 13), 74))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10 * SCALE))
    layer.alpha_composite(shadow)

    # Bar stool, simplified and game-like, placed at the 1号吧台位置.
    # Seat
    ellipse(draw, sbox((395, 338, 493, 376)), fill=rgba((156, 84, 36), 255), outline=rgba((86, 48, 29), 230), width=2 * SCALE)
    ellipse(draw, sbox((407, 344, 482, 365)), fill=rgba((201, 123, 50), 220))
    # Stem and foot ring
    rounded(draw, sbox((440, 366, 451, 456)), 4 * SCALE, rgba((48, 43, 38), 255))
    draw.ellipse(sbox((382, 425, 511, 459)), outline=rgba((48, 43, 38), 230), width=4 * SCALE)
    # Legs
    draw.line(sp([(444, 448), (385, 492)]), fill=rgba((37, 32, 29), 240), width=5 * SCALE)
    draw.line(sp([(448, 448), (505, 492)]), fill=rgba((37, 32, 29), 240), width=5 * SCALE)
    draw.line(sp([(445, 448), (449, 503)]), fill=rgba((37, 32, 29), 220), width=4 * SCALE)

    # Cozy 2D avatar facing the bar; back / three-quarter back view.
    body_y = 285 + breath
    head_y = 240 + breath + head

    # Legs tucked down to the foot ring.
    rounded(draw, sbox((410, 358, 436, 438)), 10 * SCALE, rgba((65, 95, 83), 255), outline=rgba((36, 60, 53), 160), width=1 * SCALE)
    rounded(draw, sbox((454, 357, 478, 438)), 10 * SCALE, rgba((65, 95, 83), 255), outline=rgba((36, 60, 53), 160), width=1 * SCALE)
    rounded(draw, sbox((398, 430, 438, 449)), 8 * SCALE, rgba((235, 230, 214), 255), outline=rgba((145, 127, 105), 130), width=1 * SCALE)
    rounded(draw, sbox((456, 429, 495, 448)), 8 * SCALE, rgba((235, 230, 214), 255), outline=rgba((145, 127, 105), 130), width=1 * SCALE)

    # Sweater body.
    rounded(draw, sbox((390, body_y, 484, body_y + 92)), 28 * SCALE, rgba((238, 207, 156), 255), outline=rgba((156, 109, 64), 130), width=2 * SCALE)
    rounded(draw, sbox((402, body_y + 14, 474, body_y + 84)), 22 * SCALE, rgba((250, 224, 176), 210))

    # Neck and head.
    rounded(draw, sbox((429, head_y + 52, 453, head_y + 76)), 8 * SCALE, rgba((221, 157, 112), 255))
    ellipse(draw, sbox((406, head_y, 471, head_y + 66)), fill=rgba((225, 165, 119), 255), outline=rgba((139, 81, 48), 120), width=1 * SCALE)
    # Hair seen from the back.
    ellipse(draw, sbox((400, head_y - 4, 472, head_y + 47)), fill=rgba((84, 49, 33), 255))
    ellipse(draw, sbox((450, head_y + 22, 490, head_y + 60)), fill=rgba((72, 43, 30), 255))
    draw.arc(sbox((405, head_y + 5, 470, head_y + 62)), 210, 335, fill=rgba((56, 34, 24), 180), width=3 * SCALE)

    # Small laptop/tablet on the bar, held forward; screen belongs to the prefab.
    screen_shift = hand
    rounded(draw, sbox((349, 304 + screen_shift, 407, 345 + screen_shift)), 4 * SCALE, rgba((36, 53, 62), 255), outline=rgba((231, 185, 104), 190), width=1 * SCALE)
    rounded(draw, sbox((356, 310 + screen_shift, 401, 339 + screen_shift)), 3 * SCALE, rgba((120, 151, 154), 245))
    draw.line(sp([(349, 345 + screen_shift), (412, 355 + screen_shift)]), fill=rgba((43, 37, 34), 230), width=3 * SCALE)

    # Arms / hands tapping.
    rounded(draw, sbox((378, body_y + 30, 423, body_y + 48 + hand)), 12 * SCALE, rgba((233, 198, 147), 255), outline=rgba((156, 109, 64), 90), width=1 * SCALE)
    rounded(draw, sbox((455, body_y + 31, 492, body_y + 49 - hand)), 12 * SCALE, rgba((233, 198, 147), 255), outline=rgba((156, 109, 64), 90), width=1 * SCALE)
    ellipse(draw, sbox((371, body_y + 41 + hand, 390, body_y + 58 + hand)), fill=rgba((223, 161, 115), 255))
    ellipse(draw, sbox((486, body_y + 40 - hand, 505, body_y + 57 - hand)), fill=rgba((223, 161, 115), 255))

    return layer.resize(CANVAS_SIZE, Image.Resampling.LANCZOS)


def make_preview_gif(background: Image.Image, frames: list[Image.Image]) -> None:
    preview_frames: list[Image.Image] = []
    for frame in frames:
        composed = background.copy()
        composed.alpha_composite(frame)
        composed = composed.resize((793, 496), Image.Resampling.LANCZOS).convert("P", palette=Image.Palette.ADAPTIVE)
        preview_frames.append(composed)
    preview_frames[0].save(
        ASSETS / "20261013-cafe-seat-01-preview.gif",
        save_all=True,
        append_images=preview_frames[1:],
        duration=180,
        loop=0,
        optimize=True,
    )


def main() -> None:
    background = Image.open(ASSETS / "20261013-cafe-room-no-any-seats.png").convert("RGBA")
    chair = Image.open(ASSETS / "20261013-cafe-seat-01-chair.webp").convert("RGBA")

    # Empty state: 1号独立空椅子。
    chair.save(ASSETS / "20261013-cafe-seat-01-empty.webp", "WEBP", quality=94, method=6, exact=True)

    frames = [draw_character(index) for index in range(FRAME_COUNT)]
    sheet = Image.new("RGBA", (CANVAS_SIZE[0] * FRAME_COUNT, CANVAS_SIZE[1]), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (CANVAS_SIZE[0] * index, 0))
    sheet.save(ASSETS / "20261013-cafe-seat-01-idle-sheet.webp", "WEBP", quality=94, method=6, exact=True)

    shadow = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow, "RGBA")
    shadow_draw.ellipse((360, 438, 510, 500), fill=rgba((25, 18, 13), 82))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    shadow.save(ASSETS / "20261013-cafe-seat-01-shadow.webp", "WEBP", quality=90, method=6, exact=True)

    preview = background.copy()
    preview.alpha_composite(frames[0])
    preview.save(ASSETS / "20261013-cafe-seat-01-animated-prefab-preview.png")
    make_preview_gif(background, frames)

    print("created:")
    for name in [
        "20261013-cafe-seat-01-empty.webp",
        "20261013-cafe-seat-01-idle-sheet.webp",
        "20261013-cafe-seat-01-shadow.webp",
        "20261013-cafe-seat-01-animated-prefab-preview.png",
        "20261013-cafe-seat-01-preview.gif",
    ]:
        path = ASSETS / name
        image = Image.open(path)
        print(f"- {path} {image.size} {image.mode}")


if __name__ == "__main__":
    main()
