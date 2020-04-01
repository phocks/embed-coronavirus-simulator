import React, { useRef, useLayoutEffect, useEffect, useState } from "react";
import canvasDpiScaler from "canvas-dpi-scaler";
import { useWindowSize } from "@react-hook/window-size";
import axios from "axios";

// Setup D3
const d3 = {
  ...require("d3-selection"),
  ...require("d3-force"),
  ...require("d3-force-reuse")
};

import styles from "./styles.scss";
import dayjs from "dayjs";

const ANIMATION_TICK_LIMIT = 100;
const RANDOM_INIT_DISTANCE = 20;
const FPS = 60; // Framerate limit
const DATE_FORMAT = "YYYY-MM-DD";

let canvas;
let context;
let render;
let animate;
let simulation;

let nodesToAdd = [];
let duration = 2000; // In milliseconds

let ticks = 0;
let startTime = false;
let runAnimation = true;

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
      .strength(0.5)
      .radius(d => d.size)
      .iterations(1)
  )
  .force(
    'x',
    d3
      .forceX()
      .strength(0.002)
      .x(d => d.targetX)
  )
  .force(
    'y',
    d3
      .forceY()
      .strength(0.002)
      .y(d => d.targetY)
  )
  .alpha(1)
  .alphaDecay(0.0228)
  .alphaMin(0.001)
  .velocityDecay(0.3)
  .stop();

function isAnimating() {
  if (simulation.alpha() > simulation.alphaMin()) return true;
  else return false;
}

// Render a frame to the canvas
render = simulation => {
  const nodes = simulation.nodes();
  context.clearRect(
    0,
    0,
    context.canvas.clientWidth,
    context.canvas.clientHeight
  );

  for (const node of nodes) {
    context.beginPath();
    context.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
    context.fillStyle = "rgba(140, 193, 204, 1.0)";
    context.fill();
  }

  return nodes;
};

const processFrame = () => {
  const newNodes = [];

  const nodes = render(simulation);

  simulation.nodes(nodes.concat(newNodes)).tick();

  if (isAnimating()) {
    requestAnimationFrame(t => {
      processFrame(t);
    });
  }
};

// React component starts here
const Stage = props => {
  const canvasEl = useRef();
  const [windowWidth, windowHeight] = useWindowSize();
  const [data, setData] = useState(null);
  const [date, setDate] = useState(dayjs("2019-12-31"));

  console.log(date.format(DATE_FORMAT));

  const init = async () => {
    canvas = d3.select(canvasEl.current);
    context = canvas.node().getContext("2d");

    animate = time => {
      // console.log(simulation.alpha());
      if (!startTime) {
        startTime = time;
      }

      const progress = time - startTime;
      const nodes = render(simulation);
      const newNodes = [];

      for (let i = 0; i < nodesToAdd.length; i++) {
        const node = nodesToAdd[i];
        if (node.delay < progress) {
          // Here we are simulating new dots "dividing" from dots already there
          // So we randomly select nodes until we find one that matches

          // Make an array of random numbers
          // and go through until we find one
          for (var a = [], j = 0; j < nodes.length; ++j) a[j] = j;
          const shuffledArray = shuffle(a);

          for (let randomNumber of shuffledArray) {
            if (nodes[randomNumber].groupName === node.groupName) {
              node.y = nodes[randomNumber].y;
              node.x = nodes[randomNumber].x;
              break;
            }
          }

          newNodes.push(node);
          nodesToAdd.splice(i, 1);
          i--;
        }
      }

      simulation.nodes(nodes.concat(newNodes)).tick();

      ticks++;

      if (
        (runAnimation && ticks < ANIMATION_TICK_LIMIT) ||
        nodesToAdd.length > 0
      ) {
        isAnimating = true;

        if (FPS < 60) {
          setTimeout(() => {
            requestAnimationFrame(t => {
              animate(t, nodesToAdd); // nodesToAdd doesn't matter for now
            });
          }, 1000 / FPS);
        } else {
          requestAnimationFrame(t => {
            animate(t, nodesToAdd); // nodesToAdd doesn't matter for now
          });
        }
      } else {
        isAnimating = false;
      }
    };

    const response = await getData(
      "https://www.abc.net.au/dat/news/interactives/covid19-data/hybrid-country-totals.json"
    );

    setData(response.data);
  };

  const handleClick = () => {
    console.log("User interaction!!!");
    const newDate = date.add(1, "day");
    setDate(newDate);

    // let dots = [];

    // startTime = false;
    // ticks = 0;

    // for (let i = 0; i < 10; i++) {
    //   dots.push({
    //     groupName: "one",
    //     x:
    //       windowWidth / 2 +
    //       (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
    //     y:
    //       windowHeight * 0.5 +
    //       (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
    //     targetX: windowWidth / 2,
    //     targetY: windowHeight * 0.5,
    //     size: Math.ceil(Math.random() * 20 + 2)
    //   });
    // }

    // if (isAnimating()) {
    //   simulation.nodes(simulation.nodes().concat(dots)).alpha(1.0);
    // } else {
    //   simulation.nodes(simulation.nodes().concat(dots)).alpha(1.0);

    //   requestAnimationFrame(t => {
    //     processFrame(t);
    //   });
    // }
  };

  // Fires when we get data changes
  useEffect(() => {
    if (typeof data === "null") return;

    let dots = [];

    // startTime = false;
    // ticks = 0;

    // for (let i = 0; i < 20; i++) {
    for (const countryName in data) {
      const count = data[countryName][date.format(DATE_FORMAT)];
      if (typeof count === "undefined" || count === 0) continue;

      dots.push({
        groupName: "one",
        x:
          windowWidth / 2 
          +
          (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
        y:
          windowHeight * 0.5 
          +
          (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
        targetX: windowWidth / 2,
        targetY: windowHeight * 0.5,
        size: calculateRadius(count)
      });
    }

    

    if (isAnimating()) {
      // simulation.nodes(simulation.nodes().concat(dots)).alpha(1.0);
      simulation.nodes(dots).alpha(1.0);
    } else {

      simulation.nodes(dots).alpha(1.0);

      requestAnimationFrame(t => {
        processFrame(t);
      });
    }
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
      <div className={styles.date}>{date.format(DATE_FORMAT)}</div>
      <canvas className={styles.canvas} ref={canvasEl} onClick={handleClick} />
    </div>
  );
};

export default Stage;

function calculateRadius(area) {
  const radiusSquared = area / Math.PI;

  return Math.sqrt(radiusSquared);
}
