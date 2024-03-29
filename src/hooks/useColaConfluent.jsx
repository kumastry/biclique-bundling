import { useEffect, useState } from "react";
import colaConfluent from "../logic/colaConfluent";
import { getBipartiteDensity } from "./../utils/getBipartiteDensity";
/*
 confluent drawingに対しての準バイクリークが妥当がどうか
 depth = 1は普通の準バイクリークによるエッジバンドリングである。
 depth = 1 と depth >= 2のdrawing結果で比較する→ depth > 2でdepth=1と上下ノードが同じようにリンクしているならばアルゴリズムは妥当

*/
const useColaConfluent = (param, url, maxDepth) => {
  const [paths, setPaths] = useState([]);
  const [crossCount, setCrossCount] = useState(0);
  const [nodes, setNodes] = useState([]);
  const [nodeLabels, setNodeLabels] = useState();

  useEffect(() => {
    (async () => {
      const res = await fetch(url);
      const bipartite = await res.json();

      const parameter =
        param < 0 || param > 1.0
          ? (1.0 + getBipartiteDensity(bipartite)) / 2
          : param;

      const {
        cross,
        leftNodesOrder,
        midNodesOrders,
        rightNodesOrder,
        edgePaths,
        graph,
        edgeColors,
        edgeWidthes,
      } = colaConfluent(bipartite, parameter, maxDepth, true);

      setCrossCount(cross);
      setNodes(graph.nodes);
      setPaths(
        edgePaths.map((path, key) => {
          return { path, color: edgeColors[key], width: edgeWidthes[key] };
        })
      );
      setNodeLabels(
        [...leftNodesOrder, ...midNodesOrders, ...rightNodesOrder].flat()
      );
    })();
  }, [param, url, maxDepth]);

  return {
    paths,
    nodes,
    nodeLabels,
    crossCount,
  };
};

export default useColaConfluent;
