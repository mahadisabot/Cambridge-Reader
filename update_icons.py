import os
from PIL import Image
from pathlib import Path

# CONFIG
SOURCE_IMG = "cambridge_modern_icon_1767699701724.png" # Need to verify exact filename from previous step
ICONS_DIR = Path("cambridge-gui/src-tauri/icons").resolve()

def step(msg):
    print(f"[+] {msg}")

def main():
    source = SOURCE_IMG
    if not os.path.exists(source):
        print(f"[-] Source image {source} not found!")
        # Try to find recent pngs
        import glob
        pngs = list(glob.glob("cambridge_modern_icon_*.png"))
        if pngs:
            pngs.sort(key=os.path.getmtime, reverse=True)
            source = pngs[0]
            print(f"[*] using {source} instead.")
        else:
            return

    img = Image.open(source)
    step(f"Loaded {source} ({img.size})")

    # 1. Create ICO
    ico_path = ICONS_DIR / "icon.ico"
    step(f"Saving {ico_path}...")
    img.save(ico_path, format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])

    # 2. Update icon.png (Main)
    png_path = ICONS_DIR / "icon.png"
    step(f"Saving {png_path}...")
    img.resize((512, 512), Image.Resampling.LANCZOS).save(png_path)

    # 3. Update 128x128
    p128 = ICONS_DIR / "128x128.png"
    img.resize((128, 128), Image.Resampling.LANCZOS).save(p128)
    
    # 4. Update 32x32
    p32 = ICONS_DIR / "32x32.png"
    img.resize((32, 32), Image.Resampling.LANCZOS).save(p32)

    print("[SUCCESS] Icons updated.")

if __name__ == "__main__":
    main()
