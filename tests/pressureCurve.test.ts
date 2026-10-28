import { describe, it, expect } from 'vitest';
import { calculatePressureFactor, hexToRgb } from '../src/utils/canvasDraw';

describe('Pressure Curve & Color Calculations', () => {
  it('scales crayon width and opacity dynamically with Lenovo Xiaoxin 4096-level pressure', () => {
    const lightPressure = calculatePressureFactor(0.15, 'crayon');
    const firmPressure = calculatePressureFactor(0.95, 'crayon');

    // Firm pressure must produce wider line and higher opacity than light pressure
    expect(firmPressure.widthFactor).toBeGreaterThan(lightPressure.widthFactor);
    expect(firmPressure.alphaFactor).toBeGreaterThan(lightPressure.alphaFactor);
    expect(firmPressure.alphaFactor).toBeLessThanOrEqual(1.0);
  });

  it('provides wide dynamic width range for Paintbrush tool', () => {
    const light = calculatePressureFactor(0.1, 'brush');
    const firm = calculatePressureFactor(0.9, 'brush');

    expect(firm.widthFactor / light.widthFactor).toBeGreaterThan(2.0);
  });

  it('clamps extreme pressure values safely', () => {
    const zero = calculatePressureFactor(-0.5, 'marker');
    const max = calculatePressureFactor(2.0, 'marker');

    expect(zero.widthFactor).toBeGreaterThan(0);
    expect(max.widthFactor).toBeLessThan(3.0);
  });

  it('correctly converts 3-digit and 6-digit hex colors to RGB', () => {
    expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#FF6B8B')).toEqual({ r: 255, g: 107, b: 139 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('invalid')).toBeNull();
  });
});
