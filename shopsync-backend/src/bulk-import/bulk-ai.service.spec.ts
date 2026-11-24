import { BulkAiService } from './bulk-ai.service';

describe('BulkAiService', () => {
    const service = new BulkAiService();
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it('never returns the API key to the frontend', async () => {
        jest.spyOn(service as any, 'readSettings').mockResolvedValue({ apiKey: 'secret', model: 'gpt-5.4-mini', instructions: '' });
        expect(await service.getPublicSettings()).toEqual({ configured: true, model: 'gpt-5.4-mini', instructions: '' });
    });

    it.each([
        ['insufficient_quota', 'Sprawdź saldo'],
        ['rate_limit_exceeded', 'za 12 s'],
        ['project_spend_limit_exceeded', 'limit projektu'],
    ])('preserves 429 and explains %s', async (code, hint) => {
        jest.spyOn(service as any, 'readSettings').mockResolvedValue({ apiKey: 'test', model: 'test' });
        global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code } }), {
            status: 429, headers: { 'retry-after': '12' },
        }));
        await expect(service.analyze({ SKU: 'test' })).rejects.toMatchObject({
            status: 429, response: { message: expect.stringContaining(hint) },
        });
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('sends only needed CSV fields and requires a structured completed answer', async () => {
        jest.spyOn(service as any, 'readSettings').mockResolvedValue({ apiKey: 'secret', model: 'gpt-5.4-mini', instructions: '' });
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ template: 'monitor', title: 'DELL E2218HN', fields: [], issues: ['Brak ceny'], confidence: 0.9 }) }] }], usage: { input_tokens: 100, output_tokens: 40 } }),
        }) as any;

        const result = await service.analyze({ row: { SKU: 'DCM461', Model: 'E2218HN', SerialNumber: 'PRIVATE', User: 'Operator' }, template: 'monitor', attributeNames: ['Model', 'Przekątna ekranu'] });
        const request = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(request.text.format.type).toBe('json_schema');
        expect(request.input).toContain('E2218HN');
        expect(JSON.parse(request.input).availableFormAttributeNames).toEqual(['Model', 'Przekątna ekranu']);
        expect(request.input).not.toContain('PRIVATE');
        expect(request.input).not.toContain('Operator');
        expect(result.template).toBe('monitor');
        expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 40 });
    });
});
