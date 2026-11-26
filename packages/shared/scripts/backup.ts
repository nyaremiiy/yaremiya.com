/** `pnpm db:backup` — резервна копія бази. */

import { errorText } from "./env";
import { backupDatabase } from "./backup-lib";

try {
  const file = await backupDatabase();
  console.log(`✓ Резервну копію збережено: ${file}`);
} catch (err) {
  console.error(`✗ ${errorText(err)}`);
  process.exit(1);
}
