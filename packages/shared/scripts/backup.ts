/** `pnpm db:backup` — резервна копія бази. */

import "./env";
import { backupDatabase } from "./backup-lib";

try {
  const file = await backupDatabase();
  console.log(`✓ Резервну копію збережено: ${file}`);
} catch (err) {
  console.error(`✗ ${(err as Error).message}`);
  process.exit(1);
}
