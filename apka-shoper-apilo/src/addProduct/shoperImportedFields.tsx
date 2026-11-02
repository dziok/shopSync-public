import { useCallback, useState, type FormEvent } from "react";
export { shoperEnabled, shoperFieldWasProvided, shoperImportedAttributeNames } from "./shoperImportedValues";

export function useShoperImportedFields() {
    const [importedFields, setImportedFields] = useState<Set<string>>(() => new Set());
    const clearImportedFields = useCallback(() => setImportedFields(new Set()), []);
    const markImportedFields = useCallback((fields: Iterable<string>) => setImportedFields(previous => {
        const next = new Set(previous);
        for (const field of fields) next.add(field);
        return next;
    }), []);
    const onImportedFieldChange = useCallback((event: FormEvent<HTMLFormElement>) => {
        const name = (event.target as HTMLInputElement).name;
        if (!name) return;
        setImportedFields(previous => {
            if (!previous.has(name)) return previous;
            const next = new Set(previous);
            next.delete(name);
            return next;
        });
    }, []);
    return { importedFields, clearImportedFields, markImportedFields, onImportedFieldChange };
}

export function ShoperImportedFieldStyles({ fields }: { fields: ReadonlySet<string> }) {
    const names = [...fields].filter(name => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name));
    if (!names.length) return null;
    const inputSelectors = names.map(name => `.shoper-import-form .MuiInputBase-root:has([name="${name}"])`).join(", ");
    const checkboxSelectors = names.map(name => `.shoper-import-form .MuiFormControlLabel-root:has(input[name="${name}"])`).join(", ");
    const textareaSelectors = names.map(name => `.shoper-import-form textarea[name="${name}"]:not(.MuiInputBase-input)`).join(", ");
    return <style>{`${inputSelectors}, ${textareaSelectors} { box-shadow: inset 2px 0 0 #66bb6a; }
        ${checkboxSelectors} { border-left: 2px solid #66bb6a; padding-left: 4px; }`}</style>;
}
