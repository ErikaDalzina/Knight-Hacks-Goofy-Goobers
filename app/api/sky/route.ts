
type Constellation = {
    name: string;
    tip: string;
    stars: [number, number][];
};

const constellations: Record<string, Constellation> = {
    cassiopeia: {
        name: "Cassiopeia",
        tip: "Look north for five bright stars forming a W.",
        stars: [[30, 55], [105, 155], [180, 55], [255, 155], [330, 55]],
    },
    pegasus: {
        name: "Pegasus",
        tip: "Look for the Great Square of Pegasus.",
        stars: [[80, 45], [290, 45], [290, 205], [80, 205]],
    },
    cygnus: {
        name: "Cygnus",
        tip: "Look for the Northern Cross near the Milky Way.",
        stars: [[180, 20], [180, 95], [180, 165], [180, 245], [65, 165], [295, 165]],
    },
    andromeda: {
        name: "Andromeda",
        tip: "Find the chain of stars extending from the Great Square.",
        stars: [[40, 190], [115, 150], [195, 100], [285, 55]],
    },
};

function makeSvg(id: string): string {
    const c = constellations[id];

    const connections: Record<string, [number, number][]> = {
        cassiopeia: [[0, 1], [1, 2], [2, 3], [3, 4]],
        pegasus: [[0, 1], [1, 2], [2, 3], [3, 0]],
        cygnus: [[0, 1], [1, 2], [2, 3], [4, 2], [2, 5]],
        andromeda: [[0, 1], [1, 2], [2, 3]],
    };

    const lines = connections[id].map(([a, b]) => {
        const [x1, y1] = c.stars[a];
        const [x2, y2] = c.stars[b];

        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
      stroke="#a7b8ff" stroke-width="2" opacity=".85"/>`;
    }).join("");

    const stars = c.stars.map(([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="5" fill="#f4f2ff"/>`
    ).join("");

    return `<svg xmlns="http://www.w3.org/2000/svg"
    width="360" height="270" viewBox="0 0 360 270">
    <rect width="360" height="270" rx="16" fill="#15182b"/>
    ${lines}
    ${stars}
  </svg>`;
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const imageId = url.searchParams.get("image");

    if (imageId !== null) {
        if (!constellations[imageId]) {
            return Response.json({ error: "Not found" }, { status: 404 });
        }

        return new Response(makeSvg(imageId), {
            headers: { "Content-Type": "image/svg+xml" },
        });
    }

    return Response.json({
        title: "Tonight's Sky",
        subtitle: "October constellation guide for Central Florida",
        note: "Seasonal guide, not a real-time visibility prediction.",
        constellations: Object.entries(constellations).map(([id, c]) => ({
            id,
            name: c.name,
            tip: c.tip,
            equipment: "Naked eye",
            imageUrl: `/api/sky?image=${id}`,
        })),
    });
}
