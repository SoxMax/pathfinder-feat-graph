const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in
  elements: fetch('data.json').then(res => res.json()),
  style: fetch('cy-style.json').then(res => res.json()),
  layout: { name: 'grid' },
  autoungrabify: true
})

function findFeats(featName) {
  return cy.nodes(`[name @*= '${featName}']`)
}

document.getElementById('search').addEventListener("change", event => {
  const feats = findFeats(event.target.value)
  console.log(feats.jsons())
})
