String.prototype.toCamelCase = function toCamelCase() {
  return this.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
};

const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in
});

function prerequisiteId(prerequisite) {
  return prerequisite.trim()
    .replace(/ *\([^)]*\) */g, "") //removes paren content //camel case
    .toCamelCase();
}

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

function processRawFeat(feat) {
  const categories = [];
  const featType = feat.type.toLowerCase();
  if (featType != "general") {
    categories.push(feat.type);
  }
  if (feat.teamwork) {
    categories.push("Teamwork");
  } else if (feat.critical) {
    categories.push("Critical");
  } else if (feat.grit) {
    categories.push("Grit");
  } else if (feat.style) {
    categories.push("Style");
  } else if (feat.performance) {
    categories.push("Performance");
  } else if (feat.panache) {
    categories.push("Panache");
  } else if (feat.betrayal) {
    categories.push("Betrayal");
  } else if (feat.targeting) {
    categories.push("Targeting");
  } else if (feat.esoteric) {
    categories.push("Esoteric");
  } else if (feat.stare) {
    categories.push("Stare");
  } else if (feat.weapon_mastery) {
    categories.push("Weapon Mastery");
  } else if (feat.item_mastery) {
    categories.push("Item Mastery");
  } else if (feat.armor_mastery) {
    categories.push("Armor Mastery");
  } else if (feat.shield_mastery) {
    categories.push("Shield Mastery");
  } else if (feat.blood_hex) {
    categories.push("Blood Hex");
  } else if (feat.trick) {
    categories.push("Trick");
  }
  if (categories.length = 0) {
    categories.push(feat.type);
  }

  return {
    id: feat.name.toCamelCase(),
    name: feat.name,
    categories: categories,
    prerequisites: feat.prerequisites,
    prerequisiteFeats: feat.prerequisite_feats.split(/(?:,|\|)+/).map(prereq => prerequisiteId(prereq)).filter(prereq => prereq),
    description: feat.description,
    benefit: feat.benefit,
    normal: feat.normal,
    special: feat.special,
    goal: feat.goal,
    note: feat.note,
    printSource: feat.source,
  };
}

async function initializeGraph() {
  const feats = await fetch('data/Feats-19Jan2020.json').then(res => res.json());
  // findSupplements(feats);
  const nodes = feats.filter(feat => feat.type.toLowerCase() != "mythic")
    .map(feat => processRawFeat(feat));
  const links = nodes.flatMap(feat => (feat.prerequisiteFeats.map(prereq => ({ id: feat.id + '|' + prereq, source: prereq, target: feat.id }))));

  const duplicates = Map.groupBy(nodes, ({ id }) => id).entries().toArray().filter(entry => entry[1].length > 1);
  console.log("Duplicates", duplicates);
  cy.add({ group: 'nodes', data: { id: "weaponProficiency", name: "Weapon Proficiency" } });
  cy.add(nodes.map(node => ({ group: 'nodes', data: node })));
  cy.add(links.map(link => ({ group: 'edges', data: link })));
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
