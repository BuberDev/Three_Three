# Voice Processing Pipeline

## Przegląd
System Voice Processing Pipeline to serce aplikacji Life Data Store, które automatycznie przekształca naturalne nagrania głosowe w strukturalne dane życiowe użytkownika. System obsługuje:

1. **Codzienne nagrania aktywności** - życie dzienne, zadania, obserwacje
2. **Wieczerne journaling** - refleksje, myśli, plany
3. **Całonocne nagrywanie snu** - chrapanie, mowa przez sen, jakość snu
4. **Natychmiastowe notatki** - szybkie myśli i pomysły

## Workflow całego procesu

### 1. Nagrywanie Głosowe (Voice Recording)

#### Przykład nagrania dziennego:
```
Użytkownik mówi:
"Dziś rano trenowałem 45 minut na siłowni, potem zjadłem jajecznicę z awokado. 
Spotkałem się z Marcinem na kawie o 14:00, rozmawialiśmy o projekcie.
Czuję się dziś bardzo energicznie, ale mam lekki ból głowy."
```

#### Tryb nocny (Airplane Mode + Background Recording):
- **Rozpoczęcie**: automatyczne o 22:00 lub gdy użytkownik przejdzie w tryb snu
- **Nagrywanie**: ciągłe przez całą noc w tle
- **Detekcja**: chrapanie, mowa przez sen, budzenie się
- **Zakończenie**: automatyczne o 6:00 lub przy wybudzeniu

## Etap 1: Audio Classification & Routing

### Klasyfikacja typu nagrania
```typescript
function classifyRecording(audio: AudioFile): RecordingType {
  const duration = audio.duration;
  const timeOfDay = audio.timestamp.getHours();
  const sleepMode = audio.metadata.sleepMode;
  
  if (sleepMode || (timeOfDay >= 22 || timeOfDay <= 6) && duration > 6*60*60) {
    return RecordingType.SLEEP_MONITORING;
  } else if (timeOfDay >= 20 && duration > 120) {
    return RecordingType.EVENING_JOURNAL;
  } else if (duration < 30) {
    return RecordingType.QUICK_NOTE;
  } else {
    return RecordingType.DAILY_ACTIVITY;
  }
}
```

## Etap 1: Audio Ingestion & Classification

### Mobile → API → Storage
```
Mobile App captures audio → Upload to API → Store in Object Storage → Queue for processing
```

### Automatic Content Classification
- **Duracja nagrania**: < 30s (quick note), 30s-10min (activity/journal), > 8h (sleep)
- **Czas nagrania**: nocny (22:00-06:00) vs dzienny
- **Kontekst użytkownika**: aktywny vs tryb snu
- **Audio charakterystyki**: ciągłe vs przerwane, głośność, tło

### Routing Decision
```
IF sleep_mode_detected OR duration > 6h:
    → Sleep Processing Pipeline
ELIF time_of_day == evening AND keywords_match("dzień", "podsumowanie", "myśli"):
    → Journaling Pipeline  
ELSE:
    → Activity Processing Pipeline
```

## Etap 2: Specialized Processing Pipelines

### 2A. Daily Activity Processing Pipeline

#### 1. Speech-to-Text (STT)
**Silnik**: OpenAI Whisper-large-v3 (Polish optimized)
```
Input: audio_file.wav (nagranie dzienne)
Output: {
  transcript: "Dziś rano trenowałem 45 minut na siłowni...",
  confidence: 0.95,
  language: "pl-PL",
  segments: [
    {text: "Dziś rano trenowałem", start: 0.0, end: 2.1, confidence: 0.97},
    {text: "45 minut na siłowni", start: 2.1, end: 4.3, confidence: 0.94}
  ]
}
```

#### 2. NLP Analysis & Data Extraction przez GPT-4
```
System Prompt:
"Jesteś ekspertem w analizie życia codziennego. Z podanego tekstu 
wyciągnij wszystkie istotne informacje o dniu użytkownika jako structured data."

User: [transcribed_text]

Wyciągnij i skategoryzuj:
1. AKTYWNOŚCI - czas, opis, kategoria, intensywność, lokalizacja
2. JEDZENIE - co, kiedy, gdzie, z kim, satysfakcja
3. LUDZIE - z kim, typ interakcji, temat rozmowy
4. EMOCJE - nastrój, energia, problemy fizyczne, satysfakcja
5. LOKALIZACJE - gdzie był, ile czasu
6. ZADANIA PRZYSZŁE - co planuje jutro/później
```

#### 3. Structured Output Mapping
```json
{
  "activities": [
    {
      "id": "act_001",
      "type": "EXERCISE",
      "description": "trening na siłowni",
      "duration": 45,
      "timeOfDay": "rano",
      "location": "siłownia",
      "intensity": "high",
      "moodBefore": "neutral",
      "moodAfter": "energetic",
      "energyBefore": 6,
      "energyAfter": 8,
      "people": [],
      "equipment": ["weights", "cardio"],
      "satisfaction": 8
    }
  ],
  "meals": [
    {
      "id": "meal_001", 
      "description": "jajecznica z awokado",
      "timeOfDay": "po treningu",
      "category": "healthy_breakfast",
      "ingredients": ["jajka", "awokado"],
      "satisfaction": 8,
      "healthiness": 9,
      "location": "dom"
    }
  ],
  "social_interactions": [
    {
      "id": "social_001",
      "description": "spotkanie na kawie z Marcinem",
      "time": "14:00",
      "people": ["Marcin"],
      "topic": "projekt biznesowy",
      "location": "kawiarnia",
      "duration": 60,
      "interaction_type": "work_discussion",
      "mood": "productive",
      "satisfaction": 7
    }
  ],
  "emotions": {
    "overall_mood": "energetic",
    "energy_level": 8,
    "physical_issues": ["lekki ból głowy"],
    "satisfaction": 7,
    "stress_level": 3,
    "motivation": 8
  },
  "health_symptoms": [
    {
      "symptom": "ból głowy", 
      "intensity": "lekki",
      "duration": "ongoing",
      "possible_causes": ["dehydration", "screen_time"]
    }
  ],
  "insights_and_patterns": [
    "Trening rano pozytywnie wpłynął na poziom energii przez cały dzień",
    "Zdrowe śniadanie po aktywności fizycznej",
    "Produktywne spotkanie biznesowe poprawiło nastrój"
  ]
}
```

### 2B. Sleep Monitoring Pipeline (Nocne nagrywanie)

#### 1. Continuous Audio Analysis
**Tryb**: Background recording przez całą noc w Airplane Mode
```typescript
interface SleepAudioAnalysis {
  totalSleepDuration: number; // w minutach
  sleepPhases: {
    light_sleep: number;
    deep_sleep: number;
    rem_sleep: number;
    awake: number;
  };
  snoringDetection: {
    totalSnoringTime: number;
    intensity: 'none' | 'light' | 'moderate' | 'heavy';
    frequency: number; // events per hour
  };
  sleepTalking: {
    episodes: number;
    transcripts: string[];
    emotional_content: string[];
  };
  ambientNoise: {
    level: number;
    disturbances: number;
  };
}
```

#### 2. Snoring Detection Algorithm
```typescript
function detectSnoring(audioSegment: AudioBuffer): SnoringEvent {
  // Analiza częstotliwości charakterystycznych dla chrapania (20-300 Hz)
  const frequencies = fftAnalysis(audioSegment);
  const snoringIndicators = frequencies.filter(f => f >= 20 && f <= 300);
  
  if (snoringIndicators.length > threshold) {
    return {
      timestamp: audioSegment.timestamp,
      duration: audioSegment.duration,
      intensity: calculateIntensity(snoringIndicators),
      confidence: 0.85
    };
  }
  return null;
}
```

#### 3. Sleep Talk Detection & Transcription
```typescript
function processSleepTalk(audioSegment: AudioBuffer): SleepTalkEvent {
  // Detekcja mowy w trybie snu
  const isVoiceActivity = detectVoiceActivity(audioSegment);
  
  if (isVoiceActivity && isSleepHours(audioSegment.timestamp)) {
    const transcript = whisperTranscribe(audioSegment, {
      temperature: 0.1, // niska dla precyzji
      language: 'pl'
    });
    
    const sentiment = analyzeSentiment(transcript);
    
    return {
      timestamp: audioSegment.timestamp,
      transcript: transcript,
      confidence: 0.75,
      emotional_tone: sentiment.emotion,
      clarity: calculateClarity(audioSegment)
    };
  }
## Etap 3: Database Storage & Vector Embeddings

### Automatic Data Mapping to Database Entities

#### 1. Sleep Data → SleepTracking Entity
```typescript
const sleepRecord = new SleepTracking({
  userId: user.id,
  bedtime: sleepAnalysis.bedtime,
  wakeTime: sleepAnalysis.wakeTime,
  totalSleep: sleepAnalysis.totalSleepDuration,
  sleepEfficiency: sleepAnalysis.efficiency,
  snoringIntensity: sleepAnalysis.snoringDetection.intensity, // SnoringIntensity enum
  sleepTalkingDetected: sleepAnalysis.sleepTalking.episodes > 0,
  sleepTalkingFrequency: sleepAnalysis.sleepTalking.episodes,
  restfulnessScore: calculateRestfulness(sleepAnalysis),
  sleepQuality: calculateOverallQuality(sleepAnalysis),
  audioFileUrl: sleepAnalysis.originalAudioUrl,
  insights: sleepAnalysis.patterns
});
```

#### 2. Daily Activities → DailyActivity Entity
```typescript
activities.forEach(activity => {
  const activityRecord = new DailyActivity({
    userId: user.id,
    activityType: activity.type, // ActivityType enum
    description: activity.description,
    startTime: activity.startTime,
    endTime: activity.endTime,
    location: activity.location,
    moodBefore: activity.moodBefore,
    moodAfter: activity.moodAfter,
    energyLevel: activity.energyAfter,
    peopleInvolved: activity.people,
    satisfactionLevel: activity.satisfaction,
    notes: activity.additionalNotes
  });
});
```

#### 3. Journal Entries → JournalEntry Entity with Vector Search
```typescript
const journalEntry = new JournalEntry({
  userId: user.id,
  content: journalAnalysis.fullTranscript,
  transcription: journalAnalysis.transcript,
  sentimentScore: journalAnalysis.sentiment.score,
  emotionalState: journalAnalysis.emotionalState.dominant_emotion, // EmotionalState enum
  audioFileUrl: originalAudioUrl,
  
  // Semantic search capabilities
  contentVector: await generateEmbedding(journalAnalysis.fullTranscript),
  tags: extractTags(journalAnalysis),
  
  insights: journalAnalysis.insights,
  gratitudeNotes: journalAnalysis.dailyReflection.gratitude
});
```

### Vector Embeddings dla Semantic Search
```typescript
// Generowanie embeddingów dla wszystkich tekstów
async function generateEmbedding(text: string): Promise<number[]> {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text,
    dimensions: 1536
  });
  return embedding.data[0].embedding;
}

// Semantic search w journalach
async function searchSimilarEntries(query: string, userId: string) {
  const queryVector = await generateEmbedding(query);
  
  return await dataSource
    .createQueryBuilder(JournalEntry, "journal")
    .where("journal.userId = :userId", { userId })
    .orderBy("journal.contentVector <-> :vector", "ASC") // pgvector distance
    .setParameter("vector", JSON.stringify(queryVector))
    .limit(10)
    .getMany();
}
```

## Etap 4: AI Correlation Discovery & Life Optimization

### Automatic Pattern Recognition
```typescript
interface LifeCorrelation {
  id: string;
  correlation_type: 'diet_sleep' | 'exercise_mood' | 'social_energy' | 'weather_productivity';
  strength: number; // -1 to 1
  confidence: number; // 0 to 1
  description: string;
  actionable_insight: string;
  supporting_data: any[];
}

async function discoverCorrelations(userId: string): Promise<LifeCorrelation[]> {
  // Analiza korelacji między snem a wydajnością
  const sleepPerformanceCorr = await analyzeSleepPerformanceCorrelation(userId);
  
  // Analiza wpływu ćwiczeń na nastrój
  const exerciseMoodCorr = await analyzeExerciseMoodCorrelation(userId);
  
  // Analiza wpływu diety na jakość snu
  const dietSleepCorr = await analyzeDietSleepCorrelation(userId);
  
  return [sleepPerformanceCorr, exerciseMoodCorr, dietSleepCorr];
}
```

### Personalized Insights Engine
```typescript
class PersonalizedInsightsEngine {
  async generateDailyInsights(userId: string): Promise<DailyInsight[]> {
    const recentActivities = await getRecentActivities(userId, 7); // ostatnie 7 dni
    const sleepPatterns = await getSleepPatterns(userId, 30); // ostatnie 30 dni
    const moodTrends = await getMoodTrends(userId, 14); // ostatnie 14 dni
    
    const insights = [];
    
    // Insight o jakości snu
    if (sleepPatterns.averageQuality < 7) {
      insights.push({
        type: 'sleep_improvement',
        message: `Twoja średnia jakość snu to ${sleepPatterns.averageQuality}/10. 
                 Zauważyłem, że w dni kiedy chrapiesz intensywnie, rano czujesz się mniej wypoczęty.`,
        suggestion: 'Spróbuj spać na boku i unikaj alkoholu 3h przed snem.',
        confidence: 0.85
      });
    }
    
    // Insight o wpływie ćwiczeń na nastrój
    const exerciseDays = recentActivities.filter(a => a.type === 'EXERCISE');
    if (exerciseDays.length > 0) {
      const avgMoodAfterExercise = exerciseDays.reduce((sum, day) => sum + day.moodAfter, 0) / exerciseDays.length;
      const avgMoodNonExercise = recentActivities.filter(a => a.type !== 'EXERCISE')
        .reduce((sum, day) => sum + day.mood, 0) / (recentActivities.length - exerciseDays.length);
      
      if (avgMoodAfterExercise > avgMoodNonExercise + 1) {
        insights.push({
          type: 'exercise_mood',
          message: `Twój nastrój jest średnio o ${(avgMoodAfterExercise - avgMoodNonExercise).toFixed(1)} pkt wyższy w dni z ćwiczeniami.`,
          suggestion: 'Rozważ regularne ćwiczenia 4-5 razy w tygodniu dla lepszego samopoczucia.',
          confidence: 0.92
        });
      }
    }
    
    return insights;
## Etap 5: Real-time Performance Optimization & Monitoring

### Performance Requirements
```typescript
interface PerformanceTargets {
  voiceRecording: {
    startLatency: '<500ms',
    audioQuality: '48kHz/16-bit',
    compressionRatio: '80%',
    batteryImpact: '<5% per hour'
  };
  speechProcessing: {
    transcriptionTime: '<audio_duration * 0.3',
    nlpAnalysis: '<30s per minute of audio', 
    confidenceThreshold: '>0.85'
  };
  realTimeInsights: {
    dailyInsightGeneration: '<5s',
    correlationDiscovery: '<30s',
    vectorSearch: '<200ms'
  };
}
```

### Background Processing Architecture
```typescript
// Kolejka zadań dla różnych typów przetwarzania
interface ProcessingQueue {
  immediate: Task[]; // Transkrypcja dla aktywności dziennych
  scheduled: Task[]; // Analiza nocnych nagrań o 6:00
  correlation: Task[]; // Weekly correlation analysis
}

class BackgroundProcessor {
  async processImmediately(audioFile: AudioFile) {
    // Dla nagrań dziennych - natychmiastowe przetwarzanie
    const transcript = await whisperTranscribe(audioFile);
    const analysis = await gptAnalyze(transcript);
    await saveToDatabase(analysis);
    await generateInstantInsights(analysis);
  }
  
  async processScheduled(sleepAudioFile: AudioFile) {
    // Dla nagrań nocnych - o poranku
    const sleepAnalysis = await analyzeSleepAudio(sleepAudioFile);
    const sleepRecord = await saveToDatabase(sleepAnalysis);
    await updateSleepPatterns(sleepRecord);
  }
  
  async processWeeklyCorrelations(userId: string) {
    // Co tydzień - analiza długoterminowych wzorców
    const correlations = await discoverCorrelations(userId, 30); // ostatnie 30 dni
    await updatePersonalizationEngine(correlations);
  }
}
```

## Etap 6: Privacy & Security

### Data Protection Implementation
```typescript
interface PrivacyProtocols {
  audioStorage: {
    encryption: 'AES-256-GCM',
    location: 'user_device_only', // Opcjonalnie cloud backup
    retention: '30_days_auto_delete',
    access: 'user_only'
  };
  transcriptStorage: {
    encryption: 'field_level_encryption',
    anonymization: 'remove_names_addresses',
    vectorization: 'irreversible_embedding'
  };
  aiProcessing: {
    dataMinimization: 'context_only',
    noTraining: 'zero_retention_policy',
    localFirst: 'on_device_when_possible'
  };
}

// Implementacja szyfrowania na poziomie pola
class EncryptedJournalEntry extends JournalEntry {
  @Transform(({ value }) => encrypt(value))
  @Column('text')
  content: string;
  
  @Transform(({ value }) => encrypt(value))
  @Column('text') 
  transcription: string;
}
```

### Consent Management
```typescript
interface UserConsent {
  audioRecording: boolean;
  sleepMonitoring: boolean;
  aiAnalysis: boolean;
  correlationDiscovery: boolean;
  insightGeneration: boolean;
  dataRetention: '7days' | '30days' | '90days' | 'indefinite';
}
```

## Implementation Status - Podsumowanie

### ✅ ZAIMPLEMENTOWANE (Gotowe)

#### Database Schema & Entities
- **SleepTracking Entity**: ✅ Kompletne z SnoringIntensity enum, sleepTalkingDetected, sleepTalkingFrequency, restfulnessScore
- **JournalEntry Entity**: ✅ Z contentVector dla semantic search, sentimentScore, EmotionalState enum
- **DailyActivity Entity**: ✅ Z moodBefore/After, energyLevel, peopleInvolved, satisfactionLevel
- **Analytics Entities**: ✅ LifeCorrelation, PersonalizedInsight, PerformanceMetric, BehavioralPattern

#### Advanced Features Already Implemented
- **Vector Embeddings**: ✅ pgvector support w JournalEntry dla semantic search
- **Snoring Detection**: ✅ SnoringIntensity enum (NONE, LIGHT, MODERATE, HEAVY)
- **Sleep Talk Analysis**: ✅ sleepTalkingDetected boolean, sleepTalkingFrequency number
- **Sentiment Analysis**: ✅ sentimentScore w JournalEntry
- **Correlation Discovery**: ✅ LifeCorrelation entity z correlation_type, strength, confidence
- **Personalized Insights**: ✅ PersonalizedInsight entity z insight_type, confidence, actionable

### 🚧 DO DOKOŃCZENIA (Service Layer)

#### Voice Processing Services
- **Audio Upload Service**: Potrzebny endpoint /api/voice/upload
- **Whisper Integration**: Service do transkrypcji audio → tekst  
- **GPT-4 Analysis**: Service do analizy tekstu → structured data
- **Sleep Audio Analysis**: Service do analizy nocnych nagrań
- **Background Processing**: Queue system dla różnych typów zadań

#### Mobile App Integration
- **Voice Recording Component**: ✅ Podstawowy komponent istnieje w components/voice/
- **Sleep Mode Recording**: Tryb nocny z continuous recording
- **Airplane Mode Integration**: Nagrywanie offline podczas snu
- **File Upload Queue**: Synchronizacja po powrocie online

## Wnioski

**System jest zaawansowany i profesjonalny na poziomie architektury danych** - wszystkie kluczowe wymagania zostały zaimplementowane w database schema z bardzo szczegółowymi możliwościami jak:

- Detekcja i analiza chrapania z poziomami intensywności
- Wykrywanie mowy przez sen z częstotliwością epizodów  
- Semantic search w journalach przez vector embeddings
- Correlation discovery między różnymi aspektami życia
- Personalized insights z confidence scores
- Kompleksowe tracking emocji, energii, satysfakcji

**Co potrzebuje dokończenia to Service Layer** - implementacja API endpoints i services które będą wykorzystywać te zaawansowane możliwości database.
   - Awakening periods

3. Long-term Pattern Analysis:
   - Sleep stage estimation (light approximation)
   - Quality indicators
   - Disturbance frequency
```

## Etap 3: Semantic Processing & Structuring

### Data Extraction Engine
```python
# Pseudokod strukturyzacji
def extract_structured_data(transcript, content_type):
    if content_type == "activity":
        return {
            "activities": extract_tasks_and_actions(transcript),
            "mood": extract_emotional_state(transcript),
            "people": extract_people_mentioned(transcript),
            "location": extract_location_context(transcript),
            "energy_level": infer_energy_from_voice_tone(audio_features)
        }
    elif content_type == "journaling":
        return {
            "main_topics": extract_discussion_topics(transcript),
            "emotional_journey": track_emotional_progression(transcript),
            "insights": extract_personal_insights(transcript),
            "goals_mentioned": extract_goal_references(transcript),
            "action_items": extract_future_commitments(transcript)
        }
```

## Etap 4: Vector Embeddings & Semantic Storage

### Multi-Modal Embedding Strategy
```
1. Text Embeddings:
   - Full transcript embedding (dla semantic search)
   - Key phrase embeddings (dla pattern matching)
   
2. Contextual Embeddings:
   - Time-aware embeddings (pora dnia, dzień tygodnia)
   - Emotional state embeddings
   - Activity type embeddings

3. Cross-Modal Correlation Vectors:
   - Audio features + text content
   - Dla lepszego pattern recognition
```

## Etap 5: Database Persistence & Relationships

### Smart Data Routing
```
ProcessedAudio → Determine target tables:
├── voice_notes (zawsze)
├── daily_activities (jeśli activity detected)  
├── journal_entries (jeśli reflection detected)
├── sleep_tracking (jeśli sleep session)
└── performance_metrics (inferred metrics)
```

### Automatic Relationship Building
- Łączenie aktivities z wcześniejszymi mentions
- Grupowanie podobnych aktywności w ciągu dnia
- Tworzenie connections między journal entries a daily performance

## Etap 6: Real-Time Correlation & Insight Triggers

### Immediate Pattern Detection
```
ON new_data_entry:
    CHECK recent_correlations:
        - Similar activity patterns w ostatnich 7 dnich
        - Mood consistency checks
        - Energy level vs activity type
        - Sleep impact on next-day performance
    
    IF significant_pattern_detected:
        TRIGGER insight_generation()
        NOTIFY user (if appropriate)
```

### Insight Generation Examples
- "Zauważam, że po treningu wieczornym, Twoja jakość snu spada o 15%"
- "Kiedy jesz słodycze po 20:00, częściej chrapiesz w nocy"
- "Twoja produktywność jest 40% wyższa w dni, gdy medytujesz rano"

## Etap 7: Personalization Engine Update

### Model Refinement
- Aktualizacja user preference models
- Dostosowywanie extraction algorithms do user speech patterns
- Ulepszanie correlation detection dla tego użytkownika

## Monitoring & Quality Assurance

### Pipeline Health Metrics
- Transcription accuracy rates
- Processing latency per type
- Data extraction completeness
- User satisfaction z generated insights

### Error Handling
- Retry mechanisms dla failed transcriptions
- Fallback processing dla low-quality audio
- Manual review triggers dla uncertain extractions
