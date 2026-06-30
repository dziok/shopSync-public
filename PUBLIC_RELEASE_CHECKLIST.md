# Public Release Checklist

## Zrobione w tym repo

- usunięto historię Gita ze starego repo
- nie skopiowano prywatnych plików `.env.local`
- usunięto śledzone pliki z danymi operacyjnymi i tokenami
- endpointy Shoper i Apilo przeniesiono do zmiennych środowiskowych
- dodano pliki przykładowe do konfiguracji

## Do zrobienia ręcznie przed publikacją

- ustaw nowe sekrety i tokeny na serwerze lub na komputerach operatorów
- zweryfikuj, czy stare sekrety nie były wcześniej wypchnięte do zdalnego repo lub backupów
- wybierz politykę licencji dla publicznego repo:
  - zostaw `UNLICENSED`, jeśli kod ma być publicznie widoczny, ale nieudostępniany do użycia
  - albo dodaj własny plik `LICENSE`, jeśli chcesz zezwolić na użycie kodu
- utwórz nowe zdalne repozytorium i wypchnij tylko to świeże repo
- sprawdź jeszcze raz lokalnie `git grep` pod kątem domen, tokenów i haseł przed pierwszym pushem

## Szybka kontrola

```bash
git grep -nE "token|secret|password|api[_-]?key|Bearer " .
git status
```
