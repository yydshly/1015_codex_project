/* MIT Microsoft Rocketbox mesh. Retarget semantic limbs onto its existing skin skeleton. */
(() => {
  'use strict';
  const T=window.THREE;
  const url=new URL('../assets/rocketbox-human.glb',document.currentScript.src).href;
  let source,pending;
  function load(){
    if(!pending)pending=new T.GLTFLoader().loadAsync(url).then(gltf=>{
      source=gltf.scene;
      source.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;node.frustumCulled=false;const mats=Array.isArray(node.material)?node.material:[node.material];for(const mat of mats){mat.roughness=.83;mat.metalness=0;if(mat.transparent){mat.alphaTest=.5;mat.transparent=false;mat.side=T.DoubleSide;}}}});
    });
    return pending;
  }
  function create(body,arms,legs){
    if(!source)throw new Error('Realistic human has not loaded');
    const skin=T.SkeletonUtils.clone(source);body.add(skin);
    const bones=new Map(),rest=[];
    skin.traverse(node=>{if(node.isBone){bones.set(node.name.replace(/[ _]/g,''),node);rest.push([node,node.quaternion.clone()]);}});
    function bone(name){const result=bones.get(('Bip01'+name).replace(/[ _]/g,''));if(!result)throw new Error('Missing humanoid joint: '+name);return result;}
    const upper=[bone('R UpperArm'),bone('L UpperArm')],lower=[bone('R Forearm'),bone('L Forearm')],hands=[bone('R Hand'),bone('L Hand')];
    const thighs=[bone('R Thigh'),bone('L Thigh')],calves=[bone('R Calf'),bone('L Calf')],feet=[bone('R Foot'),bone('L Foot')],toes=[bone('R Toe0'),bone('L Toe0')];
    for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.22,1.43,0);body.add(arm);arms.push(arm);const leg=new T.Group();leg.position.set(side*.09,.92,0);body.add(leg);legs.push(leg);}
    const start=new T.Vector3(),end=new T.Vector3(),current=new T.Vector3(),desired=new T.Vector3(),worldQ=new T.Quaternion(),parentQ=new T.Quaternion(),delta=new T.Quaternion();
    const direction=new T.Vector3(),angles=new T.Euler();
    function aim(joint,child,x,z=0,forward=false){
      joint.getWorldPosition(start);child.getWorldPosition(end);current.copy(end).sub(start).normalize();
      if(forward)direction.set(0,-.04,1);else direction.set(0,-1,0);
      angles.set(x,0,z);direction.applyEuler(angles);desired.copy(direction).transformDirection(body.matrixWorld);
      delta.setFromUnitVectors(current,desired);joint.getWorldQuaternion(worldQ);joint.parent.getWorldQuaternion(parentQ).invert();
      joint.quaternion.copy(parentQ.multiply(delta.multiply(worldQ)));joint.updateMatrixWorld(true);
    }
    function retarget(time,player){
      for(const [node,q] of rest)node.quaternion.copy(q);
      body.updateWorldMatrix(true,true);
      const speed=Math.hypot(player.vx,player.vz);
      for(let i=0;i<2;i++){
        const arm=arms[i].rotation,leg=legs[i].rotation;
        // Bind-pose axes differ from the simple models. World-space directions preserve skin weights.
        const elbow=player.pounding?.8:player.grounded?(speed>.2?.85:.12):.4;
        const knee=player.pounding?1.9:player.longJump?.65:player.grounded?Math.max(0,leg.x)*1.1+.06:.45;
        aim(upper[i],lower[i],arm.x,arm.z);aim(lower[i],hands[i],arm.x-elbow,arm.z*.6);
        aim(thighs[i],calves[i],leg.x);aim(calves[i],feet[i],leg.x+knee);
        aim(feet[i],toes[i],0,0,true);
      }
    }
    return retarget;
  }
  window.EllehHuman={load,create};
})();
