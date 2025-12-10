# System Architecture

## Przegłąd systemu
Ta aplikacja to kompleksowy **Personal Life Data Store** - inteligentny magazyn danych o całym życiu użytkownika. śledzi i analizuje każdy aspekt życia poprzez:

- **Voice-First Input**: nagrywanie codziennych aktywności, myśli i refleksji
- **Nocne Audio Monitoring**: całonocne nagrania snu z wykrywaniem chrapania i mówienia przez sen
- **AI-Powered Life Analysis**: automatyczne ekstraktowanie danych, wykrywanie wzorców i generowanie korelacji
- **Performance Optimization**: spersonalizowane rekomendacje na podstawie unikalnych wzorców użytkownika

**Główna filozofia**: Użytkownik mówi, AI rozumie, system optymalizuje życie.

## Główne komponenty

### Core Infrastructure
- **Mobile App** (React Native Expo) - voice-first interface z nagrywaniem
- **Backend API** (NestJS) - centralna logika z AI processing
- **Life Data Store** (PostgreSQL + pgvector) - kompleksowa baza danych życia
- **Audio Storage & Processing** (S3/GCP + Whisper ASR) - nagrania + transkrypcja
- **AI Correlation Engine** - wykrywanie wzorców między danymi życiowymi

### Voice Processing Pipeline
- **Audio Recording** - wysoka jakość, kompresja, metadata
- **Speech-to-Text** (Whisper/Azure Speech) - transkrypcja nagrań
- **NLP Analysis** (GPT-4) - wyciąganie encji, emocji, zadań
- **Data Extraction** - automatyczne kategoryzowanie i strukturyzacja
- **Context Understanding** - rozumienie intencji i kontekstu

### Sleep Monitoring System
- **Airplane Mode Audio Recording** - całonocne nagrywanie bezpieczne
- **Snoring Detection** - algorytmy wykrywające intensywność chrapania
- **Sleep Talk Analysis** - klasyfikacja mówienia przez sen
- **Audio Sleep Quality** - jakość snu na podstawie dźwięków
- **Environmental Sound Detection** - zanieczyszczenie dźwiękowe

## Typy danych życiowych

### 1. Voice-Extracted Daily Activities
**Z nagrania**: "dziś trenowałem, zjadłem sałatkę, spotkałem się z Marią"
**AI wyciąga**:
- Zadania: trening (kategoria: exercise), spotkanie z Marią (kategoria: social)
- Jedzenie: sałatka (kategoria: healthy_meal)
- Emocje: nastrój, energia, satysfakcja
- Ludzie: Maria (relacja: friend)
- Lokalizacje: siłownia, restauracja
- Czas i duration każdej aktywności

### 2. Sleep Audio Analysis
**Całonocne nagranie analizowane pod kątem**:
- **Chrapanie**: intensywność (light/moderate/heavy), częstotliwość, czas trwania
- **Mówienie przez sen**: słowa, emocje, częstotliwość, fazy snu
- **Jakość oddychania**: regularne/nieregularne, przerwy
- **Ruchy w łóżku**: szmery, przewracanie się
- **Środowisko**: hałas z zewnątrz, zakłócenia
- **Fazy snu**: głęboki sen, REM, płytki sen (na podstawie audio)

### 3. End-of-Day Journaling
**Głosowy dziennik zawiera**:
- Refleksje dnia: co poszło dobrze/źle
- Emocje i nastrój: szczegółowa analiza sentymentów
- Cele na jutro: automatyczne tworzenie tasków
- Wyzwania: identyfikacja bloków i problemów
- Wdzięczność: pozytywne aspekty dnia
- Problemy zdrowotne: ból, zmęczenie, objawy

### 4. AI-Generated Performance Metrics
**Automatycznie generowane na podstawie danych**:
- Poziom energii (na podstawie głosu, aktywności, snu)
- Produktywność (ukończone zadania vs planowane)
- Koncentracja (jakość wykonania zadań)
- Samopoczucie fizyczne (na podstawie symptomów w journalingu)
- Nastrój i emocje (analiza sentymentów z głosu)
- Jakość relacji (częstotliwość i jakość kontaktów)

## High-Level Diagram (opisowy)
```
Mobile App (recording interface)
 ↓
Audio Capture & Upload
 ↓
Multi-Modal Processing Pipeline:
├── Voice-to-Text (ASR)
├── Content Classification (journal/activity/sleep)
├── Entity Extraction (tasks, emotions, people, places)
├── Pattern Recognition (habits, correlations)
└── Context Enrichment (time, location, previous data)
 ↓
Life Data Store:
├── Activities Table (structured task data)
├── Sleep Analysis Table (nightly patterns)
├── Journal Entries (thoughts & reflections)
├── Performance Metrics (daily indicators)
└── Vector Store (semantic search & correlations)
 ↓
AI Analytics & Insights:
├── Correlation Discovery (diet → sleep quality)
├── Pattern Recognition (productive vs. unproductive days)
├── Anomaly Detection (unusual behaviors)
└── Optimization Recommendations
 ↓
Personalized Dashboard & Feedback
```

## Kluczowe przepływy

### 1. Daily Recording Flow
```
User records voice note → Audio processing → Content analysis → Data extraction → 
Database storage → Real-time correlation check → Immediate insights (if any)
```

### 2. Sleep Tracking Flow
```
Night recording setup → Continuous audio capture → Sleep pattern analysis → 
Correlation with daily factors → Sleep quality insights → Optimization suggestions
```

### 3. Life Pattern Analysis Flow
```
Historical data aggregation → Multi-dimensional correlation analysis → 
Pattern recognition → Insight generation → Actionable recommendations
```

### 4. Real-time Insight Flow
```
New data entry → Immediate correlation check → Pattern matching → 
Contextual insight generation → User notification (if significant)
```
