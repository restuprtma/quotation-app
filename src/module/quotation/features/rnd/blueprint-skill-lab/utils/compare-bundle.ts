import type { RoundTripDiff, BlueprintBundle, RoundTripResult } from '../types';

// ----------------------------------------------------------------------

function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}

export function deepCompare(obj1: unknown, obj2: unknown, currentPath = ''): RoundTripDiff[] {
  const diffs: RoundTripDiff[] = [];

  if (obj1 === obj2) {
    return diffs;
  }

  if (typeof obj1 !== typeof obj2) {
    diffs.push({
      path: currentPath || 'root',
      expected: obj1,
      actual: obj2,
    });
    return diffs;
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      diffs.push({
        path: `${currentPath}.length`,
        expected: obj1.length,
        actual: obj2.length,
      });
    }

    const maxLen = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLen; i += 1) {
      const itemPath = currentPath ? `${currentPath}[${i}]` : `[${i}]`;
      if (i >= obj1.length || i >= obj2.length) {
        diffs.push({
          path: itemPath,
          expected: obj1[i],
          actual: obj2[i],
        });
      } else {
        diffs.push(...deepCompare(obj1[i], obj2[i], itemPath));
      }
    }
    return diffs;
  }

  if (isObject(obj1) && isObject(obj2)) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = Array.from(new Set([...keys1, ...keys2]));

    for (const key of allKeys) {
      const propPath = currentPath ? `${currentPath}.${key}` : key;
      if (!(key in obj1) || !(key in obj2)) {
        diffs.push({
          path: propPath,
          expected: obj1[key],
          actual: obj2[key],
        });
      } else {
        diffs.push(...deepCompare(obj1[key], obj2[key], propPath));
      }
    }
    return diffs;
  }

  if (obj1 !== obj2) {
    diffs.push({
      path: currentPath || 'root',
      expected: obj1,
      actual: obj2,
    });
  }

  return diffs;
}

export function executeRoundTripTest(bundle: BlueprintBundle): RoundTripResult {
  try {
    const serializedJson = JSON.stringify(bundle, null, 2);
    const parsedBundle = JSON.parse(serializedJson) as BlueprintBundle;
    const diffs = deepCompare(bundle, parsedBundle);

    return {
      isMatch: diffs.length === 0,
      serializedJson,
      parsedBundle,
      diffs,
    };
  } catch (error) {
    return {
      isMatch: false,
      serializedJson: '',
      parsedBundle: null,
      diffs: [
        {
          path: 'json_serialization',
          expected: 'Valid JSON stringify/parse',
          actual: String(error),
        },
      ],
    };
  }
}
