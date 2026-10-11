
"use client";

import { useEffect, useState } from "react";

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
                color: "#f3f2fc",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                    gap: 12,
                }}
            >
        <span style={{ fontSize: 12, letterSpacing: 2, color: "#a6a7be" }}>
          ✦ TONIGHT'S SKY
        </span>
            </div>

            {error && <p>Unable to load the sky guide.</p>}

            {!error && !current && <p>Loading constellations...</p>}

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
                                border: "1px solid #30334d",
                            }}
                        />

                        <div style={{ flex: 1, minWidth: 200 }}>
                            <h2 style={{ fontSize: 28, margin: "0 0 12px" }}>
                                {current.name}
                            </h2>

                            <p
                                style={{
                                    color: "#c5c5d7",
                                    lineHeight: 1.6,
                                    marginBottom: 18,
                                }}
                            >
                                {current.tip}
                            </p>

                            <span
                                style={{
                                    background: "#24283c",
                                    color: "#c8d5ff",
                                    borderRadius: 8,
                                    padding: "8px 12px",
                                    fontSize: 13,
                                }}
                            >
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
                            borderTop: "1px solid #303345",
                        }}
                    >
                        <button onClick={previous} aria-label="Previous constellation">
                            ← Previous
                        </button>

                        <span style={{ color: "#a6a7be", fontSize: 13 }}>
              {index + 1} / {constellations.length}
            </span>

                        <button onClick={next} aria-label="Next constellation">
                            Next →
                        </button>
                    </div>

                    <p
                        style={{
                            color: "#a6a7be",
                            fontSize: 13,
                            marginTop: 20,
                            marginBottom: 0,
                        }}
                    >
                        ☁ Seasonal sky guide for Central Florida. Actual viewing
                        depends on weather, time, and location.
                    </p>
                </>
            )}
        </section>
    );
}
