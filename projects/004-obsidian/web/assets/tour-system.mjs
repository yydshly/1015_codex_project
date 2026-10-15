import { SHAPES, settings } from './extension-shapes.mjs';
import { DURATION, sampleTimeline, extensionCamera } from './tour-timeline.mjs';

export class TourSystem {
  constructor(THREE, research) {
    this.THREE = THREE; this.research = research; this.active = false; this.time = 0;
    this.profiles = Object.fromEntries(Object.keys(SHAPES).map(f => [f, settings(f)]));
    this.uniforms = { uTourOn: { value: 0 }, uTourBlend: { value: 1 } };
    for (const side of ['A', 'B']) {
      this.uniforms['uTourForm' + side] = { value: -1 };
      this.uniforms['uTourClock' + side] = { value: 0 };
      this.uniforms['uTourParams' + side] = { value: new THREE.Vector4() };
      this.uniforms['tTour' + side] = { value: research.uniforms.tExtTargets.value };
    }
    this.tmpP = new THREE.Vector3(); this.tmpL = new THREE.Vector3();
    this.photo = {}; this.targets = {}; this.state = sampleTimeline(0);
  }

  static shader = /* glsl */`
uniform float uTourOn, uTourBlend, uTourFormA, uTourFormB, uTourClockA, uTourClockB;
uniform vec4 uTourParamsA, uTourParamsB;
uniform sampler2D tTourA, tTourB;
void tourTarget(sampler2D targets, int id, float form, float clock, vec4 params, vec4 randoms,
  out vec3 pos, out vec4 q, out float scl, out vec4 material) {
  vec4 dst = fetch(targets, id, 0), dq = fetch(targets, id, 1);
  float angle = clock * params.y;
  if (form > 0.5 && form < 1.5) angle *= 0.6 + 1.4 * sat((dst.y - 1.2) / 26.0);
  vec4 turn = qaxis(vec3(0.0, 1.0, 0.0), angle);
  pos = qrot(turn, dst.xyz - vec3(0.0, 14.0, 0.0)) + vec3(0.0, 14.0, 0.0);
  pos += sin(randoms.xyz * TAU + clock * vec3(0.73, 0.91, 0.61)) * params.w;
  vec3 loose = vec3((randoms.x - 0.5) * 60.0, 2.0 + randoms.y * 28.0, (randoms.z - 0.5) * 48.0);
  pos = mix(loose, pos, params.x); scl = dst.w * params.z; q = qmul(turn, dq);
  material = vec4(form > 1.5 ? 0.78 : 0.38, form > 1.5 ? 0.08 : 0.25, 0.0, params.y);
}
void shardState(int id, Shard sd, float T, float te, vec3 cam, out vec3 pos, out vec4 q, out float scl, out vec4 mat, out float ph) {
  if (uTourOn > 0.5) {
    vec3 a, b; vec4 qa, qb, ma, mb; float sa, sb, phase;
    if (uTourFormA < -0.5) originalShardState(id, sd, T, te, cam, a, qa, sa, ma, phase);
    else tourTarget(tTourA, id, uTourFormA, uTourClockA + T - uT*NOMINAL, uTourParamsA, sd.rA, a, qa, sa, ma);
    if (uTourFormB < -0.5) originalShardState(id, sd, T, te, cam, b, qb, sb, mb, phase);
    else tourTarget(tTourB, id, uTourFormB, uTourClockB + T - uT*NOMINAL, uTourParamsB, sd.rA, b, qb, sb, mb);
    pos = mix(a, b, uTourBlend); q = qslerp(qa, qb, uTourBlend); scl = mix(sa, sb, uTourBlend); mat = mix(ma, mb, uTourBlend); ph = 11.0;
    return;
  }
  if (uExtOn > 0.5) { extensionState(id, T, sd.rA, pos, q, scl, mat, ph); return; }
  originalShardState(id, sd, T, te, cam, pos, q, scl, mat, ph);
}
`;

  attach(context) { this.context = context; }
  rebuild() {
    const next = {};
    try {
      for (const f of Object.keys(SHAPES)) next[f] = this.research.createTarget(f, this.profiles[f], this.context.ShardSystem.bundle);
    } catch (error) { Object.values(next).forEach(t => t.dispose()); throw error; }
    Object.values(this.targets).forEach(t => t.dispose()); this.targets = next;
  }
  start(profiles = {}) {
    for (const f of Object.keys(SHAPES)) this.profiles[f] = settings(f, profiles[f] || this.profiles[f]);
    this.rebuild(); this.research.leave();
    const { app, ui } = this.context;
    if (app.free.on) app.toggleOrbit(false);
    app.free.back = 1; app.forceT = null; this.active = true; this.time = 0;
    document.body.classList.add('research-mode');
    app.playing = true; ui.setPlaying(true); this.seek(0, false);
  }
  leave() {
    this.active = false; this.uniforms.uTourOn.value = 0;
    document.body.classList.remove('research-mode');
    this.context.app.forceT = null;
    this.context.ui.cache.stage = ''; this.context.ui.cache.read = '';
  }
  seek(time, pause = true) {
    if (!Number.isFinite(time)) return;
    this.time = ((time % DURATION) + DURATION) % DURATION;
    if (pause) { this.context.app.playing = false; this.context.ui.setPlaying(false); }
    this.context.tick(performance.now(), 0);
  }
  beforeFrame(dt) {
    if (!this.active || !this.context) return;
    const { app, Edit } = this.context;
    if (app.playing) this.time = (this.time + dt * app.speed) % DURATION;
    this.state = sampleTimeline(this.time);
    app.t = this.state.originalTime / 18; app.forceT = null;
    this.story = Edit.story(app.t);
    // Original passages retain their native tiled geometry and exact state path.
    this.uniforms.uTourOn.value = this.state.extension ? 1 : 0;
    this.uniforms.uTourBlend.value = this.state.blend;
    for (const [side, f, clock] of [['A', this.state.from, this.state.fromTime], ['B', this.state.to, this.state.toTime]]) {
      this.uniforms['uTourForm' + side].value = Object.keys(SHAPES).indexOf(f);
      this.uniforms['uTourClock' + side].value = clock;
      if (f !== 'original') {
        this.uniforms['tTour' + side].value = this.targets[f];
        const p = this.profiles[f]; this.uniforms['uTourParams' + side].value.set(p.assembly, p.speed, p.size, p.noise);
      }
    }
  }
  prepareFrame() {
    this.extensionWeight = this.state.index === 1 ? this.state.blend : this.state.index === 5 ? 1 - this.state.blend : 1;
    if (this.state.extension) this.research.renderExtension(this.extensionWeight);
  }
  camera(position, look, offset = 0) {
    const state = sampleTimeline(this.time + offset), { director, Edit } = this.context;
    const evaluate = (form, elapsed, p, l) => {
      if (form === 'original') return director.evaluate(Edit.story(state.originalTime / 18), p, l);
      const shot = extensionCamera(form, elapsed); p.set(...shot.position); l.set(...shot.look); return shot;
    };
    const a = evaluate(state.from, state.fromTime, position, look);
    const af = a.fov, ad = a.dof;
    const b = evaluate(state.to, state.toTime, this.tmpP, this.tmpL);
    position.lerp(this.tmpP, state.blend); look.lerp(this.tmpL, state.blend);
    return Object.assign(this.photo, { fov: af + (b.fov - af) * state.blend, dof: ad + (b.dof - ad) * state.blend, shot: state.chapter.name });
  }
  updateUI(ui) {
    if (!this.active) return;
    ui.stageEl.textContent = this.state.chapter.name;
    ui.readEl.textContent = this.time.toFixed(1) + ' / 48 S';
  }
}
