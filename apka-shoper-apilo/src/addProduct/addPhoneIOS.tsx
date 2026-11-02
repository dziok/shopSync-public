import axios from "axios";
import { useForm, SubmitHandler, Controller, type Path, type PathValue } from "react-hook-form"
import { useEffect, useRef, useState } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Autocomplete, Box, Button, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, TextField, ThemeProvider, Typography } from "@mui/material";
import { MainTheme } from "./themes";
import { API_URL } from "../config";
import './addProducts.css';
import { ProductImageManager, useProductImages } from "./productImageManager";
import { IOSTemplate } from "./templates/iosTemplate";
import { matrixGradeDescriptios } from "./templates/laptopTemplate";
import { monitorVC, pcVC } from "./additionalDescriptions/visualConditionDescriptions";
import { systemType } from "./additionalDescriptions/pcAdditionalDescription";
import { ProductSafetyCertificateResource, ProductSafetyProducerResource } from "../types";
import { handleGetProductSafetyProducers } from "../backendQueries/getProductSafetyProducers";
import { handleGetProductSafetyCertificates } from "../backendQueries/getProductSafetyCertificates";
import RelatedProductsSelect from "../relatedProductsSelect";
import { getShoperErrorMessage } from "../backendQueries/shoperErrorMessage";
import { getApiErrorMessage } from "../backendQueries/apiErrorMessage";
import { UpdateProductShoper } from "../backendQueries/updateProductShoper";
import { AddImageShoper } from "../backendQueries/addImageShoper";
import { buildPhoneShoperAttributes, formatPhoneMatrixGrade, isPhoneEnabled, missingPhoneAttributes, phoneAttributeGroupIds, PHONE_ATTRIBUTE_GROUP_ID } from "./phoneShoperAttributes";
import { phoneDescriptionSignature, phoneOfferFormAttributes, phoneOfferGroupIds, phoneOfferProduct } from "./phoneShoperOffer";
import { ShoperImportedFieldStyles, shoperFieldWasProvided, useShoperImportedFields } from "./shoperImportedFields";
import { PhoneAdditionalShoperFields, PhoneGroupPicker, PhoneShoperSelect, usePhoneAvailableGroups, usePhoneCategoryGroups, usePhoneShoperAttributes } from "./phoneShoperFields";
import { ApiloSubmitControls } from "./apiloSubmitControls";

type AddphoneIOSProps = {
    authToken: string,
}

interface IFormInput {
    model: string,
    cpu: string,
    ramAmount: string
    diskSize: string,
    screen: string,
    battery: string,
    SKU: string,
    name: string,
    category: string,
    stock: number,
    price: number,
    description: string,
    active: boolean,
    producer: string,
    frontCamera: string,
    backCamera: string,
    waterproof: boolean | string,
    dualSim: boolean | string,
    connection: string,
    wirelessCharging: boolean | string,
    NFC: boolean | string,
    resolution: string,
    batteryCapacity: string,
    batteryStatus: string,
    diagonal: string,
    system: string,
    G5: boolean | string,
    additionalInfo: string,
    screenName: string,
    simType: string,
    matrixGrade: string,
    caseGrade: string,
    lens_ultraWide: boolean | string,
    lens_tele: boolean | string,
    lens_lidar: boolean | string,
    productSafetyProducerId?: number,
    productSafetyCertificateIds?: number[],
    productSafetyWarnings?: string[],

}
let deviceType = ""
function AddPhoneIOS(props: AddphoneIOSProps) {
    const { register, handleSubmit, watch, setValue, getValues, reset, control } = useForm<IFormInput>()
    const images = useProductImages();
    const { selectedImages, setSelectedImages, imageLinks, setImageLinks } = images;
    const [addToApilo, setAddToApilo] = useState(true);
    const [productSafetyProducers, setProductSafetyProducers] = useState<ProductSafetyProducerResource[]>([]);
    const [productSafetyCertificates, setProductSafetyCertificates] = useState<ProductSafetyCertificateResource[]>([]);
    const [relatedPackId, setRelatedPackId] = useState("");
    const [shoperOfferId, setShoperOfferId] = useState("");
    const [loadedOfferId, setLoadedOfferId] = useState<number | null>(null);
    const [loadingShoperOffer, setLoadingShoperOffer] = useState(false);
    const [updatingProduct, setUpdatingProduct] = useState(false);
    const [pendingOffer, setPendingOffer] = useState<{ id: number; product: Record<string, unknown> } | null>(null);
    const { importedFields, clearImportedFields, markImportedFields, onImportedFieldChange } = useShoperImportedFields();
    const [offerGroups, setOfferGroups] = useState<{ categoryId: number; ids: number[] } | null>(null);
    const importingOffer = useRef(false);
    const importedDescriptionSignature = useRef<string | null>(null);
    const hydratedOfferFields = useRef(new Set<string>());
    const completedOfferImport = useRef(false);
    const [manualAttributeGroupId, setManualAttributeGroupId] = useState("");
    const categoryId = watch("category");
    const categoryGroups = usePhoneCategoryGroups(API_URL, props.authToken, Number(categoryId), null);
    const hasCategoryAttributeGroup = categoryGroups.groupIds.some(id => id !== PHONE_ATTRIBUTE_GROUP_ID);
    const availableGroups = usePhoneAvailableGroups(API_URL, props.authToken, Boolean(categoryId) && !categoryGroups.loading && !hasCategoryAttributeGroup);
    const groupIds = phoneAttributeGroupIds([
        ...categoryGroups.groupIds,
        ...(offerGroups?.categoryId === Number(categoryId) ? offerGroups.ids : []),
    ], manualAttributeGroupId);
    const phoneAttributes = usePhoneShoperAttributes(API_URL, props.authToken, groupIds);
    let apiloImageUUIDs: string[] = [];

    useEffect(() => { setManualAttributeGroupId(""); }, [categoryId]);

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
    }, [props.authToken]);

    const {
    } = useForm<String>()

    const handleFetchShoperOffer = async () => {
        const id = Number(shoperOfferId.trim());
        if (!Number.isInteger(id) || id <= 0) {
            toast.error("Podaj poprawne ID produktu Shoper.");
            return;
        }
        setLoadingShoperOffer(true);
        clearImportedFields();
        setLoadedOfferId(null);
        setPendingOffer(null);
        hydratedOfferFields.current.clear();
        completedOfferImport.current = false;
        importedDescriptionSignature.current = null;
        importingOffer.current = true;
        try {
            const response = await axios.get(`${API_URL}/product/${id}`, {
                headers: { Authorization: `Bearer ${props.authToken}` },
            });
            const product = phoneOfferProduct(response.data);
            const productCategoryId = Number(product.category_id);
            if (!Number.isInteger(productCategoryId) || productCategoryId <= 0) {
                throw new Error("Produkt nie ma poprawnej kategorii Shoper.");
            }
            reset();
            setSelectedImages([]);
            setImageLinks([]);
            setRelatedPackId("");
            const translations = product.translations as Record<string, any> | undefined;
            const pl = translations?.pl_PL;
            if (pl?.name != null) setValue("name", String(pl.name));
            if (pl?.active != null || product.active != null) setValue("active", isPhoneEnabled(pl?.active ?? product.active));
            if (product.code != null) setValue("SKU", String(product.code));
            const stock = product.stock as Record<string, unknown> | undefined;
            if (stock?.price != null) setValue("price", Number(stock.price));
            if (stock?.stock != null) setValue("stock", Number(stock.stock));
            const safety = product.safety_information as Record<string, unknown> | undefined;
            const producerId = normalizeIdValue(safety?.gpsr_producer_id ?? product.product_safety_producer_id);
            if (typeof producerId === "number") setValue("productSafetyProducerId", producerId);
            const certificates = safety?.gpsr_certificates ?? product.product_safety_certificate_ids;
            if (certificates != null) {
                setValue("productSafetyCertificateIds", (Array.isArray(certificates) ? certificates : [certificates])
                    .map(normalizeIdValue).filter((value): value is number => typeof value === "number"));
            }
            setOfferGroups({ categoryId: productCategoryId, ids: phoneOfferGroupIds(product) });
            setValue("category", String(productCategoryId));
            setPendingOffer({ id, product });
            const imported: string[] = ["category"];
            if (shoperFieldWasProvided(pl?.name)) imported.push("name");
            if (shoperFieldWasProvided(pl?.active) || shoperFieldWasProvided(product.active)) imported.push("active");
            if (shoperFieldWasProvided(product.code)) imported.push("SKU");
            if (shoperFieldWasProvided(stock?.price)) imported.push("price");
            if (shoperFieldWasProvided(stock?.stock)) imported.push("stock");
            if (typeof producerId === "number") imported.push("productSafetyProducerId");
            if (shoperFieldWasProvided(certificates)) imported.push("productSafetyCertificateIds");
            markImportedFields(imported);
        } catch (error) {
            importingOffer.current = false;
            toast.error(getApiErrorMessage(error, "Nie udało się pobrać produktu Shoper."));
        } finally {
            setLoadingShoperOffer(false);
        }
    };

    useEffect(() => {
        if (!pendingOffer || Number(categoryId) !== Number(pendingOffer.product.category_id) ||
            categoryGroups.loading || phoneAttributes.loading) return;
        if (phoneAttributes.error) {
            importingOffer.current = false;
            setPendingOffer(null);
            toast.error(phoneAttributes.error);
            return;
        }
        const values = phoneOfferFormAttributes(pendingOffer.product, phoneAttributes.attributes);
        const newlyHydrated: string[] = [];
        for (const [key, value] of Object.entries(values)) {
            if (hydratedOfferFields.current.has(key)) continue;
            setValue(key as Path<IFormInput>, value as PathValue<IFormInput, Path<IFormInput>>);
            hydratedOfferFields.current.add(key);
            newlyHydrated.push(key);
        }
        if (newlyHydrated.length) markImportedFields(newlyHydrated);
        if (!completedOfferImport.current) {
            const translations = pendingOffer.product.translations as Record<string, any> | undefined;
            if (translations?.pl_PL?.description != null) {
                importedDescriptionSignature.current = phoneDescriptionSignature(getValues());
                setValue("description", String(translations.pl_PL.description));
                if (shoperFieldWasProvided(translations.pl_PL.description)) markImportedFields(["description"]);
            }
            completedOfferImport.current = true;
            setLoadedOfferId(pendingOffer.id);
            toast.success("Dane produktu Shoper zostały pobrane.");
        } else if (importedDescriptionSignature.current) {
            importedDescriptionSignature.current = phoneDescriptionSignature(getValues());
        }
        importingOffer.current = false;
    }, [pendingOffer, categoryId, categoryGroups.loading, phoneAttributes.loading, phoneAttributes.attributes,
        hasCategoryAttributeGroup, manualAttributeGroupId, getValues, setValue, markImportedFields]);

    const handleUpdateProduct = async (data: IFormInput) => {
        if (!loadedOfferId || Number(shoperOfferId.trim()) !== loadedOfferId) {
            toast.error("Najpierw pobierz produkt Shoper po ID.");
            return;
        }
        if (categoryGroups.loading || phoneAttributes.loading || phoneAttributes.error || !phoneAttributes.attributes.length) {
            toast.error(phoneAttributes.error || "Poczekaj na pobranie atrybutów Shoper.");
            return;
        }
        if (selectedImages.length && imageLinks.length !== selectedImages.length) {
            toast.error("Poczekaj na przygotowanie wybranych zdjęć.");
            return;
        }
        setUpdatingProduct(true);
        try {
            const original = pendingOffer?.id === loadedOfferId ? pendingOffer.product : null;
            const originalStock = original?.stock as Record<string, unknown> | undefined;
            const safetyProducerId = normalizeIdValue(data.productSafetyProducerId);
            const safetyCertificateIds = (data.productSafetyCertificateIds ?? [])
                .map(normalizeIdValue).filter((value): value is number => typeof value === "number");
            await UpdateProductShoper({
                productId: loadedOfferId,
                basePayload: {
                    producer_id: original?.producer_id ?? 157,
                    category_id: data.category,
                    code: data.SKU,
                    pkwiu: original?.pkwiu ?? "-",
                    stock: { price: data.price, active: originalStock?.active ?? 1, stock: data.stock,
                        delivery_id: originalStock?.delivery_id ?? 1 },
                    attributes: buildPhoneShoperAttributes(phoneAttributes.attributes, data, false),
                    gauge_id: original?.gauge_id ?? 5,
                    ...(safetyProducerId ? { product_safety_producer_id: safetyProducerId } : {}),
                    ...(safetyCertificateIds.length ? { product_safety_certificate_ids: safetyCertificateIds } : {}),
                    ...(relatedPackId ? { related_pack_id: relatedPackId } : {}),
                },
                translations: { pl_PL: { name: data.name, description: data.description, active: data.active } },
                props,
            });
            if (selectedImages.length) await AddImageShoper(loadedOfferId, selectedImages, imageLinks, props);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Nie udało się zaktualizować produktu Shoper.", phoneAttributes.attributes));
        } finally {
            setUpdatingProduct(false);
        }
    };


    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        try {
            if (categoryGroups.loading || phoneAttributes.loading || phoneAttributes.error || !phoneAttributes.attributes.length ||
                (!hasCategoryAttributeGroup && !manualAttributeGroupId)) {
                throw new Error(phoneAttributes.error || "Wybierz grupę atrybutów kategorii i poczekaj na pobranie atrybutów Shoper.");
            }
            const shoperAttributes = buildPhoneShoperAttributes(phoneAttributes.attributes, data);
            //dodaj zdjęcia do apilo
            if (addToApilo) try {
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
                producer_id: 157,
                category_id: data.category,
                code: data.SKU,
                pkwiu: "-",
                translations: {
                    pl_PL: {
                        name: data.name,
                        description: data.description,
                        active: data.active
                    }
                },
                stock: {
                    price: data.price,
                    active: 1,
                    stock: data.stock,
                    delivery_id: 1
                },

                attributes: shoperAttributes,
                gauge_id: 5,
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
            //dodaj produkt do  apilo
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
                            "id": 100,
                            "productId": apiloResponse.data.products[ApiloAddedProductsFirstKey],
                            "type": 9,
                            "values": [
                                {
                                    "value": `<p>✅ Stan matrycy - <b>${formatPhoneMatrixGrade(matrixGrade, monitorVC[matrixGrade])}</b></p><p>${additionalInfo}</p>`

                                }
                            ]
                        },
                        {
                            "id": 103,
                            "productId": apiloResponse.data.products[ApiloAddedProductsFirstKey],
                            "type": 9,
                            "values": [
                                {
                                    "value": `
                                    <ul>
                                        <li><b>Model:</b> ${data.model}</li>
                                        <li><b>Procesor:</b> ${data.cpu}</li>
                                        <li><b>RAM:</b> ${data.ramAmount}</li>
                                        <li><b>Pamięć:</b> ${data.diskSize}</li>
                                        <li><b>Ekran:</b> przekątna ${data.diagonal}", ${data.screen} ${data.screenName}, rozdzielczość: ${data.resolution} px</li>
                                        <li><b>Aparat:</b> tył: ${data.backCamera}, przód: ${data.frontCamera}, ${isPhoneEnabled(data.lens_ultraWide) ? "obiektyw szerokokątny, " : ""} ${isPhoneEnabled(data.lens_tele) ? "teleobiektyw, " : ""} ${isPhoneEnabled(data.lens_lidar) ? "czujnik głębi (LIDAR)" : ""}</li>
                                        <li><b>Łączność:</b> Bluetooth, ${isPhoneEnabled(data.G5) ? "5G, " : ""} ${isPhoneEnabled(data.NFC) ? "NFC" : ""} WIFI</li>
                                        <li><b>System:</b> ${data.system}</li>
                                        <li><b>Ładowanie:</b> ${isPhoneEnabled(data.wirelessCharging) ? "bezprzewodowe, przewodowe" : "przewodowe"}</li>
                                        <li><b>Złącze:</b> ${data.connection}</li>
                                        <li><b>${isPhoneEnabled(data.dualSim) ? "Dual sim:" : "Rodzaj karty SIM"}</b>  ${data.simType} </li>
                                        <li><b>Pojemność baterii:</b> ${data.batteryCapacity}mAh</li>
                                        <li><b>Stan baterii:</b> ${data.batteryStatus}%</li>
                                    </ul>
                                    `
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
            toast.success(addToApilo
                ? `Produkt ${response.data} został dodany do Shopera i Apilo.`
                : `Produkt ${response.data} został dodany do Shopera.`);

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

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd HTTP:", error.response?.status, error.response?.data);
                toast.error(getShoperErrorMessage(error, phoneAttributes.attributes));
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error(error instanceof Error ? error.message : getShoperErrorMessage(error, phoneAttributes.attributes));
            }

        };
        apiloImageUUIDs = []
    }

    let model = watch("model", "");
    let cpu = watch("cpu", "");
    let ramAmount = watch("ramAmount", "");
    let diskSize = watch("diskSize", "");
    let screen = watch("screen", "");
    let battery = watch("battery", "");
    let additionalInfo = watch("additionalInfo", "");
    let G5 = isPhoneEnabled(watch("G5", false));
    let NFC = isPhoneEnabled(watch("NFC", false));
    let wirelessCharging = isPhoneEnabled(watch("wirelessCharging", false));
    let waterproof = isPhoneEnabled(watch("waterproof", false));
    let dualSim = isPhoneEnabled(watch("dualSim", false));
    let lens_ultraWide = isPhoneEnabled(watch("lens_ultraWide", false));
    let lens_tele = isPhoneEnabled(watch("lens_tele", false));
    let lens_lidar = isPhoneEnabled(watch("lens_lidar", false));
    let screenName = watch("screenName", "")
    let matrixGrade = watch("matrixGrade", "")
    let resolution = watch("resolution", "")
    let diagonal = watch("diagonal", "")
    let category = watch("category", "")
    let backCamera = watch("backCamera", "")
    let frontCamera = watch("frontCamera", "")

    useEffect(() => {
        if (category == "314") {
            deviceType = "Iphone"
        }
        else {
            deviceType = "Ipad"
        }

    }, [category]);

    let description = watch("description", IOSTemplate(
        additionalInfo,
        G5,
        NFC,
        wirelessCharging,
        dualSim,
        waterproof,
        screenName,
        screen,
        "Stan matrycy - " + formatPhoneMatrixGrade(matrixGrade, monitorVC[matrixGrade]),
        resolution,
        diagonal,
        lens_ultraWide,
        lens_tele,
        lens_lidar,
        deviceType,
        backCamera,
        frontCamera
    ));
    useEffect(() => {
        if (importingOffer.current) return;
        if (importedDescriptionSignature.current === phoneDescriptionSignature(getValues())) return;
        importedDescriptionSignature.current = null;
        setValue("description", IOSTemplate(
            additionalInfo,
            G5,
            NFC,
            wirelessCharging,
            dualSim,
            waterproof,
            screenName,
            screen,
            "Stan matrycy - " + formatPhoneMatrixGrade(matrixGrade, monitorVC[matrixGrade]),
            resolution,
            diagonal,
            lens_ultraWide,
            lens_tele,
            lens_lidar,
            deviceType,
            backCamera,
            frontCamera
        ));
    }, [
        model,
        cpu,
        ramAmount,
        diskSize,
        screen,
        battery,
        additionalInfo,
        G5,
        NFC,
        wirelessCharging,
        dualSim,
        waterproof,
        screenName,
        screen,
        matrixGrade,
        resolution,
        diagonal,
        lens_ultraWide,
        lens_tele,
        lens_lidar,
        category,
        backCamera,
        frontCamera,
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
                            <h2>Dodaj urządzenie mobilne IOS</h2>
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <TextField size="small" label="ID produktu Shoper" type="number" value={shoperOfferId}
                                    onChange={event => { setShoperOfferId(event.target.value); setLoadedOfferId(null); setPendingOffer(null); importingOffer.current = false; }}
                                    disabled={loadingShoperOffer} fullWidth />
                                <Button type="button" variant="outlined" onClick={handleFetchShoperOffer}
                                    disabled={loadingShoperOffer} sx={{ minWidth: 100, alignSelf: "stretch" }}>
                                    {loadingShoperOffer ? "Pobieranie..." : "Pobierz"}
                                </Button>
                            </Box>
                            <FormControlLabel control={<Checkbox defaultChecked {...register("active")} />} label="Aktywność" />
                            <TextField label="SKU" InputLabelProps={{ shrink: true }} {...register("SKU")} />
                            <TextField label="Ilość" type="number" InputLabelProps={{ shrink: true }} {...register("stock")} />
                            <TextField label="Cena" type="number" inputProps={{ step: "0.01" }} InputLabelProps={{ shrink: true }} {...register("price")} />
                            <TextField label="Tytuł" type="text" InputLabelProps={{ shrink: true }} {...register("name")} />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="model" label="Model" />
                            <FormControl fullWidth >
                                <InputLabel>Kategoria</InputLabel>
                                <Select {...register("category")} label="kategoria">
                                    <MenuItem value="314">iPhone</MenuItem>
                                    <MenuItem value="331">iPad</MenuItem>
                                </Select>
                            </FormControl>
                            {categoryId && categoryGroups.loading ? <Typography variant="body2">Sprawdzanie grup atrybutów kategorii...</Typography> : null}
                            {categoryId && !categoryGroups.loading && !hasCategoryAttributeGroup ? (
                                <PhoneGroupPicker groups={availableGroups.groups.filter(group => group.attribute_group_id !== PHONE_ATTRIBUTE_GROUP_ID)} value={manualAttributeGroupId}
                                    onChange={setManualAttributeGroupId} error={categoryGroups.error || availableGroups.error} loading={availableGroups.loading} />
                            ) : null}
                            {categoryId ? <Typography variant="body2" color={phoneAttributes.error ? "error" : "text.secondary"}>
                                {phoneAttributes.error || (categoryGroups.loading || phoneAttributes.loading ? "Pobieranie atrybutów Shoper..." :
                                    phoneAttributes.attributes.length ? `Atrybuty Shoper (grupy ${groupIds.join(", ")}): ${phoneAttributes.attributes.length}. Brakujące: ${missingPhoneAttributes(phoneAttributes.attributes).join(", ") || "brak"}` : `Grupy ${groupIds.join(", ")} nie zawierają atrybutów.`)}
                            </Typography> : null}

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
                                            name={field.name}
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

                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="matrixGrade" label="Stan matrycy" />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="caseGrade" label="Stan obudowy" />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="additionalInfo" label="Uwagi" />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="frontCamera" label="Aparat przedni (MPX)" />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="backCamera" label="Aparat tylny (MPX)" />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="screen" label="Typ ekranu" />

                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="screenName" label="Nazwa ekranu" />

                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="system" label="System" />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="waterproof" label="Wodoodporność" checkbox />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="dualSim" label="Dual SIM" checkbox />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="wirelessCharging" label="Ładowanie bezprzewodowe" checkbox />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="NFC" label="NFC" checkbox />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="G5" label="5G" checkbox />

                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="lens_ultraWide" label="Obiektyw szerokokątny" checkbox />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="lens_tele" label="Teleobiektyw" checkbox />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="lens_lidar" label="Czujnik głębi (LIDAR)" checkbox />


                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="resolution" label="Rozdzielczość" />

                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="connection" label="Złącze" />

                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="simType" label="Rodzaj karty SIM" />

                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="cpu" label="Procesor" />

                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="batteryCapacity" label="Pojemność baterii (mAh)" inputType="number" />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="batteryStatus" label="Kondycja baterii (%)" inputType="number" />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="diagonal" label="Przekątna ekranu (cale)" />

                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="diskSize" label="Pojemność dysku" />
                            <PhoneShoperSelect control={control} attributes={phoneAttributes.attributes} field="ramAmount" label="Pamięć RAM" />

                            <PhoneAdditionalShoperFields control={control} attributes={phoneAttributes.attributes} />


                            <label >opis</label>
                            <textarea defaultValue={IOSTemplate('', false, false, false, false, false, "", "", '', '', '', false, false, false, '', '', '')}  {...register("description")} />

                            <ProductImageManager {...images} />

                            <Button variant="outlined" type="reset"  >Reset formularza</Button>
                            <ApiloSubmitControls addToApilo={addToApilo} onChange={setAddToApilo}>
                                <Button variant="contained" type="submit" disabled={!images.imagesReady || images.uploadingImages}>Dodaj</Button>
                            </ApiloSubmitControls>
                            <Button variant="outlined" type="button" disabled={!loadedOfferId || updatingProduct || loadingShoperOffer || !images.imagesReady || images.uploadingImages}
                                onClick={handleSubmit(handleUpdateProduct)}>
                                {updatingProduct ? "Aktualizowanie..." : "Zaktualizuj produkt Shoper"}
                            </Button>
                        </ThemeProvider>
                    </Box>
                </form>
                <div className="preview">
                    <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: description }} />
                </div>
            </div>

        </>
    );
}

export default AddPhoneIOS;
