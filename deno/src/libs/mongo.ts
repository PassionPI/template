import {
  Bson,
  MongoClient,
  ObjectId as Id,
} from "https://deno.land/x/mongo@v0.31.0/mod.ts";

const ObjectId = (inputId?: string | number | Uint8Array | Bson.ObjectId) =>
  new Id(inputId);

export { Bson, MongoClient, ObjectId };
