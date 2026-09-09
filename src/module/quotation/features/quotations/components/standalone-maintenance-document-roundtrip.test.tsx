import type { JSONContent } from '@tiptap/core';

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { it, expect, describe } from 'vitest';
import HTMLParser from 'html-parse-stringify';

import { wrapOfficialDocument } from './quotation-editor';
import {
  QuotationFieldMark,
  LegalBlockExtension,
  QuotationTableExtension,
  QuotationSectionExtension,
  QuotationTableRowExtension,
  QuotationTableCellExtension,
  QuotationTableHeaderExtension,
  QuotationFieldAttributesExtension,
} from './legal-block-extension';

class MockClassList {
  node: MockNode;
  constructor(node: MockNode) {
    this.node = node;
  }
  private _get() {
    return (this.node.getAttribute('class') || '').split(/\s+/).filter(Boolean);
  }
  private _set(arr: string[]) {
    this.node.setAttribute('class', arr.join(' '));
  }
  add(...classes: string[]) {
    const set = new Set(this._get());
    classes.forEach((c) => set.add(c));
    this._set(Array.from(set));
  }
  remove(...classes: string[]) {
    const set = new Set(this._get());
    classes.forEach((c) => set.delete(c));
    this._set(Array.from(set));
  }
  contains(c: string) {
    return this._get().includes(c);
  }
}

class MockStyle {
  [key: string]: any;
  setProperty(prop: string, val: string) {
    (this as any)[prop] = val;
  }
  getPropertyValue(prop: string) {
    return (this as any)[prop] || '';
  }
  removeProperty(prop: string) {
    delete (this as any)[prop];
  }
}

class MockNode {
  nodeType: number;
  nodeName: string;
  tagName?: string;
  attrs: Record<string, string>;
  nodeValue: string | null;
  childNodes: MockNode[];
  parentNode: MockNode | null = null;
  style: MockStyle;
  ownerDocument: MockDocument | null = null;
  classList: MockClassList;

  constructor(nodeType: number, nodeName: string, attrs: Record<string, string> = {}, text = '') {
    this.nodeType = nodeType;
    this.nodeName = nodeName.toUpperCase();
    this.tagName = nodeType === 1 ? nodeName.toUpperCase() : undefined;
    this.attrs = { ...attrs };
    this.nodeValue = nodeType === 3 ? text : null;
    this.childNodes = [];
    this.style = new MockStyle();
    this.classList = new MockClassList(this);
  }

  get textContent(): string {
    if (this.nodeType === 3) return this.nodeValue || '';
    return this.childNodes.map((c) => c.textContent).join('');
  }

  set textContent(val: string) {
    if (this.nodeType === 3) {
      this.nodeValue = val;
    } else {
      this.childNodes = [];
      if (val) {
        this.appendChild(new MockNode(3, '#text', {}, val));
      }
    }
  }

  get children(): MockNode[] {
    return this.childNodes.filter((c) => c.nodeType === 1);
  }

  get firstChild(): MockNode | null {
    return this.childNodes[0] || null;
  }
  get lastChild(): MockNode | null {
    return this.childNodes[this.childNodes.length - 1] || null;
  }
  get nextSibling(): MockNode | null {
    if (!this.parentNode) return null;
    const idx = this.parentNode.childNodes.indexOf(this);
    return idx >= 0 && idx < this.parentNode.childNodes.length - 1
      ? this.parentNode.childNodes[idx + 1]
      : null;
  }
  get previousSibling(): MockNode | null {
    if (!this.parentNode) return null;
    const idx = this.parentNode.childNodes.indexOf(this);
    return idx > 0 ? this.parentNode.childNodes[idx - 1] : null;
  }

  getAttribute(name: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.attrs, name) ? String(this.attrs[name]) : null;
  }
  setAttribute(name: string, val: unknown): void {
    this.attrs[name] = String(val);
  }
  removeAttribute(name: string): void {
    delete this.attrs[name];
  }
  hasAttribute(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.attrs, name);
  }
  getAttributeNames(): string[] {
    return Object.keys(this.attrs);
  }

  appendChild(child: MockNode): MockNode {
    return this.insertBefore(child, null);
  }
  insertBefore(child: MockNode, refChild: MockNode | null): MockNode {
    if (child.nodeType === 11) {
      const children = [...child.childNodes];
      child.childNodes = [];
      for (const c of children) {
        this.insertBefore(c, refChild);
      }
      return child;
    }
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    const idx = refChild ? this.childNodes.indexOf(refChild) : -1;
    if (idx >= 0) {
      this.childNodes.splice(idx, 0, child);
    } else {
      this.childNodes.push(child);
    }
    return child;
  }
  removeChild(child: MockNode): MockNode {
    const idx = this.childNodes.indexOf(child);
    if (idx >= 0) {
      this.childNodes.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }
  contains(other: MockNode | null): boolean {
    if (other === this) return true;
    let curr: MockNode | null = other ? other.parentNode : null;
    while (curr) {
      if (curr === this) return true;
      curr = curr.parentNode;
    }
    return false;
  }
  getBoundingClientRect() {
    return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
  addEventListener(): void {}
  removeEventListener(): void {}

  closest(selector: string): MockNode | null {
    if (this.nodeType === 1 && this.matches(selector)) return this;
    return this.parentNode ? this.parentNode.closest(selector) : null;
  }

  get innerHTML(): string {
    return this.childNodes
      .map((c) => {
        if (c.nodeType === 3) return c.textContent;
        const tag = (c.nodeName || 'div').toLowerCase();
        const attrsStr = Object.entries(c.attrs)
          .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
          .join('');
        return `<${tag}${attrsStr}>${c.innerHTML}</${tag}>`;
      })
      .join('');
  }

  set innerHTML(val: string) {
    this.childNodes = [];
    this.textContent = val;
    if (val) {
      const textNode = new MockNode(3, '#text', {}, val);
      this.appendChild(textNode);
    }
  }

  matches(selector: string): boolean {
    if (!selector) return false;
    const parts = selector.split(',').map((s) => s.trim());
    return parts.some((part) => this._matchesSingle(part));
  }

  private _matchesSingle(sel: string): boolean {
    if (sel.startsWith('.')) {
      return this.classList.contains(sel.slice(1));
    }
    const tagMatch = sel.match(/^[a-zA-Z0-9]+/);
    if (tagMatch) {
      if (tagMatch[0].toUpperCase() !== this.nodeName) return false;
      sel = sel.slice(tagMatch[0].length);
    }
    const attrRegex = /\[([a-zA-Z0-9_-]+)(?:=([^\]]+))?\]/g;
    let m: RegExpExecArray | null;
    while ((m = attrRegex.exec(sel)) !== null) {
      const attrName = m[1];
      let expected = m[2];
      if (!this.hasAttribute(attrName)) return false;
      if (expected !== undefined) {
        if (
          (expected.startsWith('"') && expected.endsWith('"')) ||
          (expected.startsWith("'") && expected.endsWith("'"))
        ) {
          expected = expected.slice(1, -1);
        }
        if (this.getAttribute(attrName) !== expected) return false;
      }
    }
    return true;
  }

  querySelector(selector: string): MockNode | null {
    for (const child of this.childNodes) {
      if (child.nodeType === 1) {
        if (child.matches(selector)) return child;
        const found = child.querySelector(selector);
        if (found) return found;
      }
    }
    return null;
  }

  querySelectorAll(selector: string): MockNode[] {
    const results: MockNode[] = [];
    const walk = (node: MockNode) => {
      for (const child of node.childNodes) {
        if (child.nodeType === 1) {
          if (child.matches(selector)) results.push(child);
          walk(child);
        }
      }
    };
    walk(this);
    return results;
  }

  getElementsByTagName(name: string): MockNode[] {
    const upper = name.toUpperCase();
    const results: MockNode[] = [];
    const walk = (node: MockNode) => {
      for (const child of node.childNodes) {
        if (child.nodeType === 1) {
          if (upper === '*' || child.nodeName === upper) results.push(child);
          walk(child);
        }
      }
    };
    walk(this);
    return results;
  }
}

class MockDocument {
  documentElement: MockNode;
  head: MockNode;
  body: MockNode;
  implementation = {
    createHTMLDocument: () => new MockDocument(),
  };

  constructor() {
    this.documentElement = new MockNode(1, 'HTML');
    this.head = new MockNode(1, 'HEAD');
    this.body = new MockNode(1, 'BODY');
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
  }

  createElement(name: string): MockNode {
    const el = new MockNode(1, name);
    el.ownerDocument = this;
    return el;
  }
  createTextNode(text: string): MockNode {
    const node = new MockNode(3, '#text', {}, text);
    node.ownerDocument = this;
    return node;
  }
  createDocumentFragment(): MockNode {
    const frag = new MockNode(11, '#document-fragment');
    frag.ownerDocument = this;
    return frag;
  }
  querySelector(selector: string): MockNode | null {
    return this.documentElement.querySelector(selector);
  }
  querySelectorAll(selector: string): MockNode[] {
    return this.documentElement.querySelectorAll(selector);
  }
  getElementsByTagName(name: string): MockNode[] {
    return this.documentElement.getElementsByTagName(name);
  }
  addEventListener(): void {}
  removeEventListener(): void {}
}

function astToDom(astNode: any, doc: MockDocument): MockNode {
  if (astNode.type === 'text') {
    return doc.createTextNode(astNode.content);
  }
  const el = doc.createElement(astNode.name);
  for (const [k, v] of Object.entries(astNode.attrs || {})) {
    el.setAttribute(k, v);
  }
  if (astNode.children) {
    for (const child of astNode.children) {
      el.appendChild(astToDom(child, doc));
    }
  }
  return el;
}

class MockDOMParser {
  parseFromString(htmlString: string): { body: MockNode } {
    const doc = new MockDocument();
    const ast = HTMLParser.parse(htmlString);
    const bodyAst = (ast as any[]).find((n) => n.name === 'body') || { children: ast };
    const body = doc.createElement('BODY');
    if (bodyAst.children) {
      for (const c of bodyAst.children) {
        body.appendChild(astToDom(c, doc));
      }
    }
    doc.body = body;
    return { body };
  }
}

if (typeof (globalThis as any).window === 'undefined') {
  const mockDoc = new MockDocument();
  (globalThis as any).document = mockDoc;
  (globalThis as any).window = {
    document: mockDoc,
    DOMParser: MockDOMParser,
    Node: MockNode,
    addEventListener: () => {},
    removeEventListener: () => {},
    getSelection: () => ({ rangeCount: 0, addRange: () => {}, removeAllRanges: () => {} }),
    innerHeight: 800,
    innerWidth: 1200,
    setTimeout,
    clearTimeout,
  };
  (globalThis as any).Node = MockNode;
  (globalThis as any).innerHeight = 800;
  (globalThis as any).innerWidth = 1200;
}

const makeCell = (type: 'tableCell' | 'tableHeader', text: string, attrs = {}) => ({
  type,
  attrs: { colspan: 1, rowspan: 1, colwidth: null, align: null, ...attrs },
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const representativeRetainerDocument: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'metadata',
        'data-section-number': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'heading',
          attrs: { level: 1, textAlign: null, 'data-field': null },
          content: [
            {
              type: 'text',
              text: 'PENAWARAN LAYANAN STANDALONE MAINTENANCE & SUPPORT',
              marks: [{ type: 'quotationField', attrs: { 'data-field': 'quotation_number' } }],
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'subject' },
          content: [{ type: 'text', text: 'Penawaran Maintenance Aplikasi Nex Health' }],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'client_pic' },
          content: [{ type: 'text', text: 'Cris Bawana' }],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'client_company' },
          content: [{ type: 'text', text: 'Nex Digital' }],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'opening',
        'data-section-number': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'paragraph',
          attrs: { 'data-field': null },
          content: [
            {
              type: 'text',
              text: 'Melalui penawaran ini, kami menegaskan kesiapan tim IT Profesional kami yang berjumlah lebih dari 100 orang untuk mendukung layanan dan keberhasilan proyek. Dokumen ini memuat ruang lingkup pekerjaan, output, timeline, dan rincian biaya sebagai acuan kesepakatan bersama kedua belah pihak.',
            },
          ],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'commercial',
        'data-section-number': '1',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableHeader', 'Maintenance Squad'),
                makeCell('tableHeader', 't(Monthly)'),
                makeCell('tableHeader', 'Employee'),
                makeCell('tableHeader', 't(Month)'),
                makeCell('tableHeader', 'Total'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'retainer_cost_0', 'data-field': null },
              content: [
                makeCell('tableCell', 'Senior Web Programmer'),
                makeCell('tableCell', 'Rp 16.050.000'),
                makeCell('tableCell', '1'),
                makeCell('tableCell', '1 Bulan'),
                makeCell('tableCell', 'Rp 16.050.000', { 'data-field': 'cost_line_total' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'retainer_cost_1', 'data-field': null },
              content: [
                makeCell('tableCell', 'Senior QA'),
                makeCell('tableCell', 'Rp 14.070.000'),
                makeCell('tableCell', '0.5'),
                makeCell('tableCell', '1 Bulan'),
                makeCell('tableCell', 'Rp 7.035.000', { 'data-field': 'cost_line_total' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'TOTAL', { colspan: 4 }),
                makeCell('tableCell', 'Rp 23.085.000', { 'data-field': 'cost_subtotal' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'DISCOUNT', { colspan: 4 }),
                makeCell('tableCell', 'Rp 0', { 'data-field': 'discount_amount' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'TOTAL INVESTMENT', { colspan: 4 }),
                makeCell('tableCell', 'Rp 23.085.000', { 'data-field': 'total_investment' }),
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'scope',
        'data-section-number': '2',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableHeader', '# / Priority'),
                makeCell('tableHeader', 'Function'),
                makeCell('tableHeader', 'Screen / Flow'),
                makeCell('tableHeader', 'Existing'),
                makeCell('tableHeader', 'Improvement'),
                makeCell('tableHeader', 'Reference'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'defect_group_0', 'data-field': null },
              content: [makeCell('tableCell', '1. Detail Pasien', { colspan: 6 })],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'defect_0_0', 'data-field': null },
              content: [
                makeCell('tableCell', '1.1 P0'),
                makeCell('tableCell', 'Melihat riwayat medis pasien'),
                makeCell('tableCell', 'Pasien > Medical History'),
                makeCell('tableCell', 'Hanya mencantumkan catatan registrasi awal'),
                makeCell(
                  'tableCell',
                  'Mencantumkan seluruh riwayat SOAP (Dokter, Terapis, Perawat)'
                ),
                makeCell('tableCell', 'Ref 1.01'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'defect_0_1', 'data-field': null },
              content: [
                makeCell('tableCell', '1.2 P0'),
                makeCell('tableCell', 'Riwayat foto pasien'),
                makeCell('tableCell', 'Pasien > Foto Pasien'),
                makeCell('tableCell', 'Format foto hanya JPG dan PNG'),
                makeCell('tableCell', 'Mendukung format JPG, PNG, dan PDF'),
                makeCell('tableCell', 'Ref 1.02'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'defect_group_1', 'data-field': null },
              content: [makeCell('tableCell', '4. Pengaturan Treatment', { colspan: 6 })],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'defect_1_0', 'data-field': null },
              content: [
                makeCell('tableCell', '4.1 P0'),
                makeCell('tableCell', 'Akses harga COGS'),
                makeCell('tableCell', 'Treatment > Edit Treatment'),
                makeCell('tableCell', 'Melekat pada hak akses edit treatment'),
                makeCell('tableCell', 'Dibuat hak akses terpisah khusus role tertentu'),
                makeCell('tableCell', 'Ref 4.01'),
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'payment',
        'data-section-number': '3',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableHeader', 'Work Period'),
                makeCell('tableHeader', 'Terms'),
                makeCell('tableHeader', 'Invoice Date'),
                makeCell('tableHeader', 'Due Date'),
                makeCell('tableHeader', 'Nominal'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'payment_0', 'data-field': null },
              content: [
                makeCell('tableCell', '13 Juli - 13 Agustus 2026'),
                makeCell('tableCell', 'Maintenance'),
                makeCell('tableCell', '13 Agustus 2026'),
                makeCell('tableCell', '27 Agustus 2026'),
                makeCell('tableCell', 'Rp 23.085.000', { 'data-field': 'payment_nominal' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'TOTAL', { colspan: 4 }),
                makeCell('tableCell', 'Rp 23.085.000', { 'data-field': 'payment_total' }),
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'legalBlock',
      attrs: {
        'data-block-type': 'legal',
        'data-section-number': '4',
        'data-template-code': 'QUOTATION_TERMS',
        'data-modified': 'false',
      },
      content: [
        {
          type: 'paragraph',
          attrs: { 'data-field': null },
          content: [{ type: 'text', text: 'Official maintenance legal terms and limitations.' }],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'signature',
        'data-section-number': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'paragraph',
          attrs: { 'data-field': null },
          content: [
            { type: 'text', text: 'Malang, ' },
            {
              type: 'text',
              text: '7 Juli 2026',
              marks: [{ type: 'quotationField', attrs: { 'data-field': 'signature_date' } }],
            },
          ],
        },
        {
          type: 'table',
          attrs: { class: 'signature-table' },
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'Hormat Kami, Yulianto Frandi - Direksi Venturo Pro'),
                makeCell('tableCell', 'Disetujui Oleh, Cris Bawana - Nex Digital'),
              ],
            },
          ],
        },
      ],
    },
  ],
};

const representativeHourlyWithRightsDocument: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'commercial',
        'data-section-number': '1',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableHeader', 'Development'),
                makeCell('tableHeader', 't(Monthly)'),
                makeCell('tableHeader', 'Employee'),
                makeCell('tableHeader', 't(Hours)'),
                makeCell('tableHeader', 'Total'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'hourly_cost_0', 'data-field': null },
              content: [
                makeCell('tableCell', 'Senior Mobile Programmer'),
                makeCell('tableCell', 'Rp 16.050.000'),
                makeCell('tableCell', '1'),
                makeCell('tableCell', '8'),
                makeCell('tableCell', 'Rp 730.000', { 'data-field': 'cost_line_total' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'hourly_cost_1', 'data-field': null },
              content: [
                makeCell('tableCell', 'Intermediate QA'),
                makeCell('tableCell', 'Rp 12.500.000'),
                makeCell('tableCell', '1'),
                makeCell('tableCell', '2'),
                makeCell('tableCell', 'Rp 140.000', { 'data-field': 'cost_line_total' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'TOTAL INVESTMENT', { colspan: 4 }),
                makeCell('tableCell', 'Rp 870.000', { 'data-field': 'total_investment' }),
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'scope',
        'data-section-number': '2',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableHeader', 'Description'),
                makeCell('tableHeader', 'Platform'),
                makeCell('tableHeader', 'Hours'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'hourly_task_0', 'data-field': null },
              content: [
                makeCell('tableCell', 'Fix QTSHelp.appLink() - tambah idPage + null safety'),
                makeCell('tableCell', 'Android'),
                makeCell('tableCell', '1'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'hourly_task_1', 'data-field': null },
              content: [
                makeCell('tableCell', 'Update deep ink parser di Splash.java'),
                makeCell('tableCell', 'Android'),
                makeCell('tableCell', '1'),
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'payment',
        'data-section-number': '3',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableHeader', 'Work Period'),
                makeCell('tableHeader', 'Terms'),
                makeCell('tableHeader', 'Invoice Date'),
                makeCell('tableHeader', 'Due Date'),
                makeCell('tableHeader', 'Nominal'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'payment_0', 'data-field': null },
              content: [
                makeCell('tableCell', '28 Mei 2026'),
                makeCell('tableCell', 'Pelunasan'),
                makeCell('tableCell', '2 Juni 2026'),
                makeCell('tableCell', '16 Juni 2026'),
                makeCell('tableCell', 'Rp 870.000', { 'data-field': 'payment_nominal' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'TOTAL', { colspan: 4 }),
                makeCell('tableCell', 'Rp 870.000', { 'data-field': 'payment_total' }),
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'legalBlock',
      attrs: {
        'data-block-type': 'rights',
        'data-section-number': '4',
        'data-template-code': null,
        'data-modified': 'false',
      },
      content: [
        {
          type: 'paragraph',
          attrs: { 'data-field': null },
          content: [
            {
              type: 'text',
              text: 'Hak cipta dan kepemilikan kode sumber utama tetap berada pada Venturo.',
            },
          ],
        },
      ],
    },
    {
      type: 'legalBlock',
      attrs: {
        'data-block-type': 'legal',
        'data-section-number': '5',
        'data-template-code': 'QUOTATION_TERMS',
        'data-modified': 'false',
      },
      content: [
        {
          type: 'paragraph',
          attrs: { 'data-field': null },
          content: [{ type: 'text', text: 'Official legal terms and conditions.' }],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'signature',
        'data-section-number': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'table',
          attrs: { class: 'signature-table' },
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'Hormat Kami, Yulianto Frandi'),
                makeCell('tableCell', 'Disetujui Oleh, Bpk Muh. Khalid Andriano'),
              ],
            },
          ],
        },
      ],
    },
  ],
};

function createEditor(
  content: JSONContent | string = representativeRetainerDocument,
  options = { unlocked: false }
) {
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      QuotationSectionExtension,
      QuotationFieldAttributesExtension,
      QuotationFieldMark,
      QuotationTableExtension.configure({ resizable: true }),
      QuotationTableRowExtension,
      QuotationTableHeaderExtension,
      QuotationTableCellExtension,
      LegalBlockExtension.configure({ unlocked: options.unlocked }),
    ],
    content,
  });
  const stateWithPlugins = editor.state.reconfigure({
    plugins: editor.extensionManager.plugins,
  });
  editor.view.updateState(stateWithPlugins);
  return editor;
}

const canonicalRetainerHtml = `<article class="quotation-document">
<section data-block-type="metadata">
<h1>PENAWARAN LAYANAN STANDALONE MAINTENANCE &amp; SUPPORT</h1>
<p><strong>Nomor:</strong> <span data-field="quotation_number">Q/2026/07/001</span></p>
<p><strong>Perihal:</strong> <span data-field="subject">Penawaran Maintenance Aplikasi Nex Health</span></p>
<p><strong>Tanggal:</strong> <span data-field="issue_date_header">7 Juli 2026</span></p>
<p><strong>Ditujukan kepada:</strong> <span data-field="client_pic">Cris Bawana</span></p>
<p data-field="client_company">Nex Digital</p>
</section>
<section data-block-type="opening">
<p>Melalui penawaran ini, kami menegaskan kesiapan tim IT Profesional kami yang berjumlah lebih dari 100 orang untuk mendukung layanan dan keberhasilan proyek. Dokumen ini memuat ruang lingkup pekerjaan, output, timeline, dan rincian biaya sebagai acuan kesepakatan bersama kedua belah pihak.</p>
</section>
<section data-block-type="commercial" data-section-number="1">
<h2>1. Biaya Maintenance</h2>
<table><thead><tr><th>Maintenance Squad</th><th>t(Monthly)</th><th>Employee</th><th>t(Month)</th><th>Total</th></tr></thead><tbody>
<tr data-role="retainer_cost_0"><td>Senior Web Programmer</td><td>Rp 16.050.000</td><td>1</td><td>1 Bulan</td><td data-field="cost_line_total">Rp 16.050.000</td></tr>
<tr data-role="retainer_cost_1"><td>Senior QA</td><td>Rp 14.070.000</td><td>0.5</td><td>1 Bulan</td><td data-field="cost_line_total">Rp 7.035.000</td></tr>
<tr><td colspan="4">TOTAL</td><td data-field="cost_subtotal">Rp 23.085.000</td></tr>
<tr><td colspan="4">DISCOUNT</td><td data-field="discount_amount">Rp 0</td></tr>
<tr><td colspan="4">TOTAL INVESTMENT</td><td data-field="total_investment">Rp 23.085.000</td></tr>
</tbody></table>
</section>
<section data-block-type="scope" data-section-number="2">
<h2>2. Lingkup Pekerjaan &amp; Timeline</h2>
<table><thead><tr><th># / Priority</th><th>Function</th><th>Screen / Flow</th><th>Existing</th><th>Improvement</th><th>Reference</th></tr></thead><tbody>
<tr data-role="defect_group_0"><td colspan="6">1. Detail Pasien</td></tr>
<tr data-role="defect_0_0"><td>1.1<br/>P0</td><td>Melihat riwayat medis pasien</td><td>Pasien &gt; Medical History</td><td>Hanya mencantumkan catatan registrasi awal</td><td>Mencantumkan seluruh riwayat SOAP (Dokter, Terapis, Perawat)</td><td>Ref 1.01</td></tr>
<tr data-role="defect_0_1"><td>1.2<br/>P0</td><td>Riwayat foto pasien</td><td>Pasien &gt; Foto Pasien</td><td>Format foto hanya JPG dan PNG</td><td>Mendukung format JPG, PNG, dan PDF</td><td>Ref 1.02</td></tr>
<tr data-role="defect_group_1"><td colspan="6">4. Pengaturan Treatment</td></tr>
<tr data-role="defect_1_0"><td>4.1<br/>P0</td><td>Akses harga COGS</td><td>Treatment &gt; Edit Treatment</td><td>Melekat pada hak akses edit treatment</td><td>Dibuat hak akses terpisah khusus role tertentu</td><td>Ref 4.01</td></tr>
</tbody></table>
</section>
<section data-block-type="payment" data-section-number="3">
<h2>3. Pembayaran</h2>
<table><thead><tr><th>Work Period</th><th>Terms</th><th>Invoice Date</th><th>Due Date</th><th>Nominal</th></tr></thead><tbody>
<tr data-role="payment_0"><td>13 Juli - 13 Agustus 2026</td><td>Maintenance</td><td>13 Agustus 2026</td><td>27 Agustus 2026</td><td data-field="payment_nominal">Rp 23.085.000</td></tr>
<tr><td colspan="4">TOTAL</td><td data-field="payment_total">Rp 23.085.000</td></tr>
</tbody></table>
<p data-field="tax_clause">Seluruh rincian biaya belum termasuk PPN sesuai regulasi perpajakan yang berlaku di Indonesia.</p>
</section>
<section data-block-type="legal" data-section-number="4" data-template-code="QUOTATION_TERMS">
<h2>4. Batasan dan Pengecualian</h2>
<p>Official maintenance legal terms and limitations.</p>
</section>
<section data-block-type="signature">
<p>Malang, <span data-field="signature_date">7 Juli 2026</span></p>
<table class="signature-table"><tbody>
<tr><td>Hormat Kami, Yulianto Frandi - Direksi Venturo Pro</td><td>Disetujui Oleh, Cris Bawana - Nex Digital</td></tr>
</tbody></table>
</section>
</article>`;

const canonicalHourlyHtml = `<article class="quotation-document">
<section data-block-type="metadata">
<h1>PENAWARAN LAYANAN STANDALONE MAINTENANCE &amp; SUPPORT</h1>
<p><strong>Nomor:</strong> <span data-field="quotation_number">BENCH-LIPUTAN6-01</span></p>
<p><strong>Perihal:</strong> <span data-field="subject">Project Liputan 6</span></p>
</section>
<section data-block-type="opening">
<p>Melalui penawaran ini, kami menegaskan kesiapan tim IT Profesional kami yang berjumlah lebih dari 100 orang.</p>
</section>
<section data-block-type="commercial" data-section-number="1">
<h2>1. Biaya Development</h2>
<table><thead><tr><th>Development</th><th>t(Monthly)</th><th>Employee</th><th>t(Hours)</th><th>Total</th></tr></thead><tbody>
<tr data-role="hourly_cost_0"><td>Senior Mobile Programmer</td><td>Rp 16.050.000</td><td>1</td><td>8</td><td data-field="cost_line_total">Rp 730.000</td></tr>
<tr data-role="hourly_cost_1"><td>Intermediate QA</td><td>Rp 12.500.000</td><td>1</td><td>2</td><td data-field="cost_line_total">Rp 140.000</td></tr>
<tr><td colspan="4">TOTAL INVESTMENT</td><td data-field="total_investment">Rp 870.000</td></tr>
</tbody></table>
</section>
<section data-block-type="scope" data-section-number="2">
<h2>2. Lingkup Pekerjaan &amp; Timeline</h2>
<table><thead><tr><th>Description</th><th>Platform</th><th>Hours</th></tr></thead><tbody>
<tr data-role="hourly_task_0"><td>Fix QTSHelp.appLink() - tambah idPage + null safety</td><td>Android</td><td>1</td></tr>
<tr data-role="hourly_task_1"><td>Update deep ink parser di Splash.java</td><td>Android</td><td>1</td></tr>
<tr data-role="hourly_task_2"><td>Fix iOS share URL - ganti article.source</td><td>iOS</td><td>1,5</td></tr>
</tbody></table>
</section>
<section data-block-type="payment" data-section-number="3">
<h2>3. Pembayaran</h2>
<table><thead><tr><th>Work Period</th><th>Terms</th><th>Invoice Date</th><th>Due Date</th><th>Nominal</th></tr></thead><tbody>
<tr data-role="payment_0"><td>28 Mei 2026</td><td>Pelunasan</td><td>2 Juni 2026</td><td>16 Juni 2026</td><td data-field="payment_nominal">Rp 870.000</td></tr>
<tr><td colspan="4">TOTAL</td><td data-field="payment_total">Rp 870.000</td></tr>
</tbody></table>
</section>
<section data-block-type="rights">
<p>Hak cipta dan kepemilikan kode sumber utama tetap berada pada Venturo.</p>
</section>
<section data-block-type="legal" data-section-number="4" data-template-code="QUOTATION_TERMS">
<h2>4. Batasan dan Pengecualian</h2>
<p>Official legal terms and conditions.</p>
</section>
<section data-block-type="signature">
<p>Malang, <span data-field="signature_date">25 Mei 2026</span></p>
<table class="signature-table"><tbody>
<tr><td>Hormat Kami, Yulianto Frandi</td><td>Disetujui Oleh, Bpk Muh. Khalid Andriano</td></tr>
</tbody></table>
</section>
</article>`;

describe('standalone maintenance quotation document round-trip', () => {
  it('wraps editor fragments in the official article marker before persistence', () => {
    expect(
      wrapOfficialDocument('<section data-block-type="commercial"><p>Draft</p></section>')
    ).toBe(
      '<article class="quotation-document"><section data-block-type="commercial"><p>Draft</p></section></article>'
    );
  });

  it('parses canonical retainer HTML -> editor JSON -> serializes HTML with all markers and rows preserved', () => {
    const editor = createEditor(canonicalRetainerHtml);
    const json = editor.getJSON() as unknown as JSONContent;
    const sections = (json.content ?? []).filter((node) =>
      ['quotationSection', 'legalBlock'].includes(node.type ?? '')
    );

    // 1. Assert JSON node markers
    expect(sections.map((node) => node.attrs?.['data-block-type'])).toEqual([
      'metadata',
      'opening',
      'commercial',
      'scope',
      'payment',
      'legal',
      'signature',
    ]);
    expect(sections.map((node) => node.attrs?.['data-section-number'])).toEqual([
      null,
      null,
      '1',
      '2',
      '3',
      '4',
      null,
    ]);

    // 2. Assert serialized HTML preserves markers, data-role, data-field, and numbers
    const serializedHtml = editor.getHTML();
    expect(serializedHtml).toContain('data-block-type="metadata"');
    expect(serializedHtml).toContain('data-block-type="opening"');
    expect(serializedHtml).toContain('data-block-type="commercial"');
    expect(serializedHtml).toContain('data-block-type="scope"');
    expect(serializedHtml).toContain('data-block-type="payment"');
    expect(serializedHtml).toContain('data-block-type="legal"');
    expect(serializedHtml).toContain('data-block-type="signature"');

    // Cost rows & fields
    expect(serializedHtml).toContain('data-role="retainer_cost_0"');
    expect(serializedHtml).toContain('data-role="retainer_cost_1"');
    expect(serializedHtml).toContain('data-field="cost_line_total"');
    expect(serializedHtml).toContain('data-field="cost_subtotal"');
    expect(serializedHtml).toContain('data-field="discount_amount"');
    expect(serializedHtml).toContain('data-field="total_investment"');
    expect(serializedHtml).toContain('Rp 16.050.000');
    expect(serializedHtml).toContain('Rp 7.035.000');
    expect(serializedHtml).toContain('Rp 23.085.000');

    // Defect rows & references
    expect(serializedHtml).toContain('data-role="defect_group_0"');
    expect(serializedHtml).toContain('data-role="defect_0_0"');
    expect(serializedHtml).toContain('data-role="defect_0_1"');
    expect(serializedHtml).toContain('data-role="defect_group_1"');
    expect(serializedHtml).toContain('data-role="defect_1_0"');
    expect(serializedHtml).toContain('Melihat riwayat medis pasien');
    expect(serializedHtml).toContain('Riwayat foto pasien');
    expect(serializedHtml).toContain('Akses harga COGS');
    expect(serializedHtml).toContain('Ref 1.01');
    expect(serializedHtml).toContain('Ref 4.01');

    // Payment rows & fields
    expect(serializedHtml).toContain('data-role="payment_0"');
    expect(serializedHtml).toContain('data-field="payment_nominal"');
    expect(serializedHtml).toContain('data-field="payment_total"');
    expect(serializedHtml).toContain('data-field="tax_clause"');

    // Signature table
    expect(serializedHtml).toContain('signature-table');
    expect(serializedHtml).toContain('data-field="signature_date"');

    // Document wrapper persistence
    const wrappedDocument = wrapOfficialDocument(serializedHtml);
    expect(wrappedDocument.startsWith('<article class="quotation-document">')).toBe(true);
    expect(wrappedDocument.endsWith('</article>')).toBe(true);

    editor.destroy();
  });

  it('parses canonical hourly HTML -> editor JSON -> serializes HTML with tasks and rights preserved', () => {
    const editor = createEditor(canonicalHourlyHtml);
    const json = editor.getJSON() as unknown as JSONContent;
    const sections = (json.content ?? []).filter((node) =>
      ['quotationSection', 'legalBlock'].includes(node.type ?? '')
    );

    // 1. Assert JSON node markers
    expect(sections.map((node) => node.attrs?.['data-block-type'])).toEqual([
      'metadata',
      'opening',
      'commercial',
      'scope',
      'payment',
      'rights',
      'legal',
      'signature',
    ]);

    // Rights block parsed as legalBlock
    const rightsSection = sections.find((s) => s.attrs?.['data-block-type'] === 'rights');
    expect(rightsSection?.type).toBe('legalBlock');

    // 2. Assert serialized HTML preserves hourly rows, tasks, and rights
    const serializedHtml = editor.getHTML();
    expect(serializedHtml).toContain('data-block-type="commercial"');
    expect(serializedHtml).toContain('data-block-type="scope"');
    expect(serializedHtml).toContain('data-block-type="payment"');
    expect(serializedHtml).toContain('data-block-type="rights"');
    expect(serializedHtml).toContain('data-block-type="legal"');

    // Hourly cost items
    expect(serializedHtml).toContain('data-role="hourly_cost_0"');
    expect(serializedHtml).toContain('data-role="hourly_cost_1"');
    expect(serializedHtml).toContain('Rp 730.000');
    expect(serializedHtml).toContain('Rp 140.000');
    expect(serializedHtml).toContain('Rp 870.000');

    // Hourly tasks
    expect(serializedHtml).toContain('data-role="hourly_task_0"');
    expect(serializedHtml).toContain('data-role="hourly_task_1"');
    expect(serializedHtml).toContain('data-role="hourly_task_2"');
    expect(serializedHtml).toContain('Fix QTSHelp.appLink()');
    expect(serializedHtml).toContain('Update deep ink parser');
    expect(serializedHtml).toContain('Fix iOS share URL');

    // Rights content
    expect(serializedHtml).toContain('Hak cipta dan kepemilikan kode sumber');

    editor.destroy();
  });

  it('preserves retainer mode markers, cost rows, defect matrix, payment rows, and money fields', () => {
    const editor = createEditor(representativeRetainerDocument);
    const json = editor.getJSON() as unknown as JSONContent;
    const sections = (json.content ?? []).filter((node) =>
      ['quotationSection', 'legalBlock'].includes(node.type ?? '')
    );

    // Verify section order and block types
    expect(sections.map((node) => node.attrs?.['data-block-type'])).toEqual([
      'metadata',
      'opening',
      'commercial',
      'scope',
      'payment',
      'legal',
      'signature',
    ]);

    // Verify section numbers
    expect(sections.map((node) => node.attrs?.['data-section-number'])).toEqual([
      null,
      null,
      '1',
      '2',
      '3',
      '4',
      null,
    ]);

    // Verify commercial section contains retainer roles, fields, and values
    const commercialJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'commercial')
    );
    expect(commercialJson).toContain('retainer_cost_0');
    expect(commercialJson).toContain('retainer_cost_1');
    expect(commercialJson).toContain('cost_line_total');
    expect(commercialJson).toContain('cost_subtotal');
    expect(commercialJson).toContain('discount_amount');
    expect(commercialJson).toContain('total_investment');
    expect(commercialJson).toContain('Rp 16.050.000');
    expect(commercialJson).toContain('Rp 7.035.000');
    expect(commercialJson).toContain('Rp 23.085.000');

    // Verify scope section contains defect groups and items
    const scopeJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'scope')
    );
    expect(scopeJson).toContain('defect_group_0');
    expect(scopeJson).toContain('defect_0_0');
    expect(scopeJson).toContain('defect_0_1');
    expect(scopeJson).toContain('defect_group_1');
    expect(scopeJson).toContain('defect_1_0');
    expect(scopeJson).toContain('Melihat riwayat medis pasien');
    expect(scopeJson).toContain('Riwayat foto pasien');
    expect(scopeJson).toContain('Akses harga COGS');
    expect(scopeJson).toContain('Ref 1.01');
    expect(scopeJson).toContain('Ref 4.01');

    // Verify payment section contains payment_0, nominal, and total
    const paymentJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'payment')
    );
    expect(paymentJson).toContain('payment_0');
    expect(paymentJson).toContain('payment_nominal');
    expect(paymentJson).toContain('payment_total');
    expect(paymentJson).toContain('Rp 23.085.000');

    // Verify legal block
    const legalSection = sections.find((s) => s.attrs?.['data-block-type'] === 'legal');
    expect(legalSection?.type).toBe('legalBlock');
    expect(legalSection?.attrs?.['data-template-code']).toBe('QUOTATION_TERMS');

    // Verify signature
    const signatureJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'signature')
    );
    expect(signatureJson).toContain('signature-table');
    expect(signatureJson).toContain('signature_date');

    editor.destroy();
  });

  it('preserves hourly mode markers, cost rows, task scope, rights, and payment rows', () => {
    const editor = createEditor(representativeHourlyWithRightsDocument);
    const json = editor.getJSON() as unknown as JSONContent;
    const sections = (json.content ?? []).filter((node) =>
      ['quotationSection', 'legalBlock'].includes(node.type ?? '')
    );

    // Verify section order and block types
    expect(sections.map((node) => node.attrs?.['data-block-type'])).toEqual([
      'commercial',
      'scope',
      'payment',
      'rights',
      'legal',
      'signature',
    ]);

    // Verify commercial section contains hourly roles and values
    const commercialJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'commercial')
    );
    expect(commercialJson).toContain('hourly_cost_0');
    expect(commercialJson).toContain('hourly_cost_1');
    expect(commercialJson).toContain('Rp 730.000');
    expect(commercialJson).toContain('Rp 140.000');
    expect(commercialJson).toContain('Rp 870.000');

    // Verify scope section contains hourly tasks
    const scopeJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'scope')
    );
    expect(scopeJson).toContain('hourly_task_0');
    expect(scopeJson).toContain('hourly_task_1');
    expect(scopeJson).toContain('Fix QTSHelp.appLink()');
    expect(scopeJson).toContain('Update deep ink parser');

    // Verify rights block is parsed as legalBlock
    const rightsSection = sections.find((s) => s.attrs?.['data-block-type'] === 'rights');
    expect(rightsSection?.type).toBe('legalBlock');

    editor.destroy();
  });

  it('allows scope editing without legal unlock, while locking rights and legal blocks', () => {
    const editor = createEditor(representativeHourlyWithRightsDocument, { unlocked: false });

    let scopePosition = -1;
    let rightsPosition = -1;
    let legalPosition = -1;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'legalBlock' && node.attrs?.['data-block-type'] === 'rights') {
        rightsPosition = pos + 2;
      }
      if (node.type.name === 'legalBlock' && node.attrs?.['data-block-type'] === 'legal') {
        legalPosition = pos + 2;
      }
      if (node.type.name === 'quotationSection' && node.attrs?.['data-block-type'] === 'scope') {
        scopePosition = pos + 2;
      }
    });

    expect(rightsPosition).toBeGreaterThan(0);
    expect(legalPosition).toBeGreaterThan(0);
    expect(scopePosition).toBeGreaterThan(0);

    // 1. Edit rights when locked -> must be blocked
    const beforeRights = JSON.stringify(editor.getJSON());
    const trRights = editor.state.tr.insertText('TAMPERED_RIGHTS ', rightsPosition);
    editor.view.dispatch(trRights);
    expect(JSON.stringify(editor.getJSON())).toBe(beforeRights);

    // 2. Edit legal when locked -> must be blocked
    const beforeLegal = JSON.stringify(editor.getJSON());
    const trLegal = editor.state.tr.insertText('TAMPERED_LEGAL ', legalPosition);
    editor.view.dispatch(trLegal);
    expect(JSON.stringify(editor.getJSON())).toBe(beforeLegal);

    // 3. Edit scope -> must succeed without legal unlock
    const trScope = editor.state.tr.insertText('EDITED_SCOPE_TASK ', scopePosition);
    editor.view.dispatch(trScope);
    expect(JSON.stringify(editor.getJSON())).toContain('EDITED_SCOPE_TASK');

    editor.destroy();
  });

  it('allows editing rights and legal blocks once unlocked', () => {
    const editor = createEditor(representativeHourlyWithRightsDocument, { unlocked: true });

    let rightsPosition = -1;
    let legalPosition = -1;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'legalBlock' && node.attrs?.['data-block-type'] === 'rights') {
        rightsPosition = pos + 2;
      }
      if (node.type.name === 'legalBlock' && node.attrs?.['data-block-type'] === 'legal') {
        legalPosition = pos + 2;
      }
    });

    expect(rightsPosition).toBeGreaterThan(0);
    expect(legalPosition).toBeGreaterThan(0);

    const trRights = editor.state.tr.insertText('UNLOCKED_RIGHTS_EDIT ', rightsPosition);
    editor.view.dispatch(trRights);
    expect(JSON.stringify(editor.getJSON())).toContain('UNLOCKED_RIGHTS_EDIT');

    const trLegal = editor.state.tr.insertText('UNLOCKED_LEGAL_EDIT ', legalPosition);
    editor.view.dispatch(trLegal);
    expect(JSON.stringify(editor.getJSON())).toContain('UNLOCKED_LEGAL_EDIT');

    editor.destroy();
  });

  it('renders matching block types and classes in extension renderHTML specs', () => {
    const rightsRender = LegalBlockExtension.config.renderHTML?.call(
      { options: { unlocked: false, HTMLAttributes: {} } } as any,
      { HTMLAttributes: { 'data-block-type': 'rights' } } as any
    ) as any;
    expect(rightsRender?.[0]).toBe('section');
    expect(rightsRender?.[1]?.['data-block-type']).toBe('rights');
    expect(rightsRender?.[1]?.class).toContain('qtr-legal-locked');

    const legalRender = LegalBlockExtension.config.renderHTML?.call(
      { options: { unlocked: true, HTMLAttributes: {} } } as any,
      { HTMLAttributes: { 'data-block-type': 'legal' } } as any
    ) as any;
    expect(legalRender?.[0]).toBe('section');
    expect(legalRender?.[1]?.['data-block-type']).toBe('legal');
    expect(legalRender?.[1]?.class).toContain('qtr-legal-unlocked');
  });
});
