#VERSION: 1.00
# A search plugin that makes up its results, for developing and testing the Search screens offline.
# Install it in the dev qBittorrent with: /fixtures/mobileqbt_test.py (see docker-compose.yml).
import hashlib

from novaprinter import prettyPrinter


class mobileqbt_test(object):
    url = 'http://fixture.invalid'
    name = 'MobileQBT Test'
    supported_categories = {'all': '0', 'books': '1', 'movies': '2'}

    def download_torrent(self, info):
        print(info + ' ' + info)

    def search(self, what, cat='all'):
        # deterministic: the same query always gives the same ten results
        for i in range(10):
            digest = hashlib.sha1(f'{what}-{cat}-{i}'.encode()).hexdigest()
            prettyPrinter({
                'link': f'magnet:?xt=urn:btih:{digest}&dn={what.replace(" ", "+")}+{i}',
                'name': f'{what} result {i + 1} [{cat}]',
                'size': str((i + 1) * 123_456_789),
                'seeds': str(100 - i * 9),
                'leech': str(i),
                'engine_url': self.url,
                'desc_link': f'{self.url}/torrent/{digest[:8]}',
                'pub_date': str(1_700_000_000 + i * 86400),
            })
