import axios from "axios";
import { useForm, SubmitHandler, useWatch, Controller } from "react-hook-form";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./addProducts.css";
import 'setimmediate';
import { ProductImageManager, useProductImages } from "./productImageManager";
import {
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    Box,
    ThemeProvider,
    Autocomplete,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Typography,
    ListItemText,
    SelectChangeEvent,

} from "@mui/material";
import { MainTheme } from "./themes";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { EditorState, convertToRaw } from "draft-js";
// @ts-ignore
import draftToHtml from "draftjs-to-html";
import { API_URL } from "../config";
import { handleTranslateCZ, handleTranslateSK } from "../backendQueries/translate";
import { Product, SearchResult, FormDataAllegro, ProducersResource, Attribute, ProductSafetyCertificateResource, ProductSafetyProducerResource } from "../types";
import { gamingTemplate, gamingTemplateAllegro } from "./templates/gamingTemplate";
import { pcParametersAll } from "../allegroParameters/pcParametersAll";
import { gaming_cpuTypesDescriptions, gaming_cpuTypesDescriptions_CZ, gaming_cpuTypesDescriptions_SK, gaming_diskTypesDescriptions, gaming_diskTypesDescriptions_CZ, gaming_diskTypesDescriptions_SK, gaming_gpu, gaming_gpu_CZ, gaming_gpu_SK, gaming_ramTypesDescriptions, gaming_ramTypesDescriptions_CZ, gaming_ramTypesDescriptions_SK } from "./additionalDescriptions/gamingDescriptions";
import { gamingTemplateSK } from "./templatesSK/gamingTemplateSK";
import { gamingTemplateCZ } from "./templatesCZ/gamingTemplateCZ";
import { handleGetProductSafetyProducers } from "../backendQueries/getProductSafetyProducers";
import { handleGetProductSafetyCertificates } from "../backendQueries/getProductSafetyCertificates";
import RelatedProductsSelect from "../relatedProductsSelect";
import { getShoperErrorMessage } from "../backendQueries/shoperErrorMessage";
import { getApiErrorMessage } from "../backendQueries/apiErrorMessage";
import { ResponsibleProducerSelect, ResponsibleResponse } from "./allegroComponents/responsibleProducers";
import { ApiloSubmitControls } from "./apiloSubmitControls";
import { getCreatedShoperProductId, getExactApiloProductId } from "./gamingProductTargets";

type AddProductProps = {
    authToken: string
    accessTokenAllegro: string
    allegroAccountId?: string
}

interface IFormInput {
    firstName: string;
    producer: number;
    SKU: string;
    stock: number;
    price: number;
    name: string;
    description: string;
    descriptionCZ: string
    descriptionSK: string
    additionalInfo: string;
    powerSupplyModel: string;
    ramModel: string;
    caseModel: string;
    cpuFanModel: string;
    components: string;
    active: boolean;
    visualCondition: string;
    condition: string;
    categoryId: number;
    rt: boolean,
    productSafetyProducerId?: number,
    productSafetyCertificateIds?: number[],
    productSafetyWarnings?: string[],
    [key: string]: any; // Dynamiczne pola formularza dla atrybutów
    descriptionLanguage: string,
    set: string
}



function AddGamingPC(props: AddProductProps) {
    const [attributeList, setAttributeList] = useState<Attribute[]>([]);
    const [loading, setLoading] = useState(false); // Dodajemy stan loading
    const submissionInProgress = useRef(false);
    const { register, handleSubmit, setValue, watch, control, getValues } = useForm<IFormInput>();
    const gameGraphicsAttribute = attributeList.find(
        attribute => attribute.name.trim().toLocaleLowerCase("pl-PL") === "wyłącz grafiki z grami"
    );
    const disableGameGraphics = gameGraphicsAttribute != null && watch("disableGameGraphics", false) === true;
    const [descriptionValue, setDescriptionValue] = useState<string>('');
    const images = useProductImages();
    const { selectedImages, imageLinks } = images;
    const [addToApilo, setAddToApilo] = useState(true);
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [producers, setProducers] = useState<ProducersResource[]>([]);
    const [productSafetyProducers, setProductSafetyProducers] = useState<ProductSafetyProducerResource[]>([]);
    const [productSafetyCertificates, setProductSafetyCertificates] = useState<ProductSafetyCertificateResource[]>([]);
    const [relatedPackId, setRelatedPackId] = useState("");
    const [attributeGroup, setAttributeGroup] = useState<any>(null);
    const [producer, setProducer] = useState<ProducersResource[]>([]);
    const [nameCZ, setNameCZ] = useState("");
    const [nameSK, setNameSK] = useState("");
    let apiloImageUUIDs: string[] = [];
    const [formData, setFormData] = useState<FormDataAllegro>({});
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
    //allegro
    const [searchName, setSearchName] = useState('');
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [showSearchresult, setShowSearchresult] = useState(false);
    const [result, setResult] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState<Product>();
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [formDataAllegro, setFormDataAllegro] = useState<FormDataAllegro>({});
    const [additionalInfoCZ, setAdditionalInfoCZ] = useState("");
    const [additionalInfoSK, setAdditionalInfoSK] = useState("");
    const [lockedParams, setLockedParams] = useState<Set<string>>(new Set());
    const [responsibleData, setResponsibleData] = useState<ResponsibleResponse | undefined>(undefined);
    const [responsibleProducerId, setResponsibleProducerId] = useState<string>("");

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
            console.warn("Brak accessTokenAllegro – pomijam pobranie responsibleProducers");
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/product/responsibleProducers`, {
                params: { allegroAccountId: props.allegroAccountId },
                headers: {
                    Authorization: `Bearer ${props.authToken}`,
                    "Cache-Control": "no-cache",
                },
            });
            setResponsibleData(response.data);
        } catch (error) {
            console.error("Błąd pobierania responsibleProducers:", error);
            toast.error("Błąd pobierania producentów odpowiedzialnych Allegro.");
        }
    };


    //DODAJ ATRYBUTY DO SHOPER
    // async function uploadShoperAttributes(params: any[], attributeGroupId: number,) {
    //     for (let i = 0; i < params.length; i++) {
    //         const param = params[i];
    //         const payload = mapAllegroParamToShoperAttribute(param, attributeGroupId);

    //         try {
    //             const response = await axios.post(`${API_URL}/attribute-groups/createAttributes`,
    //                 payload,
    //                 {
    //                     headers: {
    //                         "Content-Type": "application/json",
    //                         Authorization: `Bearer ${props.authToken}`
    //                     }
    //                 }
    //             );

    //             toast.success(`✅ Atrybut ${payload.name} dodany`);
    //         } catch (error) {
    //             console.error(`Błąd przy dodawaniu atrybutu ${payload.name}:`, error);
    //             toast.error(`❌ Błąd: ${payload.name}`);
    //             throw error;
    //         }
    //     }
    // }
    // const uploadShoperAttributes2 = async () => {
    //     await uploadShoperAttributes(cpuParameters, 67);
    // }

    const buildOfferParameters = (formData: FormDataAllegro, describesProductValue: boolean | undefined): any[] => {
        return Object.entries(formData).map(([name, value]) => {
            const paramDef = pcParametersAll.find(p => p.name === name);

            if (!paramDef || paramDef.options?.describesProduct !== describesProductValue) return null;

            const paramId = String(paramDef.id);

            if (paramDef.type === 'dictionary' && paramDef.dictionary) {
                const dictionary = paramDef.dictionary;

                if (Array.isArray(value)) {
                    const matchedIds = value
                        .map(val => dictionary.find(d => d.value === val)?.id)
                        .filter(Boolean); // usuń undefined

                    return {
                        id: paramId,
                        valuesIds: matchedIds
                    };
                } else {
                    const matchedId = dictionary.find(d => d.value === value)?.id;
                    return {
                        id: paramId,
                        valuesIds: matchedId ? [matchedId] : []
                    };
                }
            }

            // dla liczbowych i tekstowych (integer, float, string)
            return {
                id: paramId,
                values: Array.isArray(value) ? value : [value]
            };
        }).filter(Boolean); // usuń null/undefined
    };


    const handleAddAllegroOffer = async () => {
        if (!responsibleProducerId) {
            toast.error("Wybierz producenta odpowiedzialnego przed dodaniem oferty Allegro.");
            return;
        }

        const currentValues = getValues();
        const currentName = String(currentValues.name || Name || "").trim();
        if (!currentName) {
            toast.error("Podaj tytuł przed dodaniem oferty Allegro.");
            return;
        }

        const productData = {
            "name": currentName,

            "productSet":
                [{
                    "product":
                    {
                        "name": currentName,
                        "category": { "id": "486" },
                        // "id": selectedProductId,   // numer GTIN, MPN lub ID produktu
                        // "idType": "GTIN",         // typ wartości w polu "product.id". 
                        // Dla GTIN wskaż "GTIN",dla numerów 
                        // katalogowych nadanych przez producenta - "MPN".
                        // Jeśli wskazujesz UUID produktu, pozostaw pole puste.
                        "parameters": buildOfferParameters(formData, true),
                        "images": imageLinks,
                    },
                    "responsibleProducer": {
                        "type": "ID",
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

            "parameters": buildOfferParameters(formData, false),

            "external": {
                "id": SKU
            },

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

            "delivery": {
                "shippingRates": {
                    "name": "KOMPY 2018"
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


            "description": generateDescriptionAllegro(convertedFormData)
        };

            try {
                const response = await axios.post(
                `${API_URL}/product/allegroProduct/account`,
                productData,
                {
                    params: { allegroAccountId: props.allegroAccountId },
                    headers: {
                        Authorization: `Bearer ${props.authToken}`,
                    },
                }
            );
            setResult(response.data);
            toast.success("Dodano produkt do allegro");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data;

                console.error("Błąd Allegro:", apiError);
                toast.error(getApiErrorMessage(error, "Nie udało się dodać oferty do Allegro."));
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error("Wystąpił nieznany błąd.");
            }
        }
    };


    const handleSelectAllegroProduct = (product: Product) => {
        setSelectedProductId(product.id);
        setSelectedProduct(product);

        const autoFilledForm: { [key: string]: string | string[] } = {};

        // ⬇️  NOWE: zbierz nazwy parametrów, które identyfikują produkt
        const identified = new Set<string>(
            (product.parameters || [])
                .filter((p: any) => p?.options?.identifiesProduct === true)
                .map((p: any) => p.name)
        );
        setLockedParams(identified);
        // ⬆️  KONIEC NOWEGO

        product.parameters.forEach((param) => {
            const paramIndex = pcParametersAll.findIndex(p => p.name === param.name);
            if (paramIndex === -1) return;

            const isNumeric = param.type === "integer" || param.type === "float";
            let paramValue: string | string[] | null = null;

            if (Array.isArray(param.values) && param.values.length > 0) {
                paramValue = param.values.length > 1
                    ? param.values.map(String)
                    : String(param.values[0]);
            } else if (Array.isArray(param.valuesLabels) && param.valuesLabels.length > 0) {
                if (isNumeric) {
                    const numericMatch = param.valuesLabels[0].match(/\d+(\.\d+)?/);
                    paramValue = numericMatch ? numericMatch[0] : "";
                } else {
                    paramValue = param.valuesLabels.length > 1
                        ? param.valuesLabels.map(String)
                        : String(param.valuesLabels[0]);
                }
            } else if (param.rangeValue && (param.rangeValue.from || param.rangeValue.to)) {
                if (isNumeric) {
                    paramValue = String(param.rangeValue.from ?? param.rangeValue.to ?? "");
                } else {
                    const from = param.rangeValue.from ?? "";
                    const to = param.rangeValue.to ?? "";
                    paramValue = `${from}${from && to ? " - " : ""}${to}`;
                }
            }

            if (paramValue !== null) {
                autoFilledForm[param.name] = paramValue;
                setValue(`attribute_${paramIndex}`, paramValue, { shouldValidate: true });
            }
        });

        setFormData(autoFilledForm);

        setValue("name", product.name);

        const kodProducenta = autoFilledForm["Kod producenta"];
        if (kodProducenta && typeof kodProducenta === "string") {
            setValue("SKU", kodProducenta);
        }
    };



    //
    const isParamDisabled = (paramName: string) =>
        connectProductAllegro && lockedParams.has(paramName);


    useEffect(() => {
        setResponsibleProducerId("");
        setResponsibleData(undefined);
        handleGetProducers()
        handleGetResponsiblePrducers()
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
        handleGetAttributeList('65')
    }, [props.authToken, props.accessTokenAllegro, props.allegroAccountId]);


    const onEditorStateChange = (editorState: EditorState) => {
        setEditorState(editorState);
        setDescriptionValue(draftToHtml(convertToRaw(editorState.getCurrentContent())));
        // console.log(descriptionValue)
    };

    const handleGetProducers = async () => {
        let allProducers: ProducersResource[] = [];
        let currentPage = 1;
        let totalPages = 1;
        try {
            while (currentPage <= totalPages) {
                const response = await axios.get<{ list: ProducersResource[]; pages: number }>(`${API_URL}/categories/producers`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${props.authToken}`,
                    },
                    params: {
                        limit: 50,
                        page: currentPage,
                    },
                });
                allProducers = allProducers.concat(response.data.list);
                totalPages = response.data.pages;
                currentPage++;
            }

            setProducers(allProducers);
            toast.success("Producenci zostali pomyślnie pobrani.");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd podczas pobierania producentów:", error.response?.data || error.message);
                toast.error("Błąd podczas pobierania producentów.");
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error("Wystąpił nieznany błąd.");
            }
        }
    };

    const handleGetAttributeGroup = async () => {
        try {
            const response = await axios.get(`${API_URL}/attribute-groups/9`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${props.authToken}`,
                },
            });
            setAttributeGroup(response.data);
            toast.success("Grupa atrybutów została pomyślnie pobrana.");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd podczas pobierania grupy atrybutów:", error.response?.data || error.message);
                toast.error("Błąd podczas pobierania grupy atrybutów.");
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error("Wystąpił nieznany błąd.");
            }
        }
    };

    const handleGetAttributeList = async (id: string) => {
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
                            attribute_group_id: id,
                        }),
                    },
                });

                allAttributes = allAttributes.concat(response.data.list);
                totalPages = response.data.pages; // <- poprawne pobranie liczby stron
                currentPage++;
            }

            setAttributeList(allAttributes);
            toast.success("Atrybuty zostały pomyślnie pobrane.");
            return allAttributes;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd podczas pobierania listy atrybutów:", error.response?.data || error.message);
                toast.error("Błąd podczas pobierania listy atrybutów.");
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error("Wystąpił nieznany błąd.");
            }
            return [];
        }
    };
    const handleChangeAllegro = (paramName: string, value: any) => {
        // Aktualizacja własnego stanu formData (do kontroli wartości i późniejszego wykorzystania)
        setFormData(prev => ({ ...prev, [paramName]: value }));
        // Aktualizacja wartości w wewnętrznym stanie formularza react-hook-form
        const idx = pcParametersAll.findIndex(p => p.name === paramName);
        if (idx !== -1) {
            setValue(`attribute_${idx}`, value);
        }
    };



    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        if (submissionInProgress.current) return;
        submissionInProgress.current = true;
        const submittedSku = String(data.SKU).trim();
        const cattegoryID = data.set === "tani" || data.set === "drogi" ? 223 : 321;
        try {
            setLoading(true);

            // Dodaj zdjęcia do Apilo
            if (addToApilo) for (let i = 0; i < selectedImages.length; i++) {
                try {
                    const formDataImage = new FormData();
                    formDataImage.append("file", selectedImages[i]);

                    const apiloImageResponse = await axios.post(
                        `${API_URL}/product-image/apilo`,
                        formDataImage,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                                Authorization: `Bearer ${props.authToken}`,
                            },
                        }
                    );

                    apiloImageUUIDs.push(apiloImageResponse.data.uuid);
                } catch (error) {
                    console.error("Image upload error:", error);
                    toast.error(`Błąd przy zdjęciu ${i + 1}`);
                }
            }

            // Zbieranie atrybutów
            const attributes: { [key: number]: string } = {};
            attributeList.forEach((attribute) => {
                const attributeValue = data[`attribute_${attribute.attribute_id}`];
                if (attributeValue) {
                    attributes[attribute.attribute_id] = attributeValue;
                }
            });
            const safetyProducerId = normalizeIdValue(data.productSafetyProducerId) ?? 0;
            const safetyCertificateIds = Array.isArray(data.productSafetyCertificateIds)
                ? data.productSafetyCertificateIds
                : [];
            const safetyInformation: Record<string, unknown> = {};
            if (safetyProducerId) safetyInformation.gpsr_producer_id = safetyProducerId;
            if (safetyCertificateIds.length) safetyInformation.gpsr_certificates = safetyCertificateIds;

            // Dodawanie produktu do Shoper
            let shoperResponse: any;
            try {
                shoperResponse = await axios.post(
                    `${API_URL}/product/shoper`,
                    {
                        producer_id: data.producer,
                        category_id: cattegoryID,
                        code: submittedSku,
                        pkwiu: "-",
                        translations: {
                            pl_PL: {
                                name: data.name,
                                description: description,
                                active: data.active,
                            },

                        },
                        stock: {
                            price: data.price,
                            active: 1,
                            stock: data.stock,
                            delivery_id: 1,
                        },
                        attributes: {
                            1116: formData['Kolor'],
                            1117: formData['Model'],
                            1121: formData['Wysokość produktu'],
                            1122: formData['Szerokość produktu'],
                            1123: formData['Głębokość produktu'],
                            1124: formData['Waga produktu'],
                            1126: formData['Monitor'],
                            1129: formData['Moc zasilacza'],
                            1131: formData['System operacyjny'],
                            1134: formData['Model procesora'],
                            1135: formData['Seria'],
                            1138: formData['Taktowanie bazowe procesora'],
                            1139: formData['Taktowanie maksymalne procesora'],
                            1140: formData['Pamięć podręczna procesora'],
                            1141: formData['Liczba rdzeni procesora'],
                            1142: formData['Liczba wątków procesora'],
                            1143: formData['Typ pamięci RAM'],
                            1144: formData['Wielkość pamięci RAM'],
                            1145: formData['Taktowanie szyny pamięci RAM'],
                            1149: formData['Typ dysku twardego'],
                            1150: formData['Pojemność dysku'],
                            1153: formData['Rodzaj karty graficznej'],
                            1154: formData['Producent karty graficznej'],
                            1155: formData['Chipset karty graficznej'],
                            1156: formData['Pamięć karty graficznej'],
                            1159: formData['Producent płyty głównej'],
                            1160: formData['Model płyty głównej'],
                            1164: formData['Typ obudowy'],
                            ...(disableGameGraphics ? { [gameGraphicsAttribute!.attribute_id]: "1" } : {}),

                            307: "24 miesiące",
                            291: condition,
                        },
                        gauge_id: 6,
                        ...(Object.keys(safetyInformation).length
                            ? { safety_information: safetyInformation }
                            : {}),
                        ...(relatedPackId ? { related_pack_id: relatedPackId } : {}),
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${props.authToken}`,
                        },
                    }
                );
            } catch (error) {
                console.error("Błąd w dodawaniu produktu do Shopera:", error);
                throw error;
            }
            const productId = getCreatedShoperProductId(shoperResponse.data);
            toast.success("Dodano produkt do Shopera");

            //Dodanie czeskiej i słowackiem wersji do shopera

            const updateDescription = async () => {
                try {
                    await axios.put(`${API_URL}/product/${productId}`, {
                        translations: {
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
                        attributes: {
                            ...(disableGameGraphics ? { [gameGraphicsAttribute!.attribute_id]: "1" } : {}),
                            1017: formData['Wielkość pamięci RAM'],
                            1018: formData['Typ pamięci RAM'],
                            1019: formData['Seria'],
                            1020: formData['Model procesora'],
                            1021: formData['Typ dysku twardego'],
                            1022: formData['Pojemność dysku'],
                            1023: formData['System operacyjny'],
                            1028: formData['Taktowanie maksymalne procesora'],
                            1029: formData['Taktowanie bazowe procesora'],
                            1030: formData['Liczba wątków procesora'],
                            1031: formData['Liczba rdzeni procesora'],

                            1040: formData['Wielkość pamięci RAM'],
                            1041: formData['Typ pamięci RAM'],
                            1042: formData['Seria'],
                            1043: formData['Model procesora'],
                            1044: formData['Typ dysku twardego'],
                            1045: formData['Pojemność dysku'],
                            1046: formData['System operacyjny'],
                            1051: formData['Taktowanie maksymalne procesora'],
                            1052: formData['Taktowanie bazowe procesora'],
                            1053: formData['Liczba wątków procesora'],
                            1054: formData['Liczba rdzeni procesora'],
                        },
                    }, {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${props.authToken}`
                        }
                    });

                    toast.success("Produkt został zaktualizowany w Shoperze.");
                }
                catch (error) {
                    if (axios.isAxiosError(error)) {
                        console.error("Błąd HTTP:", error.response?.status, error.response?.data);
                    } else {
                        console.error("Błąd aplikacji:", error);
                    }
                    throw error;
                }
            }

            await updateDescription()


            if (addToApilo) {
            try {
                const apiloPrductsListResponse = await axios.get(`${API_URL}/product/apiloProductslist`, {
                    params: {
                        sku: submittedSku,
                    },
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${props.authToken}`,
                    },
                });

                const existingApiloId = getExactApiloProductId(apiloPrductsListResponse.data, submittedSku);
                const apiloProduct = {
                    sku: submittedSku,
                    name: data.name,
                    tax: 23,
                    status: 1,
                    quantity: Number(data.stock),
                    priceWithTax: data.price,
                    description,
                    images: apiloImageUUIDs,
                };
                const requestConfig = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${props.authToken}`,
                    },
                };
                if (existingApiloId !== null) {
                    await axios.put(`${API_URL}/product/apilo`, {
                        ...apiloProduct,
                        images: apiloImageUUIDs.length ? apiloImageUUIDs : undefined,
                        targetId: existingApiloId,
                    }, requestConfig);
                    toast.success("Produkt został zaktualizowany w Apilo.");
                } else {
                    await axios.post(`${API_URL}/product/apilo`, [apiloProduct], requestConfig);
                    toast.success("Produkt został dodany do Apilo.");
                }
            } catch (error) {
                console.error("Błąd przy zastępowaniu produktu w Apilo:", error);
                toast.error(getApiErrorMessage(error, "Nie udało się bezpiecznie dodać produktu do Apilo."));
            }
            }

            // Dodawanie zdjęć do Shopera
            try {
                for (let i = 0; i < imageLinks.length; i++) {
                    const image = imageLinks[i];
                    try {
                        await axios.post(
                            `${API_URL}/product-image`,
                            {
                                product_id: productId,
                                url: image,
                                translations: {
                                    pl_PL: {
                                        name: selectedImages[i]?.name || "zdjęcie",
                                    },
                                },
                            },
                            {
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${props.authToken}`,
                                },
                            }
                        );
                    } catch (error) {
                        console.error("Błąd zdjęcia do Shopera:", error);
                        toast.error(`Błąd przy zdjęciu ${i + 1} w Shoperze`);
                    }
                }
            } catch (error) {
                console.error("Błąd podczas dodawania zdjęć do Shopera:", error);
                toast.error("Nie udało się dodać zdjęć do Shopera");
            }
        } catch (error) {
            console.error("Błąd podczas dodawania produktu gamingowego:", error);
            toast.error(axios.isAxiosError(error)
                ? getShoperErrorMessage(error, attributeList)
                : getApiErrorMessage(error, "Nie udało się zapisać produktu gamingowego."));
        } finally {
            setLoading(false);
            apiloImageUUIDs = [];
            submissionInProgress.current = false;
        }
    };
    const convertedFormData = useMemo(() => {
        return Object.entries(formData).reduce((acc, [key, value]) => {
            acc[key] = Array.isArray(value) ? value.join(', ') : value;
            return acc;
        }, {} as Record<string, string>);
    }, [formData]);

    let descriptionLanguage = watch("descriptionLanguage", "description")
    let description = watch("description", gamingTemplate('', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '', '', '', ''));
    let descriptionCZ = watch("descriptionCZ", gamingTemplateCZ('', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '', '', '', ''));
    let descriptionSK = watch("descriptionSK", gamingTemplateSK('', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '', '', '', ''));
    let additionalInfo = watch("additionalInfo", "");
    let components = watch("components", "");
    let rt = watch("rt", true);
    let Name = watch("name", '')
    let powerSupplyModel = watch("powerSupplyModel", '');
    let ramModel = watch("ramModel", '');
    let caseModel = watch("caseModel", '');
    let cpuFanModel = watch("cpuFanModel", '');
    let Price = watch("price", 0);
    let Stock = watch("stock", 0);
    let SKU = watch("SKU", '');
    let condition = watch("condition", '');
    let set = watch("set", '');
    let connectProductAllegro = watch("connectProductAllegro", true);


    const generateDescriptionAllegro = (data: any) => {
        // Pomocnicza funkcja do pobrania wartości tekstowej z formData
        const getString = (v: string | string[] | undefined): string =>
            Array.isArray(v) ? v[0] ?? "" : v ?? "";

        // Pobranie i oczyszczenie danych z formData
        const gpuValue = getString(formData["Chipset karty graficznej"]);
        const cpuValue = getString(formData["Seria"]);
        const gpuType = getString(formData["Rodzaj karty graficznej"]);
        const diskDescription = getString(formData["Typ dysku twardego"]);
        const ramDescription = getString(formData["Typ pamięci RAM"]);

        // Identyfikatory grafik
        let gpuSrc = "g_gpui";
        let cpuSrc = "g_cpu_intel";
        let diskSrc = "g_disk_ssd";

        // Opisy GPU/CPU
        const gpuKey =
            typeof gpuValue === "string"
                ? Object.keys(gaming_gpu).find((k) =>
                    gpuValue.toLowerCase().includes(k.toLowerCase())
                )
                : undefined;

        const cpuKey =
            typeof cpuValue === "string"
                ? Object.keys(gaming_cpuTypesDescriptions).find((k) =>
                    cpuValue.toLowerCase().includes(k.toLowerCase())
                )
                : undefined;


        const gpuDescription =
            gpuType === "dedykowana"
                ? (gpuKey ? gaming_gpu[gpuKey as keyof typeof gaming_gpu] : "")
                : gaming_gpu["Integrated"];

        if (gpuKey) gpuSrc = gpuKey;
        cpuSrc = cpuValue.toLowerCase().includes("intel") ? "g_cpu_intel" : "g_cpu_amd";

        if (diskDescription.includes("NVMe")) {
            diskSrc = "g_disk_nvme";
        } else if (diskDescription.includes("SSD (M.2)")) {
            diskSrc = "g_disk_m2";
        }

        const cpuDescription = cpuKey
            ? gaming_cpuTypesDescriptions[cpuKey as keyof typeof gaming_cpuTypesDescriptions]
            : "";

        const ramDesc = gaming_ramTypesDescriptions[ramDescription as keyof typeof gaming_ramTypesDescriptions] || "";
        const diskDesc = gaming_diskTypesDescriptions[diskDescription as keyof typeof gaming_diskTypesDescriptions] || "";

        return gamingTemplateAllegro(
            data["Model procesora"] || "",
            data["Chipset karty graficznej"] || "",
            [data["Producent płyty głównej"], data["Model płyty głównej"]].filter(Boolean).join(" "),
            data["Moc zasilacza"] || "",
            [data["Typ pamięci RAM"], data["Wielkość pamięci RAM"]].filter(Boolean).join(" "),
            data["Typ obudowy"] || "",
            data["Liczba rdzeni procesora"] || "",
            data["Liczba wątków procesora"] || "",
            data["Taktowanie maksymalne procesora"] || "",
            [data["Złącza obudowy"], data["Złącza zewnętrzne płyty głównej"], data["Złącza karty graficznej"]].filter(Boolean).join(" "),
            data["System operacyjny"] || "",
            gpuDescription,
            cpuDescription,
            gpuSrc,
            cpuSrc,
            ramDesc,
            diskDesc,
            [data["Typ dysku twardego"], data["Pojemność dysku"]].filter(Boolean).join(" "),
            diskSrc,
            cpuValue,
            gpuType,
            additionalInfo,
            components,
            rt,
            powerSupplyModel,
            ramModel,
            caseModel,
            cpuFanModel,
            set
        );
    };

    //Odświerzanie opisu
    // 1. Konwersja formData do formatu stringowego tylko przy zmianie formData


    // 2. Aktualizacja opisów na podstawie danych
    useEffect(() => {
        if (!convertedFormData) return;

        const data = convertedFormData;

        let gpuSrc = "g_gpui";
        let cpuSrc = "g_cpu_intel";
        let diskSrc = "g_disk_ssd";

        const gpuValue = (data["Chipset karty graficznej"] || "").toString();
        const cpuValue = (data["Seria"] || "").toString();
        const ramType = (data["Typ pamięci RAM"] || "").toString();
        const diskType = (data["Typ dysku twardego"] || "").toString();
        const gpuType = (data["Rodzaj karty graficznej"] || "").toString();

        const gpuKey = Object.keys(gaming_gpu).find((k) =>
            gpuValue.toLowerCase().includes(k.toLowerCase())
        );
        const cpuKey = Object.keys(gaming_cpuTypesDescriptions).find((k) =>
            cpuValue.toLowerCase().includes(k.toLowerCase())
        );

        const gpuDescription =
            gpuType === "dedykowana" ? (gpuKey ? gaming_gpu[gpuKey as keyof typeof gaming_gpu] : "") : gaming_gpu["Integrated"];
        const gpuDescriptionCZ =
            gpuType === "dedykowana" ? (gpuKey ? gaming_gpu_CZ[gpuKey as keyof typeof gaming_gpu_CZ] : "") : gaming_gpu_CZ["Integrated"];
        const gpuDescriptionSK =
            gpuType === "dedykowana" ? (gpuKey ? gaming_gpu_SK[gpuKey as keyof typeof gaming_gpu_SK] : "") : gaming_gpu_SK["Integrated"];

        const cpuDescription = cpuKey ? gaming_cpuTypesDescriptions[cpuKey as keyof typeof gaming_cpuTypesDescriptions] : "";
        const cpuDescriptionCZ = cpuKey ? gaming_cpuTypesDescriptions_CZ[cpuKey as keyof typeof gaming_cpuTypesDescriptions_CZ] : "";
        const cpuDescriptionSK = cpuKey ? gaming_cpuTypesDescriptions_SK[cpuKey as keyof typeof gaming_cpuTypesDescriptions_SK] : "";

        const ramDescriptionPL = gaming_ramTypesDescriptions[ramType as keyof typeof gaming_ramTypesDescriptions] || "";
        const ramDescriptionCZ = gaming_ramTypesDescriptions_CZ[ramType as keyof typeof gaming_ramTypesDescriptions_CZ] || "";
        const ramDescriptionSK = gaming_ramTypesDescriptions_SK[ramType as keyof typeof gaming_ramTypesDescriptions_SK] || "";

        const diskDescriptionPL = gaming_diskTypesDescriptions[diskType as keyof typeof gaming_diskTypesDescriptions] || "";
        const diskDescriptionCZ = gaming_diskTypesDescriptions_CZ[diskType as keyof typeof gaming_diskTypesDescriptions_CZ] || "";
        const diskDescriptionSK = gaming_diskTypesDescriptions_SK[diskType as keyof typeof gaming_diskTypesDescriptions_SK] || "";

        if (gpuKey) gpuSrc = gpuKey;
        cpuSrc = cpuValue.includes("Intel") ? "g_cpu_intel" : "g_cpu_amd";
        if (diskType.includes("NVMe")) diskSrc = "g_disk_nvme";
        if (diskType.includes("SSD (M.2)")) diskSrc = "g_disk_m2";

        const sharedParams: [
            string, string, string, string, string, string, string, string, string,
            string, string, string, string, string, string, string, string, string,
            boolean, string, string, string, string, string
        ] = [
                data["Model procesora"],
                data["Chipset karty graficznej"],
                data["Producent płyty głównej"] + " " + data["Model płyty głównej"],
                data["Moc zasilacza"],
                data["Typ pamięci RAM"] + " " + data["Wielkość pamięci RAM"],
                data["Typ obudowy"],
                data["Liczba rdzeni procesora"],
                data["Liczba wątków procesora"],
                data["Taktowanie maksymalne procesora"],
                data["Złącza obudowy"] + data["Złącza zewnętrzne płyty głównej"] + data["Złącza karty graficznej"],
                data["System operacyjny"],
                gpuSrc,
                cpuSrc,
                data["Typ dysku twardego"] + " " + data["Pojemność dysku"],
                diskSrc,
                cpuValue,
                gpuType,
                components,
                rt,
                powerSupplyModel,
                ramModel,
                caseModel,
                cpuFanModel,
                set
            ];

        const [
            cpuName,
            gpuName,
            mainBoardName,
            powerSupplyName,
            ramName,
            caseName,
            cpuCores,
            cpuThreeds,
            cpuMax,
            CasePorts,
            system,
            gpuSrcFinal,
            cpuSrcFinal,
            diskName,
            diskSrcFinal,
            cpuSeries,
            gpuTypeFinal,
            componentsFinal,
            rtFinal,
            powerSupplyModelFinal,
            ramModelFinal,
            caseModelFinal,
            cpuFanModelFinal,
        ] = sharedParams;

        const newDescription = gamingTemplate(
            cpuName, gpuName, mainBoardName, powerSupplyName, ramName, caseName,
            cpuCores, cpuThreeds, cpuMax, CasePorts, system,
            gpuDescription, cpuDescription,
            gpuSrcFinal, cpuSrcFinal,
            ramDescriptionPL, diskDescriptionPL, diskName, diskSrcFinal,
            cpuSeries, gpuTypeFinal, additionalInfo,
            componentsFinal, rtFinal,
            powerSupplyModelFinal, ramModelFinal, caseModelFinal, cpuFanModelFinal, set,
            disableGameGraphics
        );

        const newDescriptionCZ = gamingTemplateCZ(
            cpuName, gpuName, mainBoardName, powerSupplyName, ramName, caseName,
            cpuCores, cpuThreeds, cpuMax, CasePorts, system,
            gpuDescriptionCZ, cpuDescriptionCZ,
            gpuSrcFinal, cpuSrcFinal,
            ramDescriptionCZ, diskDescriptionCZ, diskName, diskSrcFinal,
            cpuSeries, gpuTypeFinal, additionalInfoCZ,
            componentsFinal, rtFinal,
            powerSupplyModelFinal, ramModelFinal, caseModelFinal, cpuFanModelFinal, set,
            disableGameGraphics
        );

        const newDescriptionSK = gamingTemplateSK(
            cpuName, gpuName, mainBoardName, powerSupplyName, ramName, caseName,
            cpuCores, cpuThreeds, cpuMax, CasePorts, system,
            gpuDescriptionSK, cpuDescriptionSK,
            gpuSrcFinal, cpuSrcFinal,
            ramDescriptionSK, diskDescriptionSK, diskName, diskSrcFinal,
            cpuSeries, gpuTypeFinal, additionalInfoSK,
            componentsFinal, rtFinal,
            powerSupplyModelFinal, ramModelFinal, caseModelFinal, cpuFanModelFinal, set,
            disableGameGraphics
        );

        if (watch("description") !== newDescription) setValue("description", newDescription);
        if (watch("descriptionCZ") !== newDescriptionCZ) setValue("descriptionCZ", newDescriptionCZ);
        if (watch("descriptionSK") !== newDescriptionSK) setValue("descriptionSK", newDescriptionSK);
    }, [
        convertedFormData,
        additionalInfo, additionalInfoCZ, additionalInfoSK,
        components, rt,
        powerSupplyModel, ramModel, caseModel, cpuFanModel, set, disableGameGraphics
    ]);



    return (
        <div className="addProductMainContainer">
            {/* <button type="button" onClick={uploadShoperAttributes2}>Szukaj</button> */}

            <form onSubmit={handleSubmit(onSubmit)} className="AddOfferFormContainer" style={{ display: "flex", flexDirection: "column" }}>
                <RelatedProductsSelect authToken={props.authToken} value={relatedPackId} onChange={setRelatedPackId} />
                <Box sx={{ py: 2, display: "grid", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                    <ThemeProvider theme={MainTheme}>
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

                            </Select>
                        </FormControl>
                        <h2>Dodaj komputer gamingowy</h2>

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
                        </div>

                        <FormControlLabel control={<Checkbox defaultChecked {...register("active")} />} label="aktywność" />
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
                        {/* <TextField required label="SKU" {...register("SKU")} /> */}
                        <TextField required label="SKU" type="text"{...register("SKU")} />
                        <TextField required label="Ilość" type="number"{...register("stock")} />
                        <TextField required label="Cena" type="number" inputProps={{ step: "0.01" }} {...register("price")} />

                        <FormControl fullWidth >
                            <InputLabel>Zestaw</InputLabel>
                            <Select
                                label="Zestaw"
                                {...register("set")}
                                defaultValue={"brak"}
                            >
                                <MenuItem value="brak">brak</MenuItem>
                                <MenuItem value="tani">tani</MenuItem>
                                <MenuItem value="drogi">drogi</MenuItem>

                            </Select>
                        </FormControl>

                        <Autocomplete
                            options={producers}
                            getOptionLabel={(option) => {
                                if (!option || typeof option === "string") return option ?? "";
                                return option.name ?? "";
                            }}
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
                                setLoading(true);
                                setValue("producer", value?.producer_id || 0);
                            }}
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

                        <TextField label="uwagi" variant="outlined" type="text" {...register("additionalInfo", {
                            onBlur: async (e) => {
                                const value = e.target.value;

                                try {
                                    setAdditionalInfoCZ(await handleTranslateCZ(value))
                                    setAdditionalInfoSK(await handleTranslateSK(value))
                                    toast.success("przetłumaczono");
                                } catch (error) {
                                    console.error("Błąd podczas tłumaczenia:", error);
                                    toast.error("błąd w tłumaczeniu");
                                }
                            }
                        })} />
                        <FormControl fullWidth required>
                            <InputLabel>stan</InputLabel>
                            <Select
                                label="stan"
                                {...register("condition")}
                            >
                                <MenuItem value="Poleasingowy">Poleasingowy</MenuItem>
                                <MenuItem value="Nowy">Nowy</MenuItem>
                                <MenuItem value="Powystawowy">Powystawowy</MenuItem>
                                <MenuItem value="Odnowiony przez sprzedawcę">Odnowiony przez sprzedawcę</MenuItem>
                                <MenuItem value="Używany">Używany</MenuItem>
                                <MenuItem value="Odnowiony przez producenta">Odnowiony przez producenta</MenuItem>
                                <MenuItem value="Uszkodzony">Uszkodzony</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Stan części</InputLabel>
                            <Select {...register("components")}
                                label="Stan części">
                                <MenuItem value="z nowych, podzespołów objętych gwarancją producenta">nowe części z gwarancą producenta</MenuItem>
                                <MenuItem value="z komponentów nowych oraz starannie wyselekcjonowanych podzespołów poleasingowych">częściowo używane części</MenuItem>
                                <MenuItem value="z poleasingowych podzespołów">używane części</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControlLabel control={<Checkbox defaultChecked {...register("rt")} />} label="ray tracing" />
                        {gameGraphicsAttribute && (
                            <FormControlLabel
                                control={<Checkbox {...register("disableGameGraphics")} />}
                                label="Wyłącz grafiki z grami"
                            />
                        )}
                        <TextField label="model zasilacza" type="text"{...register("powerSupplyModel")} />
                        <TextField label="model ramu" type="text"{...register("ramModel")} />
                        <TextField label="model ubudowy" type="text"{...register("caseModel")} />
                        <TextField label="model radiatora" type="text"{...register("cpuFanModel")} />
                        <Typography variant="h4" style={{ textAlign: 'center', margin: '20px' }}>Parametry Allegro</Typography>

                        <ResponsibleProducerSelect
                            data={responsibleData}
                            value={responsibleProducerId}
                            onChange={setResponsibleProducerId}
                        />

                        {[...pcParametersAll]
                            .sort((a, b) => {
                                const order = ['#ff000024', '#0089ff24', '#fffa0024'];
                                return order.indexOf(a.shoper) - order.indexOf(b.shoper);
                            })
                            .map((param, index) => {
                                const isMulti = param.restrictions?.multipleChoices === true;
                                const disabled = isParamDisabled(param.name); // ⬅️ NOWE

                                return (
                                    <Box key={param.id} sx={{ opacity: disabled ? 0.7 : 1 }}>
                                        {/* dictionary */}
                                        {param.type === 'dictionary' && param.dictionary && (
                                            <FormControl fullWidth required={param.required} disabled={disabled}>
                                                <InputLabel>{param.name}</InputLabel>
                                                <Select
                                                    {...register(`attribute_${index}`)}
                                                    multiple={isMulti}
                                                    style={{ backgroundColor: param.shoper }}
                                                    value={
                                                        isMulti
                                                            ? Array.isArray(formData[param.name]) ? formData[param.name] : []
                                                            : typeof formData[param.name] === 'string' ? formData[param.name] : ''
                                                    }
                                                    label={param.name}
                                                    onChange={(e: SelectChangeEvent<any>) =>
                                                        handleChangeAllegro(param.name, e.target.value)
                                                    }
                                                    renderValue={(selected) =>
                                                        Array.isArray(selected) ? selected.join(', ') : selected
                                                    }
                                                >
                                                    {param.dictionary.map((option) => (
                                                        <MenuItem key={option.id} value={option.value}>
                                                            {isMulti && (
                                                                <Checkbox
                                                                    checked={
                                                                        Array.isArray(formData[param.name]) &&
                                                                        formData[param.name].includes(option.value)
                                                                    }
                                                                    disabled={disabled}
                                                                />
                                                            )}
                                                            <ListItemText primary={option.value} />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}

                                        {/* dictionary_ac */}
                                        {param.type === 'dictionary_ac' && Array.isArray(param.dictionary) && (
                                            <Autocomplete
                                                multiple={isMulti}
                                                options={param.dictionary.map((d) => d.value)}
                                                value={
                                                    isMulti
                                                        ? Array.isArray(formData[param.name]) ? formData[param.name] : []
                                                        : typeof formData[param.name] === 'string' ? [formData[param.name]] : []
                                                }
                                                onChange={(e, newValue) => {
                                                    if (!newValue) return;
                                                    const cleanValues = (Array.isArray(newValue) ? newValue : [newValue])
                                                        .filter((v): v is string => typeof v === 'string');
                                                    const valueToSet = isMulti ? cleanValues : (cleanValues[0] || '');
                                                    handleChangeAllegro(param.name, valueToSet);
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={param.name}
                                                        required={param.required}
                                                        style={{ backgroundColor: param.shoper }}
                                                        disabled={disabled} // ⬅️ ważne
                                                    />
                                                )}
                                                disabled={disabled} // ⬅️ ważne
                                            />
                                        )}

                                        {/* number */}
                                        {(param.type === 'integer' || param.type === 'float') && (
                                            <TextField
                                                style={{ backgroundColor: param.shoper }}
                                                type="number"
                                                label={param.name}
                                                fullWidth
                                                required={param.required}
                                                inputProps={{ step: param.type === 'float' ? '0.01' : '1' }}
                                                value={
                                                    formData[param.name] !== undefined && formData[param.name] !== null
                                                        ? String(formData[param.name])
                                                        : ''
                                                }
                                                onChange={(e) => handleChangeAllegro(param.name, e.target.value)}
                                                disabled={disabled} // ⬅️ ważne
                                            />
                                        )}

                                        {/* string */}
                                        {param.type === 'string' && (
                                            <TextField
                                                style={{ backgroundColor: param.shoper }}
                                                type="text"
                                                label={param.name}
                                                fullWidth
                                                required={param.required}
                                                value={formData[param.name] || ''}
                                                onChange={(e) => handleChangeAllegro(param.name, e.target.value)}
                                                disabled={disabled} // ⬅️ ważne
                                            />
                                        )}
                                    </Box>
                                );
                            })}


                        <label >opis</label>
                        <textarea defaultValue={gamingTemplate('', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '', '', '', '')} />
                        <ProductImageManager {...images} />
                        <ApiloSubmitControls addToApilo={addToApilo} onChange={setAddToApilo}>
                            <Button variant="contained" type="submit" className="buttonForm" disabled={loading || !images.imagesReady || images.uploadingImages}>Dodaj</Button>
                        </ApiloSubmitControls>
                        <button type="button" onClick={handleAddAllegroOffer} disabled={loading || !images.imagesReady || images.uploadingImages}>Dodaj produkt allegro</button>
                    </ThemeProvider>
                </Box>
            </form>
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

            {showSearchresult && (
                <div style={{ zIndex: '100', top: '50px', left: '35%', position: 'fixed', maxHeight: '700px', overflowY: 'auto', width: '700px', backgroundColor: '#fff', color: '#333', padding: '10px', borderRadius: '5px', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px' }}
                >
                    <div>
                        <Button
                            style={{
                                position: "fixed",
                                color: "#c21d1d",
                                backgroundColor: "#e8c7c7",
                                marginTop: "5px",
                                marginLeft: "640px",
                                borderRadius: "50%",
                                width: "45px",
                                height: "45px",
                                minWidth: "45px",      // MUI Button domyślnie ma minWidth: 64px
                                fontSize: '20px',
                                fontWeight: 'bold'
                            }}
                            onClick={() => setShowSearchresult(false)}
                        >
                            ✕
                        </Button>
                    </div>

                    {!searchResult ? (
                        <p className="text-gray-500">Brak wyników.</p>
                    ) : (
                        <>
                            {searchResult.products?.map((product: any) => (
                                <div key={product.id} style={{ borderBottom: '1px darkgray solid', fontSize: '0.7rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', color: '#1078e0' }} >{product.name}</h3>

                                        <p className="text-sm mt-2">
                                            Kategoria: {product.category?.path?.map((p: any) => p.name).join(' > ') || 'brak'}
                                        </p>
                                        {/* <p className="text-sm text-gray-700 mt-1">
                                                                                    ID produktu: {product.id}
                                                                                </p> */}
                                        {product.parameters?.length > 0 && (
                                            <>
                                                <ul>
                                                    {product.parameters
                                                        .filter((param: any) => param.options.identifiesProduct === true)
                                                        .map((param: any, idx: number) => {
                                                            const value =
                                                                param.valuesLabels?.join(', ') ||
                                                                param.values?.join(', ') ||
                                                                (param.rangeValue?.from && param.rangeValue?.to
                                                                    ? `${param.rangeValue.from} - ${param.rangeValue.to}`
                                                                    : 'brak danych');

                                                            return (
                                                                <li key={`true-${idx}`} style={{ fontSize: '0.8rem' }}>
                                                                    <b>{param.name}: {value}</b>
                                                                    {param.unit && !value.includes(param.unit) ? ` ${param.unit}` : ''}
                                                                </li>
                                                            );
                                                        })}
                                                </ul>

                                                <ul>
                                                    {product.parameters
                                                        .filter((param: any) => param.options.identifiesProduct === false)
                                                        .map((param: any, idx: number) => {
                                                            const value =
                                                                param.valuesLabels?.join(', ') ||
                                                                param.values?.join(', ') ||
                                                                (param.rangeValue?.from && param.rangeValue?.to
                                                                    ? `${param.rangeValue.from} - ${param.rangeValue.to}`
                                                                    : 'brak danych');

                                                            return (
                                                                <li key={`false-${idx}`}>
                                                                    {param.name}: {value}
                                                                    {param.unit && !value.includes(param.unit) ? ` ${param.unit}` : ''}
                                                                </li>
                                                            );
                                                        })}
                                                </ul>
                                            </>
                                        )}

                                        <Button onClick={() => { handleSelectAllegroProduct(product); setShowSearchresult(false) }}     >
                                            wybierz
                                        </Button>

                                        {selectedProductId === product.id && (
                                            <p>✅ Wybrano ten produkt</p>
                                        )}
                                        <p>{selectedProductId}</p>
                                    </div>

                                    {product.images?.[0]?.url && (
                                        <img
                                            src={product.images[0].url}
                                            alt={product.name}
                                            style={{ height: '200px', padding: '20px' }}
                                        />
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default AddGamingPC;
