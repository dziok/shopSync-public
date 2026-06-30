import axios from "axios";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./addProducts.css";
import 'setimmediate';
import { handleImageUpload } from "../image-host";
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
} from "@mui/material";
import { MainTheme } from "./themes";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { EditorState, convertToRaw } from "draft-js";
// @ts-ignore
import draftToHtml from "draftjs-to-html";
import { API_URL } from "../config";
import { handleTranslateCZ, handleTranslateSK } from "../backendQueries/translate";
import { ProductSafetyCertificateResource, ProductSafetyProducerResource } from "../types";
import { handleGetProductSafetyProducers } from "../backendQueries/getProductSafetyProducers";
import { handleGetProductSafetyCertificates } from "../backendQueries/getProductSafetyCertificates";
import React from "react";
import RelatedProductsSelect from "../relatedProductsSelect";

type AddProductProps = {
    authToken: string;
};

interface IFormInput {
    firstName: string;
    producer: number;
    SKU: string;
    stock: number;
    price: number;
    name: string;
    description: string;
    active: boolean;
    visualCondition: string;
    condition: string;
    categoryId: number;
    gauge: number;
    productSafetyProducerId?: number;
    productSafetyCertificateIds?: number[];
    productSafetyWarnings?: string[];
    [key: string]: any; // Dynamiczne pola formularza dla atrybutów
}

interface CategoryResource {
    category_id: number;
    name?: string;
    translation?: {
        name?: string;
        attribute_groups?: string[];
    };
    translations?: {
        pl_PL?: unknown;
    } | unknown;
}

interface ProducersResource {
    producer_id: number;
    name: string;
    translations: {
        pl_PL: {
        };
    };
}

interface Attribute {
    attribute_id: number;
    name: string;
    type: string;
    options: {
        option_id: number;
        value: string;
    }[];
}

function AddCustomProduct(props: AddProductProps) {
    const [attributeList, setAttributeList] = useState<Attribute[]>([]);
    const [loading, setLoading] = useState(false); // Dodajemy stan loading
    const { register, handleSubmit, setValue, control } = useForm<IFormInput>();
    const [descriptionValue, setDescriptionValue] = useState<string>('');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [categories, setCategories] = useState<CategoryResource[]>([]);
    const [producers, setProducers] = useState<ProducersResource[]>([]);
    const [productSafetyProducers, setProductSafetyProducers] = useState<ProductSafetyProducerResource[]>([]);
    const [productSafetyCertificates, setProductSafetyCertificates] = useState<ProductSafetyCertificateResource[]>([]);
    const [relatedPackId, setRelatedPackId] = useState("");
    const [attributeGroup, setAttributeGroup] = useState<any>(null);
    const [imageLinks, setImageLinks] = useState<string[]>([]);
    const [producer, setProducer] = useState<ProducersResource[]>([]);
    const [nameCZ, setNameCZ] = useState("");
    const [nameSK, setNameSK] = useState("");
    const [descriptionCZ, setDescriptionCZ] = useState("");
    const [descriptionSK, setDescriptionSK] = useState("");

    let apiloImageUUIDs: string[] = [];

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
    const getTranslationField = (translations: unknown, field: string) => {
        if (!translations || typeof translations !== "object") return undefined;

        const directPl = (translations as any).pl_PL?.[field];
        if (directPl != null && directPl !== "") return directPl;

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
        return match?.[field];
    };
    const getCategoryName = (category?: CategoryResource | null) =>
        getTranslationField(category?.translations, "name") ??
        category?.translation?.name ??
        category?.name ??
        `Kategoria ${category?.category_id ?? ""}`.trim();
    const getCategoryAttributeGroups = (category?: CategoryResource | null) =>
        getTranslationField(category?.translations, "attribute_groups") ??
        category?.translation?.attribute_groups ??
        [];


    useEffect(() => {
        handleGetCategories();
        handleGetProducers()
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
    }, []);


    const onEditorStateChange = (editorState: EditorState) => {
        setEditorState(editorState);
        setDescriptionValue(draftToHtml(convertToRaw(editorState.getCurrentContent())));
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        const sortedFiles = files.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
            const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
            return numA - numB;
        });

        setSelectedImages(sortedFiles);
    };


    useEffect(() => {
        if (selectedImages.length > 0) {
            handleImageUpload(selectedImages).then((uploadedImages) => {
                setImageLinks(uploadedImages || []);
            });
        }
    }, [selectedImages]);

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

                allCategories = allCategories.concat((response.data.list ?? []).filter(Boolean));
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
        try {
            const response = await axios.get<{ list: Attribute[] }>(`${API_URL}/attribute-groups`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${props.authToken}`,
                },
                params: {
                    limit: 50,
                    filters: JSON.stringify({
                        attribute_group_id: id,
                    }),
                },
            });

            return response.data.list; // Zwracamy listę atrybutów
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd podczas pobierania listy atrybutów:", error.response?.data || error.message);
                toast.error("Błąd podczas pobierania listy atrybutów.");
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error("Wystąpił nieznany błąd.");
            }
            return []; // Zwracamy pustą tablicę w przypadku błędu
        }
    };

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        try {
            setLoading(true);

            // Dodaj zdjęcia do apilo
            try {
                for (let i = 0; i < selectedImages.length; i++) {
                    const formData = new FormData();
                    formData.append("file", selectedImages[i]);

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
                    toast.success(`Zdjęcie ${i + 1} poprawnie dodane!`);
                }
            } catch (error) {
                console.error("Image upload error:", error);
                toast.error("Błąd podczas dodawania zdjęcia na apilo");
            }

            // Zbieranie atrybutów
            const attributes: { [key: number]: string } = {};
            attributeList.forEach((attribute) => {
                const attributeValue = data[`attribute_${attribute.attribute_id}`];
                if (attributeValue) {
                    attributes[attribute.attribute_id] = attributeValue;
                }
            });
            const safetyProducerId = Number(data.productSafetyProducerId ?? 0) || 0;
            const safetyCertificateIds = Array.isArray(data.productSafetyCertificateIds)
                ? data.productSafetyCertificateIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
                : [];
            const safetyWarnings = Array.isArray(data.productSafetyWarnings)
                ? data.productSafetyWarnings.map((item) => String(item ?? "").trim()).filter(Boolean)
                : [];
            const safetyInfo = safetyWarnings.length ? safetyWarnings.join("\n") : "";
            const safetyInformation: Record<string, unknown> = {};
            if (safetyProducerId) safetyInformation.gpsr_producer_id = safetyProducerId;
            if (safetyCertificateIds.length) safetyInformation.gpsr_certificates = safetyCertificateIds;

            // Dodawanie produktu do Shoper
            let response: any;
            let translatedCZ = "";
            let translatedSK = "";

            try {
                translatedCZ = await handleTranslateCZ(descriptionValue);
                translatedSK = await handleTranslateSK(descriptionValue);
                setDescriptionCZ(translatedCZ);
                setDescriptionSK(translatedSK);
                toast.success("przetłumaczono");
            } catch (error) {
                console.error("Błąd podczas tłumaczenia:", error);
                toast.error("Błąd podczas tłumaczenia opisu.");
                return;
            }

            try {
                response = await axios.post(
                    `${API_URL}/product/shoper`,
                    {
                        producer_id: data.producer,
                        category_id: data.categoryId,
                        code: data.SKU,
                        pkwiu: "-",
                        translations: {
                            pl_PL: {
                                name: data.name,
                                description: descriptionValue,
                                active: data.active,
                            },
                            cs_CZ: {
                                name: nameCZ,
                                description: translatedCZ,
                                active: data.active,
                            },
                            sk_SK: {
                                name: nameSK,
                                description: translatedSK,
                                active: data.active,
                            },
                        },
                        stock: {
                            price: data.price,
                            active: 1,
                            stock: data.stock,
                            delivery_id: 1,
                        },
                        attributes: attributes,
                        gauge_id: data.gauge,
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
                console.error("Błąd podczas dodawania produktu do Shopera:", error);
                toast.error("Wystąpił błąd podczas dodawania produktu do Shopera.");
                return;
            }
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
            // Dodawanie produktu do Apilo
            const apiloResponse = await axios.post(
                `${API_URL}/product/apilo`,
                [
                    {
                        sku: data.SKU,
                        name: data.name,
                        tax: 23,
                        status: 1,
                        quantity: Number(data.stock),
                        priceWithTax: data.price,
                        description: descriptionValue,
                        images: apiloImageUUIDs,
                    },
                ],
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${props.authToken}`,
                    },
                }
            );

            toast.success("Produkt " + response.data + " został pomyślnie dodany.");


            // Dodawanie zdjęć produktu
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
                    toast.success(`Zdjęcie ${i + 1} poprawnie dodane`);
                } catch (error) {
                    console.error("Image upload error:", error);
                    toast.error("Błąd podczas dodawania zdjęcia");
                    throw error;
                }
            }

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd HTTP:", error.response?.status, error.response?.data);
                toast.error("Wystąpił błąd podczas dodawania produktu");
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error("Wystąpił błąd podczas dodawania produktu");
            }
        } finally {
            setLoading(false);
            apiloImageUUIDs = [];
        }
    };

    return (
        <div className="addProductMainContainer">
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column" }}>
                <RelatedProductsSelect authToken={props.authToken} value={relatedPackId} onChange={setRelatedPackId} />
                <Box sx={{ py: 2, display: "grid", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                    <ThemeProvider theme={MainTheme}>
                        <h2>Dodaj produkt</h2>
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
                        <TextField required label="SKU" {...register("SKU")} />
                        <TextField required label="Ilość" type="number"{...register("stock")} />
                        <TextField required label="Cena" type="number"{...register("price")} />

                        <FormControl fullWidth>
                            <InputLabel>Gabaryt</InputLabel>
                            <Select {...register("gauge")}
                                label="Gabaryt">
                                <MenuItem value="5">Paczkomaty Ok</MenuItem>
                                <MenuItem value="6">Tylko kurier</MenuItem>
                            </Select>
                        </FormControl>

                        <Autocomplete
                            options={producers}
                            getOptionLabel={(option) => option?.name ?? ""}
                            isOptionEqualToValue={(option, value) => option.producer_id === value.producer_id}
                            renderOption={(props, option, index) => (
                                <li {...props} key={option.producer_id}>
                                    {option.name}
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

                        <Autocomplete
                            renderOption={(props, option, index) => (
                                <li {...props} key={option.category_id}>
                                    {getCategoryName(option)}
                                </li>
                            )}
                            options={categories}
                            getOptionLabel={getCategoryName}
                            isOptionEqualToValue={(option, value) => option?.category_id === value?.category_id} // Zapobiega warningom
                            renderInput={(params) => <TextField {...params} label="Kategoria" />}
                            onChange={(event, value) => {
                                setValue("categoryId", value?.category_id || 0);
                                setAttributeList([]);
                                setLoading(true); // Ustawiamy loading na true

                                const attributeGroups = getCategoryAttributeGroups(value);

                                if (attributeGroups.length > 0) {
                                    Promise.all(attributeGroups.map(handleGetAttributeList))
                                        .then((results) => {
                                            const allAttributes = results.flat(); // Flattern wyników
                                            setAttributeList(allAttributes);
                                        })
                                        .catch((error) => {
                                            console.error("Błąd podczas pobierania atrybutów:", error);
                                        })
                                        .finally(() => {
                                            setLoading(false); // Ustawiamy loading na false po zakończeniu
                                        });
                                } else {
                                    setLoading(false); // Ustawiamy loading na false, jeśli nie ma atrybutów
                                }
                            }}
                        />


                        {!loading && attributeList.map((attribute) => { // Renderujemy tylko, gdy loading jest false
                            if (attribute && attribute.type == "2") {
                                return (
                                    <FormControl key={attribute.attribute_id} fullWidth>
                                        <InputLabel id={`select-${attribute.attribute_id}-label`}>{attribute.name}</InputLabel>
                                        <Select
                                            labelId={`select-${attribute.attribute_id}-label`}
                                            id={`select-${attribute.attribute_id}`}
                                            {...register(`attribute_${attribute.attribute_id}`)}
                                            label={attribute.name}
                                        >

                                            {attribute.options.map((option) => (

                                                <MenuItem key={option.option_id} value={option.value || ''}>
                                                    {option.value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                );
                            }
                            if (attribute && attribute.type == "1") {
                                return (
                                    <FormControlLabel
                                        key={attribute.attribute_id}
                                        control={
                                            <Checkbox
                                                {...register(`attribute_${attribute.attribute_id}`)}
                                            />
                                        }
                                        label={attribute.name}
                                    />
                                );
                            }
                            if (attribute && attribute.type == "0") {
                                return (
                                    <TextField
                                        key={attribute.attribute_id}
                                        label={attribute.name}
                                        variant="outlined"
                                        type="text"
                                        {...register(`attribute_${attribute.attribute_id}`)}
                                        fullWidth
                                    />
                                );
                            }
                            return null;
                        })}

                        <Button
                            variant="contained"
                            component="label"
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
                        <Button variant="contained" type="submit">
                            Dodaj
                        </Button>
                    </ThemeProvider>
                </Box>
            </form>
            <div className="preview">
                <div style={{ backgroundColor: 'white', color: 'black', lineHeight: "0.8", padding: '20px' }}>
                    <Editor
                        editorState={editorState}
                        wrapperClassName="demo-wrapper"
                        editorClassName="demo-editor"
                        onEditorStateChange={onEditorStateChange}
                    />
                </div>
            </div>
        </div>
    );
}

export default AddCustomProduct;
