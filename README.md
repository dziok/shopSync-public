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
