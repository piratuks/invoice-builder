import { Font } from '@react-pdf/renderer';
import { fileURLToPath } from 'node:url';

const register = (family: string, file: string, fontWeight: number, fontStyle?: 'italic') => {
  Font.register({
    family,
    src: fileURLToPath(new URL(file, import.meta.url)),
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

for (const [name, weight, style] of weights) {
  register('Roboto', `../../assets/roboto/Roboto-${name}.ttf`, weight, style);
}
for (const size of ['18pt', '24pt', '28pt']) {
  for (const [name, weight, style] of weights) {
    register('Inter', `../../assets/inter/Inter_${size}-${name}.ttf`, weight, style);
  }
}
