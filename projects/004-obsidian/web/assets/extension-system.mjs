import { SHAPES, settings, generateTargets } from './extension-shapes.mjs';

export class ExtensionSystem {
  constructor(THREE) {
    this.THREE = THREE; this.active = false; this.form = 'galaxy'; this.params = settings('galaxy');
    this.clock = 0; this.angle = 0; this.targetCount = 0; this.context = null;
    const seed = new THREE.DataTexture(new Float32Array([0, 0, 0, 1]), 1, 1, THREE.RGBAFormat, THREE.FloatType); seed.needsUpdate = true;
    this.uniforms = {
      uExtOn: { value: 0 }, uExtClock: { value: 0 }, uExtAngle: { value: 0 }, uExtStart: { value: -2 },
      uExtForm: { value: 0 }, uExtParams: { value: new THREE.Vector4(1, .22, 1, .08) },
      tExtTargets: { value: seed }, tExtFromP: { value: seed }, tExtFromQ: { value: seed }, tExtFromM: { value: seed },
    };
    this.viewStart = new THREE.Vector3(); this.lookStart = new THREE.Vector3(); this.viewAt = -2;
    this.center = new THREE.Vector3(0, 14, 0); this.desired = new THREE.Vector4();
    this.extensionMaterial = new THREE.Vector3(.5, .1, .3);
    this.lightFocus = new THREE.Vector3();
    this.photo = { fov: 42, dof: 0, shot: '三维碎片实验' };
  }

  static shader = /* glsl */`
uniform float uExtOn, uExtClock, uExtAngle, uExtStart, uExtForm;
uniform vec4 uExtParams;
uniform sampler2D tExtTargets, tExtFromP, tExtFromQ, tExtFromM;
void extensionState(int id, float T, vec4 randoms, out vec3 pos, out vec4 q, out float scl, out vec4 material, out float phase) {
  ivec2 tc = ivec2(id % TEXW, id / TEXW);
  vec4 dst = fetch(tExtTargets, id, 0), dq = fetch(tExtTargets, id, 1);
  float offset = T - uT * NOMINAL, clock = uExtClock + offset;
  float angle = uExtAngle + offset * uExtParams.y;
  if (uExtForm > 0.5 && uExtForm < 1.5) angle *= 0.6 + 1.4 * sat((dst.y - 1.2) / 26.0);
  vec4 turn = qaxis(vec3(0.0, 1.0, 0.0), angle);
  vec3 p = qrot(turn, dst.xyz - vec3(0.0, 14.0, 0.0)) + vec3(0.0, 14.0, 0.0);
  vec3 jitter = sin(randoms.xyz * TAU + clock * vec3(0.73, 0.91, 0.61));
  p += jitter * uExtParams.w;
  vec3 loose = vec3((randoms.x - 0.5) * 60.0, 2.0 + randoms.y * 28.0, (randoms.z - 0.5) * 48.0);
  p = mix(loose, p, uExtParams.x);
  float s = dst.w * uExtParams.z;
  vec4 tq = qmul(turn, dq);
  vec4 from = texelFetch(tExtFromP, tc, 0), fq = texelFetch(tExtFromQ, tc, 0), fm = texelFetch(tExtFromM, tc, 0);
  float blend = eio(sat((clock - uExtStart) / 1.6));
  pos = mix(from.xyz, p, blend); scl = mix(from.w, s, blend);
  pos.y = softFloor(pos.y, uShardG * 0.6 * scl + 0.12);
  q = qslerp(fq, tq, blend);
  vec4 targetMaterial = vec4(uExtForm > 1.5 ? 0.78 : 0.38, uExtForm > 1.5 ? 0.08 : 0.25, 0.0, uExtParams.y);
  material = mix(fm, targetMaterial, blend); phase = 11.0;
}
`;

  attach(context) {
    this.context = context;
    const { THREE } = this;
    this.copyMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false, blending: THREE.NoBlending,
      uniforms: { p: { value: null }, q: { value: null }, m: { value: null }, oldCount: { value: 1 }, newCount: { value: 1 } },
      vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `precision highp float; precision highp int;
        uniform sampler2D p, q, m; uniform int oldCount, newCount;
        layout(location=0) out vec4 op; layout(location=1) out vec4 oq; layout(location=2) out vec4 om;
        void main() { int id = int(gl_FragCoord.x) + int(gl_FragCoord.y) * 256;
          int src = min(oldCount-1, int(float(id) * float(oldCount) / float(newCount)));
          ivec2 at = ivec2(src % 256, src / 256); op=texelFetch(p,at,0); oq=texelFetch(q,at,0); om=texelFetch(m,at,0); }`,
    });
    this.copyQuad = new context.FullScreenQuad(this.copyMaterial);
  }

  glyph(text) {
    const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 240;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.font = '600 160px "Microsoft YaHei", "Segoe UI", sans-serif';
    const size = Math.min(160, 900 / Math.max(1, context.measureText(text).width) * 160);
    context.font = `600 ${size}px "Microsoft YaHei", "Segoe UI", sans-serif`;
    context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillStyle = '#fff'; context.fillText(text, 500, 120);
    const pixels = context.getImageData(0, 0, 1000, 240).data, faces = [], edges = [], stride = 2;
    let minX = 1000, minY = 240, maxX = 0, maxY = 0;
    const alpha = (x, y) => x < 0 || x >= 1000 || y < 0 || y >= 240 ? 0 : pixels[(y * 1000 + x) * 4 + 3];
    for (let y = 2; y < 238; y += stride) for (let x = 2; x < 998; x += stride) {
      if (alpha(x, y) < 96) continue;
      faces.push([x, y]); minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      if ([alpha(x - 2, y), alpha(x + 2, y), alpha(x, y - 2), alpha(x, y + 2)].some(a => a < 96)) {
        let nx = alpha(x - 2, y) - alpha(x + 2, y), ny = alpha(x, y - 2) - alpha(x, y + 2);
        const length = Math.hypot(nx, ny); if (!length) { nx = 1; ny = 0; }
        edges.push([x, y, nx / (length || 1), ny / (length || 1)]);
      }
    }
    if (!faces.length || !edges.length) throw new Error('此文字没有可显示的字形，请换一组文字');
    return { faces, edges, stride, width: maxX - minX + 2, height: maxY - minY + 2, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  }

  snapshot(source, destination) {
    const { THREE } = this, { renderer } = this.context, rows = destination.tg.R;
    if (!this.fromRT || this.fromRT.height !== rows) {
      this.fromRT?.dispose();
      this.fromRT = new THREE.WebGLRenderTarget(256, rows, { count: 3, type: THREE.FloatType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
    }
    const u = this.copyMaterial.uniforms;
    u.p.value = source.rt.textures[0]; u.q.value = source.rt.textures[1]; u.m.value = source.rt.textures[2];
    u.oldCount.value = source.count; u.newCount.value = destination.count;
    const previous = renderer.getRenderTarget(); renderer.setRenderTarget(this.fromRT); this.copyQuad.render(renderer); renderer.setRenderTarget(previous);
    ['P', 'Q', 'M'].forEach((name, i) => { this.uniforms['tExtFrom' + name].value = this.fromRT.textures[i]; });
  }

  createTarget(form, params, bundle) {
    const { THREE } = this;
    const glyph = form === 'text' ? this.glyph(params.text) : null;
    const target = generateTargets(form, bundle.count, bundle.grid.g, params, glyph);
    const texture = new THREE.DataTexture(target.data, 256, target.rows * 2, THREE.RGBAFormat, THREE.FloatType);
    texture.minFilter = texture.magFilter = THREE.NearestFilter; texture.generateMipmaps = false; texture.needsUpdate = true;
    return texture;
  }

  buildTarget(bundle) {
    const texture = this.createTarget(this.form, this.params, bundle);
    const old = this.targetTexture; this.targetTexture = texture; this.uniforms.tExtTargets.value = texture; old?.dispose();
    this.targetCount = bundle.count;
  }

  select(form, input = {}, replay = false) {
    if (!SHAPES[form] || !this.context) throw new Error('形态尚未准备好');
    const { app, ShardSystem } = this.context, wasActive = this.active;
    const previousForm = this.form, previousParams = this.params;
    this.form = form; this.params = settings(form, input);
    try { this.buildTarget(ShardSystem.bundle); }
    catch (error) { this.form = previousForm; this.params = previousParams; throw error; }
    this.snapshot(ShardSystem.bundle, ShardSystem.bundle);
    this.uniforms.uExtStart.value = app.playing ? this.clock : this.clock - 1.6;
    if (!wasActive) { this.savedTime = app.t; this.savedForce = app.forceT; }
    this.active = true; this.uniforms.uExtOn.value = 1; this.uniforms.uExtForm.value = Object.keys(SHAPES).indexOf(form);
    app.forceT = 0; document.body.classList.add('research-mode');
    if (!wasActive || previousForm !== form || replay) { this.angle = 0; this.resetView(); }
    if (!app.playing) {
      this.uniforms.uExtParams.value.set(this.params.assembly, this.params.speed, this.params.size, this.params.noise);
      this.viewAt = this.clock - 1.6;
    }
    this.context.tick(performance.now(), 0);
  }

  configure(input) {
    const next = settings(this.form, { ...this.params, ...input });
    if (next.a !== this.params.a || next.b !== this.params.b || next.text !== this.params.text) this.select(this.form, next);
    else { this.params = next; if (!this.context.app.playing) this.uniforms.uExtParams.value.set(next.assembly, next.speed, next.size, next.noise); }
    if (!this.context.app.playing) { this.uniforms.uExtStart.value = this.clock - 1.6; this.viewAt = Math.min(this.viewAt, this.clock - 1.6); }
    this.context.tick(performance.now(), 0);
  }

  reassemble() {
    const { app, ui, tick } = this.context;
    app.playing = true; ui.setPlaying(true);
    this.params.assembly = 0; this.uniforms.uExtParams.value.x = 0;
    this.uniforms.uExtStart.value = this.clock - 1.6; tick(performance.now(), 0);
    this.select(this.form, { ...this.params, assembly: 1 }, true);
    this.uniforms.uExtParams.value.x = 1;
  }

  onBundle(bundle, previous) {
    if (!this.active || !this.context || !previous) return;
    this.buildTarget(bundle); this.snapshot(previous, bundle);
    this.uniforms.uExtStart.value = this.context.app.playing ? this.clock : this.clock - 1.6;
  }

  resetView() {
    const { app, camera, orbit } = this.context;
    if (app.free.on) app.toggleOrbit(false);
    app.free.back = 1; this.viewStart.copy(camera.position); this.lookStart.copy(orbit.target);
    camera.getWorldDirection(this.lookStart).multiplyScalar(camera.position.distanceTo(this.center)).add(camera.position);
    this.viewAt = app.playing ? this.clock : this.clock - 1.6;
  }

  camera(position, look, offset = 0) {
    const destinations = { galaxy: [32, 42, 49], tornado: [36, 23, 52], dna: [30, 22, 51], text: [0, 15, 63] };
    const t = Math.min(1, Math.max(0, (this.clock + offset - this.viewAt) / 1.6)), s = t * t * (3 - 2 * t);
    position.set(...destinations[this.form]).lerp(this.viewStart, 1 - s);
    look.copy(this.center).lerp(this.lookStart, 1 - s); return this.photo;
  }

  prepareFrame(dt) {
    if (!this.active || !this.context) return;
    const { app, meshes, U, ShardSystem, PostFX, Lighting } = this.context;
    if (app.playing) { this.clock += dt * app.speed; this.angle += dt * app.speed * this.params.speed; }
    this.uniforms.uExtClock.value = this.clock; this.uniforms.uExtAngle.value = this.angle;
    this.desired.set(this.params.assembly, this.params.speed, this.params.size, this.params.noise);
    this.uniforms.uExtParams.value.lerp(this.desired, app.playing ? 1 - Math.exp(-dt * 12) : 1);
    this.renderExtension();
  }

  renderExtension(weight = 1) {
    const { app, meshes, U, ShardSystem, PostFX, Lighting } = this.context;
    meshes.solid.visible = false; meshes.shards.visible = true; meshes.embers.visible = false;
    U.uTiled.value = 1 - weight; U.uSideGlow.value += (1 - U.uSideGlow.value) * weight; U.uRoseOn.value = 0;
    U.uLava.value.multiplyScalar(1 - weight); U.uLavaLight.value *= 1 - weight;
    U.uMaterial.value.lerp(this.extensionMaterial, weight); U.uRate.value = app.speed; U.uRippleN.value = 0;
    PostFX.haze.enabled = PostFX.rose.enabled = false; ShardSystem.pickMaterial();
    Lighting.aim(this.lightFocus.copy(Lighting.focus).lerp(this.center, weight), Lighting.sun.shadow.camera.right + (38 - Lighting.sun.shadow.camera.right) * weight);
  }

  updateUI(ui) {
    if (!this.active) return;
    ui.stageEl.textContent = SHAPES[this.form].name; ui.readEl.textContent = this.clock.toFixed(1) + ' S · 3D';
  }

  leave() {
    if (!this.active) return;
    const { app } = this.context;
    if (app.free.on) app.toggleOrbit(false);
    this.active = false; this.uniforms.uExtOn.value = 0; app.t = this.savedTime; app.forceT = this.savedForce;
    document.body.classList.remove('research-mode');
    this.context.ui.cache.stage = ''; this.context.ui.cache.read = '';
  }
}
