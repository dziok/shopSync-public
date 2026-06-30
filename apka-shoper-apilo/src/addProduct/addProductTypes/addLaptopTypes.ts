import { LaptopStatusKey } from "../additionalDescriptions/attributesTranslations"

export type AddProductProps = {
    authToken: string
    accessTokenAllegro: string
}

export interface IFormInput {
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
    connectProductAllegro: boolean,
    allegroTitle?: string,
    allegroPrice?: number,
    productSafetyProducerId?: number,
    productSafetyCertificateIds?: number[],
    productSafetyWarnings?: string[],
    [key: string]: any; // Dynamiczne pola formularza dla atrybutów
}

export interface CategoryResource {
    category_id: number;
    name?: string;
    translation?: {
        name?: string;
    };
    translations?: unknown;
}

export interface ProducersResource {
    producer_id: number;
    name: string;
    translations: {
        pl_PL: {
        };
    };
}
