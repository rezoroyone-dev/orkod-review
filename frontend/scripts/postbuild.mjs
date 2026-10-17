import fs from "fs";
import path from "path";

const source = path.resolve("dist");
const target = path.resolve("../volumes/sites/phealing");

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

fs.cpSync(source, target, { recursive: true });

console.log("Frontend copied successfully.");
