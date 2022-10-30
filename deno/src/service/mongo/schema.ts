import { zodEnum, zodFieldComponent, zodValidator } from "@/common/types.ts";
import { ObjectId } from "@/libs/mongo.ts";
import { z } from "@/libs/zod.ts";
import { mongo } from "../mod.ts";
import { getFieldItem, zodField, zodFieldCommon } from "./field.ts";

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
export const zodFlattenSchemaItemBase = z
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
     * 如果没有 "o-field-id"
     * 但是有 "o-schema-id"
     * 则直接使用 "o-namespace"
     * 然后把对应的 schema.properties assign 进 "properties" 中
     */
    "o-schema-id": z.string().optional(),
    // "o-schema-value"?: FlattenSchemaItems,
    /**
     * 是否在以下内容展示
     * filter -> 表格上的筛选
     * table  -> 表格中
     */
    "o-show-filter": z.boolean().optional(),
    "o-show-table": z.boolean().optional(),
  })
  .and(zodParsedFormSchemaBase);
export type FlattenSchemaItemBase = z.infer<typeof zodFlattenSchemaItemBase>;
export type FlattenSchemaItem = FlattenSchemaItemBase & {
  /**
   * "o-schema-value" 是过程中的中间值, 无需用户输入
   */
  "o-schema-value"?: FlattenSchemaItems;
};

export const zodFlattenSchemaItem: z.ZodType<FlattenSchemaItem> = z.lazy(() =>
  z
    .object({
      "o-schema-value": zodFlattenSchemaItem.array().optional(),
    })
    .and(zodFlattenSchemaItemBase)
);
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
 * @desc 将所有的 "o-field-id" 或者 "o-schema-id" 转换成真实值
 * @param schemaId schemaItem 的 Id
 * @param depth 递归深度, 最大为5
 */
export async function clearSchemaRef(
  schemaId: string,
  depth = 1
): Promise<FlattenSchemaItems> {
  if (depth === 5) {
    throw Error(
      "Schema reference depth too much! <Please reshape your schema> or <Check the circular reference>"
    );
  }
  const schemaItem = await getSchemaItem(schemaId);
  const schemaSource = schemaItem.flattenSchema ?? [];
  for (const schemaSourceItem of schemaSource) {
    const { ["o-field-id"]: fieldId, ["o-schema-id"]: schemaId } =
      schemaSourceItem;

    if (schemaId) {
      const schemaItem = await clearSchemaRef(schemaId, depth + 1);
      schemaSourceItem["o-schema-value"] = schemaItem;
      continue;
    }

    if (fieldId) {
      const fieldItem = await getFieldItem(fieldId);
      schemaSourceItem["o-field-value"] = fieldItem;
      continue;
    }
  }
  return schemaSource.reduce((acc, item) => {
    const { ["o-schema-value"]: schemaVal, ...parent_rest } = item;
    const { ["o-namespace"]: parent_namespace } = parent_rest;
    if (Array.isArray(schemaVal)) {
      acc.push(
        ...schemaVal.map(({ ["o-namespace"]: namespace, ...rest }) => {
          return {
            "o-namespace": [...parent_namespace, ...namespace],
            ...rest,
          };
        })
      );
    } else {
      acc.push(parent_rest);
    }
    return acc;
  }, [] as FlattenSchemaItems);
}

export async function schemaSourceToFormSchema(
  schema: FlattenSchemaItems
): Promise<ParsedFormSchema> {
  return await schema.reduce(
    (
      acc,
      {
        ["o-namespace"]: namespace,
        ["o-schema-id"]: _schema_id,
        ["o-schema-value"]: _schema,
        ["o-field-id"]: _field_id,
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
        ["o-schema-id"]: _schema_id,
        ["o-schema-value"]: _schema,
        ["o-field-id"]: _field_id,
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
