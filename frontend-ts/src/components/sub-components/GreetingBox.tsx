import styles from "../../styles/GreetingBox.module.css";

function GreetingBox() {
  return (
    <div className={styles.title}>
      <h1>Emi Messenger</h1>
      <h2>Welcome User!</h2>
    </div>
  )
}

export default GreetingBox;