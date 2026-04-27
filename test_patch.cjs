const fs = require("fs");
const p = "C:/Users/Anatole/Desktop/code/easy-gym-notebook/patch_spec.cjs";
const c = fs.readFileSync(p, "utf8");
console.log("len:", c.length);
