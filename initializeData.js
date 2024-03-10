String.prototype.toCamelCase = function toCamelCase() {
  return this.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
}

const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in
})

function prerequisiteId(prerequisite) {
  return prerequisite.trim()
    .replace(/ *\([^)]*\) */g, "") //removes paren content //camel case
    .toCamelCase()
}

async function initializeGraph() {
  const feats = await fetch('Feats-19Jan2020.json').then(res => res.json())
  const nodes = feats.filter(feat => feat.type.toLowerCase() != "mythic")
    .map(feat => {
      feat.id = feat.name.toCamelCase()
      feat.prerequisite_feats = feat.prerequisite_feats.split(/(?:,|\|)+/).map(prereq => prerequisiteId(prereq)).filter(prereq => prereq)
      delete feat.style
      return feat
    })
  const links = nodes.flatMap(feat => (feat.prerequisite_feats.map(prereq => ({ id: feat.id + '|' + prereq, source: prereq, target: feat.id }))))

  const duplicates = Map.groupBy(nodes, ({ id }) => id).entries().toArray().filter(entry => entry[1].length > 1)
  console.log("Duplicates", duplicates)
  console.log("Nodes", nodes, "Links", links)
  cy.add({ group: 'nodes', data: { id: "weaponProficiency", name: "Weapon Proficiency" } })
  cy.add(nodes.map(node => ({ group: 'nodes', data: node })))
  cy.add(links.map(link => ({ group: 'edges', data: link })))
  console.log(cy.json())
}

// initializeGraph()
