import mongoose from "mongoose";

// One shared connection across hot reloads and serverless invocations.
const cache = globalThis as typeof globalThis & { mongooseConnection?: Promise<typeof mongoose> };

export function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.");
  cache.mongooseConnection ??= mongoose.connect(uri).catch((error) => {
    cache.mongooseConnection = undefined; // let the next call retry
    throw error;
  });
  return cache.mongooseConnection;
}
