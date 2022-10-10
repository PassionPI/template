import { app } from "@/app/mod.ts";
import { ID, IDS, Pagination } from "@/common/types.ts";
import { ObjectId } from "@/libs/mongo.ts";
import {
  clearSchemaRef,
  Schema,
  schemaSourceToAntdColumns,
  schemaSourceToFormSchema,
} from "@/service/mongo/schema.ts";
import { filterBaseTypeRecord } from "@/utils/filter.ts";

export const get = app.defineController<"/get/:key">(
  async ({ mongo, pathParams, ok }) => {
    const { key } = pathParams;
    const value = await mongo.schema.findOne({ key });
    return ok({ value });
  }
);

export const get_list = app.defineController(async ({ mongo, json, ok }) => {
  const {
    page = 0,
    size = 10,
    ids,
    ...filterSchema
  } = (await json<Pagination & Schema & IDS>()) ?? {};

  const filterIds = Array.isArray(ids)
    ? { _id: { $in: ids.map(ObjectId) } }
    : null;

  const [
    {
      value,
      count: [count],
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
    total: count?.total ?? 0,
    page,
    size,
  });
});

/**
 * 把 "o-schema-id" 递归转换为实体数据
 * 把 "o-field-id"  转换为Field实体数据
 */
export const get_parsed_form = app.defineController(async ({ json, ok }) => {
  const { schemaId } = (await json<{ schemaId: string }>()) ?? {};
  const schemaItem = await clearSchemaRef(schemaId!);
  const form = await schemaSourceToFormSchema(schemaItem);
  return ok({
    form,
  });
});

/**
 * 把 FlattenSchemaItems 转换为 ParsedFormSchema
 */
// export const get_parsed_form = app.defineController(() => {});

/**
 * 把 FlattenSchemaItems 转换为 antd columns
 */
export const get_parsed_columns = app.defineController(async ({ json, ok }) => {
  const { schemaId } = (await json<{ schemaId: string }>()) ?? {};
  const schemaItem = await clearSchemaRef(schemaId!);
  const columns = await schemaSourceToAntdColumns(schemaItem);
  return ok({
    columns,
  });
});

export const post = app.defineController(async ({ mongo, json, ok, bad }) => {
  const schemaItem = await json<Schema>();
  if (schemaItem) {
    const schemaId = await mongo.schema.insertOne(schemaItem);
    return ok({ success: true, schemaId });
  }
  return bad({ code: 4001, message: "No Schema!" });
});

export const post_many = app.defineController(async ({ mongo, json, ok }) => {
  const schemaItem = (await json<Schema[]>()) ?? [];
  const { insertedIds: schemaIds } = await mongo.schema.insertMany(schemaItem);
  return ok({ success: true, schemaIds });
});

export const put = app.defineController(async ({ mongo, json, ok }) => {
  const { _id, ...schemaItem } = (await json<Schema & ID>()) ?? {};
  const { matchedCount, modifiedCount } = await mongo.schema.updateOne(
    { _id: ObjectId(_id) },
    { $set: schemaItem }
  );
  return ok({ success: matchedCount == modifiedCount });
});

export const put_many = app.defineController(async ({ mongo, json, ok }) => {
  const many = (await json<(Schema & ID)[]>()) ?? [];
  const refs = {
    modifiedCount: 0,
    failedId: [] as string[],
  };
  for (const { _id, ...schemaItem } of many) {
    const { matchedCount, modifiedCount } = await mongo.schema.replaceOne(
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
    const deleteCount = await mongo.schema.deleteOne({
      _id: ObjectId(id),
    });
    return ok({ success: deleteCount == 1 });
  }
);
