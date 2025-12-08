# Feature: Voice Notes

## Cel
Umożliwić natychmiastowe rejestrowanie myśli, zadań, pomysłów i obserwacji.

## Flow
- Użytkownik nagrywa → API upload → ASR → NLP → DB → Dashboard update

## Dane wyjściowe
- tasks[]
- insights[]
- topics[]
- embeddings

## Kluczowe wymagania
- natychmiastowy feedback,
- obsługa offline,
- wyciszenie szumu,
- wizualizacja przetwarzania.

## API
POST /voice/notes  
GET /voice/notes  
DELETE /voice/notes/{id}
