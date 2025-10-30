import CameraComponent from "@/components/CameraComponent";

/**
 * Camera Page - Halaman untuk mengambil foto dengan Perfect Corp Camera Kit
 */
export default function CameraPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <CameraComponent />
    </main>
  );
}
