# Integrasi Perfect Corp Camera Kit dengan Next.js

Dokumentasi lengkap untuk mengintegrasikan Perfect Corp YMK JS Camera Kit dengan Next.js dan backend FastAPI.

## 📁 Struktur File

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── upload/
│   │   │       └── route.ts          # Next.js API Route untuk upload
│   │   └── camera/
│   │       └── page.tsx               # Halaman kamera
│   └── components/
│       └── CameraComponent.tsx        # Komponen kamera React
└── .env.local                         # Environment variables
```

## 🔧 Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
# atau
pnpm install
```

### 2. Konfigurasi Environment Variables

Edit file `.env.local`:

```env
NEXT_PUBLIC_PERFECT_CORP_API_KEY=your_api_key_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Jalankan Backend FastAPI

Pastikan backend FastAPI sudah berjalan di `http://localhost:8000`:

```bash
cd backend
python app.py
```

### 4. Jalankan Frontend Next.js

```bash
cd frontend
npm run dev
# atau
pnpm dev
```

### 5. Buka Browser

Akses: `http://localhost:3000/camera`

## 🎯 Alur Kerja

### Flow Diagram:

```
User → Click "Start Camera" 
     → YMK Camera Kit Initialize 
     → User Position Face 
     → Auto Capture Photo 
     → Convert to Base64 
     → Send to Next.js API (/api/upload)
     → Convert Base64 to Blob
     → Send to FastAPI Backend (/upload)
     → Backend Resize Image (if needed)
     → Upload to Perfect Corp API
     → Return file_id
     → Display Success Message
```

### Step-by-Step:

1. **User membuka halaman `/camera`**
   - Komponen `CameraComponent` dimuat
   - SDK Perfect Corp di-load secara dinamis

2. **User klik "Start Camera"**
   - Fungsi `initializeCamera()` dipanggil
   - YMK Camera Kit diinisialisasi dengan config
   - Kamera terbuka dengan UI guide

3. **YMK Camera otomatis ambil foto**
   - Saat wajah sudah sesuai posisi
   - Callback `onCapture` dipanggil
   - Fungsi `handlePhotoCapture()` dijalankan

4. **Ambil snapshot base64**
   - Gunakan `YMK.snapshot('base64', callback)`
   - Dapat data image dalam format base64

5. **Kirim ke Next.js API Route**
   - POST ke `/api/upload`
   - Body: `{ image: base64, mode: "sd" }`

6. **Next.js API Route proses**
   - Convert base64 ke Blob
   - Buat FormData
   - Forward ke FastAPI backend

7. **Backend FastAPI proses**
   - Terima file sebagai UploadFile
   - Resize otomatis sesuai mode (sd/hd)
   - Upload ke Perfect Corp API

8. **Return hasil ke frontend**
   - Tampilkan file_id
   - Tampilkan info resize
   - Tutup kamera (opsional)

## 📝 API Endpoints

### Next.js API Route

**POST** `/api/upload`

Request Body:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "mode": "sd"
}
```

Response:
```json
{
  "success": true,
  "message": "Foto berhasil diupload ke Perfect Corp",
  "file_id": "E5wuN2Tl7mUjGzAFyBxdbM0GKsZkEQ...",
  "filename": "camera-capture.jpg",
  "size": 245678,
  "resize_info": {
    "resized": true,
    "original_size": "1920x1080",
    "final_size": "1920x1080",
    "mode": "SD (Standard Definition)"
  }
}
```

### FastAPI Backend

**POST** `/upload?mode=sd`

Form Data:
- `file`: File gambar (multipart/form-data)

Response:
```json
{
  "file_id": "E5wuN2Tl7mUjGzAFyBxdbM0GKsZkEQ...",
  "filename": "camera-capture.jpg",
  "content_type": "image/jpeg",
  "size": 245678,
  "resize_info": {
    "resized": true,
    "original_size": "1920x1080",
    "final_size": "1920x1080",
    "scale_factor": 1.0,
    "mode": "SD (Standard Definition)",
    "reason": "Gambar sudah sesuai spesifikasi"
  },
  "message": "File berhasil diupload",
  "upload_status": "success"
}
```

## 🎨 Komponen React

### CameraComponent.tsx

Fitur:
- ✅ Load SDK Perfect Corp secara dinamis
- ✅ Initialize YMK Camera Kit
- ✅ Auto capture foto dengan guide
- ✅ Convert foto ke base64
- ✅ Upload ke backend via API route
- ✅ Error handling lengkap
- ✅ Loading states
- ✅ Success/Error messages
- ✅ Responsive UI dengan Tailwind CSS

### Props & State:

```typescript
// States
const [isLoading, setIsLoading] = useState(true);
const [isCameraOpen, setIsCameraOpen] = useState(false);
const [error, setError] = useState<string | null>(null);
const [uploadStatus, setUploadStatus] = useState<string>("");
const [isUploading, setIsUploading] = useState(false);

// Refs
const ymkRef = useRef<any>(null);  // YMK instance
const containerRef = useRef<HTMLDivElement>(null);  // Camera container
```

## 🔒 Security Notes

1. **API Key**: Jangan commit API key ke git. Gunakan `.env.local`
2. **CORS**: Pastikan backend FastAPI sudah setup CORS dengan benar
3. **Validation**: Validasi base64 data sebelum diproses
4. **File Size**: Batasi ukuran file yang diterima
5. **Rate Limiting**: Implementasi rate limiting untuk prevent abuse

## 🐛 Troubleshooting

### SDK tidak load
- Cek koneksi internet
- Cek console browser untuk error
- Pastikan URL SDK benar

### Camera tidak terbuka
- Cek permission browser untuk kamera
- Cek apakah kamera digunakan aplikasi lain
- Cek console untuk error YMK initialization

### Upload gagal
- Cek backend FastAPI sudah running
- Cek NEXT_PUBLIC_BACKEND_URL di `.env.local`
- Cek network tab untuk error response
- Cek logs backend untuk detail error

### Base64 terlalu besar
- Compress image di frontend sebelum kirim
- Atau resize di frontend sebelum convert ke base64

## 📚 Resources

- [Perfect Corp Documentation](https://developers.perfectcorp.com)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [React Hooks](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/docs)

## ✨ Features

- ✅ Auto-load Perfect Corp SDK
- ✅ Camera UI dengan guide
- ✅ Auto capture saat posisi wajah sesuai
- ✅ Real-time upload status
- ✅ Error handling comprehensive
- ✅ Responsive design
- ✅ TypeScript support
- ✅ Auto resize image di backend
- ✅ Support SD & HD mode

## 🚀 Next Steps

1. Tambahkan preview foto sebelum upload
2. Tambahkan pilihan mode (SD/HD) di UI
3. Implementasi retry logic
4. Tambahkan progress bar saat upload
5. Simpan hasil analisis kulit
6. Tambahkan history foto yang sudah diupload
