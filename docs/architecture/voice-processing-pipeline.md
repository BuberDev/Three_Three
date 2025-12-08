# Voice Processing Pipeline

## 1. Upload
Mobile → API → Storage

## 2. Transcription (ASR)
- Model: Whisper / własny model ASR
- Zwraca: transcript + confidence

## 3. NLP Normalization
- oczyszczanie tekstu
- segmentacja zdań
- wykrywanie encji i intencji

## 4. Semantic Parsing
- tworzenie struktur:
  - task
  - reminder
  - event
  - thought
  - observation

## 5. Embeddings
- generowanie wektorów
- zapis w DB

## 6. Persistence
- zapis do voice_notes
- generowanie daily_entries

## 7. Personalization Trigger
- aktualizacja modeli użytkownika
