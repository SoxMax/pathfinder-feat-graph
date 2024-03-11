const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in
  elements: fetch('mst.json').then(res => res.json()),
  style: fetch('cy-style.json').then(res => res.json()),
  layout: { name: 'grid' },
  autoungrabify: true
})

function searchFeats(featName) {
  const feats = cy.nodes(`[name @*= '${featName}']`)
  const feat = feats.first()
  const featNeighbors = feat.predecessors().union(feat.successors()).union(feat)
  cy.nodes().removeClass('visible')
  featNeighbors.nodes().addClass('visible')
  featNeighbors.layout({
    name: 'dagre',
    rankDir: 'LR',
    nodeSep: 50,
    rankSep: 150,
    nodeDimensionsIncludeLabels: true,
  }).run()
}

document.getElementById('search').addEventListener("change", event => {
  searchFeats(event.target.value)
})

function pruneNode(node) {
  const incomers = node.incomers()
  const depdeps = new Set()
  incomers.nodes().forEach(incomingFeat => {
    incomingFeat.incomers().nodes().forEach(ele => depdeps.add(ele.data('id')))
  })
  if (depdeps.size > 0) {
    const dupeEdges = incomers.filter(ele => ele.isEdge() && depdeps.has(ele.data('source'))).remove()
    incomers.difference(dupeEdges).forEach(remainingNode => pruneNode(remainingNode))
  }
}

function prunePrereqs(event) {
  cy.nodes().leaves().forEach(leaf => pruneNode(leaf))
  // cy.elements().addClass('visible').layout({name: 'concentric'}).run()
  console.log(cy.elements().jsons())
}

// cy.on("ready", prunePrereqs) 
