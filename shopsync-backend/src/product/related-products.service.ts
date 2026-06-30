import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";
import { JwtPayload } from "../auth/auth.dto";
import { getShoperRestBaseUrl } from "../config/service-endpoints";

const DB_PATH = path.join(process.cwd(), "related-products.json");

export type RelatedProductPack = {
  id: string;
  name: string;
  productIds: number[];
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type RelatedProductAssignment = {
  productId: number;
  packId: string;
  packRevision: number;
  assignedAt: string;
  lastSyncedAt?: string;
  lastSyncStatus?: "pending" | "success" | "failed";
  lastSyncError?: unknown;
};

export type RelatedProductsFile = {
  revision: number;
  updatedAt: string;
  packs: RelatedProductPack[];
  assignments: RelatedProductAssignment[];
  autoRun: {
    enabled: boolean;
    runAt: string;
    timezone: string;
    lastRunDate?: string;
    lastRunKey?: string;
    lastStatus?: "started" | "completed" | "failed";
    lastStartedAt?: string;
    lastFinishedAt?: string;
    lastUpdatedCount?: number;
    lastFailedCount?: number;
  };
};

type PackInput = {
  name?: unknown;
  productIds?: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function uniqueNumbers(values: unknown): number[] {
  const source = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(/[\s,;]+/)
      : [];

  return source
    .map((value) => Number(String(value).trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function serializeError(error: unknown) {
  if (axios.isAxiosError(error)) {
    return {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return error;
}

@Injectable()
export class RelatedProductsService {
  private writeQueue = Promise.resolve();

  constructor(private readonly httpService: HttpService) {}

  private getShoperRestUrl(path: string) {
    return `${getShoperRestBaseUrl()}${path}`;
  }

  private defaults(): RelatedProductsFile {
    return {
      revision: 1,
      updatedAt: new Date().toISOString(),
      packs: [],
      assignments: [],
      autoRun: {
        enabled: true,
        runAt: "03:00",
        timezone: "Europe/Warsaw",
      },
    };
  }

  private normalize(raw: unknown): RelatedProductsFile {
    const def = this.defaults();
    const obj = isPlainObject(raw) ? raw : {};
    const rawAutoRun = isPlainObject(obj.autoRun) ? obj.autoRun : {};
    const packs = Array.isArray(obj.packs) ? obj.packs : [];
    const assignments = Array.isArray(obj.assignments) ? obj.assignments : [];

    return {
      revision: Number(obj.revision) || def.revision,
      updatedAt:
        typeof obj.updatedAt === "string" && obj.updatedAt
          ? obj.updatedAt
          : def.updatedAt,
      packs: packs
        .map((pack) => {
          if (!isPlainObject(pack)) return null;
          const productIds = uniqueNumbers(pack.productIds);
          const name = String(pack.name ?? "").trim();
          if (!name) return null;

          return {
            id:
              typeof pack.id === "string" && pack.id.trim()
                ? pack.id.trim()
                : randomUUID(),
            name,
            productIds,
            revision: Number(pack.revision) || 1,
            createdAt:
              typeof pack.createdAt === "string" && pack.createdAt
                ? pack.createdAt
                : new Date().toISOString(),
            updatedAt:
              typeof pack.updatedAt === "string" && pack.updatedAt
                ? pack.updatedAt
                : new Date().toISOString(),
          };
        })
        .filter((pack): pack is RelatedProductPack => !!pack),
      assignments: assignments
        .map((assignment) => {
          if (!isPlainObject(assignment)) return null;
          const productId = Number(assignment.productId);
          const packId = String(assignment.packId ?? "").trim();
          if (!Number.isFinite(productId) || productId <= 0 || !packId) {
            return null;
          }

          const lastSyncStatus: RelatedProductAssignment["lastSyncStatus"] =
            assignment.lastSyncStatus === "pending" ||
            assignment.lastSyncStatus === "success" ||
            assignment.lastSyncStatus === "failed"
              ? assignment.lastSyncStatus
              : "pending";
          const normalizedAssignment: RelatedProductAssignment = {
            productId,
            packId,
            packRevision: Number(assignment.packRevision) || 0,
            assignedAt:
              typeof assignment.assignedAt === "string" && assignment.assignedAt
                ? assignment.assignedAt
                : new Date().toISOString(),
            lastSyncStatus,
          };

          if (typeof assignment.lastSyncedAt === "string") {
            normalizedAssignment.lastSyncedAt = assignment.lastSyncedAt;
          }
          if ("lastSyncError" in assignment) {
            normalizedAssignment.lastSyncError = assignment.lastSyncError;
          }

          return normalizedAssignment;
        })
        .filter(
          (assignment): assignment is RelatedProductAssignment => !!assignment,
        ),
      autoRun: {
        enabled: rawAutoRun.enabled !== false,
        runAt: this.isValidTime(rawAutoRun.runAt)
          ? String(rawAutoRun.runAt)
          : def.autoRun.runAt,
        timezone:
          typeof rawAutoRun.timezone === "string" &&
          rawAutoRun.timezone.trim()
            ? rawAutoRun.timezone.trim()
            : def.autoRun.timezone,
        lastRunDate:
          typeof rawAutoRun.lastRunDate === "string"
            ? rawAutoRun.lastRunDate
            : undefined,
        lastRunKey:
          typeof rawAutoRun.lastRunKey === "string"
            ? rawAutoRun.lastRunKey
            : undefined,
        lastStatus:
          rawAutoRun.lastStatus === "started" ||
          rawAutoRun.lastStatus === "completed" ||
          rawAutoRun.lastStatus === "failed"
            ? rawAutoRun.lastStatus
            : undefined,
        lastStartedAt:
          typeof rawAutoRun.lastStartedAt === "string"
            ? rawAutoRun.lastStartedAt
            : undefined,
        lastFinishedAt:
          typeof rawAutoRun.lastFinishedAt === "string"
            ? rawAutoRun.lastFinishedAt
            : undefined,
        lastUpdatedCount: Number(rawAutoRun.lastUpdatedCount) || undefined,
        lastFailedCount: Number(rawAutoRun.lastFailedCount) || undefined,
      },
    };
  }

  private isValidTime(value: unknown): value is string {
    return (
      typeof value === "string" &&
      /^\d{2}:\d{2}$/.test(value) &&
      Number(value.slice(0, 2)) >= 0 &&
      Number(value.slice(0, 2)) <= 23 &&
      Number(value.slice(3, 5)) >= 0 &&
      Number(value.slice(3, 5)) <= 59
    );
  }

  private async readFileOrDefault() {
    try {
      const raw = await fs.readFile(DB_PATH, "utf8");
      return this.normalize(JSON.parse(raw));
    } catch {
      const def = this.defaults();
      await fs.writeFile(DB_PATH, JSON.stringify(def, null, 2), "utf8");
      return def;
    }
  }

  private async write(db: RelatedProductsFile) {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  }

  private async mutate<T>(callback: (db: RelatedProductsFile) => Promise<T>) {
    const previous = this.writeQueue;
    let release: () => void = () => undefined;
    this.writeQueue = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    try {
      return await callback(await this.readFileOrDefault());
    } finally {
      release();
    }
  }

  private validatePackInput(input: PackInput) {
    const name = String(input.name ?? "").trim();
    const productIds = uniqueNumbers(input.productIds);

    if (!name) {
      throw new BadRequestException("Nazwa paczki jest wymagana.");
    }

    if (!productIds.length) {
      throw new BadRequestException("Dodaj co najmniej jeden ID produktu.");
    }

    return { name, productIds };
  }

  private addMeta(db: RelatedProductsFile) {
    const packById = new Map(db.packs.map((pack) => [pack.id, pack]));
    const dueAssignments = db.assignments.filter((assignment) => {
      const pack = packById.get(assignment.packId);
      return !!pack && assignment.packRevision < pack.revision;
    });

    return {
      ...db,
      dueAssignmentsCount: dueAssignments.length,
    };
  }

  async getState() {
    return this.addMeta(await this.readFileOrDefault());
  }

  async createPack(input: PackInput) {
    const { name, productIds } = this.validatePackInput(input);
    return this.mutate(async (db) => {
      const now = new Date().toISOString();
      const next: RelatedProductsFile = {
        ...db,
        revision: db.revision + 1,
        updatedAt: now,
        packs: [
          ...db.packs,
          {
            id: randomUUID(),
            name,
            productIds,
            revision: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
      };
      await this.write(next);
      return this.addMeta(next);
    });
  }

  async updatePack(packId: string, input: PackInput) {
    const { name, productIds } = this.validatePackInput(input);
    return this.mutate(async (db) => {
      const existing = db.packs.find((pack) => pack.id === packId);
      if (!existing) {
        throw new NotFoundException("Paczka produktów powiązanych nie istnieje.");
      }

      const now = new Date().toISOString();
      const changed =
        existing.name !== name ||
        existing.productIds.length !== productIds.length ||
        existing.productIds.some((id, index) => id !== productIds[index]);

      const next: RelatedProductsFile = {
        ...db,
        revision: db.revision + 1,
        updatedAt: now,
        packs: db.packs.map((pack) =>
          pack.id === packId
            ? {
                ...pack,
                name,
                productIds,
                revision: changed ? pack.revision + 1 : pack.revision,
                updatedAt: now,
              }
            : pack,
        ),
      };
      await this.write(next);
      return this.addMeta(next);
    });
  }

  async deletePack(packId: string) {
    return this.mutate(async (db) => {
      const existing = db.packs.find((pack) => pack.id === packId);
      if (!existing) {
        throw new NotFoundException("Paczka produktów powiązanych nie istnieje.");
      }

      const now = new Date().toISOString();
      const next: RelatedProductsFile = {
        ...db,
        revision: db.revision + 1,
        updatedAt: now,
        packs: db.packs.filter((pack) => pack.id !== packId),
        assignments: db.assignments.filter(
          (assignment) => assignment.packId !== packId,
        ),
      };
      await this.write(next);
      return this.addMeta(next);
    });
  }

  async patchAutoRun(input: Record<string, unknown>) {
    return this.mutate(async (db) => {
      const now = new Date().toISOString();
      const next: RelatedProductsFile = {
        ...db,
        revision: db.revision + 1,
        updatedAt: now,
        autoRun: {
          ...db.autoRun,
          enabled:
            typeof input.enabled === "boolean"
              ? input.enabled
              : db.autoRun.enabled,
          runAt: this.isValidTime(input.runAt)
            ? input.runAt
            : db.autoRun.runAt,
          timezone:
            typeof input.timezone === "string" && input.timezone.trim()
              ? input.timezone.trim()
              : db.autoRun.timezone,
        },
      };
      await this.write(next);
      return this.addMeta(next);
    });
  }

  async assignPackToProduct(
    productId: number,
    packId: string,
    decodedTokens: JwtPayload,
  ) {
    const pack = await this.saveAssignment(productId, packId);

    try {
      await this.updateShoperRelatedProducts(
        productId,
        pack.productIds,
        decodedTokens.shoperToken,
      );
      await this.markAssignment(productId, pack.id, pack.revision, "success");
      return {
        success: true,
        productId,
        packId: pack.id,
        relatedProductIds: pack.productIds,
      };
    } catch (error) {
      await this.markAssignment(
        productId,
        pack.id,
        pack.revision,
        "failed",
        serializeError(error),
      );
      throw new BadRequestException({
        message: "Nie udało się zaktualizować produktów powiązanych w Shoper.",
        error: serializeError(error),
      });
    }
  }

  async assignPackToProductSilently(
    productId: number,
    packId: string,
    decodedTokens: JwtPayload,
  ) {
    try {
      return await this.assignPackToProduct(productId, packId, decodedTokens);
    } catch (error) {
      console.error("Błąd przypisania produktów powiązanych:", error);
      return null;
    }
  }

  private async saveAssignment(productId: number, packId: string) {
    if (!Number.isFinite(productId) || productId <= 0) {
      throw new BadRequestException("Nieprawidłowe ID produktu.");
    }

    if (!packId) {
      throw new BadRequestException("Nie wybrano paczki produktów powiązanych.");
    }

    return this.mutate(async (db) => {
      const pack = db.packs.find((entry) => entry.id === packId);
      if (!pack) {
        throw new NotFoundException("Paczka produktów powiązanych nie istnieje.");
      }

      const now = new Date().toISOString();
      const withoutCurrent = db.assignments.filter(
        (assignment) => assignment.productId !== productId,
      );
      const next: RelatedProductsFile = {
        ...db,
        revision: db.revision + 1,
        updatedAt: now,
        assignments: [
          ...withoutCurrent,
          {
            productId,
            packId,
            packRevision: 0,
            assignedAt: now,
            lastSyncStatus: "pending",
          },
        ],
      };
      await this.write(next);
      return pack;
    });
  }

  private async markAssignment(
    productId: number,
    packId: string,
    packRevision: number,
    status: "success" | "failed",
    error?: unknown,
  ) {
    return this.mutate(async (db) => {
      const now = new Date().toISOString();
      const next: RelatedProductsFile = {
        ...db,
        revision: db.revision + 1,
        updatedAt: now,
        assignments: db.assignments.map((assignment) =>
          assignment.productId === productId && assignment.packId === packId
            ? {
                ...assignment,
                packRevision,
                lastSyncedAt: now,
                lastSyncStatus: status,
                lastSyncError: status === "failed" ? error : undefined,
              }
            : assignment,
        ),
      };
      await this.write(next);
      return next;
    });
  }

  async syncDueAssignments(decodedTokens: JwtPayload) {
    const db = await this.readFileOrDefault();
    const packById = new Map(db.packs.map((pack) => [pack.id, pack]));
    const due = db.assignments.filter((assignment) => {
      const pack = packById.get(assignment.packId);
      return !!pack && assignment.packRevision < pack.revision;
    });
    const results = {
      updated: [] as Array<{ productId: number; packId: string }>,
      failed: [] as Array<{
        productId: number;
        packId: string;
        error: unknown;
      }>,
    };

    for (const assignment of due) {
      const pack = packById.get(assignment.packId);
      if (!pack) continue;
      try {
        await this.updateShoperRelatedProducts(
          assignment.productId,
          pack.productIds,
          decodedTokens.shoperToken,
        );
        await this.markAssignment(
          assignment.productId,
          pack.id,
          pack.revision,
          "success",
        );
        results.updated.push({
          productId: assignment.productId,
          packId: pack.id,
        });
      } catch (error) {
        const serialized = serializeError(error);
        await this.markAssignment(
          assignment.productId,
          pack.id,
          assignment.packRevision,
          "failed",
          serialized,
        );
        results.failed.push({
          productId: assignment.productId,
          packId: pack.id,
          error: serialized,
        });
      }
    }

    return results;
  }

  async markCronStarted(runDate: string, runKey: string) {
    return this.mutate(async (db) => {
      const now = new Date().toISOString();
      const next: RelatedProductsFile = {
        ...db,
        revision: db.revision + 1,
        updatedAt: now,
        autoRun: {
          ...db.autoRun,
          lastRunDate: runDate,
          lastRunKey: runKey,
          lastStatus: "started",
          lastStartedAt: now,
        },
      };
      await this.write(next);
      return next;
    });
  }

  async markCronFinished(
    status: "completed" | "failed",
    updatedCount: number,
    failedCount: number,
  ) {
    return this.mutate(async (db) => {
      const now = new Date().toISOString();
      const next: RelatedProductsFile = {
        ...db,
        revision: db.revision + 1,
        updatedAt: now,
        autoRun: {
          ...db.autoRun,
          lastStatus: status,
          lastFinishedAt: now,
          lastUpdatedCount: updatedCount,
          lastFailedCount: failedCount,
        },
      };
      await this.write(next);
      return next;
    });
  }

  async updateShoperRelatedProducts(
    productId: number,
    relatedProductIds: number[],
    shoperToken: string,
  ) {
    const headers = {
      Authorization: `Bearer ${shoperToken}`,
      "Content-Type": "application/json",
    };
    const response = await this.httpService.axiosRef.put(
      this.getShoperRestUrl(`/products/${productId}`),
      { related: relatedProductIds },
      { headers },
    );

    const verifyResponse = await this.httpService.axiosRef.get(
      this.getShoperRestUrl(`/products/${productId}`),
      {
        headers,
        params: {
          include: "related",
        },
      },
    );
    const savedRelated = Array.isArray(verifyResponse.data?.related)
      ? verifyResponse.data.related.map((id: unknown) => Number(id))
      : [];
    const expected = [...relatedProductIds].sort((a, b) => a - b);
    const actual = savedRelated
      .filter((id: number) => Number.isFinite(id))
      .sort((a: number, b: number) => a - b);

    if (
      expected.length !== actual.length ||
      expected.some((id, index) => id !== actual[index])
    ) {
      throw new InternalServerErrorException({
        message: "Shoper nie zapisał oczekiwanej listy produktów powiązanych.",
        expected,
        actual,
      });
    }

    return response.data;
  }

  getDateInTimeZone(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value ?? "1970";
    const month = parts.find((part) => part.type === "month")?.value ?? "01";
    const day = parts.find((part) => part.type === "day")?.value ?? "01";
    return `${year}-${month}-${day}`;
  }

  getHHmmInTimeZone(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
    const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
    return `${hour}:${minute}`;
  }
}
