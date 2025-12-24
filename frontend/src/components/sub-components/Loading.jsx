import styles from "../../styles/Loading.module.css";

function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.circle}></div>
    </div>
  )
}

export default Loading;