import { Collection, Document, MongoClient } from "@/libs/mongo.ts";

export const initMongo = async <C extends string>({
  url,
  db_name,
  collection_names,
}: {
  url: string;
  db_name: string;
  collection_names: C[];
}) => {
  const mongoClient = new MongoClient();

  await mongoClient.connect(url);

  const mongoDB = mongoClient.database(db_name);

  const mongo = collection_names.reduce((acc, item) => {
    acc[item] = mongoDB.collection(item);
    return acc;
  }, {} as Record<C, Collection<Document>>);

  return mongo;
};
