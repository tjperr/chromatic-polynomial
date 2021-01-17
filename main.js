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
        { data: { id: "1" } },
        { data: { id: "2" } },
        { data: { id: "3" } },
        { data: { id: "4" } },
        { data: { id: "5" } },
        { data: { id: "6" } },
        { data: { id: "7" } },
      ],
      edges: [
        { data: { source: "1", target: "2", directed: "false" } },
        { data: { source: "1", target: "4", directed: "false" } },
        { data: { source: "1", target: "3", directed: "false" } },
        { data: { source: "2", target: "4", directed: "false" } },
        { data: { source: "4", target: "3", directed: "false" } },
        { data: { source: "2", target: "3", directed: "false" } },
        { data: { source: "3", target: "7", directed: "false" } },
        { data: { source: "4", target: "5", directed: "false" } },
        { data: { source: "4", target: "7", directed: "false" } },
        { data: { source: "1", target: "6", directed: "false" } },
        { data: { source: "6", target: "4", directed: "false" } },
        { data: { source: "6", target: "3", directed: "false" } },
      ],
    },
  }));
  document.getElementById("poly").innerHTML = "Press Calculate";

  document.getElementById("calculate").addEventListener("click", function () {
    document.getElementById("poly").innerHTML = "Calculating...";
    update();
  });

  document.getElementById("delete").addEventListener("click", function () {
    cy.remove(cy.nodes());
  });

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
  });

  cy.on("tap", function (event) {
    document.getElementById("poly").innerHTML = "Press Calculate";
    // target holds a reference to the originator
    // of the event (core or element)
    var evtTarget = event.target;

    if (evtTarget === cy) {
      // tap on background
      var maxId;
      if (cy.nodes().map(describe).length === 0) {
        maxId = 0;
      } else {
        maxId = Math.max(...cy.nodes().map(describe).map(parseFloat));
      }
      cy.add({
        group: "nodes",
        data: { id: maxId + 1 },
        position: event.position,
      });
    } else if (evtTarget.group() === "nodes") {
      // Tap on node
      console.log("tap on node" + evtTarget.id());

      // If already tapped a different node
      if (edgeStart) {
        const a = edgeStart.id();
        const b = evtTarget.id();
        edgeStart = null; // reset the edge start

        // If not a loop and not already there
        if (
          (cy.edges(`edge[source="${a}"][target="${b}"]`).length === 0) &
          (cy.edges(`edge[source="${b}"][target="${a}"]`).length === 0)
        ) {
          if (a != b) {
            cy.add({
              group: "edges",
              data: { source: a, target: b },
            });
            console.log("added " + a + " " + b);
          }
        }
      } else {
        edgeStart = evtTarget;
      }
    }
  });
});

var edgeStart = null; // records first node when adding an edge

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
    // console.log(JSON.stringify(nodes));
    // console.log(JSON.stringify(edges));

    if (edges.length === 0) {
      // console.log("adding " + sign + " x^" + nodes.length);
      polynomial[nodes.length - 1] += sign;
    } else {
      // deletion
      const edgeCopy = clone(edges);
      const edge = clone(edgeCopy.pop());
      const x = edge[0];
      const y = edge[1];

      // console.log("edge: " + x + " " + y);

      // console.log("del");
      calculatePoly([...nodes], edgeCopy, sign);

      // contraction
      // console.log("cont " + edge);

      // console.log(JSON.stringify(nodes));
      const nodeCopy = [...nodes].filter((n) => {
        return n !== x;
      });

      const edgeContCopy = clone(edges);
      // console.log(JSON.stringify(edgeContCopy));

      edgeContCopy.forEach((e) => {
        if (e[0] === x) {
          e[0] = y;
        } else if (e[1] === x) {
          e[1] = y;
        }
      });

      // console.log("ADJUSTMENT");
      // console.log(JSON.stringify(edgeContCopy));

      // remove loops
      const noLoops = edgeContCopy
        .filter((e) => {
          return e[0] !== e[1];
        })
        .map((e) => {
          // always order edges in the same way to
          // aid removal of multiple edges
          if (e[0] < e[1]) {
            return e;
          } else {
            return [e[1], e[0]];
          }
        });

      // console.log("NO LOOPS");
      // console.log(JSON.stringify(noLoops));

      noLoops.ma;
      // remove multiple edges
      const edgeCopyReduced = [...new Set(noLoops.map(JSON.stringify))].map(
        JSON.parse
      );

      // console.log("REDUCED");
      // console.log(JSON.stringify(edgeCopyReduced));

      calculatePoly(nodeCopy, edgeCopyReduced, (sign = -1 * sign));
    }
  }
}

// Works for:
// P1, P2, P3, P4
// S3, S4
// C3, C4, C5
// K4
