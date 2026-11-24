const baseUrl = (process.env.QA_BACKEND_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const login = process.env.QA_LOGIN;
const password = process.env.QA_PASSWORD;

if (!login || !password) {
    console.error('Set QA_LOGIN and QA_PASSWORD to run read-only Shoper contract checks.');
    process.exit(2);
}

async function getJson(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, { ...options, signal: AbortSignal.timeout(15000) });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status} (${body?.message ?? 'no details'})`);
    return body;
}

const session = await getJson('/auth/login/shoper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
});
if (!session?.access_token) throw new Error('Login returned no access token');
const headers = { Authorization: `Bearer ${session.access_token}` };

for (const id of [9, 16, 47, 50]) {
    const params = new URLSearchParams({ limit: '1', filters: JSON.stringify({ attribute_group_id: id }) });
    const result = await getJson(`/attributes?${params}`, { headers });
    if (!Array.isArray(result?.list) || result.list.length === 0) {
        throw new Error(`Attribute group ${id} has no Shoper attributes`);
    }
    console.log(`Attribute group ${id}: OK`);
}

for (const id of [223, 249, 321]) {
    const category = await getJson(`/categories/shoper/${id}`, { headers });
    if (!category || typeof category !== 'object') throw new Error(`Category ${id} is missing`);
    console.log(`Category ${id}: OK`);
}

console.log('Read-only Shoper contract checks passed. No products were created or changed.');
