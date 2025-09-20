import './app/Home.css'
import styles from './Introduction.module.css'
import { Link } from "react-router";

function Introduction() {

    return (
        <div>
            <div className={styles.logo}>
                <h1 id={styles.pole}>Pole<span id={styles.chat}>Chat</span></h1>
                <h3 id={styles.subtitle}>同じ路線に乗っている人としゃべれるアプリ</h3>
            </div>
            <Link to="/login">
                <button id={styles.loginButton}>ログイン</button>
            </Link>
        </div>
    )
}

export default Introduction
