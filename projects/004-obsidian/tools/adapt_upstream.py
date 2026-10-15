"""Apply explicit, reproducible hooks to the preserved upstream snapshot (no network)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHANGES = [
    'Local Three.js import map and extension module import',
    'Additional samplers and GPU state branch for four 3-D extension shapes',
    'Frame, camera, focus, quality-switch and HUD integration hooks',
    'Same-origin controls, parameters, state and error reporting bridge',
    'Deterministic 48-second film, GPU dual-target morphs, camera paths and frame export',
    'Offline-context and scheduled-clock hooks in the original audio synthesizer; shared audiovisual score and MP4 export',
]


def adapt_html(root=ROOT):
    html = (root / 'references/upstream-index.html').read_text(encoding='utf-8')
    def replace(before, after):
        nonlocal html
        if html.count(before) != 1:
            raise ValueError('Upstream hook changed: ' + before[:100])
        html = html.replace(before, after)
    replace('https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js', '../three/build/three.module.js')
    replace('https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/', '../three/examples/jsm/')
    replace("import * as THREE from 'three';", "import * as THREE from 'three';\nimport { ExtensionSystem } from '../../assets/extension-system.mjs';\nimport { TourSystem } from '../../assets/tour-system.mjs';\nimport { FilmExporter } from '../../assets/film-exporter.mjs';\nimport { FilmSoundtrack } from '../../assets/film-soundtrack.mjs';")
    replace('const NOMINAL = 36;', 'const Research = new ExtensionSystem(THREE);\nconst Tour = new TourSystem(THREE, Research);\nconst FilmSound = new FilmSoundtrack();\nconst NOMINAL = 36;')
    audio_start = html.index('class AudioEngine {')
    audio_end = html.index('\n/* ===', audio_start)
    original_audio = html[audio_start:audio_end]
    adapted_audio = original_audio.replace('this.ctx.currentTime', 'this.now()').replace('ctx.currentTime', 'this.now()').replace('c.currentTime', 'this.now()')
    adapted_audio = adapted_audio.replace('  init() {', '  now() { return this.scheduleTime ?? this.ctx.currentTime; }\n  init(context = null, destination = null) {')
    adapted_audio = adapted_audio.replace('(this.ctx = new AC())', '(this.ctx = context || new AC())')
    adapted_audio = adapted_audio.replace('comp.connect(ctx.destination)', 'comp.connect(destination || ctx.destination)')
    adapted_audio = adapted_audio.replace('this.enabled ? 0.8 * (1 - 0.55 * bullet) : 0', 'this.enabled ? (this.level ?? 1) * 0.8 * (1 - 0.55 * bullet) : 0')
    replace(original_audio, adapted_audio)
    replace('async toggleSound(force) { const on = force === true ? true : !app.soundOn; app.soundOn = on; ui.setSound(on); await audio.setEnabled(on); }',
            'async toggleSound(force) { const on = typeof force === "boolean" ? force : !app.soundOn; app.soundOn = on; ui.setSound(on); if (FilmSound.context) await FilmSound.route(on); else await audio.setEnabled(on); }')
    replace('togglePlay() { app.playing = !app.playing; ui.setPlaying(app.playing); ui.wake(); }',
            'togglePlay() { app.playing = !app.playing; ui.setPlaying(app.playing); ui.wake(); if (FilmSound.context) FilmSound.route().catch(error => console.warn("Audio transport:", error)); }')
    replace('    this.stateU = { ...pick(', '    this.stateU = { ...Research.uniforms, ...Tour.uniforms, ...pick(')
    replace('struct Shard { vec4 rA, rB, mP, mQ, mX; };', '${ExtensionSystem.shader}\nstruct Shard { vec4 rA, rB, mP, mQ, mX; };')
    replace('void shardState(int id, Shard sd,', 'void originalShardState(int id, Shard sd,')
    marker = 'void main() {\n  ivec2 px = ivec2(gl_FragCoord.xy);'
    replace(marker, '${TourSystem.shader}\n' + marker)
    replace('    this.bundle = b; this.tiledValid = false;', '    const previousResearchBundle = this.bundle;\n    this.bundle = b; this.tiledValid = false;')
    replace('    Embers.use(b.embers);', '    Embers.use(b.embers);\n    Research.onBundle(b, previousResearchBundle);\n    if (Tour.active) Tour.rebuild();')
    replace('  const focusAt = (T, out) => {', '  const focusAt = (T, out) => {\n    if (Research.active) return out.copy(Research.center);\n    if (Tour.active && Tour.state.extension) return out.set(0, 4.5 + 9.5 * Tour.extensionWeight, 0);')
    replace('    QualityManager.adapt(dtMs, now);', '    if (!app.capturing && !Tour.active) QualityManager.adapt(dtMs, now);\n    Tour.beforeFrame(dt);')
    replace('if (app.playing && !app.scrubbing) app.t =', 'if (app.playing && !app.scrubbing && !Research.active && !Tour.active) app.t =')
    marker = '    app.T = T;'
    replace(marker, marker + '\n    if (Tour.active) Tour.prepareFrame(); else Research.prepareFrame(dt);')
    replace('const shot = director.evaluate(T, camPos, camTgt),', 'const shot = Tour.active ? Tour.camera(camPos, camTgt) : Research.active ? Research.camera(camPos, camTgt) : director.evaluate(T, camPos, camTgt),')
    replace('    director.evaluate(Tq, prevPos, prevTgt);', '    if (Tour.active) Tour.camera(prevPos, prevTgt, -VEL_DT); else if (Research.active) Research.camera(prevPos, prevTgt, -VEL_DT); else director.evaluate(Tq, prevPos, prevTgt);')
    replace('    handheld(camPos, T, dist); handheld(prevPos, Tq, prevPos.distanceTo(prevTgt));', '    if (!Tour.active) { handheld(camPos, T, dist); handheld(prevPos, Tq, prevPos.distanceTo(prevTgt)); }')
    replace('    peek(camPos, camTgt); peek(prevPos, prevTgt);', '    if (!Tour.active) { peek(camPos, camTgt); peek(prevPos, prevTgt); }')
    replace('const hudPx = ui.intentional() ?', 'const hudPx = !Research.active && !Tour.active && ui.intentional() ?')
    replace("const tiled = T < B('shatter') + 0.25 || T > B('lock') - 0.3;", "const tiled = !Research.active && !(Tour.active && Tour.state.extension) && (T < B('shatter') + 0.25 || T > B('lock') - 0.3);")
    marker = '    if (meshes.shards.visible && !tiled) { subsetK = ShardSystem.setSubset(app.tier.reflSubset); U.uReflScale.value = Math.min(1.8, 0.85 / Math.sqrt(app.tier.reflSubset)); }'
    replace(marker, '''    if (meshes.shards.visible && !tiled) {
      const weight = Tour.active && Tour.state.extension ? Tour.extensionWeight : 1;
      const fraction = 1 + (app.tier.reflSubset - 1) * weight;
      subsetK = ShardSystem.setSubset(fraction);
      U.uReflScale.value = 1 + (Math.min(1.8, 0.85 / Math.sqrt(app.tier.reflSubset)) - 1) * weight;
    }''')
    replace('    ui.update(app.t, T, now, dt);', '    ui.update(app.t, T, now, dt);\n    if (Tour.active) Tour.updateUI(ui); else Research.updateUI(ui);')
    replace('if (app.playing && !app.scrubbing && !pinned) { const d = R - prevR;', 'if (!Tour.active && !Research.active && app.playing && !app.scrubbing && !pinned) { const d = R - prevR;')
    replace('    audio.update(T, bullet, U.uLava.value);', '    if (!Tour.active && !Research.active) audio.update(T, bullet, U.uLava.value);\n    FilmSound.sync();')
    replace('<title>Obsidian</title>', '<title>Obsidian</title>\n<style>body.research-mode .timeline, body.research-mode #sound-chip, body.research-mode #btn-sound,body.research-export #hud,body.research-export #sound-chip{display:none}body.research-export canvas{pointer-events:none}body.research-mode #hud{width:auto;max-width:calc(100vw - 24px)}</style>')
    marker = '  setTimeout(() => { Loader.done(); last = performance.now(); }, 100);'
    bridge = (root / 'tools/research_bridge.js').read_text(encoding='utf-8')
    replace(marker, bridge + '\n' + marker)
    return html


def main():
    (ROOT / 'web/vendor/obsidian/index.html').write_text(adapt_html(), encoding='utf-8', newline='\n')
    path = ROOT / 'references/sources.json'
    lock = json.loads(path.read_text(encoding='utf-8')); lock['local_changes'] = CHANGES
    path.write_text(json.dumps(lock, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Applied 3-D extension hooks to fixed upstream snapshot.')


if __name__ == '__main__':
    main()
