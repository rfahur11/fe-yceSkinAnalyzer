# Perfect Corp Skin Analysis - Camera Integration

## 📋 Ringkasan Perubahan

Komponen Camera telah diperbarui untuk mengikuti **implementasi resmi** dari Perfect Corp yang ada di folder `referensi/`. Perubahan utama adalah penggunaan pola `ymkAsyncInit` dan event listener yang sesuai dengan dokumentasi SDK.

## 🔄 Perubahan dari Implementasi Sebelumnya

### Sebelum (Implementasi Lama)
```javascript
// ❌ Menggunakan config callback
const config = {
  apiKey: "...",
  container: containerRef.current,
  onCapture: handlePhotoCapture,
};
ymkRef.current = await window.YMK.init(config);
```

### Sekarang (Implementasi Sesuai Referensi)
```javascript
// ✅ Menggunakan ymkAsyncInit callback dan event listeners
window.ymkAsyncInit = function() {
  YMK.addEventListener('uiLoaded', function() {
    console.log("YMK UI loaded");
  });
  
  YMK.addEventListener('skinAnalysisDetectionCaptured', function(image) {
    // Handle captured image
  });
};

YMK.init({
  language: 'enu',
  snapshotType: 'base64',
});

YMK.openSkincareCamera();
```

## 🎯 Implementasi Detail

### 1. **SDK Initialization Pattern**
Menggunakan `window.ymkAsyncInit` callback yang dipanggil otomatis oleh SDK saat sudah siap:

```typescript
window.ymkAsyncInit = function() {
  // Setup event listeners di sini
  window.YMK?.addEventListener('uiLoaded', function() {
    setIsCameraOpen(true);
  });
  
  window.YMK?.addEventListener('skinAnalysisDetectionCaptured', function(image) {
    if (image) {
      handlePhotoCaptured(image);
    }
  });
  
  setIsLoading(false);
};
```

### 2. **Event Listeners**
SDK menggunakan event-driven architecture:

- **`uiLoaded`**: Dipanggil saat UI camera module sudah siap
- **`skinAnalysisDetectionCaptured`**: Dipanggil saat foto berhasil diambil

### 3. **Camera Initialization**
Saat user klik "Start Camera":

```typescript
YMK.init({
  language: 'enu', // atau 'id' untuk Bahasa Indonesia
  snapshotType: 'base64', // atau 'blob'
});

YMK.openSkincareCamera();
```

### 4. **YMK Module Container**
SDK membutuhkan div dengan ID `YMK-module`:

```tsx
<div id="YMK-module" className="my-4"></div>
```

## 📦 Dependencies & Types

### TypeScript Interface
```typescript
interface YMKInterface {
  init(config: { language: string; snapshotType: string }): void;
  openSkincareCamera(): void;
  close(): void;
  addEventListener(event: string, callback: (image?: string | Blob) => void): void;
}

declare global {
  interface Window {
    YMK?: YMKInterface;
    ymkAsyncInit?: () => void;
  }
}
```

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Component Mount                                          │
│    - Setup ymkAsyncInit callback                            │
│    - Load SDK script dynamically                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SDK Loaded                                               │
│    - ymkAsyncInit() dipanggil otomatis                      │
│    - Register event listeners (uiLoaded, captured)          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User Click "Start Camera"                                │
│    - YMK.init({ language, snapshotType })                   │
│    - YMK.openSkincareCamera()                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Camera UI Loaded                                         │
│    - Event 'uiLoaded' triggered                             │
│    - setIsCameraOpen(true)                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. User Takes Photo                                         │
│    - SDK detects face & captures automatically              │
│    - Event 'skinAnalysisDetectionCaptured' triggered        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Handle Captured Photo                                    │
│    - Convert Blob to base64 (if needed)                     │
│    - Display preview                                        │
│    - Upload to backend                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Upload to FastAPI Backend                                │
│    - POST /api/upload (Next.js API Route)                   │
│    - Forward to FastAPI /upload                             │
│    - Auto resize image (SD/HD mode)                         │
│    - Send to Perfect Corp API                               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Usage

### 1. Install Dependencies
```bash
cd frontend
pnpm install
```

### 2. Configure Environment Variables
Buat file `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
pnpm dev
```

### 4. Navigate to Camera Page
```
http://localhost:3000/camera
```

## ⚙️ Configuration Options

### Language Options
```typescript
language: 'enu' // English
language: 'id'  // Bahasa Indonesia
```

### Snapshot Type
```typescript
snapshotType: 'base64' // Base64 string (recommended for web)
snapshotType: 'blob'   // Blob object
```

## 🔍 Debugging

### Enable Console Logs
Komponen sudah dilengkapi dengan console.log untuk debugging:

```typescript
console.log("YMK SDK initialized");
console.log("YMK UI loaded");
console.log("Photo captured by YMK");
console.log("Skincare camera opened");
```

### Check SDK Load Status
```typescript
if (!window.YMK) {
  console.error("SDK not loaded yet");
}
```

## 📝 Testing Checklist

- [ ] SDK loads successfully
- [ ] ymkAsyncInit callback executed
- [ ] Start Camera button appears
- [ ] Camera UI opens when clicked
- [ ] Face detection guide appears
- [ ] Photo captured automatically when face aligned
- [ ] Image preview displayed
- [ ] Upload to backend successful
- [ ] File ID returned from Perfect Corp
- [ ] Camera closes after upload

## 🐛 Common Issues

### Issue: SDK tidak load
**Solution**: Check browser console untuk error, pastikan internet connection aktif untuk load SDK dari CDN.

### Issue: YMK-module container not found
**Solution**: Pastikan div dengan ID `YMK-module` ada di DOM sebelum call `YMK.openSkincareCamera()`.

### Issue: Event listener tidak terpanggil
**Solution**: Pastikan event listener di-register dalam `ymkAsyncInit` callback, bukan di tempat lain.

### Issue: Upload gagal
**Solution**: 
1. Check backend running di http://localhost:8000
2. Check environment variables configured
3. Check CORS settings di backend

## 📚 References

- **Reference Implementation**: `referensi/Skincare Camera Kit Sample - UI mode.htm`
- **SDK URL**: https://plugins-media.makeupar.com/v1.0-skincare-camera-kit/sdk.js
- **Perfect Corp Documentation**: [Official Docs]

## 🆕 What's New

### v2.0 - Implementasi Berdasarkan Referensi Resmi
- ✅ Menggunakan `ymkAsyncInit` callback pattern
- ✅ Event-driven architecture dengan `addEventListener`
- ✅ Proper SDK initialization sequence
- ✅ TypeScript interfaces untuk type safety
- ✅ Cleanup handlers untuk prevent memory leaks
- ✅ Error handling yang lebih baik
- ✅ Preview image dengan Next.js Image component

---

**Last Updated**: 2024
**Version**: 2.0.0
**Author**: YCE Team
