import CameraComponent from "@/components/CameraComponent";
import Navbar from "@/components/Navbar";

/**
 * Camera Page - Halaman untuk mengambil foto dengan Perfect Corp Camera Kit
 */
export default function CameraPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
  <Navbar ctaHref="/" ctaLabel="Beranda" ctaIcon="home" />
      <main className="py-8">
        <CameraComponent />
      </main>
    </div>
  );
}
