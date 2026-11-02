export type NamedShoperAttribute = {
    attribute_id: number | string;
    name: string;
};

export const nameShoperAttributesInError = (
    message: string,
    attributes: readonly NamedShoperAttribute[] = [],
): string => {
    if (!attributes.length) return message;

    const namesById = new Map(attributes.map((attribute) => [
        String(attribute.attribute_id),
        attribute.name.trim(),
    ]));

    return message.replace(/Attribute ['"]?(\d+)['"]?( has invalid option value)?/gi, (match, id: string, invalidOption: string | undefined) => {
        const name = namesById.get(id);
        if (!name) return match;
        const label = `Atrybut „${name}” (ID ${id})`;
        return invalidOption ? `${label} ma nieprawidłową wartość opcji` : label;
    });
};
