String.prototype.toCamelCase = function toCamelCase() {
  return this.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
};

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
  submit: false,
  events: {
    input: {
      selection: (event) => {
        const selection = event.detail.selection.value;
        search.input.value = selection;
        searchFeats(selection);
      }
    }
  }
});

function searchFeats(featName) {
  const feat = cy.getElementById(featName.toCamelCase());
  const featTree = feat.predecessors().union(feat.successors()).union(feat);
  cy.nodes().removeClass('visible');
  featTree.nodes().addClass('visible');
  const dagre = {
    name: 'dagre',
    rankDir: 'LR',
    nodeSep: 50,
    rankSep: 150,
    nodeDimensionsIncludeLabels: true,
  };
  featTree.layout(dagre).run();
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
  featNode.neighborhood('edge').select();
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
