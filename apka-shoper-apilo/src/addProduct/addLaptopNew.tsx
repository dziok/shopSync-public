import axios from "axios";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Autocomplete, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Stack, TextField, ThemeProvider, Typography } from "@mui/material";
import { MainTheme } from "./themes";
import { API_URL } from "../config";
import './addProducts.css';
import { handleImageUpload } from "../image-host";
import { batteryDescription, GradeDescriptios, keyboardDescription, matrixGradeDescriptios } from "./templates/laptopTemplate";
import { LaptopTemplateApilo } from "./templates/laptopTemplate-apilo";
import { LaptopTemplateCZ } from "./templatesCZ/laptopTemplateCZ";
import { LaptopTemplateSK } from "./templatesSK/laptopTemplateSK";
import { batteryDescriptionCZ, batteryDescriptionSK, GradeDescriptionsCZ, GradeDescriptionsSK, keyboardDescriptionCZ, keyboardDescriptionSK, matrixGradeDescriptiosCZ, matrixGradeDescriptiosSK } from "./additionalDescriptions/visualConditionDescriptions";
import { handleTranslateCZ, handleTranslateSK } from "../backendQueries/translate";
import { LaptopAttributes_CZ, LaptopAttributes_SK } from "./additionalDescriptions/attributesTranslations";
import { LaptopTemplateNew } from "./templates/laptopTemplateNew";
import { ResponsibleProducerSelect, ResponsibleResponse } from "./allegroComponents/responsibleProducers";
import { Product, SearchResult, FormData, Attribute, ProductSafetyCertificateResource, ProductSafetyProducerResource } from "../types";
import { AddImageApilo } from "../backendQueries/addImageApilo";
import { UpdateProductShoper } from "../backendQueries/updateProductShoper";
import AllegroParameters from "./allegroComponents/AllegroLaptopParameters";
import { laptopParametersAllegro } from "../allegroParameters/laptopParameters";

import AllegroSearchResults from "./allegroComponents/searchProductAllegroResoult";
import { handleSelectAllegroLaptop as handleSelectAllegroLaptopUtil } from "./allegroComponents/selectAllegroProductLaptop";
import { handleSelectAllegroProduct } from "./allegroComponents/selectAllegroProduct";
import { AddProductProps, CategoryResource, IFormInput, ProducersResource } from "./addProductTypes/addLaptopTypes";
import { handleGetProducers } from "../backendQueries/getProducers";
import { handleGetAttributeList } from "../backendQueries/handleGetAttributeList";
import { handleGetProductSafetyProducers } from "../backendQueries/getProductSafetyProducers";
import { handleGetProductSafetyCertificates } from "../backendQueries/getProductSafetyCertificates";
import { buildOfferParameters } from "./allegroComponents/buildOfferParameters";
import { ALLEGRO_LAPTOP_TEMPLATE_REVISION, AllegroLaptopTemplate, Template, TemplateItem, TemplateSection } from "./templatesAllegro/allegroDescriptionTemplate";
import {
    LaptopAttributeForm,
    MATRIX_GRADE_GHOSTS_AND_SCUFFS,
    MATRIX_GRADE_GHOSTS_AND_SCUFFS_CAT_2,
} from "./shoperParametersOrder/LaptopParametersOrder";
import { buildIntroText, dellSeriesHtml, laptopAdditionalText2 } from "./templatesAllegro/laptopAdditionalInfo";
import React from "react";
import RelatedProductsSelect from "../relatedProductsSelect";

const SHOPER_OPTION_PREFIX = "__shoper_option__:";
const isVisualConditionName = (value?: string) => (value ?? "").trim().toLowerCase() === "stan wizualny";

// Konwersja obiektu Template do ciągu HTML (do podglądu)
const templateToHtml = (template: Template): string =>
    template.sections
        .map((section) => {
            const imageItems = section.items.filter((i) => i.type === "IMAGE") as { type: "IMAGE"; url: string }[];
            const textItems = section.items.filter((i) => i.type === "TEXT") as { type: "TEXT"; content: string }[];
            const hasImage = imageItems.length > 0;
            const hasText = textItems.length > 0;
            const isSideBySide = hasImage && hasText;
            const isTwoImagesOnly = imageItems.length === 2 && !hasText;
            if (isSideBySide) {
                return `
          <div style="display:flex; gap:16px; align-items:center; margin-bottom:16px;">
            <div style="flex:0 0 40%; max-width:40%;"> 
              ${imageItems.map(img => `<img src="${img.url}" alt="" style="width:100%; height:auto; display:block;" />`).join("")}
            </div>
            <div style="flex:1;">
              ${textItems.map(t => t.content).join("")}
            </div>
          </div>
        `;
            }
            if (isTwoImagesOnly) {
                return `
          <div style="display:flex; gap:16px; align-items:stretch; margin-bottom:16px;">
            ${imageItems
                        .map(
                            (img) =>
                                `<div style="flex:1 1 50%;"><img src="${img.url}" alt="" style="width:100%; height:auto; display:block;" /></div>`
                        )
                        .join("")}
          </div>
        `;
            }
            // Sekcja pionowa (tekst i/lub obraz pod sobą)
            return `
        <div style="margin-bottom:16px;">
          ${section.items.map(item => {
                if (item.type === "TEXT") {
                    return item.content;
                }
                if (item.type === "IMAGE") {
                    return `<img src="${item.url}" alt="" style="max-width:100%; display:block; margin:10px 0;" />`;
                }
                return "";
            }).join("")}
        </div>
      `;
        })
        .join("");

// Generowanie unikalnych ID dla sekcji opisu (pomocnicze do stabilnych kluczy przy zmianie kolejności)
let sectionIdCounter = 0;
const generateSectionId = () => `section-${++sectionIdCounter}`;
const ensureSectionIds = (sections: any[]) =>
    sections.map(sec => ({ ...sec, id: (sec as any).id || generateSectionId() }));

function AddLaptopNew(props: AddProductProps) {
    // *** STANY KOMPONENTU ***
    // Podstawowe dane produktu i listy
    const [producers, setProducers] = useState<ProducersResource[]>([]);
    const [productSafetyProducers, setProductSafetyProducers] = useState<ProductSafetyProducerResource[]>([]);
    const [productSafetyCertificates, setProductSafetyCertificates] = useState<ProductSafetyCertificateResource[]>([]);
    const [categories, setCategories] = useState<CategoryResource[]>([]);
    const [attributeList, setAttributeList] = useState<Attribute[]>([]);
    // Przechowywanie przetłumaczonych nazw i dodatkowych opisów (PL -> CZ/SK)
    const [nameCZ, setNameCZ] = useState("");
    const [nameSK, setNameSK] = useState("");
    const [additinalKeyboardInfoCZ, setAdditinalKeyboardInfoCZ] = useState("");
    const [additinalKeyboardInfoSK, setAdditinalKeyboardInfoSK] = useState("");
    const [additinalMatrixInfoCZ, setAdditinalMatrixInfoCZ] = useState("");
    const [additinalMatrixInfoSK, setAdditinalMatrixInfoSK] = useState("");
    const [additinalcaseInfoCZ, setAdditinalcaseInfoCZ] = useState("");
    const [additinalcaseInfoSK, setAdditinalcaseInfoSK] = useState("");
    // Obsługa zdjęć produktu
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const [imageLinks, setImageLinks] = useState<string[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
    const lastUploadKeyRef = useRef<string>("");
    const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingShoperOffer, setLoadingShoperOffer] = useState(false);
    const [shoperOfferId, setShoperOfferId] = useState("");
    const [pendingShoperAttributes, setPendingShoperAttributes] = useState<Array<[number, unknown]> | null>(null);
    const [updatingProduct, setUpdatingProduct] = useState(false);
    const [relatedPackId, setRelatedPackId] = useState("");
    // Szablon opisu Allegro (sekcje tekstowe/obrazkowe)
    const [allegroTemplate, setAllegroTemplate] = useState<Template>({ sections: [] });
    const [selectedAllegroSectionIndex, setSelectedAllegroSectionIndex] = useState(0);

    // Dane integracji Allegro (wyszukiwanie produktu, parametry, producent odpowiedzialny, itp.)
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [showSearchresult, setShowSearchresult] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product>();
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({});
    const [lockedParams, setLockedParams] = useState<Set<string>>(new Set());
    const [responsibleData, setResponsibleData] = useState<ResponsibleResponse | undefined>(undefined);
    const [responsibleProducerId, setResponsibleProducerId] = useState<string>("");
    const [imageSlot, setImageSlot] = useState<{ sectionIndex: number; itemIndex: number; } | null>(null);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
    const [removedAutoSections, setRemovedAutoSections] = useState<Set<string>>(new Set());
    const translatedTitleSourceRef = useRef("");



    // Formularz (react-hook-form) – rejestracja pól
    const { register, handleSubmit, setValue, reset, watch, control, formState, getValues } = useForm<IFormInput>({
        mode: "onBlur",
        reValidateMode: "onBlur",
    });

    const coerceToString = (value: unknown): string => {
        if (value == null) return "";
        if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
        if (typeof value === "object") {
            const candidate = (value as { value?: unknown }).value;
            return candidate != null ? String(candidate) : "";
        }
        return String(value);
    };

    const coerceToBoolean = (value: unknown): boolean => {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            return ["1", "true", "tak", "yes", "on"].includes(normalized);
        }
        return false;
    };

    const normalizeAttributeName = (value?: string) => (value ?? "").trim().toLowerCase();
    const normalizeCountAttributeName = (value?: string) =>
        (value ?? "")
            .toLowerCase()
            .replace(/[^a-z0-9.]+/g, " ")
            .replace(/\s+/g, " ")
            .replace(",", ".")
            .trim();
    const isCountAttribute = (name?: string) => {
        const normalized = normalizeCountAttributeName(name);
        return (
            normalized.includes("usb 2.0") ||
            normalized.includes("usb 3.0") ||
            normalized.includes("usb c") ||
            normalized.includes("minijack")
        );
    };
    const normalizeCountValue = (value: unknown): string => {
        if (value == null) return "";
        if (typeof value === "boolean") return value ? "1" : "0";
        if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
        const raw = String(value).trim();
        if (!raw) return "";
        const normalized = raw.toLowerCase();
        if (["true", "tak", "yes", "on"].includes(normalized)) return "1";
        if (["false", "nie", "no", "off"].includes(normalized)) return "0";
        const numericMatch = raw.match(/\d+/);
        if (numericMatch) return numericMatch[0];
        return raw;
    };
    const normalizeBooleanLike = (value: unknown) => {
        if (typeof value === "boolean") return value ? "1" : "0";
        if (typeof value === "number") {
            if (value === 0) return "0";
            if (value === 1) return "1";
            return value;
        }
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (["true", "tak", "yes", "on"].includes(normalized)) return "1";
            if (["false", "nie", "no", "off"].includes(normalized)) return "0";
        }
        return value;
    };

    const normalizePolishYesNo = (value: unknown) => {
        if (value == null) return null;
        if (typeof value === "boolean" || typeof value === "number") {
            return coerceToBoolean(value) ? "tak" : "nie";
        }
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (["tak", "nie", "true", "false", "1", "0", "yes", "no", "on", "off"].includes(normalized)) {
                return coerceToBoolean(normalized) ? "tak" : "nie";
            }
        }
        return null;
    };

    const translateAttributeValue = (value: string, locale: "cz" | "sk") => {
        const dictionary = locale === "cz" ? LaptopAttributes_CZ : LaptopAttributes_SK;
        const normalizedYesNo = normalizePolishYesNo(value);
        const translateToken = (token: string) => {
            if (dictionary[token as keyof typeof dictionary]) return dictionary[token as keyof typeof dictionary];
            const lower = token.toLowerCase();
            return dictionary[lower as keyof typeof dictionary] ?? token;
        };
        if (normalizedYesNo) {
            return translateToken(normalizedYesNo);
        }
        const parts = value
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);
        if (parts.length > 1) {
            return parts.map(translateToken).join(", ");
        }
        return translateToken(value.trim());
    };

    const normalizeIdValue = (value: unknown) => {
        if (value == null) return null;
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (!trimmed) return null;
            const numeric = Number(trimmed);
            return Number.isFinite(numeric) ? numeric : trimmed;
        }
        return null;
    };
    const getProductSafetyProducerId = (producer?: ProductSafetyProducerResource | null) =>
        normalizeIdValue(
            (producer as any)?.gpsr_producer_id ??
            producer?.product_safety_producer_id ??
            producer?.producer_id ??
            producer?.id
        );
    const getProductSafetyCertificateId = (certificate?: ProductSafetyCertificateResource | null) =>
        normalizeIdValue(
            (certificate as any)?.gpsr_certificate_id ??
            certificate?.product_safety_certificate_id ??
            certificate?.certificate_id ??
            certificate?.id
        );

    const getProductSafetyCertificateNameById = (id: number | string) => {
        const idString = String(id);
        const match = productSafetyCertificates.find(
            (item) => String(getProductSafetyCertificateId(item)) === idString
        );
        return match?.name ?? idString;
    };
    const resolveProductSafetyCertificateId = (value: unknown) => normalizeIdValue(value);
    const normalizeLabel = (value: unknown) =>
        String(value ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

    const getTranslationValue = (translations: unknown, field: string) => {
        if (!translations || typeof translations !== "object") return undefined;

        const directPl = (translations as any).pl_PL?.[field];
        if (directPl != null && directPl !== "") return String(directPl);

        const entries = Array.isArray(translations)
            ? translations
            : Object.entries(translations as Record<string, unknown>).map(([locale, value]) => ({
                locale,
                ...(value && typeof value === "object" ? value as Record<string, unknown> : {}),
            }));

        const preferred = entries.find((entry: any) =>
            ["pl_PL", "pl", "PL"].includes(String(entry?.locale ?? entry?.lang ?? entry?.language ?? entry?.code ?? ""))
        );
        const match = preferred ?? entries.find((entry: any) => entry?.[field] != null && entry?.[field] !== "");
        return match?.[field] != null && match?.[field] !== "" ? String(match[field]) : undefined;
    };

    const getCategoryName = (category?: CategoryResource | null) =>
        getTranslationValue(category?.translations, "name") ??
        category?.translation?.name ??
        category?.name ??
        `Kategoria ${category?.category_id ?? ""}`.trim();

    const safeAttributeValue = (value: unknown) => {
        if (value == null) return "";
        if (Array.isArray(value)) return value.join(", ");
        if (typeof value === "boolean") return value ? "tak" : "nie";
        return String(value);
    };

    const getLaptopCategoryOptions = (selectedIds: number[] = []) => {
        const normalizedSelectedIds = new Set(
            selectedIds.filter((id) => Number.isFinite(id) && id > 0)
        );
        const laptopCategories = categories.filter((cat) =>
            normalizeLabel(getCategoryName(cat)).includes("laptop")
        );
        const selectedCategories = categories.filter((cat) =>
            normalizedSelectedIds.has(cat.category_id)
        );
        const merged = [...(laptopCategories.length ? laptopCategories : categories), ...selectedCategories];
        const uniqueById = new Map<number, CategoryResource>();
        merged.forEach((cat) => uniqueById.set(cat.category_id, cat));
        return Array.from(uniqueById.values());
    };

    useEffect(() => {
        if (!productSafetyCertificates.length) return;
        const current = getValues("productSafetyCertificateIds");
        if (Array.isArray(current) && current.length) return;
        const target = productSafetyCertificates.find(
            (item) => normalizeLabel(item?.name) === "laptopy"
        );
        if (!target) return;
        const id = getProductSafetyCertificateId(target);
        if (typeof id !== "number") return;
        setValue("productSafetyCertificateIds", [id], { shouldDirty: true });
    }, [productSafetyCertificates, getValues, setValue]);

    const resolveSelectValue = (attr: Attribute, value: unknown): string => {
        const selectValueForOption = (option?: { option_id: number; value: string }) => {
            if (!option?.value) return "";
            const duplicateCount = (attr.options ?? []).filter((opt) => String(opt.value ?? "") === String(option.value)).length;
            if (isVisualConditionName(attr.name) && duplicateCount > 1) {
                return `${SHOPER_OPTION_PREFIX}${option.option_id}`;
            }
            return String(option.value);
        };
        if (value == null) return "";
        if (Array.isArray(value)) {
            if (value.length === 0) return "";
            return resolveSelectValue(attr, value[0]);
        }
        if (typeof value === "object") {
            const candidate = value as { value?: unknown; option_id?: unknown; optionId?: unknown };
            const optionId = candidate.option_id ?? candidate.optionId;
            if (optionId != null) {
                const option = attr.options?.find((opt) => String(opt.option_id) === String(optionId));
                if (option?.value != null) return selectValueForOption(option);
            }
            if (candidate.value != null) return String(candidate.value);
        }
        const asString = String(value);
        const normalize = (input: string) =>
            input
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/,/g, ".")
                .replace(/[^a-z0-9.]/g, "");
        const normalizedInput = normalize(asString);
        const boolMap: Record<string, string> = {
            "1": "tak",
            "0": "nie",
            "true": "tak",
            "false": "nie",
            "tak": "tak",
            "nie": "nie",
            "yes": "tak",
            "no": "nie",
            "on": "tak",
            "off": "nie",
        };
        const normalizedBool = boolMap[normalizedInput];
        if (normalizedBool) {
            const optionByBool = attr.options?.find((opt) => {
                const optNorm = normalize(String(opt.value ?? ""));
                return optNorm === normalizedBool;
            });
            if (optionByBool?.value != null) return String(optionByBool.value);
            return normalizedBool;
        }
        const toNumber = (input: string) => {
            const normalized = normalize(input);
            const numeric = normalized.replace(/[^0-9.]/g, "");
            if (!numeric) return null;
            const parsed = Number(numeric);
            return Number.isFinite(parsed) ? parsed : null;
        };

        const optionById = attr.options?.find((opt) => String(opt.option_id) === asString);
        if (optionById?.value != null) return selectValueForOption(optionById);
        const optionByValue = attr.options?.find((opt) => String(opt.value) === asString);
        if (optionByValue?.value != null) return String(optionByValue.value);

        const normalizedValue = normalize(asString);
        const numericValue = toNumber(asString);
        const optionByNormalized = attr.options?.find(
            (opt) => normalize(String(opt.value ?? "")) === normalizedValue
        );
        if (optionByNormalized?.value != null) return String(optionByNormalized.value);

        if (numericValue != null) {
            const optionByNumber = attr.options?.find((opt) => {
                const optionNumber = toNumber(String(opt.value ?? ""));
                return optionNumber != null && optionNumber === numericValue;
            });
            if (optionByNumber?.value != null) return String(optionByNumber.value);
        }

        return asString;
    };

    const fetchAttributesByGroup = async (groupId: string): Promise<Attribute[]> => {
        let allAttributes: Attribute[] = [];
        const limit = 50;

        try {
            const fetchPaged = async (url: string, params: Record<string, unknown>) => {
                const results: Attribute[] = [];
                const seenIds = new Set<number>();
                let offset = 0;
                let totalCount: number | null = null;
                while (true) {
                    const response = await axios.get<{
                        list?: Attribute[];
                        count?: number | string;
                        pages?: number | string;
                    }>(url, {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${props.authToken}`,
                        },
                        params: {
                            limit,
                            offset,
                            ...params,
                        },
                    });
                    const list = response.data.list ?? [];
                    list.forEach((attr) => {
                        const id = Number((attr as any).attribute_id);
                        if (!Number.isFinite(id)) return;
                        if (seenIds.has(id)) return;
                        seenIds.add(id);
                        results.push(attr);
                    });
                    const parsedCount = Number(response.data.count);
                    if (Number.isFinite(parsedCount) && parsedCount > 0) {
                        totalCount = parsedCount;
                    }
                    if (list.length === 0) {
                        break;
                    }
                    offset += limit;
                    if (totalCount !== null && offset >= totalCount) {
                        break;
                    }
                    if (list.length < limit) {
                        break;
                    }
                }
                return results;
            };

            allAttributes = await fetchPaged(`${API_URL}/attributes`, {
                filters: JSON.stringify({
                    attribute_group_id: groupId,
                }),
            });
            return allAttributes;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd pobierania atrybutów grupy:", error.response?.data || error.message);
            } else {
                console.error("Błąd aplikacji:", error);
            }
            return [];
        }
    };

    const applyAttributeEntriesToForm = (
        entries: Array<[number, unknown]>,
        attributeMap: Map<number, Attribute>
    ) => {
        const countFieldIds = new Set([826, 827, 828]);
        entries.forEach(([id, value]) => {
            const attr = attributeMap.get(id);
            if (countFieldIds.has(id)) {
                setValue(`attribute_${id}`, normalizeCountValue(value), { shouldValidate: true, shouldDirty: true });
                return;
            }
            if (id === 829) {
                setValue(`attribute_${id}`, coerceToString(value), { shouldValidate: true, shouldDirty: true });
                return;
            }
            if (!attr) {
                const normalized =
                    typeof value === "string" ? value.trim().toLowerCase() : "";
                const isYesNo = normalized === "tak" || normalized === "nie";
                const isNumericBoolean =
                    typeof value === "number" && (value === 0 || value === 1);
                const isBooleanString = ["0", "1", "true", "false", "yes", "no", "on", "off"].includes(normalized);
                const looksBoolean =
                    typeof value === "boolean" ||
                    isNumericBoolean ||
                    isBooleanString ||
                    isYesNo;
                setValue(
                    `attribute_${id}`,
                    isYesNo ? coerceToString(value) : (looksBoolean ? coerceToBoolean(value) : coerceToString(value)),
                    { shouldValidate: true, shouldDirty: true }
                );
                return;
            }
            if (isCountAttribute(attr.name)) {
                setValue(`attribute_${id}`, normalizeCountValue(value), { shouldValidate: true, shouldDirty: true });
                return;
            }
            const attrType = String(attr.type);
            const normalizedValue = normalizeBooleanLike(value);
            if (attrType === "1") {
                setValue(`attribute_${id}`, coerceToBoolean(value), { shouldValidate: true, shouldDirty: true });
                return;
            }
            if (attrType === "2") {
                setValue(`attribute_${id}`, resolveSelectValue(attr, normalizedValue), { shouldValidate: true, shouldDirty: true });
                return;
            }
            setValue(`attribute_${id}`, coerceToString(normalizedValue), { shouldValidate: true, shouldDirty: true });
        });
    };

    const setAttributeValueById = (id: number, value: unknown) => {
        const attr = attributeList.find((item) => item.attribute_id === id);
        if ([826, 827, 828].includes(id)) {
            setValue(`attribute_${id}`, normalizeCountValue(value));
            return;
        }
        if (id === 829) {
            setValue(`attribute_${id}`, coerceToString(value));
            return;
        }
        const normalizeYesNo = (input: unknown) => {
            if (input == null) return "";
            if (typeof input === "boolean" || typeof input === "number") {
                return coerceToBoolean(input) ? "tak" : "nie";
            }
            if (typeof input === "string") {
                const normalized = input.trim().toLowerCase();
                if (["tak", "nie", "true", "false", "1", "0", "yes", "no", "on", "off"].includes(normalized)) {
                    return coerceToBoolean(normalized) ? "tak" : "nie";
                }
            }
            return null;
        };
        if (!attr) {
            const fallback = normalizeYesNo(value);
            setValue(`attribute_${id}`, (fallback ?? value) as any);
            return;
        }
        if (isCountAttribute(attr.name)) {
            setValue(`attribute_${id}`, normalizeCountValue(value));
            return;
        }
        const attrType = String(attr.type);
        const normalizedValue = normalizeBooleanLike(value);
        if (attrType === "1") {
            setValue(`attribute_${id}`, coerceToBoolean(value));
            return;
        }
        if (attrType === "2") {
            setValue(`attribute_${id}`, resolveSelectValue(attr, normalizedValue));
            return;
        }
        setValue(`attribute_${id}`, coerceToString(normalizedValue));
    };

    const setImportAttributeValue = (id: number, value: unknown) => {
        const attr = attributeList.find((item) => item.attribute_id === id);
        if ([826, 827, 828].includes(id)) {
            setValue(`attribute_${id}`, normalizeCountValue(value));
            return;
        }
        if (!attr) {
            if (value != null && String(value).trim() !== "") {
                setValue(`attribute_${id}`, value as any);
            }
            return;
        }
        if (isCountAttribute(attr.name)) {
            setValue(`attribute_${id}`, normalizeCountValue(value));
            return;
        }
        const normalizeOption = (input: string) =>
            input
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/,/g, ".")
                .replace(/[^a-z0-9.]/g, "");
        const toNumber = (input: string) => {
            const normalized = normalizeOption(input);
            const numeric = normalized.replace(/[^0-9.]/g, "");
            if (!numeric) return null;
            const parsed = Number(numeric);
            return Number.isFinite(parsed) ? parsed : null;
        };
        const findSelectOptionValue = (candidate: unknown) => {
            const options = attr.options ?? [];
            if (!options.length) return undefined;
            const candidateString = coerceToString(candidate);
            if (!candidateString) return undefined;
            const direct = options.find((opt) => String(opt.value ?? "") === candidateString);
            if (direct) return direct.value ?? "";
            const byId = options.find((opt) => String(opt.option_id) === candidateString);
            if (byId) return byId.value ?? "";
            const normalizedCandidate = normalizeOption(candidateString);
            const normalizedMatch = options.find(
                (opt) => normalizeOption(String(opt.value ?? "")) === normalizedCandidate
            );
            if (normalizedMatch) return normalizedMatch.value ?? "";
            const candidateNumber = toNumber(candidateString);
            if (candidateNumber != null) {
                const numberMatch = options.find((opt) => {
                    const optionNumber = toNumber(String(opt.value ?? ""));
                    return optionNumber != null && optionNumber === candidateNumber;
                });
                if (numberMatch) return numberMatch.value ?? "";
            }
            const containsMatch = options.find((opt) => {
                const normalizedOption = normalizeOption(String(opt.value ?? ""));
                return (
                    normalizedOption.includes(normalizedCandidate) ||
                    normalizedCandidate.includes(normalizedOption)
                );
            });
            if (containsMatch) return containsMatch.value ?? "";
            return undefined;
        };
        if (String(attr.type) === "1") {
            if (isCountAttribute(attr.name)) {
                setValue(`attribute_${id}`, normalizeCountValue(value));
                return;
            }
            setValue(`attribute_${id}`, coerceToBoolean(value));
            return;
        }
        if (String(attr.type) === "2" || (attr.options ?? []).length > 0) {
            const resolved = resolveSelectValue(attr, value);
            const matched =
                findSelectOptionValue(resolved) ?? findSelectOptionValue(value);
            if (matched != null) {
                setValue(`attribute_${id}`, matched);
                return;
            }
            const optionValues = new Set((attr.options ?? []).map((opt) => String(opt.value ?? "")));
            const currentValue = getValues(`attribute_${id}`);
            if (!optionValues.has(String(currentValue ?? ""))) {
                setValue(`attribute_${id}`, "");
            }
            return;
        }
        const textValue = coerceToString(value);
        if (textValue) {
            setValue(`attribute_${id}`, textValue);
        }
    };

    useEffect(() => {
        if (!pendingShoperAttributes || attributeList.length === 0) return;
        const attributeMap = new Map(attributeList.map((attr) => [attr.attribute_id, attr]));
        applyAttributeEntriesToForm(pendingShoperAttributes, attributeMap);
        setPendingShoperAttributes(null);
    }, [attributeList, pendingShoperAttributes, setValue]);

    const attributeNameMap = useMemo(
        () => new Map(attributeList.map((attr) => [normalizeAttributeName(attr.name), attr.attribute_id])),
        [attributeList]
    );
    const getAttributeIdByName = useCallback(
        (name: string) => attributeNameMap.get(normalizeAttributeName(name)),
        [attributeNameMap]
    );

    const libreOfficeAttrId = getAttributeIdByName("Libre Office");
    const win11InfoAttrId = getAttributeIdByName("Informacja o Windows 11");
    const biosPasswordInfoAttrId = getAttributeIdByName("Informacja o haśle BIOS");
    const wifiAttrId = getAttributeIdByName("WiFi") ?? getAttributeIdByName("Wi-Fi");
    const bluetoothAttrId = getAttributeIdByName("Bluetooth");
    const additionalKeyboardAttrId = getAttributeIdByName("Dodatkowy opis klawiatury");
    const additionalMatrixAttrId = getAttributeIdByName("Dodatkowy opis matrycy");
    const additionalCaseAttrId = getAttributeIdByName("Dodatkowy opis obudowy");
    const skipCaseDescriptionAttrId = getAttributeIdByName("bez opisu obudowy");
    const skipMatrixDescriptionAttrId = getAttributeIdByName("bez opisu matrycy");
    const touchScreenAttrId = getAttributeIdByName("Ekran dotykowy");
    const visualConditionAttrId = getAttributeIdByName("Stan wizualny") ?? 314;

    const getVisualConditionLabel = (value: string, duplicateIndex: number, duplicateCount: number) => {
        if (duplicateCount < 2) return value;
        if (value === "Dobry") return duplicateIndex === 0 ? "Dobry kat 2" : "Dobry";
        if (value === "Bardzo dobry") return duplicateIndex === 0 ? "Bardzo dobry" : "Bardzo dobry kat 2";
        return duplicateIndex === 0 ? value : `${value} kat ${duplicateIndex + 1}`;
    };

    const resolveShoperOptionValue = (attribute: Attribute | undefined, value: unknown) => {
        const raw = coerceToString(value);
        if (raw === MATRIX_GRADE_GHOSTS_AND_SCUFFS_CAT_2) {
            return MATRIX_GRADE_GHOSTS_AND_SCUFFS;
        }
        if (!raw.startsWith(SHOPER_OPTION_PREFIX)) return raw;
        const optionId = raw.slice(SHOPER_OPTION_PREFIX.length);
        const option =
            attribute?.options?.find((candidate) => String(candidate.option_id) === optionId) ??
            attributeList
                .flatMap((candidateAttribute) => candidateAttribute.options ?? [])
                .find((candidate) => String(candidate.option_id) === optionId);
        return String(option?.value ?? "");
    };

    const getVisualConditionDisplayValue = (value: unknown) => {
        const raw = coerceToString(value);
        if (!raw.startsWith(SHOPER_OPTION_PREFIX)) return raw;
        const optionId = raw.slice(SHOPER_OPTION_PREFIX.length);
        const visualConditionAttr =
            attributeList.find((attr) => isVisualConditionName(attr.name)) ??
            attributeList.find((attr) =>
                (attr.options ?? []).some((option) => String(option.option_id) === optionId)
            );
        const valueCounts = (visualConditionAttr?.options ?? []).reduce((acc: Record<string, number>, option) => {
            const optionValue = String(option.value ?? "");
            acc[optionValue] = (acc[optionValue] ?? 0) + 1;
            return acc;
        }, {});
        const seenValues: Record<string, number> = {};
        for (const option of visualConditionAttr?.options ?? []) {
            const optionValue = String(option.value ?? "");
            const duplicateIndex = seenValues[optionValue] ?? 0;
            seenValues[optionValue] = duplicateIndex + 1;
            if (String(option.option_id) === optionId) {
                return getVisualConditionLabel(optionValue, duplicateIndex, valueCounts[optionValue] ?? 0);
            }
        }
        return resolveShoperOptionValue(visualConditionAttr, raw);
    };
    const refurbProcessAttrId = getAttributeIdByName("Proces odnawiania");

    const handleAdditionalInfoTranslate = useCallback(async (
        value: string,
        setCZ: (value: string) => void,
        setSK: (value: string) => void,
        label: string
    ) => {
        try {
            setCZ(await handleTranslateCZ(value));
            setSK(await handleTranslateSK(value));
            toast.success(`Przetłumaczono tekst ${label} (CZ/SK)`);
        } catch (error) {
            console.error(`Błąd tłumaczenia (${label}):`, error);
            toast.error(`Błąd tłumaczenia tekstu ${label}`);
        }
    }, []);

    const ensureTranslatedTitlesForName = useCallback(async (title: string, forceRefresh = false) => {
        const normalizedTitle = String(title ?? "").trim();
        if (!normalizedTitle) {
            setNameCZ("");
            setNameSK("");
            translatedTitleSourceRef.current = "";
            return { cz: "", sk: "" };
        }

        const canReuseExistingTranslations =
            !forceRefresh &&
            translatedTitleSourceRef.current === normalizedTitle &&
            nameCZ.trim() !== "" &&
            nameSK.trim() !== "";

        if (canReuseExistingTranslations) {
            return { cz: nameCZ, sk: nameSK };
        }

        const translatedCZ = await handleTranslateCZ(normalizedTitle);
        const translatedSK = await handleTranslateSK(normalizedTitle);
        setNameCZ(translatedCZ);
        setNameSK(translatedSK);
        translatedTitleSourceRef.current = normalizedTitle;
        return { cz: translatedCZ, sk: translatedSK };
    }, [nameCZ, nameSK]);

    const textAttributeHandlers = useMemo(() => ({
        [normalizeAttributeName("Dodatkowy opis klawiatury")]: (value: string) =>
            handleAdditionalInfoTranslate(
                value,
                setAdditinalKeyboardInfoCZ,
                setAdditinalKeyboardInfoSK,
                "klawiatury"
            ),
        [normalizeAttributeName("Dodatkowy opis matrycy")]: (value: string) =>
            handleAdditionalInfoTranslate(
                value,
                setAdditinalMatrixInfoCZ,
                setAdditinalMatrixInfoSK,
                "matrycy"
            ),
        [normalizeAttributeName("Dodatkowy opis obudowy")]: (value: string) =>
            handleAdditionalInfoTranslate(
                value,
                setAdditinalcaseInfoCZ,
                setAdditinalcaseInfoSK,
                "obudowy"
            ),
    }), [handleAdditionalInfoTranslate]);

    useEffect(() => {
        if (libreOfficeAttrId) {
            const currentValue = getValues(`attribute_${libreOfficeAttrId}`);
            if (currentValue == null || currentValue === "") {
                setValue(`attribute_${libreOfficeAttrId}`, true, { shouldDirty: false, shouldValidate: false });
            }
        }
        if (win11InfoAttrId) {
            const currentValue = getValues(`attribute_${win11InfoAttrId}`);
            if (currentValue == null || currentValue === "") {
                setValue(`attribute_${win11InfoAttrId}`, false, { shouldDirty: false, shouldValidate: false });
            }
        }
        if (biosPasswordInfoAttrId) {
            const currentValue = getValues(`attribute_${biosPasswordInfoAttrId}`);
            if (currentValue == null || currentValue === "") {
                setValue(`attribute_${biosPasswordInfoAttrId}`, false, { shouldDirty: false, shouldValidate: false });
            }
        }
        if (wifiAttrId) {
            const currentValue = getValues(`attribute_${wifiAttrId}`);
            if (currentValue == null || currentValue === "") {
                setValue(`attribute_${wifiAttrId}`, true, { shouldDirty: false, shouldValidate: false });
            }
        }
        if (bluetoothAttrId) {
            const currentValue = getValues(`attribute_${bluetoothAttrId}`);
            if (currentValue == null || currentValue === "") {
                setValue(`attribute_${bluetoothAttrId}`, true, { shouldDirty: false, shouldValidate: false });
            }
        }
    }, [biosPasswordInfoAttrId, bluetoothAttrId, getValues, libreOfficeAttrId, setValue, wifiAttrId, win11InfoAttrId]);

    // *** OBSERWACJA PÓL FORMULARZA (watch) ***
    // Podstawowe pola (Shoper)
    const connectProductAllegro = watch("connectProductAllegro", true);
    const shoper_system = watch("attribute_178", "") || "";
    const name = watch("name", "");
    const allegroTitleValue = watch("allegroTitle", "");
    const shoper_cpu = watch("attribute_172");
    const shoper_cpuModel = watch("attribute_816");
    const shoper_cores = watch("attribute_817");
    const shoper_threads = watch("attribute_818");
    const shoper_frequency = watch("attribute_819");
    const shoper_frequency_turbo = watch("attribute_820");
    const shoper_ramAmount = watch("attribute_174");
    const shoper_ramType = watch("attribute_341");
    const shoper_gpu = watch("attribute_821");
    const shoper_diskType = watch("attribute_176");
    const shoper_diskSize = watch("attribute_822");
    const shoper_status = watch("attribute_168");
    const shoper_grade = watch(`attribute_${visualConditionAttrId}`);
    const shoper_matrixGrade = watch("attribute_315");
    const shoper_matrixType = watch("attribute_170");
    const shoper_matrixSize = watch("attribute_270");
    const shoper_resolution = watch("attribute_169");
    const shoper_model = watch("attribute_815");
    const producerId = watch("producer", 0);
    const producerName =
        producers.find((producer) => producer.producer_id === producerId)?.name ?? "";
    const shoper_touchScreen = watch(
        touchScreenAttrId ? `attribute_${touchScreenAttrId}` : "attribute_171"
    );
    const shoper_keyboardLayout = watch("attribute_824") || watch("attribute_340");  // Układ klawiatury (np. QWERTY)
    const shoper_color = watch("attribute_271");
    const shoper_usb2 = watch("attribute_826");
    const shoper_usb3 = watch("attribute_827");
    const shoper_usbC = watch("attribute_828");
    const shoper_miniJack = watch("attribute_829");
    const shoper_HDMI = watch("attribute_317") as boolean;
    const shoper_DP = watch("attribute_320") as boolean;
    const shoper_dSUB = watch("attribute_324") as boolean;
    const shoper_miniDP = watch("attribute_334") as boolean;
    const shoper_miniHDMI = watch("attribute_333") as boolean;
    const shoper_LAN = watch("attribute_338");
    const shoper_dockingPort = watch("attribute_321");
    const shoper_vebCam = watch("attribute_330");
    const shoper_wifi = watch(wifiAttrId ? `attribute_${wifiAttrId}` : "attribute_325", true);
    const shoper_modem = watch("attribute_328");
    const shoper_thunderbolt = watch("attribute_335");
    const shoper_bluetooth = watch(bluetoothAttrId ? `attribute_${bluetoothAttrId}` : "attribute_326", true);
    const shoper_cardReader = watch("attribute_332");
    const shoper_driveType = watch("attribute_339"); // Typ napędu (DVD/Blu-ray)
    const shoper_battery = watch("attribute_825");
    const skipCaseDescription = skipCaseDescriptionAttrId
        ? coerceToBoolean(watch(`attribute_${skipCaseDescriptionAttrId}`))
        : false;
    const skipMatrixDescription = skipMatrixDescriptionAttrId
        ? coerceToBoolean(watch(`attribute_${skipMatrixDescriptionAttrId}`))
        : false;
    const shoper_refurbProcess = refurbProcessAttrId
        ? watch(`attribute_${refurbProcessAttrId}`)
        : false;
    // Dodatkowe pola formularza (checkboxy i opcje opisu)
    const showLibre = watch(
        libreOfficeAttrId ? `attribute_${libreOfficeAttrId}` : "showLibre",
        true
    );
    const showWin11info = watch(
        win11InfoAttrId ? `attribute_${win11InfoAttrId}` : "showWin11info",
        false
    );
    const showBiosPasswordInfo = watch(
        biosPasswordInfoAttrId ? `attribute_${biosPasswordInfoAttrId}` : "showBiosPasswordInfo",
        false
    );
    const introText = watch("introText", "");
    const introText2 = watch("introText2", "");
    const series = watch("series", "");
    const additionalInfo_keyboard = watch(
        additionalKeyboardAttrId ? `attribute_${additionalKeyboardAttrId}` : "additionalInfo_keyboard",
        ""
    );
    const additionalInfo_matrix = watch(
        additionalMatrixAttrId ? `attribute_${additionalMatrixAttrId}` : "additionalInfo_matrix",
        ""
    );
    const additionalInfo_case = watch(
        additionalCaseAttrId ? `attribute_${additionalCaseAttrId}` : "additionalInfo_case",
        ""
    );
    const deferredAdditionalInfoKeyboard = useDeferredValue(additionalInfo_keyboard);
    const deferredAdditionalInfoMatrix = useDeferredValue(additionalInfo_matrix);
    const deferredAdditionalInfoCase = useDeferredValue(additionalInfo_case);
    const descriptionLanguage = watch("descriptionLanguage", "description");
    const { dirtyFields } = formState;

    let apiloImageUUIDs: string[] | undefined;  // zmienne pomocnicze (zdjęcia Apilo)

    // === FUNKCJE OBSŁUGI INTEGRACJI ALLEGRO ===
    // Wyszukiwanie produktu na Allegro
    const handleSearch = async () => {
        try {
            const response = await axios.get(`${API_URL}/product/search`, {
                params: { searchName },
                headers: { Authorization: `Bearer ${props.accessTokenAllegro}` },
            });
            setSearchResult(response.data);
            setShowSearchresult(true);
        } catch (error) {
            console.error("Błąd wyszukiwania produktu:", error);
            toast.error("Błąd wyszukiwania produktu w Allegro");
        }
    };

    // Import parametrów wybranego produktu Allegro do formularza Shoper
    const handleImportAllegroFormToShoper = () => {
        if (attributeList.length === 0) {
            toast.error("Lista atrybutów nie została jeszcze pobrana.");
            return;
        }
        const getAttrIdByNames = (names: string[]) =>
            names.map((name) => getAttributeIdByName(name)).find((id) => id != null);
        const setByNames = (names: string[], value: unknown) => {
            const id = getAttrIdByNames(names);
            if (id != null) setImportAttributeValue(id, value);
        };

        setByNames(["Stan"], formData["Stan"]);
        setByNames(["Model"], formData["Model"]);
        setByNames(["Seria procesora", "Seria"], formData["Seria procesora"]);
        setByNames(["Model procesora"], formData["Model procesora"]);
        setByNames(["Liczba rdzeni procesora", "Rdzenie"], formData["Liczba rdzeni procesora"]);
        setByNames(
            ["Taktowanie", "Taktowanie bazowe", "Taktowanie bazowe procesora"],
            normalizeClock(formData["Taktowanie bazowe procesora"])
        );
        setByNames(
            ["Taktowanie_TURBO", "Taktowanie TURBO", "Taktowanie maksymalne procesora"],
            normalizeClock(formData["Taktowanie maksymalne procesora"])
        );
        setByNames(["Wielkość pamięci RAM"], formData["Wielkość pamięci RAM"]);
        setByNames(["Typ pamięci RAM"], formData["Typ pamięci RAM"]);
        setByNames(["Rodzaj karty graficznej"], formData["Rodzaj karty graficznej"]);
        setByNames(["Chipset karty graficznej"], formData["Chipset karty graficznej"]);
        setByNames(["Interfejs dysku"], formData["Interfejs dysku"]);
        setByNames(
            ["Pojemność dysku (GB)", "Pojemność dysku"],
            formData["Pojemność dysku"] ? `${formData["Pojemność dysku"]}GB` : ""
        );
        setByNames(["Układ klawiatury", "Klawiatura"], formData["Układ klawiatury"]);
        setByNames(["Wielkość matrycy", "Przekątna ekranu"], formatDiagonalForSelect(formData["Przekątna ekranu"]));
        setByNames(["Powłoka matrycy"], formData["Powłoka matrycy"]);
        setByNames(["Rozdzielczość (px)"], formData["Rozdzielczość (px)"]);
        setByNames(["System operacyjny"], formData["System operacyjny"]);
        setByNames(["Typ"], formData["Typ"]);
        setByNames(["Kolor"], formData["Kolor"]);
        setByNames(["Ekran dotykowy"], formData["Ekran dotykowy"]);
        setByNames(["Typ napędu"], formData["Typ napędu"]);
        setByNames(["Typ dysku twardego"], formData["Typ dysku twardego"]);

        const rawPorts = (formData["Złącza"] ?? formData["złącza"]) as string | string[] | undefined;
        const ports = Array.isArray(rawPorts) ? rawPorts : rawPorts ? [rawPorts] : [];
        const rawMultimedia = formData["Multimedia"] as string | string[] | undefined;
        const multimedia = Array.isArray(rawMultimedia) ? rawMultimedia : rawMultimedia ? [rawMultimedia] : [];
        const rawComm = formData["Komunikacja"] as string | string[] | undefined;
        const communications = Array.isArray(rawComm) ? rawComm : rawComm ? [rawComm] : [];

        const hasUsb3 = ports.some(p => p.toLowerCase().includes("usb 3."));
        const hasUsb2 = ports.some(p => p.toLowerCase().includes("usb 2."));
        const hasUsbC = ports.some(p => p.toLowerCase().includes("typ c"));
        const hasJack = ports.some(p => p.toLowerCase().includes("minijack"));
        const hasHDMI = ports.some(p => p.toLowerCase() === "hdmi");
        const hasDP = ports.some(p => p.toLowerCase() === "displayport");
        const hasVGA = ports.some(p => p.toLowerCase().includes("vga"));
        const hasMiniDP = ports.some(p => p.toLowerCase() === "mini displayport");
        const hasMiniHDMI = ports.some(p => p.toLowerCase() === "mini hdmi");
        const hasLan = ports.some(p => p.toLowerCase() === "rj-45" || p.toLowerCase() === "rj45");
        const hasDocPort = ports.some(p => p.toLowerCase() === "złącze dokowania");
        const hasThunderbolt = ports.some(p => p.toLowerCase() === "thunderbolt");
        const hasCamera = multimedia.some(m => m.toLowerCase() === "kamera");
        const hasWifi = communications.some(c => c.toLowerCase() === "wi-fi" || c.toLowerCase() === "wifi");
        const hasModem4g = communications.some(c => c.toLowerCase().includes("modem 4g"));
        const hasBluetooth = communications.some(c => c.toLowerCase() === "bluetooth");

        const setFlagByNames = (names: string[], value: boolean | number) => {
            const id = getAttrIdByNames(names);
            if (id != null) {
                setValue(`attribute_${id}`, value as any);
            }
        };

        // Ustawienie pól dodatkowych (checkboxy) na podstawie wyliczonych wartości
        setFlagByNames(["USB 2.0"], hasUsb2 ? 1 : 0);
        setFlagByNames(["USB 3.0"], hasUsb3 ? 1 : 0);
        setFlagByNames(["USB C"], hasUsbC ? 1 : 0);
        setFlagByNames(["minijack 3,5 mm (audio)", "minijack 3,5 mm", "minijack"], hasJack ? 1 : 0);
        setFlagByNames(["HDMI"], hasHDMI ? true : false);
        setFlagByNames(["DisplayPort"], hasDP ? true : false);
        setFlagByNames(["D-Sub (VGA)", "VGA"], hasVGA ? true : false);
        setFlagByNames(["mini DisplayPort"], hasMiniDP ? true : false);
        setFlagByNames(["mini HDMI"], hasMiniHDMI ? true : false);
        setFlagByNames(["LAN"], hasLan ? true : false);
        setFlagByNames(["Złącze dokowania"], hasDocPort ? true : false);
        setFlagByNames(["Kamera"], hasCamera ? true : false);
        setFlagByNames(["WiFi", "Wi-Fi"], hasWifi ? true : false);
        setFlagByNames(["modem 4G"], hasModem4g ? true : false);
        setFlagByNames(["Thunderbolt"], hasThunderbolt ? true : false);
        setFlagByNames(["Bluetooth"], hasBluetooth ? true : false);
    };

    const handleFetchShoperOffer = async () => {
        const offerId = shoperOfferId.trim();
        if (!offerId) {
            toast.error("Podaj ID aukcji z Shopera.");
            return;
        }

        setLoadingShoperOffer(true);
        try {
            const response = await axios.get(`${API_URL}/product/${offerId}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${props.authToken}`,
                },
            });

            const payload = response.data as any;
            const product = payload?.product ?? payload;
            const translations = product?.translations ?? {};
            const pl = translations?.pl_PL ?? {};
            const cs = translations?.cs_CZ ?? {};
            const sk = translations?.sk_SK ?? {};

            if (pl.name) setValue("name", pl.name, { shouldValidate: true, shouldDirty: true });
            if (pl.description) setValue("description", pl.description, { shouldValidate: true, shouldDirty: true });
            if (pl.active != null) setValue("active", coerceToBoolean(pl.active), { shouldValidate: true, shouldDirty: true });
            if (product?.active != null) setValue("active", coerceToBoolean(product.active), { shouldValidate: true, shouldDirty: true });

            setNameCZ(cs.name ?? "");
            if (cs.description) setValue("descriptionCZ", cs.description, { shouldValidate: true, shouldDirty: true });
            setNameSK(sk.name ?? "");
            if (sk.description) setValue("descriptionSK", sk.description, { shouldValidate: true, shouldDirty: true });
            translatedTitleSourceRef.current = typeof pl.name === "string" ? pl.name.trim() : "";

            if (product?.code) setValue("SKU", String(product.code), { shouldValidate: true, shouldDirty: true });
            if (product?.producer_id) setValue("producer", Number(product.producer_id), { shouldValidate: true, shouldDirty: true });
            if (product?.stock?.price != null) setValue("price", Number(product.stock.price), { shouldValidate: true, shouldDirty: true });
            if (product?.stock?.stock != null) setValue("stock", Number(product.stock.stock), { shouldValidate: true, shouldDirty: true });
            const primaryCategoryId = Number(
                product?.category_id ?? product?.category?.category_id ?? product?.category?.id ?? product?.categoryId ?? 0
            );
            if (Number.isFinite(primaryCategoryId) && primaryCategoryId > 0) {
                setValue("categoryId", primaryCategoryId, { shouldValidate: true, shouldDirty: true });
            }
            if (Array.isArray(product?.categories)) {
                const additionalCategoryIds = product.categories
                    .map((category: any) => {
                        if (typeof category === "number") return category;
                        return Number(category?.category_id ?? category?.id ?? category?.categoryId ?? 0);
                    })
                    .filter((id: number) => Number.isFinite(id) && id > 0);
                setValue("AdditionalCategories", additionalCategoryIds, { shouldValidate: true, shouldDirty: true });
            }

            const safetyInfo = product?.safety_information ?? product?.safetyInformation ?? {};
            const safetyProducerRaw =
                safetyInfo?.gpsr_producer_id ?? product?.product_safety_producer_id;
            const safetyProducerId = normalizeIdValue(safetyProducerRaw);
            if (typeof safetyProducerId === "number") {
                setValue("productSafetyProducerId", safetyProducerId, { shouldValidate: true, shouldDirty: true });
            }
            const safetyCertsRaw =
                safetyInfo?.gpsr_certificates ?? product?.product_safety_certificate_ids ?? [];
            const safetyCerts = Array.isArray(safetyCertsRaw)
                ? safetyCertsRaw
                : [safetyCertsRaw];
            const normalizedCerts = safetyCerts
                .map((id) => normalizeIdValue(id))
                .filter((id): id is number => typeof id === "number");
            if (normalizedCerts.length) {
                setValue("productSafetyCertificateIds", normalizedCerts, { shouldValidate: true, shouldDirty: true });
            }

            const attrsForMap = attributeList.length
                ? attributeList
                : await handleGetAttributeList({
                    API_URL,
                    authToken: props.authToken,
                    setAttributeList,
                    attributeGroupId: "9",
                });
            const attributeMap = new Map(attrsForMap.map((attr) => [attr.attribute_id, attr]));
            const rawAttributes = product?.attributes ?? product?.attribute ?? [];
            const attributeEntries: Array<[number, unknown]> = [];

            if (Array.isArray(rawAttributes)) {
                rawAttributes.forEach((attr) => {
                    const id = Number(attr.attribute_id ?? attr.attributeId ?? attr.id);
                    const value = attr.value ?? attr.values ?? attr.value_id ?? attr.valueId ?? attr;
                    if (Number.isFinite(id)) {
                        attributeEntries.push([id, value]);
                    }
                });
            } else if (rawAttributes && typeof rawAttributes === "object") {
                Object.entries(rawAttributes).forEach(([maybeGroupId, groupValue]) => {
                    if (groupValue && typeof groupValue === "object" && !Array.isArray(groupValue)) {
                        Object.entries(groupValue).forEach(([id, value]) => {
                            const numericId = Number(id);
                            if (Number.isFinite(numericId)) {
                                attributeEntries.push([numericId, value]);
                            }
                        });
                        return;
                    }
                    const numericId = Number(maybeGroupId);
                    if (Number.isFinite(numericId)) {
                        attributeEntries.push([numericId, groupValue]);
                    }
                });
            }

            const groupIds = rawAttributes && typeof rawAttributes === "object" && !Array.isArray(rawAttributes)
                ? Object.keys(rawAttributes).map((id) => Number(id)).filter((id) => Number.isFinite(id))
                : [];
            const extraGroupIds = groupIds.filter((id) => id && id !== 9);
            if (extraGroupIds.length > 0) {
                const extraAttributes = (await Promise.all(
                    extraGroupIds.map((id) => fetchAttributesByGroup(String(id)))
                )).flat();
                extraAttributes.forEach((attr) => attributeMap.set(attr.attribute_id, attr));
            }

            if (attributeList.length === 0) {
                setPendingShoperAttributes(attributeEntries);
            } else {
                applyAttributeEntriesToForm(attributeEntries, attributeMap);
            }

            toast.success("Dane aukcji z Shopera zostały pobrane.");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd pobierania danych aukcji:", error.response?.data || error.message);
                toast.error("Nie udało się pobrać danych aukcji z Shopera.");
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error("Wystąpił nieznany błąd.");
            }
        } finally {
            setLoadingShoperOffer(false);
        }
    };

    // Normalizacja wartości taktowania procesora (np. "3.20GHz" -> "3.2")
    const normalizeClock = (value: string | string[] | undefined): string | undefined => {
        if (!value) return undefined;
        const raw = Array.isArray(value) ? value[0] : value;
        let str = String(raw).toLowerCase().trim();
        str = str.replace(/ghz/g, "").trim();
        str = str.replace(",", ".");
        const match = str.match(/\d+(\.\d+)?/);
        if (!match) return undefined;
        let result = match[0];          // np. "2.50"
        result = result.replace(/(\.\d)0$/, "$1");  // usunięcie zbędnego 0 na końcu
        return result;
    };

    // Formatowanie przekątnej ekranu do formatu z calami (np. 15.6 -> '15,6"')
    const formatDiagonalForSelect = (value: string | string[] | undefined): string | undefined => {
        if (!value || value === "") return undefined;
        const num = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
        if (Number.isNaN(num)) return undefined;
        let str = num.toFixed(1);  // np. '15.6'
        str = str.replace(".", ",");
        return `${str}"`;
    };

    // Blokada edycji pól parametrów Allegro, które zostały zablokowane przez wybór produktu
    const isParamDisabled = (paramName: string) =>
        connectProductAllegro && lockedParams.has(paramName);

    // Pobieranie listy producentów odpowiedzialnych (Allegro)
    const handleGetResponsiblePrducers = async () => {
        if (!props.accessTokenAllegro) {
            console.warn("Brak accessTokenAllegro – pomijam pobranie responsibleProducers");
            return;
        }
        try {
            const response = await axios.get(`${API_URL}/product/responsibleProducers`, {
                headers: { Authorization: `Bearer ${props.accessTokenAllegro}` },
            });
            setResponsibleData(response.data);
        } catch (error) {
            console.error("Błąd pobierania responsibleProducers:", error);
        }
    };

    // Wystawienie oferty na Allegro z wykorzystaniem API (tworzenie produktu na podstawie formularza)
    const handleAddAllegroOffer = async () => {
        if (!props.accessTokenAllegro) {
            toast.error("Brak tokenu Allegro – zaloguj się ponownie.");
            return;
        }
        if (!responsibleProducerId) {
            toast.error("Wybierz producenta odpowiedzialnego przed dodaniem oferty.");
            return;
        }
        // Przygotowanie opisu Allegro (usunięcie ewentualnych pól `id` sekcji, zachowanie tylko type, content/url)
        const descriptionAllegroTemplate = {
            sections: allegroTemplate.sections.map(section => ({
                items: section.items
                    .filter((item): item is TemplateItem => item.type === "TEXT" || item.type === "IMAGE")
                    .map((item) =>
                        item.type === "TEXT"
                            ? ({ type: "TEXT", content: item.content })
                            : ({ type: "IMAGE", url: (item as { url: string }).url })
                    ),
            })),
        };

        const token = props.accessTokenAllegro;
        const allegroTitle = (allegroTitleValue || "").toString().trim() || name;
        const allegroPrice = getValues("allegroPrice") ?? getValues("price");
        const safetyInformationText = `Lista ostrzeżeń dotyczących bezpieczeństwa laptopów oparta o wymagania Rozporządzenia (UE) 2023/988 w sprawie ogólnego bezpieczeństwa produktów (GPSR):

1. Ryzyko porażenia prądem elektrycznym:
* Upewnij się, że laptop jest podłączony do sprawnego gniazdka z uziemieniem.
* Nie dotykaj wtyczki ani kabla mokrymi rękami.
* Unikaj używania laptopa w miejscach o dużej wilgotności.
2. Ryzyko przegrzania:
* Zapewnij odpowiednią wentylację, zachowując co najmniej 5 cm wolnej przestrzeni wokół laptopa.
* Nie blokuj otworów wentylacyjnych i unikaj stawiania laptopa na miękkich powierzchniach, takich jak koce czy poduszki.
3. Ryzyko pożaru:
* Używaj wyłącznie oryginalnych ładowarek i akcesoriów zalecanych przez producenta.
* Nie pozostawiaj laptopa włączonego bez nadzoru w pobliżu materiałów łatwopalnych.
4. Ryzyko uszkodzeń ciała:
* Unikaj korzystania z laptopa w pozycji, która powoduje nadmierny nacisk ciepła na skórę, aby zapobiec oparzeniom.
* Używaj laptopa na stabilnej powierzchni, aby zminimalizować ryzyko upadku.
5. Zagrożenia w wilgotnym środowisku:
* Nie używaj laptopa na zewnątrz podczas deszczu ani w miejscach o dużej wilgotności, takich jak łazienki.
* W przypadku zalania laptopa natychmiast odłącz go od źródła zasilania i skontaktuj się z serwisem.
6. Zagrożenia w wysokich temperaturach:
* Nie eksponuj laptopa na bezpośrednie działanie promieni słonecznych.
* Unikaj korzystania z laptopa w temperaturach przekraczających zalecany zakres (zwykle 5-35°C).
7. Ryzyko uszkodzenia podczas czyszczenia:
* Przed czyszczeniem odłącz laptop od zasilania i użyj miękkiej, lekko wilgotnej ściereczki.
* Unikaj stosowania silnych detergentów mogących uszkodzić powierzchnię laptopa.
8. Ostrożność podczas wymiany akcesoriów:
* Korzystaj wyłącznie z akcesoriów zalecanych przez producenta.
* W przypadku wymiany baterii, przestrzegaj zaleceń producenta i nie wystawiaj baterii na działanie wysokich temperatur.
9. Zagrożenia związane z użytkowaniem baterii:
* Unikaj uszkodzenia baterii przez uderzenia lub jej przebicie.
* Jeśli bateria się przegrzewa lub puchnie, natychmiast przerwij użytkowanie laptopa.
10. Ostrzeżenia dotyczące dzieci:
* Trzymaj kable zasilające poza zasięgiem dzieci.
* Upewnij się, że dzieci nie bawią się laptopem ani akcesoriami, które mogą być niebezpieczne.`;
        const templateImageUrls = new Set(
            allegroTemplate.sections
                .flatMap((section) => section.items)
                .filter((item): item is { type: "IMAGE"; url: string } => item.type === "IMAGE")
                .map((item) => item.url)
                .filter((url) => typeof url === "string" && url.trim() !== "")
        );
        const orderedImages = [
            ...imageLinks.filter((url) => !templateImageUrls.has(url)),
            ...imageLinks.filter((url) => templateImageUrls.has(url)),
        ];
        const productData = {
            name: allegroTitle,
            productSet: [
                {
                    product: {
                        ...(connectProductAllegro && selectedProductId ? { id: selectedProductId, idType: "GTIN" } : {}),
                        name: allegroTitle,
                        category: { id: "491" },
                        parameters: buildOfferParameters(formData, true, laptopParametersAllegro),
                        images: orderedImages,
                    },
                    responsibleProducer: {
                        type: "ID",
                        id: responsibleProducerId,
                    },
                    safetyInformation: {
                        type: "TEXT",
                        description: safetyInformationText,
                    },
                }
            ],
            sellingMode: {
                price: { amount: allegroPrice, currency: "PLN" }
            },
            stock: {
                available: getValues("stock")
            },
            publication: {
                status: "INACTIVE"
            },
            parameters: [
                { name: "Stan", values: [formData["Stan"]] }
            ],
            external: { id: getValues("SKU") },
            delivery: {
                shippingRates: { name: "LAPTOPY" }
            },
            afterSalesServices: {
                impliedWarranty: { name: "Standardowe" },
                returnPolicy: { name: "15 dni Myślenice" }
            },
            description: descriptionAllegroTemplate,
        };

        try {
            const response = await axios.post(`${API_URL}/product/allegroProduct`, productData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedProductId(null);
            toast.success("Dodano produkt do Allegro");
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                const allegroError = apiError?.errors?.[0];
                const userMessage = allegroError?.userMessage || allegroError?.message || error.message;
                const metadata = allegroError?.metadata;
                let fullMessage = userMessage;
                if (metadata) {
                    fullMessage += `\nSzczegóły: ${JSON.stringify(metadata, null, 2)}`;
                }
                fullMessage += `\nPełny błąd: ${JSON.stringify(apiError, null, 2)}`;
                console.error("Błąd Allegro:", apiError);
                toast.error(fullMessage);
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error("Wystąpił nieznany błąd podczas dodawania na Allegro.");
            }
        }
    };

    // === FUNKCJE OBSŁUGI INTEGRACJI SHOPER ===
    // Pobieranie listy kategorii (Shoper)
    const handleGetCategories = async () => {
        let allCategories: CategoryResource[] = [];
        let currentPage = 1;
        let totalPages = 1;

        try {
            while (currentPage <= totalPages) {
                const response = await axios.get<{ list: CategoryResource[]; pages: number }>(`${API_URL}/categories/shoper`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${props.authToken}`,
                    },
                    params: {
                        limit: 50,
                        page: currentPage,
                        include: "translations",
                        filters: JSON.stringify({
                            "translations.pl_PL.active": 1,
                        }),
                    },
                });

                const normalized = (response.data.list ?? []).filter(Boolean).map((category) => ({
                    ...category,
                    category_id: Number((category as any).category_id),
                }));
                allCategories = allCategories.concat(normalized);
                totalPages = response.data.pages;
                currentPage++;
            }

            setCategories(allCategories);
            toast.success("Kategorie zostały pomyślnie pobrane.");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd podczas pobierania kategorii:", error.response?.data || error.message);
                toast.error("Błąd podczas pobierania kategorii.");
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error("Wystąpił nieznany błąd.");
            }
        }
    };

    // === OBSŁUGA ZDJĘĆ (UPLOAD I WYBÓR) ===
    // Zmiana listy wybranych plików graficznych
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const MAX_IMAGES = 16;
        const files = Array.from(e.target.files || []);
        const newFiles = files.filter((file) =>
            !selectedImages.some(
                (existing) =>
                    existing.name === file.name &&
                    existing.size === file.size &&
                    existing.lastModified === file.lastModified
            )
        );
        const combined = [...selectedImages, ...newFiles];
        if (combined.length > MAX_IMAGES) {
            toast.error(`Możesz dodać maksymalnie ${MAX_IMAGES} zdjęć.`);
            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
            return;
        }
        // Sortowanie plików po numerach w nazwach (jeśli dotyczy)
        const sortedFiles = combined.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)?.[0] || "0", 10);
            const numB = parseInt(b.name.match(/\d+/)?.[0] || "0", 10);
            return numA - numB;
        });
        setSelectedImages(sortedFiles);
        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const moveImage = (from: number, to: number) => {
        if (from === to) return;
        setSelectedImages((prev) => {
            if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
        setImageLinks((prev) => {
            if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    };

    const removeImageAt = (index: number) => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
        setImageLinks((prev) => prev.filter((_, i) => i !== index));
    };

    const getFilesKey = (files: File[]) =>
        files
            .map((file) => `${file.name}_${file.size}_${file.lastModified}`)
            .sort()
            .join("|");

    useEffect(() => {
        const urls = selectedImages.map((file) => URL.createObjectURL(file));
        setImagePreviews(urls);
        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [selectedImages]);

    const handleClearImages = () => {
        setSelectedImages([]);
        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    // Wybór produktu z wyników wyszukiwania Allegro (ustawienie parametrów z produktu)
    const handleSelectAllegroLaptop = (product: Product) => {
        handleSelectAllegroLaptopUtil({
            product,
            setSelectedProductId,
            setSelectedProduct,
            setLockedParams,
            laptopParametersAllegro,
            setFormData,
            setValue,
        });
    };

    // === POBIERANIE DANYCH POCZĄTKOWYCH ===
    // Pobranie producentów, atrybutów oraz kategorii przy montowaniu komponentu
    useEffect(() => {
        const fetchInitialData = async () => {
            await handleGetProducers({ API_URL, authToken: props.authToken, setProducers });
            await handleGetProductSafetyProducers({
                API_URL,
                authToken: props.authToken,
                setProductSafetyProducers,
            });
            await handleGetProductSafetyCertificates({
                API_URL,
                authToken: props.authToken,
                setProductSafetyCertificates,
            });
            const attrs = await handleGetAttributeList({
                API_URL,
                authToken: props.authToken,
                setAttributeList,
                attributeGroupId: "9",
            });
            // (opcjonalnie można wykorzystać attributeMap, jeżeli potrzebne)
            // const attributeMap = attrs.reduce((acc, attr) => {
            //   acc[attr.name] = attr;
            //   return acc;
            // }, {} as Record<string, Attribute>);
        };
        fetchInitialData();
        handleGetCategories();
        handleGetResponsiblePrducers();
    }, [props.authToken, props.accessTokenAllegro]);

    // Obsługa uploadu obrazów – aktualizacja linków i wskaźnika ładowania
    useEffect(() => {
        let cancelled = false;
        const filesKey = getFilesKey(selectedImages);
        if (selectedImages.length > 0) {
            if (filesKey === lastUploadKeyRef.current) {
                return () => {
                    cancelled = true;
                };
            }
            setLoading(true);
            handleImageUpload(selectedImages)
                .then((uploaded) => {
                    if (!cancelled) {
                        setImageLinks(uploaded ?? []);
                        lastUploadKeyRef.current = filesKey;
                    }
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        } else {
            setImageLinks([]);
            lastUploadKeyRef.current = "";
        }
        return () => {
            cancelled = true;
        };
    }, [selectedImages]);

    // Reset formularza (Shoper + Allegro)
    const handleReset = () => {
        reset();               // reset pól formularza Shoper
        setFormData({});       // wyczyszczenie danych Allegro
        setSelectedProductId(null);
        setSelectedProduct(undefined);
        setLockedParams(new Set());

        setAllegroTemplate({ sections: [] });
    };

    const buildAttributesPayload = (data: IFormInput) => {
        const attributesPayload: Record<number, string> = {};
        const JOINER = ", ";
        attributeList.forEach((attribute) => {
            const fieldValue = (data as any)[`attribute_${attribute.attribute_id}`];
            if (fieldValue == null || fieldValue === "") return;
            if (typeof fieldValue === "string") {
                attributesPayload[attribute.attribute_id] = resolveShoperOptionValue(attribute, fieldValue);
            } else if (Array.isArray(fieldValue)) {
                const filtered = fieldValue
                    .map((value) => resolveShoperOptionValue(attribute, value))
                    .filter((s: string) => s.trim() !== "");
                if (filtered.length) {
                    attributesPayload[attribute.attribute_id] = filtered.join(JOINER);
                }
            } else if (typeof fieldValue === "number" || typeof fieldValue === "boolean") {
                attributesPayload[attribute.attribute_id] = String(fieldValue);
            }
        });
        return attributesPayload;
    };

    const buildLegacyLocalizedAttributesPayload = (data: IFormInput, basePayload: Record<number, string>) => {
        const merged: Record<number, string> = { ...basePayload };
        const getValueById = (id: number) =>
            resolveShoperOptionValue(attributeList.find((attribute) => attribute.attribute_id === id), (data as any)[`attribute_${id}`]);
        const getTranslated = (id: number, locale: "cz" | "sk") => {
            const raw = getValueById(id);
            if (!raw) return "";
            return translateAttributeValue(raw, locale);
        };
        const toBoolString = (raw: string) => {
            if (!raw) return "";
            const normalized = raw.trim().toLowerCase();
            if (["tak", "nie", "true", "false", "1", "0", "yes", "no", "on", "off"].includes(normalized)) {
                return coerceToBoolean(normalized) ? "1" : "0";
            }
            return raw;
        };
        const getValueByName = (name: string) => {
            const id = getAttributeIdByName(name);
            return id ? getValueById(id) : "";
        };

        const keyboardValue = getValueById(824) || getValueById(340);
        const keyboardLightValue =
            getValueByName("Podświetlenie klawiatury") ||
            getValueByName("Podświetlana klawiatura") ||
            getValueByName("Podswietlenie klawiatury");
        const kensingtonRaw =
            getValueByName("Zabezpieczenie Kensington") ||
            getValueByName("Kensington Lock") ||
            getValueByName("Zabezpieczenie kensingtona");
        const kensingtonValue = toBoolString(kensingtonRaw);

        const touchScreenId = touchScreenAttrId || 171;
        const usb2Value = toBoolString(getValueById(826));
        const usb3Value = toBoolString(getValueById(827));
        const usbCValue = toBoolString(getValueById(828));
        const miniJackValue = toBoolString(getValueById(829));
        const hdmiValue = toBoolString(getValueById(317));
        const dpValue = toBoolString(getValueById(320));
        const dsubValue = toBoolString(getValueById(324));
        const miniDpValue = toBoolString(getValueById(334));
        const miniHdmiValue = toBoolString(getValueById(333));
        const lanValue = toBoolString(getValueById(338));
        const cardReaderValue = toBoolString(getValueById(332));
        const webcamValue = toBoolString(getValueById(330));
        const wifiValue = toBoolString(getValueById(325));
        const modemValue = toBoolString(getValueById(328));
        const thunderboltValue = toBoolString(getValueById(335));
        const bluetoothValue = toBoolString(getValueById(326));

        const skPayload: Record<number, string> = {
            930: getTranslated(168, "sk"),
            931: getValueById(815),
            932: getValueById(816),
            933: getValueById(172),
            934: getValueById(817),
            935: getValueById(818),
            936: getValueById(819),
            937: getValueById(820),
            938: getValueById(174),
            939: getValueById(341),
            940: getTranslated(177, "sk"),
            941: getValueById(821),
            942: getValueById(176),
            943: getValueById(822),
            944: keyboardValue ? translateAttributeValue(keyboardValue, "sk") : "",
            945: keyboardLightValue ? translateAttributeValue(keyboardLightValue, "sk") : "",
            946: getTranslated(314, "sk"),
            947: getTranslated(315, "sk"),
            948: getValueById(270),
            949: getTranslated(170, "sk"),
            950: getValueById(169),
            952: getTranslated(825, "sk"),
            951: getValueById(178),
            953: getTranslated(touchScreenId, "sk"),
            954: miniJackValue,
            955: usb2Value,
            956: usb3Value,
            957: usbCValue,
            959: hdmiValue,
            960: dpValue,
            961: dsubValue,
            962: miniDpValue,
            963: miniHdmiValue,
            964: lanValue,
            965: cardReaderValue,
            966: kensingtonValue,
            967: webcamValue,
            968: wifiValue,
            969: modemValue,
            970: thunderboltValue,
            971: bluetoothValue,
            972: getTranslated(339, "sk"),
        };

        const czPayload: Record<number, string> = {
            973: getTranslated(168, "cz"),
            974: getValueById(815),
            975: getValueById(816),
            976: getValueById(172),
            977: getValueById(817),
            978: getValueById(818),
            979: getValueById(819),
            980: getValueById(820),
            981: getValueById(174),
            982: getValueById(341),
            983: getTranslated(177, "cz"),
            984: getValueById(821),
            985: getValueById(176),
            986: getValueById(822),
            987: keyboardValue ? translateAttributeValue(keyboardValue, "cz") : "",
            988: keyboardLightValue ? translateAttributeValue(keyboardLightValue, "cz") : "",
            989: getTranslated(314, "cz"),
            990: getTranslated(315, "cz"),
            991: getValueById(270),
            992: getTranslated(170, "cz"),
            993: getValueById(169),
            994: getTranslated(825, "cz"),
            995: getValueById(178),
            996: getTranslated(touchScreenId, "cz"),
            997: miniJackValue,
            998: usb2Value,
            999: usb3Value,
            1000: usbCValue,
            1001: hdmiValue,
            1002: dpValue,
            1003: dsubValue,
            1004: miniDpValue,
            1005: miniHdmiValue,
            1006: lanValue,
            1007: cardReaderValue,
            1008: kensingtonValue,
            1009: webcamValue,
            1010: wifiValue,
            1011: modemValue,
            1012: thunderboltValue,
            1013: bluetoothValue,
            1014: getTranslated(339, "cz"),
        };

        const assignIfValue = (payload: Record<number, string>) => {
            Object.entries(payload).forEach(([id, value]) => {
                if (value == null) return;
                const trimmed = String(value).trim();
                if (!trimmed && trimmed !== "0") return;
                merged[Number(id)] = String(value);
            });
        };

        assignIfValue(skPayload);
        assignIfValue(czPayload);
        return merged;
    };

    // === SUBMIT (DODAWANIE PRODUKTU DO SHOPER + APILO) ===
    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        const attributesPayload = buildLegacyLocalizedAttributesPayload(data, buildAttributesPayload(data));
        const safetyProducerId = normalizeIdValue(data.productSafetyProducerId) ?? 0;
        const safetyCertificateIds = Array.isArray(data.productSafetyCertificateIds)
            ? data.productSafetyCertificateIds
                .map((id) => resolveProductSafetyCertificateId(id))
                .filter((id): id is number | string => id != null)
            : [];
        const safetyWarnings = Array.isArray(data.productSafetyWarnings)
            ? data.productSafetyWarnings.map((item) => String(item ?? "").trim()).filter(Boolean)
            : [];
        const safetyInfo = safetyWarnings.length ? safetyWarnings.join("\n") : "";
        const safetyInformation: Record<string, unknown> = {};
        if (safetyProducerId) safetyInformation.gpsr_producer_id = safetyProducerId;
        if (safetyCertificateIds.length) safetyInformation.gpsr_certificates = safetyCertificateIds;
        try {
            let translatedTitleCZ = nameCZ;
            let translatedTitleSK = nameSK;
            try {
                const translatedTitles = await ensureTranslatedTitlesForName(data.name);
                translatedTitleCZ = translatedTitles.cz;
                translatedTitleSK = translatedTitles.sk;
            } catch (error) {
                console.error("Błąd tłumaczenia tytułu podczas dodawania:", error);
                toast.error("Błąd tłumaczenia tytułu");
                return;
            }

            // Dodawanie produktu do Shoper
            const shoperResponse = await axios.post(`${API_URL}/product/shoper`, {
                producer_id: data.producer,
                category_id: data.categoryId,
                categories: data.AdditionalCategories,
                code: data.SKU,
                pkwiu: "-",
                translations: {
                    pl_PL: {
                        name: data.name,
                        description: data.description + data.descriptionApilo,
                        active: data.active
                    }
                },
                stock: {
                    price: data.price,
                    active: 1,
                    stock: data.stock,
                    delivery_id: 1
                },
                attributes: attributesPayload,
                gauge_id: 5,
                ...(Object.keys(safetyInformation).length
                    ? { safety_information: safetyInformation }
                    : {}),
                ...(relatedPackId ? { related_pack_id: relatedPackId } : {}),
            }, {
                headers: { Authorization: `Bearer ${props.authToken}` }
            });

            const newProductId = shoperResponse.data;
            // Dodanie tłumaczeń opisu (CZ, SK) oraz ustawienie atrybutów tłumaczonych
            await axios.put(`${API_URL}/product/${newProductId}`, {
                translations: {
                    cs_CZ: {
                        name: translatedTitleCZ,
                        description: data.descriptionCZ,
                        active: data.active,
                    },
                    sk_SK: {
                        name: translatedTitleSK,
                        description: data.descriptionSK,
                        active: data.active,
                    },
                },
                // Przykład uzupełnienia atrybutów językowych (w razie potrzeby)
                // attributes: {
                //   930: LaptopAttributes_SK[data.status],
                //   973: LaptopAttributes_CZ[data.status],
                //   // ... (pozostałe atrybuty per język)
                // }
            }, {
                headers: { Authorization: `Bearer ${props.authToken}` }
            });

            // Upload obrazów do Shoper
            for (let i = 0; i < imageLinks.length; i++) {
                const imgUrl = imageLinks[i];
                if (!imgUrl) continue;
                try {
                    await axios.post(`${API_URL}/product-image`, {
                        product_id: newProductId,
                        url: imgUrl,
                        translations: {
                            pl_PL: { name: selectedImages[i]?.name || `zdjęcie ${i + 1}` }
                        }
                    }, {
                        headers: { Authorization: `Bearer ${props.authToken}` }
                    });
                    toast.success(`Dodano zdjęcie ${i + 1}`);
                } catch (err) {
                    console.error("Błąd dodawania zdjęcia:", err);
                    toast.error("Błąd podczas dodawania zdjęcia");
                }
            }

            // Dodanie produktu do Apilo
            apiloImageUUIDs = await AddImageApilo(props, selectedImages);
            await axios.post(`${API_URL}/product/apilo`, [
                {
                    sku: data.SKU,
                    name: data.name,
                    tax: 23,
                    status: 1,
                    quantity: Number(data.stock),
                    priceWithTax: data.price,
                    description: data.descriptionApilo,
                    images: apiloImageUUIDs
                }
            ], {
                headers: { Authorization: `Bearer ${props.authToken}` }
            });

            // (Opcjonalnie) usunięcie z Apilo poprzedniego produktu o tym SKU, jeśli istniał
            // const apiloListRes = await axios.get(`${API_URL}/product/apiloProductslist`, {
            //   params: { sku: data.SKU.toUpperCase() },
            //   headers: { Authorization: `Bearer ${props.authToken}` }
            // });
            // if (apiloListRes.data.totalCount > 0) {
            //   await axios.delete(`${API_URL}/product/apiloProductDelete/${apiloListRes.data.products[0].id}`, {
            //     headers: { Authorization: `Bearer ${props.authToken}` }
            //   });
            // }

            toast.success(`Produkt ${newProductId} został pomyślnie dodany.`);
        } catch (error: any) {
            console.error("Błąd dodawania produktu:", error.response?.data || error);
            toast.error("Wystąpił błąd podczas dodawania produktu.");
        }
    };

    const handleUpdateProduct = async (data: IFormInput) => {
        const offerId = shoperOfferId.trim();
        if (!offerId) {
            toast.error("Podaj ID aukcji z Shopera, aby zaktualizować produkt.");
            return;
        }
        setUpdatingProduct(true);
        try {
            let translatedTitleCZ = nameCZ;
            let translatedTitleSK = nameSK;
            try {
                const translatedTitles = await ensureTranslatedTitlesForName(data.name);
                translatedTitleCZ = translatedTitles.cz;
                translatedTitleSK = translatedTitles.sk;
            } catch (error) {
                console.error("Błąd tłumaczenia tytułu podczas aktualizacji:", error);
                toast.error("Błąd tłumaczenia tytułu");
                return;
            }

            const attributesPayload = buildLegacyLocalizedAttributesPayload(data, buildAttributesPayload(data));
            const safetyProducerId = normalizeIdValue(data.productSafetyProducerId) ?? 0;
            const safetyCertificateIds = Array.isArray(data.productSafetyCertificateIds)
                ? data.productSafetyCertificateIds
                    .map((id) => resolveProductSafetyCertificateId(id))
                    .filter((id): id is number | string => id != null)
                : [];
            const safetyWarnings = Array.isArray(data.productSafetyWarnings)
                ? data.productSafetyWarnings.map((item) => String(item ?? "").trim()).filter(Boolean)
                : [];
            const safetyInfo = safetyWarnings.length ? safetyWarnings.join("\n") : "";
            const safetyInformation: Record<string, unknown> = {};
            if (safetyProducerId) safetyInformation.gpsr_producer_id = safetyProducerId;
            if (safetyCertificateIds.length) safetyInformation.gpsr_certificates = safetyCertificateIds;
            await UpdateProductShoper({
                productId: Number(offerId),
                basePayload: {
                    producer_id: data.producer,
                    category_id: data.categoryId,
                    categories: data.AdditionalCategories,
                    code: data.SKU,
                    pkwiu: "-",
                    stock: {
                        price: data.price,
                        active: 1,
                        stock: data.stock,
                        delivery_id: 1
                    },
                    attributes: attributesPayload,
                    gauge_id: 5,
                    ...(Object.keys(safetyInformation).length
                        ? { safety_information: safetyInformation }
                        : {}),
                    ...(relatedPackId ? { related_pack_id: relatedPackId } : {}),
                },
                translations: {
                    pl_PL: {
                        name: data.name,
                        description: data.description + data.descriptionApilo,
                        active: data.active,
                    },
                    cs_CZ: {
                        name: translatedTitleCZ,
                        description: data.descriptionCZ,
                        active: data.active,
                    },
                    sk_SK: {
                        name: translatedTitleSK,
                        description: data.descriptionSK,
                        active: data.active,
                    },
                },
                props,
                baseSuccessMessage: "Zaktualizowano dane podstawowe produktu.",
            });

            // Aktualizacja produktu w Apilo jest wyłączona zgodnie z wymaganiami.

            if (imageLinks.length > 0) {
                for (let i = 0; i < imageLinks.length; i++) {
                    const imgUrl = imageLinks[i];
                    if (!imgUrl) continue;
                    await axios.post(`${API_URL}/product-image`, {
                        product_id: Number(offerId),
                        url: imgUrl,
                        translations: {
                            pl_PL: { name: selectedImages[i]?.name || `zdjęcie ${i + 1}` }
                        }
                    }, {
                        headers: { Authorization: `Bearer ${props.authToken}` }
                    });
                }
            }

        } catch (error: any) {
            console.error("Błąd aktualizacji produktu:", error.response?.data || error);
            toast.error("Wystąpił błąd podczas aktualizacji produktu.");
        } finally {
            setUpdatingProduct(false);
        }
    };

    // *** GENEROWANIE OPISU ALLEGRO (TEMPLATE) ***
    // Automatyczne generowanie tekstu wstępnego opisu Allegro, jeśli użytkownik go nie zmodyfikował
    useEffect(() => {
        if (!dirtyFields.introText) {
            const intro = buildIntroText(
                producerName,
                shoper_model,
                shoper_cpuModel,
                shoper_ramAmount,
                shoper_ramType,
                shoper_matrixSize,
                shoper_resolution
            );
            setValue("introText", intro);
        }
    }, [dirtyFields.introText, producerName, setValue, shoper_model, shoper_cpuModel, shoper_ramAmount, shoper_ramType, shoper_matrixSize, shoper_resolution]);

    useEffect(() => {
        if (!dirtyFields.introText2) {
            const intro2 = laptopAdditionalText2(producerName, shoper_model, "");
            setValue("introText2", intro2);
        }
    }, [dirtyFields.introText2, setValue, shoper_model, shoper_cpuModel]);

    useEffect(() => {
        if (!dirtyFields.allegroTitle) {
            setValue("allegroTitle", String(name ?? "").slice(0, 75));
        }
        if (!dirtyFields.allegroPrice) {
            const currentPrice = getValues("price");
            if (currentPrice != null) {
                setValue("allegroPrice", currentPrice);
            }
        }
    }, [dirtyFields.allegroPrice, dirtyFields.allegroTitle, getValues, name, setValue]);

    // *** GENEROWANIE OPISU ALLEGRO (TEMPLATE) ***
    useEffect(() => {
        const timer = setTimeout(() => {
            const portList: string[] = [];
            const pushPortCount = (label: string, countValue: unknown) => {
                const count = Number(countValue);
                if (!Number.isFinite(count) || count <= 0) return;
                portList.push(`${count}x ${label}`);
            };
            const pushPortBool = (label: string, enabled: boolean) => {
                if (enabled) portList.push(`1x ${label}`);
            };
            pushPortCount("USB 3.0", shoper_usb3);
            pushPortCount("USB 2.0", shoper_usb2);
            pushPortCount("USB C", shoper_usbC);
            pushPortCount("mini jack", shoper_miniJack);
            pushPortBool("HDMI", !!shoper_HDMI);
            pushPortBool("mini HDMI", !!shoper_miniHDMI);
            pushPortBool("DisplayPort", !!shoper_DP);
            pushPortBool("mini DisplayPort", !!shoper_miniDP);
            pushPortBool("VGA (D-Sub)", !!shoper_dSUB);
            pushPortBool("LAN", !!shoper_LAN);
            pushPortBool("Thunderbolt", !!shoper_thunderbolt);
            pushPortBool("Czytnik kart pamięci", !!shoper_cardReader);
            pushPortBool("Złącze dokowania", !!shoper_dockingPort);
            const keyboardLabel =
                keyboardDescription[shoper_keyboardLayout] ??
                (shoper_keyboardLayout ? String(shoper_keyboardLayout) : "");
            const newAutoTemplate: Template = AllegroLaptopTemplate({
                system: String(shoper_system ?? ""),
                cpuSeries: String(shoper_cpu ?? ""),
                cpuModel: String(shoper_cpuModel ?? ""),
                cpuClockSpeed: String(shoper_frequency ?? ""),
                cpuMaxClockSpeed: String(shoper_frequency_turbo ?? ""),
                cpuCores: String(shoper_cores ?? ""),
                cpuThreads: String(shoper_threads ?? ""),
                gpuName: String(shoper_gpu ?? ""),
                diskType: String(shoper_diskType ?? ""),
                diskSize: String(shoper_diskSize ?? ""),
                ramType: String(shoper_ramType ?? ""),
                ramAmount: String(shoper_ramAmount ?? ""),
                resolution: String(shoper_resolution ?? ""),
                diagonal: String(shoper_matrixSize ?? ""),
                matrixGrade: String(shoper_matrixGrade ?? ""),
                matrixType: String(shoper_matrixType ?? ""),
                showVebCam: Boolean(shoper_vebCam),
                showLibre: Boolean(showLibre),
                battery: String(shoper_battery ?? ""),
                caseGrade: gradeDescriptionKey,
                keyboard: keyboardLabel,
                showMacOS: false,
                additionalInfo_keyboard: deferredAdditionalInfoKeyboard,
                additionalInfo_case: deferredAdditionalInfoCase,
                additionalInfo_matrix: deferredAdditionalInfoMatrix,
                touchScreen: String(shoper_touchScreen ?? ""),
                showModem: Boolean(shoper_modem),
                showWin11info: Boolean(showWin11info),
                showBiosPasswordInfo: Boolean(showBiosPasswordInfo),
                producer: String(producerName ?? ""),
                model: String(shoper_model ?? name),
                ports: portList,
                series,
                introText,
                introText2,
                showRefurbProcess: refurbProcessAttrId
                    ? coerceToBoolean(shoper_refurbProcess)
                    : false,
                refurbProcessImageUrl:
                    "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/laptopy/libreOffice.jpeg",
                skipCaseDescription,
                skipMatrixDescription,
            });

            setAllegroTemplate(prev => {
                // upewniamy się, że wszystkie sekcje mają id
                const prevSections = ensureSectionIds(prev.sections ?? []) as TemplateSection[];

                // nowe auto-sekcje po id (z generatora)
                const newAutoById = new Map<string, TemplateSection>();
                newAutoTemplate.sections.forEach(sec => {
                    if (!sec.id) return;
                    newAutoById.set(sec.id, sec);
                });

                const nextSections: TemplateSection[] = [];

                // 1. przechodzimy po STARYCH sekcjach w ich AKTUALNEJ kolejności
                for (const prevSec of prevSections) {
                    const id = prevSec.id as string | undefined;

                    if (prevSec.origin === "auto") {
                        if (!id) continue;

                        // jeśli użytkownik usunął tę auto-sekcję – nie dodajemy jej z powrotem
                        if (removedAutoSections.has(id)) {
                            continue;
                        }

                        const freshAuto = newAutoById.get(id);
                        if (!freshAuto) {
                            // ta sekcja nie istnieje już w nowym szablonie
                            continue;
                        }

                        // mergujemy itemy – zostawiamy zablokowane obrazki
                        const mergedItems = freshAuto.items.map((item, i) => {
                            const oldItem = prevSec.items[i];
                            if (item.type === "IMAGE" && oldItem?.type === "IMAGE" && (oldItem as any).locked) {
                                return oldItem;
                            }
                            return item;
                        });

                        nextSections.push({
                            ...freshAuto,
                            id,
                            origin: "auto",
                            items: mergedItems,
                        });

                        // oznaczamy, że tę sekcję już obsłużyliśmy
                        newAutoById.delete(id);
                    } else {
                        // sekcja użytkownika – zostaje dokładnie tam, gdzie była
                        nextSections.push(prevSec);
                    }
                }

                // 2. nowe auto-sekcje, których wcześniej nie było – dokładamy na końcu
                newAutoById.forEach((sec, id) => {
                    if (!removedAutoSections.has(id)) {
                        nextSections.push(sec);
                    }
                });

                return { ...prev, sections: nextSections };
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [
        ALLEGRO_LAPTOP_TEMPLATE_REVISION,
        formData,
        shoper_system,
        shoper_cpu,
        shoper_cpuModel,
        shoper_cores,
        shoper_threads,
        shoper_frequency,
        shoper_frequency_turbo,
        shoper_ramAmount,
        shoper_ramType,
        shoper_gpu,
        shoper_diskType,
        shoper_diskSize,
        shoper_resolution,
        shoper_matrixSize,
        shoper_matrixGrade,
        shoper_matrixType,
        shoper_vebCam,
        showLibre,
        shoper_battery,
        shoper_grade,
        shoper_keyboardLayout,
        shoper_touchScreen,
        shoper_modem,
        showWin11info,
        showBiosPasswordInfo,
        shoper_refurbProcess,
        refurbProcessAttrId,
        deferredAdditionalInfoKeyboard,
        deferredAdditionalInfoCase,
        deferredAdditionalInfoMatrix,
        skipCaseDescription,
        skipMatrixDescription,
        producerName,
        shoper_model,
        series,
        introText,
        introText2,
        name,
        removedAutoSections, // <-- dodane
        shoper_usb2, shoper_usb3, shoper_usbC, shoper_miniJack,
        shoper_HDMI, shoper_miniHDMI, shoper_DP, shoper_miniDP,
        shoper_dSUB, shoper_LAN, shoper_thunderbolt, shoper_dockingPort, shoper_cardReader,
        series, introText, introText2, name, removedAutoSections,
    ]);

    useEffect(() => {
        setRemovedAutoSections((prev) => {
            const next = new Set(prev);
            if ((series ?? "").trim()) {
                next.delete("seriesText");
            } else {
                next.add("seriesText");
            }
            return next;
        });
    }, [series]);

    useEffect(() => {
        if (!(series ?? "").trim()) return;
        setAllegroTemplate((prev) => {
            const sections = ensureSectionIds(prev.sections ?? []);
            const seriesIndex = sections.findIndex((section) => section.id === "seriesText");
            if (seriesIndex === -1) return prev;
            const mainIndex = sections.findIndex((section) => section.id === "mainImage");
            const targetIndex = mainIndex === -1 ? 0 : mainIndex + 1;
            if (seriesIndex === targetIndex) return prev;
            const [seriesSection] = sections.splice(seriesIndex, 1);
            sections.splice(targetIndex, 0, seriesSection);
            return { ...prev, sections };
        });
    }, [series, allegroTemplate.sections.length]);






    // *** RĘCZNA EDYCJA OPISU ALLEGRO (SEKCJE) ***
    // Zmiana treści w sekcji tekstowej
    function handleAllegroTextChange(sectionIndex: number, newText: string) {
        setAllegroTemplate(prev => ({
            ...prev,
            sections: prev.sections.map((section, idx) => {
                if (idx !== sectionIndex) return section;
                // Tworzymy kopię edytowanej sekcji:
                const newItems = section.items.map(item => {
                    if (item.type === "TEXT") {
                        return { ...item, content: newText }; // nie ustawiaj .locked
                    }

                    return item;
                });
                return { ...section, items: newItems };
            })
        }));
    }


    // Dodanie nowej sekcji ze zdjęciem (domyślnie pierwsze wgrane zdjęcie lub puste)
    const handleAddImageSection = () => {
        setAllegroTemplate(prev => {
            const sections = ensureSectionIds(prev.sections);
            sections.push({
                id: generateSectionId(),
                origin: "user",
                items: [{ type: "IMAGE", url: "" }],
            });
            return { ...prev, sections };
        });
        setSelectedAllegroSectionIndex(allegroTemplate.sections.length);
    };

    // Dodanie nowej sekcji tekstowej (początkowo z przykładowym tekstem)
    const handleAddTextSection = () => {
        setAllegroTemplate(prev => {
            const sections = ensureSectionIds(prev.sections);
            sections.push({
                id: generateSectionId(),
                origin: "user",
                items: [{ type: "TEXT", content: "<h2>nagłówek</h2><p>tekst</p>" }],
            });
            return { ...prev, sections };
        });
        setSelectedAllegroSectionIndex(allegroTemplate.sections.length);
    };

    // Dodanie nowej sekcji z obrazem i tekstem
    const handleAddImageTextSection = () => {
        setAllegroTemplate(prev => {
            const sections = ensureSectionIds(prev.sections);
            sections.push({
                id: generateSectionId(),
                origin: "user",
                items: [
                    { type: "IMAGE", url: "" },
                    { type: "TEXT", content: "<h2>nagłówek</h2><p>tekst</p>" },
                ],
            });
            return { ...prev, sections };
        });
        setSelectedAllegroSectionIndex(allegroTemplate.sections.length);
    };

    // Dodanie nowej sekcji z dwoma zdjęciami
    const handleAddTwoImageSection = () => {
        setAllegroTemplate(prev => {
            const sections = ensureSectionIds(prev.sections);
            sections.push({
                id: generateSectionId(),
                origin: "user",
                items: [
                    { type: "IMAGE", url: "" },
                    { type: "IMAGE", url: "" },
                ],
            });
            return { ...prev, sections };
        });
        setSelectedAllegroSectionIndex(allegroTemplate.sections.length);
    };

    // Zmiana kolejności sekcji opisu (w górę / w dół)
    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
        setAllegroTemplate(prev => {
            let sections = ensureSectionIds(prev.sections);
            if (direction === 'up' && index > 0) {
                [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
            }
            if (direction === 'down' && index < sections.length - 1) {
                [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
            }
            return { ...prev, sections };
        });
        setSelectedAllegroSectionIndex((current) => {
            if (current !== index) return current;
            if (direction === "up") return Math.max(0, index - 1);
            if (direction === "down") return index + 1;
            return current;
        });
    };

    // Usunięcie sekcji opisu
    function handleRemoveSection(index: number) {
        setAllegroTemplate(prev => {
            const sections = ensureSectionIds(prev.sections.slice());  // kopia z pewnymi id
            const removed = sections[index];
            sections.splice(index, 1);
            // Aktualizujemy stan removedAutoSections, jeśli dotyczy sekcji auto
            if (removed && removed.origin === "auto") {
                setRemovedAutoSections(prevSet => {
                    const newSet = new Set(prevSet);
                    newSet.add(removed.id as string);
                    return newSet;
                });
            }
            return { ...prev, sections };
        });
        setSelectedAllegroSectionIndex((current) => {
            if (current > index) return current - 1;
            if (current === index) return Math.max(0, current - 1);
            return current;
        });
    }


    // Zmiana obrazka w istniejącej sekcji obrazkowej
    const handleAllegroImageChange = (sectionIndex: number, itemIndex: number, url: string) => {
        setAllegroTemplate(prev => ({
            ...prev,
            sections: prev.sections.map((section, sIdx) =>
                sIdx === sectionIndex
                    ? {
                        ...section,
                        items: section.items.map((item, iIdx) =>
                            item.type === "IMAGE" && iIdx === itemIndex
                                ? { ...item, url, locked: true } // zostaje jak jest
                                : item
                        ),
                    }
                    : section
            ),
        }));
    };



    // *** GENEROWANIE OPISU (SHOPER i APILO) ***
    // Obserwacja (watch) generująca początkową treść opisów dla wszystkich języków
    const keyboardValue = keyboardDescription[shoper_keyboardLayout] ?? (shoper_keyboardLayout ? String(shoper_keyboardLayout) : "");
    const keyboardValueCZ = keyboardDescriptionCZ[shoper_keyboardLayout] ?? (shoper_keyboardLayout ? String(shoper_keyboardLayout) : "");
    const keyboardValueSK = keyboardDescriptionSK[shoper_keyboardLayout] ?? (shoper_keyboardLayout ? String(shoper_keyboardLayout) : "");
    const stripDescription = (value: string) => {
        const trimmed = value.trim();
        const dashIndex = trimmed.indexOf(" - ");
        if (dashIndex >= 0) return trimmed.slice(0, dashIndex).trim();
        const lower = trimmed.toLowerCase();
        const naIndex = lower.indexOf(" na ");
        if (naIndex >= 0) return trimmed.slice(0, naIndex).trim();
        return trimmed;
    };
    const gradeDisplayValue = getVisualConditionDisplayValue(shoper_grade);
    const gradeBase = gradeDisplayValue ? String(gradeDisplayValue) : "";
    const gradeDescriptionKey = gradeBase;
    const matrixBase = shoper_matrixGrade ? String(shoper_matrixGrade) : "";
    const gradeTextPL = skipCaseDescription
        ? stripDescription(GradeDescriptios[gradeDescriptionKey] ?? gradeBase)
        : (GradeDescriptios[gradeDescriptionKey] ?? gradeBase);
    const gradeTextCZ = skipCaseDescription
        ? stripDescription(GradeDescriptionsCZ[gradeDescriptionKey] ?? gradeBase)
        : (GradeDescriptionsCZ[gradeDescriptionKey] ?? gradeBase);
    const gradeTextSK = skipCaseDescription
        ? stripDescription(GradeDescriptionsSK[gradeDescriptionKey] ?? gradeBase)
        : (GradeDescriptionsSK[gradeDescriptionKey] ?? gradeBase);
    const matrixTextPL = skipMatrixDescription
        ? stripDescription(matrixGradeDescriptios[shoper_matrixGrade] ?? matrixBase)
        : (matrixGradeDescriptios[shoper_matrixGrade] ?? matrixBase);
    const matrixTextCZ = skipMatrixDescription
        ? stripDescription(matrixGradeDescriptiosCZ[shoper_matrixGrade] ?? matrixBase)
        : (matrixGradeDescriptiosCZ[shoper_matrixGrade] ?? matrixBase);
    const matrixTextSK = skipMatrixDescription
        ? stripDescription(matrixGradeDescriptiosSK[shoper_matrixGrade] ?? matrixBase)
        : (matrixGradeDescriptiosSK[shoper_matrixGrade] ?? matrixBase);
    const description = watch("description", LaptopTemplateNew(
        shoper_system, shoper_cpu, shoper_cpuModel, shoper_gpu, shoper_diskType, shoper_diskSize, shoper_ramType, shoper_ramAmount, shoper_resolution, Boolean(shoper_vebCam), Boolean(showLibre),
        batteryDescription[shoper_battery], matrixTextPL, gradeTextPL, keyboardValue,
        /* showWin11 */ shoper_system.includes("Windows 11"), /* showWin10 */ shoper_system.includes("Windows 10"), /* showMacOS */ shoper_system.includes("macOS"),
        deferredAdditionalInfoKeyboard, deferredAdditionalInfoCase, deferredAdditionalInfoMatrix,
        String(shoper_touchScreen), Boolean(shoper_modem), Boolean(showWin11info), Boolean(showBiosPasswordInfo)
    ));
    const descriptionCZ = watch("descriptionCZ", LaptopTemplateCZ(
        shoper_system, shoper_cpu, shoper_cpuModel, shoper_gpu, shoper_diskType, shoper_diskSize, shoper_ramType, shoper_ramAmount, shoper_resolution, Boolean(shoper_vebCam), Boolean(showLibre),
        batteryDescriptionCZ[shoper_battery], matrixTextCZ, gradeTextCZ, keyboardValueCZ,
        shoper_system.includes("Windows 11"), shoper_system.includes("Windows 10"), shoper_system.includes("macOS"),
        additinalKeyboardInfoCZ, additinalcaseInfoCZ, additinalMatrixInfoCZ,
        String(shoper_touchScreen), Boolean(shoper_modem)
    ));
    const descriptionSK = watch("descriptionSK", LaptopTemplateSK(
        shoper_system, shoper_cpu, shoper_cpuModel, shoper_gpu, shoper_diskType, shoper_diskSize, shoper_ramType, shoper_ramAmount, shoper_resolution, Boolean(shoper_vebCam), Boolean(showLibre),
        batteryDescriptionSK[shoper_battery], matrixTextSK, gradeTextSK, keyboardValueSK,
        shoper_system.includes("Windows 11"), shoper_system.includes("Windows 10"), shoper_system.includes("macOS"),
        additinalKeyboardInfoSK, additinalcaseInfoSK, additinalMatrixInfoSK,
        String(shoper_touchScreen), Boolean(shoper_modem)
    ));
    const descriptionApilo = watch("descriptionApilo", LaptopTemplateApilo(
        shoper_system, shoper_cpu, shoper_cpuModel, shoper_gpu, shoper_diskType, shoper_diskSize, shoper_ramType, shoper_ramAmount, shoper_resolution, Boolean(shoper_vebCam), Boolean(showLibre),
        batteryDescription[shoper_battery], matrixTextPL, gradeTextPL, keyboardValue,
        shoper_system.includes("Windows 11"), shoper_system.includes("Windows 10"), shoper_system.includes("macOS"),
        deferredAdditionalInfoKeyboard, deferredAdditionalInfoCase, deferredAdditionalInfoMatrix,
        shoper_cores, shoper_threads, shoper_frequency, shoper_frequency_turbo,
        shoper_matrixSize, shoper_matrixType,
        String(shoper_touchScreen), name,  // model (name produktu)
        shoper_usb3, shoper_usb2, shoper_usbC, Boolean(shoper_thunderbolt), String(shoper_miniJack),
        Boolean(shoper_HDMI), Boolean(shoper_LAN), Boolean(shoper_cardReader), Boolean(shoper_DP), Boolean(shoper_dSUB),
        Boolean(shoper_dockingPort), Boolean(shoper_miniHDMI), Boolean(shoper_miniDP)
    ));

    useEffect(() => {
        const total = allegroTemplate.sections.length;
        if (total === 0) {
            setSelectedAllegroSectionIndex(0);
            return;
        }
        setSelectedAllegroSectionIndex((current) =>
            current >= total ? Math.max(0, total - 1) : current
        );
    }, [allegroTemplate.sections.length]);

    // Automatyczne uaktualnienie opisów (Shoper/Apilo) przy zmianie wybranych parametrów
    useEffect(() => {
        let showWin11 = false;
        let showWin10 = false;
        let showMacOS = false;
        if (shoper_system.includes("Windows 10")) {
            showWin11 = false;
            showWin10 = true;
            showMacOS = false;
        } else if (shoper_system.includes("Windows 11")) {
            showWin11 = true;
            showWin10 = false;
            showMacOS = false;
        } else if (shoper_system.includes("macOS")) {
            showWin11 = false;
            showWin10 = false;
            showMacOS = true;
        }
        const timer = setTimeout(() => {
            const keyboardFallback = keyboardDescription[shoper_keyboardLayout] ?? (shoper_keyboardLayout ? String(shoper_keyboardLayout) : "");
            const keyboardFallbackCZ = keyboardDescriptionCZ[shoper_keyboardLayout] ?? (shoper_keyboardLayout ? String(shoper_keyboardLayout) : "");
            const keyboardFallbackSK = keyboardDescriptionSK[shoper_keyboardLayout] ?? (shoper_keyboardLayout ? String(shoper_keyboardLayout) : "");
            setValue("description", LaptopTemplateNew(
                shoper_system, shoper_cpu, shoper_cpuModel, shoper_gpu, shoper_diskType, shoper_diskSize, shoper_ramType, shoper_ramAmount, shoper_resolution,
                Boolean(shoper_vebCam), Boolean(showLibre),
                batteryDescription[shoper_battery], matrixTextPL, gradeTextPL, keyboardFallback,
                showWin11, showWin10, showMacOS,
                deferredAdditionalInfoKeyboard, deferredAdditionalInfoCase, deferredAdditionalInfoMatrix,
                String(shoper_touchScreen), Boolean(shoper_modem), Boolean(showWin11info), Boolean(showBiosPasswordInfo)
            ));
            setValue("descriptionCZ", LaptopTemplateCZ(
                shoper_system, shoper_cpu, shoper_cpuModel, shoper_gpu, shoper_diskType, shoper_diskSize, shoper_ramType, shoper_ramAmount, shoper_resolution,
                Boolean(shoper_vebCam), Boolean(showLibre),
                batteryDescriptionCZ[shoper_battery], matrixTextCZ, gradeTextCZ, keyboardFallbackCZ,
                showWin11, showWin10, showMacOS,
                additinalKeyboardInfoCZ, additinalcaseInfoCZ, additinalMatrixInfoCZ,
                String(shoper_touchScreen), Boolean(shoper_modem)
            ));
            setValue("descriptionSK", LaptopTemplateSK(
                shoper_system, shoper_cpu, shoper_cpuModel, shoper_gpu, shoper_diskType, shoper_diskSize, shoper_ramType, shoper_ramAmount, shoper_resolution,
                Boolean(shoper_vebCam), Boolean(showLibre),
                batteryDescriptionSK[shoper_battery], matrixTextSK, gradeTextSK, keyboardFallbackSK,
                showWin11, showWin10, showMacOS,
                additinalKeyboardInfoSK, additinalcaseInfoSK, additinalMatrixInfoSK,
                String(shoper_touchScreen), Boolean(shoper_modem)
            ));
            setValue("descriptionApilo", LaptopTemplateApilo(
                shoper_system, shoper_cpu, shoper_cpuModel, shoper_gpu, shoper_diskType, shoper_diskSize, shoper_ramType, shoper_ramAmount, shoper_resolution,
                Boolean(shoper_vebCam), Boolean(showLibre),
                batteryDescription[shoper_battery], matrixTextPL, gradeTextPL, keyboardFallback,
                showWin11, showWin10, showMacOS,
                deferredAdditionalInfoKeyboard, deferredAdditionalInfoCase, deferredAdditionalInfoMatrix,
                shoper_cores, shoper_threads, shoper_frequency, shoper_frequency_turbo,
                shoper_matrixSize, shoper_matrixType,
                String(shoper_touchScreen), name,
                shoper_usb3, shoper_usb2, shoper_usbC, Boolean(shoper_thunderbolt), String(shoper_miniJack),
                Boolean(shoper_HDMI), Boolean(shoper_LAN), Boolean(shoper_cardReader), Boolean(shoper_DP), Boolean(shoper_dSUB),
                Boolean(shoper_dockingPort), Boolean(shoper_miniHDMI), Boolean(shoper_miniDP)
            ));
        }, 300);
        return () => clearTimeout(timer);
    }, [
        shoper_system, shoper_cpu, shoper_cpuModel, shoper_cores, shoper_threads, shoper_frequency, shoper_frequency_turbo,
        shoper_ramAmount, shoper_ramType, shoper_gpu, shoper_diskType, shoper_diskSize, shoper_resolution,
        shoper_vebCam, showLibre, shoper_battery, shoper_matrixGrade, shoper_grade, gradeDescriptionKey, shoper_keyboardLayout,
        shoper_touchScreen, shoper_modem, showWin11info, showBiosPasswordInfo, skipCaseDescription, skipMatrixDescription,
        deferredAdditionalInfoKeyboard, deferredAdditionalInfoCase, deferredAdditionalInfoMatrix,
        additinalKeyboardInfoCZ, additinalcaseInfoCZ, additinalMatrixInfoCZ,
        additinalKeyboardInfoSK, additinalcaseInfoSK, additinalMatrixInfoSK,
        setValue
    ]);

    useEffect(() => {
        const total = allegroTemplate.sections.length;
        if (total === 0) {
            setSelectedAllegroSectionIndex(0);
            return;
        }
        setSelectedAllegroSectionIndex((current) =>
            current >= total ? Math.max(0, total - 1) : current
        );
    }, [allegroTemplate.sections.length]);

    const stripHtml = (html: string) =>
        html
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    const getSectionLabel = (section: TemplateSection, index: number) => {
        const hasImage = section.items.some((item) => item.type === "IMAGE");
        const hasText = section.items.some((item) => item.type === "TEXT");
        if (hasImage && hasText) return `Obraz + tekst #${index + 1}`;
        if (hasImage) return `Sekcja ze zdjęciem #${index + 1}`;
        if (hasText) return `Sekcja tekstowa #${index + 1}`;
        return `Sekcja #${index + 1}`;
    };
    const getSectionSummary = (section: TemplateSection) => {
        const textItem = section.items.find((item) => item.type === "TEXT") as { content?: string } | undefined;
        if (textItem?.content) {
            const plain = stripHtml(textItem.content);
            return plain.length > 80 ? `${plain.slice(0, 77)}...` : plain;
        }
        if (section.items.some((item) => item.type === "IMAGE")) {
            return "Sekcja z obrazem bez tekstu";
        }
        return "Pusta sekcja";
    };

    // Podgląd opisu Allegro (renderowanie sekcji)
    const renderAllegroPreview = () => (
        <div style={{ padding: "20px", color: "black" }}>
            {allegroTemplate.sections.map((section, sIdx) => {
                const imageItems = section.items.filter(i => i.type === "IMAGE") as { type: "IMAGE"; url: string }[];
                const textItems = section.items.filter(i => i.type === "TEXT") as { type: "TEXT"; content: string }[];
                const hasImage = imageItems.length > 0;
                const hasText = textItems.length > 0;
                const isSideBySide = hasImage && hasText;
                const isTwoImagesOnly = imageItems.length === 2 && !hasText;
                if (isSideBySide) {
                    const imageIndexes = section.items
                        .map((item, idx) => (item.type === "IMAGE" ? idx : -1))
                        .filter(idx => idx !== -1);
                    return (
                        <div
                            key={(section as any).id ?? sIdx}
                            style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}
                        >
                            <div style={{ flex: "0 0 40%", maxWidth: "40%" }}>
                                {imageIndexes.map(iIdx => {
                                    const img = section.items[iIdx] as { type: "IMAGE"; url: string };
                                    const hasUrl = !!img.url;
                                    return (
                                        <div
                                            key={iIdx}
                                            style={{ marginBottom: 8, border: "1px dashed rgba(255,255,255,0.4)", borderRadius: 4, padding: hasUrl ? 0 : 16, cursor: "pointer" }}
                                            onClick={() => {
                                                setImageSlot({ sectionIndex: sIdx, itemIndex: iIdx });
                                                setIsImagePickerOpen(true);
                                            }}
                                            title="Kliknij, aby wstawić / zmienić zdjęcie"
                                        >
                                            {hasUrl ? (
                                                <img src={img.url} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
                                            ) : (
                                                <div
                                                    style={{
                                                        textAlign: "center",
                                                        opacity: 0.9,
                                                        minHeight: 80,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        backgroundColor: "rgb(124 144 208 / 50%)",
                                                        border: "1px solid rgba(255, 255, 255, 0.25)",
                                                        color: "rgba(255, 255, 255, 0.9)",
                                                        borderRadius: 6,
                                                        padding: "8px 12px",
                                                    }}
                                                >
                                                    Kliknij, aby wybrać zdjęcie
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ flex: 1 }}>
                                {textItems.map((t, i) => (
                                    <div key={i} dangerouslySetInnerHTML={{ __html: t.content }} />
                                ))}
                            </div>
                        </div>
                    );
                }
                if (isTwoImagesOnly) {
                    return (
                        <div
                            key={(section as any).id ?? sIdx}
                            style={{ display: "flex", gap: 16, alignItems: "stretch", marginBottom: 16 }}
                        >
                            {section.items.map((item, iIdx) => {
                                if (item.type !== "IMAGE") return null;
                                const hasUrl = !!item.url;
                                return (
                                    <div
                                        key={iIdx}
                                        style={{
                                            flex: "1 1 50%",
                                            border: "1px dashed rgba(255,255,255,0.4)",
                                            borderRadius: 4,
                                            padding: hasUrl ? 0 : 16,
                                            cursor: "pointer",
                                        }}
                                        onClick={() => {
                                            setImageSlot({ sectionIndex: sIdx, itemIndex: iIdx });
                                            setIsImagePickerOpen(true);
                                        }}
                                        title="Kliknij, aby wstawić / zmienić zdjęcie"
                                    >
                                        {hasUrl ? (
                                            <img src={item.url} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
                                        ) : (
                                            <div
                                                style={{
                                                    textAlign: "center",
                                                    opacity: 0.9,
                                                    minHeight: 80,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    backgroundColor: "rgb(124 144 208 / 50%)",
                                                    border: "1px solid rgba(255, 255, 255, 0.25)",
                                                    color: "rgba(255, 255, 255, 0.9)",
                                                    borderRadius: 6,
                                                    padding: "8px 12px",
                                                }}
                                            >
                                                Kliknij, aby wybrać zdjęcie
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
                // Sekcja pionowa (tylko tekst lub tylko obrazki)
                return (
                    <div key={(section as any).id ?? sIdx} style={{ marginBottom: 16 }}>
                        {section.items.map((item, iIdx) => {
                            if (item.type === "TEXT") {
                                return <div key={iIdx} dangerouslySetInnerHTML={{ __html: item.content }} />;
                            }
                            if (item.type === "IMAGE") {
                                const hasUrl = !!item.url;
                                return (
                                    <div
                                        key={iIdx}
                                        style={{ margin: "10px 0", border: "1px dashed rgba(255,255,255,0.4)", borderRadius: 4, padding: hasUrl ? 0 : 16, cursor: "pointer" }}
                                        onClick={() => {
                                            setImageSlot({ sectionIndex: sIdx, itemIndex: iIdx });
                                            setIsImagePickerOpen(true);
                                        }}
                                        title="Kliknij, aby wstawić / zmienić zdjęcie"
                                    >
                                        {hasUrl ? (
                                            <img src={item.url} alt="" style={{ maxWidth: "100%", display: "block" }} />
                                        ) : (
                                            <div
                                                style={{
                                                    textAlign: "center",
                                                    opacity: 0.9,
                                                    minHeight: 80,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    backgroundColor: "rgb(124 144 208 / 50%)",
                                                    border: "1px solid rgba(255, 255, 255, 0.25)",
                                                    color: "rgba(255, 255, 255, 0.9)",
                                                    borderRadius: 6,
                                                    padding: "8px 12px",
                                                }}
                                            >
                                                Kliknij, aby wybrać zdjęcie
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                );
            })}
        </div>
    );

    // *** RENDEROWANIE FORMULARZA ***
    return (
        <div className="addProductMainContainer">
            <Box sx={{ display: 'flex', flexDirection: 'column', pb: 10 }}>
                <Box
                    sx={{
                        position: "fixed",
                        bottom: 16,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 20,
                        width: "fit-content",
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 1.5,
                            alignItems: "center",
                            justifyContent: "center",
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            border: "1px solid rgba(255,255,255,0.08)",
                            backgroundColor: "rgba(20, 23, 33, 0.75)",
                            backdropFilter: "blur(6px)",
                        }}
                    >
                        <Button
                            disabled={loading}
                            variant="contained"
                            onClick={handleAddAllegroOffer}
                        >
                            {loading ? (
                                <>
                                    <CircularProgress size={18} sx={{ mr: 1 }} />
                                    Ładowanie…
                                </>
                            ) : (
                                "Dodaj produkt do Allegro"
                            )}
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleSubmit(onSubmit)}
                        >
                            Dodaj (Shoper + apilo)
                        </Button>
                        <Button
                            variant="contained"
                            color="warning"
                            disabled={updatingProduct}
                            onClick={handleSubmit(handleUpdateProduct)}
                        >
                            {updatingProduct ? (
                                <>
                                    <CircularProgress size={18} sx={{ mr: 1 }} />
                                    Aktualizowanie…
                                </>
                            ) : (
                                "Zaktualizuj Shoper"
                            )}
                        </Button>
                    </Box>
                </Box>
                {/* Formularz dodawania produktu */}
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column' }}>
                    <RelatedProductsSelect authToken={props.authToken} value={relatedPackId} onChange={setRelatedPackId} />
                    <Box sx={{ py: 2, display: 'grid', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <ThemeProvider theme={MainTheme}>
                            <Box sx={{ borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)", p: 2, backgroundColor: "rgba(20, 23, 33, 0.35)" }}>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    Formularz Shoper / Apilo
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                    Dane podstawowe produktu oraz parametry wysyłane do Shopera i Apilo.
                                </Typography>
                            </Box>
                            <FormControl fullWidth>
                                <InputLabel>język opisu</InputLabel>
                                <Select label="język opisu" defaultValue="description" {...register("descriptionLanguage")}>
                                    <MenuItem value="description">Polski (Shoper + Apilo)</MenuItem>
                                    <MenuItem value="descriptionCZ">Czeski</MenuItem>
                                    <MenuItem value="descriptionSK">Słowacki</MenuItem>
                                    <MenuItem value="descriptionAllegro">Allegro</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Połączenie z produktem Allegro */}
                            <Box sx={{ borderRadius: 1, boxShadow: 1, p: 2, backgroundColor: 'rgb(55, 61, 77)' }}>
                                <FormControlLabel control={<Checkbox defaultChecked {...register("connectProductAllegro")} />} label="Połącz z produktem Allegro" />
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <TextField
                                        variant="filled"
                                        size="small"
                                        type="text"
                                        value={searchName}
                                        onChange={(e) => setSearchName(e.target.value)}
                                        placeholder="Wyszukaj produkt Allegro"
                                        fullWidth
                                    />
                                    <Button type="button" variant="contained" color="primary" onClick={handleSearch}>
                                        Szukaj
                                    </Button>
                                </Box>
                                <Button sx={{ mt: 2, fontSize: '15px' }} onClick={handleImportAllegroFormToShoper}>
                                    Importuj dane z Allegro
                                </Button>
                            </Box>

                            <Box sx={{ borderRadius: 1, boxShadow: 1, p: 2, backgroundColor: 'rgb(55 77 69)' }}>
                                <Typography variant="h6" sx={{ textAlign: "center" }}>Pobierz z produkty shoper</Typography>
                                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                    <TextField
                                        label="ID aukcji Shoper"
                                        variant="outlined"
                                        size="small"
                                        value={shoperOfferId}
                                        onChange={(e) => setShoperOfferId(e.target.value)}
                                        fullWidth
                                    />
                                    <Button
                                        type="button"
                                        variant="contained"
                                        onClick={handleFetchShoperOffer}
                                        disabled={loadingShoperOffer}
                                    >
                                        {loadingShoperOffer ? "Pobieranie..." : "Pobierz"}
                                    </Button>
                                </Box>
                            </Box>

                            <FormControlLabel control={<Checkbox defaultChecked {...register("active")} />} label="Aktywność" />
                            <TextField required label="SKU" InputLabelProps={{ shrink: true }} {...register("SKU")} />
                            <TextField required label="Ilość" type="number" InputLabelProps={{ shrink: true }} {...register("stock")} />
                            <TextField required label="Cena" type="number" InputLabelProps={{ shrink: true }} {...register("price")} />
                            <TextField
                                required
                                label="Tytuł"
                                type="text"
                                InputLabelProps={{ shrink: true }}
                                {...register("name", {
                                    onBlur: async (e) => {
                                        const value = e.target.value;
                                        try {
                                            await ensureTranslatedTitlesForName(value, true);
                                            toast.success("Przetłumaczono tytuł (CZ/SK)");
                                        } catch (error) {
                                            console.error("Błąd podczas tłumaczenia tytułu:", error);
                                            toast.error("Błąd tłumaczenia tytułu");
                                        }
                                    }
                                })}
                            />

                            {/* Wybór kategorii głównej */}
                            <Controller
                                name="categoryId"
                                control={control}
                                defaultValue={0}
                                render={({ field }) => {
                                    const options = getLaptopCategoryOptions(
                                        field.value ? [Number(field.value)] : []
                                    );
                                    return (
                                        <Autocomplete<CategoryResource>
                                            options={options}
                                            getOptionLabel={getCategoryName}
                                            isOptionEqualToValue={(option, value) =>
                                                option.category_id === value.category_id
                                            }
                                            value={
                                                options.find(cat => cat.category_id === field.value) || null
                                            }
                                            onChange={(_, newValue) =>
                                                field.onChange(newValue ? newValue.category_id : 0)
                                            }
                                            renderOption={(props, option) => (
                                                <li {...props} key={option.category_id}>
                                                    {getCategoryName(option)}
                                                </li>
                                            )}
                                            renderInput={(params) => (
                                                <TextField {...params} label="Kategoria" />
                                            )}
                                        />
                                    );
                                }}
                            />
                            {/* Wybór dodatkowych kategorii */}
                            <Controller
                                name="AdditionalCategories"
                                control={control}
                                defaultValue={[]}
                                render={({ field }) => {
                                    const selectedIds = Array.isArray(field.value)
                                        ? field.value.map((id: any) => Number(id))
                                        : [];
                                    const options = getLaptopCategoryOptions(selectedIds);
                                    return (
                                        <Autocomplete<CategoryResource, true>
                                            multiple
                                            disableCloseOnSelect
                                            options={options}
                                            getOptionLabel={getCategoryName}
                                            isOptionEqualToValue={(option, value) => option?.category_id === value?.category_id}
                                            value={options.filter(cat => selectedIds.includes(cat.category_id)) || []}
                                            onChange={(_, newValue) => field.onChange(newValue.map(item => item.category_id))}
                                            renderOption={(props, option) => (
                                                <li {...props} key={option.category_id}>{getCategoryName(option)}</li>
                                            )}
                                            renderInput={(params) => <TextField {...params} label="Dodatkowe kategorie" />}
                                        />
                                    );
                                }}
                            />

                            {/* Wybór producenta */}
                            <Controller
                                name="producer"
                                control={control}
                                defaultValue={0}
                                render={({ field }) => (
                                    <Autocomplete
                                        options={producers}
                                        getOptionLabel={(option) => option.name || ""}
                                        isOptionEqualToValue={(option, value) => option.producer_id === value.producer_id}
                                        value={producers.find(p => p.producer_id === field.value) || null}
                                        onChange={(_, newValue) => field.onChange(newValue?.producer_id || 0)}
                                        renderOption={(props, option) => (
                                            <li {...props} key={option.producer_id}>{option.name}</li>
                                        )}
                                        renderInput={(params) => <TextField {...params} label="Producent" />}
                                    />
                                )}
                            />

                            <FormControl fullWidth>
                                <InputLabel id="product-safety-producer-label">
                                    Product Safety Producer
                                </InputLabel>
                                <Controller
                                    name="productSafetyProducerId"
                                    control={control}
                                    defaultValue={0}
                                    render={({ field }) => (
                                        <Select
                                            labelId="product-safety-producer-label"
                                            label="Product Safety Producer"
                                            value={field.value ?? 0}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        >
                                            <MenuItem value={0}>—</MenuItem>
                                            {productSafetyProducers.length === 0 ? (
                                                <MenuItem value={0} disabled>
                                                    Brak danych
                                                </MenuItem>
                                            ) : null}
                                            {productSafetyProducers.map((producer) => {
                                                const id = getProductSafetyProducerId(producer);
                                                if (id == null) return null;
                                                return (
                                                    <MenuItem key={id} value={id}>
                                                        {producer.name}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    )}
                                />
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel id="product-safety-certificates-label">
                                    Product Safety Certificates
                                </InputLabel>
                                <Controller
                                    name="productSafetyCertificateIds"
                                    control={control}
                                    defaultValue={[]}
                                    render={({ field }) => (
                                        <Select
                                            multiple
                                            labelId="product-safety-certificates-label"
                                            label="Product Safety Certificates"
                                            value={Array.isArray(field.value) ? field.value : []}
                                            renderValue={(selected) =>
                                                (selected as Array<number | string>)
                                                    .map((id) => getProductSafetyCertificateNameById(id))
                                                    .join(", ")
                                            }
                                            onChange={(e) => {
                                                const value = e.target.value as Array<number | string>;
                                                field.onChange(
                                                    value
                                                        .map((id) => normalizeIdValue(id))
                                                        .filter((id): id is number | string => id != null)
                                                );
                                            }}
                                        >
                                            {productSafetyCertificates.length === 0 ? (
                                                <MenuItem value="" disabled>
                                                    Brak danych
                                                </MenuItem>
                                            ) : null}
                                            {productSafetyCertificates.map((certificate) => {
                                                const id = getProductSafetyCertificateId(certificate);
                                                if (id == null) return null;
                                                return (
                                                    <MenuItem key={id} value={id}>
                                                        <Checkbox
                                                            checked={
                                                                Array.isArray(field.value)
                                                                    ? field.value.map(String).includes(String(id))
                                                                    : false
                                                            }
                                                        />
                                                        {certificate.name}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    )}
                                />
                            </FormControl>

                            {/* Formularz atrybutów produktu (LaptopAttributeForm wewnątrz zawiera pola specyficzne dla laptopa) */}
                            <LaptopAttributeForm
                                attributeList={attributeList}
                                control={control}
                                register={register}
                                loading={loading}
                                textAttributeHandlers={textAttributeHandlers}
                            />

                            {/* Pola opisów (PL + Apilo) – ukryte lub niewidoczne, mogą służyć do edycji podglądu */}
                            <label>Opis (PL Shoper)</label>
                            <textarea style={{}} {...register("description")} />
                            <label>Opis (Apilo)</label>
                            <textarea style={{}} {...register("descriptionApilo")} />

                            {/* Sekcja dodawania zdjęć */}
                            <label>Dodaj zdjęcia</label>
                            <Box
                                role="button"
                                tabIndex={0}
                                onClick={() => imageInputRef.current?.click()}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        imageInputRef.current?.click();
                                    }
                                }}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 2,
                                    px: 2,
                                    py: 2,
                                    borderRadius: 2,
                                    border: "1px dashed rgba(255,255,255,0.25)",
                                    backgroundColor: "rgba(20, 23, 33, 0.25)",
                                    cursor: "pointer",
                                    transition: "border-color 0.2s ease, background-color 0.2s ease",
                                    "&:hover": {
                                        borderColor: "rgba(255,255,255,0.45)",
                                        backgroundColor: "rgba(20, 23, 33, 0.4)",
                                    },
                                }}
                            >
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                    <Typography sx={{ fontWeight: 600 }}>Wybierz zdjęcia lub przeciągnij pliki</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                        Obsługiwane formaty: JPG, PNG, WEBP
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        imageInputRef.current?.click();
                                    }}
                                >
                                    Wybierz pliki
                                </Button>
                            </Box>
                            <input
                                ref={imageInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                hidden
                            />
                            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    {selectedImages.length ? `Wybrano: ${selectedImages.length}` : "Brak zdjęć"}
                                </Typography>
                                {selectedImages.length > 0 && (
                                    <Button variant="text" size="small" onClick={handleClearImages}>
                                        Wyczyść
                                    </Button>
                                )}
                            </Box>
                            {selectedImages.length > 0 && (
                                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.7 }}>
                                    {selectedImages.map(file => file.name).join(", ")}
                                </Typography>
                            )}

                            {imagePreviews.length > 0 && (
                                <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
                                    <Typography variant="body2">
                                        Kolejność zdjęć: {imagePreviews.length}
                                    </Typography>
                                    <Button variant="outlined" onClick={() => setIsImageManagerOpen(true)}>
                                        Zarządzaj zdjęciami
                                    </Button>
                                </Box>
                            )}

                            <Button variant="outlined" onClick={handleReset}>Reset formularza</Button>
                        </ThemeProvider>
                    </Box>
                </form>

                {/* Panel parametrów Allegro obok formularza głównego */}
                <Box sx={{ py: 2, gap: 2, alignItems: 'center', flexWrap: 'wrap', maxWidth: { xs: '100%', lg: '25vw' } }}>
                    <Box
                        sx={{
                            borderRadius: 2,
                            border: "1px solid rgba(255,255,255,0.08)",
                            p: 2,
                            backgroundColor: "rgba(20, 23, 33, 0.35)",
                            color: "rgba(255,255,255,0.92)",
                            "& .MuiInputBase-input, & .MuiInputLabel-root, & .MuiSelect-select, & .MuiTypography-root": {
                                color: "rgba(255,255,255,0.92)",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255,255,255,0.18)",
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                                color: "rgba(255,255,255,0.92)",
                            },
                        }}
                    >
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                            Formularz Allegro
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
                            Dane wykorzystywane wyłącznie do wystawienia na Allegro.
                        </Typography>
                        <Stack spacing={2}>
                            <TextField
                                label="Tytuł Allegro"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ maxLength: 75 }}
                                {...register("allegroTitle")}
                            />
                            <TextField
                                label="Cena Allegro"
                                type="number"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                {...register("allegroPrice", { valueAsNumber: true })}
                            />
                            <ResponsibleProducerSelect
                                data={responsibleData}
                                value={responsibleProducerId}
                                onChange={setResponsibleProducerId}
                            />
                            <Button onClick={handleReset}>Reset Allegro</Button>
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            borderRadius: 2,
                            border: "1px solid rgba(255,255,255,0.08)",
                            p: 2,
                            backgroundColor: "rgba(20, 23, 33, 0.35)",
                            color: "rgba(255,255,255,0.92)",
                            "& .MuiInputBase-input, & .MuiInputLabel-root, & .MuiSelect-select, & .MuiTypography-root": {
                                color: "rgba(255,255,255,0.92)",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255,255,255,0.18)",
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                                color: "rgba(255,255,255,0.92)",
                            },
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            Treści Allegro
                        </Typography>
                        <Stack spacing={2}>
                            <Controller
                                name="series"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="lap_series">Seria laptopa</InputLabel>
                                        <Select labelId="lap_series" label="Seria laptopa" {...field}>
                                            <MenuItem value="">Brak</MenuItem>
                                            <MenuItem value={dellSeriesHtml}>Dell Latitude (opis serii)</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />
                            <Controller
                                name="introText"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label="Wstęp opisu Allegro" multiline minRows={4} fullWidth variant="outlined" />
                                )}
                            />
                            <Controller
                                name="introText2"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField {...field} label="Dodatkowy wstęp Allegro" multiline minRows={4} fullWidth variant="outlined" />
                                )}
                            />
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            borderRadius: 2,
                            border: "1px solid rgba(255,255,255,0.08)",
                            p: 2,
                            backgroundColor: "rgba(20, 23, 33, 0.35)",
                            color: "rgba(255,255,255,0.92)",
                            overflow: "hidden",
                            "& .MuiInputBase-root": {
                                width: "100%",
                                maxWidth: "100%",
                                boxSizing: "border-box",
                                minHeight: 52,
                            },
                            "& .MuiFormControl-root": {
                                width: "100%",
                                maxWidth: "100%",
                                minWidth: 0,
                            },
                            "& .MuiOutlinedInput-input": {
                                padding: "14px 14px",
                                boxSizing: "border-box",
                            },
                            "& .MuiSelect-select": {
                                minHeight: "1.5em",
                                display: "flex",
                                alignItems: "center",
                            },
                            "& .MuiInputBase-input, & .MuiInputLabel-root, & .MuiSelect-select, & .MuiTypography-root": {
                                color: "rgba(255,255,255,0.92)",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255,255,255,0.18)",
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                                color: "rgba(255,255,255,0.92)",
                            },
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            Parametry Allegro
                        </Typography>
                        <ThemeProvider theme={MainTheme}>
                            <Box sx={{
                                width: "100%",
                                overflow: "hidden",
                                "& .MuiFormControl-root": {
                                    width: "100%",
                                    maxWidth: "100%",
                                    minWidth: 0,
                                },
                                "& .MuiInputBase-root": {
                                    width: "100%",
                                    maxWidth: "100%",
                                    boxSizing: "border-box",
                                    minHeight: 52,
                                },
                                "& .MuiInputBase-input": {
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "14px 14px",
                                },
                                "& .MuiSelect-select": {
                                    minHeight: "1.5em",
                                    display: "flex",
                                    alignItems: "center",
                                },
                            }}>
                                <AllegroParameters
                                    Parameters={laptopParametersAllegro}
                                    formData={formData}
                                    register={register}
                                    handleChangeAllegro={(param, value) => {
                                        setFormData(prev => ({ ...prev, [param]: value }));
                                        const idx = laptopParametersAllegro.findIndex(p => p.name === param);
                                        if (idx !== -1) {
                                            setValue(`attribute_${idx}`, value);
                                        }
                                    }}
                                    isParamDisabled={isParamDisabled}
                                />
                            </Box>
                        </ThemeProvider>
                    </Box>
                </Box>
            </Box>

            {/* Wyniki wyszukiwania produktu Allegro */}
            <AllegroSearchResults
                showSearchresult={showSearchresult}
                searchResult={searchResult}
                selectedProductId={selectedProductId}
                setShowSearchresult={setShowSearchresult}
                handleSelectAllegroProduct={handleSelectAllegroLaptop}
            />

            {/* Dialog wyboru zdjęcia do opisu Allegro */}
            <Dialog
                open={isImagePickerOpen && imageSlot !== null}
                onClose={() => setIsImagePickerOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Wybierz zdjęcie do opisu Allegro</DialogTitle>
                <DialogContent dividers>
                    {imageLinks.length === 0 ? (
                        <Typography>Brak wgranych zdjęć – najpierw dodaj zdjęcia powyżej.</Typography>
                    ) : (
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 2 }}>
                            {imageLinks.map(url => (
                                <Box
                                    key={url}
                                    sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 1, overflow: "hidden", cursor: "pointer" }}
                                    onClick={() => {
                                        if (!imageSlot) return;
                                        handleAllegroImageChange(imageSlot.sectionIndex, imageSlot.itemIndex, url);
                                        setIsImagePickerOpen(false);
                                    }}
                                >
                                    <img src={url} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} />
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsImagePickerOpen(false)}>Zamknij</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={isImageManagerOpen}
                onClose={() => setIsImageManagerOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Zarządzanie zdjęciami
                    <IconButton
                        onClick={() => setIsImageManagerOpen(false)}
                        sx={{ position: "absolute", right: 8, top: 8 }}
                    >
                        <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>×</Box>
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {imagePreviews.length === 0 ? (
                        <Typography variant="body2">Brak zdjęć do wyświetlenia.</Typography>
                    ) : (
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 2 }}>
                            {imagePreviews.map((preview, index) => (
                                <Box
                                    key={`${preview}-${index}`}
                                    draggable
                                    onDragStart={() => setDraggedImageIndex(index)}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={() => {
                                        if (draggedImageIndex == null) return;
                                        moveImage(draggedImageIndex, index);
                                        setDraggedImageIndex(null);
                                    }}
                                    sx={{
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        borderRadius: 1,
                                        overflow: "hidden",
                                        cursor: "grab",
                                        position: "relative",
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={preview}
                                        alt={`Zdjęcie ${index + 1}`}
                                        sx={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                                    />
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 6,
                                            left: 6,
                                            backgroundColor: "rgba(0,0,0,0.6)",
                                            color: "#fff",
                                            fontSize: 12,
                                            px: 0.5,
                                            borderRadius: 0.5,
                                        }}
                                    >
                                        {index + 1}
                                    </Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => removeImageAt(index)}
                                        sx={{
                                            position: "absolute",
                                            top: 4,
                                            right: 4,
                                            backgroundColor: "rgba(0,0,0,0.6)",
                                            color: "#fff",
                                            "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" },
                                        }}
                                    >
                                        <Box component="span" sx={{ fontSize: 14, lineHeight: 1 }}>×</Box>
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsImageManagerOpen(false)}>Zamknij</Button>
                </DialogActions>
            </Dialog>

            {/* Edytor sekcji opisu Allegro */}
            {descriptionLanguage === "descriptionAllegro" ? (
                <Box sx={{ mt: 2, ml: { xs: 0, md: 2 }, mr: { xs: 0, md: 2 } }}>
                    <Box sx={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2.5, p: 2, backgroundColor: "rgba(20, 22, 28, 0.7)" }}>
                        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.5, justifyContent: "space-between", alignItems: { md: "center" }, mb: 2 }}>
                            <Box>
                                <Typography variant="h6">Zarządzanie sekcjami Allegro</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                    Liczba sekcji: {allegroTemplate.sections.length}
                                </Typography>
                            </Box>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <Button variant="contained" size="small" onClick={handleAddTextSection}>
                                    + Sekcja tekstowa
                                </Button>
                                <Button variant="outlined" size="small" onClick={handleAddImageTextSection}>
                                    + Sekcja zdjęcie + opis
                                </Button>
                                <Button variant="outlined" size="small" onClick={handleAddTwoImageSection}>
                                    + Sekcja z 2 zdjęciami
                                </Button>
                                <Button variant="outlined" size="small" onClick={handleAddImageSection}>
                                    + Sekcja ze zdjęciem
                                </Button>
                            </Stack>
                        </Box>

                        <Box
                            sx={{
                                display: "block",
                                gap: 2,
                                alignItems: "start",
                            }}
                        >
                            <Stack spacing={1} sx={{ maxHeight: 420, overflowY: "auto", pr: 0.5 }}>
                                {allegroTemplate.sections.length === 0 ? (
                                    <Typography variant="body2" sx={{ opacity: 0.75 }}>
                                        Brak sekcji. Dodaj pierwszą sekcję, aby rozpocząć.
                                    </Typography>
                                ) : (
                                    allegroTemplate.sections.map((section, idx) => {
                                        const isSelected = idx === selectedAllegroSectionIndex;
                                        const label = getSectionLabel(section, idx);
                                        const summary = getSectionSummary(section);
                                        const hasImage = section.items.some((item) => item.type === "IMAGE");
                                        const firstImage = section.items.find((item) => item.type === "IMAGE") as
                                            | { type: "IMAGE"; url: string }
                                            | undefined;
                                        const hasText = section.items.some((item) => item.type === "TEXT");
                                        return (
                                            <Box
                                                key={(section as any).id ?? idx}
                                                onClick={() => setSelectedAllegroSectionIndex(idx)}
                                                sx={{
                                                    cursor: "pointer",
                                                    borderRadius: 1.5,
                                                    border: isSelected ? "1px solid rgba(130,200,255,0.7)" : "1px solid rgba(255,255,255,0.1)",
                                                    backgroundColor: isSelected ? "rgba(80, 110, 160, 0.25)" : "rgba(36, 38, 44, 0.6)",
                                                    p: 1.2,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 0.7,
                                                }}
                                            >
                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                                                    <Typography variant="subtitle2">{label}</Typography>
                                                    <Typography variant="caption" sx={{ opacity: 0.65 }}>
                                                        {section.origin === "auto" ? "Auto" : "Ręcznie"}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                                    <Box
                                                        sx={{
                                                            width: 44,
                                                            height: 32,
                                                            borderRadius: 1,
                                                            border: "1px solid rgba(255,255,255,0.15)",
                                                            overflow: "hidden",
                                                            backgroundColor: "rgba(255,255,255,0.04)",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {hasImage && firstImage?.url ? (
                                                            <img src={firstImage.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                        ) : null}
                                                    </Box>
                                                    <Typography variant="caption" sx={{ opacity: 0.78 }}>
                                                        {summary}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ opacity: 0.55 }}>
                                                    {hasText ? "Tekst" : "Brak tekstu"} • {hasImage ? "Zdjęcie" : "Brak zdjęcia"}
                                                </Typography>
                                            </Box>
                                        );
                                    })
                                )}
                            </Stack>

                            <Box sx={{ mt: 2, borderRadius: 1.8, border: "1px dashed rgba(255,255,255,0.18)", p: 2, backgroundColor: "rgba(24, 26, 34, 0.8)" }}>
                                {allegroTemplate.sections.length === 0 ? (
                                    <Typography variant="body2" sx={{ opacity: 0.75 }}>
                                        Wybierz lub dodaj sekcję, aby edytować treść.
                                    </Typography>
                                ) : (() => {
                                    const safeIndex = Math.min(
                                        selectedAllegroSectionIndex,
                                        Math.max(0, allegroTemplate.sections.length - 1)
                                    );
                                    const section = allegroTemplate.sections[safeIndex];
                                    const hasImage = section.items.some((item) => item.type === "IMAGE");
                                    const hasText = section.items.some((item) => item.type === "TEXT");
                                    const firstTextItem = section.items.find((item) => item.type === "TEXT") as
                                        | { type: "TEXT"; content: string }
                                        | undefined;
                                    const imageItems = section.items
                                        .map((item, idx) => ({ item, idx }))
                                        .filter(({ item }) => item.type === "IMAGE") as Array<{ item: { type: "IMAGE"; url: string }; idx: number }>;

                                    return (
                                        <Stack spacing={1.6}>
                                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                                                <Typography variant="subtitle1">{getSectionLabel(section, safeIndex)}</Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                                    {section.origin === "auto" ? "Auto" : "Ręcznie"}
                                                </Typography>
                                            </Box>

                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                <Button size="small" variant="outlined" onClick={() => handleMoveSection(safeIndex, "up")} disabled={safeIndex === 0}>
                                                    ↑ W górę
                                                </Button>
                                                <Button size="small" variant="outlined" onClick={() => handleMoveSection(safeIndex, "down")} disabled={safeIndex === allegroTemplate.sections.length - 1}>
                                                    ↓ W dół
                                                </Button>
                                                <Button size="small" color="error" onClick={() => handleRemoveSection(safeIndex)}>
                                                    Usuń sekcję
                                                </Button>
                                            </Stack>

                                            {hasImage && (
                                                <Box>
                                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Zdjęcia w sekcji (kliknij miniaturę, aby podmienić)</Typography>
                                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                                                        {imageItems.map(({ item, idx }) => (
                                                            <Box
                                                                key={idx}
                                                                onClick={() => {
                                                                    setImageSlot({ sectionIndex: safeIndex, itemIndex: idx });
                                                                    setIsImagePickerOpen(true);
                                                                }}
                                                                sx={{
                                                                    width: 96,
                                                                    height: 64,
                                                                    borderRadius: 1,
                                                                    border: "1px solid rgba(255,255,255,0.25)",
                                                                    overflow: "hidden",
                                                                    cursor: "pointer",
                                                                    backgroundColor: "rgba(255,255,255,0.05)",
                                                                }}
                                                            >
                                                                {item.url ? (
                                                                    <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                ) : (
                                                                    <Typography variant="caption" sx={{ p: 1, display: "block", textAlign: "center", opacity: 0.7 }}>
                                                                        Brak
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}

                                            {hasText && firstTextItem && (
                                                <Box>
                                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Treść sekcji</Typography>
                                                    <textarea
                                                        style={{
                                                            width: "100%",
                                                            minHeight: 180,
                                                            borderRadius: 8,
                                                            background: "rgba(30, 34, 46, 0.9)",
                                                            border: "1px solid rgba(255,255,255,0.12)",
                                                            color: "#f2f2f2",
                                                            padding: 10,
                                                            marginTop: 6,
                                                        }}
                                                        value={firstTextItem.content}
                                                        onChange={(e) => handleAllegroTextChange(safeIndex, e.target.value)}
                                                    />
                                                </Box>
                                            )}

                                            {!hasImage && !hasText && (
                                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                                    Ta sekcja nie ma jeszcze treści. Dodaj tekst lub zdjęcie.
                                                </Typography>
                                            )}
                                        </Stack>
                                    );
                                })()}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            ) : null}


            {/* Podgląd opisu w wybranym języku */}
            <div className="preview">
                {descriptionLanguage === "description" && (
                    <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: description + descriptionApilo }} />
                )}
                {descriptionLanguage === "descriptionCZ" && (
                    <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: descriptionCZ }} />
                )}
                {descriptionLanguage === "descriptionSK" && (
                    <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: descriptionSK }} />
                )}
                {descriptionLanguage === "descriptionAllegro" && renderAllegroPreview()}
            </div>
        </div>
    );
}

export default AddLaptopNew;
