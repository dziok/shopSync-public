declare module 'virtual:listing-copy' {
    const catalog: Partial<Record<import('./templateSettings').TemplateKey, import('./templateDescriptionCatalog').CopyEntry[]>>;
    export default catalog;
}
