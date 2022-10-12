import { initMongo } from "@/common/mongo.ts";

export const mongo = await initMongo({
  url: "mongodb://docker:mongopw@172.21.20.223:55004",
  database: "front",
  collections: ["field", "schema"],
});
