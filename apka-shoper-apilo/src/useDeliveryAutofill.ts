import { createContext, useContext, useEffect, useRef } from 'react';
import type { FieldValues, Path, PathValue, UseFormGetFieldState, UseFormSetValue } from 'react-hook-form';
import type { Attribute, ProducersResource } from './types';
import { deliveryFields, normalized, type DeliveryProduct } from './bulkFormMapping';

export const DeliveryContext = createContext<DeliveryProduct | null>(null);
export const DeliveryReport = createContext<(message: string) => void>(() => {});
const empty: never[] = [];

export function useDeliveryAutofill<T extends FieldValues>(setValue: UseFormSetValue<T>, state: UseFormGetFieldState<T>,
    setPhotos: (files: File[]) => void, attributes: Attribute[] = empty, producers: ProducersResource[] = empty) {
    const product = useContext(DeliveryContext);
    const report = useContext(DeliveryReport);
    const filled = useRef(new Set<string>());
    useEffect(() => {
        if (!product) return;
        const { values, skipped } = deliveryFields(product, attributes);
        const manufacturer = product.draft.source[product.mapping.manufacturer];
        if (manufacturer && producers.length) {
            const matches = producers.filter(p => normalized(p.name) === normalized(manufacturer));
            if (matches.length === 1) values.producer = matches[0].producer_id;
            else skipped.push('Producent: ' + manufacturer);
        }
        for (const [name, value] of Object.entries(values)) {
            const path = name as Path<T>;
            if (filled.current.has(name) || state(path).isDirty || state(path).isTouched) continue;
            setValue(path, value as PathValue<T, typeof path>, { shouldValidate: true });
            filled.current.add(name);
        }
        if (!filled.current.has('#photos') && product.photos.length) {
            filled.current.add('#photos');
            setPhotos(product.photos);
        }
        report(skipped.length ? 'Do sprawdzenia: ' + skipped.join('; ') : '');
    }, [product, attributes, producers, setValue, setPhotos, state, report]);
    return product;
}
