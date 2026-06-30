import { pcParametersAll } from "../../allegroParameters/pcParametersAll";
import { FormDataAllegro, Product } from "../../types";

export const buildOfferParameters = (formData: FormDataAllegro, describesProductValue: boolean | undefined, parameters: any): any[] => {
    return Object.entries(formData).map(([name, value]) => {
        const paramDef = parameters.find((p: { name: string; }) => p.name === name);

        if (!paramDef || paramDef.options?.describesProduct !== describesProductValue) return null;

        const paramId = String(paramDef.id);

        if (paramDef.type === 'dictionary' && paramDef.dictionary) {
            const dictionary = paramDef.dictionary;

            if (Array.isArray(value)) {
                const matchedIds = value
                    .map(val => dictionary.find((d: { value: string; }) => d.value === val)?.id)
                    .filter(Boolean); // usuń undefined

                return {
                    id: paramId,
                    valuesIds: matchedIds
                };
            } else {
                const matchedId = dictionary.find((d: { value: string; }) => d.value === value)?.id;
                return {
                    id: paramId,
                    valuesIds: matchedId ? [matchedId] : []
                };
            }
        }

        // dla liczbowych i tekstowych (integer, float, string)
        return {
            id: paramId,
            values: Array.isArray(value) ? value : [value]
        };
    }).filter(Boolean); // usuń null/undefined
};