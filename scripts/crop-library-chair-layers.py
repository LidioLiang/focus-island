from pathlib import Path

from PIL import Image


ASSET_DIR = Path(__file__).resolve().parents[1] / "public" / "assets"


def crop_with_padding(source: Path, target: Path, padding: int = 16) -> None:
    image = Image.open(source).convert("RGBA")
    alpha = image.getchannel("A")
    # Image generation may leave almost-invisible alpha over the full canvas.
    # Use a small visibility threshold so the editor box hugs the chair itself.
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if not bbox:
        raise ValueError(f"No visible pixels in {source}")
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    image.crop((left, top, right, bottom)).save(target, optimize=True)


def main() -> None:
    for seat_id in range(1, 5):
        source = ASSET_DIR / f"20261016-library-seat-{seat_id:02d}-chair.png"
        target = ASSET_DIR / f"20261016-library-seat-{seat_id:02d}-chair-cropped.png"
        crop_with_padding(source, target)
        print(target.name)


if __name__ == "__main__":
    main()
