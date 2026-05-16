"""Compile .po files to .mo files without requiring system gettext tools."""
import struct
import os
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent


def parse_po(filepath):
    """Parse a .po file and return list of (msgid, msgstr) tuples."""
    entries = []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into blocks separated by blank lines
    blocks = re.split(r'\n\n+', content.strip())

    for block in blocks:
        lines = block.strip().split('\n')
        msgid_lines = []
        msgstr_lines = []
        current = None

        for line in lines:
            if line.startswith('#'):
                continue
            elif line.startswith('msgid '):
                current = 'msgid'
                val = line[6:].strip()
                if val.startswith('"') and val.endswith('"'):
                    msgid_lines.append(val[1:-1])
            elif line.startswith('msgstr '):
                current = 'msgstr'
                val = line[7:].strip()
                if val.startswith('"') and val.endswith('"'):
                    msgstr_lines.append(val[1:-1])
            elif line.startswith('"') and line.endswith('"'):
                val = line[1:-1]
                if current == 'msgid':
                    msgid_lines.append(val)
                elif current == 'msgstr':
                    msgstr_lines.append(val)

        msgid = ''.join(msgid_lines).replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
        msgstr = ''.join(msgstr_lines).replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
        entries.append((msgid, msgstr))

    return entries


def compile_mo(entries, output_path):
    """Write a .mo binary file from list of (msgid, msgstr) pairs."""
    # Filter: only include entries where msgstr is non-empty
    filtered = [(orig, trans) for orig, trans in entries if trans]
    filtered.sort(key=lambda x: x[0])

    n = len(filtered)
    header_size = 28  # 7 * 4 bytes
    orig_table_offset = header_size
    trans_table_offset = orig_table_offset + n * 8
    strings_start = trans_table_offset + n * 8

    orig_encoded = [o.encode('utf-8') for o, _ in filtered]
    trans_encoded = [t.encode('utf-8') for _, t in filtered]

    # Calculate string offsets
    orig_offsets = []
    pos = strings_start
    for s in orig_encoded:
        orig_offsets.append((len(s), pos))
        pos += len(s) + 1

    trans_offsets = []
    for s in trans_encoded:
        trans_offsets.append((len(s), pos))
        pos += len(s) + 1

    # Build binary data
    data = struct.pack('<IIIIIII',
                       0x950412de,  # magic (little-endian)
                       0,           # revision
                       n,           # number of strings
                       orig_table_offset,
                       trans_table_offset,
                       0,           # hash table size (no hash)
                       0)           # hash table offset

    for length, offset in orig_offsets:
        data += struct.pack('<II', length, offset)
    for length, offset in trans_offsets:
        data += struct.pack('<II', length, offset)
    for s in orig_encoded:
        data += s + b'\x00'
    for s in trans_encoded:
        data += s + b'\x00'

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(data)
    print(f"Compiled: {output_path} ({n} strings)")


def main():
    locale_dir = BASE_DIR / 'locale'
    for lang_dir in locale_dir.iterdir():
        if not lang_dir.is_dir():
            continue
        po_file = lang_dir / 'LC_MESSAGES' / 'django.po'
        mo_file = lang_dir / 'LC_MESSAGES' / 'django.mo'
        if po_file.exists():
            entries = parse_po(po_file)
            compile_mo(entries, mo_file)


if __name__ == '__main__':
    main()
