import { useEffect, useState } from "react";
import getMuQuasiBiclique from "../utils/getMuQuasiBiclique";
import * as d3 from "d3";
import * as cola from "webcola";
import Confluent from "../utils/confluent";

const linkGenerator = d3.linkVertical();
const useColaConfluent = (param, url) => {
  const [paths, setPaths] = useState([]);
  const [midNodes, setMidNodes] = useState([]);
  const [midNodesOrders, setMidNodesOrders] = useState();

  useEffect(() => {
    (async () => {
      const res = await fetch(url);
      const bipartite = await res.json();
      const cf = new Confluent(getMuQuasiBiclique);
      cf.build(param, bipartite, 0, 1, 0);
      cf.layeredNodes.sort((a, b) => {
        return a.h - b.h;
      });
      cf.bipartites.sort((a, b) => {
        return a.h - b.h;
      });

      const leftNodeNumber = bipartite.length;
      const rightNodeNumber = bipartite[0].length;
      const midLayerNumber = cf.layeredNodes.length;

      // //左右中間ノードの順序を初期化
      const leftNodesOrder = new Array();
      const rightNodesOrder = new Array();
      const midNodesOrders = new Array(); // 中間ノードの層と同じサイズ

      for (let i = 0; i < leftNodeNumber; i++) {
        leftNodesOrder.push(i);
      }

      for (let i = 0; i < rightNodeNumber; i++) {
        rightNodesOrder.push(i);
      }

      for (let i = 0; i < midLayerNumber; i++) {
        const midNodesOrder = new Array();
        for (let j = 0; j < cf.layeredNodes[i].maximalNodes.length; j++) {
          midNodesOrder.push(j);
        }
        midNodesOrders.push(midNodesOrder);
      }

      // 座標決定process
      const rightX = 1250;

      const d3cola = cola
        .d3adaptor(d3)
        .linkDistance(30)
        .size([2 * rightX, 1250]);

      //グラフのデータと制約を作る

      const graphEdges = new Array();
      const graphNodesSet = new Set();
      let pad = 0;
      for (let k = 0; k < cf.bipartites.length; k++) {
        const bipartite = cf.bipartites[k].bipartite;
        for (let i = 0; i < bipartite.length; i++) {
          for (let j = 0; j < bipartite[i].length; j++) {
            if (!bipartite[i][j]) continue;
            graphEdges.push({
              source: i + pad,
              target: j + pad + bipartite.length,
            });
            graphNodesSet.add(i + pad);
            graphNodesSet.add(j + pad + bipartite.length);
          }
        }
        pad += bipartite.length;
      }
      const graphNodes = Array.from(graphNodesSet)
        .sort((a, b) => a - b)
        .map((item) => {
          return { name: item };
        });

      const graphConstraints = new Array();
      let idx = 0;
      let prv = 0;
      let cur = 0;
      for (let k = 0; k < cf.bipartites.length; k++) {
        const leftNodesNum = cf.bipartites[k].bipartite.length;
        const rightNodesNum = cf.bipartites[k].bipartite[0].length;
        const constraint = { type: "alignment", axis: "y" };
        const offsets = new Array();

        if (k === 0) {
          const toffsets = new Array();
          const tconstraint = { type: "alignment", axis: "y" };
          for (let i = 0; i < leftNodesNum; i++) {
            toffsets.push({ node: String(idx++), offset: "0" });
          }

          tconstraint.offsets = toffsets;
          graphConstraints.push(tconstraint);

          cur = idx;
          graphConstraints.push({
            axis: "y",
            left: prv,
            right: cur,
            gap: 70,
            equality: "true",
          });
          prv = cur;
        }

        for (let i = 0; i < rightNodesNum; i++) {
          offsets.push({ node: String(idx++), offset: String(k + 1) });
        }
        constraint.offsets = offsets;
        graphConstraints.push(constraint);

        if (k === cf.bipartites.length - 1) continue;
        cur = idx;
        graphConstraints.push({
          axis: "y",
          left: prv,
          right: cur,
          gap: 70,
          equality: "true",
        });
        prv = cur;
      }

      const graph = new Object();
      graph.nodes = graphNodes;
      graph.edges = graphEdges;
      graph.constraints = graphConstraints;
      console.log(graph);
      d3cola
        .nodes(graph.nodes)
        .links(graph.edges)
        .constraints(graph.constraints)
        .symmetricDiffLinkLengths(30)
        .avoidOverlaps(true)
        .start(10, 15, 20);

      setMidNodes(graph.nodes);
      setPaths(
        graph.edges.map((d) => {
          return linkGenerator({
            source: [d.source.x, d.source.y],
            target: [d.target.x, d.target.y],
          });
        })
      );
      setMidNodesOrders(
        [leftNodesOrder, midNodesOrders.flat(), rightNodesOrder].flat()
      );
    })();
  }, [param, url]);

  return {
    paths,
    midNodes,
    midNodesOrders,
  };
};

export default useColaConfluent;