# Panduan Integrasi Microservices

Dokumen ini menjelaskan cara menggunakan **API Management System (Service A)**
sebagai pusat otentikasi untuk service lain (misalnya **Service B**).

## Logika Workflow

1. **Client** mengirimkan HTTP Request ke **Service B** dengan menyertakan
   header `X-API-KEY`.
2. **Service B** tidak melakukan validasi ke database sendiri. Sebaliknya,
   **Service B** meneruskan Key tersebut ke **Service A** melalui endpoint
   `/api/v1/validate`.
3. **Service A** memvalidasi Key (cek database, expired time, status aktif,
   dll).
4. Jika Valid, Service A mengembalikan JSON `{ valid: true, user_id: 123 }`.
5. **Service B** menerima respon tersebut, lalu melanjutkan proses bisnisnya
   untuk User ID 123.

## Endpoint Validasi

- **URL**: `http://localhost:8080/api/v1/validate`
- **Method**: `GET`
- **Header**: `X-API-KEY: sk_your_key_here`

### Response Sukses (200 OK)

```json
{
    "valid": true,
    "user_id": 5,
    "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Response Gagal (401/403)

```json
{
    "error": "Invalid API Key"
}
```

_Atau "API Key Expired", "API Key Revoked", dll._

---

## Contoh Implementasi di Service B

Berikut adalah contoh kode jika **Service B** dibangun menggunakan Node.js
(Express/Hono/Bun).

### Node.js / Bun (Service B)

```javascript
const SERVICE_A_URL = "http://localhost:8080/api/v1/validate";

async function middlewareOtorisasi(req, res, next) {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
        return res.status(401).json({ error: "API Key Missing" });
    }

    try {
        // Validasi ke Service A
        const response = await fetch(SERVICE_A_URL, {
            method: "GET",
            headers: { "X-API-KEY": apiKey },
        });

        if (!response.ok) {
            // Key tidak valid / Kadaluarsa / Revoked
            return res.status(401).json({ error: "Unauthorized Key" });
        }

        const data = await response.json();

        // Simpan User ID untuk diproses di controller Service B
        req.userId = data.user_id;

        console.log(`Request valid dari User ID: ${data.user_id}`);
        next();
    } catch (error) {
        console.error("Gagal menghubungi Auth Service:", error);
        res.status(500).json({ error: "Auth Service Unavailable" });
    }
}

// Gunakan middleware di route Service B
// app.use(middlewareOtorisasi);
```

### Python (Flask Example)

```python
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)
SERVICE_A_URL = "http://localhost:8080/api/v1/validate"

def check_auth(api_key):
    try:
        response = requests.get(
            SERVICE_A_URL, 
            headers={"X-API-KEY": api_key}
        )
        if response.status_code == 200:
            return response.json() # Returns dict with user_id
        return None
    except:
        return None

@app.route('/protected-resource')
def protected():
    api_key = request.headers.get('X-API-KEY')
    if not api_key:
        return jsonify({"error": "Missing Key"}), 401
    
    auth_data = check_auth(api_key)
    if not auth_data:
        return jsonify({"error": "Unauthorized"}), 401
        
    return jsonify({
        "message": "Success", 
        "data_for_user": auth_data['user_id']
    })
```

### cURL (Terminal)

Untuk sekadar memvalidasi Key tanpa membuat kode program, gunakan perintah ini:

```bash
curl -X GET http://localhost:8080/api/v1/validate -H "X-API-KEY: sk_your_key_here"
```

Response jika valid:

```json
{ "valid": true, "user_id": 1, "timestamp": "2025-01-02T06:22:00.000Z" }
```
