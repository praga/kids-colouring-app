import os
import sys
import urllib.request
import json
from PIL import Image

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/colouring-pages'))
MANIFEST_FILE = os.path.join(OUT_DIR, 'pages.json')

PAGES = [
    {
        'id': 'kpop-huntrix-heroes',
        'title': 'K-Pop Demon Hunters ⚔️',
        'filename': 'kpop-huntrix-heroes.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Huntrix-Group-Members-KPop-Demon-Hunters-Coloring-Page.png',
        'featured': True
    },
    {
        'id': 'kpop-huntrix-concert',
        'title': 'Superstar Concert 🎤',
        'filename': 'kpop-huntrix-concert.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Rumi-Zoey-and-Mira-Singing-on-Stage-KPop-Demon-Hunters-Coloring-Page.png',
        'featured': True
    },
    {
        'id': 'kpop-rumi-superstar',
        'title': 'Rumi Super Star 💖',
        'filename': 'kpop-rumi-superstar.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Simple-Rumi-from-KPop-Demon-Hunters-Coloring-Page-1.jpg',
        'featured': True
    },
    {
        'id': 'kpop-rumi-half-demon',
        'title': 'Rumi Mystic Marks ✨',
        'filename': 'kpop-rumi-half-demon.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Rumi-Half-Demon-from-KPop-Demon-Hunters-Coloring-Page-1.png',
        'featured': False
    },
    {
        'id': 'kpop-rumi-singing',
        'title': 'Rumi Live on Stage 🎙️',
        'filename': 'kpop-rumi-singing.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Rumi-Singing-from-KPop-Demon-Hunters-Coloring-Page-4-2.png',
        'featured': False
    },
    {
        'id': 'kpop-mira-warrior',
        'title': 'Mira Sword Dance 🗡️',
        'filename': 'kpop-mira-warrior.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Detailed-Mira-Portrait-KPop-Demon-Hunters-Coloring-Page.jpg',
        'featured': False
    },
    {
        'id': 'kpop-mira-ramyeon',
        'title': 'Chibi Mira & Noodles 🍜',
        'filename': 'kpop-mira-ramyeon.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Mira-Instant-Noodles-from-KPop-Demon-Hunters-Coloring-Page-1.png',
        'featured': False
    },
    {
        'id': 'kpop-zoey-shinkal',
        'title': 'Zoey Dual Daggers ⚡',
        'filename': 'kpop-zoey-shinkal.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Zoey-Holding-Shin-kal-from-KPop-Demon-Hunters-Coloring-Page-2-1.jpg',
        'featured': False
    },
    {
        'id': 'kpop-zoey-portrait',
        'title': 'Zoey Fashion Idol 🎀',
        'filename': 'kpop-zoey-portrait.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Detailed-Zoey-Portrait-KPop-Demon-Hunters-Coloring-Page.jpg',
        'featured': False
    },
    {
        'id': 'kpop-zoey-singing',
        'title': 'Zoey Smiling Vocalist 🎶',
        'filename': 'kpop-zoey-singing.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Zoey-Singing-from-KPop-Demon-Hunters-Coloring-Page-4-1.png',
        'featured': False
    },
    {
        'id': 'kpop-saja-boys-band',
        'title': 'The Saja Boys 🦁',
        'filename': 'kpop-saja-boys-band.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Saja-Boys-Members-with-Logo-Coloring-Page-3.jpg',
        'featured': False
    },
    {
        'id': 'kpop-jinu-sunglasses',
        'title': 'Jinu Cool Shades 😎',
        'filename': 'kpop-jinu-sunglasses.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Jinus-Sunglasses-Saja-Boys-from-KPop-Demon-Hunters-Coloring-Page-1.jpg',
        'featured': False
    },
    {
        'id': 'kpop-baby-saja',
        'title': 'Baby Saja Cutie 💫',
        'filename': 'kpop-baby-saja.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Baby-Saja-Boys-from-KPop-Demon-Hunters-Coloring-Page-1-1.png',
        'featured': False
    },
    {
        'id': 'kpop-rumi-jinu-duet',
        'title': 'Rumi & Jinu Duet 🎶',
        'filename': 'kpop-rumi-jinu-duet.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Rumi-and-Jinu-Saja-Boys-from-KPop-Demon-Hunters-Coloring-Page.jpg',
        'featured': False
    },
    {
        'id': 'kpop-derpy-tiger',
        'title': 'Derpy Tiger Spirit 🐯',
        'filename': 'kpop-derpy-tiger.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Simple-Derpy-from-KPop-Demon-Hunters-Coloring-Page-1.jpg',
        'featured': True
    },
    {
        'id': 'kpop-derpy-wizard',
        'title': 'Derpy Magic Hat 🎩',
        'filename': 'kpop-derpy-wizard.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Derpy-Halloween-from-KPop-Demon-Hunters-Coloring-Page-1.png',
        'featured': False
    },
    {
        'id': 'kpop-sussie-pigeon',
        'title': 'Sussie the Pigeon 🐦',
        'filename': 'kpop-sussie-pigeon.png',
        'category': 'K-Pop Demon Hunters',
        'url': 'https://coloringbunny.com/wp-content/uploads/2025/10/Sussie-Halloween-from-KPop-Demon-Hunters-Coloring-Page-2-1.png',
        'featured': False
    }
]

def find_frame(im):
    gray = im.convert('L')
    w, h = im.size
    
    top_y = None
    for y in range(40, 250):
        row = [gray.getpixel((x, y)) for x in range(200, w - 200)]
        if sum(1 for p in row if p < 110) > len(row) * 0.75:
            top_y = y
            break
            
    bottom_y = None
    for y in range(h - 40, h - 250, -1):
        row = [gray.getpixel((x, y)) for x in range(200, w - 200)]
        if sum(1 for p in row if p < 110) > len(row) * 0.75:
            bottom_y = y
            break
            
    left_x = None
    for x in range(40, 250):
        col = [gray.getpixel((x, y)) for y in range(top_y or 100, bottom_y or h - 100)]
        if sum(1 for p in col if p < 110) > len(col) * 0.75:
            left_x = x
            break
            
    right_x = None
    for x in range(w - 40, w - 250, -1):
        col = [gray.getpixel((x, y)) for y in range(top_y or 100, bottom_y or h - 100)]
        if sum(1 for p in col if p < 110) > len(col) * 0.75:
            right_x = x
            break
            
    return left_x, top_y, right_x, bottom_y

def process_image(src_path, out_path):
    im = Image.open(src_path)
    left_x, top_y, right_x, bottom_y = find_frame(im)
    w, h = im.size

    if left_x and top_y and right_x and bottom_y and (right_x > left_x + 500) and (bottom_y > top_y + 500):
        cropped = im.crop((left_x, top_y, right_x, bottom_y))
    else:
        cropped = im.crop((60, 60, w - 60, h - 90))

    target_w, target_h = 1600, 2000
    inner_w = target_w - 60
    inner_h = target_h - 60

    scale = min(inner_w / cropped.width, inner_h / cropped.height)
    new_w = int(cropped.width * scale)
    new_h = int(cropped.height * scale)

    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    final_canvas = Image.new('RGB', (target_w, target_h), (255, 255, 255))
    offset_x = (target_w - new_w) // 2
    offset_y = (target_h - new_h) // 2
    final_canvas.paste(resized, (offset_x, offset_y))

    final_gray = final_canvas.convert('L')
    lut = []
    for p in range(256):
        if p > 195:
            lut.append(255)
        elif p < 85:
            lut.append(0)
        else:
            lut.append(int(255 * (p - 85) / 110))

    clean_gray = final_gray.point(lut)
    clean_rgb = clean_gray.convert('RGB')
    clean_rgb.save(out_path, 'PNG', optimize=True)
    print(f'Processed & saved: {os.path.basename(out_path)} ({clean_rgb.size})')

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    temp_dir = os.path.join(OUT_DIR, '_temp')
    os.makedirs(temp_dir, exist_ok=True)

    downloaded_entries = []

    for item in PAGES:
        filename = item['filename']
        out_path = os.path.join(OUT_DIR, filename)
        temp_file = os.path.join(temp_dir, os.path.basename(item['url']))
        
        # If already exists and valid, skip re-downloading to save time
        if os.path.exists(out_path) and os.path.getsize(out_path) > 50000:
            print(f"Page already cached: {filename}")
            downloaded_entries.append(item)
            continue

        print(f"Downloading {item['title']}...")
        req = urllib.request.Request(item['url'], headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                with open(temp_file, 'wb') as f:
                    f.write(data)
            
            process_image(temp_file, out_path)
            downloaded_entries.append(item)
        except Exception as e:
            print(f"Error processing {item['title']}: {e}", file=sys.stderr)

    # Clean up temp files
    for f in os.listdir(temp_dir):
        try:
            os.remove(os.path.join(temp_dir, f))
        except:
            pass
    try:
        os.rmdir(temp_dir)
    except:
        pass

    # Read existing manifest
    existing = []
    if os.path.exists(MANIFEST_FILE):
        try:
            with open(MANIFEST_FILE, 'r', encoding='utf-8') as f:
                existing = json.load(f)
        except Exception as e:
            print(f"Error reading {MANIFEST_FILE}: {e}")

    # Remove any old kpop-huntrix-golden.png from disk if present
    old_golden = os.path.join(OUT_DIR, 'kpop-huntrix-golden.png')
    if os.path.exists(old_golden):
        os.remove(old_golden)

    other_pages = [p for p in existing if not p.get('filename', '').startswith('kpop-')]
    
    all_pages = []
    order = 1
    for p in downloaded_entries:
        all_pages.append({
            'id': p['id'],
            'title': p['title'],
            'filename': p['filename'],
            'category': p['category'],
            'order': order,
            'featured': p['featured']
        })
        order += 1

    for p in other_pages:
        all_pages.append({
            **p,
            'order': order
        })
        order += 1

    with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_pages, f, indent=2)

    print(f"\nManifest successfully updated with {len(all_pages)} total pages at {MANIFEST_FILE}!")

if __name__ == '__main__':
    main()
