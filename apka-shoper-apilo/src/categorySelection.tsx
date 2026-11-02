import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Divider, ListItemText, Menu, MenuItem } from '@mui/material';
import { pcParameters } from './allegroParameters/pcParameters';
import AddGamingPC from './addProduct/addGamingPC';
import AddCpu from './addProduct/addCpu';
import AddPC from './addProduct/addPc';
import AddLaptopNew from './addProduct/addLaptopNew';
import { getOrdersStatus5 } from './backendQueries/getOrders';
import ApiloOrdersPanel from './apiloOrder';
import ShoperDeliveryTimePanel from './shoperDeliveryTimePanel';
import RelatedProductsPanel from './relatedProductsPanel';
import ChatGptFeedPanel from './chatGptFeedPanel';
import ApiloTokenStatus from './apiloTokenStatus';
import TemplateSettingsPanel from './templateSettingsPanel';
import { applyTemplateSettings, TemplateKey, TemplateSettingsFile, TEMPLATE_NAMES } from './templateSettings';

type AddProductProps = {
    authToken: string
}
type FormData = {
    [paramId: string]: string;
};

type AllegroAccount = {
    id: string;
    label: string;
    userName?: string;
    accessToken: string;
    status: 'connected' | 'login_required' | 'retry';
    updatedAt?: string;
};

type AllegroAccountsResponse = {
    activeAccountId?: string;
    accounts?: Array<{
        id: string;
        label: string;
        userName?: string;
        access_token: string;
        status?: 'connected' | 'login_required' | 'retry';
        updatedAt?: string;
    }>;
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
    const [showChatGptFeed, setShowChatGptFeed] = useState(false);
    const [showTemplateAdmin, setShowTemplateAdmin] = useState(false);
    const [adminTemplateKey, setAdminTemplateKey] = useState<TemplateKey>('pc');
    const [templateSettings, setTemplateSettings] = useState<TemplateSettingsFile | null>(null);
    const [templateSettingsError, setTemplateSettingsError] = useState(false);

    const [verificationUrl, setVerificationUrl] = useState('');
    const [verificationUrlProd, setVerificationUrlProd] = useState('');
    const [deviceCode, setDeviceCode] = useState('');
    const [deviceCodeProd, setDeviceCodeProd] = useState('');
    const [accessTokenAllegro, setAccessTokenAllegro] = useState('');
    const [allegroAccounts, setAllegroAccounts] = useState<AllegroAccount[]>([]);
    const [activeAllegroAccountId, setActiveAllegroAccountId] = useState('');
    const [defaultAllegroAccountId, setDefaultAllegroAccountId] = useState('');
    const activeAllegroAccountIdRef = useRef('');
    const [pendingAllegroAccountLabel, setPendingAllegroAccountLabel] = useState('');
    const [allegroMenuAnchorEl, setAllegroMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [loadingAllegroToken, setLoadingAllegroToken] = useState(true);
    const [error, setError] = useState('');
    const [polling, setPolling] = useState(false);
    const [showCategoryParametersHelper, setShowCategoryParametersHelper] = useState(false);
    const [categoryParametersId, setCategoryParametersId] = useState('486');
    const [categoryParametersResult, setCategoryParametersResult] = useState<unknown>(null);
    const [categoryParametersError, setCategoryParametersError] = useState('');
    const [loadingCategoryParameters, setLoadingCategoryParameters] = useState(false);

    const [searchName, setSearchName] = useState('');
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [showSearchresult, setShowSearchresult] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Product>();
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);


    const [result, setResult] = useState(null);
    const [formData, setFormData] = useState<FormData>({});

    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);

    const activeAllegroAccount = allegroAccounts.find((account) => account.id === activeAllegroAccountId);
    const orderedAllegroAccounts = [...allegroAccounts].sort(
        (left, right) => Number(right.id === defaultAllegroAccountId) - Number(left.id === defaultAllegroAccountId)
    );
    const allegroSessionKey = activeAllegroAccountId || (accessTokenAllegro ? `token-${accessTokenAllegro.slice(0, 12)}` : 'no-allegro-token');
    const isAllegroMenuOpen = Boolean(allegroMenuAnchorEl);
    const activeTemplateKey: TemplateKey | null = showAddPC ? 'pc'
        : showAddGamingPC ? 'gaming' : showAddMonitor ? 'monitor'
        : showAddCustomProduct ? 'custom' : showAddDamagedLaptop ? 'damaged-laptop'
        : showAddLaptop ? 'laptop' : showAddLaptopNew ? 'laptop-new'
        : showAddIOS ? 'ios' : showAddAndroid ? 'android' : showAddCpu ? 'cpu' : null;

    const loadTemplateSettings = useCallback(async () => {
        setTemplateSettingsError(false);
        try {
            const response = await axios.get<TemplateSettingsFile>(`${API_URL}/template-settings`, {
                headers: { Authorization: `Bearer ${props.authToken}` },
            });
            setTemplateSettings(response.data);
        } catch (error) {
            console.error('Nie udało się pobrać ustawień szablonów:', error);
            setTemplateSettingsError(true);
        }
    }, [props.authToken]);

    useEffect(() => { void loadTemplateSettings(); }, [loadTemplateSettings]);

    useEffect(() => {
        if (!activeTemplateKey || !templateSettings || showTemplateAdmin) return;
        const settings = templateSettings.templates[activeTemplateKey];
        const bySku = new Map<string, Record<string, any>>();
        const byProductId = new Map<string, Record<string, any>>();
        const interceptor = axios.interceptors.request.use((config) => {
            const url = config.url ?? '';
            const data = config.data;
            if (!data || typeof data !== 'object') return config;
            const shoperCreate = /\/product\/shoper(?:\?|$)/.test(url);
            const shoperUpdate = url.match(/\/product\/(\d+)(?:\?|$)/);
            const apilo = /\/product\/apilo(?:\?|$)/.test(url);
            if (!shoperCreate && !shoperUpdate && !apilo && !/\/product\/allegroProduct(?:\/account)?(?:\?|$)/.test(url)) return config;

            const payload = data as Record<string, any>;
            const sku = String(apilo && Array.isArray(data) ? data[0]?.sku ?? '' : payload.code ?? '');
            const previous = shoperUpdate ? byProductId.get(shoperUpdate[1]) : bySku.get(sku);
            if (shoperUpdate && payload.attributes) byProductId.set(shoperUpdate[1], payload);
            if (shoperCreate && sku) bySku.set(sku, payload);
            config.data = applyTemplateSettings(data, url, settings, previous, activeTemplateKey);
            return config;
        });
        const responseInterceptor = axios.interceptors.response.use((response) => {
            if (/\/product\/shoper(?:\?|$)/.test(response.config.url ?? '')) {
                const productId = response.data?.product_id ?? response.data?.id ?? response.data;
                if (productId != null && /^\d+$/.test(String(productId))) {
                    try {
                        const submitted = typeof response.config.data === 'string'
                            ? JSON.parse(response.config.data) : response.config.data;
                        if (submitted && typeof submitted === 'object') byProductId.set(String(productId), submitted);
                    } catch (error) {
                        console.error('Nie udało się powiązać opisu z nowym produktem:', error);
                    }
                }
            }
            return response;
        });
        return () => {
            axios.interceptors.request.eject(interceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [activeTemplateKey, templateSettings, showTemplateAdmin]);

    const restoreAllegroAccounts = useCallback(async (preferredAccountId = activeAllegroAccountIdRef.current) => {
        const response = await axios.get<AllegroAccountsResponse>(`${API_URL}/auth/allegro-accounts-prod`, {
            headers: { Authorization: `Bearer ${props.authToken}` },
        });
        const accounts = (response.data.accounts ?? [])
            .filter((account) => account.id)
            .map((account) => ({
                id: account.id,
                label: account.label || 'Konto Allegro',
                userName: account.userName,
                accessToken: account.access_token || '',
                status: account.status ?? (account.access_token ? 'connected' : 'retry'),
                updatedAt: account.updatedAt,
            }));
        const connectedAccounts = accounts.filter((account) => account.status === 'connected' && account.accessToken);
        const activeAccount = accounts.find((account) => account.id === preferredAccountId)
            ?? connectedAccounts.find((account) => account.id === response.data.activeAccountId)
            ?? connectedAccounts[0]
            ?? accounts.find((account) => account.id === response.data.activeAccountId)
            ?? accounts[0];

        activeAllegroAccountIdRef.current = activeAccount?.id ?? '';
        setAllegroAccounts(accounts);
        setDefaultAllegroAccountId(response.data.activeAccountId ?? '');
        setActiveAllegroAccountId(activeAccount?.id ?? '');
        setAccessTokenAllegro(activeAccount?.accessToken ?? '');
        setError('');
    }, [props.authToken]);

    useEffect(() => {
        let cancelled = false;
        let firstRequest = true;

        const loadAccounts = async () => {
            try {
                if (!cancelled) await restoreAllegroAccounts();
            } catch (error) {
                if (!cancelled) {
                    console.error("Nie udało się pobrać kont Allegro:", error);
                    setError(axios.isAxiosError(error) && error.response?.status === 401
                        ? 'Sesja programu wygasła. Zaloguj się ponownie do programu.'
                        : 'Nie udało się sprawdzić kont Allegro. Spróbuj ponownie.');
                }
            } finally {
                if (!cancelled && firstRequest) {
                    firstRequest = false;
                    setLoadingAllegroToken(false);
                }
            }
        };

        void loadAccounts();
        const interval = window.setInterval(loadAccounts, 10 * 60 * 1000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [props.authToken, restoreAllegroAccounts]);

    const handleOpenAllegroMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAllegroMenuAnchorEl(event.currentTarget);
    };

    const handleCloseAllegroMenu = () => {
        setAllegroMenuAnchorEl(null);
    };

    const handleAllegroAccountChange = (accountId: string) => {
        const account = allegroAccounts.find((account) => account.id === accountId);

        if (!account) return;

        activeAllegroAccountIdRef.current = account.id;
        setActiveAllegroAccountId(account.id);
        setAccessTokenAllegro(account.accessToken);
        setError('');
        handleCloseAllegroMenu();
    };

    const handleRenameActiveAllegroAccountFromMenu = () => {
        handleCloseAllegroMenu();
        void handleRenameActiveAllegroAccount();
    };

    const handleSetDefaultAllegroAccount = async () => {
        if (!activeAllegroAccount || activeAllegroAccount.id === defaultAllegroAccountId) return;
        const accountId = activeAllegroAccount.id;
        handleCloseAllegroMenu();
        try {
            await axios.patch(
                `${API_URL}/auth/allegro-accounts-prod/${accountId}/default`,
                {},
                { headers: { Authorization: `Bearer ${props.authToken}` } },
            );
            await restoreAllegroAccounts(accountId);
            toast.success('Ustawiono domyślne konto Allegro.');
        } catch (error) {
            console.error('Nie udało się ustawić domyślnego konta Allegro:', error);
            toast.error('Nie udało się ustawić domyślnego konta Allegro.');
        }
    };

    const handleRemoveActiveAllegroAccountFromMenu = () => {
        handleCloseAllegroMenu();
        void handleRemoveActiveAllegroAccount();
    };

    const handleStartAuthProdFromMenu = () => {
        handleCloseAllegroMenu();
        void startAuthProd();
    };

    const handleReconnectActiveAllegroAccount = () => {
        handleCloseAllegroMenu();
        void startAuthProd(true);
    };

    const handleOpenPendingAllegroAuth = () => {
        handleCloseAllegroMenu();
        window.open(verificationUrlProd, '_blank', 'noopener,noreferrer');
    };

    const handleRenameActiveAllegroAccount = async () => {
        if (!activeAllegroAccount) return;

        const nextLabel = window.prompt('Nazwa konta Allegro', activeAllegroAccount.label);

        if (!nextLabel?.trim()) return;

        try {
            await axios.patch(
                `${API_URL}/auth/allegro-accounts-prod/${activeAllegroAccount.id}`,
                { label: nextLabel.trim() },
                { headers: { Authorization: `Bearer ${props.authToken}` } },
            );
            await restoreAllegroAccounts(activeAllegroAccount.id);
        } catch (error) {
            console.error("Nie udało się zmienić nazwy konta Allegro:", error);
            toast.error("Nie udało się zmienić nazwy konta Allegro.");
        }
    };

    const handleRemoveActiveAllegroAccount = async () => {
        if (!activeAllegroAccount) return;

        try {
            await axios.delete(`${API_URL}/auth/allegro-accounts-prod/${activeAllegroAccount.id}`, {
                headers: { Authorization: `Bearer ${props.authToken}` },
            });
            await restoreAllegroAccounts();
        } catch (error) {
            console.error("Nie udało się usunąć konta Allegro:", error);
            toast.error("Nie udało się usunąć konta Allegro.");
        }
    };

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

    const fetchCategoryParameters = async () => {
        const trimmedCategoryId = categoryParametersId.trim();
        if (!trimmedCategoryId) {
            setCategoryParametersError('Wpisz ID kategorii Allegro.');
            return;
        }
        if (!accessTokenAllegro) {
            setCategoryParametersError('Najpierw zaloguj konto Allegro.');
            return;
        }

        setLoadingCategoryParameters(true);
        setCategoryParametersError('');
        try {
            const response = await axios.get(`${API_URL}/product/category-parameters`, {
                headers: {
                    Authorization: `Bearer ${accessTokenAllegro}`,
                },
                params: {
                    categoryId: trimmedCategoryId,
                },
            });
            setCategoryParametersResult(response.data.parameters);
        } catch (err) {
            console.error('Błąd podczas pobierania parametrów:', err);
            setCategoryParametersError('Nie udało się pobrać parametrów kategorii.');
        } finally {
            setLoadingCategoryParameters(false);
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

    const startAuthProd = async (reconnect = false) => {
        try {
            setError('');
            setVerificationUrlProd('');
            setDeviceCodeProd('');
            const defaultLabel = reconnect && activeAllegroAccount
                ? activeAllegroAccount.label
                : `Konto Allegro ${allegroAccounts.length + 1}`;
            const label = reconnect
                ? defaultLabel
                : window.prompt('Podaj nazwę konta Allegro', defaultLabel) || defaultLabel;
            setPendingAllegroAccountLabel(label);
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
                    params: {
                        device_code: deviceCodeProd,
                        label: pendingAllegroAccountLabel,
                    },
                });
                if (res.data.access_token) {
                    const accountId = String(res.data.account_id ?? '');
                    await restoreAllegroAccounts(accountId);
                    setVerificationUrlProd('');
                    setDeviceCodeProd('');
                    setPendingAllegroAccountLabel('');
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
    }, [polling, deviceCodeProd, pendingAllegroAccountLabel, restoreAllegroAccounts]);



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
        setShowTemplateAdmin(false);
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
        setShowTemplateAdmin(false);
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
        setShowTemplateAdmin(false);
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

    const handleChatGptFeed = () => {
        setShowTemplateAdmin(false);
        setShowRelatedProducts(false);
        setShowAddMonitor(false);
        setShowAddProduct(false);
        setShowAddCustomProduct(false);
        setShowAddLaptop(false);
        setShowAddDamagedLaptop(false);
        setShowAddIOS(false);
        setShowAddAndroid(false);
        setAddShowGamingPC(false);
        setShowAddCpu(false);
        setShowAddPC(false);
        setShowAddLaptopNew(false);
        setShowApiloOrder(false);
        setShowShoperDeliveryTime(false);
        setShowChatGptFeed(true);
    };

    const handleToggleCategoryParametersHelper = () => {
        setShowCategoryParametersHelper((currentValue) => !currentValue);
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

    const openTemplate = (key: TemplateKey, action: () => void) => {
        setShowChatGptFeed(false);
        setAdminTemplateKey(key);
        setShowTemplateAdmin(false);
        action();
    };

    return (
        <div>
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

                {loadingAllegroToken ? (
                    <button style={buttonStyle()} disabled>
                        Sprawdzanie Allegro...
                    </button>
                ) : allegroAccounts.length > 0 ? (
                    <button
                        id="allegro-account-button"
                        aria-controls={isAllegroMenuOpen ? 'allegro-account-menu' : undefined}
                        aria-expanded={isAllegroMenuOpen ? 'true' : undefined}
                        aria-haspopup="menu"
                        style={buttonStyle(accessTokenAllegro ? "#3c743c" : "rgb(154 52 39)")}
                        onClick={handleOpenAllegroMenu}
                    >
                        {accessTokenAllegro ? 'Aktywne' : 'Wymaga sprawdzenia'}: {activeAllegroAccount?.label ?? 'Konto Allegro'}
                        <span
                            aria-hidden="true"
                            style={{
                                borderLeft: "4px solid transparent",
                                borderRight: "4px solid transparent",
                                borderTop: "5px solid currentColor",
                                display: "inline-block",
                                marginLeft: "6px",
                                transform: isAllegroMenuOpen ? "rotate(180deg)" : "none",
                                transition: "transform 0.15s ease",
                                verticalAlign: "middle",
                            }}
                        />
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
                    <button style={buttonStyle("rgb(154 52 39)")} onClick={() => { void startAuthProd(); }}>
                        Zaloguj przez Allegro
                    </button>
                )}

                <Menu
                    id="allegro-account-menu"
                    anchorEl={allegroMenuAnchorEl}
                    open={isAllegroMenuOpen}
                    onClose={handleCloseAllegroMenu}
                    MenuListProps={{ 'aria-labelledby': 'allegro-account-button' }}
                >
                    <MenuItem disabled>
                        <ListItemText
                            primary="Konto Allegro"
                            secondary={activeAllegroAccount
                                ? `${activeAllegroAccount.label}${activeAllegroAccount.userName ? ` (${activeAllegroAccount.userName})` : ''}`
                                : 'Brak aktywnego konta'}
                        />
                    </MenuItem>
                    <Divider />
                    {orderedAllegroAccounts.map((account) => (
                        <MenuItem
                            key={account.id}
                            selected={account.id === activeAllegroAccountId}
                            onClick={() => handleAllegroAccountChange(account.id)}
                        >
                            <ListItemText
                                primary={account.label}
                                secondary={[
                                    account.id === defaultAllegroAccountId ? 'Domyślne' : '',
                                    account.status === 'connected' ? (account.userName ? `ID Allegro: ${account.userName}` : '')
                                        : account.status === 'login_required' ? 'Wymaga ponownego logowania' : 'Nie udało się odświeżyć. Spróbuj ponownie.',
                                ].filter(Boolean).join(' · ')}
                            />
                        </MenuItem>
                    ))}
                    <Divider />
                    <MenuItem
                        onClick={() => { void handleSetDefaultAllegroAccount(); }}
                        disabled={!activeAllegroAccount || activeAllegroAccount.id === defaultAllegroAccountId}
                    >
                        Ustaw jako domyślne
                    </MenuItem>
                    <MenuItem
                        onClick={handleRenameActiveAllegroAccountFromMenu}
                        disabled={!activeAllegroAccount}
                    >
                        Zmień nazwę
                    </MenuItem>
                    <MenuItem
                        onClick={handleRemoveActiveAllegroAccountFromMenu}
                        disabled={!activeAllegroAccount}
                        sx={{ color: 'error.main' }}
                    >
                        Usuń z listy
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => { handleCloseAllegroMenu(); void restoreAllegroAccounts(); }}>
                        Sprawdź konta ponownie
                    </MenuItem>
                    {activeAllegroAccount && activeAllegroAccount.status !== 'connected' ? (
                        <MenuItem onClick={handleReconnectActiveAllegroAccount}>
                            Zaloguj ponownie to konto
                        </MenuItem>
                    ) : null}
                    {verificationUrlProd ? (
                        <MenuItem onClick={handleOpenPendingAllegroAuth}>
                            Dokończ logowanie kolejnego konta
                        </MenuItem>
                    ) : (
                        <MenuItem onClick={handleStartAuthProdFromMenu}>
                            Dodaj kolejne konto Allegro
                        </MenuItem>
                    )}
                </Menu>

                {error && <p style={{ color: "red", width: "100%" }}>{error}</p>}

                <button style={buttonStyle()} onClick={() => openTemplate('pc', handleAddPC)}>Komputery biurowe</button>
                {/* <button style={buttonStyle()} onClick={handleAddProductClick}>Komputery</button> */}
                <button style={buttonStyle()} onClick={() => openTemplate('gaming', handleAddGamingPCClick)}>Komputery gamingowe</button>
                <button style={buttonStyle()} onClick={() => openTemplate('monitor', handleAddMonitorClick)}>Monitory</button>
                <button style={buttonStyle()} onClick={() => openTemplate('custom', handleAddCustomProductClick)}>Inne</button>
                <button style={buttonStyle()} onClick={() => openTemplate('damaged-laptop', handleAddDamagedLaptopClick)}>Uszkodzone laptopy</button>
                <button style={buttonStyle()} onClick={() => openTemplate('laptop-new', handleAddLaptopNew)}>Laptopy nowe</button>
                <button style={buttonStyle()} onClick={() => openTemplate('ios', handleAddIOSClick)}>Mobilki IOS</button>
                <button style={buttonStyle()} onClick={() => openTemplate('android', handleAddAndroidClick)}>Mobilki Android</button>
                <button style={buttonStyle()} onClick={() => { setShowChatGptFeed(false); handleApiloOrder(); }}>zamówienia</button>
                <button style={buttonStyle()} onClick={() => { setShowChatGptFeed(false); handleShoperDeliveryTime(); }}>czas wysyłki</button>
                <button style={buttonStyle()} onClick={() => { setShowChatGptFeed(false); handleRelatedProducts(); }}>produkty powiązane</button>
                <button style={buttonStyle(showChatGptFeed ? '#3c743c' : 'rgb(54 52 52)')} onClick={handleChatGptFeed}>Feed ChatGPT</button>
                <button style={buttonStyle(showTemplateAdmin ? '#3c743c' : 'rgb(54 52 52)')}
                    onClick={() => { setShowChatGptFeed(false); setAdminTemplateKey(activeTemplateKey ?? adminTemplateKey); setShowTemplateAdmin(true); }}>
                    Ustawienia szablonów
                </button>
                <button
                    style={buttonStyle(showCategoryParametersHelper ? "#3c743c" : "rgb(54 52 52)")}
                    onClick={handleToggleCategoryParametersHelper}
                >
                    Parametry kategorii Allegro
                </button>
            </div>

            {showCategoryParametersHelper && (
                <div
                    style={{
                        border: "1px solid #333",
                        borderRadius: "8px",
                        margin: "0 auto 12px",
                        maxWidth: "1100px",
                        padding: "12px",
                    }}
                >
                    <div
                        style={{
                            alignItems: "center",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                        }}
                    >
                        <strong>Parametry kategorii Allegro</strong>
                        <input
                            value={categoryParametersId}
                            onChange={(event) => setCategoryParametersId(event.target.value)}
                            placeholder="ID kategorii"
                            style={{
                                border: "1px solid #555",
                                borderRadius: "6px",
                                padding: "8px",
                                width: "160px",
                            }}
                        />
                        <button
                            style={buttonStyle("#3c743c")}
                            onClick={fetchCategoryParameters}
                            disabled={loadingCategoryParameters}
                        >
                            {loadingCategoryParameters ? "Pobieranie..." : "Pobierz"}
                        </button>
                    </div>
                    {categoryParametersError && (
                        <p style={{ color: "red", marginBottom: 0 }}>{categoryParametersError}</p>
                    )}
                    {categoryParametersResult !== null && (
                        <pre
                            style={{
                                background: "#111",
                                borderRadius: "6px",
                                color: "#f7f7f7",
                                marginTop: "12px",
                                maxHeight: "520px",
                                overflow: "auto",
                                padding: "12px",
                                textAlign: "left",
                            }}
                        >
                            {JSON.stringify(categoryParametersResult, null, 2)}
                        </pre>
                    )}
                </div>
            )}


            {showTemplateAdmin && templateSettings && <TemplateSettingsPanel authToken={props.authToken}
                initialKey={adminTemplateKey} settings={templateSettings} onSaved={setTemplateSettings}
                onClose={() => setShowTemplateAdmin(false)} />}
            {(showTemplateAdmin || activeTemplateKey) && !templateSettings && <div style={{ padding: 20, textAlign: 'center' }}>
                {templateSettingsError ? <><span>Nie udało się pobrać ustawień szablonów.</span>
                    <button onClick={() => void loadTemplateSettings()}>Ponów</button></> : 'Ładowanie ustawień szablonów…'}
            </div>}
            {!showTemplateAdmin && templateSettings && <>
            {activeTemplateKey && (() => {
                const override = templateSettings.templates[activeTemplateKey].shoper.categoryId;
                return override !== null ? <div style={{ margin: '0 auto 10px', maxWidth: 1100, color: '#d6dfd6', textAlign: 'left' }}>
                    {TEMPLATE_NAMES[activeTemplateKey]}: kategoria Shoper ustawiona w panelu na {override}.
                </div> : null;
            })()}
            {showAddGamingPC && <AddGamingPC key={`gaming-${allegroSessionKey}`} authToken={props.authToken} accessTokenAllegro={accessTokenAllegro} allegroAccountId={activeAllegroAccountId} />}
            {showAddMonitor && <AddMonitor key={`monitor-${allegroSessionKey}`} authToken={props.authToken} accessTokenAllegro={accessTokenAllegro} allegroAccountId={activeAllegroAccountId} />}
            {showAddCustomProduct && <AddCustomProduct authToken={props.authToken} />}
            {showAddDamagedLaptop && <AddDamagedLaptop authToken={props.authToken} />}
            {showAddLaptop && <AddLaptop authToken={props.authToken} />}
            {showAddLaptopNew && <AddLaptopNew key={`laptop-new-${allegroSessionKey}`} authToken={props.authToken} accessTokenAllegro={accessTokenAllegro} allegroAccountId={activeAllegroAccountId} />}
            {showAddIOS && <AddPhoneIOS authToken={props.authToken} />}
            {showAddAndroid && <AddPhoneAndroid authToken={props.authToken} />}
            {showAddCpu && <AddCpu authToken={props.authToken} />}
            {showAddPC && <AddPC key={`pc-${allegroSessionKey}`} authToken={props.authToken} accessTokenAllegro={accessTokenAllegro} allegroAccountId={activeAllegroAccountId} />}
            </>}
            {!showTemplateAdmin && showApiloOredr && <ApiloOrdersPanel authToken={props.authToken} />}
            {!showTemplateAdmin && showShoperDeliveryTime && <ShoperDeliveryTimePanel authToken={props.authToken} />}
            {!showTemplateAdmin && showOnlyRelatedProducts && <RelatedProductsPanel authToken={props.authToken} />}
            {showChatGptFeed && <ChatGptFeedPanel authToken={props.authToken} />}
        </div>
    );
}

export default CategorySelection;
