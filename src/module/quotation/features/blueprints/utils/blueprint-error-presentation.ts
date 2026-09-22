export type BlueprintErrorCategory =
  | 'configuration'
  | 'credential'
  | 'availability'
  | 'rate_limit'
  | 'timeout'
  | 'request'
  | 'prompt'
  | 'generic';

export type BlueprintErrorAction = 'settings' | 'retry' | 'manual' | 'refresh' | null;

export type BlueprintErrorPresentation = {
  category: BlueprintErrorCategory;
  title: string;
  message: string;
  action: BlueprintErrorAction;
};

export function presentBlueprintError(code?: string | null): BlueprintErrorPresentation | null {
  if (!code || typeof code !== 'string') {
    return null;
  }

  const normalized = code.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case 'provider_configuration':
    case 'provider_config_missing':
      return {
        category: 'configuration',
        title: 'Konfigurasi AI Provider Belum Diatur',
        message:
          'Kunci API atau konfigurasi AI Provider belum ditentukan. Harap lengkapi pengaturan konfigurasi AI untuk melanjutkan pembuatan blueprint.',
        action: 'settings',
      };

    case 'provider_invalid_credential':
    case 'unauthorized':
      return {
        category: 'credential',
        title: 'Kredensial AI Provider Tidak Valid',
        message:
          'Kunci API atau kredensial AI Provider yang dikonfigurasi tidak valid atau telah kedaluwarsa. Periksa kembali pengaturan AI Anda.',
        action: 'settings',
      };

    case 'provider_unavailable':
      return {
        category: 'availability',
        title: 'Layanan AI Provider Tidak Tersedia',
        message:
          'Layanan AI Provider sedang mengalami gangguan atau tidak dapat dihubungi. Silakan coba beberapa saat lagi.',
        action: 'retry',
      };

    case 'provider_rate_limited':
      return {
        category: 'rate_limit',
        title: 'Batas Penggunaan AI Terlampaui',
        message:
          'Permintaan melebihi batas kecepatan (rate limit) AI Provider. Tunggu beberapa saat sebelum mencoba kembali.',
        action: 'retry',
      };

    case 'provider_timeout':
      return {
        category: 'timeout',
        title: 'Batas Waktu Permintaan AI Habis',
        message:
          'Permintaan ke layanan AI Provider memakan waktu terlalu lama (timeout). Silakan coba lagi.',
        action: 'retry',
      };

    case 'provider_request_rejected':
      return {
        category: 'request',
        title: 'Permintaan Ditolak AI Provider',
        message:
          'Format atau isi permintaan ditolak oleh AI Provider. Anda dapat mencoba melengkapi bagian ini secara manual.',
        action: 'manual',
      };

    case 'provider_payload_too_large':
      return {
        category: 'request',
        title: 'Ukuran Data Melebihi Batas',
        message:
          'Konteks atau dokumen yang dikirim melebihi batas ukuran token provider. Anda dapat melengkapi bagian ini secara manual.',
        action: 'manual',
      };

    case 'prompt_construction_failed':
      return {
        category: 'prompt',
        title: 'Gagal Menyusun Prompt Blueprint',
        message:
          'Terjadi kesalahan saat menyusun prompt dari data quotation. Anda dapat mencoba lagi atau mengisi bagian ini secara manual.',
        action: 'manual',
      };

    case 'invalid_schema':
      return {
        category: 'generic',
        title: 'Format Respon AI Tidak Valid',
        message:
          'Respon dari AI Provider tidak sesuai dengan struktur skema yang diharapkan. Anda dapat mencoba lagi atau melengkapi data secara manual.',
        action: 'retry',
      };

    case 'interrupted':
      return {
        category: 'generic',
        title: 'Proses Generasi Terputus',
        message:
          'Proses eksekusi pipeline terputus sebelum selesai. Silakan periksa status dan coba lagi.',
        action: 'retry',
      };

    case 'pipeline_blocked':
      return {
        category: 'generic',
        title: 'Pipeline Terblokir',
        message:
          'Pipeline terhalang oleh tahapan sebelumnya yang belum selesai atau tidak valid.',
        action: 'refresh',
      };

    default:
      return {
        category: 'generic',
        title: 'Terjadi Kesalahan',
        message: `Terjadi kendala pada proses pipeline (${code}). Anda dapat mencoba lagi atau mengisi secara manual.`,
        action: 'retry',
      };
  }
}
