import { postgres } from "@/libs/postgres.ts";

type PgSchemaItem = {
  column_name: string;
  data_type: "real" | "integer" | "character varying" | "text";
  length?: number;
  is_nullable?: boolean;
  is_pk?: boolean;
  // ordinal_position: number;
  // numeric_scale: null;
};

const url = "postgres://postgres:postgrespw@localhost:55005";
const db_name = "preserve";
const tables: Record<
  string,
  {
    schema: PgSchemaItem[];
  }
> = {
  company: {
    schema: [
      {
        column_name: "ID",
        data_type: "integer",
      },
    ],
  },
};

const pg = postgres(url);
const exist_dbs = await pg`
SELECT datname FROM pg_database
WHERE datistemplate = false
`.then((names) =>
  names.reduce((acc, item) => {
    acc[item?.datname] = item;
    return acc;
  }, {} as Record<string, { datname: string }>)
);
if (!Reflect.has(exist_dbs, db_name)) {
  await pg`
  CREATE DATABASE ${db_name}
  `;
}

const preserve = postgres(`${url}/${db_name}`);
const exist_tables = await preserve`
SELECT tablename from pg_tables
WHERE schemaname='public'
`.then((names) =>
  names.reduce((acc, item) => {
    acc[item?.tablename] = item;
    return acc;
  }, {} as Record<string, { tablename: string }>)
);

for (const [name] of Object.entries(tables)) {
  if (!Reflect.has(exist_tables, name)) {
    await preserve`
    CREATE TABLE ${preserve(name)} (
      ID       INT          NOT NULL  PRIMARY KEY,
      NAME     TEXT         NOT NULL,
      AGE      INT          NOT NULL,
      ADDRESS  VARCHAR(50),
      SALARY   REAL
    )
    `;
  } else {
    const _columns = await preserve`
        SELECT
          A.ordinal_position,
          A.column_name,
          A.data_type,
          A.numeric_scale,
          coalesce(
            A.character_maximum_length, 
            A.numeric_precision, 
            -1
          ) as length,
          CASE A.is_nullable 
            WHEN 'NO' 
            THEN true 
            ELSE false 
            END AS is_nullable,
          CASE 
            WHEN length(B.attname) > 0 
            THEN true 
            ELSE false 
            END AS is_pk
        FROM
          information_schema.columns A
        LEFT JOIN (
          SELECT
            pg_attribute.attname
          FROM
            pg_index,
            pg_class,
            pg_attribute
          WHERE
            pg_class.oid = ${name} :: regclass
            AND pg_index.indrelid = pg_class.oid
            AND pg_attribute.attrelid = pg_class.oid
            AND pg_attribute.attnum = ANY (pg_index.indkey)
        ) B ON A.column_name = b.attname
        WHERE
          A.table_name = ${name}
        ORDER BY
          ordinal_position ASC;
        `;
  }
}

// await preserve`
// INSERT INTO company (
//   ID,NAME,AGE,ADDRESS,SALARY) VALUES (
//   8, 'Chuck', 99, 'Macaco', 988800.00
// )`;

const result = await preserve`
SELECT 
  * 
FROM 
  company 
WHERE 
  ID > 2
`;

console.log(result);
