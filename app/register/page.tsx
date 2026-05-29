"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, registerNasabah } from "@/lib/api";

/** Ubah input nomor telepon menjadi format backend "08xxxxxxxxxx". */
function buildNomorHp(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("62")) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");
  return "0" + digits;
}

export default function RegisterPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState(false);

  async function daftar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerNasabah({
        nik: nik.trim(),
        nama: nama.trim(),
        email: email.trim(),
        nomorHp: buildNomorHp(phone),
      });
      setSukses(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Terjadi kesalahan. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-on-background">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-outline-variant px-6 py-4 md:px-10">
        <div className="flex items-center gap-3 text-primary">
          <span className="material-symbols-outlined text-3xl">mosque</span>
          <h2 className="text-xl font-bold tracking-tight">Tabungan Haji ODP</h2>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          <a className="text-sm font-medium transition-colors hover:text-primary" href="#">
            Beranda
          </a>
          <a className="text-sm font-medium transition-colors hover:text-primary" href="#">
            Layanan
          </a>
          <a className="text-sm font-medium transition-colors hover:text-primary" href="#">
            Tentang Kami
          </a>
          <a className="text-sm font-medium transition-colors hover:text-primary" href="#">
            Kontak
          </a>
        </nav>
        <button className="text-on-background md:hidden" aria-label="Menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-lg flex-col">
          {sukses ? (
            /* State sukses */
            <div className="rounded-xl border border-outline-variant bg-surface p-8 text-center shadow-sm">
              <span className="material-symbols-outlined mb-4 text-5xl text-primary">
                mark_email_read
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-on-background">
                Pendaftaran Berhasil
              </h1>
              <p className="mt-2 text-base text-on-surface-variant">
                Akun Anda berhasil dibuat. Kami telah mengirim email verifikasi
                ke <span className="font-medium text-on-surface">{email}</span>.
                Silakan lanjutkan dengan mengaktifkan akun untuk mengatur kata
                sandi.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/aktivasi"
                  className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-bold tracking-wide text-on-primary transition-all hover:bg-opacity-90"
                >
                  Aktifkan Akun
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Kembali ke halaman masuk
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Title */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-on-background">
                  Buat Akun Baru
                </h1>
                <p className="mt-2 text-base text-on-surface-variant">
                  Mulai perjalanan suci Anda bersama kami. Daftar untuk membuka
                  rekening Tabungan Haji.
                </p>
              </div>

              {/* Form Card */}
              <div className="rounded-xl border border-outline-variant bg-surface p-8 shadow-sm">
                <form className="space-y-6" onSubmit={daftar}>
                  {/* Error */}
                  {error && (
                    <div
                      role="alert"
                      className="flex items-center gap-2 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        error
                      </span>
                      {error}
                    </div>
                  )}

                  {/* Nama Lengkap */}
                  <div>
                    <label
                      className="block pb-2 text-sm font-medium text-on-surface-variant"
                      htmlFor="full-name"
                    >
                      Nama Lengkap
                    </label>
                    <input
                      id="full-name"
                      name="full-name"
                      type="text"
                      required
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Masukkan nama lengkap sesuai KTP"
                      className="h-12 w-full rounded-lg border border-outline-variant bg-background px-4 text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* NIK */}
                  <div>
                    <label
                      className="block pb-2 text-sm font-medium text-on-surface-variant"
                      htmlFor="nik"
                    >
                      Nomor Induk Kependudukan (NIK)
                    </label>
                    <input
                      id="nik"
                      name="nik"
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={16}
                      pattern="[0-9]{16}"
                      value={nik}
                      onChange={(e) =>
                        setNik(e.target.value.replace(/\D/g, "").slice(0, 16))
                      }
                      placeholder="Masukkan 16 digit NIK"
                      className="h-12 w-full rounded-lg border border-outline-variant bg-background px-4 text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      className="block pb-2 text-sm font-medium text-on-surface-variant"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh@email.com"
                      className="h-12 w-full rounded-lg border border-outline-variant bg-background px-4 text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Nomor Telepon */}
                  <div>
                    <label
                      className="block pb-2 text-sm font-medium text-on-surface-variant"
                      htmlFor="phone"
                    >
                      Nomor Telepon
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="Masukkan nomor telepon aktif"
                      className="h-12 w-full rounded-lg border border-outline-variant bg-background px-4 text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Submit */}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-bold tracking-wide text-on-primary transition-all hover:bg-opacity-90 disabled:opacity-60"
                    >
                      {loading ? "Memproses..." : "Daftar Sekarang"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Login Link */}
              <p className="mt-8 text-center text-sm text-on-surface-variant">
                Sudah punya akun?{" "}
                <Link className="font-medium text-primary hover:underline" href="/login">
                  Masuk di sini
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
