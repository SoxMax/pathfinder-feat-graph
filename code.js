const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in
  elements: fetch('data.json').then(res => res.json())
})