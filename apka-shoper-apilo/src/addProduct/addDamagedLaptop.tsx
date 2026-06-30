import axios from "axios";
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Autocomplete, Box, Button, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, TextField, ThemeProvider, Typography } from "@mui/material";
import { MainTheme } from "./themes";
import { API_URL } from "../config";
import './addProducts.css';
import { handleImageUpload } from "../image-host";
import { damagedLaptopTemplate } from "./templates/damagedLaptops";
import { ProductSafetyCertificateResource, ProductSafetyProducerResource } from "../types";
import { handleGetProductSafetyProducers } from "../backendQueries/getProductSafetyProducers";
import { handleGetProductSafetyCertificates } from "../backendQueries/getProductSafetyCertificates";
import RelatedProductsSelect from "../relatedProductsSelect";

type AddDamagedLaptopProps = {
    authToken: string,
}

interface IFormInput {
    model: string,
    marka: string,
    grade: string,
    visualCondition: string,
    biosOK: string,
    biosX: string,
    cpu: string,
    ramType: string,
    ramAmount: string
    diskType: string,
    diskSize: string,
    gpu: string,
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
    bios: string,
    productSafetyProducerId?: number,
    productSafetyCertificateIds?: number[],
    productSafetyWarnings?: string[]
}

function AddDamagedLaptop(props: AddDamagedLaptopProps) {
    const [portsListString, setPortsListString] = useState("");
    const { register, handleSubmit, watch, setValue, control } = useForm<IFormInput>()
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    // const [apiloImageUUIDS, setApiloImageUUIDS] = useState<string[]>([]);
    const [imageLinks, setImageLinks] = useState<string[]>([]);
    const [productSafetyProducers, setProductSafetyProducers] = useState<ProductSafetyProducerResource[]>([]);
    const [productSafetyCertificates, setProductSafetyCertificates] = useState<ProductSafetyCertificateResource[]>([]);
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
            const safetyProducerId = normalizeIdValue(data.productSafetyProducerId) ?? 0;
            const safetyCertificateIds = Array.isArray(data.productSafetyCertificateIds)
                ? data.productSafetyCertificateIds
                : [];
            const safetyInformation: Record<string, unknown> = {};
            if (safetyProducerId) safetyInformation.gpsr_producer_id = safetyProducerId;
            if (safetyCertificateIds.length) safetyInformation.gpsr_certificates = safetyCertificateIds;

            const response = await axios.post(`${API_URL}/product/shoper`, {
                producer_id: data.marka,
                category_id: 323,
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
                attributes: {
                    307: "24 miesiące",
                    911: data.diskType,
                    910: data.diskSize,
                    909: data.ramType,
                    908: data.ramAmount,
                    907: data.cpu,
                    912: data.bios,
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

    let name = watch("name", "");
    let producer = watch("producer", "");
    let visualCondition = watch("visualCondition", "");
    let model = watch("model", "");
    let marka = watch("marka", "");
    let biosOK = "";
    let biosX = "";
    let cpu = watch("cpu", "");
    let ramType = watch("ramType", "");
    let ramAmount = watch("ramAmount", "");
    let disk = watch("diskType", "");
    let diskSize = watch("diskSize", "");
    let gpu = watch("gpu", "");
    let screen = watch("screen", "");
    let battery = watch("battery", "");
    let bios = watch("bios", "");

    let description = watch("description", damagedLaptopTemplate(
        model,
        producer,
        visualCondition,
        biosOK,
        biosX,
        cpu,
        ramType + " " + ramAmount,
        disk + "" + diskSize,
        gpu,
        screen,
        battery
    ));
    useEffect(() => {
        if (bios) {
            biosOK = ""
            biosX = "none !important"
        }
        else {
            biosOK = "none !important"
            biosX = ""
        }

        setValue("description", damagedLaptopTemplate(
            model,
            producer,
            visualCondition,
            biosOK,
            biosX,
            cpu,
            ramType + " " + ramAmount,
            disk + " " + diskSize,
            gpu,
            screen,
            battery
        ));
    }, [
        model,
        producer,
        visualCondition,
        biosOK,
        biosX,
        cpu,
        ramType,
        ramAmount,
        disk,
        diskSize,
        gpu,
        screen,
        battery,
        producer,
        bios, setValue]);

    return (
        <>
            <div className="addProductMainContainer">
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column' }}>
                    <RelatedProductsSelect authToken={props.authToken} value={relatedPackId} onChange={setRelatedPackId} />
                    <Box
                        sx={{ py: 2, display: 'grid', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <ThemeProvider theme={MainTheme}>
                            <h2>Dodaj uszkodzony laptop</h2>
                            <FormControlLabel control={<Checkbox defaultChecked {...register("active")} />} label="Aktywność" />
                            <TextField label="Tytuł" type="text"{...register("name")} />
                            <FormControl fullWidth >
                                <InputLabel>Producent</InputLabel>
                                <Select {...register("marka")} label="Producent">
                                    <MenuItem value="23">Dell</MenuItem>
                                    <MenuItem value="24">HP</MenuItem>
                                    <MenuItem value="26">Asus</MenuItem>
                                    <MenuItem value="28">Gigabyte</MenuItem>
                                    <MenuItem value="29">ASRock</MenuItem>
                                    <MenuItem value="30">MSI</MenuItem>
                                    <MenuItem value="31">Intel</MenuItem>
                                    <MenuItem value="32">Fujitsu-Siemens</MenuItem>
                                    <MenuItem value="33">Acer</MenuItem>
                                    <MenuItem value="34">ECS</MenuItem>
                                    <MenuItem value="48">Philips</MenuItem>
                                    <MenuItem value="49">NEC</MenuItem>
                                    <MenuItem value="50">IIYAMA</MenuItem>
                                    <MenuItem value="63">Sony</MenuItem>
                                    <MenuItem value="150">Inny</MenuItem>
                                    <MenuItem value="25">Lenovo</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth >
                                <InputLabel>Producent</InputLabel>
                                <Select {...register("producer")} label="Producent">
                                    <MenuItem value="Lenovo">Lenovo</MenuItem>
                                    <MenuItem value="HP">HP</MenuItem>
                                    <MenuItem value="Dell">Dell</MenuItem>
                                    <MenuItem value="Asus">Asus</MenuItem>
                                    <MenuItem value="Acer">Acer</MenuItem>
                                    <MenuItem value="Apple">Apple</MenuItem>
                                    <MenuItem value="MSI">MSI</MenuItem>
                                    <MenuItem value="Razer">Razer</MenuItem>
                                    <MenuItem value="Samsung">Samsung</MenuItem>
                                    <MenuItem value="Microsoft">Microsoft</MenuItem>
                                    <MenuItem value="Huawei">Huawei</MenuItem>
                                    <MenuItem value="Gigabyte">Gigabyte</MenuItem>
                                    <MenuItem value="Inny">Inny</MenuItem>
                                </Select>
                            </FormControl>

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

                            <TextField label="SKU" {...register("SKU")} />
                            <TextField label="Ilość" type="number"{...register("stock")} />
                            <TextField label="Cena" type="number"{...register("price")} />
                            <label >opis</label>
                            <textarea defaultValue={damagedLaptopTemplate('', '', '', '', '', '', '', '', '', '', '')}  {...register("description")} />

                            <FormControl fullWidth >
                                <InputLabel>Klasa wizualna</InputLabel>
                                <Select {...register("grade")} label="Klasa wizualna">
                                    <MenuItem value="Klasa A">Klasa A</MenuItem>
                                    <MenuItem value="Klasa B">Klasa B</MenuItem>
                                    <MenuItem value="Klasa C">Klasa C</MenuItem>
                                    <MenuItem value="Klasa A-">Klasa A-</MenuItem>
                                    <MenuItem value="Klasa B+">Klasa B+</MenuItem>
                                    <MenuItem value="Powystawowy">Powystawowy </MenuItem>
                                </Select>
                            </FormControl>
                            <TextField label="Pojemność dysku" variant="outlined" type="text"{...register("diskSize")} />
                            <FormControl fullWidth>
                                <InputLabel>Typ dysku</InputLabel>
                                <Select {...register("diskType")}
                                    label="Typ dysku">
                                    <MenuItem value="M.2 NVME">M.2 NVME</MenuItem>
                                    <MenuItem value="SSD">SSD</MenuItem>
                                    <MenuItem value="HDD">HDD</MenuItem>
                                    <MenuItem value="SSD+HDD">SSD+HDD</MenuItem>
                                    <MenuItem value="M.2">M.2</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Typ pamięci</InputLabel>
                                <Select {...register("ramType")}
                                    label="Typ pamięci">
                                    <MenuItem value="DDR2">DDR2</MenuItem>
                                    <MenuItem value="DDR3">DDR3</MenuItem>
                                    <MenuItem value="DDR4">DDR4</MenuItem>
                                    <MenuItem value="DDR5">DDR5</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControlLabel control={<Checkbox defaultChecked {...register("bios")} />} label="czy uruchamia się do bios" />
                            <TextField label="Ilość pamięci Ram" type="text"{...register("ramAmount")} />
                            <TextField label="ekran(rozdzielczość, przekątna)" type="text"{...register("screen")} />
                            <TextField label="stan baterii" type="text"{...register("battery")} />
                            <TextField label="Model procesora" variant="outlined" type="text"{...register("cpu")} />
                            <TextField label="Model" type="text"{...register("model")} />
                            <TextField label="karta graficzna" variant="outlined" type="text"{...register("gpu")} />
                            <TextField label="opis stanu" variant="outlined" type="text"{...register("visualCondition")} />

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
                    <div style={{ padding: '20px' }} dangerouslySetInnerHTML={{ __html: description }} />
                </div>
            </div>

        </>
    );
}

export default AddDamagedLaptop;
