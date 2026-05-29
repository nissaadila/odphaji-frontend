"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getToken, subscribeSession } from "@/lib/api";

/**
 * Pembungkus untuk halaman yang butuh autentikasi. Membaca token sebagai
 * external store (useSyncExternalStore) agar aman dari hydration mismatch dan
 * tersinkron antar-tab. Jika tidak ada token, redirect ke /login dan tampilkan
 * loader agar konten privat tidak sempat terlihat.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribeSession,
    getToken,
    () => null, // snapshot saat SSR: anggap belum login
  );

  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);

  if (token === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
