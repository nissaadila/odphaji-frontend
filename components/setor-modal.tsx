"use client";

import { useEffect, useState } from "react";
import { ApiError, setorTabungan, type SetorResult } from "@/lib/api";

const NOMINAL_MIN = 100_000;
const PILIHAN_CEPAT = [500_000, 1_000_000, 2_500_000, 5_000_000];

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function SetorModal({
  tabunganId,
  onClose,
  onSuccess,
}: {
  tabunganId: string;
  onClose: () => void;
  onSuccess: (result: SetorResult) => void;
}) {
  const [nominal, setNominal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tutup dengan tombol Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, loading]);

  const valid = Number.isInteger(nominal) && nominal >= NOMINAL_MIN;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || loading) return;
    setError(null);
    setLoading(true);
    try {
      const result = await setorTabungan(tabunganId, nominal);
      onSuccess(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal melakukan setoran. Silakan coba lagi.",
      );
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/40 p-container-padding-mobile backdrop-blur-sm"
      onMouseDown={() => {
        if (!loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="setor-judul"
        className="w-full max-w-md rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-stack-lg shadow-ambient"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-stack-lg flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">
              account_balance_wallet
            </span>
            <h2
              id="setor-judul"
              className="font-headline-sm text-headline-sm text-on-surface"
            >
              Setor Dana
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Tutup"
            className="text-on-surface-variant transition-colors hover:text-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-stack-lg">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container"
            >
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}

          {/* Input nominal */}
          <div className="flex flex-col gap-2">
            <label
              className="font-label-md text-label-md text-on-surface"
              htmlFor="nominal"
            >
              Nominal Setoran
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body-md text-body-md text-on-surface-variant">
                Rp
              </span>
              <input
                id="nominal"
                inputMode="numeric"
                autoFocus
                value={nominal ? nominal.toLocaleString("id-ID") : ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setNominal(digits ? Number(digits) : 0);
                }}
                placeholder="0"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-11 pr-4 text-right font-body-lg text-body-lg font-semibold text-on-surface transition-colors placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Minimal {rupiah.format(NOMINAL_MIN)} per setoran.
            </p>
          </div>

          {/* Pilihan cepat */}
          <div className="flex flex-wrap gap-2">
            {PILIHAN_CEPAT.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setNominal(v)}
                className={`rounded-full border px-3 py-1.5 font-label-sm text-label-sm transition-colors ${
                  nominal === v
                    ? "border-primary-container bg-primary-container text-on-primary"
                    : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                }`}
              >
                {rupiah.format(v)}
              </button>
            ))}
          </div>

          {/* Aksi */}
          <div className="mt-stack-sm flex justify-end gap-stack-md">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-5 py-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!valid || loading}
              className="flex items-center gap-2 rounded-lg bg-primary-container px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  progress_activity
                </span>
              )}
              {loading ? "Memproses..." : "Setor Sekarang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
