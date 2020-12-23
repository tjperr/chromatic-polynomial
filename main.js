document.addEventListener("DOMContentLoaded", function () {
  var cy = (window.cy = cytoscape({
    container: document.getElementById("cy"),

    //   layout: {
    //     name: "avsdf",
    //     nodeSeparation: 120,
    //   },

    style: [
      {
        selector: "node",
        style: {
          label: "data(id)",
          "text-valign": "center",
          color: "#000000",
          "background-color": "#3a7ecf",
        },
      },

      {
        selector: "edge",
        style: {
          width: 2,
          "line-color": "#3a7ecf",
          opacity: 0.5,
        },
      },
    ],

    elements: {
      nodes: [
        { data: { id: "v1", weight: 1 } },
        { data: { id: "v2", weight: 2 } },
        { data: { id: "v3", weight: 3 } },
        { data: { id: "v4", weight: 4 } },
        { data: { id: "v5", weight: 5 } },
        { data: { id: "v6", weight: 6 } },
        { data: { id: "v7", weight: 7 } },
      ],
      edges: [
        { data: { source: "v1", target: "v2", directed: "false" } },
        { data: { source: "v1", target: "v4", directed: "false" } },
        // { data: { source: "v1", target: "v5", directed: "false" } },
        // { data: { source: "v2", target: "v4", directed: "false" } },
        { data: { source: "v2", target: "v6", directed: "false" } },
        // { data: { source: "v6", target: "v4", directed: "false" } },
        // { data: { source: "v3", target: "v7", directed: "false" } },
        // { data: { source: "v4", target: "v5", directed: "false" } },
        // { data: { source: "v4", target: "v7", directed: "false" } },
        // { data: { source: "v5", target: "v6", directed: "false" } },
        { data: { source: "v6", target: "v4", directed: "false" } },
        // { data: { source: "v6", target: "v3", directed: "false" } },
      ],
    },
  }));
  update();

  document.getElementById("randomize").addEventListener("click", function () {
    cy.nodes().forEach(function (ele) {
      ele.data().weight = Math.floor(Math.random() * 10 + 1);
    });

    var layout = cy.layout({
      name: "circle",
      animate: true,
      sort: function (a, b) {
        return a.data("weight") - b.data("weight");
      },
      radius: 120,
      animationDuration: 1000,
      animationEasing: "ease-in-out",
    });
    layout.run();
    update();
  });
});

function render(a) {
  var output = "P(G) = ";
  var index = a.length;
  a.reverse().forEach((term) => {
    if (term > 0) {
      if (index < a.length) {
        output += " + ";
      }
      if (term > 1) {
        output += term;
      }
      output += "x^" + index;
    }
    if (term < 0) {
      output += " - ";
      if (term < -1) {
        output += -term;
      }
      output += "x^" + index;
    }
    index--;
  });
  return output;
}

function describe(e) {
  return e.id();
}

function edgedescribe(e) {
  return [e.source().id(), e.target().id()];
}

function clone(x) {
  return JSON.parse(JSON.stringify(x));
}
function update() {
  var polynomial = [];
  for (var i = 0; i < cy.nodes().length; i++) {
    polynomial.push(0);
  }

  const nodes = cy.nodes().map(describe);
  const edges = cy.edges().map(edgedescribe);

  calculatePoly(nodes, edges);
  document.getElementById("poly").innerHTML = render(polynomial);

  function calculatePoly(nodes, edges, sign = 1) {
    console.log(JSON.stringify(nodes));
    console.log(JSON.stringify(edges));

    if (edges.length === 0) {
      console.log("adding " + sign + " x^" + nodes.length);
      polynomial[nodes.length - 1] += sign;
    } else {
      // deletion
      const edgeCopy = clone(edges);
      const edge = edgeCopy.pop();
      const x = edge[0];
      const y = edge[1];

      console.log("edge: " + x + " " + y);

      console.log("del");
      calculatePoly([...nodes], edgeCopy, sign);

      // contraction
      console.log("cont " + edge);

      console.log(JSON.stringify(nodes));
      const nodeCopy = [...nodes].filter((n) => {
        return n !== x;
      });

      const edgeContCopy = clone(edges);
      console.log(JSON.stringify(edgeContCopy));

      edgeContCopy.forEach((e) => {
        if (e[0] === x) {
          e[0] = y;
        } else {
          e[1] = y;
        }
      });

      // TODO
      // Edge list is weird at the first contraction, i.e. when performing the first cont
      // traction on the original graph. Incorrect poly for star with 4 vtcs and 4-cycle

      // remove loops
      const noLoops = edgeContCopy.filter((e) => {
        return e[0] !== e[1];
      });

      // remove multiple edges
      const edgeCopyReduced = [...new Set(noLoops.map(JSON.stringify))].map(
        JSON.parse
      );

      console.log("REDUCED");
      console.log(JSON.stringify(edgeCopyReduced));

      calculatePoly(nodeCopy, edgeCopyReduced, (sign = -1 * sign));
    }
  }
}
