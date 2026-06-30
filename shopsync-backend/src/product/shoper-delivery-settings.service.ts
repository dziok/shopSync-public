import { Injectable } from "@nestjs/common";
import * as fs from "fs/promises";
import * as path from "path";

const CONFIG_PATH = path.join(process.cwd(), "shoper-delivery-settings.json");

export type ShoperDeliveryWeekdayKey = "0" | "1" | "2" | "3" | "4" | "5" | "6";

export interface ShoperDeliverySettingsFile {
  revision: number;
  updatedAt: string;
  enabled: boolean;
  categoryId?: number | null;
  categoryIds: number[];
  schedule: Record<ShoperDeliveryWeekdayKey, string>;
  autoRun: {
    enabled: boolean;
    runAt: string;
    timezone: string;
    lastRunDate?: string;
    lastRunKey?: string;
    lastJobId?: string;
    lastStatus?: "started" | "completed" | "failed";
    lastStartedAt?: string;
    lastFinishedAt?: string;
  };
  includeInactive: boolean;
  onlyInStock: boolean;
}

export type ShoperDeliverySettingsPatch = Partial<
  Omit<ShoperDeliverySettingsFile, "revision" | "updatedAt">
>;

function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function mergeDeep(target: any, patch: any): any {
  if (!isPlainObject(patch)) return patch;

  const out = isPlainObject(target) ? { ...target } : {};
  for (const [key, patchVal] of Object.entries(patch)) {
    const targetVal = out[key];
    out[key] =
      isPlainObject(patchVal) && isPlainObject(targetVal)
        ? mergeDeep(targetVal, patchVal)
        : patchVal;
  }
  return out;
}

@Injectable()
export class ShoperDeliverySettingsService {
  private isValidTime(value: any): value is string {
    return (
      typeof value === "string" &&
      /^\d{2}:\d{2}$/.test(value) &&
      Number(value.slice(0, 2)) >= 0 &&
      Number(value.slice(0, 2)) <= 23 &&
      Number(value.slice(3, 5)) >= 0 &&
      Number(value.slice(3, 5)) <= 59
    );
  }

  private defaults(): ShoperDeliverySettingsFile {
    return {
      revision: 1,
      updatedAt: new Date().toISOString(),
      enabled: false,
      categoryId: null,
      categoryIds: [],
      schedule: {
        "0": "2",
        "1": "2",
        "2": "1",
        "3": "1",
        "4": "1",
        "5": "1",
        "6": "1",
      },
      autoRun: {
        enabled: false,
        runAt: "07:00",
        timezone: "Europe/Warsaw",
      },
      includeInactive: false,
      onlyInStock: true,
    };
  }

  private normalize(raw: any): ShoperDeliverySettingsFile {
    const def = this.defaults();
    const schedule = { ...def.schedule };

    for (const key of Object.keys(schedule) as ShoperDeliveryWeekdayKey[]) {
      const value = raw?.schedule?.[key];
      schedule[key] =
        value !== undefined && value !== null && String(value).trim()
          ? String(value)
          : def.schedule[key];
    }

    const legacyCategoryId = Number(raw?.categoryId);
    const rawCategoryIds = Array.isArray(raw?.categoryIds) ? raw.categoryIds : [];
    const categoryIds = [
      ...rawCategoryIds,
      ...(Number.isFinite(legacyCategoryId) && legacyCategoryId > 0
        ? [legacyCategoryId]
        : []),
    ]
      .map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry) && entry > 0)
      .filter((entry, index, list) => list.indexOf(entry) === index);
    const autoRun = raw?.autoRun ?? {};

    return {
      revision: Number(raw?.revision) || def.revision,
      updatedAt:
        typeof raw?.updatedAt === "string" && raw.updatedAt
          ? raw.updatedAt
          : def.updatedAt,
      enabled: !!raw?.enabled,
      categoryId: categoryIds[0] ?? null,
      categoryIds,
      schedule,
      autoRun: {
        enabled: !!autoRun.enabled,
        runAt: this.isValidTime(autoRun.runAt) ? String(autoRun.runAt) : def.autoRun.runAt,
        timezone:
          typeof autoRun.timezone === "string" && autoRun.timezone.trim()
            ? autoRun.timezone.trim()
            : def.autoRun.timezone,
        lastRunDate:
          typeof autoRun.lastRunDate === "string" ? autoRun.lastRunDate : undefined,
        lastRunKey:
          typeof autoRun.lastRunKey === "string" ? autoRun.lastRunKey : undefined,
        lastJobId: typeof autoRun.lastJobId === "string" ? autoRun.lastJobId : undefined,
        lastStatus:
          autoRun.lastStatus === "started" ||
          autoRun.lastStatus === "completed" ||
          autoRun.lastStatus === "failed"
            ? autoRun.lastStatus
            : undefined,
        lastStartedAt:
          typeof autoRun.lastStartedAt === "string" ? autoRun.lastStartedAt : undefined,
        lastFinishedAt:
          typeof autoRun.lastFinishedAt === "string" ? autoRun.lastFinishedAt : undefined,
      },
      includeInactive: !!raw?.includeInactive,
      onlyInStock: raw?.onlyInStock !== false,
    };
  }

  private async readFileOrDefault() {
    try {
      const raw = await fs.readFile(CONFIG_PATH, "utf8");
      return this.normalize(JSON.parse(raw));
    } catch {
      const def = this.defaults();
      await fs.writeFile(CONFIG_PATH, JSON.stringify(def, null, 2), "utf8");
      return def;
    }
  }

  private async write(settings: ShoperDeliverySettingsFile) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(settings, null, 2), "utf8");
  }

  async getSettings() {
    return this.readFileOrDefault();
  }

  async patchSettings(
    patch: ShoperDeliverySettingsPatch,
    expectedRevision: number,
  ): Promise<{ ok: true; settings: ShoperDeliverySettingsFile } | { ok: false; settings: ShoperDeliverySettingsFile }> {
    const current = await this.readFileOrDefault();
    if (!Number.isFinite(expectedRevision) || expectedRevision !== current.revision) {
      return { ok: false, settings: current };
    }

    const next = this.normalize(mergeDeep(current, patch));
    next.revision = current.revision + 1;
    next.updatedAt = new Date().toISOString();
    await this.write(next);
    return { ok: true, settings: next };
  }

  async markCronStarted(runDate: string, runKey: string, jobId: string) {
    const current = await this.readFileOrDefault();
    const next: ShoperDeliverySettingsFile = {
      ...current,
      revision: current.revision + 1,
      updatedAt: new Date().toISOString(),
      autoRun: {
        ...current.autoRun,
        lastRunDate: runDate,
        lastRunKey: runKey,
        lastJobId: jobId,
        lastStatus: "started",
        lastStartedAt: new Date().toISOString(),
      },
    };
    await this.write(next);
    return next;
  }

  async markCronFinished(jobId: string, status: "completed" | "failed") {
    const current = await this.readFileOrDefault();
    if (current.autoRun.lastJobId !== jobId) {
      return current;
    }

    const next: ShoperDeliverySettingsFile = {
      ...current,
      revision: current.revision + 1,
      updatedAt: new Date().toISOString(),
      autoRun: {
        ...current.autoRun,
        lastStatus: status,
        lastFinishedAt: new Date().toISOString(),
      },
    };
    await this.write(next);
    return next;
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

  getWeekdayKeyInTimeZone(date: Date, timeZone: string): ShoperDeliveryWeekdayKey {
    const value = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
    }).format(date);
    const map: Record<string, ShoperDeliveryWeekdayKey> = {
      Sun: "0",
      Mon: "1",
      Tue: "2",
      Wed: "3",
      Thu: "4",
      Fri: "5",
      Sat: "6",
    };
    return map[value] ?? "1";
  }
}
