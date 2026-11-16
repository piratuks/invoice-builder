const fontAssets = import.meta.glob('../../assets/**/*.ttf', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;

const register = (
  Font: typeof import('@react-pdf/renderer').Font,
  family: string,
  file: string,
  fontWeight: number,
  fontStyle?: 'italic'
) => {
  const src = fontAssets[`../../assets/${file}`];
  if (!src) throw new Error(`Missing packaged PDF font: ${file}`);
  Font.register({
    family,
    src,
    fontWeight,
    ...(fontStyle ? { fontStyle } : {})
  });
};

const weights = [
  ['Regular', 400, undefined],
  ['Medium', 500, undefined],
  ['SemiBold', 600, undefined],
  ['Bold', 700, undefined],
  ['Italic', 400, 'italic'],
  ['MediumItalic', 500, 'italic'],
  ['SemiBoldItalic', 600, 'italic'],
  ['BoldItalic', 700, 'italic']
] as const;

// Dynamic loading lets component-only consumers and test renderer doubles import the
// document without triggering the runtime registration module.
if (import.meta.env.MODE !== 'test') {
  const { Font } = await import('@react-pdf/renderer');
  for (const [name, weight, style] of weights) {
    register(Font, 'Roboto', `roboto/Roboto-${name}.ttf`, weight, style);
  }
  for (const size of ['18pt', '24pt', '28pt']) {
    for (const [name, weight, style] of weights) {
      register(Font, 'Inter', `inter/Inter_${size}-${name}.ttf`, weight, style);
    }
  }
}
