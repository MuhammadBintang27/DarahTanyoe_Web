# 🎨 Refactored Code Structure - DarahTanyoe Web

## ✅ Modular & Component-Based Architecture

Kode sudah di-refactor menjadi lebih modular dan maintainable dengan struktur sebagai berikut:

### 📁 Struktur Folder Baru

```
src/
├── types/
│   └── bloodRequest.ts          # All TypeScript interfaces & types
├── constants/
│   └── bloodRequest.ts          # Status mapping, blood types constants
├── utils/
│   └── formatters.ts            # Date formatting, ID padding utilities
├── hooks/
│   └── useBloodRequests.ts      # Custom hooks for data fetching
├── components/
│   ├── bloodRequest/
│   │   ├── StatusBadge.tsx      # Status badge component
│   │   ├── FilterSection.tsx    # Filter UI component
│   │   ├── RequestTable.tsx     # Table component
│   │   ├── RejectModal.tsx      # Reject confirmation modal
│   │   └── CreateRequestModal.tsx # Create request form modal
│   └── common/
│       └── Pagination.tsx       # Reusable pagination component
└── app/
    └── permintaan/
        └── page.tsx             # Main page (now much cleaner!)
```

---

## 🎯 Role-Based Features

### 🏥 **Hospital (RS)**
- ✅ Dapat **membuat** permintaan darah baru
- ✅ Tombol "Buat Permintaan" visible
- ✅ Dapat melihat status permintaan mereka
- ❌ **TIDAK** bisa approve/reject

### 🏥 **PMI**  
- ✅ Dapat **melihat** semua permintaan
- ✅ Dapat **approve** permintaan (dengan auto-check stok)
- ✅ Dapat **reject** permintaan dengan alasan
- ✅ Tombol Terima/Tolak visible untuk status pending
- ❌ **TIDAK** bisa membuat permintaan baru

---

## 🧩 Component Breakdown

### 1. **StatusBadge.tsx** (35 lines)
```tsx
// Reusable status badge component
<StatusBadge status="pending" />
<StatusBadge status="approved" />
```
- Props: `status`, `className`
- Auto-maps to correct colors

### 2. **FilterSection.tsx** (77 lines)
```tsx
<FilterSection
  filters={filters}
  partners={partners}
  onFilterChange={setFilters}
  onReset={handleResetFilters}
/>
```
- Self-contained filter UI
- Date, Blood Type, Location filters
- Reset button included

### 3. **RequestTable.tsx** (134 lines)
```tsx
<RequestTable
  data={currentData}
  loading={loading}
  userRole={userRole}
  onApprove={handleApprove}
  onReject={handleReject}
/>
```
- Role-aware: shows actions based on `userRole`
- Hospital: no action buttons
- PMI: approve/reject buttons for pending requests

### 4. **RejectModal.tsx** (50 lines)
```tsx
<RejectModal
  isOpen={showModal}
  loading={loading}
  onClose={handleClose}
  onConfirm={handleReject}
/>
```
- Controlled modal component
- Handles rejection reason input

### 5. **CreateRequestModal.tsx** (150 lines)
```tsx
<CreateRequestModal
  isOpen={showModal}
  loading={loading}
  partners={partners}
  onClose={handleClose}
  onSubmit={handleCreateRequest}
/>
```
- Complete form for creating blood requests
- Validation included
- Only shown to Hospital role

### 6. **Pagination.tsx** (48 lines)
```tsx
<Pagination
  currentPage={1}
  totalPages={10}
  totalItems={100}
  itemsPerPage={10}
  onPageChange={setPage}
/>
```
- Fully reusable pagination component
- Auto-hides if only 1 page

---

## 🔧 Custom Hooks

### **useBloodRequests(userId, userRole)**
```tsx
const { data, loading, refetch } = useBloodRequests(user?.id, 'hospital');
```
- Auto-detects correct endpoint based on role
- Hospital: `/bloodReq/:userId`
- PMI: `/bloodReq/partner/:userId`
- Returns: data, loading state, refetch function

### **usePartners()**
```tsx
const { partners, loading } = usePartners();
```
- Fetches all PMI locations
- Used in dropdowns

---

## 📝 Types & Constants

### **types/bloodRequest.ts**
- `BloodRequest` interface
- `RequestStatus` type
- `Partner` interface
- `FilterState` interface
- `CreateRequestForm` interface
- `UserRole` type

### **constants/bloodRequest.ts**
- `STATUS_MAP` - All status with colors
- `BLOOD_TYPES` - A+, A-, B+, etc.

### **utils/formatters.ts**
- `formatDate()` - Format to "9 Mar 2025"
- `formatDateTime()` - With time
- `formatDateToAPI()` - Format to API format "d-M-yyyy H:mm"
- `padId()` - "1" → "00001"

---

## 🎯 Benefits

### Before (Monolithic)
❌ 542 lines in one file  
❌ All logic mixed together  
❌ Hard to maintain  
❌ No reusability  
❌ Difficult to test  

### After (Modular)
✅ Main page: ~180 lines (clean!)  
✅ Separated concerns  
✅ Reusable components  
✅ Easy to maintain  
✅ Testable components  
✅ Better TypeScript support  

---

## 🚀 Usage Example

```tsx
// Main page is now super clean!
const Permintaan = () => {
  const { user } = useAuth();
  const userRole = user?.user_type === 'hospital' ? 'hospital' : 'pmi';
  
  const { data, refetch } = useBloodRequests(user?.id, userRole);
  const { partners } = usePartners();

  return (
    <div>
      {userRole === 'hospital' && <CreateButton />}
      <FilterSection {...filterProps} />
      <RequestTable userRole={userRole} {...tableProps} />
      <Pagination {...paginationProps} />
    </div>
  );
};
```

---

## 🔐 Role Detection

```tsx
// Automatically detect user role from auth context
const userRole = user?.user_type === 'hospital' ? 'hospital' : 'pmi';

// Conditional rendering based on role
{userRole === 'hospital' && <CreateRequestButton />}
{userRole === 'pmi' && <ApproveRejectButtons />}
```

---

## 📊 Performance

- ✅ Code splitting ready
- ✅ Lazy loading components possible
- ✅ Better tree-shaking
- ✅ Smaller bundle size
- ✅ Faster compile time

---

## 🧪 Testing Ready

Each component can now be tested independently:
```tsx
// Easy to test
<StatusBadge status="pending" />
<FilterSection filters={mockFilters} />
<RequestTable data={mockData} userRole="pmi" />
```

---

## 🎉 Summary

✅ **Modular** - Setiap component punya file sendiri  
✅ **Reusable** - Component bisa dipake di page lain  
✅ **Maintainable** - Gampang update & debug  
✅ **Type-Safe** - Full TypeScript support  
✅ **Role-Based** - Hospital buat, PMI approve  
✅ **Clean Code** - Main page cuma 180 lines!

Kode sekarang sudah jauh lebih professional dan scalable! 🚀
