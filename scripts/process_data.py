"""
LILA BLACK - Data Preprocessing Script
Reads all player parquet files and outputs a single clean events.json
Run once: python3 scripts/process_data.py
"""

import os
import json
import pyarrow.parquet as pq
import pandas as pd

# ── Config ──────────────────────────────────────────────────────────────────
DATA_DIR   = os.path.join(os.path.dirname(__file__), '..', 'player_data')
OUTPUT     = os.path.join(os.path.dirname(__file__), '..', 'public', 'events.json')
DATE_FOLDERS = ['February_10', 'February_11', 'February_12', 'February_13', 'February_14']

# Map coordinate configs (from README)
MAP_CONFIG = {
    'AmbroseValley': {'scale': 900,  'origin_x': -370, 'origin_z': -473},
    'GrandRift':     {'scale': 581,  'origin_x': -290, 'origin_z': -290},
    'Lockdown':      {'scale': 1000, 'origin_x': -500, 'origin_z': -500},
}

# ── Helpers ──────────────────────────────────────────────────────────────────
def is_bot(user_id: str) -> bool:
    """Bots have numeric user IDs, humans have UUIDs."""
    return user_id.replace('-', '').isdigit() or user_id.isdigit()

def world_to_pixel(x: float, z: float, map_id: str):
    """Convert world coordinates to 1024x1024 minimap pixel coordinates."""
    cfg = MAP_CONFIG.get(map_id)
    if not cfg:
        return None, None
    u = (x - cfg['origin_x']) / cfg['scale']
    v = (z - cfg['origin_z']) / cfg['scale']
    px = round(u * 1024, 1)
    py = round((1 - v) * 1024, 1)   # Y is flipped — image origin is top-left
    return px, py

def decode_event(val) -> str:
    """Event column is stored as bytes in parquet — decode to string."""
    if isinstance(val, bytes):
        return val.decode('utf-8')
    return str(val) if val is not None else 'Unknown'

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    all_events = []
    total_files = 0
    skipped = 0

    for date_folder in DATE_FOLDERS:
        folder_path = os.path.join(DATA_DIR, date_folder)
        if not os.path.isdir(folder_path):
            print(f"  Skipping (not found): {date_folder}")
            continue

        files = os.listdir(folder_path)
        print(f"Processing {date_folder}: {len(files)} files...")

        for filename in files:
            filepath = os.path.join(folder_path, filename)
            total_files += 1

            # Parse user_id and match_id from filename
            # Format: {user_id}_{match_id}.nakama-0
            # UUIDs use hyphens (-), not underscores (_), so splitting by _ gives exactly 2 parts
            base = filename.replace('.nakama-0', '')
            parts = base.split('_', 1)   # maxsplit=1 — split only on the first underscore
            if len(parts) != 2:
                skipped += 1
                continue

            user_id  = parts[0]
            match_id = parts[1] + '.nakama-0'

            bot = is_bot(user_id)
            date_label = date_folder.replace('February_', 'Feb ')

            try:
                table = pq.read_table(filepath)
                df = table.to_pandas()

                if df.empty:
                    continue

                # Decode event bytes → string
                df['event'] = df['event'].apply(decode_event)

                # Normalize timestamp: ms offset from match start
                df = df.sort_values('ts')
                ts_min = df['ts'].iloc[0]
                df['ts_ms'] = ((df['ts'] - ts_min) / pd.Timedelta(milliseconds=1)).astype(int)

                # Convert world coords to minimap pixels
                for _, row in df.iterrows():
                    map_id = str(row.get('map_id', ''))
                    px, py = world_to_pixel(float(row['x']), float(row['z']), map_id)
                    if px is None:
                        continue

                    all_events.append({
                        'uid':   user_id,
                        'mid':   match_id,
                        'map':   map_id,
                        'date':  date_label,
                        'px':    px,
                        'py':    py,
                        'ts':    int(row['ts_ms']),
                        'evt':   row['event'],
                        'bot':   1 if bot else 0,
                    })

            except Exception as e:
                skipped += 1
                print(f"  Error reading {filename}: {e}")
                continue

    print(f"\nDone. {total_files} files processed, {skipped} skipped.")
    print(f"Total events: {len(all_events)}")

    # Write output
    output_data = {
        'meta': {
            'total_events': len(all_events),
            'maps': list(MAP_CONFIG.keys()),
            'event_types': ['Position', 'BotPosition', 'Kill', 'Killed',
                            'BotKill', 'BotKilled', 'KilledByStorm', 'Loot'],
        },
        'events': all_events
    }

    with open(OUTPUT, 'w') as f:
        json.dump(output_data, f, separators=(',', ':'))   # compact JSON

    size_mb = os.path.getsize(OUTPUT) / (1024 * 1024)
    print(f"Output: {OUTPUT}")
    print(f"File size: {size_mb:.1f} MB")

if __name__ == '__main__':
    main()
