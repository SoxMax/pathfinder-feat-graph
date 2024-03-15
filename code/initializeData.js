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
    sups.map(sup => sup.textContent).forEach(sup => supplements.add(sup))
  });
  console.log(supplements)
}

async function initializeGraph() {
  const feats = await fetch('data/Feats-19Jan2020.json').then(res => res.json());
  // findSupplements(feats);
  const nodes = feats.filter(feat => feat.type.toLowerCase() != "mythic")
    .map(feat => {
      feat.id = feat.name.toCamelCase();
      feat.prerequisite_feats = feat.prerequisite_feats.split(/(?:,|\|)+/).map(prereq => prerequisiteId(prereq)).filter(prereq => prereq);
      delete feat.style;
      delete feat.source;
      return feat;
    });
  const links = nodes.flatMap(feat => (feat.prerequisite_feats.map(prereq => ({ id: feat.id + '|' + prereq, source: prereq, target: feat.id }))));

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
