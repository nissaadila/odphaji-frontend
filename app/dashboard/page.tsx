"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import {
  ApiError,
  getEstimasi,
  getMe,
  getMutasi,
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
  month: "long",
  year: "numeric",
});

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : tanggalFormatter.format(d);
}

const STATUS_PENDEK: Record<Estimasi["status"], string> = {
  BELUM_DAFTAR_PORSI: "Belum Daftar",
  TERDAFTAR_PORSI: "Terdaftar",
  LUNAS: "Lunas",
};

const navItems: { label: string; icon: string; active?: boolean }[] = [
  { label: "Dashboard", icon: "dashboard", active: true },
  { label: "Setoran", icon: "savings" },
  { label: "Riwayat Transaksi", icon: "history" },
  { label: "Profil", icon: "person" },
  { label: "Bantuan", icon: "help" },
];

function Dashboard() {
  const router = useRouter();
  const [keluar, setKeluar] = useState(false);

  const [me, setMe] = useState<MeResult | null>(null);
  const [estimasi, setEstimasi] = useState<Estimasi | null>(null);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const meData = await getMe();
      setMe(meData);

      if (meData.tabungan) {
        const [est, mut] = await Promise.all([
          getEstimasi(meData.tabungan.id),
          getMutasi(meData.tabungan.id),
        ]);
        setEstimasi(est);
        setTransaksi(mut.data);
      } else {
        setEstimasi(null);
        setTransaksi([]);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal memuat data. Silakan coba lagi.",
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

  const namaDepan = me?.nasabah.nama.split(" ")[0] || "Nasabah";
  const inisial = namaDepan.charAt(0).toUpperCase();
  const tabungan = me?.tabungan ?? null;

  const bpih = estimasi?.asumsi.bpih ?? 50_000_000;
  const saldoNum = tabungan ? Number(tabungan.saldo) : 0;
  const persen = Math.min(100, Math.max(0, Math.round((saldoNum / bpih) * 100)));

  return (
    <div className="relative flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-outline-variant bg-surface p-4 md:flex">
        <div className="flex items-center gap-3 border-b border-outline-variant p-4">
          <div className="rounded-lg bg-primary p-2 text-on-primary">
            <span className="material-symbols-outlined">mosque</span>
          </div>
          <h1 className="text-lg font-bold text-on-surface">Haji ODP</h1>
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-2">
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={
                item.active
                  ? "flex items-center gap-3 rounded-lg bg-primary-container px-4 py-2.5 font-medium text-on-primary-container"
                  : "flex items-center gap-3 rounded-lg px-4 py-2.5 text-on-surface-variant transition-colors hover:bg-surface-variant"
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            disabled={keluar}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-on-surface-variant transition-colors hover:bg-surface-variant disabled:opacity-50"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>{keluar ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-on-background">
              Selamat Datang, {namaDepan}
            </h2>
            <p className="mt-1 text-on-surface-variant">
              Berikut adalah ringkasan tabungan haji Anda.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              aria-label="Notifikasi"
              className="relative rounded-full p-2 transition-colors hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined text-on-surface-variant">
                notifications
              </span>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-bold text-on-primary-container">
              {inisial}
            </div>
          </div>
        </header>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface p-6 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">
              progress_activity
            </span>
            <span>Memuat data...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-error/30 bg-error-container p-6 text-on-error-container sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
            <button
              onClick={muat}
              className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-on-error transition-opacity hover:opacity-90"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Belum punya tabungan */}
        {!loading && !error && !tabungan && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-primary-container">
              account_balance_wallet
            </span>
            <h3 className="text-xl font-bold text-on-surface">
              Anda belum memiliki Tabungan Haji
            </h3>
            <p className="max-w-md text-on-surface-variant">
              Buka tabungan haji untuk mulai merencanakan keberangkatan ibadah
              Anda.
            </p>
          </div>
        )}

        {/* Konten utama */}
        {!loading && !error && tabungan && (
          <>
            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-outline-variant bg-surface p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary-container p-3 text-on-primary-container">
                    <span className="material-symbols-outlined">
                      account_balance_wallet
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-on-surface-variant">Total Saldo</p>
                    <p className="text-2xl font-bold text-on-surface">
                      {formatRupiah(tabungan.saldo)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-outline-variant bg-surface p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-secondary-container p-3 text-on-secondary-container">
                    <span className="material-symbols-outlined">
                      flight_takeoff
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-on-surface-variant">
                      Estimasi Keberangkatan
                    </p>
                    <p className="text-2xl font-bold text-on-surface">
                      {estimasi?.estimasiTahunBerangkat ?? "-"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-outline-variant bg-surface p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-tertiary-container p-3 text-on-tertiary-container">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div>
                    <p className="text-sm text-on-surface-variant">Status Porsi</p>
                    <p className="text-2xl font-bold text-on-surface">
                      {estimasi ? STATUS_PENDEK[estimasi.status] : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress & Transactions */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Progress */}
              <div className="rounded-xl border border-outline-variant bg-surface p-6 lg:col-span-2">
                <h3 className="mb-4 text-xl font-bold text-on-surface">
                  Progres Menuju Keberangkatan
                </h3>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface-variant">
                    Saldo Saat Ini
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {formatRupiah(tabungan.saldo)} / {formatRupiah(bpih)}
                  </span>
                </div>
                <div className="h-4 w-full rounded-full bg-surface-variant">
                  <div
                    className="h-4 rounded-full bg-primary"
                    style={{ width: `${persen}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Anda telah mencapai {persen}% dari target setoran pelunasan
                  BPIH.
                </p>

                <div className="mt-6 border-t border-outline-variant pt-6">
                  <h4 className="mb-4 font-bold text-on-surface">Aksi Cepat</h4>
                  <div className="flex flex-wrap gap-4">
                    <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-on-primary transition-all hover:bg-opacity-90">
                      <span className="material-symbols-outlined">add_card</span>
                      <span>Setor Dana</span>
                    </button>
                    <button className="flex items-center gap-2 rounded-lg bg-surface-variant px-4 py-2 font-medium text-on-surface-variant transition-all hover:bg-opacity-80">
                      <span className="material-symbols-outlined">calculate</span>
                      <span>Estimasi</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="rounded-xl border border-outline-variant bg-surface p-6">
                <h3 className="mb-4 text-xl font-bold text-on-surface">
                  Transaksi Terkini
                </h3>
                {transaksi.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    Belum ada transaksi.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {transaksi.map((t) => {
                      const kredit = t.jenis === "SETOR";
                      return (
                        <div key={t.id} className="flex items-center gap-4">
                          <div
                            className={`rounded-full p-2 ${
                              kredit
                                ? "bg-primary-container text-on-primary-container"
                                : "bg-secondary-container text-on-secondary-container"
                            }`}
                          >
                            <span className="material-symbols-outlined">
                              {kredit ? "arrow_upward" : "arrow_downward"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-on-surface">
                              {kredit ? "Setoran" : t.jenis}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              {formatTanggal(t.waktu)}
                            </p>
                          </div>
                          <p
                            className={`font-bold ${
                              kredit ? "text-primary" : "text-error"
                            }`}
                          >
                            {kredit ? "+ " : "- "}
                            {formatRupiah(t.nominal)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
