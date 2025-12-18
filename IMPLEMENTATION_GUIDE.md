# Implementasi Workflow Permintaan Darah - DarahTanyoe Web

## ✅ Fitur yang Sudah Diimplementasikan

### 🎨 **Desain & UI/UX**
- ✅ Background gradient merah sesuai gambar (#C85A54 to #AB4545)
- ✅ Card putih dengan shadow untuk tabel
- ✅ Status badges dengan warna yang sesuai:
  - Pending: Kuning
  - Approved: Hijau
  - In Fulfillment: Biru
  - Rejected: Merah
  - Ready to Pick Up: Cyan
  - Confirmed: Orange
  - Completed: Abu-abu
- ✅ Tombol "Buat Permintaan" dengan warna hijau (#48C585)
- ✅ Filter section dengan dropdown yang responsive
- ✅ Pagination untuk data banyak

### 🔄 **Workflow Approval PMI**
- ✅ **Approve Permintaan** - Tombol "Terima" untuk menyetujui
  - Otomatis cek stok darah
  - Jika stok cukup → status "approved" + generate unique code
  - Jika stok tidak cukup → status "in_fulfillment" + notifikasi
- ✅ **Reject Permintaan** - Tombol "Tolak" dengan modal untuk alasan
  - Input textarea untuk alasan penolakan
  - Status berubah menjadi "rejected"
  - Kirim notifikasi ke rumah sakit
- ✅ **Indikator Status**
  - "Siap Diambil" untuk status approved
  - "Sedang Dipenuhi" untuk status in_fulfillment
  - Badge status dengan warna berbeda

### 📝 **Fitur CRUD**
- ✅ **Buat Permintaan Baru** - Modal form lengkap dengan:
  - Nama Pasien
  - No. Telepon
  - Golongan Darah (dropdown)
  - Jumlah Kantong
  - Lokasi PMI (dropdown dari API)
  - Batas Waktu (datetime picker)
  - Alasan Permintaan (textarea)
- ✅ **Lihat Daftar Permintaan** - Tabel dengan kolom:
  - ID (auto-increment dengan padding)
  - Nama Pasien
  - Golongan Darah
  - Jumlah Darah (fulfilled/total)
  - Tanggal
  - Lokasi PMI
  - Penanggungjawab
  - Status
  - Aksi

### 🔍 **Filter & Search**
- ✅ Filter berdasarkan:
  - Tanggal (date picker)
  - Golongan Darah (dropdown)
  - Lokasi PMI (dropdown dinamis)
- ✅ Tombol Reset Filter
- ✅ Real-time filtering

### 🔔 **Notifikasi & Feedback**
- ✅ Toast notifications menggunakan react-hot-toast
- ✅ Loading states pada semua tombol
- ✅ Disabled state saat processing
- ✅ Success/Error messages yang informatif

### 📊 **Data Management**
- ✅ Pagination (10 items per page)
- ✅ Navigation buttons (Previous/Next)
- ✅ Page indicator
- ✅ Empty state dengan icon dan pesan
- ✅ Hover effects pada tabel rows

### 🔌 **Integrasi API**
- ✅ `GET /bloodReq/partner/:userMitraId` - Fetch all requests
- ✅ `PATCH /partners/approve/:requestId` - Approve request
- ✅ `PATCH /partners/reject/:requestId` - Reject request with reason
- ✅ `POST /bloodReq/create` - Create new request
- ✅ `GET /partners` - Fetch all PMI locations

---

## 🎯 Cara Menggunakan

### 1. Setup Environment
Pastikan file `.env.local` sudah dibuat dengan:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Jalankan Aplikasi Web
```bash
cd DarahTanyoe_Web
npm install
npm run dev
```

### 3. Login sebagai PMI
- Akses: http://localhost:3001/login
- Login dengan akun PMI

### 4. Kelola Permintaan
- **Lihat Daftar**: Otomatis muncul di halaman /permintaan
- **Filter Data**: Gunakan filter di atas tabel
- **Approve**: Klik tombol "Terima" (hijau)
  - Sistem otomatis cek stok
  - Jika cukup → status "Approved" + dapat unique code
  - Jika tidak cukup → status "Fulfillment"
- **Reject**: Klik tombol "Tolak" (merah)
  - Masukkan alasan penolakan
  - Klik "Tolak Permintaan"
- **Buat Permintaan**: Klik tombol "Buat Permintaan"
  - Isi semua field yang required
  - Submit form

---

## 🎨 Design System

### Color Palette
```css
Primary: #C85A54 (Merah)
Primary Dark: #AB4545 (Merah Gelap)
Secondary: #48C585 (Hijau)
Accent: #E9B824 (Kuning)
Background: linear-gradient(135deg, #C85A54 0%, #AB4545 100%)
```

### Status Colors
- **Pending**: Yellow (#FEF3C7 bg, #92400E text)
- **Approved**: Green (#D1FAE5 bg, #065F46 text)
- **Fulfillment**: Blue (#DBEAFE bg, #1E40AF text)
- **Rejected**: Red (#FEE2E2 bg, #991B1B text)
- **Ready**: Cyan (#CFFAFE bg, #155E75 text)
- **Confirmed**: Orange (#FED7AA bg, #9A3412 text)
- **Completed**: Gray (#E5E7EB bg, #1F2937 text)

---

## 📱 Responsive Design
- ✅ Table dengan horizontal scroll pada mobile
- ✅ Filter section wrap pada layar kecil
- ✅ Modal responsive dengan max-width
- ✅ Button sizes yang sesuai untuk touch

---

## 🔐 Security & Validation
- ✅ Protected routes dengan ProtectedRoute component
- ✅ Form validation (required fields)
- ✅ Input sanitization
- ✅ Error handling dengan try-catch
- ✅ Loading states untuk prevent double-submit

---

## 📈 Next Steps (Optional)
- [ ] Export to PDF/Excel
- [ ] Print functionality
- [ ] Real-time updates dengan WebSocket
- [ ] Advanced search dengan multiple filters
- [ ] Bulk actions (approve/reject multiple)
- [ ] Activity log/history
- [ ] Email notifications
- [ ] SMS notifications

---

## 🎉 Status Implementasi
✅ **100% Complete** - Semua fitur workflow approval sudah berfungsi dengan baik!

Design sudah mengikuti mockup yang diberikan dengan palette warna yang sama.
