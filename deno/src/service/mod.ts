import { initMongo } from "@/common/mongo.ts";
import { getConfigFile } from "../utils/configFile.ts";
getConfigFile();
export const mongo = await initMongo({
  url: "mongodb://docker:mongopw@192.168.1.38:55000",
  database: "front",
  collections: ["field", "schema"],
});
