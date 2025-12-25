import styles from "../styles/NotFound.module.css";
import EmiSleepy from "../assets/EmiSleepy.jpg";

function NotFound() {

  return (
    <div className={styles.notFound}>
      <img src={EmiSleepy} alt="Emi CEO Sleepy" className={styles.image}/>
      <h1>This page sadly does not exist</h1>
    </div>
  );
}

export default NotFound;