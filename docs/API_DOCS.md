# API Documentation

Dokumentasi lengkap untuk endpoint API yang tersedia di sistem API Management
ini.

Base URL: `http://localhost:8080` (Default)

## 1. System Health

Endpoint untuk mengecek status layanan. Biasanya digunakan oleh Load Balancer
atau Docker Healthcheck.

### `GET /health`

- **Auth**: Tidak Perlu (Public)
- **Header**: -

**Contoh cURL:**

```bash
curl http://localhost:8080/health
```

**Response (200 OK):**

```json
{
  "status": "ok",
  "uptime": 123.45
}
```

---

## 2. API v1 Service

Endpoint utama yang dilindungi oleh API Key sistem ini.

### `GET /api/v1/resource`

Contoh resource yang dilindungi.

- **Auth**: API Key (`X-API-KEY`)
- **Header**: `X-API-KEY: <YOUR_API_KEY>`

**Contoh cURL:**

```bash
curl http://localhost:8080/api/v1/resource \
  -H "X-API-KEY: sk_your_secure_key"
```

**Response (200 OK):**

```json
{
  "message": "Access Granted",
  "user_id": 5
}
```

**Error (401 Unauthorized):**

```json
{ "error": "Invalid API Key" }
```

_(Atau Expired / Revoked / Missing)_

---

## 3. Validation Service (Integration)

Endpoint khusus untuk service lain (Microservices) yang ingin memvalidasi apakah
sebuah API Key valid atau tidak, tanpa mendapatkan error 401 jika tidak valid.
Selalu mereturn JSON 200 OK.

### `GET /api/v1/validate`

- **Auth**: API Key (`X-API-KEY`) - Tapi tidak melempar error HTTP, melainkan
  status JSON.
- **Header**: `X-API-KEY: <KEY_TO_CHECK>`

**Contoh cURL:**

```bash
curl http://localhost:8080/api/v1/validate \
  -H "X-API-KEY: sk_checking_this_key"
```

**Response Valid (200 OK):**

```json
{
  "valid": true,
  "role": "user",
  "timestamp": "2025-01-01T10:00:00.000Z"
}
```

**Response Invalid (200 OK):**

```json
{
  "valid": false,
  "error": "Invalid API Key"
}
```

---

## 4. User Identity Check

Endpoint untuk melihat detail identitas pemilik API Key.

### `GET /api/v1/users/:username`

Memungkinkan pemilik Key melihat data dirinya sendiri, ATAU Admin melihat data
user lain.

- **Auth**: API Key (`X-API-KEY`)
- **Permission**:
  - Jika `Username` di URL == `Owner Username Key`: **Boleh**.
  - Jika `Owner Key` adalah `admin`: **Boleh** (bisa cek siapa saja).
  - Lainnya: **Forbidden (403)**.

**Contoh cURL (Cek Diri Sendiri):**

```bash
# User 'budi123' mengecek dirinya sendiri
curl http://localhost:8080/api/v1/users/budi123 \
  -H "X-API-KEY: sk_user_key"
```

**Contoh cURL (Admin Cek User Lain):**

```bash
# Admin mengecek User 'bunga99'
curl http://localhost:8080/api/v1/users/bunga99 \
  -H "X-API-KEY: sk_admin_key"
```

**Response Sukses (200 OK):**

```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "name": "Budi Santoso",
    "username": "budi123",
    "status": "active",
    "role": "user"
  }
}
```

**Error (403 Forbidden):**

```json
{ "error": "Unauthorized: Access denied to this user" }
```
