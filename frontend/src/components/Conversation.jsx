import {useState, useEffect} from 'react';
import styles from "../styles/Conversation.module.css";
import {format} from "date-fns";

const messages = [
  [0, "Hewwo Jechuchi"],
  [1, "YESSA, what is up???"],
  [0, "lab3 is super easy, how did you know"],
  [0, "I did it in like 2 hours, so light work"],
  [1, "wowww, you did it without me"],
  [1, "thats it hmph"],
  [0, `
    Representatives and direct Taxes shall be apportioned among the several States 
    which may be included within this Union, according to their respective Numbers, 
    which shall be determined by adding to the whole Number of free Persons, including 
    those bound to Service for a Term of Years, and excluding Indians not taxed, three 
    fifths of all other Persons. The actual Enumeration shall be made within three Years after 
    the first Meeting of the Congress of the United States, and within every subsequent Term of 
    ten Years, in such Manner as they shall by Law direct. The Number of Representatives shall 
    not exceed one for every thirty Thousand, but each State shall have at Least one Representative; 
    and until such enumeration shall be made, the State of New Hampshire shall be entitled to chuse 
    three, Massachusetts eight, Rhode-Island and Providence Plantations one, Connecticut five, 
    New-York six, New Jersey four, Pennsylvania eight, Delaware one, Maryland six, Virginia ten, 
    North Carolina five, South Carolina five, and Georgia three.
  `],
  [1, `
    Representatives and direct Taxes shall be apportioned among the several States 
    which may be included within this Union, according to their respective Numbers, 
    which shall be determined by adding to the whole Number of free Persons, including 
    those bound to Service for a Term of Years, and excluding Indians not taxed, three 
    fifths of all other Persons. The actual Enumeration shall be made within three Years after 
    the first Meeting of the Congress of the United States, and within every subsequent Term of 
    ten Years, in such Manner as they shall by Law direct. The Number of Representatives shall 
    not exceed one for every thirty Thousand, but each State shall have at Least one Representative; 
    and until such enumeration shall be made, the State of New Hampshire shall be entitled to chuse 
    three, Massachusetts eight, Rhode-Island and Providence Plantations one, Connecticut five, 
    New-York six, New Jersey four, Pennsylvania eight, Delaware one, Maryland six, Virginia ten, 
    North Carolina five, South Carolina five, and Georgia three.
  `],
] 

function Conversation() {
  return (
    <main className={styles.conversation}>
      <header className={styles.header}>
        <div className={styles.profile}>
          <div className={styles.profileImage}></div>
          <h2>Jesus</h2>
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

      {/* use flexbox column, and if from friend, put message on left, if not, put message on right */}
      <div className={styles.texts}>
        {messages.map(message => {
          // change to CometChat dates 
          const timeStamp = new Date();
          const formattedTimeStamp = format(timeStamp, 'HH:mm MM/dd/yyyy');
          const className = (message[0] === 0) ? "textRight" : "textLeft";

          return (
            <div key={crypto.randomUUID()} className={styles[className]}>
              <p>{message[1]}</p>
              {/* on hover should the time show up */}
              <p className={styles.time}>{formattedTimeStamp}</p>
            </div>
          );
        })}
      </div>

      <div className={styles.bottom}>
        <div className={styles.bar}>
          <input placeholder='Enter Message' className={styles.input}/>
          <button className={styles.button}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.icon}>
              <title>dog</title>
              <path d="M18,4C16.29,4 15.25,4.33 14.65,4.61C13.88,4.23 13,4 12,4C11,4 10.12,4.23 9.35,4.61C8.75,4.33 7.71,4 6,4C3,4 1,12 1,14C1,14.83 2.32,15.59 4.14,15.9C4.78,18.14 7.8,19.85 11.5,20V15.72C10.91,15.35 10,14.68 10,14C10,13 12,13 12,13C12,13 14,13 14,14C14,14.68 13.09,15.35 12.5,15.72V20C16.2,19.85 19.22,18.14 19.86,15.9C21.68,15.59 23,14.83 23,14C23,12 21,4 18,4M4.15,13.87C3.65,13.75 3.26,13.61 3,13.5C3.25,10.73 5.2,6.4 6.05,6C6.59,6 7,6.06 7.37,6.11C5.27,8.42 4.44,12.04 4.15,13.87M9,12A1,1 0 0,1 8,11C8,10.46 8.45,10 9,10A1,1 0 0,1 10,11C10,11.56 9.55,12 9,12M15,12A1,1 0 0,1 14,11C14,10.46 14.45,10 15,10A1,1 0 0,1 16,11C16,11.56 15.55,12 15,12M19.85,13.87C19.56,12.04 18.73,8.42 16.63,6.11C17,6.06 17.41,6 17.95,6C18.8,6.4 20.75,10.73 21,13.5C20.75,13.61 20.36,13.75 19.85,13.87Z" />
            </svg>
          </button>
          <button className={styles.button}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.icon}>
              <title>image</title>
              <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}

export default Conversation;