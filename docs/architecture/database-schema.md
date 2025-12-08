# Database Schema

## users
- id UUID PK
- email
- auth_provider
- created_at
- updated_at

## user_settings
- id
- user_id FK
- consent_voice_processing (bool)
- consent_personalization (bool)
- primary_goals (jsonb)
- created_at
- updated_at

## voice_notes
- id UUID PK
- user_id FK
- audio_url
- transcription (text)
- raw_transcript (text)
- sentiment_score (float)
- topics (jsonb)
- extracted_items (jsonb)
- embedding vector(1536)
- created_at
- processed_at

## daily_entries
- id
- user_id FK
- date
- auto_summary (text)
- tasks (jsonb)
- habits (jsonb)
- mood (text)
- updated_at

## events
- id
- user_id
- event_type
- payload jsonb
- timestamp
