import axios from "axios";
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Autocomplete, Box, Button, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, TextField, ThemeProvider, Typography } from "@mui/material";
import { MainTheme } from "./themes";
import { API_URL } from "../config";
import './addProducts.css';
import { ProductImageManager, useProductImages } from "./productImageManager";
import { batteryDescription, GradeDescriptios, keyboardDescription, LaptopTemplate, matrixGradeDescriptios } from "./templates/laptopTemplate";
import { LaptopTemplateApilo } from "./templates/laptopTemplate-apilo";
import { LaptopTemplateCZ } from "./templatesCZ/laptopTemplateCZ";
import { LaptopTemplateSK } from "./templatesSK/laptopTemplateSK";
import { batteryDescriptionCZ, batteryDescriptionSK, GradeDescriptionsCZ, GradeDescriptionsSK, keyboardDescriptionCZ, keyboardDescriptionSK, matrixGradeDescriptiosCZ, matrixGradeDescriptiosSK } from "./additionalDescriptions/visualConditionDescriptions";
import { handleTranslateCZ, handleTranslateSK } from "../backendQueries/translate";
import { LaptopAttributes_CZ, LaptopAttributes_SK, LaptopStatusKey } from "./additionalDescriptions/attributesTranslations";
import RelatedProductsSelect from "../relatedProductsSelect";
import React from "react";
import { getShoperErrorMessage } from "../backendQueries/shoperErrorMessage";
import { ApiloSubmitControls } from "./apiloSubmitControls";

type AddLaptopProps = {
    authToken: string,
}

interface IFormInput {
    system: string
    name: string,
    cpu: string,
    cpuModel: string,
    gpu: LaptopStatusKey,
    diskType: string,
    diskSize: string,
    ramType: string,
    ramAmount: string
    screen: string,
    status: LaptopStatusKey,
    matrixGrade: LaptopStatusKey,
    matrixSize: string,
    SKU: string,
    stock: number,
    price: number,
    color: string,
    vebCam: boolean,
    showLibre: boolean,
    battery: LaptopStatusKey,
    grade: LaptopStatusKey,
    keyboard: LaptopStatusKey,
    categoryId: number;
    AdditionalCategories: number[],
    GPU_type: LaptopStatusKey,
    keyboardLight: LaptopStatusKey,
    dvd: LaptopStatusKey,
    touchScreen: LaptopStatusKey,
    type: string,
    cores: string,
    threads: string,
    frequency: string,
    frequencyTurbo: string,
    matrixType: LaptopStatusKey,
    usb2: string,
    usb3: string,
    usbC: string,
    miniJack: string,
    lan: boolean,
    dSub: boolean,
    cardReader: boolean,
    dockingPort: boolean,
    KensingtonLock: boolean,
    displayPort: boolean,
    hdmi: boolean,
    miniDP: boolean,
    miniHDMI: boolean,
    eSATA: boolean,
    wifi: boolean,
    modem: boolean,
    bluetooth: boolean,
    thunderbolt: boolean,
    additionalInfo_keyboard: string,
    additionalInfo_case: string,
    additionalInfo_matrix: string,
    active: boolean,
    model: string,
    marka: string,
    description: string,
    descriptionCZ: string
    descriptionSK: string
    descriptionApilo: string,
    descriptionLanguage: string
    visualCondition: string,
    category: string,
    producer: number,
    showWin11info: boolean
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

function AddLaptop(props: AddLaptopProps) {
    const [producers, setProducers] = useState<ProducersResource[]>([]);
    const [portsListString, setPortsListString] = useState("");
    const { register, handleSubmit, setValue, reset, watch, control } = useForm<IFormInput>();
    const images = useProductImages();
    const { selectedImages, imageLinks } = images;
    const [addToApilo, setAddToApilo] = useState(true);
    // const [apiloImageUUIDS, setApiloImageUUIDS] = useState<string[]>([]);
    const [categories, setCategories] = useState<CategoryResource[]>([]);
    const [nameCZ, setNameCZ] = useState("");
    const [nameSK, setNameSK] = useState("");
    const [additinalKeyboardInfoCZ, setAdditinalKeyboardInfoCZ] = useState("");
    const [additinalKeyboardInfoSK, setAdditinalKeyboardInfoSK] = useState("");
    const [additinalMatrixInfoCZ, setAdditinalMatrixInfoCZ] = useState("");
    const [additinalMatrixInfoSK, setAdditinalMatrixInfoSK] = useState("");
    const [additinalcaseInfoCZ, setAdditinalcaseInfoCZ] = useState("");
    const [additinalcaseInfoSK, setAdditinalcaseInfoSK] = useState("");
    const [relatedPackId, setRelatedPackId] = useState("");
    let apiloImageUUIDs: string[] = [];


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
    }, []);


    const onSubmit: SubmitHandler<IFormInput> = async (data) => {

        try {
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

            const response = await axios.post(`${API_URL}/product/shoper`, {
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
                    168: data.status,
                    179: data.type, //doto
                    815: data.model, //todo
                    816: data.cpuModel,
                    817: data.cores, //todo
                    818: data.threads, //todo
                    819: data.frequency, //todo
                    820: data.frequencyTurbo, //todo
                    172: data.cpu,
                    174: data.ramAmount,
                    341: data.ramType,
                    177: data.GPU_type,
                    821: data.gpu,
                    822: data.diskSize,
                    315: data.matrixGrade,
                    176: data.diskType,
                    824: data.keyboard,
                    314: data.grade,
                    170: data.matrixType,
                    340: data.keyboardLight,
                    825: data.battery,
                    826: data.usb2,
                    827: data.usb3,
                    828: data.usbC,
                    829: data.miniJack,
                    338: data.lan,
                    324: data.dSub,
                    332: data.cardReader,
                    321: data.dockingPort,
                    830: data.KensingtonLock,
                    320: data.displayPort,
                    317: data.hdmi,
                    334: data.miniDP,
                    333: data.miniHDMI,
                    319: data.eSATA,
                    325: data.wifi,
                    328: data.modem,
                    326: data.bluetooth,
                    335: data.thunderbolt,
                    339: data.dvd,
                    171: data.touchScreen,
                    330: data.vebCam,
                    270: data.matrixSize,
                    169: data.screen,
                    178: data.system,
                    271: data.color,
                },
                gauge_id: 7,
                ...(relatedPackId ? { related_pack_id: relatedPackId } : {}),
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${props.authToken}`
                }
            });

            const updateDescription = async () => {
                try {
                    const updateResponse = await axios.put(`${API_URL}/product/${response.data}`, {
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
                            // 307: "24 miesiące", //todo
                            930: LaptopAttributes_SK[data.status],
                            931: data.model,
                            932: data.cpuModel,
                            933: data.cpu,
                            934: data.cores,
                            935: data.threads,
                            936: data.frequency,
                            937: data.frequencyTurbo,
                            938: data.ramAmount,
                            939: data.ramType,
                            940: LaptopAttributes_SK[data.GPU_type],
                            941: data.gpu,
                            942: data.diskType,
                            943: data.diskSize,
                            944: LaptopAttributes_SK[data.keyboard],
                            945: LaptopAttributes_SK[data.keyboardLight],
                            946: LaptopAttributes_SK[data.grade],
                            947: LaptopAttributes_SK[data.matrixGrade],
                            948: data.matrixSize,
                            949: LaptopAttributes_SK[data.matrixType],
                            950: data.screen,
                            952: LaptopAttributes_SK[data.battery],
                            951: data.system,
                            953: LaptopAttributes_SK[data.touchScreen],
                            954: data.miniJack,
                            955: data.usb2,
                            956: data.usb3,
                            957: data.usbC,
                            959: data.hdmi,
                            960: data.displayPort,
                            961: data.dSub,
                            962: data.miniDP,
                            963: data.miniHDMI,
                            964: data.lan,
                            965: data.cardReader,
                            966: data.KensingtonLock,
                            967: data.vebCam,
                            968: data.wifi,
                            969: data.modem,
                            970: data.thunderbolt,
                            971: data.bluetooth,
                            972: LaptopAttributes_SK[data.dvd],

                            973: LaptopAttributes_CZ[data.status],
                            974: data.model,
                            975: data.cpuModel,
                            976: data.cpu,
                            977: data.cores,
                            978: data.threads,
                            979: data.frequency,
                            980: data.frequencyTurbo,
                            981: data.ramAmount,
                            982: data.ramType,
                            983: LaptopAttributes_CZ[data.GPU_type],
                            984: data.gpu,
                            985: data.diskType,
                            986: data.diskSize,
                            987: LaptopAttributes_CZ[data.keyboard],
                            988: LaptopAttributes_CZ[data.keyboardLight],
                            989: LaptopAttributes_CZ[data.grade],
                            990: LaptopAttributes_CZ[data.matrixGrade],
                            991: data.matrixSize,
                            992: LaptopAttributes_CZ[data.matrixType],
                            993: data.screen,
                            994: LaptopAttributes_CZ[data.battery],
                            995: data.system,
                            996: LaptopAttributes_CZ[data.touchScreen],
                            997: data.miniJack,
                            998: data.usb2,
                            999: data.usb3,
                            1000: data.usbC,
                            1001: data.hdmi,
                            1002: data.displayPort,
                            1003: data.dSub,
                            1004: data.miniDP,
                            1005: data.miniHDMI,
                            1006: data.lan,
                            1007: data.cardReader,
                            1008: data.KensingtonLock,
                            1009: data.vebCam,
                            1010: data.wifi,
                            1011: data.modem,
                            1012: data.thunderbolt,
                            1013: data.bluetooth,
                            1014: LaptopAttributes_CZ[data.dvd]

                        },
                        // gauge_id: 5,
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
                        toast.error("Wystąpił błąd podczas update");
                    } else {
                        console.error("Błąd aplikacji:", error);
                        toast.error("Wystąpił błąd podczas update");
                    }
                }
            }

            updateDescription()
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
                        "description": data.descriptionApilo,
                        "images": apiloImageUUIDs
                    }
                ]
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
                toast.error(getShoperErrorMessage(error));
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error(getShoperErrorMessage(error));
            }

        };
        apiloImageUUIDs = []
    }
    let system = watch("system", "")
    let name = watch("name", "");
    let cpu = watch("cpu", "");
    let cpuModel = watch("cpuModel", "");
    let gpu = watch("gpu",);
    let diskType = watch("diskType", "");
    let diskSize = watch("diskSize", "");
    let ramType = watch("ramType", "");
    let ramAmount = watch("ramAmount", "");
    let screen = watch("screen", "");
    let status = watch("status",);
    let matrixGrade = watch("matrixGrade",);
    let matrixSize = watch("matrixSize",);
    let color = watch("color", "");
    let grade = watch("grade",);
    let keyboard = watch("keyboard",);
    let showWin11 = true
    let showWin10 = false
    let showMacOS = false
    let additionalInfo_keyboard = watch("additionalInfo_keyboard", "");
    let additionalInfo_case = watch("additionalInfo_case", "");
    let additionalInfo_matrix = watch("additionalInfo_matrix", "");
    let cores = watch("cores", "");
    let threads = watch("threads", "");
    let frequency = watch("frequency", "");
    let frequency_turbo = watch("frequencyTurbo", "");
    let matrixType = watch("matrixType", "");
    let touchScreen = watch("touchScreen",);
    let model = watch("model", "");
    let usb3 = watch("usb3", "");
    let usb2 = watch("usb2", "");
    let usbC = watch("usbC", "");
    let miniJack = watch("miniJack", "");
    let thunderbolt = watch("thunderbolt", false) as boolean;
    let HDMI = watch("hdmi", false) as boolean;
    let LAN = watch("lan", false);
    let reader = watch("cardReader", false);
    let DP = watch("displayPort", false);
    let dSUB = watch("dSub", false);
    let miniHDMI = watch("miniHDMI", false);
    let miniDP = watch("miniDP", false);
    let dockingPort = watch("dockingPort", false);
    let modem = watch("modem", false)
    let battery = watch("battery",);
    let vebCam = watch("vebCam", true);
    let showLibre = watch("showLibre", true)
    let descriptionLanguage = watch("descriptionLanguage", "description")
    let showWin11info = watch("showWin11info", false)

    let description = watch("description", LaptopTemplate(
        system, cpu, cpuModel, gpu, diskType, diskSize, ramType, ramAmount, screen, vebCam, showLibre,
        batteryDescription[battery], matrixGradeDescriptios[matrixGrade], GradeDescriptios[grade], keyboardDescription[keyboard], showWin11, showWin10, showMacOS, additionalInfo_keyboard, additionalInfo_case, additionalInfo_matrix, touchScreen, modem, showWin11info
    ));
    let descriptionCZ = watch("descriptionCZ", LaptopTemplateCZ(
        system, cpu, cpuModel, gpu, diskType, diskSize, ramType, ramAmount, screen, vebCam, showLibre,
        batteryDescriptionCZ[battery], matrixGradeDescriptiosCZ[matrixGrade], GradeDescriptionsCZ[grade], keyboardDescriptionCZ[keyboard], showWin11, showWin10, showMacOS, additinalKeyboardInfoCZ, additinalcaseInfoCZ, additinalMatrixInfoCZ, touchScreen, modem
    ));
    let descriptionSK = watch("descriptionSK", LaptopTemplateSK(
        system, cpu, cpuModel, gpu, diskType, diskSize, ramType, ramAmount, screen, vebCam, showLibre,
        batteryDescriptionSK[battery], matrixGradeDescriptiosSK[matrixGrade], GradeDescriptionsSK[grade], keyboardDescriptionSK[keyboard], showWin11, showWin10, showMacOS, additinalKeyboardInfoSK, additinalcaseInfoSK, additinalMatrixInfoSK, touchScreen, modem
    ));
    let descriptionApilo = watch("descriptionApilo", LaptopTemplateApilo(system, cpu, cpuModel, gpu, diskType, diskSize, ramType, ramAmount, screen, vebCam, showLibre,
        batteryDescription[battery], matrixGradeDescriptios[matrixGrade], GradeDescriptios[grade], keyboardDescription[keyboard], showWin11, showWin10, showMacOS, additionalInfo_keyboard, additionalInfo_case, additionalInfo_matrix, cores,
        threads,
        frequency,
        frequency_turbo,
        matrixSize,
        matrixType,
        touchScreen,
        model,
        usb3,
        usb2,
        usbC,
        thunderbolt,
        miniJack,
        HDMI,
        LAN,
        reader,
        DP,
        dSUB,
        dockingPort,
        miniHDMI,
        miniDP,
    ))
    useEffect(() => {
        if (system.includes("Windows 10")) {
            showWin11 = false
            showWin10 = true
            showMacOS = false
        }
        if (system.includes("Windows 11")) {
            showWin11 = true
            showWin10 = false
            showMacOS = false
        }
        if (system.includes("macOS")) {
            showWin11 = false
            showWin10 = false
            showMacOS = true
        }
        if (!system.includes("Windows 10") && !system.includes("Windows 11") && !system.includes("macOS")) {
            showWin11 = false
            showWin10 = false
            showMacOS = false
        }
        setValue("description", LaptopTemplate(
            system,
            cpu, cpuModel, gpu, diskType, diskSize, ramType, ramAmount, screen, vebCam, showLibre,
            batteryDescription[battery], matrixGradeDescriptios[matrixGrade], GradeDescriptios[grade], keyboardDescription[keyboard], showWin11, showWin10, showMacOS, additionalInfo_keyboard, additionalInfo_case, additionalInfo_matrix, touchScreen, modem, showWin11info
        ));
        setValue("descriptionCZ", LaptopTemplateCZ(
            system,
            cpu, cpuModel, gpu, diskType, diskSize, ramType, ramAmount, screen, vebCam, showLibre,
            batteryDescriptionCZ[battery], matrixGradeDescriptiosCZ[matrixGrade], GradeDescriptionsCZ[grade], keyboardDescriptionCZ[keyboard], showWin11, showWin10, showMacOS, additinalKeyboardInfoCZ, additinalcaseInfoCZ, additinalMatrixInfoCZ, touchScreen, modem
        ));
        setValue("descriptionSK", LaptopTemplateSK(
            system,
            cpu, cpuModel, gpu, diskType, diskSize, ramType, ramAmount, screen, vebCam, showLibre,
            batteryDescriptionSK[battery], matrixGradeDescriptiosSK[matrixGrade], GradeDescriptionsSK[grade], keyboardDescriptionSK[keyboard], showWin11, showWin10, showMacOS, additinalKeyboardInfoSK, additinalcaseInfoSK, additinalMatrixInfoSK, touchScreen, modem
        ));

        setValue("descriptionApilo", LaptopTemplateApilo(
            system,
            cpu, cpuModel, gpu, diskType, diskSize, ramType, ramAmount, screen, vebCam, showLibre,
            batteryDescription[battery], matrixGradeDescriptios[matrixGrade], GradeDescriptios[grade], keyboardDescription[keyboard], showWin11, showWin10, showMacOS, additionalInfo_keyboard, additionalInfo_case, additionalInfo_matrix, cores, threads, frequency, frequency_turbo, matrixSize, matrixType, touchScreen, model, usb3,
            usb2,
            usbC,
            thunderbolt,
            miniJack,
            HDMI,
            LAN,
            reader,
            DP,
            dSUB,
            dockingPort,
            miniHDMI,
            miniDP,
        ));
    }, [
        system, cpu, cpuModel, gpu, diskSize, diskType, ramType, ramAmount, screen, vebCam, showLibre, battery, matrixGrade, grade, keyboard, additionalInfo_keyboard, additionalInfo_case, additionalInfo_matrix, cores, threads, frequency, frequency_turbo, matrixSize, matrixType, touchScreen, model, usb3,
        usb2,
        usbC,
        thunderbolt,
        miniJack,
        HDMI,
        LAN,
        reader,
        DP,
        dSUB,
        dockingPort,
        miniHDMI,
        miniDP,
        touchScreen,
        modem,
        additinalKeyboardInfoCZ, additinalcaseInfoCZ, additinalMatrixInfoCZ,
        additinalKeyboardInfoSK, additinalcaseInfoSK, additinalMatrixInfoSK,
        showWin11info,
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
                            <h2>Dodaj laptop</h2>
                            <FormControlLabel control={<Checkbox defaultChecked {...register("active")} />} label="Aktywność" />
                            <TextField required label="SKU" {...register("SKU")} />
                            <TextField required label="Ilość" type="number"{...register("stock")} />
                            <TextField required label="Cena" type="number" inputProps={{ step: "0.01" }} {...register("price")} />
                            <TextField required label="Tytuł" type="text"{...register("name", {
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
                                name="categoryId"
                                control={control}
                                defaultValue={0}
                                render={({ field }) => (
                                    <Autocomplete
                                        options={categories.filter(category =>
                                            category.translations.pl_PL.name.toLowerCase().includes("laptop")
                                        )}
                                        getOptionLabel={(option) =>
                                            option?.translations?.pl_PL?.name || "Nieznana kategoria"
                                        }
                                        isOptionEqualToValue={(option, value) =>
                                            option?.category_id === value?.category_id
                                        }
                                        value={
                                            categories.find(
                                                (cat) => cat.category_id.toString() === field.value?.toString()
                                            ) || null
                                        }
                                        onChange={(_, newValue) => {
                                            field.onChange(newValue?.category_id?.toString() || "");
                                        }}
                                        renderOption={(props, option) => (
                                            <li {...props} key={option.category_id}>
                                                {option.translations.pl_PL.name}
                                            </li>
                                        )}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Kategoria" />
                                        )}
                                    />
                                )}
                            />

                            <Controller
                                name="AdditionalCategories"
                                control={control}
                                defaultValue={[]} // domyślnie pusta tablica
                                render={({ field }) => (
                                    <Autocomplete
                                        multiple
                                        disableCloseOnSelect
                                        options={categories.filter(category =>
                                            category.translations.pl_PL.name.toLowerCase().includes("laptop")
                                        )}
                                        getOptionLabel={(option) =>
                                            option?.translations?.pl_PL?.name || "Nieznana kategoria"
                                        }
                                        isOptionEqualToValue={(option, value) =>
                                            option?.category_id === value?.category_id
                                        }
                                        value={categories.filter(cat =>
                                            field.value?.includes(cat.category_id)
                                        )}
                                        onChange={(_, newValue) => {
                                            field.onChange(newValue.map(item => item.category_id));
                                        }}
                                        renderOption={(props, option) => (
                                            <li {...props} key={option.category_id}>
                                                {option.translations.pl_PL.name}
                                            </li>
                                        )}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Dodatkowe kategorie" />
                                        )}
                                    />
                                )}
                            />


                            <Controller
                                name="producer"
                                control={control}
                                defaultValue={0}
                                render={({ field }) => (
                                    <Autocomplete
                                        options={producers}
                                        getOptionLabel={(option) => option?.name ?? ""}
                                        isOptionEqualToValue={(option, value) =>
                                            option.producer_id === value.producer_id
                                        }
                                        value={producers.find(p => p.producer_id === field.value) || null}
                                        onChange={(_, newValue) => {
                                            field.onChange(newValue?.producer_id || 0);
                                        }}
                                        renderOption={(props, option) => (
                                            <li {...props} key={option.producer_id}>
                                                {option.name}
                                            </li>
                                        )}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Producent" />
                                        )}
                                    />
                                )}
                            />


                            <Controller
                                name="status"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="status-label">Stan</InputLabel>
                                        <Select
                                            labelId="status-label"
                                            label="Stan"
                                            {...field}
                                        >
                                            <MenuItem value="Używany">Używany</MenuItem>
                                            <MenuItem value="Nowy">Nowy</MenuItem>
                                            <MenuItem value="Po zwrocie">Po zwrocie</MenuItem>
                                            <MenuItem value="Powystawowy">Powystawowy</MenuItem>
                                            <MenuItem value="Uszkodzony">Uszkodzony</MenuItem>
                                            <MenuItem value="Odnowiony przez producenta">Odnowiony przez producenta</MenuItem>
                                            <MenuItem value="Odnowiony przez sprzedawcę">Odnowiony przez sprzedawcę</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="type"
                                control={control}
                                defaultValue="" // lub inna wartość domyślna, np. "standardowy"
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="type-label">Typ obudowy</InputLabel>
                                        <Select
                                            labelId="type-label"
                                            label="Typ obudowy"
                                            {...field}
                                        >
                                            <MenuItem value="standardowy">standardowy</MenuItem>
                                            <MenuItem value="ultrabook">ultrabook</MenuItem>
                                            <MenuItem value="2w1">2w1</MenuItem>
                                            <MenuItem value="wzmocniony">wzmocniony</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />


                            <TextField label="model laptopa" variant="outlined" type="text"{...register("model")} />

                            <Controller
                                name="color"
                                control={control}
                                defaultValue="" // lub inna domyślna wartość, np. "czarny"
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="color-label">Kolor</InputLabel>
                                        <Select
                                            labelId="color-label"
                                            label="Kolor"
                                            {...field}
                                        >
                                            <MenuItem value='czarny'>czarny</MenuItem>
                                            <MenuItem value='biały'>biały</MenuItem>
                                            <MenuItem value='brązowy'>brązowy</MenuItem>
                                            <MenuItem value='czerwony'>czerwony</MenuItem>
                                            <MenuItem value='fioletowy'>fioletowy</MenuItem>
                                            <MenuItem value='niebieski'>niebieski</MenuItem>
                                            <MenuItem value='pomarańczowy'>pomarańczowy</MenuItem>
                                            <MenuItem value='różowy'>różowy</MenuItem>
                                            <MenuItem value='srebrny'>srebrny</MenuItem>
                                            <MenuItem value='szary'>szary</MenuItem>
                                            <MenuItem value='zielony'>zielony</MenuItem>
                                            <MenuItem value='złoty'>złoty</MenuItem>
                                            <MenuItem value='żółty'>żółty</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />


                            <Controller
                                name="cpu"
                                control={control}
                                defaultValue="" // możesz tu ustawić domyślną wartość, np. "Intel Core i5"
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="cpu-label">Procesor</InputLabel>
                                        <Select
                                            labelId="cpu-label"
                                            label="Procesor"
                                            {...field}
                                        >
                                            <MenuItem value="Intel Core i3">Intel Core i3</MenuItem>
                                            <MenuItem value="Intel Core i5">Intel Core i5</MenuItem>
                                            <MenuItem value="Intel Core i7">Intel Core i7</MenuItem>
                                            <MenuItem value="Intel Core i9">Intel Core i9</MenuItem>
                                            <MenuItem value="Intel Core 2 Duo">Intel Core 2 Duo</MenuItem>
                                            <MenuItem value="Intel Pentium">Intel Pentium</MenuItem>
                                            <MenuItem value="AMD CPU">AMD CPU</MenuItem>
                                            <MenuItem value="AMD A8">AMD A8</MenuItem>
                                            <MenuItem value="Inny Procesor">Inny Procesor</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />


                            <TextField label="Model procesora" variant="outlined" type="text"{...register("cpuModel")} />

                            <Controller
                                name="cores"
                                control={control}
                                defaultValue="" // lub np. "4"
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="cores-label">Rdzenie</InputLabel>
                                        <Select
                                            labelId="cores-label"
                                            label="Rdzenie"
                                            {...field}
                                        >
                                            <MenuItem value="1">1</MenuItem>
                                            <MenuItem value="2">2</MenuItem>
                                            <MenuItem value="3">3</MenuItem>
                                            <MenuItem value="4">4</MenuItem>
                                            <MenuItem value="5">5</MenuItem>
                                            <MenuItem value="6">6</MenuItem>
                                            <MenuItem value="8">8</MenuItem>
                                            <MenuItem value="10">10</MenuItem>
                                            <MenuItem value="12">12</MenuItem>
                                            <MenuItem value="14">14</MenuItem>
                                            <MenuItem value="16">16</MenuItem>
                                            <MenuItem value="20">20</MenuItem>
                                            <MenuItem value="22">22</MenuItem>
                                            <MenuItem value="24">24</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />


                            <Controller
                                name="threads"
                                control={control}
                                defaultValue="" // lub np. "4"
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="threads-label">Wątki</InputLabel>
                                        <Select
                                            labelId="threads-label"
                                            label="Wątki"
                                            {...field}
                                        >
                                            <MenuItem value="2">2</MenuItem>
                                            <MenuItem value="3">3</MenuItem>
                                            <MenuItem value="4">4</MenuItem>
                                            <MenuItem value="6">6</MenuItem>
                                            <MenuItem value="8">8</MenuItem>
                                            <MenuItem value="12">12</MenuItem>
                                            <MenuItem value="14">14</MenuItem>
                                            <MenuItem value="16">16</MenuItem>
                                            <MenuItem value="20">20</MenuItem>
                                            <MenuItem value="22">22</MenuItem>
                                            <MenuItem value="24">24</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />


                            <Controller
                                name="frequency"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="frequency-label">Taktowanie</InputLabel>
                                        <Select
                                            labelId="frequency-label"
                                            label="Taktowanie"
                                            {...field}
                                        >
                                            <MenuItem value="1">1</MenuItem>
                                            <MenuItem value="1,1">1,1</MenuItem>
                                            <MenuItem value="1,2">1,2</MenuItem>
                                            <MenuItem value="1,3">1,3</MenuItem>
                                            <MenuItem value="1,4">1,4</MenuItem>
                                            <MenuItem value="1,5">1,5</MenuItem>
                                            <MenuItem value="1,6">1,6</MenuItem>
                                            <MenuItem value="1,7">1,7</MenuItem>
                                            <MenuItem value="1,8">1,8</MenuItem>
                                            <MenuItem value="1,9">1,9</MenuItem>
                                            <MenuItem value="2">2</MenuItem>
                                            <MenuItem value="2,1">2,1</MenuItem>
                                            <MenuItem value="2,2">2,2</MenuItem>
                                            <MenuItem value="2,3">2,3</MenuItem>
                                            <MenuItem value="2,4">2,4</MenuItem>
                                            <MenuItem value="2,5">2,5</MenuItem>
                                            <MenuItem value="2,6">2,6</MenuItem>
                                            <MenuItem value="2,7">2,7</MenuItem>
                                            <MenuItem value="2,8">2,8</MenuItem>
                                            <MenuItem value="2,9">2,9</MenuItem>
                                            <MenuItem value="3">3</MenuItem>
                                            <MenuItem value="3,1">3,1</MenuItem>
                                            <MenuItem value="3,2">3,2</MenuItem>
                                            <MenuItem value="3,3">3,3</MenuItem>
                                            <MenuItem value="3,4">3,4</MenuItem>
                                            <MenuItem value="3,5">3,5</MenuItem>
                                            <MenuItem value="3,6">3,6</MenuItem>
                                            <MenuItem value="3,7">3,7</MenuItem>
                                            <MenuItem value="3,8">3,8</MenuItem>
                                            <MenuItem value="3,9">3,9</MenuItem>
                                            <MenuItem value="4">4</MenuItem>
                                            <MenuItem value="4,1">4,1</MenuItem>
                                            <MenuItem value="4,2">4,2</MenuItem>
                                            <MenuItem value="4,3">4,3</MenuItem>
                                            <MenuItem value="4,4">4,4</MenuItem>
                                            <MenuItem value="4,5">4,5</MenuItem>
                                            <MenuItem value="4,6">4,6</MenuItem>
                                            <MenuItem value="4,7">4,7</MenuItem>
                                            <MenuItem value="4,8">4,8</MenuItem>
                                            <MenuItem value="4,9">4,9</MenuItem>
                                            <MenuItem value="5">5</MenuItem>
                                            <MenuItem value="5,1">5,1</MenuItem>
                                            <MenuItem value="5,2">5,2</MenuItem>
                                            <MenuItem value="5,3">5,3</MenuItem>
                                            <MenuItem value="5,4">5,4</MenuItem>
                                            <MenuItem value="5,5">5,5</MenuItem>
                                            <MenuItem value="5,6">5,6</MenuItem>
                                            <MenuItem value="5,7">5,7</MenuItem>
                                            <MenuItem value="5,8">5,8</MenuItem>
                                            <MenuItem value="5,9">5,9</MenuItem>
                                            <MenuItem value="6">6</MenuItem>
                                            <MenuItem value="inne">inne</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />


                            <Controller
                                name="frequencyTurbo"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="frequency-turbo-label">Taktowanie turbo</InputLabel>
                                        <Select
                                            labelId="frequency-turbo-label"
                                            label="Taktowanie turbo"
                                            {...field}
                                        >
                                            <MenuItem value="1">1</MenuItem>
                                            <MenuItem value="1,1">1,1</MenuItem>
                                            <MenuItem value="1,2">1,2</MenuItem>
                                            <MenuItem value="1,3">1,3</MenuItem>
                                            <MenuItem value="1,4">1,4</MenuItem>
                                            <MenuItem value="1,5">1,5</MenuItem>
                                            <MenuItem value="1,6">1,6</MenuItem>
                                            <MenuItem value="1,7">1,7</MenuItem>
                                            <MenuItem value="1,8">1,8</MenuItem>
                                            <MenuItem value="1,9">1,9</MenuItem>
                                            <MenuItem value="2">2</MenuItem>
                                            <MenuItem value="2,1">2,1</MenuItem>
                                            <MenuItem value="2,2">2,2</MenuItem>
                                            <MenuItem value="2,3">2,3</MenuItem>
                                            <MenuItem value="2,4">2,4</MenuItem>
                                            <MenuItem value="2,5">2,5</MenuItem>
                                            <MenuItem value="2,6">2,6</MenuItem>
                                            <MenuItem value="2,7">2,7</MenuItem>
                                            <MenuItem value="2,8">2,8</MenuItem>
                                            <MenuItem value="2,9">2,9</MenuItem>
                                            <MenuItem value="3">3</MenuItem>
                                            <MenuItem value="3,1">3,1</MenuItem>
                                            <MenuItem value="3,2">3,2</MenuItem>
                                            <MenuItem value="3,3">3,3</MenuItem>
                                            <MenuItem value="3,4">3,4</MenuItem>
                                            <MenuItem value="3,5">3,5</MenuItem>
                                            <MenuItem value="3,6">3,6</MenuItem>
                                            <MenuItem value="3,7">3,7</MenuItem>
                                            <MenuItem value="3,8">3,8</MenuItem>
                                            <MenuItem value="3,9">3,9</MenuItem>
                                            <MenuItem value="4">4</MenuItem>
                                            <MenuItem value="4,1">4,1</MenuItem>
                                            <MenuItem value="4,2">4,2</MenuItem>
                                            <MenuItem value="4,3">4,3</MenuItem>
                                            <MenuItem value="4,4">4,4</MenuItem>
                                            <MenuItem value="4,5">4,5</MenuItem>
                                            <MenuItem value="4,6">4,6</MenuItem>
                                            <MenuItem value="4,7">4,7</MenuItem>
                                            <MenuItem value="4,8">4,8</MenuItem>
                                            <MenuItem value="4,9">4,9</MenuItem>
                                            <MenuItem value="5">5</MenuItem>
                                            <MenuItem value="5,1">5,1</MenuItem>
                                            <MenuItem value="5,2">5,2</MenuItem>
                                            <MenuItem value="5,3">5,3</MenuItem>
                                            <MenuItem value="5,4">5,4</MenuItem>
                                            <MenuItem value="5,5">5,5</MenuItem>
                                            <MenuItem value="5,6">5,6</MenuItem>
                                            <MenuItem value="5,7">5,7</MenuItem>
                                            <MenuItem value="5,8">5,8</MenuItem>
                                            <MenuItem value="5,9">5,9</MenuItem>
                                            <MenuItem value="6">6</MenuItem>
                                            <MenuItem value="inne">inne</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="ramAmount"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="ram-amount-label">Ilość pamięci Ram</InputLabel>
                                        <Select
                                            labelId="ram-amount-label"
                                            label="Ilość pamięci Ram"
                                            {...field}
                                        >
                                            <MenuItem value="2 GB">2 GB</MenuItem>
                                            <MenuItem value="4 GB">4 GB</MenuItem>
                                            <MenuItem value="8 GB">8 GB</MenuItem>
                                            <MenuItem value="12 GB">12 GB</MenuItem>
                                            <MenuItem value="16 GB">16 GB</MenuItem>
                                            <MenuItem value="20 GB">20 GB</MenuItem>
                                            <MenuItem value="24 GB">24 GB</MenuItem>
                                            <MenuItem value="32 GB">32 GB</MenuItem>
                                            <MenuItem value="64 GB">64 GB</MenuItem>
                                            <MenuItem value="brak">brak</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="ramType"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="ram-type-label">Typ pamięci</InputLabel>
                                        <Select
                                            labelId="ram-type-label"
                                            label="Typ pamięci"
                                            {...field}
                                        >
                                            <MenuItem value="DDR2">DDR2</MenuItem>
                                            <MenuItem value="DDR3">DDR3</MenuItem>
                                            <MenuItem value="DDR4">DDR4</MenuItem>
                                            <MenuItem value="DDR5">DDR5</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />


                            <Controller
                                defaultValue=""
                                name="GPU_type"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="gpu-type-label">Typ karty graficznej</InputLabel>
                                        <Select
                                            labelId="gpu-type-label"
                                            label="Typ karty graficznej"
                                            {...field}
                                        >
                                            <MenuItem value="Grafika zintegrowana">Grafika zintegrowana</MenuItem>
                                            <MenuItem value="Grafika dedykowana">Grafika dedykowana</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <TextField label="karta graficzna" variant="outlined" type="text"{...register("gpu")} />

                            <Controller
                                name="diskSize"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="disk-size-label">Pojemność dysku</InputLabel>
                                        <Select
                                            labelId="disk-size-label"
                                            label="Pojemność dysku"
                                            {...field}
                                        >
                                            <MenuItem value="120GB">120GB</MenuItem>
                                            <MenuItem value="128GB">128GB</MenuItem>
                                            <MenuItem value="180GB">180GB</MenuItem>
                                            <MenuItem value="240GB">240GB</MenuItem>
                                            <MenuItem value="250GB">250GB</MenuItem>
                                            <MenuItem value="256GB">256GB</MenuItem>
                                            <MenuItem value="320GB">320GB</MenuItem>
                                            <MenuItem value="480GB">480GB</MenuItem>
                                            <MenuItem value="500GB">500GB</MenuItem>
                                            <MenuItem value="512GB">512GB</MenuItem>
                                            <MenuItem value="1TB">1TB</MenuItem>
                                            <MenuItem value="2TB">2TB</MenuItem>
                                            <MenuItem value="brak">brak</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="diskType"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="disk-type-label">Typ dysku</InputLabel>
                                        <Select
                                            labelId="disk-type-label"
                                            label="Typ dysku"
                                            {...field}
                                        >
                                            <MenuItem value="NVMe SSD">NVMe SSD</MenuItem>
                                            <MenuItem value="SSD">SSD</MenuItem>
                                            <MenuItem value="HDD">HDD</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                defaultValue=""
                                name="keyboard"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="keyboard-label">Klawiatura</InputLabel>
                                        <Select
                                            labelId="keyboard-label"
                                            label="Klawiatura"
                                            {...field}
                                        >
                                            <MenuItem value="QWERTY">QWERTY</MenuItem>
                                            <MenuItem value="QWERTY_naklejki">QWERTY_naklejki</MenuItem>
                                            <MenuItem value="QWERTZ_naklejki">QWERTZ_naklejki</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                defaultValue=""
                                name="keyboardLight"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="keyboard-light-label">Typ klawiatury</InputLabel>
                                        <Select
                                            labelId="keyboard-light-label"
                                            label="Typ klawiatury"
                                            {...field}
                                        >
                                            <MenuItem value="Zwykła">Zwykła</MenuItem>
                                            <MenuItem value="Podświetlana">Podświetlana</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                defaultValue=""
                                name="grade"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="grade-label">Klasa wizualna</InputLabel>
                                        <Select
                                            labelId="grade-label"
                                            label="Klasa wizualna"
                                            {...field}
                                        >
                                            <MenuItem value="Bardzo dobry">Bardzo dobry</MenuItem>
                                            <MenuItem value="Dobry">Dobry</MenuItem>
                                            <MenuItem value="Klasa A">Klasa A</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                defaultValue=""
                                name="matrixGrade"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="matrix-grade-label">Stan matrycy</InputLabel>
                                        <Select
                                            labelId="matrix-grade-label"
                                            label="Stan matrycy"
                                            {...field}
                                        >
                                            <MenuItem value="Klasa A">Klasa A</MenuItem>
                                            <MenuItem value="Stan bardzo dobry">Stan bardzo dobry</MenuItem>
                                            <MenuItem value="Klasa A-(duszki)">Klasa A-(duszki)</MenuItem>
                                            <MenuItem value="Klasa A-(przetarcia)">Klasa A-(przetarcia)</MenuItem>
                                            <MenuItem value="Klasa A-(ryski)">Klasa A-(ryski)</MenuItem>
                                            <MenuItem value="Klasa A-(duszki+przetarcia)">Klasa A-(duszki+przetarcia)</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="matrixSize"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="matrix-size-label">Wielkość matrycy</InputLabel>
                                        <Select
                                            labelId="matrix-size-label"
                                            label="Wielkość matrycy"
                                            {...field}
                                        >
                                            <MenuItem value='11,9" i mniej'>11,9" i mniej</MenuItem>
                                            <MenuItem value='12"'>12"</MenuItem>
                                            <MenuItem value='12,5"'>12,5"</MenuItem>
                                            <MenuItem value='13"'>13"</MenuItem>
                                            <MenuItem value='13,3"'>13,3"</MenuItem>
                                            <MenuItem value='14"'>14"</MenuItem>
                                            <MenuItem value='15,4"'>15,4"</MenuItem>
                                            <MenuItem value='15,6"'>15,6"</MenuItem>
                                            <MenuItem value='16'>16</MenuItem>
                                            <MenuItem value='17,3"'>17,3"</MenuItem>
                                            <MenuItem value='17,4" i więcej'>17,4" i więcej</MenuItem>
                                            <MenuItem value='17"'>17"</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                defaultValue=""
                                name="matrixType"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="matrix-type-label">Typ matrycy</InputLabel>
                                        <Select
                                            labelId="matrix-type-label"
                                            label="Typ matrycy"
                                            {...field}
                                        >
                                            <MenuItem value="matowa">matowa</MenuItem>
                                            <MenuItem value="błyszcząca">błyszcząca</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="screen"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="screen-label">rozdzielczość</InputLabel>
                                        <Select
                                            labelId="screen-label"
                                            label="rozdzielczość"
                                            {...field}
                                        >
                                            <MenuItem value="1280 x 800">1280 x 800</MenuItem>
                                            <MenuItem value="1366 x 768">1366 x 768</MenuItem>
                                            <MenuItem value="1440 x 900">1440 x 900</MenuItem>
                                            <MenuItem value="1600 x 900">1600 x 900</MenuItem>
                                            <MenuItem value="1600 x 1050">1600 x 1050</MenuItem>
                                            <MenuItem value="1920 x 1080">1920 x 1080</MenuItem>
                                            <MenuItem value="1920 x 1200">1920 x 1200</MenuItem>
                                            <MenuItem value="1920 x 1280">1920 x 1280</MenuItem>
                                            <MenuItem value="2160 x 1440">2160 x 1440</MenuItem>
                                            <MenuItem value="2304 x 1440">2304 x 1440</MenuItem>
                                            <MenuItem value="2560 x 1440">2560 x 1440</MenuItem>
                                            <MenuItem value="2560 x 1600">2560 x 1600</MenuItem>
                                            <MenuItem value="2880 x 1620">2880 x 1620</MenuItem>
                                            <MenuItem value="2880 x 1800">2880 x 1800</MenuItem>
                                            <MenuItem value="3072 x 1920">3072 x 1920</MenuItem>
                                            <MenuItem value="3200 x 1800">3200 x 1800</MenuItem>
                                            <MenuItem value="3840 x 2160">3840 x 2160</MenuItem>
                                            <MenuItem value="3840 x 2400">3840 x 2400</MenuItem>
                                            <MenuItem value="inna">inna</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                defaultValue=""
                                name="touchScreen"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="touch-screen-label">ekran dotykowy</InputLabel>
                                        <Select
                                            labelId="touch-screen-label"
                                            label="ekran dotykowy"
                                            {...field}
                                        >
                                            <MenuItem value="tak">tak</MenuItem>
                                            <MenuItem value="nie">nie</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="system"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="system-label">System</InputLabel>
                                        <Select
                                            labelId="system-label"
                                            label="System"
                                            {...field}
                                        >
                                            <MenuItem value="Windows 10 Home">Windows 10 Home</MenuItem>
                                            <MenuItem value="Windows 10 Home PL Refurbished">Windows 10 Home PL Refurbished</MenuItem>
                                            <MenuItem value="Windows 10 Pro">Windows 10 Pro</MenuItem>
                                            <MenuItem value="Windows 11 Home">Windows 11 Home</MenuItem>
                                            <MenuItem value="Windows 11 Home PL Refurbished">Windows 11 Home PL Refurbished</MenuItem>
                                            <MenuItem value="Windows 11 Pro">Windows 11 Pro</MenuItem>
                                            <MenuItem value="macOS">macOS</MenuItem>
                                            <MenuItem value="macOS Ventura">macOS Ventura</MenuItem>
                                            <MenuItem value="Windows 7 Pro">Windows 7 Pro</MenuItem>
                                            <MenuItem value="brak systemu">brak systemu</MenuItem>
                                            <MenuItem value="inny">inny</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="showWin11info"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="win11 info" />}
                            />


                            <Controller
                                name="battery"
                                defaultValue=""
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="battery-label">Stan baterii</InputLabel>
                                        <Select
                                            labelId="battery-label"
                                            label="Stan baterii"
                                            {...field}
                                        >
                                            <MenuItem value="Bateria(1h)">Bateria(1h)</MenuItem>
                                            <MenuItem value="Bateria(1,5h)">Bateria(1,5h)</MenuItem>
                                            <MenuItem value="Nowa Bateria">Nowa Bateria</MenuItem>
                                            <MenuItem value="Bateria(2h)">Bateria(2h)</MenuItem>
                                            <MenuItem value="Bateria(2,5h)">Bateria(2,5h)</MenuItem>
                                            <MenuItem value="Bateria(3h)">Bateria(3h)</MenuItem>
                                            <MenuItem value="Bateria(5h)">Bateria(5h)</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />
                            <TextField label="USB 2.0" variant="outlined" type="text"{...register("usb2")} />
                            <TextField label="USB 3.0" variant="outlined" type="text"{...register("usb3")} />
                            <TextField label="USB C" variant="outlined" type="text"{...register("usbC")} />
                            <Controller
                                name="thunderbolt"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={field.value} />}
                                        label="thunderbolt"
                                    />
                                )}
                            />
                            <TextField label="miniJack" variant="outlined" type="text"{...register("miniJack")} />

                            <Controller
                                name="hdmi"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="hdmi" />}
                            />
                            <Controller
                                name="lan"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="lan" />}
                            />
                            <Controller
                                name="cardReader"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="czytnik kart pamięci" />}
                            />
                            <Controller
                                name="displayPort"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="displayPort" />}
                            />
                            <Controller
                                name="dSub"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="dSub" />}
                            />
                            <Controller
                                name="dockingPort"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="dockingPort" />}
                            />
                            <Controller
                                name="miniHDMI"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="miniHDMI" />}
                            />
                            <Controller
                                name="miniDP"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="miniDP" />}
                            />
                            <Controller
                                name="vebCam"
                                control={control}
                                defaultValue={true}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="kamerka" />}
                            />
                            <Controller
                                name="wifi"
                                control={control}
                                defaultValue={true}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="wifi" />}
                            />
                            <Controller
                                name="modem"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="modem" />}
                            />
                            <Controller
                                name="bluetooth"
                                control={control}
                                defaultValue={true}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="bluetooth" />}
                            />

                            <Controller
                                name="dvd"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="dvd-label">Typ napędu</InputLabel>
                                        <Select
                                            labelId="dvd-label"
                                            label="Typ napędu"
                                            {...field}
                                        >
                                            <MenuItem value="brak">brak</MenuItem>
                                            <MenuItem value="DVD">DVD</MenuItem>
                                            <MenuItem value="Blu-Ray">Blu-Ray</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="KensingtonLock"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="KensingtonLock" />}
                            />

                            <Controller
                                name="showLibre"
                                control={control}
                                defaultValue={true}
                                render={({ field }) => <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="Libre Office" />}
                            />


                            <TextField label="dodatkowy tekst - klawiatura" type="text"{...register("additionalInfo_keyboard", {
                                onBlur: async (e) => {
                                    const value = e.target.value;

                                    try {
                                        setAdditinalKeyboardInfoCZ(await handleTranslateCZ(value))
                                        setAdditinalKeyboardInfoSK(await handleTranslateSK(value))
                                        toast.success("przetłumaczono");
                                    } catch (error) {
                                        console.error("Błąd podczas tłumaczenia:", error);
                                        toast.error("błąd w tłumaczeniu");
                                    }
                                }
                            })} />
                            <TextField label="dodatkowy tekst - matryca" type="text"{...register("additionalInfo_matrix", {
                                onBlur: async (e) => {
                                    const value = e.target.value;

                                    try {
                                        setAdditinalMatrixInfoCZ(await handleTranslateCZ(value))
                                        setAdditinalMatrixInfoSK(await handleTranslateSK(value))
                                        toast.success("przetłumaczono");
                                    } catch (error) {
                                        console.error("Błąd podczas tłumaczenia:", error);
                                        toast.error("błąd w tłumaczeniu");
                                    }
                                }
                            })} />
                            <TextField label="dodatkowy tekst - obudowa" type="text"{...register("additionalInfo_case", {
                                onBlur: async (e) => {
                                    const value = e.target.value;

                                    try {
                                        setAdditinalcaseInfoCZ(await handleTranslateCZ(value))
                                        setAdditinalcaseInfoSK(await handleTranslateSK(value))
                                        toast.success("przetłumaczono");
                                    } catch (error) {
                                        console.error("Błąd podczas tłumaczenia:", error);
                                        toast.error("błąd w tłumaczeniu");
                                    }
                                }
                            })} />
                            <label >opis</label>
                            <textarea defaultValue={LaptopTemplate('', '', '', '', '', '', '', '', '', false, true, '', '', '', '', true, false, false, '', '', '', '', false, false)}  {...register("description")} />
                            <textarea defaultValue={LaptopTemplateApilo('', '', '', '', '', '', '', '', '', false, true, '', '', '', '', true, false, false, '', '', '', '', '', '', '', '', '', '', '', '', '', '', false, '', false, false, false, false, false, false, false, false)}  {...register("descriptionApilo")} />
                            <ProductImageManager {...images} />

                            <Button variant="outlined" onClick={() => reset()}>Reset formularza</Button>
                            <ApiloSubmitControls addToApilo={addToApilo} onChange={setAddToApilo}>
                                <Button variant="contained" type="submit" disabled={!images.imagesReady || images.uploadingImages}>Dodaj</Button>
                            </ApiloSubmitControls>
                        </ThemeProvider>
                    </Box>
                </form>
                <div className="preview">
                    {descriptionLanguage === 'description' && (
                        <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: description + descriptionApilo }} />

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

export default AddLaptop;
