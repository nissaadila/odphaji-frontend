"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import {
  ApiError,
  getMe,
  getMutasi,
  logout,
  type Tabungan,
  type Transaksi,
} from "@/lib/api";

export default function MutasiPage() {
  return (
    <AuthGuard>
      <Mutasi />
    </AuthGuard>
  );
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatRupiah(value: string | number): string {
  try {
    return rupiah.format(BigInt(value));
  } catch {
    return rupiah.format(Number(value) || 0);
  }
}

const tanggalFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : tanggalFormatter.format(d);
}

const JENIS_LABEL: Record<string, string> = {
  SETOR: "Setoran",
  TARIK: "Penarikan",
};

function Mutasi() {
  const router = useRouter();
  const [keluar, setKeluar] = useState(false);

  const [tabungan, setTabungan] = useState<Tabungan | null>(null);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getMe();
      setTabungan(me.tabungan);
      if (me.tabungan) {
        const mutasi = await getMutasi(me.tabungan.id);
        setTransaksi(mutasi.data);
      } else {
        setTransaksi([]);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal memuat mutasi. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  async function handleLogout() {
    setKeluar(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setKeluar(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-body-md text-on-background">
      {/* TopAppBar */}
      <header className="top-0 z-50 w-full border-b border-outline-variant bg-surface shadow-sm">
        <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-between px-container-padding-desktop">
          <div className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
            <span>🕋</span>
            <span>BSI Tabungan Haji</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              className="rounded-md px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-md border-b-2 border-primary px-3 py-2 font-label-md text-label-md font-bold text-primary"
              href="/mutasi"
            >
              Mutasi
            </Link>
            <Link
              className="rounded-md px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              href="/estimasi"
            >
              Estimasi
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              disabled={keluar}
              className="hidden rounded-lg border border-outline-variant px-4 py-2 font-label-md text-label-md text-primary transition-all hover:bg-surface-container-low disabled:opacity-50 md:block"
            >
              {keluar ? "Keluar..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-[1200px] flex-grow px-container-padding-mobile py-section-gap md:px-container-padding-desktop">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-stack-lg flex flex-col gap-stack-sm sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-primary md:font-headline-xl md:text-headline-xl">
                Mutasi Rekening
              </h1>
              <p className="mt-stack-sm font-body-md text-body-md text-on-surface-variant">
                Riwayat transaksi tabungan haji Anda.
              </p>
            </div>
            <button
              onClick={muat}
              disabled={loading}
              className="flex items-center gap-2 self-start rounded-lg border border-outline-variant px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low disabled:opacity-50 sm:self-auto"
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  loading ? "animate-spin" : ""
                }`}
              >
                {loading ? "progress_activity" : "refresh"}
              </span>
              Muat Ulang
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg text-on-surface-variant shadow-sm">
              <span className="material-symbols-outlined animate-spin">
                progress_activity
              </span>
              <span className="font-body-md text-body-md">Memuat mutasi...</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-start gap-stack-md rounded-xl border border-error/30 bg-error-container p-stack-lg text-on-error-container shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                <span className="font-body-md text-body-md">{error}</span>
              </div>
              <button
                onClick={muat}
                className="rounded-lg bg-error px-4 py-2 font-label-md text-label-md text-on-error transition-opacity hover:opacity-90"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Belum punya tabungan */}
          {!loading && !error && !tabungan && (
            <div className="flex flex-col items-center gap-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest p-section-gap text-center shadow-sm">
              <span className="material-symbols-outlined text-5xl text-primary-container">
                account_balance_wallet
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Anda belum memiliki Tabungan Haji
              </h2>
              <Link
                href="/dashboard"
                className="font-label-md text-label-md text-primary hover:underline"
              >
                Kembali ke Dashboard
              </Link>
            </div>
          )}

          {/* Daftar mutasi */}
          {!loading && !error && tabungan && (
            <>
              {/* Ringkasan rekening */}
              <div className="mb-stack-lg flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                <div>
                  <p className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    No. Rekening
                  </p>
                  <p className="font-headline-sm text-headline-sm text-on-surface">
                    {tabungan.nomorRekening}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Saldo Saat Ini
                  </p>
                  <p className="font-headline-sm text-headline-sm text-primary">
                    {formatRupiah(tabungan.saldo)}
                  </p>
                </div>
              </div>

              {/* Tabel transaksi */}
              <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
                <div className="flex items-center justify-between border-b border-outline-variant/50 p-stack-lg">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    Daftar Transaksi
                  </h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {transaksi.length} transaksi
                  </span>
                </div>

                {transaksi.length === 0 ? (
                  <p className="p-stack-lg font-body-sm text-body-sm text-on-surface-variant">
                    Belum ada transaksi.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-surface-container-low">
                          <th className="p-4 font-label-sm text-label-sm uppercase text-on-surface-variant">
                            Tanggal
                          </th>
                          <th className="p-4 font-label-sm text-label-sm uppercase text-on-surface-variant">
                            Jenis
                          </th>
                          <th className="p-4 text-right font-label-sm text-label-sm uppercase text-on-surface-variant">
                            Nominal
                          </th>
                          <th className="hidden p-4 text-right font-label-sm text-label-sm uppercase text-on-surface-variant sm:table-cell">
                            Saldo Akhir
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30">
                        {transaksi.map((t) => {
                          const kredit = t.jenis === "SETOR";
                          return (
                            <tr
                              key={t.id}
                              className="transition-colors hover:bg-surface-container-lowest/50"
                            >
                              <td className="p-4 font-body-sm text-body-sm text-on-surface">
                                {formatTanggal(t.waktu)}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`material-symbols-outlined text-sm ${
                                      kredit ? "text-primary" : "text-error"
                                    }`}
                                  >
                                    {kredit ? "arrow_downward" : "arrow_upward"}
                                  </span>
                                  <div>
                                    <p className="font-body-sm text-body-sm text-on-surface">
                                      {JENIS_LABEL[t.jenis] ?? t.jenis}
                                    </p>
                                    {t.catatan ? (
                                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                                        {t.catatan}
                                      </p>
                                    ) : (
                                      t.metode && (
                                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                                          {t.metode}
                                        </p>
                                      )
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td
                                className={`p-4 text-right font-body-sm text-body-sm font-medium ${
                                  kredit ? "text-primary" : "text-error"
                                }`}
                              >
                                {kredit ? "+ " : "- "}
                                {formatRupiah(t.nominal)}
                              </td>
                              <td className="hidden p-4 text-right font-body-sm text-body-sm text-on-surface-variant sm:table-cell">
                                {formatRupiah(t.saldoSesudah)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-outline-variant bg-surface-container-low">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-stack-md px-container-padding-desktop py-section-gap md:flex-row">
          <div className="flex flex-col items-center gap-stack-sm md:items-start">
            <div className="font-headline-sm text-headline-sm font-semibold text-primary">
              BSI Tabungan Haji
            </div>
            <p className="text-center font-body-sm text-body-sm text-on-surface-variant md:text-left">
              © 2024 BSI Tabungan Haji. Terdaftar dan Diawasi oleh OJK. Peserta
              Penjaminan LPS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
