import { ApiError, authedFetch } from "./api";

export interface Nasabah {
  id: string;
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNasabahInput {
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
}

export type UpdateNasabahInput = Partial<CreateNasabahInput>;

export interface ListNasabahParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ListNasabahResult {
  data: Nasabah[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Bangun query string dari params, abaikan nilai kosong/undefined.
 */
function buildQuery(params: ListNasabahParams): string {
  const sp = new URLSearchParams();
  if (params.q && params.q.trim().length > 0) sp.set("q", params.q.trim());
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * Mapping kode error backend → pesan ramah berbahasa Indonesia.
 * Dipakai untuk membungkus ApiError yang dilempar authedFetch.
 */
function ramahkan(err: unknown, defaultMsg: string): never {
  if (!(err instanceof ApiError)) {
    throw new ApiError("UNKNOWN_ERROR", defaultMsg, 0);
  }
  const m: Record<string, string> = {
    DUPLICATE_ENTRY: err.message,
    VALIDATION_ERROR: err.message,
    NOT_FOUND: "Nasabah tidak ditemukan.",
    FORBIDDEN: "Akses hanya untuk admin.",
    SELF_DELETE_FORBIDDEN: "Anda tidak boleh menghapus akun sendiri.",
    NASABAH_HAS_ACTIVE_TABUNGAN:
      "Nasabah masih memiliki tabungan dengan saldo. Tarik dulu sebelum menghapus.",
  };
  throw new ApiError(err.code, m[err.code] ?? err.message, err.status);
}

export const nasabahApi = {
  /** GET /nasabah?q=&page=&pageSize= — admin only. */
  list(params: ListNasabahParams = {}): Promise<ListNasabahResult> {
    return authedFetch<ListNasabahResult>(`/nasabah${buildQuery(params)}`).catch(
      (err) => ramahkan(err, "Gagal memuat daftar nasabah."),
    );
  },

  /** GET /nasabah/:id — admin only. */
  get(id: string): Promise<Nasabah> {
    return authedFetch<Nasabah>(`/nasabah/${encodeURIComponent(id)}`).catch(
      (err) => ramahkan(err, "Gagal memuat data nasabah."),
    );
  },

  /**
   * POST /nasabah — endpoint publik (juga dipakai self-service registrasi).
   * Saat dipanggil dari panel admin, header Authorization tetap dikirim
   * karena authedFetch memerlukan token; backend tidak menolak.
   */
  create(input: CreateNasabahInput): Promise<Nasabah> {
    return authedFetch<Nasabah>("/nasabah", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).catch((err) => ramahkan(err, "Gagal menambah nasabah."));
  },

  /** PATCH /nasabah/:id — admin only. */
  update(id: string, input: UpdateNasabahInput): Promise<Nasabah> {
    return authedFetch<Nasabah>(`/nasabah/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).catch((err) => ramahkan(err, "Gagal memperbarui nasabah."));
  },

  /** DELETE /nasabah/:id — admin only, tidak bisa hapus diri sendiri. */
  remove(id: string): Promise<void> {
    return authedFetch<void>(`/nasabah/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch((err) => ramahkan(err, "Gagal menghapus nasabah."));
  },
};
