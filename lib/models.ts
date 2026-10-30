import mongoose, { type InferSchemaType, type Model } from "mongoose";
import { KIND_SLUGS, REGIONS, ROLES, STATE_TYPES, STATUSES } from "./validators.ts";

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const required = { type: String, required: true };

const image = new Schema(
  { url: required, publicId: String, alt: required, credit: String, license: String, sourceUrl: String },
  { _id: false },
);

// GeoJSON point. Coordinates are [longitude, latitude].
const point = new Schema(
  { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], required: true } },
  { _id: false },
);

const categorySchema = new Schema({
  name: required,
  slug: { ...required, unique: true },
  description: String,
});

const stateSchema = new Schema({
  name: required,
  slug: { ...required, unique: true },
  type: { type: String, enum: STATE_TYPES, required: true },
  region: { type: String, enum: REGIONS, required: true },
  capital: String,
  languages: [String],
  overview: String,
  famousFor: [String],
  bestTime: String,
  localName: { hi: String, regional: String, lang: String, dir: String },
  heroImage: image,
});

const citySchema = new Schema({
  name: required,
  slug: required,
  state: { type: ObjectId, ref: "State", required: true },
  overview: String,
  history: String,
  isHub: { type: Boolean, default: false },
  location: point,
  heroImage: image,
});
citySchema.index({ state: 1, slug: 1 }, { unique: true });

const placeSchema = new Schema(
  {
    name: required,
    slug: { ...required, unique: true },
    state: { type: ObjectId, ref: "State", required: true },
    city: { type: ObjectId, ref: "City", required: true },
    kind: { type: String, enum: KIND_SLUGS, required: true },
    categories: [{ type: ObjectId, ref: "Category" }],
    shortDescription: required,
    description: required,
    history: String,
    bestMonths: [Number],
    bestTimeNote: String,
    entryFee: { indian: Number, foreigner: Number, child: Number, note: String },
    timings: { hours: String, closedOn: String },
    location: { type: point, required: true },
    address: String,
    highlights: [String],
    images: [image],
    isFeatured: { type: Boolean, default: false },
    isHiddenGem: { type: Boolean, default: false },
    status: { type: String, enum: STATUSES, default: "draft" },
    sources: [new Schema({ title: required, url: required }, { _id: false })],
    // Moderation: who created and last changed it, who approved it, and why it was sent back.
    createdBy: { type: ObjectId, ref: "User" },
    updatedBy: { type: ObjectId, ref: "User" },
    verifiedBy: { type: ObjectId, ref: "User" },
    verifiedAt: Date,
    reviewNote: String,
  },
  { timestamps: true },
);
placeSchema.index(
  { name: "text", shortDescription: "text", description: "text" },
  { weights: { name: 10, shortDescription: 5, description: 1 }, name: "place_search" },
);
placeSchema.index({ location: "2dsphere" });
placeSchema.index({ status: 1, state: 1, categories: 1 });
placeSchema.index({ status: 1, state: 1, kind: 1 });

const userSchema = new Schema(
  {
    name: required,
    email: { ...required, unique: true, lowercase: true, trim: true },
    passwordHash: required,
    role: { type: String, enum: ROLES, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// One document per failed login; MongoDB deletes them after 15 minutes, which is the rate-limit window.
const loginAttemptSchema = new Schema({ key: required, createdAt: { type: Date, default: Date.now, expires: 15 * 60 } });
loginAttemptSchema.index({ key: 1 });

export type CategoryDoc = InferSchemaType<typeof categorySchema>;
export type UserDoc = InferSchemaType<typeof userSchema>;
export type StateDoc = InferSchemaType<typeof stateSchema>;
export type CityDoc = InferSchemaType<typeof citySchema>;
export type PlaceDoc = InferSchemaType<typeof placeSchema>;

// Reuse compiled models across hot reloads.
const { models, model } = mongoose;
export const Category = (models.Category as Model<CategoryDoc>) ?? model("Category", categorySchema);
export const State = (models.State as Model<StateDoc>) ?? model("State", stateSchema);
export const City = (models.City as Model<CityDoc>) ?? model("City", citySchema);
export const Place = (models.Place as Model<PlaceDoc>) ?? model("Place", placeSchema);
export const User = (models.User as Model<UserDoc>) ?? model("User", userSchema);
export const LoginAttempt = models.LoginAttempt ?? model("LoginAttempt", loginAttemptSchema);
