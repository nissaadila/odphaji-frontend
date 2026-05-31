"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import {
  ApiError,
  bukaTabungan,
  getEstimasi,
  getMe,
  getMutasi,
  getTabungan,
  logout,
  type Estimasi,
  type MeResult,
  type Transaksi,
} from "@/lib/api";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
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
});

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : tanggalFormatter.format(d);
}

function maskRekening(no: string): string {
  if (!no) return "";
  const last4 = no.slice(-4);
  const hidden = "•".repeat(Math.max(0, no.length - 4));
  return (hidden + last4).replace(/(.{4})/g, "$1 ").trim();
}

function formatRekening(no: string): string {
  return no.replace(/(.{4})/g, "$1 ").trim();
}

const STATUS_LABEL: Record<Estimasi["status"], string> = {
  BELUM_DAFTAR_PORSI: "BELUM DAFTAR PORSI",
  TERDAFTAR_PORSI: "TERDAFTAR PORSI",
  LUNAS: "LUNAS",
};

const JENIS_LABEL: Record<string, string> = {
  SETOR: "Setoran",
  TARIK: "Penarikan",
};

function Dashboard() {
  const router = useRouter();
  const [keluar, setKeluar] = useState(false);

  const [me, setMe] = useState<MeResult | null>(null);
  const [estimasi, setEstimasi] = useState<Estimasi | null>(null);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [meLoading, setMeLoading] = useState(true);
  const [estimasiLoading, setEstimasiLoading] = useState(false);
  const [mutasiLoading, setMutasiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [membuka, setMembuka] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tampilRekening, setTampilRekening] = useState(false);

  const muat = useCallback(async () => {
    setMeLoading(true);
    setError(null);
    let meData: MeResult;
    try {
      meData = await getMe();
      setMe(meData);
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

    if (!meData.tabungan) {
      setEstimasi(null);
      setTransaksi([]);
      return;
    }

    const tabunganId = meData.tabungan.id;
    setEstimasiLoading(true);
    setMutasiLoading(true);

    void getEstimasi(tabunganId)
      .then((est) => setEstimasi(est))
      .catch(() => {
        /* biarkan estimasi null; card menampilkan placeholder "-" */
      })
      .finally(() => setEstimasiLoading(false));

    void getMutasi(tabunganId)
      .then((mut) => setTransaksi(mut.data))
      .catch(() => {
        /* biarkan transaksi kosong; tabel menampilkan "Belum ada transaksi." */
      })
      .finally(() => setMutasiLoading(false));
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

  // POST /tabungan-haji — buka tabungan haji baru untuk nasabah yang login.
  async function handleBukaTabungan() {
    if (!me || membuka) return;
    setMembuka(true);
    setError(null);
    try {
      await bukaTabungan(me.nasabah.id);
      await muat();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal membuka tabungan haji. Silakan coba lagi.",
      );
    } finally {
      setMembuka(false);
    }
  }

  // GET /tabungan-haji/:id — muat ulang saldo terbaru.
  async function refreshSaldo() {
    if (!tabungan || refreshing) return;
    setRefreshing(true);
    try {
      const terbaru = await getTabungan(tabungan.id);
      setMe((prev) => (prev ? { ...prev, tabungan: terbaru } : prev));
    } catch {
      // diamkan: refresh manual, error sementara tidak perlu mengganggu UI
    } finally {
      setRefreshing(false);
    }
  }

  const namaDepan = me?.nasabah.nama.split(" ")[0] || "Nasabah";
  const tabungan = me?.tabungan ?? null;

  const bpih = estimasi?.asumsi.bpih ?? 50_000_000;
  const setoranAwalPorsi = estimasi?.asumsi.setoranAwalPorsi ?? 25_000_000;
  const saldoNum = tabungan ? Number(tabungan.saldo) : 0;
  const persen = Math.min(100, Math.max(0, (saldoNum / bpih) * 100));
  const persenPorsi = Math.min(100, (setoranAwalPorsi / bpih) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-background font-body-md text-on-background">
      {/* TopAppBar */}
      <header className="top-0 z-50 w-full border-b border-outline-variant bg-surface shadow-sm">
        <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-between px-container-padding-desktop">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-headline-md font-bold text-primary">
              🕋 BSI Tabungan Haji
            </span>
          </div>
          {/* Navigation (desktop) */}
          <nav className="hidden gap-8 md:flex">
            <a
              className="border-b-2 border-primary pb-1 font-label-md text-label-md font-bold text-primary transition-all hover:bg-surface-container-low"
              href="#"
            >
              Dashboard
            </a>
            <Link
              className="font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              href="/mutasi"
            >
              Mutasi
            </Link>
            <Link
              className="font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              href="/estimasi"
            >
              Estimasi
            </Link>
            {me?.isAdmin && (
              <Link
                className="font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                href="/nasabah"
              >
                Kelola Nasabah
              </Link>
            )}
          </nav>
          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              aria-label="notifications"
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                notifications
              </span>
            </button>
            <button
              aria-label="account_circle"
              className="text-on-surface-variant transition-colors hover:text-primary"
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
              className="hidden font-label-md text-label-md text-error transition-opacity hover:opacity-80 disabled:opacity-50 md:block"
            >
              {keluar ? "Keluar..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-[1200px] flex-grow flex-col gap-section-gap px-container-padding-mobile py-section-gap md:px-container-padding-desktop">
        {/* Welcome */}
        <section>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
            Assalamualaikum, {namaDepan} 👋
          </h1>
          <p className="mt-stack-sm font-body-md text-body-md text-on-surface-variant">
            Selamat datang kembali di Tabungan Haji Anda.
          </p>
        </section>

        {/* Error (getMe gagal) */}
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

        {/* Skeleton saat me masih loading */}
        {meLoading && (
          <section className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </section>
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
              Buka tabungan haji untuk mulai merencanakan keberangkatan ibadah
              Anda.
            </p>
            <button
              onClick={handleBukaTabungan}
              disabled={membuka}
              className="mt-stack-sm flex items-center gap-2 rounded-lg bg-primary-container px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {membuka ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">
                  add
                </span>
              )}
              {membuka ? "Membuka..." : "Buka Tabungan Haji"}
            </button>
          </div>
        )}

        {/* Konten utama (punya tabungan) */}
        {!meLoading && !error && tabungan && (
          <>
            {/* Key Cards */}
            <section className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              {/* Balance Card */}
              <div className="relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-stack-lg shadow-sm">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-container opacity-10 blur-2xl" />
                <div className="relative z-10 mb-stack-md flex items-start justify-between">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Saldo Tabungan Haji
                    </p>
                    <h2 className="mt-stack-sm font-headline-xl-mobile text-headline-xl-mobile text-primary md:font-headline-xl md:text-headline-xl">
                      {formatRupiah(tabungan.saldo)}
                    </h2>
                  </div>
                  <button
                    onClick={refreshSaldo}
                    disabled={refreshing}
                    aria-label="Muat ulang saldo"
                    title="Muat ulang saldo"
                    className="text-primary-container opacity-80 transition-opacity hover:opacity-100 disabled:opacity-50"
                  >
                    <span
                      className={`material-symbols-outlined text-4xl ${
                        refreshing ? "animate-spin" : ""
                      }`}
                    >
                      {refreshing ? "progress_activity" : "refresh"}
                    </span>
                  </button>
                </div>
                <div className="relative z-10 mt-stack-lg flex flex-col items-start justify-between gap-stack-sm border-t border-outline-variant/50 pt-stack-md sm:flex-row sm:items-center">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      No. Rekening
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-body-sm text-body-sm font-medium tracking-wider text-on-surface">
                        {tampilRekening
                          ? formatRekening(tabungan.nomorRekening)
                          : maskRekening(tabungan.nomorRekening)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setTampilRekening((v) => !v)}
                        aria-label={
                          tampilRekening
                            ? "Sembunyikan nomor rekening"
                            : "Tampilkan nomor rekening"
                        }
                        aria-pressed={tampilRekening}
                        title={
                          tampilRekening
                            ? "Sembunyikan nomor rekening"
                            : "Tampilkan nomor rekening"
                        }
                        className="text-on-surface-variant transition-colors hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {tampilRekening ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="rounded-full bg-primary-container/10 px-3 py-1">
                    <span className="font-label-sm text-label-sm font-semibold text-primary-container">
                      {tabungan.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Porsi Card */}
              <div className="relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-stack-lg shadow-sm">
                <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-secondary-container opacity-20 blur-2xl" />
                <div className="relative z-10 mb-stack-md flex items-start justify-between">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Status Pendaftaran
                    </p>
                    <div className="mt-stack-sm flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-secondary-fixed-dim"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <h3 className="font-headline-md text-headline-md text-on-secondary-container">
                        {estimasiLoading ? (
                          <SkeletonBar className="h-6 w-40" />
                        ) : estimasi ? (
                          STATUS_LABEL[estimasi.status]
                        ) : (
                          "-"
                        )}
                      </h3>
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary-container/20 p-2">
                    <span className="material-symbols-outlined text-on-secondary-container">
                      mosque
                    </span>
                  </div>
                </div>
                <div className="relative z-10 mt-stack-lg grid grid-cols-2 gap-gutter border-t border-outline-variant/50 pt-stack-md">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Estimasi Keberangkatan
                    </p>
                    <p className="font-headline-sm text-headline-sm text-on-surface">
                      {estimasiLoading ? (
                        <SkeletonBar className="h-5 w-28" />
                      ) : estimasi?.estimasiTahunBerangkat ? (
                        `Tahun ${estimasi.estimasiTahunBerangkat}`
                      ) : (
                        "Belum tersedia"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Masa Tunggu
                    </p>
                    <p className="font-body-md text-body-md font-medium text-on-surface-variant">
                      {estimasiLoading ? (
                        <SkeletonBar className="h-4 w-20" />
                      ) : estimasi ? (
                        `~${estimasi.waktuTungguTahun} Tahun`
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Progress */}
            <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-stack-lg shadow-sm">
              <div className="mb-stack-md flex flex-col justify-between gap-stack-sm md:flex-row md:items-end">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    Progress Menuju Pelunasan
                  </h3>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                    Target BPIH: {formatRupiah(bpih)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-headline-md text-headline-md text-primary">
                    {Math.round(persen)}%
                  </span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-fixed-dim to-primary"
                  style={{ width: `${persen}%` }}
                />
                <div
                  className="absolute bottom-0 top-0 z-10 w-[2px] bg-secondary-fixed"
                  style={{ left: `${persenPorsi}%` }}
                />
                <div
                  className="absolute top-1/2 z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary-fixed shadow-sm"
                  style={{ left: `${persenPorsi}%` }}
                  title="Setoran Awal (Porsi)"
                />
              </div>
              <div className="mt-2 flex justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Rp 0
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {formatRupiah(setoranAwalPorsi)} (Porsi)
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {formatRupiah(bpih)}
                </span>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="flex flex-wrap justify-center gap-gutter md:justify-start">
              <Link
                href="/setor"
                className="flex items-center gap-2 rounded-lg bg-primary-container px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary"
              >
                <span className="material-symbols-outlined text-sm">add</span> Setor
                Dana
              </Link>
              <Link
                href="/mutasi"
                className="flex items-center gap-2 rounded-lg border border-primary-container bg-surface-container-lowest px-6 py-3 font-label-md text-label-md text-primary-container transition-colors hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-sm">
                  receipt_long
                </span>{" "}
                Lihat Mutasi
              </Link>
              {Number(tabungan.saldo) > 0 && (
                <Link
                  href="/tarik"
                  className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-6 py-3 font-label-md text-label-md text-primary-container transition-colors hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-sm">
                    output
                  </span>{" "}
                  Tarik Dana
                </Link>
              )}
              <Link
                href="/estimasi"
                className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-6 py-3 font-label-md text-label-md text-primary-container transition-colors hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-sm">
                  calendar_month
                </span>{" "}
                Estimasi Haji
              </Link>
            </section>

            {/* Recent Transactions */}
            <section className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
              <div className="flex items-center justify-between border-b border-outline-variant/50 p-stack-lg">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Transaksi Terakhir
                </h3>
                <Link
                  className="font-label-md text-label-md text-primary hover:underline"
                  href="/mutasi"
                >
                  Lihat Semua
                </Link>
              </div>
              <div className="overflow-x-auto">
                {mutasiLoading ? (
                  <SkeletonTransaksiRows />
                ) : transaksi.length === 0 ? (
                  <p className="p-stack-lg font-body-sm text-body-sm text-on-surface-variant">
                    Belum ada transaksi.
                  </p>
                ) : (
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
                          Saldo
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
                                <span className="font-body-sm text-body-sm text-on-surface">
                                  {JENIS_LABEL[t.jenis] ?? t.jenis}
                                </span>
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
                )}
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

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-pulse rounded bg-surface-container-highest/70 align-middle ${className}`}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-stack-lg shadow-sm">
      <div className="space-y-3">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-8 w-48" />
      </div>
      <div className="mt-stack-lg flex items-center justify-between gap-stack-sm border-t border-outline-variant/50 pt-stack-md">
        <div className="space-y-2">
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="h-4 w-32" />
        </div>
        <SkeletonBar className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonTransaksiRows() {
  return (
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
            Saldo
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {[0, 1, 2].map((i) => (
          <tr key={i}>
            <td className="p-4">
              <SkeletonBar className="h-4 w-20" />
            </td>
            <td className="p-4">
              <SkeletonBar className="h-4 w-24" />
            </td>
            <td className="p-4 text-right">
              <SkeletonBar className="ml-auto h-4 w-24" />
            </td>
            <td className="hidden p-4 text-right sm:table-cell">
              <SkeletonBar className="ml-auto h-4 w-28" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
