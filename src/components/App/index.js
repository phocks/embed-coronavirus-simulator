import React from "react";
import styles from "./styles.scss";

import Stage from "../Stage";

export default props => {
  return (
    <div className={styles.root}>
      <Stage />
    </div>
  );
};
