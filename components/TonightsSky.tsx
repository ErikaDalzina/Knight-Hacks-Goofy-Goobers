"use client";

import { useEffect, useState } from "react";
import controls from "./controls.module.css";

type Constellation = {
    id: string;
    name: string;
    tip: string;
    equipment: string;
    imageUrl: string;
};

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

    function next() {
        setIndex((i) => (i + 1) % constellations.length);
    }

    function previous() {
        setIndex((i) => (i - 1 + constellations.length) % constellations.length);
    }

    return (
        <section
            className="panel"
            style={{
                padding: 24,
                color: "var(--text)",
            }}
        >
            <h2 className="kicker" style={{ margin: "0 0 20px" }}>
                ✦ Tonight&apos;s sky
            </h2>

            {error && <p style={{ color: "var(--muted)" }}>Unable to load the sky guide.</p>}

            {!error && !current && <p style={{ color: "var(--muted)" }}>Loading constellations…</p>}

            {current && (
                <>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 24,
                            alignItems: "center",
                        }}
                    >
                        <img
                            src={current.imageUrl}
                            alt={`${current.name} constellation diagram`}
                            width={360}
                            height={270}
                            style={{
                                width: "100%",
                                maxWidth: 320,
                                height: "auto",
                                borderRadius: 14,
                                border: "1px solid var(--line)",
                            }}
                        />

                        <div style={{ flex: 1, minWidth: 200 }}>
                            <h3 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-.02em", margin: "0 0 12px" }}>
                                {current.name}
                            </h3>

                            <p
                                style={{
                                    color: "#c4c5d6",
                                    lineHeight: 1.6,
                                    margin: "0 0 18px",
                                }}
                            >
                                {current.tip}
                            </p>

                            <span className={controls.pill} style={{ color: "var(--link)" }}>
                                ✦ {current.equipment}
                            </span>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 24,
                            paddingTop: 16,
                            borderTop: "1px solid var(--line)",
                        }}
                    >
                        <button type="button" className={controls.chip} onClick={previous} aria-label="Previous constellation">
                            ← Previous
                        </button>

                        <span style={{ color: "var(--muted)", fontSize: 13, fontFamily: "var(--font-mono, monospace)" }}>
                            {index + 1} / {constellations.length}
                        </span>

                        <button type="button" className={controls.chip} onClick={next} aria-label="Next constellation">
                            Next →
                        </button>
                    </div>

                    <p
                        style={{
                            color: "var(--muted)",
                            fontSize: 12,
                            marginTop: 16,
                            marginBottom: 0,
                        }}
                    >
                        Seasonal sky guide for Central Florida. Actual viewing
                        depends on weather, time and location.
                    </p>
                </>
            )}
        </section>
    );
}
