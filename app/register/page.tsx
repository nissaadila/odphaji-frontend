"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError, registerNasabah } from "@/lib/api";

/** Ubah input nomor HP (setelah prefix +62) menjadi format backend "08xxxxxxxxxx". */
function buildNomorHp(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("62")) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");
  return "0" + digits;
}

const fitur = [
  {
    icon: "verified_user",
    judul: "Aman & Terenkripsi",
    teks: "Data pribadi Anda dilindungi dengan standar keamanan perbankan.",
  },
  {
    icon: "savings",
    judul: "Sesuai Syariah",
    teks: "Dana dikelola secara transparan, amanah, dan bebas riba.",
  },
  {
    icon: "flight_takeoff",
    judul: "Estimasi Keberangkatan",
    teks: "Pantau progres porsi dan perkiraan tahun keberangkatan Anda.",
  },
];

export default function RegisterPage() {
  const [nik, setNik] = useState("");
  const [nama, setNama] = useState("");
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-4 font-body-md text-on-background md:p-8">
      {/* Latar dekoratif modern */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-2xl lg:grid-cols-2">
        {/* Panel kiri — hero */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-primary-container p-10 text-on-primary lg:flex">
          {/* Cincin dekoratif */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full border border-white/10" />

          <div className="relative z-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-secondary-fixed">
              <span className="material-symbols-outlined">mosque</span>
            </span>
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight">
              Tabungan Haji ODP
            </span>
          </div>

          <div className="relative z-10">
            <h2 className="font-headline-xl text-headline-xl leading-tight">
              Wujudkan Langkah
              <br />
              Menuju Baitullah.
            </h2>
            <p className="mt-4 max-w-sm font-body-md text-body-md text-primary-fixed-dim">
              Mulai menabung secara terencana, transparan, dan sesuai syariah —
              satu langkah kecil hari ini untuk perjalanan suci Anda.
            </p>

            <ul className="mt-10 flex flex-col gap-5">
              {fitur.map((f) => (
                <li key={f.judul} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-secondary-fixed">
                    <span className="material-symbols-outlined">{f.icon}</span>
                  </span>
                  <div>
                    <p className="font-label-md text-label-md font-semibold">
                      {f.judul}
                    </p>
                    <p className="font-body-sm text-body-sm text-primary-fixed-dim">
                      {f.teks}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-secondary-fixed">
            <span className="material-symbols-outlined text-[20px]">
              account_balance
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest">
              Terdaftar &amp; Diawasi OJK
            </span>
          </div>
        </aside>

        {/* Panel kanan — form */}
        <main className="flex flex-col justify-center p-8 sm:p-12">
          {/* Brand versi mobile */}
          <div className="mb-8 flex items-center gap-3 text-primary lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-on-primary">
              <span className="material-symbols-outlined">mosque</span>
            </span>
            <span className="font-headline-sm text-headline-sm font-bold">
              Tabungan Haji ODP
            </span>
          </div>

          {sukses ? (
            /* State sukses */
            <div className="flex flex-col items-center text-center">
              <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span
                  className="material-symbols-outlined text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  mark_email_read
                </span>
              </span>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Pendaftaran Berhasil
              </h1>
              <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
                Kami telah mengirim email verifikasi ke{" "}
                <span className="font-medium text-on-surface">{email}</span>.
                Lanjutkan dengan mengaktifkan akun untuk mengatur kata sandi.
              </p>
              <Link
                href="/aktivasi"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container py-3.5 font-label-md text-label-md text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01]"
              >
                Aktifkan Akun
                <span className="material-symbols-outlined text-xl">
                  arrow_forward
                </span>
              </Link>
              <Link
                href="/login"
                className="mt-4 font-label-md text-label-md text-primary hover:underline"
              >
                Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                  <span className="material-symbols-outlined text-[16px]">
                    person_add
                  </span>
                  Registrasi
                </span>
                <h1 className="mt-4 font-headline-xl-mobile text-headline-xl-mobile text-on-surface md:font-headline-xl md:text-headline-xl">
                  Daftar Akun Baru
                </h1>
                <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                  Lengkapi data sesuai identitas resmi (KTP) untuk memulai.
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={daftar}>
                {/* Pesan error */}
                {error && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-xl border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      error
                    </span>
                    {error}
                  </div>
                )}

                {/* NIK */}
                <Field
                  id="nik"
                  label="Nomor Induk Kependudukan (NIK)"
                  icon="badge"
                >
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
                    placeholder="16 digit sesuai KTP"
                    className={inputClass}
                  />
                </Field>

                {/* Nama */}
                <Field id="nama" label="Nama Lengkap" icon="person">
                  <input
                    id="nama"
                    name="nama"
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Ahmad Abdullah"
                    className={inputClass}
                  />
                </Field>

                {/* Email */}
                <Field id="email" label="Alamat Email" icon="mail">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className={inputClass}
                  />
                </Field>

                {/* Nomor HP */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-label-md text-label-md text-on-surface"
                    htmlFor="phone"
                  >
                    Nomor Handphone
                  </label>
                  <div className="flex items-stretch overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <span className="flex items-center gap-1 border-r border-outline-variant px-4 font-body-md text-body-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px] text-outline">
                        smartphone
                      </span>
                      +62
                    </span>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      required
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="81234567890"
                      className="w-full bg-transparent px-4 py-3 font-body-md text-body-md text-on-surface outline-none placeholder:text-outline-variant"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container py-4 font-label-md text-label-md text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] disabled:scale-100 disabled:opacity-60"
                >
                  {loading ? "Memproses..." : "Daftar Sekarang"}
                  {!loading && (
                    <span className="material-symbols-outlined text-xl">
                      arrow_forward
                    </span>
                  )}
                </button>
              </form>

              {/* Catatan & link login */}
              <p className="mt-6 flex items-center justify-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  lock
                </span>
                Kata sandi diatur pada langkah aktivasi demi keamanan.
              </p>
              <div className="mt-4 text-center">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Sudah memiliki akun?{" "}
                  <Link
                    className="font-label-md text-label-md text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary-container"
                    href="/login"
                  >
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-11 pr-4 font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="font-label-md text-label-md text-on-surface"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-outline">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
        {children}
      </div>
    </div>
  );
}
