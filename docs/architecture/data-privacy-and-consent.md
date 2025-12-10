# Data Privacy & Consent - Life Data Store

## Podstawowe zasady prywatności
- **Informed Consent**: Użytkownik musi świadomie zgodzić się na każdy typ przetwarzania
- **Data Ownership**: Wszystkie dane należą do użytkownika, nie do aplikacji
- **Right to Delete**: Możliwość usunięcia wszystkich danych w dowolnym momencie
- **Transparency**: Jasne wyjaśnienie jak dane są używane
- **No Selling**: Dane użytkownika nie są nigdy sprzedawane ani udostępniane

## Rozszerzone typy zgód dla Life Data Store

### 1. Voice Recording Consent
**Zakres**: Nagrywanie i transkrypcja głosu
- Codzienne nagrania aktywności (krótkie, 30s-10min)
- Wieczorne journaling sessions (refleksje, przemyślenia)
- **Sleep audio recording** (całonocne nagrania 6-10h)

**Specific consents needed**:
- ✅ Transkrypcja voice-to-text
- ✅ Analiza tonu głosu dla mood detection
- ✅ Przechowywanie audio w chmurze (encrypted)
- ✅ **Sleep audio analysis** (chrapanie, mówienie przez sen)

### 2. Life Analytics Consent
**Zakres**: AI analysis życia codziennego
- Wykrywanie wzorców behawioralnych
- Korelacje między różnymi sferami życia
- Predykcyjne insights i recommendations
- **Cross-domain correlation analysis** (diet→sleep, exercise→mood)

### 3. Sleep Tracking Consent (NEW)
**Szczególnie wrażliwe - dodatkowe zabezpieczenia**:
- ✅ Nagrywanie przez całą noc (6-10 godzin)
- ✅ Analiza chrapania i zaburzeń oddychania
- ✅ Detekcja mówienia przez sen + transkrypcja
- ✅ Korelacje z czynnikami dziennymi (jedzenie→sen)
- ✅ Sharing sleep insights z daily performance analysis

**Enhanced privacy dla sleep data**:
- Local processing preferred (analiza na urządzeniu)
- Shorter retention (30 days dla raw audio)
- Extra encryption layer
- Opt-out dostępny w każdej chwili

### 4. Cross-Life Correlation Consent
**Zakres**: Łączenie danych między różnymi sferami życia
- Diet + Sleep quality correlations
- Exercise + Mood patterns
- Social interactions + Energy levels
- Work stress + Sleep disturbances
- Environment + Performance correlations

## Hierarchiczny system retencji danych

### Sleep Audio (Most Sensitive)
- **Raw nighttime audio**: 30 dni (możliwość wcześniejszego usunięcia)
- **Sleep analysis results**: 1 rok
- **Sleep pattern summaries**: Permanent (anonymized)

### Daily Voice Recordings
- **Raw audio files**: 90 dni
- **Transcriptions**: 2 lata lub do deaktywacji konta
- **Extracted insights**: Permanent (de-identified)

### Life Analytics Data
- **Personal correlations**: Permanent (until account deletion)
- **Performance metrics**: 5 lat
- **Behavioral patterns**: Permanent (anonymized for research)

### Audit & Access Logs
- **Data access logs**: 90 dni
- **AI processing logs**: 30 dni
- **User interaction events**: 1 rok

## Enhanced Security Framework

### Encryption Standards
```
Data at Rest:
- AES-256 encryption dla wszystkich stored files
- Separate encryption keys per user
- Sleep audio: additional AES layer + biometric unlock

Data in Transit:
- TLS 1.3 dla wszystkich connections
- Certificate pinning
- End-to-end encryption dla sleep data upload
```

### Access Control
```
Role-Based Access (Zero Trust):
- Developers: NO access do production user data
- AI Systems: Tokenized access, no raw PII
- Support: Only encrypted identifiers
- User: Full control + audit trail
```

### Local Processing Priority
```
Sensitive Operations (preferably local):
1. Sleep audio analysis (on-device when possible)
2. Personal pattern recognition
3. Sensitive correlation discovery
4. Mood/emotional analysis

Cloud Processing (encrypted):
1. Complex AI model inference
2. Cross-user pattern learning (anonymized)
3. Long-term trend analysis
4. Backup and sync
```

## User Control Dashboard

### Granular Privacy Controls
```
User can control:
- Which types of recordings are analyzed
- Frequency of insights generation
- Retention periods (within legal minimums)
- Local vs cloud processing preference
- Sharing between life domains (sleep → daily performance)
- AI explanation detail level
```

### Real-Time Privacy Status
```
User Dashboard shows:
- Current consent status for each data type
- Data retention countdown timers
- Recent AI processing activities
- Option to download all personal data
- One-click deletion for each data category
```

## GDPR & International Compliance

### Right to Explanation
- Every AI insight includes explanation of data sources
- Users can see which recordings contributed to correlations
- Transparent algorithms for pattern recognition

### Right to Portability
- Full data export in structured format (JSON)
- AI insights and correlations included
- Compatible format dla import do innych systems

### Right to Rectification
- Users can correct transcription errors
- Ability to mark insights as incorrect
- AI models adjust based on user corrections

## Ethical AI Guidelines

### Bias Prevention
- Regular auditing dla discriminatory patterns
- Diverse training data (anonymized)
- User feedback loop dla improving recommendations

### Mental Health Safeguards
- Detection of concerning patterns (depression, anxiety)
- Referral recommendations (nie medical advice)
- Crisis intervention protocols
- Professional resource suggestions
