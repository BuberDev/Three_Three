# Error Handling

## Typy błędów
- ValidationError
- AuthError
- PermissionError
- RateLimitError
- ServerError

## Struktura błędu API
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {}
  }
}

## Zasady
- Nigdy nie zwracać danych wewnętrznych.
- Komunikaty muszą być jasne.
- Logowanie błędów po stronie serwera.
