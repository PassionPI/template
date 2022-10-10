import { app } from "@/app/mod.ts";
import { ID, IDS, Pagination } from "@/common/types.ts";
import { ObjectId } from "@/libs/mongo.ts";
import { Field } from "@/service/mongo/field.ts";
import { filterBaseTypeRecord } from "@/utils/filter.ts";

export const get_list = app.defineController(async ({ mongo, json, ok }) => {
  const {
    page = 0,
    size = 10,
    ids,
    ...filterSchema
  } = (await json<Pagination & Field & IDS>()) ?? {};

  const filterIds = Array.isArray(ids)
    ? { _id: { $in: ids.map(ObjectId) } }
    : null;

  const [
    {
      value,
      count: [{ total }],
    },
  ] = await mongo.field
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
            { $sort: { _id: -1 } },
            { $skip: page * size },
            { $limit: size },
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

export const post = app.defineController(async ({ mongo, json, ok, bad }) => {
  const schemaItem = await json<Field>();
  if (schemaItem) {
    const fieldId = await mongo.field.insertOne(schemaItem);
    return ok({ success: true, fieldId });
  }
  return bad({ code: 4001, message: "No Schema!" });
});

export const post_many = app.defineController(async ({ mongo, json, ok }) => {
  const schemaItem = (await json<Field[]>()) ?? [];
  const { insertedIds: fieldIds } = await mongo.field.insertMany(schemaItem);
  return ok({ success: true, fieldIds });
});

export const put = app.defineController(async ({ mongo, json, ok }) => {
  const { _id, ...schemaItem } = (await json<Field & ID>()) ?? {};
  const { matchedCount, modifiedCount } = await mongo.field.updateOne(
    { _id: ObjectId(_id) },
    { $set: schemaItem }
  );
  return ok({ success: matchedCount == modifiedCount });
});

export const put_many = app.defineController(async ({ mongo, json, ok }) => {
  const many = (await json<(Field & ID)[]>()) ?? [];
  const refs = {
    modifiedCount: 0,
    failedId: [] as string[],
  };
  for (const { _id, ...schemaItem } of many) {
    const { matchedCount, modifiedCount } = await mongo.field.replaceOne(
      { _id: ObjectId(_id) },
      schemaItem
    );
    matchedCount == modifiedCount
      ? refs.modifiedCount++
      : refs.failedId.push(_id);
  }
  if (refs.modifiedCount === many.length) {
    return ok({ success: true });
  }
  throw {
    failedId: refs.failedId,
  };
});

export const del = app.defineController<"/del/:id">(
  async ({ mongo, pathParams, ok }) => {
    const { id } = pathParams;
    const deleteCount = await mongo.field.deleteOne({
      _id: ObjectId(id),
    });
    return ok({ success: deleteCount == 1 });
  }
);
