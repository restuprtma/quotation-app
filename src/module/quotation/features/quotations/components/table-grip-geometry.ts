export type RectStub = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type GripType = 'row' | 'column';
export type GripAction = 'add' | 'delete';

export type GripItem = {
  index: number;
  type: GripType;
  action: GripAction;
  x: number; // left in px
  y: number; // top in px
};

export interface CalculateGripPositionsParams {
  containerRect?: RectStub | null;
  tableRect?: RectStub | null;
  rowRects?: RectStub[];
  colRects?: RectStub[];
}

/**
 * Calculates row and column grip button positions (X, Y) relative to the container.
 *
 * For columns (N columns):
 * - Add grips (N + 1): index 0..N placed at column boundaries along the top edge.
 * - Delete grips (N): index 0..N-1 placed centered over each column along the top edge.
 *
 * For rows (M rows):
 * - Add grips (M + 1): index 0..M placed at row boundaries along the left edge.
 * - Delete grips (M): index 0..M-1 placed centered over each row along the left edge.
 */
export function calculateTableGripPositions({
  containerRect,
  tableRect,
  rowRects,
  colRects,
}: CalculateGripPositionsParams): GripItem[] {
  if (!tableRect || !rowRects || !colRects || rowRects.length === 0 || colRects.length === 0) {
    return [];
  }

  const containerLeft = containerRect?.left ?? 0;
  const containerTop = containerRect?.top ?? 0;

  const grips: GripItem[] = [];

  const numCols = colRects.length;
  const numRows = rowRects.length;

  const tableTop = tableRect.top - containerTop;
  const tableLeft = tableRect.left - containerLeft;

  // 1. Column Add grips: 0..N
  for (let i = 0; i <= numCols; i += 1) {
    let colX: number;
    if (i === 0) {
      colX = colRects[0].left - containerLeft;
    } else if (i === numCols) {
      colX = colRects[numCols - 1].left + colRects[numCols - 1].width - containerLeft;
    } else {
      colX = colRects[i].left - containerLeft;
    }

    grips.push({
      index: i,
      type: 'column',
      action: 'add',
      x: colX,
      y: tableTop,
    });
  }

  // 2. Column Delete grips: 0..N-1
  for (let i = 0; i < numCols; i += 1) {
    const colX = colRects[i].left + colRects[i].width / 2 - containerLeft;
    grips.push({
      index: i,
      type: 'column',
      action: 'delete',
      x: colX,
      y: tableTop,
    });
  }

  // 3. Row Add grips: 0..M
  for (let j = 0; j <= numRows; j += 1) {
    let rowY: number;
    if (j === 0) {
      rowY = rowRects[0].top - containerTop;
    } else if (j === numRows) {
      rowY = rowRects[numRows - 1].top + rowRects[numRows - 1].height - containerTop;
    } else {
      rowY = rowRects[j].top - containerTop;
    }

    grips.push({
      index: j,
      type: 'row',
      action: 'add',
      x: tableLeft,
      y: rowY,
    });
  }

  // 4. Row Delete grips: 0..M-1
  for (let j = 0; j < numRows; j += 1) {
    const rowY = rowRects[j].top + rowRects[j].height / 2 - containerTop;
    grips.push({
      index: j,
      type: 'row',
      action: 'delete',
      x: tableLeft,
      y: rowY,
    });
  }

  return grips;
}
