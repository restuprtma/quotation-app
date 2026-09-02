import type { RectStub } from './table-grip-geometry';

import { it, expect, describe } from 'vitest';

import { calculateTableGripPositions } from './table-grip-geometry';

describe('calculateTableGripPositions', () => {
  const containerRect: RectStub = { left: 50, top: 20, width: 800, height: 600 };
  const tableRect: RectStub = { left: 100, top: 50, width: 300, height: 200 };

  const colRects: RectStub[] = [
    { left: 100, top: 50, width: 100, height: 200 },
    { left: 200, top: 50, width: 200, height: 200 },
  ];

  const rowRects: RectStub[] = [
    { left: 100, top: 50, width: 300, height: 40 },
    { left: 100, top: 90, width: 300, height: 60 },
    { left: 100, top: 150, width: 300, height: 100 },
  ];

  it('returns empty array when tableRect is null or undefined', () => {
    expect(
      calculateTableGripPositions({ containerRect, tableRect: null, colRects, rowRects })
    ).toEqual([]);
    expect(
      calculateTableGripPositions({ containerRect, tableRect: undefined, colRects, rowRects })
    ).toEqual([]);
  });

  it('returns empty array when rowRects or colRects is missing or empty', () => {
    expect(
      calculateTableGripPositions({ containerRect, tableRect, colRects: [], rowRects })
    ).toEqual([]);
    expect(
      calculateTableGripPositions({ containerRect, tableRect, colRects, rowRects: [] })
    ).toEqual([]);
    expect(
      calculateTableGripPositions({ containerRect, tableRect, colRects: undefined, rowRects })
    ).toEqual([]);
    expect(
      calculateTableGripPositions({ containerRect, tableRect, colRects, rowRects: undefined })
    ).toEqual([]);
  });

  it('calculates column add grips at column boundaries (0..N)', () => {
    const grips = calculateTableGripPositions({ containerRect, tableRect, colRects, rowRects });
    const colAddGrips = grips.filter((g) => g.type === 'column' && g.action === 'add');

    expect(colAddGrips).toHaveLength(3);

    // Index 0: left edge of col 0 (100 - 50 = 50)
    expect(colAddGrips[0]).toEqual({
      index: 0,
      type: 'column',
      action: 'add',
      x: 50,
      y: 30, // table top 50 - container top 20
    });

    // Index 1: left edge of col 1 (200 - 50 = 150)
    expect(colAddGrips[1]).toEqual({
      index: 1,
      type: 'column',
      action: 'add',
      x: 150,
      y: 30,
    });

    // Index 2: right edge of col 1 (200 + 200 - 50 = 350)
    expect(colAddGrips[2]).toEqual({
      index: 2,
      type: 'column',
      action: 'add',
      x: 350,
      y: 30,
    });
  });

  it('calculates column delete grips centered on each column (0..N-1)', () => {
    const grips = calculateTableGripPositions({ containerRect, tableRect, colRects, rowRects });
    const colDeleteGrips = grips.filter((g) => g.type === 'column' && g.action === 'delete');

    expect(colDeleteGrips).toHaveLength(2);

    // Index 0: center of col 0 (100 + 100/2 - 50 = 100)
    expect(colDeleteGrips[0]).toEqual({
      index: 0,
      type: 'column',
      action: 'delete',
      x: 100,
      y: 30,
    });

    // Index 1: center of col 1 (200 + 200/2 - 50 = 250)
    expect(colDeleteGrips[1]).toEqual({
      index: 1,
      type: 'column',
      action: 'delete',
      x: 250,
      y: 30,
    });
  });

  it('calculates row add grips at row boundaries (0..M)', () => {
    const grips = calculateTableGripPositions({ containerRect, tableRect, colRects, rowRects });
    const rowAddGrips = grips.filter((g) => g.type === 'row' && g.action === 'add');

    expect(rowAddGrips).toHaveLength(4);

    // Index 0: top edge of row 0 (50 - 20 = 30)
    expect(rowAddGrips[0]).toEqual({
      index: 0,
      type: 'row',
      action: 'add',
      x: 50, // table left 100 - container left 50
      y: 30,
    });

    // Index 1: top edge of row 1 (90 - 20 = 70)
    expect(rowAddGrips[1]).toEqual({
      index: 1,
      type: 'row',
      action: 'add',
      x: 50,
      y: 70,
    });

    // Index 2: top edge of row 2 (150 - 20 = 130)
    expect(rowAddGrips[2]).toEqual({
      index: 2,
      type: 'row',
      action: 'add',
      x: 50,
      y: 130,
    });

    // Index 3: bottom edge of row 2 (150 + 100 - 20 = 230)
    expect(rowAddGrips[3]).toEqual({
      index: 3,
      type: 'row',
      action: 'add',
      x: 50,
      y: 230,
    });
  });

  it('calculates row delete grips centered on each row (0..M-1)', () => {
    const grips = calculateTableGripPositions({ containerRect, tableRect, colRects, rowRects });
    const rowDeleteGrips = grips.filter((g) => g.type === 'row' && g.action === 'delete');

    expect(rowDeleteGrips).toHaveLength(3);

    // Index 0: center of row 0 (50 + 40/2 - 20 = 50)
    expect(rowDeleteGrips[0]).toEqual({
      index: 0,
      type: 'row',
      action: 'delete',
      x: 50,
      y: 50,
    });

    // Index 1: center of row 1 (90 + 60/2 - 20 = 100)
    expect(rowDeleteGrips[1]).toEqual({
      index: 1,
      type: 'row',
      action: 'delete',
      x: 50,
      y: 100,
    });

    // Index 2: center of row 2 (150 + 100/2 - 20 = 180)
    expect(rowDeleteGrips[2]).toEqual({
      index: 2,
      type: 'row',
      action: 'delete',
      x: 50,
      y: 180,
    });
  });

  it('handles default containerRect when omitted (relative to viewport)', () => {
    const grips = calculateTableGripPositions({ tableRect, colRects, rowRects });
    const colAddGrips = grips.filter((g) => g.type === 'column' && g.action === 'add');

    expect(colAddGrips[0]).toEqual({
      index: 0,
      type: 'column',
      action: 'add',
      x: 100,
      y: 50,
    });
  });

  it('handles a 1x1 table correctly', () => {
    const singleTable: RectStub = { left: 10, top: 10, width: 100, height: 50 };
    const singleCol: RectStub[] = [{ left: 10, top: 10, width: 100, height: 50 }];
    const singleRow: RectStub[] = [{ left: 10, top: 10, width: 100, height: 50 }];

    const grips = calculateTableGripPositions({
      tableRect: singleTable,
      colRects: singleCol,
      rowRects: singleRow,
    });

    expect(grips).toHaveLength(6); // 2 col adds, 1 col del, 2 row adds, 1 row del
    expect(grips.filter((g) => g.type === 'column' && g.action === 'add')).toHaveLength(2);
    expect(grips.filter((g) => g.type === 'column' && g.action === 'delete')).toHaveLength(1);
    expect(grips.filter((g) => g.type === 'row' && g.action === 'add')).toHaveLength(2);
    expect(grips.filter((g) => g.type === 'row' && g.action === 'delete')).toHaveLength(1);
  });
});
