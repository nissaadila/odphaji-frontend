"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import {
  ApiError,
  getMe,
  logout,
  setorTabungan,
  type Tabungan,
} from "@/lib/api";

export default function SetorPage() {
  return (
    <AuthGuard>
      <Setor />
    </AuthGuard>
  );
}

const NOMINAL_MIN = 100_000;

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

function Setor() {
  const router = useRouter();

  const [tabungan, setTabungan] = useState<Tabungan | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [errorPage, setErrorPage] = useState<string | null>(null);

  const [nominal, setNominal] = useState<number>(0);
  const [metode, setMetode] = useState<"qris" | "transfer">("qris");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [keluar, setKeluar] = useState(false);

  const muat = useCallback(async () => {
    setLoadingPage(true);
    setErrorPage(null);
    try {
      const me = await getMe();
      setTabungan(me.tabungan);
    } catch (err) {
      setErrorPage(
        err instanceof ApiError
          ? err.message
          : "Gagal memuat data. Silakan coba lagi.",
      );
    } finally {
      setLoadingPage(false);
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

  const saldoNum = tabungan ? Number(tabungan.saldo) : 0;
  const valid = Number.isInteger(nominal) && nominal >= NOMINAL_MIN;
  const estimasiSaldo = saldoNum + (nominal || 0);

  async function konfirmasi(e: React.FormEvent) {
    e.preventDefault();
    if (!tabungan || !valid || submitting) return;
    setError(null);
    setSukses(null);
    setSubmitting(true);
    try {
      const result = await setorTabungan(tabungan.id, nominal);
      setTabungan(result.tabungan);
      setSukses(
        `Setoran ${formatRupiah(nominal)} berhasil. Saldo terbaru: ${formatRupiah(result.tabungan.saldo)}.`,
      );
      setNominal(0);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal melakukan setoran. Silakan coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-body-md text-on-background">
      {/* TopAppBar */}
      <header className="top-0 z-50 w-full border-b border-outline-variant bg-surface shadow-sm">
        <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-between px-container-padding-desktop">
          <div className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
            <span>🕋</span>
            <span>Tabungan Haji ODP</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              className="rounded-md px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-md px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              href="/mutasi"
            >
              Mutasi
            </Link>
            <a
              className="rounded-md px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              href="#"
            >
              Estimasi
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                aria-label="Akun"
                className="rounded-full p-2 text-primary transition-all hover:bg-surface-container-low active:scale-95"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_circle
                </span>
              </button>
              <button
                aria-label="Notifikasi"
                className="rounded-full p-2 text-primary transition-all hover:bg-surface-container-low active:scale-95"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  notifications
                </span>
              </button>
            </div>
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
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-stack-lg text-center">
            <h1 className="mb-stack-sm font-headline-xl-mobile text-headline-xl-mobile text-primary md:font-headline-xl md:text-headline-xl">
              Setor Dana ke Tabungan Haji
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Lanjutkan perjalanan suci Anda dengan mudah dan aman.
            </p>
          </div>

          {/* Loading */}
          {loadingPage && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg text-on-surface-variant shadow-sm">
              <span className="material-symbols-outlined animate-spin">
                progress_activity
              </span>
              <span className="font-body-md text-body-md">Memuat data...</span>
            </div>
          )}

          {/* Error halaman */}
          {!loadingPage && errorPage && (
            <div className="flex flex-col items-start gap-stack-md rounded-xl border border-error/30 bg-error-container p-stack-lg text-on-error-container shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                <span className="font-body-md text-body-md">{errorPage}</span>
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
          {!loadingPage && !errorPage && !tabungan && (
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

          {/* Konten utama */}
          {!loadingPage && !errorPage && tabungan && (
            <>
              {/* Account Info Card */}
              <div className="mb-stack-lg flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                <div>
                  <p className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Rekening Tujuan
                  </p>
                  <p className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
                    <span className="material-symbols-outlined text-secondary">
                      account_balance_wallet
                    </span>
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

              {/* Deposit Form */}
              <form
                onSubmit={konfirmasi}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
              >
                {/* Sukses */}
                {sukses && (
                  <div
                    role="status"
                    className="mb-stack-lg flex items-center gap-2 rounded-lg border border-primary-container/30 bg-surface-container-low px-4 py-3 font-body-sm text-body-sm text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      check_circle
                    </span>
                    {sukses}
                  </div>
                )}

                {/* Error submit */}
                {error && (
                  <div
                    role="alert"
                    className="mb-stack-lg flex items-center gap-2 rounded-lg border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      error
                    </span>
                    {error}
                  </div>
                )}

                {/* Nominal Setoran */}
                <div className="mb-stack-lg">
                  <label
                    className="mb-stack-sm block font-label-md text-label-md text-on-surface"
                    htmlFor="nominal"
                  >
                    Nominal Setoran
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <span className="font-body-lg text-body-lg text-on-surface-variant">
                        Rp
                      </span>
                    </div>
                    <input
                      id="nominal"
                      name="nominal"
                      type="text"
                      inputMode="numeric"
                      value={nominal ? nominal.toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setNominal(digits ? Number(digits) : 0);
                      }}
                      placeholder="2.500.000"
                      className="block w-full rounded-lg border border-outline-variant bg-surface py-4 pl-12 pr-4 font-headline-md text-headline-md text-on-surface transition-all placeholder:text-outline-variant/50 focus:border-primary focus:outline-none focus:ring focus:ring-primary/20"
                    />
                  </div>
                  <p className="mt-2 flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">
                      info
                    </span>
                    Minimal setoran {formatRupiah(NOMINAL_MIN)}
                  </p>
                </div>

                {/* Metode Pembayaran */}
                <div className="mb-stack-lg">
                  <label className="mb-stack-sm block font-label-md text-label-md text-on-surface">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <MetodeOption
                      aktif={metode === "qris"}
                      onClick={() => setMetode("qris")}
                      judul="QRIS"
                      deskripsi="Scan cepat & instan"
                    />
                    <MetodeOption
                      aktif={metode === "transfer"}
                      onClick={() => setMetode("transfer")}
                      judul="Transfer Bank"
                      deskripsi="Virtual Account"
                    />
                  </div>
                </div>

                {/* Dynamic Preview */}
                <div className="mb-stack-lg flex items-center justify-between rounded-lg border border-outline-variant/50 bg-surface-container p-4">
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    Estimasi saldo setelah setor:
                  </span>
                  <span className="font-headline-md text-headline-md text-primary-container">
                    {formatRupiah(estimasiSaldo)}
                  </span>
                </div>

                {/* Action */}
                <button
                  type="submit"
                  disabled={!valid || submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-4 font-headline-sm text-headline-sm uppercase tracking-wider text-on-primary shadow-sm transition-colors hover:bg-tertiary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <span className="material-symbols-outlined animate-spin text-[20px]">
                      progress_activity
                    </span>
                  )}
                  {submitting ? "Memproses..." : "Konfirmasi Setor"}
                </button>
              </form>

              {/* Security Footer */}
              <div className="mt-stack-md text-center">
                <p className="flex items-center justify-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span>🔒</span> Transaksi aman &amp; idempoten (anti duplikat).
                </p>
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
              Tabungan Haji ODP
            </div>
            <p className="text-center font-body-sm text-body-sm text-on-surface-variant md:text-left">
              © 2024 Tabungan Haji ODP. Terdaftar dan Diawasi oleh OJK. Peserta
              Penjaminan LPS.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-4">
            {["Syarat & Ketentuan", "Kebijakan Privasi", "Hubungi Kami", "Bantuan"].map(
              (l) => (
                <a
                  key={l}
                  href="#"
                  className="rounded-sm font-label-sm text-label-sm text-on-surface-variant underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary focus:ring-2 focus:ring-primary"
                >
                  {l}
                </a>
              ),
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}

function MetodeOption({
  aktif,
  onClick,
  judul,
  deskripsi,
}: {
  aktif: boolean;
  onClick: () => void;
  judul: string;
  deskripsi: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`relative flex cursor-pointer rounded-lg border p-4 text-left shadow-sm transition-colors ${
        aktif
          ? "border-primary bg-surface-container-low"
          : "border-outline-variant bg-surface-container-lowest hover:border-primary/50"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <div>
          <p className="font-headline-sm text-headline-sm text-on-surface">
            {judul}
          </p>
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            {deskripsi}
          </div>
        </div>
        <span
          className={`material-symbols-outlined ${
            aktif ? "text-primary" : "text-outline-variant"
          }`}
          style={aktif ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {aktif ? "check_circle" : "radio_button_unchecked"}
        </span>
      </div>
    </button>
  );
}
