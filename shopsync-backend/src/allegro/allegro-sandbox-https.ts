import * as https from 'https';

// Allegro sandbox can fail TLS validation in Node on some local setups.
// Keep this workaround limited strictly to sandbox hosts.
export const allegroSandboxHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
