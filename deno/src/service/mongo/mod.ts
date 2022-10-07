import { initMongo } from "@/common/mongo.ts";

export const mongoCollection = {
  field: "field",
  schema: "schema",
} as const;

export const mongo = await initMongo({
  url: "mongodb://docker:mongopw@localhost:55003",
  db_name: "front",
  collection_names: Object.values(mongoCollection),
});
