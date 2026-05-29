const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1"
const HEALTH_URL = API_URL.replace(/\/api\/v1\/?$/, "") + "/health";

export async function checkHealth() : Promise<boolean>{
    try{
        const res = await fetch(HEALTH_URL);
        if(!res.ok) return false;
        return (await res.json())?.status ==='ok';
    }catch{
        return false;
    }
}

// ---- Autentikasi ----

export interface Nasabah {
  id: string;
  nama: string;
  email: string;
}

export interface LoginResult {
  token: string;
  expiresIn: string;
  nasabah: Nasabah;
}

export interface Tabungan {
  id: string;
  nomorRekening: string;
  saldo: string; // BigInt diserialisasi sebagai string oleh backend
  status: string; // "AKTIF", dll.
  dibukaAt: string;
}

export interface MeResult {
  nasabah: Nasabah & { nik: string; nomorHp: string };
  isAdmin: boolean;
  tabungan: Tabungan | null;
}

export interface SetorResult {
  replayed: boolean;
  transaksi: Transaksi;
  tabungan: Tabungan;
}

export interface Estimasi {
  tabunganId: string;
  nomorRekening: string;
  status: "BELUM_DAFTAR_PORSI" | "TERDAFTAR_PORSI" | "LUNAS";
  saldo: string;
  kekuranganSetoranAwal: string;
  kekuranganPelunasan: string;
  tahunSekarang: number;
  waktuTungguTahun: number;
  estimasiTahunBerangkat: number | null;
  asumsi: {
    setoranAwalPorsi: number;
    bpih: number;
    kuotaNasionalPerTahun: number;
    antrianNasional: number;
  };
}

export interface Transaksi {
  id: string;
  tabunganId: string;
  jenis: string; // "SETOR", dll.
  nominal: string;
  saldoSebelum: string;
  saldoSesudah: string;
  referensi: string;
  metode: string | null;
  waktu: string;
}

export interface MutasiResult {
  tabunganId: string;
  total: number;
  data: Transaksi[];
}

/**
 * Error yang dilempar fungsi-fungsi API dengan pesan yang sudah ramah untuk
 * ditampilkan ke pengguna. `code` mengikuti kode error dari backend
 * (mis. INVALID_CREDENTIALS, PASSWORD_NOT_SET, VALIDATION_ERROR).
 */
export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

const TOKEN_KEY = "th_token";
const NASABAH_KEY = "th_nasabah";

/**
 * POST /auth/login — autentikasi nasabah dengan email & password.
 * Mengembalikan token JWT beserta data nasabah, atau melempar ApiError
 * dengan pesan berbahasa Indonesia jika gagal.
 */
export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      0,
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const code: string = data?.error ?? "UNKNOWN_ERROR";
    const message =
      code === "INVALID_CREDENTIALS"
        ? "Email atau password salah."
        : code === "PASSWORD_NOT_SET"
          ? "Password belum diatur. Silakan atur password terlebih dahulu."
          : code === "VALIDATION_ERROR"
            ? "Data yang dimasukkan tidak valid."
            : (data?.message ?? "Terjadi kesalahan. Silakan coba lagi.");
    throw new ApiError(code, message, res.status);
  }

  return data as LoginResult;
}

export interface RegisterInput {
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
}

export interface RegisterResult {
  id: string;
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  createdAt?: string;
}

/**
 * POST /nasabah — registrasi nasabah baru (NIK, nama, email, nomor HP).
 * Password TIDAK diatur di sini; nasabah mengaturnya pada langkah aktivasi
 * setelah menerima email verifikasi. Melempar ApiError dengan pesan
 * berbahasa Indonesia bila gagal (DUPLICATE_ENTRY / VALIDATION_ERROR).
 */
export async function registerNasabah(
  input: RegisterInput,
): Promise<RegisterResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/nasabah`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      0,
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const code: string = data?.error ?? "UNKNOWN_ERROR";
    let message: string;
    if (code === "DUPLICATE_ENTRY") {
      // backend: "email sudah terdaftar" / "nik sudah terdaftar", dll.
      message = data?.message ?? "Data sudah terdaftar.";
    } else if (code === "VALIDATION_ERROR") {
      const details = data?.details as Record<string, string[]> | undefined;
      const pesanPertama = details
        ? Object.values(details).flat().find(Boolean)
        : null;
      message = pesanPertama ?? "Data yang dimasukkan tidak valid.";
    } else {
      message = data?.message ?? "Terjadi kesalahan. Silakan coba lagi.";
    }
    throw new ApiError(code, message, res.status);
  }

  return data as RegisterResult;
}

export interface SetPasswordInput {
  email: string;
  nik: string;
  password: string;
}

export interface SetPasswordResult {
  message: string;
  id: string;
  email: string;
}

/**
 * POST /auth/set-password — aktivasi akun: verifikasi email + NIK lalu
 * mengatur kata sandi pertama kali. Melempar ApiError dengan pesan
 * berbahasa Indonesia bila gagal (NOT_FOUND / PASSWORD_ALREADY_SET /
 * VALIDATION_ERROR).
 */
export async function setPassword(
  input: SetPasswordInput,
): Promise<SetPasswordResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/set-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      0,
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const code: string = data?.error ?? "UNKNOWN_ERROR";
    let message: string;
    if (code === "NOT_FOUND") {
      message = "Email atau NIK tidak cocok dengan data terdaftar.";
    } else if (code === "PASSWORD_ALREADY_SET") {
      message = "Akun sudah diaktivasi. Silakan langsung masuk.";
    } else if (code === "VALIDATION_ERROR") {
      const details = data?.details as Record<string, string[]> | undefined;
      const pesanPertama = details
        ? Object.values(details).flat().find(Boolean)
        : null;
      message = pesanPertama ?? "Data yang dimasukkan tidak valid.";
    } else {
      message = data?.message ?? "Terjadi kesalahan. Silakan coba lagi.";
    }
    throw new ApiError(code, message, res.status);
  }

  return data as SetPasswordResult;
}

/**
 * Simpan sesi (token + data nasabah). `persist` = true → localStorage
 * (tetap setelah tutup tab, untuk "Ingat saya"), false → sessionStorage
 * (hilang saat tab ditutup).
 */
export function saveSession(result: LoginResult, persist: boolean): void {
  if (typeof window === "undefined") return;
  const store = persist ? window.localStorage : window.sessionStorage;
  const other = persist ? window.sessionStorage : window.localStorage;
  store.setItem(TOKEN_KEY, result.token);
  store.setItem(NASABAH_KEY, JSON.stringify(result.nasabah));
  other.removeItem(TOKEN_KEY);
  other.removeItem(NASABAH_KEY);
}

/** Ambil token tersimpan (sessionStorage diprioritaskan), null bila tidak ada. */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem(TOKEN_KEY) ??
    window.localStorage.getItem(TOKEN_KEY)
  );
}

/** Ambil JSON nasabah mentah (primitif stabil, cocok untuk getSnapshot). */
export function getNasabahRaw(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem(NASABAH_KEY) ??
    window.localStorage.getItem(NASABAH_KEY)
  );
}

/** Ambil data nasabah tersimpan, null bila tidak ada / tidak valid. */
export function getNasabah(): Nasabah | null {
  const raw = getNasabahRaw();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Nasabah;
  } catch {
    return null;
  }
}

/**
 * Berlangganan perubahan sesi antar-tab (event `storage`). Dipakai oleh
 * useSyncExternalStore sehingga logout/login di tab lain langsung tersinkron.
 */
export function subscribeSession(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/** Hapus seluruh data sesi dari kedua storage. */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  for (const store of [window.localStorage, window.sessionStorage]) {
    store.removeItem(TOKEN_KEY);
    store.removeItem(NASABAH_KEY);
  }
}

/**
 * Fetch ke endpoint yang butuh autentikasi: otomatis menyisipkan header
 * `Authorization: Bearer <token>`, parse JSON, dan melempar ApiError yang ramah
 * pengguna bila gagal (termasuk token kadaluarsa/di-revoke).
 */
async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new ApiError(
      "UNAUTHORIZED",
      "Sesi Anda telah berakhir. Silakan login kembali.",
      401,
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      0,
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const code: string = data?.error ?? "UNKNOWN_ERROR";
    const message =
      res.status === 401
        ? "Sesi Anda telah berakhir. Silakan login kembali."
        : (data?.message ?? "Terjadi kesalahan. Silakan coba lagi.");
    throw new ApiError(code, message, res.status);
  }

  return data as T;
}

/** GET /auth/me — data nasabah yang sedang login beserta tabungannya. */
export function getMe(): Promise<MeResult> {
  return authedFetch<MeResult>("/auth/me");
}

/**
 * POST /tabungan-haji — buka/buat tabungan haji untuk nasabah.
 * Backend menolak dengan DUPLICATE_ENTRY bila nasabah sudah punya tabungan,
 * atau NASABAH_NOT_REGISTERED bila nasabah tidak ditemukan.
 */
export function bukaTabungan(nasabahId: string): Promise<Tabungan> {
  return authedFetch<Tabungan>("/tabungan-haji", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nasabahId }),
  });
}

/** GET /tabungan-haji/:id — lihat detail & saldo terbaru tabungan haji. */
export function getTabungan(tabunganId: string): Promise<Tabungan> {
  return authedFetch<Tabungan>(
    `/tabungan-haji/${encodeURIComponent(tabunganId)}`,
  );
}

/** GET /tabungan-haji/estimasi — status porsi & estimasi keberangkatan. */
export function getEstimasi(tabunganId: string): Promise<Estimasi> {
  return authedFetch<Estimasi>(
    `/tabungan-haji/estimasi?id=${encodeURIComponent(tabunganId)}`,
  );
}

/** GET /tabungan-haji/:id/mutasi — daftar transaksi (terbaru lebih dulu). */
export function getMutasi(tabunganId: string): Promise<MutasiResult> {
  return authedFetch<MutasiResult>(
    `/tabungan-haji/${encodeURIComponent(tabunganId)}/mutasi`,
  );
}

/**
 * POST /tabungan-haji/:id/setor — setor dana ke tabungan haji.
 * Membuat Idempotency-Key unik tiap pemanggilan agar aman dari double-submit.
 */
export function setorTabungan(
  tabunganId: string,
  nominal: number,
): Promise<SetorResult> {
  return authedFetch<SetorResult>(
    `/tabungan-haji/${encodeURIComponent(tabunganId)}/setor`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ nominal }),
    },
  );
}

/**
 * GET /laporan/transaksi?bulan=YYYY-MM — laporan transaksi bulanan (admin).
 * Mengembalikan teks CSV mentah; melempar ApiError bila gagal (mis. 403 non-admin).
 */
export async function fetchLaporanCsv(bulan: string): Promise<string> {
  const token = getToken();
  if (!token) {
    throw new ApiError(
      "UNAUTHORIZED",
      "Sesi Anda telah berakhir. Silakan login kembali.",
      401,
    );
  }

  let res: Response;
  try {
    res = await fetch(
      `${API_URL}/laporan/transaksi?bulan=${encodeURIComponent(bulan)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      0,
    );
  }

  const text = await res.text();
  if (!res.ok) {
    let code = "UNKNOWN_ERROR";
    let message = "Gagal mengambil laporan.";
    try {
      const data = JSON.parse(text);
      code = data?.error ?? code;
      message =
        res.status === 403
          ? "Akses laporan hanya untuk admin."
          : (data?.message ?? message);
    } catch {
      /* body bukan JSON, biarkan pesan default */
    }
    throw new ApiError(code, message, res.status);
  }
  return text;
}

/**
 * Logout: best-effort memanggil POST /auth/logout untuk meng-invalidate token
 * di server, lalu selalu menghapus sesi lokal (meski request gagal).
 */
export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Abaikan kegagalan jaringan — sesi lokal tetap dibersihkan.
    }
  }
  clearSession();
}
