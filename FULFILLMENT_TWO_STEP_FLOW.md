# 🔔 Two-Step Fulfillment Notification Flow

## Overview
The fulfillment campaign creation now uses a **two-step process**:
1. **Step 1**: Search eligible donors & create campaign (WITHOUT notifications)
2. **Step 2**: Show list of eligible donors with slider, then send notifications to selected count

## API Endpoints

### Step 1: Search and Create Campaign
**POST** `/fulfillment/search-and-create`

**Request Body:**
```json
{
  "blood_request_id": "req-123",
  "pmi_id": "pmi-456",
  "patient_name": "John Doe",
  "blood_type": "A+",
  "quantity_needed": 4,
  "urgency_level": "high",        // optional: 'low'|'medium'|'high'|'critical'
  "search_radius_km": 20,         // optional: default 20
  "target_donors": 100            // optional: max donors to search
}
```

**Response (Success 200):**
```json
{
  "status": "success",
  "data": {
    "fulfillment_id": "fulfillment-123",
    "campaign_id": "campaign-456",
    "eligible_donors_count": 50,
    "eligible_donors": [
      {
        "donor_id": "donor-1001",
        "distance_km": 2.5,
        "donation_score": 85,
        "blood_type": "A+",
        "last_donation_date": "2025-11-15"
      },
      {
        "donor_id": "donor-1002",
        "distance_km": 3.2,
        "donation_score": 78,
        "blood_type": "A+",
        "last_donation_date": "2025-10-20"
      }
      // ... more donors sorted by distance (nearest first)
    ],
    "pmi_info": {
      "id": "pmi-456",
      "institution_name": "PMI Kota Jakarta",
      "address": "Jl. Gatot Subroto No. 1"
    },
    "patient_name": "John Doe",
    "blood_type": "A+",
    "quantity_needed": 4,
    "message": "Ditemukan 50 donor potensial. Pilih jumlah yang akan dikirim notifikasi."
  }
}
```

**Database State After Step 1:**
- ✅ `fulfillment_requests` created with status='donors_found'
- ✅ `blood_campaigns` created with type='fulfillment', status='active'
- ✅ `donor_confirmations` created with status='pending_notification' (NOT notified yet)
- ❌ Notifications NOT sent yet

---

### Step 2: Send Notifications to Selected Donors
**POST** `/fulfillment/:campaign_id/send-notifications`

**Request Body:**
```json
{
  "campaign_id": "campaign-456",
  "fulfillment_id": "fulfillment-123",
  "donor_count": 10                // How many of the nearest donors to notify
}
```

**Response (Success 200):**
```json
{
  "status": "success",
  "data": {
    "campaign_id": "campaign-456",
    "fulfillment_id": "fulfillment-123",
    "notified_count": 10,
    "total_selected": 10,
    "message": "Notifikasi berhasil dikirim ke 10 dari 10 donor terpilih"
  }
}
```

**Database State After Step 2:**
- ✅ `donor_confirmations` updated: status='pending_notification' → 'pending'
- ✅ `notification_id` populated for each notified donor
- ✅ `notified_at` timestamp set
- ✅ Notifications sent to selected donors

---

## UI Implementation Example

### Component Structure (Next.js TypeScript)

```typescript
// components/FulfillmentFlow.tsx

interface EligibleDonor {
  donor_id: string;
  distance_km: number;
  donation_score: number;
  blood_type: string;
}

interface Step1Response {
  fulfillment_id: string;
  campaign_id: string;
  eligible_donors_count: number;
  eligible_donors: EligibleDonor[];
  message: string;
}

export function FulfillmentFlow() {
  const [step, setStep] = useState<'initial' | 'select' | 'done'>('initial');
  const [loading, setLoading] = useState(false);
  const [eligibleDonors, setEligibleDonors] = useState<Step1Response | null>(null);
  const [selectedDonorCount, setSelectedDonorCount] = useState(10);

  // STEP 1: Search and create campaign
  const handleSearchAndCreate = async (formData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/fulfillment/search-and-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setEligibleDonors(result.data);
      setSelectedDonorCount(Math.min(10, result.data.eligible_donors_count));
      setStep('select');
    } catch (error) {
      console.error('Error searching donors:', error);
      // Show error toast
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Send notifications
  const handleSendNotifications = async () => {
    if (!eligibleDonors) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/fulfillment/${eligibleDonors.campaign_id}/send-notifications`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaign_id: eligibleDonors.campaign_id,
            fulfillment_id: eligibleDonors.fulfillment_id,
            donor_count: selectedDonorCount
          })
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setStep('done');
      // Show success toast
    } catch (error) {
      console.error('Error sending notifications:', error);
      // Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fulfillment-flow">
      {step === 'initial' && (
        <FulfillmentForm onSubmit={handleSearchAndCreate} loading={loading} />
      )}

      {step === 'select' && eligibleDonors && (
        <div className="donor-selection">
          <h2>Pilih Jumlah Donor untuk Notifikasi</h2>
          
          {/* Display found count */}
          <div className="info-box">
            <p>✅ Ditemukan <strong>{eligibleDonors.eligible_donors_count}</strong> donor potensial</p>
            <p>📍 PMI: {eligibleDonors.pmi_info.institution_name}</p>
          </div>

          {/* Slider */}
          <div className="slider-section">
            <label>Jumlah Donor yang Akan Dikirim Notifikasi</label>
            <input
              type="range"
              min="1"
              max={eligibleDonors.eligible_donors_count}
              value={selectedDonorCount}
              onChange={(e) => setSelectedDonorCount(parseInt(e.target.value))}
              className="slider"
            />
            <div className="slider-value">
              <span className="big-number">{selectedDonorCount}</span>
              <span className="small-text">dari {eligibleDonors.eligible_donors_count} donor</span>
            </div>
          </div>

          {/* Preview of selected donors */}
          <div className="donor-preview">
            <h3>Preview Donor yang Akan Menerima Notifikasi</h3>
            <div className="donor-list">
              {eligibleDonors.eligible_donors
                .slice(0, selectedDonorCount)
                .map((donor, idx) => (
                  <div key={donor.donor_id} className="donor-item">
                    <span className="badge">{idx + 1}</span>
                    <span className="distance">{donor.distance_km.toFixed(1)} km</span>
                    <span className="score">Skor: {donor.donation_score}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={handleSendNotifications}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Mengirim...' : `Kirim Notifikasi ke ${selectedDonorCount} Donor`}
          </button>
        </div>
      )}

      {step === 'done' && eligibleDonors && (
        <div className="success-screen">
          <h2>✅ Kampanye Berhasil Dibuat</h2>
          <p>Notifikasi telah dikirim ke {selectedDonorCount} donor terdekat</p>
          <p className="campaign-id">Campaign ID: {eligibleDonors.campaign_id}</p>
          <button onClick={() => setStep('initial')} className="btn-secondary">
            Buat Kampanye Baru
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ FULFILLMENT CAMPAIGN CREATION - TWO STEP PROCESS                │
└─────────────────────────────────────────────────────────────────┘

STEP 1: Search & Create Campaign
═══════════════════════════════════════════════════════════════════
  User Input (Blood Request Details)
         │
         ▼
  POST /fulfillment/search-and-create
         │
         ├─> Query PMI location
         ├─> Find eligible donors (DB function)
         ├─> Create blood_campaigns record (type='fulfillment')
         ├─> Create donor_confirmations (status='pending_notification')
         │
         ▼
  ✅ Response: List of eligible donors
  ❌ Notifications NOT sent


STEP 2: Select & Send Notifications
═══════════════════════════════════════════════════════════════════
  User adjusts slider to select count
         │
         ▼
  POST /fulfillment/{campaign_id}/send-notifications
         │
         ├─> Query top N donors (sorted by distance)
         ├─> Send notifications to each
         ├─> Update donor_confirmations (pending_notification → pending)
         │
         ▼
  ✅ Response: Confirmation of notifications sent
  ✅ Donors receive push notifications


DONOR_CONFIRMATIONS Status Progression:
═══════════════════════════════════════════════════════════════════
  'pending_notification'  ──► Created in DB, awaiting notification
         │
         ├─ [Step 2 triggered]
         │
         ▼
  'pending'               ──► Notification sent, waiting for donor response
         │
         ├─ [Donor confirms]     ├─ [Donor rejects]
         │                       │
         ▼                       ▼
     'confirmed'            'rejected'
         │                       (end)
         ├─ [PMI verifies code]
         │
         ▼
     'code_verified'
         │
         ├─ [Donation completed]
         │
         ▼
     'completed'
```

---

## Error Handling

### Step 1 Errors:
- 400: Missing required fields
- 400: PMI not found
- 400: PMI location not set
- 400: Fulfillment already exists for this blood request
- 500: Failed to create campaign

### Step 2 Errors:
- 400: Invalid campaign_id or fulfillment_id
- 400: donor_count < 1
- 400: Fulfillment request not found
- 400: No pending donors found
- 500: Failed to send notifications

---

## Database Constraints & Rules

### Enum: `confirmation_status`
```
'pending_notification'  → Created, not yet notified
'pending'              → Notified, awaiting response
'confirmed'            → Donor confirmed
'code_verified'        → PMI verified code
'completed'            → Donation complete
'rejected'             → Donor rejected
'expired'              → Code expired
'failed'               → Donation failed
```

### Constraints:
- `donor_confirmations.donor_id` + `fulfillment_request_id` = unique per request
- `donor_confirmations.unique_code` = unique globally (generated on confirm)
- `blood_campaigns.type` IN ('event', 'fulfillment')
- `blood_campaigns.status` = 'active' (for fulfillment campaigns)

---

## Backward Compatibility

The legacy endpoint still works:
```
POST /fulfillment/
```

This endpoint now:
1. Calls `searchAndCreateCampaign()` internally
2. Auto-calls `sendNotificationsToSelectedDonors()` with all donors
3. Returns the same structure as before

This ensures existing integrations continue to work without modification.

---

## Implementation Checklist

- [ ] Create migration: `003_add_pending_notification_status.sql`
- [ ] Deploy migration to Supabase
- [ ] Verify `searchAndCreateCampaign` endpoint works
- [ ] Verify `sendNotificationsToSelectedDonors` endpoint works
- [ ] Create React component with slider UI
- [ ] Implement Step 1 form with error handling
- [ ] Implement donor selection with slider
- [ ] Implement Step 2 notification trigger
- [ ] Add success/error toasts
- [ ] Test with real blood request creation
- [ ] Test slider with various donor counts
- [ ] Verify notifications are sent only after Step 2
- [ ] Test edge cases (0 donors, max donors, cancel flow)
