import axios from "axios";
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './addProducts.css';
import { apiloSystemType, cpuTypesDescriptions, cpuTypesDescriptionsCZ, cpuTypesDescriptionsSK, desktopStatus, desktopStatusCZ, desktopStatusSK, diskTypesDescriptions, diskTypesDescriptionsCZ, diskTypesDescriptionsSK, ramTypesDescriptions, ramTypesDescriptionsCZ, ramTypesDescriptionsSK, systemType, systemTypeCZ, systemTypeSK } from "./additionalDescriptions/pcAdditionalDescription";
import { TextField, Button, Checkbox, FormControlLabel, FormControl, InputLabel, Select, MenuItem, Box, ThemeProvider, Typography, TextareaAutosize, SelectChangeEvent, ListItemText, Autocomplete, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { MainTheme } from "./themes";
import { API_URL } from "../config";
import { handleImageUpload } from "../image-host";
import { additionalTranslationsCZ, additionalTranslationsPL, additionalTranslationsSK, conditionCZ, conditionSK, pcCaseVC_CZ, pcCaseVC_SK, pcVC, vc_CZ, vc_SK } from "./additionalDescriptions/visualConditionDescriptions";
import { pcTemplateCZ } from "./templatesCZ/pcTemplateCZ";
import { pcTemplateSK } from "./templatesSK/pcTemplateSK";
import { handleTranslateCZ, handleTranslateSK } from "../backendQueries/translate";
import { AddImageApilo } from "../backendQueries/addImageApilo";
import { AddProductShoper } from "../backendQueries/addProductShoper";
import { AddProductApilo } from "../backendQueries/addProductApilo";
import { AddAttributesApilo } from "../backendQueries/addAttributesApilo";
import { AddImageShoper } from "../backendQueries/addImageShoper";
import { UpdateProductShoper } from "../backendQueries/updateProductShoper";
import { Product, SearchResult, FormData, FormDataAllegro, ProducersResource, ProductSafetyCertificateResource, ProductSafetyProducerResource } from "../types";
import { buildOfferParameters } from "./allegroComponents/buildOfferParameters";
import AllegroProductSearch from "./allegroComponents/searchProductAllegro";
import AllegroSearchResults from "./allegroComponents/searchProductAllegroResoult";
import { handleSelectAllegroProduct as handleSelectAllegroProductUtil } from "./allegroComponents/selectAllegroProduct";
import { handleGetProducers } from "../backendQueries/getProducers";
import { handleGetAttributeList } from "../backendQueries/handleGetAttributeList";
import { handleGetProductSafetyProducers } from "../backendQueries/getProductSafetyProducers";
import { handleGetProductSafetyCertificates } from "../backendQueries/getProductSafetyCertificates";
import AllegroParameters from "./allegroComponents/AllegroParameters";
import { pcNewParameteres } from "../allegroParameters/pcNewParameteres";
import { AttributeForm } from "./shoperParametersOrder/pcParametersOrder";
import { ApiloDescription, PcApiloAioSpecyfication, PcApiloSpecyfication, pcTemplateNew } from "./templates/pcTemplateNew";
import { ResponsibleProducerSelect, ResponsibleResponse } from "./allegroComponents/responsibleProducers";
import React from "react";
import RelatedProductsSelect from "../relatedProductsSelect";

type AddProductProps = {
    authToken: string
    accessTokenAllegro: string
}
export type ApiloResponse = {
    products: {
        [sku: string]: number; // SKU jako klucz, ID jako wartość
    };
};

interface Attribute {
    attribute_id: number;
    name: string;
    type: string;
    options: {
        option_id: number;
        value: string;
    }[];
}

export interface IFormInput {
    firstName: string
    producer: number
    SKU: string
    stock: number
    price: number
    name: string
    description: string
    descriptionCZ: string,
    descriptionSK: string
    active: boolean
    visualCondition: string
    condition: string
    ports: string
    model: string
    DVD: string
    diskCapacity: string
    diskType: string
    brend: string
    cpu: string
    cpuModel: string
    cpuMaxClockSpeed: string
    cpuClockSpeed: string
    cpuThreads: string
    cpuCores: string
    ramAmount: string
    ramType: string
    color: string
    depth: string
    width: string
    height: string
    system: string
    caseType: string
    gpu: string
    included: string
    additionalInfo: string
    gpuDescriptions: string
    gpuI: string,
    resolution: string,
    matrixType: string,
    matrixSize: string,
    Frequency: string,
    touchScreen: string,
    microphone: string,
    camera: string,
    descriptionLanguage: string,
    connectProductAllegro: boolean,
    productSafetyProducerId?: number,
    productSafetyCertificateIds?: number[],
    productSafetyWarnings?: string[],
    [key: string]: any; // Dynamiczne pola formularza dla atrybutów
}
let caseDescription = ""

const getGaugeIdForCaseType = (caseType: string) =>
    caseType === "SFF" ||
        caseType === "Tiny" ||
        caseType === "USFF" ||
        caseType === "Micro" ||
        caseType === "USDT" ||
        caseType === "Mini"
        ? 5
        : 6;

const getCaseDescriptionForType = (caseType: string) =>
    getGaugeIdForCaseType(caseType) === 5
        ? "Mała, kompaktowa obudowa"
        : " Łatwa w rozbudowie, pojemna obudowa ";
function AddPC(props: AddProductProps) {
    const { register, handleSubmit, watch, setValue, control, getValues } = useForm<IFormInput>()
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imageSrc, setImageSrc] = useState<string>("");
    const [nameCZ, setNameCZ] = useState("");
    const [nameSK, setNameSK] = useState("");
    const [IncludeCZ, setIncludeCZ] = useState("");
    const [IncludeSK, setIncludeSK] = useState("");
    const [additionalInfoCZ, setAdditionalInfoCZ] = useState("");
    const [additionalInfoSK, setAdditionalInfoSK] = useState("");
    const [gpuDescriptionsCZ, setGpuDescriptionsCZ] = useState("");
    const [gpuDescriptionsSK, setGpuDescriptionsSK] = useState("");
    const [imageLinks, setImageLinks] = useState<string[]>([]);
    const [producers, setProducers] = useState<ProducersResource[]>([]);
    const [productSafetyProducers, setProductSafetyProducers] = useState<ProductSafetyProducerResource[]>([]);
    const [productSafetyCertificates, setProductSafetyCertificates] = useState<ProductSafetyCertificateResource[]>([]);
    const [attributeList, setAttributeList] = useState<Attribute[]>([]);
    let apiloImageUUIDs: string[] | undefined
    const [loading, setLoading] = useState(false); // Dodajemy stan loading
    const [updatingProduct, setUpdatingProduct] = useState(false);
    const [ports, setPorts] = useState<string[]>([]);
    const [shoperOfferId, setShoperOfferId] = useState("");
    const [loadingShoperOffer, setLoadingShoperOffer] = useState(false);
    const [pendingShoperAttributes, setPendingShoperAttributes] = useState<Array<[number, unknown]> | null>(null);
    const [gaugeId, setGaugeId] = useState<number>(6);
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const lastUploadKeyRef = useRef<string>("");
    const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);

    ////////////// Allegro ////////////////
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [showSearchresult, setShowSearchresult] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [result, setResult] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState<Product>();
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({});
    const [params, setParams] = useState(null);
    const [lockedParams, setLockedParams] = useState<Set<string>>(new Set());
    const [responsibleData, setResponsibleData] = useState<ResponsibleResponse | undefined>(undefined);
    const [responsibleProducerId, setResponsibleProducerId] = useState<string>(""); // wybrane id w selekcie
    const [relatedPackId, setRelatedPackId] = useState("");

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

    const handleSearch = async () => {
        try {
            const response = await axios.get(`${API_URL}/product/search`, {
                params: { searchName },
                headers: {
                    Authorization: `Bearer ${props.accessTokenAllegro}`,
                },
            });
            setSearchResult(response.data);
            setShowSearchresult(true)
        } catch (error) {
            console.error('Błąd wyszukiwania produktu:', error);
        }
    };

    const handleGetResponsiblePrducers = async () => {
        if (!props.accessTokenAllegro) {
            console.warn("Brak accessTokenAllegro – nie wywołuję endpointu");
            return;
        }
        try {
            const response = await axios.get(`${API_URL}/product/responsibleProducers`, {
                headers: { Authorization: `Bearer ${props.accessTokenAllegro}` }, // może być też 'authorization'
            });
            setResponsibleData(response.data);
            // jeżeli chcesz podgląd aktualnych danych, loguj 'response.data', nie state
        } catch (error) {
            console.error("Błąd pobierania responsibleProducers:", error);
        }
    };

    const coerceToString = (value: unknown): string => {
        if (value == null) return "";
        if (Array.isArray(value)) {
            return value.map((item) => String(item)).join(", ");
        }
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

    const resolveSelectValue = (attr: Attribute, value: unknown): string => {
        if (value == null) return "";
        if (Array.isArray(value)) {
            if (value.length === 0) return "";
            return resolveSelectValue(attr, value[0]);
        }
        if (typeof value === "object") {
            const candidate = value as { value?: unknown; option_id?: unknown; optionId?: unknown };
            if (candidate.value != null) return String(candidate.value);
            const optionId = candidate.option_id ?? candidate.optionId;
            if (optionId != null) {
                const option = attr.options?.find((opt) => String(opt.option_id) === String(optionId));
                if (option?.value != null) return String(option.value);
            }
        }
        const asString = String(value);
        const normalize = (input: string) =>
            input
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/,/g, ".")
                .replace(/[^a-z0-9.]/g, "");
        const toNumber = (input: string) => {
            const normalized = normalize(input);
            const numeric = normalized.replace(/[^0-9.]/g, "");
            if (!numeric) return null;
            const parsed = Number(numeric);
            return Number.isFinite(parsed) ? parsed : null;
        };

        const optionById = attr.options?.find((opt) => String(opt.option_id) === asString);
        if (optionById?.value != null) return String(optionById.value);
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

        const optionByContains = attr.options?.find((opt) => {
            const optValue = normalize(String(opt.value ?? ""));
            return optValue.includes(normalizedValue) || normalizedValue.includes(optValue);
        });
        if (optionByContains?.value != null) return String(optionByContains.value);

        return asString;
    };

    const applyAttributeEntriesToForm = (
        entries: Array<[number, unknown]>,
        attributeMap: Map<number, Attribute>
    ) => {
        entries.forEach(([id, value]) => {
            if (id === 291) {
                setValue("condition", coerceToString(value), { shouldValidate: true, shouldDirty: true });
            }
            const attr = attributeMap.get(id);
            if (!attr) {
                const normalized =
                    typeof value === "string" ? value.trim().toLowerCase() : "";
                const looksBoolean =
                    typeof value === "boolean" ||
                    typeof value === "number" ||
                    ["0", "1", "true", "false", "tak", "nie", "yes", "no", "on", "off"].includes(normalized);
                setValue(
                    `attribute_${id}`,
                    looksBoolean ? coerceToBoolean(value) : coerceToString(value),
                    { shouldValidate: true, shouldDirty: true }
                );
                return;
            }
            if (normalizeAttributeName(attr.name ?? "") === "stan") {
                setValue("condition", coerceToString(value), { shouldValidate: true, shouldDirty: true });
            }
            if (attr.type === "1") {
                setValue(`attribute_${id}`, coerceToBoolean(value), { shouldValidate: true, shouldDirty: true });
                return;
            }
            if (attr.type === "2") {
                setValue(`attribute_${id}`, resolveSelectValue(attr, value), { shouldValidate: true, shouldDirty: true });
                return;
            }
            setValue(`attribute_${id}`, coerceToString(value), { shouldValidate: true, shouldDirty: true });
        });
    };

    useEffect(() => {
        if (!pendingShoperAttributes || attributeList.length === 0) return;
        const attributeMap = new Map(attributeList.map((attr) => [attr.attribute_id, attr]));
        applyAttributeEntriesToForm(pendingShoperAttributes, attributeMap);
        setPendingShoperAttributes(null);
    }, [attributeList, pendingShoperAttributes]);

    const normalizeAttributeName = (value: string) =>
        value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "")
            .replace(/[^a-z0-9]/g, "");

    const getAttributeIdByNames = (names: string[]) => {
        const targets = new Set(names.map((name) => normalizeAttributeName(name)));
        const match = attributeList.find((attr) =>
            targets.has(normalizeAttributeName(attr.name ?? ""))
        );
        return match?.attribute_id ?? null;
    };

    const fetchAttributesByGroup = async (groupId: string): Promise<Attribute[]> => {
        let allAttributes: Attribute[] = [];
        let currentPage = 1;
        let totalPages = 1;

        try {
            while (currentPage <= totalPages) {
                const response = await axios.get<{
                    list: Attribute[];
                    pages: number;
                }>(`${API_URL}/attribute-groups`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${props.authToken}`,
                    },
                    params: {
                        limit: 50,
                        page: currentPage,
                        filters: JSON.stringify({
                            attribute_group_id: groupId,
                        }),
                    },
                });

                allAttributes = allAttributes.concat(response.data.list);
                totalPages = response.data.pages;
                currentPage++;
            }
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

            if (cs.name) setNameCZ(cs.name);
            if (cs.description) setValue("descriptionCZ", cs.description, { shouldValidate: true, shouldDirty: true });
            if (sk.name) setNameSK(sk.name);
            if (sk.description) setValue("descriptionSK", sk.description, { shouldValidate: true, shouldDirty: true });

            if (product?.code) setValue("SKU", String(product.code), { shouldValidate: true, shouldDirty: true });
            if (product?.producer_id) setValue("producer", Number(product.producer_id), { shouldValidate: true, shouldDirty: true });
            if (product?.stock?.price != null) setValue("price", Number(product.stock.price), { shouldValidate: true, shouldDirty: true });
            if (product?.stock?.stock != null) setValue("stock", Number(product.stock.stock), { shouldValidate: true, shouldDirty: true });

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
                    attributeGroupId: "47",
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
            const extraGroupIds = groupIds.filter((id) => id && id !== 47);
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


    const handleAddAllegroOffer = async () => {
        const localGaugeId = getGaugeIdForCaseType(shoper_caseType);
        const token = props.accessTokenAllegro
        const currentName = String(getValues("name") ?? name ?? "").trim();
        const allegroSystem = String(formData["System operacyjny"] ?? "");
        const shoperSystemValue = String(shoper_system ?? "").trim();
        const normalizedShoperSystem = shoperSystemValue.toLowerCase();
        const resolvedSystem =
            normalizedShoperSystem.includes("home assistant")
                ? shoperSystemValue
                : allegroSystem || shoperSystemValue;
        const normalizedResolvedSystem = resolvedSystem.trim().toLowerCase();
        const hasResolvedSystem =
            normalizedResolvedSystem !== "" &&
            !normalizedResolvedSystem.includes("brak systemu") &&
            normalizedResolvedSystem !== "brak";
        const isResolvedWindows11 = resolvedSystem.includes("Windows 11");
        const isResolvedWindows10 = resolvedSystem.includes("Windows 10");
        const isResolvedMacOS = /mac\s?os/i.test(resolvedSystem);
        const isResolvedHomeAssistant = normalizedResolvedSystem.includes("home assistant");
        const isResolvedLinuxLike =
            normalizedResolvedSystem.includes("linux") ||
            normalizedResolvedSystem.includes("ubuntu") ||
            normalizedResolvedSystem.includes("chrome os") ||
            normalizedResolvedSystem.includes("chromeos");
        const allegroSystemImageUrl = !hasResolvedSystem || isResolvedHomeAssistant || isResolvedLinuxLike
            ? null
            : isResolvedMacOS
                ? "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/macOS.jpg"
                : isResolvedWindows10
                    ? "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/win10.jpeg"
                    : isResolvedWindows11
                        ? "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/windows-11-pro.png"
                        : null;
        const allegroSystemDescription = !hasResolvedSystem
            ? ""
            : isResolvedWindows11
                ? `<h2>${resolvedSystem}</h2>
                                <p>Windows 11 to najnowszy system operacyjny firmy Microsoft, wprowadzony w październiku 2021 roku, charakteryzujący się nowym interfejsem użytkownika, który obejmuje centralnie umieszczony pasek zadań oraz zaokrąglone rogi okien. System oferuje ulepszone funkcje wielozadaniowości, integrację z Microsoft Teams, wsparcie dla aplikacji Android oraz zoptymalizowaną wydajność i bezpieczeństwo.</p>
                                <p>System ✅ <b>aktywowany,</b> ✅ <b>w pełni legalny,</b> ✅ <b>zainstalowany i gotowy do pracy</b> po podłączeniu!</p>`
                : isResolvedMacOS
                    ? `<h2>${resolvedSystem}</h2>
                                <p>macOS to system operacyjny firmy Apple ceniony za szybkość działania, stabilność oraz intuicyjny interfejs. Oferuje bardzo dobrą optymalizację pracy ze sprzętem, wygodną obsługę na co dzień oraz integrację z usługami Apple, takimi jak iCloud, AirDrop czy Handoff.</p>
                                <p>System zapewnia wysoki poziom bezpieczeństwa, regularne aktualizacje i komfortową pracę zarówno w zastosowaniach domowych, jak i profesjonalnych.</p>
                                <p>System ✅ <b>zainstalowany i gotowy do pracy</b> po podłączeniu!</p>`
                    : isResolvedHomeAssistant
                        ? `<h2>Home Assistant</h2>
                                <p><b>Home Assistant</b> to zaawansowana platforma open-source, która pozwala na integrację i sterowanie urządzeniami smart home w jednym miejscu - bez potrzeby korzystania z wielu aplikacji producentów.</p>
                                <p>✅ <b>Najważniejsze funkcje:</b></p>
                                <ul>
                                <li>Sterowanie oświetleniem, ogrzewaniem, roletami i urządzeniami</li>
                                <li>Integracja z setkami urządzeń i systemów (Wi-Fi, Zigbee, Z-Wave, MQTT)</li>
                                <li>Automatyzacje (np. włącz światło po wykryciu ruchu)</li>
                                <li>Obsługa z poziomu telefonu, tabletu lub przeglądarki</li>
                                <li>Możliwość działania lokalnie (bez chmury)</li>
                                <li>Powiadomienia (np. alerty, statusy urządzeń)</li>
                                <li>Wsparcie dla asystentów głosowych (Google Assistant, Alexa)</li>
                                </ul>
                                <p>System ✅ <b>zainstalowany i gotowy do dalszej konfiguracji</b> po podłączeniu!</p>`
                        : isResolvedWindows10
                            ? `<h2>${resolvedSystem}</h2>
                                <p>Windows 10 to system operacyjny firmy Microsoft, wydany w lipcu 2015 roku, który łączy w sobie najlepsze cechy wcześniejszych wersji Windows 7 i Windows 8. Oferuje znajomy interfejs z menu Start, wsparcie dla aplikacji uniwersalnych, asystenta głosowego Cortana. ❗UWAGA❗ Po 14 października 2025 r. firma Microsoft nie będzie już zapewniać standardowego wsparcia dla systemu Windows 10. Twój komputer będzie nadal działał, a Ty możesz kwalifikować się do subskrypcji rozszerzonych aktualizacji zabezpieczeń (ESU) firmy Microsoft. ESU zapewnia ograniczone krytyczne aktualizacje, patrz https://www.microsoft.com/windows/end-of-support.</p>
                                <p>System ✅ <b>aktywowany, ✅ w pełni legalny, ✅ zainstalowany i gotowy do pracy</b> po podłączeniu!</p>`
                            : isResolvedLinuxLike
                                ? `<h2>${resolvedSystem}</h2>
                                <p>${resolvedSystem} to stabilny system operacyjny oparty na rozwiązaniach open-source, ceniony za bezpieczeństwo, elastyczność i niskie wymagania sprzętowe. Dobrze sprawdza się w pracy biurowej, edukacji, zastosowaniach technicznych oraz jako baza pod systemy specjalistyczne.</p>
                                <p>System ✅ <b>zainstalowany i gotowy do dalszej konfiguracji</b> po podłączeniu!</p>`
                                : `<h2>${resolvedSystem}</h2>
                                <p>Na urządzeniu zainstalowano system <b>${resolvedSystem}</b>. Komputer został przygotowany do uruchomienia po podłączeniu i jest gotowy do dalszej konfiguracji zgodnie z potrzebami użytkownika.</p>`;
        const homeAssistantBenefitsSection = !isResolvedHomeAssistant
            ? null
            : {
                items: [
                    {
                        type: "IMAGE",
                        url: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/homeAsistant_logo.jpeg",
                    },
                    {
                        type: "TEXT",
                        content: `<h1>💡 Dlaczego warto?</h1>
                                <ul>
                                <li>Pełna kontrola nad inteligentnym domem</li>
                                <li>Brak opłat abonamentowych</li>
                                <li>Duża społeczność i ciągły rozwój</li>
                                <li>Elastyczność i możliwość rozbudowy</li>
                                </ul>
                                <h1>📱 Zastosowanie:</h1>
                                <ul>
                                <li>Smart home w domu i mieszkaniu</li>
                                <li>Monitoring i automatyzacja</li>
                                <li>Oszczędność energii</li>
                                <li>Wygoda i bezpieczeństwo</li>
                                </ul>`,
                    },
                ],
            };
        const productData = {

            "productSet":
                [{

                    "product":
                    {
                        id: connectProductAllegro
                            ? selectedProductId
                            : "",
                        "name": currentName,
                        "category": { "id": "486" },
                        "idType": "GTIN",         // typ wartości w polu "product.id". 
                        // Dla GTIN wskaż "GTIN",dla numerów 
                        // katalogowych nadanych przez producenta - "MPN".
                        // Jeśli wskazujesz UUID produktu, pozostaw pole puste.


                        "parameters": buildOfferParameters(formData, true, pcNewParameteres),

                        "images": imageLinks,
                    },
                    "responsibleProducer": {
                        "type": "ID",                               // typ identyfikatora
                        "id": responsibleProducerId
                    },
                    "safetyInformation": {
                        "type": "TEXT",
                        "description": `Lista ostrzeżeń dotyczących bezpieczeństwa komputerów stacjonarnych oparta o wymagania Rozporządzenia (UE) 2023/988 w sprawie ogólnego bezpieczeństwa produktów (GPSR)

                    *   Ryzyko porażenia prądem:

                        *   Upewnij się, że komputer jest podłączony do sprawnego gniazdka z uziemieniem.
                        *   Nie dotykaj wtyczki ani kabla mokrymi rękami.
                        *   Unikaj używania komputera w miejscach o dużej wilgotności.
                    *   Ryzyko przegrzania:

                        *   Zapewnij odpowiednią wentylację, zachowując co najmniej 5 cm wolnej przestrzeni wokół komputera.
                        *   Nie blokuj otworów wentylacyjnych.
                    *   Ryzyko pożaru:

                        *   Używaj wyłącznie oryginalnych ładowarek i akcesoriów zalecanych przez producenta.
                        *   Nie pozostawiaj komputera włączonego bez nadzoru w pobliżu materiałów łatwopalnych.
                    *   Ryzyko uszkodzeń ciała:

                        *   Używaj komputera na stabilnej powierzchni, aby zminimalizować ryzyko upadku.
                    *   Zagrożenia w wilgotnym środowisku:

                        *   Nie używaj komputera na zewnątrz podczas deszczu ani w miejscach o dużej wilgotności.
                        *   W przypadku zalania komputera natychmiast odłącz go od źródła zasilania i skontaktuj się z serwisem.
                    *   Zagrożenia w wysokich temperaturach:

                        *   Nie eksponuj komputera na bezpośrednie działanie promieni słonecznych.
                        *   Unikaj korzystania z komputera w temperaturach przekraczających zalecany zakres (zwykle 5-35°C).
                    *   Ryzyko uszkodzenia podczas czyszczenia:

                        *   Przed czyszczeniem odłącz komputer od zasilania i użyj miękkiej, lekko wilgotnej ściereczki.
                        *   Unikaj stosowania silnych detergentów mogących uszkodzić powierzchnię komputera.
                    *   Ostrożność podczas wymiany akcesoriów:

                        *   Korzystaj wyłącznie z akcesoriów zalecanych przez producenta.
                        *   W przypadku wymiany baterii, przestrzegaj zaleceń producenta i nie wystawiaj baterii na działanie wysokich temperatur.
                    *   Zagrożenia związane z użytkowaniem baterii:

                        *   Unikaj uszkodzenia baterii przez uderzenia lub jej przebicie.
                        *   Jeśli bateria się przegrzewa lub puchnie, natychmiast przerwij użytkowanie komputera.
                    *   Ostrzeżenia dotyczące dzieci:

                        *   Trzymaj kable zasilające poza zasięgiem dzieci.
                        *   Upewnij się, że dzieci nie bawią się komputerem ani akcesoriami, które mogą być niebezpieczne.`
                    },
                }],
            "sellingMode": {
                "price": {
                    "amount": Price,            // cena
                    "currency": "PLN"
                }
            },
            "stock": {
                "available": Stock                  // liczba sztuk
            },
            "publication": {
                "status": "INACTIVE",
            },

            "parameters": [
                {
                    "name": "Stan",
                    "values": [
                        formData['Stan']
                    ]
                }
            ],

            "external": {
                "id": SKU
            },

            "delivery": {
                "shippingRates": {
                    name: localGaugeId == 5
                        ? "KOMPY 2018, DESKTOP DO PACZKOMATU"
                        : "KOMPY 2018",
                },
            },


            "afterSalesServices": {
                "impliedWarranty": {
                    "name": "Standardowe"
                },
                "returnPolicy": {
                    "name": "15 dni Czechówka"
                }
            },
            "description": {

                "sections": [{
                    "items": [{
                        "type": "TEXT",
                        "content": `<h1>${currentName}</h1><p>✔️Stan: <b>${condition}</b></p><p>✔️Typ komputera: <b>Stacjonarny, ${shoper_caseType}</b></p><p>✔️wizualny stan: <b>${shoper_grade}, ${pcVC[shoper_grade]}</b></p>`
                    }]
                }, {
                    "items": [{
                        "type": "IMAGE",
                        "url": "https://a.allegroimg.com/original/118094/73c8c8404eed8b57bf49b24d19da/Dell-Wyse-5070-Thin-Client-J4105-4-16GB-kl-A-WiFi-Zasilacz-BRAK-SYSTEMU-Wysokosc-produktu-18-4-cm"
                    }]
                }, {
                    "items": [{
                        "type": "TEXT",
                        "content": `
                        <h2>⭐ Dlaczego warto wybrać komputer poleasingowy:</h2>
                        <ul>
                        <li>
                        <p><b>Cena</b> ➡️ Stacjonarne komputery poleasingowe są tańsze niż nowe modele, co pozwala zaoszczędzić pieniądze.</p>
                        </li>
                        <li>
                        <p><b>Jakość</b> ➡️ Firmy leasingowe często wybierają sprzęt wysokiej klasy, który jest bardziej trwały i wydajny niż standardowe modele konsumenckie.</p>
                        </li>
                        <li>
                        <p><b>Sprawdzone działanie</b> ➡️ Komputery poleasingowe są przez nas dokładnie testowane i sprawdzane przed ponowną sprzedażą, co gwarantuje ich pełną funkcjonalność.</p>
                        </li>
                        <li>
                        <p><b>Ekologia</b> ➡️ Kupując sprzęt poleasingowy, przyczyniasz się do zmniejszenia ilości elektrośmieci i wspierasz ideę zrównoważonego rozwoju.</p>
                        </li>
                        <li>
                        <p><b>Wyposażenie</b> ➡️ Często poleasingowe komputery są dobrze wyposażone, z dodatkowymi funkcjami i akcesoriami, które mogą nie być dostępne w standardowych modelach konsumenckich.</p>
                        </li>
                        <li>
                        <p><b>Marki Premium</b> ➡️ Możliwość zakupu sprzętu od renomowanych marek w niższej cenie.</p>
                        </li>
                        <li>
                        <p><b>Gotowość do pracy</b> ➡️ Komputery poleasingowe są przez nas skonfigurowane i gotowe do pracy zaraz po zakupie, co oszczędza czas potrzebny na instalację oprogramowania.</p>
                        </li>
                        </ul>`
                    }]
                }, {
                    "items": [{
                        "type": "IMAGE",
                        "url": imageLinks[0]
                    }, {
                        "type": "TEXT",
                        "content": `<h1>⚙️ Parametry techniczne:</h1><ul><li><b>❗${additionalInfo}</b></li></ul> ${apiloSpec} ${formData['Typ obudowy'] == 'All in One' ? apiloSpecAio : ''}<p><b>✅ Stacjonarny komputer poleasingowy w bardzo dobrym stanie</b><b> technicznym, dokładnie przetestowany przed wysyłką i gotowy do pracy</b></p>`
                    }]
                }, {
                    "items": [{
                        "type": "TEXT",
                        "content": `
                        <p>Komputer został ✔️<b>dokładnie</b> przetestowany przed wysyłką.</p>
                        ${hasResolvedSystem
                                ? isResolvedHomeAssistant
                                    ? `<p>Na urządzeniu został przygotowany system <b>Home Assistant</b>, gotowy do uruchomienia i dalszej konfiguracji pod potrzeby inteligentnego domu.</p>
                                       <p>Po rozpakowaniu komputer jest ✔️<b>gotowy do działania</b> jako centrum automatyki domowej.</p>`
                                    : isResolvedLinuxLike
                                        ? `<p>Na urządzeniu zainstalowano system <b>${resolvedSystem}</b>, przygotowany do uruchomienia i dalszej konfiguracji.</p>
                                           <p>Komputer po rozpakowaniu z pudełka jest ✔️<b>gotowy do pracy.</b></p>`
                                        : `<p>Posiada zainstalowany✔️<b>oryginalny</b> system operacyjny ✔️ ${resolvedSystem} <b>64bit w polskiej wersji językowej</b>, wraz z <b>✔️najnowszymi sterownikami </b>oraz dodatkową przeglądarką Internetową.</p> <p>Komputer po rozpakowaniu z pudełka jest ✔️<b>gotowy do pracy.</b></p>`
                                : ""
                            }
                        
                        `
                    }]
                }, {
                    "items": [{
                        "type": "IMAGE",
                        "url": "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/podzespoly.png"
                    }]
                }, {
                    "items": [{
                        "type": "TEXT",
                        "content": ApiloDescription(shoper_cpuName, shoper_cpuModel, shoper_ramSize, shoper_ramType, shoper_diskType, shoper_diskSize, cpuTypesDescriptions[shoper_cpuName as keyof typeof cpuTypesDescriptions],
                            ramTypesDescriptions[shoper_ramType as keyof typeof ramTypesDescriptions],
                            diskTypesDescriptions[shoper_diskType as keyof typeof diskTypesDescriptions], shoper_gpuName, shoper_gpuDescription)

                    }]
                },
                !allegroSystemImageUrl
                    ? null
                    : {
                        items: [
                            {
                                type: "IMAGE",
                                url: allegroSystemImageUrl,
                            },
                        ],
                    },
                !hasResolvedSystem
                    ? null
                    : {
                        "items": [{
                            "type": "TEXT",
                            content: allegroSystemDescription
                        }]
                    },
                homeAssistantBenefitsSection,
                {
                    "items": [{
                        "type": "IMAGE",
                        "url": 'https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/pudlo2.png'
                    }, {
                        "type": "TEXT",
                        "content": `<h2>Zawartość paczki:</h2>
                            <ul>
                            <li><b>Komputer zgodny z powyższą specyfikacją</b></li>
                            <li><b>${included}</b></li>
                            <li><b>Karta gwarancyjna </b></li>
                            </ul>
                            <p>Kupując u nas poleasingowy komputer jesteś pewien że twój sprzęt zostanie bezpiecznie i profesjonalnie zapakowany.</p>
                            <p>Przy każdej wysyłce twojego komputera stacjonarnego dobieramy odpowiednie wypełniacze do konkretnego podzespołu komputerowego, abyś cieszył się nowym zakupem bez żadnych problemów. </p>
                            <p>(Zdjęcie podglądowe)</p>`
                    }]
                }
                ].filter(Boolean)
            }
        };

        try {
            const response = await axios.post(
                `${API_URL}/product/allegroProduct`,
                productData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setResult(response.data);
            toast.success("Dodano produkt do allegro");
            setSelectedProductId(null);
            setSelectedProduct(undefined);
            setLockedParams(new Set());
        } catch (error) {
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
                toast.error("Wystąpił nieznany błąd.");
            }
        }
    }

    const handleSelectAllegroProduct = (product: Product) => {
        handleSelectAllegroProductUtil({
            product,
            setSelectedProductId,
            setSelectedProduct,
            setLockedParams,
            pcNewParameteres,
            setFormData,
            setValue,
        });
    };

    //
    const isParamDisabled = (paramName: string) =>
        connectProductAllegro && lockedParams.has(paramName);

    useEffect(() => {
        handleGetResponsiblePrducers()
    }, [props.accessTokenAllegro]);

    useEffect(() => {

        const fetchInitialData = async () => {
            await handleGetProducers({
                API_URL,
                authToken: props.authToken,
                setProducers,
            });
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
                attributeGroupId: "47",
            });

            const attributeMap = attrs.reduce((acc, attr) => {
                acc[attr.name] = attr;
                return acc;
            }, {} as Record<string, Attribute>);

        };
        fetchInitialData();
    }, []);

    const handleChangeAllegro = (paramName: string, value: any) => {
        setFormData(prev => ({ ...prev, [paramName]: value }));
        const idx = pcNewParameteres.findIndex(p => p.name === paramName);
        if (idx !== -1) {
            setValue(`attribute_${idx}`, value);
        }
    };

    ///////////////Allegro koniec////////////////

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        const sortedFiles = combined.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
            const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
            return numA - numB;
        });
        setSelectedImages(sortedFiles);
        e.currentTarget.value = "";
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

    const buildShoperAttributes = (data: IFormInput) => {
        const attributes: Record<number, string> = {};
        const JOINER = ", ";
        const isStringArray = (v: unknown): v is string[] =>
            Array.isArray(v) && v.every(item => typeof item === "string");

        attributeList.forEach((attribute) => {
            const attributeValue = (data as Record<string, unknown>)[`attribute_${attribute.attribute_id}`];

            if (attributeValue == null) return;

            if (typeof attributeValue === "string") {
                attributes[attribute.attribute_id] = attributeValue;
            } else if (isStringArray(attributeValue)) {
                attributes[attribute.attribute_id] = attributeValue.filter(s => s.trim() !== "").join(JOINER);
            }
        });
        attributes[307] = "24 miesiące";
        attributes[291] = String(data.condition ?? "");
        attributes[1015] = data.caseType
        attributes[1016] = vc_CZ[data.visualCondition]
        attributes[1017] = shoper_ramSize
        attributes[1018] = shoper_ramType
        attributes[1019] = shoper_cpuName
        attributes[1020] = shoper_cpuModel
        attributes[1021] = shoper_diskType
        attributes[1022] = shoper_diskSize
        attributes[1023] = shoper_system
        attributes[1024] = shoper_dvd
        attributes[1025] = data.model
        attributes[1028] = shoper_cpuMaxClockSpeed
        attributes[1029] = shoper_cpuClockSpeed
        attributes[1030] = shoper_cpuThreads
        attributes[1031] = shoper_cpuCores
        attributes[1034] = shoper_depth
        attributes[1035] = shoper_width
        attributes[1036] = shoper_height
        attributes[1037] = ports.toString()
        return attributes;
    };

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        if (shoper_gpuType == 'zintegrowana') {
            shoper_gpuDescription = "Zintegrowana karta graficzna jest wystarczająca do codziennych zadań, takich jak przeglądanie internetu, oglądanie filmów czy podstawowa edycja grafiki, ale może mieć trudności z obsługą wymagających gier i programów. To ekonomiczne rozwiązanie dla użytkowników, którzy nie potrzebują dużej mocy obliczeniowej w grafice.";
            setGpuDescriptionsCZ("Integrovaná grafická karta je dostačující pro každodenní úkoly, jako je prohlížení internetu, sledování filmů nebo základní úpravy obrázků, ale může mít problémy s náročnými hrami a programy. Jde o ekonomické řešení pro uživatele, kteří nepotřebují vysoký grafický výkon.")
            setGpuDescriptionsSK("Integrovaná grafická karta je postačujúca na každodenné úlohy, ako je prehliadanie internetu, sledovanie filmov alebo základná úprava obrázkov, no môže mať problémy s náročnými hrami a programami. Ide o ekonomické riešenie pre používateľov, ktorí nepotrebujú vysoký grafický výkon.")
        }

        //dodaj zdjęcia do apilo
        apiloImageUUIDs = await AddImageApilo(props, selectedImages)

        // Zbieranie atrybutów
        const attributes = buildShoperAttributes(data);

        //dodaj produkt do shoper
        try {

            let response = AddProductShoper(data, attributes, nameCZ, nameSK, gaugeId, props, '249', relatedPackId || undefined)

            //dodaj produkt do apilo
            let apiloResponse: ApiloResponse = await AddProductApilo(data, props, apiloImageUUIDs)

            toast.success("Produkt został pomyślnie dodany.");
            let ApiloAddedProductsFirstKey = Object.keys(apiloResponse.products)[0];

            //dodaj atrybuty do apilo 
            // const apiloAttributes = [
            //     {
            //         "id": 78,
            //         "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
            //         "type": 9,
            //         "values": [
            //             {
            //                 "value":
            //                     `<p>✔️Stan: <b>${data.condition}</b></p>
            //                 <p>✔️Typ komputera: <b>Stacjonarny, ${data.caseType}</b></p>
            //                 <p>✔️wizualny stan: <b>${shoper_grade}, ${pcVC[shoper_grade]}</b></p>`,
            //             }
            //         ]
            //     },
            //     {
            //         "id": 81,
            //         "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
            //         "type": 9,
            //         "values": [
            //             {
            //                 "value": `<ul><li><b>❗${data.additionalInfo}</b></li></ul>` + apiloSpec
            //             }
            //         ]
            //     },
            //     {
            //         "id": 84,
            //         "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
            //         "type": 9,
            //         "values": [
            //             {
            //                 "value": ApiloDescription(data.cpu, data.cpuModel, data.ramAmount, data.ramType, data.diskType, data.diskCapacity, cpuTypesDescriptions[data.cpu as keyof typeof cpuTypesDescriptions],
            //                     ramTypesDescriptions[data.ramType as keyof typeof ramTypesDescriptions],
            //                     diskTypesDescriptions[data.diskType as keyof typeof diskTypesDescriptions], data.gpu, data.gpuDescriptions)
            //             }
            //         ]
            //     },
            //     {
            //         "id": 63,
            //         "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
            //         "type": 9,
            //         "values": [
            //             {
            //                 "value": apiloSystemType[data.system as keyof typeof apiloSystemType]
            //             }
            //         ]
            //     },
            //     {
            //         "id": 87,
            //         "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
            //         "type": 1,
            //         "values": [
            //             {
            //                 "value": `<b>${data.included}</b>`
            //             }
            //         ]
            //     },
            //     {
            //         "id": 90,
            //         "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
            //         "type": 9,
            //         "values": [
            //             {
            //                 "value": apiloSpecAio
            //             }
            //         ]
            //     },
            // ]
            // AddAttributesApilo(props, apiloAttributes)

            apiloImageUUIDs = []

            // Dodaj foty do shopera
            if (selectedImages.length > 0) {
                await AddImageShoper(response, selectedImages, imageLinks, props)
            }

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd HTTP:", error.response?.status, error.response?.data);
                toast.error("Wystąpił błąd podczas dodawania produktu");
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error("Wystąpił błąd podczas dodawania produktu");
            }
        };
    }

    const handleUpdateProduct = async (data: IFormInput) => {
        const offerId = shoperOfferId.trim();
        if (!offerId) {
            toast.error("Podaj ID aukcji z Shopera, aby zaktualizować produkt.");
            return;
        }
        setUpdatingProduct(true);
        try {
            if (shoper_gpuType == 'zintegrowana') {
                shoper_gpuDescription = "Zintegrowana karta graficzna jest wystarczająca do codziennych zadań, takich jak przeglądanie internetu, oglądanie filmów czy podstawowa edycja grafiki, ale może mieć trudności z obsługą wymagających gier i programów. To ekonomiczne rozwiązanie dla użytkowników, którzy nie potrzebują dużej mocy obliczeniowej w grafice.";
                setGpuDescriptionsCZ("Integrovaná grafická karta je dostačující pro každodenní úkoly, jako je prohlížení internetu, sledování filmů nebo základní úpravy obrázků, ale může mít problémy s náročnými hrami a programy. Jde o ekonomické řešení pro uživatele, kteří nepotřebují vysoký grafický výkon.")
                setGpuDescriptionsSK("Integrovaná grafická karta je postačujúca na každodenné úlohy, ako je prehliadanie internetu, sledovanie filmov alebo základná úprava obrázkov, no môže mať problémy s náročnými hrami a programami. Ide o ekonomické riešenie pre používateľov, ktorí nepotrebujú vysoký grafický výkon.")
            }
            const attributes = buildShoperAttributes(data);

            const safetyProducerId = Number((data as any).productSafetyProducerId ?? 0) || 0;
            const safetyCertificateIds = Array.isArray((data as any).productSafetyCertificateIds)
                ? (data as any).productSafetyCertificateIds
                    .map((id: unknown) => Number(id))
                    .filter((id: number) => Number.isFinite(id))
                : [];
            const safetyWarnings = Array.isArray((data as any).productSafetyWarnings)
                ? (data as any).productSafetyWarnings
                    .map((item: unknown) => String(item ?? "").trim())
                    .filter(Boolean)
                : [];
            const safetyInfo = safetyWarnings.length ? safetyWarnings.join("\n") : "";

            await UpdateProductShoper({
                productId: Number(offerId),
                basePayload: {
                    producer_id: data.producer,
                    category_id: "249",
                    code: data.SKU,
                    pkwiu: "-",
                    stock: {
                        price: data.price,
                        active: 1,
                        stock: data.stock,
                        gfx_id: 103221,
                        delivery_id: 1
                    },
                    attributes: attributes,
                    gauge_id: gaugeId,
                    ...(safetyProducerId ? { product_safety_producer_id: safetyProducerId } : {}),
                    ...(safetyCertificateIds.length ? { product_safety_certificate_ids: safetyCertificateIds } : {}),
                    ...(safetyInfo ? { product_safety_information: safetyInfo } : {}),
                    ...(relatedPackId ? { related_pack_id: relatedPackId } : {}),
                },
                translations: {
                    pl_PL: {
                        name: data.name,
                        description: data.description,
                        active: data.active,
                    },
                    cs_CZ: {
                        name: nameCZ,
                        description: data.descriptionCZ,
                        active: data.active,
                    },
                    sk_SK: {
                        name: nameSK,
                        description: data.descriptionSK,
                        active: data.active,
                    },
                },
                props,
                baseSuccessMessage: "Zaktualizowano dane podstawowe produktu.",
            });

            if (selectedImages.length > 0) {
                await AddImageShoper(Number(offerId), selectedImages, imageLinks, props);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd HTTP:", error.response?.status, error.response?.data);
                toast.error("Wystąpił błąd podczas aktualizacji produktu");
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error("Wystąpił błąd podczas aktualizacji produktu");
            }
        } finally {
            setUpdatingProduct(false);
        }
    };
    let name = watch("name", "");
    // let visualCondition = watch("visualCondition", "");
    let visualConditionSK = ""
    let visualConditionCZ = ""
    let condition = watch("condition", "");
    let producerId = watch("producer", 0);
    let connectProductAllegro = watch("connectProductAllegro", true);

    const additionalInfoAttributeId = getAttributeIdByNames([
        "uwagi",
        "uwagi dodatkowe",
        "dodatkowe uwagi",
        "komentarz",
        "komentarze",
    ]);
    const includedAttributeId = getAttributeIdByNames([
        "w zestawie",
        "wzestawie",
        "załączone wyposażenie",
        "zalaczone wyposazenie",
        "wyposażenie",
        "wyposazenie",
        "zawartość zestawu",
        "zawartosc zestawu",
    ]);
    let additionalInfo = additionalInfoAttributeId
        ? watch(`attribute_${additionalInfoAttributeId}`, "")
        : "";
    let included = includedAttributeId
        ? watch(`attribute_${includedAttributeId}`, "")
        : "";

    let shoper_resolution = watch(`attribute_${1252}`);
    let shoper_matrixType = watch(`attribute_${1247}`);
    let shoper_matrixSize = watch(`attribute_${1253}`);
    let shoper_Frequency = watch(`attribute_${1251}`);
    let shoper_touchScreen = watch(`attribute_${1250}`);
    let shoper_microphone = watch(`attribute_${1249}`);
    let shoper_camera = watch(`attribute_${1248}`);
    let descriptionLanguage = watch("descriptionLanguage", "description")
    let Price = watch("price", 0);
    let Stock = watch("stock", 0);
    let SKU = watch("SKU", '');

    let shoper_height = watch(`attribute_${757}`);
    let shoper_width = watch(`attribute_${758}`);
    let shoper_depth = watch(`attribute_${759}`);
    let shoper_color = watch(`attribute_${761}`);

    let shoper_cpuName = watch(`attribute_${762}`);
    let shoper_cpuModel = watch(`attribute_${771}`);
    let shoper_cpuClockSpeed = watch(`attribute_${764}`);
    let shoper_cpuMaxClockSpeed = watch(`attribute_${765}`);
    let shoper_cpuCores = watch(`attribute_${769}`);
    let shoper_cpuThreads = watch(`attribute_${770}`);

    let shoper_ramType = watch(`attribute_${763}`);
    let shoper_ramSize = watch(`attribute_${766}`);
    let shoper_monitor = watch(`attribute_${767}`);
    let shoper_system = watch(`attribute_${768}`);

    let shoper_gpuDescription = watch(`attribute_${1246}`);
    let shoper_gpuName = watch(`attribute_${1245}`);
    let shoper_gpuType = watch(`attribute_${1244}`);

    let shoper_diskType = watch(`attribute_${773}`);
    let shoper_diskSize = watch(`attribute_${774}`);

    let shoper_dvd = watch(`attribute_${775}`);
    let shoper_CasePorts = watch(`attribute_${869}`);
    let shoper_MainBoardPorts = watch(`attribute_${1258}`);
    let shoper_GpuPorts = watch(`attribute_${1255}`);
    let shoper_grade = watch(`attribute_${894}`);
    let shoper_caseType = watch(`attribute_${913}`);
    let shoper_wifi = watch(`attribute_${1254}`, false);

    let apiloSpec = PcApiloSpecyfication(
        shoper_caseType,
        shoper_cpuCores,
        shoper_cpuName,
        shoper_cpuModel,
        shoper_cpuClockSpeed,
        shoper_cpuMaxClockSpeed,
        shoper_gpuName,
        shoper_diskType,
        shoper_diskSize,
        included,
        shoper_system,
        shoper_ramSize,
        shoper_ramType,
        shoper_dvd,
        ports.join(", "),
        caseDescription,
    )
    let apiloSpecAio = PcApiloAioSpecyfication(
        shoper_resolution,
        shoper_matrixType,
        shoper_matrixSize,
        shoper_Frequency,
        shoper_touchScreen,
        shoper_microphone,
        shoper_camera,
    )

    useEffect(() => {
        let cancelled = false;
        const value = String(additionalInfo ?? "").trim();
        if (!value) {
            setAdditionalInfoCZ("");
            setAdditionalInfoSK("");
            return;
        }
        Promise.all([handleTranslateCZ(value), handleTranslateSK(value)])
            .then(([cz, sk]) => {
                if (cancelled) return;
                setAdditionalInfoCZ(cz);
                setAdditionalInfoSK(sk);
            })
            .catch((error) => {
                console.error("Błąd podczas tłumaczenia uwag:", error);
            });
        return () => {
            cancelled = true;
        };
    }, [additionalInfo]);

    useEffect(() => {
        let cancelled = false;
        const value = String(included ?? "").trim();
        if (!value) {
            setIncludeCZ("");
            setIncludeSK("");
            return;
        }
        Promise.all([handleTranslateCZ(value), handleTranslateSK(value)])
            .then(([cz, sk]) => {
                if (cancelled) return;
                setIncludeCZ(cz);
                setIncludeSK(sk);
            })
            .catch((error) => {
                console.error("Błąd podczas tłumaczenia zawartości zestawu:", error);
            });
        return () => {
            cancelled = true;
        };
    }, [included]);

    let descriptionCZ = watch("descriptionCZ", pcTemplateCZ(
        nameCZ,
        visualConditionCZ,
        shoper_cpuName,
        shoper_cpuModel,
        conditionCZ[condition],
        shoper_caseType,
        shoper_gpuName, shoper_diskType,
        shoper_diskSize,
        shoper_system, shoper_ramType,
        shoper_ramSize,
        additionalTranslationsCZ[shoper_dvd],
        ports,
        additionalInfoCZ,
        cpuTypesDescriptionsCZ["Intel Core i3"],
        diskTypesDescriptionsCZ.HDD,
        ramTypesDescriptionsCZ.DDR2,
        systemTypeCZ[shoper_system as keyof typeof systemType],
        IncludeCZ,
        imageSrc,
        desktopStatusCZ[condition as keyof typeof desktopStatus],
        gpuDescriptionsCZ,
        shoper_resolution,
        shoper_matrixType,
        shoper_matrixSize,
        shoper_Frequency,
        additionalTranslationsCZ[shoper_touchScreen],
        additionalTranslationsCZ[shoper_microphone],
        additionalTranslationsCZ[shoper_camera],
        shoper_wifi
    ));
    let descriptionSK = watch("descriptionSK", pcTemplateSK(
        nameSK,
        visualConditionSK,
        shoper_cpuName,
        shoper_cpuModel,
        conditionSK[condition],
        shoper_caseType,
        shoper_gpuName, shoper_diskType,
        shoper_diskSize,
        shoper_system, shoper_ramType,
        shoper_ramSize,
        additionalTranslationsSK[shoper_dvd],
        shoper_CasePorts,
        additionalInfoSK,
        cpuTypesDescriptionsSK["Intel Core i3"],
        diskTypesDescriptionsSK.HDD,
        ramTypesDescriptionsSK.DDR2,
        systemTypeSK[shoper_system as keyof typeof systemType],
        IncludeSK,
        imageSrc,
        desktopStatusSK[condition as keyof typeof desktopStatus],
        gpuDescriptionsSK,
        shoper_resolution,
        shoper_matrixType,
        shoper_matrixSize,
        shoper_Frequency,
        additionalTranslationsSK[shoper_touchScreen],
        additionalTranslationsSK[shoper_microphone],
        additionalTranslationsSK[shoper_camera],
    ));
    let description = watch("description", pcTemplateNew(
        name,
        shoper_grade,
        pcVC[shoper_grade],
        shoper_cpuName,
        shoper_cpuModel,
        condition,
        shoper_caseType,
        shoper_gpuName, shoper_diskType,
        shoper_diskSize,
        shoper_system, shoper_ramType,
        shoper_ramSize,
        shoper_dvd,
        ports,
        additionalInfo,
        cpuTypesDescriptions["Intel Core i3"],
        diskTypesDescriptions.HDD,
        ramTypesDescriptions.DDR2,
        systemType[shoper_system as keyof typeof systemType] ?? "",
        included,
        imageSrc,
        desktopStatus[condition as keyof typeof desktopStatus],
        shoper_gpuDescription,
        shoper_resolution,
        shoper_matrixType,
        shoper_matrixSize,
        shoper_Frequency,
        additionalTranslationsPL[shoper_touchScreen],
        additionalTranslationsPL[shoper_microphone],
        additionalTranslationsPL[shoper_camera],
        shoper_wifi

    ));

    const handleImportAllegroFormToShoper = () => {
        // setValue("attribute_869", formData["złącza"]);
        setValue("attribute_757", formData["Wysokość produktu"]);
        setValue("attribute_758", formData["Szerokość produktu"]);
        setValue("attribute_759", formData["Głębokość produktu"]);
        setValue("attribute_761", formData["Kolor"]);
        setValue("attribute_769", formData["Liczba rdzeni procesora"]);
        setValue("attribute_770", formData["Liczba wątków procesora"]);
        setValue("attribute_764", formData["Taktowanie bazowe procesora"]);
        setValue("attribute_765", formData["Taktowanie maksymalne procesora"]);
        setValue("attribute_776", formData["Model"]);
        setValue("attribute_775", formData["Typ napędu"]);
        setValue("attribute_768", formData["System operacyjny"]);
        setValue("attribute_774", formData["Pojemność dysku"]);
        setValue("attribute_773", formData["Typ dysku twardego"]);
        setValue("attribute_771", formData["Model procesora"]);
        setValue("attribute_762", formData["Seria"]);
        setValue("attribute_763", formData["Typ pamięci RAM"]);
        setValue("attribute_766", formData["Wielkość pamięci RAM"]);
        setValue("attribute_1245", formData["Chipset karty graficznej"]);
        setValue("attribute_1244", formData["Rodzaj karty graficznej"]);
        setValue("attribute_913", formData["Typ obudowy"]);
        setValue("attribute_1255", formData["Złącza karty graficznej"]);
        setValue("attribute_1256", formData["Moc zasilacza"]);
        setValue("attribute_1257", formData["Komunikacja"]);
        // setValue("included", formData["Załączone wyposażenie"].toString());

        setValue("attribute_1258", formData["Złącza zewnętrzne płyty głównej"]);
        setValue("attribute_869", formData["Złącza obudowy"]);
    }
    const toStringArray = (v: unknown): string[] => {
        if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
        if (typeof v === "string") {
            // spróbuj sparsować JSON-ową tablicę
            try {
                const parsed = JSON.parse(v);
                if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
            } catch { }
            // podziel po przecinkach, ale nie tych w liczbach (np. 3,5)
            return v.split(/,(?!\d)/).map(s => s.trim()).filter(Boolean);
        }
        return [];
    };

    useEffect(() => {
        const merged = [
            ...toStringArray(shoper_CasePorts),
            ...toStringArray(shoper_MainBoardPorts),
            ...toStringArray(shoper_GpuPorts),
        ];

        // deduplikacja z zachowaniem kolejności
        setPorts(Array.from(new Set(merged)));
    }, [shoper_CasePorts, shoper_MainBoardPorts, shoper_GpuPorts]);


    useEffect(() => {

        const nextGaugeId = getGaugeIdForCaseType(shoper_caseType);
        setGaugeId(nextGaugeId);
        caseDescription = getCaseDescriptionForType(shoper_caseType);
        if (shoper_gpuType == 'zintegrowana') {
            shoper_gpuDescription = "Zintegrowana karta graficzna jest wystarczająca do codziennych zadań, takich jak przeglądanie internetu, oglądanie filmów czy podstawowa edycja grafiki, ale może mieć trudności z obsługą wymagających gier i programów. To ekonomiczne rozwiązanie dla użytkowników, którzy nie potrzebują dużej mocy obliczeniowej w grafice.";
            setGpuDescriptionsCZ("Integrovaná grafická karta je dostačující pro každodenní úkoly, jako je prohlížení internetu, sledování filmů nebo základní úpravy obrázků, ale může mít problémy s náročnými hrami a programy. Jde o ekonomické řešení pro uživatele, kteří nepotřebují vysoký grafický výkon.")
            setGpuDescriptionsSK("Integrovaná grafická karta je postačujúca na každodenné úlohy, ako je prehliadanie internetu, sledovanie filmov alebo základná úprava obrázkov, no môže mať problémy s náročnými hrami a programami. Ide o ekonomické riešenie pre používateľov, ktorí nepotrebujú vysoký grafický výkon.")
        }
        visualConditionSK = pcCaseVC_SK[shoper_grade]
        visualConditionCZ = pcCaseVC_CZ[shoper_grade]

        setValue("description", pcTemplateNew(
            name,
            shoper_grade,
            pcVC[shoper_grade],
            shoper_cpuName,
            shoper_cpuModel,
            condition,
            shoper_caseType,
            shoper_gpuName,
            shoper_diskType,
            shoper_diskSize,
            shoper_system,
            shoper_ramType,
            shoper_ramSize,
            shoper_dvd,
            ports,
            additionalInfo,
            cpuTypesDescriptions[shoper_cpuName as keyof typeof cpuTypesDescriptions],
            ramTypesDescriptions[shoper_ramType as keyof typeof ramTypesDescriptions],
            diskTypesDescriptions[shoper_diskType as keyof typeof diskTypesDescriptions],
            systemType[shoper_system as keyof typeof systemType] ?? "",
            included,
            imageSrc,
            desktopStatus[condition as keyof typeof desktopStatus],
            shoper_gpuDescription,
            shoper_resolution,
            shoper_matrixType,
            shoper_matrixSize,
            shoper_Frequency,
            additionalTranslationsPL[shoper_touchScreen],
            additionalTranslationsPL[shoper_microphone],
            additionalTranslationsPL[shoper_camera],
            shoper_wifi
        ));
        setValue("descriptionSK", pcTemplateSK(
            nameSK,
            visualConditionSK,
            shoper_cpuName,
            shoper_cpuModel,
            conditionSK[condition],
            shoper_caseType,
            shoper_gpuName,
            shoper_diskType,
            shoper_diskSize,
            shoper_system,
            shoper_ramType,
            shoper_ramSize,
            additionalTranslationsSK[shoper_dvd],
            shoper_CasePorts,
            additionalInfoSK,
            cpuTypesDescriptionsSK[shoper_cpuName as keyof typeof cpuTypesDescriptions],
            ramTypesDescriptionsSK[shoper_ramType as keyof typeof ramTypesDescriptions],
            diskTypesDescriptionsSK[shoper_diskType as keyof typeof diskTypesDescriptions],
            systemTypeSK[shoper_system as keyof typeof systemTypeSK] ?? "",
            IncludeSK,
            imageSrc,
            desktopStatusSK[condition as keyof typeof desktopStatus],
            gpuDescriptionsSK,
            shoper_resolution,
            shoper_matrixType,
            shoper_matrixSize,
            shoper_Frequency,
            additionalTranslationsSK[shoper_touchScreen],
            additionalTranslationsSK[shoper_microphone],
            additionalTranslationsSK[shoper_camera],
        ));
        setValue("descriptionCZ", pcTemplateCZ(
            nameCZ,
            visualConditionCZ,
            shoper_cpuName,
            shoper_cpuModel,
            conditionCZ[condition],
            shoper_caseType,
            shoper_gpuName,
            shoper_diskType,
            shoper_diskSize,
            shoper_system,
            shoper_ramType,
            shoper_ramSize,
            additionalTranslationsCZ[shoper_dvd],
            ports,
            additionalInfoCZ,
            cpuTypesDescriptionsCZ[shoper_cpuName as keyof typeof cpuTypesDescriptions],
            ramTypesDescriptionsCZ[shoper_ramType as keyof typeof ramTypesDescriptions],
            diskTypesDescriptionsCZ[shoper_diskType as keyof typeof diskTypesDescriptions],
            systemTypeCZ[shoper_system as keyof typeof systemTypeCZ] ?? "",
            IncludeCZ,
            imageSrc,
            desktopStatusCZ[condition as keyof typeof desktopStatus],
            gpuDescriptionsCZ,
            shoper_resolution,
            shoper_matrixType,
            shoper_matrixSize,
            shoper_Frequency,
            additionalTranslationsCZ[shoper_touchScreen],
            additionalTranslationsCZ[shoper_microphone],
            additionalTranslationsCZ[shoper_camera],
            shoper_wifi
        ));
    }, [name, nameCZ, nameSK, shoper_grade, shoper_cpuName, shoper_cpuModel, condition, shoper_caseType, shoper_gpuName, shoper_diskType, shoper_diskSize, shoper_system, shoper_ramType, shoper_ramSize, shoper_dvd, shoper_CasePorts, additionalInfo, additionalInfoCZ, additionalInfoSK, included, IncludeCZ, IncludeSK, imageSrc, shoper_gpuDescription, gpuDescriptionsCZ, gpuDescriptionsSK, shoper_gpuType, shoper_resolution, shoper_matrixType, shoper_matrixSize, shoper_Frequency, shoper_touchScreen, shoper_microphone, shoper_camera, ports, shoper_wifi, shoper_wifi, setValue]);

    return (
        <>
            <div className="addProductMainContainer" style={{}}>
                <Box style={{ display: 'flex', flexDirection: 'column' }}>
                    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column' }}>
                        <RelatedProductsSelect authToken={props.authToken} value={relatedPackId} onChange={setRelatedPackId} />
                        <Box
                            sx={{ py: 2, display: 'grid', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
                        >
                            <ThemeProvider theme={MainTheme}>


                                <FormControl fullWidth >
                                    <InputLabel >język opisu</InputLabel>
                                    <Select
                                        label="język opisu"
                                        {...register("descriptionLanguage")}
                                        defaultValue={"description"}
                                    >
                                        <MenuItem value="description">Polski</MenuItem>
                                        <MenuItem value="descriptionCZ">Czeski</MenuItem>
                                        <MenuItem value="descriptionSK">Słowacki</MenuItem>

                                    </Select>
                                </FormControl>
                                <div style={{
                                    borderRadius: "5px",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                                    padding: '20px',
                                    backgroundColor: 'rgb(55, 61, 77)',
                                }}>
                                    <FormControlLabel control={<Checkbox defaultChecked {...register("connectProductAllegro")} />} label="Połącz z produktem allegro" />
                                    <div style={{ display: "flex", gap: '10px' }}>
                                        <TextField
                                            variant="filled"
                                            size="small"
                                            type="text"
                                            value={searchName}
                                            onChange={(e) => setSearchName(e.target.value)}
                                            placeholder="Wyszukaj produkt allegro"
                                            fullWidth
                                        />
                                        <Button
                                            type="button"
                                            variant="contained"
                                            color="primary"
                                            onClick={handleSearch}
                                        >
                                            Szukaj
                                        </Button>

                                    </div>
                                    <Button sx={{ mt: '20px', fontSize: '15px' }} onClick={() => handleImportAllegroFormToShoper()}>
                                        Importuj dane z allegro
                                    </Button>
                                </div>
                                <div className="ParamatersBox" style={{
                                    backgroundColor: 'rgb(55 77 69)'
                                }}>


                                    <Typography variant="h6" style={{ textAlign: 'center' }}>Dane aukcji</Typography>
                                    <div style={{ display: "flex", gap: "10px" }}>
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
                                    </div>
                                    <FormControlLabel control={<Checkbox defaultChecked {...register("active")} />} label="aktywność" />
                                    <TextField InputLabelProps={{ shrink: true }} required label="tytuł" variant="outlined" type="text" inputProps={{ maxLength: 75 }} {...register("name", {
                                        onBlur: async (e) => {
                                            const value = e.target.value;

                                            try {
                                                setNameCZ(await handleTranslateCZ(value))
                                                setNameSK(await handleTranslateSK(value))
                                                toast.success("przetłumaczono");
                                            } catch (error) {
                                                console.error("Błąd podczas tłumaczenia:", error);
                                                toast.error("błąd w tłumaczeniu");
                                            }
                                        }
                                    })} />
                                    <TextField defaultValue={1} required label="ilość" InputLabelProps={{ shrink: true }} variant="outlined" type="number"{...register("stock")} />
                                    <TextField required label="cena" InputLabelProps={{ shrink: true }} variant="outlined" type="number"{...register("price")} />
                                    <TextField required label="SKU" InputLabelProps={{ shrink: true }} variant="outlined" {...register("SKU")} />

                                    <Controller
                                        name="producer"
                                        control={control}
                                        render={({ field }) => (
                                            <Autocomplete
                                                options={producers}
                                                getOptionLabel={(option) => {
                                                    if (!option || typeof option === "string") return option ?? "";
                                                    return option.name ?? "";
                                                }}
                                                value={producers.find((option) => option?.producer_id === field.value) ?? null}
                                                isOptionEqualToValue={(option, value) =>
                                                    option?.producer_id === value?.producer_id
                                                }
                                                renderOption={(props, option) => (
                                                    <li {...props} key={option?.producer_id}>
                                                        {option?.name ?? ""}
                                                    </li>
                                                )}
                                                renderInput={(params) => <TextField {...params} label="Producent" />}
                                                onChange={(_, value) => {
                                                    field.onChange(value?.producer_id || 0);
                                                }}
                                                onBlur={field.onBlur}
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

                                    <FormControl fullWidth required>
                                        <InputLabel>stan</InputLabel>
                                        <Controller
                                            name="condition"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    label="stan"
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    onBlur={field.onBlur}
                                                    inputRef={field.ref}
                                                >
                                                    <MenuItem value="Poleasingowy">Poleasingowy</MenuItem>
                                                    <MenuItem value="Nowy">Nowy</MenuItem>
                                                    <MenuItem value="Powystawowy">Powystawowy</MenuItem>
                                                </Select>
                                            )}
                                        />
                                    </FormControl>

                                </div>

                                <Typography variant="h4" style={{ textAlign: 'center', margin: '20px' }}>Parametry shoper</Typography>

                                <AttributeForm
                                    attributeList={attributeList}
                                    control={control}
                                    register={register}
                                    loading={loading}
                                />

                                <label >opis</label>
                                <textarea style={{ minWidth: '100%', maxWidth: '100%' }} defaultValue={pcTemplateNew("", "", "", "", "", '', '', '', '', '', '', '', '', '', [], '', '', '', '', '', '', '', "", '', '', '', '', '', '', '', '', false)} {...register("description")} />

                                <Button
                                    variant="contained"
                                    component="label"
                                    sx={{ fontSize: '15px' }}
                                >
                                    Dodaj zdjęcia
                                    <input
                                        style={{ width: '100%' }}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        hidden
                                    />
                                </Button>

                                <Typography>
                                    {selectedImages.map(file => file.name).join(", ") || "Brak zdjęć"}
                                </Typography>

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


                                <Button
                                    sx={{ fontSize: '15px' }}
                                    variant="contained"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <CircularProgress size={18} sx={{ mr: 1 }} />
                                            Ładowanie…
                                        </>
                                    ) : (
                                        "Dodaj produkt do shopera i apilo"
                                    )}
                                </Button>
                                <Button
                                    sx={{ fontSize: '15px' }}
                                    variant="contained"
                                    type="button"
                                    disabled={loading || updatingProduct}
                                    onClick={handleSubmit(handleUpdateProduct)}
                                >
                                    {updatingProduct ? (
                                        <>
                                            <CircularProgress size={18} sx={{ mr: 1 }} />
                                            Aktualizowanie…
                                        </>
                                    ) : (
                                        "Zaktualizuj produkt"
                                    )}
                                </Button>
                                <Button disabled={loading} sx={{ fontSize: '15px' }} variant="contained" onClick={handleAddAllegroOffer}>                                    {loading ? (
                                    <>
                                        <CircularProgress size={18} sx={{ mr: 1 }} />
                                        Ładowanie…
                                    </>
                                ) : (
                                    "Dodaj produkt do Allegro"
                                )}</Button>
                                <Button variant="outlined" type="reset"  >Reset formularza</Button>
                            </ThemeProvider>
                        </Box>
                    </form>

                    <Box
                        sx={{ py: 2, gap: 2, alignItems: 'center', flexWrap: 'wrap', maxWidth: '25vw' }}
                    >
                        <Typography variant="h4" sx={{ textAlign: "center", m: '20px' }}>
                            Parametry allegro
                        </Typography>

                        <ThemeProvider theme={MainTheme}>
                            <ResponsibleProducerSelect
                                data={responsibleData}
                                value={responsibleProducerId}
                                onChange={setResponsibleProducerId}
                            />

                            <AllegroParameters
                                Parameters={pcNewParameteres}
                                formData={formData}
                                register={register}
                                handleChangeAllegro={handleChangeAllegro}
                                isParamDisabled={isParamDisabled}
                            />
                        </ThemeProvider>
                    </Box>
                </Box>

                <AllegroSearchResults
                    showSearchresult={showSearchresult}
                    searchResult={searchResult}
                    selectedProductId={selectedProductId}
                    setShowSearchresult={setShowSearchresult}
                    handleSelectAllegroProduct={handleSelectAllegroProduct}
                />

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

                <div className="preview">
                    {descriptionLanguage === 'description' && (
                        <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: description }} />
                    )}

                    {descriptionLanguage === 'descriptionCZ' && (
                        <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: descriptionCZ }} />
                    )}

                    {descriptionLanguage === 'descriptionSK' && (
                        <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: descriptionSK }} />
                    )}
                </div>
            </div>
        </>
    );
}

export default AddPC;
