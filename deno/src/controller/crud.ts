import { app } from "@/app/mod.ts";
import { ObjectId } from "@/libs/mongo.ts";
import { filterBaseTypeRecord } from "../utils/filter.ts";

type ID = {
  _id: string;
};

type IDS = {
  ids: string[];
};

type Pagination = {
  page: number;
  size: number;
};

type SchemaItem = {
  key: string;
  schema: Record<string, unknown>;
  remark: string | undefined;
  version: number;
  app: string;
};

export const db_get = app.defineController<"/get/:id">(
  async ({ mongo, pathParams, ok }) => {
    const { id } = pathParams;
    const value = await mongo.schema.findOne({ _id: ObjectId(id) });
    return ok({ value });
  }
);

export const db_get_list = app.defineController(async ({ mongo, json, ok }) => {
  const {
    page = 0,
    size = 10,
    ids,
    ...filterSchema
  } = (await json<Pagination & SchemaItem & IDS>()) ?? {};

  const filterIds = Array.isArray(ids)
    ? { _id: { $in: ids.map(ObjectId) } }
    : null;

  const [
    {
      value,
      count: [{ total }],
    },
  ] = await mongo.schema
    .aggregate([
      {
        $facet: {
          value: [
            {
              $match: {
                ...filterBaseTypeRecord(filterSchema ?? {}),
                ...filterIds,
              },
            },
            { $skip: page * size },
            { $limit: size },
            { $sort: { _id: -1 } },
          ],
          count: [{ $count: "total" }],
        },
      },
    ])
    .toArray();

  return ok({
    value,
    total,
    page,
    size,
  });
});

export const db_post = app.defineController(
  async ({ mongo, json, ok, bad }) => {
    const schemaItem = await json<SchemaItem>();
    if (schemaItem) {
      const schemaId = await mongo.schema.insertOne(schemaItem);
      return ok({ success: true, schemaId });
    }
    return bad({ code: 4001, message: "No Schema!" });
  }
);

export const db_post_many = app.defineController(
  async ({ mongo, json, ok }) => {
    const schemaItem = (await json<SchemaItem[]>()) ?? [];
    const { insertedIds: schemaIds } = await mongo.schema.insertMany(
      schemaItem
    );
    return ok({ success: true, schemaIds });
  }
);

export const db_put = app.defineController(async ({ mongo, json, ok }) => {
  const { _id, ...schemaItem } = (await json<SchemaItem & ID>()) ?? {};
  const { matchedCount, modifiedCount } = await mongo.schema.updateOne(
    { _id: ObjectId(_id) },
    { $set: schemaItem }
  );
  return ok({ success: matchedCount == modifiedCount });
});

export const db_del = app.defineController<"/del/:id">(
  async ({ mongo, pathParams, ok }) => {
    const { id } = pathParams;
    const deleteCount = await mongo.schema.deleteOne({
      _id: ObjectId(id),
    });
    return ok({ success: deleteCount == 1 });
  }
);
