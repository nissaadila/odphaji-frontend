"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, setPassword } from "@/lib/api";

export default function AktivasiPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nik, setNik] = useState("");
  const [password, setPasswordValue] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState(false);

  const minTercapai = password.length >= 8;

  async function aktifkan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!minTercapai) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== konfirmasi) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      await setPassword({
        email: email.trim(),
        nik: nik.trim(),
        password,
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
    <div className="flex min-h-screen flex-col bg-surface font-body-md text-on-surface antialiased">
      {/* Header minimal */}
      <header className="flex w-full justify-center border-b border-outline-variant/30 bg-surface-container-lowest px-container-padding-desktop py-stack-lg shadow-sm md:justify-start">
        <div className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            mosque
          </span>
          Tabungan Haji ODP
        </div>
      </header>

      {/* Konten utama */}
      <main className="mx-auto flex w-full max-w-[1200px] flex-grow items-center justify-center p-container-padding-mobile md:p-container-padding-desktop">
        <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-stack-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] md:p-section-gap">
          {/* Aksen dekoratif */}
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary to-primary-container" />

          {sukses ? (
            /* State sukses */
            <div className="flex flex-col items-center text-center">
              <span className="material-symbols-outlined mb-stack-md text-5xl text-primary">
                task_alt
              </span>
              <h1 className="mb-stack-sm font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
                Akun Berhasil Diaktivasi
              </h1>
              <p className="mb-stack-lg font-body-sm text-body-sm text-on-surface-variant">
                Kata sandi Anda telah diatur. Sekarang Anda dapat masuk ke akun
                Tabungan Haji ODP menggunakan email dan kata sandi baru Anda.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-label-md text-label-md text-on-primary transition-all hover:bg-primary-container hover:shadow-md focus:ring-4 focus:ring-primary/20 active:scale-[0.98]"
              >
                Masuk Sekarang
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-stack-lg text-center md:text-left">
                <h1 className="mb-stack-sm font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
                  Aktivasi Akun
                </h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Proses satu kali untuk memverifikasi identitas dan mengamankan
                  akun Tabungan Haji ODP Anda.
                </p>
              </div>

              <form className="space-y-stack-lg" onSubmit={aktifkan}>
                {/* Pesan error */}
                {error && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      error
                    </span>
                    {error}
                  </div>
                )}

                {/* Verifikasi Identitas */}
                <div className="space-y-stack-md rounded-lg border border-outline-variant/30 bg-surface-container-low p-stack-md">
                  <h2 className="mb-stack-sm flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      badge
                    </span>
                    Verifikasi Identitas
                  </h2>

                  {/* Email */}
                  <div className="space-y-1">
                    <label
                      className="block font-label-sm text-label-sm text-on-surface"
                      htmlFor="email"
                    >
                      Email Terdaftar
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                        <span className="material-symbols-outlined text-[20px]">
                          mail
                        </span>
                      </span>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contoh@email.com"
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-4 font-body-sm text-body-sm text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {/* NIK */}
                  <div className="space-y-1">
                    <label
                      className="block font-label-sm text-label-sm text-on-surface"
                      htmlFor="nik"
                    >
                      Nomor Induk Kependudukan (NIK)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                        <span className="material-symbols-outlined text-[20px]">
                          credit_card
                        </span>
                      </span>
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
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-4 font-body-sm text-body-sm text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Pengaturan Keamanan */}
                <div className="space-y-stack-md">
                  <h2 className="mb-stack-md flex items-center gap-2 border-b border-outline-variant/30 pb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      lock
                    </span>
                    Pengaturan Keamanan
                  </h2>

                  {/* Kata Sandi Baru */}
                  <div className="space-y-1">
                    <label
                      className="block font-label-sm text-label-sm text-on-surface"
                      htmlFor="password"
                    >
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                        <span className="material-symbols-outlined text-[20px]">
                          key
                        </span>
                      </span>
                      <input
                        id="password"
                        name="password"
                        type={lihatSandi ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPasswordValue(e.target.value)}
                        placeholder="Masukkan kata sandi baru"
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-10 font-body-sm text-body-sm text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => setLihatSandi((v) => !v)}
                        aria-label={
                          lihatSandi
                            ? "Sembunyikan kata sandi"
                            : "Tampilkan kata sandi"
                        }
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline transition-colors hover:text-primary focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {lihatSandi ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                    {/* Indikator kekuatan kata sandi */}
                    <div className="mt-2 grid grid-cols-1 gap-1">
                      <div
                        className={`flex items-center gap-2 ${
                          minTercapai ? "text-primary" : "text-on-surface-variant"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[16px] ${
                            minTercapai ? "text-primary" : "text-outline-variant"
                          }`}
                        >
                          check_circle
                        </span>
                        <span className="font-label-sm text-label-sm">
                          Minimal 8 karakter
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Konfirmasi Kata Sandi */}
                  <div className="space-y-1">
                    <label
                      className="block font-label-sm text-label-sm text-on-surface"
                      htmlFor="confirm_password"
                    >
                      Konfirmasi Kata Sandi
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                        <span className="material-symbols-outlined text-[20px]">
                          password
                        </span>
                      </span>
                      <input
                        id="confirm_password"
                        name="confirm_password"
                        type={lihatSandi ? "text" : "password"}
                        required
                        value={konfirmasi}
                        onChange={(e) => setKonfirmasi(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-4 font-body-sm text-body-sm text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Aksi */}
                <div className="pt-stack-sm">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-label-md text-label-md text-on-primary transition-all hover:bg-primary-container hover:shadow-md focus:ring-4 focus:ring-primary/20 active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? "Memproses..." : "Aktifkan Akun"}
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-stack-md border-t border-outline-variant bg-surface-container-low px-container-padding-desktop py-section-gap md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <div className="font-headline-sm text-headline-sm font-semibold text-primary">
            Tabungan Haji ODP
          </div>
          <p className="max-w-sm text-center font-body-sm text-body-sm text-on-surface md:text-left">
            © 2024 Tabungan Haji ODP. Terdaftar dan Diawasi oleh OJK. Peserta
            Penjaminan LPS.
          </p>
        </div>
        <nav className="flex flex-wrap justify-center gap-stack-md">
          {["Syarat & Ketentuan", "Kebijakan Privasi", "Hubungi Kami", "Bantuan"].map(
            (l) => (
              <Link
                key={l}
                href="#"
                className="rounded font-label-sm text-label-sm text-on-surface-variant underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary focus:ring-2 focus:ring-primary"
              >
                {l}
              </Link>
            ),
          )}
        </nav>
      </footer>
    </div>
  );
}
