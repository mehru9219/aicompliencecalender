/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alerts from "../alerts.js";
import type * as audit from "../audit.js";
import type * as auditReports from "../auditReports.js";
import type * as billing from "../billing.js";
import type * as calendar from "../calendar.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as deadlines from "../deadlines.js";
import type * as documents from "../documents.js";
import type * as forms from "../forms.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
import type * as organizations from "../organizations.js";
import type * as profiles from "../profiles.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as storage from "../storage.js";
import type * as team from "../team.js";
import type * as templates from "../templates.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  audit: typeof audit;
  auditReports: typeof auditReports;
  billing: typeof billing;
  calendar: typeof calendar;
  crons: typeof crons;
  dashboard: typeof dashboard;
  deadlines: typeof deadlines;
  documents: typeof documents;
  forms: typeof forms;
  "lib/permissions": typeof lib_permissions;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
  organizations: typeof organizations;
  profiles: typeof profiles;
  reports: typeof reports;
  seed: typeof seed;
  storage: typeof storage;
  team: typeof team;
  templates: typeof templates;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
