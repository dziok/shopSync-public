import axios from "axios";
import { buildOfferParameters } from "../addProduct/allegroComponents/buildOfferParameters";
import { cpuTypesDescriptions, diskTypesDescriptions, ramTypesDescriptions } from "../addProduct/additionalDescriptions/pcAdditionalDescription";
import { ApiloDescription } from "../addProduct/templates/pcTemplateNew";

interface HandleAddAllegroOfferProps {
    accessTokenAllegro: string;
    selectedProductId: string;
    formData: any;
    pcNewParameteres: any;
    imageLinks: string[];
    name: string;
    condition: string;
    visualCondition: string;
    pcVC: Record<string, string>;
    caseType: string;
    additionalInfo: string;
    apiloSpec: string;
    cpu: string;
    cpuModel: string;
    ramAmount: string;
    ramType: string;
    diskType: string;
    diskCapacity: string;
    gpu: string;
    gpuDescriptions: string,
    setResult: (result: any) => void;
    API_URL: string;
}

export const handleAddAllegroOffer = async ({
    accessTokenAllegro,
    selectedProductId,
    formData,
    pcNewParameteres,
    imageLinks,
    name,
    condition,
    visualCondition,
    pcVC,
    caseType,
    additionalInfo,
    apiloSpec,
    cpu,
    cpuModel,
    ramAmount,
    ramType,
    diskType,
    diskCapacity,
    gpu,
    gpuDescriptions,
    setResult,
    API_URL,
}: HandleAddAllegroOfferProps) => {
    const token = accessTokenAllegro;

    const productData = {
        productSet: [
            {
                product: {
                    id: selectedProductId,
                    idType: "GTIN",
                    parameters: buildOfferParameters(formData, true, pcNewParameteres),
                },
            },
        ],
        sellingMode: {
            price: {
                amount: "220.85",
                currency: "PLN",
            },
        },
        stock: {
            available: 10,
        },
        publication: {
            status: "INACTIVE",
        },
        images: imageLinks,
        delivery: {
            shippingRates: {
                name: "KOMPY 2018, DESKTOP DO PACZKOMATU",
            },
        },
        afterSalesServices: {
            impliedWarranty: {
                name: "Standardowe",
            },
            returnPolicy: {
                name: "15 dni Czechówka",
            },
        },
        description: {
            sections: [
                {
                    items: [
                        {
                            type: "TEXT",
                            content: `<h1>${name}</h1><p>✔️Stan: <b>${condition}</b></p><p>✔️Typ komputera: <b>Stacjonarny, ${caseType}</b></p><p>✔️wizualny stan: <b>${visualCondition}, ${pcVC[visualCondition]}</b></p>`,
                        },
                    ],
                },
                {
                    items: [
                        {
                            type: "IMAGE",
                            url: "https://a.allegroimg.com/original/118094/73c8c8404eed8b57bf49b24d19da/Dell-Wyse-5070-Thin-Client-J4105-4-16GB-kl-A-WiFi-Zasilacz-BRAK-SYSTEMU-Wysokosc-produktu-18-4-cm",
                        },
                    ],
                },
                {
                    items: [
                        {
                            type: "TEXT",
                            content: `
                <h2>Dlaczego warto wybrać komputer poleasingowy:</h2>
                <ul>
                  <li><p><b>Cena</b> ➡️ Stacjonarne komputery poleasingowe są tańsze niż nowe modele...</p></li>
                  <li><p><b>Jakość</b> ➡️ Firmy leasingowe często wybierają sprzęt wysokiej klasy...</p></li>
                  <li><p><b>Sprawdzone działanie</b> ➡️ Komputery poleasingowe są przez nas dokładnie testowane...</p></li>
                  <li><p><b>Ekologia</b> ➡️ Kupując sprzęt poleasingowy, przyczyniasz się do zmniejszenia...</p></li>
                  <li><p><b>Wyposażenie</b> ➡️ Często poleasingowe komputery są dobrze wyposażone...</p></li>
                  <li><p><b>Marki Premium</b> ➡️ Możliwość zakupu sprzętu od renomowanych marek...</p></li>
                  <li><p><b>Gotowość do pracy</b> ➡️ Komputery poleasingowe są przez nas skonfigurowane...</p></li>
                </ul>`,
                        },
                    ],
                },
                {
                    items: [
                        { type: "IMAGE", url: imageLinks[0] },
                        {
                            type: "TEXT",
                            content: `<h1>Cechy:</h1><ul><li><b>❗${additionalInfo}</b></li></ul> ${apiloSpec}<p><b>✔️ Stacjonarny komputer poleasingowy...</b></p>`,
                        },
                    ],
                },
                {
                    items: [
                        {
                            type: "TEXT",
                            content: `<p>Komputer został ✔️<b>dokładnie</b> przetestowany...</p>
                        <p>Posiada zainstalowany ✔️<b>oryginalny</b> system operacyjny...</p>
                        <p>Komputer po rozpakowaniu z pudełka jest ✔️<b>gotowy do pracy.</b></p>`,
                        },
                    ],
                },
                {
                    items: [
                        {
                            type: "IMAGE",
                            url: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/podzespoly.png",
                        },
                    ],
                },
                {
                    items: [
                        {
                            type: "TEXT",
                            content: ApiloDescription(
                                cpu,
                                cpuModel,
                                ramAmount,
                                ramType,
                                diskType,
                                diskCapacity,
                                cpuTypesDescriptions[cpu as keyof typeof cpuTypesDescriptions],
                                ramTypesDescriptions[ramType as keyof typeof ramTypesDescriptions],
                                diskTypesDescriptions[diskType as keyof typeof diskTypesDescriptions],
                                gpu,
                                gpuDescriptions
                            ),
                        },
                    ],
                },
            ],
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
