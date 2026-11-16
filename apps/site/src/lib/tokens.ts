// Перетворює дизайн-токени з design/tokens.json на CSS-змінні (--color-forest, --space-6, ...).
// Так кольори й відступи бренду живуть в одному файлі для сайту й майбутньої CRM.
import tokens from '../../../../design/tokens.json';

export function tokensToCss(): string {
  const vars: string[] = [];
  for (const t of tokens.color.tokens) vars.push(`--color-${t.name}: ${t.value.light};`);
  for (const t of tokens.spacing.tokens) vars.push(`--${t.name}: ${t.value};`);
  for (const t of tokens.radius.tokens) vars.push(`--${t.name}: ${t.value};`);
  for (const t of tokens.shadow.tokens) vars.push(`--${t.name}: ${t.value};`);
  vars.push(`--font-sans: ${tokens.type.families.sans};`);
  return `:root{${vars.join('')}}`;
}
