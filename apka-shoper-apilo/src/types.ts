export type FormData = { [paramId: string]: string | string[] };
export type FormDataAllegro = { [paramId: string]: string | string[] };
export interface SearchResult {
    products: Product[];
    categories: {
        subcategories: Category[];
        path: CategoryPath[];
    };
    filters: Filter[];
    nextPage?: {
        id: string;
    };
}

export interface ProducersResource {
    producer_id: number;
    name: string;
    translations: {
        pl_PL: {
        };
    };
}

export interface ProductSafetyProducerResource {
    product_safety_producer_id?: number;
    producer_id?: number;
    id?: number;
    name: string;
    translations?: {
        pl_PL?: {
        };
    };
}

export interface ProductSafetyCertificateResource {
    product_safety_certificate_id?: number;
    certificate_id?: number;
    id?: number;
    name: string;
}

export interface Attribute {
    attribute_id: number;
    name: string;
    type: string;
    options: {
        option_id: number;
        value: string;
    }[];
}

export interface Product {
    id: string;
    name: string;
    description: {
        sections: {
            items: {
                type: string;
            }[];
        }[];
    };
    category: {
        id: string;
        path: CategoryPath[];
        similar: {
            id: string;
            path: CategoryPath[];
        }[];
    };
    images: {
        url: string;
    }[];
    parameters: ProductParameter[];
    isDraft: boolean;
    aiCoCreatedContent: {
        paths: string[];
    };
    trustedContent: {
        paths: string[];
    };
    hasProtectedBrand: boolean;
    productSafety: {
        responsibleProducers: ResponsibleProducer[];
        safetyInformation: {
            type: string;
        };
        marketedBeforeGPSRObligation: boolean;
    };
    publication: {
        status: string;
    };
}

export interface Category {
    id: string;
    name: string;
    count: number;
}

export interface CategoryPath {
    id: string;
    name: string;
}

export interface ProductParameter {
    id: string;
    name: string;
    type: 'dictionary' | 'dictionary_ac' | 'integer' | 'float' | 'string';

    values?: string[];
    valuesIds?: string[];
    valuesLabels?: string[];

    rangeValue?: {
        from?: string;
        to?: string;
    };

    unit?: string;
    required?: boolean;
    requiredForProduct?: boolean;

    dictionary?: {
        id: string;
        value: string;
        dependsOnValueIds?: string[];
    }[];

    restrictions?: {
        multipleChoices?: boolean;
        variantsAllowed?: boolean;
        variantsEqual?: boolean;
        ambiguousValueId?: string | null;
        dependsOnParameterId?: string | null;
        describesProduct?: boolean;
        customValuesEnabled?: boolean;
    };

    options?: {
        identifiesProduct: boolean;
        isGTIN: boolean;
        isTrusted: boolean;
    };

    // dodatkowe pole używane przez Ciebie w formularzu
    shoper?: string;
}


export interface ResponsibleProducer {
    id: string;
    name: string;
    producerData: {
        tradeName: string;
        address: {
            countryCode: string;
            street: string;
            postalCode: string;
            city: string;
        };
        contact: {
            email: string;
            phoneNumber: string;
            formUrl: string;
        };
    };
}

export interface Filter {
    id: string;
    type: string;
    name: string;
    values: {
        name: string;
        value: string;
        idSuffix: string;
        count: number;
        selected: boolean;
    }[];
    minValue: number;
    maxValue: number;
    unit: string;
}
