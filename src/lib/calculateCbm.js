function round6(value) {
  if (!Number.isFinite(value)) return '';
  return Number(value.toFixed(6));
}

function toCbmNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const normalized = String(value).trim().replace(/,/g, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function calculateCbm(length, width, height, cartonCount) {
  const lengthNumber = toCbmNumber(length) ?? 0;
  const widthNumber = toCbmNumber(width) ?? 0;
  const heightNumber = toCbmNumber(height) ?? 0;
  const cartonCountNumber = toCbmNumber(cartonCount) ?? 0;
  const unitCbm = (lengthNumber * widthNumber * heightNumber) / 1000000;
  const totalCbm = unitCbm * cartonCountNumber;

  return {
    unitCbm: round6(unitCbm),
    totalCbm: round6(totalCbm)
  };
}
