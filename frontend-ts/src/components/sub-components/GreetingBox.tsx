import styles from "../../styles/GreetingBox.module.css";

function GreetingBox() {
  return (
    <div className={styles.greetingBox}>
      <h1 className={styles.title}>Emi Messenger</h1>
      <h2 className={styles.welcomeMessage}>Welcome User!</h2>
    </div>
  )
}

export default GreetingBox;