# 🔔 Quick Start: Notification Bell

## ✅ What's Been Done

1. **Backend (Already Complete)**
   - ✅ Database schema with notifications table
   - ✅ API endpoints for notifications
   - ✅ Real-time notification service
   - ✅ Firebase Cloud Messaging setup

2. **Frontend (Just Implemented)**
   - ✅ useNotifications hook for data fetching
   - ✅ Notification bell with badge in header
   - ✅ Dropdown notification panel
   - ✅ Toast notifications for real-time alerts
   - ✅ Full notifications page (/notifications)
   - ✅ Supabase client configuration
   - ✅ Integrated into existing Header & Notif components

## 📦 Install Dependencies

```bash
cd DarahTanyoe_Web
npm install @supabase/supabase-js date-fns sonner
```

## ⚙️ Configuration

### 1. Create `.env.local` file

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Get these values from your Supabase dashboard:
- https://supabase.com/dashboard → Your Project → Settings → API

### 2. Verify User Context

Make sure your `authContext` provides:
- `user.institution_id` or `user.id` for institution users
- This is used to fetch notifications for the logged-in institution

## 🚀 Run the App

```bash
npm run dev
```

Open http://localhost:3000

## 🧪 Test It Out

### Method 1: Test via Backend API

```bash
# From DarahTanyoe_API directory
cd ../DarahTanyoe_API
npm start

# Then send test notification
curl -X POST http://localhost:3000/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "institutionId": "your-institution-id",
    "title": "Test Notification",
    "message": "This is a test notification!",
    "type": "system",
    "priority": "high"
  }'
```

### Method 2: Insert Directly to Database

Via Supabase Dashboard → SQL Editor:

```sql
INSERT INTO notifications (
  institution_id,
  title,
  message,
  type,
  priority,
  is_read,
  created_at
) VALUES (
  'your-institution-id',
  'Test Notification',
  'This notification was created directly in the database',
  'system',
  'medium',
  false,
  NOW()
);
```

### Method 3: Trigger from Blood Request

Create a blood request from a hospital → PMI will receive notification automatically!

## 🎯 What You Should See

1. **Bell Icon in Header**
   - Red filled bell icon in top right
   - Badge with number if unread notifications exist
   - Animates when new notification arrives

2. **Click Bell → Dropdown Opens**
   - Shows list of notifications
   - Each notification shows:
     - Icon based on type (🩸 request, 💉 donation, etc.)
     - Title and message
     - Time ago (e.g., "5 menit yang lalu")
     - Priority indicator
     - Unread dot (blue) if not read
   - "Tandai semua" button to mark all as read
   - "Lihat semua notifikasi" link at bottom

3. **Toast Popup**
   - When new notification arrives in real-time
   - Appears in top-right corner
   - Shows for 5 seconds (10s if critical)
   - Click to navigate to action URL
   - Auto-dismisses

4. **Full Page (/notifications)**
   - Visit `/notifications` for full list
   - Search notifications
   - Filter by read/unread
   - Larger card view

## 🔄 How Real-time Works

The system uses **Supabase Real-time** subscriptions:

```typescript
// Automatically listens for new notifications
supabase
  .channel('notifications')
  .on('INSERT', callback)
  .subscribe()
```

When a new notification is inserted:
1. ⚡ Real-time subscription fires
2. 🔔 Badge count updates automatically
3. 🎉 Toast notification appears
4. 📝 Dropdown list updates

## 🐛 Troubleshooting

### Badge not showing?
- Check console for errors
- Verify `institutionId` is correct: `console.log(user)`
- Check network tab for API calls to Supabase

### Real-time not working?
- Verify Supabase Real-time is enabled in dashboard
- Check browser console for subscription errors
- Make sure `.env.local` has correct values

### "Module not found: date-fns"?
- Run `npm install` again
- Delete `node_modules` and run `npm install`

### Toast not appearing?
- Check if `NotificationToast` is in layout
- Verify `sonner` is installed
- Check browser console for errors

## 📁 Files Changed/Created

### Created:
- ✅ `src/hooks/useNotifications.ts` - Main notification hook
- ✅ `src/components/NotificationBell.tsx` - Standalone bell component
- ✅ `src/components/NotificationToast.tsx` - Toast component
- ✅ `src/app/notifications/page.tsx` - Full page view
- ✅ `src/utils/supabase.ts` - Supabase client
- ✅ `.env.example` - Environment template
- ✅ `NOTIFICATION_BELL_GUIDE.md` - Full documentation

### Modified:
- ✅ `src/components/notif/notif.tsx` - Enhanced with real notifications
- ✅ `src/components/header/header.tsx` - Added badge to bell
- ✅ `src/components/layout/mainLayout.tsx` - Added toast component
- ✅ `package.json` - Added dependencies

## ✨ Features Included

- [x] Real-time notification updates
- [x] Unread count badge with animation
- [x] Mark as read (individual & all)
- [x] Toast notifications for new items
- [x] Priority-based styling
- [x] Type-based icons
- [x] Indonesian time formatting
- [x] Search & filter
- [x] Full page view
- [x] Click to navigate (action URLs)
- [x] Auto-refresh unread count
- [x] Responsive design
- [x] Loading states
- [x] Error handling
- [x] Outside click to close

## 🎊 Next Steps

1. **Test with real blood requests** - Create a request and see notifications
2. **Customize styling** - Adjust colors in components to match your theme
3. **Add more notification types** - Stock alerts, campaign updates, etc.
4. **Setup push notifications** - Configure Firebase for mobile push (optional)
5. **Add notification preferences** - Let users customize what they want to receive

## 📚 Documentation

- Full guide: `NOTIFICATION_BELL_GUIDE.md`
- Backend docs: `../DarahTanyoe_API/NOTIFICATION_SYSTEM.md`
- API workflow: `../DarahTanyoe_API/NOTIFICATION_WORKFLOW_DIAGRAM.md`

---

**Done! 🎉** Your notification system is ready to use!

Bell icon → Click → See notifications → Mark as read → Enjoy! 🔔
