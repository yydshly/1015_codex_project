/* Headless skeleton checks use the actual GLB geometry and weights; texture decoding is omitted. */
const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const THREE=require('../vendor/three.min.js');
const web=path.resolve(__dirname,'..');
const context=vm.createContext({THREE,window:{THREE},console,TextDecoder,TextEncoder,URL,Blob,
  document:{currentScript:{src:'http://localhost/elleh/human.js'}}});
let api;
before(async()=>{
  for(const file of ['vendor/GLTFLoader.js','vendor/SkeletonUtils.js'])vm.runInContext(fs.readFileSync(path.join(web,file),'utf8'),context);
  const original=fs.readFileSync(path.join(web,'assets/rocketbox-human.glb'));
  const jsonLength=original.readUInt32LE(12),json=JSON.parse(original.subarray(20,20+jsonLength));
  const binary=original.subarray(28+jsonLength);
  delete json.images;delete json.textures;delete json.materials;
  for(const mesh of json.meshes)for(const primitive of mesh.primitives)delete primitive.material;
  const raw=Buffer.from(JSON.stringify(json)),padded=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(padded);
  const glb=Buffer.alloc(28+padded.length+binary.length);
  glb.writeUInt32LE(0x46546c67,0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);
  glb.writeUInt32LE(padded.length,12);glb.writeUInt32LE(0x4e4f534a,16);padded.copy(glb,20);
  glb.writeUInt32LE(binary.length,20+padded.length);glb.writeUInt32LE(0x004e4942,24+padded.length);binary.copy(glb,28+padded.length);
  const array=glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength);
  const parsed=await new Promise((resolve,reject)=>new THREE.GLTFLoader().parse(array,'',resolve,reject));
  THREE.GLTFLoader.prototype.loadAsync=async()=>parsed;
  for(const file of ['elleh/human.js','elleh/characters.js'])vm.runInContext(fs.readFileSync(path.join(web,file),'utf8'),context);
  await context.window.EllehHuman.load();api=context.window.EllehCharacters;
});
const base={x:0,y:0,z:0,heading:0,vx:0,vz:5.4,grounded:true,tier:1,airTime:0,longJump:false,pounding:false,action:'行走'};
function bones(model){const result=[];model.root.traverse(node=>{if(node.isBone)result.push(node);});return result;}
test('realistic asset contains a textured skin, 80 joints and no prerecorded clips',()=>{
  const b=fs.readFileSync(path.join(web,'assets/rocketbox-human.glb'));
  const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
  assert.equal(json.skins[0].joints.length,80);assert.equal((json.animations||[]).length,0);
  assert.ok(json.images.length>=3);assert.ok(json.meshes[0].primitives.every(p=>p.attributes.WEIGHTS_0!==undefined));
});
test('retargeted run, triple flip, long jump, pound and wall kick stay finite and bounded',()=>{
  const model=api.create('human');
  for(const state of [base,{...base,grounded:false,tier:3,airTime:.6},{...base,grounded:false,longJump:true},{...base,grounded:false,pounding:true},{...base,grounded:false,action:'蹬墙跳'}]){
    api.pose(model,.12,state);model.root.updateMatrixWorld(true);
    for(const bone of bones(model)){
      assert.ok(bone.matrixWorld.elements.every(Number.isFinite),bone.name);
      assert.ok(Math.abs(bone.quaternion.length()-1)<1e-5,bone.name);
    }
    if(state.grounded){
      const joint=bones(model).find(b=>/R_? ?Thigh$/.test(b.name));
      const child=bones(model).find(b=>/R_? ?Calf$/.test(b.name));
      const direction=child.getWorldPosition(new THREE.Vector3()).sub(joint.getWorldPosition(new THREE.Vector3())).normalize();
      assert.ok(Math.abs(direction.x)<1e-4,'stride must stay in the shared forward/up plane');
    }
    const bounds=new THREE.Box3(),v=new THREE.Vector3();
    model.root.traverse(mesh=>{
      if(!mesh.isSkinnedMesh)return;mesh.skeleton.update();
      for(let i=0;i<mesh.geometry.attributes.position.count;i+=7){v.fromBufferAttribute(mesh.geometry.attributes.position,i);mesh.boneTransform(i,v);v.applyMatrix4(mesh.matrixWorld);bounds.expandByPoint(v);}
    });
    const extent=bounds.getSize(new THREE.Vector3());
    assert.ok(Math.max(extent.x,extent.y,extent.z)<3,'exploding skin: '+JSON.stringify(extent));
    assert.ok(extent.length()>1,'collapsed skin');
  }
});
test('preview and world clones have independent bones',()=>{
  const a=api.create('human'),b=api.create('human');api.pose(a,.12,base);
  const pose=bones(a).map(bone=>bone.quaternion.toArray().join(','));
  api.pose(b,.24,{...base,grounded:false,pounding:true});
  assert.deepEqual(bones(a).map(bone=>bone.quaternion.toArray().join(',')),pose);
  assert.notEqual(bones(a)[0],bones(b)[0]);
});
