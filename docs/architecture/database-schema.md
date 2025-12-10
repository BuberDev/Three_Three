# Database Schema

## Core User Tables

### users
- id UUID PK
- email
- auth_provider
- timezone
- created_at
- updated_at

### user_settings
- id
- user_id FK
- consent_voice_processing (bool)
- consent_sleep_tracking (bool) 
- consent_personalization (bool)
- primary_goals (jsonb)
- sleep_tracking_enabled (bool)
- notification_preferences (jsonb)
- created_at
- updated_at

## Life Data Storage Tables

### voice_notes
- id UUID PK
- user_id FK
- audio_url
- duration_seconds (int)
- note_type (enum: daily_activity, journaling, quick_note, sleep_related)
- transcription (text)
- raw_transcript (text)
- confidence_score (float)
- language (varchar)
- embedding vector(1536)
- created_at
- processed_at

### daily_activities
- id UUID PK
- user_id FK
- voice_note_id FK (nullable)
- date
- activity_type (enum: work, exercise, meal, social, personal, health, travel)
- title (varchar)
- description (text)
- duration_minutes (int, nullable)
- location (varchar, nullable)
- people_involved (jsonb, nullable)
- mood_before (enum: great, good, neutral, bad, terrible, nullable)
- mood_after (enum: great, good, neutral, bad, terrible, nullable)
- energy_level (int 1-10, nullable)
- productivity_rating (int 1-10, nullable)
- tags (jsonb)
- extracted_metadata (jsonb)
- created_at
- updated_at

### sleep_tracking
- id UUID PK
- user_id FK
- sleep_date (date)
- recording_start_time (timestamp)
- recording_end_time (timestamp)
- audio_files (jsonb) -- array of audio file URLs
- sleep_duration_hours (float, nullable)
- snoring_detected (bool)
- snoring_intensity (enum: none, light, moderate, heavy)
- sleep_talking_detected (bool)
- sleep_talking_frequency (int) -- number of episodes
- sleep_quality_score (int 1-10, nullable)
- awakenings_count (int, nullable)
- analysis_completed (bool default false)
- analysis_metadata (jsonb)
- created_at
- updated_at

### journal_entries
- id UUID PK
- user_id FK
- voice_note_id FK (nullable)
- date
- entry_type (enum: daily_reflection, goal_setting, problem_solving, gratitude, challenge)
- title (varchar, nullable)
- content (text)
- sentiment_score (float -1 to 1)
- emotional_state (jsonb) -- {primary_emotion, intensity, secondary_emotions}
- topics_mentioned (jsonb)
- goals_referenced (jsonb)
- challenges_mentioned (jsonb)
- insights_gained (text, nullable)
- action_items (jsonb, nullable)
- embedding vector(1536)
- created_at
- updated_at

### performance_metrics
- id UUID PK
- user_id FK
- date
- metric_type (enum: energy, focus, productivity, mood, stress, motivation)
- value (float) -- standardized 1-10 scale
- source (enum: self_reported, ai_inferred, activity_based)
- confidence (float 0-1)
- context (jsonb) -- what contributed to this metric
- created_at

## Life Pattern Analysis Tables

### life_correlations
- id UUID PK
- user_id FK
- correlation_type (enum: diet_sleep, exercise_mood, work_stress, social_energy)
- factor_a (varchar) -- e.g., "sugar_intake"
- factor_b (varchar) -- e.g., "sleep_quality" 
- correlation_strength (float -1 to 1)
- confidence_level (float 0-1)
- sample_size (int)
- date_range_start (date)
- date_range_end (date)
- insights (text)
- recommendations (jsonb)
- created_at
- updated_at

### behavioral_patterns
- id UUID PK
- user_id FK
- pattern_type (enum: daily_routine, weekly_cycle, mood_cycle, productivity_pattern)
- pattern_name (varchar)
- description (text)
- frequency (varchar) -- "daily", "weekly", "monthly"
- triggers (jsonb)
- outcomes (jsonb)
- strength_score (float 0-1)
- last_observed (date)
- pattern_data (jsonb) -- detailed pattern information
- created_at
- updated_at

### ai_insights
- id UUID PK
- user_id FK
- insight_type (enum: correlation, recommendation, warning, achievement, pattern)
- priority (enum: low, medium, high, critical)
- title (varchar)
- description (text)
- data_sources (jsonb) -- which tables/records contributed
- confidence_score (float 0-1)
- action_suggested (text, nullable)
- dismissed (bool default false)
- dismissed_at (timestamp, nullable)
- valid_until (date, nullable)
- created_at

## Legacy/Enhanced Tables

### daily_summaries
- id
- user_id FK
- date
- total_activities (int)
- top_activities (jsonb)
- overall_mood (varchar)
- energy_average (float)
- productivity_score (float)
- sleep_quality_previous_night (float, nullable)
- key_achievements (jsonb)
- challenges_faced (jsonb)
- ai_generated_summary (text)
- recommendations_for_tomorrow (jsonb)
- updated_at

### events
- id
- user_id
- event_type (expanded enum: voice_recorded, sleep_session_started, sleep_session_ended, insight_generated, correlation_discovered, goal_achieved, pattern_detected)
- payload jsonb
- related_table (varchar, nullable) -- which main table this relates to
- related_id (UUID, nullable)
- timestamp
