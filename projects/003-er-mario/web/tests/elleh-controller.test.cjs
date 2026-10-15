const test=require('node:test');
const assert=require('node:assert/strict');
const {Controller}=require('../elleh/controller.js');
const advance=(p,seconds,input={})=>{for(let t=0;t<seconds;t+=1/120)p.step(1/120,input);};

test('movement accelerates and releases back to rest',()=>{
  const p=new Controller({spawn:{x:0,z:0}});
  advance(p,1,{z:-1});assert.ok(p.z<-4);assert.ok(Math.abs(p.x)<1e-9);
  advance(p,.5);assert.ok(Math.abs(p.vz)<1e-9);assert.equal(p.action,'站立');
});
test('jump rises and lands on the floor',()=>{
  const p=new Controller();assert.equal(p.jump(),true);
  let highest=0;for(let i=0;i<200;i++){p.step(1/120);highest=Math.max(highest,p.y);}
  assert.ok(highest>1.4);assert.equal(p.grounded,true);assert.equal(p.y,0);assert.equal(p.landings,1);
});
test('three timely moving jumps reach distinct increasing heights',()=>{
  const p=new Controller({spawn:{x:0,z:0}});advance(p,.2,{x:1});const peaks=[];
  for(let tier=1;tier<=3;tier++){
    p.jump();assert.equal(p.tier,tier);let high=0;
    while(!p.grounded){p.step(1/120,{x:1});high=Math.max(high,p.y);}
    peaks.push(high);
  }
  assert.ok(peaks[1]>peaks[0]+.5);assert.ok(peaks[2]>peaks[1]+.8);
});
test('solid wall blocks movement without tunnelling',()=>{
  const p=new Controller({spawn:{x:0,z:0},obstacles:[{x0:2,x1:3,z0:-4,z1:4,bottom:0,top:6}]});
  advance(p,2,{x:1,run:true});assert.ok(p.x<=2-p.radius+1e-6);assert.ok(p.x>1.5);
});
test('ceiling limits upward jump height',()=>{
  const p=new Controller({spawn:{x:0,z:0},obstacles:[{x0:-3,x1:3,z0:-3,z1:3,bottom:2.8,top:3.3}]});
  p.jump();let high=0;for(let i=0;i<160;i++){p.step(1/120);high=Math.max(high,p.y);}
  assert.ok(high<=2.8-p.height+.01);assert.equal(p.grounded,true);
});
test('wall kick pushes away from contact while airborne',()=>{
  const p=new Controller({spawn:{x:0,z:0},obstacles:[{x0:2,x1:3,z0:-4,z1:4,bottom:0,top:6}]});
  advance(p,.2,{x:1});p.jump();advance(p,.35,{x:1});assert.ok(p.wall);assert.equal(p.jump(),true);assert.equal(p.action,'蹬墙跳');assert.ok(p.vx<0);assert.ok(p.vy>0);
});
test('ground pound lands and emits an impact event',()=>{
  const p=new Controller();p.jump();advance(p,.2);assert.equal(p.pound(),true);advance(p,1);
  assert.equal(p.grounded,true);assert.ok(p.drainEvents().some(e=>e.type==='impact'));
});
test('long jump trades jump height for forward speed',()=>{
  const p=new Controller({spawn:{x:0,z:0}});advance(p,.3,{z:-1});assert.equal(p.jump(true),true);
  assert.equal(p.action,'远跳');assert.ok(Math.abs(p.vz)>8);assert.ok(p.vy<7);
});
