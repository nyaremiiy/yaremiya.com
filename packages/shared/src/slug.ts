/**
 * Адреса рослини на сайті з назви: «Лаванда вузьколиста Хідкот» → `lavanda-vuzkolysta-khidkot`.
 * Транслітерація — за офіційними правилами (постанова КМУ № 55, 2010).
 */

const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z",
  и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", "’": "", "ʼ": "",
};

/** На початку слова: є → ye, ї → yi, й → y, ю → yu, я → ya. */
const START: Record<string, string> = { є: "ye", ї: "yi", й: "y", ю: "yu", я: "ya" };

export function slugify(input: string): string {
  const text = input.toLowerCase().replace(/зг/g, "zgh");
  let out = "";
  let wordStart = true;
  for (const ch of text) {
    const isLetter = /\p{L}/u.test(ch);
    if (wordStart && START[ch]) out += START[ch];
    else if (ch in MAP) out += MAP[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else out += "-";
    wordStart = !isLetter && !["'", "’", "ʼ"].includes(ch);
  }
  return out.replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
