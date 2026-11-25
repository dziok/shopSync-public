import { BulkAiService } from './bulk-ai.service';

describe('BulkAiService', () => {
    const service = new BulkAiService({ getSettings: async () => ({ templates: {
        pc: { aiInstructions: 'Reguła tylko dla PC' }, monitor: { aiInstructions: 'Reguła monitora' },
    } }) } as any);
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it('lists all model families from the model catalog without running inference', async () => {
        jest.spyOn(service as any, 'readSettings').mockResolvedValue({ apiKey: 'test' });
        global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ data:
            ['text-embedding-test', 'ft:test:org:model', 'gpt-test', 'gpt-test'].map(id => ({ id })) })));
        expect(await service.listModels()).toEqual(['ft:test:org:model', 'gpt-test', 'text-embedding-test']);
        expect(global.fetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', expect.anything());
    });
    it('never returns the API key to the frontend', async () => {
        jest.spyOn(service as any, 'readSettings').mockResolvedValue({ apiKey: 'secret', model: 'gpt-5.4-mini', instructions: '' });
        expect(await service.getPublicSettings()).toEqual({ configured: true, model: 'gpt-5.4-mini', instructions: '' });
    });

    const form = { template:'pc',mode:'text-shoper',instruction:'RAM 16 GB',source:[],
        fields:[{id:'s:7',label:'Pamięć RAM',kind:'select',options:['16 GB']}] };
    it('limits suggestions to the supplied field IDs and never invokes a listing endpoint', async () => {
        jest.spyOn(service as any,'readSettings').mockResolvedValue({ apiKey:'test', model:'test', instructions:'' });
        const answer=(id:string)=>({ ok:true, json:async()=>({status:'completed', output:[{content:[{type:'output_text',
            text:JSON.stringify({changes:[{id,values:['16 GB']}],warnings:[]})}]}]}) });
        global.fetch=jest.fn().mockResolvedValueOnce(answer('s:7')).mockResolvedValueOnce(answer('active'));
        expect((await service.suggestForm(form)).changes).toEqual([{id:'s:7',values:['16 GB']}]);
        await expect(service.suggestForm(form)).rejects.toThrow('propozycji');
        for(const [url,config] of (global.fetch as jest.Mock).mock.calls){
            expect(url).toBe('https://api.openai.com/v1/responses');
            expect(JSON.parse(config.body).store).toBe(false);
        }
    });
    it('handles both forms in one analysis, keeping their separate RAM choices', async () => {
        jest.spyOn(service as any, 'readSettings').mockResolvedValue({ apiKey:'test', model:'test', instructions:'' });
        const fields = [...form.fields, { id:'a:7', label:'RAM', kind:'select', options:['16'] }];
        const changes = fields.map(f => ({ id:f.id, values:f.options }));
        global.fetch = jest.fn().mockResolvedValue({ ok:true, json:async () => ({ status:'completed',
            output:[{content:[{type:'output_text', text:JSON.stringify({changes,warnings:[]})}]}] }) });
        expect((await service.suggestForm({...form, mode:'text-both', fields})).changes).toEqual(changes);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(JSON.parse(body.input).fields).toEqual(fields);
        expect(body.instructions).toContain('Reguła tylko dla PC');
        expect(body.instructions).not.toContain('Reguła monitora');
    });
    it('reports exhausted funds for an optional form request', async () => {
        jest.spyOn(service as any,'readSettings').mockResolvedValue({ apiKey:'test',model:'test' });
        global.fetch=jest.fn().mockResolvedValue(new Response(JSON.stringify({error:{code:'credit_balance_exhausted'}}),{status:429}));
        await expect(service.suggestForm(form)).rejects.toMatchObject({status:429,response:{message:expect.stringContaining('Brak dostępnej kwoty')}});
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
