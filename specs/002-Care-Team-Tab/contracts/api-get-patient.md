# API Contract: GET /api/patients/:id

**Purpose**: Retrieve patient data including care team information

**Endpoint**: `GET /api/patients/{patientId}`

**Base URL**: `http://localhost:3000` (development)

---

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| patientId | string | Yes | Patient ID (e.g., "P001") |

### Query Parameters

None

### Headers

```
Content-Type: application/json
```

### Example Request

```http
GET /api/patients/P001 HTTP/1.1
Host: localhost:3000
Content-Type: application/json
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "P001",
    "name": "David Kumar",
    "age": 52,
    "gender": "Male",
    "primaryDiagnosis": "Type 2 Diabetes Mellitus",
    "conditions": ["Type 2 Diabetes Mellitus"],
    "careTeam": [
      {
        "name": "Dr. Sarah Mitchell",
        "role": "Primary Care Physician",
        "phone": "(555) 612-4789"
      },
      {
        "name": "Linda Torres",
        "role": "Certified Diabetes Educator",
        "phone": "(555) 612-4790"
      }
    ],
    "careEvents": [
      {
        "id": "ce001",
        "date": "2026-07-01",
        "category": "visit",
        "title": "Annual Check-up",
        "description": "Routine physical examination",
        "provider": "Dr. Sarah Mitchell",
        "status": "completed"
      }
    ],
    "messages": [
      {
        "id": "m1",
        "patientId": "P001",
        "providerId": "p1",
        "providerName": "Dr. Sarah Wilson",
        "providerSpecialty": "Primary Care",
        "content": "Your latest A1C results are in.",
        "timestamp": "2026-07-08T15:30:00Z",
        "isRead": false
      }
    ],
    "upcomingAppointments": [
      {
        "id": "apt001",
        "date": "2026-07-15",
        "time": "2:00 PM",
        "provider": "Dr. Sarah Mitchell",
        "specialty": "Primary Care",
        "type": "Follow-up",
        "location": "Main Clinic",
        "reason": "Diabetes Management"
      }
    ]
  }
}
```

### Error Response (404 Not Found)

```json
{
  "success": false,
  "error": "Patient not found"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Data Types

### CareTeamMember

```typescript
interface CareTeamMember {
  name: string;      // Provider name (e.g., "Dr. Sarah Mitchell")
  role: string;      // Professional role (e.g., "Primary Care Physician")
  phone: string;     // Contact phone number (e.g., "(555) 612-4789")
}
```

### Patient

```typescript
interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  primaryDiagnosis: string;
  conditions: string[];
  careTeam?: CareTeamMember[];  // Optional - may be undefined or empty array
  careEvents: CareEvent[];
  messages?: Message[];
  upcomingAppointments?: UpcomingAppointment[];
}
```

### ApiResponse

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## Implementation Notes

- **Care Team Field**: Optional. May be undefined, empty array, or populated array
- **Data Source**: Loaded from `public/patients.json`
- **Response Time Target**: ≤ 100ms (p95), ≤ 200ms (p99)
- **Caching**: Data loaded at server startup, no real-time updates
- **Authentication**: Not required for sample data (development)
- **Authorization**: Patient can only request their own data (production requirement)

---

## Usage in Frontend

```javascript
// Example: Load patient data on login
async function handleLogin(patientId) {
  try {
    const response = await fetch(`/api/patients/${patientId}`);
    const result = await response.json();
    
    if (result.success) {
      currentPatient = result.data;
      console.log('Care Team:', currentPatient.careTeam);
      renderCareTeamPage();
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

---

## Testing

### cURL Example

```bash
curl http://localhost:3000/api/patients/P001 \
  -H "Content-Type: application/json"
```

### Expected cURL Response

```json
{
  "success": true,
  "data": {
    "id": "P001",
    "name": "David Kumar",
    "careTeam": [...]
  }
}
```

---

## Backward Compatibility

This endpoint is **unchanged** by the Care Team Tab feature. The `careTeam` field was already present. The feature simply renders this existing field on a new UI tab.

**No breaking changes** to API contracts.
