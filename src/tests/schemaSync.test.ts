import { readFileSync } from "fs";
import { join } from "path";
import { TABLES } from "../constants/database";
import { describe, it, expect } from "vitest";

describe("Database schema vs TABLES constant", () => {
  // Load and parse schema2.sql
  const sql = readFileSync(join(__dirname, "../db/schema2.sql"), "utf-8");

  // Regex to capture all table names in CREATE TABLE IF NOT EXISTS statements
  const tableNames = Array.from(
    sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+([a-zA-Z0-9_]+)\s*\(/g),
    (m) => m[1]
  );

  const snapshotTables = new Set<string>(tableNames);
  const codeTables = new Set<string>(Object.values(TABLES));

  it("has the same number of tables", () => {
    console.log("\n=== SCHEMA SYNC VALIDATION ===");
    console.log(`📊 Schema2.sql tables: ${snapshotTables.size}`);
    console.log(`📊 TABLES constant: ${codeTables.size}`);

    if (snapshotTables.size !== codeTables.size) {
      console.log("\n❌ Table count mismatch detected!");
      console.log("Schema tables:", Array.from(snapshotTables).sort());
      console.log("TABLES constant:", Array.from(codeTables).sort());
    }

    expect(codeTables.size).toBe(snapshotTables.size);
  });

  it("TABLES constant matches snapshot", () => {
    const missingTables: string[] = [];

    for (const tbl of codeTables) {
      if (!snapshotTables.has(tbl)) {
        missingTables.push(tbl);
      }
    }

    if (missingTables.length > 0) {
      console.log(
        "\n❌ Tables in TABLES constant but missing from schema2.sql:"
      );
      missingTables.forEach((table) => console.log(`   - ${table}`));
    }

    for (const tbl of codeTables) {
      expect(
        snapshotTables.has(tbl),
        `Missing table in schema2.sql: ${tbl}`
      ).toBe(true);
    }
  });

  it("Snapshot has no extra tables", () => {
    const extraTables: string[] = [];

    for (const tbl of snapshotTables) {
      if (!codeTables.has(tbl)) {
        extraTables.push(tbl);
      }
    }

    if (extraTables.length > 0) {
      console.log(
        "\n⚠️  Tables in schema2.sql but missing from TABLES constant:"
      );
      extraTables.forEach((table) => console.log(`   - ${table}`));
      console.log(
        "💡 Consider adding these to TABLES constant if they should be accessible from code"
      );
    }

    for (const tbl of snapshotTables) {
      expect(
        codeTables.has(tbl),
        `Extra table in schema2.sql not in TABLES: ${tbl}`
      ).toBe(true);
    }
  });

  it("provides detailed sync report", () => {
    console.log("\n=== DETAILED SYNC REPORT ===");

    const sortedSchema = Array.from(snapshotTables).sort();
    const sortedTables = Array.from(codeTables).sort();

    console.log("\n📋 All schema2.sql tables:");
    sortedSchema.forEach((table) => {
      const inTables = codeTables.has(table);
      console.log(`   ${inTables ? "✅" : "❌"} ${table}`);
    });

    console.log("\n📋 All TABLES constant values:");
    sortedTables.forEach((table) => {
      const inSchema = snapshotTables.has(table);
      console.log(`   ${inSchema ? "✅" : "❌"} ${table}`);
    });

    console.log("\n🎯 Schema sync validation complete!");
    console.log(
      "💡 This test ensures TABLES constant stays in sync with schema2.sql"
    );
    console.log("🔄 Run this test after any schema changes");
  });
});
