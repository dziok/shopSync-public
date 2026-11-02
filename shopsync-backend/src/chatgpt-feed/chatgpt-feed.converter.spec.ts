import { Readable, Writable } from 'stream';
import { convertEntry, convertFeed, csvLine } from './chatgpt-feed.converter';

const entry = (overrides: Record<string, string> = {}) => ({
  id: '28345', title: 'Monitor "24 cale"', description: 'Opis &amp; test',
  link: 'https://sprzetowo.pl/monitor', brand: 'Dell',
  image_link: 'https://sprzetowo.pl/img.jpg', availability: 'in stock',
  price: '257,50 PLN', ...overrides,
});

describe('ChatGPT Ads feed conversion', () => {
  it('normalizes the required fields without inventing missing brand', () => {
    const converted = convertEntry(entry(), 'Sprzetowo.pl');
    expect(converted.row).toMatchObject({ price: '257.50 PLN', availability: 'in_stock',
      description: 'Opis & test', condition: 'used', is_ads_eligible: 'true' });
    expect(convertEntry(entry({ condition: 'new', product_type: 'Nowe monitory' }), 'Sprzetowo.pl').row?.condition).toBe('used');
    expect(convertEntry(entry({ condition: 'refurbished' }), 'Sprzetowo.pl').row?.condition).toBe('used');
    expect(convertEntry(entry({ brand: '' }), 'Sprzetowo.pl').reason).toContain('brand');
    expect(convertEntry(entry({ link: 'http://example.com' }), 'Sprzetowo.pl').reason).toContain('HTTPS');
  });

  it('escapes CSV values', () => {
    expect(csvLine(['Monitor "24 cale"', 'A,B'])).toBe('"Monitor ""24 cale""","A,B"\r\n');
  });

  it('reads Atom entries in chunks and ignores nested shipping price', async () => {
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
      <title>Sprzetowo.pl</title><entry><g:id>28345</g:id><title>Monitor</title>
      <description>Opis</description><link>https://sprzetowo.pl/monitor</link>
      <g:brand>Dell</g:brand><g:image_link>https://sprzetowo.pl/img.jpg</g:image_link>
      <g:availability>in stock</g:availability><g:price>257.50 PLN</g:price>
      <g:condition>new</g:condition><g:product_type>Komputery poleasingowe</g:product_type>
      <g:shipping><g:price>20.00 PLN</g:price></g:shipping></entry></feed>`;
    let output = '';
    const writable = new Writable({ write(chunk, _encoding, callback) { output += chunk.toString(); callback(); } });
    const summary = await convertFeed(Readable.from([xml.slice(0, 100), xml.slice(100)]), writable);
    expect(summary).toMatchObject({ total: 1, sourceInStock: 1, exported: 1, inStock: 1, outOfStock: 0, skipped: 0 });
    expect(output).toContain('"257.50 PLN","used","Komputery poleasingowe"');
    expect(output).not.toContain('20.00 PLN');
  });

  it('recovers an in-stock item image without changing its other fields', async () => {
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
      <title>Sprzetowo.pl</title><entry><g:id>19790</g:id><title>Mini komputer HP</title>
      <description>Opis produktu</description><link>https://sprzetowo.pl/mini-komputer</link>
      <g:brand>HP</g:brand><g:availability>in stock</g:availability><g:price>358 PLN</g:price></entry></feed>`;
    let output = '';
    const writable = new Writable({ write(chunk, _encoding, callback) { output += chunk.toString(); callback(); } });
    const recover = jest.fn().mockResolvedValue(new Map([['19790', 'https://sprzetowo.pl/userdata/public/gfx/102586.png']]));
    const summary = await convertFeed(Readable.from([xml]), writable, undefined, recover);
    expect(recover).toHaveBeenCalledWith([{ itemId: '19790', productUrl: 'https://sprzetowo.pl/mini-komputer' }]);
    expect(summary).toMatchObject({ total: 1, sourceInStock: 1, exported: 1, inStock: 1, skipped: 0 });
    expect(output).toContain('https://sprzetowo.pl/userdata/public/gfx/102586.png');
    expect(output).toContain('"Mini komputer HP","Opis produktu"');
  });
});
