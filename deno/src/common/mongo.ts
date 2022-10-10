import { Collection, Document, MongoClient } from "@/libs/mongo.ts";

export const initMongo = async <C extends string>({
  url,
  database,
  collections,
}: {
  url: string;
  database: string;
  collections: C[];
}) => {
  const client = new MongoClient();
  await client.connect(url);

  const db = client.database(database);

  return collections.reduce((acc, item) => {
    acc[item] = db.collection(item);
    return acc;
  }, {} as Record<C, Collection<Document>>);
};
