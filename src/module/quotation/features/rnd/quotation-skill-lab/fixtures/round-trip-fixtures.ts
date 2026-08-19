import type { RoundTripFixture, RoundTripScenarioId } from '../types';

export const LEGAL_CANDIDATE_HTML = `<section data-block-type="legal" data-template-code="quotation-legal-v1" data-modified="false">
  <h2>Ketentuan</h2>
  <h3>Pernyataan Pembuka</h3>
  <p>Melalui penawaran ini, kami menyampaikan kesiapan tim Dedicated Programmer Squad untuk mendukung pelaksanaan pekerjaan sesuai ruang lingkup, timeline, dan rincian investasi yang tercantum dalam dokumen ini.</p>
  <h3>Pajak dan Invoice</h3>
  <p>Nilai investasi yang tercantum dalam penawaran ini belum termasuk Pajak Pertambahan Nilai (PPN). Pengenaan dan besaran pajak mengikuti ketentuan perpajakan yang berlaku dan akan ditagihkan sesuai dokumen perpajakan yang sah.</p>
  <p>Setiap invoice memiliki jatuh tempo pembayaran empat belas hari kalender (H+14) sejak tanggal invoice diterbitkan, kecuali terdapat kesepakatan tertulis lain yang disetujui oleh Para Pihak.</p>
  <h3>Keterlambatan Pembayaran</h3>
  <p>Apabila pembayaran melewati tanggal jatuh tempo, Penyedia berhak menghentikan sementara aktivitas pengembangan dan layanan terkait sampai kewajiban pembayaran dipenuhi. Penghentian sementara tersebut dapat menyebabkan perubahan atau penundaan timeline pekerjaan.</p>
  <h3>Out-of-Pocket, Onsite, dan Lembur</h3>
  <p>Biaya transportasi, akomodasi, konsumsi, dan pengeluaran out-of-pocket lain yang timbul karena pekerjaan di luar lokasi kerja yang disepakati belum termasuk dalam nilai investasi, kecuali dinyatakan lain secara tertulis.</p>
  <p>Pekerjaan onsite di luar lokasi kerja yang disepakati dan pekerjaan di luar jam kerja normal, termasuk lembur, hanya dilakukan berdasarkan persetujuan tertulis Para Pihak dan dapat dikenakan biaya tambahan.</p>
  <h3>Biaya Pihak Ketiga</h3>
  <p>Biaya layanan atau komponen pihak ketiga, termasuk tetapi tidak terbatas pada API berbayar, payment gateway, layanan AI, hosting, cloud service, domain, lisensi, dan kuota pemakaian, belum termasuk dalam nilai investasi kecuali dinyatakan lain secara tertulis dalam dokumen ini.</p>
  <h3>Penutup</h3>
  <p>Dengan menandatangani dokumen ini, Para Pihak menyatakan telah membaca, memahami, dan menyetujui ruang lingkup pekerjaan, timeline, nilai investasi, serta ketentuan yang tercantum dalam penawaran ini. Pelaksanaan lebih lanjut mengikuti perjanjian layanan yang disepakati oleh Para Pihak.</p>
</section>`;

export const ROUND_TRIP_FIXTURES: Record<RoundTripScenarioId, RoundTripFixture> = {
  simple: {
    id: 'simple',
    html: `<section data-block-type="metadata">
  <h1>PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD</h1>
  <p><strong>No:</strong> SYNTH/QUO/2026/LAB-S</p>
  <p><strong>Tanggal:</strong> 2026-09-06</p>
  <p><strong>Perihal:</strong> Pengembangan Portal Permintaan Internal Sintetis</p>
  <p><strong>Kepada Yth.:</strong> PIC Uji Simple, PT Sintetis Nusantara Simple</p>
</section>
<section data-block-type="opening">
  <p>Kami menyampaikan penawaran tim Dedicated Squad untuk mendukung pengembangan portal permintaan internal sesuai ruang lingkup berikut.</p>
</section>
<section data-block-type="commercial">
  <h2>Development Investment</h2>
  <table>
    <thead><tr><th>Role</th><th>Rate Monthly</th><th>Employee</th><th>Period Month</th><th>Total</th></tr></thead>
    <tbody>
      <tr><td>Senior Programmer</td><td>Rp12.000.000</td><td>1</td><td>3</td><td>Rp36.000.000</td></tr>
      <tr><td colspan="4"><strong>Total Investment</strong></td><td><strong>Rp36.000.000</strong></td></tr>
    </tbody>
  </table>
</section>
<section data-block-type="scope">
  <h2>Scope of Work dan Timeline</h2>
  <ul>
    <li>Formulir permintaan internal</li>
    <li>Daftar dan status permintaan</li>
    <li>Dashboard administrasi sederhana</li>
  </ul>
</section>
<section data-block-type="payment">
  <h2>Jadwal Pembayaran</h2>
  <table>
    <thead><tr><th>Termin</th><th>Persentase</th></tr></thead>
    <tbody>
      <tr><td>Down Payment</td><td>50%</td></tr>
      <tr><td>Pelunasan</td><td>50%</td></tr>
    </tbody>
  </table>
</section>
<section data-block-type="legal">
  <h2>Ketentuan</h2>
  <p>Ini adalah legal section sederhana untuk testing simple round-trip.</p>
</section>
<section data-block-type="closing">
  <p>Demikian penawaran sintetis ini kami sampaikan untuk proses evaluasi R&amp;D.</p>
</section>
<section data-block-type="signature">
  <h2>Persetujuan</h2>
  <table>
    <tbody>
      <tr><td>Perwakilan Vendor</td><td>Perwakilan Klien</td></tr>
    </tbody>
  </table>
</section>`,
    requiredOperations: ['paragraph-edited', 'heading-edited', 'list-edited'],
  },
  'table-heavy': {
    id: 'table-heavy',
    html: `<section data-block-type="metadata">
  <h1>PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD</h1>
  <p><strong>No:</strong> SYNTH/QUO/2026/LAB-T</p>
  <p><strong>Tanggal:</strong> 2026-09-06</p>
  <p><strong>Perihal:</strong> Pengembangan Portal Permintaan Internal Sintetis</p>
  <p><strong>Kepada Yth.:</strong> PIC Uji Table, PT Sintetis Nusantara Table</p>
</section>
<section data-block-type="opening">
  <p>Kami menyampaikan penawaran tim Dedicated Squad untuk mendukung pengembangan portal permintaan internal sesuai ruang lingkup berikut.</p>
</section>
<section data-block-type="commercial">
  <h2>Development Investment</h2>
  <table>
    <thead><tr><th>Role</th><th>Rate Monthly</th><th>Employee</th><th>Period Month</th><th>Total</th></tr></thead>
    <tbody>
      <tr><td>Senior Programmer</td><td>Rp12.000.000</td><td>1</td><td>3</td><td>Rp36.000.000</td></tr>
      <tr><td>Junior Programmer</td><td>Rp6.000.000</td><td>2</td><td>3</td><td>Rp36.000.000</td></tr>
      <tr><td>UI/UX Designer</td><td>Rp8.000.000</td><td>1</td><td>1</td><td>Rp8.000.000</td></tr>
      <tr><td>QA Engineer</td><td>Rp7.000.000</td><td>1</td><td>2</td><td>Rp14.000.000</td></tr>
      <tr><td>Project Manager</td><td>Rp15.000.000</td><td>1</td><td>3</td><td>Rp45.000.000</td></tr>
      <tr><td colspan="4"><strong>Total Investment</strong></td><td><strong>Rp139.000.000</strong></td></tr>
    </tbody>
  </table>
</section>
<section data-block-type="scope">
  <h2>Scope of Work dan Timeline</h2>
  <ul>
    <li>Formulir permintaan internal</li>
    <li>Daftar dan status permintaan</li>
    <li>Dashboard administrasi sederhana</li>
  </ul>
</section>
<section data-block-type="payment">
  <h2>Jadwal Pembayaran</h2>
  <table>
    <thead><tr><th>Termin</th><th>Persentase</th></tr></thead>
    <tbody>
      <tr><td>Down Payment</td><td>30%</td></tr>
      <tr><td>Termin 2</td><td>30%</td></tr>
      <tr><td>Pelunasan</td><td>40%</td></tr>
    </tbody>
  </table>
</section>
<section data-block-type="legal">
  <h2>Ketentuan</h2>
  <p>Ini adalah legal section sederhana untuk testing table-heavy round-trip.</p>
</section>
<section data-block-type="closing">
  <p>Demikian penawaran sintetis ini kami sampaikan untuk proses evaluasi R&amp;D.</p>
</section>
<section data-block-type="signature">
  <h2>Persetujuan</h2>
  <table>
    <tbody>
      <tr><td>Perwakilan Vendor</td><td>Perwakilan Klien</td></tr>
    </tbody>
  </table>
</section>`,
    requiredOperations: [
      'row-added',
      'row-deleted',
      'column-added',
      'column-deleted',
      'cell-merged',
      'cell-split',
      'column-resized',
    ],
  },
  legal: {
    id: 'legal',
    html: `<section data-block-type="metadata">
  <h1>PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD</h1>
  <p><strong>No:</strong> SYNTH/QUO/2026/LAB-L</p>
  <p><strong>Tanggal:</strong> 2026-09-06</p>
  <p><strong>Perihal:</strong> Pengembangan Portal Permintaan Internal Sintetis</p>
  <p><strong>Kepada Yth.:</strong> PIC Uji Legal, PT Sintetis Nusantara Legal</p>
</section>
<section data-block-type="opening">
  <p>Kami menyampaikan penawaran tim Dedicated Squad untuk mendukung pengembangan portal permintaan internal sesuai ruang lingkup berikut.</p>
</section>
<section data-block-type="commercial">
  <h2>Development Investment</h2>
  <table>
    <thead><tr><th>Role</th><th>Rate Monthly</th><th>Employee</th><th>Period Month</th><th>Total</th></tr></thead>
    <tbody>
      <tr><td>Senior Programmer</td><td>Rp12.000.000</td><td>1</td><td>3</td><td>Rp36.000.000</td></tr>
      <tr><td colspan="4"><strong>Total Investment</strong></td><td><strong>Rp36.000.000</strong></td></tr>
    </tbody>
  </table>
</section>
<section data-block-type="scope">
  <h2>Scope of Work dan Timeline</h2>
  <ul>
    <li>Formulir permintaan internal</li>
    <li>Daftar dan status permintaan</li>
    <li>Dashboard administrasi sederhana</li>
  </ul>
</section>
<section data-block-type="payment">
  <h2>Jadwal Pembayaran</h2>
  <table>
    <thead><tr><th>Termin</th><th>Persentase</th></tr></thead>
    <tbody>
      <tr><td>Down Payment</td><td>50%</td></tr>
      <tr><td>Pelunasan</td><td>50%</td></tr>
    </tbody>
  </table>
</section>
${LEGAL_CANDIDATE_HTML}
<section data-block-type="closing">
  <p>Demikian penawaran sintetis ini kami sampaikan untuk proses evaluasi R&amp;D.</p>
</section>
<section data-block-type="signature">
  <h2>Persetujuan</h2>
  <table>
    <tbody>
      <tr><td>Perwakilan Vendor</td><td>Perwakilan Klien</td></tr>
    </tbody>
  </table>
</section>`,
    requiredOperations: ['legal-unlocked', 'legal-edited', 'legal-restored'],
  },
};
