const fs = require("fs");
const path = require("path");

const rootDir = "./src";

let output = "# Solar Roof POC Codebase\n\n";

function walk(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
    } else {
      const code = fs.readFileSync(fullPath, "utf8");

      output += `# FILE: ${fullPath}\n\n`;
      output += "```js\n";
      output += code;
      output += "\n```\n\n";
    }
  });
}

walk(rootDir);

fs.writeFileSync("PROJECT_CODEBASE.md", output);

console.log("Generated PROJECT_CODEBASE.md");