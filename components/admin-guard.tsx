"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getMe, getToken, subscribeSession, ApiError } from "@/lib/api";

/**
 * Bungkus halaman yang hanya boleh diakses admin. Dua lapis pengaman:
 *
 *  1. Token harus ada di storage. Tidak ada → redirect /login.
 *  2. GET /auth/me harus mengembalikan isAdmin === true. Tidak → redirect
 *     /dashboard.
 *
 * Catatan keamanan: cek ini adalah UX defense — pintu keamanan utama tetap
 * middleware backend (requireAdmin). Selama backend mencekal, klien tidak
 * bisa mengambil/mengubah data nasabah meski paksa render halaman ini.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribeSession,
    getToken,
    () => null, // SSR snapshot
  );

  const [status, setStatus] = useState<"checking" | "ok" | "denied">(
    "checking",
  );

  useEffect(() => {
    if (token === null) {
      router.replace("/login");
      return;
    }
    let aktif = true;
    setStatus("checking");
    getMe()
      .then((me) => {
        if (!aktif) return;
        if (me.isAdmin) {
          setStatus("ok");
        } else {
          setStatus("denied");
          router.replace("/dashboard");
        }
      })
      .catch((err) => {
        if (!aktif) return;
        // 401 sudah ditangani authedFetch (auto-redirect /login). Untuk error
        // lain anggap tidak terautentikasi/tidak terotorisasi → balik ke
        // dashboard agar tidak terjebak.
        if (!(err instanceof ApiError) || err.status !== 401) {
          setStatus("denied");
          router.replace("/dashboard");
        }
      });
    return () => {
      aktif = false;
    };
  }, [token, router]);

  if (status !== "ok") {
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
