import React, { useRef, useLayoutEffect, useEffect, useState } from "react";
import canvasDpiScaler from "canvas-dpi-scaler";
import { useWindowSize } from "@react-hook/window-size";
import axios from "axios";
import InputRange from "react-input-range";

// Setup D3
const d3 = {
  ...require("d3-selection"),
  ...require("d3-force"),
  ...require("d3-force-reuse"),
  ...require("d3-scale"),
  ...require("d3-scale-chromatic")
};

import styles from "./styles.scss";
import dayjs from "dayjs";

const ANIMATION_TICK_LIMIT = 100;
const RANDOM_INIT_DISTANCE = 200;
const FPS = 60; // Framerate limit
const DATE_FORMAT = "YYYY-MM-DD";

// Some knobs to turn
const filterCountries = false;
const countriesToShow = [
  "China",
  "US",
  "Australia"
  // "Italy",
  // "Iran",
  // "Spain",
  // "Germany",
  // "Korea, South",
  // "France",
  // "Switzerland"
];
const startDate = "2020-01-21";
let sizeFilter = 0;

let canvas;
let context;
let render;
let simulation;

let nodesToAdd = [];
let duration = 2000; // In milliseconds
let masterNodeList = [];

let ticks = 0;
let startTime = false;
let runAnimation = true;

const generateColor = d3.scaleOrdinal(d3.schemeTableau10);

// const generateColor = d3
//   .scaleOrdinal(d3.schemeTableau10)
//   .range(["#e79774",
//   "#7763de",
//   "#57a931",
//   "#a73bae",
//   "#4bc762",
//   "#c571e7",
//   "#a2bf37",
//   "#5355ba",
//   "#d2b235",
//   "#6684e9",
//   "#df9331",
//   "#7155a7",
//   "#799531",
//   "#e36dc8",
//   "#3d7f33",
//   "#e34594",
//   "#50c895",
//   "#dd385d",
//   "#48c6ca",
//   "#e8582e",
//   "#56a6db",
//   "#c13422",
//   "#48a78c",
//   "#b43976",
//   "#7dba6f",
//   "#9f4b95",
//   "#b1b866",
//   "#bd87db",
//   "#646c19",
//   "#9998db",
//   "#d16c27",
//   "#426eaf",
//   "#9f8225",
//   "#855d99",
//   "#3e8b5b",
//   "#b53b3c",
//   "#286e4e",
//   "#e4714b",
//   "#56642b",
//   "#d98abe",
//   "#878e51",
//   "#9d5379",
//   "#d4ac66",
//   "#8b3f52",
//   "#806229",
//   "#e48197",
//   "#9e5126",
//   "#e7706a",
//   "#b67e4b",
//   "#ad5159"]);

const scaleY = d3
  .scaleLinear()
  .domain([0, 1000])
  .range([0, window.innerHeight]);

// Function to fetch data from a URL asyncronously
const getData = async url => {
  try {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream"
    });

    return response;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// Set up our physics
simulation = d3
  .forceSimulation()
  .force(
    "collide",
    d3
      .forceCollide()
      .strength(0.019)
      .radius(d => d.size)
      .iterations(1)
  )
  // .force(
  //   "x",
  //   d3
  //     .forceX()
  //     .strength(0.2)
  //     .x(d => d.targetX)
  // )
  .force(
    "y",
    d3
      .forceY()
      .strength(0.02)
      .y(d => d.targetY)
  )
  .alpha(1)
  .alphaDecay(0.0228)
  .alphaMin(0.001)
  .velocityDecay(0.3)
  .stop();

function isAnimating() {
  // if (simulation.alpha() > simulation.alphaMin()) return true;
  // else return false;

  return true;
}

// Render a frame to the canvas
render = () => {
  const nodes = masterNodeList;

  // context.clearRect(
  //   0,
  //   0,
  //   context.canvas.clientWidth,
  //   context.canvas.clientHeight
  // );

  // if (nodes.length === 0) return;
  nodes.forEach((node, iteration) => {
    // if (node.size < calculateRadius(sizeFilter)) return;

    context.beginPath();
    context.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
    context.fillStyle = generateColor(node.name); //"grey"; // node.name === "Australia" ? "#ff0000" : generateColor(iteration); //"rgba(140, 193, 204, 1.0)";
    context.fill();
  });

  // Render text
  // for (const node of nodes) {
  //   if (node.size < calculateRadius(sizeFilter)) continue;
  //   // Draw node text over the top
  //   context.font = "11px Arial";
  //   context.textAlign = "center";
  //   context.strokeStyle = "rgba(255, 255, 255, 0.3)";
  //   context.strokeText(node.name, node.x, node.y - 10);
  //   context.fillStyle = "rgba(11, 11, 11, 1.0)";
  //   context.fillText(node.name, node.x, node.y - 10);
  // }

  // nodes.shift();

  return nodes;
};

const processFrame = () => {
  // const newNodes = [];

  const nodes = render();

  // simulation.nodes(nodes).tick();

  // if (isAnimating()) {
  //   requestAnimationFrame(t => {
  //     processFrame(t);
  //   });
  // }
};

// React component starts here
const Stage = props => {
  const canvasEl = useRef();
  const [windowWidth, windowHeight] = useWindowSize();
  const [data, setData] = useState(null);
  const [date, setDate] = useState(dayjs(startDate));

  const init = async () => {
    canvas = d3.select(canvasEl.current);
    context = canvas.node().getContext("2d");

    const response = await getData(
      "https://www.abc.net.au/dat/news/interactives/covid19-data/hybrid-country-totals.json"
    );

    // Do some filtering
    const filteredData = {};

    for (const country in response.data) {
      if (countriesToShow.includes(country)) {
        filteredData[country] = response.data[country];
      }
    }

    if (filterCountries) setData(filteredData);
    else setData(response.data);
  };

  const handleClick = () => {
    const newDate = date.add(1, "day");
    console.log(newDate.format());
    setDate(newDate);
  };

  // Fires when we get data changes
  // or date changes
  useEffect(() => {
    // Wait until we have data
    if (typeof data === "null") return;

    const nodes = [];

    for (const countryName in data) {
      const count = data[countryName][date.format(DATE_FORMAT)];
      if (typeof count === "undefined" || count === 0) continue;

      // Calculate growth rate
      const theDayBefore = date.subtract(1, "day").format(DATE_FORMAT);
      const countYesterday = data[countryName][theDayBefore];

      const newCases = count - countYesterday;

      if (newCases > 500) {
        console.log(
          `%c ${countryName}, ${newCases}, ${generateColor(countryName)}`,
          `background: ${generateColor(countryName)}; color: white`
        );
      }

      for (let i = 0; i < newCases; i++) {
        nodes.push({
          name: countryName,
          x: windowWidth * Math.random(),
          // windowWidth / 2 +
          // (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
          y: windowHeight * Math.random(),
          // windowHeight * 0.5 +
          // (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
          targetX: windowWidth / 2,
          targetY:
            windowHeight * 0.9 - scaleY(newCases) > 100
              ? windowHeight * 0.9 - scaleY(newCases)
              : 100,
          size: 4 // calculateRadius(count) / 10
        });
      }
    }

    // if (isAnimating()) {
    //   // simulation.nodes(simulation.nodes().concat(dots)).alpha(1.0);
    //   // simulation.nodes(nodes).alpha(1.0);

    //   masterNodeList = nodes;

    // } else {
    //   // simulation.nodes(nodes).alpha(1.0);
    //   masterNodeList = nodes;

    //   requestAnimationFrame(t => {
    //     processFrame(t);
    //   });
    // }
    masterNodeList = nodes;
    processFrame();
  }, [data, date]);

  // Run once on mount
  useLayoutEffect(() => {
    init();

    requestAnimationFrame(t => {
      processFrame(t);
    });

    return () => {
      runAnimation = false;
    };
  }, []);

  useEffect(() => {
    canvas.attr("width", windowWidth).attr("height", windowHeight);

    canvasDpiScaler(canvas.node(), context, windowWidth, windowHeight);
  }, [windowWidth, windowHeight]);

  return (
    <div className={styles.root}>
      {/* <div className={styles.date}>{date.format(DATE_FORMAT)}</div> */}
      {/* <InputRange
        maxValue={20}
        minValue={0}
        value={20}
        onChange={value => {}} /> */}
      <canvas className={styles.canvas} ref={canvasEl} onClick={handleClick} />
    </div>
  );
};

export default Stage;

function calculateRadius(area) {
  const radiusSquared = area / Math.PI;

  return Math.sqrt(radiusSquared);
}
