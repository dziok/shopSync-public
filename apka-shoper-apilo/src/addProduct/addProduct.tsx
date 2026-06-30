import axios from "axios";
import { useForm, SubmitHandler } from "react-hook-form"
import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './addProducts.css';
import { apiloSystemType, cpuTypesDescriptions, cpuTypesDescriptionsCZ, cpuTypesDescriptionsSK, desktopStatus, desktopStatusCZ, desktopStatusSK, diskTypesDescriptions, diskTypesDescriptionsCZ, diskTypesDescriptionsSK, ramTypesDescriptions, ramTypesDescriptionsCZ, ramTypesDescriptionsSK, systemType, systemTypeCZ, systemTypeSK } from "./additionalDescriptions/pcAdditionalDescription";
import { TextField, Button, Checkbox, FormControlLabel, FormControl, InputLabel, Select, MenuItem, Box, ThemeProvider, Typography, TextareaAutosize, SelectChangeEvent, ListItemText } from '@mui/material';
import { MainTheme } from "./themes";
import { API_URL } from "../config";
import { handleImageUpload } from "../image-host";
import { additionalTranslationsCZ, additionalTranslationsSK, conditionCZ, conditionSK, pcCaseVC_CZ, pcCaseVC_SK, pcVC, vc_CZ, vc_SK } from "./additionalDescriptions/visualConditionDescriptions";
import { pcTemplateCZ } from "./templatesCZ/pcTemplateCZ";
import { pcTemplateSK } from "./templatesSK/pcTemplateSK";
import { handleTranslateCZ, handleTranslateSK } from "../backendQueries/translate";
import { AddImageApilo } from "../backendQueries/addImageApilo";
import { AddProductShoper } from "../backendQueries/addProductShoper";
import { AddProductApilo } from "../backendQueries/addProductApilo";
import { AddAttributesApilo } from "../backendQueries/addAttributesApilo";
import { AddImageShoper } from "../backendQueries/addImageShoper";
import { Product, SearchResult, FormData } from "../types";
import { pcParameters } from "../allegroParameters/pcParameters";


type AddProductProps = {
    authToken: string
    accessTokenAllegro: string
}
export type ApiloResponse = {
    products: {
        [sku: string]: number; // SKU jako klucz, ID jako wartość
    };
};
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
    descriptionLanguage: string
    productSafetyProducerId?: number
    productSafetyCertificateIds?: number[]
    productSafetyWarnings?: string[]
}
let caseDescription = ""
// function AddProduct(props: AddProductProps) {
//     const { register, handleSubmit, watch, setValue } = useForm<IFormInput>()
//     const [selectedImages, setSelectedImages] = useState<File[]>([]);
//     const [imageSrc, setImageSrc] = useState<string>("");
//     const [nameCZ, setNameCZ] = useState("");
//     const [nameSK, setNameSK] = useState("");
//     const [IncludeCZ, setIncludeCZ] = useState("");
//     const [IncludeSK, setIncludeSK] = useState("");
//     const [additionalInfoCZ, setAdditionalInfoCZ] = useState("");
//     const [additionalInfoSK, setAdditionalInfoSK] = useState("");
//     const [gpuDescriptionsCZ, setGpuDescriptionsCZ] = useState("");
//     const [gpuDescriptionsSK, setGpuDescriptionsSK] = useState("");
//     const [imageLinks, setImageLinks] = useState<string[]>([]);
//     let apiloImageUUIDs: string[] | undefined
//     let infoActive = "none !important"

//     ////////////// Allegro ////////////////
//     const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
//     const [showSearchresult, setShowSearchresult] = useState(false);
//     const [searchName, setSearchName] = useState('');
//     const [result, setResult] = useState(null);
//     const [selectedProduct, setSelectedProduct] = useState<Product>();
//     const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
//     const [formData, setFormData] = useState<FormData>({});
//     const [params, setParams] = useState(null);
//     const [paramsConverter, setParamsConverter] = useState({
//         color: '',
//         pcType: '',
//         sku: '',
//         height: 0,
//         width: 0,
//         depth: 0,
//         dvd: '',
//         system: '',
//         cpuModel: '',
//         cpuMaxFrequency: 0,
//         cpuCores: 0,
//         cpuThreads: 0,
//         diskType: '',
//         gpuType: '',
//         casetype: '',


//     });

//     const handleSearch = async () => {

//         try {
//             const response = await axios.get(`${API_URL}/product/search`, {
//                 params: { searchName },
//                 headers: {
//                     Authorization: `Bearer ${props.accessTokenAllegro}`,
//                 },
//             });

//             setSearchResult(response.data);
//             setShowSearchresult(true)
//         } catch (error) {
//             console.error('Błąd wyszukiwania produktu:', error);
//         }
//     };

//     const buildOfferParameters = (formData: FormData): any[] => {
//         return Object.entries(formData).map(([id, value]) => {
//             if (Array.isArray(value)) {
//                 return {
//                     id,
//                     valuesIds: value
//                 };
//             } else if (typeof value === 'string' && value.startsWith(`${id}_`)) {
//                 // Zakładamy, że to dictionary ID
//                 return {
//                     id,
//                     valuesIds: [value]
//                 };
//             } else {
//                 return {
//                     id,
//                     values: [value]
//                 };
//             }
//         });
//     };


//     const handleAddAllegroOffer = async () => {

//         const token = props.accessTokenAllegro
//         console.log(token, apiloImageUUIDs)
//         const productData = {

//             "productSet":
//                 [{
//                     "product":
//                     {
//                         "id": selectedProductId,   // numer GTIN, MPN lub ID produktu
//                         "idType": "GTIN",         // typ wartości w polu "product.id". 
//                         // Dla GTIN wskaż "GTIN",dla numerów 
//                         // katalogowych nadanych przez producenta - "MPN".
//                         // Jeśli wskazujesz UUID produktu, pozostaw pole puste.
//                         "parameters": buildOfferParameters(formData)
//                     }
//                 }],
//             "sellingMode": {
//                 "price": {
//                     "amount": "220.85",            // cena
//                     "currency": "PLN"
//                 }
//             },
//             "stock": {
//                 "available": 10                  // liczba sztuk
//             },
//             "publication": {
//                 "status": "INACTIVE",
//             },
//             "images": imageLinks,

//             "delivery": {
//                 "shippingRates": {
//                     "name": "KOMPY 2018, DESKTOP DO PACZKOMATU"
//                 },
//             },
//             "afterSalesServices": {
//                 "impliedWarranty": {
//                     "name": "Standardowe"
//                 },
//                 "returnPolicy": {
//                     "name": "15 dni Czechówka"
//                 }
//             },
//             "description": {

//                 "sections": [{
//                     "items": [{
//                         "type": "TEXT",
//                         "content": `<h1>${name}</h1><p>✔️Stan: <b>${condition}</b></p><p>✔️Typ komputera: <b>Stacjonarny, ${caseType}</b></p><p>✔️wizualny stan: <b>${visualCondition}, ${pcVC[visualCondition]}</b></p>`
//                     }]
//                 }, {
//                     "items": [{
//                         "type": "IMAGE",
//                         "url": "https://a.allegroimg.com/original/118094/73c8c8404eed8b57bf49b24d19da/Dell-Wyse-5070-Thin-Client-J4105-4-16GB-kl-A-WiFi-Zasilacz-BRAK-SYSTEMU-Wysokosc-produktu-18-4-cm"
//                     }]
//                 }, {
//                     "items": [{
//                         "type": "TEXT",
//                         "content": `
//                         <h2>Dlaczego warto wybrać komputer poleasingowy:</h2>
//                         <ul>
//                         <li>
//                         <p><b>Cena</b> ➡️ Stacjonarne komputery poleasingowe są tańsze niż nowe modele, co pozwala zaoszczędzić pieniądze.</p>
//                         </li>
//                         <li>
//                         <p><b>Jakość</b> ➡️ Firmy leasingowe często wybierają sprzęt wysokiej klasy, który jest bardziej trwały i wydajny niż standardowe modele konsumenckie.</p>
//                         </li>
//                         <li>
//                         <p><b>Sprawdzone działanie</b> ➡️ Komputery poleasingowe są przez nas dokładnie testowane i sprawdzane przed ponowną sprzedażą, co gwarantuje ich pełną funkcjonalność.</p>
//                         </li>
//                         <li>
//                         <p><b>Ekologia</b> ➡️ Kupując sprzęt poleasingowy, przyczyniasz się do zmniejszenia ilości elektrośmieci i wspierasz ideę zrównoważonego rozwoju.</p>
//                         </li>
//                         <li>
//                         <p><b>Wyposażenie</b> ➡️ Często poleasingowe komputery są dobrze wyposażone, z dodatkowymi funkcjami i akcesoriami, które mogą nie być dostępne w standardowych modelach konsumenckich.</p>
//                         </li>
//                         <li>
//                         <p><b>Marki Premium</b> ➡️ Możliwość zakupu sprzętu od renomowanych marek w niższej cenie.</p>
//                         </li>
//                         <li>
//                         <p><b>Gotowość do pracy</b> ➡️ Komputery poleasingowe są przez nas skonfigurowane i gotowe do pracy zaraz po zakupie, co oszczędza czas potrzebny na instalację oprogramowania.</p>
//                         </li>
//                         </ul>`
//                     }]
//                 }, {
//                     "items": [{
//                         "type": "IMAGE",
//                         "url": imageLinks[0]
//                     }, {
//                         "type": "TEXT",
//                         "content": `<h1>Cechy:</h1><ul><li><b>❗${additionalInfo}</b></li></ul> ${apiloSpec}<p><b>✔️ Stacjonarny komputer poleasingowy w bardzo dobrym stanie</b><b> technicznym, dokładnie przetestowany przed wysyłką i gotowy do pracy</b></p>`
//                     }]
//                 }, {
//                     "items": [{
//                         "type": "TEXT",
//                         "content": `
//                         <p>Komputer został ✔️<b>dokładnie</b> przetestowany przed wysyłką.</p>
//                         <p>Posiada zainstalowany ✔️<b>oryginalny</b> system operacyjny ✔️<b>64bit w polskiej wersji językowej</b>, wraz z <b>✔️najnowszymi sterownikami </b>oraz dodatkową przeglądarką Internetową.</p>
//                         <p>Komputer po rozpakowaniu z pudełka jest ✔️<b>gotowy do pracy.</b></p>
//                         `
//                     }]
//                 }, {
//                     "items": [{
//                         "type": "IMAGE",
//                         "url": "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/podzespoly.png"
//                     }]
//                 }, {
//                     "items": [{
//                         "type": "TEXT",
//                         "content": ApiloDescription(cpu, cpuModel, ramAmount, ramType, diskType, diskCapacity, cpuTypesDescriptions[cpu as keyof typeof cpuTypesDescriptions],
//                             ramTypesDescriptions[ramType as keyof typeof ramTypesDescriptions],
//                             diskTypesDescriptions[diskType as keyof typeof diskTypesDescriptions], gpu, gpuDescriptions)

//                     }]
//                 }
//                 ]
//             }
//         };


//         const response = await axios.post(
//             `${API_URL}/product/allegroProduct`,
//             productData,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             }
//         );
//         setResult(response.data);
//     };
//     //al1
//     const handleSelectAllegroProduct = (product: Product) => {
//         setSelectedProductId(product.id);
//         setSelectedProduct(product);

//         console.log('Wybrano produkt:', product); // tylko pomocniczo

//         // automatyczne wypełnienie formularza na podstawie parametrów
//         const autoFilledForm: { [paramId: string]: string | string[] } = {};


//         product.parameters.forEach((param) => {
//             const values = param.values ?? [];
//             const valuesIds = param.valuesIds ?? [];
//             const valuesLabels = param.valuesLabels ?? [];
//             const isMulti = (param.valuesIds?.length ?? 0) > 1;
//             const isNumeric = typeof param.unit === 'string';

//             if (valuesIds.length > 0) {
//                 autoFilledForm[param.id] = isMulti
//                     ? valuesIds.map(String)
//                     : String(valuesIds[0]);
//             } else if (values.length > 0) {
//                 autoFilledForm[param.id] = isMulti
//                     ? values.map(String)
//                     : String(values[0]);
//             } else if (valuesLabels.length > 0 && !isNumeric) {
//                 autoFilledForm[param.id] = isMulti
//                     ? valuesLabels.map(String)
//                     : String(valuesLabels[0]);
//             } else if (param.rangeValue?.from || param.rangeValue?.to) {
//                 autoFilledForm[param.id] = `${param.rangeValue?.from ?? ''} - ${param.rangeValue?.to ?? ''}`;
//             }
//         });

//         setFormData(autoFilledForm);
//         console.log(formData)
//     };

//     const handleChangeAllegro = (paramId: string, value: string) => {
//         setFormData((prev) => ({
//             ...prev,
//             [paramId]: value,
//         }));
//     };

//     ///////////////Allegro koniec////////////////

//     const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const files = Array.from(e.target.files || []);

//         const sortedFiles = files.sort((a, b) => {
//             const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
//             const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
//             return numA - numB;
//         });
//         setSelectedImages(sortedFiles);
//     };

//     useEffect(() => {
//         if (selectedImages.length > 0) {
//             handleImageUpload(selectedImages).then((uploadedImages) => {
//                 setImageLinks(uploadedImages || []);
//             });
//         }
//     }, [selectedImages]);

//     const onSubmit: SubmitHandler<IFormInput> = async (data) => {
//         if (data.gpuI) {
//             gpuDescriptions = "Zintegrowana karta graficzna jest wystarczająca do codziennych zadań, takich jak przeglądanie internetu, oglądanie filmów czy podstawowa edycja grafiki, ale może mieć trudności z obsługą wymagających gier i programów. To ekonomiczne rozwiązanie dla użytkowników, którzy nie potrzebują dużej mocy obliczeniowej w grafice.";
//             setGpuDescriptionsCZ("Integrovaná grafická karta je dostačující pro každodenní úkoly, jako je prohlížení internetu, sledování filmů nebo základní úpravy obrázků, ale může mít problémy s náročnými hrami a programy. Jde o ekonomické řešení pro uživatele, kteří nepotřebují vysoký grafický výkon.")
//             setGpuDescriptionsSK("Integrovaná grafická karta je postačujúca na každodenné úlohy, ako je prehliadanie internetu, sledovanie filmov alebo základná úprava obrázkov, no môže mať problémy s náročnými hrami a programami. Ide o ekonomické riešenie pre používateľov, ktorí nepotrebujú vysoký grafický výkon.")
//         }

//         //dodaj zdjęcia do apilo
//         apiloImageUUIDs = await AddImageApilo(props, selectedImages)

//         //dodaj produkt do shoper
//         try {
//             function generateAttributes(data: IFormInput, vc_CZ: Record<string, string>, vc_SK: Record<string, string>): Record<number, string | number> {
//                 const dynamicAttributes: Record<number, string | number> = {
//                     // 894: data.visualCondition,
//                     // 869: data.ports,
//                     // 776: data.model,
//                     // 775: data.DVD,
//                     // 774: data.diskCapacity,
//                     // 773: data.diskType,
//                     // 772: data.brend,
//                     // 762: data.cpu,
//                     // 771: data.cpuModel,
//                     // 765: data.cpuMaxClockSpeed,
//                     // 764: data.cpuClockSpeed,
//                     // 770: data.cpuThreads,
//                     // 769: data.cpuCores,
//                     // 766: data.ramAmount,
//                     // 763: data.ramType,
//                     // 761: data.color,
//                     // 759: data.depth,
//                     // 758: data.width,
//                     // 757: data.height,
//                     // 768: data.system,
//                     // 307: "24 miesiące",
//                     // 291: data.condition,
//                     // 913: data.caseType,

//                     //nowe atrybuty
//                     1106: data.ports,
//                     1105: data.height,
//                     1104: data.width,
//                     1103: data.depth,
//                     1102: data.color,
//                     1100: data.cpuCores,
//                     1099: data.cpuThreads,
//                     1098: data.cpuClockSpeed,
//                     1097: data.cpuMaxClockSpeed,
//                     1096: data.brend,
//                     1095: data.model,
//                     1094: data.DVD,
//                     1093: data.system,
//                     1092: data.diskCapacity,
//                     1091: data.diskType,
//                     1090: data.cpuModel,
//                     1089: data.cpu,
//                     1088: data.ramType,
//                     1087: data.ramAmount,
//                     1086: data.visualCondition,
//                     1085: data.caseType,


//                     // CZ
//                     1015: data.caseType,
//                     1016: vc_CZ[data.visualCondition],
//                     1017: data.ramAmount,
//                     1018: data.ramType,
//                     1019: data.cpu,
//                     1020: data.cpuModel,
//                     1021: data.diskType,
//                     1022: data.diskCapacity,
//                     1023: data.system,
//                     1024: data.DVD,
//                     1025: data.model,
//                     1027: data.producer,
//                     1028: data.cpuMaxClockSpeed,
//                     1029: data.cpuClockSpeed,
//                     1030: data.cpuThreads,
//                     1031: data.cpuCores,
//                     1034: data.depth,
//                     1035: data.width,
//                     1036: data.height,
//                     1037: data.ports,
//                     // SK
//                     1038: data.caseType,
//                     1039: vc_SK[data.visualCondition],
//                     1040: data.ramAmount,
//                     1041: data.ramType,
//                     1042: data.cpu,
//                     1043: data.cpuModel,
//                     1044: data.diskType,
//                     1045: data.diskCapacity,
//                     1046: data.system,
//                     1047: data.DVD,
//                     1048: data.model,
//                     1050: data.producer,
//                     1051: data.cpuMaxClockSpeed,
//                     1052: data.cpuClockSpeed,
//                     1053: data.cpuThreads,
//                     1054: data.cpuCores,
//                     1057: data.depth,
//                     1058: data.width,
//                     1059: data.height,
//                     1060: data.ports,
//                 };
//                 return dynamicAttributes;
//             }
//             let response = AddProductShoper(data, generateAttributes(data, vc_CZ, vc_SK), nameCZ, nameSK, gaugeId, props, '249')

//             //dodaj drodukt do apilo
//             let apiloResponse: ApiloResponse = await AddProductApilo(data, props, apiloImageUUIDs)

//             toast.success("Produkt został pomyślnie dodany.");
//             let ApiloAddedProductsFirstKey = Object.keys(apiloResponse.products)[0];
//             console.log(apiloResponse.products[ApiloAddedProductsFirstKey])

//             //dodaj atrybuty do apilo 
//             const apiloAttributes = [
//                 {
//                     "id": 78,
//                     "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
//                     "type": 9,
//                     "values": [
//                         {
//                             "value":
//                                 `<p>✔️Stan: <b>${data.condition}</b></p>
//                             <p>✔️Typ komputera: <b>Stacjonarny, ${data.caseType}</b></p>
//                             <p>✔️wizualny stan: <b>${data.visualCondition}, ${pcVC[data.visualCondition]}</b></p>`,
//                         }
//                     ]
//                 },
//                 {
//                     "id": 81,
//                     "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
//                     "type": 9,
//                     "values": [
//                         {
//                             "value": `<ul><li><b>❗${data.additionalInfo}</b></li></ul>` + apiloSpec
//                         }
//                     ]
//                 },
//                 {
//                     "id": 84,
//                     "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
//                     "type": 9,
//                     "values": [
//                         {
//                             "value": ApiloDescription(data.cpu, data.cpuModel, data.ramAmount, data.ramType, data.diskType, data.diskCapacity, cpuTypesDescriptions[data.cpu as keyof typeof cpuTypesDescriptions],
//                                 ramTypesDescriptions[data.ramType as keyof typeof ramTypesDescriptions],
//                                 diskTypesDescriptions[data.diskType as keyof typeof diskTypesDescriptions], data.gpu, data.gpuDescriptions)
//                         }
//                     ]
//                 },
//                 {
//                     "id": 63,
//                     "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
//                     "type": 9,
//                     "values": [
//                         {
//                             "value": apiloSystemType[data.system as keyof typeof apiloSystemType]
//                         }
//                     ]
//                 },
//                 {
//                     "id": 87,
//                     "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
//                     "type": 1,
//                     "values": [
//                         {
//                             "value": `<b>${data.included}</b>`
//                         }
//                     ]
//                 },
//                 {
//                     "id": 90,
//                     "productId": apiloResponse.products[ApiloAddedProductsFirstKey],
//                     "type": 9,
//                     "values": [
//                         {
//                             "value": apiloSpecAio
//                         }
//                     ]
//                 },
//             ]
//             AddAttributesApilo(props, apiloAttributes)

//             apiloImageUUIDs = []

//             // Dodaj foty do shopera
//             console.log(selectedImages)
//             if (selectedImages.length > 0) {
//                 await AddImageShoper(response, selectedImages, imageLinks, props)
//             }


//         } catch (error) {
//             if (axios.isAxiosError(error)) {
//                 console.error("Błąd HTTP:", error.response?.status, error.response?.data);
//                 toast.error("Wystąpił błąd podczas dodawania produktu");
//             } else {
//                 console.error("Błąd aplikacji:", error);
//                 toast.error("Wystąpił błąd podczas dodawania produktu");
//             }
//         };
//     }
//     let name = watch("name", "");
//     let visualCondition = watch("visualCondition", "");
//     let visualConditionSK = ""
//     let visualConditionCZ = ""
//     let cpu = watch("cpu", "");
//     let cpuModel = watch("cpuModel", "");
//     let condition = watch("condition", "");
//     let diskType = watch("diskType", "");
//     let diskCapacity = watch("diskCapacity", "");
//     let gpu = watch("gpu", "");
//     let caseType = watch("caseType", "");
//     let cpuCores = watch("cpuCores", "");
//     let cpuClockSpeed = watch("cpuClockSpeed", "");
//     let cpuMaxClockSpeed = watch("cpuMaxClockSpeed", "");
//     let system = watch("system", "");
//     let ramAmount = watch("ramAmount", "");
//     let ramType = watch("ramType", "");
//     let dvd = watch("DVD", "");
//     let ports = watch("ports", "");
//     let additionalInfo = watch("additionalInfo", "");
//     let included = watch("included", "")
//     let gaugeId: number
//     let gpuDescriptions = watch("gpuDescriptions", "");
//     let gpuI = watch("gpuI", "")
//     let resolution = watch("resolution", "");
//     let matrixType = watch("matrixType", "");
//     let matrixSize = watch("matrixSize", "");
//     let Frequency = watch("Frequency", "");
//     let touchScreen = watch("touchScreen", "");
//     let microphone = watch("microphone", "");
//     let camera = watch("camera", "");
//     let descriptionLanguage = watch("descriptionLanguage", "description")

//     let apiloSpec = PcApiloSpecyfication(
//         caseType,
//         cpuCores,
//         cpu,
//         cpuModel,
//         cpuClockSpeed,
//         cpuMaxClockSpeed,
//         gpu,
//         diskType,
//         diskCapacity,
//         included,
//         system,
//         ramAmount,
//         ramType,
//         dvd,
//         ports,
//         caseDescription,
//     )
//     let apiloSpecAio = PcApiloAioSpecyfication(
//         resolution,
//         matrixType,
//         matrixSize,
//         Frequency,
//         touchScreen,
//         microphone,
//         camera,
//     )

//     let descriptionCZ = watch("descriptionCZ", pcTemplateCZ(
//         nameCZ,
//         visualConditionCZ,
//         cpu,
//         cpuModel,
//         conditionCZ[condition],
//         caseType,
//         gpu, diskType,
//         diskCapacity,
//         system, ramType,
//         ramAmount,
//         additionalTranslationsCZ[dvd],
//         ports,
//         additionalInfoCZ,
//         infoActive,
//         cpuTypesDescriptionsCZ.i3,
//         diskTypesDescriptionsCZ.HDD,
//         ramTypesDescriptionsCZ.DDR2,
//         systemTypeCZ[system as keyof typeof systemType],
//         IncludeCZ,
//         imageSrc,
//         desktopStatusCZ[condition as keyof typeof desktopStatus],
//         gpuDescriptionsCZ,
//         resolution,
//         matrixType,
//         matrixSize,
//         Frequency,
//         additionalTranslationsCZ[touchScreen],
//         additionalTranslationsCZ[microphone],
//         additionalTranslationsCZ[camera],
//     ));
//     let descriptionSK = watch("descriptionSK", pcTemplateSK(
//         nameSK,
//         visualConditionSK,
//         cpu,
//         cpuModel,
//         conditionSK[condition],
//         caseType,
//         gpu, diskType,
//         diskCapacity,
//         system, ramType,
//         ramAmount,
//         additionalTranslationsSK[dvd],
//         ports,
//         additionalInfoSK,
//         infoActive,
//         cpuTypesDescriptionsSK.i3,
//         diskTypesDescriptionsSK.HDD,
//         ramTypesDescriptionsSK.DDR2,
//         systemTypeSK[system as keyof typeof systemType],
//         IncludeSK,
//         imageSrc,
//         desktopStatusSK[condition as keyof typeof desktopStatus],
//         gpuDescriptionsSK,
//         resolution,
//         matrixType,
//         matrixSize,
//         Frequency,
//         additionalTranslationsSK[touchScreen],
//         additionalTranslationsSK[microphone],
//         additionalTranslationsSK[camera],
//     ));

//     let description = watch("description", pcTemplate(
//         name,
//         visualCondition,
//         cpu,
//         cpuModel,
//         condition,
//         caseType,
//         gpu, diskType,
//         diskCapacity,
//         system, ramType,
//         ramAmount,
//         dvd,
//         ports,
//         additionalInfo,
//         infoActive,
//         cpuTypesDescriptions.i3,
//         diskTypesDescriptions.HDD,
//         ramTypesDescriptions.DDR2,
//         systemType[system as keyof typeof systemType],
//         included,
//         imageSrc,
//         desktopStatus[condition as keyof typeof desktopStatus],
//         gpuDescriptions,
//         resolution,
//         matrixType,
//         matrixSize,
//         Frequency,
//         touchScreen,
//         microphone,
//         camera,
//     ));
//     useEffect(() => {

//         if (additionalInfo == "") {
//             infoActive = "none !important"
//         }
//         else {
//             infoActive = "block !important"
//         }
//         if (caseType == "SFF" || caseType == "Tiny" || caseType == "USFF" || caseType == "Micro" || caseType == "USDT" || caseType == "Mini" || caseType == "Mini_Tower") {
//             gaugeId = 5
//             caseDescription = "Mała, kompaktowa obudowa"
//         }
//         else {
//             gaugeId = 6
//             caseDescription = " Łatwa w rozbudowie, pojemna obudowa "
//         }
//         console.log(gaugeId)
//         console.log(gpuI)
//         if (gpuI) {
//             gpuDescriptions = "Zintegrowana karta graficzna jest wystarczająca do codziennych zadań, takich jak przeglądanie internetu, oglądanie filmów czy podstawowa edycja grafiki, ale może mieć trudności z obsługą wymagających gier i programów. To ekonomiczne rozwiązanie dla użytkowników, którzy nie potrzebują dużej mocy obliczeniowej w grafice.";
//             setGpuDescriptionsCZ("Integrovaná grafická karta je dostačující pro každodenní úkoly, jako je prohlížení internetu, sledování filmů nebo základní úpravy obrázků, ale může mít problémy s náročnými hrami a programy. Jde o ekonomické řešení pro uživatele, kteří nepotřebují vysoký grafický výkon.")
//             setGpuDescriptionsSK("Integrovaná grafická karta je postačujúca na každodenné úlohy, ako je prehliadanie internetu, sledovanie filmov alebo základná úprava obrázkov, no môže mať problémy s náročnými hrami a programami. Ide o ekonomické riešenie pre používateľov, ktorí nepotrebujú vysoký grafický výkon.")
//             console.log(gpuDescriptions)
//         }
//         visualConditionSK = pcCaseVC_SK[visualCondition]
//         visualConditionCZ = pcCaseVC_CZ[visualCondition]
//         visualCondition = `<b class="poleasingowe_b">${visualCondition}</b>` + " (" + pcVC[visualCondition] + ")"


//         console.log(pcVC[visualCondition], visualCondition)
//         setValue("description", pcTemplate(
//             name,
//             visualCondition,
//             cpu,
//             cpuModel,
//             condition,
//             caseType,
//             gpu,
//             diskType,
//             diskCapacity,
//             system,
//             ramType,
//             ramAmount,
//             dvd,
//             ports,
//             additionalInfo,
//             infoActive,
//             cpuTypesDescriptions[cpu as keyof typeof cpuTypesDescriptions],
//             ramTypesDescriptions[ramType as keyof typeof ramTypesDescriptions],
//             diskTypesDescriptions[diskType as keyof typeof diskTypesDescriptions],
//             systemType[system as keyof typeof systemType],
//             included,
//             imageSrc,
//             desktopStatus[condition as keyof typeof desktopStatus],
//             gpuDescriptions,
//             resolution,
//             matrixType,
//             matrixSize,
//             Frequency,
//             touchScreen,
//             microphone,
//             camera,
//         ));
//         setValue("descriptionSK", pcTemplateSK(
//             nameSK,
//             visualConditionSK,
//             cpu,
//             cpuModel,
//             conditionSK[condition],
//             caseType,
//             gpu,
//             diskType,
//             diskCapacity,
//             system,
//             ramType,
//             ramAmount,
//             additionalTranslationsSK[dvd],
//             ports,
//             additionalInfoSK,
//             infoActive,
//             cpuTypesDescriptionsSK[cpu as keyof typeof cpuTypesDescriptions],
//             ramTypesDescriptionsSK[ramType as keyof typeof ramTypesDescriptions],
//             diskTypesDescriptionsSK[diskType as keyof typeof diskTypesDescriptions],
//             systemTypeSK[system as keyof typeof systemType],
//             IncludeSK,
//             imageSrc,
//             desktopStatusSK[condition as keyof typeof desktopStatus],
//             gpuDescriptionsSK,
//             resolution,
//             matrixType,
//             matrixSize,
//             Frequency,
//             additionalTranslationsSK[touchScreen],
//             additionalTranslationsSK[microphone],
//             additionalTranslationsSK[camera],
//         ));
//         setValue("descriptionCZ", pcTemplateCZ(
//             nameCZ,
//             visualConditionCZ,
//             cpu,
//             cpuModel,
//             conditionCZ[condition],
//             caseType,
//             gpu,
//             diskType,
//             diskCapacity,
//             system,
//             ramType,
//             ramAmount,
//             additionalTranslationsCZ[dvd],
//             ports,
//             additionalInfoCZ,
//             infoActive,
//             cpuTypesDescriptionsCZ[cpu as keyof typeof cpuTypesDescriptions],
//             ramTypesDescriptionsCZ[ramType as keyof typeof ramTypesDescriptions],
//             diskTypesDescriptionsCZ[diskType as keyof typeof diskTypesDescriptions],
//             systemTypeCZ[system as keyof typeof systemType],
//             IncludeCZ,
//             imageSrc,
//             desktopStatusCZ[condition as keyof typeof desktopStatus],
//             gpuDescriptionsCZ,
//             resolution,
//             matrixType,
//             matrixSize,
//             Frequency,
//             additionalTranslationsCZ[touchScreen],
//             additionalTranslationsCZ[microphone],
//             additionalTranslationsCZ[camera],
//         ));
//     }, [name, nameCZ, nameSK, visualCondition, cpu, cpuModel, condition, caseType, gpu, diskType, diskCapacity, system, ramType, ramAmount, dvd, ports, additionalInfo, additionalInfoCZ, additionalInfoSK, included, imageSrc, gpuDescriptions, gpuDescriptionsCZ, gpuDescriptionsSK, gpuI, resolution, matrixType, matrixSize, Frequency, touchScreen, microphone, camera, setValue]);
//     ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     //return
//     ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     return (
//         <>
//             <div className="addProductMainContainer" style={{}}>
//                 <Box style={{ display: 'flex', flexDirection: 'column' }}>
//                     <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column' }}>
//                         <Box
//                             sx={{ py: 2, display: 'grid', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
//                         >
//                             <ThemeProvider theme={MainTheme}>


//                                 <FormControl fullWidth >
//                                     <InputLabel>język opisu</InputLabel>
//                                     <Select
//                                         label="język opisu"
//                                         {...register("descriptionLanguage")}
//                                         defaultValue={"description"}
//                                     >
//                                         <MenuItem value="description">Polski</MenuItem>
//                                         <MenuItem value="descriptionCZ">Czeski</MenuItem>
//                                         <MenuItem value="descriptionSK">Słowacki</MenuItem>

//                                     </Select>
//                                 </FormControl>
//                                 <h2>Dodaj komputer</h2>
//                                 <div>
//                                     <h2>Pobierz parametry kategorii Allegro</h2>

//                                     <div>
//                                         <input
//                                             type="text"
//                                             value={searchName}
//                                             onChange={(e) => setSearchName(e.target.value)}
//                                             placeholder="frazę"
//                                         />
//                                         <button type="button" onClick={handleSearch}>Szukaj</button>

//                                         <pre>{JSON.stringify(result, null, 2)}</pre>
//                                     </div>
//                                 </div>
//                                 <FormControlLabel control={<Checkbox defaultChecked {...register("active")} />} label="aktywność" />
//                                 <TextField required label="tytuł" variant="outlined" type="text" {...register("name", {
//                                     onBlur: async (e) => {
//                                         const value = e.target.value;
//                                         console.log("Pole opuszczone, wartość:", value);

//                                         try {
//                                             setNameCZ(await handleTranslateCZ(value))
//                                             setNameSK(await handleTranslateSK(value))
//                                             toast.success("przetłumaczono");
//                                         } catch (error) {
//                                             console.error("Błąd podczas tłumaczenia:", error);
//                                             toast.error("błąd w tłumaczeniu");
//                                         }
//                                     }
//                                 })} />
//                                 <TextField label="uwagi" variant="outlined" type="text" {...register("additionalInfo", {
//                                     onBlur: async (e) => {
//                                         const value = e.target.value;
//                                         console.log("Pole opuszczone, wartość:", value);

//                                         try {
//                                             setAdditionalInfoCZ(await handleTranslateCZ(value))
//                                             setAdditionalInfoSK(await handleTranslateSK(value))
//                                             console.log(additionalInfoCZ);
//                                             toast.success("przetłumaczono");
//                                         } catch (error) {
//                                             console.error("Błąd podczas tłumaczenia:", error);
//                                             toast.error("błąd w tłumaczeniu");
//                                         }
//                                     }
//                                 })} />

//                                 <FormControl fullWidth required>
//                                     <InputLabel>stan</InputLabel>
//                                     <Select
//                                         label="stan"
//                                         {...register("condition")}
//                                     >
//                                         <MenuItem value="Poleasingowy">Poleasingowy</MenuItem>
//                                         <MenuItem value="Nowy">Nowy</MenuItem>
//                                         <MenuItem value="Powystawowy">Powystawowy</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <FormControl fullWidth required>
//                                     <InputLabel>stan wizualny</InputLabel>
//                                     <Select
//                                         label="stan wizualny"
//                                         {...register("visualCondition")}
//                                         required
//                                     >
//                                         <MenuItem value="Klasa A">Klasa A</MenuItem>
//                                         <MenuItem value="Klasa A-">Klasa A-</MenuItem>
//                                         <MenuItem value="Klasa B">Klasa B</MenuItem>
//                                         <MenuItem value="Klasa C">Klasa C</MenuItem>
//                                         <MenuItem value="Klasa D">Klasa D</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <FormControl fullWidth>
//                                     <InputLabel>rodzaj obudowy</InputLabel>
//                                     <Select {...register("caseType")}
//                                         label="rodzaj obudowy">
//                                         <MenuItem value="Tiny">Tiny</MenuItem>
//                                         <MenuItem value="USDT">USDT</MenuItem>
//                                         <MenuItem value="SFF">SFF</MenuItem>
//                                         <MenuItem value="Tower">Tower</MenuItem>
//                                         <MenuItem value="Mid Tower">Mid Tower</MenuItem>
//                                         <MenuItem value="All-in-One">All-in-One</MenuItem>
//                                         <MenuItem value="Micro">Micro</MenuItem>
//                                         <MenuItem value="USFF">USFF</MenuItem>
//                                         <MenuItem value="Mini">Mini</MenuItem>
//                                         <MenuItem value="Mini Tower">Mini Tower</MenuItem>

//                                     </Select>
//                                 </FormControl>
//                                 <FormControl fullWidth>
//                                     <InputLabel>Producent</InputLabel>
//                                     <Select {...register("producer")}
//                                         label="Producent">
//                                         <MenuItem value="23">Dell</MenuItem>
//                                         <MenuItem value="24">HP</MenuItem>
//                                         <MenuItem value="26">Asus</MenuItem>
//                                         <MenuItem value="28">Gigabyte</MenuItem>
//                                         <MenuItem value="29">ASRock</MenuItem>
//                                         <MenuItem value="30">MSI</MenuItem>
//                                         <MenuItem value="31">Intel</MenuItem>
//                                         <MenuItem value="32">Fujitsu-Siemens</MenuItem>
//                                         <MenuItem value="33">Acer</MenuItem>
//                                         <MenuItem value="34">ECS</MenuItem>
//                                         <MenuItem value="48">Philips</MenuItem>
//                                         <MenuItem value="49">NEC</MenuItem>
//                                         <MenuItem value="50">IIYAMA</MenuItem>
//                                         <MenuItem value="63">Sony</MenuItem>
//                                         <MenuItem value="150">Inny</MenuItem>
//                                         <MenuItem value="25">Lenovo</MenuItem>
//                                     </Select>
//                                 </FormControl>
//                                 <FormControl fullWidth>
//                                     <InputLabel>Procesor</InputLabel>
//                                     <Select {...register("cpu")}
//                                         label="Procesor">
//                                         <MenuItem value="i3">i3</MenuItem>
//                                         <MenuItem value="i5">i5</MenuItem>
//                                         <MenuItem value="i7">i7</MenuItem>
//                                         <MenuItem value="i9">i9</MenuItem>
//                                         <MenuItem value="R3">R3</MenuItem>
//                                         <MenuItem value="R5">R5</MenuItem>
//                                         <MenuItem value="R7">R7</MenuItem>
//                                         <MenuItem value="R9">R9</MenuItem>
//                                         <MenuItem value="Core 2 quad">Core 2 quad</MenuItem>
//                                         <MenuItem value="Core 2 duo">Core 2 duo</MenuItem>
//                                         <MenuItem value="Pentium">Pentium</MenuItem>
//                                         <MenuItem value="Xeon">Xeon</MenuItem>
//                                         <MenuItem value="Celeron">Celeron</MenuItem>
//                                         <MenuItem value="AMD A10">AMD A10</MenuItem>
//                                     </Select>
//                                 </FormControl>
//                                 <TextField label="Model procesora" variant="outlined" type="text"{...register("cpuModel")} />
//                                 <TextField label="Taktowanie maksymalne procesora GHz" variant="outlined" type="text"{...register("cpuMaxClockSpeed")} />
//                                 <TextField label="Taktowanie bazowe procesora GHz" variant="outlined" type="text"{...register("cpuClockSpeed")} />
//                                 <FormControl fullWidth>
//                                     <InputLabel>Liczba wątków procesora</InputLabel>
//                                     <Select {...register("cpuThreads")}
//                                         label="Liczba wątków procesora">
//                                         <MenuItem value="2">2</MenuItem>
//                                         <MenuItem value="3">3</MenuItem>
//                                         <MenuItem value="4">4</MenuItem>
//                                         <MenuItem value="6">6</MenuItem>
//                                         <MenuItem value="8">8</MenuItem>
//                                         <MenuItem value="12">12</MenuItem>
//                                         <MenuItem value="16">16</MenuItem>
//                                         <MenuItem value="20">20</MenuItem>
//                                         <MenuItem value="24">24</MenuItem>
//                                         <MenuItem value="28">28</MenuItem>
//                                         <MenuItem value="32">32</MenuItem>
//                                         <MenuItem value="36">36</MenuItem>
//                                         <MenuItem value="38">38</MenuItem>
//                                         <MenuItem value="40">40</MenuItem>
//                                         <MenuItem value="48">48</MenuItem>
//                                         <MenuItem value="64">64</MenuItem>
//                                         <MenuItem value="80">80</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <FormControl fullWidth>
//                                     <InputLabel>Liczba rdzeni procesora</InputLabel>
//                                     <Select {...register("cpuCores")}
//                                         label="Liczba rdzeni procesora">
//                                         <MenuItem value="2">2</MenuItem>
//                                         <MenuItem value="3">3</MenuItem>
//                                         <MenuItem value="4">4</MenuItem>
//                                         <MenuItem value="6">6</MenuItem>
//                                         <MenuItem value="8">8</MenuItem>
//                                         <MenuItem value="10">10</MenuItem>
//                                         <MenuItem value="12">12</MenuItem>
//                                         <MenuItem value="14">14</MenuItem>
//                                         <MenuItem value="16">16</MenuItem>
//                                         <MenuItem value="18">18</MenuItem>
//                                         <MenuItem value="20">20</MenuItem>
//                                         <MenuItem value="24">24</MenuItem>
//                                         <MenuItem value="32">32</MenuItem>
//                                         <MenuItem value="40">40</MenuItem>
//                                     </Select>
//                                 </FormControl>
//                                 <TextField label="karta graficzna" variant="outlined" type="text"{...register("gpu")} />
//                                 <FormControlLabel control={<Checkbox defaultChecked {...register("gpuI")} />} label="zintegrowana karta graficzna" />
//                                 <TextField disabled={!!gpuI} label="opis karty graficznej" variant="outlined" type="text"{...register("gpuDescriptions", {
//                                     onBlur: async (e) => {
//                                         const value = e.target.value;
//                                         console.log("Pole opuszczone, wartość:", value);

//                                         try {
//                                             setGpuDescriptionsCZ(await handleTranslateCZ(value))
//                                             setGpuDescriptionsSK(await handleTranslateSK(value))
//                                             toast.success("przetłumaczono");
//                                         } catch (error) {
//                                             console.error("Błąd podczas tłumaczenia:", error);
//                                             toast.error("błąd w tłumaczeniu");
//                                         }
//                                     }
//                                 })} />
//                                 <TextField label="Pojemność dysku" variant="outlined" type="text"{...register("diskCapacity")} />
//                                 <FormControl fullWidth>
//                                     <InputLabel>Typ dysku</InputLabel>
//                                     <Select {...register("diskType")}
//                                         label="Typ dysku">
//                                         <MenuItem value="M.2 NVME">M.2 NVME</MenuItem>
//                                         <MenuItem value="SSD">SSD</MenuItem>
//                                         <MenuItem value="HDD">HDD</MenuItem>
//                                         <MenuItem value="SSD+HDD">SSD+HDD</MenuItem>
//                                         <MenuItem value="M.2">M.2</MenuItem>
//                                         <MenuItem value="Brak">Brak</MenuItem>
//                                         <MenuItem value="Pamięć wlutowana EMMC">wlutowana EMMC</MenuItem>
//                                     </Select>
//                                 </FormControl>
//                                 <TextField label="w zestawie" variant="outlined" type="text"{...register("included", {
//                                     onBlur: async (e) => {
//                                         const value = e.target.value;
//                                         console.log("Pole opuszczone, wartość:", value);

//                                         try {
//                                             setIncludeCZ(await handleTranslateCZ(value))
//                                             setIncludeSK(await handleTranslateSK(value))
//                                             toast.success("przetłumaczono");
//                                         } catch (error) {
//                                             console.error("Błąd podczas tłumaczenia:", error);
//                                             toast.error("błąd w tłumaczeniu");
//                                         }
//                                     }
//                                 })} />
//                                 <TextField required label="SKU" variant="outlined" {...register("SKU")} />
//                                 <TextField required label="ilość" variant="outlined" type="number"{...register("stock")} />
//                                 <TextField required label="cena" variant="outlined" type="number"{...register("price")} />
//                                 <TextField label="Porty" variant="outlined" type="text"{...register("ports")} />
//                                 <TextField label="model" variant="outlined" type="text"{...register("model")} />
//                                 <FormControl fullWidth>
//                                     <InputLabel>Napęd</InputLabel>
//                                     <Select {...register("DVD")}
//                                         label="Napęd">
//                                         <MenuItem value="Brak">Brak</MenuItem>
//                                         <MenuItem value="Nagrywarka DVD RW">Nagrywarka DVD RW</MenuItem>
//                                         <MenuItem value="Napęd DVD">Napęd DVD</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <FormControl fullWidth>
//                                     <InputLabel>Marka</InputLabel>
//                                     <Select {...register("brend")}
//                                         label="Marka">
//                                         <MenuItem value="Dell">Dell</MenuItem>
//                                         <MenuItem value="Fujitsu">Fujitsu</MenuItem>
//                                         <MenuItem value="Acer">Acer</MenuItem>
//                                         <MenuItem value="HP">HP</MenuItem>
//                                         <MenuItem value="Lenovo">Lenovo</MenuItem>
//                                         <MenuItem value="Be Quiet">Be Quiet</MenuItem>
//                                         <MenuItem value="Intel">Intel</MenuItem>
//                                     </Select>
//                                 </FormControl>
//                                 <FormControl fullWidth>
//                                     <InputLabel>Ilość pamięci Ram</InputLabel>
//                                     <Select {...register("ramAmount")}
//                                         label="Ilość pamięci Ram">
//                                         <MenuItem value="2GB">2GB</MenuItem>
//                                         <MenuItem value="4GB">4GB</MenuItem>
//                                         <MenuItem value="6GB">6GB</MenuItem>
//                                         <MenuItem value="8GB">8GB</MenuItem>
//                                         <MenuItem value="12GB">12GB</MenuItem>
//                                         <MenuItem value="16GB">16GB</MenuItem>
//                                         <MenuItem value="24GB">24GB</MenuItem>
//                                         <MenuItem value="32GB">32GB</MenuItem>
//                                         <MenuItem value="64GB">64GB</MenuItem>
//                                         <MenuItem value="128GB">128GB</MenuItem>
//                                         <MenuItem value="192GB">192GB</MenuItem>
//                                         <MenuItem value="196GB">196GB</MenuItem>
//                                         <MenuItem value="256GB">256GB</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <FormControl fullWidth>
//                                     <InputLabel>Typ pamięci</InputLabel>
//                                     <Select {...register("ramType")}
//                                         label="Typ pamięci">
//                                         <MenuItem value="DDR2">DDR2</MenuItem>
//                                         <MenuItem value="DDR3">DDR3</MenuItem>
//                                         <MenuItem value="DDR4">DDR4</MenuItem>
//                                         <MenuItem value="DDR5">DDR5</MenuItem>
//                                     </Select>
//                                 </FormControl>
//                                 <FormControl fullWidth>
//                                     <InputLabel>Kolor</InputLabel>
//                                     <Select {...register("color")}
//                                         label="Kolor">
//                                         <MenuItem value="Czarny">Czarny</MenuItem>
//                                         <MenuItem value="Szary">Szary</MenuItem>
//                                         <MenuItem value="biały">biały</MenuItem>
//                                     </Select>
//                                 </FormControl>
//                                 <TextField label="Głębokość" variant="outlined" type="text"{...register("depth")} />
//                                 <TextField label="Szerokość" variant="outlined" type="text"{...register("width")} />
//                                 <TextField label="wysokość" variant="outlined" type="text"{...register("height")} />

//                                 <FormControl fullWidth>
//                                     <InputLabel>system</InputLabel>
//                                     <Select {...register("system")}
//                                         label="System"
//                                     >
//                                         <MenuItem value="Ubuntu">Ubuntu</MenuItem>
//                                         <MenuItem value="Windows 10 Home">Windows 10 Home</MenuItem>
//                                         <MenuItem value="Windows 10 Pro">Windows 10 Pro</MenuItem>
//                                         <MenuItem value="Brak">Brak</MenuItem>
//                                         <MenuItem value="Windows 11 Home">Windows 11 Home</MenuItem>
//                                         <MenuItem value="Windows 11 Pro">Windows 11 Pro</MenuItem>
//                                         <MenuItem value="Home Assistant">Home Assistant</MenuItem>

//                                     </Select>
//                                 </FormControl>

//                                 <FormControl fullWidth disabled={caseType !== "All-in-One"}>
//                                     <InputLabel>Rodzaj panelu</InputLabel>
//                                     <Select {...register("matrixType")} label="rodzaj panelu">
//                                         <MenuItem value="IPS">IPS</MenuItem>
//                                         <MenuItem value="VA">VA</MenuItem>
//                                         <MenuItem value="TN">TN</MenuItem>
//                                         <MenuItem value="OLED">OLED</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <FormControl fullWidth disabled={caseType !== "All-in-One"}>
//                                     <InputLabel>kamera</InputLabel>
//                                     <Select {...register("camera")} label="kamera">
//                                         <MenuItem value="Tak">Tak</MenuItem>
//                                         <MenuItem value="Nie">Nie</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <FormControl fullWidth disabled={caseType !== "All-in-One"}>
//                                     <InputLabel>mikrofon</InputLabel>
//                                     <Select {...register("microphone")} label="mikrofon">
//                                         <MenuItem value="Tak">Tak</MenuItem>
//                                         <MenuItem value="Nie">Nie</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <FormControl fullWidth disabled={caseType !== "All-in-One"}>
//                                     <InputLabel>ekran dotykowy</InputLabel>
//                                     <Select {...register("touchScreen")} label="ekran dotykowy">
//                                         <MenuItem value="Tak">Tak</MenuItem>
//                                         <MenuItem value="Nie">Nie</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <FormControl fullWidth disabled={caseType !== "All-in-One"}>
//                                     <InputLabel>Odświeżanie</InputLabel>
//                                     <Select {...register("Frequency")} label="Odświeżanie">
//                                         <MenuItem value="60Hz">60Hz</MenuItem>
//                                         <MenuItem value="75Hz">75Hz</MenuItem>
//                                         <MenuItem value="100Hz">100Hz</MenuItem>
//                                         <MenuItem value="120Hz">120Hz</MenuItem>
//                                         <MenuItem value="144Hz">144Hz</MenuItem>
//                                         <MenuItem value="165Hz">165Hz</MenuItem>
//                                         <MenuItem value="144Hz/165Hz">144Hz/165Hz</MenuItem>
//                                         <MenuItem value="175Hz">175Hz</MenuItem>
//                                         <MenuItem value="240Hz">240Hz</MenuItem>
//                                         <MenuItem value="360Hz">360Hz</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <FormControl fullWidth disabled={caseType !== "All-in-One"}>
//                                     <InputLabel>Rozdzielczość</InputLabel>
//                                     <Select {...register("resolution")} label="Rozdzielczość">
//                                         <MenuItem value="1366x768">1366x768</MenuItem>
//                                         <MenuItem value="1680x1050">1680x1050</MenuItem>
//                                         <MenuItem value="1600x900">1600x900</MenuItem>
//                                         <MenuItem value="1920x1080 (Full HD)">1920x1080 (Full HD)</MenuItem>
//                                         <MenuItem value="1920x1200">1920x1200</MenuItem>
//                                         <MenuItem value="2048×1152">2048×1152</MenuItem>
//                                         <MenuItem value="2560x1440">2560x1440</MenuItem>
//                                         <MenuItem value="2560x1600">2560x1600</MenuItem>
//                                         <MenuItem value="3440x1440">3440x1440</MenuItem>
//                                         <MenuItem value="3840x2160 (4K)">3840x2160 (4K)</MenuItem>
//                                         <MenuItem value="3840x1600">3840x1600</MenuItem>
//                                         <MenuItem value="1440x900">1440x900</MenuItem>
//                                         <MenuItem value="7680 x 4320 (FUHD 8K)">7680 x 4320 (FUHD 8K)</MenuItem>
//                                         <MenuItem value="2560x1080">2560x1080</MenuItem>
//                                         <MenuItem value="1600x1200">1600x1200</MenuItem>
//                                         <MenuItem value="5120x1440">5120x1440</MenuItem>
//                                     </Select>
//                                 </FormControl>
//                                 <FormControl fullWidth disabled={caseType !== "All-in-One"}>
//                                     <InputLabel>Przekątna ekranu</InputLabel>
//                                     <Select {...register("matrixSize")} label="Przekątna ekranu">
//                                         <MenuItem value='17"'>17"</MenuItem>
//                                         <MenuItem value='19"'>19"</MenuItem>
//                                         <MenuItem value='19,5"'>19,5"</MenuItem>
//                                         <MenuItem value='20"'>20"</MenuItem>
//                                         <MenuItem value='20,5"'>20,5"</MenuItem>
//                                         <MenuItem value='21"'>21"</MenuItem>
//                                         <MenuItem value='21,5"'>21,5"</MenuItem>
//                                         <MenuItem value='22"'>22"</MenuItem>
//                                         <MenuItem value='23"'>23"</MenuItem>
//                                         <MenuItem value='23,8"'>23,8"</MenuItem>
//                                         <MenuItem value='24"'>24"</MenuItem>
//                                         <MenuItem value='24,5"'>24,5"</MenuItem>
//                                         <MenuItem value='25"'>25"</MenuItem>
//                                         <MenuItem value='27"'>27"</MenuItem>
//                                         <MenuItem value='28"'>28"</MenuItem>
//                                         <MenuItem value='29"'>29"</MenuItem>
//                                         <MenuItem value='30"'>30"</MenuItem>
//                                         <MenuItem value='31,5"'>31,5"</MenuItem>
//                                         <MenuItem value='32"'>32"</MenuItem>
//                                         <MenuItem value='34"'>34"</MenuItem>
//                                         <MenuItem value='34,1"'>34,1"</MenuItem>
//                                         <MenuItem value='37,5"'>37,5"</MenuItem>
//                                         <MenuItem value='49"'>49"</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <label >opis</label>
//                                 <textarea style={{ minWidth: '100%', maxWidth: '100%' }} defaultValue={pcTemplate("", "", "", "", "", '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', "", '', '', '', '', '', '', '', '')} {...register("description")} />

//                                 <Button
//                                     variant="contained"
//                                     component="label"
//                                 >
//                                     Dodaj zdjęcia
//                                     <input
//                                         style={{ width: '100%' }}
//                                         type="file"
//                                         multiple
//                                         accept="image/*"
//                                         onChange={handleImageChange}
//                                         hidden
//                                     />
//                                 </Button>

//                                 <Typography>
//                                     {selectedImages.map(file => file.name).join(", ") || "Brak zdjęć"}
//                                 </Typography>

//                                 <Button variant="outlined" type="reset"  >Reset formularza</Button>
//                                 <Button variant="contained" type="submit" >Dodaj</Button>
//                             </ThemeProvider>
//                         </Box>
//                     </form>

//                     <Box
//                         sx={{ py: 2, display: 'grid', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
//                     >
//                         <ThemeProvider theme={MainTheme}>

//                             <h2>Parametry Allegro</h2>
//                             {pcParameters.parameters.map((param) => {
//                                 const isMulti = param.restrictions?.multipleChoices === true;

//                                 return (
//                                     <Box key={param.id}>
//                                         {/* Typ słownikowy (dictionary) */}
//                                         {param.type === 'dictionary' && param.dictionary && (
//                                             <FormControl fullWidth required={param.required}>
//                                                 <InputLabel>{param.name}</InputLabel>
//                                                 <Select
//                                                     multiple={isMulti}
//                                                     value={
//                                                         isMulti
//                                                             ? (Array.isArray(formData[param.id]) ? formData[param.id] : [])
//                                                             : (typeof formData[param.id] === 'string' ? formData[param.id] : '')
//                                                     }
//                                                     label={param.name}
//                                                     onChange={(e: SelectChangeEvent<any>) =>
//                                                         handleChangeAllegro(param.id, e.target.value)
//                                                     }
//                                                     renderValue={(selected) =>
//                                                         Array.isArray(selected)
//                                                             ? selected
//                                                                 .map((id) => {
//                                                                     const item = param.dictionary.find((d) => d.id === id);
//                                                                     return item?.value || id;
//                                                                 })
//                                                                 .join(', ')
//                                                             : param.dictionary.find((d) => d.id === selected)?.value || selected
//                                                     }
//                                                 >
//                                                     {param.dictionary.map((option) => (
//                                                         <MenuItem key={option.id} value={option.id}>
//                                                             {isMulti && (
//                                                                 <Checkbox
//                                                                     checked={
//                                                                         Array.isArray(formData[param.id]) &&
//                                                                         formData[param.id].includes(option.id)
//                                                                     }
//                                                                 />
//                                                             )}
//                                                             <ListItemText primary={option.value} />
//                                                         </MenuItem>
//                                                     ))}
//                                                 </Select>

//                                             </FormControl>
//                                         )}

//                                         {(param.type === 'integer' || param.type === 'float') && (
//                                             <TextField
//                                                 type="number"
//                                                 label={param.name}
//                                                 fullWidth
//                                                 required={param.required}
//                                                 inputProps={{
//                                                     step: param.type === 'float' ? '0.01' : '1',
//                                                 }}
//                                                 value={
//                                                     formData[param.id] !== undefined && formData[param.id] !== null
//                                                         ? String(formData[param.id])
//                                                         : ''
//                                                 }
//                                                 onChange={(e) => handleChangeAllegro(param.id, e.target.value)}
//                                             />
//                                         )}


//                                         {/* Typ tekstowy */}
//                                         {param.type === 'string' && (
//                                             <TextField
//                                                 type="text"
//                                                 label={param.name}
//                                                 fullWidth
//                                                 required={param.required}
//                                                 value={formData[param.id] || ''}
//                                                 onChange={(e) => handleChangeAllegro(param.id, e.target.value)}
//                                             />
//                                         )}
//                                     </Box>
//                                 );
//                             })}
//                             <button onClick={handleAddAllegroOffer}>Dodaj produkt</button>


//                             {/* Podgląd danych */}
//                             <Box sx={{ mt: 4 }}>
//                                 <Typography variant="body2">Aktualne dane formularza:</Typography>
//                                 <pre style={{ padding: '1rem' }}>
//                                     {JSON.stringify(formData, null, 2)}
//                                 </pre>
//                             </Box>
//                         </ThemeProvider>
//                     </Box>
//                 </Box>



//                 {showSearchresult && (
//                     <div className="absolute bottom-4 right-4 w-[90vw] max-w-3xl bg-white shadow-lg border border-gray-300 rounded-xl p-4 z-50 overflow-auto max-h-[90vh]"
//                         style={{ zIndex: '100', top: '50px', left: '35%', position: 'fixed', maxHeight: '700px', overflowY: 'auto', width: '700px', backgroundColor: '#f2f2f2', color: '#333', padding: '10px', borderRadius: '20px', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px' }}
//                     >
//                         <div className="flex justify-between items-center mb-4">
//                             <h2 className="text-xl font-bold">Wyniki wyszukiwania</h2>
//                             <button
//                                 onClick={() => setShowSearchresult(false)}
//                                 className="text-gray-600 hover:text-red-500 text-lg font-bold"
//                             >
//                                 ✕
//                             </button>
//                         </div>

//                         {!searchResult ? (
//                             <p className="text-gray-500">Brak wyników.</p>
//                         ) : (
//                             <>
//                                 {searchResult.products?.map((product: any) => (
//                                     <div key={product.id} className="border-b border-gray-200 py-4" style={{ borderBottom: '1px darkgray solid', fontSize: '0.7rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
//                                         <div>
//                                             <h3 style={{ fontSize: '0.9rem', color: 'blue' }} className="text-lg font-semibold">{product.name}</h3>

//                                             <p className="text-sm mt-2">
//                                                 Kategoria: {product.category?.path?.map((p: any) => p.name).join(' > ') || 'brak'}
//                                             </p>
//                                             {/* <p className="text-sm text-gray-700 mt-1">
//                                                             ID produktu: {product.id}
//                                                         </p> */}
//                                             {product.parameters?.length > 0 && (
//                                                 <ul className="text-sm mt-2 list-disc list-inside">
//                                                     {product.parameters
//                                                         .filter((param: any) => param.options.identifiesProduct === true)
//                                                         .map((param: any, idx: number) => {
//                                                             const value =
//                                                                 param.valuesLabels?.join(', ') ||
//                                                                 param.values?.join(', ') ||
//                                                                 (param.rangeValue?.from && param.rangeValue?.to
//                                                                     ? `${param.rangeValue.from} - ${param.rangeValue.to}`
//                                                                     : 'brak danych');

//                                                             return (
//                                                                 <li key={idx}>
//                                                                     {param.name}: {value}
//                                                                     {param.unit && !value.includes(param.unit) ? ` ${param.unit}` : ''}
//                                                                 </li>
//                                                             );
//                                                         })}
//                                                 </ul>
//                                             )}
//                                             <Button className="mt-2" onClick={() => { handleSelectAllegroProduct(product); setShowSearchresult(false) }}     >
//                                                 wybierz
//                                             </Button>

//                                             {selectedProductId === product.id && (
//                                                 <p className="text-green-600 mt-1 text-sm">✅ Wybrano ten produkt</p>
//                                             )}
//                                             <p>{selectedProductId}</p>
//                                         </div>

//                                         {product.images?.[0]?.url && (
//                                             <img
//                                                 src={product.images[0].url}
//                                                 alt={product.name}
//                                                 className="w-32 h-32 object-contain mt-2"
//                                                 style={{ height: '200px', padding: '20px' }}
//                                             />
//                                         )}

//                                     </div>
//                                 ))}
//                             </>
//                         )}
//                     </div>

//                 )}



//                 <div className="preview">
//                     {descriptionLanguage === 'description' && (
//                         <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: description }} />
//                     )}

//                     {descriptionLanguage === 'descriptionCZ' && (
//                         <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: descriptionCZ }} />
//                     )}

//                     {descriptionLanguage === 'descriptionSK' && (
//                         <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: descriptionSK }} />
//                     )}
//                 </div>
//             </div>
//         </>
//     );
// }

// export default AddProduct;
