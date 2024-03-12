const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in
  elements: fetch('data/mst.json').then(res => res.json()),
  style: fetch('style/cy-style.json').then(res => res.json()),
  layout: { name: 'grid' },
  autoungrabify: true
});

const search = new autoComplete({
  selector: "#search",
  placeHolder: "Search...",
  data: {
    src: fetch('data/mst.json').then(res => res.json()).then(graphData => graphData.nodes.map(node => node.data.name))
  },
  resultItem: {
    highlight: true,
  },
  submit: true,
  events: {
    input: {
      selection: (event) => {
        const selection = event.detail.selection.value;
        search.input.value = selection;
      }
    }
  }
});

function searchFeats(featName) {
  const feats = cy.nodes(`[name @*= '${featName}']`);
  const feat = feats.first();
  const featNeighbors = feat.predecessors().union(feat.successors()).union(feat);
  cy.nodes().removeClass('visible');
  featNeighbors.nodes().addClass('visible');
  const dagre = {
    name: 'dagre',
    rankDir: 'LR',
    nodeSep: 50,
    rankSep: 150,
    nodeDimensionsIncludeLabels: true,
  };
  featNeighbors.layout(dagre).run();
}

function setFeatSection(featData, section) {
  const htmlSection = document.getElementById(`feat-${section}-section`);
  const htmlText = document.getElementById(`feat-${section}`);
  const sectionEntry = featData[section];
  if (sectionEntry) {
    htmlText.textContent = sectionEntry;
    htmlSection.hidden = false;
  } else {
    htmlSection.hidden = true;
  }
}

function displayFeat(featNode) {
  const featData = featNode.data();
  document.getElementById('feat-name').textContent = featData.name;
  setFeatSection(featData, 'description');
  setFeatSection(featData, 'prerequisites');
  setFeatSection(featData, 'benefit');
  setFeatSection(featData, 'normal');
  setFeatSection(featData, 'special');
  document.getElementById('feat-info').classList.remove('d-none');
}

document.getElementById('search').addEventListener("change", event => {
  searchFeats(event.target.value);
});

cy.on('select', 'node', function (event) {
  displayFeat(event.target);
});

cy.ready(event => {
  console.log("Graph Loaded!");
});
