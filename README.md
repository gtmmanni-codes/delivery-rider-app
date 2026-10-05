# Rally

Rally is a responsive, single-page shift-planning dashboard for part-time delivery riders. It shows a simulated hourly demand forecast for a Manchester city-centre delivery patch, highlights the day's strongest three-hour earning window, and lets riders plan shifts toward a weekly earnings goal.

Forecasts and earnings are illustrative mock estimates generated locally in JavaScript; the app does not use an API, backend, external fonts, or build step. Shift plans and goal changes are held in memory for the current visit and reset when the page reloads.

## Run it

Open `index.html` directly in a browser, or serve this folder with any static file server. For example, with Python installed:

```sh
python -m http.server 8000
```

Then visit <http://localhost:8000>. The project can also be deployed as-is to GitHub Pages or Netlify.
