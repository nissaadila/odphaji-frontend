"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminGuard } from "@/components/admin-guard";
import { ApiError, logout } from "@/lib/api";
import {
  nasabahApi,
  type Nasabah,
  type CreateNasabahInput,
} from "@/lib/nasabah";

export default function NasabahPage() {
  return (
    <AdminGuard>
      <NasabahView />
    </AdminGuard>
  );
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

// Sembunyikan tengah NIK (16 digit) → "1234********7890". Tampilkan minimal
// data sensitif di tabel untuk mengurangi paparan PII di layar admin.
function maskNik(nik: string): string {
  if (!nik || nik.length < 8) return "•".repeat(nik?.length ?? 4);
  return `${nik.slice(0, 4)}${"•".repeat(nik.length - 8)}${nik.slice(-4)}`;
}

const KOSONG: CreateNasabahInput = {
  nik: "",
  nama: "",
  email: "",
  nomorHp: "",
};

const PAGE_SIZE = 20;

function NasabahView() {
  const router = useRouter();
  const [keluar, setKeluar] = useState(false);

  const [list, setList] = useState<Nasabah[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state — null artinya form tertutup. Object berarti tambah (id kosong)
  // atau edit (id terisi).
  const [form, setForm] = useState<
    null | { id: string | null; data: CreateNasabahInput }
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Hapus state — null = tidak konfirmasi. Object = sedang konfirmasi target.
  const [hapus, setHapus] = useState<Nasabah | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await nasabahApi.list({ q, page, pageSize: PAGE_SIZE });
      setList(r.data);
      setTotal(r.total);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal memuat daftar nasabah.",
      );
    } finally {
      setLoading(false);
    }
  }, [q, page]);

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

  function bukaTambah() {
    setForm({ id: null, data: { ...KOSONG } });
    setFormError(null);
  }

  function bukaEdit(n: Nasabah) {
    setForm({
      id: n.id,
      data: { nik: n.nik, nama: n.nama, email: n.email, nomorHp: n.nomorHp },
    });
    setFormError(null);
  }

  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (!form || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      if (form.id) {
        await nasabahApi.update(form.id, form.data);
      } else {
        await nasabahApi.create(form.data);
      }
      setForm(null);
      await muat();
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Gagal menyimpan. Coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function konfirmasiHapus() {
    if (!hapus || menghapus) return;
    setMenghapus(true);
    setHapusError(null);
    try {
      await nasabahApi.remove(hapus.id);
      setHapus(null);
      // Kalau baris terakhir di halaman terakhir terhapus, mundur halaman.
      if (list.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await muat();
      }
    } catch (err) {
      setHapusError(
        err instanceof ApiError
          ? err.message
          : "Gagal menghapus. Coba lagi.",
      );
    } finally {
      setMenghapus(false);
    }
  }

  const totalPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
              aria-current="page"
              className="rounded-md border-b-2 border-primary px-3 py-2 font-label-md text-label-md font-bold text-primary"
              href="/nasabah"
            >
              Kelola Nasabah
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
      <main className="mx-auto flex w-full max-w-[1200px] flex-grow flex-col gap-section-gap px-container-padding-mobile py-section-gap md:px-container-padding-desktop">
        {/* Header */}
        <section className="flex flex-col items-start justify-between gap-stack-md md:flex-row md:items-center">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
              Kelola Nasabah
            </h1>
            <p className="mt-stack-sm font-body-md text-body-md text-on-surface-variant">
              Daftar nasabah terdaftar. Hanya admin yang dapat mengakses
              halaman ini.
            </p>
          </div>
          <button
            onClick={bukaTambah}
            className="flex items-center gap-2 rounded-lg bg-primary-container px-5 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Nasabah
          </button>
        </section>

        {/* Toolbar: search */}
        <section className="flex flex-col gap-stack-md sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQ(qInput);
            }}
            className="relative w-full sm:max-w-md"
          >
            <span className="pointer-events-none material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              type="search"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Cari nama, email, NIK, atau no HP..."
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-10 pr-3 font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </form>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {loading
              ? "Memuat..."
              : `Menampilkan ${list.length} dari ${total} nasabah`}
          </p>
        </section>

        {/* Error list */}
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-stack-md rounded-xl border border-error/30 bg-error-container p-stack-lg text-on-error-container shadow-sm"
          >
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

        {/* Tabel */}
        <section className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="p-4 font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Nama
                  </th>
                  <th className="p-4 font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Email
                  </th>
                  <th className="hidden p-4 font-label-sm text-label-sm uppercase text-on-surface-variant md:table-cell">
                    NIK
                  </th>
                  <th className="hidden p-4 font-label-sm text-label-sm uppercase text-on-surface-variant md:table-cell">
                    No. HP
                  </th>
                  <th className="hidden p-4 font-label-sm text-label-sm uppercase text-on-surface-variant lg:table-cell">
                    Terdaftar
                  </th>
                  <th className="p-4 text-right font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-stack-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                        Memuat data...
                      </span>
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-stack-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    >
                      Tidak ada nasabah ditemukan.
                    </td>
                  </tr>
                ) : (
                  list.map((n) => (
                    <NasabahRow
                      key={n.id}
                      nasabah={n}
                      onEdit={bukaEdit}
                      onDelete={(target) => {
                        setHapusError(null);
                        setHapus(target);
                      }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && total > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-stack-md border-t border-outline-variant/30 p-stack-md">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Halaman {page} dari {totalPage}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-lg border border-outline-variant px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
                  disabled={page >= totalPage || loading}
                  className="rounded-lg border border-outline-variant px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-outline-variant bg-surface-container">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-stack-md px-container-padding-desktop py-section-gap md:flex-row">
          <div className="flex flex-col items-center gap-stack-sm text-center md:items-start md:text-left">
            <span className="font-headline-sm text-headline-sm font-semibold text-primary">
              BSI Tabungan Haji
            </span>
            <p className="font-body-sm text-body-sm text-on-surface">
              © 2024 BSI Tabungan Haji. Panel admin — akses terbatas.
            </p>
          </div>
        </div>
      </footer>

      {/* Form modal */}
      {form && (
        <FormModal
          mode={form.id ? "edit" : "tambah"}
          data={form.data}
          submitting={submitting}
          error={formError}
          onChange={(patch) =>
            setForm((prev) =>
              prev ? { ...prev, data: { ...prev.data, ...patch } } : prev,
            )
          }
          onCancel={() => setForm(null)}
          onSubmit={simpan}
        />
      )}

      {/* Hapus konfirmasi */}
      {hapus && (
        <ConfirmHapusModal
          target={hapus}
          processing={menghapus}
          error={hapusError}
          onCancel={() => setHapus(null)}
          onConfirm={konfirmasiHapus}
        />
      )}
    </div>
  );
}

function NasabahRow({
  nasabah,
  onEdit,
  onDelete,
}: {
  nasabah: Nasabah;
  onEdit: (n: Nasabah) => void;
  onDelete: (n: Nasabah) => void;
}) {
  return (
    <tr className="transition-colors hover:bg-surface-container-lowest/50">
      <td className="p-4 font-body-sm text-body-sm font-medium text-on-surface">
        {nasabah.nama}
      </td>
      <td className="p-4 font-body-sm text-body-sm text-on-surface-variant">
        {nasabah.email}
      </td>
      <td className="hidden p-4 font-body-sm text-body-sm font-mono tracking-wider text-on-surface-variant md:table-cell">
        {maskNik(nasabah.nik)}
      </td>
      <td className="hidden p-4 font-body-sm text-body-sm text-on-surface-variant md:table-cell">
        {nasabah.nomorHp}
      </td>
      <td className="hidden p-4 font-body-sm text-body-sm text-on-surface-variant lg:table-cell">
        {formatTanggal(nasabah.createdAt)}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(nasabah)}
            title="Edit"
            aria-label={`Edit ${nasabah.nama}`}
            className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button
            onClick={() => onDelete(nasabah)}
            title="Hapus"
            aria-label={`Hapus ${nasabah.nama}`}
            className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
          >
            <span className="material-symbols-outlined text-[20px]">
              delete
            </span>
          </button>
        </div>
      </td>
    </tr>
  );
}

function FormModal({
  mode,
  data,
  submitting,
  error,
  onChange,
  onCancel,
  onSubmit,
}: {
  mode: "tambah" | "edit";
  data: CreateNasabahInput;
  submitting: boolean;
  error: string | null;
  onChange: (patch: Partial<CreateNasabahInput>) => void;
  onCancel: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-container-padding-mobile">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg">
        <div className="flex items-center justify-between border-b border-outline-variant/30 p-stack-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {mode === "tambah" ? "Tambah Nasabah" : "Edit Nasabah"}
          </h2>
          <button
            onClick={onCancel}
            aria-label="Tutup"
            className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-stack-lg">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container"
            >
              <span className="material-symbols-outlined text-[18px]">
                error
              </span>
              {error}
            </div>
          )}
          <FormField
            label="Nama"
            value={data.nama}
            onChange={(v) => onChange({ nama: v })}
            placeholder="Nama lengkap"
            required
          />
          <FormField
            label="Email"
            type="email"
            value={data.email}
            onChange={(v) => onChange({ email: v })}
            placeholder="nasabah@example.com"
            required
          />
          <FormField
            label="NIK"
            value={data.nik}
            onChange={(v) => onChange({ nik: v.replace(/\D/g, "").slice(0, 16) })}
            placeholder="16 digit"
            inputMode="numeric"
            required
          />
          <FormField
            label="No. HP"
            value={data.nomorHp}
            onChange={(v) =>
              onChange({ nomorHp: v.replace(/[^\d]/g, "").slice(0, 13) })
            }
            placeholder="08xxxxxxxxxx"
            inputMode="tel"
            required
          />
          <div className="flex justify-end gap-2 pt-stack-md">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="rounded-lg border border-outline-variant px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-primary-container px-5 py-2 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary disabled:opacity-50"
            >
              {submitting && (
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
              )}
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "email";
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-label-md text-label-md text-on-surface">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface transition-colors placeholder:text-outline-variant/60 focus:border-primary focus:outline-none focus:ring focus:ring-primary/20"
      />
    </label>
  );
}

function ConfirmHapusModal({
  target,
  processing,
  error,
  onCancel,
  onConfirm,
}: {
  target: Nasabah;
  processing: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-container-padding-mobile">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg">
        <div className="space-y-4 p-stack-lg">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-error">
              warning
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Hapus Nasabah?
            </h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Anda akan menghapus permanen{" "}
            <strong className="text-on-surface">{target.nama}</strong> (
            {target.email}). Aksi ini tidak dapat dibatalkan.
          </p>
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container"
            >
              <span className="material-symbols-outlined text-[18px]">
                error
              </span>
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-stack-md">
            <button
              onClick={onCancel}
              disabled={processing}
              className="rounded-lg border border-outline-variant px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={processing}
              className="flex items-center gap-2 rounded-lg bg-error px-5 py-2 font-label-md text-label-md text-on-error transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {processing && (
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
              )}
              {processing ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
