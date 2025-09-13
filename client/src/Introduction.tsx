import './app/App.css'
import styles from './Introduction.module.css'
import { Link } from "react-router";

function Introduction() {

    return (
        <div>
            <div className={styles.logo}>
                <h1 id={styles.title}>100pro-team-sns</h1>
                <h3 id={styles.subtitle}>100pro-team-sns</h3>
            </div>
            <Link to="/login">
                <button>ログイン</button>
            </Link>
        </div>
    )
}

export default Introduction
