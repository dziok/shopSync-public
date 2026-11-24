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

## Automatyczne odnawianie tokenu Apilo

Autoryzacja Apilo wymaga następujących zmiennych:

- `APILO_AUTH_URL=https://your-account.apilo.com/rest/auth/token/` (opcjonalnie)
- `APILO_CLIENT_ID`
- `APILO_CLIENT_SECRET`
- `APILO_AUTHORIZATION_CODE`

Kod autoryzacyjny jest używany przy pierwszym uruchomieniu lub gdy zapisany
refresh token zostanie odrzucony. Otrzymana
para access/refresh tokenów jest zapisywana domyślnie w prywatnym pliku
`shopsync-backend/.data/apilo-tokens.json`. Plik jest ignorowany przez Git.
Ścieżkę można zmienić przez `APILO_TOKEN_FILE`.

Backend sprawdza ważność tokenu podczas logowania oraz cyklicznie co 6 godzin.
Nieudane odnowienie tokenu Apilo nie blokuje logowania do aplikacji, ale funkcje
Apilo pozostają niedostępne do czasu ponownej autoryzacji. W aplikacji kliknij
status Apilo, aby odświeżyć token lub połączyć konto nowym kodem. Gdy zmieniono
aplikację API w Apilo, podaj tam również nowe ID i sekret klienta. Po udanej
autoryzacji bieżąca sesja jest aktualizowana bez ponownego logowania. Sekret i
tokeny są zapisywane w pliku backendu z uprawnieniami `0600`, nigdy w localStorage.
Token Apilo nie jest już umieszczany w JWT stanowiska. Każde żądanie do Apilo
pobiera aktualny token z serwisu backendu, więc ponowna autoryzacja na jednym
stanowisku działa także dla pozostałych stanowisk korzystających z tego backendu.
Po poprawnej inicjalizacji `APILO_ACCESS_TOKEN` nie jest potrzebny.
Jeśli `APILO_AUTH_URL` nie jest ustawiony, backend automatycznie wylicza
endpoint `/rest/auth/token/` z hosta `APILO_BASE_URL`.

## Uruchomienie

```bash
npm install
npm run start:dev
```

## User-Agent Allegro

Requesty do Allegro identyfikują aplikację jako:

`shopSync/<version> (+https://github.com/dziok/shopSync-public)`
