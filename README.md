# YCE Skin Analyzer - Frontend

Frontend application untuk YCE Skin Analyzer menggunakan Next.js 16 dengan Perfect Corp Camera Kit integration.

## Features

### 🏠 Landing Page
- Hero section dengan CTA yang menarik
- Features showcase (4 fitur unggulan)
- History section menampilkan 6 analisis terbaru
- Responsive design untuk semua device
- Smooth scrolling dan modern UI/UX

### 📷 Camera Integration
- Perfect Corp YMK Camera Kit
- Face quality detection real-time
- Auto-capture saat posisi optimal
- HD image capture

### 🔬 Skin Analysis
- Multi-condition detection (8+ kondisi kulit)
- Real-time processing dengan loading stages
- Visualisasi hasil dengan overlays
- Score-based severity classification

### 💊 Product Recommendations
- Ingredient recommendations berdasarkan kondisi kulit
- Product suggestions dengan pricing
- Severity-based filtering (Poor, Fair, Good)

### 📊 Analysis History
- Save dan retrieve analysis results
- COCO dataset generation
- Image storage dengan metadata
- Pagination support

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: React Hooks
- **Image Processing**: JSZip
- **External API**: Perfect Corp API v2

## Getting Started

### Prerequisites
```bash
Node.js >= 18.0.0
npm or pnpm
```

### Installation

```bash
# Install dependencies
npm install
# or
pnpm install
```

### Environment Variables

Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page dengan history
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── camera/
│   │   └── page.tsx          # Camera page
│   └── api/
│       ├── upload-v2/        # Upload endpoint
│       ├── analyze-v2/       # Analysis endpoint
│       └── download-result/  # Download & save endpoint
└── components/
    ├── CameraComponent.tsx   # Main camera component
    ├── AnalysisResult.tsx    # Result modal dengan recommendations
    ├── LoadingProgress.tsx   # Loading overlay
    └── HistoryCard.tsx       # History card component
```

## Pages

### 1. Landing Page (`/`)
- **Hero Section**: CTA utama ke camera page
- **Features Section**: Showcase 4 fitur unggulan
- **History Section**: 6 analisis terbaru dengan cards
- **CTA Section**: Call-to-action sekunder
- **Footer**: Branding dan copyright

Dokumentasi lengkap: [README_LANDING_PAGE.md](./README_LANDING_PAGE.md)

### 2. Camera Page (`/camera`)
- Perfect Corp Camera UI integration
- Face quality indicators
- Real-time validation
- Auto-capture functionality

Dokumentasi: [README_CAMERA_UPDATED.md](./README_CAMERA_UPDATED.md)

## Components

### CameraComponent
Main component untuk camera functionality:
- YMK SDK initialization
- Event listeners untuk capture
- Upload → Analyze → Download flow
- Integration dengan backend API

### AnalysisResult
Modal untuk display hasil analisis:
- Original image + overlays
- Score cards dengan color coding
- Collapsible recommendations section
- Ingredient details (benefits, usage, warnings)
- Product cards dengan links

### HistoryCard
Card component untuk display history items:
- Thumbnail dengan fallback
- Date formatting
- Score summary dengan badges
- View detail button

### LoadingProgress
Overlay dengan progress indicator:
- Multi-stage progress (Upload → Analyze → Download)
- Progress percentage
- Stage-specific messages
- Debug info (optional)

## API Integration

### Backend Endpoints

#### Upload Image
```
POST /api/upload-v2
Body: { image: base64, mode: "sd" }
Response: { file_id, image_url, resize_info }
```

#### Analyze Image
```
POST /api/analyze-v2
Body: { file_id, image_url, dst_actions, max_attempts, poll_interval }
Response: { task_id, status, result_url, attempts }
```

#### Download & Save Results
```
POST /api/download-result
Body: { result_url, task_id, file_id, original_image_url, original_image_base64 }
Response: { 
  success, 
  score_info, 
  result_images, 
  files_count,
  recommendations 
}
```

#### Get History
```
GET /api/v2/history/?limit=6
Response: { status, count, data: [...] }
```

#### Get Analysis Detail
```
GET /api/v2/history/{id}
Response: { status, data: {...} }
```

## Styling

### Design System
- **Colors**: Blue-Indigo gradient theme
- **Typography**: System font stack
- **Spacing**: Tailwind spacing scale
- **Shadows**: Layered shadows untuk depth
- **Animations**: Subtle transitions dan transforms

### Color Palette
```
Primary: Blue-600 → Indigo-600
Success: Green-600
Warning: Yellow-600
Danger: Red-600
Gray Scale: Gray-50 → Gray-900
```

### Responsive Breakpoints
```
sm: 640px   (Mobile landscape)
md: 768px   (Tablet)
lg: 1024px  (Desktop)
xl: 1280px  (Large desktop)
```

## Development Workflow

### 1. Local Development
```bash
npm run dev
```
- Hot reload enabled
- TypeScript type checking
- ESLint auto-fix

### 2. Type Checking
```bash
npm run type-check
```

### 3. Linting
```bash
npm run lint
```

### 4. Build
```bash
npm run build
```

## Features Implementation

### Perfect Corp Integration
1. Load YMK SDK dari CDN
2. Initialize dengan config (language, snapshot type, dimensions)
3. Open skincare camera
4. Listen untuk capture events
5. Process captured image

### Analysis Flow
1. **Upload**: Send base64 image ke backend
2. **Analyze**: Create analysis task dengan Perfect Corp
3. **Poll**: Check status hingga completed
4. **Download**: Download ZIP result dan extract
5. **Save**: Save ke database dengan COCO generation
6. **Display**: Show results dengan recommendations

### Recommendation System
1. Extract `score_info` dari analysis result
2. Map scores ke severity levels (Poor, Fair, Good)
3. Query ingredients berdasarkan condition + severity
4. Sort by priority
5. Display dengan collapsible sections
6. Include products untuk each ingredient

## Troubleshooting

### Camera tidak muncul
- Check browser camera permissions
- Verify SDK loaded dari CDN
- Check console untuk errors

### Analysis gagal
- Verify backend API running
- Check Perfect Corp API credentials
- Check network connectivity

### Recommendations tidak muncul
- Verify backend seeding completed
- Check database tables exist
- Check console logs untuk errors

### History tidak load
- Verify backend API endpoint
- Check CORS settings
- Check network tab untuk request failures

## Related Documentation

- [Landing Page Guide](./README_LANDING_PAGE.md)
- [Camera Component](./README_CAMERA_UPDATED.md)
- [History Integration](./HISTORY_INTEGRATION.md)
- [Backend API Docs](../be-yceSkinAnalyzer/README.md)

## Environment Setup

### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

### Production
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

## Performance Optimization

1. **Image Optimization**
   - Next.js Image component untuk static images
   - Lazy loading untuk history images
   - Error boundaries untuk failed loads

2. **Code Splitting**
   - Dynamic imports untuk heavy components
   - Route-based splitting (automatic)

3. **API Optimization**
   - Request caching
   - Pagination untuk history
   - Debouncing untuk search/filter (future)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

Proprietary - YCE Skin Analyzer

## Support

For issues or questions, contact development team.

---

**Built with ❤️ using Next.js and Perfect Corp Technology**
