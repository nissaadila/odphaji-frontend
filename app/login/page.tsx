"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, login, saveSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ingatSaya, setIngatSaya] = useState(true);
  const [lihatSandi, setLihatSandi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  async function masuk(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      saveSession(result, ingatSaya);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrorCode(err.code);
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-container-padding-mobile md:p-container-padding-desktop">
      <main className="flex w-full max-w-[1000px] flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-ambient md:flex-row">
        {/* Sisi kiri: branding & ilustrasi */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-surface-container-low p-10 md:flex md:w-5/12">
          <div className="z-10">
            <h1 className="flex items-center gap-2 font-headline-lg text-headline-lg text-primary">
              <span>🕋</span> BSI Tabungan Haji
            </h1>
            <p className="mt-4 max-w-xs font-body-sm text-body-sm text-on-surface-variant">
              Rencanakan perjalanan ibadah Anda dengan tenang, aman, dan
              terpercaya bersama layanan perbankan syariah modern kami.
            </p>
          </div>
          <div className="absolute bottom-0 right-0 z-0 h-[60%] w-full">
            <img
              alt="Ilustrasi siluet Kaaba"
              className="h-full w-full object-cover opacity-20 mix-blend-multiply"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-IKGfzxRa3TGO9QnUyK66cmGE1tTo_aELbXLc5vpLRoz2r-BwgHfoHTehLkN6fwtu9XQ4h0RPoBQlsXgdmUB4_n_ZNI1cg_bmdIOy1uWi5wGtasRF0LyZRQLreQBXwJi-gZGGw-Bt4sK7WBM_yxOAqG4mkjp-jb4MrJmW3swIXrf97oH6msEgfCK0hpqkFJ97eT62lEUsg-8W7_PY7XQIWnPHnSbPYRAulCHppeGkXukABATMMdzovU0rQCkfTq5aQYOb2L3mRwY"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/50 to-transparent" />
          </div>
        </div>

        {/* Sisi kanan: form */}
        <div className="flex w-full flex-col justify-center p-8 md:w-7/12 md:p-14">
          {/* Branding versi mobile */}
          <div className="mb-8 text-center md:hidden">
            <h1 className="flex items-center justify-center gap-2 font-headline-md text-headline-md text-primary">
              <span>🕋</span> BSI Tabungan Haji
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
              Selamat Datang Kembali
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Silakan masuk ke akun Anda untuk melihat portofolio porsi haji.
            </p>
          </div>

          <form className="space-y-6" onSubmit={masuk}>
            {/* Pesan error */}
            {error && (
              <div
                role="alert"
                className="flex flex-col gap-2 rounded-lg border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">
                    error
                  </span>
                  {error}
                </div>
                {errorCode === "PASSWORD_NOT_SET" && (
                  <Link
                    href="/aktivasi"
                    className="flex w-fit items-center gap-1 font-label-md text-label-md text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary-container"
                  >
                    Aktifkan akun
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </Link>
                )}
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                className="font-label-md text-label-md text-on-surface"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  mail
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email Anda"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 font-body-md text-body-md text-on-surface transition-colors placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Kata sandi */}
            <div className="flex flex-col gap-2">
              <label
                className="font-label-md text-label-md text-on-surface"
                htmlFor="password"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  lock
                </span>
                <input
                  id="password"
                  name="password"
                  type={lihatSandi ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-10 font-body-md text-body-md text-on-surface transition-colors placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setLihatSandi((v) => !v)}
                  aria-label={
                    lihatSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-primary"
                >
                  <span className="material-symbols-outlined">
                    {lihatSandi ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Opsi */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={ingatSaya}
                  onChange={(e) => setIngatSaya(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface-container-lowest text-primary-container focus:ring-primary-container"
                />
                <label
                  className="cursor-pointer font-body-sm text-body-sm text-on-surface-variant"
                  htmlFor="remember"
                >
                  Ingat saya
                </label>
              </div>
              <a
                className="font-label-md text-label-md text-primary-container transition-colors hover:text-primary"
                href="#"
              >
                Lupa kata sandi?
              </a>
            </div>

            {/* Tombol masuk */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-3.5 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Belum punya akun?{" "}
              <Link
                className="font-label-md text-label-md text-primary-container underline decoration-primary-container/30 underline-offset-4 transition-colors hover:text-primary"
                href="/register"
              >
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
