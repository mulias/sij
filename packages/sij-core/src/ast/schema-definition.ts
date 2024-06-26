import { Extension, NoExtension } from './util';
import { Tagged, UnTag, tag } from '../util';
import type { Query } from './query';
import type { Ident, Expr, Lit, QualifiedIdent } from './expr';
import { DataType } from './data-type';
import { NumLit } from './literal';

/*
<SQL schema definition statement> ::=
    <schema definition>
  | <table definition>
  | <view definition>
  | <grant statement>
  | <domain definition>
  | <character set definition> // Not implemented in major DBs
  | <collation definition> // Not implemented in major DBs
  | <translation definition> // Not implemented in major DBs
  | <assertion definition>
*/
type SchemaDefinitionStatement<Ext extends Extension> =
  | SchemaDefinition<Ext>
  | TableDefinition<Ext>
  | ViewDefinition<Ext>
  | GrantStatement<Ext>
  | DomainDefinition<Ext>;

/*
<schema definition> ::=
  CREATE SCHEMA <schema name clause>
    [ <schema character set specification> ]
    [ <schema element>... ]

<schema name clause> ::=
    <schema name>
  | AUTHORIZATION <schema authorization identifier>
  | <schema name> AUTHORIZATION <schema authorization identifier>

<schema authorization identifier> ::=
  <authorization identifier>

<schema name> ::=
  [ <catalog name> <period> ] <unqualified schema name>

<authorization identifier> ::= <identifier>

<schema character set specification> ::=
  DEFAULT CHARACTER SET <character set specification>
*/
interface SchemaDefinition<Ext extends Extension>
  extends Tagged<
    'SchemaDefinition',
    {
      readonly name: QualifiedIdent;
      readonly authorization: Ident | null;
      readonly characterSet: Ident | null; // TODO the spec seems to say this could be scoped by schema?
      readonly definitions: Array<SchemaDefinitionElement<Ext>>;
      readonly extensions: Ext['SchemaDefinition'] | null;
    }
  > {}
const SchemaDefinition = <Ext extends Extension>(args: UnTag<SchemaDefinition<Ext>>): SchemaDefinition<Ext> =>
  tag('SchemaDefinition', args);

/*
<domain definition> ::=
    CREATE DOMAIN <domain name> [ AS ] <data type>
      [ <default clause> ]
      [ <domain constraint>... ]
      [ <collate clause> ]

<domain constraint> ::=
    [ <constraint name definition> ]
    <check constraint definition> [ <constraint attributes> ]
*/
interface DomainDefinition<Ext extends Extension> // MySQL doesn't support domains
  extends Tagged<
    'DomainDefinition',
    {
      readonly name: QualifiedIdent;
      readonly dataType: DataType;
      readonly default: DefaultOption | null;
      readonly constraints: Array<ConstraintDefinition<CheckConstraint<Ext>, Ext>>;
      readonly collation: Ident | null; // TODO qualify
      readonly extensions: Ext['DomainDefinition'] | null;
    }
  > {}
const DomainDefinition = <Ext extends Extension>(args: UnTag<DomainDefinition<Ext>>): DomainDefinition<Ext> =>
  tag('DomainDefinition', args);

/*
<table definition> ::=
    CREATE [ { GLOBAL | LOCAL } TEMPORARY ] TABLE <table name>
      <table element list>
      [ ON COMMIT { DELETE | PRESERVE } ROWS ]

<table element list> ::=
      <left paren> <table element> [ { <comma> <table element> }... ] <right paren>

<table element> ::=
      <column definition>
    | <table constraint definition>
*/
interface TableDefinition<Ext extends Extension>
  extends Tagged<
    'TableDefinition',
    {
      readonly name: QualifiedIdent;
      readonly mode: 'Persistent' | 'GlobalTemp' | 'LocalTemp';
      readonly columns: Array<ColumnDefinition<Ext>>;
      readonly constraints: Array<TableConstraint<Ext>>;
      readonly onCommit: 'Delete' | 'Preserve' | null;
      readonly extensions: Ext['TableDefinition'] | null;
    }
  > {}
const TableDefinition = <Ext extends Extension>(args: UnTag<TableDefinition<Ext>>): TableDefinition<Ext> =>
  tag('TableDefinition', args);

/*
<column definition> ::=
    <column name> { <data type> | <domain name> }
    [ <default clause> ]
    [ <column constraint definition>... ]
    [ <collate clause> ]

<collate clause> ::= COLLATE <collation name>
*/
interface ColumnDefinition<Ext extends Extension>
  extends Tagged<
    'ColumnDefinition',
    {
      readonly name: Ident;
      readonly type: DataType | Ident; // Data type or domain identifier
      readonly default: DefaultOption | null;
      readonly constraints: Array<ColumnConstraintDefinition<Ext>>;
      readonly collation: Ident | null; // TODO qualify
      readonly extensions: Ext['ColumnDefinition'] | null;
    }
  > {}
const ColumnDefinition = <Ext extends Extension>(args: UnTag<ColumnDefinition<Ext>>): ColumnDefinition<Ext> =>
  tag('ColumnDefinition', args);

/*
<column constraint definition> ::=
    [ <constraint name definition> ]
    <column constraint>
      [ <constraint attributes> ]

<constraint name definition> ::= CONSTRAINT <constraint name>

<column constraint> ::=
      NOT NULL
    | <unique specification>
    | <references specification>
    | <check constraint definition>
*/
type ColumnConstraintDefinition<Ext extends Extension> = ConstraintDefinition<
  ColumnNotNull | UniqueConstraint<Ext> | ReferenceConstraint<Ext> | CheckConstraint<Ext>,
  Ext
>;

interface ColumnNotNull extends Tagged<'ColumnNotNull', {}> {}
const ColumnNotNull: ColumnNotNull = tag('ColumnNotNull', {});

/*
<unique constraint definition> ::=
  UNIQUE | PRIMARY KEY
    <left paren> <column name list> <right paren>
*/
interface UniqueConstraint<Ext extends Extension> extends Tagged<'UniqueConstraint', {}> {
  readonly primaryKey: boolean;
  readonly columns: Array<Ident>; // Columns CANNOT be qualified here.
  readonly extensions: Ext['UniqueConstraint'] | null;
}
const UniqueConstraint = <Ext extends Extension>(args: UnTag<UniqueConstraint<Ext>>): UniqueConstraint<Ext> =>
  tag('UniqueConstraint', args);

/*
<references specification> ::=
    REFERENCES <table name> [ <left paren> <column name list> <right paren> ]
      [ MATCH <match type> ]
      [ <referential triggered action> ]

<referenced table and columns> ::=
    <table name> [ <left paren> <column name list> <right paren> ]

<match type> ::=
      FULL
    | PARTIAL

<referential triggered action> ::=
      <update rule> [ <delete rule> ]
    | <delete rule> [ <update rule> ]

<update rule> ::= ON UPDATE <referential action>

<delete rule> ::= ON DELETE <referential action>
*/
interface ReferenceConstraint<Ext extends Extension> extends Tagged<'ReferenceConstraint', {}> {
  readonly table: Ident; // TODO check if this needs to be qualified.
  readonly matchType: 'Regular' | 'Full' | 'Partial';
  readonly columns: Array<Ident> | null; // Columns CANNOT be qualified here.
  readonly onUpdate: ReferentialAction | null;
  readonly onDelete: ReferentialAction | null;
  readonly extensions: Ext['ReferenceConstraint'] | null;
}
const ReferenceConstraint = <Ext extends Extension>(args: UnTag<ReferenceConstraint<Ext>>): ReferenceConstraint<Ext> =>
  tag('ReferenceConstraint', args);

/*
<referential action> ::=
    CASCADE
  | SET NULL
  | SET DEFAULT
  | NO ACTION
*/
type ReferentialAction = 'Cascade' | 'SetNull' | 'SetDefault' | 'NoAction';

/*
<default clause> ::=
      DEFAULT <default option>

<default option> ::=
      <literal>
    | <datetime value function>
    | USER
    | CURRENT_USER
    | SESSION_USER
    | SYSTEM_USER
    | NULL

<datetime value function> ::=
      <current date value function>
    | <current time value function>
    | <current timestamp value function>

<current date value function> ::= CURRENT_DATE

<current time value function> ::=
      CURRENT_TIME [ <left paren> <time precision> <right paren> ]


<current timestamp value function> ::=
      CURRENT_TIMESTAMP [ <left paren> <timestamp precision> <right paren> ]
*/
type DefaultOption =
  | Lit
  | CurrentDateDefault
  | CurrentTime
  | CurrentTimeStamp
  | UserDefault
  | CurrentUserDefault
  | SessionUserDefault
  | SystemUserDefault
  | NullDefault;

interface CurrentTime extends Tagged<'CurrentTime', {}> {
  readonly precision: NumLit | null;
}
const CurrentTime = (args: UnTag<CurrentTime>): CurrentTime => tag('CurrentTime', args);

interface CurrentTimeStamp extends Tagged<'CurrentTimeStamp', {}> {
  readonly precision: NumLit | null;
}
const CurrentTimeStamp = (args: UnTag<CurrentTimeStamp>): CurrentTimeStamp => tag('CurrentTimeStamp', args);

interface UserDefault extends Tagged<'UserDefault', {}> {}
const UserDefault: UserDefault = tag('UserDefault', {});

interface CurrentUserDefault extends Tagged<'CurrentUserDefault', {}> {}
const CurrentUserDefault: CurrentUserDefault = tag('CurrentUserDefault', {});

interface SessionUserDefault extends Tagged<'SessionUserDefault', {}> {}
const SessionUserDefault: SessionUserDefault = tag('SessionUserDefault', {});

interface SystemUserDefault extends Tagged<'SystemUserDefault', {}> {}
const SystemUserDefault: SystemUserDefault = tag('SystemUserDefault', {});

interface NullDefault extends Tagged<'NullDefault', {}> {}
const NullDefault: NullDefault = tag('NullDefault', {});

interface CurrentDateDefault extends Tagged<'CurrentDateDefault', {}> {}
const CurrentDateDefault: CurrentDateDefault = tag('CurrentDateDefault', {});

/*
<table constraint definition> ::=
    [ <constraint name definition> ]
    <table constraint> [ <constraint attributes> ]

<table constraint> ::=
      <unique constraint definition>
    | <referential constraint definition>
    | <check constraint definition>
*/
interface ConstraintDefinition<C, Ext extends Extension> extends Tagged<'ConstraintDefinition', {}> {
  readonly name: Ident | null;
  readonly constraint: C;
  readonly checkTime: ConstraintCheckTime<Ext> | null;
  readonly extensions: Ext['ConstraintDefinition'] | null;
}
const ConstraintDefinition = <C, Ext extends Extension>(
  args: UnTag<ConstraintDefinition<C, Ext>>,
): ConstraintDefinition<C, Ext> => tag('ConstraintDefinition', args);

type TableConstraint<Ext extends Extension> = ConstraintDefinition<
  UniqueConstraint<Ext> | ReferenceConstraint<Ext> | CheckConstraint<Ext>,
  Ext
>;

/*
<constraint attributes> ::=
      <constraint check time> [ [ NOT ] DEFERRABLE ]
    | [ NOT ] DEFERRABLE [ <constraint check time> ]

<constraint check time> ::=   INITIALLY DEFERRED
    | INITIALLY IMMEDIATE
*/
interface ConstraintCheckTime<Ext extends Extension> extends Tagged<'ConstraintCheckTime', {}> {
  readonly initiallyDeferred: boolean;
  readonly deferrable: boolean;
  readonly extensions: Ext['ConstraintCheckTime'] | null;
}
const ConstraintCheckTime = <Ext extends Extension>(args: UnTag<ConstraintCheckTime<Ext>>): ConstraintCheckTime<Ext> =>
  tag('ConstraintCheckTime', args);

/*
<check constraint definition> ::=
  CHECK <left paren> <search condition> <right paren>
*/
interface CheckConstraint<Ext extends Extension> extends Tagged<'CheckConstraint', {}> {
  readonly search: Expr<Ext>;
}
const CheckConstraint = <Ext extends Extension>(args: UnTag<CheckConstraint<Ext>>): CheckConstraint<Ext> =>
  tag('CheckConstraint', args);

/*
<schema element> ::=
    <domain definition>
  | <table definition>
  | <view definition>
  | <grant statement>
  | <assertion definition>
  | <character set definition>
  | <collation definition>
  | <translation definition>
*/
type SchemaDefinitionElement<Ext extends Extension> =
  | DomainDefinition<Ext>
  | TableDefinition<Ext>
  | ViewDefinition<Ext>
  | GrantStatement<Ext>;
//  | AssertionDefinition;
//  | CharacterSetDefinitions Unimplemented in major dialects
//  | CollationDefinition Unimplemented in major dialects
//  | TranslationDefinition Unimplemented in major dialects

/*
<view definition> ::=
    CREATE VIEW <table name> [ <left paren> <column name list> <right paren> ]
      AS <query expression>
      [ WITH [ CASCADED | LOCAL ] CHECK OPTION ]
*/
interface ViewDefinition<Ext extends Extension> extends Tagged<'ViewDefinition', {}> {
  readonly name: QualifiedIdent;
  readonly columns: Array<Ident>;
  readonly query: Query<Ext>; // TODO can also be a VALUES statement
  readonly checkOption: 'Cascaded' | 'Local' | null;
  readonly extensions: Ext['ViewDefinition'] | null;
}
const ViewDefinition = <Ext extends Extension>(args: UnTag<ViewDefinition<Ext>>): ViewDefinition<Ext> =>
  tag('ViewDefinition', args);

/*
<grant statement> ::=
    GRANT <privileges> ON <object name>
      TO <grantee> [ { <comma> <grantee> }... ]
        [ WITH GRANT OPTION ]

<object name> ::=
      [ TABLE ] <table name>
    | DOMAIN <domain name>
    | COLLATION <collation name>
    | CHARACTER SET <character set name>
    | TRANSLATION <translation name>

<privileges> ::=
      ALL PRIVILEGES
    | <action> [ { <comma> <action> }... ]

<grantee> ::=
      PUBLIC
    | <authorization identifier>
*/
interface GrantStatement<Ext extends Extension> extends Tagged<'GrantStatement', {}> {
  readonly privileges: Array<Privilege> | null;
  readonly objectName: Ident; // TODO some of these can be qualified.
  readonly objectType: 'Table' | 'Domain' | 'Collation' | 'CharacterSet' | 'Translation';
  readonly grantees: Array<Ident> | null; // null means PUBLIC
  readonly grantOption: boolean;
  readonly extensions: Ext['GrantStatement'] | null;
}
const GrantStatement = <Ext extends Extension>(args: UnTag<GrantStatement<Ext>>): GrantStatement<Ext> =>
  tag('GrantStatement', args);

/*
<action> ::=
      SELECT
    | DELETE
    | INSERT [ <left paren> <column name list> <right paren> ]
    | UPDATE [ <left paren> <column name list> <right paren> ]
    | REFERENCES [ <left paren> <column name list> <right paren> ]
    | USAGE
*/
type Privilege =
  | SelectPrivilege
  | DeletePrivilege
  | InsertPrivilege
  | UpdatePrivilege
  | ReferencePrivilege
  | UsagePrivilege;

interface SelectPrivilege extends Tagged<'SelectPrivilege', {}> {}
const SelectPrivilege: SelectPrivilege = tag('SelectPrivilege', {});

interface DeletePrivilege extends Tagged<'DeletePrivilege', {}> {}
const DeletePrivilege: DeletePrivilege = tag('DeletePrivilege', {});

interface UsagePrivilege extends Tagged<'UsagePrivilege', {}> {}
const UsagePrivilege: UsagePrivilege = tag('UsagePrivilege', {});

interface InsertPrivilege extends Tagged<'InsertPrivilege', {}> {
  readonly columns: Array<Ident> | null;
}
const InsertPrivilege = (args: UnTag<InsertPrivilege>): InsertPrivilege => tag('InsertPrivilege', args);

interface UpdatePrivilege extends Tagged<'UpdatePrivilege', {}> {
  readonly columns: Array<Ident> | null;
}
const UpdatePrivilege = (args: UnTag<UpdatePrivilege>): UpdatePrivilege => tag('UpdatePrivilege', args);

interface ReferencePrivilege extends Tagged<'ReferencePrivilege', {}> {
  readonly columns: Array<Ident> | null;
}
const ReferencePrivilege = (args: UnTag<ReferencePrivilege>): ReferencePrivilege => tag('ReferencePrivilege', args);
/*
<character set definition> ::=
    CREATE CHARACTER SET <character set name> [ AS ]
      <character set source>
      [ <collate clause> | <limited collation definition> ]

<character set name> ::= [ <schema name> <period> ] <SQL language identifier>

<character set source> ::=
      GET <existing character set name>

<existing character set name> ::=
      <standard character repertoire name>
    | <implementation-defined character repertoire name>
    | <schema character set name>

<schema character set name> ::= <character set name>

<limited collation definition> ::=
    COLLATION FROM <collation source>

// The only DB I can find that supports this is hsqldb so I'm going to push this to dialects if anybody needs it
interface CharacterSetDefinition extends Tagged<'CharacterSetDefinition', {}> {
  readonly name: Ident, // TODO qualify
  readonly search: Query,
  readonly checkTime: ConstraintCheckTime | null,
};
const CharacterSetDefinition = (args: UnTag<CharacterSetDefinition>): CharacterSetDefinition => tag('CharacterSetDefinition', args);
*/

/*
<collation definition> ::=
    CREATE COLLATION <collation name> FOR <character set specification>

      FROM <collation source>
        [ <pad attribute> ]

<pad attribute> ::=
      NO PAD
    | PAD SPACE

<collation source> ::=
      <collating sequence definition>
    | <translation collation>

<collating sequence definition> ::=
      <external collation>
    | <schema collation name>
    | DESC <left paren> <collation name> <right paren>
    | DEFAULT

<translation collation> ::=
    TRANSLATION <translation name>
        [ THEN COLLATION <collation name> ]

<external collation> ::=
    EXTERNAL <left paren> <quote> <external collation name> <quote> <right paren>


<schema collation name> ::= <collation name>

<external collation name> ::=
      <standard collation name>
    | <implementation-defined collation name>

<standard collation name> ::= <collation name>

<implementation-defined collation name> ::= <collation name>

// Isn't implemented in any of the target databases
interface CollationDefinition extends Tagged<'CollationDefinition', {}> {
  readonly name: Ident,
};
const CollationDefinition = (args: UnTag<CollationDefinition>): CollationDefinition => tag('CollationDefinition', args);
*/

/*
<translation definition> ::=
    CREATE TRANSLATION <translation name>
      FOR <source character set specification>
        TO <target character set specification>
      FROM <translation source>

<source character set specification> ::= <character set specification>


<target character set specification> ::= <character set specification>


<translation source> ::=
      <translation specification>

<translation specification> ::=
      <external translation>
    | IDENTITY
    | <schema translation name>

<external translation> ::=
    EXTERNAL <left paren> <quote> <external translation name> <quote> <right paren>


<external translation name> ::=
      <standard translation name>
    | <implementation-defined translation name>

<standard translation name> ::= <translation name>

<implementation-defined translation name> ::= <translation name>

<schema translation name> ::= <translation name>

// Not implemented in target databases
interface TranslationDefinition extends Tagged<'TranslationDefinition', {}> {
  readonly name: Ident, // TODO qualify
};
const TranslationDefinition = (args: UnTag<TranslationDefinition>): TranslationDefinition => tag('TranslationDefinition', args);
*/

export {
  SchemaDefinitionStatement,
  SchemaDefinition,
  TableDefinition,
  ViewDefinition,
  DomainDefinition,
  Privilege,
  SelectPrivilege,
  DeletePrivilege,
  InsertPrivilege,
  UpdatePrivilege,
  ReferencePrivilege,
  UsagePrivilege,
  ConstraintCheckTime,
  ColumnDefinition,
  TableConstraint,
  DefaultOption,
  ConstraintDefinition,
  ReferenceConstraint,
  ReferentialAction,
  CheckConstraint,
  UniqueConstraint,
  ColumnConstraintDefinition,
  GrantStatement,
  CurrentDateDefault,
  CurrentTime,
  CurrentTimeStamp,
  UserDefault,
  CurrentUserDefault,
  SessionUserDefault,
  SystemUserDefault,
  NullDefault,
  ColumnNotNull,
};
