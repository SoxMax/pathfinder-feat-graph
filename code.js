const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in
  elements: fetch('data.json').then(res => res.json()),
  style: fetch('cy-style.json').then(res => res.json()),
  layout: { name: 'grid' },
  autoungrabify: true
})

function findFeats(featName) {
  return cy.filter(function (element, i) {
    return element.isNode() && element.data('name').toLowerCase().includes(featName);
  });
}

document.getElementById('search').addEventListener("change", event => {
  const feats = findFeats(event.target.value)
  console.log(feats.jsons())
})
