String.prototype.toCamelCase = function toCamelCase() {
  return this.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
};

const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in
  elements: fetch('data/mst.json').then(res => res.json()),
  style: fetch('style/cy-style.json').then(res => res.json()),
  layout: { name: 'null' },
  autoungrabify: true,
  minZoom: 0.2,
  maxZoom: 5,
  wheelSensitivity: 0.5,
  selectionType: "single"
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
        searchFeats(selection);
      }
    }
  }
});

document.getElementById('search').addEventListener("search", event => {
  searchFeats(event.target.value);
});

function removeSplashScreen() {
  const splashScreen = document.getElementById("splash");
  if (splashScreen) {
    splashScreen.remove();
  }
}

function searchFeats(featName) {
  removeSplashScreen();
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

function setFeatSection(displayText, section) {
  const htmlSection = document.getElementById(`feat-${section}-section`);
  const htmlText = document.getElementById(`feat-${section}`);
  if (displayText) {
    htmlText.textContent = displayText;
    htmlSection.hidden = false;
  } else {
    htmlSection.hidden = true;
  }
}

function displayFeat(featNode) {
  const featData = featNode.data();
  document.getElementById('feat-name').textContent = featData.name;
  setFeatSection(featData.categories.join(", "), 'categories');
  setFeatSection(featData.description, 'description');
  setFeatSection(featData.prerequisites, 'prerequisites');
  setFeatSection(featData.benefit, 'benefit');
  setFeatSection(featData.normal, 'normal');
  setFeatSection(featData.special, 'special');
  setFeatSection(featData.goal, 'goal');
  setFeatSection(featData.completionBenefit, 'completion');
  setFeatSection(featData.note, 'note');
  document.getElementById('feat-info').classList.remove('d-none');
  featNode.neighborhood('edge').select();
}

cy.on('select', 'node', function (event) {
  displayFeat(event.target);
});

cy.on('unselect', 'node', function (event) {
  document.getElementById('feat-info').classList.add('d-none');
});

cy.ready(event => {
  console.log("Graph Loaded!");
});
