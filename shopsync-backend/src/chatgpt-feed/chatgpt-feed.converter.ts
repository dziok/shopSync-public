import { Readable } from 'stream';
import { once } from 'events';
import { SaxesParser } from 'saxes';
import { decode } from 'html-entities';

export const SHOPER_FEED_URL = 'https://sklep315768.shoparena.pl/console/integration/execute/name/GoogleProductSearch/lang/pl_PL';
export const CSV_COLUMNS = [
  'item_id', 'title', 'description', 'url', 'brand', 'seller_name',
  'image_url', 'availability', 'price', 'condition', 'product_category', 'is_eligible_search',
  'is_eligible_checkout', 'is_ads_eligible',
] as const;

type FeedEntry = Record<string, string>;
export type FeedPreview = Pick<FeedEntry, 'item_id' | 'title' | 'brand' | 'availability' | 'price'>;
export type FeedSummary = {
  generatedAt: string;
  hostedUrl?: string;
  hostedAt?: string;
  publicationError?: string;
  sourceUrl: string;
  total: number;
  sourceInStock: number;
  exported: number;
  inStock: number;
  outOfStock: number;
  skipped: number;
  reasons: Record<string, number>;
  preview: FeedPreview[];
};
export type FeedImageRequest = { itemId: string; productUrl: string };

const GOOGLE_NS = 'http://base.google.com/ns/1.0';
const ATOM_NS = 'http://www.w3.org/2005/Atom';

const plainText = (value: string, limit: number): string => {
  const decoded = decode(decode(value ?? ''));
  const withoutStyles = decoded.split(/<style\b|\b[A-Za-z.#][\w.#-]*\s*\{\s*(?:color|font|display|margin|padding|width|height|background|border)\s*:/i, 1)[0];
  return withoutStyles.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
};

const validHttps = (value: string): boolean => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

const normalizePrice = (raw: string): string => {
  const match = raw.trim().match(/^([\d\s.,]+)\s+([A-Z]{3})$/);
  if (!match) return '';
  const number = Number(match[1].replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? `${number.toFixed(2)} ${match[2]}` : '';
};

const csvCell = (value: string): string => `"${value.replace(/"/g, '""')}"`;
export const csvLine = (values: string[]): string => `${values.map(csvCell).join(',')}\r\n`;

export function convertEntry(entry: FeedEntry, sellerName: string): { row?: FeedEntry; reason?: string } {
  const availability = ({ 'in stock': 'in_stock', 'out of stock': 'out_of_stock',
    'preorder': 'pre_order', 'pre-order': 'pre_order', 'backorder': 'backorder' } as Record<string, string>)[(entry.availability ?? '').toLowerCase().trim()];
  const productCategory = plainText(entry.product_type, 500);
  const row: FeedEntry = {
    item_id: (entry.id ?? '').trim(),
    title: plainText(entry.title, 150),
    description: plainText(entry.description, 5000),
    url: (entry.link ?? '').trim(),
    brand: plainText(entry.brand, 120),
    seller_name: plainText(sellerName, 120),
    image_url: (entry.image_link ?? '').trim(),
    availability: availability ?? '',
    price: normalizePrice(entry.price ?? ''),
    condition: 'used',
    product_category: productCategory,
    is_eligible_search: 'true',
    is_eligible_checkout: 'false',
    is_ads_eligible: 'true',
  };
  const required = ['item_id', 'title', 'description', 'url', 'brand', 'seller_name', 'image_url', 'availability', 'price'];
  const missing = required.find((key) => !row[key]);
  if (missing) return { reason: `Brak lub niepoprawne: ${missing}` };
  if (!validHttps(row.url) || !validHttps(row.image_url)) return { reason: 'Niepubliczny lub niepoprawny adres HTTPS' };
  return { row };
}

export async function convertFeed(
  source: Readable,
  output: NodeJS.WritableStream,
  maxBytes = 250 * 1024 * 1024,
  recoverImages?: (items: FeedImageRequest[]) => Promise<Map<string, string>>,
): Promise<FeedSummary> {
  const summary: FeedSummary = { generatedAt: new Date().toISOString(), sourceUrl: SHOPER_FEED_URL,
    total: 0, sourceInStock: 0, exported: 0, inStock: 0, outOfStock: 0, skipped: 0, reasons: {}, preview: [] };
  const parser = new SaxesParser({ xmlns: true });
  let depth = 0;
  let entry: FeedEntry | null = null;
  let field = '';
  let sellerField = false;
  let sellerName = '';
  let queued: string[] = [];
  let bytes = 0;
  let sawFeed = false;
  const ids = new Set<string>();
  const missingImages: FeedEntry[] = [];
  const skip = (reason: string) => {
    summary.skipped++;
    summary.reasons[reason] = (summary.reasons[reason] ?? 0) + 1;
  };
  const addRow = (row: FeedEntry) => {
    if (ids.has(row.item_id)) {
      skip('Powtórzony item_id');
      return;
    }
    ids.add(row.item_id);
    queued.push(csvLine(CSV_COLUMNS.map((key) => row[key])));
    summary.exported++;
    if (row.availability === 'in_stock') summary.inStock++;
    if (row.availability === 'out_of_stock') summary.outOfStock++;
    if (summary.preview.length < 10) summary.preview.push({
      item_id: row.item_id, title: row.title, brand: row.brand,
      availability: row.availability, price: row.price,
    });
  };

  parser.on('opentag', (tag) => {
    depth++;
    if (depth === 1 && tag.local === 'feed' && tag.uri === ATOM_NS) sawFeed = true;
    if (depth === 2 && tag.local === 'entry' && tag.uri === ATOM_NS) entry = {};
    if (depth === 2 && tag.local === 'title' && tag.uri === ATOM_NS) sellerField = true;
    if (entry && depth === 3) {
      field = tag.uri === GOOGLE_NS || tag.uri === ATOM_NS ? tag.local : '';
    }
  });
  const append = (value: string) => {
    if (entry && field) entry[field] = (entry[field] ?? '') + value;
    else if (sellerField) sellerName += value;
  };
  parser.on('text', append);
  parser.on('cdata', append);
  parser.on('closetag', (tag) => {
    if (depth === 2 && tag.local === 'entry' && entry) {
      summary.total++;
      if (entry.availability?.trim().toLowerCase() === 'in stock') summary.sourceInStock++;
      const { row, reason } = convertEntry(entry, sellerName);
      if (row) {
        addRow(row);
      } else if (recoverImages && reason === 'Brak lub niepoprawne: image_url'
        && entry.availability?.trim().toLowerCase() === 'in stock' && /^\d+$/.test(entry.id?.trim() ?? '')) {
        missingImages.push(entry);
      } else {
        skip(reason ?? 'Nieznany błąd');
      }
      entry = null;
    }
    if (depth === 3) field = '';
    if (depth === 2 && tag.local === 'title') sellerField = false;
    depth--;
  });

  if (!output.write(csvLine([...CSV_COLUMNS]))) await once(output, 'drain');
  for await (const chunk of source) {
    bytes += Buffer.byteLength(chunk);
    if (bytes > maxBytes) throw new Error('Feed Shoper przekracza limit rozmiaru.');
    parser.write(chunk.toString());
    if (queued.length) {
      const batch = queued.join('');
      queued = [];
      if (!output.write(batch)) await once(output, 'drain');
    }
  }
  parser.close();
  if (missingImages.length && recoverImages) {
    const images = await recoverImages(missingImages.map((item) => ({
      itemId: item.id, productUrl: item.link,
    })));
    for (const item of missingImages) {
      item.image_link = images.get(item.id) ?? '';
      const { row, reason } = convertEntry(item, sellerName);
      if (row) addRow(row);
      else skip(reason ?? 'Nieznany błąd');
    }
  }
  if (!sawFeed || summary.total === 0) throw new Error('Źródło nie zawiera wpisów Atom Shoper.');
  if (summary.exported === 0) throw new Error('Żaden produkt Shoper nie ma kompletu pól wymaganych w feedzie.');
  if (queued.length && !output.write(queued.join(''))) await once(output, 'drain');
  return summary;
}
