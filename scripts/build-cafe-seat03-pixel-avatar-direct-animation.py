from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
SOURCE = ASSETS / "20261013-cafe-seat-03-pixel-avatar-direct-transparent.png"

FRAME_COUNT = 8
PREVIEW_SCALE = 0.42


def make_frame(source: Image.Image, index: int) -> Image.Image:
    """Subtle idle animation for the directly generated transparent avatar.

    This intentionally avoids cutting body parts apart. It keeps the character
    visually stable while giving it a soft breathing / focus-loop motion.
    """

    w, h = source.size
    # Smooth loop: a little vertical breath and tiny scale from bottom anchor.
    y_offsets = [0, -1, -2, -2, -1, 0, 1, 0]
    scales = [1.0, 1.002, 1.004, 1.005, 1.003, 1.001, 1.0, 0.999]
    brightness = [1.0, 1.015, 1.03, 1.02, 1.0, 0.985, 0.995, 1.0]

    scale = scales[index]
    scaled = source.resize((round(w * scale), round(h * scale)), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    paste_x = round((w - scaled.width) / 2)
    paste_y = h - scaled.height + y_offsets[index]
    frame.alpha_composite(scaled, (paste_x, paste_y))

    # Very slight warm rim-light pulse on top of the whole sprite. Keep the
    # transparent area clean; no rectangular glow or background artifacts.
    if brightness[index] != 1.0:
      rgb = frame.convert("RGB")
      rgb = ImageEnhance.Brightness(rgb).enhance(brightness[index])
      rgb.putalpha(frame.getchannel("A"))
      frame = rgb

    return frame


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    frames = [make_frame(source, index) for index in range(FRAME_COUNT)]
    w, h = source.size

    sheet = Image.new("RGBA", (w * FRAME_COUNT, h), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (w * index, 0))
    sheet_path = ASSETS / "20261013-cafe-seat-03-pixel-avatar-direct-idle-sheet.png"
    sheet.save(sheet_path)

    preview_frames: list[Image.Image] = []
    preview_size = (round(w * PREVIEW_SCALE), round(h * PREVIEW_SCALE))
    for frame in frames:
        # Keep the GIF on a warm neutral card so transparent edges are readable.
        card = Image.new("RGBA", source.size, (246, 222, 185, 255))
        card.alpha_composite(frame)
        preview_frames.append(card.resize(preview_size, Image.Resampling.LANCZOS).convert("P", palette=Image.Palette.ADAPTIVE))
    gif_path = ASSETS / "20261013-cafe-seat-03-pixel-avatar-direct-preview.gif"
    preview_frames[0].save(
        gif_path,
        save_all=True,
        append_images=preview_frames[1:],
        duration=130,
        loop=0,
        optimize=False,
    )

    print(sheet_path, sheet.size, sheet.mode)
    print(gif_path, preview_size)


if __name__ == "__main__":
    main()
