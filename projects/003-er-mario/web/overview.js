(() => {
  'use strict';
  const dialog=document.querySelector('.guide-dialog');
  for(const button of document.querySelectorAll('[data-open-guide]'))button.addEventListener('click',()=>{dialog.showModal();document.body.classList.add('guide-is-open');});
  dialog.querySelector('[data-close-guide]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>document.body.classList.remove('guide-is-open'));
  dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
  const base='https://github.com/deltarooo/er-mario/blob/11744b855bf546ca0b66dfd09068858feaa18d0e/';
  const steps=[
    ['01 / WORLD ADAPTER','先让动作核心理解脚下的世界。','法环的碰撞数据不能直接交给 SM64 使用。适配层提取附近表面，处理尺度、X 轴镜像和三角形绕序，并同步动态表面的变换。','法环 Havok 世界\n    ↓ 读取附近碰撞\n坐标 / 尺度 / 表面格式转换\n    ↓ 同步动态物体\nlibsm64 可理解的表面','src/havok_col.rs'],
    ['02 / MOVEMENT & ANIMATION','复用的，是原作运动与动画逻辑。','键鼠或手柄输入与转换后的碰撞进入 libsm64。模组以 1/30 秒步长推进运动逻辑，再对显示位置插值；30 Hz 表示逻辑频率。','输入 + SM64 可用表面\n    ↓ sm64_mario_tick\n动作状态 / 位置 / 动画\n    ↓ 30 Hz 逻辑 + 位置插值\n可回写的角色状态','src/lib.rs'],
    ['03 / BODY & RENDERING','把运动结果放进宿主角色身体。','SM64 的身体部件姿态需要映射到法环角色骨骼。模组在宿主动画之后、渲染之前写入姿态，还要处理菜单、阴影和过场中的表现。','SM64 身体部件姿态\n    ↓ 骨骼映射与时序适配\n宿主角色位置 / 模型空间姿态\n    ↓ 法环渲染\n画面、阴影与反馈','src/engine_mario.rs'],
    ['04 / COMBAT & GAME EVENTS','让攻击和游戏流程继续协作。','命中先转为比例扣血，再借原生攻击衔接受击、击杀和掉落。褪色者代理协调门、赐福、死亡和存档；开门、爬梯等事件需要切换控制权。','动作命中 → 比例扣血 → 原生攻击\n位置同步 → 褪色者代理\n    ↓\n受击 / 击杀 / 掉落\n开门 / 赐福 / 死亡 / 存档','src/combat.rs']
  ];
  const buttons=[...document.querySelectorAll('[data-step]')];
  for(const button of buttons)button.addEventListener('click',()=>{
    const step=steps[Number(button.dataset.step)];
    for(const b of buttons)b.setAttribute('aria-pressed',String(b===button));
    for(const [id,text] of [['step-eyebrow',step[0]],['step-title',step[1]],['step-text',step[2]],['step-code',step[3]]])document.getElementById(id).textContent=text;
    document.getElementById('step-link').href=base+step[4];
  });
})();
