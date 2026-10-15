/* Original browser character controller. Parameters are tuned for this reconstruction. */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const approach = (a, b, amount) => a < b ? Math.min(a + amount, b) : Math.max(a - amount, b);
  class Controller {
    constructor({ floor = () => 0, obstacles = [], spawn = { x: 0, z: 16 } } = {}) {
      this.floor = floor; this.obstacles = obstacles; this.spawn = spawn;
      this.radius = .34; this.height = 1.72; this.time = 0;
      this.events = []; this.reset();
    }
    reset() {
      this.x = this.spawn.x; this.z = this.spawn.z; this.y = this.floor(this.x, this.z);
      this.vx = this.vz = this.vy = 0; this.heading = Math.PI;
      this.grounded = true; this.action = '站立'; this.tier = 0; this.sinceLanding = 10;
      this.pounding = false; this.wall = null; this.airTime = 0; this.longJump = false;
      this.events = []; this.landings = 0;
    }
    jump(crouch = false) {
      if (this.grounded) {
        const speed = Math.hypot(this.vx, this.vz);
        this.tier = speed > 1.4 && this.sinceLanding < .3 && !this.longJump ? this.tier % 3 + 1 : 1;
        this.longJump = crouch && speed > 1;
        this.vy = this.longJump ? 5.9 : [0, 7.8, 9.6, 11.8][this.tier];
        if (this.longJump) { const factor = 9.2 / Math.max(speed, .1); this.vx *= factor; this.vz *= factor; }
        this.grounded = false; this.airTime = 0; this.pounding = false;
        this.action = this.longJump ? '远跳' : ['','跳跃','二段跳','三段跳'][this.tier];
        this.events.push({ type: 'jump', tier: this.tier });
        return true;
      }
      if (this.wall && this.time - this.wall.time < .2 && !this.pounding) {
        this.vx = this.wall.x * 6.4; this.vz = this.wall.z * 6.4; this.vy = 9.1;
        this.heading = Math.atan2(this.vx, this.vz); this.wall = null;
        this.action = '蹬墙跳'; this.tier = 1; this.longJump = false;
        this.events.push({ type: 'wallkick' }); return true;
      }
      return false;
    }
    pound() {
      if (!this.grounded && this.y - this.floor(this.x, this.z) > .7) {
        this.pounding = true; this.longJump = false; this.vy = -19;
        this.vx *= .1; this.vz *= .1; this.action = '下砸'; return true;
      }
      return false;
    }
    step(dt, input = {}) {
      dt = clamp(dt, 0, .05); this.time += dt; this.sinceLanding += dt;
      let ix = input.x || 0, iz = input.z || 0;
      const length = Math.hypot(ix, iz); if (length > 1) { ix /= length; iz /= length; }
      const target = input.run ? 7.6 : 5.4;
      const acceleration = this.grounded ? 30 : 8;
      if (!this.longJump && !this.pounding && this.action !== '蹬墙跳') {
        this.vx = approach(this.vx, ix * target, acceleration * dt);
        this.vz = approach(this.vz, iz * target, acceleration * dt);
      } else if (this.longJump || this.action === '蹬墙跳') {
        this.vx += ix * dt * 1.1; this.vz += iz * dt * 1.1;
      }
      if (length > .05 && this.action !== '蹬墙跳') this.heading = Math.atan2(ix, iz);
      const beforeY = this.y;
      this.x += this.vx * dt; this.z += this.vz * dt;
      if (!this.grounded) { this.vy -= 19 * dt; this.airTime += dt; }
      this.y += this.vy * dt;
      let support = this.floor(this.x, this.z);
      for (const b of this.obstacles) {
        if (this.x + this.radius <= b.x0 || this.x - this.radius >= b.x1 || this.z + this.radius <= b.z0 || this.z - this.radius >= b.z1) continue;
        if (beforeY >= b.top - .16 && this.y <= b.top && this.vy <= 0) support = Math.max(support, b.top);
        if (this.y >= b.top - .04 || this.y + this.height <= (b.bottom || 0)) continue;
        if (this.grounded && b.top - this.y < .27 && b.top > this.y) { this.y = b.top; support = Math.max(support, b.top); continue; }
        if (beforeY + this.height <= (b.bottom || 0) + .08 && this.vy > 0) { this.y = b.bottom - this.height; this.vy = 0; continue; }
        const qx = clamp(this.x, b.x0, b.x1), qz = clamp(this.z, b.z0, b.z1);
        const dx = this.x - qx, dz = this.z - qz, distance = Math.hypot(dx, dz);
        let nx = 0, nz = 0;
        if (distance > 1e-8 && distance < this.radius) {
          nx = dx / distance; nz = dz / distance;
          this.x += nx * (this.radius - distance); this.z += nz * (this.radius - distance);
        } else if (distance < 1e-8) {
          const sides = [[Math.abs(this.x - b.x0), -1, 0], [Math.abs(this.x - b.x1), 1, 0], [Math.abs(this.z - b.z0), 0, -1], [Math.abs(this.z - b.z1), 0, 1]].sort((a,b) => a[0]-b[0]);
          nx = sides[0][1]; nz = sides[0][2];
          if (nx) this.x = nx < 0 ? b.x0 - this.radius : b.x1 + this.radius;
          if (nz) this.z = nz < 0 ? b.z0 - this.radius : b.z1 + this.radius;
        }
        if (nx || nz) {
          this.wall = { x: nx, z: nz, time: this.time };
          const into = this.vx * nx + this.vz * nz;
          if (into < 0) { this.vx -= into * nx; this.vz -= into * nz; }
        }
      }
      if (this.y <= support + .02 && this.vy <= 0) {
        if (!this.grounded) {
          this.events.push({ type: this.pounding ? 'impact' : 'land', x: this.x, z: this.z });
          this.sinceLanding = 0; this.landings++;
        }
        this.y = support; this.vy = 0; this.grounded = true; this.pounding = false; this.longJump = false;
        this.action = Math.hypot(this.vx, this.vz) > .3 ? (input.run ? '奔跑' : '行走') : '站立';
      } else this.grounded = false;
      if (this.y < -15 || Math.hypot(this.x, this.z) > 58) this.reset();
      return this;
    }
    drainEvents() { const events = this.events; this.events = []; return events; }
  }
  const api = { Controller, clamp, approach };
  root.EllehPhysics = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
