import axios from "axios";
import { useForm, SubmitHandler } from "react-hook-form";
import { useState, useEffect } from "react";
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
} from "@mui/material";
import { MainTheme } from "./themes";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { EditorState, convertToRaw } from "draft-js";
// @ts-ignore
import draftToHtml from "draftjs-to-html";
import { API_URL } from "../config";
import { handleTranslateCZ, handleTranslateSK } from "../backendQueries/translate";
import RelatedProductsSelect from "../relatedProductsSelect";
import { getShoperErrorMessage } from "../backendQueries/shoperErrorMessage";
import { ApiloSubmitControls } from "./apiloSubmitControls";

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
    [key: string]: any; // Dynamiczne pola formularza dla atrybutów
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

interface Attribute {
    attribute_id: number;
    name: string;
    type: string;
    options: {
        option_id: number;
        value: string;
    }[];
}

function AddCpu(props: AddProductProps) {
    const [attributeList, setAttributeList] = useState<Attribute[]>([]);
    const [loading, setLoading] = useState(false); // Dodajemy stan loading
    const { register, handleSubmit, setValue } = useForm<IFormInput>();
    const [descriptionValue, setDescriptionValue] = useState<string>('');
    const images = useProductImages();
    const { selectedImages, imageLinks } = images;
    const [addToApilo, setAddToApilo] = useState(true);
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [categories, setCategories] = useState<CategoryResource[]>([]);
    const [producers, setProducers] = useState<ProducersResource[]>([]);
    const [attributeGroup, setAttributeGroup] = useState<any>(null);
    const [producer, setProducer] = useState<ProducersResource[]>([]);
    const [nameCZ, setNameCZ] = useState("");
    const [nameSK, setNameSK] = useState("");
    const [descriptionCZ, setDescriptionCZ] = useState("");
    const [descriptionSK, setDescriptionSK] = useState("");
    const [relatedPackId, setRelatedPackId] = useState("");

    let apiloImageUUIDs: string[] = [];


    useEffect(() => {
        handleGetCategories();
        handleGetProducers()
    }, []);


    const onEditorStateChange = (editorState: EditorState) => {
        setEditorState(editorState);
        setDescriptionValue(draftToHtml(convertToRaw(editorState.getCurrentContent())));
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
            if (addToApilo) try {
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
                toast.error(getShoperErrorMessage(error, attributeList));
                return;
            }
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

            }
            toast.success(addToApilo
                ? `Produkt ${response.data} został dodany do Shopera i Apilo.`
                : `Produkt ${response.data} został dodany do Shopera.`);


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
                } catch (error) {
                    console.error("Image upload error:", error);
                    toast.error("Błąd podczas dodawania zdjęcia");
                    throw error;
                }
            }

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Błąd HTTP:", error.response?.status, error.response?.data);
                toast.error(getShoperErrorMessage(error, attributeList));
            } else {
                console.error("Błąd aplikacji:", error);
                toast.error(getShoperErrorMessage(error, attributeList));
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
                        <TextField required label="Cena" type="number" inputProps={{ step: "0.01" }} {...register("price")} />

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
                        <Autocomplete
                            renderOption={(props, option, index) => (
                                <li {...props} key={option.category_id}>
                                    {option.translations.pl_PL.name}
                                </li>
                            )}
                            options={categories}
                            getOptionLabel={(option) => option?.translations?.pl_PL?.name || "Nieznana kategoria"}
                            isOptionEqualToValue={(option, value) => option?.category_id === value?.category_id} // Zapobiega warningom
                            renderInput={(params) => <TextField {...params} label="Kategoria" />}
                            onChange={(event, value) => {
                                setValue("categoryId", value?.category_id || 0);
                                setAttributeList([]);
                                setLoading(true); // Ustawiamy loading na true

                                const attributeGroups = value?.translations?.pl_PL?.attribute_groups || [];

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

                        <ProductImageManager {...images} />
                        <ApiloSubmitControls addToApilo={addToApilo} onChange={setAddToApilo}>
                            <Button variant="contained" type="submit" disabled={!images.imagesReady || images.uploadingImages}>Dodaj</Button>
                        </ApiloSubmitControls>
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

export default AddCpu;
