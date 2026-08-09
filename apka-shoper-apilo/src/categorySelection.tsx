import React, { useEffect, useState } from 'react';
import './App.css';
import AddMonitor from './addProduct/addMonitor';
import AddCustomProduct from './addProduct/addCustomProduct';
import AddDamagedLaptop from './addProduct/addDamagedLaptop';
import AddLaptop from './addProduct/addLaptop';
import AddPhoneIOS from './addProduct/addPhoneIOS';
import AddPhoneAndroid from './addProduct/addPhoneAndroid';
import axios from 'axios';
import { toast } from "react-toastify";
import { API_URL } from "./config";
import { Product, SearchResult } from './types';
import { Box, Button, Checkbox, FormControl, InputLabel, ListItemText, MenuItem, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import { pcParameters } from './allegroParameters/pcParameters';
import AddGamingPC from './addProduct/addGamingPC';
import AddCpu from './addProduct/addCpu';
import AddPC from './addProduct/addPc';
import AddLaptopNew from './addProduct/addLaptopNew';
import { getOrdersStatus5 } from './backendQueries/getOrders';
import ApiloOrdersPanel from './apiloOrder';
import ShoperDeliveryTimePanel from './shoperDeliveryTimePanel';
import RelatedProductsPanel from './relatedProductsPanel';
import ApiloTokenStatus from './apiloTokenStatus';

type AddProductProps = {
    authToken: string
}
type FormData = {
    [paramId: string]: string;
};

const buttonStyle = (bgColor = "rgb(54 52 52)") => ({
    backgroundColor: bgColor,
    color: "#f7f7f7",
    padding: "8px 14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    transition: "background 0.2s",
});



function CategorySelection(props: AddProductProps) {
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showAddMonitor, setShowAddMonitor] = useState(false);
    const [showAddCustomProduct, setShowAddCustomProduct] = useState(false);
    const [showAddDamagedLaptop, setShowAddDamagedLaptop] = useState(false);
    const [showAddLaptop, setShowAddLaptop] = useState(false);
    const [showAddIOS, setShowAddIOS] = useState(false);
    const [showAddAndroid, setShowAddAndroid] = useState(false);
    const [showAddGamingPC, setAddShowGamingPC] = useState(false);
    const [showAddCpu, setShowAddCpu] = useState(false);
    const [showAddPC, setShowAddPC] = useState(false);
    const [showAddLaptopNew, setShowAddLaptopNew] = useState(false);
    const [showApiloOredr, setShowApiloOrder] = useState(false);
    const [showShoperDeliveryTime, setShowShoperDeliveryTime] = useState(false);
    const [showRelatedProducts, setShowRelatedProducts] = useState(false);

    const [verificationUrl, setVerificationUrl] = useState('');
    const [verificationUrlProd, setVerificationUrlProd] = useState('');
    const [deviceCode, setDeviceCode] = useState('');
    const [deviceCodeProd, setDeviceCodeProd] = useState('');
    const [accessTokenAllegro, setAccessTokenAllegro] = useState('');
    const [error, setError] = useState('');
    const [polling, setPolling] = useState(false);
    const [params, setParams] = useState(null);
    const [categoryId, setCategoryId] = useState('486');

    const [searchName, setSearchName] = useState('');
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [showSearchresult, setShowSearchresult] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Product>();
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);


    const [result, setResult] = useState(null);
    const [formData, setFormData] = useState<FormData>({});

    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);

    const handleClick = async () => {
        setLoading(true);
        const data = await getOrdersStatus5({ authToken: props.authToken });
        setOrders(data);
        setLoading(false);
    };


    const handleChange = (paramId: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [paramId]: value,
        }));
    };




    const handleSelect = (product: Product) => {
        setSelectedProductId(product.id);
        setSelectedProduct(product);

    };

    const fetchParameters = async () => {
        try {
            const response = await axios.get(`${API_URL}/product/category-parameters`, {
                headers: {
                    Authorization: `Bearer ${accessTokenAllegro}`,
                },
                params: {
                    categoryId: categoryId, // upewnij się że to nie jest undefined/null
                },
            });
            setParams(response.data.parameters);
        } catch (err) {
            console.error('Błąd podczas pobierania parametrów:', err);
            setError('Nie udało się pobrać parametrów.');
        }
    };

    const handleSearch = async () => {

        try {
            const response = await axios.get(`${API_URL}/product/search`, {
                params: { searchName },
                headers: {
                    Authorization: `Bearer ${accessTokenAllegro}`,
                },
            });

            setSearchResult(response.data);
            setShowSearchresult(true)
        } catch (error) {
            console.error('Błąd wyszukiwania produktu:', error);
        }
    };

    const buildOfferParameters = (formData: FormData): any[] => {
        return Object.entries(formData).map(([id, value]) => {
            if (Array.isArray(value)) {
                return {
                    id,
                    valuesIds: value
                };
            } else if (typeof value === 'string' && value.startsWith(`${id}_`)) {
                // Zakładamy, że to dictionary ID
                return {
                    id,
                    valuesIds: [value]
                };
            } else {
                return {
                    id,
                    values: [value]
                };
            }
        });
    };


    const handleSubmit = async () => {
        const token = accessTokenAllegro
        const productData = {

            "productSet":
                [{
                    "product":
                    {
                        "id": selectedProductId,   // numer GTIN, MPN lub ID produktu
                        "idType": "GTIN",         // typ wartości w polu "product.id". 
                        // Dla GTIN wskaż "GTIN",dla numerów 
                        // katalogowych nadanych przez producenta - "MPN".
                        // Jeśli wskazujesz UUID produktu, pozostaw pole puste.
                        "parameters": buildOfferParameters(formData)
                    }
                }],
            "sellingMode": {
                "price": {
                    "amount": "220.85",            // cena
                    "currency": "PLN"
                }
            },
            "stock": {
                "available": 10                  // liczba sztuk
            },
            "publication": {
                "status": "INACTIVE",
            },

        };


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
    };

    const startAuth = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/device-code`);
            setVerificationUrl(res.data.verification_uri_complete);
            setDeviceCode(res.data.device_code);
            setPolling(true);
        } catch (err) {
            console.error(err);
            setError('Błąd podczas pobierania kodu urządzenia');
        }
    };

    const startAuthProd = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/device-code-prod`);
            setVerificationUrlProd(res.data.verification_uri_complete);
            setDeviceCodeProd(res.data.device_code);
            setPolling(true);
        } catch (err) {
            console.error(err);
            setError('Błąd podczas pobierania kodu urządzenia');
        }
    };

    useEffect(() => {
        if (!polling || !deviceCode) return;

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`${API_URL}/auth/poll-token`, {
                    params: { device_code: deviceCode },
                });

                if (res.data.access_token) {
                    setAccessTokenAllegro(res.data.access_token);
                    setPolling(false);
                    clearInterval(interval);
                } else if (res.data.error === 'access_denied') {
                    setError('Dostęp odrzucony');
                    setPolling(false);
                    clearInterval(interval);
                } else if (res.data.error === 'slow_down') {
                    // opcjonalnie obsłużenie slow_down
                }
            } catch (err) {
                console.error(err);
            }
        }, 5000); // domyślnie 5s, można pobrać z `interval` z odpowiedzi

        return () => clearInterval(interval);
    }, [polling, deviceCode]);

    useEffect(() => {
        if (!polling || !deviceCodeProd) return;

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`${API_URL}/auth/poll-token-prod`, {
                    params: { device_code: deviceCodeProd },
                });
                if (res.data.access_token) {
                    setAccessTokenAllegro(res.data.access_token);
                    setPolling(false);
                    clearInterval(interval);
                } else if (res.data.error === 'access_denied') {
                    setError('Dostęp odrzucony');
                    setPolling(false);
                    clearInterval(interval);
                } else if (res.data.error === 'slow_down') {
                    // opcjonalnie obsłużenie slow_down
                }
            } catch (err) {
                console.error(err);
            }
        }, 5000); // domyślnie 5s, można pobrać z `interval` z odpowiedzi

        return () => clearInterval(interval);
    }, [polling, deviceCodeProd]);



    const handleAddProductClick = () => {
        setShowAddProduct(true);
        setShowAddMonitor(false);
        setShowAddCustomProduct(false)
        setShowAddDamagedLaptop(false)
        setShowAddLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
    };

    const handleAddMonitorClick = () => {
        setShowAddMonitor(true);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddDamagedLaptop(false)
        setShowAddLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
    };
    const handleAddCustomProductClick = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(true)
        setShowAddDamagedLaptop(false)
        setShowAddLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
    }
    const handleAddDamagedLaptopClick = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddLaptop(false)
        setShowAddDamagedLaptop(true)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
    }
    const handleAddLaptopClick = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddLaptop(true)
        setShowAddDamagedLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
    }
    const handleAddIOSClick = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddLaptop(false)
        setShowAddDamagedLaptop(false)
        setShowAddIOS(true)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
    }
    const handleAddAndroidClick = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddLaptop(false)
        setShowAddDamagedLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(true)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
    }
    const handleAddGamingPCClick = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddLaptop(false)
        setShowAddDamagedLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(true)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
    }
    const handleAddCpu = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddLaptop(false)
        setShowAddDamagedLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(true)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
    }
    const handleAddPC = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddLaptop(false)
        setShowAddDamagedLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(true)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
    }

    const handleAddLaptopNew = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddLaptop(false)
        setShowAddDamagedLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(true)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
    }
    const handleApiloOrder = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddLaptop(false)
        setShowAddDamagedLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(true)
        setShowShoperDeliveryTime(false)
    }

    const handleShoperDeliveryTime = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddLaptop(false)
        setShowAddDamagedLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(true)
    }

    const handleRelatedProducts = () => {
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false)
        setShowAddLaptop(false)
        setShowAddDamagedLaptop(false)
        setShowAddIOS(false)
        setShowAddAndroid(false)
        setAddShowGamingPC(false)
        setShowAddCpu(false)
        setShowAddPC(false)
        setShowAddLaptopNew(false)
        setShowApiloOrder(false)
        setShowShoperDeliveryTime(false)
        setShowRelatedProducts(true)
    }

    const showOnlyRelatedProducts = showRelatedProducts &&
        !showAddGamingPC &&
        !showAddMonitor &&
        !showAddCustomProduct &&
        !showAddDamagedLaptop &&
        !showAddLaptop &&
        !showAddLaptopNew &&
        !showAddIOS &&
        !showAddAndroid &&
        !showAddCpu &&
        !showAddPC &&
        !showApiloOredr &&
        !showShoperDeliveryTime;

    return (
        <div>

            {/* <div>
                <h2>Pobierz parametry kategorii Allegro</h2>
                <input
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    placeholder="ID kategorii"
                />
                <button onClick={fetchParameters}>Pobierz</button>

                {params && (
                    <pre>{JSON.stringify(params, null, 2)}</pre>
                )}
                {error && <p style={{ color: 'red' }}>{error}</p>}

                <div>
                    <input
                        type="text"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        placeholder="frazę"
                    />
                    <button onClick={handleSearch}>Szukaj</button>

                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
            </div> */}


            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    justifyContent: "center",
                    padding: "12px",
                    borderRadius: "8px",
                }}
            >
                <ApiloTokenStatus authToken={props.authToken} />

                {accessTokenAllegro ? (
                    <button style={buttonStyle("#3c743c")} disabled>
                        Dostęp przyznany
                    </button>
                ) : verificationUrlProd ? (
                    <a
                        href={verificationUrlProd}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none" }}
                    >
                        <button style={buttonStyle("rgb(154 52 39)")}>
                            Dokończ logowanie
                        </button>
                    </a>
                ) : (
                    <button style={buttonStyle("rgb(154 52 39)")} onClick={startAuthProd}>
                        Zaloguj przez Allegro
                    </button>
                )}

                {error && <p style={{ color: "red", width: "100%" }}>{error}</p>}

                <button style={buttonStyle()} onClick={handleAddPC}>Komputery biurowe</button>
                {/* <button style={buttonStyle()} onClick={handleAddProductClick}>Komputery</button> */}
                <button style={buttonStyle()} onClick={handleAddGamingPCClick}>Komputery gamingowe</button>
                <button style={buttonStyle()} onClick={handleAddMonitorClick}>Monitory</button>
                <button style={buttonStyle()} onClick={handleAddCustomProductClick}>Inne</button>
                <button style={buttonStyle()} onClick={handleAddDamagedLaptopClick}>Uszkodzone laptopy</button>
                <button style={buttonStyle()} onClick={handleAddLaptopClick}>Laptopy</button>
                <button style={buttonStyle()} onClick={handleAddLaptopNew}>Laptopy nowe</button>
                <button style={buttonStyle()} onClick={handleAddIOSClick}>Mobilki IOS</button>
                <button style={buttonStyle()} onClick={handleAddAndroidClick}>Mobilki Android</button>
                <button style={buttonStyle()} onClick={handleAddCpu}>CPU</button>
                <button style={buttonStyle()} onClick={handleApiloOrder}>zamówienia</button>
                <button style={buttonStyle()} onClick={handleShoperDeliveryTime}>czas wysyłki</button>
                <button style={buttonStyle()} onClick={handleRelatedProducts}>produkty powiązane</button>
            </div>


            {showAddGamingPC && <AddGamingPC authToken={props.authToken} accessTokenAllegro={accessTokenAllegro} />}
            {showAddMonitor && <AddMonitor authToken={props.authToken} accessTokenAllegro={accessTokenAllegro} />}
            {showAddCustomProduct && <AddCustomProduct authToken={props.authToken} />}
            {showAddDamagedLaptop && <AddDamagedLaptop authToken={props.authToken} />}
            {showAddLaptop && <AddLaptop authToken={props.authToken} />}
            {showAddLaptopNew && <AddLaptopNew authToken={props.authToken} accessTokenAllegro={accessTokenAllegro} />}
            {showAddIOS && <AddPhoneIOS authToken={props.authToken} />}
            {showAddAndroid && <AddPhoneAndroid authToken={props.authToken} />}
            {showAddCpu && <AddCpu authToken={props.authToken} />}
            {showAddPC && <AddPC authToken={props.authToken} accessTokenAllegro={accessTokenAllegro} />}
            {showApiloOredr && <ApiloOrdersPanel authToken={props.authToken} />}
            {showShoperDeliveryTime && <ShoperDeliveryTimePanel authToken={props.authToken} />}
            {showOnlyRelatedProducts && <RelatedProductsPanel authToken={props.authToken} />}
        </div>
    );
}

export default CategorySelection;
