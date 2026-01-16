import styles from "../../styles/GreetingBox.module.css";

function GreetingBox() {
  return (
    <div className={styles.greetingBox}>
      <h1 className={styles.title}>Emi Messenger</h1>
      <h2 className={styles.welcomeMessage}>Sending Files and Setting Profile Pictures Coming Soon!</h2>
    </div>
  )
}

export default GreetingBox;