String.prototype.toCamelCase = function toCamelCase() {
  return this.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
};

const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in
});

function findSupplements(feats) {
  const supplements = new Set();
  feats.map(feat => feat.fulltext).forEach(html => {
    const container = document.createElement('div');
    container.innerHTML = html;
    const sups = Array.from(container.getElementsByTagName('sup'));
    sups.map(sup => sup.textContent).forEach(sup => supplements.add(sup));
  });
  console.log(supplements);
}

function idFromPrerequisiteFeat(prerequisite) {
  return prerequisite
    .replace(/ *\([^)]*\) */g, '') // removes paren content
    .trim()
    .toCamelCase();
}

function idFromPrerequisiteSkill(prerequisite) {
  return prerequisite
    .replace(/ *\([^)]*\) */g, '')
    .replace(/\d+/g, '') // removes numbers
    .trim()
    .toCamelCase();
}

function processRawFeat(feat) {
  feat.id = feat.name.toCamelCase();
  feat.prerequisite_feats = feat.prerequisite_feats.split(/(?:,|\|)+/).map(prereq => idFromPrerequisiteFeat(prereq)).filter(prereq => prereq);
  feat.prerequisite_skills = feat.prerequisite_skills.split(/(?:,|\|)+/).map(prereq => idFromPrerequisiteSkill(prereq)).filter(prereq => prereq);
  return feat;
}

function generateFeatNode(feat) {
  const categories = [];
  const featType = feat.type.toLowerCase();
  if (featType != "general") {
    categories.push(feat.type);
  }
  if (feat.teamwork) {
    categories.push("Teamwork");
  }
  if (feat.critical) {
    categories.push("Critical");
  }
  if (feat.grit) {
    categories.push("Grit");
  }
  if (feat.style) {
    categories.push("Style");
  }
  if (feat.performance) {
    categories.push("Performance");
  }
  if (feat.panache) {
    categories.push("Panache");
  }
  if (feat.betrayal) {
    categories.push("Betrayal");
  }
  if (feat.targeting) {
    categories.push("Targeting");
  }
  if (feat.esoteric) {
    categories.push("Esoteric");
  }
  if (feat.stare) {
    categories.push("Stare");
  }
  if (feat.weapon_mastery) {
    categories.push("Weapon Mastery");
  }
  if (feat.item_mastery) {
    categories.push("Item Mastery");
  }
  if (feat.armor_mastery) {
    categories.push("Armor Mastery");
  }
  if (feat.shield_mastery) {
    categories.push("Shield Mastery");
  }
  if (feat.blood_hex) {
    categories.push("Blood Hex");
  }
  if (feat.trick) {
    categories.push("Trick");
  }
  if (categories.length == 0) {
    categories.push(feat.type);
  }

  return {
    id: feat.id,
    name: feat.name,
    type: "feat",
    categories: categories,
    prerequisites: feat.prerequisites,
    description: feat.description,
    benefit: feat.benefit,
    normal: feat.normal,
    special: feat.special,
    goal: feat.goal,
    completionBenefit: feat.completion_benefit,
    note: feat.note,
    printSource: feat.source,
  };
}

function generateSkillNode(skill) {
  skill.type = "skill";
  return skill;
}

async function initializeGraph() {
  const rawFeats = await fetch('data/Feats-19Jan2020.json').then(res => res.json());
  const rawSkills = await fetch('data/Skills-17Mar2024.json').then(res => res.json());
  // findSupplements(feats);
  const feats = rawFeats.filter(feat => feat.type.toLowerCase() != "mythic").map(feat => processRawFeat(feat));
  const featNodes = feats.map(feat => generateFeatNode(feat));
  const skillNodes = rawSkills.map(skill => generateSkillNode(skill));
  const featLinks = feats.flatMap(feat => (feat.prerequisite_feats.map(prereq => ({ id: feat.id + '|' + prereq, source: prereq, target: feat.id }))));
  const skillLinks = feats.flatMap(feat => (feat.prerequisite_skills.map(prereq => ({ id: feat.id + '|' + prereq, source: prereq, target: feat.id }))));

  // check for duplicate feats
  // const duplicates = Map.groupBy(feats, ({ id }) => id).entries().toArray().filter(entry => entry[1].length > 1);
  // console.log("Duplicates", duplicates);
  cy.add({ group: 'nodes', data: { id: "weaponProficiency", name: "Weapon Proficiency" } });
  cy.add(featNodes.map(node => ({ group: 'nodes', data: node })));
  cy.add(skillNodes.map(node => ({ group: 'nodes', data: node })));
  cy.add(featLinks.map(link => ({ group: 'edges', data: link })));
  cy.add(skillLinks.map(link => ({ group: 'edges', data: link })));
}

function pruneNode(node) {
  const incomers = node.incomers();
  const depdeps = new Set();
  incomers.nodes().forEach(incomingFeat => {
    incomingFeat.incomers().nodes().forEach(ele => depdeps.add(ele.data('id')));
  });
  if (depdeps.size > 0) {
    const dupeEdges = incomers.filter(ele => ele.isEdge() && depdeps.has(ele.data('source'))).remove();
    incomers.difference(dupeEdges).forEach(remainingNode => pruneNode(remainingNode));
  }
}

function pruneLinks() {
  cy.nodes().leaves().forEach(leaf => pruneNode(leaf));
  // cy.elements().addClass('visible').layout({name: 'concentric'}).run();
}

function minimumExport(cyExport) {
  return {
    nodes: cyExport.elements.nodes.map(ele => ({ data: ele.data })),
    edges: cyExport.elements.edges.map(ele => ({ data: ele.data }))
  };
}

async function main() {
  await initializeGraph();
  const initialized = minimumExport(cy.json(false));
  console.log("Initialized", initialized);
  pruneLinks();
  const pruned = minimumExport(cy.json(false));
  console.log("Pruned", pruned);
}

main();
