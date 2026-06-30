# shopSync Backend

Backend `shopSync` odpowiada za integracje z:

- Allegro REST API
- Shoper
- Apilo
- Cloudinary
- DeepL

## Zakres integracji Allegro

Backend realizuje wewnętrzny workflow operacyjny do:

- uruchamiania autoryzacji OAuth device flow dla Allegro sandbox i production
- pobierania danych produktów i kategorii Allegro
- tworzenia ofert i propozycji produktowych
- przesyłania danych wymaganych do wystawienia oferty, w tym parametrów i informacji o odpowiedzialnym producencie

## Konfiguracja środowiska

Sekrety nie powinny być przechowywane w śledzonych plikach repozytorium. Realne wartości należy trzymać wyłącznie w lokalnych lub serwerowych plikach:

- `shopsync-backend/.env.local`
- `shopsync-backend/dev.env.local`
- `shopsync-backend/production.env.local`

Pliki przykładowe:

- `shopsync-backend/.env.example`
- `shopsync-backend/production.env.example`

Wymagane są też adresy bazowe Twojej infrastruktury:

- `SHOPER_REST_BASE_URL`
- `SHOPER_STOREFRONT_BASE_URL`
- `APILO_BASE_URL`

## Uruchomienie

```bash
npm install
npm run start:dev
```

## User-Agent Allegro

Requesty do Allegro identyfikują aplikację jako:

`shopSync/<version> (+https://github.com/dziok/shopSync)`
