#!/usr/bin/env bun

const args = process.argv.slice(2);
const command = args[0];
const subArgs = args.slice(1);

const commands = {
  dev: () => import("./commands/dev.js"),
  create: () => import("./commands/create.js"),
  build: () => import("./commands/build.js"),
  "make:model": () => import("./commands/make.js"),
  "make:controller": () => import("./commands/make.js"),
  "make:resource": () => import("./commands/make.js"),
  add: () => import("./commands/add.js"),
};

if (!command || command === "--help" || command === "-h") {
  console.log(`
🔥 Pyrex Framework CLI

Usage:
  pyrex <command> [options]

Commands:
  dev                    Start dev server (JS + Python both!)
  create <name>          Create new Pyrex project
  build                  Production build
  make:model <name>      Generate model
  make:controller <name> Generate controller
  make:resource <name>   Generate model + controller + routes
  add <package>          Add npm or pip package

Examples:
  pyrex dev
  pyrex create my-app
  pyrex make:resource Product
  pyrex add axios
  pyrex add pandas
  `);
  process.exit(0);
}

if (!commands[command]) {
  console.error(`❌ Unknown command: "${command}"`);
  console.log('Run "pyrex --help" for available commands');
  process.exit(1);
}

// Command run பண்ணு
const mod = await commands[command]();
await mod.default(subArgs);