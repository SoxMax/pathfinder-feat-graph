const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in
  elements: fetch('data.json').then(res => res.json()),
  style: fetch('cy-style.json').then(res => res.json()),
  layout: { name: 'grid' },
  autoungrabify: true
})

