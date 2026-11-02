import { BadGatewayException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import * as fs from 'fs/promises';
import { resolve } from 'path';
import { finished } from 'stream/promises';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { createGzip } from 'zlib';
import { CloudinaryService } from '../img-host/cloudinary-service';
import { AuthService } from '../auth/auth.service';
import { getShoperRestBaseUrl } from '../config/service-endpoints';
import { convertFeed, FeedImageRequest, FeedSummary, SHOPER_FEED_URL } from './chatgpt-feed.converter';

@Injectable()
export class ChatGptFeedService {
  private readonly logger = new Logger(ChatGptFeedService.name);
  private readonly directory = resolve(process.cwd(), '.data');
  private readonly csvPath = resolve(this.directory, 'chatgpt-ads-feed.csv');
  private readonly statusPath = resolve(this.directory, 'chatgpt-ads-feed.json');
  private pending: Promise<FeedSummary> | null = null;

  constructor(private readonly cloudinary: CloudinaryService, private readonly auth: AuthService) {}

  private async recoverMissingImages(items: FeedImageRequest[]): Promise<Map<string, string>> {
    const token = await this.auth.authorizeShoper();
    const result = new Map<string, string>();
    const urls = new Map(items.map((item) => [item.itemId, item.productUrl]));
    for (let index = 0; index < items.length; index += 50) {
      const ids = items.slice(index, index + 50).map((item) => Number(item.itemId));
      const response = await axios.get(`${getShoperRestBaseUrl()}/products`, {
        params: { limit: 50, page: 1, include: 'main_image', filters: JSON.stringify({ product_id: { in: ids } }) },
        headers: { Authorization: `Bearer ${token}` }, timeout: 30000,
      });
      if (!Array.isArray(response.data?.list)) throw new Error('Shoper REST nie zwrócił listy zdjęć produktów.');
      for (const product of response.data.list) {
        const id = String(product.product_id);
        const productUrl = urls.get(id);
        const image = product.main_image;
        const imageId = String(image?.gfx_id ?? '');
        const extension = String(image?.extension ?? '').toLowerCase();
        if (!productUrl || !/^\d+$/.test(imageId) || !/^(jpg|jpeg|png|gif|webp)$/.test(extension) || String(image?.hidden) === '1') continue;
        try {
          const origin = new URL(productUrl);
          if (origin.protocol === 'https:') result.set(id, new URL(`/userdata/public/gfx/${imageId}.${extension}`, origin).toString());
        } catch { /* An invalid product URL is rejected by the converter. */ }
      }
    }
    this.logger.log(`Uzupełniono ${result.size} z ${items.length} brakujących zdjęć z Shoper REST.`);
    return result;
  }

  async status(): Promise<FeedSummary | null> {
    try {
      await fs.access(this.csvPath);
      return JSON.parse(await fs.readFile(this.statusPath, 'utf8')) as FeedSummary;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  async download() {
    if (!await this.status()) throw new NotFoundException('Najpierw wygeneruj feed.');
    return createReadStream(this.csvPath);
  }

  refresh(): Promise<FeedSummary> {
    if (this.pending) return this.pending;
    this.pending = this.generate().finally(() => { this.pending = null; });
    return this.pending;
  }

  @Cron('0 4 * * *', { timeZone: 'Europe/Warsaw' })
  async scheduledRefresh(): Promise<void> {
    try {
      const result = await this.refresh();
      if (result.publicationError) this.logger.error(`Nie opublikowano feedu: ${result.publicationError}`);
    } catch (error) {
      this.logger.error('Automatyczne odświeżenie feedu nie powiodło się.', error);
    }
  }

  private async generate(): Promise<FeedSummary> {
    await fs.mkdir(this.directory, { recursive: true });
    const tempPath = `${this.csvPath}.${randomUUID()}.tmp`;
    const output = createWriteStream(tempPath, { encoding: 'utf8' });
    let source: Readable | undefined;
    try {
      const response = await axios.get(SHOPER_FEED_URL, { responseType: 'stream', timeout: 180000,
        maxRedirects: 2, maxContentLength: 250 * 1024 * 1024 });
      source = response.data as Readable;
      source.setEncoding('utf8');
      const summary = await convertFeed(source, output, undefined, (items) => this.recoverMissingImages(items));
      output.end();
      await finished(output);
      await fs.rename(tempPath, this.csvPath);
      const gzipPath = `${this.csvPath}.${randomUUID()}.gz`;
      try {
        await pipeline(createReadStream(this.csvPath), createGzip({ level: 9 }), createWriteStream(gzipPath));
        summary.hostedUrl = await this.cloudinary.uploadRawFeed(gzipPath);
        summary.hostedAt = new Date().toISOString();
      } catch (error) {
        const previous = await this.status();
        summary.hostedUrl = previous?.hostedUrl;
        summary.hostedAt = previous?.hostedAt;
        summary.publicationError = error instanceof Error ? error.message : 'Publikacja w Cloudinary nie powiodła się.';
        this.logger.error(`Publikacja feedu w Cloudinary nie powiodła się: ${summary.publicationError}`);
      } finally {
        await fs.rm(gzipPath, { force: true });
      }
      await fs.writeFile(this.statusPath, JSON.stringify(summary), 'utf8');
      return summary;
    } catch (error) {
      source?.destroy();
      output.destroy();
      await fs.rm(tempPath, { force: true });
      const message = axios.isAxiosError(error)
        ? `Nie udało się pobrać feedu Shoper${error.response?.status ? ` (HTTP ${error.response.status})` : ''}.`
        : error instanceof Error && /Feed Shoper|produkt Shoper/.test(error.message)
          ? error.message : 'Nie udało się przetworzyć lub zapisać feedu Shoper.';
      throw new BadGatewayException(message);
    }
  }
}
