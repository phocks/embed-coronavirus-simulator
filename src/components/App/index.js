import React from "react";
import styles from "./styles.scss";

import Stage from "../Stage";
import Scatter from "../Scatter";

export default props => {
  return (
    <div className={styles.root}>
      <Scatter />
    </div>
  );
};
