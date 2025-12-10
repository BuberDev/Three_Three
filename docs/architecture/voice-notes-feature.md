# Feature: Multi-Modal Voice Recording

## Cel
Kompleksowe nagrywanie i analiza wszystkich aspektów życia użytkownika poprzez voice-first interface.

## Typy nagrań

### 1. Daily Activity Recording
**Cel**: Dokumentowanie codziennych aktywności, zadań, emocji
**Flow**: User nagrywa co robił → Content classification → Activity extraction → Database storage → Real-time correlation check

### 2. Journaling & Reflection
**Cel**: Wieczorne refleksje, przemyślenia, planowanie
**Flow**: User nagrywa myśli → Emotional analysis → Insight extraction → Journal entry creation → Pattern recognition

### 3. Sleep Tracking Audio
**Cel**: Całonocne monitorowanie snu poprzez audio
**Flow**: Continuous recording → Sleep event detection → Quality analysis → Correlation with daily factors

## Intelligent Data Extraction

### Automated Content Analysis
- **Activity Recognition**: automatyczne wykrywanie typu aktywności
- **Emotion Detection**: analiza tonu głosu i treści
- **Entity Extraction**: ludzie, miejsca, zadania, cele
- **Pattern Recognition**: połączenia z historycznymi danymi
- **Correlation Discovery**: wykrywanie wzorców między różnymi sferami życia

### Multi-Table Data Distribution
```
Voice Recording → AI Processing → Multi-table storage:
├── daily_activities (structured activities)
├── journal_entries (reflections & thoughts)
├── sleep_tracking (nocne nagrania)
├── performance_metrics (inferred metrics)
└── voice_notes (raw recordings + transcripts)
```

## API Endpoints

### Core Recording
```
POST /voice/record/activity     # Daily activities
POST /voice/record/journal      # Evening reflections  
POST /voice/record/sleep        # Sleep session start
PUT /voice/sleep/stop           # Sleep session end
GET /voice/recordings/{type}    # Get by type
DELETE /voice/recordings/{id}   # Delete recording
```

### Analysis & Insights
```
GET /voice/insights/daily       # Daily patterns from recordings
GET /voice/correlations        # Cross-domain correlations
POST /voice/feedback/{id}      # User feedback on insights
```
