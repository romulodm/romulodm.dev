// scripts/hash-ops-password.ts
//
// Run once to generate the operational password hash.
// Copy the output to BACKUP_OPS_PASSWORD_HASH in your production .env.
//
// Usage:
//   npx tsx scripts/hash-ops-password.ts "your_strong_password_here"

import bcrypt from "bcryptjs";

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error("Usage: tsx scripts/hash-ops-password.ts <password>");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("Password must be at least 12 characters long.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  console.log("\nHash generated. Add it to your .env:");
  console.log(`\nBACKUP_OPS_PASSWORD_HASH='${hash}'\n`);
  console.log(
    "⚠️  NEVER commit your .env file with this hash. Use environment variables only.",
  );
}

main().catch(console.error);