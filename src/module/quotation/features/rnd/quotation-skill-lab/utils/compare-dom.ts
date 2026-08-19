import type { OperationId, InvariantResult, RoundTripReport, RoundTripScenarioId } from '../types';

import { ROUND_TRIP_FIXTURES } from '../fixtures/round-trip-fixtures';

type NormalizedNode = {
  tag: string;
  attributes: Array<[string, string]>;
  text?: string;
  children: NormalizedNode[];
};

type TableCell = {
  tag: string;
  text: string;
  colspan: number;
  rowspan: number;
};

const ALLOWED_ELEMENTS = new Set([
  'section',
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'a',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]);

const SECTION_ATTRIBUTES = new Set(['data-block-type', 'data-template-code', 'data-modified']);
const CELL_ATTRIBUTES = new Set(['colspan', 'rowspan']);
const URL_BASE = 'https://quotation.invalid/';

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeURL(value: string): string | null {
  try {
    const url = new URL(value, URL_BASE);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return null;

    return url.href;
  } catch {
    return null;
  }
}

function normalizeAttribute(element: Element, name: string, value: string): string {
  if (element.tagName.toLowerCase() === 'a' && name === 'href') {
    return normalizeURL(value) ?? value;
  }

  return value;
}

function directText(element: Element): string {
  return normalizeWhitespace(
    Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent ?? '')
      .join(' ')
  );
}

function projectElement(element: Element): NormalizedNode {
  const text = directText(element);
  const attributes = Array.from(element.attributes)
    .map(
      ({ name, value }) =>
        [name.toLowerCase(), normalizeAttribute(element, name.toLowerCase(), value)] as [
          string,
          string,
        ]
    )
    .sort(([left], [right]) => left.localeCompare(right));

  return {
    tag: element.tagName.toLowerCase(),
    attributes,
    ...(text ? { text } : {}),
    children: Array.from(element.children).map(projectElement),
  };
}

function parseHTML(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

function projectFragment(fragment: DocumentFragment): NormalizedNode[] {
  return Array.from(fragment.children).map(projectElement);
}

function serialize(value: unknown): string {
  return JSON.stringify(value);
}

function same(left: unknown, right: unknown): boolean {
  return serialize(left) === serialize(right);
}

function textProjection(fragment: DocumentFragment): string[] {
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
  const text: string[] = [];

  while (walker.nextNode()) {
    const value = normalizeWhitespace(walker.currentNode.textContent ?? '');
    if (value) text.push(value);
  }

  return text;
}

function sectionMarkers(fragment: DocumentFragment): Array<Array<[string, string]>> {
  return Array.from(fragment.querySelectorAll('section')).map((section) =>
    ['data-block-type', 'data-template-code', 'data-modified']
      .filter((name) => section.hasAttribute(name))
      .map((name) => [name, section.getAttribute(name) ?? ''])
  );
}

function headings(fragment: DocumentFragment): Array<[string, string]> {
  return Array.from(fragment.querySelectorAll('h1, h2, h3')).map((heading) => [
    heading.tagName.toLowerCase(),
    normalizeWhitespace(heading.textContent ?? ''),
  ]);
}

function lists(fragment: DocumentFragment) {
  return Array.from(fragment.querySelectorAll('ul, ol')).map((list) => ({
    tag: list.tagName.toLowerCase(),
    items: Array.from(list.children)
      .filter((item) => item.tagName.toLowerCase() === 'li')
      .map((item) => normalizeWhitespace(item.textContent ?? '')),
  }));
}

function tableRows(fragment: DocumentFragment): TableCell[][][] {
  return Array.from(fragment.querySelectorAll('table')).map((table) =>
    Array.from(table.querySelectorAll('tr')).map((row) =>
      Array.from(row.children)
        .filter((cell) => ['th', 'td'].includes(cell.tagName.toLowerCase()))
        .map((cell) => ({
          tag: cell.tagName.toLowerCase(),
          text: normalizeWhitespace(cell.textContent ?? ''),
          colspan: Number(cell.getAttribute('colspan') ?? 1),
          rowspan: Number(cell.getAttribute('rowspan') ?? 1),
        }))
    )
  );
}

function tableDimensions(tables: TableCell[][][]) {
  return tables.map((rows) => rows.map((cells) => cells.map(({ tag, text }) => ({ tag, text }))));
}

function tableSpans(tables: TableCell[][][]) {
  return tables.map((rows) =>
    rows.map((cells) => cells.map(({ colspan, rowspan }) => ({ colspan, rowspan })))
  );
}

function links(fragment: DocumentFragment) {
  return Array.from(fragment.querySelectorAll('a')).map((link) => ({
    href: normalizeURL(link.getAttribute('href') ?? ''),
    text: normalizeWhitespace(link.textContent ?? ''),
  }));
}

function forbiddenElements(fragment: DocumentFragment): string[] {
  return Array.from(fragment.querySelectorAll('*'))
    .map((element) => element.tagName.toLowerCase())
    .filter((tag) => !ALLOWED_ELEMENTS.has(tag));
}

function isAllowedAttribute(element: Element, name: string): boolean {
  const tag = element.tagName.toLowerCase();
  if (tag === 'section') return SECTION_ATTRIBUTES.has(name);
  if (tag === 'a') return name === 'href';
  if (tag === 'td' || tag === 'th') return CELL_ATTRIBUTES.has(name);
  return false;
}

function forbiddenAttributes(fragment: DocumentFragment): string[] {
  return Array.from(fragment.querySelectorAll('*')).flatMap((element) =>
    Array.from(element.attributes)
      .map((attribute) => attribute.name.toLowerCase())
      .filter((name) => !isAllowedAttribute(element, name))
      .map((name) => `${element.tagName.toLowerCase()}[${name}]`)
  );
}

function result(id: string, passed: boolean, detail?: string): InvariantResult {
  return { id, labelKey: `report.invariants.${id}`, passed, ...(detail ? { detail } : {}) };
}

export function compareRoundTrip(
  scenario: RoundTripScenarioId,
  sourceHTML: string,
  recreatedHTML: string,
  operations: Record<OperationId, boolean>
): RoundTripReport {
  const source = parseHTML(sourceHTML);
  const recreated = parseHTML(recreatedHTML);
  const sourceProjection = projectFragment(source);
  const recreatedProjection = projectFragment(recreated);
  const sourceTables = tableRows(source);
  const recreatedTables = tableRows(recreated);
  const sourceLinks = links(source);
  const recreatedLinks = links(recreated);
  const sourceLegal = source.querySelector('section[data-block-type="legal"]');
  const recreatedLegal = recreated.querySelector('section[data-block-type="legal"]');
  const requiredOperations = ROUND_TRIP_FIXTURES[scenario].requiredOperations;
  const incompleteOperations = requiredOperations.filter((operation) => !operations[operation]);
  const sourceForbiddenElements = forbiddenElements(source);
  const recreatedForbiddenElements = forbiddenElements(recreated);
  const sourceForbiddenAttributes = forbiddenAttributes(source);
  const recreatedForbiddenAttributes = forbiddenAttributes(recreated);
  const normalizedLinksValid = [...sourceLinks, ...recreatedLinks].every(
    (link) => link.href !== null
  );
  const invariants: InvariantResult[] = [
    result(
      'required_operations',
      incompleteOperations.length === 0,
      incompleteOperations.length ? incompleteOperations.join(', ') : undefined
    ),
    result(
      'section_order_and_count',
      same(
        Array.from(source.querySelectorAll('section')).map((section) =>
          section.getAttribute('data-block-type')
        ),
        Array.from(recreated.querySelectorAll('section')).map((section) =>
          section.getAttribute('data-block-type')
        )
      )
    ),
    result('element_hierarchy', same(sourceProjection, recreatedProjection)),
    result('normalized_text', same(textProjection(source), textProjection(recreated))),
  ];

  if (source.querySelector('h1, h2, h3') || recreated.querySelector('h1, h2, h3')) {
    invariants.push(result('heading_levels', same(headings(source), headings(recreated))));
  }

  if (source.querySelector('ul, ol') || recreated.querySelector('ul, ol')) {
    invariants.push(result('list_type_and_order', same(lists(source), lists(recreated))));
  }

  if (sourceTables.length || recreatedTables.length) {
    invariants.push(
      result(
        'table_dimensions_and_cell_order',
        same(tableDimensions(sourceTables), tableDimensions(recreatedTables))
      ),
      result('table_spans', same(tableSpans(sourceTables), tableSpans(recreatedTables)))
    );
  }

  invariants.push(
    result('allowed_links', normalizedLinksValid && same(sourceLinks, recreatedLinks)),
    result('section_markers', same(sectionMarkers(source), sectionMarkers(recreated)))
  );

  if (sourceLegal || recreatedLegal) {
    const legalProjectionMatches =
      sourceLegal !== null &&
      recreatedLegal !== null &&
      same(projectElement(sourceLegal), projectElement(recreatedLegal));
    const restoredCandidateState =
      scenario !== 'legal' ||
      (sourceLegal?.getAttribute('data-template-code') === 'quotation-legal-v1' &&
        sourceLegal.getAttribute('data-modified') === 'false' &&
        recreatedLegal?.getAttribute('data-template-code') === 'quotation-legal-v1' &&
        recreatedLegal.getAttribute('data-modified') === 'false');

    invariants.push(result('legal_state', legalProjectionMatches && restoredCandidateState));
  }

  invariants.push(
    result(
      'forbidden_elements',
      sourceForbiddenElements.length === 0 && recreatedForbiddenElements.length === 0,
      [...sourceForbiddenElements, ...recreatedForbiddenElements].join(', ') || undefined
    ),
    result(
      'forbidden_attributes',
      sourceForbiddenAttributes.length === 0 && recreatedForbiddenAttributes.length === 0,
      [...sourceForbiddenAttributes, ...recreatedForbiddenAttributes].join(', ') || undefined
    )
  );

  return {
    scenario,
    sourceHTML,
    recreatedHTML,
    operations,
    invariants,
    passed: invariants.every((invariant) => invariant.passed),
  };
}
