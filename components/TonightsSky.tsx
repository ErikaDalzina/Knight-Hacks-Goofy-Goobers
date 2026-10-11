"use client";

import { useEffect, useState } from "react";
import styles from "./TonightsSky.module.css";

type Constellation = {
    id: string;
    name: string;
    tip: string;
    equipment: string;
    imageUrl: string;
};

const Chevron = ({ back }: { back?: boolean }) => (
    <svg width="9" height="12" viewBox="0 0 9 12" fill="none" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={back ? "M6.5 1.5L2 6l4.5 4.5" : "M2.5 1.5L7 6l-4.5 4.5"} />
    </svg>
);

export default function TonightsSky() {
    const [constellations, setConstellations] = useState<Constellation[]>([]);
    const [index, setIndex] = useState(0);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch("/api/sky")
            .then((response) => {
                if (!response.ok) throw new Error("Failed to load sky guide");
                return response.json();
            })
            .then((data) => setConstellations(data.constellations))
            .catch(() => setError(true));
    }, []);

    const current = constellations[index];
    const canCycle = constellations.length > 1;

    function next() {
        setIndex((i) => (i + 1) % constellations.length);
    }

    function previous() {
        setIndex((i) => (i - 1 + constellations.length) % constellations.length);
    }

    return (
        <section className={`panel ${styles.panel}`}>
            <div className={styles.head}>
                <h2 className="kicker" style={{ margin: 0 }}>Tonight&apos;s sky</h2>
                {current && <span className={styles.count}>{index + 1} / {constellations.length}</span>}
            </div>

            {error && <p className={styles.status}>Unable to load the sky guide.</p>}

            {!error && !current && <p className={styles.status}>Loading constellations…</p>}

            {current && (
                <>
                    <div className={styles.body}>
                        <button type="button" className={`${styles.arrow} ${styles.prev}`} onClick={previous}
                                disabled={!canCycle} aria-label="Previous constellation" title="Previous">
                            <Chevron back />
                        </button>

                        <div className={styles.diagram}>
                            <div className={styles.art}>
                                <img src={current.imageUrl} alt={`${current.name} constellation diagram`} width={360} height={270} />
                                {/* A blurred, contrast-boosted copy on top makes the bright stars bloom. */}
                                <img src={current.imageUrl} alt="" aria-hidden="true" width={360} height={270} className={styles.bloom} />
                            </div>
                        </div>

                        <div className={styles.text} aria-live="polite">
                            <h3 className={styles.name}>{current.name}</h3>
                            <p className={styles.tip}>{current.tip}</p>
                            <span className={styles.tag}>{current.equipment}</span>
                        </div>

                        <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={next}
                                disabled={!canCycle} aria-label="Next constellation" title="Next">
                            <Chevron />
                        </button>
                    </div>

                    <p className={styles.note}>
                        Seasonal sky guide for Central Florida. Actual viewing depends on weather, time and location.
                    </p>
                </>
            )}
        </section>
    );
}
