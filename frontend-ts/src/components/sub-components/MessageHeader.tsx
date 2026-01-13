import styles from "../../styles/MessageHeader.module.css";

interface Props {
  conversationName: string
}

// implement function to delete a conversation
// implement popup that shows users in conversation
// implement overflow control with conversation name
function MessageHeader({conversationName} : Props) {

  return (
    <header className={styles.header}>
      <div className={styles.profile}>
        <div className={styles.profileImage}></div>
        <h2 className={styles.username}>{conversationName}</h2>
      </div>
      <div className={styles.buttons}>
        <button className={styles.button}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.icon}>
            <title>trash-can</title>
            <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M9,8H11V17H9V8M13,8H15V17H13V8Z" />
          </svg>
        </button>
        <button className={styles.button}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.icon}>
            <title>dots-vertical</title>
            <path d="M12,16C13.1,16 14,16.9 14,18C14,19.1 13.1,20 12,20C10.9,20 10,19.1 10,18C10,16.9 10.9,16 12,16M12,10C13.1,10 14,10.9 14,12C14,13.1 13.1,14 12,14C10.9,14 10,13.1 10,12C10,10.9 10.9,10 12,10M12,4C13.1,4 14,4.9 14,6C14,7.1 13.1,8 12,8C10.9,8 10,7.1 10,6C10,4.9 10.9,4 12,4M12,5C11.45,5 11,5.45 11,6C11,6.55 11.45,7 12,7C12.55,7 13,6.55 13,6C13,5.45 12.55,5 12,5M12,11C11.45,11 11,11.45 11,12C11,12.55 11.45,13 12,13C12.55,13 13,12.55 13,12C13,11.45 12.55,11 12,11M12,17C11.45,17 11,17.45 11,18C11,18.55 11.45,19 12,19C12.55,19 13,18.55 13,18C13,17.45 12.55,17 12,17Z" />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default MessageHeader;