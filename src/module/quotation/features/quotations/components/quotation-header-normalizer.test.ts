// @vitest-environment happy-dom
import { it, expect, describe } from 'vitest';

import { normalizeQuotationHeaderHTML } from './quotation-header-normalizer';

const CANONICAL_HEADER_HTML = `<section data-block-type="metadata">
  <div data-role="quotation-brand"><img src="/logo/venturo-logo.png" alt="Venturo — Expert Programmers"></div>
  <h1>PENAWARAN</h1>
  <div data-role="metadata-layout">
    <div data-role="metadata-facts">
      <div data-role="metadata-row" data-field="quotation_number"><span data-role="metadata-label">No</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Q-1</span></div>
      <div data-role="metadata-row" data-field="subject"><span data-role="metadata-label">Perihal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Sistem Uji</span></div>
      <div data-role="metadata-row" data-field="issue_date_header"><span data-role="metadata-label">Tanggal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value"></span></div>
    </div>
    <div data-role="metadata-recipient">
      <div data-role="recipient-heading">Kepada</div>
      <div data-role="recipient-line" data-field="client_pic"><span data-role="recipient-prefix">Yth. </span><span data-role="metadata-value">Budi</span></div>
      <div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value"></span></div>
    </div>
  </div>
</section>`;

describe('normalizeQuotationHeaderHTML', () => {
  it('1. normalizes legacy custom/squad metadata headers with paragraphs into canonical 2-column header', () => {
    const legacySquad = `<header data-block-type="metadata">
      <h1>PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD</h1>
      <p><span data-field="quotation_number">VEN/0826/007</span></p>
      <p><span data-field="subject">Sistem Self-Ordering</span></p>
      <p><span data-field="issue_date_header">Jumat, 7 Agustus 2026</span></p>
      <p><span data-field="client_pic">Muh. Khalid</span></p>
      <p><span data-field="client_company">Qtrust</span></p>
    </header>`;

    const normalized = normalizeQuotationHeaderHTML(legacySquad);

    expect(normalized).toContain('<section data-block-type="metadata">');
    expect(normalized).toContain(
      '<div data-role="quotation-brand"><img src="/logo/venturo-logo.png" alt="Venturo — Expert Programmers"></div>'
    );
    expect(normalized).toContain('<h1>PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD</h1>');
    expect(normalized).toContain('<div data-role="metadata-layout">');
    expect(normalized).toContain('<div data-role="metadata-facts">');
    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="quotation_number"><span data-role="metadata-label">No</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">VEN/0826/007</span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="subject"><span data-role="metadata-label">Perihal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Sistem Self-Ordering</span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="issue_date_header"><span data-role="metadata-label">Tanggal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Jumat, 7 Agustus 2026</span></div>'
    );
    expect(normalized).toContain('<div data-role="metadata-recipient">');
    expect(normalized).toContain('<div data-role="recipient-heading">Kepada</div>');
    expect(normalized).toContain(
      '<div data-role="recipient-line" data-field="client_pic"><span data-role="recipient-prefix">Yth. </span><span data-role="metadata-value">Muh. Khalid</span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value">Qtrust</span></div>'
    );
  });

  it('normalizes legacy section with labeled paragraphs and data-fields', () => {
    const legacySection = `<section data-block-type="metadata">
      <h1>PENAWARAN LAYANAN STANDALONE MAINTENANCE &amp; SUPPORT</h1>
      <p><strong>Nomor:</strong> <span data-field="quotation_number">Q/2026/07/001</span></p>
      <p><strong>Perihal:</strong> <span data-field="subject">Penawaran Maintenance Aplikasi Nex Health</span></p>
      <p><strong>Tanggal:</strong> <span data-field="issue_date_header">7 Juli 2026</span></p>
      <p><strong>Ditujukan kepada:</strong> <span data-field="client_pic">Cris Bawana</span></p>
      <p data-field="client_company">Nex Digital</p>
    </section>`;

    const normalized = normalizeQuotationHeaderHTML(legacySection);

    expect(normalized).toContain('<h1>PENAWARAN LAYANAN STANDALONE MAINTENANCE &amp; SUPPORT</h1>');
    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="quotation_number"><span data-role="metadata-label">No</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Q/2026/07/001</span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="subject"><span data-role="metadata-label">Perihal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Penawaran Maintenance Aplikasi Nex Health</span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="issue_date_header"><span data-role="metadata-label">Tanggal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">7 Juli 2026</span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="recipient-line" data-field="client_pic"><span data-role="recipient-prefix">Yth. </span><span data-role="metadata-value">Cris Bawana</span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value">Nex Digital</span></div>'
    );
  });

  it('2. normalizes legacy Kiosk with optional system_name', () => {
    const legacyKiosk = `<article class="quotation-document kiosk-queue-document">
      <header data-block-type="metadata">
        <h1>PENAWARAN LAYANAN KIOSK &amp; SISTEM ANTRIAN</h1>
        <p><strong>Nomor:</strong> <span data-field="quotation_number">LANDA/MPP-Antrian/0726/003</span></p>
        <p><strong>Perihal:</strong> <span data-field="subject">Sistem Antrian Mall Pelayanan Publik</span></p>
        <p><strong>Tanggal:</strong> <span data-field="issue_date_header">30 Juli 2026</span></p>
        <p><strong>Ditujukan kepada:</strong> <span data-field="client_pic">Etik Mudarifa, S.STP., M.Si.</span></p>
        <p data-field="client_company">DPMPTSP</p>
        <p><strong>Sistem:</strong> <span data-field="system_name">Sistem Antrian Mall Pelayanan Publik</span></p>
      </header>
      <section data-block-type="opening"><p>Kesiapan tim IT Profesional.</p></section>
    </article>`;

    const normalized = normalizeQuotationHeaderHTML(legacyKiosk);

    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="system_name"><span data-role="metadata-label">Sistem</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Sistem Antrian Mall Pelayanan Publik</span></div>'
    );
    expect(normalized).toContain('Etik Mudarifa, S.STP., M.Si.');
    expect(normalized).toContain('DPMPTSP');
    expect(normalized).toContain('<section data-block-type="opening"><p>Kesiapan tim IT Profesional.</p></section>');
  });

  it('3. is byte-idempotent for canonical inputs', () => {
    const result1 = normalizeQuotationHeaderHTML(CANONICAL_HEADER_HTML);
    expect(result1).toBe(CANONICAL_HEADER_HTML);

    const docWithCanonical = `<article class="quotation-document">${CANONICAL_HEADER_HTML}<section data-block-type="commercial"><p>Cost table</p></section></article>`;
    const result2 = normalizeQuotationHeaderHTML(docWithCanonical);
    expect(result2).toBe(docWithCanonical);

    const doubleNormalized = normalizeQuotationHeaderHTML(result2);
    expect(doubleNormalized).toBe(result2);
  });

  it('4. strictly preserves non-metadata sections untouched character-for-character', () => {
    const commercialSection = `<section data-block-type="commercial" data-section-number="1">
      <h2>1. Rincian Biaya</h2>
      <table data-role="service_cost_table">
        <tbody>
          <tr data-role="service_0"><td>Custom Dev</td><td data-field="service_total">Rp 50.000.000</td></tr>
        </tbody>
      </table>
    </section>`;

    const legalSection = `<section data-block-type="legal"><ol><li>Syarat dan ketentuan berlaku.</li></ol></section>`;
    const signatureSection = `<section data-block-type="signature"><table class="signature-table"><tbody><tr><td>CEO</td></tr></tbody></table></section>`;

    const input = `<article class="quotation-document">
      <header data-block-type="metadata">
        <h1>PENAWARAN</h1>
        <p><span data-field="quotation_number">Q-123</span></p>
      </header>
      ${commercialSection}
      ${legalSection}
      ${signatureSection}
    </article>`;

    const output = normalizeQuotationHeaderHTML(input);

    expect(output).toContain(commercialSection);
    expect(output).toContain(legalSection);
    expect(output).toContain(signatureSection);
    expect(output).not.toContain('<header data-block-type="metadata">');
    expect(output).toContain('<section data-block-type="metadata">');
  });

  it('5. leaves documents without metadata sections completely unchanged', () => {
    const inputWithoutMetadata = `<article class="quotation-document talent-outsourcing-document" data-service="talent_outsourcing">
      <section data-block-type="commercial" data-section-code="development_cost"><h2>1. Biaya</h2><table><tbody><tr><td>Dev</td></tr></tbody></table></section>
      <section data-block-type="limitations"><ul><li>Out of pocket</li></ul></section>
    </article>`;

    expect(normalizeQuotationHeaderHTML(inputWithoutMetadata)).toBe(inputWithoutMetadata);
    expect(normalizeQuotationHeaderHTML('')).toBe('');
    expect(normalizeQuotationHeaderHTML('   ')).toBe('   ');
  });

  it('6. generates complete 5-field canonical metadata when fields are missing or empty', () => {
    const minimalHeader = `<header data-block-type="metadata"><h1>PENAWARAN CUSTOM</h1></header>`;

    const normalized = normalizeQuotationHeaderHTML(minimalHeader);

    expect(normalized).toContain('<h1>PENAWARAN CUSTOM</h1>');
    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="quotation_number"><span data-role="metadata-label">No</span><span data-role="metadata-separator">:</span><span data-role="metadata-value"></span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="subject"><span data-role="metadata-label">Perihal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value"></span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="issue_date_header"><span data-role="metadata-label">Tanggal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value"></span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="recipient-line" data-field="client_pic"><span data-role="recipient-prefix">Yth. </span><span data-role="metadata-value"></span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value"></span></div>'
    );
    // system_name should not be rendered if not present
    expect(normalized).not.toContain('data-field="system_name"');
  });

  it('7. safely preserves escaped entities without double-escaping or corruption', () => {
    const escapedInput = `<header data-block-type="metadata">
      <h1>Penawaran &amp; Dukungan &lt;Teknis&gt;</h1>
      <p><strong>Nomor:</strong> <span data-field="quotation_number">VEN/01 &amp; 02</span></p>
      <p><strong>Perihal:</strong> <span data-field="subject">Sistem &quot;Cloud&quot; &amp; Antrian</span></p>
      <p><strong>Tanggal:</strong> <span data-field="issue_date_header">1 &lt; 2 Mei 2026</span></p>
      <p><strong>Ditujukan kepada:</strong> <span data-field="client_pic">Ir. Budi &amp; Rekan</span></p>
      <p data-field="client_company">PT &quot;Maju Jaya&quot; &amp; Associates</p>
    </header>`;

    const normalized = normalizeQuotationHeaderHTML(escapedInput);

    expect(normalized).toContain('<h1>Penawaran &amp; Dukungan &lt;Teknis&gt;</h1>');
    expect(normalized).toContain('VEN/01 &amp; 02');
    expect(normalized).toContain('Sistem &quot;Cloud&quot; &amp; Antrian');
    expect(normalized).toContain('1 &lt; 2 Mei 2026');
    expect(normalized).toContain('Ir. Budi &amp; Rekan');
    expect(normalized).toContain('PT &quot;Maju Jaya&quot; &amp; Associates');
    expect(normalized).not.toContain('&amp;amp;');
  });

  it('normalizes legacy talent headers with ordered unlabeled paragraphs', () => {
    const legacyTalent = `<header>
      <h1>PENAWARAN LAYANAN TALENT OUTSOURCING</h1>
      <p>VEN/01</p>
      <p>Backend Engineer</p>
    </header>`;

    const normalized = normalizeQuotationHeaderHTML(legacyTalent);

    expect(normalized).toContain('<h1>PENAWARAN LAYANAN TALENT OUTSOURCING</h1>');
    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="quotation_number"><span data-role="metadata-label">No</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">VEN/01</span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="metadata-row" data-field="subject"><span data-role="metadata-label">Perihal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Backend Engineer</span></div>'
    );
  });

  it('cleans up redundant Yth. prefixes in client_pic to avoid duplication with recipient-prefix', () => {
    const legacyWithYth = `<header data-block-type="metadata">
      <h1>PENAWARAN</h1>
      <p><strong>Ditujukan kepada:</strong> Yth. Bapak Sutrisno</p>
      <p>PT Sentosa</p>
    </header>`;

    const normalized = normalizeQuotationHeaderHTML(legacyWithYth);

    expect(normalized).toContain(
      '<div data-role="recipient-line" data-field="client_pic"><span data-role="recipient-prefix">Yth. </span><span data-role="metadata-value">Bapak Sutrisno</span></div>'
    );
    expect(normalized).toContain(
      '<div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value">PT Sentosa</span></div>'
    );
  });
});
