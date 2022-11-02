import { zodEnum, zodFieldComponent, zodValidator } from "@/common/types.ts";
import { Document, ObjectId } from "@/libs/mongo.ts";
import { z } from "@/libs/zod.ts";
import { mongo } from "../mod.ts";
import { zodField, zodFieldCommon } from "./field.ts";

export const zodParsedFormSchemaBase = z
  .object({
    /**
     * field自带
     */
    type: z.enum([
      "void",
      "object",
      "array",
      "string",
      "number",
      "boolean",
      "date",
      "datetime",
    ]),
    /**
     * field自带
     */
    enum: zodEnum,
    /**
     * 下面的都是用户输入
     */
    /**
     * 根据配置, 渲染出该配置组件, 供用户选择默认值
     */
    default: z.unknown(),
    /**
     * 默认使用 field.name 可以用户输入重新定义
     */
    title: z.string(),
    required: z.boolean(),
    readOnly: z.boolean(),
    description: z.string(),
    /**
     * 默认FormItem
     */
    "x-decorator": z.string(),
    /**
     * 选择field列表
     */
    "x-component": zodFieldComponent,
    "x-reactions": z.string(),
    /**
     * array object 表单组件输入
     */
    "x-validator": zodValidator.array(),
    /**
     * 下面两个props
     * 均是JSON输入框
     */
    "x-component-props": z.record(z.unknown()),
    "x-decorator-props": z.record(z.unknown()),
    "x-hidden": z.boolean(),
  })
  .partial();
export type ParsedFormSchemaBase = z.infer<typeof zodParsedFormSchemaBase>;
export type ParsedFormSchema = ParsedFormSchemaBase & {
  properties: Record<string, ParsedFormSchema>;
};
export const zodParsedFormSchema: z.ZodType<ParsedFormSchema> = z.lazy(() =>
  z
    .object({
      properties: z.record(zodParsedFormSchema),
    })
    .and(zodParsedFormSchemaBase)
);
export const zodParsedColumnSchemaItem = z.object({
  dataIndex: z.string().array(),
  title: z.string(),
  valueType: z.string(),
  fieldProps: z.object({
    options: zodEnum.optional(),
  }),
  hideInSearch: z.boolean(),
  hideInTable: z.boolean(),
  initialValue: z.unknown(),
});
export const zodParsedColumnSchemaItems = zodParsedColumnSchemaItem.array();
export type ParsedColumnSchemaItem = z.infer<typeof zodParsedColumnSchemaItem>;
export type ParsedColumnSchemaItems = z.infer<
  typeof zodParsedColumnSchemaItems
>;
export const zodFlattenSchemaItem = z
  .object({
    "o-namespace": z.string().array(),
    /**
     * 通过 "o-field-id" 获取 Field 字段, 并进行以下处理
     *
     * "o-namespace" 属性 push "o-field-alias-key" 或者 Field.key
     * ------------------
     * Schema["x-component"] ??= Field["component"]
     * Schema["enum"] ??= Field["enum"]
     * ------------------
     */
    "o-field-id": z.string().optional(),
    /**
     * "o-field-value" 是过程中的中间值, 无需用户输入
     */
    "o-field-value": zodField.optional(),
    "o-field-alias-key": z.string().optional(),
    /**
     * 是否在以下内容展示
     * filter -> 表格上的筛选
     * table  -> 表格中
     */
    "o-show-filter": z.boolean().optional(),
    "o-show-table": z.boolean().optional(),
  })
  .and(zodParsedFormSchemaBase);
export type FlattenSchemaItem = z.infer<typeof zodFlattenSchemaItem>;

export const zodFlattenSchemaItems = zodFlattenSchemaItem.array();
export type FlattenSchemaItems = z.infer<typeof zodFlattenSchemaItems>;
export const zodSchema = z
  .object({
    flattenSchema: zodFlattenSchemaItems,
  })
  .and(zodFieldCommon);
export type Schema = z.infer<typeof zodSchema>;

export async function getSchemaItem(id: string) {
  return (await mongo.schema.findOne({ _id: ObjectId(id) })) as Schema;
}

/**
 * @desc 将所有的 "o-field-id" 转换成真实值
 * @param schemaId schemaItem 的 Id
 */
export async function clearSchemaRef(
  schemaId: string
): Promise<FlattenSchemaItems> {
  const schemaSource: Document = await mongo.schema
    .aggregate([
      {
        $match: {
          _id: ObjectId(schemaId),
        },
      },
      {
        $project: {
          _id: 0,
          flattenSchema: 1,
        },
      },
      {
        $unwind: "$flattenSchema",
      },
      {
        $addFields: {
          "o-namespace": "$flattenSchema.o-namespace",
          "o-field-id": {
            $toObjectId: "$flattenSchema.o-field-id",
          },
        },
      },
      {
        $project: {
          flattenSchema: 0,
        },
      },
      {
        $lookup: {
          localField: "o-field-id",
          from: "field",
          foreignField: "_id",
          as: "o-field-value",
        },
      },
      {
        $unwind: "$o-field-value",
      },
      {
        $project: {
          "o-field-id": 0,
          "o-field-value": {
            _id: 0,
            space: 0,
            remark: 0,
            version: 0,
          },
        },
      },
    ])
    .toArray();
  return schemaSource as FlattenSchemaItems;
}

export async function schemaSourceToFormSchema(
  schema: FlattenSchemaItems
): Promise<ParsedFormSchema> {
  return await schema.reduce(
    (
      acc,
      {
        ["o-namespace"]: namespace,
        ["o-field-value"]: field,
        ["o-field-alias-key"]: fieldAliasKey,
        ["o-show-filter"]: _showInFilter,
        ["o-show-table"]: _showInTable,
        title,
        ...rest
      }
    ) => {
      namespace.reduce((ref, path) => {
        ref.properties ??= {};
        ref.properties[path] ??= {
          type: "object",
          properties: {},
        };
        return ref.properties[path];
      }, acc).properties[fieldAliasKey ?? field?.key!] = {
        enum: field?.enum,
        title: title ?? field?.name ?? field?.key,
        "x-decorator": "FormItem",
        "x-component": field?.component,
        properties: {},
        ...rest,
      };

      return acc;
    },
    {
      type: "object",
      properties: {},
    } as ParsedFormSchema
  );
}

export async function schemaSourceToAntdColumns(schema: FlattenSchemaItems) {
  const columns = await schema.reduce(
    (
      acc,
      {
        ["o-namespace"]: namespace,
        ["o-field-value"]: field,
        ["o-field-alias-key"]: fieldAliasKey,
        ["o-show-filter"]: showInFilter,
        ["o-show-table"]: showInTable,
        ["x-component-props"]: xFieldProps,
        ["x-hidden"]: xHidden,
        title,
        ...restSchemaItem
      }
    ) => {
      const { default: initialValue, ..._not_use } = restSchemaItem ?? {};
      const {
        key,
        component,
        name,
        enum: options,
        ..._restField
      } = field ?? {};

      acc.push({
        dataIndex: [...namespace, fieldAliasKey ?? key!],
        title: title ?? name!,
        valueType: component!,
        fieldProps: {
          ...xFieldProps,
          options,
        },
        hideInSearch: !!(showInFilter ?? xHidden),
        hideInTable: !!(showInTable ?? xHidden),
        initialValue,
      });
      return acc;
    },
    [] as ParsedColumnSchemaItems
  );
  return columns;
}
