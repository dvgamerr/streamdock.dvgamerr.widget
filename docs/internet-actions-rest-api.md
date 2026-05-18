# Internet-Driven Actions and REST API Design

## Scope

เอกสารนี้รวบรวมเฉพาะ actions ที่ต้องดึงข้อมูลจาก internet ใน repo นี้ และเสนอรูปแบบ RESTful API กลางเพื่อแยก logic การเรียก third-party ออกจากตัว StreamDock widget

อ้างอิงจาก source ปัจจุบัน:

- `gold-price` ใช้ YLG Bullion API
- `currency-rate` ใช้ Yahoo Finance
- `stock-price` ใช้ Yahoo Finance
- `air-quality` ใช้ IQAir location page
- `weather` ใช้ Open-Meteo และโหลด weather icon จาก AccuWeather

รวมข้อเสนอสำหรับ action ใหม่ด้าน network diagnostics:

- `network-diagnostics` สำหรับ ping, resolve DNS, trace route และหา public IPv4

actions ที่ไม่ต้องพึ่ง internet:

- `powershell`
- `sleep-monitor`
- `toggle-audio`
- `work-hours`

## Inventory

| Action                | Current Source                                           | Current Input Settings                             | Current Output Used by Widget                                  | Notes                                        |
| --------------------- | -------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| `gold-price`          | `register.ylgbullion.co.th/api/price/gold`               | `currency`, `interval`                             | spot gold price, exchange rate                                 | มี logic แปลง `USD -> THB` ใน client         |
| `currency-rate`       | `query1.finance.yahoo.com/v8/finance/chart/{pair}`       | `from`, `to`, `interval`                           | current rate, daily % change, absolute change                  | pair format เช่น `USDTHB=X`                  |
| `stock-price`         | `query1.finance.yahoo.com/v8/finance/chart/{symbol}`     | `symbol`, `displayName`, `cost`, `qty`, `interval` | last price, open price, % change                               | ถ้ามี `cost` จะคำนวณ P/L % ฝั่ง client       |
| `air-quality`         | IQAir HTML page                                          | `url`, `interval`                                  | AQI, level, color, last update                                 | ปัจจุบัน scrape HTML โดยตรง มี fragility สูง |
| `weather`             | `api.open-meteo.com/v1/forecast`                         | `lat`, `lon`, `interval`                           | temperature, realfeel, weather code, is day, 6h rain chance    | icon ถูกโหลดจาก AccuWeather แยกอีก request   |
| `network-diagnostics` | local OS network stack + optional public IP echo service | `mode`, `target`, `count`, `timeout`, `interval`   | reachability, latency, resolved IP, hops, detected public IPv4 | เป็น action ใหม่ที่ยังไม่มีใน repo ปัจจุบัน  |

## Design Goals

1. แยก third-party integration ออกจาก plugin ให้เหลือแค่เรียก internal API
2. ใช้ resource naming แบบ noun-based และ versioned path: `/api/v1/...`
3. คืน response schema ที่ stable กว่า third-party raw payload
4. ให้ backend เป็นคน normalize, validate, cache, retry และ map error
5. รองรับ migration แบบค่อยเป็นค่อยไป โดย input ยังใกล้เคียงกับ settings เดิม

## Shared API Standards

### Base URL

`/api/v1`

### Response Envelope

ทุก endpoint ควรตอบกลับในรูปแบบเดียวกัน:

```json
{
  "data": {},
  "meta": {
    "request_id": "c1f2b83d-8fd8-47a7-8d47-6d239c55d8e0",
    "fetched_at": "2026-05-01T09:30:00Z",
    "cached_until": "2026-05-01T09:30:30Z",
    "source": "open-meteo"
  }
}
```

### Error Envelope

```json
{
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Weather provider is temporarily unavailable",
    "details": {
      "provider": "open-meteo"
    }
  },
  "meta": {
    "request_id": "5469fdb8-1ff4-4856-b80f-c9ee94457925",
    "fetched_at": "2026-05-01T09:31:00Z"
  }
}
```

### Recommended HTTP Statuses

| Status                     | Use Case                                                        |
| -------------------------- | --------------------------------------------------------------- |
| `200 OK`                   | สำเร็จ                                                          |
| `400 Bad Request`          | query/path invalid                                              |
| `404 Not Found`            | ไม่พบ symbol/location                                           |
| `422 Unprocessable Entity` | input format ถูกต้องแต่ใช้ไม่ได้ เช่น unsupported currency pair |
| `429 Too Many Requests`    | โดน rate limit                                                  |
| `502 Bad Gateway`          | upstream ตอบผิดรูปแบบ                                           |
| `503 Service Unavailable`  | upstream ล่ม/timeout                                            |

### Naming and Validation

- ใช้ `snake_case` ใน JSON
- query/path ที่เป็น code ใช้ตัวพิมพ์ใหญ่สำหรับ currency และ symbol เช่น `USD`, `THB`, `AAPL`
- backend ต้อง validate input ก่อนเรียก upstream ทุกครั้ง
- ทุก endpoint ควรใส่ `Cache-Control` และ `ETag`

### Architecture Rule for Network Diagnostics

network diagnostics ต้องรันจาก local agent หรือ service ที่อยู่ในเครื่องผู้ใช้หรือใน network เดียวกัน ไม่ควรรันจาก centralized backend ตรง ๆ เพราะผล `ping`, `trace`, และ `public IPv4` จะสะท้อน network ของ server แทน network จริงของผู้ใช้

## 6. Network Diagnostics

### Why

use case นี้ต่างจาก market/weather data เพราะไม่ได้แค่อ่านข้อมูลจาก upstream แต่เป็นการสั่ง probe ออกจาก network stack จริง จึงควรออกแบบเป็น diagnostic resource แยกต่างหาก

### Single Endpoint

#### Endpoint

`POST /api/v1/network/ping`

#### Why One Endpoint Works

ถึงชื่อ path จะเป็น `ping` แต่ให้มองว่าเป็น network diagnostic action endpoint เดียว โดยแยก behavior ด้วย `mode` ใน request body แทนการแตก route หลายเส้น

#### Supported Modes

- `ping`
- `trace`
- `public_ipv4`

### Use Cases

| Use Case                              | Request Shape                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `trace public4 1.1.1.1`               | เรียก `mode: "trace"` พร้อม `include_public_ipv4: true`                                         |
| `ping 1.1.1.1`                        | เรียก `mode: "ping"` และ `target: "1.1.1.1"`                                                    |
| `ping 192.168.1.1`                    | เรียก `mode: "ping"` และ `target: "192.168.1.1"`                                                |
| `ping speedtest.singapore.linode.com` | เรียก `mode: "ping"` และ `target: "speedtest.singapore.linode.com"` โดย backend resolve ให้ก่อน |

### 6.1 Common Request Body

```json
{
  "mode": "ping",
  "target": "1.1.1.1",
  "count": 4,
  "timeout_ms": 1000,
  "ip_version": 4,
  "resolve_dns": true,
  "max_hops": 16,
  "include_public_ipv4": false
}
```

### Field Definitions

| Name                  | Type           | Required    | Notes                                                           |
| --------------------- | -------------- | ----------- | --------------------------------------------------------------- |
| `mode`                | string         | yes         | `ping`, `trace`, `public_ipv4`                                  |
| `target`              | string         | conditional | required for `ping` and `trace`                                 |
| `count`               | integer        | no          | ใช้กับ `ping`, default `4`                                      |
| `timeout_ms`          | integer        | no          | ใช้กับ `ping` และ `trace`                                       |
| `ip_version`          | integer/string | no          | `4`, `6`, หรือ `auto`                                           |
| `resolve_dns`         | boolean        | no          | ถ้า target เป็น hostname ให้ resolve ก่อน                       |
| `max_hops`            | integer        | no          | ใช้กับ `trace`                                                  |
| `include_public_ipv4` | boolean        | no          | แนบ public IPv4 ใน response ได้ โดยเฉพาะตอน `trace public4 ...` |

### 6.2 Ping Example

#### Request

```json
{
  "mode": "ping",
  "target": "speedtest.singapore.linode.com",
  "count": 4,
  "timeout_ms": 1000,
  "ip_version": 4,
  "resolve_dns": true
}
```

#### Response

```json
{
  "data": {
    "mode": "ping",
    "target": "speedtest.singapore.linode.com",
    "target_type": "hostname",
    "resolved_addresses": ["139.162.23.4"],
    "selected_address": "139.162.23.4",
    "packets_sent": 4,
    "packets_received": 4,
    "packet_loss_percent": 0,
    "latency_ms": {
      "min": 31.2,
      "avg": 33.7,
      "max": 37.5
    },
    "status": "reachable"
  },
  "meta": {
    "request_id": "18357d49-59fa-4ebf-abdd-a50eb76fec1f",
    "fetched_at": "2026-05-01T09:32:10Z",
    "source": "local-agent"
  }
}
```

### 6.3 Trace Example

#### Request

```json
{
  "mode": "trace",
  "target": "1.1.1.1",
  "max_hops": 16,
  "timeout_ms": 1500,
  "ip_version": 4,
  "resolve_dns": false,
  "include_public_ipv4": true
}
```

#### Response

```json
{
  "data": {
    "mode": "trace",
    "target": "1.1.1.1",
    "target_type": "ipv4",
    "resolved_addresses": ["1.1.1.1"],
    "public_ipv4": "203.0.113.24",
    "hops": [
      {
        "hop": 1,
        "address": "192.168.1.1",
        "hostname": null,
        "latency_ms": 1.3
      },
      {
        "hop": 2,
        "address": "10.10.0.1",
        "hostname": null,
        "latency_ms": 8.7
      },
      {
        "hop": 3,
        "address": "203.0.113.1",
        "hostname": null,
        "latency_ms": 11.9
      }
    ],
    "completed": false
  },
  "meta": {
    "request_id": "ef2f30ad-68eb-4444-afd8-a853c9bbdf11",
    "fetched_at": "2026-05-01T09:32:20Z",
    "source": "local-agent"
  }
}
```

### 6.4 Public IPv4 Example

#### Request

```json
{
  "mode": "public_ipv4"
}
```

#### Response

```json
{
  "data": {
    "mode": "public_ipv4",
    "public_ipv4": "203.0.113.24",
    "detected_via": "ip-echo",
    "network_scope": "local-agent"
  },
  "meta": {
    "request_id": "c30a3d0b-f417-440a-8cc9-380607ce17a2",
    "fetched_at": "2026-05-01T09:32:00Z",
    "cached_until": "2026-05-01T09:37:00Z",
    "source": "public-ip-provider"
  }
}
```

### Backend Notes

- hostname targets ควร resolve เป็น A/AAAA record ก่อน ping หรือ trace เสมอ
- ถ้า user ระบุ `speedtest.singapore.linode.com` แล้วต้องการ `ping` เลย backend ควร handle resolve ให้อัตโนมัติ
- ไม่ควรใช้ `trace` เพื่อ infer public IP; ถ้าต้องการค่า public IP ให้ใช้ `mode: "public_ipv4"` หรือ `include_public_ipv4: true`
- network probe ควรมี rate limit เข้มกว่า data API ปกติ
- อาจต้องใช้สิทธิ์ระดับ OS หรือ utility เฉพาะเครื่อง เช่น `ping`, `tracert`, `Resolve-DnsName`
- ควร sanitize target อย่างเข้มงวด เพื่อกัน SSRF-style misuse และ command injection
- ถ้าจะทำ polling action ควรให้ UI ตั้ง interval ขั้นต่ำ เช่น 10-30 วินาที ไม่ควรยิง probe ถี่เกินไป

## Proposed APIs

## 1. Gold Price

### Why

ปัจจุบัน widget เรียก YLG โดยตรง แล้วค่อยแปลงค่าเป็น THB ฝั่ง client ทำให้ coupling กับ upstream schema สูงเกินไป

### Endpoint

`GET /api/v1/commodities/gold/spot`

### Query Parameters

| Name             | Type   | Required | Example | Description                          |
| ---------------- | ------ | -------- | ------- | ------------------------------------ |
| `quote_currency` | string | no       | `USD`   | default `USD`, allowed: `USD`, `THB` |

### Example Request

`GET /api/v1/commodities/gold/spot?quote_currency=THB`

### Example Response

```json
{
  "data": {
    "commodity": "gold",
    "unit": "troy_ounce",
    "spot_price": 123456.78,
    "quote_currency": "THB",
    "base_spot_price_usd": 3325.4,
    "fx_rate_usd_thb": 37.12,
    "provider_timestamp": "2026-05-01T09:29:42Z"
  },
  "meta": {
    "request_id": "5989fd18-d936-4dc0-8c0f-65818d2535af",
    "fetched_at": "2026-05-01T09:29:43Z",
    "cached_until": "2026-05-01T09:29:58Z",
    "source": "ylg-bullion"
  }
}
```

### Backend Notes

- backend ควรเป็นคนแปลง currency แทน client
- ถ้า upstream คืนทั้ง spot และ exchange rate อยู่แล้ว ให้ normalize เหลือ schema นี้
- ถ้ารองรับหลายสกุลในอนาคต ให้ใช้ abstraction เดียวกับ FX service

## 2. Currency Rate

### Endpoint

`GET /api/v1/forex/pairs/{base_currency}-{quote_currency}`

### Path Parameters

| Name             | Example |
| ---------------- | ------- |
| `base_currency`  | `USD`   |
| `quote_currency` | `THB`   |

### Example Request

`GET /api/v1/forex/pairs/USD-THB`

### Example Response

```json
{
  "data": {
    "pair": "USD-THB",
    "base_currency": "USD",
    "quote_currency": "THB",
    "rate": 37.1245,
    "previous_close": 36.987,
    "change": 0.1375,
    "change_percent": 0.37,
    "direction": "up",
    "provider_timestamp": "2026-05-01T09:30:00Z"
  },
  "meta": {
    "request_id": "de5484f4-7966-4d8c-b700-50f8bc776d2b",
    "fetched_at": "2026-05-01T09:30:01Z",
    "cached_until": "2026-05-01T09:30:11Z",
    "source": "yahoo-finance"
  }
}
```

### Backend Notes

- ใช้ resource แบบ pair จะอ่านง่ายกว่า query string ล้วน
- backend ควรรับผิดชอบเรื่อง symbol mapping ไปเป็นรูป `USDTHB=X`
- response ควรคืนตัวเลขล้วน ไม่คืน string format เช่น `+0.37%`

## 3. Stock Price

### Endpoint

`GET /api/v1/stocks/{symbol}/quote`

### Path Parameters

| Name     | Example |
| -------- | ------- |
| `symbol` | `AAPL`  |

### Query Parameters

| Name         | Type   | Required | Example  | Description    |
| ------------ | ------ | -------- | -------- | -------------- |
| `cost_basis` | number | no       | `185.50` | ราคาทุนต่อหุ้น |
| `quantity`   | number | no       | `10`     | จำนวนหุ้น      |

### Example Request

`GET /api/v1/stocks/AAPL/quote?cost_basis=185.50&quantity=10`

### Example Response

```json
{
  "data": {
    "symbol": "AAPL",
    "display_name": "Apple Inc.",
    "currency": "USD",
    "last_price": 192.34,
    "open_price": 190.1,
    "previous_close": 189.5,
    "change": 2.84,
    "change_percent": 1.5,
    "profit_loss": {
      "cost_basis": 185.5,
      "quantity": 10,
      "unrealized_amount": 68.4,
      "unrealized_percent": 3.69
    },
    "provider_timestamp": "2026-05-01T09:30:00Z"
  },
  "meta": {
    "request_id": "4982d7ef-b1c7-4048-b50f-e76313361929",
    "fetched_at": "2026-05-01T09:30:01Z",
    "cached_until": "2026-05-01T09:30:11Z",
    "source": "yahoo-finance"
  }
}
```

### Backend Notes

- ถ้าไม่ส่ง `cost_basis` ให้ใช้ `change_percent` จาก market movement
- ถ้าส่ง `cost_basis` และ `quantity` ให้ backend คำนวณ P/L ทั้ง amount และ percent
- `display_name` ควรมาจาก market data จริง ไม่ควรบังคับให้ client ส่งเข้า API
- ใน code ปัจจุบัน `qty` ยังไม่ได้ใช้จริงในการ render แต่ API ควรรองรับไว้ให้ครบ

## 4. Air Quality

### Problem With Current Approach

ตัว action ปัจจุบัน scrape HTML จาก IQAir โดยตรง ซึ่งเปราะต่อการเปลี่ยน DOM และเปิดความเสี่ยงถ้าปล่อยให้ client ส่ง arbitrary URL

### Recommended Endpoint

`GET /api/v1/air-quality`

### Query Parameters

| Name            | Type   | Required | Example                             | Description                   |
| --------------- | ------ | -------- | ----------------------------------- | ----------------------------- |
| `provider`      | string | yes      | `iqair`                             | whitelist provider เท่านั้น   |
| `location_slug` | string | yes      | `th-en/thailand/bangkok/nong-khaem` | normalized location reference |

### Example Request

`GET /api/v1/air-quality?provider=iqair&location_slug=th-en/thailand/bangkok/nong-khaem`

### Example Response

```json
{
  "data": {
    "provider": "iqair",
    "location_slug": "th-en/thailand/bangkok/nong-khaem",
    "aqi_standard": "US",
    "aqi": 57,
    "category": "Moderate",
    "color": "#FF9B57",
    "measured_at": "2026-05-01T09:00:00Z"
  },
  "meta": {
    "request_id": "fcc317c9-ab9c-4a6d-b77b-cd10ca77009b",
    "fetched_at": "2026-05-01T09:30:02Z",
    "cached_until": "2026-05-01T10:30:02Z",
    "source": "iqair"
  }
}
```

### Migration Compatibility

ถ้าต้องรองรับ settings เดิมชั่วคราว อาจเพิ่ม endpoint compatibility:

`GET /api/v1/air-quality/by-url?provider=iqair&source_url=https://www.iqair.com/th-en/thailand/bangkok/nong-khaem`

แต่ไม่ควรใช้เป็น endpoint หลักระยะยาว

### Backend Notes

- backend ควรเป็นคน parse/slim HTML หรือเปลี่ยน provider ภายหลังโดยไม่กระทบ widget
- ควร whitelist เฉพาะ provider และ host ที่อนุญาต
- ควร normalize category เช่น `Good`, `Moderate`, `Unhealthy`

## 5. Weather

### Endpoint

`GET /api/v1/weather`

### Query Parameters

| Name           | Type    | Required | Example        | Description            |
| -------------- | ------- | -------- | -------------- | ---------------------- |
| `lat`          | number  | yes      | `13.72`        | latitude               |
| `lon`          | number  | yes      | `100.41`       | longitude              |
| `timezone`     | string  | no       | `Asia/Bangkok` | default `Asia/Bangkok` |
| `precip_hours` | integer | no       | `6`            | default `6`            |

### Example Request

`GET /api/v1/weather?lat=13.72&lon=100.41&timezone=Asia%2FBangkok&precip_hours=6`

### Example Response

```json
{
  "data": {
    "location": {
      "lat": 13.72,
      "lon": 100.41,
      "timezone": "Asia/Bangkok"
    },
    "current": {
      "temperature_c": 32,
      "apparent_temperature_c": 38,
      "weather_code": 2,
      "is_day": true,
      "icon_code": "04"
    },
    "precipitation_probability_next_hours": [10, 15, 20, 30, 40, 35],
    "provider_timestamp": "2026-05-01T09:30:00Z"
  },
  "meta": {
    "request_id": "58b1eabd-15a5-462a-bf87-c94a4cd5c0e5",
    "fetched_at": "2026-05-01T09:30:01Z",
    "cached_until": "2026-05-01T10:00:01Z",
    "source": "open-meteo"
  }
}
```

### Backend Notes

- backend ควร map `weather_code + is_day` เป็น `icon_code` หรือ `icon_url` ให้เลย เพื่อลด client-side dependency กับ AccuWeather
- ถ้าต้องการให้ REST API สะอาดขึ้นอีก ให้ host icon ผ่าน backend เอง เช่น `/api/v1/weather/icons/{icon_code}`
- `precipitation_probability_next_hours` ควรคืนตามจำนวนชั่วโมงที่ขอจริง

## Recommended Service Boundaries

ถ้าจะแยกเป็น service ภายใน backend ตามงาน แนะนำแบ่งแบบนี้:

| Service                 | Endpoints                          |
| ----------------------- | ---------------------------------- |
| `market-data-service`   | gold, forex, stocks                |
| `air-quality-service`   | air quality                        |
| `weather-service`       | weather                            |
| `network-agent-service` | single network diagnostic endpoint |

เหตุผล:

- `gold`, `forex`, `stocks` เป็น domain ตลาดการเงินเหมือนกัน ใช้ caching/rate-limit pattern คล้ายกัน
- `air-quality` เป็น scraping-heavy integration แยกออกมาจะดูแลง่ายกว่า
- `weather` มี geolocation และ weather code mapping ของตัวเอง
- `network-agent-service` ต้องรันใกล้ผู้ใช้จริงและมี security boundary ต่างจาก service อื่น

## Suggested Client Mapping

| Action                | New Internal API                                          |
| --------------------- | --------------------------------------------------------- | ---- |
| `gold-price`          | `GET /api/v1/commodities/gold/spot?quote_currency=USD     | THB` |
| `currency-rate`       | `GET /api/v1/forex/pairs/{from}-{to}`                     |
| `stock-price`         | `GET /api/v1/stocks/{symbol}/quote?cost_basis=&quantity=` |
| `air-quality`         | `GET /api/v1/air-quality?provider=iqair&location_slug=`   |
| `weather`             | `GET /api/v1/weather?lat=&lon=&timezone=&precip_hours=6`  |
| `network-diagnostics` | `POST /api/v1/network/ping`                               |

## Implementation Priorities

1. เริ่มจาก `weather`, `currency-rate`, `stock-price` ก่อน เพราะ upstream เป็น structured API อยู่แล้ว
2. ตามด้วย `gold-price` เพราะ schema เล็กและ migrate ง่าย
3. ตามด้วย `network-diagnostics` แต่ควรทำเป็น local agent service แยกจาก centralized backend
4. ปิดท้าย `air-quality` เพราะต้องออกแบบ normalization และ anti-fragile scraping layer ให้ดี

## Notes From Current Code

- `stock-price` มี input `qty` แต่ render ปัจจุบันยังใช้แค่ percent change เป็นหลัก
- `gold-price` เก็บ interval เป็นวินาที แต่ action อื่นหลายตัวเก็บเป็น milliseconds ควร normalize ตอน redesign client/API
- `air-quality` และ `weather` ใช้ refresh loop ฝั่ง plugin; เมื่อมี backend แล้วควรให้ backend ส่งข้อมูลที่ cache-ready กลับมาเพื่อลด upstream calls
- ถ้าจะเพิ่ม `network-diagnostics` จริง ควรตัดสินใจก่อนว่าจะรัน probe จาก local machine, gateway, หรือ sidecar agent เพราะผลลัพธ์ต่างกันมาก
