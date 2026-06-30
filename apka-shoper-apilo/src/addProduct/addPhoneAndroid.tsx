import axios from "axios";
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Autocomplete, Box, Button, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, TextField, ThemeProvider, Typography } from "@mui/material";
import { MainTheme } from "./themes";
import { API_URL } from "../config";
import './addProducts.css';
import { handleImageUpload } from "../image-host";
import { monitorVC, monitorVC_CZ, monitorVC_SK, pcVC } from "./additionalDescriptions/visualConditionDescriptions";
import { systemType } from "./additionalDescriptions/pcAdditionalDescription";
import { AndroidTemplate } from "./templates/androidTemplate";
import { handleTranslateCZ, handleTranslateSK } from "../backendQueries/translate";
import { AndroidTemplateCZ } from "./templatesCZ/androidTemplateCZ";
import { AndroidTemplateSK } from "./templatesSK/androidTemplateSK";
import { ProductSafetyCertificateResource, ProductSafetyProducerResource } from "../types";
import { handleGetProductSafetyProducers } from "../backendQueries/getProductSafetyProducers";
import { handleGetProductSafetyCertificates } from "../backendQueries/getProductSafetyCertificates";
import RelatedProductsSelect from "../relatedProductsSelect";

type AddphoneIOSProps = {
    authToken: string,
}

interface IFormInput {
    model: string,
    grade: string,
    cpu: string,
    ramAmount: string
    diskSize: string,
    screen: string,
    battery: string,
    SKU: string,
    name: string,
    category_id: number,
    stock: number,
    price: number,
    description: string,
    descriptionCZ: string,
    descriptionSK: string,
    active: boolean,
    producer: number,
    frontCamera: string,
    backCamera: string,
    waterproof: boolean,
    dualSim: boolean,
    connection: string,
    wirelessCharging: boolean,
    NFC: boolean,
    resolution: string,
    batteryCapacity: string,
    diagonal: string,
    system: string,
    G5: boolean,
    additionalInfo: string,
    additionalInfoSK: string,
    screenName: string,
    simType: string,
    matrixGrade: string,
    status: string,
    lens_ultraWide: boolean,
    lens_tele: boolean,
    lens_lidar: boolean,
    descriptionLanguage: string,
    productSafetyProducerId?: number,
    productSafetyCertificateIds?: number[],
    productSafetyWarnings?: string[]
}

interface CategoryResource {
    category_id: number;
    translations: {
        pl_PL: {
            active: number;
            name: string;
            attribute_groups: string[];
        };
    };
}

interface ProducersResource {
    producer_id: number;
    name: string;
    translations: {
        pl_PL: {
        };
    };
}
let deviceType = ""
function AddPhoneAndroid(props: AddphoneIOSProps) {
    const { register, handleSubmit, watch, setValue, control } = useForm<IFormInput>()
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imageLinks, setImageLinks] = useState<string[]>([]);
    const [categories, setCategories] = useState<CategoryResource[]>([]);
    const [producers, setProducers] = useState<ProducersResource[]>([]);
    const [productSafetyProducers, setProductSafetyProducers] = useState<ProductSafetyProducerResource[]>([]);
    const [productSafetyCertificates, setProductSafetyCertificates] = useState<ProductSafetyCertificateResource[]>([]);
    const [additionalInfoCZ, setAdditionalInfoCZ] = useState("");
    const [additionalInfoSK, setAdditionalInfoSK] = useState("");
    const [nameCZ, setNameCZ] = useState("");
    const [nameSK, setNameSK] = useState("");
    const [relatedPackId, setRelatedPackId] = useState("");
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

    const {
    } = useForm<String>()
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
                        filters: JSON.stringify({
                            "translations.pl_PL.active": 1,
                        }),
                    },
                });

                allCategories = allCategories.concat(response.data.list);
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


    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        try {
            //dodaj zdjęcia do apilo
            try {
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
                    toast.success(`Zdjęcie ${i + 1} poprawnie dodane!`);
                }
            } catch (error) {
                console.error("Image upload error:", error);
                toast.error("Błąd podczas dodawania zdjęcia na apilo");
            }
            // try {
            //     setNameCZ(await handleTranslateCZ(data.name))
            //     setNameSK(await handleTranslateSK(data.name))
            //     console.log(nameCZ);
            //     toast.success("przetłumaczono");
            // } catch (error) {
            //     console.error("Błąd podczas tłumaczenia:", error);
            //     toast.error("błąd w tłumaczeniu");
            // }

            const safetyProducerId = normalizeIdValue(data.productSafetyProducerId) ?? 0;
            const safetyCertificateIds = Array.isArray(data.productSafetyCertificateIds)
                ? data.productSafetyCertificateIds
                : [];
            const safetyInformation: Record<string, unknown> = {};
            if (safetyProducerId) safetyInformation.gpsr_producer_id = safetyProducerId;
            if (safetyCertificateIds.length) safetyInformation.gpsr_certificates = safetyCertificateIds;

            const response = await axios.post(`${API_URL}/product/shoper`, {
                producer_id: data.producer,
                category_id: data.category_id,
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
                        description: data.descriptionCZ,
                        active: data.active
                    },
                    sk_SK: {
                        name: nameSK,
                        description: data.descriptionSK,
                        active: data.active
                    },
                },
                stock: {
                    price: data.price,
                    active: 1,
                    stock: data.stock,
                    delivery_id: 1
                },
                attributes: {
                    307: "24 miesiące",
                    291: data.status,
                    929: data.connection,
                    928: data.model,
                    925: data.frontCamera + "Mpx",
                    924: data.backCamera + "Mpx",
                    923: data.screen,
                    922: data.system,
                    920: data.waterproof,
                    919: data.dualSim,
                    917: data.wirelessCharging,
                    916: data.NFC,
                    915: data.G5,
                    914: data.resolution + " px",
                    902: data.matrixGrade,
                    901: data.cpu,
                    900: data.batteryCapacity + " mAh",
                    899: data.diagonal + `"`,
                    897: data.ramAmount,
                    898: data.diskSize


                },
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
            toast.success("Produkt " + response.data + " został pomyślnie dodany.");

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
                                    "value": `<p>✅ Stan matrycy -   <b>${matrixGrade}</b> (${monitorVC[matrixGrade]})</p><p>${additionalInfo}</p>`
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
                                        <li><b>Ekran:</b> przekątna ${data.diagonal}", ${data.screen} ${data.screenName}, rozdzielczość: ${data.resolution}</li>
                                        <li><b>Aparat:</b> tył: ${data.backCamera} px, przód: ${data.frontCamera} px, ${data.lens_ultraWide ? "obiektyw szerokokątny, " : ""} ${data.lens_tele ? "teleobiektyw, " : ""} ${data.lens_lidar ? "czujnik głębi (LIDAR)" : ""}</li>
                                        <li><b>Łączność:</b> Bluetooth, ${data.G5 ? "5G, " : ""} ${data.NFC ? "NFC" : ""} WIFI</li>
                                        <li><b>System:</b> ${data.system}</li>
                                        <li><b>Ładowanie:</b> ${data.wirelessCharging ? "bezprzewodowe, przewodowe" : "przewodowe"}</li>
                                        <li><b>Złącze:</b> ${data.connection}</li>
                                        <li><b>${data.dualSim ? "Dual sim:" : "Rodzaj karty SIM"}</b>  ${data.simType} </li>
                                        <li><b>Pojemność baterii:</b> ${data.batteryCapacity}mAh</li>

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
    let G5 = watch("G5", false);
    let NFC = watch("NFC", false);
    let wirelessCharging = watch("wirelessCharging", false);
    let waterproof = watch("waterproof", false);
    let dualSim = watch("dualSim", false);
    let lens_ultraWide = watch("lens_ultraWide", false);
    let lens_tele = watch("lens_tele", false);
    let lens_lidar = watch("lens_lidar", false);
    let screenName = watch("screenName", "")
    let matrixGrade = watch("matrixGrade", "")
    let resolution = watch("resolution", "")
    let diagonal = watch("diagonal", "")
    let category_id = watch("category_id",)
    let backCamera = watch("backCamera", "")
    let frontCamera = watch("frontCamera", "")
    let descriptionLanguage = watch("descriptionLanguage", "description")


    let descriptionSK = watch("descriptionSK", AndroidTemplateSK(
        additionalInfoSK,
        G5,
        NFC,
        wirelessCharging,
        dualSim,
        waterproof,
        screenName,
        screen,
        monitorVC_SK[matrixGrade],
        resolution,
        diagonal,
        lens_ultraWide,
        lens_tele,
        lens_lidar,
        deviceType,
        backCamera,
        frontCamera
    ));

    let descriptionCZ = watch("descriptionCZ", AndroidTemplateCZ(
        additionalInfoCZ,
        G5,
        NFC,
        wirelessCharging,
        dualSim,
        waterproof,
        screenName,
        screen,
        monitorVC_CZ[matrixGrade],
        resolution,
        diagonal,
        lens_ultraWide,
        lens_tele,
        lens_lidar,
        deviceType,
        backCamera,
        frontCamera
    ));
    let description = watch("description", AndroidTemplate(
        additionalInfo,
        G5,
        NFC,
        wirelessCharging,
        dualSim,
        waterproof,
        screenName,
        screen,
        matrixGrade + "(" + monitorVC[matrixGrade] + ")",
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
        setValue("descriptionSK", AndroidTemplateSK(
            additionalInfoSK,
            G5,
            NFC,
            wirelessCharging,
            dualSim,
            waterproof,
            screenName,
            screen,
            monitorVC_SK[matrixGrade],
            resolution,
            diagonal,
            lens_ultraWide,
            lens_tele,
            lens_lidar,
            deviceType,
            backCamera,
            frontCamera
        ));

        setValue("descriptionCZ", AndroidTemplateCZ(
            additionalInfoCZ,
            G5,
            NFC,
            wirelessCharging,
            dualSim,
            waterproof,
            screenName,
            screen,
            monitorVC_CZ[matrixGrade],
            resolution,
            diagonal,
            lens_ultraWide,
            lens_tele,
            lens_lidar,
            deviceType,
            backCamera,
            frontCamera
        ));
        setValue("description", AndroidTemplate(
            additionalInfo,
            G5,
            NFC,
            wirelessCharging,
            dualSim,
            waterproof,
            screenName,
            screen,
            matrixGrade + "(" + monitorVC[matrixGrade] + ")",
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
        category_id,
        backCamera,
        frontCamera,
        additionalInfoCZ,
        additionalInfoSK,
        setValue]);

    return (
        <>
            <div className="addProductMainContainer">
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column' }}>
                    <RelatedProductsSelect authToken={props.authToken} value={relatedPackId} onChange={setRelatedPackId} />
                    <Box
                        sx={{ py: 2, display: 'grid', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
                    >
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
                            <FormControlLabel control={<Checkbox defaultChecked {...register("active")} />} label="Aktywność" />
                            <TextField label="SKU" {...register("SKU")} />
                            <TextField label="Ilość" type="number"{...register("stock")} />
                            <TextField label="Cena" type="number"{...register("price")} />
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
                            <TextField label="Model" type="text"{...register("model")} />

                            <Autocomplete
                                renderOption={(props, option) => (
                                    <li {...props} key={option.category_id}>
                                        {option.translations.pl_PL.name}
                                    </li>
                                )}
                                options={categories.filter(category_id =>
                                    category_id.translations.pl_PL.name.toLowerCase().includes("telefon") ||
                                    category_id.translations.pl_PL.name.toLowerCase().includes("tablet") ||
                                    category_id.translations.pl_PL.name.toLowerCase().includes("smart")
                                )}

                                getOptionLabel={(option) => option?.translations?.pl_PL?.name || "Nieznana kategoria"}
                                isOptionEqualToValue={(option, value) => option?.category_id === value?.category_id} // Zapobiega warningom
                                renderInput={(params) => <TextField {...params} label="Kategoria" />}
                                onChange={(event, value) => {
                                    setValue("category_id", value?.category_id || 0);
                                }}
                            />

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


                            <FormControl fullWidth >
                                <InputLabel>stan matrycy</InputLabel>
                                <Select
                                    label="stan matrycy"
                                    {...register("matrixGrade")}
                                >
                                    <MenuItem value="Klasa A">Klasa A</MenuItem>
                                    <MenuItem value="Klasa A-">Klasa A-</MenuItem>
                                    <MenuItem value="Klasa B">Klasa B-</MenuItem>
                                    <MenuItem value="Klasa C">Klasa C</MenuItem>

                                </Select>
                            </FormControl>


                            <FormControl fullWidth >
                                <InputLabel>stan</InputLabel>
                                <Select
                                    label="stan"
                                    {...register("status")}
                                >
                                    <MenuItem value="Poleasingowy">Poleasingowy</MenuItem>
                                    <MenuItem value="Używany">Używany</MenuItem>
                                    <MenuItem value="Nowy">Nowy</MenuItem>
                                    <MenuItem value="Po zwrocie">Po zwrocie</MenuItem>
                                    <MenuItem value="Powystawowy">Powystawowy</MenuItem>
                                    <MenuItem value="Uszkodzony">Uszkodzony</MenuItem>
                                    <MenuItem value="Odnowiony przez producenta">Odnowiony przez producenta</MenuItem>
                                    <MenuItem value="Odnowiony przez sprzedawcę">Odnowiony przez sprzedawcę</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Uwagi"
                                type="text"
                                {...register("additionalInfo", {
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
                                })}
                            />
                            <TextField label="aparat przedni (liczba MPX)" type="text"{...register("frontCamera")} />
                            <TextField label="aparat tylni (liczba MPX)" type="text"{...register("backCamera")} />
                            <FormControl fullWidth >
                                <InputLabel>Typ ekranu</InputLabel>
                                <Select {...register("screen")} label="Typ ekranu">
                                    <MenuItem value="LCD">LCD</MenuItem>
                                    <MenuItem value="OLED">OLED</MenuItem>
                                    <MenuItem value="IPS">IPS</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField label="nazwa ekranu" type="text"{...register("screenName")} />

                            <FormControl fullWidth >
                                <InputLabel>System</InputLabel>
                                <Select {...register("system")} label="System">
                                    <MenuItem value="Android 4.4">Android 4.4</MenuItem>
                                    <MenuItem value="Android 5">Android 5</MenuItem>
                                    <MenuItem value="Android 6">Android 6</MenuItem>
                                    <MenuItem value="Android 7">Android 7</MenuItem>
                                    <MenuItem value="Android 8">Android 8</MenuItem>
                                    <MenuItem value="Android 9">Android 9</MenuItem>
                                    <MenuItem value="Android 10">Android 10</MenuItem>
                                    <MenuItem value="Android 11">Android 11</MenuItem>
                                    <MenuItem value="Android 12">Android 12</MenuItem>
                                    <MenuItem value="Android 13">Android 13</MenuItem>
                                    <MenuItem value="Android 14">Android 14</MenuItem>

                                </Select>
                            </FormControl>
                            <FormControlLabel control={<Checkbox  {...register("waterproof")} />} label="Wodoodporność" />
                            <FormControlLabel control={<Checkbox  {...register("dualSim")} />} label="Dual sim" />
                            <FormControlLabel control={<Checkbox  {...register("wirelessCharging")} />} label="Ładowanie bezprzewodowe" />
                            <FormControlLabel control={<Checkbox  {...register("NFC")} />} label="NFC" />
                            <FormControlLabel control={<Checkbox  {...register("G5")} />} label="5G" />

                            <FormControlLabel control={<Checkbox  {...register("lens_ultraWide")} />} label="obiektyw szerokokątny" />
                            <FormControlLabel control={<Checkbox  {...register("lens_tele")} />} label="teleobiektyw" />
                            <FormControlLabel control={<Checkbox  {...register("lens_lidar")} />} label="czujnik głębi (LIDAR)" />


                            <TextField label="Rozdzielczość" type="text"{...register("resolution")} />

                            <FormControl fullWidth>
                                <InputLabel>złącze</InputLabel>
                                <Select
                                    {...register("connection")}
                                    label="złącze"
                                >
                                    <MenuItem value="USB-C">USB-C</MenuItem>
                                    <MenuItem value="micro USB">micro USB</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Rodzaj karty SIM</InputLabel>
                                <Select
                                    {...register("simType")}
                                    label="Rodzaj karty SIM"
                                >
                                    <MenuItem value="nanoSIM">nanoSIM</MenuItem>
                                    <MenuItem value="microSIM">microSIM</MenuItem>
                                    <MenuItem value="miniSIM">miniSIM</MenuItem>
                                    <MenuItem value="eSIM">eSIM</MenuItem>
                                    <MenuItem value="nanoSIM + eSIM"> nanoSIM + eSIM</MenuItem>
                                    <MenuItem value="nanoSIM + nanoSIM"> nanoSIM + nanoSIM</MenuItem>

                                    <MenuItem value="brak">brak</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth >
                                <InputLabel>Klasa wizualna</InputLabel>
                                <Select {...register("grade")} label="Klasa wizualna">
                                    <MenuItem value="Klasa A">Klasa A</MenuItem>
                                    <MenuItem value="Klasa B">Klasa B</MenuItem>
                                    <MenuItem value="Klasa C">Klasa C</MenuItem>
                                    <MenuItem value="Klasa A-">Klasa A-</MenuItem>
                                    <MenuItem value="Powystawowy">Powystawowy </MenuItem>
                                </Select>
                            </FormControl>

                            <TextField label="Procesor" type="text"{...register("cpu")} />
                            <TextField label="Pojemość baterii(mAh)" type="number"{...register("batteryCapacity")} />
                            <TextField label="przekątna ekranu(cale)" type="text"{...register("diagonal")} />

                            <FormControl fullWidth >
                                <InputLabel>Pojemność dysku</InputLabel>
                                <Select {...register("diskSize")} label="Pojemność dysku">
                                    <MenuItem value="16GB">16GB</MenuItem>
                                    <MenuItem value="24GB">24GB</MenuItem>
                                    <MenuItem value="32GB">32GB</MenuItem>
                                    <MenuItem value="64GB">64GB</MenuItem>
                                    <MenuItem value="128GB">128GB</MenuItem>
                                    <MenuItem value="256GB">256GB</MenuItem>
                                    <MenuItem value="512GB">512GB</MenuItem>
                                    <MenuItem value="1TB">1TB</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth >
                                <InputLabel>Ilość pamięci Ram</InputLabel>
                                <Select {...register("ramAmount")} label="Ilość pamięci Ram">
                                    <MenuItem value="1GB">1GB</MenuItem>
                                    <MenuItem value="2GB">2GB</MenuItem>
                                    <MenuItem value="3GB">3GB</MenuItem>
                                    <MenuItem value="4GB">4GB</MenuItem>
                                    <MenuItem value="5GB">5GB</MenuItem>
                                    <MenuItem value="6GB">6GB</MenuItem>
                                    <MenuItem value="7GB">7GB</MenuItem>
                                    <MenuItem value="8GB">8GB</MenuItem>
                                    <MenuItem value="9GB">9GB</MenuItem>
                                    <MenuItem value="10GB">10GB</MenuItem>
                                    <MenuItem value="11GB">11GB</MenuItem>
                                    <MenuItem value="12GB">12GB</MenuItem>
                                    <MenuItem value="13GB">13GB</MenuItem>
                                    <MenuItem value="14GB">14GB</MenuItem>
                                    <MenuItem value="15GB">15GB</MenuItem>
                                    <MenuItem value="16GB">16GB</MenuItem>
                                    <MenuItem value="24GB">24GB</MenuItem>
                                </Select>
                            </FormControl>


                            <label >opis</label>
                            <textarea defaultValue={AndroidTemplate('', false, false, false, false, false, "", "", '', '', '', false, false, false, '', '', '')}  {...register("description")} />
                            <textarea defaultValue={AndroidTemplateCZ('', false, false, false, false, false, "", "", '', '', '', false, false, false, '', '', '')}  {...register("descriptionCZ")} />
                            <textarea defaultValue={AndroidTemplateSK('', false, false, false, false, false, "", "", '', '', '', false, false, false, '', '', '')}  {...register("descriptionSK")} />
                            <label>Dodaj zdjęcia</label>
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

                            <Button variant="outlined" type="reset"  >Reset formularza</Button>
                            <Button variant="contained" type="submit" >Dodaj</Button>
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
            </div>

        </>
    );
}

export default AddPhoneAndroid;
