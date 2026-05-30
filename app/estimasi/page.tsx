"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import {
  ApiError,
  getEstimasi,
  getMe,
  logout,
  type Estimasi,
  type Tabungan,
} from "@/lib/api";

export default function EstimasiPage() {
  return (
    <AuthGuard>
      <EstimasiView />
    </AuthGuard>
  );
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatRupiah(value: string | number | bigint): string {
  try {
    return rupiah.format(BigInt(value));
  } catch {
    return rupiah.format(Number(value) || 0);
  }
}

const angka = new Intl.NumberFormat("id-ID");

const STATUS_LABEL: Record<Estimasi["status"], string> = {
  BELUM_DAFTAR_PORSI: "BELUM DAFTAR PORSI",
  TERDAFTAR_PORSI: "TERDAFTAR PORSI",
  LUNAS: "LUNAS",
};

const STATUS_BADGE: Record<Estimasi["status"], string> = {
  BELUM_DAFTAR_PORSI:
    "bg-error-container/40 border-error/40 text-on-error-container",
  TERDAFTAR_PORSI:
    "bg-secondary-fixed/20 border-secondary-fixed text-on-secondary-container",
  LUNAS: "bg-primary-container/20 border-primary-container text-primary",
};

const STATUS_BADGE_ICON: Record<Estimasi["status"], string> = {
  BELUM_DAFTAR_PORSI: "schedule",
  TERDAFTAR_PORSI: "check_circle",
  LUNAS: "verified",
};

// Persentase progres timeline (visual) berdasarkan tahap utama:
// Daftar ODP → Dapat Porsi → Lunas BPIH → Berangkat
const TIMELINE_PROGRESS: Record<Estimasi["status"], number> = {
  BELUM_DAFTAR_PORSI: 15,
  TERDAFTAR_PORSI: 45,
  LUNAS: 75,
};

function EstimasiView() {
  const router = useRouter();
  const [keluar, setKeluar] = useState(false);

  const [tabungan, setTabungan] = useState<Tabungan | null>(null);
  const [estimasi, setEstimasi] = useState<Estimasi | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [estimasiLoading, setEstimasiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMeLoading(true);
    setError(null);
    let tabunganId: string | null = null;
    try {
      const me = await getMe();
      setTabungan(me.tabungan);
      tabunganId = me.tabungan?.id ?? null;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal memuat data. Silakan coba lagi.",
      );
      return;
    } finally {
      setMeLoading(false);
    }

    if (!tabunganId) {
      setEstimasi(null);
      return;
    }

    setEstimasiLoading(true);
    try {
      const est = await getEstimasi(tabunganId);
      setEstimasi(est);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal memuat estimasi. Silakan coba lagi.",
      );
    } finally {
      setEstimasiLoading(false);
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

  const status = estimasi?.status ?? null;
  const progressPct = status ? TIMELINE_PROGRESS[status] : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background font-body-md text-on-background">
      {/* TopAppBar */}
      <header className="top-0 z-50 w-full border-b border-outline-variant bg-surface shadow-sm">
        <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-between px-container-padding-desktop">
          <div className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
            <span>🕋</span>
            <span>BSI Tabungan Haji</span>
          </div>
          <nav className="hidden gap-8 md:flex">
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
            <Link
              aria-current="page"
              className="rounded-md border-b-2 border-primary px-3 py-2 font-label-md text-label-md font-bold text-primary"
              href="/estimasi"
            >
              Estimasi
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <button
              aria-label="Notifikasi"
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:text-primary"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                notifications
              </span>
            </button>
            <button
              aria-label="Akun"
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:text-primary"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_circle
              </span>
            </button>
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
      <main className="mx-auto flex w-full max-w-[1200px] flex-grow flex-col gap-section-gap px-container-padding-mobile py-section-gap md:px-container-padding-desktop">
        {/* Header + Status */}
        <section className="flex flex-col items-start justify-between gap-stack-lg md:flex-row md:items-center">
          <div>
            <h1 className="mb-stack-sm font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
              Estimasi Keberangkatan
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Pantau progres dan perkiraan jadwal ibadah haji Anda.
            </p>
          </div>
          {estimasiLoading ? (
            <SkeletonBar className="h-10 w-48 rounded-full" />
          ) : status ? (
            <div
              className={`flex items-center gap-2 rounded-full border px-6 py-3 shadow-sm ${STATUS_BADGE[status]}`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {STATUS_BADGE_ICON[status]}
              </span>
              <span className="font-label-md text-label-md">
                {STATUS_LABEL[status]}
              </span>
            </div>
          ) : null}
        </section>

        {/* Error */}
        {!meLoading && error && (
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
        {!meLoading && !error && !tabungan && (
          <div className="flex flex-col items-center gap-stack-md rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-section-gap text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-primary-container">
              account_balance_wallet
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Anda belum memiliki Tabungan Haji
            </h2>
            <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
              Buka tabungan haji untuk melihat estimasi keberangkatan Anda.
            </p>
            <Link
              href="/dashboard"
              className="mt-stack-sm font-label-md text-label-md text-primary hover:underline"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        )}

        {/* Konten utama */}
        {!error && tabungan && (
          <>
            {/* Bento Grid */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Kolom kiri: Key info + Action */}
              <div className="flex flex-col gap-6 lg:col-span-1">
                {/* Key Info Card */}
                <div className="group relative flex flex-col justify-center overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                  <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary-container/10 blur-2xl transition-all group-hover:bg-primary-container/20" />
                  <div className="z-10 mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-primary-container/10 p-3 text-primary">
                      <span className="material-symbols-outlined">
                        calendar_month
                      </span>
                    </div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">
                      Estimasi Tahun Berangkat
                    </h2>
                  </div>
                  <div className="z-10 font-headline-xl-mobile text-headline-xl-mobile font-bold text-primary md:font-headline-xl md:text-headline-xl">
                    {estimasiLoading ? (
                      <SkeletonBar className="h-10 w-32" />
                    ) : estimasi?.estimasiTahunBerangkat ? (
                      estimasi.estimasiTahunBerangkat
                    ) : (
                      "—"
                    )}
                  </div>
                  <div className="z-10 mt-4 flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">
                      hourglass_empty
                    </span>
                    <span className="font-body-sm text-body-sm">
                      {estimasiLoading ? (
                        <SkeletonBar className="h-4 w-40" />
                      ) : estimasi ? (
                        `Perkiraan Masa Tunggu: ± ${estimasi.waktuTungguTahun} tahun`
                      ) : (
                        "Belum tersedia"
                      )}
                    </span>
                  </div>
                </div>

                {/* Action Card */}
                <ActionCard
                  loading={estimasiLoading}
                  status={status}
                  kekuranganPelunasan={estimasi?.kekuranganPelunasan}
                  kekuranganSetoranAwal={estimasi?.kekuranganSetoranAwal}
                />
              </div>

              {/* Kolom kanan: Ringkasan Finansial */}
              <div className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm lg:col-span-2 md:p-8">
                <div className="mb-8 flex items-center justify-between border-b border-outline-variant/30 pb-4">
                  <h2 className="flex items-center gap-2 font-headline-md text-headline-md text-primary">
                    <span className="material-symbols-outlined">
                      account_balance_wallet
                    </span>
                    Ringkasan Finansial
                  </h2>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Total Saldo */}
                  <div className="flex flex-col gap-2">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Total Saldo Saat Ini
                    </span>
                    <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface md:font-headline-lg md:text-headline-lg">
                      {estimasiLoading ? (
                        <SkeletonBar className="h-8 w-48" />
                      ) : (
                        formatRupiah(estimasi?.saldo ?? tabungan.saldo)
                      )}
                    </span>
                  </div>

                  {/* Kekurangan */}
                  <KekuranganBox
                    loading={estimasiLoading}
                    status={status}
                    kekuranganPelunasan={estimasi?.kekuranganPelunasan}
                    kekuranganSetoranAwal={estimasi?.kekuranganSetoranAwal}
                  />
                </div>

                {/* Breakdown List */}
                <div className="mt-auto flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-sm ${status && status !== "BELUM_DAFTAR_PORSI" ? "text-primary" : "text-outline"}`}
                        style={
                          status && status !== "BELUM_DAFTAR_PORSI"
                            ? { fontVariationSettings: "'FILL' 1" }
                            : undefined
                        }
                      >
                        {status && status !== "BELUM_DAFTAR_PORSI"
                          ? "check_circle"
                          : "radio_button_unchecked"}
                      </span>
                      <span className="font-body-md text-body-md text-on-surface">
                        Setoran Awal Porsi
                      </span>
                    </div>
                    <span className="font-label-md text-label-md font-medium text-on-surface">
                      {estimasiLoading ? (
                        <SkeletonBar className="h-4 w-28" />
                      ) : (
                        formatRupiah(estimasi?.asumsi.setoranAwalPorsi ?? 0)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-sm ${status === "LUNAS" ? "text-primary" : "text-outline"}`}
                        style={
                          status === "LUNAS"
                            ? { fontVariationSettings: "'FILL' 1" }
                            : undefined
                        }
                      >
                        {status === "LUNAS" ? "check_circle" : "flag"}
                      </span>
                      <span className="font-body-md text-body-md text-on-surface">
                        Estimasi Total Pelunasan (BPIH)
                      </span>
                    </div>
                    <span className="font-label-md text-label-md font-medium text-on-surface">
                      {estimasiLoading ? (
                        <SkeletonBar className="h-4 w-28" />
                      ) : (
                        formatRupiah(estimasi?.asumsi.bpih ?? 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Peta Perjalanan Haji */}
            <section className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm md:p-8">
              <h2 className="mb-8 font-headline-sm text-headline-sm text-primary">
                Peta Perjalanan Haji
              </h2>
              <div className="relative w-full py-4">
                {/* Track */}
                <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-surface-variant" />
                {/* Fill */}
                <div
                  className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary to-primary-container transition-all"
                  style={{ width: `${progressPct}%` }}
                />
                {/* Milestones */}
                <div className="relative z-10 flex w-full items-center justify-between">
                  <Milestone
                    icon="how_to_reg"
                    label="Daftar ODP"
                    subtitle="Selesai"
                    state="done"
                  />
                  <Milestone
                    icon="confirmation_number"
                    label="Dapat Porsi"
                    subtitle={
                      status === "BELUM_DAFTAR_PORSI"
                        ? "Belum tercapai"
                        : "Selesai"
                    }
                    state={
                      status === "BELUM_DAFTAR_PORSI"
                        ? status === "BELUM_DAFTAR_PORSI"
                          ? "active"
                          : "upcoming"
                        : "done"
                    }
                  />
                  <Milestone
                    icon="savings"
                    label="Lunas BPIH"
                    subtitle={
                      status === "LUNAS"
                        ? "Selesai"
                        : status === "TERDAFTAR_PORSI"
                          ? "Sedang berjalan"
                          : "Belum"
                    }
                    state={
                      status === "LUNAS"
                        ? "done"
                        : status === "TERDAFTAR_PORSI"
                          ? "active"
                          : "upcoming"
                    }
                  />
                  <Milestone
                    icon="flight_takeoff"
                    label="Berangkat"
                    subtitle={
                      estimasi?.estimasiTahunBerangkat
                        ? `${status === "LUNAS" ? "Siap " : "Estimasi "}${estimasi.estimasiTahunBerangkat}`
                        : "Belum tersedia"
                    }
                    state={status === "LUNAS" ? "active" : "upcoming"}
                    highlight
                  />
                </div>
              </div>
              <div className="mt-8 flex items-start gap-3 rounded-lg bg-surface-container-low p-4">
                <span className="material-symbols-outlined mt-0.5 text-lg text-outline">
                  info
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  * Estimasi keberangkatan didasarkan pada kuota nasional saat
                  ini (
                  {estimasi
                    ? `${angka.format(estimasi.asumsi.kuotaNasionalPerTahun)} jemaah/tahun`
                    : "—"}
                  ) dan asumsi antrian{" "}
                  {estimasi
                    ? angka.format(estimasi.asumsi.antrianNasional)
                    : "—"}{" "}
                  jemaah. Waktu tunggu dapat berubah sesuai kebijakan
                  Pemerintah dan kuota tambahan.
                </p>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-outline-variant bg-surface-container">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-stack-md px-container-padding-desktop py-section-gap md:flex-row">
          <div className="flex flex-col items-center gap-stack-sm text-center md:items-start md:text-left">
            <span className="font-headline-sm text-headline-sm font-semibold text-primary">
              BSI Tabungan Haji
            </span>
            <p className="font-body-sm text-body-sm text-on-surface">
              © 2024 BSI Tabungan Haji. Terdaftar dan Diawasi oleh OJK. Peserta
              Penjaminan LPS.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-gutter">
            {["Syarat & Ketentuan", "Kebijakan Privasi", "Hubungi Kami", "Bantuan"].map(
              (l) => (
                <a
                  key={l}
                  className="rounded font-label-sm text-label-sm text-on-surface-variant underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary focus:ring-2 focus:ring-primary"
                  href="#"
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

function ActionCard({
  loading,
  status,
  kekuranganPelunasan,
  kekuranganSetoranAwal,
}: {
  loading: boolean;
  status: Estimasi["status"] | null;
  kekuranganPelunasan?: string;
  kekuranganSetoranAwal?: string;
}) {
  const isLunas = status === "LUNAS";
  const judul = isLunas
    ? "Tabungan Sudah Lunas"
    : status === "BELUM_DAFTAR_PORSI"
      ? "Capai Setoran Awal Porsi"
      : "Persiapkan Pelunasan";
  const deskripsi = isLunas
    ? "Selamat! Saldo Anda sudah mencapai estimasi BPIH."
    : status === "BELUM_DAFTAR_PORSI"
      ? `Kurang ${loading || !kekuranganSetoranAwal ? "—" : formatRupiah(kekuranganSetoranAwal)} untuk dapat porsi.`
      : `Kurang ${loading || !kekuranganPelunasan ? "—" : formatRupiah(kekuranganPelunasan)} untuk lunas BPIH.`;
  const ctaLabel =
    status === "BELUM_DAFTAR_PORSI"
      ? "Setor untuk Daftar Porsi"
      : isLunas
        ? "Lihat Mutasi"
        : "Setor Lagi untuk Lunas";
  const ctaHref = isLunas ? "/mutasi" : "/setor";

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-primary p-6 text-on-primary shadow-md">
      <div className="pointer-events-none absolute bottom-0 right-0 opacity-10">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "120px" }}
        >
          payments
        </span>
      </div>
      <div className="z-10 mb-6">
        <h3 className="mb-2 font-headline-sm text-headline-sm">{judul}</h3>
        <p className="font-body-sm text-body-sm text-primary-fixed-dim">
          {deskripsi}
        </p>
      </div>
      <Link
        href={ctaHref}
        className="z-10 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary-container px-6 py-3 font-label-md text-label-md text-on-secondary-container shadow-sm transition-colors hover:bg-secondary-fixed"
      >
        <span className="material-symbols-outlined">
          {isLunas ? "receipt_long" : "add_circle"}
        </span>
        {ctaLabel}
      </Link>
    </div>
  );
}

function KekuranganBox({
  loading,
  status,
  kekuranganPelunasan,
  kekuranganSetoranAwal,
}: {
  loading: boolean;
  status: Estimasi["status"] | null;
  kekuranganPelunasan?: string;
  kekuranganSetoranAwal?: string;
}) {
  if (!loading && status === "LUNAS") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-primary-container bg-primary-container/20 p-4">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">
          Status Pelunasan
        </span>
        <span className="flex items-center gap-2 font-headline-md text-headline-md font-semibold text-primary">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
          Lunas
        </span>
      </div>
    );
  }

  const isAwal = status === "BELUM_DAFTAR_PORSI";
  const label = isAwal ? "Kekurangan Setoran Awal" : "Kekurangan Pelunasan";
  const nilai = isAwal ? kekuranganSetoranAwal : kekuranganPelunasan;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-error-container bg-error-container/30 p-4">
      <span className="font-label-sm text-label-sm uppercase tracking-wider text-error">
        {label}
      </span>
      <span className="font-headline-md text-headline-md font-semibold text-error">
        {loading ? (
          <SkeletonBar className="h-7 w-40" />
        ) : (
          formatRupiah(nilai ?? 0)
        )}
      </span>
    </div>
  );
}

function Milestone({
  icon,
  label,
  subtitle,
  state,
  highlight = false,
}: {
  icon: string;
  label: string;
  subtitle: string;
  state: "done" | "active" | "upcoming";
  highlight?: boolean;
}) {
  const dotClass =
    state === "done"
      ? "bg-primary text-on-primary"
      : state === "active"
        ? "bg-secondary-fixed text-on-secondary-container"
        : "border border-outline-variant bg-surface-variant text-outline";
  const labelClass =
    state === "done"
      ? "text-primary"
      : state === "active"
        ? "text-on-surface font-semibold"
        : "text-on-surface-variant";
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm ring-4 ring-surface-container-lowest ${dotClass}`}
      >
        <span className="material-symbols-outlined text-sm">{icon}</span>
      </div>
      <div className="w-24 text-center">
        <div className={`font-label-sm text-label-sm ${labelClass}`}>
          {label}
        </div>
        <div
          className={`font-body-sm text-body-sm text-[10px] ${highlight ? "font-bold text-primary" : "text-outline"}`}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-pulse rounded bg-surface-container-highest/70 align-middle ${className}`}
    />
  );
}
