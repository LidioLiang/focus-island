from pathlib import Path

from PIL import Image


ASSET_DIR = Path(__file__).resolve().parents[1] / "public" / "assets"
FRAME_COUNT = 8


def alpha_crop(image: Image.Image, padding: int = 12) -> Image.Image:
    image = image.convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("source image has no visible pixels")
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def build_sheet(source_path: Path, output_path: Path) -> None:
    actor = alpha_crop(Image.open(source_path))
    # Small whole-body offsets create a calm breathing / reading loop while
    # preserving the approved seated pose and its table perspective.
    x_offsets = (0, 0, 1, 1, 0, 0, -1, -1)
    y_offsets = (1, 0, -1, -2, -1, 0, 1, 2)
    margin = 4
    frame_width = actor.width + margin * 2
    frame_height = actor.height + margin * 2 + 2
    sheet = Image.new("RGBA", (frame_width * FRAME_COUNT, frame_height), (0, 0, 0, 0))

    for index, (dx, dy) in enumerate(zip(x_offsets, y_offsets)):
        sheet.alpha_composite(actor, (index * frame_width + margin + dx, margin + dy))

    sheet.save(output_path, optimize=True)


def main() -> None:
    for seat_id in range(1, 5):
        source = ASSET_DIR / f"20261016-library-seat-{seat_id:02d}-avatar-source.png"
        output = ASSET_DIR / f"20261016-library-seat-{seat_id:02d}-idle-sheet.png"
        build_sheet(source, output)
        print(f"built {output.name}")

    # Seat 2 uses an occupied prefab that already includes the chair. Keeping
    # this as a separate sheet lets the empty chair remain independently
    # editable while giving the occupied state a baked, reliable occlusion.
    for seat_id in (1, 2):
        occupied_source = ASSET_DIR / f"20261016-library-seat-{seat_id:02d}-occupied-source.png"
        occupied_output = ASSET_DIR / f"20261016-library-seat-{seat_id:02d}-occupied-idle-sheet.png"
        if occupied_source.exists():
            build_sheet(occupied_source, occupied_output)
            print(f"built {occupied_output.name}")


if __name__ == "__main__":
    main()
