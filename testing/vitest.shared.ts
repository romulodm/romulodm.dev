import path from "node:path";
import { fileURLToPath } from "node:url";

const testingDir = path.dirname(fileURLToPath(import.meta.url));

export const workspaceRoot = path.resolve(testingDir, "..");

export const vitestAlias = {
  "@": path.resolve(workspaceRoot, "portfolio"),
  "@romulo/database": path.resolve(workspaceRoot, "packages/database/index.ts"),
  "@romulo/queues": path.resolve(workspaceRoot, "packages/queues/index.ts"),
};

export const activeSurfaceRoots = [
  "portfolio",
  "worker",
  "packages/database",
  "packages/queues",
];
