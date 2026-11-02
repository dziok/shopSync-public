import { FormDataAllegro } from "../../types";

export const buildOfferParameters = (formData: FormDataAllegro, describesProductValue: boolean | undefined, parameters: any): any[] => {
    return Object.entries(formData).map(([name, value]) => {
        const paramDef = parameters.find((p: { name: string; }) => p.name === name);

        if (!paramDef || paramDef.options?.describesProduct !== describesProductValue) return null;
        if (value == null) return null;
        if (Array.isArray(value) && value.length === 0) return null;
        if (!Array.isArray(value) && String(value).trim() === "") return null;

        const paramId = String(paramDef.id);

        if (paramDef.type === 'dictionary' && paramDef.dictionary) {
            const dictionary = paramDef.dictionary;

            if (Array.isArray(value)) {
                const matchedIds = value
                    .map(val => dictionary.find((d: { value: string; }) => d.value === val)?.id)
                    .filter(Boolean); // usuń undefined
                if (!matchedIds.length) return null;

                return {
                    id: paramId,
                    valuesIds: matchedIds
                };
            } else {
                const matchedId = dictionary.find((d: { value: string; }) => d.value === value)?.id;
                if (!matchedId) return null;
                return {
                    id: paramId,
                    valuesIds: [matchedId]
                };
            }
        }

        if (paramDef.type === 'integer' || paramDef.type === 'float') {
            const rawValues = Array.isArray(value) ? value : [value];
            const values = rawValues
                .map((entry) => String(entry ?? "").match(/-?\d+(?:[.,]\d+)?/)?.[0]?.replace(",", ".") ?? "")
                .filter(Boolean);
            if (!values.length) return null;

            return {
                id: paramId,
                values
            };
        }

        // dla liczbowych i tekstowych (integer, float, string)
        return {
            id: paramId,
            values: Array.isArray(value) ? value : [value]
        };
    }).filter(Boolean); // usuń null/undefined
};
