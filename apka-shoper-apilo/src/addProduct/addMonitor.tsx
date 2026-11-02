import axios from "axios";
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { useEffect, useMemo, useState } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Autocomplete, Box, Button, Checkbox, CircularProgress, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField, ThemeProvider, Typography } from "@mui/material";
import { MainTheme } from "./themes";
import { API_URL } from "../config";
import { monitorApiloTemplate1, monitorApiloTemplate2, monitorTemplate } from "./templates/monitorTemplate";
import './addProducts.css';
import { ProductImageManager, useProductImages } from "./productImageManager";
import { monitorCaseVC, monitorCaseVC_CZ, monitorCaseVC_SK, monitorVC, monitorVC_CZ, monitorVC_SK, stand_CZ, stand_SK, vc_CZ, vc_SK } from "./additionalDescriptions/visualConditionDescriptions";
import { monitorTemplateCZ } from "./templatesCZ/monitorTemplateCZ";
import { monitorTemplateSK } from "./templatesSK/monitorTemplateSK";
import { handleTranslateCZ, handleTranslateSK } from "../backendQueries/translate";
import { findAdditionalFeaturesAttribute, isAdditionalFeaturesName, readAdditionalFeaturesFromDescription, renderAdditionalFeatureItems, splitAdditionalFeatures, translateAdditionalFeatures } from "./additionalFeatures";
import { Attribute, FormData as AllegroFormData, Product, ProductParameter, ProductSafetyCertificateResource, ProductSafetyProducerResource, ProducersResource, SearchResult } from "../types";
import { handleGetProductSafetyProducers } from "../backendQueries/getProductSafetyProducers";
import { handleGetProductSafetyCertificates } from "../backendQueries/getProductSafetyCertificates";
import { handleGetProducers } from "../backendQueries/getProducers";
import { handleGetAttributeList } from "../backendQueries/handleGetAttributeList";
import { UpdateProductShoper } from "../backendQueries/updateProductShoper";
import { AddImageShoper } from "../backendQueries/addImageShoper";
import RelatedProductsSelect from "../relatedProductsSelect";
import { getShoperErrorMessage } from "../backendQueries/shoperErrorMessage";
import { getApiErrorMessage } from "../backendQueries/apiErrorMessage";
import React from "react";
import AllegroMonitorParameters from "./allegroComponents/AllegroLaptopParameters";
import { buildOfferParameters } from "./allegroComponents/buildOfferParameters";
import { resolveImportedShoperAttribute } from "./allegroComponents/importShoperAttribute";
import { ShoperImportedFieldStyles, shoperEnabled, shoperFieldWasProvided, shoperImportedAttributeNames, useShoperImportedFields } from "./shoperImportedFields";
import { ResponsibleProducerSelect, ResponsibleResponse } from "./allegroComponents/responsibleProducers";
import { buildMonitorAllegroDescription } from "./templatesAllegro/monitorAllegroDescription";
import type { Template, TemplateItem, TemplateSection } from "./templatesAllegro/allegroDescriptionTemplate";
import AllegroDescriptionEditor, { AllegroDescriptionPreview } from "./allegroComponents/AllegroDescriptionEditor";
import AllegroSearchResults from "./allegroComponents/searchProductAllegroResoult";
import { monitorParametersAllegro } from "../allegroParameters/monitorParameters";
import { ApiloSubmitControls } from "./apiloSubmitControls";

const ALLEGRO_MONITOR_CATEGORY_ID = "260041";
const ALLEGRO_MONITOR_IMAGE_LIMIT = 16;
const ALLEGRO_MONITOR_SHIPPING_RATE = "KOMPY 2018";

type AddMonitorProps = {
    authToken: string,
    accessTokenAllegro: string,
    allegroAccountId?: string,
}

interface IFormInput {
    producer: string | number
    category: string
    SKU: string
    stock: number
    price: number
    name: string
    description: string
    descriptionCZ: string
    descriptionSK: string
    active: boolean
    frame: boolean
    design: boolean
    attribute_291?: string
    attribute_846?: string
    attribute_847?: string
    attribute_848?: string
    attribute_849?: string
    attribute_850?: string
    attribute_851?: string
    attribute_852?: string
    attribute_853?: string
    attribute_854?: string
    attribute_855?: string
    attribute_856?: string
    attribute_857?: string
    chasingCondition: string
    chasingCondition_CZ: string
    chasingCondition_SK: string
    contrast: string
    HDR: string
    pivot: string
    additionalInfo: string
    descriptionLanguage: string
    productSafetyProducerId?: number | string
    productSafetyCertificateIds?: Array<number | string>
    productSafetyWarnings?: string[]
    connectProductAllegro?: boolean
    [key: string]: any;
}

function AddMonitor(props: AddMonitorProps) {
    const MONITOR_ATTRIBUTE_GROUP_ID = "50"; // ID grupy atrybutów monitorów w Shoper
    const BASE_ATTRIBUTE_GROUP_ID = "16"; // ID grupy atrybutów bazowych (Stan/Gwarancja)
    const [portsListString, setPortsListString] = useState("");
    const { register, handleSubmit, watch, setValue, control, getValues } = useForm<IFormInput>()
    const images = useProductImages();
    const { selectedImages, imageLinks } = images;
    const [addToApilo, setAddToApilo] = useState(true);
    const [nameCZ, setNameCZ] = useState("");
    const [nameSK, setNameSK] = useState("");
    const [additionalInfoCZ, setAdditionalInfoCZ] = useState("");
    const [additionalInfoSK, setAdditionalInfoSK] = useState("");
    const [extraFeaturesCZ, setExtraFeaturesCZ] = useState("");
    const [extraFeaturesSK, setExtraFeaturesSK] = useState("");
    const [pendingImportedExtraFeatures, setPendingImportedExtraFeatures] = useState<{ text: string; attributeIds: number[] } | null>(null);
    const [productSafetyProducers, setProductSafetyProducers] = useState<ProductSafetyProducerResource[]>([]);
    const [productSafetyCertificates, setProductSafetyCertificates] = useState<ProductSafetyCertificateResource[]>([]);
    // const [apiloImageUUIDS, setApiloImageUUIDS] = useState<string[]>([]);
    let apiloImageUUIDs: string[] = [];
    const [producers, setProducers] = useState<ProducersResource[]>([]);
    const [monitorAttributes, setMonitorAttributes] = useState<Attribute[]>([]);
    const [baseAttributes, setBaseAttributes] = useState<Attribute[]>([]);
    const [loadingAttributes, setLoadingAttributes] = useState<boolean>(false);
    const [pendingShoperAttributes, setPendingShoperAttributes] = useState<Array<[number, unknown]> | null>(null);
    const [shoperOfferId, setShoperOfferId] = useState<string>("");
    const [loadingShoperOffer, setLoadingShoperOffer] = useState<boolean>(false);
    const [pendingProducerId, setPendingProducerId] = useState<string | null>(null);
    const [pendingProducerName, setPendingProducerName] = useState<string | null>(null);
    const [updatingProduct, setUpdatingProduct] = useState<boolean>(false);
    const [relatedPackId, setRelatedPackId] = useState("");
    const [allegroFormData, setAllegroFormData] = useState<AllegroFormData>({});
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [showSearchresult, setShowSearchresult] = useState(false);
    const [searchName, setSearchName] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const { importedFields, clearImportedFields, markImportedFields, onImportedFieldChange } = useShoperImportedFields();
    const [lockedParams, setLockedParams] = useState<Set<string>>(new Set());
    const [responsibleData, setResponsibleData] = useState<ResponsibleResponse>();
    const [responsibleProducerId, setResponsibleProducerId] = useState("");
    const [loadingAllegroData, setLoadingAllegroData] = useState(false);
    const [addingAllegroOffer, setAddingAllegroOffer] = useState(false);
    const [allegroTemplate, setAllegroTemplate] = useState<Template>({ sections: [] });
    const [removedAutoSections, setRemovedAutoSections] = useState<Set<string>>(new Set());
    const monitorAllegroParameters = monitorParametersAllegro;

    const allAttributes = useMemo(() => {
        const byId = new Map<number, Attribute>();
        [...baseAttributes, ...monitorAttributes].forEach((attr) => {
            const id = Number(attr.attribute_id);
            if (!Number.isFinite(id)) return;
            if (!byId.has(id)) byId.set(id, attr);
        });
        return Array.from(byId.values());
    }, [baseAttributes, monitorAttributes]);

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

    const normalizeAttrName = (value?: string) => (value ?? "").toLowerCase().trim();

    const getAttrValueByName = (name: string): string => {
        const normalized = normalizeAttrName(name);
        const attr = allAttributes.find((item: Attribute) => normalizeAttrName(item?.name) === normalized);
        if (!attr) return "";
        const attrId = Number((attr as any).attribute_id);
        const value = watch(`attribute_${attrId}` as any, "");
        return String(value ?? "");
    };

    const getAttrValueByNames = (names: string[], fallback = ""): string => {
        for (const name of names) {
            const value = getAttrValueByName(name);
            if (value) return value;
        }
        return fallback;
    };

    const normalizeImportName = (value: unknown) =>
        String(value ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

    const getImportedParameterValue = (
        parameter: ProductParameter,
        definition?: ProductParameter,
    ): string | string[] | null => {
        const parameterType = definition?.type ?? parameter.type;
        if (Array.isArray(parameter.valuesLabels) && parameter.valuesLabels.length > 0) {
            const values = parameter.valuesLabels.map((value) => {
                if (parameterType !== "integer" && parameterType !== "float") return String(value);
                return String(value).match(/-?\d+(?:[.,]\d+)?/)?.[0]?.replace(",", ".") ?? "";
            }).filter(Boolean);
            return values.length === 1 ? values[0] : values;
        }
        if (Array.isArray(parameter.values) && parameter.values.length > 0) {
            const values = parameter.values.map((value) => {
                if (parameterType !== "integer" && parameterType !== "float") return String(value);
                return String(value).match(/-?\d+(?:[.,]\d+)?/)?.[0]?.replace(",", ".") ?? "";
            }).filter(Boolean);
            return values.length === 1 ? values[0] : values;
        }
        if (Array.isArray(parameter.valuesIds) && parameter.valuesIds.length > 0) {
            const dictionaryValues = parameter.valuesIds.flatMap((valueId) => {
                const option = definition?.dictionary?.find((item) => String(item.id) === String(valueId));
                return option ? [option.value] : [];
            });
            if (dictionaryValues.length > 0) {
                return dictionaryValues.length === 1 ? dictionaryValues[0] : dictionaryValues;
            }
        }
        if (parameter.rangeValue?.from || parameter.rangeValue?.to) {
            const rangeValue = String(parameter.rangeValue.from ?? parameter.rangeValue.to ?? "");
            if (parameterType !== "integer" && parameterType !== "float") return rangeValue;
            return rangeValue.match(/-?\d+(?:[.,]\d+)?/)?.[0]?.replace(",", ".") ?? "";
        }
        return null;
    };

    const getShoperAttributeByNames = (names: string[]) => {
        const normalizedNames = names.map(normalizeImportName);
        return allAttributes.find((attribute) =>
            normalizedNames.includes(normalizeImportName(attribute.name))
        );
    };

    const handleAdditionalInfoBlur = async (value: string) => {
        try {
            setAdditionalInfoCZ(await handleTranslateCZ(value));
            setAdditionalInfoSK(await handleTranslateSK(value));
            toast.success("przetłumaczono");
        } catch (error) {
            console.error("Błąd podczas tłumaczenia:", error);
            toast.error("błąd w tłumaczeniu");
        }
    };

    const getTextAttributeHandler = (attrName?: string) => {
        const normalized = normalizeAttrName(attrName);
        if (!normalized) return undefined;
        if (normalized.includes("uwag")) return handleAdditionalInfoBlur;
        if (normalized.includes("dodatkowa informacja")) return handleAdditionalInfoBlur;
        return undefined;
    };

    const fetchProducers = async () => {
        await handleGetProducers({
            API_URL,
            authToken: props.authToken,
            setProducers,
        });
    };

    useEffect(() => {
        if (!producers.length) return;
        if (pendingProducerId) {
            const exists = producers.some((p) => String(p.producer_id) === String(pendingProducerId));
            if (exists) {
                setValue("producer", String(pendingProducerId), { shouldDirty: true });
                return;
            }
        }
        if (pendingProducerName) {
            const match = producers.find((p) => (p.name ?? "").toLowerCase() === pendingProducerName.toLowerCase());
            if (match) {
                setValue("producer", String(match.producer_id), { shouldDirty: true });
                markImportedFields(["producer"]);
            }
        }
    }, [producers, pendingProducerId, pendingProducerName, setValue, markImportedFields]);

    const fetchAttributes = async () => {
        try {
            setLoadingAttributes(true);
            const [monitorList, baseList] = await Promise.all([
                handleGetAttributeList({
                    API_URL,
                    authToken: props.authToken,
                    setAttributeList: setMonitorAttributes,
                    attributeGroupId: MONITOR_ATTRIBUTE_GROUP_ID,
                }),
                handleGetAttributeList({
                    API_URL,
                    authToken: props.authToken,
                    setAttributeList: setBaseAttributes,
                    attributeGroupId: BASE_ATTRIBUTE_GROUP_ID,
                }),
            ]);
            setMonitorAttributes(monitorList);
            setBaseAttributes(baseList);
            if (pendingShoperAttributes) {
                applyAttributeEntriesToForm(pendingShoperAttributes, [...monitorList, ...baseList]);
                setPendingShoperAttributes(null);
                const fetchedAdditionalInfo = getAttrValueByNames(
                    ["Uwagi", "Uwaga", "Dodatkowa informacja", "Dodatkowa informacja - 1"],
                    ""
                );
                if (fetchedAdditionalInfo) {
                    await handleAdditionalInfoBlur(fetchedAdditionalInfo);
                }
            }
            toast.success("Atrybuty monitora pobrane z Shopera.");
        } catch (error) {
            console.error("Błąd pobierania atrybutów monitora:", error);
            toast.error("Nie udało się pobrać atrybutów monitora z Shopera.");
        } finally {
            setLoadingAttributes(false);
        }
    };

    const coerceAttributeValue = (value: unknown): string => {
        if (value == null) return "";
        if (Array.isArray(value)) {
            return value.map((v) => coerceAttributeValue(v)).filter(Boolean).join(", ");
        }
        if (typeof value === "object") {
            const maybeValue = (value as any).value ?? (value as any).name ?? (value as any).label;
            if (maybeValue != null) return String(maybeValue);
            return String(value);
        }
        return String(value);
    };

    const applyAttributeEntriesToForm = (
        entries: Array<[number, unknown]>,
        attributes: Attribute[] = allAttributes,
    ) => {
        const byId = new Map(attributes.map(attribute => [Number(attribute.attribute_id), attribute]));
        entries.forEach(([id, value]) => {
            const val = coerceAttributeValue(value);
            if (!val) return;
            setValue(`attribute_${id}` as any, String(byId.get(id)?.type) === "1" ? shoperEnabled(val) : val, { shouldDirty: true });
        });
    };

    const renderAttributeControl = (attribute: Attribute) => {
        // type: "0" tekst, "1" checkbox, "2" select (czasem typ przychodzi jako number)
        const attrId = Number((attribute as any).attribute_id);
        const attrType = String((attribute as any).type ?? "");
        const options = Array.isArray((attribute as any).options) ? (attribute as any).options : [];

        if (attrType === "1") {
            return (
                <FormControlLabel
                    key={attrId}
                    control={
                        <Controller
                            name={`attribute_${attrId}`}
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    name={field.name}
                                    checked={!!field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                    inputRef={field.ref}
                                />
                            )}
                        />
                    }
                    label={attribute.name}
                />
            );
        }

        if (attrType === "2") {
            return (
                <FormControl fullWidth key={attrId}>
                    <InputLabel id={`select-${attrId}-label`}>{attribute.name}</InputLabel>
                    <Controller
                        name={`attribute_${attrId}`}
                        control={control}
                        render={({ field }) => (
                            <Select
                                name={field.name}
                                labelId={`select-${attrId}-label`}
                                label={attribute.name}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                onBlur={field.onBlur}
                                inputRef={field.ref}
                            >
                                {options.map((opt: any) => {
                                    const value = opt?.value ?? opt?.option_id ?? "";
                                    return (
                                        <MenuItem key={opt.option_id ?? value} value={value}>
                                            {opt.value ?? value}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        )}
                    />
                </FormControl>
            );
        }

        const handler = getTextAttributeHandler(attribute.name);
        const isAdditionalFeatures = isAdditionalFeaturesName(attribute.name);
        return (
            <TextField
                key={attrId}
                label={attribute.name}
                variant="outlined"
                fullWidth
                multiline={isAdditionalFeatures}
                minRows={isAdditionalFeatures ? 3 : undefined}
                helperText={isAdditionalFeatures ? "Jedna cecha w wierszu. Trafią do opisu Shopera i Allegro." : undefined}
                slotProps={{ inputLabel: { shrink: true } }}
                {...register(
                    `attribute_${attrId}`,
                    handler
                        ? { onBlur: (e: React.FocusEvent<HTMLInputElement>) => handler(e.target.value) }
                        : undefined
                )}
            />
        );
    };

    let showTN = 'none !important'
    let showIPS = 'none !important'
    let showAdditionalInfo = ''
    let showAdditionalInfoCZ = ''
    let showAdditionalInfoSK = ''
    let showPivot = ''

    const {
    } = useForm<String>()

    const handleFetchShoperOffer = async () => {
        const offerId = shoperOfferId.trim();
        if (!offerId) {
            toast.error("Podaj ID aukcji Shopera.");
            return;
        }

        setLoadingShoperOffer(true);
        clearImportedFields();
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

            if (pl.name) setValue("name", pl.name, { shouldDirty: true });
            if (pl.description) setValue("description", pl.description, { shouldDirty: true });
            const importedExtraFeatures = readAdditionalFeaturesFromDescription(pl.description, ".monitor_extra_features");
            if (product?.active != null) setValue("active", shoperEnabled(product.active), { shouldDirty: true });
            if (cs.name) setNameCZ(cs.name);
            if (cs.description) setValue("descriptionCZ", cs.description, { shouldDirty: true });
            if (sk.name) setNameSK(sk.name);
            if (sk.description) setValue("descriptionSK", sk.description, { shouldDirty: true });
            if (product?.code) setValue("SKU", String(product.code), { shouldDirty: true });
            const producerId =
                product?.producer_id ??
                product?.producer?.producer_id ??
                product?.producer?.id;
            const producerName =
                product?.producer?.name ??
                product?.producer_name ??
                product?.producerName;
            if (producerId != null) {
                setPendingProducerId(String(producerId));
                setValue("producer", String(producerId), { shouldDirty: true });
            } else if (producerName) {
                setPendingProducerName(String(producerName));
            }
            if (product?.stock?.price != null) setValue("price", Number(product.stock.price), { shouldDirty: true });
            if (product?.stock?.stock != null) setValue("stock", Number(product.stock.stock), { shouldDirty: true });

            const safetyInfo = product?.safety_information ?? product?.safetyInformation ?? {};
            const safetyProducerRaw =
                safetyInfo?.gpsr_producer_id ??
                product?.product_safety_producer_id ??
                product?.productSafetyProducerId ??
                product?.product_safety_producer?.product_safety_producer_id ??
                product?.product_safety_producer?.producer_id ??
                product?.product_safety_producer?.id;
            const safetyProducerId = normalizeIdValue(safetyProducerRaw);
            if (safetyProducerId != null) {
                setValue("productSafetyProducerId", safetyProducerId, { shouldValidate: true, shouldDirty: true });
            }

            const safetyCertsRaw =
                safetyInfo?.gpsr_certificates ??
                product?.product_safety_certificate_ids ??
                product?.productSafetyCertificateIds ??
                product?.product_safety_certificates ??
                [];
            const safetyCerts = Array.isArray(safetyCertsRaw)
                ? safetyCertsRaw
                : [safetyCertsRaw];
            const normalizedCerts = safetyCerts
                .map((id) => normalizeIdValue(id))
                .filter((id): id is number | string => id != null);
            if (normalizedCerts.length) {
                setValue("productSafetyCertificateIds", normalizedCerts, { shouldValidate: true, shouldDirty: true });
            }

            let rawAttributes = product?.attributes ?? product?.attribute ?? [];
            if (rawAttributes && Array.isArray((rawAttributes as any).list)) {
                rawAttributes = (rawAttributes as any).list;
            }
            const attributeEntries: Array<[number, unknown]> = [];

            if (Array.isArray(rawAttributes)) {
                rawAttributes.forEach((attr: any) => {
                    const id = Number(attr.attribute_id ?? attr.attributeId ?? attr.id);
                    const value = attr.value ?? attr.values ?? attr.value_id ?? attr.valueId ?? attr;
                    if (Number.isFinite(id)) {
                        attributeEntries.push([id, value]);
                    }
                });
            } else if (rawAttributes && typeof rawAttributes === "object") {
                // struktura: { groupId: { attrId: value } }
                Object.entries(rawAttributes).forEach(([maybeGroupId, groupValue]) => {
                    if (groupValue && typeof groupValue === "object" && !Array.isArray(groupValue)) {
                        Object.entries(groupValue as Record<string, unknown>).forEach(([attrId, value]) => {
                            const numericId = Number(attrId);
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

            if (allAttributes.length === 0) {
                setPendingShoperAttributes(attributeEntries);
            } else {
                applyAttributeEntriesToForm(attributeEntries);
                const fetchedAdditionalInfo = getAttrValueByNames(
                    ["Uwagi", "Uwaga", "Dodatkowa informacja", "Dodatkowa informacja - 1"],
                    ""
                );
                if (fetchedAdditionalInfo) {
                    await handleAdditionalInfoBlur(fetchedAdditionalInfo);
                }
            }
            setPendingImportedExtraFeatures({ text: importedExtraFeatures, attributeIds: attributeEntries.map(([id]) => id) });

            const imported = shoperImportedAttributeNames(attributeEntries);
            if (shoperFieldWasProvided(pl.name)) imported.push("name");
            if (shoperFieldWasProvided(pl.description)) imported.push("description");
            if (shoperFieldWasProvided(product?.active)) imported.push("active");
            if (shoperFieldWasProvided(cs.description)) imported.push("descriptionCZ");
            if (shoperFieldWasProvided(sk.description)) imported.push("descriptionSK");
            if (shoperFieldWasProvided(product?.code)) imported.push("SKU");
            if (shoperFieldWasProvided(producerId)) imported.push("producer");
            if (shoperFieldWasProvided(product?.stock?.price)) imported.push("price");
            if (shoperFieldWasProvided(product?.stock?.stock)) imported.push("stock");
            if (shoperFieldWasProvided(safetyProducerId)) imported.push("productSafetyProducerId");
            if (normalizedCerts.length) imported.push("productSafetyCertificateIds");
            markImportedFields(imported);

            toast.success("Dane aukcji z Shopera zostały pobrane.");
        } catch (error) {
            console.error("Błąd pobierania aukcji z Shopera:", error);
            toast.error("Nie udało się pobrać aukcji z Shopera.");
        } finally {
            setLoadingShoperOffer(false);
        }
    };

    const handleSearchAllegroProduct = async () => {
        const query = searchName.trim();
        if (!props.accessTokenAllegro) {
            toast.error("Brak tokenu Allegro. Zaloguj się ponownie.");
            return;
        }
        if (!query) {
            toast.info("Wpisz nazwę, EAN lub kod produktu Allegro.");
            return;
        }
        try {
            const response = await axios.get(`${API_URL}/product/search`, {
                params: { searchName: query },
                headers: { Authorization: `Bearer ${props.accessTokenAllegro}` },
            });
            setSearchResult(response.data);
            setShowSearchresult(true);
        } catch (error) {
            console.error("Błąd wyszukiwania monitora w Allegro:", error);
            toast.error("Nie udało się wyszukać produktu w Allegro.");
        }
    };

    const handleSelectAllegroMonitor = (product: Product) => {
        const definitionsById = new Map(
            monitorAllegroParameters.map((parameter) => [String(parameter.id), parameter]),
        );
        const definitionsByName = new Map(
            monitorAllegroParameters.map((parameter) => [normalizeImportName(parameter.name), parameter]),
        );
        const imported: AllegroFormData = {};
        (product.parameters ?? []).forEach((parameter) => {
            const definition = definitionsById.get(String(parameter.id))
                ?? definitionsByName.get(normalizeImportName(parameter.name));
            if (!definition) return;
            const value = getImportedParameterValue(parameter, definition);
            if (value != null) imported[definition.name] = value;
        });

        setSelectedProductId(product.id);
        setSelectedProduct(product);
        setLockedParams(new Set((product.parameters ?? []).flatMap((parameter) => {
            if (parameter.options?.identifiesProduct !== true) return [];
            const definition = definitionsById.get(String(parameter.id))
                ?? definitionsByName.get(normalizeImportName(parameter.name));
            return definition ? [definition.name] : [];
        })));
        setAllegroFormData((previous) => ({ ...previous, ...imported }));
        if (product.name) {
            setValue("name", product.name, { shouldDirty: true });
        }
        toast.success("Wybrano produkt Allegro i pobrano jego parametry.");
    };

    const handleImportAllegroFormToShoper = () => {
        clearImportedFields();
        if (allAttributes.length === 0) {
            toast.error("Lista atrybutów Shopera nie została jeszcze pobrana.");
            return;
        }
        if (!selectedProduct) {
            toast.info("Najpierw wybierz produkt Allegro.");
            return;
        }

        const selectedProductData: AllegroFormData = {};
        (selectedProduct.parameters ?? []).forEach((parameter) => {
            const definition = monitorAllegroParameters.find((item) =>
                String(item.id) === String(parameter.id)
                || normalizeImportName(item.name) === normalizeImportName(parameter.name)
            );
            const value = getImportedParameterValue(parameter, definition);
            if (value != null) selectedProductData[definition?.name ?? parameter.name] = value;
        });

        const aliases: Record<string, string[]> = {
            marka: ["Producent", "Marka"],
            producent: ["Producent", "Marka"],
            model: ["Model"],
            "kod producenta": ["Kod producenta"],
            stan: ["Stan"],
            "przekatna ekranu": ["Przekątna ekranu", "Wielkość matrycy"],
            przekatna: ["Przekątna ekranu", "Wielkość matrycy"],
            rozdzielczosc: ["Rozdzielczość", "Rozdzielczość (px)"],
            "rozdzielczosc px": ["Rozdzielczość", "Rozdzielczość (px)"],
            "typ matrycy": ["Rodzaj panelu", "Typ matrycy"],
            "rodzaj matrycy": ["Rodzaj panelu", "Typ matrycy"],
            "rodzaj podswietlenia": ["Typ podświetlenia"],
            "czestotliwosc odswiezania": ["Odświeżanie", "Częstotliwość odświeżania"],
            "czas reakcji": ["Czas reakcji"],
            jasnosc: ["Jasność"],
            kontrast: ["Kontrast"],
            zlacza: ["Złącza"],
            hdr: ["HDR"],
            pivot: ["Pivot"],
        };
        let importedCount = 0;
        const skipped: string[] = [];
        Object.entries(selectedProductData).forEach(([parameterName, rawValue]) => {
            const normalizedName = normalizeImportName(parameterName);
            const attribute = getShoperAttributeByNames(aliases[normalizedName] ?? [parameterName]);
            if (!attribute) {
                skipped.push(parameterName);
                return;
            }
            const attributeId = Number(attribute.attribute_id);
            if (!Number.isFinite(attributeId)) return;
            const value = resolveImportedShoperAttribute(attribute, rawValue);
            if (value === undefined) {
                skipped.push(parameterName);
                if ((String(attribute.type) === "2" || attribute.options?.length) &&
                    resolveImportedShoperAttribute(attribute, getValues(`attribute_${attributeId}` as any)) === undefined) {
                    setValue(`attribute_${attributeId}` as any, "", { shouldDirty: true });
                }
                return;
            }
            setValue(`attribute_${attributeId}` as any, value, { shouldDirty: true, shouldValidate: true });
            importedCount += 1;
        });

        const producerValue = selectedProductData["Marka"] ?? selectedProductData["Producent"];
        const producerName = Array.isArray(producerValue) ? producerValue[0] : producerValue;
        if (producerName) {
            const matchingProducer = producers.find(
                (producer) => normalizeImportName(producer.name) === normalizeImportName(producerName),
            );
            if (matchingProducer) {
                setValue("producer", String(matchingProducer.producer_id), { shouldDirty: true });
            }
        }
        const manufacturerCode = selectedProductData["Kod producenta"];
        if (typeof manufacturerCode === "string" && manufacturerCode.trim()) {
            setValue("SKU", manufacturerCode.trim(), { shouldDirty: true });
        }
        if (skipped.length) toast.warning(`Pominięto ${skipped.length} pól bez odpowiednika w Shoperze: ${skipped.slice(0, 5).join(", ")}${skipped.length > 5 ? "..." : ""}.`);
        toast.success(`Zaimportowano ${importedCount} pól z Allegro do formularza monitora.`);
    };

    useEffect(() => {
        handleGetProductSafetyProducers({
            API_URL,
            authToken: props.authToken,
            setProductSafetyProducers,
        });
        handleGetProductSafetyCertificates({
            API_URL,
            authToken: props.authToken,
            setProductSafetyCertificates,
        });
        fetchProducers();
        fetchAttributes();
    }, []);

    useEffect(() => {
        setResponsibleProducerId("");

        if (!props.accessTokenAllegro) {
            setResponsibleData(undefined);
            return;
        }

        let cancelled = false;
        const loadAllegroData = async () => {
            setLoadingAllegroData(true);
            try {
                const producersResponse = await axios.get(`${API_URL}/product/responsibleProducers`, {
                    params: { allegroAccountId: props.allegroAccountId },
                    headers: {
                        Authorization: `Bearer ${props.authToken}`,
                        "Cache-Control": "no-cache",
                    },
                });
                if (cancelled) return;
                setResponsibleData(producersResponse.data);
            } catch (error) {
                if (!cancelled) {
                    console.error("Błąd pobierania danych Allegro dla monitorów:", error);
                    toast.error("Nie udało się pobrać producentów odpowiedzialnych z Allegro.");
                }
            } finally {
                if (!cancelled) setLoadingAllegroData(false);
            }
        };

        void loadAllegroData();
        return () => {
            cancelled = true;
        };
    }, [props.accessTokenAllegro, props.allegroAccountId]);

    const buildShoperAttributes = (data: IFormInput) => {
        const attrs: Record<number, string> = {};
        const joinValues = (v: unknown) =>
            Array.isArray(v) ? v.filter((s) => String(s).trim() !== "").join(", ") : String(v ?? "");

        allAttributes.forEach((attr: Attribute) => {
            const attrId = Number((attr as any).attribute_id);
            const value = (data as any)[`attribute_${attrId}`];
            if (value == null || value === "") return;
            attrs[attrId] = String(attr.type) === "1" && typeof value === "boolean"
                ? (value ? "1" : "0") : joinValues(value);
        });

        const ensureAttr = (id: number, value: unknown) => {
            if (value == null || value === "") return;
            if (!(id in attrs)) {
                attrs[id] = String(value);
            }
        };

        ensureAttr(307, "24 miesiące");
        ensureAttr(291, (data as any)["attribute_291"] ?? data.condition);

        // PL attributes
        ensureAttr(857, (data as any)["attribute_857"]);
        ensureAttr(856, (data as any)["attribute_856"]);
        ensureAttr(855, (data as any)["attribute_855"]);
        ensureAttr(854, (data as any)["attribute_854"]);
        ensureAttr(853, (data as any)["attribute_853"]);
        ensureAttr(852, (data as any)["attribute_852"]);
        ensureAttr(851, (data as any)["attribute_851"]);
        ensureAttr(850, (data as any)["attribute_850"]);
        ensureAttr(849, (data as any)["attribute_849"]);
        ensureAttr(848, (data as any)["attribute_848"]);
        ensureAttr(847, (data as any)["attribute_847"]);
        ensureAttr(846, (data as any)["attribute_846"]);

        const standValue = String((data as any)["attribute_857"] ?? "");
        const visualConditionValue = String((data as any)["attribute_856"] ?? "");

        // CZ attributes
        ensureAttr(1072, stand_CZ[standValue] ?? "");
        ensureAttr(1071, vc_CZ[visualConditionValue] ?? "");
        ensureAttr(1070, (data as any)["attribute_855"]);
        ensureAttr(1069, (data as any)["attribute_854"]);
        ensureAttr(1068, (data as any)["attribute_852"]);
        ensureAttr(1067, (data as any)["attribute_851"]);
        ensureAttr(1066, (data as any)["attribute_850"]);
        ensureAttr(1065, (data as any)["attribute_849"]);
        ensureAttr(1064, (data as any)["attribute_848"]);
        ensureAttr(1063, (data as any)["attribute_847"]);
        ensureAttr(1061, (data as any)["attribute_853"]);

        // SK attributes
        ensureAttr(1084, stand_SK[standValue] ?? "");
        ensureAttr(1083, vc_SK[visualConditionValue] ?? "");
        ensureAttr(1082, (data as any)["attribute_855"]);
        ensureAttr(1081, (data as any)["attribute_854"]);
        ensureAttr(1080, (data as any)["attribute_852"]);
        ensureAttr(1079, (data as any)["attribute_851"]);
        ensureAttr(1078, (data as any)["attribute_850"]);
        ensureAttr(1077, (data as any)["attribute_849"]);
        ensureAttr(1076, (data as any)["attribute_848"]);
        ensureAttr(1075, (data as any)["attribute_847"]);
        ensureAttr(1074, (data as any)["attribute_853"]);

        return attrs;
    };

    const parseMonitorDiagonal = (value: unknown) => {
        const normalized = String(value ?? "")
            .replace(",", ".")
            .replace(/"/g, "")
            .trim();
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    };

    const getMonitorCategoryId = (diagonalValue: unknown) => {
        const numericValue = parseMonitorDiagonal(diagonalValue);
        if (numericValue == null) return null;
        if (numericValue <= 19) return 325;
        if (numericValue < 23.5) return 326;
        if (numericValue <= 26.4) return 328;
        return 329;
    };

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        const category = getMonitorCategoryId(diagonal);
        if (category == null) {
            toast.error("Nie udało się ustalić kategorii monitora na podstawie przekątnej ekranu.");
            return;
        }

        try {
            //dodaj zdjęcia do apilo
            if (addToApilo) try {
                // Pętla po wszystkich obrazach
                for (let i = 0; i < selectedImages.length; i++) {
                    const formData = new FormData();
                    formData.append("file", selectedImages[i]); // Dodajemy plik do formData

                    const apiloImageResponse = await axios.post(
                        `${API_URL}/product-image/apilo`,
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                                "Authorization": `Bearer ${props.authToken}`,
                            },
                        }
                    );


                    // Dodajemy uuid do stanu apiloImageUUIDS

                    //setApiloImageUUIDS(prevUUIDS => [...prevUUIDS, apiloImageResponse.data.uuid]);
                    apiloImageUUIDs.push(apiloImageResponse.data.uuid);


                }
            } catch (error) {
                console.error("Image upload error:", error);
                toast.error("Błąd podczas dodawania zdjęcia na apilo");
            }
            const safetyProducerId = normalizeIdValue(data.productSafetyProducerId) ?? 0;
            const safetyCertificateIds = Array.isArray(data.productSafetyCertificateIds)
                ? data.productSafetyCertificateIds
                : [];
            const safetyInformation: Record<string, unknown> = {};
            if (safetyProducerId) safetyInformation.gpsr_producer_id = safetyProducerId;
            if (safetyCertificateIds.length) safetyInformation.gpsr_certificates = safetyCertificateIds;

            const response = await axios.post(`${API_URL}/product/shoper`, {
                producer_id: data.producer,
                category_id: category,
                code: data.SKU,
                pkwiu: "-",
                translations: {
                    pl_PL: {
                        name: data.name,
                        description: data.description,
                        active: data.active
                    },
                    cs_CZ: {
                        name: nameCZ,
                        description: descriptionCZ,
                        active: data.active,
                    },
                    sk_SK: {
                        name: nameSK,
                        description: descriptionSK,
                        active: data.active,
                    },
                },
                stock: {
                    price: data.price,
                    active: 1,
                    stock: data.stock,
                    delivery_id: 1
                },
                attributes: buildShoperAttributes(data),
                gauge_id: 6,
                ...(Object.keys(safetyInformation).length
                    ? { safety_information: safetyInformation }
                    : {}),
                ...(relatedPackId ? { related_pack_id: relatedPackId } : {}),
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${props.authToken}`

                }
            });
            if (addToApilo) {
            const apiloPrductsListResponse = await axios.get(`${API_URL}/product/apiloProductslist`, {
                params: {
                    sku: data.SKU.toUpperCase()
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${props.authToken}`
                }
            });
            if (apiloPrductsListResponse.data.totalCount != 0) {
                try {
                    const apiloDeleteResponse = await axios.delete(
                        `${API_URL}/product/apiloProductDelete/${apiloPrductsListResponse.data.products[0].id}`,
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${props.authToken}`
                            }
                        }
                    );
                } catch (error) {
                    console.error("Product delete error:", error);
                    toast.error("Wystąpił błąd podczas usuwania produktu");
                    throw error;
                }
            }

            const apiloResponse = await axios.post(`${API_URL}/product/apilo`,
                [
                    {
                        "sku": data.SKU,
                        "name": data.name,
                        "tax": 23,
                        "status": 1,
                        "quantity": Number(data.stock),
                        "priceWithTax": data.price,
                        "description": data.description,
                        "images": apiloImageUUIDs
                    }
                ]
                , {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${props.authToken}`
                    }
                });

            let ApiloAddedProductsFirstKey = Object.keys(apiloResponse.data.products)[0];


            const apiloAttributesResponse = await axios.patch(`${API_URL}/product/attributes`,

                {
                    "attributes": [
                        {
                            "id": 93,
                            "productId": apiloResponse.data.products[ApiloAddedProductsFirstKey],
                            "type": 9,
                            "values": [
                                {
                                    "value":
                                        `
                                        <h1>Monitor ${model}</h1>
                                        <p>✅ ${visualCondition} = <b>${monitorVC[visualCondition]}</b></p>
                                        ${data.frame ? '<p>✅ Ultra cienka ramka matrycy</p>' : ''}
                                        ${data.design ? '<p>✅ Nowoczesny design</p>' : ''}
                                        <p>✅ Kabel zasilający w komplecie</p>
                                        <p>Obudowa może posiadać normalne ślady użytkowania w postaci rysek i przetarć</p>
                                        `,
                                }
                            ]
                        },
                        {
                            "id": 96,
                            "productId": apiloResponse.data.products[ApiloAddedProductsFirstKey],
                            "type": 9,
                            "values": [
                                {
                                    "value": monitorApiloTemplate1(producent, model, visualCondition, resolution, chasingCondition, diagonal, typeOfBlacklight, connectors, additionalInfo, portsListString)
                                        + (renderAdditionalFeatureItems(extraFeatures) ? `<h2>Funkcje dodatkowe</h2><ul>${renderAdditionalFeatureItems(extraFeatures)}</ul>` : ""),
                                }
                            ]
                        },
                        {
                            "id": 99,
                            "productId": apiloResponse.data.products[ApiloAddedProductsFirstKey],
                            "type": 9,
                            "values": [
                                {
                                    "value": monitorApiloTemplate2(resolution, diagonal, typeOfBlacklight, refreshRate, responseTime, brightness, contrast, connectors, HDR),
                                }
                            ]
                        },
                    ]
                }

                , {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${props.authToken}`
                    }
                });
            }

            const uploadImages = async () => {
                const productId = response.data;

                for (let i = 0; i < imageLinks.length; i++) {
                    const image = imageLinks[i];
                    try {
                        const responseImg = await axios.post(`${API_URL}/product-image`, {
                            product_id: productId,
                            url: image,
                            translations: {
                                pl_PL: {
                                    name: selectedImages[i]?.name || "zdjęcie"
                                }
                            }
                        }, {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${props.authToken}`
                            }
                        });
                    } catch (error) {
                        console.error("Image upload error:", error);
                        toast.error("Błąd podczas dodawania zdjęcia");
                        throw error;
                    }
                }
            };
            if (selectedImages.length > 0) {
                await uploadImages();
            }
            toast.success(addToApilo
                ? `Produkt ${response.data} został dodany do Shopera i Apilo.`
                : `Produkt ${response.data} został dodany do Shopera.`);

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd HTTP:", error.response?.status, error.response?.data);
                toast.error(getShoperErrorMessage(error, allAttributes));
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error(getShoperErrorMessage(error, allAttributes));
            }

        };
        apiloImageUUIDs = []
    }

    const handleUpdateProduct = async (data: IFormInput) => {
        const offerId = shoperOfferId.trim();
        if (!offerId) {
            toast.error("Podaj ID aukcji z Shopera, aby zaktualizować produkt.");
            return;
        }
        setUpdatingProduct(true);
        try {
            const category = getMonitorCategoryId(diagonal);
            if (category == null) {
                toast.error("Nie udało się ustalić kategorii monitora na podstawie przekątnej ekranu.");
                return;
            }

            const attributes = buildShoperAttributes(data);
            const safetyProducerId = Number((data as any).productSafetyProducerId ?? 0) || 0;
            const safetyCertificateIds = Array.isArray((data as any).productSafetyCertificateIds)
                ? (data as any).productSafetyCertificateIds
                    .map((id: unknown) => Number(id))
                    .filter((id: number) => Number.isFinite(id))
                : [];

            await UpdateProductShoper({
                productId: Number(offerId),
                basePayload: {
                    producer_id: data.producer,
                    category_id: category,
                    code: data.SKU,
                    pkwiu: "-",
                    stock: {
                        price: data.price,
                        active: 1,
                        stock: data.stock,
                        delivery_id: 1
                    },
                    attributes: attributes,
                    gauge_id: 6,
                    ...(safetyProducerId ? { product_safety_producer_id: safetyProducerId } : {}),
                    ...(safetyCertificateIds.length ? { product_safety_certificate_ids: safetyCertificateIds } : {}),
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
                toast.error(getApiErrorMessage(error, "Nie udało się zaktualizować produktu.", allAttributes));
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error(getApiErrorMessage(error, "Nie udało się zaktualizować produktu.", allAttributes));
            }
        } finally {
            setUpdatingProduct(false);
        }
    };

    let name = String(watch("name", "") ?? "");
    let producer = String(watch("producer", "") ?? "");
    let stand = getAttrValueByNames(["Podstawka", "Podstawa"], String(watch("attribute_857", "") ?? ""));
    let visualCondition = getAttrValueByNames(["Klasa wizualna", "Stan wizualny"], String(watch("attribute_856", "") ?? ""));
    let brightness = getAttrValueByNames(["Jasność"], String(watch("attribute_855", "") ?? ""));
    let typeOfMatrix = getAttrValueByNames(["Rodzaj panelu", "Typ matrycy"], String(watch("attribute_852", "") ?? ""));
    let connectors = getAttrValueByNames(["Złącza", "Zlacza"], String(watch("attribute_853", "") ?? ""));
    let typeOfBlacklight = getAttrValueByNames(["Typ podświetlenia", "Typ podswietlenia"], String(watch("attribute_854", "") ?? ""));
    let refreshRate = getAttrValueByNames(["Odświeżanie", "Częstotliwość odświeżania"], String(watch("attribute_851", "") ?? ""));
    let responseTime = getAttrValueByNames(["Czas reakcji"], String(watch("attribute_850", "") ?? ""));
    let resolution = getAttrValueByNames(["Rozdzielczość", "Rozdzielczość (px)"], String(watch("attribute_849", "") ?? ""));
    let diagonal = getAttrValueByNames(["Przekątna ekranu", "Wielkość matrycy"], String(watch("attribute_848", "") ?? ""));
    let model = getAttrValueByNames(["Model"], String(watch("attribute_847", "") ?? ""));
    let producent = getAttrValueByNames(["Producent"], String(watch("attribute_846", "") ?? ""));
    let chasingCondition = getAttrValueByNames(["Stan obudowy", "Stan wizualny obudowy"], String(watch("chasingCondition", "") ?? ""));
    let chasingCondition_CZ = ''
    let chasingCondition_SK = ''
    let contrast = getAttrValueByNames(["Kontrast"], String(watch("contrast", "") ?? ""));
    let HDR = getAttrValueByNames(["HDR"], String(watch("HDR", "") ?? ""));
    let pivot = getAttrValueByNames(["Pivot"], String(watch("pivot", "") ?? ""));
    let additionalInfo = getAttrValueByNames(["Uwagi", "Uwaga", "Dodatkowa informacja", "Dodatkowa informacja - 1"], String(watch("additionalInfo", "") ?? ""));
    const extraFeaturesAttribute = findAdditionalFeaturesAttribute(allAttributes);
    const extraFeaturesAttributeId = extraFeaturesAttribute?.attribute_id;
    const extraFeatures = extraFeaturesAttributeId
        ? String(watch(`attribute_${extraFeaturesAttributeId}`, "") ?? "")
        : "";
    const speakers = shoperEnabled(getAttrValueByName("Głośniki"));

    useEffect(() => {
        if (!extraFeaturesAttributeId || !pendingImportedExtraFeatures) return;
        const field = `attribute_${extraFeaturesAttributeId}`;
        if (!pendingImportedExtraFeatures.attributeIds.includes(extraFeaturesAttributeId)) {
            setValue(field, pendingImportedExtraFeatures.text, { shouldDirty: true });
            if (pendingImportedExtraFeatures.text) markImportedFields([field]);
        }
        setPendingImportedExtraFeatures(null);
    }, [extraFeaturesAttributeId, pendingImportedExtraFeatures, getValues, setValue, markImportedFields]);

    useEffect(() => {
        let cancelled = false;
        if (!splitAdditionalFeatures(extraFeatures).length) {
            setExtraFeaturesCZ("");
            setExtraFeaturesSK("");
            return;
        }
        setExtraFeaturesCZ("");
        setExtraFeaturesSK("");
        const timer = window.setTimeout(() => {
            Promise.all([
                translateAdditionalFeatures(extraFeatures, handleTranslateCZ),
                translateAdditionalFeatures(extraFeatures, handleTranslateSK),
            ]).then(([cz, sk]) => {
                if (cancelled) return;
                setExtraFeaturesCZ(cz);
                setExtraFeaturesSK(sk);
            });
        }, 400);
        return () => { cancelled = true; window.clearTimeout(timer); };
    }, [extraFeatures]);
    let descriptionLanguage = String(watch("descriptionLanguage", "description") ?? "description")
    const connectProductAllegro = Boolean(watch("connectProductAllegro", true));
    let visualCondition_CZ = ""
    let visualCondition_SK = ""

    let description = watch("description", monitorTemplate(
        producent,
        name,
        model,
        visualCondition,
        resolution,
        chasingCondition,
        diagonal,
        typeOfBlacklight,
        refreshRate,
        responseTime,
        brightness,
        contrast,
        connectors,
        HDR,
        showPivot,
        additionalInfo,
        showIPS,
        showTN,
        portsListString,
        extraFeatures,
        speakers
    ));
    let descriptionCZ = watch("descriptionCZ", monitorTemplateCZ(
        producent,
        nameCZ,
        model,
        visualCondition_CZ,
        resolution,
        chasingCondition_CZ,
        diagonal,
        typeOfBlacklight,
        refreshRate,
        responseTime,
        brightness,
        contrast,
        connectors,
        HDR,
        showPivot,
        additionalInfoCZ,
        showIPS,
        showTN,
        portsListString,
        extraFeaturesCZ || extraFeatures,
        speakers
    ));
    let descriptionSK = watch("descriptionSK", monitorTemplateSK(
        producent,
        nameSK,
        model,
        visualCondition_SK,
        resolution,
        chasingCondition_SK,
        diagonal,
        typeOfBlacklight,
        refreshRate,
        responseTime,
        brightness,
        contrast,
        connectors,
        HDR,
        showPivot,
        additionalInfoSK,
        showIPS,
        showTN,
        portsListString,
        extraFeaturesSK || extraFeatures,
        speakers
    ));

    const selectedProducerName =
        producers.find((item) => String(item.producer_id) === String(producer))?.name ?? "";
    const allegroProducerName = producent || selectedProducerName;
    const offerTitleValue = name.trim();
    const frameForAllegro = Boolean(watch("frame", false));
    const designForAllegro = Boolean(watch("design", false));
    const automaticAllegroDescription = useMemo(
        () => buildMonitorAllegroDescription({
            producer: allegroProducerName,
            model,
            name: offerTitleValue,
            visualCondition,
            caseCondition: chasingCondition,
            stand,
            resolution,
            diagonal,
            panelType: typeOfMatrix,
            refreshRate,
            responseTime,
            brightness,
            contrast,
            connectors,
            hdr: HDR,
            speakers,
            pivot,
            additionalInfo,
            extraFeatures,
            frame: frameForAllegro,
            design: designForAllegro,
        }),
        [
            allegroProducerName,
            model,
            offerTitleValue,
            visualCondition,
            chasingCondition,
            stand,
            resolution,
            diagonal,
            typeOfMatrix,
            refreshRate,
            responseTime,
            brightness,
            contrast,
            connectors,
            HDR,
            speakers,
            pivot,
            additionalInfo,
            extraFeatures,
            frameForAllegro,
            designForAllegro,
        ],
    );

    useEffect(() => {
        const freshById = new Map<string, TemplateSection>(
            automaticAllegroDescription.description.sections.map((section) => [section.id, section]),
        );

        setAllegroTemplate((previous) => {
            const sections: TemplateSection[] = [];
            previous.sections.forEach((previousSection) => {
                if (previousSection.origin === "user") {
                    sections.push(previousSection);
                    return;
                }
                if (removedAutoSections.has(previousSection.id)) return;
                const freshSection = freshById.get(previousSection.id);
                if (!freshSection) return;
                sections.push({
                    ...freshSection,
                    items: freshSection.items.map((item, index) => {
                        const previousItem = previousSection.items[index];
                        return item.type === "IMAGE"
                            && previousItem?.type === "IMAGE"
                            && previousItem.locked
                            ? previousItem
                            : item;
                    }),
                });
                freshById.delete(previousSection.id);
            });

            freshById.forEach((section) => {
                if (removedAutoSections.has(section.id)) return;
                if (section.id === "monitor-extra-features") {
                    const featuresIndex = sections.findIndex((item) => item.id === "monitor-features");
                    sections.splice(featuresIndex < 0 ? sections.length : featuresIndex + 1, 0, section);
                } else {
                    sections.push(section);
                }
            });

            const ecoIndex = sections.findIndex(
                (section) => section.origin !== "user" && section.id === "eco",
            );
            if (ecoIndex !== -1) {
                const [ecoSection] = sections.splice(ecoIndex, 1);
                let lastAutomaticIndex = -1;
                sections.forEach((section, index) => {
                    if (section.origin !== "user") lastAutomaticIndex = index;
                });
                sections.splice(lastAutomaticIndex + 1, 0, ecoSection);
            }
            return { sections };
        });
    }, [automaticAllegroDescription, removedAutoSections]);

    useEffect(() => {
        if (!monitorAllegroParameters.length) return;

        const normalizeValue = (value: unknown) =>
            String(value ?? "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, " ")
                .trim();
        const shoperValues = new Map<string, unknown>();
        allAttributes.forEach((attribute) => {
            const id = Number(attribute.attribute_id);
            if (!Number.isFinite(id)) return;
            shoperValues.set(
                normalizeValue(attribute.name),
                watch(`attribute_${id}`, ""),
            );
        });

        const explicitValues: Record<string, unknown> = {
            marka: allegroProducerName,
            producent: allegroProducerName,
            model,
            "kod producenta": model,
            stan: getAttrValueByNames(["Stan"]),
            "przekatna ekranu": diagonal,
            przekatna: diagonal,
            rozdzielczosc: resolution,
            "rozdzielczosc px": resolution,
            "rozdzielczosc natywna": resolution,
            "typ matrycy": typeOfMatrix,
            "rodzaj matrycy": typeOfMatrix,
            "czestotliwosc odswiezania": refreshRate,
            odswiezanie: refreshRate,
            "czas reakcji": responseTime,
            jasnosc: brightness,
            kontrast: contrast,
            zlacza: connectors,
            hdr: HDR,
            pivot,
        };

        const matchDictionaryValue = (parameter: ProductParameter, rawValue: unknown) => {
            const dictionary = Array.isArray(parameter.dictionary) ? parameter.dictionary : [];
            if (!dictionary.length) return rawValue;
            const rawItems = Array.isArray(rawValue)
                ? rawValue
                : String(rawValue ?? "").split(",").map((item) => item.trim()).filter(Boolean);
            const matched = rawItems.flatMap((rawItem) => {
                const normalizedRaw = normalizeValue(rawItem);
                const option = dictionary.find((entry) => {
                    const normalizedOption = normalizeValue(entry.value);
                    return normalizedOption === normalizedRaw
                        || normalizedRaw.includes(normalizedOption)
                        || normalizedOption.includes(normalizedRaw);
                });
                return option ? [option.value] : [];
            });
            if (!matched.length) {
                return parameter.restrictions?.multipleChoices ? [] : "";
            }
            return parameter.restrictions?.multipleChoices ? Array.from(new Set(matched)) : matched[0];
        };

        setAllegroFormData((previous) => {
            const next = { ...previous };
            monitorAllegroParameters.forEach((parameter) => {
                if (!parameter.required && !parameter.requiredForProduct) return;
                const existing = next[parameter.name];
                if (Array.isArray(existing) ? existing.length > 0 : String(existing ?? "").trim()) return;
                const normalizedName = normalizeValue(parameter.name);
                const candidate = explicitValues[normalizedName] ?? shoperValues.get(normalizedName);
                if (candidate == null || String(candidate).trim() === "") return;
                const matchedValue = matchDictionaryValue(parameter, candidate) as string | string[];
                if (Array.isArray(matchedValue) ? matchedValue.length > 0 : String(matchedValue ?? "").trim()) {
                    next[parameter.name] = matchedValue;
                }
            });
            return next;
        });
    }, [
        monitorAllegroParameters,
        allegroProducerName,
        model,
        diagonal,
        resolution,
        typeOfMatrix,
        refreshRate,
        responseTime,
        brightness,
        contrast,
        connectors,
        HDR,
        pivot,
        allAttributes,
        watch,
    ]);

    const handleAddAllegroOffer = async () => {
        if (!props.accessTokenAllegro) {
            toast.error("Brak tokenu Allegro. Zaloguj się ponownie.");
            return;
        }
        if (!responsibleProducerId) {
            toast.error("Wybierz producenta odpowiedzialnego.");
            return;
        }
        if (!imageLinks.length) {
            toast.error("Dodaj co najmniej jedno zdjęcie monitora.");
            return;
        }

        const missingRequired = monitorAllegroParameters
            .filter((parameter) => parameter.required)
            .filter((parameter) => {
                const value = allegroFormData[parameter.name];
                return Array.isArray(value) ? value.length === 0 : !String(value ?? "").trim();
            })
            .map((parameter) => parameter.name);
        if (missingRequired.length) {
            toast.error(`Uzupełnij wymagane parametry Allegro: ${missingRequired.slice(0, 5).join(", ")}${missingRequired.length > 5 ? "…" : ""}`);
            return;
        }

        const title = name.trim();
        const price = Number(getValues("price"));
        const stock = Number(getValues("stock"));
        if (!title || title.length > 75) {
            toast.error("Tytuł Allegro musi mieć od 1 do 75 znaków.");
            return;
        }
        if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0) {
            toast.error("Podaj poprawną cenę i ilość dla Allegro.");
            return;
        }

        const descriptionAllegroTemplate = {
            sections: allegroTemplate.sections
                .map((section) => ({
                    items: section.items.flatMap((item): TemplateItem[] => {
                        if (item.type === "TEXT" && item.content.trim()) {
                            return [{ type: "TEXT", content: item.content }];
                        }
                        if (item.type === "IMAGE" && item.url.trim()) {
                            return [{ type: "IMAGE", url: item.url.trim() }];
                        }
                        return [];
                    }),
                }))
                .filter((section) => section.items.length > 0),
        };
        if (!descriptionAllegroTemplate.sections.length) {
            toast.error("Opis Allegro nie zawiera żadnej sekcji.");
            return;
        }

        const templateImages = Array.from(new Set(
            descriptionAllegroTemplate.sections.flatMap((section) =>
                section.items.flatMap((item) => item.type === "IMAGE" ? [item.url] : [])
            ),
        ));
        if (templateImages.length > ALLEGRO_MONITOR_IMAGE_LIMIT) {
            toast.error(`Opis zawiera ${templateImages.length} różnych zdjęć. Allegro pozwala użyć maksymalnie ${ALLEGRO_MONITOR_IMAGE_LIMIT}.`);
            return;
        }
        const templateImageSet = new Set(templateImages);
        const productImagesUsedInDescription = imageLinks.filter((url) => templateImageSet.has(url));
        const optionalProductImages = imageLinks
            .filter((url) => !templateImageSet.has(url))
            .slice(0, ALLEGRO_MONITOR_IMAGE_LIMIT - templateImages.length);
        const templateImagesOutsideProductGallery = templateImages.filter((url) => !imageLinks.includes(url));
        const offerImages = Array.from(new Set([
            ...productImagesUsedInDescription,
            ...optionalProductImages,
            ...templateImagesOutsideProductGallery,
        ]));
        const productParameters = buildOfferParameters(
            allegroFormData,
            true,
            monitorAllegroParameters,
        );
        const offerParameters = buildOfferParameters(
            allegroFormData,
            false,
            monitorAllegroParameters,
        );
        const productData = {
            name: title,
            productSet: [{
                product: {
                    ...(connectProductAllegro && selectedProductId
                        ? { id: selectedProductId, idType: "GTIN" }
                        : {}),
                    name: title,
                    category: { id: ALLEGRO_MONITOR_CATEGORY_ID },
                    parameters: productParameters,
                    images: offerImages,
                },
                responsibleProducer: {
                    type: "ID",
                    id: responsibleProducerId,
                },
                safetyInformation: {
                    type: "TEXT",
                    description: "Monitor należy ustawić na stabilnej powierzchni i użytkować w suchym, wentylowanym miejscu. Należy korzystać ze sprawnego przewodu zasilającego, nie zasłaniać otworów wentylacyjnych i odłączyć urządzenie od zasilania przed czyszczeniem. Uszkodzony przewód lub obudowa wymagają kontroli serwisu.",
                },
            }],
            sellingMode: {
                format: "BUY_NOW",
                price: { amount: price.toFixed(2), currency: "PLN" },
            },
            stock: { available: Math.trunc(stock) },
            publication: { status: "INACTIVE" },
            ...(offerParameters.length ? { parameters: offerParameters } : {}),
            external: { id: String(getValues("SKU") ?? "").trim() },
            delivery: {
                shippingRates: { name: ALLEGRO_MONITOR_SHIPPING_RATE },
            },
            afterSalesServices: {
                impliedWarranty: { name: "Standardowe" },
                returnPolicy: { name: "15 dni Myślenice" },
            },
            description: descriptionAllegroTemplate,
        };

        setAddingAllegroOffer(true);
        try {
            await axios.post(`${API_URL}/product/allegroProduct`, productData, {
                headers: { Authorization: `Bearer ${props.accessTokenAllegro}` },
            });
            toast.success("Utworzono nieaktywny szkic monitora na Allegro.");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;
                const allegroError = apiError?.errors?.[0];
                const message = allegroError?.userMessage
                    || allegroError?.message
                    || apiError?.message
                    || error.message;
                console.error("Błąd wystawiania monitora na Allegro:", apiError);
                toast.error(`Błąd Allegro: ${message}`);
            } else {
                console.error("Błąd aplikacji podczas wystawiania monitora:", error);
                toast.error("Nie udało się utworzyć szkicu na Allegro.");
            }
        } finally {
            setAddingAllegroOffer(false);
        }
    };

    useEffect(() => {
        if (typeOfMatrix == "IPS") {
            showTN = 'none !important'
            showIPS = ''
        }
        if (typeOfMatrix == "TN") {
            showTN = ''
            showIPS = 'none !important'
        }
        if (additionalInfo == "") {
            showAdditionalInfo = ""
            showAdditionalInfoCZ = ""
            showAdditionalInfoSK = ""
        }
        else {
            showAdditionalInfo = `<li>${additionalInfo}</li>`
            showAdditionalInfoCZ = `<li>${additionalInfoCZ}</li>`
            showAdditionalInfoSK = `<li>${additionalInfoSK}</li>`
        }

        if (pivot == "Tak") {
            showPivot = ""
        }
        else {
            showPivot = "none"
        }
        const chasingConditionDesc = monitorCaseVC[chasingCondition] ?? "";
        const chasingConditionDescCZ = monitorCaseVC_CZ[chasingCondition] ?? "";
        const chasingConditionDescSK = monitorCaseVC_SK[chasingCondition] ?? "";
        const visualConditionDesc = monitorVC[visualCondition] ?? "";
        const visualConditionDescCZ = monitorVC_CZ[visualCondition] ?? "";
        const visualConditionDescSK = monitorVC_SK[visualCondition] ?? "";

        chasingCondition_CZ = chasingCondition_CZ + chasingConditionDescCZ;
        chasingCondition_SK = chasingCondition_SK + chasingConditionDescSK;
        chasingCondition = chasingCondition + " (" + chasingConditionDesc + ")";
        visualCondition_CZ = visualConditionDescCZ;
        visualCondition_SK = visualConditionDescSK;
        visualCondition = visualCondition + " (" + visualConditionDesc + ")";
        const trimmedArray = String(connectors ?? "").split(",").map(item => item.trim());
        const formattedString = trimmedArray.map(item => `<li>${item}</li>`).join("\n");
        setPortsListString(formattedString);

        setValue("description", monitorTemplate(
            producent,
            name,
            model,
            visualCondition,
            resolution,
            chasingCondition,
            diagonal,
            typeOfBlacklight,
            refreshRate,
            responseTime,
            brightness,
            contrast,
            connectors,
            HDR,
            showPivot,
            showAdditionalInfo,
            showIPS,
            showTN,
            formattedString,
            extraFeatures,
            speakers
        ));
        setValue("descriptionCZ", monitorTemplateCZ(
            producent,
            nameCZ,
            model,
            visualCondition_CZ,
            resolution,
            chasingCondition_CZ,
            diagonal,
            typeOfBlacklight,
            refreshRate,
            responseTime,
            brightness,
            contrast,
            connectors,
            HDR,
            showPivot,
            showAdditionalInfoCZ,
            showIPS,
            showTN,
            formattedString,
            extraFeaturesCZ || extraFeatures,
            speakers
        ));
        setValue("descriptionSK", monitorTemplateSK(
            producent,
            nameSK,
            model,
            visualCondition_SK,
            resolution,
            chasingCondition_SK,
            diagonal,
            typeOfBlacklight,
            refreshRate,
            responseTime,
            brightness,
            contrast,
            connectors,
            HDR,
            showPivot,
            showAdditionalInfoSK,
            showIPS,
            showTN,
            formattedString,
            extraFeaturesSK || extraFeatures,
            speakers
        ));
    }, [producent,
        name,
        nameCZ,
        nameSK,
        model,
        visualCondition,
        resolution,
        chasingCondition,
        diagonal,
        typeOfBlacklight,
        refreshRate,
        responseTime,
        brightness,
        contrast,
        connectors,
        HDR,
        speakers,
        pivot,
        additionalInfo,
        additionalInfoCZ,
        additionalInfoSK,
        extraFeatures,
        extraFeaturesCZ,
        extraFeaturesSK,
        typeOfMatrix,
        setValue]);

    return (
        <>
            <div className="addProductMainContainer">
                <form className="shoper-import-form" onChangeCapture={onImportedFieldChange} onReset={clearImportedFields} onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column' }}>
                    <ShoperImportedFieldStyles fields={importedFields} />
                    <RelatedProductsSelect authToken={props.authToken} value={relatedPackId} onChange={setRelatedPackId} />
                    <Box
                        sx={{ py: 2, display: 'grid', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <ThemeProvider theme={MainTheme}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr auto' }, gap: 2, alignItems: 'center' }}>
                                <TextField
                                    label="ID aukcji Shoper"
                                    value={shoperOfferId}
                                    onChange={(e) => setShoperOfferId(e.target.value)}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={handleFetchShoperOffer}
                                    disabled={loadingShoperOffer}
                                >
                                    {loadingShoperOffer ? "Pobieranie..." : "Pobierz z Shopera"}
                                </Button>
                            </Box>
                            <FormControl fullWidth >
                                <InputLabel>język opisu</InputLabel>
                                <Select
                                    label="język opisu"
                                    {...register("descriptionLanguage")}
                                    defaultValue={"description"}
                                >
                                    <MenuItem value="description">Polski</MenuItem>
                                    <MenuItem value="descriptionCZ">Czeski</MenuItem>
                                    <MenuItem value="descriptionSK">Słowacki</MenuItem>
                                    <MenuItem value="descriptionAllegro">Allegro</MenuItem>

                                </Select>
                            </FormControl>
                            <Box sx={{ borderRadius: 1, boxShadow: 1, p: 2, backgroundColor: "rgb(55, 61, 77)" }}>
                                <FormControlLabel
                                    control={<Checkbox defaultChecked {...register("connectProductAllegro")} />}
                                    label="Połącz z produktem Allegro"
                                />
                                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                    <TextField
                                        variant="filled"
                                        size="small"
                                        value={searchName}
                                        onChange={(event) => setSearchName(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                event.preventDefault();
                                                void handleSearchAllegroProduct();
                                            }
                                        }}
                                        placeholder="Wyszukaj produkt Allegro"
                                        fullWidth
                                    />
                                    <Button
                                        type="button"
                                        variant="contained"
                                        onClick={handleSearchAllegroProduct}
                                        disabled={!props.accessTokenAllegro}
                                    >
                                        Szukaj
                                    </Button>
                                </Box>
                                <Button
                                    type="button"
                                    sx={{ mt: 2, fontSize: "15px" }}
                                    onClick={handleImportAllegroFormToShoper}
                                >
                                    Importuj dane z Allegro
                                </Button>
                                {selectedProductId ? (
                                    <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.8 }}>
                                        Wybrany produkt: {selectedProductId}
                                    </Typography>
                                ) : null}
                            </Box>
                            <h2>Dodaj monitor</h2>
                            <FormControlLabel control={<Checkbox defaultChecked {...register("active")} />} label="Aktywność" />
                            <TextField label="Tytuł" type="text"{...register("name", {
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
                                        value={
                                            producers.find(
                                                (option) => String(option?.producer_id) === String(field.value)
                                            ) ?? null
                                        }
                                        isOptionEqualToValue={(option, value) =>
                                            String(option?.producer_id) === String(value?.producer_id)
                                        }
                                        renderOption={(props, option) => (
                                            <li {...props} key={option?.producer_id}>
                                                {option?.name ?? ""}
                                            </li>
                                        )}
                                        renderInput={(params) => <TextField {...params} name="producer" label="Producent" />}
                                        onChange={(_, value) => {
                                            field.onChange(value?.producer_id ?? "");
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
                                            name={field.name}
                                            labelId="product-safety-producer-label"
                                            label="Product Safety Producer"
                                            value={field.value != null ? String(field.value) : ""}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        >
                                            <MenuItem value="">—</MenuItem>
                                            {productSafetyProducers.length === 0 ? (
                                                <MenuItem value="" disabled>
                                                    Brak danych
                                                </MenuItem>
                                            ) : null}
                                            {productSafetyProducers.map((producer) => {
                                                const id = getProductSafetyProducerId(producer);
                                                if (id == null) return null;
                                                return (
                                                    <MenuItem key={id} value={String(id)}>
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
                                            name={field.name}
                                            multiple
                                            labelId="product-safety-certificates-label"
                                            label="Product Safety Certificates"
                                            value={Array.isArray(field.value) ? field.value.map(String) : []}
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
                                                    <MenuItem key={id} value={String(id)}>
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

                            {/* Pole "Stan" i inne bazowe są teraz pobierane z atrybutów Shopera */}
                            <TextField label="SKU" InputLabelProps={{ shrink: true }} {...register("SKU")} />
                            <TextField label="Ilość" type="number" InputLabelProps={{ shrink: true }} {...register("stock")} />
                            <TextField label="Cena" type="number" inputProps={{ step: "0.01" }} InputLabelProps={{ shrink: true }} {...register("price")} />
                            <label >opis</label>
                            <textarea defaultValue={monitorTemplate('', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '')}  {...register("description")} />

                            {/* Dynamiczne pola z grupy atrybutów bazowych (np. Stan, Gwarancja) */}
                            {baseAttributes.length > 0 ? (
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                                        gap: 2,
                                    }}
                                >
                                    {baseAttributes.map((attr) => renderAttributeControl(attr))}
                                </Box>
                            ) : null}

                            {/* Dynamiczne pola z grupy atrybutów monitora */}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                                    gap: 2,
                                }}
                            >
                            {monitorAttributes.map((attr) => renderAttributeControl(attr))}
                            </Box>
                            {/* Kontrast i stan obudowy są teraz pobierane jako atrybuty z Shopera */}

                            {!loadingAttributes && allAttributes.length > 0 && !extraFeaturesAttributeId && (
                                <Typography variant="body2" color="warning.main">
                                    Dodaj atrybut tekstowy „Dodatkowe cechy” do grupy 50 w Shoperze, aby wpisywać funkcje monitora.
                                </Typography>
                            )}

                            <FormControlLabel control={<Checkbox  {...register("frame")} />} label="ultra cienka ramka" />
                            <FormControlLabel control={<Checkbox  {...register("design")} />} label="nowoczesny design" />
                            <ProductImageManager {...images} />

                            <Box
                                sx={{
                                    mt: 2,
                                    p: 2,
                                    display: "grid",
                                    gap: 2,
                                    borderRadius: 2,
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    backgroundColor: "rgba(20, 23, 33, 0.35)",
                                }}
                            >
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    Wystaw bezpośrednio na Allegro
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                                    Oferta zostanie utworzona jako nieaktywny szkic w kategorii Monitory.
                                    Parametry uzupełniamy automatycznie z atrybutów Shopera, a brakujące
                                    wartości możesz poprawić poniżej.
                                </Typography>

                                {!props.accessTokenAllegro ? (
                                    <Typography color="error">
                                        Brak tokenu Allegro. Użyj przycisku „Zaloguj przez Allegro” u góry strony.
                                    </Typography>
                                ) : null}

                                <Stack spacing={2}>
                                    <ResponsibleProducerSelect
                                        data={responsibleData}
                                        value={responsibleProducerId}
                                        onChange={setResponsibleProducerId}
                                    />
                                </Stack>

                                {loadingAllegroData ? (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CircularProgress size={20} />
                                        <Typography>Pobieranie parametrów Allegro…</Typography>
                                    </Stack>
                                ) : (
                                    <AllegroMonitorParameters
                                        Parameters={monitorAllegroParameters}
                                        formData={allegroFormData}
                                        register={register}
                                        handleChangeAllegro={(parameterName, value) => {
                                            setAllegroFormData((previous) => ({
                                                ...previous,
                                                [parameterName]: value,
                                            }));
                                        }}
                                        isParamDisabled={(parameterName) =>
                                            connectProductAllegro && lockedParams.has(parameterName)
                                        }
                                    />
                                )}

                                <Button
                                    type="button"
                                    variant="contained"
                                    color="success"
                                    onClick={handleAddAllegroOffer}
                                    disabled={
                                        !props.accessTokenAllegro
                                        || loadingAllegroData
                                        || addingAllegroOffer
                                        || !images.imagesReady
                                        || images.uploadingImages
                                    }
                                >
                                    {addingAllegroOffer
                                        ? "Tworzenie szkicu…"
                                        : "Wystaw monitor na Allegro"}
                                </Button>
                            </Box>

                            <Button variant="outlined" type="reset"  >Reset formularza</Button>
                            <ApiloSubmitControls addToApilo={addToApilo} onChange={setAddToApilo}>
                                <Button variant="contained" type="submit" disabled={!images.imagesReady || images.uploadingImages}>Dodaj</Button>
                            </ApiloSubmitControls>
                            <Button
                                variant="contained"
                                color="warning"
                                onClick={handleSubmit(handleUpdateProduct)}
                                disabled={updatingProduct || !images.imagesReady || images.uploadingImages}
                            >
                                {updatingProduct ? "Aktualizowanie..." : "Aktualizuj w Shoperze"}
                            </Button>
                        </ThemeProvider>
                    </Box>
                </form>
                {descriptionLanguage === "descriptionAllegro" ? (
                    <AllegroDescriptionEditor
                        template={allegroTemplate}
                        onChange={setAllegroTemplate}
                        availableImages={[
                            ...imageLinks,
                            ...automaticAllegroDescription.assetImages,
                        ]}
                        onRemoveAutoSection={(sectionId) => {
                            setRemovedAutoSections((previous) => {
                                const next = new Set(previous);
                                next.add(sectionId);
                                return next;
                            });
                        }}
                        onRestoreAutomaticSections={() => {
                            setRemovedAutoSections(new Set());
                            setAllegroTemplate((previous) => ({
                                sections: [
                                    ...automaticAllegroDescription.description.sections,
                                    ...previous.sections.filter((section) => section.origin === "user"),
                                ],
                            }));
                        }}
                    />
                ) : null}
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
                    {descriptionLanguage === "descriptionAllegro" && (
                        <AllegroDescriptionPreview
                            template={allegroTemplate}
                            onChange={setAllegroTemplate}
                            availableImages={[
                                ...imageLinks,
                                ...automaticAllegroDescription.assetImages,
                            ]}
                        />
                    )}
                </div>
            </div>

            <AllegroSearchResults
                showSearchresult={showSearchresult}
                searchResult={searchResult}
                selectedProductId={selectedProductId}
                setShowSearchresult={setShowSearchresult}
                handleSelectAllegroProduct={handleSelectAllegroMonitor}
            />

        </>
    );
}

export default AddMonitor;
