# shopSync

`shopSync` is an internal operator tool for preparing product data and synchronizing workflows between:

- Allegro REST API
- Shoper
- Apilo
- Cloudinary
- DeepL

The repository contains:

- `shopsync-backend` - NestJS API for authentication, integrations, translation proxying, image handling, and operational automations
- `apka-shoper-apilo` - React frontend used by operators to prepare product data and trigger selected backend actions

## Allegro scope

The Allegro integration in `shopSync` is used to:

- start OAuth device authorization for Allegro sandbox and production
- fetch Allegro categories, parameters, and product data
- create product offers and product proposals
- send request headers with application identification required by the Allegro REST API rules

The tool is intended for internal operational use by the owner of the connected accounts. It is not a public consumer application.

## Public repository notes

This repository is prepared for public source visibility, but it does not include production credentials, access tokens, private runtime data, or infrastructure-specific environment files.

Before running the application you must create your own local configuration files:

- `shopsync-backend/.env.local` or `shopsync-backend/production.env.local`
- `apka-shoper-apilo/.env.local`

Use the example files as templates:

- `shopsync-backend/.env.example`
- `shopsync-backend/production.env.example`
- `apka-shoper-apilo/.env.example`

## Allegro User-Agent

Requests sent to Allegro identify the application as:

`shopSync/<version> (+https://github.com/dziok/shopSync-public)`

The URL in the header should point to documentation describing the purpose of the application and the owner-controlled nature of the integration.

## ChatGPT Ads feed on Cloudinary

The backend generates a local CSV from Shoper and publishes a gzip-compressed copy to Cloudinary as a public raw asset. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the backend environment. Click **Pobierz z Shoper** in the Feed ChatGPT Ads panel to publish it and copy the stable HTTPS `.csv.gz` URL. The backend also refreshes it daily at 04:00 Europe/Warsaw while running. A failed publication leaves the previous Cloudinary version available and reports an error in the panel. The backend can remain on the local network; the feed URL is public and product data is accessible to anyone with the link.

OpenAI's documented Ads product-feed ingestion uses SFTP and accepts `csv.gz`. Verify that your Ads Manager supports URL import before using the Cloudinary link; otherwise upload the generated file by SFTP.

## Template QA

Run `node scripts/qa.mjs` from the repository root to execute frontend and backend tests and build both applications. The template matrix checks every active description template, changes directly rendered text values and checkbox options, and verifies that generated text follows those values. The Shoper payload test checks the office-PC request's selected price, stock, producer, name, description, attributes, and active flag. Existing targeted tests cover other integration rules. These tests mock external APIs and do not create products. This is regression coverage, not exhaustive testing of every combination or a live Shoper write/readback test.

With the backend running and valid operator credentials, run `QA_LOGIN=... QA_PASSWORD=... node scripts/check-shoper-contracts.mjs` to verify that the Shoper attribute groups and categories used by key templates still exist. Set `QA_BACKEND_URL` if the backend is not at `http://127.0.0.1:3000`. This check sends only read requests after login; it never creates or updates products. No Shoper credentials are stored in the repository or CI.

## CSV delivery drafts

The **Dostawa CSV** tab imports up to 500 rows (5 MB), detects a likely template, checks duplicate SKUs and missing price/specification fields, and lets an operator review and edit the draft. OpenAI analysis is optional and is configured in the tab. The API key is stored only by the backend in the ignored `shopsync-backend/.data/bulk-ai-settings.json` file (or supplied through `OPENAI_API_KEY`); it is never returned to the browser. The backend excludes serial numbers, asset tags, user names, and creation dates from the AI request. AI usage in tokens is shown in the tab.

Enter prices in the delivery table. Attach photos per item, or select photos for the delivery using SKU-prefixed filenames (for example `HPC131_01.jpg`). Open an item and select **Uzupełnij formularz** to review it in the existing product template. CSV facts and AI suggestions populate supported fields; select values must match the loaded options. Ambiguous values and failed diagnostics need operator review. A row without a quantity column represents one unit. Delivery data and staged photos stay in memory until reload or logout.

Publication still requires confirmation per product using the channels supported by its template. Opening a draft does not publish it. Form-only edits are not saved back to the delivery table.
