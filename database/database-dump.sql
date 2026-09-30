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
397	ALPHA-PATROL_VEH-001	SNALPHAPATR001	73	55	IN_STOCK	\N	\N	2026-09-30 00:59:01.228	2026-09-30 00:59:01.228
398	ALPHA-PATROL_VEH-002	SNALPHAPATR002	73	55	IN_STOCK	\N	\N	2026-09-30 00:59:01.231	2026-09-30 00:59:01.231
399	ALPHA-PATROL_VEH-003	SNALPHAPATR003	73	55	IN_STOCK	\N	\N	2026-09-30 00:59:01.233	2026-09-30 00:59:01.233
400	ALPHA-ASSAULT_RIFLE-001	SNALPHAASSA001	74	55	IN_STOCK	\N	\N	2026-09-30 00:59:01.234	2026-09-30 00:59:01.234
401	ALPHA-ASSAULT_RIFLE-002	SNALPHAASSA002	74	55	IN_STOCK	\N	\N	2026-09-30 00:59:01.236	2026-09-30 00:59:01.236
402	ALPHA-ASSAULT_RIFLE-003	SNALPHAASSA003	74	55	IN_STOCK	\N	\N	2026-09-30 00:59:01.237	2026-09-30 00:59:01.237
403	BRAVO-PATROL_VEH-001	SNBRAVOPATR001	73	56	IN_STOCK	\N	\N	2026-09-30 00:59:01.239	2026-09-30 00:59:01.239
404	BRAVO-PATROL_VEH-002	SNBRAVOPATR002	73	56	IN_STOCK	\N	\N	2026-09-30 00:59:01.24	2026-09-30 00:59:01.24
405	BRAVO-PATROL_VEH-003	SNBRAVOPATR003	73	56	IN_STOCK	\N	\N	2026-09-30 00:59:01.241	2026-09-30 00:59:01.241
406	BRAVO-ASSAULT_RIFLE-001	SNBRAVOASSA001	74	56	IN_STOCK	\N	\N	2026-09-30 00:59:01.242	2026-09-30 00:59:01.242
407	BRAVO-ASSAULT_RIFLE-002	SNBRAVOASSA002	74	56	IN_STOCK	\N	\N	2026-09-30 00:59:01.244	2026-09-30 00:59:01.244
408	BRAVO-ASSAULT_RIFLE-003	SNBRAVOASSA003	74	56	IN_STOCK	\N	\N	2026-09-30 00:59:01.245	2026-09-30 00:59:01.245
409	BRAVO-RADIO_SET-001	SNBRAVORADI001	76	56	IN_STOCK	\N	\N	2026-09-30 00:59:01.246	2026-09-30 00:59:01.246
410	BRAVO-RADIO_SET-002	SNBRAVORADI002	76	56	IN_STOCK	\N	\N	2026-09-30 00:59:01.248	2026-09-30 00:59:01.248
411	BRAVO-RADIO_SET-003	SNBRAVORADI003	76	56	IN_STOCK	\N	\N	2026-09-30 00:59:01.249	2026-09-30 00:59:01.249
412	CHARLIE-PATROL_VEH-001	SNCHARLIEPATR001	73	57	IN_STOCK	\N	\N	2026-09-30 00:59:01.252	2026-09-30 00:59:01.252
413	CHARLIE-PATROL_VEH-002	SNCHARLIEPATR002	73	57	IN_STOCK	\N	\N	2026-09-30 00:59:01.253	2026-09-30 00:59:01.253
414	CHARLIE-ASSAULT_RIFLE-001	SNCHARLIEASSA001	74	57	IN_STOCK	\N	\N	2026-09-30 00:59:01.254	2026-09-30 00:59:01.254
415	CHARLIE-ASSAULT_RIFLE-002	SNCHARLIEASSA002	74	57	IN_STOCK	\N	\N	2026-09-30 00:59:01.255	2026-09-30 00:59:01.255
416	CHARLIE-ASSAULT_RIFLE-003	SNCHARLIEASSA003	74	57	IN_STOCK	\N	\N	2026-09-30 00:59:01.256	2026-09-30 00:59:01.256
417	CHARLIE-RADIO_SET-001	SNCHARLIERADI001	76	57	IN_STOCK	\N	\N	2026-09-30 00:59:01.257	2026-09-30 00:59:01.257
418	CHARLIE-RADIO_SET-002	SNCHARLIERADI002	76	57	IN_STOCK	\N	\N	2026-09-30 00:59:01.259	2026-09-30 00:59:01.259
419	CHARLIE-RADIO_SET-003	SNCHARLIERADI003	76	57	IN_STOCK	\N	\N	2026-09-30 00:59:01.26	2026-09-30 00:59:01.26
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignments (id, "referenceNumber", "baseId", "equipmentTypeId", "assetId", "personnelName", "personnelId", designation, quantity, "returnedQuantity", "assignmentDate", status, "assignedById", notes, "createdAt", "updatedAt") FROM stdin;
508	ASN-2026-0001	57	75	\N	Lt. Karthik Menon	SV-4530	Signals Officer	16	0	2026-08-04	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.173	2026-09-30 00:59:01.173
509	ASN-2026-0002	57	74	\N	Sgt. Manish Gupta	SV-4583	Motor Pool NCO	12	0	2026-08-06	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.175	2026-09-30 00:59:01.175
510	ASN-2026-0003	56	76	\N	Sgt. Manish Gupta	SV-4583	Motor Pool NCO	8	8	2026-08-08	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.176	2026-09-30 00:59:01.176
511	ASN-2026-0004	56	73	\N	Sgt. Manish Gupta	SV-4583	Motor Pool NCO	4	4	2026-08-10	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.177	2026-09-30 00:59:01.177
512	ASN-2026-0005	56	75	\N	Lt. Karthik Menon	SV-4530	Signals Officer	4	0	2026-08-12	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.178	2026-09-30 00:59:01.178
513	ASN-2026-0006	57	75	\N	Lt. Sneha Patil	SV-4571	Platoon Commander	20	0	2026-08-14	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.179	2026-09-30 00:59:01.179
514	ASN-2026-0007	57	75	\N	Cpl. Fatima Ansari	SV-4590	Rifleman	8	0	2026-08-16	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.179	2026-09-30 00:59:01.179
515	ASN-2026-0008	57	75	\N	Sgt. Imran Sheikh	SV-4523	Explosive Ordnance Disposal	20	20	2026-08-18	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.18	2026-09-30 00:59:01.18
516	ASN-2026-0009	57	75	\N	Cpl. Rohan Das	SV-4544	Machine Gunner	16	16	2026-08-20	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.181	2026-09-30 00:59:01.181
517	ASN-2026-0010	56	74	\N	Capt. Arjun Rathore	SV-4471	Platoon Commander	12	12	2026-08-22	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.182	2026-09-30 00:59:01.182
518	ASN-2026-0011	55	75	\N	Cpl. Aditya Kumar	SV-4560	Driver	20	20	2026-08-24	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.183	2026-09-30 00:59:01.183
519	ASN-2026-0012	56	74	\N	Capt. Arjun Rathore	SV-4471	Platoon Commander	8	0	2026-08-26	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.184	2026-09-30 00:59:01.184
520	ASN-2026-0013	55	75	\N	Cpl. Rohan Das	SV-4544	Machine Gunner	16	0	2026-08-28	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.185	2026-09-30 00:59:01.185
521	ASN-2026-0014	56	73	\N	Lt. Meera Joshi	SV-4482	Weapons Officer	16	16	2026-08-30	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.185	2026-09-30 00:59:01.185
522	ASN-2026-0015	56	75	\N	Lt. Meera Joshi	SV-4482	Weapons Officer	12	0	2026-09-01	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.186	2026-09-30 00:59:01.186
523	ASN-2026-0016	57	75	\N	Capt. Arjun Rathore	SV-4471	Platoon Commander	20	0	2026-09-03	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.187	2026-09-30 00:59:01.187
524	ASN-2026-0017	57	74	\N	Sgt. Manish Gupta	SV-4583	Motor Pool NCO	8	8	2026-09-05	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.188	2026-09-30 00:59:01.188
525	ASN-2026-0018	57	76	\N	Cpl. Neha Singh	SV-4516	Vehicle Crew Chief	16	16	2026-09-07	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.188	2026-09-30 00:59:01.188
526	ASN-2026-0019	55	74	\N	Sgt. Priya Nair	SV-4552	Stores Clerk	8	0	2026-09-09	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.189	2026-09-30 00:59:01.189
527	ASN-2026-0020	56	74	\N	Cpl. Rohan Das	SV-4544	Machine Gunner	8	8	2026-09-11	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.19	2026-09-30 00:59:01.19
528	ASN-2026-0021	55	74	\N	Sgt. Priya Nair	SV-4552	Stores Clerk	8	0	2026-09-13	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.191	2026-09-30 00:59:01.191
529	ASN-2026-0022	56	73	\N	Cpl. Rohan Das	SV-4544	Machine Gunner	20	20	2026-09-17	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.191	2026-09-30 00:59:01.191
530	ASN-2026-0023	56	76	\N	Sgt. Imran Sheikh	SV-4523	Explosive Ordnance Disposal	16	0	2026-09-21	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.192	2026-09-30 00:59:01.192
531	ASN-2026-0024	55	75	\N	Lt. Sneha Patil	SV-4571	Platoon Commander	16	16	2026-09-23	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.193	2026-09-30 00:59:01.193
532	ASN-2026-0025	56	74	\N	Cpl. Aditya Kumar	SV-4560	Driver	8	8	2026-09-25	RETURNED	109	Equipment returned to stores.	2026-09-30 00:59:01.193	2026-09-30 00:59:01.193
533	ASN-2026-0026	55	74	\N	Sgt. Manish Gupta	SV-4583	Motor Pool NCO	8	0	2026-09-27	ACTIVE	109	Issued for operational duty.	2026-09-30 00:59:01.194	2026-09-30 00:59:01.194
534	ASN-2026-0534	55	74	\N	Test Personnel	SV-9999	\N	8	0	2026-09-30	ACTIVE	110	\N	2026-09-30 00:59:07.523	2026-09-30 00:59:07.526
535	ASN-2026-0535	55	74	\N	Return Test	\N	\N	5	5	2026-09-30	RETURNED	110	\N	2026-09-30 00:59:07.57	2026-09-30 00:59:07.587
536	ASN-2026-0536	55	74	\N	Partial Return Test	\N	\N	10	4	2026-09-30	PARTIALLY_RETURNED	110	\N	2026-09-30 00:59:07.601	2026-09-30 00:59:07.616
537	ASN-2026-0537	55	74	\N	Over Return Test	\N	\N	3	0	2026-09-30	ACTIVE	110	\N	2026-09-30 00:59:07.629	2026-09-30 00:59:07.629
538	ASN-2026-0538	55	74	\N	Training Candidate	\N	\N	12	5	2026-09-30	PARTIALLY_RETURNED	110	Consumed in the field.	2026-09-30 00:59:08.335	2026-09-30 00:59:08.358
539	ASN-2026-0539	55	74	\N	Everything Test	\N	\N	413	2	2026-09-30	PARTIALLY_RETURNED	110	Consumed in the field.	2026-09-30 00:59:08.374	2026-09-30 00:59:08.41
540	ASN-2026-0540	55	74	\N	Cross Check Test	\N	\N	2	0	2026-09-30	ACTIVE	110	\N	2026-09-30 00:59:08.449	2026-09-30 00:59:08.451
543	ASN-2026-0543	55	74	\N	Capt. Arjun Rathore	SV-4471	Platoon Commander	30	20	2026-09-21	PARTIALLY_RETURNED	110	Consumed in the field. | Returned to stores after the serial.	2026-09-30 00:59:47.436	2026-09-30 00:59:47.48
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "userId", "userEmail", action, "entityType", "entityId", method, endpoint, "ipAddress", "userAgent", "statusCode", "requestId", metadata, "createdAt") FROM stdin;
781	109	admin@mams.local	USER_CREATED	User	1	POST	/api/users	127.0.0.1	seed-script	201	seed-1790729941260-1	{"seeded": true, "description": "Base commander account provisioned"}	2026-08-01 01:58:59.494
782	109	admin@mams.local	BASE_CREATED	Base	2	POST	/api/bases	127.0.0.1	seed-script	201	seed-1790729941262-2	{"seeded": true, "description": "Bravo Base registered"}	2026-08-01 02:58:59.494
783	109	admin@mams.local	EQUIPMENT_CREATED	EquipmentType	3	POST	/api/equipmenttypes	127.0.0.1	seed-script	201	seed-1790729941263-3	{"seeded": true, "description": "Ammunition type configured"}	2026-08-01 03:58:59.494
793	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	09728fae-1292-426d-857b-f2bb3aa2a10b	\N	2026-09-30 00:59:05.059
807	110	commander.alpha@mams.local	LOGIN	User	110	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	efaa22ff-09c3-4bf0-9931-3371a819dda4	\N	2026-09-30 00:59:08.043
808	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	619cd140-a855-46ad-a6a3-e3cb97e71ddf	\N	2026-09-30 00:59:08.292
809	110	commander.alpha@mams.local	EXPENDITURE_CREATED	Expenditure	518	POST	/api/expenditures	::ffff:127.0.0.1	\N	\N	837d5d17-a7e3-4a19-807a-cf282f7d4b98	{"baseId": 55, "reason": "DAMAGE", "quantity": 6, "assignmentId": null, "equipmentTypeId": 74, "referenceNumber": "EXP-2026-0518"}	2026-09-30 00:59:08.321
810	110	commander.alpha@mams.local	ASSIGNMENT_CREATED	Assignment	538	POST	/api/assignments	::ffff:127.0.0.1	\N	\N	56f7d97b-1ae8-4a54-941c-2959a2e72917	{"baseId": 55, "assetId": null, "quantity": 12, "personnelName": "Training Candidate", "equipmentTypeId": 74, "referenceNumber": "ASN-2026-0538"}	2026-09-30 00:59:08.341
811	110	commander.alpha@mams.local	EXPENDITURE_CREATED	Expenditure	519	POST	/api/expenditures	::ffff:127.0.0.1	\N	\N	1f163e0b-81f1-4902-a274-6ad5ecc33a12	{"baseId": 55, "reason": "TRAINING", "quantity": 5, "assignmentId": 538, "equipmentTypeId": 74, "referenceNumber": "EXP-2026-0519"}	2026-09-30 00:59:08.36
812	110	commander.alpha@mams.local	ASSIGNMENT_CREATED	Assignment	539	POST	/api/assignments	::ffff:127.0.0.1	\N	\N	7021e7b4-11d4-445c-a9ea-19e7d842a885	{"baseId": 55, "assetId": null, "quantity": 413, "personnelName": "Everything Test", "equipmentTypeId": 74, "referenceNumber": "ASN-2026-0539"}	2026-09-30 00:59:08.377
813	110	commander.alpha@mams.local	EXPENDITURE_CREATED	Expenditure	520	POST	/api/expenditures	::ffff:127.0.0.1	\N	\N	2e2a5fab-180d-43fa-9721-b7461563770e	{"baseId": 55, "reason": "TRAINING", "quantity": 2, "assignmentId": 539, "equipmentTypeId": 74, "referenceNumber": "EXP-2026-0520"}	2026-09-30 00:59:08.411
814	109	admin@mams.local	PURCHASE_CREATED	Purchase	404	POST	/api/purchases	::ffff:127.0.0.1	\N	\N	590e1edc-041e-41f5-abb4-6d7033c31320	{"baseId": 55, "quantity": 110, "supplier": "Test Replenishment", "equipmentTypeId": 74, "referenceNumber": "PUR-2026-0404"}	2026-09-30 00:59:08.43
815	110	commander.alpha@mams.local	ASSIGNMENT_CREATED	Assignment	540	POST	/api/assignments	::ffff:127.0.0.1	\N	\N	b4a99dd2-7195-4b8e-92fb-e3ad77dafd75	{"baseId": 55, "assetId": null, "quantity": 2, "personnelName": "Cross Check Test", "equipmentTypeId": 74, "referenceNumber": "ASN-2026-0540"}	2026-09-30 00:59:08.454
816	113	logistics.alpha@mams.local	LOGIN	User	113	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	611196b6-9e91-42e8-a5b2-3f34a8054ad2	\N	2026-09-30 00:59:08.706
822	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	04ab0c79-e22c-4b1a-90c1-fbcde7221aea	\N	2026-09-30 00:59:10.666
823	110	commander.alpha@mams.local	LOGIN	User	110	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	131d9a5e-d655-496d-9f60-a7a006d8d6b5	\N	2026-09-30 00:59:10.916
824	114	logistics.charlie@mams.local	LOGIN	User	114	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	fab44ddb-2431-4d8b-966a-56c54d057852	\N	2026-09-30 00:59:11.162
826	110	commander.alpha@mams.local	TRANSFER_CREATED	Transfer	746	POST	/api/transfers	::ffff:127.0.0.1	\N	\N	f13d6be7-ac52-40b2-abc7-81e93bc80a72	{"quantity": 3, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0746", "destinationBaseId": 57}	2026-09-30 00:59:11.256
830	110	commander.alpha@mams.local	TRANSFER_CREATED	Transfer	748	POST	/api/transfers	::ffff:127.0.0.1	\N	\N	d2cf966b-3e1e-45f2-8a9c-ef4a1a477eb3	{"quantity": 2, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0748", "destinationBaseId": 57}	2026-09-30 00:59:11.316
834	110	commander.alpha@mams.local	TRANSFER_CREATED	Transfer	750	POST	/api/transfers	::ffff:127.0.0.1	\N	\N	d29b0c26-6c16-42bc-8ac1-a6b683003615	{"quantity": 5, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0750", "destinationBaseId": 57}	2026-09-30 00:59:11.371
835	110	commander.alpha@mams.local	TRANSFER_CANCELLED	Transfer	750	POST	/api/transfers/750/cancel	::ffff:127.0.0.1	\N	\N	e6cef3ec-e34a-4b57-9273-7f760568a428	{"referenceNumber": "TRF-2026-0750"}	2026-09-30 00:59:11.38
838	110	commander.alpha@mams.local	TRANSFER_CREATED	Transfer	752	POST	/api/transfers	::ffff:127.0.0.1	\N	\N	1ad12357-1117-472b-b257-809280c9f89a	{"quantity": 100127, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0752", "destinationBaseId": 57}	2026-09-30 00:59:11.412
839	109	admin@mams.local	TRANSFER_APPROVED	Transfer	752	POST	/api/transfers/752/approve	::ffff:127.0.0.1	\N	\N	b6e00106-227e-4c9d-85d2-5d954b95e604	{"decidedBy": "admin@mams.local", "referenceNumber": "TRF-2026-0752"}	2026-09-30 00:59:11.422
846	110	commander.alpha@mams.local	LOGIN	User	110	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	7896ba82-3232-404f-8e1d-046b12632695	\N	2026-09-30 00:59:13.341
847	111	commander.bravo@mams.local	LOGIN	User	111	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	f452c4c8-a422-419c-9109-c76c26a3043e	\N	2026-09-30 00:59:13.59
784	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	714471c1-373e-4a9b-b161-cae00f1c8a97	\N	2026-09-30 00:59:02.179
785	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	c9cdac6a-d4c4-431f-ad72-00980772a348	\N	2026-09-30 00:59:02.437
786	\N	admin@mams.local	LOGIN_FAILED	User	\N	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	13ec0702-6872-493c-8613-3f9979535d5f	{"reason": "invalid password"}	2026-09-30 00:59:02.673
787	\N	nobody@mams.local	LOGIN_FAILED	User	\N	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	8e934777-3172-479f-a4d0-aee65a0707a5	{"reason": "unknown account"}	2026-09-30 00:59:02.69
788	\N	admin@mams.local	LOGIN_FAILED	User	\N	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	da11a93f-cbc3-45cd-bc3a-447195ecfea1	{"reason": "invalid password"}	2026-09-30 00:59:02.926
789	110	commander.alpha@mams.local	LOGIN	User	110	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	a7e7a9eb-39fa-40b2-a509-5ccd52db971d	\N	2026-09-30 00:59:03.189
790	\N	admin@mams.local	LOGIN_FAILED	User	\N	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	4cec0ae5-961d-4189-8ceb-1a84291ad4b8	{"reason": "invalid password"}	2026-09-30 00:59:03.443
794	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	6b9abfcd-f956-4c30-8e0a-16231463c811	\N	2026-09-30 00:59:05.422
795	110	commander.alpha@mams.local	LOGIN	User	110	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	eea0d6fd-9c99-4b28-a787-40a8dadb0422	\N	2026-09-30 00:59:05.671
796	110	commander.alpha@mams.local	LOGIN	User	110	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	3f752a63-da5a-4c2b-9093-1de5d367d035	\N	2026-09-30 00:59:05.919
797	\N	admin@mams.local	LOGIN_FAILED	User	\N	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	4e6db8dd-24d3-4ece-95d1-7c2ead4d85da	{"reason": "invalid password"}	2026-09-30 00:59:06.156
798	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	53856164-1902-4e53-b4c9-15e83fa77138	\N	2026-09-30 00:59:06.398
817	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	7bfecea9-0968-4435-a341-08534f90d55c	\N	2026-09-30 00:59:08.999
825	110	commander.alpha@mams.local	TRANSFER_CREATED	Transfer	745	POST	/api/transfers	::ffff:127.0.0.1	\N	\N	84641836-50b9-462f-9c84-26ca406744c6	{"quantity": 6, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0745", "destinationBaseId": 57}	2026-09-30 00:59:11.218
827	110	commander.alpha@mams.local	TRANSFER_CREATED	Transfer	747	POST	/api/transfers	::ffff:127.0.0.1	\N	\N	ea37917a-e108-4c8d-8209-f1e386a08f2b	{"quantity": 7, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0747", "destinationBaseId": 57}	2026-09-30 00:59:11.277
828	109	admin@mams.local	TRANSFER_APPROVED	Transfer	747	POST	/api/transfers/747/approve	::ffff:127.0.0.1	\N	\N	5720917f-7e4a-4843-88d1-485493bc2be3	{"decidedBy": "admin@mams.local", "referenceNumber": "TRF-2026-0747"}	2026-09-30 00:59:11.288
829	114	logistics.charlie@mams.local	TRANSFER_COMPLETED	Transfer	747	POST	/api/transfers/747/complete	::ffff:127.0.0.1	\N	\N	9c312fa0-1839-45d1-a041-780f2a998a8d	{"quantity": 7, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0747", "destinationBaseId": 57}	2026-09-30 00:59:11.303
831	110	commander.alpha@mams.local	TRANSFER_CREATED	Transfer	749	POST	/api/transfers	::ffff:127.0.0.1	\N	\N	4af57440-0163-4500-b7bd-265e8a9b3aa8	{"quantity": 2, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0749", "destinationBaseId": 57}	2026-09-30 00:59:11.333
832	109	admin@mams.local	TRANSFER_APPROVED	Transfer	749	POST	/api/transfers/749/approve	::ffff:127.0.0.1	\N	\N	b9f860bf-cbb1-45df-87b5-5d1b0382b85a	{"decidedBy": "admin@mams.local", "referenceNumber": "TRF-2026-0749"}	2026-09-30 00:59:11.342
833	114	logistics.charlie@mams.local	TRANSFER_COMPLETED	Transfer	749	POST	/api/transfers/749/complete	::ffff:127.0.0.1	\N	\N	c066100e-4bdf-46b6-a28c-c5ff9f8f138a	{"quantity": 2, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0749", "destinationBaseId": 57}	2026-09-30 00:59:11.352
836	110	commander.alpha@mams.local	TRANSFER_CREATED	Transfer	751	POST	/api/transfers	::ffff:127.0.0.1	\N	\N	c1758e29-dc44-4f26-a247-2ac9a66f31dc	{"quantity": 5, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0751", "destinationBaseId": 57}	2026-09-30 00:59:11.391
837	109	admin@mams.local	TRANSFER_REJECTED	Transfer	751	POST	/api/transfers/751/reject	::ffff:127.0.0.1	\N	\N	154bee10-7cf1-4377-9d3b-bd414c78c23d	{"reason": "Destination already holds sufficient stock", "referenceNumber": "TRF-2026-0751"}	2026-09-30 00:59:11.402
840	110	commander.alpha@mams.local	TRANSFER_CREATED	Transfer	753	POST	/api/transfers	::ffff:127.0.0.1	\N	\N	836ef3ff-af0c-489d-bf78-82cfbbbdcca2	{"quantity": 2, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0753", "destinationBaseId": 57}	2026-09-30 00:59:11.438
841	109	admin@mams.local	TRANSFER_APPROVED	Transfer	753	POST	/api/transfers/753/approve	::ffff:127.0.0.1	\N	\N	8eec896a-5abf-460a-9bbc-fd2598663892	{"decidedBy": "admin@mams.local", "referenceNumber": "TRF-2026-0753"}	2026-09-30 00:59:11.447
842	113	logistics.alpha@mams.local	LOGIN	User	113	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	37c148c9-8ae6-4511-a8a9-be915bcc27fc	\N	2026-09-30 00:59:11.688
848	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	01716561-65eb-4537-93e8-19e61a7f3956	\N	2026-09-30 00:59:14.03
854	113	logistics.alpha@mams.local	PURCHASE_CREATED	Purchase	410	POST	/api/purchases	::1	node	\N	cf052245-aa0c-4e4d-bf76-9e56b3a239f7	{"baseId": 55, "quantity": 24000, "supplier": "Northwind Defence Supplies", "equipmentTypeId": 75, "referenceNumber": "PUR-2026-0410"}	2026-09-30 00:59:47.29
855	114	logistics.charlie@mams.local	PURCHASE_CREATED	Purchase	411	POST	/api/purchases	::1	node	\N	56324e35-a027-4fc8-b58c-bfa753fd0079	{"baseId": 57, "quantity": 40000, "supplier": "Northwind Defence Supplies", "equipmentTypeId": 75, "referenceNumber": "PUR-2026-0411"}	2026-09-30 00:59:47.304
856	109	admin@mams.local	PURCHASE_CREATED	Purchase	412	POST	/api/purchases	::1	node	\N	11e83198-afdb-4c7d-933c-2ff7c82c3eff	{"baseId": 56, "quantity": 16000, "supplier": "Northwind Defence Supplies", "equipmentTypeId": 75, "referenceNumber": "PUR-2026-0412"}	2026-09-30 00:59:47.316
857	113	logistics.alpha@mams.local	PURCHASE_CREATED	Purchase	413	POST	/api/purchases	::1	node	\N	3a6ac410-845d-4758-b6df-e4c1394827ba	{"baseId": 55, "quantity": 120, "supplier": "Meridian Ordnance Corporation", "equipmentTypeId": 74, "referenceNumber": "PUR-2026-0413"}	2026-09-30 00:59:47.33
858	113	logistics.alpha@mams.local	TRANSFER_CREATED	Transfer	755	POST	/api/transfers	::1	node	\N	54c97741-d57b-4068-9f13-9d901481d637	{"quantity": 40, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0755", "destinationBaseId": 56}	2026-09-30 00:59:47.382
859	110	commander.alpha@mams.local	TRANSFER_APPROVED	Transfer	755	POST	/api/transfers/755/approve	::1	node	\N	90660909-bd33-4378-b257-bd66f7da9306	{"decidedBy": "commander.alpha@mams.local", "referenceNumber": "TRF-2026-0755"}	2026-09-30 00:59:47.395
791	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	4bda1c12-975b-4aa2-b530-7c48008ed341	\N	2026-09-30 00:59:04.187
792	110	commander.alpha@mams.local	LOGIN	User	110	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	6ea3525c-d04e-4658-9a9d-7375907501e3	\N	2026-09-30 00:59:04.435
799	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	2253da6b-2c4e-4d0d-8a45-842dc355d1fb	\N	2026-09-30 00:59:07.246
800	110	commander.alpha@mams.local	LOGIN	User	110	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	d5441437-12f3-44ea-aa0b-5f061ba6b5bb	\N	2026-09-30 00:59:07.502
801	110	commander.alpha@mams.local	ASSIGNMENT_CREATED	Assignment	534	POST	/api/assignments	::ffff:127.0.0.1	\N	\N	2c3c4aa9-d36f-4ec3-9ff9-0b5df167fa31	{"baseId": 55, "assetId": null, "quantity": 8, "personnelName": "Test Personnel", "equipmentTypeId": 74, "referenceNumber": "ASN-2026-0534"}	2026-09-30 00:59:07.536
802	110	commander.alpha@mams.local	ASSIGNMENT_CREATED	Assignment	535	POST	/api/assignments	::ffff:127.0.0.1	\N	\N	b2e4a366-228a-438c-be71-315425ba5078	{"baseId": 55, "assetId": null, "quantity": 5, "personnelName": "Return Test", "equipmentTypeId": 74, "referenceNumber": "ASN-2026-0535"}	2026-09-30 00:59:07.573
803	110	commander.alpha@mams.local	ASSIGNMENT_RETURNED	Assignment	535	POST	/api/assignments/535/return	::ffff:127.0.0.1	\N	\N	fcca6440-0339-4a11-9d46-367bc1573d04	{"status": "RETURNED", "referenceNumber": "ASN-2026-0535", "returnedQuantity": 5, "outstandingBefore": 5}	2026-09-30 00:59:07.588
804	110	commander.alpha@mams.local	ASSIGNMENT_CREATED	Assignment	536	POST	/api/assignments	::ffff:127.0.0.1	\N	\N	1be62fc5-4b9b-4876-bbab-49b3be6bec34	{"baseId": 55, "assetId": null, "quantity": 10, "personnelName": "Partial Return Test", "equipmentTypeId": 74, "referenceNumber": "ASN-2026-0536"}	2026-09-30 00:59:07.604
805	110	commander.alpha@mams.local	ASSIGNMENT_RETURNED	Assignment	536	POST	/api/assignments/536/return	::ffff:127.0.0.1	\N	\N	5086d77c-f45c-4177-b814-782dc51ab671	{"status": "PARTIALLY_RETURNED", "referenceNumber": "ASN-2026-0536", "returnedQuantity": 4, "outstandingBefore": 10}	2026-09-30 00:59:07.617
806	110	commander.alpha@mams.local	ASSIGNMENT_CREATED	Assignment	537	POST	/api/assignments	::ffff:127.0.0.1	\N	\N	988b33c1-be46-42fe-98ed-abf114623445	{"baseId": 55, "assetId": null, "quantity": 3, "personnelName": "Over Return Test", "equipmentTypeId": 74, "referenceNumber": "ASN-2026-0537"}	2026-09-30 00:59:07.631
818	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	cc3ad41e-aa60-4fec-9ec7-21f36b5ed37b	\N	2026-09-30 00:59:10.043
819	113	logistics.alpha@mams.local	LOGIN	User	113	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	9cc0c377-9444-4c6a-84f3-8854a785f0a9	\N	2026-09-30 00:59:10.29
820	113	logistics.alpha@mams.local	PURCHASE_CREATED	Purchase	405	POST	/api/purchases	::ffff:127.0.0.1	\N	\N	4fc82ee8-5b0e-4870-b165-7452f2ab7d9b	{"baseId": 55, "quantity": 25, "supplier": "Test Supplier", "equipmentTypeId": 74, "referenceNumber": "PUR-2026-0405"}	2026-09-30 00:59:10.317
821	113	logistics.alpha@mams.local	PURCHASE_CREATED	Purchase	406	POST	/api/purchases	::ffff:127.0.0.1	\N	\N	c92d8dc5-541e-4f75-ba9c-bd2af03b7b91	{"baseId": 55, "quantity": 3, "supplier": null, "equipmentTypeId": 74, "referenceNumber": "PUR-2026-0406"}	2026-09-30 00:59:10.334
843	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	9eafa2c1-af55-485c-9b75-862fa63b48d2	\N	2026-09-30 00:59:12.441
844	110	commander.alpha@mams.local	LOGIN	User	110	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	7bedcc12-8a96-4f81-b2d4-a22932fe763e	\N	2026-09-30 00:59:12.7
845	113	logistics.alpha@mams.local	LOGIN	User	113	POST	/api/auth/login	::ffff:127.0.0.1	\N	\N	cbd19eb7-2ff1-4627-a51e-07f4e112ba40	\N	2026-09-30 00:59:12.949
849	109	admin@mams.local	LOGIN	User	109	POST	/api/auth/login	::1	node	\N	dbdb1cf3-21aa-448e-b1a5-5253bce0f62f	\N	2026-09-30 00:59:46.285
850	110	commander.alpha@mams.local	LOGIN	User	110	POST	/api/auth/login	::1	node	\N	dbe7f050-0422-4a28-b858-c403b9271aa8	\N	2026-09-30 00:59:46.54
851	113	logistics.alpha@mams.local	LOGIN	User	113	POST	/api/auth/login	::1	node	\N	fe55a378-c01f-45a4-b77e-7298205f2453	\N	2026-09-30 00:59:46.787
852	114	logistics.charlie@mams.local	LOGIN	User	114	POST	/api/auth/login	::1	node	\N	0981a84b-96b1-45e9-887d-4253e449b551	\N	2026-09-30 00:59:47.024
853	111	commander.bravo@mams.local	LOGIN	User	111	POST	/api/auth/login	::1	node	\N	7ad09c33-e6f3-45c6-b54d-d01daf21cc48	\N	2026-09-30 00:59:47.263
860	111	commander.bravo@mams.local	TRANSFER_COMPLETED	Transfer	755	POST	/api/transfers/755/complete	::1	node	\N	c8c970a3-f51e-45ef-bdf5-0eed9cfaf766	{"quantity": 40, "sourceBaseId": 55, "equipmentTypeId": 74, "referenceNumber": "TRF-2026-0755", "destinationBaseId": 56}	2026-09-30 00:59:47.408
861	114	logistics.charlie@mams.local	TRANSFER_CREATED	Transfer	756	POST	/api/transfers	::1	node	\N	2bd39779-66c7-4ce8-bd93-58903fe557c8	{"quantity": 12000, "sourceBaseId": 57, "equipmentTypeId": 75, "referenceNumber": "TRF-2026-0756", "destinationBaseId": 55}	2026-09-30 00:59:47.423
862	110	commander.alpha@mams.local	ASSIGNMENT_CREATED	Assignment	543	POST	/api/assignments	::1	node	\N	1b89f470-d5bd-48f2-af62-ffa402507885	{"baseId": 55, "assetId": null, "quantity": 30, "personnelName": "Capt. Arjun Rathore", "equipmentTypeId": 74, "referenceNumber": "ASN-2026-0543"}	2026-09-30 00:59:47.441
863	110	commander.alpha@mams.local	EXPENDITURE_CREATED	Expenditure	522	POST	/api/expenditures	::1	node	\N	159cad4f-8118-40fd-8760-fae10011b44c	{"baseId": 55, "reason": "TRAINING", "quantity": 8, "assignmentId": 543, "equipmentTypeId": 74, "referenceNumber": "EXP-2026-0522"}	2026-09-30 00:59:47.459
864	110	commander.alpha@mams.local	EXPENDITURE_CREATED	Expenditure	523	POST	/api/expenditures	::1	node	\N	38b92a65-a123-448d-ba5d-57b5d1f4747b	{"baseId": 55, "reason": "DAMAGE", "quantity": 5, "assignmentId": null, "equipmentTypeId": 74, "referenceNumber": "EXP-2026-0523"}	2026-09-30 00:59:47.472
865	110	commander.alpha@mams.local	ASSIGNMENT_RETURNED	Assignment	543	POST	/api/assignments/543/return	::1	node	\N	57b968c2-04a8-4a45-a466-743005803c92	{"status": "PARTIALLY_RETURNED", "referenceNumber": "ASN-2026-0543", "returnedQuantity": 12, "outstandingBefore": 22}	2026-09-30 00:59:47.481
866	109	admin@mams.local	PURCHASE_CREATED	Purchase	414	POST	/api/purchases	::1	node	\N	7b70800c-976f-41b7-bb31-62a19e3f425c	{"baseId": 56, "quantity": 25, "supplier": "Halcyon Logistics", "equipmentTypeId": 74, "referenceNumber": "PUR-2026-0414"}	2026-09-30 00:59:47.49
867	109	admin@mams.local	PURCHASE_REVERSED	Purchase	414	POST	/api/purchases/414/reverse	::1	node	\N	6440cbe2-9b70-49ba-8ee5-defb42b12f84	{"baseId": 56, "reason": "Duplicate of order HL-2291, raised twice by the depot.", "quantity": 25, "equipmentTypeId": 74, "originalReference": "PUR-2026-0414", "reversalReference": "PUR-2026-0415"}	2026-09-30 00:59:47.5
\.


--
-- Data for Name: bases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bases (id, code, name, location, description, "isActive", "createdAt", "updatedAt") FROM stdin;
55	ALPHA	Alpha Base	Northern Command, Sector 4	Primary training and vehicle holding base.	t	2026-09-30 00:58:59.691	2026-09-30 00:58:59.691
56	BRAVO	Bravo Base	Eastern Command, Airfield Station	Forward operating base with airlift support.	t	2026-09-30 00:58:59.694	2026-09-30 00:58:59.694
57	CHARLIE	Charlie Base	Southern Command, Coastal Depot	Main logistics depot and ammunition storage.	t	2026-09-30 00:58:59.695	2026-09-30 00:58:59.695
\.


--
-- Data for Name: equipment_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment_types (id, code, name, category, "unitOfMeasure", "isTrackable", "isActive", description, "createdAt", "updatedAt") FROM stdin;
73	PATROL_VEH	Patrol Vehicle	VEHICLE	vehicle	t	t	Four-wheel patrol vehicle, individually serialised.	2026-09-30 00:58:59.696	2026-09-30 00:58:59.696
74	ASSAULT_RIFLE	Assault Rifle	WEAPON	weapon	t	t	Service rifle, individually serialised.	2026-09-30 00:58:59.697	2026-09-30 00:58:59.697
75	AMMO_556	5.56mm Ammunition	AMMUNITION	round	f	t	Bulk quantity issue. Tracked by count only.	2026-09-30 00:58:59.698	2026-09-30 00:58:59.698
76	RADIO_SET	Field Radio Set	OTHER	set	t	t	Manpack radio set, individually serialised.	2026-09-30 00:58:59.7	2026-09-30 00:58:59.7
\.


--
-- Data for Name: expenditures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenditures (id, "referenceNumber", "baseId", "equipmentTypeId", quantity, "expenditureDate", reason, notes, status, "reversedById", "assignmentId", "recordedById", "createdAt", "updatedAt") FROM stdin;
520	EXP-2026-0520	55	74	2	2026-09-30	TRAINING	\N	ACTIVE	\N	539	110	2026-09-30 00:59:08.396	2026-09-30 00:59:08.405
522	EXP-2026-0522	55	74	8	2026-09-23	TRAINING	Consumed during the live fire serial.	ACTIVE	\N	543	110	2026-09-30 00:59:47.452	2026-09-30 00:59:47.454
523	EXP-2026-0523	55	74	5	2026-09-25	DAMAGE	Barrel heat damage beyond service limit.	ACTIVE	\N	\N	110	2026-09-30 00:59:47.469	2026-09-30 00:59:47.47
492	EXP-2026-0001	55	75	2	2026-08-06	TRAINING	Live fire exercise	ACTIVE	\N	\N	109	2026-09-30 00:59:01.195	2026-09-30 00:59:01.195
493	EXP-2026-0002	55	75	1200	2026-08-08	TRAINING	Live fire exercise	ACTIVE	\N	\N	109	2026-09-30 00:59:01.197	2026-09-30 00:59:01.197
494	EXP-2026-0003	57	76	5	2026-08-10	TRAINING	Live fire exercise	ACTIVE	\N	\N	109	2026-09-30 00:59:01.198	2026-09-30 00:59:01.198
495	EXP-2026-0004	56	75	1700	2026-08-12	DAMAGE	Chassis damage during obstacle course	ACTIVE	\N	\N	109	2026-09-30 00:59:01.199	2026-09-30 00:59:01.199
496	EXP-2026-0005	57	75	1700	2026-08-14	TRAINING	Field training day	ACTIVE	\N	\N	109	2026-09-30 00:59:01.2	2026-09-30 00:59:01.2
497	EXP-2026-0006	56	73	8	2026-08-16	MAINTENANCE	Stripped for repairable components	ACTIVE	\N	\N	109	2026-09-30 00:59:01.201	2026-09-30 00:59:01.201
498	EXP-2026-0007	55	75	1700	2026-08-18	DAMAGE	Optics cracked in transit	ACTIVE	\N	\N	109	2026-09-30 00:59:01.202	2026-09-30 00:59:01.202
499	EXP-2026-0008	56	73	11	2026-08-20	TRAINING	Re-certification range	ACTIVE	\N	\N	109	2026-09-30 00:59:01.203	2026-09-30 00:59:01.203
500	EXP-2026-0009	57	75	1950	2026-08-22	DAMAGE	Optics cracked in transit	ACTIVE	\N	\N	109	2026-09-30 00:59:01.204	2026-09-30 00:59:01.204
501	EXP-2026-0010	56	75	11	2026-08-24	TRAINING	Re-certification range	ACTIVE	\N	\N	109	2026-09-30 00:59:01.204	2026-09-30 00:59:01.204
502	EXP-2026-0011	56	73	2	2026-08-26	DAMAGE	Chassis damage during obstacle course	ACTIVE	\N	\N	109	2026-09-30 00:59:01.205	2026-09-30 00:59:01.205
503	EXP-2026-0012	55	75	2	2026-08-28	LOSS	Unrecovered after field exercise	ACTIVE	\N	\N	109	2026-09-30 00:59:01.206	2026-09-30 00:59:01.206
504	EXP-2026-0013	56	75	1450	2026-08-30	MAINTENANCE	Consumed during scheduled servicing	ACTIVE	\N	\N	109	2026-09-30 00:59:01.207	2026-09-30 00:59:01.207
505	EXP-2026-0014	57	75	1450	2026-09-01	DAMAGE	Optics cracked in transit	ACTIVE	\N	\N	109	2026-09-30 00:59:01.207	2026-09-30 00:59:01.207
506	EXP-2026-0015	57	75	700	2026-09-03	MAINTENANCE	Stripped for repairable components	ACTIVE	\N	\N	109	2026-09-30 00:59:01.208	2026-09-30 00:59:01.208
507	EXP-2026-0016	57	76	2	2026-09-07	OTHER	Returned to supplier as defective	ACTIVE	\N	\N	109	2026-09-30 00:59:01.209	2026-09-30 00:59:01.209
508	EXP-2026-0017	55	75	950	2026-09-09	DAMAGE	Barrel heat damage beyond service limit	ACTIVE	\N	\N	109	2026-09-30 00:59:01.209	2026-09-30 00:59:01.209
509	EXP-2026-0018	55	73	2	2026-09-11	MAINTENANCE	Consumed during scheduled servicing	ACTIVE	\N	\N	109	2026-09-30 00:59:01.21	2026-09-30 00:59:01.21
510	EXP-2026-0019	57	76	8	2026-09-13	OTHER	Written off after inspection	ACTIVE	\N	\N	109	2026-09-30 00:59:01.211	2026-09-30 00:59:01.211
511	EXP-2026-0020	55	74	8	2026-09-15	TRAINING	Live fire exercise	ACTIVE	\N	\N	109	2026-09-30 00:59:01.211	2026-09-30 00:59:01.211
512	EXP-2026-0021	57	75	950	2026-09-17	DAMAGE	Barrel heat damage beyond service limit	ACTIVE	\N	\N	109	2026-09-30 00:59:01.212	2026-09-30 00:59:01.212
513	EXP-2026-0022	57	75	1200	2026-09-19	DAMAGE	Optics cracked in transit	ACTIVE	\N	\N	109	2026-09-30 00:59:01.213	2026-09-30 00:59:01.213
514	EXP-2026-0023	57	76	8	2026-09-21	DAMAGE	Barrel heat damage beyond service limit	ACTIVE	\N	\N	109	2026-09-30 00:59:01.214	2026-09-30 00:59:01.214
515	EXP-2026-0024	57	75	200	2026-09-23	OTHER	Written off after inspection	ACTIVE	\N	\N	109	2026-09-30 00:59:01.215	2026-09-30 00:59:01.215
516	EXP-2026-0025	55	75	200	2026-09-25	MAINTENANCE	Consumed during scheduled servicing	ACTIVE	\N	\N	109	2026-09-30 00:59:01.216	2026-09-30 00:59:01.216
517	EXP-2026-0026	56	75	1450	2026-09-27	LOSS	Unrecovered after field exercise	ACTIVE	\N	\N	109	2026-09-30 00:59:01.217	2026-09-30 00:59:01.217
518	EXP-2026-0518	55	74	6	2026-09-30	DAMAGE	Barrel heat damage beyond service limit	ACTIVE	\N	\N	110	2026-09-30 00:59:08.313	2026-09-30 00:59:08.316
519	EXP-2026-0519	55	74	5	2026-09-30	TRAINING	\N	ACTIVE	\N	538	110	2026-09-30 00:59:08.355	2026-09-30 00:59:08.356
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchases (id, "referenceNumber", "baseId", "equipmentTypeId", quantity, "unitPrice", supplier, "purchaseDate", notes, status, "reversedById", "createdById", "createdAt", "updatedAt") FROM stdin;
386	PUR-2026-0001	55	75	20	42.50	Northwind Defence Supplies	2026-08-02	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.126	2026-09-30 00:59:01.126
387	PUR-2026-0002	57	75	18000	42.50	Halcyon Logistics	2026-08-05	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.128	2026-09-30 00:59:01.128
388	PUR-2026-0003	57	75	8000	42.50	Northwind Defence Supplies	2026-08-11	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.129	2026-09-30 00:59:01.129
389	PUR-2026-0004	57	75	14000	42.50	Meridian Ordnance Corporation	2026-08-14	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.129	2026-09-30 00:59:01.129
390	PUR-2026-0005	56	75	40	42.50	Meridian Ordnance Corporation	2026-08-17	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.13	2026-09-30 00:59:01.13
391	PUR-2026-0006	56	75	14000	42.50	Sterling Vehicle Works	2026-08-20	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.132	2026-09-30 00:59:01.132
392	PUR-2026-0007	57	75	10000	42.50	Sterling Vehicle Works	2026-08-23	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.133	2026-09-30 00:59:01.133
393	PUR-2026-0008	56	75	8000	42.50	Northwind Defence Supplies	2026-08-26	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.134	2026-09-30 00:59:01.134
394	PUR-2026-0009	57	75	18000	42.50	Meridian Ordnance Corporation	2026-08-29	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.135	2026-09-30 00:59:01.135
395	PUR-2026-0010	56	75	16000	42.50	Sterling Vehicle Works	2026-09-01	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.135	2026-09-30 00:59:01.135
396	PUR-2026-0011	56	75	16000	42.50	Sterling Vehicle Works	2026-09-04	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.136	2026-09-30 00:59:01.136
397	PUR-2026-0012	57	75	12000	42.50	Sterling Vehicle Works	2026-09-10	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.137	2026-09-30 00:59:01.137
398	PUR-2026-0013	56	75	18000	42.50	Meridian Ordnance Corporation	2026-09-13	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.138	2026-09-30 00:59:01.138
399	PUR-2026-0014	56	75	8000	42.50	Sterling Vehicle Works	2026-09-16	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.139	2026-09-30 00:59:01.139
400	PUR-2026-0015	56	75	8000	42.50	Northwind Defence Supplies	2026-09-19	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.139	2026-09-30 00:59:01.139
401	PUR-2026-0016	55	75	30	42.50	Northwind Defence Supplies	2026-09-22	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.14	2026-09-30 00:59:01.14
402	PUR-2026-0017	57	75	60	42.50	Sterling Vehicle Works	2026-09-25	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.141	2026-09-30 00:59:01.141
403	PUR-2026-0018	56	75	14000	42.50	Northwind Defence Supplies	2026-09-28	Routine replenishment order.	ACTIVE	\N	109	2026-09-30 00:59:01.141	2026-09-30 00:59:01.141
404	PUR-2026-0404	55	74	110	\N	Test Replenishment	2026-09-30	\N	ACTIVE	\N	109	2026-09-30 00:59:08.423	2026-09-30 00:59:08.425
405	PUR-2026-0405	55	74	25	\N	Test Supplier	2026-09-30	\N	ACTIVE	\N	113	2026-09-30 00:59:10.308	2026-09-30 00:59:10.31
406	PUR-2026-0406	55	74	3	\N	\N	2026-09-30	\N	ACTIVE	\N	113	2026-09-30 00:59:10.331	2026-09-30 00:59:10.332
410	PUR-2026-0410	55	75	24000	\N	Northwind Defence Supplies	2026-09-09	\N	ACTIVE	\N	113	2026-09-30 00:59:47.283	2026-09-30 00:59:47.285
411	PUR-2026-0411	57	75	40000	\N	Northwind Defence Supplies	2026-09-09	\N	ACTIVE	\N	114	2026-09-30 00:59:47.302	2026-09-30 00:59:47.303
412	PUR-2026-0412	56	75	16000	\N	Northwind Defence Supplies	2026-09-09	\N	ACTIVE	\N	109	2026-09-30 00:59:47.314	2026-09-30 00:59:47.315
413	PUR-2026-0413	55	74	120	2150.00	Meridian Ordnance Corporation	2026-09-16	\N	ACTIVE	\N	113	2026-09-30 00:59:47.326	2026-09-30 00:59:47.328
414	PUR-2026-0414	56	74	25	\N	Halcyon Logistics	2026-09-26	\N	REVERSED	\N	109	2026-09-30 00:59:47.487	2026-09-30 00:59:47.497
415	PUR-2026-0415	56	74	25	\N	Halcyon Logistics	2026-09-30	Reversal of PUR-2026-0414: Duplicate of order HL-2291, raised twice by the depot.	REVERSED	414	109	2026-09-30 00:59:47.498	2026-09-30 00:59:47.499
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, "userId", "tokenHash", "expiresAt", "revokedAt", "userAgent", "ipAddress", "createdAt") FROM stdin;
365	113	2f42617d25f998ef91db28c4078b52bbff46c78885010913efeb3e03aad5f079	2026-10-07 00:59:08.697	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:08.698
366	109	b3aec707e0e8084b379262e1c2f581a3cf52a5d061150b18d71b07b7506297da	2026-10-07 00:59:08.979	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:08.981
367	109	a0718bb82c2e2c744933f263a24236b276d7673eb6468abf787be43b82a455aa	2026-10-07 00:59:10.029	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:10.031
368	113	e69f97a8575563c760976ca9dd61e1a9c69155b488f9265ca52c4b1bc9d50bfa	2026-10-07 00:59:10.284	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:10.285
369	109	72549fd6999be6e7f37d10fd65b1deabb589bcd213d87d8aa0075dbcf40d6e8f	2026-10-07 00:59:10.647	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:10.648
370	110	af987281b902972c691eece3b0593b0751b0c2f48efb46f3cfb4dcb30f7757fb	2026-10-07 00:59:10.901	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:10.902
371	114	aa4321a16a6c67025933c5fb4d80c5056cc6a477405faf32ce376cc5aec7a734	2026-10-07 00:59:11.149	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:11.15
372	113	93700362ef8ad7998b3d8cf4f44691aff8cf74cf27930515d987ddc4c7673558	2026-10-07 00:59:11.681	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:11.682
373	109	e060d5e611a2185c9edda558127c4fa70ef78db42e6737cabfc39cedfde4e836	2026-10-07 00:59:12.418	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:12.42
374	110	af7324687856844a6752712d7446968aafb08624e9457845ebf47f0b807a4054	2026-10-07 00:59:12.684	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:12.685
375	113	422d8924f33d1b08394b476c162d4d45fdf4482d15b514a7a683844e2742a362	2026-10-07 00:59:12.933	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:12.934
376	110	61dc61d796c3c89a9ee2a4beedb5466ce90bc9d9f60c7070d25750a02fcfe75b	2026-10-07 00:59:13.332	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:13.333
377	111	ab32b941aed28f3f0fea66b7b4bb2b3430fcd93681cea12a3df38409a3c76ca4	2026-10-07 00:59:13.576	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:13.577
378	109	77d1c68de544c63c8b7ec58da4cee0f8d0976846d7e7e8e5f863940e311e96b8	2026-10-07 00:59:14.015	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:14.016
379	109	31fb4a486cfc8295889c54ca5ba69dc40fb09fc435bbac248d1aeb8a90803e79	2026-10-07 00:59:46.261	\N	node	::1	2026-09-30 00:59:46.264
380	110	4d4baa7ce0aa5d6116195f9092584bb9c877e7935d47073ce69e26bba5507d3e	2026-10-07 00:59:46.532	\N	node	::1	2026-09-30 00:59:46.534
381	113	24eaba8ba4519204c9d8a97b95709e1c59383b4f3ec95f49275b47ef0bfb1445	2026-10-07 00:59:46.772	\N	node	::1	2026-09-30 00:59:46.774
382	114	26609588963bf01bf1ee83585c133d87c804c961d775efaff88cc7233cc03b47	2026-10-07 00:59:47.018	\N	node	::1	2026-09-30 00:59:47.02
383	111	c6070c3efc22f59a3d4a5baff5306a9d8461b0d92e638d4b9cebb6c19e1033ea	2026-10-07 00:59:47.256	\N	node	::1	2026-09-30 00:59:47.258
351	109	22ba8c4491345127b8a583c82f80a40844429d62e911e3e70a41ad1d1e4bfbc6	2026-10-07 00:59:02.154	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:02.157
352	109	2e9241115814c1cf7b804335adf0658aaf8b0f02ecd93d270c6e94960e216da9	2026-10-07 00:59:02.423	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:02.424
353	110	ff05b31efe7af892f2bc117389e1c437f52083402d66834a751d88f338093697	2026-10-07 00:59:03.183	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:03.185
354	109	16d3fdabd6805688cb69647268fd2b686e65c1e0a16a880662cb05b6f9b7228c	2026-10-07 00:59:04.173	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:04.175
355	110	4efd12370b3ba65592b733f151adce830e801d61420afa71c912dac452dc02fa	2026-10-07 00:59:04.428	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:04.429
356	109	4f933052dec3fef055e76a69b31139e56754aff660d297033d7a837f337ce6f0	2026-10-07 00:59:05.049	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:05.051
357	109	26568851461f9c9c02acda159fd8d8c7d02a36e45874a457ae176a42036df354	2026-10-07 00:59:05.411	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:05.412
358	110	e3d8372b8aa0f73d54579bc47cea991b5099c7443f34cd3173d9e11cc5b9dc61	2026-10-07 00:59:05.657	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:05.659
359	110	40e5bcc578e6cb4f7f6ec58896c4785c5d39725064072a5c478eb74f8c21da1a	2026-10-07 00:59:05.905	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:05.906
360	109	1d6685f3f40c22caeb141fda229ca6c8229ed6d2d4ae8919000d2f4524953bae	2026-10-07 00:59:06.392	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:06.393
361	109	8107476a57e669e15db4d0e1eb562ea8bdb45051bc62d3d06e476728e0155ed6	2026-10-07 00:59:07.231	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:07.234
362	110	923f9f358b3bd7bf3c65153f0e1656bcfb353f5bf89287ab7600ac9aca3d6a5e	2026-10-07 00:59:07.486	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:07.488
363	110	700e2930769c78f081a7f26d0483ecdf03327b967275f1434df93b3b918c6bcf	2026-10-07 00:59:08.024	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:08.026
364	109	7ba7bfd8107cd2ed2ada88f9fabfc4952aa2893d5ed2698debe042ac5e24eec6	2026-10-07 00:59:08.276	\N	\N	::ffff:127.0.0.1	2026-09-30 00:59:08.278
\.


--
-- Data for Name: stock_balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_balances (id, "baseId", "equipmentTypeId", "openingQuantity", "openingDate", "onHandQuantity", "committedQuantity", version, "createdAt", "updatedAt") FROM stdin;
279	57	74	220	2026-07-31	229	12	1	2026-09-30 00:59:01.122	2026-09-30 00:59:11.351
272	55	75	96000	2026-07-31	128001	16	1	2026-09-30 00:59:01.112	2026-09-30 00:59:47.289
280	57	75	120000	2026-07-31	221885	64	1	2026-09-30 00:59:01.123	2026-09-30 00:59:47.304
276	56	75	54000	2026-07-31	165449	16	1	2026-09-30 00:59:01.118	2026-09-30 00:59:47.316
271	55	74	480	2026-07-31	655	471	20	2026-09-30 00:59:01.111	2026-09-30 06:29:47.479
275	56	74	260	2026-07-31	300	8	2	2026-09-30 00:59:01.117	2026-09-30 06:29:47.497
270	55	73	24	2026-07-31	12	0	1	2026-09-30 00:59:01.108	2026-09-30 00:59:01.218
273	55	76	30	2026-07-31	0	0	1	2026-09-30 00:59:01.114	2026-09-30 00:59:01.22
274	56	73	16	2026-07-31	15	0	1	2026-09-30 00:59:01.116	2026-09-30 00:59:01.221
277	56	76	18	2026-07-31	28	16	1	2026-09-30 00:59:01.12	2026-09-30 00:59:01.223
278	57	73	12	2026-07-31	2	0	1	2026-09-30 00:59:01.121	2026-09-30 00:59:01.223
281	57	76	22	2026-07-31	19	0	1	2026-09-30 00:59:01.124	2026-09-30 00:59:01.225
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transfers (id, "referenceNumber", "sourceBaseId", "destinationBaseId", "equipmentTypeId", quantity, status, "initiatedById", "approvedById", "decisionReason", notes, "completedAt", "cancelledAt", "createdAt", "updatedAt") FROM stdin;
745	TRF-2026-0745	55	57	74	6	PENDING	110	\N	\N	\N	\N	\N	2026-09-30 00:59:11.208	2026-09-30 00:59:11.214
747	TRF-2026-0747	55	57	74	7	COMPLETED	110	109	\N	\N	2026-09-30 00:59:11.301	\N	2026-09-30 00:59:11.275	2026-09-30 00:59:11.302
749	TRF-2026-0749	55	57	74	2	COMPLETED	110	109	\N	\N	2026-09-30 00:59:11.351	\N	2026-09-30 00:59:11.331	2026-09-30 00:59:11.352
751	TRF-2026-0751	55	57	74	5	REJECTED	110	109	Destination already holds sufficient stock	\N	\N	\N	2026-09-30 00:59:11.389	2026-09-30 00:59:11.401
753	TRF-2026-0753	55	57	74	2	APPROVED	110	109	\N	\N	\N	\N	2026-09-30 00:59:11.437	2026-09-30 00:59:11.446
755	TRF-2026-0755	55	56	74	40	COMPLETED	113	110	Approved against the quarterly distribution plan.	Reinforcement of the forward element ahead of the exercise programme. | Received and counted into stores.	2026-09-30 00:59:47.405	\N	2026-09-30 00:59:47.371	2026-09-30 00:59:47.407
732	TRF-2026-0024	55	56	75	10000	CANCELLED	109	109	Cancelled by logistics, requirement withdrawn.	Awaiting or ending lifecycle action.	\N	\N	2026-09-12 00:58:59.494	2026-09-30 00:59:01.162
733	TRF-2026-0025	57	56	76	10	PENDING	109	\N	\N	Awaiting or ending lifecycle action.	\N	\N	2026-09-16 00:58:59.494	2026-09-30 00:59:01.163
734	TRF-2026-0026	57	56	75	8000	REJECTED	109	109	Destination holding sufficient stock.	Awaiting or ending lifecycle action.	\N	\N	2026-09-17 00:58:59.494	2026-09-30 00:59:01.164
735	TRF-2026-0027	57	56	75	10000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-18 20:58:59.494	\N	2026-09-18 00:58:59.494	2026-09-30 00:59:01.165
736	TRF-2026-0028	57	56	75	4000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-19 20:58:59.494	\N	2026-09-19 00:58:59.494	2026-09-30 00:59:01.166
737	TRF-2026-0029	57	55	75	4000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-20 20:58:59.494	\N	2026-09-20 00:58:59.494	2026-09-30 00:59:01.167
738	TRF-2026-0030	57	55	75	15	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-22 20:58:59.494	\N	2026-09-22 00:58:59.494	2026-09-30 00:59:01.168
739	TRF-2026-0031	55	57	76	10	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-23 20:58:59.494	\N	2026-09-23 00:58:59.494	2026-09-30 00:59:01.168
740	TRF-2026-0032	56	55	75	6000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-24 20:58:59.494	\N	2026-09-24 00:58:59.494	2026-09-30 00:59:01.169
741	TRF-2026-0033	57	56	73	25	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-25 20:58:59.494	\N	2026-09-25 00:58:59.494	2026-09-30 00:59:01.17
742	TRF-2026-0034	57	56	74	25	CANCELLED	109	109	Cancelled by logistics, requirement withdrawn.	Awaiting or ending lifecycle action.	\N	\N	2026-09-26 00:58:59.494	2026-09-30 00:59:01.171
743	TRF-2026-0035	56	57	75	6000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-27 20:58:59.494	\N	2026-09-27 00:58:59.494	2026-09-30 00:59:01.171
744	TRF-2026-0036	56	57	76	10	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-28 20:58:59.494	\N	2026-09-28 00:58:59.494	2026-09-30 00:59:01.172
709	TRF-2026-0001	57	56	75	8000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-08-07 20:58:59.494	\N	2026-08-07 00:58:59.494	2026-09-30 00:59:01.143
710	TRF-2026-0002	56	57	76	15	PENDING	109	\N	\N	Awaiting or ending lifecycle action.	\N	\N	2026-08-09 00:58:59.494	2026-09-30 00:59:01.144
711	TRF-2026-0003	55	57	76	15	PENDING	109	\N	\N	Awaiting or ending lifecycle action.	\N	\N	2026-08-10 00:58:59.494	2026-09-30 00:59:01.145
712	TRF-2026-0004	56	57	75	8000	PENDING	109	\N	\N	Awaiting or ending lifecycle action.	\N	\N	2026-08-14 00:58:59.494	2026-09-30 00:59:01.146
746	TRF-2026-0746	55	57	74	3	PENDING	110	\N	\N	\N	\N	\N	2026-09-30 00:59:11.248	2026-09-30 00:59:11.251
748	TRF-2026-0748	55	57	74	2	PENDING	110	\N	\N	\N	\N	\N	2026-09-30 00:59:11.314	2026-09-30 00:59:11.315
750	TRF-2026-0750	55	57	74	5	CANCELLED	110	\N	\N	\N	\N	2026-09-30 00:59:11.378	2026-09-30 00:59:11.369	2026-09-30 00:59:11.379
752	TRF-2026-0752	55	57	74	100127	APPROVED	110	109	\N	\N	\N	\N	2026-09-30 00:59:11.411	2026-09-30 00:59:11.421
756	TRF-2026-0756	57	55	75	12000	PENDING	114	\N	\N	Awaiting approval from the source base.	\N	\N	2026-09-30 00:59:47.417	2026-09-30 00:59:47.419
713	TRF-2026-0005	55	56	73	10	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-08-15 20:58:59.494	\N	2026-08-15 00:58:59.494	2026-09-30 00:59:01.147
714	TRF-2026-0006	57	55	75	8000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-08-18 20:58:59.494	\N	2026-08-18 00:58:59.494	2026-09-30 00:59:01.148
715	TRF-2026-0007	56	55	75	15	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-08-23 20:58:59.494	\N	2026-08-23 00:58:59.494	2026-09-30 00:59:01.15
716	TRF-2026-0008	56	57	75	10000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-08-24 20:58:59.494	\N	2026-08-24 00:58:59.494	2026-09-30 00:59:01.151
717	TRF-2026-0009	55	57	75	6000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-08-25 20:58:59.494	\N	2026-08-25 00:58:59.494	2026-09-30 00:59:01.152
718	TRF-2026-0010	57	56	75	4000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-08-27 20:58:59.494	\N	2026-08-27 00:58:59.494	2026-09-30 00:59:01.152
719	TRF-2026-0011	55	56	76	20	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-08-29 20:58:59.494	\N	2026-08-29 00:58:59.494	2026-09-30 00:59:01.153
720	TRF-2026-0012	56	57	75	6000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-08-30 20:58:59.494	\N	2026-08-30 00:58:59.494	2026-09-30 00:59:01.154
721	TRF-2026-0013	57	55	75	8000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-08-31 20:58:59.494	\N	2026-08-31 00:58:59.494	2026-09-30 00:59:01.155
722	TRF-2026-0014	56	57	75	4000	PENDING	109	\N	\N	Awaiting or ending lifecycle action.	\N	\N	2026-09-01 00:58:59.494	2026-09-30 00:59:01.155
723	TRF-2026-0015	55	57	75	8000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-02 20:58:59.494	\N	2026-09-02 00:58:59.494	2026-09-30 00:59:01.156
724	TRF-2026-0016	55	57	75	4000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-03 20:58:59.494	\N	2026-09-03 00:58:59.494	2026-09-30 00:59:01.157
725	TRF-2026-0017	55	56	75	25	PENDING	109	\N	\N	Awaiting or ending lifecycle action.	\N	\N	2026-09-05 00:58:59.494	2026-09-30 00:59:01.157
726	TRF-2026-0018	56	57	73	15	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-06 20:58:59.494	\N	2026-09-06 00:58:59.494	2026-09-30 00:59:01.158
727	TRF-2026-0019	56	57	76	20	CANCELLED	109	109	Cancelled by logistics, requirement withdrawn.	Awaiting or ending lifecycle action.	\N	\N	2026-09-07 00:58:59.494	2026-09-30 00:59:01.159
728	TRF-2026-0020	55	56	75	25	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-08 20:58:59.494	\N	2026-09-08 00:58:59.494	2026-09-30 00:59:01.16
729	TRF-2026-0021	57	56	75	10	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-09 20:58:59.494	\N	2026-09-09 00:58:59.494	2026-09-30 00:59:01.16
730	TRF-2026-0022	57	55	75	4000	COMPLETED	109	109	\N	Movement completed with despatch and receipt confirmation.	2026-09-10 20:58:59.494	\N	2026-09-10 00:58:59.494	2026-09-30 00:59:01.161
731	TRF-2026-0023	57	55	75	20	PENDING	109	\N	\N	Awaiting or ending lifecycle action.	\N	\N	2026-09-11 00:58:59.494	2026-09-30 00:59:01.162
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, "passwordHash", role, "baseId", "isActive", "tokenVersion", "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
112	Maj. Rohan Fernandes	commander.charlie@mams.local	$2b$12$aEiKCyE.9NfFgOYvv51tM.jmIgIm4oMgWgDOLzEGWNpqj9l7H6ZpW	BASE_COMMANDER	57	t	1	\N	2026-09-30 00:59:00.629	2026-09-30 00:59:00.629
109	System Administrator	admin@mams.local	$2b$12$Cwcz1vrvjbFYyAHzsDnNou/FPh4vKLlLNPp7ioWMIYCnXdVSrlua2	ADMIN	\N	t	1	2026-09-30 00:59:46.282	2026-09-30 00:58:59.93	2026-09-30 00:59:46.284
110	Col. Devansh Kulkarni	commander.alpha@mams.local	$2b$12$ZdqpK1foG0LZXr5fAGswYu967BBZ4/VEAX7ngCB9mffUdUG4.6CPq	BASE_COMMANDER	55	t	1	2026-09-30 00:59:46.537	2026-09-30 00:59:00.169	2026-09-30 00:59:46.539
113	Sub. Sanjay Kulkarni	logistics.alpha@mams.local	$2b$12$soD7REF8D0cmWSWebPtV4.d4Nj.nMBVnUm5K6ny0BMm82W11Cc1te	LOGISTICS_OFFICER	55	t	1	2026-09-30 00:59:46.785	2026-09-30 00:59:00.867	2026-09-30 00:59:46.787
114	Sub. Kavya Pillai	logistics.charlie@mams.local	$2b$12$rfj4kbi/ShFfSVj5WHMdleWDBzYxRX9pYHhIt3pSvsk2maJGBMjuG	LOGISTICS_OFFICER	57	t	1	2026-09-30 00:59:47.022	2026-09-30 00:59:01.096	2026-09-30 00:59:47.023
111	Col. Ishita Bhattacharya	commander.bravo@mams.local	$2b$12$ixt3SP83UeRKo4ei.HAI8.VNLQjqCT0xyV2rLyRQ2BNtyqbq.0A4m	BASE_COMMANDER	56	t	1	2026-09-30 00:59:47.261	2026-09-30 00:59:00.399	2026-09-30 00:59:47.262
\.


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assets_id_seq', 419, true);


--
-- Name: assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assignments_id_seq', 543, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 867, true);


--
-- Name: bases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bases_id_seq', 57, true);


--
-- Name: equipment_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipment_types_id_seq', 76, true);


--
-- Name: expenditures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expenditures_id_seq', 523, true);


--
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchases_id_seq', 415, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 383, true);


--
-- Name: stock_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_balances_id_seq', 292, true);


--
-- Name: transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transfers_id_seq', 756, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 114, true);


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

