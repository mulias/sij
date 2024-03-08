import test, { Macro } from 'ava';

import { Builder } from '../src/builder';
import { Functions } from '../src/builder/functions';
import { NoBuilderExtension } from '../src/builder/util';

import { isSqls, isParamsSql } from './_util';

type MySchema = {};

type MyExistingSchema = {
  employee: {
    id: number;
    name: string;
    salary: number;
    department_id: number;
    age: number;
  };
  department: {
    id: number;
    budget: number;
  };
};

const b = new Builder<MySchema, NoBuilderExtension>(new Functions<MySchema, {}, NoBuilderExtension>());
const be = new Builder<MyExistingSchema, NoBuilderExtension>(new Functions<MyExistingSchema, {}, NoBuilderExtension>());

test(
  'multiple schema statements',
  isSqls,
  b.schema
    .createTable('employees', {
      columns: {
        id: {
          type: b.type.bigInt,
          constraints: ['primary key'],
        },
        name: {
          type: b.type.text,
        },
        age: {
          type: b.type.smallInt,
        },
      },
    })
    .createTable('departments', {
      columns: {
        id: {
          type: b.type.bigInt,
          constraints: ['primary key'],
        },
        name: {
          type: b.type.text,
        },
      },
    }),
  [
    'CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT, "age" SMALLINT)',
    'CREATE TABLE "departments" ("id" BIGINT PRIMARY KEY, "name" TEXT)',
  ],
);

test(
  'createTable simple',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: ['primary key'],
      },
      name: {
        type: b.type.text,
      },
      age: {
        type: b.type.smallInt,
      },
    },
  }),
  ['CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT, "age" SMALLINT)'],
);

test(
  'createTable null default',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: ['primary key'],
      },
      name: {
        type: b.type.text,
        default: null,
      },
      age: {
        type: b.type.smallInt,
      },
    },
  }),
  ['CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT DEFAULT NULL, "age" SMALLINT)'],
);

test(
  'createTable on commit',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: ['primary key'],
      },
      name: {
        type: b.type.text,
        default: null,
      },
      age: {
        type: b.type.smallInt,
      },
    },
    onCommit: 'Preserve',
  }),
  [
    'CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT DEFAULT NULL, "age" SMALLINT) ON COMMIT PRESERVE ROWS',
  ],
);

test(
  'createTable local temp',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: ['primary key'],
      },
      name: {
        type: b.type.text,
        default: null,
      },
      age: {
        type: b.type.smallInt,
      },
    },
    local: true,
  }),
  ['CREATE LOCAL TEMPORARY TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT DEFAULT NULL, "age" SMALLINT)'],
);

test(
  'createTable local temp 2',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: ['primary key'],
      },
      name: {
        type: b.type.text,
        default: null,
      },
      age: {
        type: b.type.smallInt,
      },
    },
    local: true,
    temporary: true,
  }),
  ['CREATE LOCAL TEMPORARY TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT DEFAULT NULL, "age" SMALLINT)'],
);

test(
  'createTable global temp',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: ['primary key'],
      },
      name: {
        type: b.type.text,
        default: null,
      },
      age: {
        type: b.type.smallInt,
      },
    },
    temporary: true,
  }),
  ['CREATE GLOBAL TEMPORARY TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT DEFAULT NULL, "age" SMALLINT)'],
);

test(
  'createTable not null column',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: 'primary key',
      },
      name: {
        type: b.type.text,
        constraints: ['not null'],
      },
    },
  }),
  ['CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT NOT NULL)'],
);

test(
  'createTable not null column 2',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: 'primary key',
      },
      name: {
        type: b.type.text,
        constraints: b.constraint.notNull(),
      },
    },
  }),
  ['CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT NOT NULL)'],
);

test(
  'createTable unique column',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: 'primary key',
      },
      name: {
        type: b.type.text,
        constraints: 'UNIQUE',
      },
    },
  }),
  ['CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT UNIQUE)'],
);

test(
  'createTable unique column 2',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: 'primary key',
      },
      name: {
        type: b.type.text,
        constraints: b.constraint.unique(),
      },
    },
  }),
  ['CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT UNIQUE)'],
);

test(
  'createTable unique column 3',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: 'primary key',
      },
      name: {
        type: b.type.text,
        constraints: b.constraint.unique({ primaryKey: true }),
      },
    },
  }),
  ['CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT PRIMARY KEY)'],
);

test(
  'createTable named constraint',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: 'primary key',
      },
      name: {
        type: b.type.text,
        constraints: b.constraint.unique({ name: 'foo' }),
      },
    },
  }),
  ['CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT CONSTRAINT "foo" UNIQUE)'],
);

test(
  'createTable deferrable constraint 1',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: 'primary key',
      },
      name: {
        type: b.type.text,
        constraints: b.constraint.unique({ name: 'foo', deferrable: true }),
      },
    },
  }),
  [
    'CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT CONSTRAINT "foo" UNIQUE INITIALLY IMMEDIATE DEFERRABLE)',
  ],
);

test(
  'createTable deferrable constraint 2',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: 'primary key',
      },
      name: {
        type: b.type.text,
        constraints: b.constraint.unique({ name: 'foo', deferrable: true, initiallyDeferred: true }),
      },
    },
  }),
  [
    'CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT CONSTRAINT "foo" UNIQUE INITIALLY DEFERRED DEFERRABLE)',
  ],
);

test(
  'createTable column collation',
  isSqls,
  b.schema.createTable('employees', {
    columns: {
      id: {
        type: b.type.bigInt,
        constraints: 'primary key',
      },
      name: {
        type: b.type.text,
        constraints: b.constraint.unique(),
        collation: 'fr_FR',
      },
    },
  }),
  ['CREATE TABLE "employees" ("id" BIGINT PRIMARY KEY, "name" TEXT UNIQUE COLLATE "fr_FR")'],
);

test(
  'createView simple',
  isSqls,
  be.schema.createView('old_employees', {
    query: be.from('employee').select('*')(be => be.where(be.fn.gt('age', be.lit(50)))),
  }),
  ['CREATE VIEW "old_employees" AS SELECT * FROM "employee" WHERE "age" > 50'],
);

test(
  'createView columns',
  isSqls,
  be.schema.createView('old_employees', {
    columns: ['id', 'bar'], // TODO see if there's some way to get this to type-check
    query: be.from('employee').select('*')(be => be.where(be.fn.gt('age', be.lit(50)))),
    withLocalCheckOption: false,
  }),
  ['CREATE VIEW "old_employees" ("id", "bar") AS SELECT * FROM "employee" WHERE "age" > 50'],
);

test(
  'createView cascaded check option',
  isSqls,
  be.schema.createView('old_employees', {
    columns: ['id', 'bar'], // TODO see if there's some way to get this to type-check
    query: be.from('employee').select('*')(be => be.where(be.fn.gt('age', be.lit(50)))),
    withCascadedCheckOption: true,
  }),
  ['CREATE VIEW "old_employees" ("id", "bar") AS SELECT * FROM "employee" WHERE "age" > 50 WITH CASCADED CHECK OPTION'],
);

test(
  'createView local check option',
  isSqls,
  be.schema.createView('old_employees', {
    columns: ['foo', 'bar'], // TODO see if there's some way to get this to type-check
    query: be.from('employee').select('*')(be => be.where(be.fn.gt('age', be.lit(50)))),
    withLocalCheckOption: true,
  }),
  ['CREATE VIEW "old_employees" ("foo", "bar") AS SELECT * FROM "employee" WHERE "age" > 50 WITH LOCAL CHECK OPTION'],
);
