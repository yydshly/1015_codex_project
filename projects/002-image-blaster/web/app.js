"use strict";
(() => {
  const upstream = "https://github.com/neilsonnn/image-blaster/blob/4acb43ba126a12358f71838d1b1a05e856b10eaf/";
  const stages = [
    {category:"本地脚本",title:"建立一个可以继续工作的项目",description:"脚本创建项目目录，把输入图片移入稳定的 source/，扫描已有资产，判断下一步需要做什么。",input:"input/ 中的图片、项目名称",actor:"project-state.mjs",output:"project.json、source/ 与派生状态",boundary:"项目状态主要来自目录和 JSON 文件，不是独立数据库或常驻任务平台。",source:".claude/scripts/project/project-state.mjs"},
    {category:"Claude 视觉理解",title:"先理解画面，再确定独立物体",description:"Claude 直接看源图，描述环境、光照和材质，筛选单个可分离实体。逐图分析合并后，确认要生成哪些物体。",input:"源图、用户要求与已有分析",actor:"image-blast-uncover / Claude",output:"source/ 的逐图 JSON、image.json、object.json",boundary:"默认没有专门的检测、深度或精确分割模型。文字位置证据也不是三维位姿；多图描述合并不等于多视角重建。",source:".claude/skills/image-blast-uncover/SKILL.md"},
    {category:"图片编辑模型",title:"先从背景里拿走要移动的东西",description:"如果花瓶要变成独立物体，就先从背景里移除它。图片编辑模型一次清理所有指定内容，得到 clean plate。",input:"原图、已经确认的移除物体清单",actor:"Nano Banana 2；GPT Image 2 可选",output:"source/ 中新编号的背景图片与请求记录",boundary:"这是生成式编辑，可能改变背景细节；提取质量和原图保真程度需要检查。它不是像素级无损抠图。",source:".claude/skills/image-blast-plate/SKILL.md"},
    {category:"World Labs / Marble 1.1",title:"生成环境外观，也取得碰撞几何",description:"把清理后的图片和空环境描述发送给 Marble。图片移除的物体也从文字中扣除，避免又被重新生成。",input:"背景图 + 扣除独立物体后的环境描述",actor:"generate-world.mjs / marble-1.1",output:".spz、碰撞 .glb、全景图、缩略图、world.json",boundary:"高斯泼溅负责外观，GLB 的来源字段是 collider_mesh_url。不能把整套输出等同于精细、逐面可编辑的传统场景模型。",source:".claude/scripts/world/generate-world.mjs"},
    {category:"图片编辑模型",title:"给每个物体准备一张干净参考图",description:"为花瓶、椅子等分别生成白底参考图，要求保持颜色、材质和比例，去除邻近、遮挡和放在其上的其他物体。",input:"原场景图 + 一个明确物体的提取提示",actor:"runImageEdit / 默认 Nano Banana 2",output:"单物体 PNG 与 image 请求记录",boundary:"默认图片编辑路径请求 1K、1:1。它仍可能补全或改变物体，不保证与原图形状完全一致；参考图正确时可以复用。",source:".claude/scripts/asset-pipeline/generate-single-asset.mjs"},
    {category:"Hunyuan / Meshy",title:"一张参考图，生成一个独立模型",description:"每个后台代理负责一个物体。脚本先检查已有模型或未完成任务，再复用、续查或发起新生成。",input:"单物体参考图 + 网格与材质参数",actor:"Hunyuan 3D 默认；Meshy v6 可选",output:"独立模型、材质等文件与 model 请求记录",boundary:"Hunyuan 默认 50,000 面、PBR、Normal；Meshy 默认 30,000 面，关闭绑定和动画。动态物体主要指刚体交互，不是自动角色动画。",source:".claude/scripts/asset-pipeline/hunyuan-3d.mjs"},
    {category:"ElevenLabs + FFmpeg",title:"按场景和材质，预先生成声音",description:"Claude 根据可见场景编写环境声描述，根据物体材质编写撞击声描述，再交给声音模型。非循环音频做静音处理和响度标准化。",input:"环境声描述 / 单物体材质与撞击描述",actor:"ElevenLabs Sound Effects v2 / FFmpeg",output:"默认两段 10 秒循环环境音；每物体四段 1 秒音效",boundary:"循环音频保留原始输出，避免破坏边界。声音主要在点击或抓取时触发，没有完整的碰撞冲量驱动声学系统。",source:".claude/scripts/sfx/fal-elevenlabs-sfx.mjs"},
    {category:"本地三维应用",title:"把资产放到一起，真正开始交互",description:"Vite 扫描本地文件，Three.js 组织场景，Spark 显示 splat，Rapier 负责重力与碰撞。用户在编辑器里调整位置、旋转、缩放。",input:"本地环境、独立 GLB、声音与保存的布局",actor:"React / Three.js / Spark / Rapier",output:"可浏览与操作的场景、scene.json",boundary:"无保存布局时物体默认网格排列，仍需人工调整。场景保存依赖本地开发接口，静态部署不会自动获得持久编辑后端。",source:"app/src/components/WorldViewer.tsx"}
  ];
  const stageButtons = [...document.querySelectorAll("[data-step]")];
  const previous = document.getElementById("previous-stage");
  const next = document.getElementById("next-stage");
  let selectedStage = 0;
  function showStage(index, focus = false) {
    selectedStage = Math.max(0, Math.min(stages.length - 1, index));
    const stage = stages[selectedStage];
    for (const key of ["category","title","description","input","actor","output","boundary"]) document.getElementById(`stage-${key}`).textContent = stage[key];
    document.getElementById("stage-count").textContent = `${String(selectedStage + 1).padStart(2,"0")} / 08`;
    document.getElementById("stage-source").href = upstream + stage.source;
    document.getElementById("stage-panel").setAttribute("aria-labelledby", `step-${selectedStage}`);
    stageButtons.forEach((button,i) => {button.classList.toggle("active",i === selectedStage);button.setAttribute("aria-selected",String(i === selectedStage));button.tabIndex = i === selectedStage ? 0 : -1;});
    previous.disabled = selectedStage === 0;
    next.disabled = selectedStage === stages.length - 1;
    if (focus) stageButtons[selectedStage].focus();
  }
  function tabKey(event, buttons, choose) {
    const current = buttons.indexOf(event.currentTarget);
    let index;
    if (["ArrowDown","ArrowRight"].includes(event.key)) index = (current + 1) % buttons.length;
    else if (["ArrowUp","ArrowLeft"].includes(event.key)) index = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === "Home") index = 0;
    else if (event.key === "End") index = buttons.length - 1;
    else return;
    event.preventDefault();
    choose(index);
    buttons[index].focus();
  }
  stageButtons.forEach((button,index) => {button.addEventListener("click",() => showStage(index));button.addEventListener("keydown",event => tabKey(event,stageButtons,showStage));});
  previous.addEventListener("click",() => showStage(selectedStage - 1,true));
  next.addEventListener("click",() => showStage(selectedStage + 1,true));
  const comparisons = {
    atlas:{kicker:"最接近的三维路线",title:"模型直接生成，还是用代码搭建？",leftTitle:"生成资产，再组合",left:"专用模型生成静态背景与独立物体，视觉细节很大程度由模型决定。布局和尺度仍需要调整。",project:"ATLAS / 月门水庭 · 1014 / 007",rightTitle:"看图写脚本，构建几何",right:"我们的月门水庭实验由 AI 理解参考图并编写 Blender Python，输出可编辑工程与 GLB，未调用专用图生三维服务。",takeaway:"规整建筑和布局适合参数化代码，有机道具可探索生成模型。两条路线均会补全不可见内容，都不能直接视作精确重建。",scope:"范围：Atlas 上游支持多条路线；这里只比较我们实际选用的脚本建模实验。该实验已有真实渲染与网页交互证据，image-blaster 本轮未实测生成。"},
    rap:{kicker:"最接近的多模型制作流程",title:"编排的价值，来自可检查和可返工。",leftTitle:"按环境、物体和声音拆分",left:"保留参考图、模型版本和请求 ID。已有模型可复用，未完成任务可续查，缺失文件可补下载。主流程缺少完整视觉和几何验收。",project:"ANCIENT-RAP-BATTLE · 1014 / 011",rightTitle:"按单句、镜头和时间轴拆分",right:"外部音乐与参考图交给视频生成流程，Python 管理素材候选、音轨筛查、可选嘴部检查、偏移和剪辑。检查结果仍需要人工判断。",takeaway:"工作流有价值的地方，是把失败限制在一个物体或一个镜头，并能定位原因、保留候选、局部重做。API 数量本身不是技术壁垒。",scope:"范围：古人说唱与 image-blaster 都完成源码研究和本地说明网页，付费生产尚未实测。没有据此比较成功率、最终质量或实际费用。"},
    aether:{kicker:"同样是 Skill，不同的能力承载",title:"让 AI 写代码，还是让 AI 生成媒体？",leftTitle:"模型直接生成场景资产",left:"Claude 负责理解和调度，三维细节主要来自 Marble、Hunyuan 等模型。审查重点是输入、资产、几何、布局和视觉一致性。",project:"AETHERVIZ MASTER · 本仓库 / 001",rightTitle:"模型编写课件的运行代码",right:"Skill 规定教学结构、Three.js、SVG 与公式展示；AI 写出代码后，浏览器计算方程、处理交互。我们的三个固定课件运行时不调用 AI。",takeaway:"两者都依赖外部模型，但可审查的对象不同。代码可直接检查方程与逻辑；生成媒体需要检查资产本身，不能用好看的画面替代正确性验证。",scope:"范围：AetherViz 上游是生成规范，三个课件是我们的研究实现。已验证固定案例，不代表任意主题一次生成成功；也不能据此证明 image-blaster 生成效果。"},
    doors:{kicker:"资产层与体验层的区别",title:"生成了一个世界，然后呢？",leftTitle:"提供场景和物体的起点",left:"能生成背景、道具、声音并提供基础浏览和抓取。故事、规则、目标和用户为什么留下来，仍需另行设计。",project:"随机门 · 1014 / 006 · 原创体验研究",rightTitle:"设计偶遇、回应与记忆",right:"本地原型用预制场景、人物与谜题实现随机开门、内容变化、手记和回访。原画在制作阶段生成，运行时不调用模型。",takeaway:"可以探索把生成资产接入随机门式体验，但好故事、可解挑战和回访动机不会随三维模型自动出现。资产生产与体验设计都需要独立验证。",scope:"范围：随机门当前以原画和交互层为主，并保留旧 Three.js 场景；不能把六处地点都描述为生成式可漫游三维世界。情绪与留存效果仍待体验研究。"}
  };
  const compareButtons = [...document.querySelectorAll("[data-compare]")];
  function showComparison(index) {
    const button = compareButtons[index];
    const data = comparisons[button.dataset.compare];
    for (const [key,id] of [["kicker","kicker"],["title","title"],["leftTitle","left-title"],["left","left"],["project","project"],["rightTitle","right-title"],["right","right"],["takeaway","takeaway"],["scope","scope"]]) document.getElementById(`compare-${id}`).textContent = data[key];
    compareButtons.forEach((item,i) => {item.classList.toggle("active",i === index);item.setAttribute("aria-selected",String(i === index));item.tabIndex = i === index ? 0 : -1;});
    document.getElementById("compare-panel").setAttribute("aria-labelledby",button.id);
  }
  compareButtons.forEach((button,index) => {button.addEventListener("click",() => showComparison(index));button.addEventListener("keydown",event => tabKey(event,compareButtons,showComparison));});
  const toggle = document.getElementById("toggle-evidence");
  const details = [...document.querySelectorAll(".source-list details")];
  function updateEvidenceToggle() {const allOpen = details.every(item => item.open);toggle.setAttribute("aria-expanded",String(allOpen));toggle.textContent = allOpen ? "收起全部证据 −" : "展开全部证据 ＋";}
  toggle.addEventListener("click",() => {const expand = !details.every(item => item.open);details.forEach(item => {item.open = expand;});updateEvidenceToggle();});
  details.forEach(item => item.addEventListener("toggle",updateEvidenceToggle));
})();
