import React, { Component } from "react";
import Node from "./Node/Node";
import { dijkstra } from "../Algorithms/dijkstra";
import { astar } from "../Algorithms/astar";
import { dfs } from "../Algorithms/dfs";
import { bfs } from "../Algorithms/bfs";
import { bogo } from "../Algorithms/bogo";
import { spread } from "../Algorithms/spread";

import "./PathfindingVisualizer.css";

export default class PathfindingVisualizer extends Component {
  constructor() {
    super();
    this.state = {
      grid: [],
      START_NODE_ROW: 5,
      FINISH_NODE_ROW: 9,
      START_NODE_COL: 5,
      FINISH_NODE_COL: 19,
      mouseIsPressed: false,
      ROW_COUNT: 25,
      COLUMN_COUNT: 35,
      MOBILE_ROW_COUNT: 10,
      MOBILE_COLUMN_COUNT: 20,
      isRunning: false,
      isStartNode: false,
      isFinishNode: false,
      isWallNode: false, // xxxxxxx
      currRow: 0,
      currCol: 0,
      isDesktopView: true,
      algoNum: 0,
    };

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.toggleIsRunning = this.toggleIsRunning.bind(this);
  }

  componentDidMount() {
    const grid = this.getInitialGrid();
    this.setState({ grid });
  }

  toggleIsRunning() {
    this.setState({ isRunning: !this.state.isRunning });
  }

  toggleView() {
    if (!this.state.isRunning) {
      this.clearGrid();
      this.clearWalls();
      const isDesktopView = !this.state.isDesktopView;
      let grid;
      if (isDesktopView) {
        grid = this.getInitialGrid(
          this.state.ROW_COUNT,
          this.state.COLUMN_COUNT
        );
        this.setState({ isDesktopView, grid });
      } else {
        if (
          this.state.START_NODE_ROW > this.state.MOBILE_ROW_COUNT ||
          this.state.FINISH_NODE_ROW > this.state.MOBILE_ROW_COUNT ||
          this.state.START_NODE_COL > this.state.MOBILE_COLUMN_COUNT ||
          this.state.FINISH_NODE_COL > this.state.MOBILE_COLUMN_COUNT
        ) {
          alert("Start & Finish Nodes Must Be within 10 Rows x 20 Columns");
        } else {
          grid = this.getInitialGrid(
            this.state.MOBILE_ROW_COUNT,
            this.state.MOBILE_COLUMN_COUNT
          );
          this.setState({ isDesktopView, grid });
        }
      }
    }
  }

  /******************** Set up the initial grid ********************/
  getInitialGrid = (
    rowCount = this.state.ROW_COUNT,
    colCount = this.state.COLUMN_COUNT
  ) => {
    const initialGrid = [];
    for (let row = 0; row < rowCount; row++) {
      const currentRow = [];
      for (let col = 0; col < colCount; col++) {
        currentRow.push(this.createNode(row, col));
      }
      initialGrid.push(currentRow);
    }
    return initialGrid;
  };

  createNode = (row, col) => {
    return {
      row,
      col,
      isStart:
        row === this.state.START_NODE_ROW && col === this.state.START_NODE_COL,
      isFinish:
        row === this.state.FINISH_NODE_ROW &&
        col === this.state.FINISH_NODE_COL,
      distance: Infinity,
      distanceToFinishNode:
        Math.abs(this.state.FINISH_NODE_ROW - row) +
        Math.abs(this.state.FINISH_NODE_COL - col),
      isVisited: false,
      isWall: false,
      previousNode: null,
      isNode: true,
    };
  };

  /******************** Control mouse events ********************/
  handleMouseDown(row, col) {
    if (!this.state.isRunning) {
      if (this.isGridClear()) {
        if (
          document.getElementById(`node-${row}-${col}`).className ===
          "node node-start"
        ) {
          this.setState({
            mouseIsPressed: true,
            isStartNode: true,
            currRow: row,
            currCol: col,
          });
        } else if (
          document.getElementById(`node-${row}-${col}`).className ===
          "node node-finish"
        ) {
          this.setState({
            mouseIsPressed: true,
            isFinishNode: true,
            currRow: row,
            currCol: col,
          });
        } else {
          const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
          this.setState({
            grid: newGrid,
            mouseIsPressed: true,
            isWallNode: true,
            currRow: row,
            currCol: col,
          });
        }
      } else {
        this.clearGrid();
      }
    }
  }

  isGridClear() {
    for (const row of this.state.grid) {
      for (const node of row) {
        const nodeClassName = document.getElementById(
          `node-${node.row}-${node.col}`
        ).className;
        if (
          nodeClassName === "node node-visited" ||
          nodeClassName === "node node-shortest-path"
        ) {
          return false;
        }
      }
    }
    return true;
  }

  handleMouseEnter(row, col) {
    if (!this.state.isRunning) {
      if (this.state.mouseIsPressed) {
        const nodeClassName = document.getElementById(
          `node-${row}-${col}`
        ).className;
        if (this.state.isStartNode) {
          if (nodeClassName !== "node node-wall") {
            const prevStartNode =
              this.state.grid[this.state.currRow][this.state.currCol];
            prevStartNode.isStart = false;
            document.getElementById(
              `node-${this.state.currRow}-${this.state.currCol}`
            ).className = "node";

            this.setState({ currRow: row, currCol: col });
            const currStartNode = this.state.grid[row][col];
            currStartNode.isStart = true;
            document.getElementById(`node-${row}-${col}`).className =
              "node node-start";
          }
          this.setState({ START_NODE_ROW: row, START_NODE_COL: col });
        } else if (this.state.isFinishNode) {
          if (nodeClassName !== "node node-wall") {
            const prevFinishNode =
              this.state.grid[this.state.currRow][this.state.currCol];
            prevFinishNode.isFinish = false;
            document.getElementById(
              `node-${this.state.currRow}-${this.state.currCol}`
            ).className = "node";

            this.setState({ currRow: row, currCol: col });
            const currFinishNode = this.state.grid[row][col];
            currFinishNode.isFinish = true;
            document.getElementById(`node-${row}-${col}`).className =
              "node node-finish";
          }
          this.setState({ FINISH_NODE_ROW: row, FINISH_NODE_COL: col });
        } else if (this.state.isWallNode) {
          const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
          this.setState({ grid: newGrid });
        }
      }
    }
  }

  handleMouseUp(row, col) {
    if (!this.state.isRunning) {
      this.setState({ mouseIsPressed: false });
      if (this.state.isStartNode) {
        const isStartNode = !this.state.isStartNode;
        this.setState({
          isStartNode,
          START_NODE_ROW: row,
          START_NODE_COL: col,
        });
      } else if (this.state.isFinishNode) {
        const isFinishNode = !this.state.isFinishNode;
        this.setState({
          isFinishNode,
          FINISH_NODE_ROW: row,
          FINISH_NODE_COL: col,
        });
      }
      this.getInitialGrid();
    }
  }

  handleMouseLeave() {
    if (this.state.isStartNode) {
      const isStartNode = !this.state.isStartNode;
      this.setState({ isStartNode, mouseIsPressed: false });
    } else if (this.state.isFinishNode) {
      const isFinishNode = !this.state.isFinishNode;
      this.setState({ isFinishNode, mouseIsPressed: false });
    } else if (this.state.isWallNode) {
      const isWallNode = !this.state.isWallNode;
      this.setState({ isWallNode, mouseIsPressed: false });
      this.getInitialGrid();
    }
  }

  /******************** Clear Board/Walls ********************/

  clearGrid() {
    if (!this.state.isRunning) {
      const newGrid = this.state.grid.slice();
      for (const row of newGrid) {
        for (const node of row) {
          let nodeClassName = document.getElementById(
            `node-${node.row}-${node.col}`
          ).className;
          if (
            nodeClassName !== "node node-start" &&
            nodeClassName !== "node node-finish" &&
            nodeClassName !== "node node-wall"
          ) {
            document.getElementById(`node-${node.row}-${node.col}`).className =
              "node";
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode =
              Math.abs(this.state.FINISH_NODE_ROW - node.row) +
              Math.abs(this.state.FINISH_NODE_COL - node.col);
          }
          if (nodeClassName === "node node-finish") {
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode = 0;
          }
          if (nodeClassName === "node node-start") {
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode =
              Math.abs(this.state.FINISH_NODE_ROW - node.row) +
              Math.abs(this.state.FINISH_NODE_COL - node.col);
            node.isStart = true;
            node.isWall = false;
            node.previousNode = null;
            node.isNode = true;
          }
        }
      }
    }
  }

  clearWalls() {
    if (!this.state.isRunning) {
      const newGrid = this.state.grid.slice();
      for (const row of newGrid) {
        for (const node of row) {
          let nodeClassName = document.getElementById(
            `node-${node.row}-${node.col}`
          ).className;
          if (nodeClassName === "node node-wall") {
            document.getElementById(`node-${node.row}-${node.col}`).className =
              "node";
            node.isWall = false;
          }
        }
      }
    }
  }

  /******************** Create Animations ********************/
  visualize(algo) {
    if (!this.state.isRunning) {
      this.clearGrid();
      this.toggleIsRunning();
      const { grid } = this.state;
      const startNode =
        grid[this.state.START_NODE_ROW][this.state.START_NODE_COL];
      const finishNode =
        grid[this.state.FINISH_NODE_ROW][this.state.FINISH_NODE_COL];
      let visitedNodesInOrder;
      switch (algo) {
        case "Dijkstra":
          visitedNodesInOrder = dijkstra(grid, startNode, finishNode);
          this.setState({ algoNum: 0 });
          break;
        case "AStar":
          visitedNodesInOrder = astar(grid, startNode, finishNode);
          this.setState({ algoNum: 1 });
          break;
        case "BFS":
          visitedNodesInOrder = bfs(grid, startNode, finishNode);
          this.setState({ algoNum: 2 });
          break;
        case "DFS":
          visitedNodesInOrder = dfs(grid, startNode, finishNode);
          this.setState({ algoNum: 3 });
          break;
        case "Bogo":
          visitedNodesInOrder = bogo(grid, startNode, finishNode);
          this.setState({ algoNum: 4 });
          break;
        case "Spread":
          visitedNodesInOrder = spread(grid, startNode, finishNode);
          this.setState({ algoNum: 5 });
          break;
        default:
          // should never get here
          break;
      }
      const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
      nodesInShortestPathOrder.push("end");
      this.animate(visitedNodesInOrder, nodesInShortestPathOrder);
    }
  }

  animate(visitedNodesInOrder, nodesInShortestPathOrder) {
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        setTimeout(() => {
          this.animateShortestPath(nodesInShortestPathOrder);
        }, 10 * i);
        return;
      }
      setTimeout(() => {
        const node = visitedNodesInOrder[i];
        const nodeClassName = document.getElementById(
          `node-${node.row}-${node.col}`
        ).className;
        if (
          nodeClassName !== "node node-start" &&
          nodeClassName !== "node node-finish"
        ) {
          document.getElementById(`node-${node.row}-${node.col}`).className =
            "node node-visited";
        }
      }, 10 * i);
    }
  }

  /******************** Create path from start to finish ********************/
  animateShortestPath(nodesInShortestPathOrder) {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      if (nodesInShortestPathOrder[i] === "end") {
        setTimeout(() => {
          this.toggleIsRunning();
        }, i * 50);
      } else {
        setTimeout(() => {
          const node = nodesInShortestPathOrder[i];
          const nodeClassName = document.getElementById(
            `node-${node.row}-${node.col}`
          ).className;
          if (
            nodeClassName !== "node node-start" &&
            nodeClassName !== "node node-finish"
          ) {
            document.getElementById(`node-${node.row}-${node.col}`).className =
              "node node-shortest-path";
          }
        }, i * 40);
      }
    }
  }

  render() {
    const { grid, mouseIsPressed } = this.state;
    const Algos = {
      titles: [
        "Dijkstra's Shortest Path Algorithm",
        "A* Search Algorithm",
        "Breadth First Search",
        "Depth First Search",
        "Bogo Search",
        "Random Spread",
      ],
      descriptions: [
        "Dijkstra’s Algorithm works by visiting vertices in the graph starting with the object’s starting point. It is guaranteed to find a shortest path from the starting point to the goal.",
        "A* is just like Dijkstra, the only difference is that A* tries to look for a better path by using a heuristic function which gives priority to nodes that are supposed to be better than others while Dijkstra's just explore all possible paths. A* Search will always guarantee the shortest path.",
        "We say that BFS is the algorithm to use if we want to find the shortest path in an undirected, unweighted graph. The claim for BFS is that the first time a node is discovered during the traversal, that distance from the source would give us the shortest path.",
        "Depth First Search (DFS) algorithm traverses a graph in a depthward motion and uses a stack to remember to get the next vertex to start a search, when a dead end occurs in any iteration. It does NOT guarantee the shortest path",
        "Search Algorithm inspired by the infamous BogoSort. Has no real life application. Definitely does NOT guarantee the shortest path.",
        "Based on Bogo Search. Spreads out randomly rather than traversing like a snake. Definitely does NOT guarantee the shortest path.",
      ],
      links: [
        "https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm",
        "https://en.wikipedia.org/wiki/A*_search_algorithm",
        "https://en.wikipedia.org/wiki/Breadth-first_search",
        "https://en.wikipedia.org/wiki/Depth-first_search",
        "https://en.wikipedia.org/wiki/Bogosort",
        "https://en.wikipedia.org/wiki/Bogosort",
      ],
    };
    return (
      <div>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark ">
          <a className="navbar-brand" href="/pathfinding-visualizer">
            <b>7 Days, 7 Projects - Pathfinding Visualizer (Day 1/7)</b>
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link" href="https://jj1.dev/projects">
                  More Projects
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <div class="card" style={{ width: 18 + "rem" }}>
          <div class="card-body">
            <h5 class="card-title">{Algos.titles[this.state.algoNum]}</h5>
            <p class="card-text">{Algos.descriptions[this.state.algoNum]}</p>
            <a
              href={Algos.links[this.state.algoNum]}
              class="btn btn-primary"
              style={{ marginTop: -25 + "px" }}
            >
              Learn More
            </a>
          </div>
        </div>

        <div class="card" id="legend" style={{ width: 18 + "rem" }}>
          <div class="card-body">
            <h5 class="card-title">Legend</h5>
            <div class="legend-row">
              <div style={{ color: "green" }} class="legend-square">
                &#9632;
              </div>
              <p class="legend-p"> = Start Node (Click and drag)</p>
            </div>
            <div class="legend-row">
              <div style={{ color: "red" }} class="legend-square">
                &#9632;
              </div>
              <p class="legend-p"> = End Node (Click and drag)</p>
            </div>
            <div class="legend-row">
              <div style={{ color: "rgb(12, 53, 71)" }} class="legend-square">
                &#9632;
              </div>
              <p class="legend-p"> = Wall (Click and drag)</p>
            </div>
            <div class="legend-row">
              <div style={{ color: "#40E374" }} class="legend-square">
                &#9632;
              </div>
              <p class="legend-p"> = Visited Node</p>
            </div>
            <div class="legend-row">
              <div style={{ color: "#FFFE6A" }} class="legend-square">
                &#9632;
              </div>
              <p class="legend-p"> = Path to End Node</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-danger"
          onClick={() => this.clearGrid()}
        >
          Clear Grid
        </button>
        <button
          type="button"
          className="btn btn-warning"
          onClick={() => this.clearWalls()}
        >
          Clear Walls
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => this.visualize("Dijkstra")}
        >
          Dijkstra's
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => this.visualize("AStar")}
        >
          A*
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => this.visualize("BFS")}
        >
          Breadth First Search
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => this.visualize("DFS")}
        >
          Depth First Search
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => this.visualize("Bogo")}
        >
          Bogo Search
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => this.visualize("Spread")}
        >
          Random Spread
        </button>
        {this.state.isDesktopView ? (
          <button
            type="button"
            className="btn btn-light"
            onClick={() => this.toggleView()}
          >
            Mobile View
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => this.toggleView()}
          >
            Desktop View
          </button>
        )}

        <table
          className="grid-container"
          onMouseLeave={() => this.handleMouseLeave()}
        >
          <tbody className="grid">
            {grid.map((row, rowIdx) => {
              return (
                <tr key={rowIdx}>
                  {row.map((node, nodeIdx) => {
                    const { row, col, isFinish, isStart, isWall } = node;
                    return (
                      <Node
                        key={nodeIdx}
                        col={col}
                        isFinish={isFinish}
                        isStart={isStart}
                        isWall={isWall}
                        mouseIsPressed={mouseIsPressed}
                        onMouseDown={(row, col) =>
                          this.handleMouseDown(row, col)
                        }
                        onMouseEnter={(row, col) =>
                          this.handleMouseEnter(row, col)
                        }
                        onMouseUp={() => this.handleMouseUp(row, col)}
                        row={row}
                      ></Node>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

/******************** Create Walls ********************/
const getNewGridWithWallToggled = (grid, row, col) => {
  // mouseDown starts to act strange if I don't make newGrid and work off of grid instead.
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  if (!node.isStart && !node.isFinish && node.isNode) {
    const newNode = {
      ...node,
      isWall: !node.isWall,
    };
    newGrid[row][col] = newNode;
  }
  return newGrid;
};

// Backtracks from the finishNode to find the shortest path.
// Only works when called after the pathfinding methods.
function getNodesInShortestPathOrder(finishNode) {
  const nodesInShortestPathOrder = [];
  let currentNode = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
}
