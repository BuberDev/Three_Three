# Sleep Tracking & Analysis System

## Przegląd funkcjonalności
System nagrywania i analizy snu pozwala na kompleksowe monitorowanie nocnego odpoczynku poprzez ciągłe nagrywanie audio. Dzięki analizie AI wykrywa wzorce snu, problemy oddechowe i korelacje z czynnikami dziennymi.

## Główne cele
- **Monitoring jakości snu** - obiektywna ocena poprzez analizę dźwięków
- **Wykrywanie zaburzeń** - chrapanie, bezdechy, mówienie przez sen
- **Korelacje life-style** - połączenie nawyków dziennych z jakością snu
- **Optymalizacja snu** - spersonalizowane rekomendacje poprawy

## User Journey & Setup

### 1. Przygotowanie do nagrywania
```
User workflow:
1. O 21:30 - aplikacja wysyła reminder "Przygotuj się do sleep tracking"
2. User aktywuje "Tryb samolotowy" (wyłącza WiFi/komórkę)
3. Umieszcza telefon 50-100cm od łóżka (nie bezpośrednio przy głowie)
4. Aktywuje "Sleep Recording Mode" w aplikacji
5. Aplikacja automatycznie startuje nagrywanie o ustalonej godzinie
```

### 2. Instrukcje bezpieczeństwa dla użytkownika
```
Dlaczego tryb samolotowy:
✓ Eliminuje wpływ fal elektromagnetycznych na sen
✓ Zapobiega zakłóceniom od połączeń/notyfikacji  
✓ Oszczędza baterię podczas długiego nagrywania
✓ Zapewnia nieprzerwaną sesję nagrywania

Optymalne umiejscowienie telefonu:
✓ 50-100cm od głowy (nie na stoliku nocnym przy łóżku)
✓ Mikrofonem skierowanym w stronę łóżka
✓ Stabilne miejsce (nie spadnie w nocy)
✓ Podłączony do ładowarki
```

## Techniczne aspekty nagrywania

### Audio Capture Configuration
```javascript
// Konfiguracja nagrywania snu
const sleepRecordingConfig = {
    sampleRate: 16000, // Wystarczające dla speech/snoring detection
    format: 'aac', // Kompresja dla długich nagrań
    channels: 1, // Mono wystarczy
    bitRate: 32000, // Niski bitrate = mniejsze pliki
    maxDuration: 36000, // 10 godzin max
    silenceThreshold: -50, // dB - próg ciszy
    segmentDuration: 1800 // Segmenty po 30 minut
}
```

### Storage & Batching Strategy
```
Nagranie dzielone na segmenty:
- 30-minutowe fragmenty (zarządzalne rozmiary plików)
- Upload segments during idle periods
- Immediate processing dla real-time events
- Compression przed upload (50-70% redukcja rozmiaru)

Strategia przechowywania:
- Raw audio: 7 dni lokalnie → 30 dni w chmurze
- Processed data: permanentnie w bazie
- Analysis results: permanentnie w analytics tables
```

## Analiza audio - AI Pipeline

### 1. Real-time Event Detection
```python
# Continuous monitoring podczas nagrywania
def real_time_sleep_monitoring(audio_stream):
    while recording_active:
        audio_chunk = get_next_chunk(30_seconds)
        
        events = {
            'snoring': detect_snoring_patterns(audio_chunk),
            'talking': detect_sleep_talking(audio_chunk),  
            'movement': detect_movement_sounds(audio_chunk),
            'breathing': analyze_breathing_patterns(audio_chunk),
            'disturbances': detect_external_noises(audio_chunk)
        }
        
        if significant_event_detected(events):
            log_sleep_event(timestamp, events)
            
        sleep(30) # Next chunk
```

### 2. Post-Sleep Comprehensive Analysis
```python
# Analiza po przebudzeniu
def comprehensive_sleep_analysis(night_audio_segments):
    analysis = {
        'sleep_phases': estimate_sleep_stages(night_audio_segments),
        'snoring_analysis': {
            'total_snoring_time': calculate_snoring_duration(),
            'intensity_levels': analyze_snoring_intensity(),
            'frequency_patterns': detect_snoring_rhythms(),
            'peak_times': identify_worst_snoring_periods()
        },
        'sleep_talking': {
            'episodes_count': count_talking_episodes(),
            'content_analysis': transcribe_sleep_talk(),
            'emotional_tone': analyze_sleep_talk_sentiment()
        },
        'sleep_quality_indicators': {
            'movement_frequency': count_position_changes(),
            'awakening_periods': detect_conscious_moments(),
            'deep_sleep_periods': estimate_deep_sleep_time(),
            'disruption_events': catalog_sleep_disturbances()
        },
        'environmental_factors': {
            'external_noises': identify_environmental_sounds(),
            'partner_impact': detect_partner_sleep_sounds(),
            'room_acoustics': analyze_room_sound_profile()
        }
    }
    
    return generate_sleep_report(analysis)
```

## Life Correlation Engine

### Automatic Daily Factor Analysis
```python
# Korelacje z czynnikami dziennymi
def analyze_daily_sleep_correlations(user_id, sleep_data, days_back=30):
    daily_factors = get_daily_activities(user_id, days_back)
    
    correlations = {
        'diet_impact': correlate_food_intake_with_sleep(daily_factors, sleep_data),
        'exercise_impact': correlate_workout_with_sleep_quality(daily_factors, sleep_data),
        'stress_impact': correlate_stress_levels_with_sleep(daily_factors, sleep_data),
        'screen_time_impact': correlate_evening_screen_time(daily_factors, sleep_data),
        'caffeine_impact': correlate_caffeine_intake_timing(daily_factors, sleep_data),
        'alcohol_impact': correlate_alcohol_consumption(daily_factors, sleep_data)
    }
    
    return generate_correlation_insights(correlations)
```

### Przykładowe insights które system może wykryć:
```
"W dni kiedy trenujesz po 19:00, chrapiesz 3x więcej niż normalnie"
"Kiedy jesz słodycze po kolacji, Twój sen jest bardziej niespokojny" 
"Po stresujących dniach w pracy mówisz przez sen częściej"
"Kiedy medytujesz przed snem, chrapanie spada o 60%"
"Alkohol zwiększa intensywność chrapania o 40% tej nocy"
```

## Sleep Quality Metrics

### Scoring System (1-10)
```javascript
function calculateSleepQualityScore(sleepData) {
    const factors = {
        duration: scoreByDuration(sleepData.totalHours), // 7-9h = optimal
        disturbances: scoreByAwakenings(sleepData.awakenings), // <3 = good
        snoring: scoreBySnoring(sleepData.snoringIntensity), // none = best
        consistency: scoreBySchedule(sleepData.bedtimeVariation), // regular = good
        deepSleep: scoreByDeepSleepRatio(sleepData.deepSleepPercent), // >20% = good
        environment: scoreByExternalFactors(sleepData.noiseLevel) // quiet = good
    };
    
    const weightedScore = (
        factors.duration * 0.25 +
        factors.disturbances * 0.20 +  
        factors.snoring * 0.20 +
        factors.consistency * 0.15 +
        factors.deepSleep * 0.15 +
        factors.environment * 0.05
    );
    
    return Math.round(weightedScore);
}
```

## Privacy & Security

### Data Protection
- **Local Processing**: Maksimum analiz lokalnie przed upload
- **Encrypted Storage**: End-to-end encryption dla audio files
- **User Control**: Możliwość usunięcia wszystkich danych snu
- **Opt-in System**: Sleep tracking domyślnie wyłączony

### Consent Management
```
User musi explicitly zgodzić się na:
✓ Nagrywanie nocne przez 8+ godzin
✓ Przechowywanie audio w chmurze  
✓ AI analysis nagrań snu
✓ Korelacje z danymi zdrowotnymi
✓ Sharing insights z innymi funkcjami aplikacji
```

## User Interface - Sleep Module

### Pre-Sleep Setup Screen
```
Tonight's Sleep Tracking
┌─────────────────────────────┐
│ 🛏️  Ready for sleep tracking? │
│                             │
│ □ Phone in airplane mode     │ 
│ □ Placed 50cm from bed      │
│ □ Connected to charger      │
│ □ Do not disturb enabled    │
│                             │
│ Start Time: 22:30           │
│ Expected Wake: 06:30        │
│                             │
│    [Start Sleep Session]    │
└─────────────────────────────┘
```

### Morning Report Screen
```
Last Night's Sleep Report
┌─────────────────────────────┐
│ 🌅 Sleep Quality: 7.2/10    │
│                             │
│ ⏰ Duration: 7h 45min       │
│ 💤 Deep Sleep: ~2h 10min    │
│ 😴 Snoring: 23 minutes      │
│ 🗣️ Sleep Talk: 2 episodes   │
│                             │
│ 📊 [Detailed Analysis]      │
│ 🔍 [View Correlations]      │
│ 🎯 [Sleep Recommendations]  │
│                             │
│    [Share with AI Coach]    │
└─────────────────────────────┘
```

## Technical Implementation Considerations

### Battery Optimization
- Adaptive recording quality based on battery level
- Intelligent audio compression
- Background processing optimization
- Wake locks management

### Storage Management
- Progressive upload during charging periods
- Automatic old file cleanup
- Smart caching strategy
- Offline analysis capabilities

### Error Handling
```python
# Graceful degradation strategies
if battery_below_20_percent():
    reduce_recording_quality()
    enable_aggressive_power_saving()
    
if storage_space_low():
    compress_older_segments()
    prioritize_important_audio_events()
    
if microphone_access_lost():
    attempt_reconnection()
    notify_user_of_interruption()
    log_gap_in_recording()
```

## Future Enhancements

### Advanced Analytics
- Heart rate correlation (z urządzeń ubieralnych)
- Room temperature/humidity correlation
- Sleep partner impact analysis  
- Seasonal sleep pattern tracking

### Smart Home Integration
- Automatic room preparation (temperatura, oświetlenie)
- Smart alarm based on sleep phases
- Environmental optimization suggestions

### Health Integration
- Export data do Apple Health/Google Fit
- Integration z wearable devices
- Medical sleep study compatibility