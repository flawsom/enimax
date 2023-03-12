interface Dexie {
    readonly name: string;
    readonly tables: Table[];
    readonly verno: number;
    readonly vip: Dexie;
  
    readonly _allTables: { [name: string]: Table<any, IndexableType> };
  
    readonly core: DBCore;
  
    _createTransaction: (
      this: Dexie,
      mode: IDBTransactionMode,
      storeNames: ArrayLike<string>,
      dbschema: DbSchema,
      parentTransaction?: Transaction | null
    ) => Transaction;
  
    readonly _novip: Dexie;
  
    _dbSchema: DbSchema;
  
    version(versionNumber: number): Version;
  
    on: DbEvents;
  
    open(): PromiseExtended<Dexie>;
  
    table<T = any, TKey = IndexableType>(tableName: string): Table<T, TKey>;
  
    transaction<U>(
      mode: TransactionMode,
      tables: readonly (string | Table)[],
      scope: (
        trans: TXWithTables<this>
      ) => PromiseLike<U> | U
    ): PromiseExtended<U>;
  
    transaction<U>(
      mode: TransactionMode,
      table: string | Table,
      scope: (trans: TXWithTables<this>) => PromiseLike<U> | U
    ): PromiseExtended<U>;
    transaction<U>(
      mode: TransactionMode,
      table: string | Table,
      table2: string | Table,
      scope: (trans: TXWithTables<this>) => PromiseLike<U> | U
    ): PromiseExtended<U>;
    transaction<U>(
      mode: TransactionMode,
      table: string | Table,
      table2: string | Table,
      table3: string | Table,
      scope: (trans: TXWithTables<this>) => PromiseLike<U> | U
    ): PromiseExtended<U>;
    transaction<U>(
      mode: TransactionMode,
      table: string | Table,
      table2: string | Table,
      table3: string | Table,
      table4: string | Table,
      scope: (trans: TXWithTables<this>) => PromiseLike<U> | U
    ): PromiseExtended<U>;
    transaction<U>(
      mode: TransactionMode,
      table: string | Table,
      table2: string | Table,
      table3: string | Table,
      table5: string | Table,
      scope: (trans: TXWithTables<this>) => PromiseLike<U> | U
    ): PromiseExtended<U>;
    
    close(): void;
  
    delete(): PromiseExtended<void>;
  
    isOpen(): boolean;
  
    hasBeenClosed(): boolean;
  
    hasFailed(): boolean;
  
    dynamicallyOpened(): boolean;
  
    backendDB(): IDBDatabase;
  
    use(middleware: Middleware<DBCore>): this;
    // Add more supported stacks here... : use(middleware: Middleware<HookStack>): this;
    unuse({ stack, create }: Middleware<{ stack: keyof DexieStacks }>): this;
    unuse({ stack, name }: { stack: keyof DexieStacks; name: string }): this;
  
    // Make it possible to touch physical class constructors where they reside - as properties on db instance.
    // For example, checking if (x instanceof db.Table). Can't do (x instanceof Dexie.Table because it's just a virtual interface)
    Table: { prototype: Table };
    WhereClause: { prototype: WhereClause };
    Version: { prototype: Version };
    Transaction: { prototype: Transaction };
    Collection: { prototype: Collection };
  }