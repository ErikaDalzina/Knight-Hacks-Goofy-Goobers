export default function Home() {
  return (
    <main>
      <h1>Stargazing Hackathon — Backend Starter</h1>
      <p>The API is ready to test. Person 3 replaces this temporary home page with the map and list.</p>
      <ul>
        <li><a href="/api/health">GET /api/health</a></li>
        <li><a href="/api/spots">GET /api/spots</a></li>
      </ul>
      <p>For ratings, use a current forecast date: <code>/api/ratings?date=YYYY-MM-DD</code>.</p>
      <p><strong>Important:</strong> The bundled spots are demonstrative test records, not verified nighttime access locations.</p>
    </main>
  );
}
