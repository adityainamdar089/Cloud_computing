import serverless from "serverless-http";

let cachedHandler;

export const handler = async (event, context) => {
  if (!cachedHandler) {
    const { default: app } = await import("./app.js");
    cachedHandler = serverless(app);
  }

  return cachedHandler(event, context);
};


