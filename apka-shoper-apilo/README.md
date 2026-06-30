# shopSync Frontend

Frontend `shopSync` jest wewnętrznym panelem operatorskim używanym do przygotowywania danych produktowych i uruchamiania synchronizacji z:

- Allegro
- Shoper
- Apilo

## Funkcje związane z Allegro

- logowanie przez OAuth device flow
- pobieranie danych produktów i parametrów Allegro
- przygotowanie danych do wystawienia oferty
- uruchamianie wystawienia oferty przez backend `shopSync`

## Uruchomienie

```bash
npm install
npm run dev
```

Frontend oczekuje ustawionego `VITE_API_URL`, który wskazuje backend `shopSync`.

W repo publicznym nie ma prywatnych plików środowiskowych. Do lokalnego uruchomienia użyj `apka-shoper-apilo/.env.example` jako szablonu.
