# Feature: Daily Tracking

## Cel
Generowanie dziennych podsumowań i wykrywanie trendów.

## Wpisy dzienne zawierają:
- zadania
- najczęściej powtarzane tematy
- nastroje
- nawyki
- podsumowanie automatyczne

## Automatyzacje
- daily_summary_job (cron)
- detection of habits
- detecting repeated topics

## API
GET /daily/{date}  
GET /daily/summary/latest
