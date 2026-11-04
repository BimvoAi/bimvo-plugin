#!/usr/bin/env node
// Confere o plugin contra o big-bang (fonte das skills) e os dois manifests entre si.
// Uso: node scripts/check-sync.mjs <pasta do big-bang>
// Falha quando uma skill daqui difere da de big-bang/skills, quando falta ou sobra skill, ou quando
// a versão do plugin do Claude Code e a do Codex divergem.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const bigBang = process.argv[2];
if (!bigBang || !existsSync(join(bigBang, 'skills'))) {
  console.error('Uso: node scripts/check-sync.mjs <pasta do big-bang>');
  process.exit(2);
}
const here = join(import.meta.dirname, '..');
const pluginSkills = join(here, 'plugin', 'skills');
const sourceSkills = join(bigBang, 'skills');
const IGNORED = /(^|[\\/])(node_modules|dist|\.DS_Store)([\\/]|$)|\.zip$/;

function files(root, dir = root) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    const rel = relative(root, path);
    if (IGNORED.test(rel)) return [];
    return statSync(path).isDirectory() ? files(root, path) : [rel];
  });
}

const skillsOf = (dir) =>
  readdirSync(dir)
    .filter((name) => existsSync(join(dir, name, 'SKILL.md')))
    .sort();

const problems = [];
const ours = skillsOf(pluginSkills);
const theirs = skillsOf(sourceSkills);
for (const name of theirs.filter((skill) => !ours.includes(skill))) {
  problems.push(`skill ${name} existe no big-bang e falta aqui`);
}
for (const name of ours.filter((skill) => !theirs.includes(skill))) {
  problems.push(`skill ${name} existe aqui e não no big-bang`);
}
for (const name of ours.filter((skill) => theirs.includes(skill))) {
  const a = join(pluginSkills, name);
  const b = join(sourceSkills, name);
  const all = new Set([...files(a), ...files(b)]);
  for (const rel of [...all].sort()) {
    const left = join(a, rel);
    const right = join(b, rel);
    if (!existsSync(left)) problems.push(`${name}/${rel}: falta aqui`);
    else if (!existsSync(right)) problems.push(`${name}/${rel}: sobra aqui`);
    else if (!readFileSync(left).equals(readFileSync(right))) {
      problems.push(`${name}/${rel}: diferente do big-bang`);
    }
  }
}

const version = (path) => JSON.parse(readFileSync(join(here, path), 'utf8')).version;
const claude = version('plugin/.claude-plugin/plugin.json');
const codex = version('plugin/.codex-plugin/plugin.json');
if (claude !== codex) {
  problems.push(`versão do plugin diferente: Claude Code ${claude}, Codex ${codex}`);
}

if (problems.length > 0) {
  console.error(problems.map((problem) => `- ${problem}`).join('\n'));
  console.error(
    '\nCopie as skills de big-bang/skills para plugin/skills e suba a versão nos dois manifests.',
  );
  process.exit(1);
}
console.log(`Plugin ${claude} igual às skills do big-bang (${ours.length} skills).`);
