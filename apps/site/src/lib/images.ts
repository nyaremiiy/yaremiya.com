import type { ImageMetadata } from 'astro';

// Фото лежать у src/assets/images, щоб Astro стискав їх у WebP/AVIF.
// У plants.json шлях записано як "/images/plants/....jpg" — тут він перетворюється на файл.
const files = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/images/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

export function assetImage(path: string): ImageMetadata {
  const key = `../assets${path.startsWith('/') ? path : `/${path}`}`;
  const file = files[key];
  if (!file) throw new Error(`Фото не знайдено: ${path} (очікується у src/assets${path})`);
  return file.default;
}
