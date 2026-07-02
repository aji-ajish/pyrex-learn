import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

export default async function dev(args) {
  console.log("🔥 Starting Pyrex Dev Server...\n");

  const rootDir = process.cwd();
  const pythonDir = join(rootDir, "python");

  // Python server இருக்கான்னு check பண்ணு
  const hasPython = existsSync(join(pythonDir, "main.py"));

  // ✅ JS Server start பண்ணு
  console.log("⚡ Starting JS Core (Bun.js) on :3000...");
  const jsServer = spawn("bun", ["--watch", "server.js"], {
    cwd: rootDir,
    stdio: "pipe",
    shell: true,
  });

  jsServer.stdout.on("data", (data) => {
    process.stdout.write(`[JS] ${data}`);
  });

  jsServer.stderr.on("data", (data) => {
    process.stderr.write(`[JS] ${data}`);
  });

  // ✅ Python Server start பண்ணு
  if (hasPython) {
    console.log("🐍 Starting Python Security Layer (FastAPI) on :8000...\n");

    const pythonServer = spawn(
      "uv",
      ["run", "uvicorn", "main:app", "--reload", "--port", "8000"],
      {
        cwd: pythonDir,
        stdio: "pipe",
        shell: true,
      }
    );

    pythonServer.stdout.on("data", (data) => {
      process.stdout.write(`[Python] ${data}`);
    });

    pythonServer.stderr.on("data", (data) => {
      process.stderr.write(`[Python] ${data}`);
    });

    pythonServer.on("exit", (code) => {
      console.log(`\n[Python] Server stopped (code: ${code})`);
    });
  } else {
    console.log("⚠️  No python/main.py found — skipping Python server");
  }

  // Ctrl+C — both servers stop பண்ணு
  process.on("SIGINT", () => {
    console.log("\n\n🛑 Stopping Pyrex Dev Server...");
    jsServer.kill();
    process.exit(0);
  });

  jsServer.on("exit", (code) => {
    console.log(`\n[JS] Server stopped (code: ${code})`);
    process.exit(code);
  });
}