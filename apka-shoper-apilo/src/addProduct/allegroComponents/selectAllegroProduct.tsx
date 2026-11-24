
import { Product } from "../../types";

export interface PcParametersType {
    id: string;
    name: string;
    type: string;
    required: boolean;
    requiredForProduct: boolean;
    requiredIf: null | string;
    displayedIf: null | string;
    unit: string | null;
    options: {
        variantsAllowed: boolean;
        variantsEqual: boolean;
        ambiguousValueId: string | null;
        dependsOnParameterId: string | null;
        describesProduct: boolean;
        customValuesEnabled: boolean;
    };
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
}


interface HandleSelectAllegroProductProps {
    product: Product;
    setSelectedProductId: (id: string) => void;
    setSelectedProduct: (product: Product) => void;
    setLockedParams: (params: Set<string>) => void;
    pcNewParameteres: any[];
    setFormData: (data: Record<string, string | string[]>) => void;
}

export const handleSelectAllegroProduct = ({
    product,
    setSelectedProductId,
    setSelectedProduct,
    setLockedParams,
    pcNewParameteres,
    setFormData,
}: HandleSelectAllegroProductProps) => {
    setSelectedProductId(product.id);
    setSelectedProduct(product);

    const autoFilledForm: { [key: string]: string | string[] } = {};

    const identified = new Set<string>(
        (product.parameters || [])
            .filter((p: any) => p?.options?.identifiesProduct === true)
            .map((p: any) => p.name)
    );
    setLockedParams(identified);

    product.parameters.forEach((param) => {
        const paramIndex = pcNewParameteres.findIndex(p => p.name === param.name);
        if (paramIndex === -1) return;

        const isNumeric = param.type === "integer" || param.type === "float";
        let paramValue: string | string[] | null = null;

        if (Array.isArray(param.values) && param.values.length > 0) {
            paramValue = param.values.length > 1
                ? param.values.map(String)
                : String(param.values[0]);
        } else if (Array.isArray(param.valuesLabels) && param.valuesLabels.length > 0) {
            if (isNumeric) {
                const numericMatch = param.valuesLabels[0].match(/\d+(\.\d+)?/);
                paramValue = numericMatch ? numericMatch[0] : "";
            } else {
                paramValue = param.valuesLabels.length > 1
                    ? param.valuesLabels.map(String)
                    : String(param.valuesLabels[0]);
            }
        } else if (param.rangeValue && (param.rangeValue.from || param.rangeValue.to)) {
            if (isNumeric) {
                paramValue = String(param.rangeValue.from ?? param.rangeValue.to ?? "");
            } else {
                const from = param.rangeValue.from ?? "";
                const to = param.rangeValue.to ?? "";
                paramValue = `${from}${from && to ? " - " : ""}${to}`;
            }
        }

        if (paramValue !== null) {
            autoFilledForm[param.name] = paramValue;
        }
    });

    setFormData(autoFilledForm);
};
