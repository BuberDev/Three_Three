# System Architecture

## Główne komponenty
- **Mobile App** (React Native Expo)
- **Backend API** (NestJS)
- **Voice Processing Service** (ASR + NLP pipeline)
- **Vector DB** (pgvector)
- **Relational DB** (PostgreSQL)
- **Object Storage** (S3/GCP Bucket)
- **Event Bus** (Kafka / PubSub)

## High-Level Diagram (opisowy)
Mobile App  
 → REST/GraphQL API  
 → Storage (audio)  
 → Processing Queue  
 → ASR  
 → NLP Pipeline  
 → Database (voice_notes, daily_entries)  
 → Personalization Engine  
 → Mobile App (rekomendacje, dashboard)

## Kluczowe przepływy
- *Creation Flow*: audio → transkrypcja → NLP → DB
- *Daily Summary Flow*: agregacja → generacja podsumowania
- *Recommendation Flow*: embeddings → podobieństwo → sugestie
