export function mapAllegroParamToShoperAttribute(param: any, attributeGroupId: number) {
    let shoperType = 0; // domyślnie pole tekstowe
    let options: string[] = [];

    if (param.type === 'dictionary' && param.dictionary) {
        shoperType = 2; // lista rozwijana w Shoper
        options = param.dictionary.map((opt: any) => opt.value);
    } else if (param.type === 'boolean') {
        shoperType = 1; // checkbox
    }

    return {
        name: param.name,
        description: '',
        attribute_group_id: attributeGroupId,
        order: 0,
        type: shoperType,
        active: true,
        default: '',
        options,
    };
}
