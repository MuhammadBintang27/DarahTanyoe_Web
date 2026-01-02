# Notification Bell Implementation Guide

## 📌 Overview
Complete notification system with real-time updates for DarahTanyoe Web Dashboard.

## 🎯 Features Implemented

### 1. **NotificationBell Component** (`components/NotificationBell.tsx`)
- Bell icon with animated badge showing unread count
- Dropdown panel with notification list
- Real-time updates via Supabase subscription
- Mark as read functionality (individual & all)
- Auto-close on outside click
- Priority-based styling (critical, high, medium, low)
- Type-based icons (request, donation, pickup, stock, campaign)
- Indonesian time formatting (e.g., "5 menit yang lalu")

### 2. **useNotifications Hook** (`hooks/useNotifications.ts`)
- Fetch notifications with pagination
- Real-time subscription to new notifications
- Auto-refresh unread count (every 30 seconds by default)
- Mark as read / mark all as read
- Loading and error states
- TypeScript types for type safety

### 3. **NotificationToast Component** (`components/NotificationToast.tsx`)
- Shows toast notification for new incoming notifications
- Non-intrusive popup in top-right corner
- Auto-dismiss after 5-10 seconds based on priority
- Click to navigate to action URL
- Uses `sonner` library for smooth animations

### 4. **Full Notifications Page** (`app/notifications/page.tsx`)
- Dedicated page for viewing all notifications
- Search functionality
- Filter by read/unread status
- Full-width card layout with all details
- Batch mark as read

### 5. **Supabase Client** (`utils/supabase.ts`)
- Configured Supabase client with real-time enabled
- Auto-refresh token
- Session persistence

## 📦 Installation

```bash
cd DarahTanyoe_Web
npm install
```

New dependencies added:
- `@supabase/supabase-js` - Supabase client for real-time and database
- `date-fns` - Date formatting in Indonesian locale
- `sonner` - Beautiful toast notifications

## 🔧 Configuration

### 1. Environment Variables
Create `.env.local` file (copy from `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy "Project URL" and "anon/public" key

### 2. Add to Layout

Edit your dashboard layout file (e.g., `app/dashboard/layout.tsx`):

```tsx
import NotificationBell from '@/components/NotificationBell';
import NotificationToast from '@/components/NotificationToast';

export default function DashboardLayout({ children }) {
  // Get institutionId from your auth context/session
  const institutionId = "your-institution-id"; // Replace with actual auth

  return (
    <div>
      {/* Header/Navbar */}
      <header className="bg-white shadow">
        <div className="flex items-center justify-between p-4">
          <h1>Dashboard</h1>
          
          {/* Add Notification Bell */}
          <NotificationBell institutionId={institutionId} />
        </div>
      </header>

      {/* Toast for real-time notifications */}
      <NotificationToast institutionId={institutionId} />

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}
```

### 3. Get Institution ID from Auth

You'll need to pass the actual institution ID from your authentication system. Example:

```tsx
// Using context
const { user } = useAuth();
const institutionId = user?.institution_id;

// Or from session
const session = await getServerSession();
const institutionId = session?.user?.institution_id;
```

## 🎨 Styling

The components use Tailwind CSS classes. Key features:
- Responsive design
- Hover effects and transitions
- Priority-based colors:
  - 🔴 Critical: Red
  - 🟠 High: Orange
  - 🔵 Medium: Blue
  - ⚪ Low: Gray

## 🔔 Notification Types

Each notification can have:
- **Type**: `donation` | `pickup` | `stock` | `campaign` | `request` | `system`
- **Priority**: `low` | `medium` | `high` | `critical`
- **Action**: Optional URL to navigate when clicked
- **Metadata**: Additional JSON data

Example icons:
- 🩸 Request
- 💉 Donation
- 📦 Pickup
- 📊 Stock
- 📢 Campaign
- 📬 System

## 🔄 Real-time Updates

The system uses **Supabase Real-time** to automatically receive new notifications:

```typescript
// Auto-subscribes in useNotifications hook
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `institution_id=eq.${institutionId}`,
  }, (payload) => {
    // New notification arrives
    // Automatically updates UI
  })
  .subscribe();
```

## 📱 Usage Examples

### Basic Usage
```tsx
import NotificationBell from '@/components/NotificationBell';

<NotificationBell institutionId="123" />
```

### With Custom Refresh Interval
```tsx
const { notifications, unreadCount } = useNotifications({
  institutionId: "123",
  autoRefresh: true,
  refreshInterval: 60000, // 1 minute
});
```

### Standalone Notifications Page
Navigate to `/notifications` to see the full page view.

## 🧪 Testing

### Test Notification from API

```bash
curl -X POST http://localhost:3000/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "institutionId": "your-institution-id",
    "title": "Test Notification",
    "message": "This is a test notification",
    "type": "system",
    "priority": "medium"
  }'
```

### Create Notification via Supabase

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
  'This is a test message',
  'system',
  'medium',
  false,
  NOW()
);
```

## 🚀 Production Checklist

- [ ] Update `.env.local` with production Supabase credentials
- [ ] Replace hardcoded `institutionId` with actual auth context
- [ ] Enable Supabase Row Level Security (RLS) policies
- [ ] Test real-time subscriptions in production
- [ ] Configure notification pagination for large datasets
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Add analytics for notification interactions

## 📊 Database Schema

Ensure your `notifications` table has these columns:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id),
  donor_id UUID REFERENCES blood_donors(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  related_id UUID,
  related_type VARCHAR(50),
  action_url TEXT,
  action_label VARCHAR(100),
  metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_notifications_institution ON notifications(institution_id, created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(institution_id, is_read);
CREATE INDEX idx_notifications_priority ON notifications(priority, created_at DESC);
```

## 🐛 Troubleshooting

### Notifications not appearing?
1. Check Supabase connection: `console.log(supabase)` in browser
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
3. Check network tab for API calls
4. Verify `institution_id` is correct

### Real-time not working?
1. Check Supabase Real-time is enabled in dashboard
2. Verify RLS policies allow reading
3. Check browser console for subscription errors
4. Test with `supabase.channel('test').subscribe()`

### Badge count wrong?
1. Refresh page to sync with database
2. Check `is_read` field in database
3. Call `refresh()` from hook manually

## 📚 API Reference

### useNotifications Hook

```typescript
const {
  notifications,      // Array of notifications
  unreadCount,       // Number of unread notifications
  loading,           // Loading state
  error,             // Error message if any
  markAsRead,        // Function: (id: string) => Promise<void>
  markAllAsRead,     // Function: () => Promise<void>
  refresh,           // Function: () => Promise<void>
} = useNotifications({
  institutionId: "123",
  autoRefresh: true,
  refreshInterval: 30000,
});
```

## 🎉 Success!

Your notification system is now ready! Users will see:
- 🔔 Bell icon with unread badge
- 📥 Dropdown with notification list
- 🔴 Real-time updates
- ✅ Mark as read functionality
- 📱 Toast notifications for new items

---

**Need help?** Check the backend documentation in `NOTIFICATION_SYSTEM.md`
