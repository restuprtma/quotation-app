function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const METADATA_BLOCK_REGEX =
  /<(?:section|header)\b[^>]*\bdata-block-type=["']metadata["'][^>]*>[\s\S]*?<\/(?:section|header)>/i;
const HEADER_FALLBACK_REGEX = /<header\b[^>]*>[\s\S]*?<\/header>/i;

export type ExtractedHeaderData = {
  title: string;
  quotationNumber: string;
  subject: string;
  issueDate: string;
  clientPic: string;
  clientCompany: string;
  systemName: string;
};

export function buildCanonicalHeaderHTML({
  title = 'PENAWARAN',
  quotationNumber = '',
  subject = '',
  issueDate = '',
  clientPic = '',
  clientCompany = '',
  systemName = '',
}: Partial<ExtractedHeaderData>): string {
  const safeTitle = escapeHTML(title || 'PENAWARAN');
  const safeNumber = escapeHTML(quotationNumber);
  const safeSubject = escapeHTML(subject);
  const safeDate = escapeHTML(issueDate);
  const safePic = escapeHTML(clientPic);
  const safeCompany = escapeHTML(clientCompany);
  const safeSystem = escapeHTML(systemName);

  const systemRow = safeSystem
    ? `\n      <div data-role="metadata-row" data-field="system_name"><span data-role="metadata-label">Sistem</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">${safeSystem}</span></div>`
    : '';

  return `<section data-block-type="metadata">
  <div data-role="quotation-brand"><img src="/logo/venturo-logo.png" alt="Venturo — Expert Programmers"></div>
  <h1>${safeTitle}</h1>
  <div data-role="metadata-layout">
    <div data-role="metadata-facts">
      <div data-role="metadata-row" data-field="quotation_number"><span data-role="metadata-label">No</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">${safeNumber}</span></div>
      <div data-role="metadata-row" data-field="subject"><span data-role="metadata-label">Perihal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">${safeSubject}</span></div>
      <div data-role="metadata-row" data-field="issue_date_header"><span data-role="metadata-label">Tanggal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">${safeDate}</span></div>${systemRow}
    </div>
    <div data-role="metadata-recipient">
      <div data-role="recipient-heading">Kepada</div>
      <div data-role="recipient-line" data-field="client_pic"><span data-role="recipient-prefix">Yth. </span><span data-role="metadata-value">${safePic}</span></div>
      <div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value">${safeCompany}</span></div>
    </div>
  </div>
</section>`;
}

export function extractHeaderData(metadata: Element): ExtractedHeaderData {
  const title = metadata.querySelector('h1')?.textContent?.trim() || 'PENAWARAN';

  let quotationNumber =
    metadata.querySelector('[data-field="quotation_number"]')?.textContent?.trim() ?? '';
  let subject = metadata.querySelector('[data-field="subject"]')?.textContent?.trim() ?? '';
  let issueDate =
    metadata.querySelector('[data-field="issue_date_header"]')?.textContent?.trim() ??
    metadata.querySelector('[data-field="quotation_date"]')?.textContent?.trim() ??
    '';
  let clientPic = metadata.querySelector('[data-field="client_pic"]')?.textContent?.trim() ?? '';
  let clientCompany =
    metadata.querySelector('[data-field="client_company"]')?.textContent?.trim() ?? '';
  let systemName =
    metadata.querySelector('[data-field="system_name"]')?.textContent?.trim() ?? '';

  const paragraphs = Array.from(metadata.querySelectorAll('p'));
  const unassignedParagraphs: { index: number; text: string }[] = [];

  let picIndex = -1;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const text = p.textContent?.trim() ?? '';
    let matched = false;

    const numMatch = /^(?:Nomor|No\.?)\s*:\s*(.*)$/i.exec(text);
    if (numMatch) {
      matched = true;
      if (!quotationNumber) quotationNumber = numMatch[1].trim();
    }

    const subMatch = /^(?:Perihal)\s*:\s*(.*)$/i.exec(text);
    if (subMatch) {
      matched = true;
      if (!subject) subject = subMatch[1].trim();
    }

    const dateMatch = /^(?:Tanggal)\s*:\s*(.*)$/i.exec(text);
    if (dateMatch) {
      matched = true;
      if (!issueDate) issueDate = dateMatch[1].trim();
    }

    const sysMatch = /^(?:Sistem)\s*:\s*(.*)$/i.exec(text);
    if (sysMatch) {
      matched = true;
      if (!systemName) systemName = sysMatch[1].trim();
    }

    const picMatch = /^(?:Ditujukan\s+kepada|Kepada)\s*:\s*(.*)$/i.exec(text);
    if (picMatch) {
      matched = true;
      picIndex = i;
      if (!clientPic) clientPic = picMatch[1].trim();
    } else if (p.querySelector('[data-field="client_pic"]')) {
      picIndex = i;
    }

    const compMatch = /^(?:Perusahaan|Instansi|Company)\s*:\s*(.*)$/i.exec(text);
    if (compMatch) {
      matched = true;
      if (!clientCompany) clientCompany = compMatch[1].trim();
    }

    if (!matched && !p.hasAttribute('data-field')) {
      unassignedParagraphs.push({ index: i, text });
    }
  }

  // If a paragraph immediately follows client_pic without its own label, it is client_company
  if (picIndex !== -1 && !clientCompany) {
    const nextParagraph = unassignedParagraphs.find((item) => item.index === picIndex + 1);
    if (nextParagraph) {
      clientCompany = nextParagraph.text;
      const idx = unassignedParagraphs.indexOf(nextParagraph);
      if (idx !== -1) unassignedParagraphs.splice(idx, 1);
    }
  }

  // Handle unlabeled legacy structures (e.g. talent headers where p[0] is number and p[1] is subject)
  if (unassignedParagraphs.length > 0) {
    if (!quotationNumber && unassignedParagraphs[0]?.index === 0) {
      quotationNumber = unassignedParagraphs[0].text;
      unassignedParagraphs.shift();
    }
    if (!subject && unassignedParagraphs[0]?.index === 1) {
      subject = unassignedParagraphs[0].text;
      unassignedParagraphs.shift();
    }
    if (!clientCompany && unassignedParagraphs.length > 0) {
      clientCompany = unassignedParagraphs[unassignedParagraphs.length - 1].text;
    }
  }

  // Strip leading "Yth." from clientPic because canonical recipientLine already includes prefix "Yth. "
  clientPic = clientPic.replace(/^Yth\.?\s*/i, '').trim();

  return {
    title,
    quotationNumber,
    subject,
    issueDate,
    clientPic,
    clientCompany,
    systemName,
  };
}

/**
 * Normalizes legacy quotation metadata block structures into the canonical
 * 2-column header HTML before feeding content to Tiptap QuotationEditor.
 * Non-metadata sections remain strictly untouched and canonical headers are idempotent.
 */
export function normalizeQuotationHeaderHTML(content: string): string {
  if (!content || !content.trim()) {
    return content;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');

  const metadata =
    doc.querySelector('[data-block-type="metadata"]') ?? doc.querySelector('header');
  if (!metadata) {
    return content;
  }

  const isCanonical =
    metadata.querySelector('[data-role="quotation-brand"]') !== null &&
    metadata.querySelector('[data-role="metadata-layout"]') !== null;

  if (isCanonical) {
    return content;
  }

  const extracted = extractHeaderData(metadata);
  const canonicalHeader = buildCanonicalHeaderHTML(extracted);

  if (METADATA_BLOCK_REGEX.test(content)) {
    return content.replace(METADATA_BLOCK_REGEX, canonicalHeader);
  }

  if (HEADER_FALLBACK_REGEX.test(content)) {
    return content.replace(HEADER_FALLBACK_REGEX, canonicalHeader);
  }

  return content;
}
