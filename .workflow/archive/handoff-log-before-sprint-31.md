### Sprint 30 Features — T-248 Results

| Feature | Result |
|---------|--------|
| Trip status persistence (PLANNING → ONGOING → COMPLETED) | ✅ PASS — all three states persist after re-GET |
| Flight timezone fix (T-240) | ✅ PASS — `6:50 AM ET` → stored as `10:50 UTC`, no double-conversion |
| LAND_TRAVEL calendar events (T-242/T-243) | ✅ PASS — events appear with type, title, start_time, end_time; click-to-scroll wired |
| COALESCE date regression (T-229) | ✅ PASS — PATCH dates return correct patched values |
| CORS header | ✅ PASS — `Access-Control-Allow-Origin: https://localhost:4173` |

