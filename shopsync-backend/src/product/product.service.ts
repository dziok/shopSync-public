import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Config } from "../config/config";
import { JwtPayload } from "../auth/auth.dto";
import axios from "axios";
import { firstValueFrom } from "rxjs";
import {
  buildAllegroUserAgent,
  withAllegroUserAgent,
} from "../allegro/allegro-user-agent";
import { allegroSandboxHttpsAgent } from "../allegro/allegro-sandbox-https";
import { randomUUID } from "crypto";
import { RelatedProductsService } from "./related-products.service";
import {
  getApiloBaseUrl,
  getShoperRestBaseUrl,
  getShoperStorefrontBaseUrl,
} from "../config/service-endpoints";

type ShoperDeliveryJob = {
  jobId: string;
  status: "running" | "completed" | "failed";
  categoryId: number;
  categoryIds?: number[];
  currentCategoryId?: number;
  deliveryId: number;
  includeInactive: boolean;
  onlyInStock: boolean;
  source?: "rest-category-tree" | "storefront-category";
  phase: "fetching-products" | "updating-products" | "completed";
  currentPage: number;
  totalPages: number | null;
  scannedCount: number;
  matchedCount: number;
  skippedOutOfStockCount: number;
  updatedCount: number;
  failedCount: number;
  categoryResults?: Array<{
    categoryId: number;
    status: "completed" | "failed";
    source?: "rest-category-tree" | "storefront-category";
    scannedCount: number;
    matchedCount: number;
    skippedOutOfStockCount: number;
    updatedCount: number;
    failedCount: number;
    error?: unknown;
  }>;
  updated: Array<{ productId: number; name?: string }>;
  failed: Array<{ productId: number; name?: string; error: unknown }>;
  error?: unknown;
  startedAt: string;
  finishedAt?: string;
};

@Injectable()
export class ProductService {
  private shoperDeliveryJobs = new Map<string, ShoperDeliveryJob>();

  constructor(
    private httpService: HttpService,
    private config: ConfigService<Config, true>,
    private relatedProductsService: RelatedProductsService,
  ) {}

  private extractRelatedPackId(dto: Record<string, any>) {
    const relatedPackId = String(
      dto?.related_pack_id ?? dto?.relatedPackId ?? "",
    ).trim();
    const payload = { ...(dto ?? {}) };
    delete payload.related_pack_id;
    delete payload.relatedPackId;
    return { relatedPackId, payload };
  }

  private normalizeCreatedProductId(responseData: any) {
    const rawId =
      responseData?.product_id ??
      responseData?.id ??
      responseData?.data?.product_id ??
      responseData?.data?.id ??
      responseData;
    const productId = Number(rawId);
    return Number.isFinite(productId) && productId > 0 ? productId : null;
  }

  private getAllegroUserAgent() {
    return buildAllegroUserAgent({
      appName: this.config.get("allegroAppName", { infer: true }),
      appVersion: this.config.get("allegroAppVersion", { infer: true }),
      appUrl: this.config.get("allegroAppUrl", { infer: true }),
    });
  }

  private getShoperRestUrl(path: string) {
    return `${getShoperRestBaseUrl()}${path}`;
  }

  private getApiloUrl(path: string) {
    return `${getApiloBaseUrl()}${path}`;
  }

  private getShoperStorefrontUrl(path: string) {
    return `${getShoperStorefrontBaseUrl()}${path}`;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async callShoperWithRetry<T>(request: () => Promise<T>) {
    const retryDelays = [1200, 2500, 5000];

    for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
      if (attempt > 0) {
        await this.sleep(retryDelays[attempt - 1]);
      }

      try {
        return await request();
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 429 &&
          attempt < retryDelays.length
        ) {
          continue;
        }
        throw error;
      }
    }

    return request();
  }

  async addInShoper(dto: Record<string, string>, decodedTokens: JwtPayload) {
    try {
      const { relatedPackId, payload } = this.extractRelatedPackId(dto);
      const response = await this.httpService.axiosRef.post(
        this.getShoperRestUrl("/products"),
        payload,
        {
          headers: {
            Authorization: `Bearer ${decodedTokens.shoperToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const productId = this.normalizeCreatedProductId(response.data);
      if (relatedPackId && productId) {
        await this.relatedProductsService.assignPackToProductSilently(
          productId,
          relatedPackId,
          decodedTokens,
        );
      }

      return response.data;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status ?? HttpStatus.BAD_REQUEST;
        let shoperError = e.response?.data ?? e.message;
        if (shoperError && typeof shoperError === "object" && !Array.isArray(shoperError)) {
          const details = shoperError as Record<string, unknown>;
          const description = details.error_description;
          if (typeof description === "string") {
            const match = /Attribute ['"]?(\d+)['"]?/.exec(description);
            if (match) {
              try {
                const attributeResponse = await this.httpService.axiosRef.get(
                  this.getShoperRestUrl(`/attributes/${match[1]}`),
                  { headers: { Authorization: `Bearer ${decodedTokens.shoperToken}` } },
                );
                const attribute = attributeResponse.data as Record<string, unknown>;
                const name = typeof attribute?.name === "string" ? attribute.name.trim() : "";
                if (name) {
                  shoperError = {
                    ...details,
                    error_description: description
                      .replace(match[0], `Atrybut „${name}” (ID ${match[1]})`)
                      .replace(/ has invalid option value/i, ' ma nieprawidłową wartość opcji'),
                  };
                }
              } catch {
                // Keep the original Shoper error if attribute metadata is unavailable.
              }
            }
          }
        }
        console.error("Shoper add product error:", status, shoperError);
        throw new HttpException(
          {
            message: "Shoper rejected product request",
            error: e.response?.statusText ?? e.code ?? "Shoper API error",
            statusCode: status,
            shoperError,
          },
          status,
        );
      }
      throw new InternalServerErrorException();
    }
  }
  async createAttribute(data: any, decodedTokens: JwtPayload) {
    const response = await axios.post(
      this.getShoperRestUrl("/attributes"),
      data,
      {
        headers: {
          Authorization: `Bearer ${decodedTokens.shoperToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  }

  async addInApilo(dto: Record<string, string>, decodedTokens: JwtPayload) {
    const url = this.getApiloUrl("/warehouse/product/");
    const headers = {
      Authorization: `Bearer ${decodedTokens.apiloToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const isArrayPayload = Array.isArray(dto);
    const primaryPayload = dto;
    const fallbackPayloads: any[] = [];
    if (isArrayPayload) {
      fallbackPayloads.push({ products: dto });
      if (dto.length) {
        fallbackPayloads.push(dto[0]);
      }
    } else if (dto && typeof dto === "object" && "products" in (dto as any)) {
      const products = (dto as any).products;
      fallbackPayloads.push(products);
      if (Array.isArray(products) && products.length) {
        fallbackPayloads.push(products[0]);
      }
    } else if (dto && typeof dto === "object") {
      fallbackPayloads.push({ products: [dto] });
    }

    try {
      const apiloResponse = await this.httpService.axiosRef.post(
        url,
        primaryPayload,
        { headers },
      );
      return apiloResponse.data;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const data = e.response?.data ?? e.message;
        console.error("Apilo add error:", status);

        const shouldRetry =
          status === 500 &&
          typeof data?.message === "string" &&
          data.message.includes("ServiceNotFoundException") &&
          fallbackPayloads.length > 0;

        if (shouldRetry) {
          for (const [index, fallbackPayload] of fallbackPayloads.entries()) {
            try {
              console.warn(
                `Apilo add retry with fallback payload shape #${index + 1}`,
              );
              const retryResponse = await this.httpService.axiosRef.post(
                url,
                fallbackPayload,
                { headers },
              );
              return retryResponse.data;
            } catch (retryError) {
              if (axios.isAxiosError(retryError)) {
                const retryStatus = retryError.response?.status;
                const retryData =
                  retryError.response?.data ?? retryError.message;
                console.error("Apilo add retry error:", retryStatus);
                if (retryStatus && retryStatus >= 400 && retryStatus <= 499) {
                  throw new BadRequestException(retryData);
                }
              } else {
                throw new InternalServerErrorException();
              }
            }
          }
          throw new InternalServerErrorException(data);
        }

        if (status && status >= 400 && status <= 499) {
          throw new BadRequestException(data);
        }
        throw new InternalServerErrorException(data);
      }
      throw new InternalServerErrorException();
    }
  }

  async updateApiloProduct(
    dto: Record<string, any>,
    decodedTokens: JwtPayload,
  ) {
    const sku = String(dto?.sku ?? dto?.SKU ?? "").trim();
    if (!sku) {
      throw new BadRequestException("Missing SKU for Apilo update");
    }
    try {
      const listResponse = await this.httpService.axiosRef.get(
        this.getApiloUrl("/warehouse/product/"),
        {
          headers: {
            Authorization: `Bearer ${decodedTokens.apiloToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          params: { sku },
        },
      );

      const products = listResponse.data?.products ?? [];
      if (!products.length) {
        throw new NotFoundException("Produkt Apilo o podanym SKU nie istnieje");
      }

      const matchingProducts = products.filter((product: any) => product.sku === sku);
      const requestedId = dto.targetId == null ? null : String(dto.targetId);
      const selectedProducts = requestedId == null
        ? matchingProducts
        : matchingProducts.filter((product: any) =>
            String(product.id ?? product.productId ?? product.product_id) === requestedId,
          );
      if (selectedProducts.length !== 1 ||
          (listResponse.data?.totalCount ?? products.length) > products.length) {
        throw new BadRequestException("Nie można jednoznacznie wskazać produktu Apilo o podanym SKU");
      }

      const productId = selectedProducts[0].id ?? selectedProducts[0].productId ?? selectedProducts[0].product_id;
      if (!productId) {
        throw new NotFoundException("Nie udało się ustalić ID produktu Apilo");
      }

      const updatePayload = {
        sku: dto.sku ?? sku,
        name: dto.name,
        tax: dto.tax ?? 23,
        status: dto.status ?? 1,
        quantity: dto.quantity,
        priceWithTax: dto.priceWithTax,
        description: dto.description,
        images: dto.images,
      };

      const updateResponse = await this.httpService.axiosRef.put(
        this.getApiloUrl(`/warehouse/product/${productId}/`),
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${decodedTokens.apiloToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      return updateResponse.data;
    } catch (e) {
      if (e instanceof BadRequestException || e instanceof NotFoundException) {
        throw e;
      }
      if (axios.isAxiosError(e) && e.response) {
        throw new BadRequestException(e.response.data);
      }
      throw new InternalServerErrorException();
    }
  }

  async addAttributes(dto: Record<string, string>, decodedTokens: JwtPayload) {
    try {
      const apiloResponse = await this.httpService.axiosRef.patch(
        this.getApiloUrl("/warehouse/product/attributes/"),
        dto,
        {
          headers: {
            Authorization: `Bearer ${decodedTokens.apiloToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      return apiloResponse.data;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const data = e.response?.data ?? e.message;
        console.error("Apilo addAttributes error:", status);
        if (status && status >= 400 && status <= 499) {
          throw new BadRequestException(data);
        }
        throw new InternalServerErrorException(data);
      }
      throw new InternalServerErrorException();
    }
  }

  async updateOne(
    productId: number,
    dto: Record<string, string>,
    decodedTokens: JwtPayload,
  ) {
    try {
      const { relatedPackId, payload } = this.extractRelatedPackId(dto);
      const response = await this.httpService.axiosRef.put(
        this.getShoperRestUrl(`/products/${productId}`),
        payload,
        {
          headers: {
            Authorization: `Bearer ${decodedTokens.shoperToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (relatedPackId) {
        await this.relatedProductsService.assignPackToProductSilently(
          productId,
          relatedPackId,
          decodedTokens,
        );
      }

      return response.data;
    } catch (e) {
      if (axios.isAxiosError(e) && e.status >= 400 && e.status <= 500) {
        throw new BadRequestException({
          message: e.message,
          errors: e.response.data,
        });
      }
      throw new InternalServerErrorException();
    }
  }

  async getShoperProductById(productId: number, decodedTokens: JwtPayload) {
    try {
      const response = await this.httpService.axiosRef.get(
        this.getShoperRestUrl(`/products/${productId}`),
        {
          headers: {
            Authorization: `Bearer ${decodedTokens.shoperToken}`,
            "Content-Type": "application/json",
          },
          params: {
            include: "translations,attributes,stock",
          },
        },
      );

      const product = response.data;

      if (!product?.attributes) {
        try {
          const attributesResponse = await this.httpService.axiosRef.get(
            this.getShoperRestUrl(`/products/${productId}/attributes`),
            {
              headers: {
                Authorization: `Bearer ${decodedTokens.shoperToken}`,
                "Content-Type": "application/json",
              },
            },
          );
          const attributesPayload = attributesResponse.data;
          product.attributes = attributesPayload?.list ?? attributesPayload;
        } catch (attributesError) {
          if (
            axios.isAxiosError(attributesError) &&
            attributesError.response?.status === 404
          ) {
            return product;
          }
          throw attributesError;
        }
      }

      return product;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        throw new BadRequestException(e.response.data);
      }
      throw new InternalServerErrorException();
    }
  }

  async getShoperDeliveryTimes(decodedTokens: JwtPayload) {
    try {
      const response = await this.httpService.axiosRef.get(
        this.getShoperRestUrl("/deliveries"),
        {
          headers: {
            Authorization: `Bearer ${decodedTokens.shoperToken}`,
            "Content-Type": "application/json",
          },
          params: {
            limit: 100,
            page: 1,
          },
        },
      );

      return response.data;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        throw new BadRequestException(e.response.data);
      }
      throw new InternalServerErrorException();
    }
  }

  async searchShoperProducts(phrase: string, decodedTokens: JwtPayload) {
    const normalizedPhrase = String(phrase ?? "").trim().toLowerCase();
    if (normalizedPhrase.length < 2) {
      return { list: [] };
    }

    const headers = {
      Authorization: `Bearer ${decodedTokens.shoperToken}`,
      "Content-Type": "application/json",
    };
    const results = new Map<number, any>();
    const directId = Number(normalizedPhrase);

    if (Number.isFinite(directId) && directId > 0) {
      try {
        const product = await this.getShoperProductById(directId, decodedTokens);
        const normalized = this.normalizeShoperProductSearchResult(product);
        if (normalized) {
          results.set(normalized.product_id, normalized);
        }
      } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 404) {
          console.warn("Nie udało się pobrać produktu Shoper po ID", error);
        }
      }
    }

    let page = 1;
    let pages = 1;
    const limit = 50;
    const maxPages = 10;

    do {
      const response = await this.callShoperWithRetry(() =>
        this.httpService.axiosRef.get(
          this.getShoperRestUrl("/products"),
          {
            params: {
              limit,
              page,
              include: "translations,stock",
            },
            headers,
          },
        ),
      );
      const payload = response.data;
      const list = Array.isArray(payload?.list) ? payload.list : [];

      if (page === 1) {
        pages = Math.min(Number(payload?.pages ?? 1) || 1, maxPages);
      }

      for (const product of list) {
        const normalized = this.normalizeShoperProductSearchResult(product);
        if (!normalized) continue;

        const haystack = [
          normalized.product_id,
          normalized.code,
          normalized.name,
        ]
          .join(" ")
          .toLowerCase();

        if (haystack.includes(normalizedPhrase)) {
          results.set(normalized.product_id, normalized);
        }
      }

      page += 1;
    } while (page <= pages && results.size < 30);

    return { list: [...results.values()].slice(0, 30) };
  }

  private normalizeShoperProductSearchResult(product: any) {
    const productId = Number(product?.product_id ?? product?.id);
    if (!Number.isFinite(productId) || productId <= 0) {
      return null;
    }

    const name =
      product?.translations?.pl_PL?.name ??
      product?.translation?.name ??
      product?.name ??
      `Produkt ${productId}`;
    const code = product?.code ?? product?.sku ?? "";
    const stock = this.getShoperProductStock(product);

    return {
      product_id: productId,
      name: String(name),
      code: String(code ?? ""),
      stock,
    };
  }

  async bulkUpdateShoperDeliveryTime(
    dto: {
      categoryId?: number | string;
      categoryIds?: Array<number | string>;
      deliveryId?: number | string;
      limit?: number | string;
      includeInactive?: boolean;
      onlyInStock?: boolean;
    },
    decodedTokens: JwtPayload,
  ) {
    const categoryIds = [
      ...(Array.isArray(dto?.categoryIds) ? dto.categoryIds : []),
      ...(dto?.categoryId !== undefined && dto?.categoryId !== null
        ? [dto.categoryId]
        : []),
    ]
      .map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry) && entry > 0)
      .filter((entry, index, list) => list.indexOf(entry) === index);
    const deliveryId = Number(dto?.deliveryId);
    const limit = Math.min(Math.max(Number(dto?.limit ?? 100), 1), 100);

    if (!categoryIds.length) {
      throw new BadRequestException("Nieprawidłowe ID kategorii Shoper.");
    }
    if (!Number.isFinite(deliveryId) || deliveryId <= 0) {
      throw new BadRequestException("Nieprawidłowe ID czasu wysyłki Shoper.");
    }

    const job: ShoperDeliveryJob = {
      jobId: randomUUID(),
      status: "running",
      categoryId: categoryIds[0],
      categoryIds,
      currentCategoryId: categoryIds[0],
      deliveryId,
      includeInactive: Boolean(dto?.includeInactive),
      onlyInStock: dto?.onlyInStock !== false,
      phase: "fetching-products",
      currentPage: 0,
      totalPages: null,
      scannedCount: 0,
      matchedCount: 0,
      skippedOutOfStockCount: 0,
      updatedCount: 0,
      failedCount: 0,
      categoryResults: [],
      updated: [],
      failed: [],
      startedAt: new Date().toISOString(),
    };

    this.shoperDeliveryJobs.set(job.jobId, job);
    void this.runShoperDeliveryTimeJob(job.jobId, limit, decodedTokens);

    return job;
  }

  getShoperDeliveryTimeJob(jobId: string) {
    const job = this.shoperDeliveryJobs.get(jobId);
    if (!job) {
      throw new NotFoundException("Nie znaleziono zadania aktualizacji.");
    }
    return job;
  }

  private async runShoperDeliveryTimeJob(
    jobId: string,
    limit: number,
    decodedTokens: JwtPayload,
  ) {
    const job = this.shoperDeliveryJobs.get(jobId);
    if (!job) {
      return;
    }

    const headers = {
      Authorization: `Bearer ${decodedTokens.shoperToken}`,
      "Content-Type": "application/json",
    };

    try {
      const categoryIds = job.categoryIds?.length ? job.categoryIds : [job.categoryId];
      let totalScannedCount = 0;
      let totalMatchedCount = 0;
      let totalSkippedOutOfStockCount = 0;
      let categoryErrorCount = 0;

      for (const categoryId of categoryIds) {
        const updatedBefore = job.updated.length;
        const failedBefore = job.failed.length;
        job.categoryId = categoryId;
        job.currentCategoryId = categoryId;
        job.phase = "fetching-products";
        job.source = undefined;
        job.currentPage = 0;
        job.totalPages = null;
        job.scannedCount = 0;
        job.matchedCount = 0;
        job.skippedOutOfStockCount = 0;

        try {
          const productIds = await this.getProductIdsFromShoperCategoryRest(
            job,
            limit,
            headers,
          ).catch((restError) => {
            if (job.includeInactive) {
              throw restError;
            }

            return this.getProductIdsFromShoperCategoryApi(job, limit, headers);
          });

          const categorySource = job.source;
          const categoryScannedCount = job.scannedCount;
          const categorySkippedOutOfStockCount = job.skippedOutOfStockCount;

          job.phase = "updating-products";
          job.currentPage = 0;
          job.totalPages = productIds.length;
          job.matchedCount = totalMatchedCount + productIds.length;

          const updateConcurrency = 4;
          for (let index = 0; index < productIds.length; index += updateConcurrency) {
            const chunk = productIds.slice(index, index + updateConcurrency);
            await Promise.all(
              chunk.map(async (productId) => {
                try {
                  await this.callShoperWithRetry(() =>
                    this.httpService.axiosRef.put(
                      this.getShoperRestUrl(`/products/${productId}`),
                      {
                        stock: {
                          delivery_id: job.deliveryId,
                        },
                      },
                      { headers },
                    ),
                  );
                  job.updated.push({ productId });
                  job.updatedCount = job.updated.length;
                } catch (updateError) {
                  job.failed.push({
                    productId,
                    error: axios.isAxiosError(updateError)
                      ? (updateError.response?.data ?? updateError.message)
                      : updateError,
                  });
                  job.failedCount = job.failed.length + categoryErrorCount;
                } finally {
                  job.currentPage += 1;
                }
              }),
            );
          }

          const categoryUpdatedCount = job.updated.length - updatedBefore;
          const categoryFailedCount = job.failed.length - failedBefore;
          totalScannedCount += categoryScannedCount;
          totalMatchedCount += productIds.length;
          totalSkippedOutOfStockCount += categorySkippedOutOfStockCount;
          job.scannedCount = totalScannedCount;
          job.matchedCount = totalMatchedCount;
          job.skippedOutOfStockCount = totalSkippedOutOfStockCount;
          job.categoryResults?.push({
            categoryId,
            status: categoryFailedCount > 0 ? "failed" : "completed",
            source: categorySource,
            scannedCount: categoryScannedCount,
            matchedCount: productIds.length,
            skippedOutOfStockCount: categorySkippedOutOfStockCount,
            updatedCount: categoryUpdatedCount,
            failedCount: categoryFailedCount,
          });
        } catch (categoryError) {
          categoryErrorCount += 1;
          job.failedCount = job.failed.length + categoryErrorCount;
          job.categoryResults?.push({
            categoryId,
            status: "failed",
            source: job.source,
            scannedCount: 0,
            matchedCount: 0,
            skippedOutOfStockCount: 0,
            updatedCount: 0,
            failedCount: 1,
            error: axios.isAxiosError(categoryError)
              ? (categoryError.response?.data ?? categoryError.message)
              : categoryError,
          });
        }
      }

      const hasFailedCategory = job.categoryResults?.some(
        (categoryResult) => categoryResult.status === "failed",
      );
      job.status = hasFailedCategory ? "failed" : "completed";
      job.phase = "completed";
      job.finishedAt = new Date().toISOString();
    } catch (e) {
      job.status = "failed";
      job.error = axios.isAxiosError(e) ? (e.response?.data ?? e.message) : e;
      job.finishedAt = new Date().toISOString();
    }
  }

  private async getProductIdsFromShoperCategoryApi(
    job: ShoperDeliveryJob,
    limit: number,
    headers: Record<string, string>,
  ) {
    if (job.includeInactive) {
      throw new BadRequestException(
        "Nieaktywne produkty wymagają pełnego skanu REST. Odznacz tę opcję, aby aktualizować tylko produkty pobrane bezpośrednio z kategorii.",
      );
    }

    const productIds = new Set<number>();
    let page = 1;
    let pages = 1;
    job.source = "storefront-category";

    do {
      job.currentPage = page;
      const response = await this.callShoperWithRetry(() =>
        this.httpService.axiosRef.get(
          this.getShoperStorefrontUrl(`/categories/${job.categoryId}/products/PLN/`),
          {
            params: {
              limit,
              page,
            },
            headers: {
              "User-Agent": this.getAllegroUserAgent(),
              Accept: "application/json",
            },
          },
        ),
      );
      const payload = response.data;

      if (!payload || !Array.isArray(payload.list)) {
        throw new BadRequestException(
          "Nie udało się pobrać listy produktów z endpointu kategorii Shoper Storefront.",
        );
      }

      if (page === 1) {
        pages = Number(payload.pages ?? 1) || 1;
        job.totalPages = pages;
        job.matchedCount = Number(payload.count ?? payload.list.length) || 0;
      }

      for (const product of payload.list) {
        const productId = Number(product?.id);
        if (!Number.isFinite(productId) || productId <= 0) {
          continue;
        }

        if (job.onlyInStock && product?.can_buy === false) {
          job.skippedOutOfStockCount += 1;
          continue;
        }

        if (job.onlyInStock) {
          const stock = await this.getShoperProductStockById(productId, headers);
          if (stock !== null && stock <= 0) {
            job.skippedOutOfStockCount += 1;
            continue;
          }
        }

        productIds.add(productId);
      }
      job.scannedCount = productIds.size;

      page += 1;
    } while (page <= pages);

    job.matchedCount = productIds.size;
    return [...productIds];
  }

  private async getProductIdsFromShoperCategoryRest(
    job: ShoperDeliveryJob,
    limit: number,
    headers: Record<string, string>,
  ) {
    const productIds = new Set<number>();
    let page = 1;
    let pages = 1;
    job.source = "rest-category-tree";

    do {
      job.currentPage = page;
      const response = await this.callShoperWithRetry(() =>
        this.httpService.axiosRef.get(
          this.getShoperRestUrl("/products"),
          {
            params: {
              limit,
              page,
              include: "stock",
              filters: JSON.stringify({
                category_tree_id: job.categoryId,
              }),
            },
            headers,
          },
        ),
      );
      const payload = response.data;

      if (!payload || !Array.isArray(payload.list)) {
        throw new BadRequestException(
          "Nie udało się pobrać listy produktów z REST API Shopera po category_tree_id.",
        );
      }

      if (page === 1) {
        pages = Number(payload.pages ?? 1) || 1;
        job.totalPages = pages;
        job.matchedCount = Number(payload.count ?? payload.list.length) || 0;
      }

      for (const product of payload.list) {
        const productId = Number(product?.product_id ?? product?.id);
        if (!Number.isFinite(productId) || productId <= 0) {
          continue;
        }

        if (job.onlyInStock) {
          const stock =
            this.getShoperProductStock(product) ??
            (await this.getShoperProductStockById(productId, headers));
          if (stock !== null && stock <= 0) {
            job.skippedOutOfStockCount += 1;
            continue;
          }
        }

        productIds.add(productId);
      }
      job.scannedCount = productIds.size;

      page += 1;
    } while (page <= pages);

    job.matchedCount = productIds.size;
    return [...productIds];
  }

  private async getShoperProductStockById(
    productId: number,
    headers: Record<string, string>,
  ) {
    const response = await this.callShoperWithRetry(() =>
      this.httpService.axiosRef.get(
        this.getShoperRestUrl(`/products/${productId}`),
        {
          params: {
            include: "stock",
          },
          headers,
        },
      ),
    );

    return this.getShoperProductStock(response.data);
  }

  private getShoperProductStock(product: any): number | null {
    const candidates = [
      product?.stock?.stock,
      product?.stock?.available,
      product?.stock?.quantity,
      product?.stock,
      product?.stock_quantity,
      product?.quantity,
      product?.available,
    ];

    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined || candidate === "") {
        continue;
      }

      if (typeof candidate === "object") {
        continue;
      }

      const value = Number(candidate);
      if (Number.isFinite(value)) {
        return value;
      }
    }

    return null;
  }

  async apiloProductslist(
    params: Record<string, string>,
    decodedTokens: JwtPayload,
  ) {
    try {
      const apiloResponse = await this.httpService.axiosRef.get(
        this.getApiloUrl("/warehouse/product/"),
        {
          headers: {
            Authorization: `Bearer ${decodedTokens.apiloToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          params: params, // <- KLUCZOWE! Dodajesz parametry do zapytania
        },
      );

      return apiloResponse.data;
    } catch (e) {
      console.error("API Error:", e.response?.status ?? e.message);
      throw new InternalServerErrorException();
    }
  }

  async apiloProductDelete(id: string, decodedTokens: JwtPayload) {
    try {
      const url = this.getApiloUrl(`/warehouse/product/${id}/`);
      const apiloDeleteResponse = await this.httpService.axiosRef.delete(url, {
        headers: {
          Authorization: `Bearer ${decodedTokens.apiloToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      return apiloDeleteResponse.data;
    } catch (e) {
      if (
        axios.isAxiosError(e) &&
        e.response &&
        e.response.status >= 400 &&
        e.response.status <= 500
      ) {
        throw new BadRequestException(e.message);
      }
      throw new InternalServerErrorException();
    }
  }

  async createProductOffer(token: string, productData: any) {
    try {
      const response = await axios.post(
        "https://api.allegro.pl/sale/product-offers",
        productData,
        {
          headers: withAllegroUserAgent(
            {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/vnd.allegro.public.v1+json",
              Accept: "application/vnd.allegro.public.v1+json",
            },
            this.getAllegroUserAgent(),
          ),
        },
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message = error.response?.data || error.message;
        console.error("Błąd z Allegro API:", status);
        throw new HttpException(message, status);
      } else {
        console.error("Nieoczekiwany błąd podczas tworzenia oferty Allegro.");
        throw new HttpException(
          "Nieoczekiwany błąd serwera",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async createProductProposal(token: string, productData: any) {
    try {
      const response = await axios.post(
        "https://api.allegro.pl.allegrosandbox.pl/sale/product-proposals",
        productData,
        {
          headers: withAllegroUserAgent(
            {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/vnd.allegro.public.v1+json",
              Accept: "application/vnd.allegro.public.v1+json",
            },
            this.getAllegroUserAgent(),
          ),
          httpsAgent: allegroSandboxHttpsAgent,
        },
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message = error.response?.data || error.message;
        console.error("Błąd z Allegro API:", status);
        throw new HttpException(message, status);
      } else {
        console.error("Nieoczekiwany błąd podczas tworzenia propozycji produktu Allegro.");
        throw new HttpException(
          "Nieoczekiwany błąd serwera",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async getCategoryParameters(token: string, categoryId: string) {
    try {
      const response = await axios.get(
        `https://api.allegro.pl/sale/categories/${categoryId}/parameters`,
        {
          headers: withAllegroUserAgent(
            {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.allegro.public.v1+json",
            },
            this.getAllegroUserAgent(),
          ),
        },
      );
      return response.data;
    } catch (error) {
      console.error(
        "Błąd pobierania parametrów kategorii:",
        error.response?.data || error.message,
      );
      throw new Error("Nie udało się pobrać parametrów kategorii z Allegro.");
    }
  }

  async searchProductByGTIN(searchName: string, accessToken: string) {
    const url = `https://api.allegro.pl/sale/products?phrase=${searchName}&language=pl-PL`;

    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: withAllegroUserAgent(
          {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.allegro.public.v1+json",
          },
          this.getAllegroUserAgent(),
        ),
      }),
    );

    return response.data;
  }

  async getResponsiblePersons(accessToken: string) {
    const url = `https://api.allegro.pl/sale/responsible-producers`;

    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: withAllegroUserAgent(
          {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.allegro.public.v1+json",
          },
          this.getAllegroUserAgent(),
        ),
      }),
    );

    return response.data;
  }
}
