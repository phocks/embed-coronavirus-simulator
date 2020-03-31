import React, { useRef, useLayoutEffect, useEffect } from "react";
const d3 = {
  ...require("d3-selection"),
  ...require("d3-force"),
  ...require("d3-force-reuse")
};
import canvasDpiScaler from "canvas-dpi-scaler";
import { useWindowSize } from "@react-hook/window-size";

import styles from "./styles.scss";

const ANIMATION_TICK_LIMIT = 100;
const RANDOM_INIT_DISTANCE = 20;
const FPS = 40; // Framerate limit

let canvas;
let context;
let simulation;
let render;
let animate;

let nodesToAdd = [];
let duration = 2000; // In milliseconds
let initialDotState = [];

let ticks = 0;
let startTime = false;
let runAnimation = true;
let isAnimating = false;

const Stage = props => {
  const canvasEl = useRef();
  const [windowWidth, windowHeight] = useWindowSize();

  // Run once on mounts
  useLayoutEffect(() => {
    canvas = d3.select(canvasEl.current);
    context = canvas.node().getContext("2d");

    simulation = d3
      .forceSimulation()
      // .force(
      //   "x",
      //   d3
      //     .forceX()
      //     .strength(0.2)
      //     .x(d => d.targetX)
      // )
      // .force(
      //   "y",
      //   d3
      //     .forceY()
      //     .strength(0.2)
      //     .y(d => d.targetY)
      // )
      // .force(
      //   "center",
      //   d3
      //     .forceCenter()
      //     .x(windowWidth / 2)
      //     .y(windowHeight / 2)
      // )
      // .force(
      //   "charge",
      //   d3
      //     .forceManyBodyReuse()
      //     .strength(-13)
      //     .theta(0.9)
      // )
      .force(
        "collide",
        d3
          .forceCollide()
          .strength(0.8)
          .radius(4.5)
          .iterations(1)
      )
      .alpha(1)
      .alphaDecay(0.2)
      .alphaMin(0.001)
      .velocityDecay(0.3)
      .stop();

    render = () => {
      const nodes = simulation.nodes();
      context.clearRect(0, 0, windowWidth, windowHeight);

      for (const node of nodes) {
        context.beginPath();
        context.arc(node.x, node.y, 4, 0, 2 * Math.PI);
        context.fillStyle = "rgba(140, 193, 204, 1.0)";
        context.fill();
      }

      return nodes;
    };

    animate = time => {
      if (!startTime) {
        startTime = time;
      }

      const progress = time - startTime;
      const nodes = render();
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
        setTimeout(() => {
          requestAnimationFrame(t => {
            animate(t, nodesToAdd); // nodesToAdd doesn't matter for now
          });
        }, 1000 / FPS);
      } else {
        isAnimating = false;
      }
    };

    if (runAnimation) {
      requestAnimationFrame(t => {
        animate(t, nodesToAdd);
      });
    }

    return () => {
      runAnimation = false;
    };
  }, []);

  useEffect(() => {
    for (let i = 0; i < 50; i++) {
      initialDotState.push({
        groupName: "one",
        x:
          windowWidth / 2 +
          (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
        y:
          windowHeight * 0.5 +
          (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
        targetX: windowWidth / 2,
        targetY: windowHeight * 0.5
      });
    }

    simulation.nodes(initialDotState).stop();
  }, [props, windowWidth, windowHeight]);

  useEffect(() => {
    canvas.attr("width", windowWidth).attr("height", windowHeight);

    canvasDpiScaler(canvas.node(), context, windowWidth, windowHeight);
  }, [windowWidth, windowHeight]);

  return (
    <div className={styles.root}>
      <canvas className={styles.canvas} ref={canvasEl} />
    </div>
  );
};

export default Stage;
