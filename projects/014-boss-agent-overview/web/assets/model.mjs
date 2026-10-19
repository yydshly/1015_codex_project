// Welfare matching adapted from boss-agent-cli, Copyright (c) 2026 can4hou6joeng4.
// MIT license: ./boss-agent-cli-MIT.txt; snapshot 4716ee1d211533db70ac7cc1ab2322eb269b43a0.
// Career aggregation below is original research prototype code, not an upstream feature.
export function welfareMatches(conditions, tags, description, keywords) {
  const text = tags.join(' ');
  const result = [];
  for (const label of conditions) {
    const words = keywords[label] ?? [label];
    if (words.some(word => text.includes(word))) result.push(`${label}(标签)`);
    else if (description && words.some(word => `${text} ${description}`.includes(word))) result.push(`${label}(描述)`);
    else return [];
  }
  return result;
}

export function shortlist(jobs, {city, conditions}, keywords) {
  return jobs.filter(job => !city || job.city === city).map(job => ({...job, matches:welfareMatches(conditions,job.tags,job.description,keywords)})).filter(job => !conditions.length || job.matches.length);
}

export function careerProfile(samples, direction, selectedSkills = []) {
  const jobs = samples.filter(job => job.direction === direction);
  const skillMap = new Map();
  const taskMap = new Map();
  for (const job of jobs) {
    for (const skill of new Set(job.skills)) {
      const evidence = skillMap.get(skill) ?? [];
      evidence.push(job.id);
      skillMap.set(skill,evidence);
    }
    for (const task of new Set(job.tasks)) taskMap.set(task,(taskMap.get(task) ?? 0) + 1);
  }
  const skills = [...skillMap].map(([skill,evidence]) => ({skill,count:evidence.length,total:jobs.length,evidence,selected:selectedSkills.includes(skill)})).sort((a,b) => b.count-a.count || a.skill.localeCompare(b.skill,'en'));
  const tasks = [...taskMap].map(([task,count]) => ({task,count})).sort((a,b) => b.count-a.count || a.task.localeCompare(b.task,'zh'));
  return {jobs, sampleCount:jobs.length, skills, tasks, toExplore:skills.filter(skill => !skill.selected)};
}
