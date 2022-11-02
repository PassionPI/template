import { initMongo } from "@/common/mongo.ts";
import { getConfigFile } from "../utils/configFile.ts";
getConfigFile();
export const mongo = await initMongo({
  url: "mongodb://docker:mongopw@localhost:55000",
  database: "front",
  collections: ["field", "schema"],
});
