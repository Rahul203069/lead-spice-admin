import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  serial,
  jsonb,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** ---------------- AUTH TABLES ---------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_userId_idx").on(t.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
   workflowRunningProjectIds: text("workflow_running_project_ids").array(),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
  },
  (t) => [index("account_userId_idx").on(t.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)]
);

export const userProfile = pgTable("user_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  welcomeEmailSent: boolean("welcome_email_sent").default(false).notNull(),
  openaiApiKey: text("openai_api_key"),
  geminiApiKey: text("gemini_api_key"),
  millionVerifierApiKey: text("million_verifier_api_key"),
  findymailApiKey: text("findymail_api_key"),
  processedRows: integer("processed_rows").default(0).notNull(),
  lastResetDate: timestamp("last_reset_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const promptTemplates = pgTable(
  "prompt_templates",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    prompt: text("prompt").notNull(),
    type: text("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (t) => [index("prompt_templates_userId_idx").on(t.userId)]
);

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

/** ---------------- JOB ---------------- */

export const job = pgTable(
  "job",
  {
  idUuid: uuid("id_uuid").defaultRandom().primaryKey(), // ✅ ONLY primary key

    id: text("id").notNull(), // ✅ external/job-run id (queue id)
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // ✅ optional project link
    projectId: text("project_id").references(() => project.id, {
      onDelete: "set null",
    }),

    name: text("name"),
    status: text("status").notNull(),
    rowCount: integer("row_count"),
    processedRows: integer("processed_rows"),
    fileKey: text("file_key"),
    outputFileKey: text("output_file_key"),
    workflowType: text("workflow_type"),
    description: text("description"),
    failedReason: text("failed_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [
    index("job_userId_idx").on(t.userId),
    index("job_projectId_idx").on(t.projectId),
    index("job_userId_projectId_idx").on(t.userId, t.projectId),
  ]
);

/** ---------------- PROJECT ---------------- */

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),

    originalCsvS3Key: text("original_csv_s3_key").notNull(),
    currentStateS3Key: text("current_state_s3_key"),

    delimiter: text("delimiter"),
    hasHeader: boolean("has_header").default(true).notNull(),

    totalRows: integer("total_rows").notNull(),
    processedRows: integer("processed_rows").default(0).notNull(),

    status: text("status").default("draft").notNull(),
    lastError: text("last_error"),

    isPreviewSaved: boolean("is_preview_saved").default(false).notNull(),

    // ✅ NEW: marks if an export has been generated that includes deleted columns
    alreadyExportedWithDeletedColumns: boolean("already_exported_with_deleted_columns")
      .default(false)
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (t) => [
    index("project_userId_idx").on(t.userId),
    index("project_status_idx").on(t.status),
    index("project_userId_status_idx").on(t.userId, t.status),

    // (optional) only if you plan to query/filter by this often
    index("project_exported_with_deleted_idx").on(t.alreadyExportedWithDeletedColumns),
  ]
);


/** ---------------- TYPES ---------------- */

export type ColumnWorkflowOperationType =
  | "custom-ai"
  | "qualification"
  | "personalization"
  | "clean-data"
  | "email-verifier"
  | "email-finder";

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty";

export type ColumnWorkflowConfig = {
  operationType: ColumnWorkflowOperationType;

  prompt?: string;
  model?: string;
  deepPersonalization?: boolean;

  qualificationCriteria?: string;
  template?: string;

  // ✅ references are KEYS
  emailColumn?: string;
  firstNameColumn?: string;
  lastNameColumn?: string;
  domainColumn?: string;
  cleaningColumn?: string;
  webUrlColumn?: string;
  contextColumns?: string[];

  filterCondition?: {
    columnKey: string;
    operator: FilterOperator;
    value?: string;
  } | null;
};

/** ---------------- PROJECT COLUMN ---------------- */

type TestRowDataItem = {
  id: number;
  data: string;
};

export const projectColumn = pgTable(
  "project_column",
  {
    id: text("id").primaryKey(),

    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    key: text("key").notNull(),
    order: integer("order").default(0).notNull(),
    
    columnType: text("column_type").default("original").notNull(),
    isConfigurable: boolean("is_configurable").default(false).notNull(),

    config: jsonb("config").$type<ColumnWorkflowConfig | null>().default(null),

    // ✅ NEW: Store Conditional Execution Logic
    // This holds the 'enabled' flag, the 'script' for the backend, 
    // and the 'uiState' so the frontend can restore the Visual Builder.
    conditionConfig: jsonb("condition_config")
      .$type<{
        enabled: boolean;
        script: string;
        uiState?: {
          mode: 'visual' | 'code';
          column?: string;
          operator?: string;
          value?: string;
        };
      } | null>()
      .default(null),

    configVersion: integer("config_version").default(0).notNull(),
    lastProcessedConfigVersion: integer("last_processed_config_version")
      .default(0)
      .notNull(),

    status: text("status").default("pending").notNull(),
    lastError: text("last_error"),

    testRowData: jsonb("test_row_data")
      .$type<TestRowDataItem[] | null>()
      .default(null),

    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (t) => [
    index("project_column_projectId_idx").on(t.projectId),
    index("project_column_projectId_order_idx").on(t.projectId, t.order),
    index("project_column_projectId_deleted_idx").on(t.projectId, t.isDeleted),
    uniqueIndex("project_column_projectId_key_uniq").on(t.projectId, t.key),
  ]
);

/** ---------------- RELATIONS ---------------- */

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  profile: one(userProfile, { fields: [user.id], references: [userProfile.userId] }),
  projects: many(project),
  jobs: many(job),
  promptTemplates: many(promptTemplates),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, { fields: [userProfile.userId], references: [user.id] }),
}));

export const promptTemplatesRelations = relations(promptTemplates, ({ one }) => ({
  user: one(user, { fields: [promptTemplates.userId], references: [user.id] }),
}));

export const jobRelations = relations(job, ({ one }) => ({
  user: one(user, { fields: [job.userId], references: [user.id] }),
  project: one(project, { fields: [job.projectId], references: [project.id] }),
}));

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, { fields: [project.userId], references: [user.id] }),
  columns: many(projectColumn),
  jobs: many(job),
}));

export const projectColumnRelations = relations(projectColumn, ({ one }) => ({
  project: one(project, { fields: [projectColumn.projectId], references: [project.id] }),
}));

/** ---------------- EXPORT ---------------- */

export const schema = {
  user,
  session,
  account,
  verification,
  userProfile,
  promptTemplates,
  jwks,

  job,

  project,
  projectColumn,
};
