import {useState, useEffect} from 'react';
import styles from "../styles/FindPeople.module.css";

const friends = [
  ["jesus", 1],
  ["christian", 2],
  ["xavior", 3],
  ["david", 4],
  ["priscilla", 5],
  ["andrew", 6],
  ["chris", 7],
  ["enoch", 8],
  ["emi", 9],
  ["william", 10],
  ["cesar", 11],
  ["bryan", 12],
  ["minh", 13],
]

function FindPeople() {
  return (
    <main className={styles.findPeople}>
      <h2 className={styles.subTitle}>Find People</h2>
      <input placeholder="Find Person" type="text" className={styles.input}/>
      <ul className={styles.peopleList}>
        {friends.map(friend => {
          return (
            <li key={friend[1]} className={styles.person}>
              {/* update to get profile pic */}
              <div className={styles.profileImage}></div>
              <h3 className={styles.name}>{friend[0]}</h3>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default FindPeople;