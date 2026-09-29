--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "users_baseId_fkey";
ALTER TABLE IF EXISTS ONLY public.transfers DROP CONSTRAINT IF EXISTS "transfers_sourceBaseId_fkey";
ALTER TABLE IF EXISTS ONLY public.transfers DROP CONSTRAINT IF EXISTS "transfers_initiatedById_fkey";
ALTER TABLE IF EXISTS ONLY public.transfers DROP CONSTRAINT IF EXISTS "transfers_equipmentTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.transfers DROP CONSTRAINT IF EXISTS "transfers_destinationBaseId_fkey";
ALTER TABLE IF EXISTS ONLY public.transfers DROP CONSTRAINT IF EXISTS "transfers_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_balances DROP CONSTRAINT IF EXISTS "stock_balances_equipmentTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_balances DROP CONSTRAINT IF EXISTS "stock_balances_baseId_fkey";
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS "refresh_tokens_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.purchases DROP CONSTRAINT IF EXISTS "purchases_reversedById_fkey";
ALTER TABLE IF EXISTS ONLY public.purchases DROP CONSTRAINT IF EXISTS "purchases_equipmentTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.purchases DROP CONSTRAINT IF EXISTS "purchases_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.purchases DROP CONSTRAINT IF EXISTS "purchases_baseId_fkey";
ALTER TABLE IF EXISTS ONLY public.expenditures DROP CONSTRAINT IF EXISTS "expenditures_reversedById_fkey";
ALTER TABLE IF EXISTS ONLY public.expenditures DROP CONSTRAINT IF EXISTS "expenditures_recordedById_fkey";
ALTER TABLE IF EXISTS ONLY public.expenditures DROP CONSTRAINT IF EXISTS "expenditures_equipmentTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.expenditures DROP CONSTRAINT IF EXISTS "expenditures_baseId_fkey";
ALTER TABLE IF EXISTS ONLY public.expenditures DROP CONSTRAINT IF EXISTS "expenditures_assignmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS "assignments_equipmentTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS "assignments_baseId_fkey";
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS "assignments_assignedById_fkey";
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS "assignments_assetId_fkey";
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS "assets_purchaseId_fkey";
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS "assets_equipmentTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS "assets_currentBaseId_fkey";
DROP INDEX IF EXISTS public."users_role_isActive_idx";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public."users_baseId_idx";
DROP INDEX IF EXISTS public.transfers_status_source_idx;
DROP INDEX IF EXISTS public.transfers_status_destination_idx;
DROP INDEX IF EXISTS public."transfers_sourceBaseId_status_idx";
DROP INDEX IF EXISTS public."transfers_referenceNumber_key";
DROP INDEX IF EXISTS public."transfers_destinationBaseId_status_idx";
DROP INDEX IF EXISTS public."transfers_createdAt_idx";
DROP INDEX IF EXISTS public."stock_balances_equipmentTypeId_idx";
DROP INDEX IF EXISTS public."stock_balances_baseId_equipmentTypeId_key";
DROP INDEX IF EXISTS public."refresh_tokens_userId_revokedAt_idx";
DROP INDEX IF EXISTS public."refresh_tokens_tokenHash_key";
DROP INDEX IF EXISTS public."refresh_tokens_expiresAt_idx";
DROP INDEX IF EXISTS public.purchases_status_idx;
DROP INDEX IF EXISTS public."purchases_reversedById_key";
DROP INDEX IF EXISTS public."purchases_referenceNumber_key";
DROP INDEX IF EXISTS public."purchases_equipmentTypeId_purchaseDate_idx";
DROP INDEX IF EXISTS public."purchases_baseId_purchaseDate_idx";
DROP INDEX IF EXISTS public.expenditures_status_idx;
DROP INDEX IF EXISTS public."expenditures_reversedById_key";
DROP INDEX IF EXISTS public."expenditures_referenceNumber_key";
DROP INDEX IF EXISTS public."expenditures_equipmentTypeId_expenditureDate_idx";
DROP INDEX IF EXISTS public."expenditures_baseId_expenditureDate_idx";
DROP INDEX IF EXISTS public.equipment_types_code_key;
DROP INDEX IF EXISTS public."equipment_types_category_isActive_idx";
DROP INDEX IF EXISTS public."bases_isActive_idx";
DROP INDEX IF EXISTS public.bases_code_key;
DROP INDEX IF EXISTS public."audit_logs_userId_createdAt_idx";
DROP INDEX IF EXISTS public."audit_logs_entityType_entityId_idx";
DROP INDEX IF EXISTS public."audit_logs_createdAt_idx";
DROP INDEX IF EXISTS public."audit_logs_action_createdAt_idx";
DROP INDEX IF EXISTS public.assignments_status_idx;
DROP INDEX IF EXISTS public."assignments_referenceNumber_key";
DROP INDEX IF EXISTS public."assignments_baseId_assignmentDate_idx";
DROP INDEX IF EXISTS public."assets_serialNumber_key";
DROP INDEX IF EXISTS public."assets_equipmentTypeId_status_idx";
DROP INDEX IF EXISTS public."assets_currentBaseId_idx";
DROP INDEX IF EXISTS public."assets_assetNumber_key";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.transfers DROP CONSTRAINT IF EXISTS transfers_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_balances DROP CONSTRAINT IF EXISTS stock_balances_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.purchases DROP CONSTRAINT IF EXISTS purchases_pkey;
ALTER TABLE IF EXISTS ONLY public.expenditures DROP CONSTRAINT IF EXISTS expenditures_pkey;
ALTER TABLE IF EXISTS ONLY public.equipment_types DROP CONSTRAINT IF EXISTS equipment_types_pkey;
ALTER TABLE IF EXISTS ONLY public.bases DROP CONSTRAINT IF EXISTS bases_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS assets_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.transfers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.stock_balances ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.refresh_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.purchases ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.expenditures ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.equipment_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bases ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assignments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assets ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.transfers_id_seq;
DROP TABLE IF EXISTS public.transfers;
DROP SEQUENCE IF EXISTS public.stock_balances_id_seq;
DROP TABLE IF EXISTS public.stock_balances;
DROP SEQUENCE IF EXISTS public.refresh_tokens_id_seq;
DROP TABLE IF EXISTS public.refresh_tokens;
DROP SEQUENCE IF EXISTS public.purchases_id_seq;
DROP TABLE IF EXISTS public.purchases;
DROP SEQUENCE IF EXISTS public.expenditures_id_seq;
DROP TABLE IF EXISTS public.expenditures;
DROP SEQUENCE IF EXISTS public.equipment_types_id_seq;
DROP TABLE IF EXISTS public.equipment_types;
DROP SEQUENCE IF EXISTS public.bases_id_seq;
DROP TABLE IF EXISTS public.bases;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.assignments_id_seq;
DROP TABLE IF EXISTS public.assignments;
DROP SEQUENCE IF EXISTS public.assets_id_seq;
DROP TABLE IF EXISTS public.assets;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TYPE IF EXISTS public."TransferStatus";
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."LedgerStatus";
DROP TYPE IF EXISTS public."ExpenditureReason";
DROP TYPE IF EXISTS public."EquipmentCategory";
DROP TYPE IF EXISTS public."AuditAction";
DROP TYPE IF EXISTS public."AssignmentStatus";
DROP TYPE IF EXISTS public."AssetStatus";
--
-- Name: AssetStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssetStatus" AS ENUM (
    'IN_STOCK',
    'ASSIGNED',
    'IN_TRANSIT',
    'MAINTENANCE',
    'DISPOSED'
);


--
-- Name: AssignmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssignmentStatus" AS ENUM (
    'ACTIVE',
    'PARTIALLY_RETURNED',
    'RETURNED',
    'EXPIRED'
);


--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditAction" AS ENUM (
    'LOGIN',
    'LOGIN_FAILED',
    'LOGOUT',
    'REGISTER',
    'PASSWORD_CHANGED',
    'PASSWORD_RESET',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DEACTIVATED',
    'BASE_CREATED',
    'BASE_UPDATED',
    'EQUIPMENT_CREATED',
    'EQUIPMENT_UPDATED',
    'PURCHASE_CREATED',
    'PURCHASE_REVERSED',
    'TRANSFER_CREATED',
    'TRANSFER_APPROVED',
    'TRANSFER_REJECTED',
    'TRANSFER_CANCELLED',
    'TRANSFER_COMPLETED',
    'ASSIGNMENT_CREATED',
    'ASSIGNMENT_RETURNED',
    'EXPENDITURE_CREATED',
    'EXPENDITURE_REVERSED'
);


--
-- Name: EquipmentCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EquipmentCategory" AS ENUM (
    'VEHICLE',
    'WEAPON',
    'AMMUNITION',
    'OTHER'
);


--
-- Name: ExpenditureReason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExpenditureReason" AS ENUM (
    'TRAINING',
    'DAMAGE',
    'LOSS',
    'MAINTENANCE',
    'OTHER'
);


--
-- Name: LedgerStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LedgerStatus" AS ENUM (
    'ACTIVE',
    'REVERSED'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'BASE_COMMANDER',
    'LOGISTICS_OFFICER'
);


--
-- Name: TransferStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransferStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    "assetNumber" character varying(40) NOT NULL,
    "serialNumber" character varying(80),
    "equipmentTypeId" integer NOT NULL,
    "currentBaseId" integer NOT NULL,
    status public."AssetStatus" DEFAULT 'IN_STOCK'::public."AssetStatus" NOT NULL,
    "purchaseId" integer,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id integer NOT NULL,
    "referenceNumber" character varying(30) NOT NULL,
    "baseId" integer NOT NULL,
    "equipmentTypeId" integer,
    "assetId" integer,
    "personnelName" character varying(120) NOT NULL,
    "personnelId" character varying(60),
    designation character varying(80),
    quantity integer DEFAULT 1 NOT NULL,
    "returnedQuantity" integer DEFAULT 0 NOT NULL,
    "assignmentDate" date NOT NULL,
    status public."AssignmentStatus" DEFAULT 'ACTIVE'::public."AssignmentStatus" NOT NULL,
    "assignedById" integer NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT assignments_date_valid CHECK ((("assignmentDate" IS NOT NULL) AND ("assignmentDate" <= (CURRENT_DATE + '1 day'::interval)))),
    CONSTRAINT assignments_returned_within_quantity CHECK ((("returnedQuantity" >= 0) AND ("returnedQuantity" <= quantity))),
    CONSTRAINT assignments_target_required CHECK ((("assetId" IS NOT NULL) OR ("equipmentTypeId" IS NOT NULL)))
);


--
-- Name: assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assignments_id_seq OWNED BY public.assignments.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    "userId" integer,
    "userEmail" character varying(180),
    action public."AuditAction" NOT NULL,
    "entityType" character varying(40) NOT NULL,
    "entityId" character varying(60),
    method character varying(10) NOT NULL,
    endpoint character varying(200) NOT NULL,
    "ipAddress" character varying(64),
    "userAgent" text,
    "statusCode" integer,
    "requestId" character varying(60) NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: bases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bases (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(120) NOT NULL,
    location character varying(200),
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: bases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bases_id_seq OWNED BY public.bases.id;


--
-- Name: equipment_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_types (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(120) NOT NULL,
    category public."EquipmentCategory" NOT NULL,
    "unitOfMeasure" character varying(30) DEFAULT 'unit'::character varying NOT NULL,
    "isTrackable" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: equipment_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_types_id_seq OWNED BY public.equipment_types.id;


--
-- Name: expenditures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenditures (
    id integer NOT NULL,
    "referenceNumber" character varying(30) NOT NULL,
    "baseId" integer NOT NULL,
    "equipmentTypeId" integer NOT NULL,
    quantity integer NOT NULL,
    "expenditureDate" date NOT NULL,
    reason public."ExpenditureReason" NOT NULL,
    notes text,
    status public."LedgerStatus" DEFAULT 'ACTIVE'::public."LedgerStatus" NOT NULL,
    "reversedById" integer,
    "assignmentId" integer,
    "recordedById" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT expenditures_date_valid CHECK ((("expenditureDate" IS NOT NULL) AND ("expenditureDate" <= (CURRENT_DATE + '1 day'::interval)))),
    CONSTRAINT expenditures_quantity_positive CHECK ((quantity > 0))
);


--
-- Name: expenditures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expenditures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expenditures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expenditures_id_seq OWNED BY public.expenditures.id;


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchases (
    id integer NOT NULL,
    "referenceNumber" character varying(30) NOT NULL,
    "baseId" integer NOT NULL,
    "equipmentTypeId" integer NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" numeric(12,2),
    supplier character varying(150),
    "purchaseDate" date NOT NULL,
    notes text,
    status public."LedgerStatus" DEFAULT 'ACTIVE'::public."LedgerStatus" NOT NULL,
    "reversedById" integer,
    "createdById" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT purchases_date_valid CHECK ((("purchaseDate" IS NOT NULL) AND ("purchaseDate" <= (CURRENT_DATE + '1 day'::interval)))),
    CONSTRAINT purchases_quantity_positive CHECK ((quantity > 0))
);


--
-- Name: purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchases_id_seq OWNED BY public.purchases.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "tokenHash" character varying(128) NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "userAgent" text,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: stock_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_balances (
    id integer NOT NULL,
    "baseId" integer NOT NULL,
    "equipmentTypeId" integer NOT NULL,
    "openingQuantity" integer DEFAULT 0 NOT NULL,
    "openingDate" date NOT NULL,
    "onHandQuantity" integer DEFAULT 0 NOT NULL,
    "committedQuantity" integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT stock_balances_committed_within_on_hand CHECK (("committedQuantity" <= "onHandQuantity")),
    CONSTRAINT stock_balances_non_negative CHECK ((("onHandQuantity" >= 0) AND ("committedQuantity" >= 0)))
);


--
-- Name: stock_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_balances_id_seq OWNED BY public.stock_balances.id;


--
-- Name: transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transfers (
    id integer NOT NULL,
    "referenceNumber" character varying(30) NOT NULL,
    "sourceBaseId" integer NOT NULL,
    "destinationBaseId" integer NOT NULL,
    "equipmentTypeId" integer NOT NULL,
    quantity integer NOT NULL,
    status public."TransferStatus" DEFAULT 'PENDING'::public."TransferStatus" NOT NULL,
    "initiatedById" integer NOT NULL,
    "approvedById" integer,
    "decisionReason" text,
    notes text,
    "completedAt" timestamp(3) without time zone,
    "cancelledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT transfers_bases_must_differ CHECK (("sourceBaseId" <> "destinationBaseId")),
    CONSTRAINT transfers_quantity_positive CHECK ((quantity > 0))
);


--
-- Name: transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transfers_id_seq OWNED BY public.transfers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(180) NOT NULL,
    "passwordHash" character varying(255) NOT NULL,
    role public."Role" NOT NULL,
    "baseId" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "tokenVersion" integer DEFAULT 1 NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments ALTER COLUMN id SET DEFAULT nextval('public.assignments_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: bases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bases ALTER COLUMN id SET DEFAULT nextval('public.bases_id_seq'::regclass);


--
-- Name: equipment_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_types ALTER COLUMN id SET DEFAULT nextval('public.equipment_types_id_seq'::regclass);


--
-- Name: expenditures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures ALTER COLUMN id SET DEFAULT nextval('public.expenditures_id_seq'::regclass);


--
-- Name: purchases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases ALTER COLUMN id SET DEFAULT nextval('public.purchases_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: stock_balances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_balances ALTER COLUMN id SET DEFAULT nextval('public.stock_balances_id_seq'::regclass);


--
-- Name: transfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers ALTER COLUMN id SET DEFAULT nextval('public.transfers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
49dff43d-b1d4-44ba-93a9-1c7e788415da	7a9fec7c9c4c4c7d8e1672f7f172afd4d7e0d8e367a7e1da6bd296e0b438e68f	2026-09-30 03:59:19.63256+05:30	20260929222919_init	\N	\N	2026-09-30 03:59:19.529545+05:30	1
fe3703ed-9a8e-472d-9cdc-3c4fab3e9969	c69fb2514167b0932a388b30deb8f4606137a31fd1760352d8d312435a1519aa	2026-09-30 04:02:10.688064+05:30	20260929223112_add_inventory_constraints	\N	\N	2026-09-30 04:02:10.635763+05:30	1
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assets (id, "assetNumber", "serialNumber", "equipmentTypeId", "currentBaseId", status, "purchaseId", notes, "createdAt", "updatedAt") FROM stdin;
343	ALPHA-PATROL_VEH-001	SNALPHAPATR001	65	49	IN_STOCK	\N	\N	2026-09-29 23:38:20.221	2026-09-29 23:38:20.221
344	ALPHA-PATROL_VEH-002	SNALPHAPATR002	65	49	IN_STOCK	\N	\N	2026-09-29 23:38:20.223	2026-09-29 23:38:20.223
345	ALPHA-PATROL_VEH-003	SNALPHAPATR003	65	49	IN_STOCK	\N	\N	2026-09-29 23:38:20.224	2026-09-29 23:38:20.224
346	ALPHA-ASSAULT_RIFLE-001	SNALPHAASSA001	66	49	IN_STOCK	\N	\N	2026-09-29 23:38:20.226	2026-09-29 23:38:20.226
347	ALPHA-ASSAULT_RIFLE-002	SNALPHAASSA002	66	49	IN_STOCK	\N	\N	2026-09-29 23:38:20.227	2026-09-29 23:38:20.227
348	ALPHA-ASSAULT_RIFLE-003	SNALPHAASSA003	66	49	IN_STOCK	\N	\N	2026-09-29 23:38:20.229	2026-09-29 23:38:20.229
349	ALPHA-RADIO_SET-001	SNALPHARADI001	68	49	IN_STOCK	\N	\N	2026-09-29 23:38:20.23	2026-09-29 23:38:20.23
350	ALPHA-RADIO_SET-002	SNALPHARADI002	68	49	IN_STOCK	\N	\N	2026-09-29 23:38:20.231	2026-09-29 23:38:20.231
351	ALPHA-RADIO_SET-003	SNALPHARADI003	68	49	IN_STOCK	\N	\N	2026-09-29 23:38:20.232	2026-09-29 23:38:20.232
352	BRAVO-PATROL_VEH-001	SNBRAVOPATR001	65	50	IN_STOCK	\N	\N	2026-09-29 23:38:20.235	2026-09-29 23:38:20.235
353	BRAVO-PATROL_VEH-002	SNBRAVOPATR002	65	50	IN_STOCK	\N	\N	2026-09-29 23:38:20.236	2026-09-29 23:38:20.236
354	BRAVO-PATROL_VEH-003	SNBRAVOPATR003	65	50	IN_STOCK	\N	\N	2026-09-29 23:38:20.237	2026-09-29 23:38:20.237
355	BRAVO-ASSAULT_RIFLE-001	SNBRAVOASSA001	66	50	IN_STOCK	\N	\N	2026-09-29 23:38:20.239	2026-09-29 23:38:20.239
356	BRAVO-ASSAULT_RIFLE-002	SNBRAVOASSA002	66	50	IN_STOCK	\N	\N	2026-09-29 23:38:20.24	2026-09-29 23:38:20.24
357	BRAVO-ASSAULT_RIFLE-003	SNBRAVOASSA003	66	50	IN_STOCK	\N	\N	2026-09-29 23:38:20.242	2026-09-29 23:38:20.242
358	BRAVO-RADIO_SET-001	SNBRAVORADI001	68	50	IN_STOCK	\N	\N	2026-09-29 23:38:20.243	2026-09-29 23:38:20.243
359	BRAVO-RADIO_SET-002	SNBRAVORADI002	68	50	IN_STOCK	\N	\N	2026-09-29 23:38:20.244	2026-09-29 23:38:20.244
360	BRAVO-RADIO_SET-003	SNBRAVORADI003	68	50	IN_STOCK	\N	\N	2026-09-29 23:38:20.245	2026-09-29 23:38:20.245
361	CHARLIE-PATROL_VEH-001	SNCHARLIEPATR001	65	51	IN_STOCK	\N	\N	2026-09-29 23:38:20.247	2026-09-29 23:38:20.247
362	CHARLIE-PATROL_VEH-002	SNCHARLIEPATR002	65	51	IN_STOCK	\N	\N	2026-09-29 23:38:20.249	2026-09-29 23:38:20.249
363	CHARLIE-PATROL_VEH-003	SNCHARLIEPATR003	65	51	IN_STOCK	\N	\N	2026-09-29 23:38:20.25	2026-09-29 23:38:20.25
364	CHARLIE-ASSAULT_RIFLE-001	SNCHARLIEASSA001	66	51	IN_STOCK	\N	\N	2026-09-29 23:38:20.251	2026-09-29 23:38:20.251
365	CHARLIE-ASSAULT_RIFLE-002	SNCHARLIEASSA002	66	51	IN_STOCK	\N	\N	2026-09-29 23:38:20.252	2026-09-29 23:38:20.252
366	CHARLIE-ASSAULT_RIFLE-003	SNCHARLIEASSA003	66	51	IN_STOCK	\N	\N	2026-09-29 23:38:20.253	2026-09-29 23:38:20.253
367	CHARLIE-RADIO_SET-001	SNCHARLIERADI001	68	51	IN_STOCK	\N	\N	2026-09-29 23:38:20.254	2026-09-29 23:38:20.254
368	CHARLIE-RADIO_SET-002	SNCHARLIERADI002	68	51	IN_STOCK	\N	\N	2026-09-29 23:38:20.256	2026-09-29 23:38:20.256
369	CHARLIE-RADIO_SET-003	SNCHARLIERADI003	68	51	IN_STOCK	\N	\N	2026-09-29 23:38:20.257	2026-09-29 23:38:20.257
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignments (id, "referenceNumber", "baseId", "equipmentTypeId", "assetId", "personnelName", "personnelId", designation, quantity, "returnedQuantity", "assignmentDate", status, "assignedById", notes, "createdAt", "updatedAt") FROM stdin;
471	ASN-2026-0013	51	67	\N	Sgt. Imran Sheikh	SV-4523	Explosive Ordnance Disposal	20	0	2026-08-28	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.175	2026-09-29 23:38:20.175
459	ASN-2026-0001	49	67	\N	Sgt. Manish Gupta	SV-4583	Motor Pool NCO	20	20	2026-08-04	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.164	2026-09-29 23:38:20.164
460	ASN-2026-0002	49	68	\N	Cpl. Aditya Kumar	SV-4560	Driver	20	0	2026-08-06	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.165	2026-09-29 23:38:20.165
461	ASN-2026-0003	50	67	\N	Lt. Karthik Menon	SV-4530	Signals Officer	16	16	2026-08-08	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.166	2026-09-29 23:38:20.166
462	ASN-2026-0004	50	66	\N	Cpl. Rohan Das	SV-4544	Machine Gunner	16	16	2026-08-10	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.167	2026-09-29 23:38:20.167
463	ASN-2026-0005	50	68	\N	Lt. Meera Joshi	SV-4482	Weapons Officer	8	8	2026-08-12	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.168	2026-09-29 23:38:20.168
464	ASN-2026-0006	50	67	\N	Cpl. Aditya Kumar	SV-4560	Driver	12	12	2026-08-14	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.169	2026-09-29 23:38:20.169
465	ASN-2026-0007	49	66	\N	Sgt. Manish Gupta	SV-4583	Motor Pool NCO	20	0	2026-08-16	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.17	2026-09-29 23:38:20.17
466	ASN-2026-0008	51	67	\N	Sgt. Vikram Rathore	SV-4501	Quartermaster	4	0	2026-08-18	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.171	2026-09-29 23:38:20.171
467	ASN-2026-0009	51	66	\N	Sgt. Priya Nair	SV-4552	Stores Clerk	8	8	2026-08-20	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.172	2026-09-29 23:38:20.172
468	ASN-2026-0010	49	67	\N	Sgt. Vikram Rathore	SV-4501	Quartermaster	4	4	2026-08-22	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.173	2026-09-29 23:38:20.173
469	ASN-2026-0011	49	66	\N	Lt. Sneha Patil	SV-4571	Platoon Commander	16	0	2026-08-24	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.174	2026-09-29 23:38:20.174
470	ASN-2026-0012	51	66	\N	Sgt. Priya Nair	SV-4552	Stores Clerk	20	20	2026-08-26	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.174	2026-09-29 23:38:20.174
472	ASN-2026-0014	51	66	\N	Capt. Arjun Rathore	SV-4471	Platoon Commander	8	0	2026-08-30	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.176	2026-09-29 23:38:20.176
473	ASN-2026-0015	50	67	\N	Capt. Arjun Rathore	SV-4471	Platoon Commander	20	0	2026-09-01	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.177	2026-09-29 23:38:20.177
474	ASN-2026-0016	50	67	\N	Lt. Sneha Patil	SV-4571	Platoon Commander	20	0	2026-09-07	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.178	2026-09-29 23:38:20.178
475	ASN-2026-0017	51	66	\N	Lt. Karthik Menon	SV-4530	Signals Officer	20	0	2026-09-09	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.179	2026-09-29 23:38:20.179
476	ASN-2026-0018	50	66	\N	Sgt. Vikram Rathore	SV-4501	Quartermaster	4	4	2026-09-11	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.179	2026-09-29 23:38:20.179
477	ASN-2026-0019	50	68	\N	Lt. Sneha Patil	SV-4571	Platoon Commander	12	0	2026-09-13	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.18	2026-09-29 23:38:20.18
478	ASN-2026-0020	50	68	\N	Cpl. Fatima Ansari	SV-4590	Rifleman	4	0	2026-09-15	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.181	2026-09-29 23:38:20.181
479	ASN-2026-0021	49	68	\N	Sgt. Manish Gupta	SV-4583	Motor Pool NCO	8	0	2026-09-17	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.181	2026-09-29 23:38:20.181
480	ASN-2026-0022	50	66	\N	Cpl. Fatima Ansari	SV-4590	Rifleman	8	8	2026-09-19	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.182	2026-09-29 23:38:20.182
481	ASN-2026-0023	51	68	\N	Capt. Arjun Rathore	SV-4471	Platoon Commander	12	0	2026-09-23	ACTIVE	97	Issued for operational duty.	2026-09-29 23:38:20.183	2026-09-29 23:38:20.183
482	ASN-2026-0024	51	68	\N	Lt. Sneha Patil	SV-4571	Platoon Commander	8	8	2026-09-25	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.184	2026-09-29 23:38:20.184
483	ASN-2026-0025	49	66	\N	Cpl. Aditya Kumar	SV-4560	Driver	4	4	2026-09-27	RETURNED	97	Equipment returned to stores.	2026-09-29 23:38:20.184	2026-09-29 23:38:20.184
484	ASN-2026-0484	49	66	\N	Capt. Arjun Rathore	SV-4471	Platoon Commander	30	20	2026-09-20	PARTIALLY_RETURNED	98	Consumed in the field. | Returned to stores after the serial.	2026-09-29 23:38:25.906	2026-09-29 23:38:25.95
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "userId", "userEmail", action, "entityType", "entityId", method, endpoint, "ipAddress", "userAgent", "statusCode", "requestId", metadata, "createdAt") FROM stdin;
745	97	admin@mams.local	USER_CREATED	User	1	POST	/api/users	127.0.0.1	seed-script	201	seed-1790725100258-1	{"seeded": true, "description": "Base commander account provisioned"}	2026-08-01 00:38:19.753
746	97	admin@mams.local	BASE_CREATED	Base	2	POST	/api/bases	127.0.0.1	seed-script	201	seed-1790725100259-2	{"seeded": true, "description": "Bravo Base registered"}	2026-08-01 01:38:19.753
747	97	admin@mams.local	EQUIPMENT_CREATED	EquipmentType	3	POST	/api/equipmenttypes	127.0.0.1	seed-script	201	seed-1790725100260-3	{"seeded": true, "description": "Ammunition type configured"}	2026-08-01 02:38:19.753
766	97	admin@mams.local	PURCHASE_REVERSED	Purchase	366	POST	/api/purchases/366/reverse	::1	node	\N	73c486a9-e3df-42a6-9536-9ca561e62594	{"baseId": 50, "reason": "Duplicate of order HL-2291, raised twice by the depot.", "quantity": 25, "equipmentTypeId": 66, "originalReference": "PUR-2026-0366", "reversalReference": "PUR-2026-0367"}	2026-09-29 23:38:25.971
748	97	admin@mams.local	LOGIN	User	97	POST	/api/auth/login	::1	node	\N	88267d13-e35e-40d9-a47b-be240d5b30f5	\N	2026-09-29 23:38:24.738
749	98	commander.alpha@mams.local	LOGIN	User	98	POST	/api/auth/login	::1	node	\N	628cb624-0cab-4335-a557-b89734c77602	\N	2026-09-29 23:38:24.991
750	101	logistics.alpha@mams.local	LOGIN	User	101	POST	/api/auth/login	::1	node	\N	3254be03-b921-4b39-9ac3-d3743fd4bcae	\N	2026-09-29 23:38:25.242
751	102	logistics.charlie@mams.local	LOGIN	User	102	POST	/api/auth/login	::1	node	\N	3d14068d-238e-4ca9-bb67-a23f6b4e3827	\N	2026-09-29 23:38:25.49
752	99	commander.bravo@mams.local	LOGIN	User	99	POST	/api/auth/login	::1	node	\N	23d90e2c-02dc-412a-b5f6-7478b7d86b56	\N	2026-09-29 23:38:25.737
753	101	logistics.alpha@mams.local	PURCHASE_CREATED	Purchase	362	POST	/api/purchases	::1	node	\N	f9b3d2c0-5d51-4ac5-b70e-7edb28ffc664	{"baseId": 49, "quantity": 24000, "supplier": "Northwind Defence Supplies", "equipmentTypeId": 67, "referenceNumber": "PUR-2026-0362"}	2026-09-29 23:38:25.766
754	102	logistics.charlie@mams.local	PURCHASE_CREATED	Purchase	363	POST	/api/purchases	::1	node	\N	faa05a13-c5f9-470f-9586-e54ce9c8f55d	{"baseId": 51, "quantity": 40000, "supplier": "Northwind Defence Supplies", "equipmentTypeId": 67, "referenceNumber": "PUR-2026-0363"}	2026-09-29 23:38:25.778
755	97	admin@mams.local	PURCHASE_CREATED	Purchase	364	POST	/api/purchases	::1	node	\N	109aad27-aaf7-430e-baea-2a59b4a0a384	{"baseId": 50, "quantity": 16000, "supplier": "Northwind Defence Supplies", "equipmentTypeId": 67, "referenceNumber": "PUR-2026-0364"}	2026-09-29 23:38:25.789
756	101	logistics.alpha@mams.local	PURCHASE_CREATED	Purchase	365	POST	/api/purchases	::1	node	\N	335f5e65-9fbd-4bb5-99d6-838a0234dee9	{"baseId": 49, "quantity": 120, "supplier": "Meridian Ordnance Corporation", "equipmentTypeId": 66, "referenceNumber": "PUR-2026-0365"}	2026-09-29 23:38:25.803
760	102	logistics.charlie@mams.local	TRANSFER_CREATED	Transfer	675	POST	/api/transfers	::1	node	\N	d3edb591-4fb8-4888-9232-8719357de1c8	{"quantity": 12000, "sourceBaseId": 51, "equipmentTypeId": 67, "referenceNumber": "TRF-2026-0675", "destinationBaseId": 49}	2026-09-29 23:38:25.895
761	98	commander.alpha@mams.local	ASSIGNMENT_CREATED	Assignment	484	POST	/api/assignments	::1	node	\N	300662ac-b107-4af0-9aea-8dd4e783691a	{"baseId": 49, "assetId": null, "quantity": 30, "personnelName": "Capt. Arjun Rathore", "equipmentTypeId": 66, "referenceNumber": "ASN-2026-0484"}	2026-09-29 23:38:25.912
762	98	commander.alpha@mams.local	EXPENDITURE_CREATED	Expenditure	463	POST	/api/expenditures	::1	node	\N	be8fa8cf-caac-4a58-a78b-1b4470a02a0c	{"baseId": 49, "reason": "TRAINING", "quantity": 8, "assignmentId": 484, "equipmentTypeId": 66, "referenceNumber": "EXP-2026-0463"}	2026-09-29 23:38:25.93
763	98	commander.alpha@mams.local	EXPENDITURE_CREATED	Expenditure	464	POST	/api/expenditures	::1	node	\N	ebaab67e-07ca-4e0a-9fe6-9ab8086797a0	{"baseId": 49, "reason": "DAMAGE", "quantity": 5, "assignmentId": null, "equipmentTypeId": 66, "referenceNumber": "EXP-2026-0464"}	2026-09-29 23:38:25.942
764	98	commander.alpha@mams.local	ASSIGNMENT_RETURNED	Assignment	484	POST	/api/assignments/484/return	::1	node	\N	737f2ad2-ca35-4916-8c43-0668082ef9c8	{"status": "PARTIALLY_RETURNED", "referenceNumber": "ASN-2026-0484", "returnedQuantity": 12, "outstandingBefore": 22}	2026-09-29 23:38:25.951
765	97	admin@mams.local	PURCHASE_CREATED	Purchase	366	POST	/api/purchases	::1	node	\N	181fbcd4-bc92-4dca-bc5f-17ab96065906	{"baseId": 50, "quantity": 25, "supplier": "Halcyon Logistics", "equipmentTypeId": 66, "referenceNumber": "PUR-2026-0366"}	2026-09-29 23:38:25.96
757	101	logistics.alpha@mams.local	TRANSFER_CREATED	Transfer	674	POST	/api/transfers	::1	node	\N	b48780da-ef72-4e86-b173-d5cdbcc99783	{"quantity": 40, "sourceBaseId": 49, "equipmentTypeId": 66, "referenceNumber": "TRF-2026-0674", "destinationBaseId": 50}	2026-09-29 23:38:25.855
758	98	commander.alpha@mams.local	TRANSFER_APPROVED	Transfer	674	POST	/api/transfers/674/approve	::1	node	\N	d582457f-5be4-4cdf-b6a5-21dc1f69c844	{"decidedBy": "commander.alpha@mams.local", "referenceNumber": "TRF-2026-0674"}	2026-09-29 23:38:25.867
759	99	commander.bravo@mams.local	TRANSFER_COMPLETED	Transfer	674	POST	/api/transfers/674/complete	::1	node	\N	e8a25504-af3e-441b-93fc-06741297410c	{"quantity": 40, "sourceBaseId": 49, "equipmentTypeId": 66, "referenceNumber": "TRF-2026-0674", "destinationBaseId": 50}	2026-09-29 23:38:25.88
\.


--
-- Data for Name: bases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bases (id, code, name, location, description, "isActive", "createdAt", "updatedAt") FROM stdin;
49	ALPHA	Alpha Base	Northern Command, Sector 4	Primary training and vehicle holding base.	t	2026-09-29 23:38:19.851	2026-09-29 23:38:19.851
50	BRAVO	Bravo Base	Eastern Command, Airfield Station	Forward operating base with airlift support.	t	2026-09-29 23:38:19.854	2026-09-29 23:38:19.854
51	CHARLIE	Charlie Base	Southern Command, Coastal Depot	Main logistics depot and ammunition storage.	t	2026-09-29 23:38:19.855	2026-09-29 23:38:19.855
\.


--
-- Data for Name: equipment_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment_types (id, code, name, category, "unitOfMeasure", "isTrackable", "isActive", description, "createdAt", "updatedAt") FROM stdin;
65	PATROL_VEH	Patrol Vehicle	VEHICLE	vehicle	t	t	Four-wheel patrol vehicle, individually serialised.	2026-09-29 23:38:19.856	2026-09-29 23:38:19.856
66	ASSAULT_RIFLE	Assault Rifle	WEAPON	weapon	t	t	Service rifle, individually serialised.	2026-09-29 23:38:19.857	2026-09-29 23:38:19.857
67	AMMO_556	5.56mm Ammunition	AMMUNITION	round	f	t	Bulk quantity issue. Tracked by count only.	2026-09-29 23:38:19.858	2026-09-29 23:38:19.858
68	RADIO_SET	Field Radio Set	OTHER	set	t	t	Manpack radio set, individually serialised.	2026-09-29 23:38:19.859	2026-09-29 23:38:19.859
\.


--
-- Data for Name: expenditures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenditures (id, "referenceNumber", "baseId", "equipmentTypeId", quantity, "expenditureDate", reason, notes, status, "reversedById", "assignmentId", "recordedById", "createdAt", "updatedAt") FROM stdin;
436	EXP-2026-0001	49	67	1950	2026-08-06	TRAINING	Re-certification range	ACTIVE	\N	\N	97	2026-09-29 23:38:20.185	2026-09-29 23:38:20.185
437	EXP-2026-0002	49	67	700	2026-08-08	LOSS	Unrecovered after field exercise	ACTIVE	\N	\N	97	2026-09-29 23:38:20.187	2026-09-29 23:38:20.187
438	EXP-2026-0003	50	67	1950	2026-08-10	MAINTENANCE	Consumed during scheduled servicing	ACTIVE	\N	\N	97	2026-09-29 23:38:20.188	2026-09-29 23:38:20.188
439	EXP-2026-0004	50	67	8	2026-08-12	LOSS	Missing after convoy movement	ACTIVE	\N	\N	97	2026-09-29 23:38:20.188	2026-09-29 23:38:20.188
440	EXP-2026-0005	49	68	2	2026-08-14	OTHER	Written off after inspection	ACTIVE	\N	\N	97	2026-09-29 23:38:20.189	2026-09-29 23:38:20.189
441	EXP-2026-0006	51	67	1700	2026-08-16	MAINTENANCE	Consumed during scheduled servicing	ACTIVE	\N	\N	97	2026-09-29 23:38:20.19	2026-09-29 23:38:20.19
442	EXP-2026-0007	51	68	5	2026-08-18	OTHER	Written off after inspection	ACTIVE	\N	\N	97	2026-09-29 23:38:20.191	2026-09-29 23:38:20.191
443	EXP-2026-0008	51	66	2	2026-08-20	OTHER	Written off after inspection	ACTIVE	\N	\N	97	2026-09-29 23:38:20.192	2026-09-29 23:38:20.192
444	EXP-2026-0009	51	66	2	2026-08-22	MAINTENANCE	Stripped for repairable components	ACTIVE	\N	\N	97	2026-09-29 23:38:20.193	2026-09-29 23:38:20.193
445	EXP-2026-0010	49	68	8	2026-08-24	LOSS	Unrecovered after field exercise	ACTIVE	\N	\N	97	2026-09-29 23:38:20.194	2026-09-29 23:38:20.194
446	EXP-2026-0011	51	67	1700	2026-08-26	OTHER	Written off after inspection	ACTIVE	\N	\N	97	2026-09-29 23:38:20.194	2026-09-29 23:38:20.194
447	EXP-2026-0012	49	67	1200	2026-08-28	TRAINING	Live fire exercise	ACTIVE	\N	\N	97	2026-09-29 23:38:20.195	2026-09-29 23:38:20.195
448	EXP-2026-0013	50	67	1700	2026-08-30	TRAINING	Live fire exercise	ACTIVE	\N	\N	97	2026-09-29 23:38:20.196	2026-09-29 23:38:20.196
449	EXP-2026-0014	50	67	950	2026-09-01	TRAINING	Live fire exercise	ACTIVE	\N	\N	97	2026-09-29 23:38:20.196	2026-09-29 23:38:20.196
450	EXP-2026-0015	49	67	200	2026-09-03	MAINTENANCE	Consumed during scheduled servicing	ACTIVE	\N	\N	97	2026-09-29 23:38:20.197	2026-09-29 23:38:20.197
451	EXP-2026-0016	49	67	1700	2026-09-05	DAMAGE	Barrel heat damage beyond service limit	ACTIVE	\N	\N	97	2026-09-29 23:38:20.198	2026-09-29 23:38:20.198
452	EXP-2026-0017	51	67	950	2026-09-07	TRAINING	Field training day	ACTIVE	\N	\N	97	2026-09-29 23:38:20.199	2026-09-29 23:38:20.199
453	EXP-2026-0018	49	67	700	2026-09-09	MAINTENANCE	Consumed during scheduled servicing	ACTIVE	\N	\N	97	2026-09-29 23:38:20.199	2026-09-29 23:38:20.199
454	EXP-2026-0019	50	67	1700	2026-09-11	DAMAGE	Optics cracked in transit	ACTIVE	\N	\N	97	2026-09-29 23:38:20.2	2026-09-29 23:38:20.2
455	EXP-2026-0020	50	68	2	2026-09-13	DAMAGE	Barrel heat damage beyond service limit	ACTIVE	\N	\N	97	2026-09-29 23:38:20.201	2026-09-29 23:38:20.201
456	EXP-2026-0021	51	68	5	2026-09-15	DAMAGE	Barrel heat damage beyond service limit	ACTIVE	\N	\N	97	2026-09-29 23:38:20.201	2026-09-29 23:38:20.201
457	EXP-2026-0022	51	67	1200	2026-09-17	TRAINING	Re-certification range	ACTIVE	\N	\N	97	2026-09-29 23:38:20.202	2026-09-29 23:38:20.202
458	EXP-2026-0023	51	67	450	2026-09-19	OTHER	Written off after inspection	ACTIVE	\N	\N	97	2026-09-29 23:38:20.203	2026-09-29 23:38:20.203
459	EXP-2026-0024	49	66	8	2026-09-21	MAINTENANCE	Stripped for repairable components	ACTIVE	\N	\N	97	2026-09-29 23:38:20.203	2026-09-29 23:38:20.203
460	EXP-2026-0025	50	65	5	2026-09-23	LOSS	Missing after convoy movement	ACTIVE	\N	\N	97	2026-09-29 23:38:20.204	2026-09-29 23:38:20.204
461	EXP-2026-0026	51	66	5	2026-09-25	LOSS	Missing after convoy movement	ACTIVE	\N	\N	97	2026-09-29 23:38:20.205	2026-09-29 23:38:20.205
462	EXP-2026-0027	49	67	950	2026-09-27	DAMAGE	Optics cracked in transit	ACTIVE	\N	\N	97	2026-09-29 23:38:20.205	2026-09-29 23:38:20.205
463	EXP-2026-0463	49	66	8	2026-09-22	TRAINING	Consumed during the live fire serial.	ACTIVE	\N	484	98	2026-09-29 23:38:25.922	2026-09-29 23:38:25.924
464	EXP-2026-0464	49	66	5	2026-09-24	DAMAGE	Barrel heat damage beyond service limit.	ACTIVE	\N	\N	98	2026-09-29 23:38:25.939	2026-09-29 23:38:25.94
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchases (id, "referenceNumber", "baseId", "equipmentTypeId", quantity, "unitPrice", supplier, "purchaseDate", notes, status, "reversedById", "createdById", "createdAt", "updatedAt") FROM stdin;
342	PUR-2026-0001	50	67	14000	42.50	Meridian Ordnance Corporation	2026-08-02	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.12	2026-09-29 23:38:20.12
343	PUR-2026-0002	50	67	20	42.50	Meridian Ordnance Corporation	2026-08-05	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.122	2026-09-29 23:38:20.122
344	PUR-2026-0003	49	65	20	18840.07	Sterling Vehicle Works	2026-08-08	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.123	2026-09-29 23:38:20.123
345	PUR-2026-0004	51	67	8000	42.50	Northwind Defence Supplies	2026-08-11	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.124	2026-09-29 23:38:20.124
346	PUR-2026-0005	49	67	12000	42.50	Halcyon Logistics	2026-08-14	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.125	2026-09-29 23:38:20.125
347	PUR-2026-0006	50	67	12000	42.50	Northwind Defence Supplies	2026-08-17	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.126	2026-09-29 23:38:20.126
348	PUR-2026-0007	51	67	14000	42.50	Halcyon Logistics	2026-08-20	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.127	2026-09-29 23:38:20.127
349	PUR-2026-0008	50	67	60	42.50	Halcyon Logistics	2026-08-23	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.128	2026-09-29 23:38:20.128
350	PUR-2026-0009	49	67	8000	42.50	Sterling Vehicle Works	2026-08-26	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.128	2026-09-29 23:38:20.128
351	PUR-2026-0010	51	67	12000	42.50	Sterling Vehicle Works	2026-08-29	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.129	2026-09-29 23:38:20.129
352	PUR-2026-0011	49	67	10000	42.50	Halcyon Logistics	2026-09-01	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.13	2026-09-29 23:38:20.13
353	PUR-2026-0012	51	68	20	22984.75	Sterling Vehicle Works	2026-09-04	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.131	2026-09-29 23:38:20.131
354	PUR-2026-0013	50	67	16000	42.50	Sterling Vehicle Works	2026-09-07	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.131	2026-09-29 23:38:20.131
355	PUR-2026-0014	49	67	10000	42.50	Meridian Ordnance Corporation	2026-09-10	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.132	2026-09-29 23:38:20.132
356	PUR-2026-0015	49	67	60	42.50	Sterling Vehicle Works	2026-09-13	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.133	2026-09-29 23:38:20.133
357	PUR-2026-0016	49	67	10000	42.50	Halcyon Logistics	2026-09-16	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.134	2026-09-29 23:38:20.134
358	PUR-2026-0017	49	68	30	21141.47	Halcyon Logistics	2026-09-19	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.134	2026-09-29 23:38:20.134
359	PUR-2026-0018	51	68	20	24778.86	Meridian Ordnance Corporation	2026-09-22	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.135	2026-09-29 23:38:20.135
360	PUR-2026-0019	50	67	8000	42.50	Sterling Vehicle Works	2026-09-25	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.136	2026-09-29 23:38:20.136
361	PUR-2026-0020	50	67	18000	42.50	Sterling Vehicle Works	2026-09-28	Routine replenishment order.	ACTIVE	\N	97	2026-09-29 23:38:20.137	2026-09-29 23:38:20.137
362	PUR-2026-0362	49	67	24000	\N	Northwind Defence Supplies	2026-09-08	\N	ACTIVE	\N	101	2026-09-29 23:38:25.757	2026-09-29 23:38:25.76
363	PUR-2026-0363	51	67	40000	\N	Northwind Defence Supplies	2026-09-08	\N	ACTIVE	\N	102	2026-09-29 23:38:25.775	2026-09-29 23:38:25.776
364	PUR-2026-0364	50	67	16000	\N	Northwind Defence Supplies	2026-09-08	\N	ACTIVE	\N	97	2026-09-29 23:38:25.787	2026-09-29 23:38:25.788
365	PUR-2026-0365	49	66	120	2150.00	Meridian Ordnance Corporation	2026-09-15	\N	ACTIVE	\N	101	2026-09-29 23:38:25.8	2026-09-29 23:38:25.801
366	PUR-2026-0366	50	66	25	\N	Halcyon Logistics	2026-09-25	\N	REVERSED	\N	97	2026-09-29 23:38:25.958	2026-09-29 23:38:25.967
367	PUR-2026-0367	50	66	25	\N	Halcyon Logistics	2026-09-29	Reversal of PUR-2026-0366: Duplicate of order HL-2291, raised twice by the depot.	REVERSED	366	97	2026-09-29 23:38:25.968	2026-09-29 23:38:25.969
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, "userId", "tokenHash", "expiresAt", "revokedAt", "userAgent", "ipAddress", "createdAt") FROM stdin;
336	97	6123907118f41270d033c570c903a9eef7d2ab8d51325d52d26ebf60bc52c004	2026-10-06 23:38:24.714	\N	node	::1	2026-09-29 23:38:24.716
337	98	453daf2ff0ba2a0c983df05cae9769ed09485cd866cabd850d9131700f948e98	2026-10-06 23:38:24.985	\N	node	::1	2026-09-29 23:38:24.986
338	101	4e60808a7eea7bddd241fb5788481fbf7ba4c6c0265da4110cc55644165e8d54	2026-10-06 23:38:25.23	\N	node	::1	2026-09-29 23:38:25.231
339	102	f4baa530347b5e47606e29b9ced5b08337ef20daa6634d5f7933107f92dccd44	2026-10-06 23:38:25.476	\N	node	::1	2026-09-29 23:38:25.477
340	99	d69ccd8c4f111d3decd390479ae5c14fb14db07f053481a2852daa5ce1141cf1	2026-10-06 23:38:25.723	\N	node	::1	2026-09-29 23:38:25.724
\.


--
-- Data for Name: stock_balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_balances (id, "baseId", "equipmentTypeId", "openingQuantity", "openingDate", "onHandQuantity", "committedQuantity", version, "createdAt", "updatedAt") FROM stdin;
240	49	65	24	2026-07-31	44	0	1	2026-09-29 23:38:20.099	2026-09-29 23:38:20.207
243	49	68	30	2026-07-31	65	28	1	2026-09-29 23:38:20.106	2026-09-29 23:38:20.209
244	50	65	16	2026-07-31	11	0	1	2026-09-29 23:38:20.107	2026-09-29 23:38:20.21
247	50	68	18	2026-07-31	26	16	1	2026-09-29 23:38:20.112	2026-09-29 23:38:20.212
248	51	65	12	2026-07-31	12	0	1	2026-09-29 23:38:20.113	2026-09-29 23:38:20.213
249	51	66	220	2026-07-31	181	28	1	2026-09-29 23:38:20.115	2026-09-29 23:38:20.214
251	51	68	22	2026-07-31	27	12	1	2026-09-29 23:38:20.117	2026-09-29 23:38:20.215
242	49	67	96000	2026-07-31	184715	0	1	2026-09-29 23:38:20.105	2026-09-29 23:38:25.764
250	51	67	120000	2026-07-31	169975	24	1	2026-09-29 23:38:20.116	2026-09-29 23:38:25.777
246	50	67	54000	2026-07-31	127742	40	1	2026-09-29 23:38:20.11	2026-09-29 23:38:25.788
241	49	66	480	2026-07-31	544	46	6	2026-09-29 23:38:20.103	2026-09-30 05:08:25.949
245	50	66	260	2026-07-31	325	0	2	2026-09-29 23:38:20.109	2026-09-30 05:08:25.967
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transfers (id, "referenceNumber", "sourceBaseId", "destinationBaseId", "equipmentTypeId", quantity, status, "initiatedById", "approvedById", "decisionReason", notes, "completedAt", "cancelledAt", "createdAt", "updatedAt") FROM stdin;
668	TRF-2026-0026	50	49	67	6000	CANCELLED	97	97	Cancelled by logistics, requirement withdrawn.	Awaiting or ending lifecycle action.	\N	\N	2026-09-20 23:38:19.753	2026-09-29 23:38:20.159
669	TRF-2026-0027	50	51	67	15	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-09-24 19:38:19.753	\N	2026-09-23 23:38:19.753	2026-09-29 23:38:20.16
670	TRF-2026-0028	50	49	66	15	CANCELLED	97	97	Cancelled by logistics, requirement withdrawn.	Awaiting or ending lifecycle action.	\N	\N	2026-09-25 23:38:19.753	2026-09-29 23:38:20.16
671	TRF-2026-0029	50	49	66	15	REJECTED	97	97	Destination holding sufficient stock.	Awaiting or ending lifecycle action.	\N	\N	2026-09-26 23:38:19.753	2026-09-29 23:38:20.161
672	TRF-2026-0030	51	49	67	20	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-09-28 19:38:19.753	\N	2026-09-27 23:38:19.753	2026-09-29 23:38:20.162
673	TRF-2026-0031	51	49	66	20	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-09-29 19:38:19.753	\N	2026-09-28 23:38:19.753	2026-09-29 23:38:20.163
674	TRF-2026-0674	49	50	66	40	COMPLETED	101	98	Approved against the quarterly distribution plan.	Reinforcement of the forward element ahead of the exercise programme. | Received and counted into stores.	2026-09-29 23:38:25.878	\N	2026-09-29 23:38:25.845	2026-09-29 23:38:25.879
675	TRF-2026-0675	51	49	67	12000	PENDING	102	\N	\N	Awaiting approval from the source base.	\N	\N	2026-09-29 23:38:25.888	2026-09-29 23:38:25.891
643	TRF-2026-0001	50	51	67	4000	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-08-06 19:38:19.753	\N	2026-08-05 23:38:19.753	2026-09-29 23:38:20.138
644	TRF-2026-0002	51	50	67	8000	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-08-12 19:38:19.753	\N	2026-08-11 23:38:19.753	2026-09-29 23:38:20.14
645	TRF-2026-0003	49	50	67	10000	REJECTED	97	97	Destination holding sufficient stock.	Awaiting or ending lifecycle action.	\N	\N	2026-08-12 23:38:19.753	2026-09-29 23:38:20.14
646	TRF-2026-0004	49	51	67	4000	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-08-14 19:38:19.753	\N	2026-08-13 23:38:19.753	2026-09-29 23:38:20.141
647	TRF-2026-0005	50	49	68	15	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-08-16 19:38:19.753	\N	2026-08-15 23:38:19.753	2026-09-29 23:38:20.142
648	TRF-2026-0006	49	50	66	15	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-08-20 19:38:19.753	\N	2026-08-19 23:38:19.753	2026-09-29 23:38:20.143
649	TRF-2026-0007	50	51	66	25	REJECTED	97	97	Destination holding sufficient stock.	Awaiting or ending lifecycle action.	\N	\N	2026-08-21 23:38:19.753	2026-09-29 23:38:20.145
650	TRF-2026-0008	50	49	67	8000	CANCELLED	97	97	Cancelled by logistics, requirement withdrawn.	Awaiting or ending lifecycle action.	\N	\N	2026-08-22 23:38:19.753	2026-09-29 23:38:20.145
651	TRF-2026-0009	51	49	67	6000	REJECTED	97	97	Destination holding sufficient stock.	Awaiting or ending lifecycle action.	\N	\N	2026-08-23 23:38:19.753	2026-09-29 23:38:20.146
652	TRF-2026-0010	49	50	68	10	REJECTED	97	97	Destination holding sufficient stock.	Awaiting or ending lifecycle action.	\N	\N	2026-08-24 23:38:19.753	2026-09-29 23:38:20.147
653	TRF-2026-0011	51	49	67	8000	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-08-26 19:38:19.753	\N	2026-08-25 23:38:19.753	2026-09-29 23:38:20.148
654	TRF-2026-0012	50	51	67	20	PENDING	97	\N	\N	Awaiting or ending lifecycle action.	\N	\N	2026-08-26 23:38:19.753	2026-09-29 23:38:20.148
655	TRF-2026-0013	50	51	67	20	REJECTED	97	97	Destination holding sufficient stock.	Awaiting or ending lifecycle action.	\N	\N	2026-08-28 23:38:19.753	2026-09-29 23:38:20.149
656	TRF-2026-0014	50	49	67	4000	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-08-30 19:38:19.753	\N	2026-08-29 23:38:19.753	2026-09-29 23:38:20.15
657	TRF-2026-0015	51	49	67	6000	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-08-31 19:38:19.753	\N	2026-08-30 23:38:19.753	2026-09-29 23:38:20.151
658	TRF-2026-0016	51	49	67	8000	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-09-01 19:38:19.753	\N	2026-08-31 23:38:19.753	2026-09-29 23:38:20.151
659	TRF-2026-0017	50	49	66	10	PENDING	97	\N	\N	Awaiting or ending lifecycle action.	\N	\N	2026-09-02 23:38:19.753	2026-09-29 23:38:20.152
660	TRF-2026-0018	49	50	66	20	CANCELLED	97	97	Cancelled by logistics, requirement withdrawn.	Awaiting or ending lifecycle action.	\N	\N	2026-09-05 23:38:19.753	2026-09-29 23:38:20.153
661	TRF-2026-0019	51	50	67	6000	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-09-08 19:38:19.753	\N	2026-09-07 23:38:19.753	2026-09-29 23:38:20.154
662	TRF-2026-0020	51	50	68	25	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-09-09 19:38:19.753	\N	2026-09-08 23:38:19.753	2026-09-29 23:38:20.154
663	TRF-2026-0021	50	51	67	10000	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-09-11 19:38:19.753	\N	2026-09-10 23:38:19.753	2026-09-29 23:38:20.155
664	TRF-2026-0022	51	49	67	20	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-09-12 19:38:19.753	\N	2026-09-11 23:38:19.753	2026-09-29 23:38:20.156
665	TRF-2026-0023	51	49	66	10	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-09-13 19:38:19.753	\N	2026-09-12 23:38:19.753	2026-09-29 23:38:20.156
666	TRF-2026-0024	50	49	67	15	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-09-19 19:38:19.753	\N	2026-09-18 23:38:19.753	2026-09-29 23:38:20.157
667	TRF-2026-0025	49	50	66	10	COMPLETED	97	97	\N	Movement completed with despatch and receipt confirmation.	2026-09-20 19:38:19.753	\N	2026-09-19 23:38:19.753	2026-09-29 23:38:20.158
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, "passwordHash", role, "baseId", "isActive", "tokenVersion", "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
100	Maj. Rohan Fernandes	commander.charlie@mams.local	$2b$12$iPnB6hdtZ0c4m9DLQTF98.A0VaSd.UiDbLfcsDH19brcxo4aOvF/a	BASE_COMMANDER	51	t	1	\N	2026-09-29 23:38:20.095	2026-09-29 23:38:20.095
97	System Administrator	admin@mams.local	$2b$12$iPnB6hdtZ0c4m9DLQTF98.A0VaSd.UiDbLfcsDH19brcxo4aOvF/a	ADMIN	\N	t	1	2026-09-29 23:38:24.735	2026-09-29 23:38:20.09	2026-09-29 23:38:24.736
98	Col. Devansh Kulkarni	commander.alpha@mams.local	$2b$12$iPnB6hdtZ0c4m9DLQTF98.A0VaSd.UiDbLfcsDH19brcxo4aOvF/a	BASE_COMMANDER	49	t	1	2026-09-29 23:38:24.989	2026-09-29 23:38:20.092	2026-09-29 23:38:24.99
101	Sub. Sanjay Kulkarni	logistics.alpha@mams.local	$2b$12$iPnB6hdtZ0c4m9DLQTF98.A0VaSd.UiDbLfcsDH19brcxo4aOvF/a	LOGISTICS_OFFICER	49	t	1	2026-09-29 23:38:25.24	2026-09-29 23:38:20.096	2026-09-29 23:38:25.241
102	Sub. Kavya Pillai	logistics.charlie@mams.local	$2b$12$iPnB6hdtZ0c4m9DLQTF98.A0VaSd.UiDbLfcsDH19brcxo4aOvF/a	LOGISTICS_OFFICER	51	t	1	2026-09-29 23:38:25.488	2026-09-29 23:38:20.097	2026-09-29 23:38:25.489
99	Col. Ishita Bhattacharya	commander.bravo@mams.local	$2b$12$iPnB6hdtZ0c4m9DLQTF98.A0VaSd.UiDbLfcsDH19brcxo4aOvF/a	BASE_COMMANDER	50	t	1	2026-09-29 23:38:25.736	2026-09-29 23:38:20.094	2026-09-29 23:38:25.737
\.


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assets_id_seq', 369, true);


--
-- Name: assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assignments_id_seq', 484, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 766, true);


--
-- Name: bases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bases_id_seq', 51, true);


--
-- Name: equipment_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipment_types_id_seq', 68, true);


--
-- Name: expenditures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expenditures_id_seq', 464, true);


--
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchases_id_seq', 367, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 340, true);


--
-- Name: stock_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_balances_id_seq', 257, true);


--
-- Name: transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transfers_id_seq', 675, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 102, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bases bases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bases
    ADD CONSTRAINT bases_pkey PRIMARY KEY (id);


--
-- Name: equipment_types equipment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_types
    ADD CONSTRAINT equipment_types_pkey PRIMARY KEY (id);


--
-- Name: expenditures expenditures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT expenditures_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: stock_balances stock_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT stock_balances_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: assets_assetNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "assets_assetNumber_key" ON public.assets USING btree ("assetNumber");


--
-- Name: assets_currentBaseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "assets_currentBaseId_idx" ON public.assets USING btree ("currentBaseId");


--
-- Name: assets_equipmentTypeId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "assets_equipmentTypeId_status_idx" ON public.assets USING btree ("equipmentTypeId", status);


--
-- Name: assets_serialNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "assets_serialNumber_key" ON public.assets USING btree ("serialNumber");


--
-- Name: assignments_baseId_assignmentDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "assignments_baseId_assignmentDate_idx" ON public.assignments USING btree ("baseId", "assignmentDate" DESC);


--
-- Name: assignments_referenceNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "assignments_referenceNumber_key" ON public.assignments USING btree ("referenceNumber");


--
-- Name: assignments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignments_status_idx ON public.assignments USING btree (status);


--
-- Name: audit_logs_action_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_action_createdAt_idx" ON public.audit_logs USING btree (action, "createdAt" DESC);


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt" DESC);


--
-- Name: audit_logs_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_entityType_entityId_idx" ON public.audit_logs USING btree ("entityType", "entityId");


--
-- Name: audit_logs_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_userId_createdAt_idx" ON public.audit_logs USING btree ("userId", "createdAt" DESC);


--
-- Name: bases_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bases_code_key ON public.bases USING btree (code);


--
-- Name: bases_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "bases_isActive_idx" ON public.bases USING btree ("isActive");


--
-- Name: equipment_types_category_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "equipment_types_category_isActive_idx" ON public.equipment_types USING btree (category, "isActive");


--
-- Name: equipment_types_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX equipment_types_code_key ON public.equipment_types USING btree (code);


--
-- Name: expenditures_baseId_expenditureDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "expenditures_baseId_expenditureDate_idx" ON public.expenditures USING btree ("baseId", "expenditureDate" DESC);


--
-- Name: expenditures_equipmentTypeId_expenditureDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "expenditures_equipmentTypeId_expenditureDate_idx" ON public.expenditures USING btree ("equipmentTypeId", "expenditureDate" DESC);


--
-- Name: expenditures_referenceNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "expenditures_referenceNumber_key" ON public.expenditures USING btree ("referenceNumber");


--
-- Name: expenditures_reversedById_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "expenditures_reversedById_key" ON public.expenditures USING btree ("reversedById");


--
-- Name: expenditures_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX expenditures_status_idx ON public.expenditures USING btree (status);


--
-- Name: purchases_baseId_purchaseDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "purchases_baseId_purchaseDate_idx" ON public.purchases USING btree ("baseId", "purchaseDate" DESC);


--
-- Name: purchases_equipmentTypeId_purchaseDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "purchases_equipmentTypeId_purchaseDate_idx" ON public.purchases USING btree ("equipmentTypeId", "purchaseDate" DESC);


--
-- Name: purchases_referenceNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "purchases_referenceNumber_key" ON public.purchases USING btree ("referenceNumber");


--
-- Name: purchases_reversedById_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "purchases_reversedById_key" ON public.purchases USING btree ("reversedById");


--
-- Name: purchases_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX purchases_status_idx ON public.purchases USING btree (status);


--
-- Name: refresh_tokens_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "refresh_tokens_expiresAt_idx" ON public.refresh_tokens USING btree ("expiresAt");


--
-- Name: refresh_tokens_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON public.refresh_tokens USING btree ("tokenHash");


--
-- Name: refresh_tokens_userId_revokedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "refresh_tokens_userId_revokedAt_idx" ON public.refresh_tokens USING btree ("userId", "revokedAt");


--
-- Name: stock_balances_baseId_equipmentTypeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "stock_balances_baseId_equipmentTypeId_key" ON public.stock_balances USING btree ("baseId", "equipmentTypeId");


--
-- Name: stock_balances_equipmentTypeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_balances_equipmentTypeId_idx" ON public.stock_balances USING btree ("equipmentTypeId");


--
-- Name: transfers_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "transfers_createdAt_idx" ON public.transfers USING btree ("createdAt" DESC);


--
-- Name: transfers_destinationBaseId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "transfers_destinationBaseId_status_idx" ON public.transfers USING btree ("destinationBaseId", status);


--
-- Name: transfers_referenceNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "transfers_referenceNumber_key" ON public.transfers USING btree ("referenceNumber");


--
-- Name: transfers_sourceBaseId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "transfers_sourceBaseId_status_idx" ON public.transfers USING btree ("sourceBaseId", status);


--
-- Name: transfers_status_destination_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transfers_status_destination_idx ON public.transfers USING btree (status, "destinationBaseId", "completedAt");


--
-- Name: transfers_status_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transfers_status_source_idx ON public.transfers USING btree (status, "sourceBaseId", "completedAt");


--
-- Name: users_baseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "users_baseId_idx" ON public.users USING btree ("baseId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_role_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "users_role_isActive_idx" ON public.users USING btree (role, "isActive");


--
-- Name: assets assets_currentBaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_currentBaseId_fkey" FOREIGN KEY ("currentBaseId") REFERENCES public.bases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: assets assets_equipmentTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES public.equipment_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: assets assets_purchaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES public.purchases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assignments assignments_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assignments assignments_assignedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: assignments assignments_baseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "assignments_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES public.bases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: assignments assignments_equipmentTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "assignments_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES public.equipment_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: expenditures expenditures_assignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT "expenditures_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES public.assignments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: expenditures expenditures_baseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT "expenditures_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES public.bases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenditures expenditures_equipmentTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT "expenditures_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES public.equipment_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenditures expenditures_recordedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT "expenditures_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenditures expenditures_reversedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT "expenditures_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES public.expenditures(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchases purchases_baseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "purchases_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES public.bases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchases purchases_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "purchases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchases purchases_equipmentTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "purchases_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES public.equipment_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchases purchases_reversedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "purchases_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES public.purchases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_balances stock_balances_baseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT "stock_balances_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES public.bases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_balances stock_balances_equipmentTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT "stock_balances_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES public.equipment_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transfers transfers_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT "transfers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transfers transfers_destinationBaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT "transfers_destinationBaseId_fkey" FOREIGN KEY ("destinationBaseId") REFERENCES public.bases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transfers transfers_equipmentTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT "transfers_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES public.equipment_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transfers transfers_initiatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT "transfers_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transfers transfers_sourceBaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT "transfers_sourceBaseId_fkey" FOREIGN KEY ("sourceBaseId") REFERENCES public.bases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_baseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES public.bases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

