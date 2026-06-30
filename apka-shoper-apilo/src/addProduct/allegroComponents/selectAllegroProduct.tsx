
import { UseFormSetValue } from "react-hook-form";
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
    setValue: UseFormSetValue<any>;
}

export const handleSelectAllegroProduct = ({
    product,
    setSelectedProductId,
    setSelectedProduct,
    setLockedParams,
    pcNewParameteres,
    setFormData,
    setValue,
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
            setValue(`attribute_${paramIndex}` as any, paramValue, { shouldValidate: true });
        }
    });

    setFormData(autoFilledForm);
    setValue("attribute_757", autoFilledForm["Wysokość produktu"].toString());
    setValue("name", product.name);
    setValue("attribute_757", autoFilledForm["Wysokość produktu"].toString());
    setValue("attribute_758", autoFilledForm["Szerokość produktu"]);
    setValue("attribute_759", autoFilledForm["Głębokość produktu"]);
    setValue("attribute_761", autoFilledForm["Kolor"]);
    setValue("attribute_769", autoFilledForm["Liczba rdzeni procesora"]);
    setValue("attribute_770", autoFilledForm["Liczba wątków procesora"]);
    setValue("attribute_764", autoFilledForm["Taktowanie bazowe procesora"]);
    setValue("attribute_765", autoFilledForm["Taktowanie maksymalne procesora"]);
    setValue("attribute_776", autoFilledForm["Model"]);
    setValue("attribute_775", autoFilledForm["Typ napędu"]);
    setValue("attribute_768", autoFilledForm["System operacyjny"]);
    setValue("attribute_774", autoFilledForm["Pojemność dysku"]);
    setValue("attribute_773", autoFilledForm["Typ dysku twardego"]);
    setValue("attribute_771", autoFilledForm["Model procesora"]);
    setValue("attribute_762", autoFilledForm["Seria"]);
    setValue("attribute_763", autoFilledForm["Typ pamięci RAM"]);
    setValue("attribute_766", autoFilledForm["Wielkość pamięci RAM"]);
    setValue("attribute_1245", autoFilledForm["Chipset karty graficznej"]);
    setValue("attribute_1244", autoFilledForm["Rodzaj karty graficznej"]);
    setValue("attribute_913", autoFilledForm["Typ obudowy"]);
    setValue("attribute_1255", autoFilledForm["Złącza karty graficznej"]);
    setValue("attribute_1256", autoFilledForm["Moc zasilacza"]);
    setValue("attribute_1257", autoFilledForm["Komunikacja"]);
    setValue("included", autoFilledForm["Załączone wyposażenie"]);
    setValue("attribute_1258", autoFilledForm["Złącza zewnętrzne płyty głównej"]);
    setValue("attribute_", autoFilledForm["Złącza obudowy"]);


    setValue("ramType", autoFilledForm["Typ pamięci RAM"].toString(), {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
    });
    setValue(`attribute_${771}`, autoFilledForm["seria"].toString(), {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
    });

    setValue("attribute_757", autoFilledForm["Wysokość produktu"].toString(), {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
    });



    const kodProducenta = autoFilledForm["Kod producenta"];
    if (kodProducenta && typeof kodProducenta === "string") {
        setValue("SKU", kodProducenta);
    }
};
