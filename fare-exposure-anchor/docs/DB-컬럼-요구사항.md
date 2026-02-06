# Pricing Exposure Anchor — DB 데이터 항목 정리

실제 데이터 적재 전, DB 관리자 확인용 문서입니다.  
**필요한 테이블/컬럼**과 **용도**를 정리했으며, 보유 여부 체크란을 두었습니다.

---

## 1. 테이블명

| 항목 | 값 |
|------|-----|
| **테이블명** | `exposure_events` |
| **설명** | 항공 운임 노출 이벤트 1건당 1행 |

---

## 2. 컬럼 목록 (스키마 기준)

아래 컬럼명은 **실제 DB 컬럼명** 그대로 사용해야 합니다. (애플리케이션에서 이 이름으로 조회합니다.)

| No | DB 컬럼명 | DB 타입 | 필수 여부 | 용도 | 보유 여부 |
|----|-----------|---------|-----------|------|:---------:|
| 1 | `id` | uuid | O (PK) | 행 고유 식별자. 미입력 시 자동 생성 가능 | ☐ |
| 2 | `ts` | timestamptz | **O** | 노출 발생 시각 (필터·시계열 기준) | ☐ |
| 3 | `airline` | text | **O** | 항공사 코드 (예: OZ, KE) | ☐ |
| 4 | `origin` | text | **O** | 출발 공항 코드 (예: ICN, GMP) | ☐ |
| 5 | `dest` | text | **O** | 도착 공항 코드 (예: LAX, NRT) | ☐ |
| 6 | `trip_type` | text | **O** | 편도/왕복 (OW, RT, MC 등) | ☐ |
| 7 | `channel` | text | **O** | 채널 (web, mobile, api 등) | ☐ |
| 8 | `session_id` | text | **O** | 세션 식별 (동일 세션 집계용) | ☐ |
| 9 | `search_id` | text | **O** | 검색 식별 (동일 검색 내 순위용) | ☐ |
| 10 | `result_rank` | int | **O** | 해당 검색 결과 내 순위 (1부터) | ☐ |
| 11 | `price_krw` | int | **O** | 노출된 가격 (원화, 정수) | ☐ |
| 12 | `currency` | text | - | 통화 코드 (기본값 KRW) | ☐ |
| 13 | `is_discounted` | boolean | - | 할인 여부 (기본값 false) | ☐ |
| 14 | `departure_date` | date | - | 출발일 (필터 옵션) | ☐ |
| 15 | `arrival_date` | date | - | 도착일 (필터 옵션) | ☐ |
| 16 | `meta` | jsonb | - | 기타 메타데이터 (기본값 `{}`) | ☐ |

- **필수(O)**: 대시보드 필터·집계에 사용되며, 비어 있으면 안 됨.
- **선택(-)**: 기본값이 있거나, 필터에서 비워 둘 수 있음.

---

## 3. 컬럼별 상세 (전달 시 참고)

| DB 컬럼명 | 설명·예시·비고 |
|-----------|----------------|
| `id` | UUID. INSERT 시 `gen_random_uuid()` 사용 가능. |
| `ts` | ISO 8601 타임스탬프 권장 (예: `2025-02-05T10:00:00Z`). 최근 24h/7d 필터 기준. |
| `airline` | 2자 코드 (OZ, KE, 7C 등). 복수 선택 필터 지원. |
| `origin`, `dest` | 공항 3자 코드 (ICN, GMP, LAX 등). |
| `trip_type` | OW(편도), RT(왕복), MC(다구간) 등. |
| `channel` | web / mobile / api 등. 채널별 필터용. |
| `session_id` | 동일 사용자/세션 구분. unique sessions 집계에 사용. |
| `search_id` | 동일 검색 요청 구분. result_rank와 함께 사용. |
| `result_rank` | 한 검색 결과에서의 순위 (1, 2, 3 …). |
| `price_krw` | 원화 가격 정수 (퍼센타일·히스토그램·동일 금액별 노출 횟수 계산에 사용). |
| `currency` | 기본값 'KRW'. 다른 통화 확장 시 사용. |
| `is_discounted` | 할인 적용 여부. 기본값 false. |
| `departure_date`, `arrival_date` | 여정 날짜 필터용. NULL 가능. |
| `meta` | JSON 객체. 추가 속성 보관용. 기본값 `{}`. |

---

## 4. 인덱스 (성능·필터용)

애플리케이션 조회 패턴 기준 권장 인덱스입니다. 기존 스키마와 다르면 DB 관리자와 조정하면 됩니다.

| 인덱스 목적 | 컬럼 (순서) |
|-------------|-------------|
| 시계열·최근 조회 | `ts DESC` |
| 노선+기간 필터 | `airline, origin, dest, trip_type, ts DESC` |
| 검색별 순위 | `search_id, result_rank` |

---

## 5. 전달 시 요청 문구 (복사용)

아래 문구를 메일/메신저에 붙여 보내면 됩니다.

```
[Pricing Exposure Anchor] 실제 데이터 적재를 위해
필요한 DB 테이블·컬럼을 정리한 문서를 첨부합니다.

- 테이블: exposure_events (1행 = 노출 이벤트 1건)
- 첨부 문서에 컬럼명, 타입, 필수 여부, 용도, 보유 여부 체크란이 있습니다.
- “보유 여부”만 체크해서 돌려주시거나, 없는 컬럼/타입이 있으면 알려주시면 됩니다.
- 날짜(departure_date, arrival_date)는 선택 항목이라 없어도 되고,
  나머지 필수 컬럼만 맞는지 확인 부탁드립니다.
```

---

## 6. 참고: 현재 앱에서 쓰는 컬럼

- **필터 조건**: `ts`, `airline`, `origin`, `dest`, `trip_type`, `channel`, `departure_date`, `arrival_date`
- **집계·표시**: `price_krw`, `ts`, `session_id`, `id`, `airline`, `origin`, `dest`, `trip_type`, `channel`, `result_rank`, `is_discounted`, `departure_date`, `arrival_date`
- **선택 조회 컬럼**: `id, ts, airline, origin, dest, trip_type, channel, session_id, search_id, result_rank, price_krw, currency, is_discounted, departure_date, arrival_date, meta`

위 문서를 그대로 전달하시면 됩니다. 수정이 필요하면 알려주세요.
