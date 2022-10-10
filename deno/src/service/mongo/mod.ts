import { initMongo } from "@/common/mongo.ts";

export const mongo = await initMongo({
  url: "mongodb://docker:mongopw@localhost:55004",
  database: "front",
  collections: ["field", "schema"],
});
