const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'vendor');
fs.mkdirSync(target, { recursive: true });
for (const [source, destination] of [
  ['three/build/three.min.js', 'three.min.js'],
  ['three/examples/js/controls/OrbitControls.js', 'OrbitControls.js'],
  ['three/LICENSE', 'three-LICENSE.txt'],
  ['katex/dist/katex.min.js', 'katex.min.js'],
  ['katex/dist/katex.min.css', 'katex.min.css'],
  ['katex/LICENSE', 'katex-LICENSE.txt'],
]) fs.copyFileSync(path.join(root, 'node_modules', source), path.join(target, destination));
fs.cpSync(path.join(root, 'node_modules/katex/dist/fonts'), path.join(target, 'fonts'), { recursive: true });
console.log('已复制固定版本的浏览器依赖和许可证。');
