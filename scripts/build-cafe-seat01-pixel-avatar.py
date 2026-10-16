from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"

FRAME_SIZE = 128
FRAME_COUNT = 8
PREVIEW_SCALE = 4


def c(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_color = hex_color.lstrip("#")
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
        alpha,
    )


PALETTE = {
    "outline": c("#2a211b"),
    "shadow": c("#211914", 92),
    "chair_dark": c("#5e3a24"),
    "chair_mid": c("#9b6338"),
    "chair_light": c("#c98548"),
    "hoodie_dark": c("#1f3f35"),
    "hoodie": c("#2f5c4c"),
    "hoodie_light": c("#4f8069"),
    "pants": c("#d8c6a9"),
    "pants_dark": c("#a89170"),
    "shoe": c("#f0eee7"),
    "shoe_shadow": c("#bdb8aa"),
    "hair": c("#30211d"),
    "hair_light": c("#50342a"),
    "skin": c("#c88b61"),
    "headphone": c("#e9d8b8"),
    "headphone_dark": c("#8e7c65"),
    "screen": c("#5f94a3"),
    "screen_light": c("#9fc9c8"),
    "laptop": c("#323a3e"),
    "mug": c("#d58b45"),
}


def rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], fill: str, alpha: int | None = None) -> None:
    color = PALETTE[fill]
    if alpha is not None:
        color = (*color[:3], alpha)
    draw.rectangle(xy, fill=color)


def draw_frame(index: int) -> Image.Image:
    img = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")

    # Animation offsets. Keep it subtle so it feels like quiet focus.
    breath = [0, 0, -1, -1, 0, 1, 1, 0][index]
    head = [0, -1, -1, 0, 1, 1, 0, 0][index]
    hand = [0, 1, 0, -1, 0, 1, 0, -1][index]
    screen = [0, 0, 1, 1, 0, 0, 1, 0][index]

    # Soft oval shadow.
    rect(d, (35, 100, 91, 105), "shadow")
    rect(d, (42, 105, 82, 108), "shadow", 58)

    # Chair / bar stool.
    rect(d, (46, 58, 84, 63), "outline")
    rect(d, (48, 56, 82, 61), "chair_light")
    rect(d, (50, 59, 80, 64), "chair_mid")
    rect(d, (61, 64, 66, 99), "outline")
    rect(d, (62, 64, 65, 98), "chair_dark")
    rect(d, (43, 84, 87, 87), "outline")
    rect(d, (45, 85, 85, 86), "chair_dark")
    rect(d, (45, 87, 49, 104), "outline")
    rect(d, (81, 87, 85, 104), "outline")

    # Tucked legs and shoes.
    rect(d, (49, 66, 59, 92), "pants_dark")
    rect(d, (51, 66, 61, 91), "pants")
    rect(d, (68, 66, 78, 93), "pants_dark")
    rect(d, (67, 66, 76, 91), "pants")
    rect(d, (43, 89, 61, 96), "outline")
    rect(d, (45, 88, 61, 94), "shoe")
    rect(d, (46, 94, 59, 96), "shoe_shadow")
    rect(d, (72, 90, 91, 97), "outline")
    rect(d, (72, 89, 88, 95), "shoe")
    rect(d, (74, 95, 88, 97), "shoe_shadow")

    # Hoodie body, back-facing / side-back.
    y = 42 + breath
    rect(d, (43, y + 8, 80, y + 36), "outline")
    rect(d, (45, y + 7, 78, y + 34), "hoodie")
    rect(d, (49, y + 10, 73, y + 31), "hoodie_light", 150)
    rect(d, (39, y + 15, 49, y + 31), "outline")
    rect(d, (41, y + 15, 51, y + 29), "hoodie")
    rect(d, (75, y + 15, 86, y + 31), "outline")
    rect(d, (73, y + 15, 84, y + 29), "hoodie")

    # Head, hair, headphones.
    hy = 25 + head + breath
    rect(d, (48, hy + 9, 73, hy + 32), "skin")
    rect(d, (45, hy + 5, 76, hy + 22), "hair")
    rect(d, (46, hy + 3, 69, hy + 12), "hair_light")
    rect(d, (69, hy + 11, 82, hy + 25), "hair")
    rect(d, (43, hy + 11, 50, hy + 27), "headphone")
    rect(d, (42, hy + 14, 45, hy + 25), "headphone_dark")
    rect(d, (75, hy + 11, 82, hy + 27), "headphone")
    rect(d, (80, hy + 14, 83, hy + 25), "headphone_dark")
    rect(d, (51, hy + 4, 75, hy + 7), "headphone_dark")

    # Laptop/tablet and typing hands.
    lx = 27
    ly = 50 + hand
    rect(d, (22, ly + 1, 45, ly + 19), "outline")
    rect(d, (24, ly + 3, 43, ly + 16), "screen")
    rect(d, (27, ly + 5, 41, ly + 7), "screen_light", 180 + screen * 38)
    rect(d, (24, ly + 18, 49, ly + 22), "laptop")
    rect(d, (35, y + 28 + hand, 45, y + 34 + hand), "skin")
    rect(d, (78, y + 28 - hand, 88, y + 34 - hand), "skin")
    rect(d, (34, y + 31 + hand, 46, y + 35 + hand), "outline", 90)
    rect(d, (77, y + 31 - hand, 89, y + 35 - hand), "outline", 90)

    # Small café cue: tiny mug next to laptop.
    rect(d, (92, 58, 101, 68), "outline")
    rect(d, (93, 57, 100, 67), "mug")
    rect(d, (101, 60, 104, 65), "outline")

    return img


def compose_contact_sheet(frames: list[Image.Image]) -> Image.Image:
    padding = 10
    label_h = 14
    card = FRAME_SIZE + padding * 2
    sheet = Image.new("RGBA", (card * 4, (card + label_h) * 2), c("#f5ead8"))
    for index, frame in enumerate(frames):
        col = index % 4
        row = index // 4
        x = col * card + padding
        y = row * (card + label_h) + padding
        bg = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), c("#ffe4b8"))
        bg.alpha_composite(frame)
        sheet.alpha_composite(bg, (x, y))
        d = ImageDraw.Draw(sheet)
        d.text((x + 2, y + FRAME_SIZE + 1), f"frame {index + 1}", fill=c("#6e4a2d"))
    return sheet


def main() -> None:
    frames = [draw_frame(index) for index in range(FRAME_COUNT)]

    sheet = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * FRAME_SIZE, 0))
    sheet.save(ASSETS / "20261013-cafe-seat-01-pixel-avatar-idle-sheet.png")

    contact = compose_contact_sheet(frames)
    contact.save(ASSETS / "20261013-cafe-seat-01-pixel-avatar-contact-sheet.png")

    preview_frames = []
    for frame in frames:
        bg = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), c("#f7dfb7"))
        # subtle card background grid-free, scaled nearest for true pixel style
        bg.alpha_composite(frame)
        preview_frames.append(bg.resize((FRAME_SIZE * PREVIEW_SCALE, FRAME_SIZE * PREVIEW_SCALE), Image.Resampling.NEAREST).convert("P", palette=Image.Palette.ADAPTIVE))
    preview_frames[0].save(
        ASSETS / "20261013-cafe-seat-01-pixel-avatar-preview.gif",
        save_all=True,
        append_images=preview_frames[1:],
        duration=140,
        loop=0,
        optimize=False,
    )

    # A still preview with transparency preserved and enlarged for easy inspection.
    still = frames[0].resize((FRAME_SIZE * PREVIEW_SCALE, FRAME_SIZE * PREVIEW_SCALE), Image.Resampling.NEAREST)
    still.save(ASSETS / "20261013-cafe-seat-01-pixel-avatar-still.png")

    for name in [
        "20261013-cafe-seat-01-pixel-avatar-idle-sheet.png",
        "20261013-cafe-seat-01-pixel-avatar-contact-sheet.png",
        "20261013-cafe-seat-01-pixel-avatar-preview.gif",
        "20261013-cafe-seat-01-pixel-avatar-still.png",
    ]:
        p = ASSETS / name
        im = Image.open(p)
        print(f"{p} {im.size} {im.mode}")


if __name__ == "__main__":
    main()
