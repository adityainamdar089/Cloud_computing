import app from "./app.js";

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`FitTrack API running locally on port ${port}`);
});
