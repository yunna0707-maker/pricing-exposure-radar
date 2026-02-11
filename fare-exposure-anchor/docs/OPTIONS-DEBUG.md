# Options API 진단 (debug=1)

운영에서 "조건에 맞는 데이터 없음"이 나올 때 원인을 파악하기 위해 options API에 `debug=1` 쿼리를 붙이면 진단 정보가 응답에 포함됩니다.

## 호출 예시

```
GET /api/exposures/options?period=24h&debug=1
GET /api/exposures/options?period=7d&airline=7C&debug=1
```

(운영: `https://your-app.vercel.app/api/exposures/options?period=7d&debug=1`)

## debug 응답 필드

| 필드 | 설명 |
|------|------|
| `urlHostMask` | Supabase URL의 host 일부(마스킹). 전체 URL/키는 절대 포함되지 않음. |
| `keyMode` | `"service_role"` \| `"anon"` \| `"unknown"` (키 원문 노출 없음) |
| `filtersNormalized` | 적용된 필터(airline, origin, dest, tripType, channel, period) |
| `whereSummary` | 쿼리에 적용된 조건 요약 문자열 |
| `totalCount` | 테이블 전체 건수 |
| `periodCount` | 기간(ts >= cutoff)만 적용한 건수 |
| `airlineCount` | 기간 + airline 적용 건수 |
| `odCount` | 기간 + airline + origin + dest 적용 건수 |
| `finalCount` | 모든 조건 적용 후 건수 |
| `nowIso` | 서버 now() 기준 ISO 시각 |
| `cutoffIso` | 기간 필터 cutoff 시각(ts >= cutoffIso) |

## 원인별 해석

| 상황 | 추정 원인 | 조치 |
|------|-----------|------|
| `totalCount === 0` | ENV가 다른 DB를 가리키거나 테이블 비어 있음 | Vercel env 확인, 동일 Supabase 프로젝트 사용 여부 확인 |
| `totalCount > 0`, `periodCount === 0` | **기간 필터**: 최근 24h/7d에 데이터 없음 | `period=7d`로 재시도, 또는 최근 데이터 적재 |
| `periodCount > 0`, `airlineCount === 0` | **airline 매핑**: 선택한 항공사 코드가 DB 값과 불일치 | DB의 airline 값 확인(대소문자, 코드 통일) |
| `airlineCount > 0`, `odCount === 0` | **OD 없음**: 해당 origin/dest 조합 데이터 없음 | 다른 출발/도착 선택 또는 7d로 기간 확대 |
| `keyMode === "anon"` | anon 키 사용 중 → RLS로 0건 가능 | `SUPABASE_SERVICE_ROLE_KEY` 사용(서버 전용) 확인 |

## 응답 예시 (debug=1)

```json
{
  "airlines": ["7C", "KE", "OZ"],
  "origins": ["ICN", "GMP"],
  "dests": ["SFO", "CJU"],
  "tripTypes": ["OW", "RT", "MC"],
  "channels": ["web", "mobile"],
  "availablePairsCount": 12,
  "debug": {
    "urlHostMask": "xxxx…co",
    "keyMode": "service_role",
    "filtersNormalized": {
      "airline": null,
      "origin": null,
      "dest": null,
      "tripType": null,
      "channel": null,
      "period": "24h"
    },
    "whereSummary": "ts >= 2026-02-08T12:00:00.000Z",
    "totalCount": 400000,
    "periodCount": 15000,
    "airlineCount": 15000,
    "odCount": 8000,
    "finalCount": 8000,
    "nowIso": "2026-02-09T12:00:00.000Z",
    "cutoffIso": "2026-02-08T12:00:00.000Z"
  }
}
```

## /api/health로 먼저 확인

options 전에 health로 DB 연결·기간별 건수 확인:

```
GET /api/health
```

- `dbConnected: true`, `totalCount > 0` → DB/ENV 정상
- `last24hCount === 0`, `last7dCount > 0` → 최근 24h 데이터 없음 → options에 `period=7d` 사용 권장
