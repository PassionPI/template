import { Enum, FieldComponentType, Validator } from "@/common/types.ts";
import { ObjectId } from "@/libs/mongo.ts";
import { Field, getFieldItem } from "./field.ts";
import { mongo } from "./mod.ts";

export type SchemaParsed = {
  type?:
    | "void"
    | "object"
    | "array"
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "datetime";
  title?: string;
  properties: Record<string, SchemaParsed>;
  enum?: Enum;
  default?: unknown;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  "x-decorator"?: string;
  "x-component"?: FieldComponentType;
  "x-reactions"?: string;
  "x-validator"?: Validator[];
  "x-component-props"?: Record<string, unknown>;
  "x-decorator-props"?: Record<string, unknown>;
  "x-hidden"?: boolean;
};

export type SchemaSource = (Omit<SchemaParsed, "properties"> & {
  "o-namespace": string[];
  /**
   * 通过 "o-field-id" 获取 Field 字段, 并进行以下处理
   *
   * "o-namespace" 属性 push "o-field-alias-key" 或者 Field.key
   * ------------------
   * Schema["x-component"] ??= Field["component"]
   * Schema["title"] ??= "o-field-alias-label" ?? Field["title"]
   * Schema["enum"] ??= Field["enum"]
   * ------------------
   */
  "o-field-id"?: string;
  "o-field-value"?: Field;
  "o-field-alias-key"?: string;
  "o-field-alias-label"?: string;
  /**
   * 如果没有 "o-field-id"
   * 但是有 "o-schema-id"
   * 则直接使用 "o-namespace"
   * 然后把对应的 schema.properties assign 进 "properties" 中
   */
  "o-schema-id"?: string;
  "o-schema-value"?: SchemaSource;
  /**
   * 是否在以下内容展示
   * filter -> 表格上的筛选
   * table  -> 表格中
   */
  "o-show-filter": boolean;
  "o-show-table": boolean;
})[];

export type SchemaItem = {
  // 配置所属空间
  space: string;
  /**
   * 配置的key「在字段所属空间内, 唯一标识」
   * 用于前端读取该配置
   */
  key: string;
  // 可读性的中文名称
  name: string;
  remark: string | undefined;
  version: number;
  deprecated: boolean;
  /**
   * formily配置
   * 注: 可能会有field key 的 alias
   */
  schema: SchemaSource;
};

export async function getSchemaItem(id: string) {
  return (await mongo.schema.findOne({ _id: ObjectId(id) })) as SchemaItem;
}

/**
 *
 * @param schemaId schemaItem 的 Id
 * @param depth 递归深度, 最大为5
 */
export async function clearSchemaRef(
  schemaId: string,
  depth = 1
): Promise<SchemaSource> {
  if (depth === 5) {
    throw Error(
      "Schema reference depth too much! <Please reshape your schema> or <Check the circular reference>"
    );
  }
  const schemaItem = await getSchemaItem(schemaId);
  const schemaSource = schemaItem.schema ?? [];
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
  }, [] as SchemaSource);
}

export async function schemaSourceToFormSchema(
  schema: SchemaSource
): Promise<SchemaParsed> {
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
        ["o-field-alias-label"]: fieldAliasLabel,
        ["o-show-filter"]: _showInFilter,
        ["o-show-table"]: _showInTable,
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
        title: fieldAliasLabel ?? field?.name ?? field?.key,
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
    } as SchemaParsed
  );
}

export async function schemaSourceToAntdColumns(schema: SchemaSource) {
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
        ["o-field-alias-label"]: fieldAliasLabel,
        ["o-show-filter"]: showInFilter,
        ["o-show-table"]: showInTable,
        ...rest
      }
    ) => {
      const key = fieldAliasKey ?? field?.key;
      acc.push({
        dataIndex: [...namespace, key!],
        ...field,
        ...rest,
      });
      return acc;
    },
    [] as {
      dataIndex: string[];
    }[]
  );
  return columns;
}
