#!/usr/bin/env python3
"""Seed the dev qBittorrent (docker compose) with fixture torrents used by the e2e tests.

Creates deterministic data under dev/qbt/downloads/fixtures, builds two .torrent files
and adds them via the WebUI API:
  Sample.Show.S01  fully present (seeding), nested folders
  Partial.Pack     one file missing (~57%)

Usage: python3 scripts/seed-dev.py   (re-running is safe; qBittorrent ignores duplicates)
"""
import hashlib, os, subprocess, tempfile

URL = os.environ.get('QBT_URL', 'http://127.0.0.1:28080')
USER, PASSWORD = 'admin', 'mobileqbt-dev'
ROOT = os.path.join(os.path.dirname(__file__), '..', 'dev', 'qbt', 'downloads', 'fixtures')
TRACKER = 'http://tracker.invalid/announce'


def blob(label: str, n: int) -> bytes:
    """Deterministic pseudo-random bytes so infohashes are stable across runs."""
    out, i = b'', 0
    while len(out) < n:
        out += hashlib.sha256(f'{label}:{i}'.encode()).digest()
        i += 1
    return out[:n]


def enc(x):
    if isinstance(x, int): return b'i%de' % x
    if isinstance(x, bytes): return b'%d:%s' % (len(x), x)
    if isinstance(x, str): return enc(x.encode())
    if isinstance(x, list): return b'l' + b''.join(enc(i) for i in x) + b'e'
    return b'd' + b''.join(enc(k) + enc(v) for k, v in sorted(x.items())) + b'e'


def make_torrent(root: str, name: str) -> bytes:
    files, data = [], b''
    for dp, _, fs in sorted(os.walk(root)):
        for f in sorted(fs):
            p = os.path.join(dp, f)
            d = open(p, 'rb').read()
            files.append({'length': len(d), 'path': os.path.relpath(p, root).split(os.sep)})
            data += d
    pl = 16384
    pieces = b''.join(hashlib.sha1(data[i:i + pl]).digest() for i in range(0, len(data), pl))
    return enc({'announce': TRACKER, 'comment': 'mobileqbt fixture', 'created by': 'seed-dev.py',
                'creation date': 1700000000,
                'info': {'name': name, 'piece length': pl, 'pieces': pieces, 'files': files}})


def write(rel: str, n: int):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'wb').write(blob(rel, n))


def main():
    for rel, n in [('Sample.Show.S01/e01.mkv', 300_000), ('Sample.Show.S01/e02.mkv', 250_000),
                   ('Sample.Show.S01/Extras/behind-the-scenes.mkv', 90_000), ('Sample.Show.S01/readme.txt', 500),
                   ('Partial.Pack/part1.bin', 200_000), ('Partial.Pack/part2.bin', 200_000),
                   ('Partial.Pack/part3.bin', 100_000)]:
        write(rel, n)
    torrents = {n: make_torrent(os.path.join(ROOT, n), n) for n in ('Sample.Show.S01', 'Partial.Pack')}
    os.remove(os.path.join(ROOT, 'Partial.Pack', 'part2.bin'))  # makes it partial

    with tempfile.TemporaryDirectory() as tmp:
        jar = os.path.join(tmp, 'jar')
        curl = lambda *a: subprocess.run(['curl', '-s', '-b', jar, '-c', jar, *a], capture_output=True, text=True, check=True).stdout
        curl('-d', f'username={USER}&password={PASSWORD}', f'{URL}/api/v2/auth/login')
        curl('-d', 'category=tv&savePath=/downloads/tv', f'{URL}/api/v2/torrents/createCategory')
        for name, raw in torrents.items():
            path = os.path.join(tmp, name + '.torrent')
            open(path, 'wb').write(raw)
            hexhash = hashlib.sha1(raw[raw.index(b'4:info') + 6:-1]).hexdigest()
            curl('-F', f'torrents=@{path}', '-F', 'savepath=/downloads/fixtures', '-F', 'category=tv', f'{URL}/api/v2/torrents/add')
            print(f'{name}: {hexhash}')


main()
