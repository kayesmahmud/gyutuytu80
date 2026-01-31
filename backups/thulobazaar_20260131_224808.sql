--
-- PostgreSQL database dump
--

\restrict 8AKYFrJqfHDj1g2a4UdM3FBQcDiiR48XONwPe4pNKaCxSq0asiSZHKKLuZucqVD

-- Dumped from database version 18.1 (Homebrew)
-- Dumped by pg_dump version 18.1

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: elw
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO elw;

--
-- Name: announcement_audience; Type: TYPE; Schema: public; Owner: elw
--

CREATE TYPE public.announcement_audience AS ENUM (
    'all_users',
    'new_users',
    'business_verified',
    'individual_verified'
);


ALTER TYPE public.announcement_audience OWNER TO elw;

--
-- Name: support_ticket_category; Type: TYPE; Schema: public; Owner: elw
--

CREATE TYPE public.support_ticket_category AS ENUM (
    'general',
    'account',
    'payment',
    'ads',
    'verification',
    'technical',
    'report',
    'other'
);


ALTER TYPE public.support_ticket_category OWNER TO elw;

--
-- Name: support_ticket_priority; Type: TYPE; Schema: public; Owner: elw
--

CREATE TYPE public.support_ticket_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);


ALTER TYPE public.support_ticket_priority OWNER TO elw;

--
-- Name: support_ticket_status; Type: TYPE; Schema: public; Owner: elw
--

CREATE TYPE public.support_ticket_status AS ENUM (
    'open',
    'in_progress',
    'waiting_on_user',
    'resolved',
    'closed'
);


ALTER TYPE public.support_ticket_status OWNER TO elw;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: elw
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'editor',
    'super_admin',
    'root'
);


ALTER TYPE public.user_role OWNER TO elw;

--
-- Name: auto_generate_user_slug(); Type: FUNCTION; Schema: public; Owner: elw
--

CREATE FUNCTION public.auto_generate_user_slug() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Generate shop slug for all accounts if not set
    IF NEW.shop_slug IS NULL THEN
        IF NEW.account_type = 'business' THEN
            NEW.shop_slug := generate_unique_slug(
                COALESCE(NEW.business_name, NEW.full_name, 'shop-' || NEW.id::TEXT),
                'shop'
            );
        ELSE
            -- Individual accounts also use shop_slug
            NEW.shop_slug := generate_unique_slug(
                COALESCE(NEW.full_name, 'seller-' || NEW.id::TEXT),
                'seller'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_generate_user_slug() OWNER TO elw;

--
-- Name: FUNCTION auto_generate_user_slug(); Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON FUNCTION public.auto_generate_user_slug() IS 'Automatically generate slug when user is created or updated';


--
-- Name: cleanup_expired_typing_indicators(); Type: FUNCTION; Schema: public; Owner: elw
--

CREATE FUNCTION public.cleanup_expired_typing_indicators() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM typing_indicators WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$;


ALTER FUNCTION public.cleanup_expired_typing_indicators() OWNER TO elw;

--
-- Name: expire_old_promotions(); Type: FUNCTION; Schema: public; Owner: elw
--

CREATE FUNCTION public.expire_old_promotions() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Expire bumped ads
    UPDATE ads
    SET is_bumped = FALSE
    WHERE is_bumped = TRUE
    AND bump_expires_at < CURRENT_TIMESTAMP;

    -- Expire sticky ads
    UPDATE ads
    SET is_sticky = FALSE
    WHERE is_sticky = TRUE
    AND sticky_expires_at < CURRENT_TIMESTAMP;

    -- Expire urgent ads
    UPDATE ads
    SET is_urgent = FALSE
    WHERE is_urgent = TRUE
    AND urgent_expires_at < CURRENT_TIMESTAMP;

    -- Update promotion records
    UPDATE ad_promotions
    SET is_active = FALSE
    WHERE is_active = TRUE
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$;


ALTER FUNCTION public.expire_old_promotions() OWNER TO elw;

--
-- Name: FUNCTION expire_old_promotions(); Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON FUNCTION public.expire_old_promotions() IS 'Auto-expire promotions that have passed their expiry date';


--
-- Name: generate_unique_slug(text, text); Type: FUNCTION; Schema: public; Owner: elw
--

CREATE FUNCTION public.generate_unique_slug(base_text text, slug_type text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
    slug_exists BOOLEAN;
BEGIN
    -- Convert to lowercase and replace spaces/special chars with hyphens
    base_slug := lower(trim(regexp_replace(base_text, '[^a-zA-Z0-9\s-]', '', 'g')));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);

    -- Start with base slug
    final_slug := base_slug;

    -- Check if slug exists and add counter if needed
    -- Both shop and seller types now use shop_slug column
    LOOP
        SELECT EXISTS(SELECT 1 FROM users WHERE shop_slug = final_slug) INTO slug_exists;
        
        EXIT WHEN NOT slug_exists;

        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;

    RETURN final_slug;
END;
$$;


ALTER FUNCTION public.generate_unique_slug(base_text text, slug_type text) OWNER TO elw;

--
-- Name: FUNCTION generate_unique_slug(base_text text, slug_type text); Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON FUNCTION public.generate_unique_slug(base_text text, slug_type text) IS 'Generate unique URL-friendly slug for shop or seller profiles';


--
-- Name: update_area_listing_counts(); Type: FUNCTION; Schema: public; Owner: elw
--

CREATE FUNCTION public.update_area_listing_counts() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE areas
  SET listing_count = (
    SELECT COUNT(*)
    FROM ads
    WHERE ads.area_id = areas.id
      AND ads.status = 'approved'
  );
END;
$$;


ALTER FUNCTION public.update_area_listing_counts() OWNER TO elw;

--
-- Name: update_areas_updated_at(); Type: FUNCTION; Schema: public; Owner: elw
--

CREATE FUNCTION public.update_areas_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_areas_updated_at() OWNER TO elw;

--
-- Name: update_conversation_timestamp(); Type: FUNCTION; Schema: public; Owner: elw
--

CREATE FUNCTION public.update_conversation_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE conversations
  SET updated_at = CURRENT_TIMESTAMP,
      last_message_at = CURRENT_TIMESTAMP
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_conversation_timestamp() OWNER TO elw;

--
-- Name: update_individual_verification_updated_at(); Type: FUNCTION; Schema: public; Owner: elw
--

CREATE FUNCTION public.update_individual_verification_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_individual_verification_updated_at() OWNER TO elw;

--
-- Name: update_promotion_pricing_updated_at(); Type: FUNCTION; Schema: public; Owner: elw
--

CREATE FUNCTION public.update_promotion_pricing_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_promotion_pricing_updated_at() OWNER TO elw;

--
-- Name: update_site_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: elw
--

CREATE FUNCTION public.update_site_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_site_settings_updated_at() OWNER TO elw;

--
-- Name: update_verification_pricing_updated_at(); Type: FUNCTION; Schema: public; Owner: elw
--

CREATE FUNCTION public.update_verification_pricing_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_verification_pricing_updated_at() OWNER TO elw;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _ads_condition_backup; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public._ads_condition_backup (
    id integer,
    condition character varying(20),
    updated_at timestamp without time zone
);


ALTER TABLE public._ads_condition_backup OWNER TO elw;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: elw
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


ALTER TABLE public._prisma_migrations OWNER TO elw;

--
-- Name: ad_images; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.ad_images (
    id integer NOT NULL,
    ad_id integer NOT NULL,
    filename character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ad_images_path_not_empty CHECK (((file_path)::text <> ''::text))
);


ALTER TABLE public.ad_images OWNER TO elw;

--
-- Name: ad_images_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.ad_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ad_images_id_seq OWNER TO elw;

--
-- Name: ad_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.ad_images_id_seq OWNED BY public.ad_images.id;


--
-- Name: ad_promotions; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.ad_promotions (
    id integer NOT NULL,
    ad_id integer NOT NULL,
    user_id integer NOT NULL,
    promotion_type character varying(20) NOT NULL,
    duration_days integer NOT NULL,
    price_paid numeric(10,2) NOT NULL,
    account_type character varying(20) NOT NULL,
    payment_reference character varying(255),
    payment_method character varying(50),
    starts_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ad_promotions OWNER TO elw;

--
-- Name: TABLE ad_promotions; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.ad_promotions IS 'Ad promotion purchase history and tracking';


--
-- Name: ad_promotions_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.ad_promotions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ad_promotions_id_seq OWNER TO elw;

--
-- Name: ad_promotions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.ad_promotions_id_seq OWNED BY public.ad_promotions.id;


--
-- Name: ad_reports; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.ad_reports (
    id integer NOT NULL,
    ad_id integer NOT NULL,
    reporter_id integer NOT NULL,
    reason character varying(100) NOT NULL,
    details text,
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ad_reports_status_check CHECK (((status)::text = ANY (ARRAY['pending'::text, 'reviewed'::text, 'resolved'::text, 'dismissed'::text, 'restored'::text])))
);


ALTER TABLE public.ad_reports OWNER TO elw;

--
-- Name: ad_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.ad_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ad_reports_id_seq OWNER TO elw;

--
-- Name: ad_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.ad_reports_id_seq OWNED BY public.ad_reports.id;


--
-- Name: ad_review_history; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.ad_review_history (
    id integer NOT NULL,
    ad_id integer NOT NULL,
    action character varying(50) NOT NULL,
    actor_id integer NOT NULL,
    actor_type character varying(20) NOT NULL,
    reason text,
    notes text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ad_review_history OWNER TO elw;

--
-- Name: ad_review_history_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.ad_review_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ad_review_history_id_seq OWNER TO elw;

--
-- Name: ad_review_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.ad_review_history_id_seq OWNED BY public.ad_review_history.id;


--
-- Name: admin_activity_logs; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.admin_activity_logs (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id integer NOT NULL,
    details jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_activity_logs OWNER TO elw;

--
-- Name: TABLE admin_activity_logs; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.admin_activity_logs IS 'Audit trail for all admin/editor actions';


--
-- Name: admin_activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.admin_activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_activity_logs_id_seq OWNER TO elw;

--
-- Name: admin_activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.admin_activity_logs_id_seq OWNED BY public.admin_activity_logs.id;


--
-- Name: ads; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.ads (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    price numeric(12,2),
    category_id integer,
    location_id integer,
    seller_name character varying(100),
    seller_phone character varying(20),
    condition character varying(20) DEFAULT 'Used'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    view_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    user_id integer,
    status_reason text,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    latitude numeric(10,8),
    longitude numeric(11,8),
    deleted_at timestamp without time zone,
    deleted_by integer,
    deletion_reason text,
    is_bumped boolean DEFAULT false,
    bump_expires_at timestamp without time zone,
    is_sticky boolean DEFAULT false,
    sticky_expires_at timestamp without time zone,
    is_urgent boolean DEFAULT false,
    urgent_expires_at timestamp without time zone,
    total_promotions integer DEFAULT 0,
    last_promoted_at timestamp without time zone,
    slug character varying(255) NOT NULL,
    featured_until timestamp without time zone,
    urgent_until timestamp without time zone,
    sticky_until timestamp without time zone,
    promoted_at timestamp without time zone,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    suspended_until timestamp(6) without time zone,
    CONSTRAINT ads_price_non_negative CHECK (((price IS NULL) OR (price >= (0)::numeric))),
    CONSTRAINT ads_slug_not_empty CHECK (((slug)::text <> ''::text)),
    CONSTRAINT ads_status_valid CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('expired'::character varying)::text, ('sold'::character varying)::text, ('suspended'::character varying)::text, ('deleted'::character varying)::text]))),
    CONSTRAINT ads_title_not_empty CHECK ((TRIM(BOTH FROM title) <> ''::text))
);


ALTER TABLE public.ads OWNER TO elw;

--
-- Name: COLUMN ads.deleted_at; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.ads.deleted_at IS 'Soft delete timestamp (NULL = not deleted)';


--
-- Name: COLUMN ads.deleted_by; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.ads.deleted_by IS 'Editor/Admin who deleted this ad';


--
-- Name: COLUMN ads.is_bumped; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.ads.is_bumped IS 'Ad is bumped to top of listings';


--
-- Name: COLUMN ads.is_sticky; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.ads.is_sticky IS 'Ad stays at top (premium promotion)';


--
-- Name: COLUMN ads.is_urgent; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.ads.is_urgent IS 'Ad marked as urgent sale';


--
-- Name: COLUMN ads.featured_until; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.ads.featured_until IS 'Featured promotion expires at this timestamp';


--
-- Name: COLUMN ads.urgent_until; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.ads.urgent_until IS 'Urgent promotion expires at this timestamp';


--
-- Name: COLUMN ads.sticky_until; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.ads.sticky_until IS 'Sticky promotion expires at this timestamp';


--
-- Name: COLUMN ads.promoted_at; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.ads.promoted_at IS 'Last time any promotion was activated';


--
-- Name: ads_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.ads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ads_id_seq OWNER TO elw;

--
-- Name: ads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.ads_id_seq OWNED BY public.ads.id;


--
-- Name: announcement_read_receipts; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.announcement_read_receipts (
    id integer NOT NULL,
    announcement_id integer NOT NULL,
    user_id integer NOT NULL,
    read_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.announcement_read_receipts OWNER TO elw;

--
-- Name: announcement_read_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.announcement_read_receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcement_read_receipts_id_seq OWNER TO elw;

--
-- Name: announcement_read_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.announcement_read_receipts_id_seq OWNED BY public.announcement_read_receipts.id;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    target_audience public.announcement_audience DEFAULT 'all_users'::public.announcement_audience NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.announcements OWNER TO elw;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO elw;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: business_subscriptions; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.business_subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    plan_name character varying(100) NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    payment_reference character varying(255),
    payment_method character varying(50),
    start_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    end_date timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    auto_renew boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.business_subscriptions OWNER TO elw;

--
-- Name: TABLE business_subscriptions; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.business_subscriptions IS 'Business account subscription payments and renewals';


--
-- Name: business_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.business_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_subscriptions_id_seq OWNER TO elw;

--
-- Name: business_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.business_subscriptions_id_seq OWNED BY public.business_subscriptions.id;


--
-- Name: business_verification_requests; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.business_verification_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    business_name character varying(255) NOT NULL,
    business_license_document character varying(255) CONSTRAINT business_verification_reques_business_license_document_not_null NOT NULL,
    business_category character varying(100),
    business_description text,
    business_website character varying(255),
    business_phone character varying(20),
    business_address text,
    payment_reference character varying(255),
    payment_amount numeric(10,2),
    status character varying(20) DEFAULT 'pending'::character varying,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    duration_days integer DEFAULT 365,
    payment_status character varying(20) DEFAULT 'pending'::character varying
);


ALTER TABLE public.business_verification_requests OWNER TO elw;

--
-- Name: TABLE business_verification_requests; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.business_verification_requests IS 'Business account verification requests from users';


--
-- Name: business_verification_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.business_verification_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_verification_requests_id_seq OWNER TO elw;

--
-- Name: business_verification_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.business_verification_requests_id_seq OWNED BY public.business_verification_requests.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    icon character varying(10),
    created_at timestamp without time zone DEFAULT now(),
    parent_id integer,
    form_template character varying(50),
    display_order integer DEFAULT 999,
    CONSTRAINT categories_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text))
);


ALTER TABLE public.categories OWNER TO elw;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO elw;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: category_pricing_tiers; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.category_pricing_tiers (
    id integer NOT NULL,
    category_id integer NOT NULL,
    pricing_tier character varying(50) DEFAULT 'default'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.category_pricing_tiers OWNER TO elw;

--
-- Name: category_pricing_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.category_pricing_tiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.category_pricing_tiers_id_seq OWNER TO elw;

--
-- Name: category_pricing_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.category_pricing_tiers_id_seq OWNED BY public.category_pricing_tiers.id;


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    ad_id integer NOT NULL,
    buyer_id integer NOT NULL,
    seller_id integer NOT NULL,
    buyer_name character varying(255) NOT NULL,
    buyer_email character varying(255) NOT NULL,
    buyer_phone character varying(20),
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_reply boolean DEFAULT false,
    reply_to_message_id integer
);


ALTER TABLE public.contact_messages OWNER TO elw;

--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_messages_id_seq OWNER TO elw;

--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.conversation_participants (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_read_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_muted boolean DEFAULT false,
    is_archived boolean DEFAULT false
);


ALTER TABLE public.conversation_participants OWNER TO elw;

--
-- Name: TABLE conversation_participants; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.conversation_participants IS 'Users participating in conversations';


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.conversation_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversation_participants_id_seq OWNER TO elw;

--
-- Name: conversation_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.conversation_participants_id_seq OWNED BY public.conversation_participants.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    type character varying(50) DEFAULT 'direct'::character varying NOT NULL,
    title character varying(255),
    ad_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_message_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.conversations OWNER TO elw;

--
-- Name: TABLE conversations; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.conversations IS 'Chat conversations/threads';


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO elw;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: editor_permissions; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.editor_permissions (
    id integer NOT NULL,
    editor_id integer NOT NULL,
    permission character varying(100) NOT NULL,
    granted_by integer,
    granted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.editor_permissions OWNER TO elw;

--
-- Name: editor_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.editor_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.editor_permissions_id_seq OWNER TO elw;

--
-- Name: editor_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.editor_permissions_id_seq OWNED BY public.editor_permissions.id;


--
-- Name: individual_verification_requests; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.individual_verification_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    id_document_type character varying(50) NOT NULL,
    id_document_number character varying(100) NOT NULL,
    id_document_front character varying(255),
    id_document_back character varying(255),
    selfie_with_id character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    full_name character varying(255),
    duration_days integer DEFAULT 365,
    payment_amount numeric(10,2),
    payment_reference character varying(255),
    payment_status character varying(20) DEFAULT 'pending'::character varying
);


ALTER TABLE public.individual_verification_requests OWNER TO elw;

--
-- Name: TABLE individual_verification_requests; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.individual_verification_requests IS 'Stores verification requests for individual sellers (blue badge)';


--
-- Name: COLUMN individual_verification_requests.id_document_type; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.individual_verification_requests.id_document_type IS 'Type of ID: citizenship, passport, or driving_license';


--
-- Name: COLUMN individual_verification_requests.status; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.individual_verification_requests.status IS 'Verification status: pending, approved, rejected';


--
-- Name: individual_verification_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.individual_verification_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.individual_verification_requests_id_seq OWNER TO elw;

--
-- Name: individual_verification_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.individual_verification_requests_id_seq OWNED BY public.individual_verification_requests.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    parent_id integer,
    created_at timestamp without time zone DEFAULT now(),
    slug character varying(100),
    latitude numeric(10,8),
    longitude numeric(11,8)
);


ALTER TABLE public.locations OWNER TO elw;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO elw;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: message_read_receipts; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.message_read_receipts (
    id integer NOT NULL,
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    read_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.message_read_receipts OWNER TO elw;

--
-- Name: TABLE message_read_receipts; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.message_read_receipts IS 'Read receipts for messages';


--
-- Name: message_read_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.message_read_receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_read_receipts_id_seq OWNER TO elw;

--
-- Name: message_read_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.message_read_receipts_id_seq OWNED BY public.message_read_receipts.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    type character varying(50) DEFAULT 'text'::character varying,
    attachment_url text,
    is_edited boolean DEFAULT false,
    edited_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO elw;

--
-- Name: TABLE messages; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.messages IS 'Individual messages within conversations';


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO elw;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.payment_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    payment_type character varying(50) NOT NULL,
    payment_gateway character varying(20) NOT NULL,
    amount numeric(10,2) NOT NULL,
    transaction_id character varying(255) NOT NULL,
    reference_id character varying(255),
    related_id integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verified_at timestamp without time zone,
    payment_url text,
    failure_reason text
);


ALTER TABLE public.payment_transactions OWNER TO elw;

--
-- Name: TABLE payment_transactions; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.payment_transactions IS 'All payment transactions (mock and real)';


--
-- Name: COLUMN payment_transactions.payment_type; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.payment_transactions.payment_type IS 'Type of payment: individual_verification, business_verification, ad_promotion';


--
-- Name: COLUMN payment_transactions.payment_gateway; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.payment_transactions.payment_gateway IS 'Payment gateway used: mock, esewa, khalti';


--
-- Name: COLUMN payment_transactions.status; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.payment_transactions.status IS 'Payment status: pending, verified, failed, refunded';


--
-- Name: COLUMN payment_transactions.metadata; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.payment_transactions.metadata IS 'Additional data in JSON format';


--
-- Name: payment_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.payment_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_transactions_id_seq OWNER TO elw;

--
-- Name: payment_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.payment_transactions_id_seq OWNED BY public.payment_transactions.id;


--
-- Name: phone_otps; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.phone_otps (
    id integer NOT NULL,
    phone character varying(20) NOT NULL,
    otp_code character varying(6) NOT NULL,
    purpose character varying(50) DEFAULT 'registration'::character varying NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.phone_otps OWNER TO elw;

--
-- Name: phone_otps_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.phone_otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.phone_otps_id_seq OWNER TO elw;

--
-- Name: phone_otps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.phone_otps_id_seq OWNED BY public.phone_otps.id;


--
-- Name: promotion_pricing; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.promotion_pricing (
    id integer NOT NULL,
    promotion_type character varying(20) NOT NULL,
    duration_days integer NOT NULL,
    account_type character varying(20) NOT NULL,
    price numeric(10,2) NOT NULL,
    discount_percentage integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    pricing_tier character varying(50) DEFAULT 'default'::character varying
);


ALTER TABLE public.promotion_pricing OWNER TO elw;

--
-- Name: TABLE promotion_pricing; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.promotion_pricing IS 'Configurable pricing for ad promotions (managed by super admin)';


--
-- Name: COLUMN promotion_pricing.promotion_type; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.promotion_pricing.promotion_type IS 'Type of promotion: featured, urgent, or sticky';


--
-- Name: COLUMN promotion_pricing.duration_days; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.promotion_pricing.duration_days IS 'Duration in days: 3, 7, 15, or 30';


--
-- Name: promotion_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.promotion_pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promotion_pricing_id_seq OWNER TO elw;

--
-- Name: promotion_pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.promotion_pricing_id_seq OWNED BY public.promotion_pricing.id;


--
-- Name: promotional_campaigns; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.promotional_campaigns (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    discount_percentage integer DEFAULT 0 NOT NULL,
    promo_code character varying(50),
    banner_text character varying(255),
    banner_emoji character varying(10) DEFAULT '🎉'::character varying,
    start_date timestamp(6) without time zone NOT NULL,
    end_date timestamp(6) without time zone NOT NULL,
    is_active boolean DEFAULT true,
    applies_to_tiers text[],
    applies_to_promotion_types text[],
    min_duration_days integer,
    max_uses integer,
    current_uses integer DEFAULT 0,
    created_by integer,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.promotional_campaigns OWNER TO elw;

--
-- Name: TABLE promotional_campaigns; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.promotional_campaigns IS 'Time-limited promotional campaigns for discounts on ad promotions';


--
-- Name: promotional_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.promotional_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promotional_campaigns_id_seq OWNER TO elw;

--
-- Name: promotional_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.promotional_campaigns_id_seq OWNED BY public.promotional_campaigns.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_revoked boolean DEFAULT false NOT NULL,
    replaced_by character varying(255)
);


ALTER TABLE public.refresh_tokens OWNER TO elw;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO elw;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: shop_reports; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.shop_reports (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    reporter_id integer NOT NULL,
    reason character varying(100) NOT NULL,
    details text,
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now(),
    resolved_by integer
);


ALTER TABLE public.shop_reports OWNER TO elw;

--
-- Name: shop_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.shop_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shop_reports_id_seq OWNER TO elw;

--
-- Name: shop_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.shop_reports_id_seq OWNED BY public.shop_reports.id;


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.site_settings (
    id integer NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text,
    setting_type character varying(50) DEFAULT 'string'::character varying,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.site_settings OWNER TO elw;

--
-- Name: site_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.site_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_settings_id_seq OWNER TO elw;

--
-- Name: site_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.site_settings_id_seq OWNED BY public.site_settings.id;


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.support_messages (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    type character varying(50) DEFAULT 'text'::character varying,
    attachment_url text,
    is_internal boolean DEFAULT false,
    created_at timestamp(6) without time zone DEFAULT now()
);


ALTER TABLE public.support_messages OWNER TO elw;

--
-- Name: support_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.support_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_messages_id_seq OWNER TO elw;

--
-- Name: support_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.support_messages_id_seq OWNED BY public.support_messages.id;


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.support_tickets (
    id integer NOT NULL,
    ticket_number character varying(20) NOT NULL,
    user_id integer NOT NULL,
    assigned_to integer,
    subject character varying(255) NOT NULL,
    category public.support_ticket_category DEFAULT 'general'::public.support_ticket_category,
    priority public.support_ticket_priority DEFAULT 'normal'::public.support_ticket_priority,
    status public.support_ticket_status DEFAULT 'open'::public.support_ticket_status,
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now(),
    resolved_at timestamp(6) without time zone,
    closed_at timestamp(6) without time zone
);


ALTER TABLE public.support_tickets OWNER TO elw;

--
-- Name: support_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.support_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_tickets_id_seq OWNER TO elw;

--
-- Name: support_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.support_tickets_id_seq OWNED BY public.support_tickets.id;


--
-- Name: typing_indicators; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.typing_indicators (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    user_id integer NOT NULL,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.typing_indicators OWNER TO elw;

--
-- Name: TABLE typing_indicators; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.typing_indicators IS 'Real-time typing indicator state';


--
-- Name: typing_indicators_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.typing_indicators_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.typing_indicators_id_seq OWNER TO elw;

--
-- Name: typing_indicators_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.typing_indicators_id_seq OWNED BY public.typing_indicators.id;


--
-- Name: unread_message_counts; Type: VIEW; Schema: public; Owner: elw
--

CREATE VIEW public.unread_message_counts AS
 SELECT cp.user_id,
    cp.conversation_id,
    count(m.id) AS unread_count
   FROM (public.conversation_participants cp
     LEFT JOIN public.messages m ON (((m.conversation_id = cp.conversation_id) AND (m.created_at > cp.last_read_at) AND (m.sender_id <> cp.user_id) AND (m.is_deleted = false))))
  GROUP BY cp.user_id, cp.conversation_id;


ALTER VIEW public.unread_message_counts OWNER TO elw;

--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.user_favorites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    ad_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_favorites OWNER TO elw;

--
-- Name: TABLE user_favorites; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.user_favorites IS 'Stores user favorited/bookmarked ads';


--
-- Name: user_favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.user_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_favorites_id_seq OWNER TO elw;

--
-- Name: user_favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.user_favorites_id_seq OWNED BY public.user_favorites.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255),
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    location_id integer,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role public.user_role DEFAULT 'user'::public.user_role,
    bio text,
    avatar character varying(255),
    cover_photo character varying(255),
    verified_at timestamp without time zone,
    verified_by integer,
    is_suspended boolean DEFAULT false,
    suspended_at timestamp without time zone,
    suspended_until timestamp without time zone,
    suspended_by integer,
    suspension_reason text,
    account_type character varying(20) DEFAULT 'individual'::character varying,
    business_name character varying(255),
    business_license_document character varying(255),
    business_verification_status character varying(20) DEFAULT NULL::character varying,
    business_verified_at timestamp without time zone,
    business_verified_by integer,
    business_rejection_reason text,
    business_payment_reference character varying(255),
    business_payment_amount numeric(10,2),
    business_category character varying(100),
    business_description text,
    business_website character varying(255),
    business_phone character varying(20),
    business_address text,
    business_subscription_start timestamp without time zone,
    business_subscription_end timestamp without time zone,
    business_subscription_status character varying(20),
    shop_slug character varying(255),
    individual_verified boolean DEFAULT false,
    individual_verified_at timestamp without time zone,
    individual_verified_by integer,
    verified_seller_name character varying(255),
    individual_verification_expires_at timestamp without time zone,
    business_verification_expires_at timestamp without time zone,
    latitude numeric(10,8),
    longitude numeric(11,8),
    formatted_address text,
    google_maps_link text,
    last_login timestamp(6) without time zone,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret character varying(255),
    two_factor_backup_codes jsonb,
    custom_shop_slug character varying(255),
    oauth_provider character varying(50),
    oauth_provider_id character varying(255),
    email_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false,
    phone_verified_at timestamp without time zone,
    default_category_id integer,
    default_subcategory_id integer,
    facebook_url character varying(255),
    instagram_url character varying(255),
    tiktok_url character varying(255),
    deleted_at timestamp(6) without time zone,
    deletion_requested_at timestamp(6) without time zone,
    CONSTRAINT users_email_format CHECK (((email IS NULL) OR ((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'::text)))
);


ALTER TABLE public.users OWNER TO elw;

--
-- Name: COLUMN users.phone; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.phone IS 'User contact phone number';


--
-- Name: COLUMN users.location_id; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.location_id IS 'User primary location reference';


--
-- Name: COLUMN users.is_verified; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.is_verified IS 'Whether user is verified by an editor';


--
-- Name: COLUMN users.role; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.role IS 'User role: user, editor, super_admin';


--
-- Name: COLUMN users.bio; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.bio IS 'User biography/description (max 500 characters)';


--
-- Name: COLUMN users.avatar; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.avatar IS 'Path to user avatar image';


--
-- Name: COLUMN users.cover_photo; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.cover_photo IS 'Path to user cover photo';


--
-- Name: COLUMN users.is_suspended; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.is_suspended IS 'Whether user is currently suspended/banned';


--
-- Name: COLUMN users.suspended_until; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.suspended_until IS 'Suspension end date (NULL for permanent)';


--
-- Name: COLUMN users.account_type; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.account_type IS 'Account type: individual or business';


--
-- Name: COLUMN users.business_verification_status; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.business_verification_status IS 'Status: NULL, pending, approved, rejected';


--
-- Name: COLUMN users.shop_slug; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.shop_slug IS 'URL slug for business shop profile page';


--
-- Name: COLUMN users.individual_verified; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.individual_verified IS 'Individual seller verification status (blue badge)';


--
-- Name: COLUMN users.verified_seller_name; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.verified_seller_name IS 'Locked seller name displayed on seller page after individual verification. Does not change even if user updates full_name.';


--
-- Name: COLUMN users.individual_verification_expires_at; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.individual_verification_expires_at IS 'Date when individual seller verification expires. After this date, user becomes normal user.';


--
-- Name: COLUMN users.business_verification_expires_at; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.business_verification_expires_at IS 'Date when business verification expires. After this date, user becomes normal user.';


--
-- Name: COLUMN users.latitude; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.latitude IS 'Latitude coordinate for shop location (-90 to 90)';


--
-- Name: COLUMN users.longitude; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.longitude IS 'Longitude coordinate for shop location (-180 to 180)';


--
-- Name: COLUMN users.formatted_address; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.formatted_address IS 'Human-readable address from reverse geocoding';


--
-- Name: COLUMN users.google_maps_link; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.google_maps_link IS 'Google Maps share link for shop location (e.g., https://maps.google.com/?q=...)';


--
-- Name: COLUMN users.deleted_at; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.deleted_at IS 'Soft delete: when user requested account deletion (NULL = not deleted)';


--
-- Name: COLUMN users.deletion_requested_at; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON COLUMN public.users.deletion_requested_at IS 'When deletion was requested (for 30-day recovery window)';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO elw;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_campaigns; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.verification_campaigns (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    discount_percentage integer DEFAULT 0 NOT NULL,
    promo_code character varying(50),
    banner_text character varying(255),
    banner_emoji character varying(10) DEFAULT '🎉'::character varying,
    start_date timestamp(6) without time zone NOT NULL,
    end_date timestamp(6) without time zone NOT NULL,
    is_active boolean DEFAULT true,
    applies_to_types text[],
    min_duration_days integer,
    max_uses integer,
    current_uses integer DEFAULT 0,
    created_by integer,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.verification_campaigns OWNER TO elw;

--
-- Name: TABLE verification_campaigns; Type: COMMENT; Schema: public; Owner: elw
--

COMMENT ON TABLE public.verification_campaigns IS 'Promotional campaigns for verification discounts';


--
-- Name: verification_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.verification_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.verification_campaigns_id_seq OWNER TO elw;

--
-- Name: verification_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.verification_campaigns_id_seq OWNED BY public.verification_campaigns.id;


--
-- Name: verification_pricing; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.verification_pricing (
    id integer NOT NULL,
    verification_type character varying(20) NOT NULL,
    duration_days integer NOT NULL,
    price numeric(10,2) NOT NULL,
    discount_percentage integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.verification_pricing OWNER TO elw;

--
-- Name: verification_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.verification_pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.verification_pricing_id_seq OWNER TO elw;

--
-- Name: verification_pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.verification_pricing_id_seq OWNED BY public.verification_pricing.id;


--
-- Name: ad_images id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_images ALTER COLUMN id SET DEFAULT nextval('public.ad_images_id_seq'::regclass);


--
-- Name: ad_promotions id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_promotions ALTER COLUMN id SET DEFAULT nextval('public.ad_promotions_id_seq'::regclass);


--
-- Name: ad_reports id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_reports ALTER COLUMN id SET DEFAULT nextval('public.ad_reports_id_seq'::regclass);


--
-- Name: ad_review_history id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_review_history ALTER COLUMN id SET DEFAULT nextval('public.ad_review_history_id_seq'::regclass);


--
-- Name: admin_activity_logs id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.admin_activity_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_activity_logs_id_seq'::regclass);


--
-- Name: ads id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads ALTER COLUMN id SET DEFAULT nextval('public.ads_id_seq'::regclass);


--
-- Name: announcement_read_receipts id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.announcement_read_receipts ALTER COLUMN id SET DEFAULT nextval('public.announcement_read_receipts_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: business_subscriptions id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.business_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.business_subscriptions_id_seq'::regclass);


--
-- Name: business_verification_requests id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.business_verification_requests ALTER COLUMN id SET DEFAULT nextval('public.business_verification_requests_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: category_pricing_tiers id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.category_pricing_tiers ALTER COLUMN id SET DEFAULT nextval('public.category_pricing_tiers_id_seq'::regclass);


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: conversation_participants id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.conversation_participants ALTER COLUMN id SET DEFAULT nextval('public.conversation_participants_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: editor_permissions id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.editor_permissions ALTER COLUMN id SET DEFAULT nextval('public.editor_permissions_id_seq'::regclass);


--
-- Name: individual_verification_requests id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.individual_verification_requests ALTER COLUMN id SET DEFAULT nextval('public.individual_verification_requests_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: message_read_receipts id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.message_read_receipts ALTER COLUMN id SET DEFAULT nextval('public.message_read_receipts_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: payment_transactions id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.payment_transactions ALTER COLUMN id SET DEFAULT nextval('public.payment_transactions_id_seq'::regclass);


--
-- Name: phone_otps id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.phone_otps ALTER COLUMN id SET DEFAULT nextval('public.phone_otps_id_seq'::regclass);


--
-- Name: promotion_pricing id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.promotion_pricing ALTER COLUMN id SET DEFAULT nextval('public.promotion_pricing_id_seq'::regclass);


--
-- Name: promotional_campaigns id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.promotional_campaigns ALTER COLUMN id SET DEFAULT nextval('public.promotional_campaigns_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: shop_reports id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.shop_reports ALTER COLUMN id SET DEFAULT nextval('public.shop_reports_id_seq'::regclass);


--
-- Name: site_settings id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.site_settings ALTER COLUMN id SET DEFAULT nextval('public.site_settings_id_seq'::regclass);


--
-- Name: support_messages id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.support_messages ALTER COLUMN id SET DEFAULT nextval('public.support_messages_id_seq'::regclass);


--
-- Name: support_tickets id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.support_tickets ALTER COLUMN id SET DEFAULT nextval('public.support_tickets_id_seq'::regclass);


--
-- Name: typing_indicators id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.typing_indicators ALTER COLUMN id SET DEFAULT nextval('public.typing_indicators_id_seq'::regclass);


--
-- Name: user_favorites id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.user_favorites ALTER COLUMN id SET DEFAULT nextval('public.user_favorites_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_campaigns id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.verification_campaigns ALTER COLUMN id SET DEFAULT nextval('public.verification_campaigns_id_seq'::regclass);


--
-- Name: verification_pricing id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.verification_pricing ALTER COLUMN id SET DEFAULT nextval('public.verification_pricing_id_seq'::regclass);


--
-- Data for Name: _ads_condition_backup; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public._ads_condition_backup (id, condition, updated_at) FROM stdin;
66	new	2025-12-24 17:55:47.772
64	new	2025-12-24 17:55:47.732
60	new	2025-12-24 17:55:47.658
62	new	2025-12-24 17:55:47.707
63	new	2025-12-24 17:55:47.721
36	Brand New	2025-12-20 05:17:00.77
65	new	2025-12-24 17:55:47.76
88	Used	2025-12-26 18:00:24.514
61	new	2025-12-24 17:55:47.674
82	used	2025-12-24 17:55:48.109
34	new	2025-12-17 13:12:13.102
80	used	2025-12-24 17:55:48.058
79	used	2025-12-24 17:55:48.028
83	new	2025-12-24 17:55:48.115
78	used	2025-12-24 17:55:48.013
81	used	2025-12-24 17:55:48.076
68	new	2025-12-24 17:55:47.814
33	new	2025-12-09 20:06:20.052
67	new	2025-12-24 17:55:47.804
31	new	2025-12-09 12:38:11.424
87	new	2025-12-25 23:41:59.37233
86	used	2025-12-25 23:41:59.37233
32	new	2025-12-09 12:40:06.072
89	Brand New	2025-12-26 18:04:57.372
90	Brand New	2025-12-26 18:06:21.125
84	new	2025-12-25 23:41:59.37233
59	new	2025-12-24 17:55:47.626
57	new	2025-12-24 17:55:47.569
54	new	2025-12-24 17:55:47.48
85	new	2025-12-25 23:41:59.37233
55	new	2025-12-24 17:55:47.515
91	Brand New	2026-01-07 17:35:06.71
58	new	2025-12-24 17:55:47.605
53	new	2025-12-24 17:55:47.41
56	new	2025-12-24 17:55:47.534
70	new	2025-12-24 17:55:47.859
76	new	2025-12-24 17:55:47.968
77	new	2025-12-24 17:55:47.98
73	new	2025-12-24 17:55:47.913
69	new	2025-12-24 17:55:47.833
72	new	2025-12-24 17:55:47.883
71	new	2025-12-24 17:55:47.87
74	new	2025-12-24 17:55:47.922
75	new	2025-12-24 17:55:47.936
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9818d359-3a6a-4ad5-85f3-50247715fa70	feea391f6a463ad8ed855a1253b3f76d	2025-12-17 16:41:43.281542+06	20241214000000_add_restored_status_to_ad_reports	\N	\N	2025-12-17 16:41:43.281542+06	1
6831654e-164a-4eb9-8d36-048287bc2069	e26eba6c52a271962d6da8fa54803b2a52732f0befcc522a1cc993d9bac7778e	2025-12-26 17:47:40.579353+06	20241226000000_add_data_integrity_constraints	\N	\N	2025-12-26 17:47:40.523447+06	1
1320cb90-9bc2-46d1-bdd1-03b6e58e6938	dba7f251c332a2dd64722a8f29fca287aa0be968d5b84b1693796580a3e9c354	2025-12-26 17:52:30.063464+06	20241226000001_fix_schema_drift	\N	\N	2025-12-26 17:52:30.023818+06	1
b5cc937b-61b6-46eb-b5ea-5ec3b871fc89	4e7a50094a99e8de62452ea193e3d347a1efe1996ac271eec761fe5f1cce0934	2025-12-26 17:53:07.732595+06	20241226000002_fix_promo_code_index	\N	\N	2025-12-26 17:53:07.716247+06	1
69c61ca8-d371-4a94-bfc6-faa1de280474	7112e0b0001e46e0a31a765cc990d576b043d26b4f176c00eaa76fbdb921e74a	2026-01-10 07:13:32.724288+06	20250110000000_add_missing_check_constraints	\N	\N	2026-01-10 07:13:32.70595+06	1
b9c951d1-0ae5-43c3-8d7b-a92f7e7ef333	563bb7cd1a613ebd4c07b126d0c3cefc2951006d55f0e03de8bdc85bc0ab57ce	2026-01-23 14:39:12.267181+06	20250123000000_standardize_condition_values	\N	\N	2026-01-23 14:39:12.197723+06	1
f95f5a40-ccd6-4201-b090-efef2d4eda79	7035dda5f0e0e4ccbabe7ac15eb03482ee06146a99e6d0ddef4b17ee48fd5821	2026-01-29 18:14:45.626535+06	20250129000000_add_category_display_order	\N	\N	2026-01-29 18:14:45.589623+06	1
\.


--
-- Data for Name: ad_images; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.ad_images (id, ad_id, filename, original_name, file_path, file_size, mime_type, is_primary, created_at) FROM stdin;
36	31	ad-1765280384344-366365501.jpg	iPad.webp	uploads/ads/ad-1765280384344-366365501.jpg	42501	image/jpeg	t	2025-12-09 11:39:44.494
37	31	ad-1765280384375-118774065.jpg	Macbook.jpeg	uploads/ads/ad-1765280384375-118774065.jpg	8304	image/jpeg	f	2025-12-09 11:39:44.494
38	31	ad-1765280384381-243997394.jpg	House for sell.jpg	uploads/ads/ad-1765280384381-243997394.jpg	67164	image/jpeg	f	2025-12-09 11:39:44.494
39	31	ad-1765280384421-534148176.jpg	house-1-540x400.jpg	uploads/ads/ad-1765280384421-534148176.jpg	35277	image/jpeg	f	2025-12-09 11:39:44.494
40	31	ad-1765280737191-208421717.jpg	Motorbike.jpg	uploads/ads/ad-1765280737191-208421717.jpg	65358	image/jpeg	f	2025-12-09 11:45:37.208
41	32	ad-1765284006065-872686876.jpg	Macbook.jpeg	uploads/ads/ad-1765284006065-872686876.jpg	8304	image/jpeg	t	2025-12-09 12:40:06.08
42	33	ad-1765310780024-544545717.jpg	house-9-540x400.jpg	uploads/ads/ad-1765310780024-544545717.jpg	36825	image/jpeg	t	2025-12-09 20:06:20.073
43	34	ad-1765977133065-795941620.jpg	House for sell.jpg	uploads/ads/ad-1765977133065-795941620.jpg	67164	image/jpeg	t	2025-12-17 13:12:13.114
45	36	ad-1766207820756-203219059.jpg	fitted.jpg	/uploads/ads/ad-1766207820756-203219059.jpg	21717	image/jpeg	t	2025-12-20 05:17:00.788
46	53	53_1_1766598947459.webp	Main image.webp	/uploads/ads/53_1_1766598947459.webp	\N	\N	t	2025-12-24 17:55:47.462
47	53	53_2_1766598947467.webp	2nd Image.webp	/uploads/ads/53_2_1766598947467.webp	\N	\N	f	2025-12-24 17:55:47.469
48	53	53_3_1766598947470.webp	3rd Image.webp	/uploads/ads/53_3_1766598947470.webp	\N	\N	f	2025-12-24 17:55:47.471
49	53	53_4_1766598947472.webp	4th Image.webp	/uploads/ads/53_4_1766598947472.webp	\N	\N	f	2025-12-24 17:55:47.474
50	53	53_5_1766598947475.webp	5th Image.webp	/uploads/ads/53_5_1766598947475.webp	\N	\N	f	2025-12-24 17:55:47.477
51	54	54_1_1766598947483.webp	Main Image.webp	/uploads/ads/54_1_1766598947483.webp	\N	\N	t	2025-12-24 17:55:47.485
52	54	54_2_1766598947503.webp	2nd Image.webp	/uploads/ads/54_2_1766598947503.webp	\N	\N	f	2025-12-24 17:55:47.504
53	54	54_3_1766598947505.webp	3rd Image.webp	/uploads/ads/54_3_1766598947505.webp	\N	\N	f	2025-12-24 17:55:47.507
54	54	54_4_1766598947508.webp	4th Image.webp	/uploads/ads/54_4_1766598947508.webp	\N	\N	f	2025-12-24 17:55:47.509
55	54	54_5_1766598947511.webp	5th image.webp	/uploads/ads/54_5_1766598947511.webp	\N	\N	f	2025-12-24 17:55:47.512
56	55	55_1_1766598947517.webp	Main Image.webp	/uploads/ads/55_1_1766598947517.webp	\N	\N	t	2025-12-24 17:55:47.518
57	55	55_2_1766598947520.webp	2nd Image.webp	/uploads/ads/55_2_1766598947520.webp	\N	\N	f	2025-12-24 17:55:47.521
58	55	55_3_1766598947522.webp	3rd image.webp	/uploads/ads/55_3_1766598947522.webp	\N	\N	f	2025-12-24 17:55:47.524
59	55	55_4_1766598947525.webp	4th Image.webp	/uploads/ads/55_4_1766598947525.webp	\N	\N	f	2025-12-24 17:55:47.526
60	55	55_5_1766598947527.webp	5th image.webp	/uploads/ads/55_5_1766598947527.webp	\N	\N	f	2025-12-24 17:55:47.529
61	55	55_6_1766598947530.webp	6th Image.webp	/uploads/ads/55_6_1766598947530.webp	\N	\N	f	2025-12-24 17:55:47.532
62	56	56_1_1766598947554.jpg	Main Image.jpg	/uploads/ads/56_1_1766598947554.jpg	\N	\N	t	2025-12-24 17:55:47.555
63	56	56_2_1766598947556.jpg	2nd Image.jpg	/uploads/ads/56_2_1766598947556.jpg	\N	\N	f	2025-12-24 17:55:47.557
64	56	56_3_1766598947559.jpg	3rd Image.jpg	/uploads/ads/56_3_1766598947559.jpg	\N	\N	f	2025-12-24 17:55:47.56
65	56	56_4_1766598947562.jpg	4th Image.jpg	/uploads/ads/56_4_1766598947562.jpg	\N	\N	f	2025-12-24 17:55:47.563
66	56	56_5_1766598947565.jpg	5th Image.jpg	/uploads/ads/56_5_1766598947565.jpg	\N	\N	f	2025-12-24 17:55:47.566
67	57	57_1_1766598947571.jpg	Main image.jpg	/uploads/ads/57_1_1766598947571.jpg	\N	\N	t	2025-12-24 17:55:47.574
68	57	57_2_1766598947574.jpg	2nd image.jpg	/uploads/ads/57_2_1766598947574.jpg	\N	\N	f	2025-12-24 17:55:47.577
69	57	57_3_1766598947578.jpg	3rd image.jpg	/uploads/ads/57_3_1766598947578.jpg	\N	\N	f	2025-12-24 17:55:47.58
70	57	57_4_1766598947580.jpg	4th Image.jpg	/uploads/ads/57_4_1766598947580.jpg	\N	\N	f	2025-12-24 17:55:47.582
71	57	57_5_1766598947584.jpg	5th Image.jpg	/uploads/ads/57_5_1766598947584.jpg	\N	\N	f	2025-12-24 17:55:47.586
72	58	58_1_1766598947607.jpg	Main Image.jpg	/uploads/ads/58_1_1766598947607.jpg	\N	\N	t	2025-12-24 17:55:47.609
73	58	58_2_1766598947610.jpg	2nd Image.jpg	/uploads/ads/58_2_1766598947610.jpg	\N	\N	f	2025-12-24 17:55:47.611
74	58	58_3_1766598947613.jpg	3rd Image.jpg	/uploads/ads/58_3_1766598947613.jpg	\N	\N	f	2025-12-24 17:55:47.614
75	58	58_4_1766598947616.jpg	4th Image.jpg	/uploads/ads/58_4_1766598947616.jpg	\N	\N	f	2025-12-24 17:55:47.617
76	58	58_5_1766598947619.jpg	5th Image.jpg	/uploads/ads/58_5_1766598947619.jpg	\N	\N	f	2025-12-24 17:55:47.62
77	58	58_6_1766598947622.jpg	6th Image.jpg	/uploads/ads/58_6_1766598947622.jpg	\N	\N	f	2025-12-24 17:55:47.623
78	59	59_1_1766598947627.jpg	Main Image.jpg	/uploads/ads/59_1_1766598947627.jpg	\N	\N	t	2025-12-24 17:55:47.629
79	59	59_2_1766598947630.jpg	2nd Image.jpg	/uploads/ads/59_2_1766598947630.jpg	\N	\N	f	2025-12-24 17:55:47.632
80	59	59_3_1766598947633.jpg	3rd Image.jpg	/uploads/ads/59_3_1766598947633.jpg	\N	\N	f	2025-12-24 17:55:47.634
81	59	59_4_1766598947635.jpg	4th image.jpg	/uploads/ads/59_4_1766598947635.jpg	\N	\N	f	2025-12-24 17:55:47.636
82	59	59_5_1766598947652.jpg	5th image.jpg	/uploads/ads/59_5_1766598947652.jpg	\N	\N	f	2025-12-24 17:55:47.654
83	60	60_1_1766598947660.jpg	Main Image.jpg	/uploads/ads/60_1_1766598947660.jpg	\N	\N	t	2025-12-24 17:55:47.662
84	60	60_2_1766598947663.jpg	2nd Image.jpg	/uploads/ads/60_2_1766598947663.jpg	\N	\N	f	2025-12-24 17:55:47.664
85	60	60_3_1766598947665.jpg	3rd Image.jpg	/uploads/ads/60_3_1766598947665.jpg	\N	\N	f	2025-12-24 17:55:47.667
86	60	60_4_1766598947668.jpg	4th Image.jpg	/uploads/ads/60_4_1766598947668.jpg	\N	\N	f	2025-12-24 17:55:47.669
87	60	60_5_1766598947670.jpg	5th Image.jpg	/uploads/ads/60_5_1766598947670.jpg	\N	\N	f	2025-12-24 17:55:47.671
88	61	61_1_1766598947675.jpg	Main Image.jpg	/uploads/ads/61_1_1766598947675.jpg	\N	\N	t	2025-12-24 17:55:47.677
89	61	61_2_1766598947678.jpg	2nd Image.jpg	/uploads/ads/61_2_1766598947678.jpg	\N	\N	f	2025-12-24 17:55:47.679
90	61	61_3_1766598947681.jpg	3rd Image.jpg	/uploads/ads/61_3_1766598947681.jpg	\N	\N	f	2025-12-24 17:55:47.682
91	61	61_4_1766598947683.jpg	4th Image.jpg	/uploads/ads/61_4_1766598947683.jpg	\N	\N	f	2025-12-24 17:55:47.684
92	61	61_5_1766598947702.jpg	5th Image.jpg	/uploads/ads/61_5_1766598947702.jpg	\N	\N	f	2025-12-24 17:55:47.704
95	62	62_3_1766598947714.jpg	3rd Image.jpg	/uploads/ads/62_3_1766598947714.jpg	\N	\N	f	2025-12-24 17:55:47.716
96	62	62_4_1766598947717.jpg	4th Image.jpg	/uploads/ads/62_4_1766598947717.jpg	\N	\N	f	2025-12-24 17:55:47.718
97	63	63_1_1766598947722.jpg	Main Image.jpg	/uploads/ads/63_1_1766598947722.jpg	\N	\N	t	2025-12-24 17:55:47.724
98	63	63_2_1766598947725.jpg	2nd Image.jpg	/uploads/ads/63_2_1766598947725.jpg	\N	\N	f	2025-12-24 17:55:47.726
99	63	63_3_1766598947727.jpg	3rd Image.jpg	/uploads/ads/63_3_1766598947727.jpg	\N	\N	f	2025-12-24 17:55:47.729
100	64	64_1_1766598947734.webp	Main Image.webp	/uploads/ads/64_1_1766598947734.webp	\N	\N	t	2025-12-24 17:55:47.737
101	64	64_2_1766598947752.webp	2nd Image.webp	/uploads/ads/64_2_1766598947752.webp	\N	\N	f	2025-12-24 17:55:47.755
102	64	64_3_1766598947756.webp	3rd Image.webp	/uploads/ads/64_3_1766598947756.webp	\N	\N	f	2025-12-24 17:55:47.758
103	65	65_1_1766598947762.webp	Main Image.webp	/uploads/ads/65_1_1766598947762.webp	\N	\N	t	2025-12-24 17:55:47.764
104	65	65_2_1766598947764.webp	2nd Image.webp	/uploads/ads/65_2_1766598947764.webp	\N	\N	f	2025-12-24 17:55:47.766
105	65	65_3_1766598947768.webp	3rd Image.webp	/uploads/ads/65_3_1766598947768.webp	\N	\N	f	2025-12-24 17:55:47.769
106	66	66_1_1766598947774.webp	Main Image.webp	/uploads/ads/66_1_1766598947774.webp	\N	\N	t	2025-12-24 17:55:47.776
107	66	66_2_1766598947778.webp	2nd image.webp	/uploads/ads/66_2_1766598947778.webp	\N	\N	f	2025-12-24 17:55:47.78
108	66	66_3_1766598947781.webp	3rd image.webp	/uploads/ads/66_3_1766598947781.webp	\N	\N	f	2025-12-24 17:55:47.783
109	66	66_4_1766598947785.webp	4th Image.webp	/uploads/ads/66_4_1766598947785.webp	\N	\N	f	2025-12-24 17:55:47.788
110	67	67_1_1766598947806.webp	Main Image.webp	/uploads/ads/67_1_1766598947806.webp	\N	\N	t	2025-12-24 17:55:47.809
111	67	67_2_1766598947810.webp	2nd Image.webp	/uploads/ads/67_2_1766598947810.webp	\N	\N	f	2025-12-24 17:55:47.811
112	68	68_1_1766598947818.webp	Main Image.webp	/uploads/ads/68_1_1766598947818.webp	\N	\N	t	2025-12-24 17:55:47.82
113	68	68_2_1766598947821.webp	2nd Image.webp	/uploads/ads/68_2_1766598947821.webp	\N	\N	f	2025-12-24 17:55:47.823
114	68	68_3_1766598947825.webp	3rd Image.webp	/uploads/ads/68_3_1766598947825.webp	\N	\N	f	2025-12-24 17:55:47.827
115	68	68_4_1766598947827.webp	4th Image.webp	/uploads/ads/68_4_1766598947827.webp	\N	\N	f	2025-12-24 17:55:47.83
116	69	69_1_1766598947835.webp	main Image.webp	/uploads/ads/69_1_1766598947835.webp	\N	\N	t	2025-12-24 17:55:47.837
117	69	69_2_1766598947852.webp	2nd Image.webp	/uploads/ads/69_2_1766598947852.webp	\N	\N	f	2025-12-24 17:55:47.854
118	69	69_3_1766598947855.webp	3rd image.webp	/uploads/ads/69_3_1766598947855.webp	\N	\N	f	2025-12-24 17:55:47.857
119	70	70_1_1766598947861.webp	main Image.webp	/uploads/ads/70_1_1766598947861.webp	\N	\N	t	2025-12-24 17:55:47.863
120	70	70_2_1766598947864.webp	2nd Image.webp	/uploads/ads/70_2_1766598947864.webp	\N	\N	f	2025-12-24 17:55:47.866
121	70	70_3_1766598947867.webp	3rd Image.webp	/uploads/ads/70_3_1766598947867.webp	\N	\N	f	2025-12-24 17:55:47.868
122	71	71_1_1766598947872.webp	Main Image.webp	/uploads/ads/71_1_1766598947872.webp	\N	\N	t	2025-12-24 17:55:47.874
123	71	71_2_1766598947876.webp	2nd Image.webp	/uploads/ads/71_2_1766598947876.webp	\N	\N	f	2025-12-24 17:55:47.877
124	71	71_3_1766598947879.webp	3rd Image.webp	/uploads/ads/71_3_1766598947879.webp	\N	\N	f	2025-12-24 17:55:47.88
125	72	72_1_1766598947884.webp	main image.webp	/uploads/ads/72_1_1766598947884.webp	\N	\N	t	2025-12-24 17:55:47.886
126	72	72_2_1766598947903.webp	2nd Image.webp	/uploads/ads/72_2_1766598947903.webp	\N	\N	f	2025-12-24 17:55:47.906
127	72	72_3_1766598947908.webp	3rd Image.webp	/uploads/ads/72_3_1766598947908.webp	\N	\N	f	2025-12-24 17:55:47.91
128	73	73_1_1766598947916.webp	Main Image.webp	/uploads/ads/73_1_1766598947916.webp	\N	\N	t	2025-12-24 17:55:47.918
129	73	73_2_1766598947918.webp	2nd Image.webp	/uploads/ads/73_2_1766598947918.webp	\N	\N	f	2025-12-24 17:55:47.92
130	74	74_1_1766598947924.webp	main Image.webp	/uploads/ads/74_1_1766598947924.webp	\N	\N	t	2025-12-24 17:55:47.926
131	74	74_2_1766598947927.webp	2nd Image.webp	/uploads/ads/74_2_1766598947927.webp	\N	\N	f	2025-12-24 17:55:47.928
132	74	74_3_1766598947930.webp	3rd Image.webp	/uploads/ads/74_3_1766598947930.webp	\N	\N	f	2025-12-24 17:55:47.931
133	74	74_4_1766598947933.webp	4th Image.webp	/uploads/ads/74_4_1766598947933.webp	\N	\N	f	2025-12-24 17:55:47.934
134	75	75_1_1766598947957.webp	Main mage.webp	/uploads/ads/75_1_1766598947957.webp	\N	\N	t	2025-12-24 17:55:47.959
135	75	75_2_1766598947960.webp	2nd Image.webp	/uploads/ads/75_2_1766598947960.webp	\N	\N	f	2025-12-24 17:55:47.961
136	75	75_3_1766598947962.webp	3rd Image.webp	/uploads/ads/75_3_1766598947962.webp	\N	\N	f	2025-12-24 17:55:47.964
137	75	75_4_1766598947965.webp	4th Image.webp	/uploads/ads/75_4_1766598947965.webp	\N	\N	f	2025-12-24 17:55:47.966
138	76	76_1_1766598947970.webp	main Image.webp	/uploads/ads/76_1_1766598947970.webp	\N	\N	t	2025-12-24 17:55:47.971
139	76	76_2_1766598947973.webp	2nd Image.webp	/uploads/ads/76_2_1766598947973.webp	\N	\N	f	2025-12-24 17:55:47.975
140	76	76_3_1766598947975.webp	3rd Image.webp	/uploads/ads/76_3_1766598947975.webp	\N	\N	f	2025-12-24 17:55:47.977
141	77	77_1_1766598947982.webp	main image.webp	/uploads/ads/77_1_1766598947982.webp	\N	\N	t	2025-12-24 17:55:47.984
142	77	77_2_1766598947984.webp	2nd Image.webp	/uploads/ads/77_2_1766598947984.webp	\N	\N	f	2025-12-24 17:55:47.986
143	77	77_3_1766598948002.webp	3rd Image.webp	/uploads/ads/77_3_1766598948002.webp	\N	\N	f	2025-12-24 17:55:48.004
144	77	77_4_1766598948009.webp	4th Image.webp	/uploads/ads/77_4_1766598948009.webp	\N	\N	f	2025-12-24 17:55:48.011
145	78	78_1_1766598948015.jpg	main Image.jpg	/uploads/ads/78_1_1766598948015.jpg	\N	\N	t	2025-12-24 17:55:48.017
146	78	78_2_1766598948018.jpg	2nd Image.jpg	/uploads/ads/78_2_1766598948018.jpg	\N	\N	f	2025-12-24 17:55:48.019
147	78	78_3_1766598948021.jpg	3rd Image.jpg	/uploads/ads/78_3_1766598948021.jpg	\N	\N	f	2025-12-24 17:55:48.022
148	78	78_4_1766598948024.jpg	4th Image.jpg	/uploads/ads/78_4_1766598948024.jpg	\N	\N	f	2025-12-24 17:55:48.026
149	79	79_1_1766598948032.jpg	Main Image.jpg	/uploads/ads/79_1_1766598948032.jpg	\N	\N	t	2025-12-24 17:55:48.034
150	79	79_2_1766598948035.jpg	2nd Image.jpg	/uploads/ads/79_2_1766598948035.jpg	\N	\N	f	2025-12-24 17:55:48.036
151	79	79_3_1766598948052.jpg	3rd mage.jpg	/uploads/ads/79_3_1766598948052.jpg	\N	\N	f	2025-12-24 17:55:48.055
152	80	80_1_1766598948060.jpg	main image.jpg	/uploads/ads/80_1_1766598948060.jpg	\N	\N	t	2025-12-24 17:55:48.062
153	80	80_2_1766598948062.jpg	2nd Image.jpg	/uploads/ads/80_2_1766598948062.jpg	\N	\N	f	2025-12-24 17:55:48.064
154	80	80_3_1766598948066.jpg	3rd Image.jpg	/uploads/ads/80_3_1766598948066.jpg	\N	\N	f	2025-12-24 17:55:48.067
155	80	80_4_1766598948069.jpg	4th Image.jpg	/uploads/ads/80_4_1766598948069.jpg	\N	\N	f	2025-12-24 17:55:48.071
156	80	80_5_1766598948072.jpg	5th Image.jpg	/uploads/ads/80_5_1766598948072.jpg	\N	\N	f	2025-12-24 17:55:48.073
157	81	81_1_1766598948078.jpg	main Image.jpg	/uploads/ads/81_1_1766598948078.jpg	\N	\N	t	2025-12-24 17:55:48.08
158	81	81_2_1766598948081.jpg	2nd Image.jpg	/uploads/ads/81_2_1766598948081.jpg	\N	\N	f	2025-12-24 17:55:48.083
159	81	81_3_1766598948084.jpg	3rd image.jpg	/uploads/ads/81_3_1766598948084.jpg	\N	\N	f	2025-12-24 17:55:48.085
160	81	81_4_1766598948102.jpg	4th Image.jpg	/uploads/ads/81_4_1766598948102.jpg	\N	\N	f	2025-12-24 17:55:48.104
161	81	81_5_1766598948105.jpg	5th Image.jpg	/uploads/ads/81_5_1766598948105.jpg	\N	\N	f	2025-12-24 17:55:48.107
162	82	82_1_1766598948111.jpg	main Image.jpg	/uploads/ads/82_1_1766598948111.jpg	\N	\N	t	2025-12-24 17:55:48.112
163	83	83_1_1766598948117.jpg	Main Image.jpg	/uploads/ads/83_1_1766598948117.jpg	\N	\N	t	2025-12-24 17:55:48.119
164	83	83_2_1766598948121.jpg	2nd Image.jpg	/uploads/ads/83_2_1766598948121.jpg	\N	\N	f	2025-12-24 17:55:48.122
165	83	83_3_1766598948124.jpg	3rd Image.jpg	/uploads/ads/83_3_1766598948124.jpg	\N	\N	f	2025-12-24 17:55:48.126
166	83	83_4_1766598948127.jpg	4th Image.jpg	/uploads/ads/83_4_1766598948127.jpg	\N	\N	f	2025-12-24 17:55:48.13
94	62	62_2_1766598947711.jpg	2nd Image.jpg	/uploads/ads/62_2_1766598947711.jpg	\N	\N	t	2025-12-24 17:55:47.713
167	84	house_1_1766684492.jpg	house_exterior.jpg	/uploads/ads/house_1_1766684492.jpg	159437	image/jpeg	t	2025-12-25 23:42:07.946517
168	85	house_2_1766684492.jpg	bungalow_front.jpg	/uploads/ads/house_2_1766684492.jpg	63070	image/jpeg	t	2025-12-25 23:42:07.946517
169	86	house_3_1766684492.webp	house_view.webp	/uploads/ads/house_3_1766684492.webp	34096	image/webp	t	2025-12-25 23:42:07.946517
170	87	house_4_1766684492.jpeg	villa_exterior.jpeg	/uploads/ads/house_4_1766684492.jpeg	10423	image/jpeg	t	2025-12-25 23:42:07.946517
171	88	ad-1766769416717-651800742.jpeg	car.jpeg	/uploads/ads/ad-1766769416717-651800742.jpeg	4911	image/jpeg	t	2025-12-26 17:16:56.783
172	88	ad-1766769416717-533722093.webp	byd2.webp	/uploads/ads/ad-1766769416717-533722093.webp	130904	image/webp	f	2025-12-26 17:16:56.783
173	89	ad-1766772297344-755905339.jpeg	byd.jpeg	/uploads/ads/ad-1766772297344-755905339.jpeg	8458	image/jpeg	t	2025-12-26 18:04:57.402
174	90	ad-1766772381101-265117936.jpeg	pants man.jpeg	/uploads/ads/ad-1766772381101-265117936.jpeg	62312	image/jpeg	t	2025-12-26 18:06:21.136
175	91	ad-1767807306671-748951705.png	biz-1764944043147-93132572.png	/uploads/ads/ad-1767807306671-748951705.png	681575	image/png	t	2026-01-07 17:35:06.766
176	92	ad-1769358582056-832635105.jpg	1672.jpg	/uploads/ads/ad-1769358582056-832635105.jpg	92625	image/jpeg	t	2026-01-25 16:29:42.195
177	93	ad-1769359080141-761333472.jpg	1654.jpg	/uploads/ads/ad-1769359080141-761333472.jpg	98100	image/jpeg	t	2026-01-25 16:38:00.684
178	94	ad-1769531696919-861799963.png	1872.png	/uploads/ads/ad-1769531696919-861799963.png	32832	image/png	t	2026-01-27 16:34:57.019
\.


--
-- Data for Name: ad_promotions; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.ad_promotions (id, ad_id, user_id, promotion_type, duration_days, price_paid, account_type, payment_reference, payment_method, starts_at, expires_at, is_active, created_at) FROM stdin;
32	34	59	featured	7	112.00	individual_verified	50	online	2025-12-17 16:16:11.75	2025-12-24 16:16:11.737	f	2025-12-17 16:16:11.751
33	33	59	urgent	7	640.00	individual_verified	51	online	2025-12-17 16:17:26.787	2025-12-24 16:17:26.777	f	2025-12-17 16:17:26.788
34	36	62	featured	7	960.00	business	58	online	2025-12-20 05:38:01.816	2025-12-27 05:38:01.805	f	2025-12-20 05:38:01.817
35	54	62	sticky	3	70.00	business	62	online	2025-12-25 23:44:33.059	2025-12-28 23:44:33.022	f	2025-12-25 23:44:33.063
36	57	62	urgent	3	300.00	business	63	online	2025-12-26 01:02:19.962	2025-12-29 01:02:19.877	f	2025-12-26 01:02:19.967
37	55	62	featured	3	600.00	business	64	online	2025-12-26 01:04:06.227	2025-12-29 01:04:06.22	f	2025-12-26 01:04:06.228
40	83	60	featured	3	60.00	individual_verified	68	online	2025-12-26 17:57:03.826	2025-12-29 17:57:03.819	f	2025-12-26 17:57:03.828
38	78	47	sticky	7	67.00	individual_verified	66	online	2025-12-26 17:50:59.367	2026-01-02 17:50:59.343	f	2025-12-26 17:50:59.37
39	81	47	urgent	7	84.00	individual_verified	67	online	2025-12-26 17:54:02.655	2026-01-02 17:54:02.631	f	2025-12-26 17:54:02.656
43	58	62	featured	7	200.00	business	72	online	2026-01-10 22:16:50.507	2026-01-17 22:16:50.498	f	2026-01-10 22:16:50.508
41	64	62	featured	15	350.00	business	70	online	2026-01-10 22:12:08.941	2026-01-25 22:12:08.928	f	2026-01-10 22:12:08.943
42	57	62	featured	15	350.00	business	71	online	2026-01-10 22:15:28.78	2026-01-25 22:15:28.776	f	2026-01-10 22:15:28.781
\.


--
-- Data for Name: ad_reports; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.ad_reports (id, ad_id, reporter_id, reason, details, status, admin_notes, created_at, updated_at) FROM stdin;
7	64	46	inappropriate	Its nude picture	dismissed	We didnt find the report is true 	2025-12-26 17:31:49.992	2025-12-26 17:32:50.64
8	72	46	misleading	He puted laptop price 100 npr	restored	Ad was restored by editor/admin	2025-12-26 17:36:07.712	2025-12-26 17:36:59.854
\.


--
-- Data for Name: ad_review_history; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.ad_review_history (id, ad_id, action, actor_id, actor_type, reason, notes, created_at) FROM stdin;
4	53	approved	64	editor	\N	Ad approved and published	2025-12-24 18:52:49.401
5	54	approved	64	editor	\N	Ad approved and published	2025-12-24 18:52:59.038
6	55	approved	64	editor	\N	Ad approved and published	2025-12-24 18:53:03.175
7	56	approved	64	editor	\N	Ad approved and published	2025-12-24 18:53:08.846
8	57	approved	64	editor	\N	Ad approved and published	2025-12-24 18:53:12.383
9	74	approved	64	editor	\N	Ad approved and published	2025-12-24 18:53:21.63
10	78	approved	64	editor	\N	Ad approved and published	2025-12-24 18:53:26.272
11	73	approved	64	editor	\N	Ad approved and published	2025-12-24 18:53:38.629
12	58	approved	64	editor	\N	Ad approved and published	2025-12-24 18:54:27.805
13	59	approved	64	editor	\N	Ad approved and published	2025-12-24 18:54:31.202
14	60	approved	64	editor	\N	Ad approved and published	2025-12-24 18:55:24.206
15	75	approved	64	editor	\N	Ad approved and published	2025-12-24 19:11:34.114
16	62	approved	64	editor	\N	Ad approved and published	2025-12-24 19:12:37.156
17	81	approved	64	editor	\N	Ad approved and published	2025-12-24 19:14:08.889
18	82	approved	64	editor	\N	Ad approved and published	2025-12-24 19:14:13.477
19	65	approved	64	editor	\N	Ad approved and published	2025-12-24 19:14:25.732
20	67	approved	64	editor	\N	Ad approved and published	2025-12-24 19:14:29.303
21	63	approved	64	editor	\N	Ad approved and published	2025-12-24 19:14:34.204
22	61	approved	64	editor	\N	Ad approved and published	2025-12-24 19:25:24.581
23	68	approved	64	editor	\N	Ad approved and published	2025-12-24 19:26:05.768
24	70	approved	64	editor	\N	Ad approved and published	2025-12-24 19:26:10.45
25	79	approved	64	editor	\N	Ad approved and published	2025-12-24 19:26:19.464
26	71	approved	64	editor	\N	Ad approved and published	2025-12-24 19:26:26.701
27	76	approved	64	editor	\N	Ad approved and published	2025-12-24 19:26:31.802
28	83	approved	64	editor	\N	Ad approved and published	2025-12-24 19:26:40.052
29	77	approved	64	editor	\N	Ad approved and published	2025-12-24 19:26:46.579
30	66	approved	64	editor	\N	Ad approved and published	2025-12-24 19:26:54.152
31	80	approved	64	editor	\N	Ad approved and published	2025-12-24 19:27:02.607
32	72	approved	64	editor	\N	Ad approved and published	2025-12-24 19:27:10.269
33	69	approved	64	editor	\N	Ad approved and published	2025-12-24 19:27:14.221
34	64	approved	64	editor	\N	Ad approved and published	2025-12-24 19:27:25.053
35	32	suspended	64	editor	Not in same category 	Suspended indefinitely	2025-12-24 20:08:03.714
36	88	rejected	64	editor	You uploaded wrong picture	\N	2025-12-26 17:19:50.273
37	87	suspended	64	editor	It was approved by mistake 	Suspended indefinitely	2025-12-26 17:28:26.613
38	72	deleted	64	editor	Deleted due to report: misleading	Ad deleted by editor/admin	2025-12-26 17:36:33.381
39	72	restored	64	editor	\N	Ad restored from deletion	2025-12-26 17:36:59.852
40	88	approved	64	editor	\N	Ad approved and published	2025-12-26 18:01:38.426
41	89	approved	64	editor	\N	Ad approved and published	2025-12-26 18:05:14.421
42	90	approved	64	editor	\N	Ad approved and published	2025-12-26 18:06:33.994
\.


--
-- Data for Name: admin_activity_logs; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.admin_activity_logs (id, admin_id, action_type, target_type, target_id, details, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: ads; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.ads (id, title, description, price, category_id, location_id, seller_name, seller_phone, condition, status, view_count, is_featured, created_at, updated_at, user_id, status_reason, reviewed_by, reviewed_at, latitude, longitude, deleted_at, deleted_by, deletion_reason, is_bumped, bump_expires_at, is_sticky, sticky_expires_at, is_urgent, urgent_expires_at, total_promotions, last_promoted_at, slug, featured_until, urgent_until, sticky_until, promoted_at, custom_fields, suspended_until) FROM stdin;
64	Abstract Print Cotton Blouse	Artistic abstract print cotton blouse for unique style. Breathable cotton fabric with vibrant print.	2900.00	805	71177	Dija Fashion Shop	9706657812	Brand New	approved	30	f	2025-12-24 17:55:47.732	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 19:27:25.048	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	abstract-print-cotton-blouse-for-sale-in-baluwatar-1	\N	\N	\N	2026-01-10 22:12:08.949	{}	\N
92	iphone 	Gfffff	555.00	1304	71184	\N	\N	Brand New	pending	8	f	2026-01-25 16:29:42.135	2026-01-25 16:29:42.135	62	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	iphone-for-sale-in-bouddha-1	\N	\N	\N	\N	null	\N
60	High Waist Denim Shorts	Classic high waist denim shorts for summer style. Flattering high-rise fit with quality denim fabric.	3200.00	805	71173	Dija Fashion Shop	9706657812	Brand New	approved	1	f	2025-12-24 17:55:47.658	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 18:55:24.2	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	high-waist-denim-shorts-for-sale-in-hotel-area-1	\N	\N	\N	\N	{}	\N
66	V-Neck Pure Cotton T-shirt	Essential V-neck pure cotton T-shirt for everyday comfort. Soft breathable cotton fabric.	1800.00	805	71179	Dija Fashion Shop	9706657812	Brand New	approved	14	f	2025-12-24 17:55:47.772	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 19:26:54.148	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	v-neck-pure-cotton-t-shirt-for-sale-in-chundevi-1	\N	\N	\N	\N	{}	\N
62	Kate Crystal Embellished Pointed Toe Pump Shoes	Luxurious crystal embellished pointed toe pump shoes. Elegant design with sparkling crystal details.	9500.00	807	71175	Dija Fashion Shop	9706657812	Brand New	approved	2	f	2025-12-24 17:55:47.707	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 19:12:37.149	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	kate-crystal-embellished-pointed-toe-pump-shoes-for-sale-in-shree-gopal-marg-1	\N	\N	\N	\N	{}	\N
63	Crystal Embellished Platform Slide Sandal	Glamorous crystal embellished platform slide sandals. Eye-catching crystals on comfortable platform base.	7500.00	807	71176	Dija Fashion Shop	9706657812	Brand New	approved	2	f	2025-12-24 17:55:47.721	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 19:14:34.198	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	crystal-embellished-platform-slide-sandal-for-sale-in-balaju-1	\N	\N	\N	\N	{}	\N
36	Bag	Bag Bag Bag Bag Bag Bag Bag Bag 	50000.00	804	71228	\N	\N	Brand New	approved	14	f	2025-12-20 05:17:00.77	2026-01-23 14:39:12.200306	62	\N	\N	2025-12-20 05:26:22.451	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	bag-for-sale-in-asan-1	\N	\N	\N	2025-12-20 05:38:01.822	{"color": "Red"}	\N
65	Cashmere Tank and Bag Set	Luxurious cashmere tank top with matching bag. Premium quality cashmere for ultimate comfort.	11000.00	805	71178	Dija Fashion Shop	9706657812	Brand New	approved	2	f	2025-12-24 17:55:47.76	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 19:14:25.719	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	cashmere-tank-and-bag-set-for-sale-in-chappal-karkhana-1	\N	\N	\N	\N	{}	\N
31	iPhone 17 pro max pro 33	iPhone 17 pro max iPhone 17 pro max iPhone 17 pro max gg	22222.00	101	71230	Akash Subedi	9823241785	Brand New	deleted	20	f	2025-12-09 11:39:44.44	2026-01-23 14:39:12.200306	47	\N	\N	\N	\N	\N	2025-12-09 12:38:50.715	\N	\N	f	\N	f	\N	f	\N	0	\N	iphone-17-pro-max-pro-33	\N	\N	\N	\N	{"ram": "3GB", "brand": "555", "model": "dssss", "storage": "64GB", "warranty": "Under Warranty (6-12 months)", "isNegotiable": true, "batteryHealth": "90-94%"}	\N
87	Modern 5BHK Villa with Swimming Pool - Premium Property	Exquisite 5-bedroom villa with world-class amenities in an exclusive neighborhood.\n\nLuxury Features:\n• 5 en-suite bedrooms with premium fittings\n• Private swimming pool (heated)\n• Home theater room\n• Wine cellar\n• Smart home automation system\n• Imported Italian marble flooring\n• Central AC throughout\n• Backup generator\n\nLand area: 15 aana\nBuilt-up area: 6500 sq ft\nFloors: 3 storey + basement\n\nThis is a rare opportunity to own a piece of luxury. Virtual tour available upon request.	95000000.00	505	301	Amit Sharma	9844463084	Brand New	suspended	0	f	2025-12-25 23:41:59.37233	2026-01-23 14:39:12.200306	60	It was approved by mistake 	64	2025-12-26 17:28:26.596	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	modern-5bhk-villa-swimming-pool-premium-9258	\N	\N	\N	\N	{"floors": "3 storey + basement", "bedrooms": 5, "features": ["swimming_pool", "home_theater", "wine_cellar", "smart_home", "central_ac"], "bathrooms": 6, "land_area": "15 aana", "built_up_area": "6500 sq ft", "property_type": "villa"}	\N
32	Macbook pro 235	Macbook pro 235Macbook pro 235Macbook pro 235Macbook pro 235 	4000.00	201	71230	Akash Subedi	9823241785	Brand New	suspended	24	f	2025-12-09 12:40:06.072	2026-01-23 14:39:12.200306	47	Not in same category 	64	2025-12-24 20:08:03.685	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	macbook-pro-235	\N	\N	\N	\N	{"ram": "32GB", "brand": "Apple", "model": "Pro 2025", "graphics": "Nvdia", "warranty": "Under Warranty (1+ years)", "processor": "i9 ", "isNegotiable": true, "batteryHealth": "100%", "screenResolution": "Full HD (1920x1080)"}	\N
89	Parash test ad	Parash test adParash test adParash test ad	4444.00	301	40301	\N	\N	Brand New	approved	54	f	2025-12-26 18:04:57.372	2026-01-23 14:39:12.200306	47	\N	64	2025-12-26 18:05:14.41	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	parash-test-ad-for-sale-in-pokhara-metropolitan-city-1	\N	\N	\N	\N	{"year": "1980", "brand": "wrwr", "color": "", "model": "", "seats": "", "owners": "", "mileage": "", "bodyType": "", "fuelType": "Diesel", "transmission": "Semi-Automatic", "engineCapacity": "", "registrationYear": "", "registrationLocation": ""}	\N
90	Dija test ad	Dija test adDija test adDija test ad	4444.00	801	71228	\N	\N	Brand New	approved	10	f	2025-12-26 18:06:21.125	2026-01-23 14:39:12.200306	62	\N	64	2025-12-26 18:06:33.98	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	dija-test-ad-for-sale-in-asan-1	\N	\N	\N	\N	{"size": "XXL", "color": "", "fitType": "", "sleeveType": "", "clothingType": "Pants"}	\N
93	iphone 17 	Hjkkkl	380000.00	101	71247	\N	\N	Brand New	pending	17	f	2026-01-25 16:38:00.647	2026-01-25 16:38:00.647	62	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	iphone-17-for-sale-in-balkhu-1	\N	\N	\N	\N	{"ram": "16GB", "brand": "Apple ", "model": "15", "storage": "256GB", "warranty": "Under Warranty (< 6 months)"}	\N
61	Octavia V-Waist Sweater Skirt	Elegant V-waist sweater skirt for cooler days. Soft knit fabric with flattering V-waist design.	4200.00	805	71174	Dija Fashion Shop	9706657812	Brand New	approved	10	f	2025-12-24 17:55:47.674	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 19:25:24.569	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	octavia-v-waist-sweater-skirt-for-sale-in-maharajgunj-1	\N	\N	\N	\N	{}	\N
34	House near Thokha 5 	House near Thokha 5 House near Thokha 5 House near Thokha 5 	8000.00	505	71228	Ananda Shahi	9843963410	Brand New	approved	14	f	2025-12-17 13:12:13.102	2026-01-23 14:39:12.200306	59	\N	\N	2025-12-17 13:13:23.444	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	house-near-thokha-5-for-sale-in-asan-1	\N	\N	\N	2025-12-17 16:16:11.756	{"facing": "East", "parking": "3", "areaUnit": "ropani", "bedrooms": "1", "amenities": ["Lift/Elevator", "Power Backup", "Water Supply", "Security/Gated", "Gym", "Swimming Pool", "Garden", "Playground", "Club House", "Visitor Parking"], "bathrooms": "2", "totalArea": "2000", "furnishing": "Semi Furnished", "propertyAge": "1-5 years", "isNegotiable": false}	\N
83	Beautiful Bungalow For Sale	Spacious bungalow in prime location. 4 bedrooms, 3 bathrooms, large garden. Modern kitchen and living areas. Peaceful neighborhood. Ready to move in.	35000000.00	505	71182	Amit Sharma	9844463084	Brand New	approved	4	f	2025-12-24 17:55:48.115	2026-01-23 14:39:12.200306	60	\N	64	2025-12-24 19:26:40.045	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	beautiful-bungalow-for-sale-for-sale-in-kapan-1	\N	\N	\N	2025-12-26 17:57:03.83	{}	\N
68	Apple iPhone 17 256GB - Sage	Brand new Apple iPhone 17 in beautiful Sage color. 256GB storage. Latest A18 chip with incredible performance. Advanced camera system.	185000.00	101	71171	Alina Gurung	9803093361	Brand New	approved	1	f	2025-12-24 17:55:47.814	2026-01-23 14:39:12.200306	63	\N	64	2025-12-24 19:26:05.761	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	apple-iphone-17-256gb-sage-for-sale-in-lazimpat-1	\N	\N	\N	\N	{}	\N
94	iphone 12	Hhjj	30000.00	101	71176	\N	\N	Used	pending	0	f	2026-01-27 16:34:56.97	2026-01-27 16:34:56.97	62	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	iphone-12-for-sale-in-balaju-1	\N	\N	\N	\N	{"ram": "16GB", "brand": "apple", "model": "12", "storage": "256GB", "warranty": "Under Warranty (1+ years)"}	\N
59	Excursion Hooded Long Sleeve Dress	Versatile hooded long sleeve dress for active lifestyle. Comfortable fabric with practical hood.	5500.00	805	71172	Dija Fashion Shop	9706657812	Brand New	approved	2	f	2025-12-24 17:55:47.626	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 18:54:31.189	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	excursion-hooded-long-sleeve-dress-for-sale-in-thamel-marg-1	\N	\N	\N	\N	{}	\N
57	Foil Spot Mini Dress	Trendy foil spot mini dress that shines at any party. Eye-catching metallic spots on quality fabric.	6500.00	805	71170	Dija Fashion Shop	9706657812	Brand New	approved	17	f	2025-12-24 17:55:47.569	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 18:53:12.375	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	foil-spot-mini-dress-for-sale-in-sankha-kriti-maha-bihar-1	\N	\N	\N	2026-01-10 22:15:28.783	{}	\N
67	Washed Denim Men Shirt	Classic washed denim shirt for men. Soft washed fabric with vintage appeal.	3800.00	702	71180	Dija Fashion Shop	9706657812	Brand New	approved	4	f	2025-12-24 17:55:47.804	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 19:14:29.293	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	washed-denim-men-shirt-for-sale-in-dhumbarahi-1	\N	\N	\N	\N	{}	\N
33	Car	CarCarCarCarCarCar	33333.00	1410	71230	Ananda Shahi	9843963410	Brand New	approved	21	f	2025-12-09 20:06:20.052	2026-01-23 14:39:12.200306	59	\N	\N	2025-12-09 20:06:20.052	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	car	\N	\N	\N	2025-12-17 16:17:26.792	{"isNegotiable": true, "massageLocation": "At Home"}	\N
85	Luxurious 4BHK Bungalow with Garden - Urgent Sale	Premium 4-bedroom bungalow with beautiful garden in a quiet residential area.\n\nHighlights:\n• 4 master bedrooms with walk-in closets\n• Separate servant quarter\n• Landscaped garden with sitting area\n• Modern gymnasium room\n• CCTV security system installed\n• Solar water heating system\n\nLand area: 8 aana\nBuilt-up area: 4000 sq ft\nFloors: 2.5 storey\nAge: 5 years\n\nPrice slightly negotiable for serious buyers. All documents clear and ready for transfer.	45000000.00	505	301	Amit Sharma	9844463084	Brand New	approved	124	f	2025-12-24 23:41:59.37233	2026-01-23 14:39:12.200306	60	\N	\N	2025-12-24 23:41:59.37233	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	luxurious-4bhk-bungalow-garden-urgent-sale-9326	\N	\N	\N	\N	{"age": "5 years", "floors": "2.5 storey", "bedrooms": 4, "features": ["garden", "gym", "cctv", "solar"], "bathrooms": 4, "land_area": "8 aana", "built_up_area": "4000 sq ft", "property_type": "bungalow"}	\N
84	Beautiful 3BHK House for Sale in Kathmandu - Prime Location	Stunning 3-bedroom house in the heart of Kathmandu. Features include:\n• 3 spacious bedrooms with attached bathrooms\n• Modern modular kitchen\n• Large living room with natural lighting\n• Parking space for 2 vehicles\n• 24/7 water supply\n• Close to schools, hospitals, and markets\n\nLand area: 4 aana\nBuilt-up area: 2500 sq ft\nFacing: South\nRoad access: 20 ft\n\nThis property is ideal for families looking for a comfortable living space in a peaceful neighborhood. Contact for site visit.	25000000.00	505	301	Amit Sharma	9844463084	Brand New	approved	5	f	2025-12-23 23:41:59.37233	2026-01-23 14:39:12.200306	60	\N	\N	2025-12-23 23:41:59.37233	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	beautiful-3bhk-house-kathmandu-prime-location-1690	\N	\N	\N	\N	{"facing": "South", "parking": "2 vehicles", "bedrooms": 3, "bathrooms": 3, "land_area": "4 aana", "road_access": "20 ft", "built_up_area": "2500 sq ft", "property_type": "house"}	\N
54	Ramie Shirt with Pockets	Comfortable ramie shirt featuring convenient front pockets. Breathable natural fabric perfect for warm weather. Relaxed fit with button-down front.	3500.00	805	71167	Dija Fashion Shop	9706657812	Brand New	approved	26	f	2025-12-24 17:55:47.48	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 18:52:59.03	\N	\N	\N	\N	\N	t	2025-12-28 23:44:33.022	f	\N	f	\N	0	\N	ramie-shirt-with-pockets-for-sale-in-gairidhara-1	\N	\N	\N	2025-12-25 23:44:33.067	{}	\N
55	Shoulder Straps Fitted Top	Stylish fitted top with elegant shoulder straps. Perfect for parties and evening events. Comfortable stretch fabric.	2800.00	805	71168	Dija Fashion Shop	9706657812	Brand New	approved	4	f	2025-12-24 17:55:47.515	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 18:53:03.142	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	shoulder-straps-fitted-top-for-sale-in-teku-1	\N	\N	\N	2025-12-26 01:04:06.229	{}	\N
91	iphone 15 test	iphone testing 2025 ...rrr	500000.00	101	71211	\N	\N	Brand New	pending	0	f	2026-01-07 17:35:06.71	2026-01-23 14:39:12.200306	63	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	iphone-15-test-for-sale-in-bagbazaar-extension-1	\N	\N	\N	\N	{"ram": "6GB", "brand": "Apple", "model": "", "storage": "32GB", "warranty": "", "batteryHealth": ""}	\N
58	Sequin Textured Knit A-Line Gown	Stunning sequin textured knit A-line gown for glamorous events. Beautiful sparkle effect with comfortable knit fabric.	15000.00	805	71171	Dija Fashion Shop	9706657812	Brand New	approved	10	f	2025-12-24 17:55:47.605	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 18:54:27.788	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	sequin-textured-knit-a-line-gown-for-sale-in-lazimpat-1	\N	\N	\N	2026-01-10 22:16:50.511	{}	\N
70	Motorola Moto G Play 2024 64GB	Affordable Motorola Moto G Play 2024. 64GB storage, great battery life. Perfect for everyday use.	18000.00	101	71173	Alina Gurung	9803093361	Brand New	approved	0	f	2025-12-24 17:55:47.859	2026-01-23 14:39:12.200306	63	\N	64	2025-12-24 19:26:10.426	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	motorola-moto-g-play-2024-64gb-for-sale-in-hotel-area-1	\N	\N	\N	\N	{}	\N
76	Samsung Galaxy Book5 360 15.6" AMOLED	Samsung Galaxy Book5 360 Copilot+ PC. 15.6" FHD AMOLED Touch, Intel Core Ultra 7, 16GB, 512GB SSD.	165000.00	201	71173	Ananda Shahi	9843963410	Brand New	approved	0	f	2025-12-24 17:55:47.968	2026-01-23 14:39:12.200306	59	\N	64	2025-12-24 19:26:31.787	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	samsung-galaxy-book5-360-15-6-amoled-for-sale-in-hotel-area-1	\N	\N	\N	\N	{}	\N
77	Samsung Galaxy Chromebook Go 14"	Samsung Galaxy Chromebook Go 14" LED with Intel Celeron. Perfect for students and basic tasks.	35000.00	201	71174	Ananda Shahi	9843963410	Brand New	approved	0	f	2025-12-24 17:55:47.98	2026-01-23 14:39:12.200306	59	\N	64	2025-12-24 19:26:46.553	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	samsung-galaxy-chromebook-go-14-for-sale-in-maharajgunj-1	\N	\N	\N	\N	{}	\N
73	Apple MacBook Air 13" M4 Chip 16GB 512GB	Apple MacBook Air 13-inch with M4 chip. Built for Apple Intelligence. 16GB Memory, 512GB SSD.	185000.00	201	71170	Ananda Shahi	9843963410	Brand New	approved	1	f	2025-12-24 17:55:47.913	2026-01-23 14:39:12.200306	59	\N	64	2025-12-24 18:53:38.608	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	apple-macbook-air-13-m4-chip-16gb-512gb-for-sale-in-sankha-kriti-maha-bihar-1	\N	\N	\N	\N	{}	\N
53	Double-Breasted Trench Coat	Elegant double-breasted trench coat perfect for autumn and spring. Features classic styling with modern details. High-quality fabric with water-resistant finish.	12500.00	810	71166	Dija Fashion Shop	9706657812	Brand New	approved	2	f	2025-12-24 17:55:47.41	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 18:52:49.343	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	double-breasted-trench-coat-for-sale-in-naxal-1	\N	\N	\N	\N	{}	\N
69	Google Pixel 10 Pro 128GB	Google Pixel 10 Pro with 128GB storage. Best-in-class camera with AI features. Pure Android experience.	125000.00	101	71172	Alina Gurung	9803093361	Brand New	approved	1	f	2025-12-24 17:55:47.833	2026-01-23 14:39:12.200306	63	\N	64	2025-12-24 19:27:14.213	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	google-pixel-10-pro-128gb-for-sale-in-thamel-marg-1	\N	\N	\N	\N	{}	\N
71	Samsung Galaxy S25+ 256GB	Samsung Galaxy S25+ flagship phone. 256GB storage, stunning display, powerful processor.	145000.00	101	71174	Alina Gurung	9803093361	Brand New	approved	3	f	2025-12-24 17:55:47.87	2026-01-23 14:39:12.200306	63	\N	64	2025-12-24 19:26:26.681	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	samsung-galaxy-s25-256gb-for-sale-in-maharajgunj-1	\N	\N	\N	\N	{}	\N
74	Dell Premium 16" 4K RTX 5060 Laptop	Dell Premium 16" 4K Touchscreen with Intel Core Ultra 9, 32GB RAM, RTX 5060, 1TB SSD. Ultimate performance.	285000.00	201	71171	Ananda Shahi	9843963410	Brand New	approved	0	f	2025-12-24 17:55:47.922	2026-01-23 14:39:12.200306	59	\N	64	2025-12-24 18:53:21.622	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	dell-premium-16-4k-rtx-5060-laptop-for-sale-in-lazimpat-1	\N	\N	\N	\N	{}	\N
75	Lenovo IdeaPad Slim 3 15.6" Touchscreen	Lenovo IdeaPad Slim 3 with AMD Ryzen 7, 16GB RAM, 512GB SSD. Full HD Touchscreen.	75000.00	201	71172	Ananda Shahi	9843963410	Brand New	approved	1	f	2025-12-24 17:55:47.936	2026-01-23 14:39:12.200306	59	\N	64	2025-12-24 19:11:33.791	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	lenovo-ideapad-slim-3-15-6-touchscreen-for-sale-in-thamel-marg-1	\N	\N	\N	\N	{}	\N
82	2025 Chevrolet New Model	Brand new 2025 Chevrolet. Latest model with modern features. Factory warranty included.	6500000.00	301	71177	Akash Subedi	9823241785	Used	approved	1	f	2025-12-24 17:55:48.109	2026-01-23 14:39:12.200306	47	\N	64	2025-12-24 19:14:13.379	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	2025-chevrolet-new-model-for-sale-in-baluwatar-1	\N	\N	\N	\N	{}	\N
80	2021 Mercedes-Benz S-Class S 580	2021 Mercedes-Benz S-Class S 580. Ultimate luxury sedan. Fully loaded with premium features.	18500000.00	301	71175	Akash Subedi	9823241785	Used	approved	0	f	2025-12-24 17:55:48.058	2026-01-23 14:39:12.200306	47	\N	64	2025-12-24 19:27:02.603	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	2021-mercedes-benz-s-class-s-580-for-sale-in-shree-gopal-marg-1	\N	\N	\N	\N	{}	\N
79	2015 Audi Q5 3.0T quattro Premium Plus	2015 Audi Q5 3.0T quattro Premium Plus. Luxury SUV with powerful engine. All-wheel drive.	4500000.00	301	71174	Akash Subedi	9823241785	Used	approved	4	f	2025-12-24 17:55:48.028	2026-01-23 14:39:12.200306	47	\N	64	2025-12-24 19:26:19.455	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	2015-audi-q5-3-0t-quattro-premium-plus-for-sale-in-maharajgunj-1	\N	\N	\N	\N	{}	\N
78	2013 Kia Optima EX	2013 Kia Optima EX in excellent condition. Well-maintained, single owner. Fuel efficient and comfortable.	2850000.00	301	71173	Akash Subedi	9823241785	Used	approved	5	f	2025-12-24 17:55:48.013	2026-01-23 14:39:12.200306	47	\N	64	2025-12-24 18:53:26.248	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	2013-kia-optima-ex-for-sale-in-hotel-area-1	\N	\N	\N	2025-12-26 17:50:59.375	{}	\N
81	2023 Land Rover Defender	2023 Land Rover Defender. Iconic off-road capability with modern luxury. Adventure ready.	15500000.00	301	71176	Akash Subedi	9823241785	Used	approved	3	f	2025-12-24 17:55:48.076	2026-01-23 14:39:12.200306	47	\N	64	2025-12-24 19:14:08.878	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	2023-land-rover-defender-for-sale-in-balaju-1	\N	\N	\N	2025-12-26 17:54:02.67	{}	\N
86	Affordable 2BHK House in Kathmandu Valley - Best Deal	Perfect starter home for small families! Well-maintained 2-bedroom house at an unbeatable price.\n\nFeatures:\n• 2 comfortable bedrooms\n• 1 common bathroom + 1 attached\n• Compact kitchen with chimney\n• Small balcony with mountain view\n• Bike parking available\n\nLand area: 2 aana\nBuilt-up area: 1200 sq ft\nFloor: Ground + 1st floor\nRoad access: 12 ft pitched road\n\nIdeal for first-time home buyers. Clean title, no legal issues. Ready to move in!	12000000.00	505	301	Amit Sharma	9844463084	Used	approved	5	f	2025-12-25 20:41:59.37233	2026-01-23 14:39:12.200306	60	\N	\N	2025-12-25 20:41:59.37233	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	affordable-2bhk-house-kathmandu-valley-best-deal-4380	\N	\N	\N	\N	{"floors": "2 storey", "bedrooms": 2, "bathrooms": 2, "land_area": "2 aana", "road_access": "12 ft", "built_up_area": "1200 sq ft", "property_type": "house"}	\N
88	Rang Rover Black	Rang Rover BlackRang Rover BlackRang Rover BlackRang Rover BlackRang Rover BlackRang Rover Black	50000000.00	301	70101	\N	\N	Used	approved	62	f	2025-12-26 17:16:56.736	2026-01-23 14:39:12.200306	46	\N	64	2025-12-26 18:01:38.417	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	rang-rover-black-for-sale-in-dhangadhi-sub-metropolitan-city-1	\N	\N	\N	\N	{"year": "2023", "brand": "Rang Rover", "color": "Black", "model": "2024", "seats": "5", "owners": "1st Owner", "mileage": "3000", "bodyType": "SUV", "fuelType": "Hybrid", "transmission": "Automatic", "engineCapacity": "3000", "registrationYear": "2025", "registrationLocation": "Dhanghari"}	\N
72	Acer Swift Edge 16" Laptop Ryzen 7	Refurbished Excellent - Acer Swift Edge 16" with AMD Ryzen 7 7735U, 16GB RAM, 1TB SSD. Lightweight and powerful.	95000.00	201	71169	Ananda Shahi	9843963410	Brand New	approved	25	f	2025-12-24 17:55:47.883	2026-01-23 14:39:12.200306	59	\N	64	2025-12-26 17:36:59.847	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	acer-swift-edge-16-laptop-ryzen-7-for-sale-in-kamal-pokhari-1	\N	\N	\N	\N	{}	\N
56	Crossback Halter Dress	Beautiful crossback halter dress for special occasions. Elegant design with flattering silhouette. Premium quality fabric.	8500.00	805	71169	Dija Fashion Shop	9706657812	Brand New	approved	1	f	2025-12-24 17:55:47.534	2026-01-23 14:39:12.200306	62	\N	64	2025-12-24 18:53:08.839	\N	\N	\N	\N	\N	f	\N	f	\N	f	\N	0	\N	crossback-halter-dress-for-sale-in-kamal-pokhari-1	\N	\N	\N	\N	{}	\N
\.


--
-- Data for Name: announcement_read_receipts; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.announcement_read_receipts (id, announcement_id, user_id, read_at) FROM stdin;
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.announcements (id, title, content, target_audience, created_by, created_at, expires_at, is_active) FROM stdin;
\.


--
-- Data for Name: business_subscriptions; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.business_subscriptions (id, user_id, plan_name, amount_paid, payment_reference, payment_method, start_date, end_date, status, auto_renew, created_at) FROM stdin;
\.


--
-- Data for Name: business_verification_requests; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.business_verification_requests (id, user_id, business_name, business_license_document, business_category, business_description, business_website, business_phone, business_address, payment_reference, payment_amount, status, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at, duration_days, payment_status) FROM stdin;
16	63	Alina Mobile Store	biz-1766683327348-6480696.png	Electronics	\N	\N	\N	\N	TB_BUS_1766682243321_yhqusu	200.00	approved	64	2025-12-25 17:22:27.394	\N	2025-12-25 17:04:03.079	2025-12-25 17:22:07.356	30	paid
15	62	Dija Fashion Shop	biz-1766059170352-29961283.png	Fashion	\N	\N	\N	\N	TB_BUS_1766059050727_zk983d	200.00	approved	\N	2025-12-18 11:59:42.181	\N	2025-12-18 11:57:30.567	2025-12-18 11:59:30.356	30	paid
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.categories (id, name, slug, icon, created_at, parent_id, form_template, display_order) FROM stdin;
1410	Body Massage	body-massage	\N	2025-10-13 19:25:19.933171	14	\N	999
1305	Collection & Recovery Agents	collection-recovery-agents	\N	2025-10-13 20:15:22.337252	13	\N	999
1306	Construction Worker	construction-worker	\N	2025-10-13 20:15:22.337252	13	\N	999
1307	Content Writer	content-writer	\N	2025-10-13 20:15:22.337252	13	\N	999
1308	Counsellor	counsellor	\N	2025-10-13 20:15:22.337252	13	\N	999
1309	Customer Service Executive	customer-service-executive	\N	2025-10-13 20:15:22.337252	13	\N	999
1310	Customer Support Manager	customer-support-manager	\N	2025-10-13 20:15:22.337252	13	\N	999
1311	Delivery Rider	delivery-rider	\N	2025-10-13 20:15:22.337252	13	\N	999
1312	Designer	designer	\N	2025-10-13 20:15:22.337252	13	\N	999
1313	Digital Marketing Executive	digital-marketing-executive	\N	2025-10-13 20:15:22.337252	13	\N	999
1314	Digital Marketing Manager	digital-marketing-manager	\N	2025-10-13 20:15:22.337252	13	\N	999
1315	Doctor	doctor	\N	2025-10-13 20:15:22.337252	13	\N	999
1316	Driver	driver	\N	2025-10-13 20:15:22.337252	13	\N	999
1317	Electrician	electrician	\N	2025-10-13 20:15:22.337252	13	\N	999
1318	Engineer	engineer	\N	2025-10-13 20:15:22.337252	13	\N	999
1319	Event Planner	event-planner	\N	2025-10-13 20:15:22.337252	13	\N	999
1320	Fire Fighter	fire-fighter	\N	2025-10-13 20:15:22.337252	13	\N	999
1321	Flight Attendant	flight-attendant	\N	2025-10-13 20:15:22.337252	13	\N	999
1322	Florist	florist	\N	2025-10-13 20:15:22.337252	13	\N	999
1323	Gardener	gardener	\N	2025-10-13 20:15:22.337252	13	\N	999
1324	Garments Worker	garments-worker	\N	2025-10-13 20:15:22.337252	13	\N	999
1325	Government Jobs	government-jobs	\N	2025-10-13 20:15:22.337252	13	\N	999
1326	Hospitality Executive	hospitality-executive	\N	2025-10-13 20:15:22.337252	13	\N	999
1327	House Keeper	house-keeper	\N	2025-10-13 20:15:22.337252	13	\N	999
1328	HR Executive	hr-executive	\N	2025-10-13 20:15:22.337252	13	\N	999
1329	HR Manager	hr-manager	\N	2025-10-13 20:15:22.337252	13	\N	999
1330	Interior Designer	interior-designer	\N	2025-10-13 20:15:22.337252	13	\N	999
1331	Journalist	journalist	\N	2025-10-13 20:15:22.337252	13	\N	999
1332	Lab Assistant	lab-assistant	\N	2025-10-13 20:15:22.337252	13	\N	999
1333	Maid	maid	\N	2025-10-13 20:15:22.337252	13	\N	999
1334	Management Trainee	management-trainee	\N	2025-10-13 20:15:22.337252	13	\N	999
1335	Market Research Analyst	market-research-analyst	\N	2025-10-13 20:15:22.337252	13	\N	999
1336	Marketing Executive	marketing-executive	\N	2025-10-13 20:15:22.337252	13	\N	999
1337	Marketing Manager	marketing-manager	\N	2025-10-13 20:15:22.337252	13	\N	999
1338	Mechanic	mechanic	\N	2025-10-13 20:15:22.337252	13	\N	999
1339	Medical Representative	medical-representative	\N	2025-10-13 20:15:22.337252	13	\N	999
1340	Merchandiser	merchandiser	\N	2025-10-13 20:15:22.337252	13	\N	999
1341	Nurse	nurse	\N	2025-10-13 20:15:22.337252	13	\N	999
1342	Office Admin	office-admin	\N	2025-10-13 20:15:22.337252	13	\N	999
1343	Operator	operator	\N	2025-10-13 20:15:22.337252	13	\N	999
1344	Pharmacist	pharmacist	\N	2025-10-13 20:15:22.337252	13	\N	999
1345	Photographer	photographer	\N	2025-10-13 20:15:22.337252	13	\N	999
1346	Product Sourcing Executive	product-sourcing-executive	\N	2025-10-13 20:15:22.337252	13	\N	999
1347	Production Executive	production-executive	\N	2025-10-13 20:15:22.337252	13	\N	999
1348	Public Relations Officer	public-relations-officer	\N	2025-10-13 20:15:22.337252	13	\N	999
1349	Purchase Officer	purchase-officer	\N	2025-10-13 20:15:22.337252	13	\N	999
1350	Quality Checker	quality-checker	\N	2025-10-13 20:15:22.337252	13	\N	999
1351	Quality Controller	quality-controller	\N	2025-10-13 20:15:22.337252	13	\N	999
1352	Sales Executive	sales-executive	\N	2025-10-13 20:15:22.337252	13	\N	999
1353	Sales Manager Field	sales-manager-field	\N	2025-10-13 20:15:22.337252	13	\N	999
1354	Security Guard	security-guard	\N	2025-10-13 20:15:22.337252	13	\N	999
1355	SEO Specialist	seo-specialist	\N	2025-10-13 20:15:22.337252	13	\N	999
1356	Social Media Presenter	social-media-presenter	\N	2025-10-13 20:15:22.337252	13	\N	999
1357	Software Engineer	software-engineer	\N	2025-10-13 20:15:22.337252	13	\N	999
1358	Supervisor	supervisor	\N	2025-10-13 20:15:22.337252	13	\N	999
1359	Teacher	teacher	\N	2025-10-13 20:15:22.337252	13	\N	999
1360	Videographer	videographer	\N	2025-10-13 20:15:22.337252	13	\N	999
1361	Other	other	\N	2025-10-13 20:15:22.337252	13	\N	999
1411	Gym & Fitness	gym-fitness	\N	2025-10-13 19:28:31.359692	14	\N	999
1412	Beauty Services	beauty-services	\N	2025-10-13 19:28:31.359692	14	\N	999
101	Mobile Phones	mobile-phones	\N	2025-10-06 19:04:15.169124	1	\N	999
102	Mobile Phone Accessories	mobile-phone-accessories	\N	2025-10-06 19:04:15.169124	1	\N	999
103	Wearables	wearables	\N	2025-10-06 19:04:15.169124	1	\N	999
201	Laptops	laptops	\N	2025-10-06 19:04:15.169697	2	\N	999
202	Laptop & Computer Accessories	laptop-computer-accessories	\N	2025-10-06 19:04:15.169697	2	\N	999
203	Desktop Computers	desktop-computers	\N	2025-10-06 19:04:15.169697	2	\N	999
204	Home Appliances	home-appliances	\N	2025-10-06 19:04:15.169697	2	\N	999
205	ACs & Home Electronics	acs-home-electronics	\N	2025-10-06 19:04:15.169697	2	\N	999
206	Audio & Sound Systems	audio-sound-systems	\N	2025-10-06 19:04:15.169697	2	\N	999
207	TVs	tvs	\N	2025-10-06 19:04:15.169697	2	\N	999
208	Cameras, Camcorders & Accessories	cameras-camcorders-accessories	\N	2025-10-06 19:04:15.169697	2	\N	999
209	Tablets & Accessories	tablets-accessories	\N	2025-10-06 19:04:15.169697	2	\N	999
210	TV & Video Accessories	tv-video-accessories	\N	2025-10-06 19:04:15.169697	2	\N	999
211	Other Electronics	other-electronics	\N	2025-10-06 19:04:15.169697	2	\N	999
212	Video Game Consoles & Accessories	video-game-consoles-accessories	\N	2025-10-06 19:04:15.169697	2	\N	999
213	Photocopiers	photocopiers	\N	2025-10-06 19:04:15.169697	2	\N	999
301	Cars	cars	\N	2025-10-06 19:04:15.170542	3	\N	999
302	Motorbikes	motorbikes	\N	2025-10-06 19:04:15.170542	3	\N	999
1	Mobiles	mobiles	📱	2025-09-27 16:52:17.426284	\N	electronics	1
2	Electronics	electronics	💻	2025-09-27 16:52:17.426284	\N	electronics	2
3	Vehicles	vehicles	🚗	2025-09-27 16:52:17.426284	\N	vehicles	3
303	Bicycles	bicycles	\N	2025-10-06 19:04:15.170542	3	\N	999
304	Auto Parts & Accessories	auto-parts-accessories	\N	2025-10-06 19:04:15.170542	3	\N	999
305	Rentals	rentals	\N	2025-10-06 19:04:15.170542	3	\N	999
306	Three Wheelers	three-wheelers	\N	2025-10-06 19:04:15.170542	3	\N	999
307	Trucks	trucks	\N	2025-10-06 19:04:15.170542	3	\N	999
308	Vans	vans	\N	2025-10-06 19:04:15.170542	3	\N	999
309	Heavy Duty	heavy-duty	\N	2025-10-06 19:04:15.170542	3	\N	999
310	Water Transport	water-transport	\N	2025-10-06 19:04:15.170542	3	\N	999
311	Buses	buses	\N	2025-10-06 19:04:15.170542	3	\N	999
312	Auto Services	auto-services	\N	2025-10-06 19:04:15.170542	3	\N	999
313	Maintenance and Repair	maintenance-repair	\N	2025-10-06 19:04:15.170542	3	\N	999
401	Bedroom Furniture	bedroom-furniture	\N	2025-10-06 19:04:15.172671	4	\N	999
402	Living Room Furniture	living-room-furniture	\N	2025-10-06 19:04:15.172671	4	\N	999
403	Office & Shop Furniture	office-shop-furniture	\N	2025-10-06 19:04:15.172671	4	\N	999
404	Home Textiles & Decoration	home-textiles-decoration	\N	2025-10-06 19:04:15.172671	4	\N	999
405	Household Items	household-items	\N	2025-10-06 19:04:15.172671	4	\N	999
406	Kitchen & Dining Furniture	kitchen-dining-furniture	\N	2025-10-06 19:04:15.172671	4	\N	999
407	Children's Furniture	childrens-furniture	\N	2025-10-06 19:04:15.172671	4	\N	999
408	Doors	doors	\N	2025-10-06 19:04:15.172671	4	\N	999
409	Bathroom Products	bathroom-products	\N	2025-10-06 19:04:15.172671	4	\N	999
501	Land For Sale	land-for-sale	\N	2025-10-06 19:04:15.173262	5	\N	999
502	Apartments For Sale	apartments-for-sale	\N	2025-10-06 19:04:15.173262	5	\N	999
503	Apartment Rentals	apartment-rentals	\N	2025-10-06 19:04:15.173262	5	\N	999
504	Commercial Property Rentals	commercial-property-rentals	\N	2025-10-06 19:04:15.173262	5	\N	999
505	Houses For Sale	houses-for-sale	\N	2025-10-06 19:04:15.173262	5	\N	999
506	Commercial Properties For Sale	commercial-properties-for-sale	\N	2025-10-06 19:04:15.173262	5	\N	999
507	Room Rentals	room-rentals	\N	2025-10-06 19:04:15.173262	5	\N	999
508	House Rentals	house-rentals	\N	2025-10-06 19:04:15.173262	5	\N	999
509	Land Rentals	land-rentals	\N	2025-10-06 19:04:15.173262	5	\N	999
510	New projects on PropertyGuide	new-projects-propertyguide	\N	2025-10-06 19:04:15.173262	5	\N	999
601	Pets	pets	\N	2025-10-06 19:04:15.173707	6	\N	999
602	Farm Animals	farm-animals	\N	2025-10-06 19:04:15.173707	6	\N	999
603	Pet & Animal Accessories	pet-animal-accessories	\N	2025-10-06 19:04:15.173707	6	\N	999
604	Pet & Animal food	pet-animal-food	\N	2025-10-06 19:04:15.173707	6	\N	999
605	Other Pets & Animals	other-pets-animals	\N	2025-10-06 19:04:15.173707	6	\N	999
701	Watches	watches	\N	2025-10-06 19:04:15.174076	7	\N	999
702	Shirts & T-Shirts	shirts-tshirts	\N	2025-10-06 19:04:15.174076	7	\N	999
703	Footwear	footwear	\N	2025-10-06 19:04:15.174076	7	\N	999
704	Bags & Accessories	bags-accessories	\N	2025-10-06 19:04:15.174076	7	\N	999
705	Grooming & Bodycare	grooming-bodycare	\N	2025-10-06 19:04:15.174076	7	\N	999
706	Pants	pants	\N	2025-10-06 19:04:15.174076	7	\N	999
707	Traditional Clothing	traditional-clothing	\N	2025-10-06 19:04:15.174076	7	\N	999
708	Jacket & Coat	jacket-coat	\N	2025-10-06 19:04:15.174076	7	\N	999
709	Optical & Sunglasses	optical-sunglasses	\N	2025-10-06 19:04:15.174076	7	\N	999
710	Baby Boy's Fashion	baby-boys-fashion	\N	2025-10-06 19:04:15.174076	7	\N	999
711	Wholesale - Bulk	wholesale-bulk	\N	2025-10-06 19:04:15.174076	7	\N	999
801	Traditional Wear	traditional-wear	\N	2025-10-06 19:04:15.174538	8	\N	999
802	Beauty & Personal Care	beauty-personal-care	\N	2025-10-06 19:04:15.174538	8	\N	999
803	Jewellery & Watches	jewellery-watches	\N	2025-10-06 19:04:15.174538	8	\N	999
804	Bags & Accessories	bags-accessories-women	\N	2025-10-06 19:04:15.174538	8	\N	999
805	Western Wear	western-wear	\N	2025-10-06 19:04:15.174538	8	\N	999
806	Baby Girl's Fashion	baby-girls-fashion	\N	2025-10-06 19:04:15.174538	8	\N	999
807	Footwear	footwear-women	\N	2025-10-06 19:04:15.174538	8	\N	999
808	Lingerie & Sleepwear	lingerie-sleepwear	\N	2025-10-06 19:04:15.174538	8	\N	999
809	Wholesale - Bulk	wholesale-bulk-women	\N	2025-10-06 19:04:15.174538	8	\N	999
810	Winter Wear	winter-wear	\N	2025-10-06 19:04:15.174538	8	\N	999
811	Optical & Sunglasses	optical-sunglasses-women	\N	2025-10-06 19:04:15.174538	8	\N	999
901	Musical Instruments	musical-instruments	\N	2025-10-06 19:04:15.175034	9	\N	999
902	Sports	sports	\N	2025-10-06 19:04:15.175034	9	\N	999
903	Children's Items	childrens-items	\N	2025-10-06 19:04:15.175034	9	\N	999
904	Other Hobby, Sport & Kids items	other-hobby-sport-kids	\N	2025-10-06 19:04:15.175034	9	\N	999
905	Fitness & Gym	fitness-gym	\N	2025-10-06 19:04:15.175034	9	\N	999
906	Music, Books & Movies	music-books-movies	\N	2025-10-06 19:04:15.175034	9	\N	999
1001	Industry Machinery & Tools	industry-machinery-tools	\N	2025-10-06 19:04:15.175416	10	\N	999
1002	Other Business & Industry Items	other-business-industry	\N	2025-10-06 19:04:15.175416	10	\N	999
1003	Office Supplies & Stationary	office-supplies-stationary	\N	2025-10-06 19:04:15.175416	10	\N	999
1004	Medical Equipment & Supplies	medical-equipment-supplies	\N	2025-10-06 19:04:15.175416	10	\N	999
1005	Raw Materials & Industrial Supplies	raw-materials-industrial-supplies	\N	2025-10-06 19:04:15.175416	10	\N	999
1006	Licences, Titles & Tenders	licences-titles-tenders	\N	2025-10-06 19:04:15.175416	10	\N	999
1007	Safety & Security	safety-security	\N	2025-10-06 19:04:15.175416	10	\N	999
1101	Textbooks	textbooks	\N	2025-10-06 19:04:15.175794	11	\N	999
1102	Tuition	tuition	\N	2025-10-06 19:04:15.175794	11	\N	999
1103	Courses	courses	\N	2025-10-06 19:04:15.175794	11	\N	999
1104	Study Abroad	study-abroad	\N	2025-10-06 19:04:15.175794	11	\N	999
1105	Other Education	other-education	\N	2025-10-06 19:04:15.175794	11	\N	999
1201	Grocery	grocery	\N	2025-10-06 19:04:15.176154	12	\N	999
1202	Healthcare	healthcare	\N	2025-10-06 19:04:15.176154	12	\N	999
1203	Other Essentials	other-essentials	\N	2025-10-06 19:04:15.176154	12	\N	999
1204	Household	household	\N	2025-10-06 19:04:15.176154	12	\N	999
1205	Baby Products	baby-products	\N	2025-10-06 19:04:15.176154	12	\N	999
1206	Fruits & Vegetables	fruits-vegetables	\N	2025-10-06 19:04:15.176154	12	\N	999
1207	Meat & Seafood	meat-seafood	\N	2025-10-06 19:04:15.176154	12	\N	999
1401	Servicing & Repair	servicing-repair	\N	2025-10-06 19:04:15.177135	14	\N	999
1402	Media & Event Management Services	media-event-management	\N	2025-10-06 19:04:15.177135	14	\N	999
1403	Tours & Travels	tours-travels	\N	2025-10-06 19:04:15.177135	14	\N	999
1404	IT Services	it-services	\N	2025-10-06 19:04:15.177135	14	\N	999
1405	Building maintenance	building-maintenance	\N	2025-10-06 19:04:15.177135	14	\N	999
1406	Professional Services	professional-services	\N	2025-10-06 19:04:15.177135	14	\N	999
1407	Matrimonials	matrimonials	\N	2025-10-06 19:04:15.177135	14	\N	999
1409	Domestic & Daycare Services	domestic-daycare-services	\N	2025-10-06 19:04:15.177135	14	\N	999
1501	Crops, Seeds & Plants	crops-seeds-plants	\N	2025-10-06 19:04:15.177572	15	\N	999
1502	Farming Tools & Machinery	farming-tools-machinery	\N	2025-10-06 19:04:15.177572	15	\N	999
1503	Other Agriculture	other-agriculture	\N	2025-10-06 19:04:15.177572	15	\N	999
1601	Bulgaria	bulgaria	\N	2025-10-06 19:04:15.177858	16	\N	999
1602	Croatia	croatia	\N	2025-10-06 19:04:15.177858	16	\N	999
1603	Serbia	serbia	\N	2025-10-06 19:04:15.177858	16	\N	999
1604	Saudi Arabia	saudi-arabia	\N	2025-10-06 19:04:15.177858	16	\N	999
1605	UAE	uae	\N	2025-10-06 19:04:15.177858	16	\N	999
1606	Qatar	qatar	\N	2025-10-06 19:04:15.177858	16	\N	999
1607	Malaysia	malaysia	\N	2025-10-06 19:04:15.177858	16	\N	999
1608	Singapore	singapore	\N	2025-10-06 19:04:15.177858	16	\N	999
1301	Accountant	accountant	\N	2025-10-13 20:15:22.337252	13	\N	999
1302	Beautician	beautician	\N	2025-10-13 20:15:22.337252	13	\N	999
1303	Business Analyst	business-analyst	\N	2025-10-13 20:15:22.337252	13	\N	999
1304	Chef	chef	\N	2025-10-13 20:15:22.337252	13	\N	999
5	Property	property	🏢	2025-09-27 16:52:17.426284	\N	property	4
4	Home & Living	home-living	🏠	2025-09-27 16:52:17.426284	\N	general	5
7	Men's Fashion & Grooming	mens-fashion-grooming	👔	2025-09-27 16:52:17.426284	\N	fashion	6
8	Women's Fashion & Beauty	womens-fashion-beauty	👗	2025-09-27 16:52:17.426284	\N	fashion	7
9	Hobbies, Sports & Kids	hobbies-sports-kids	⚽	2025-10-06 19:03:12.018219	\N	general	8
12	Essentials	essentials	🛒	2025-10-06 19:03:12.018219	\N	general	9
13	Jobs	jobs	💼	2025-10-06 19:03:12.018219	\N	services	10
16	Overseas Jobs	overseas-jobs	✈️	2025-10-06 19:03:12.018219	\N	services	11
6	Pets & Animals	pets-animals	🐾	2025-09-27 16:52:17.426284	\N	pets	12
14	Services	services	🔧	2025-10-06 19:03:12.018219	\N	services	13
11	Education	education	📚	2025-10-06 19:03:12.018219	\N	services	14
10	Business & Industry	business-industry	🏭	2025-10-06 19:03:12.018219	\N	general	15
15	Agriculture	agriculture	🌾	2025-10-06 19:03:12.018219	\N	general	16
\.


--
-- Data for Name: category_pricing_tiers; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.category_pricing_tiers (id, category_id, pricing_tier, created_at, updated_at) FROM stdin;
1	2	electronics	2025-12-17 15:47:13.33849	2025-12-17 15:47:13.33849
2	1	electronics	2025-12-17 15:47:13.33849	2025-12-17 15:47:13.33849
3	3	vehicles	2025-12-17 15:47:13.345344	2025-12-17 15:47:13.345344
4	5	property	2025-12-17 15:47:13.345798	2025-12-17 15:47:13.345798
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.contact_messages (id, ad_id, buyer_id, seller_id, buyer_name, buyer_email, buyer_phone, message, is_read, created_at, is_reply, reply_to_message_id) FROM stdin;
\.


--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.conversation_participants (id, conversation_id, user_id, joined_at, last_read_at, is_muted, is_archived) FROM stdin;
24	12	60	2025-12-25 19:29:54.602	2025-12-25 19:30:58.128	f	f
25	13	46	2025-12-26 17:44:28.592	2025-12-26 17:46:40.142	f	f
23	12	63	2025-12-25 19:29:54.602	2026-01-10 15:09:17.019	f	f
26	13	62	2025-12-26 17:44:28.592	2026-01-13 18:42:32.804	f	f
28	14	59	2026-01-13 18:47:40.26	2026-01-13 18:47:40.26	f	f
27	14	62	2026-01-13 18:47:40.26	2026-01-13 18:47:42.899	f	f
30	15	47	2026-01-13 18:48:05.542	2026-01-13 18:48:05.542	f	f
29	15	62	2026-01-13 18:48:05.542	2026-01-13 18:48:15.16	f	f
32	16	60	2026-01-13 18:49:17.719	2026-01-13 18:49:17.719	f	f
31	16	62	2026-01-13 18:49:17.719	2026-01-13 18:49:34.714	f	f
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.conversations (id, type, title, ad_id, created_at, updated_at, last_message_at) FROM stdin;
3	direct	ram & kayesmotor	\N	2025-11-23 01:50:25.68676	2025-11-26 13:00:27.75139	2025-11-26 07:15:27.759
9	direct	\N	\N	2025-11-23 04:21:00.100036	2025-11-23 05:18:37.71456	2025-11-23 05:18:37.718519
10	direct	\N	\N	2025-11-26 06:41:16.442411	2025-11-28 16:33:10.743664	2025-11-28 10:48:10.753
11	direct	\N	\N	2025-12-05 14:47:20.908	2025-12-05 20:35:59.192385	2025-12-05 14:50:59.199
1	direct	\N	\N	2025-11-22 18:48:44.849714	2025-12-03 14:27:51.357848	2025-12-03 08:42:51.362
5	direct	\N	\N	2025-11-23 02:28:21.419594	2025-11-25 05:55:54.888145	2025-11-25 05:55:54.890489
4	direct	\N	\N	2025-11-23 02:09:19.118606	2025-11-23 02:09:25.147493	2025-11-23 02:09:25.150274
7	direct	\N	\N	2025-11-23 02:51:34.368315	2025-11-23 03:46:26.327018	2025-11-23 03:46:26.336151
8	direct	\N	\N	2025-11-23 03:48:30.176037	2025-11-23 03:48:35.247701	2025-11-23 03:48:35.253802
2	direct	\N	\N	2025-11-22 22:53:25.252414	2025-11-23 01:51:20.047739	2025-11-23 01:51:20.049598
6	direct	\N	\N	2025-11-23 02:30:37.582785	2025-11-23 02:31:21.678492	2025-11-23 02:31:21.680518
12	direct	\N	84	2025-12-25 19:29:54.602	2025-12-26 01:30:58.122619	2025-12-25 19:30:58.13
13	direct	\N	64	2025-12-26 17:44:28.592	2026-01-14 00:42:32.787862	2026-01-13 18:42:32.806
14	direct	\N	33	2026-01-13 18:47:40.26	2026-01-13 18:47:40.26	2026-01-13 18:47:40.26
15	direct	\N	89	2026-01-13 18:48:05.542	2026-01-14 00:48:15.153441	2026-01-13 18:48:15.162
16	direct	\N	85	2026-01-13 18:49:17.719	2026-01-14 00:49:34.711566	2026-01-13 18:49:34.733
\.


--
-- Data for Name: editor_permissions; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.editor_permissions (id, editor_id, permission, granted_by, granted_at) FROM stdin;
\.


--
-- Data for Name: individual_verification_requests; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.individual_verification_requests (id, user_id, id_document_type, id_document_number, id_document_front, id_document_back, selfie_with_id, status, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at, full_name, duration_days, payment_amount, payment_reference, payment_status) FROM stdin;
12	47	citizenship	23213213213213	id-front-1766684175706-201104248.png	id-back-1766684175710-566466656.png	selfie-1766684175708-105033056.png	approved	64	2025-12-25 17:36:27.389	\N	2025-12-25 17:34:17.684	2025-12-25 23:36:27.391255	Amit Sharma	30	100.00	TB_IND_1766684057702_a8aby0	paid
13	46	passport	214234325432	id-front-1766769037876-382178303.png	id-back-1766769037883-33836463.png	selfie-1766769037879-732696041.png	approved	64	2025-12-26 17:10:50.59	\N	2025-12-26 17:07:17.77	2025-12-26 23:10:50.608734	Rohit Thapa	365	700.00	TB_IND_1766768838168_0k2ccf	paid
14	62	passport	23213213213213	id-front-1767979871545-885247803.jpg	\N	selfie-1767979871548-533974854.jpg	pending_payment	\N	\N	\N	2026-01-09 17:31:11.565	2026-01-09 17:31:11.565	Sam Tamang	365	700.00	PENDING	pending
9	59	citizenship	1114324	id-front-1765310177757-263614038.webp	id-back-1765310177757-263614038.jpeg	selfie-1765310177757-263614038.jpeg	approved	\N	2025-12-09 19:58:04.343	\N	2025-12-09 19:56:17.768	2025-12-23 22:25:09.326949	Ananda Shahi	30	70.00	TB_IND_1765310178033_qw8905	paid
11	60	citizenship	23213213213213	id-front-1766055755060-867251923.png	id-back-1766055755060-867251923.png	selfie-1766055755060-867251923.png	approved	\N	2025-12-18 11:03:01.408	\N	2025-12-18 10:40:07.141	2025-12-23 22:25:09.326949	Amit Sharma	30	100.00	TB_IND_1766054407155_16twif	paid
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.locations (id, name, type, parent_id, created_at, slug, latitude, longitude) FROM stdin;
71166	Naxal	area	30101	2025-11-23 23:02:11.004282	naxal	\N	\N
71167	Gairidhara	area	30101	2025-11-23 23:02:11.004282	gairidhara	\N	\N
71168	Teku	area	30101	2025-11-23 23:02:11.004282	teku	\N	\N
71169	Kamal Pokhari	area	30101	2025-11-23 23:02:11.004282	kamal-pokhari	\N	\N
71170	Sankha Kriti Maha Bihar	area	30101	2025-11-23 23:02:11.004282	sankha-kriti-maha-bihar	\N	\N
71171	Lazimpat	area	30101	2025-11-23 23:02:11.004282	lazimpat	\N	\N
71172	Thamel Marg	area	30101	2025-11-23 23:02:11.004282	thamel-marg	\N	\N
71173	Hotel Area	area	30101	2025-11-23 23:02:11.004282	hotel-area	\N	\N
71174	Maharajgunj	area	30101	2025-11-23 23:02:11.004282	maharajgunj	\N	\N
71175	Shree Gopal Marg	area	30101	2025-11-23 23:02:11.004282	shree-gopal-marg	\N	\N
71176	Balaju	area	30101	2025-11-23 23:02:11.004282	balaju	\N	\N
71177	Baluwatar	area	30101	2025-11-23 23:02:11.004282	baluwatar	\N	\N
71178	Chappal Karkhana	area	30101	2025-11-23 23:02:11.004282	chappal-karkhana	\N	\N
71179	Chundevi	area	30101	2025-11-23 23:02:11.004282	chundevi	\N	\N
71180	Dhumbarahi	area	30101	2025-11-23 23:02:11.004282	dhumbarahi	\N	\N
71181	Hadigaun	area	30101	2025-11-23 23:02:11.004282	hadigaun	\N	\N
71182	Kapan	area	30101	2025-11-23 23:02:11.004282	kapan	\N	\N
71183	Chapali Bhadrakali	area	30101	2025-11-23 23:02:11.004282	chapali-bhadrakali	\N	\N
71184	Bouddha	area	30101	2025-11-23 23:02:11.004282	bouddha	\N	\N
71185	Bauddha Stupa area	area	30101	2025-11-23 23:02:11.004282	bauddha-stupa-area	\N	\N
71186	Boudhanath Marg	area	30101	2025-11-23 23:02:11.004282	boudhanath-marg	\N	\N
71187	Mitrapark	area	30101	2025-11-23 23:02:11.004282	mitrapark	\N	\N
71188	Chhauni	area	30101	2025-11-23 23:02:11.004282	chhauni	\N	\N
71189	Ghattekulo	area	30101	2025-11-23 23:02:11.004282	ghattekulo	\N	\N
71190	Pashupati area	area	30101	2025-11-23 23:02:11.004282	pashupati-area	\N	\N
71191	Pashupatinath Marg	area	30101	2025-11-23 23:02:11.004282	pashupatinath-marg	\N	\N
71192	Gaushala	area	30101	2025-11-23 23:02:11.004282	gaushala	\N	\N
71193	Sinamangal	area	30101	2025-11-23 23:02:11.004282	sinamangal	\N	\N
71194	Jagadihel	area	30101	2025-11-23 23:02:11.004282	jagadihel	\N	\N
71195	Baneshwor	area	30101	2025-11-23 23:02:11.004282	baneshwor	\N	\N
71196	New Baneshwor	area	30101	2025-11-23 23:02:11.004282	new-baneshwor	\N	\N
71197	Sajha Marg	area	30101	2025-11-23 23:02:11.004282	sajha-marg	\N	\N
71198	Tripureshwor	area	30101	2025-11-23 23:02:11.004282	tripureshwor	\N	\N
71199	Putalisadak	area	30101	2025-11-23 23:02:11.004282	putalisadak	\N	\N
71200	Gairigaon	area	30101	2025-11-23 23:02:11.004282	gairigaon	\N	\N
71201	Kuleshwor	area	30101	2025-11-23 23:02:11.004282	kuleshwor	\N	\N
71202	Kalimati	area	30101	2025-11-23 23:02:11.004282	kalimati	\N	\N
71203	Sorhakhutte	area	30101	2025-11-23 23:02:11.004282	sorhakhutte	\N	\N
71204	Tangal	area	30101	2025-11-23 23:02:11.004282	tangal	\N	\N
71205	Kalanki	area	30101	2025-11-23 23:02:11.004282	kalanki	\N	\N
71206	Gongabu	area	30101	2025-11-23 23:02:11.004282	gongabu	\N	\N
71207	Samakhusi	area	30101	2025-11-23 23:02:11.004282	samakhusi	\N	\N
71208	Dallu	area	30101	2025-11-23 23:02:11.004282	dallu	\N	\N
71209	Chabahil	area	30101	2025-11-23 23:02:11.004282	chabahil	\N	\N
71210	Swayambhu Marg	area	30101	2025-11-23 23:02:11.004282	swayambhu-marg	\N	\N
71211	Bagbazaar extension	area	30101	2025-11-23 23:02:11.004282	bagbazaar-extension	\N	\N
71212	Jawalakhel	area	30101	2025-11-23 23:02:11.004282	jawalakhel	\N	\N
71213	Satdobato	area	30101	2025-11-23 23:02:11.004282	satdobato	\N	\N
71214	Maitighar	area	30101	2025-11-23 23:02:11.004282	maitighar	\N	\N
71215	Durbar Marg vicinity	area	30101	2025-11-23 23:02:11.004282	durbar-marg-vicinity	\N	\N
71216	Yatkha	area	30101	2025-11-23 23:02:11.004282	yatkha	\N	\N
71217	Swayambhu	area	30101	2025-11-23 23:02:11.004282	swayambhu	\N	\N
71218	Bansbari marginal areas	area	30101	2025-11-23 23:02:11.004282	bansbari-marginal-areas	\N	\N
71219	Gagal Pati	area	30101	2025-11-23 23:02:11.004282	gagal-pati	\N	\N
71220	Narayan Gopal Chowk	area	30101	2025-11-23 23:02:11.004282	narayan-gopal-chowk	\N	\N
71221	Gyaneshwar	area	30101	2025-11-23 23:02:11.004282	gyaneshwar	\N	\N
71222	Rabi Bhawan area	area	30101	2025-11-23 23:02:11.004282	rabi-bhawan-area	\N	\N
71223	Lainchaur	area	30101	2025-11-23 23:02:11.004282	lainchaur	\N	\N
71224	New Road fringes	area	30101	2025-11-23 23:02:11.004282	new-road-fringes	\N	\N
71225	Kathmandu Durbar Square side	area	30101	2025-11-23 23:02:11.004282	kathmandu-durbar-square-side	\N	\N
71226	New Road	area	30101	2025-11-23 23:02:11.004282	new-road	\N	\N
71227	Indra Chowk	area	30101	2025-11-23 23:02:11.004282	indra-chowk	\N	\N
71228	Asan	area	30101	2025-11-23 23:02:11.004282	asan	\N	\N
71229	Durbarmarg	area	30101	2025-11-23 23:02:11.004282	durbarmarg	\N	\N
71230	Thamel	area	30101	2025-11-23 23:02:11.004282	thamel	\N	\N
71231	Chhaya Devi area	area	30101	2025-11-23 23:02:11.004282	chhaya-devi-area	\N	\N
71232	Kamaladi	area	30101	2025-11-23 23:02:11.004282	kamaladi	\N	\N
71233	Dhhetrapati	area	30101	2025-11-23 23:02:11.004282	dhhetrapati	\N	\N
71234	Ason side	area	30101	2025-11-23 23:02:11.004282	ason-side	\N	\N
71235	Hattisar	area	30101	2025-11-23 23:02:11.004282	hattisar	\N	\N
71236	Sundhara	area	30101	2025-11-23 23:02:11.004282	sundhara	\N	\N
71237	Jamal vicinity	area	30101	2025-11-23 23:02:11.004282	jamal-vicinity	\N	\N
71239	Maitighar extension	area	30101	2025-11-23 23:02:11.004282	maitighar-extension	\N	\N
71240	Indrachowk	area	30101	2025-11-23 23:02:11.004282	indrachowk	\N	\N
71241	Putalisadak backstreets	area	30101	2025-11-23 23:02:11.004282	putalisadak-backstreets	\N	\N
71242	Dilli Bazaar	area	30101	2025-11-23 23:02:11.004282	dilli-bazaar	\N	\N
71243	Bagbazaar	area	30101	2025-11-23 23:02:11.004282	bagbazaar	\N	\N
71244	Jyapati	area	30101	2025-11-23 23:02:11.004282	jyapati	\N	\N
71245	Teku extension	area	30101	2025-11-23 23:02:11.004282	teku-extension	\N	\N
71246	Koteshwor	area	30101	2025-11-23 23:02:11.004282	koteshwor	\N	\N
71247	Balkhu	area	30101	2025-11-23 23:02:11.004282	balkhu	\N	\N
71248	Thapathali outskirts	area	30101	2025-11-23 23:02:11.004282	thapathali-outskirts	\N	\N
71249	Koteshwor Mahadevsthan	area	30101	2025-11-23 23:02:11.004282	koteshwor-mahadevsthan	\N	\N
71250	Sankhamul	area	30101	2025-11-23 23:02:11.004282	sankhamul	\N	\N
71238	Anamnagar	area	30101	2025-11-23 23:02:11.004282	anamnagar	\N	\N
303	Bhaktapur	district	3	2025-10-07 23:26:03.398315	bhaktapur	\N	\N
1	Koshi Provincee	province	\N	2025-10-07 23:26:03.380728	koshi-province	\N	\N
71252	Buspark(Kathmandu)	area	30101	2025-11-30 01:08:17.926	buspark	\N	\N
10403	Damak Municipality	municipality	104	2025-10-07 23:26:03.384511	damak-municipality	\N	\N
10404	Arjundhara Municipality	municipality	104	2025-10-07 23:26:03.384511	arjundhara-municipality	\N	\N
10405	Gauradaha Municipality	municipality	104	2025-10-07 23:26:03.384511	gauradaha-municipality	\N	\N
11206	Maiwakhola Rural Municipality	municipality	112	2025-10-07 23:26:03.388925	maiwakhola-rural-municipality	\N	\N
20506	Dewahi Gonahi Municipality	municipality	205	2025-10-07 23:26:03.394754	dewahi-gonahi-municipality	\N	\N
20507	Gadhimai Municipality	municipality	205	2025-10-07 23:26:03.394754	gadhimai-municipality	\N	\N
20508	Gujara Municipality	municipality	205	2025-10-07 23:26:03.394754	gujara-municipality	\N	\N
20801	Lahan Municipality	municipality	208	2025-10-07 23:26:03.397307	lahan-municipality	\N	\N
30206	Mahankal Rural Municipality	municipality	302	2025-10-07 23:26:03.399696	mahankal-rural-municipality	\N	\N
30301	Bhaktapur Municipality	municipality	303	2025-10-07 23:26:03.400181	bhaktapur-municipality	\N	\N
30302	Changunarayan Municipality	municipality	303	2025-10-07 23:26:03.400181	changunarayan-municipality	\N	\N
31302	Banepa Municipality	municipality	313	2025-10-07 23:26:03.406454	banepa-municipality	\N	\N
31303	Panauti Municipality	municipality	313	2025-10-07 23:26:03.406454	panauti-municipality	\N	\N
41005	Bareng Rural Municipality	municipality	410	2025-10-07 23:26:03.41368	bareng-rural-municipality	\N	\N
41006	Kathekhola Rural Municipality	municipality	410	2025-10-07 23:26:03.41368	kathekhola-rural-municipality	\N	\N
41007	Taman Khola Rural Municipality	municipality	410	2025-10-07 23:26:03.41368	taman-khola-rural-municipality	\N	\N
41008	Tara Khola Rural Municipality	municipality	410	2025-10-07 23:26:03.41368	tara-khola-rural-municipality	\N	\N
41009	Nisikhola Rural Municipality	municipality	410	2025-10-07 23:26:03.41368	nisikhola-rural-municipality	\N	\N
41010	Badigad Rural Municipality	municipality	410	2025-10-07 23:26:03.41368	badigad-rural-municipality	\N	\N
41101	Beni Municipality	municipality	411	2025-10-07 23:26:03.414442	beni-municipality	\N	\N
50709	Gangadev Rural Municipality	municipality	507	2025-10-07 23:26:03.420905	gangadev-rural-municipality	\N	\N
50710	Pariwartan Rural Municipality	municipality	507	2025-10-07 23:26:03.420905	pariwartan-rural-municipality	\N	\N
50801	Bhume Rural Municipality	municipality	508	2025-10-07 23:26:03.421677	bhume-rural-municipality	\N	\N
60608	Mahawai Rural Municipality	municipality	606	2025-10-07 23:26:03.429401	mahawai-rural-municipality	\N	\N
60609	Palata Rural Municipality	municipality	606	2025-10-07 23:26:03.429401	palata-rural-municipality	\N	\N
70606	Mellekh Rural Municipality	municipality	706	2025-10-07 23:26:03.43834	mellekh-rural-municipality	\N	\N
101	Bhojpuri	district	1	2025-10-07 23:26:03.381562	bhojpur	\N	\N
102	Dhankuta	district	1	2025-10-07 23:26:03.381562	dhankuta	\N	\N
103	Ilam	district	1	2025-10-07 23:26:03.381562	ilam	\N	\N
104	Jhapa	district	1	2025-10-07 23:26:03.381562	jhapa	\N	\N
105	Khotang	district	1	2025-10-07 23:26:03.381562	khotang	\N	\N
106	Morang	district	1	2025-10-07 23:26:03.381562	morang	\N	\N
107	Okhaldhunga	district	1	2025-10-07 23:26:03.381562	okhaldhunga	\N	\N
108	Panchthar	district	1	2025-10-07 23:26:03.381562	panchthar	\N	\N
109	Sankhuwasabha	district	1	2025-10-07 23:26:03.381562	sankhuwasabha	\N	\N
110	Solukhumbu	district	1	2025-10-07 23:26:03.381562	solukhumbu	\N	\N
111	Sunsari	district	1	2025-10-07 23:26:03.381562	sunsari	\N	\N
112	Taplejung	district	1	2025-10-07 23:26:03.381562	taplejung	\N	\N
113	Terhathum	district	1	2025-10-07 23:26:03.381562	terhathum	\N	\N
114	Udayapur	district	1	2025-10-07 23:26:03.381562	udayapur	\N	\N
10101	Bhojpur Municipality	municipality	101	2025-10-07 23:26:03.38271	bhojpur-municipality	\N	\N
10102	Shadananda Municipality	municipality	101	2025-10-07 23:26:03.38271	shadananda-municipality	\N	\N
10103	Hatuwagadhi Rural Municipality	municipality	101	2025-10-07 23:26:03.38271	hatuwagadhi-rural-municipality	\N	\N
10104	Ramprasad Rai Rural Municipality	municipality	101	2025-10-07 23:26:03.38271	ramprasad-rai-rural-municipality	\N	\N
10105	Aamchowk Rural Municipality	municipality	101	2025-10-07 23:26:03.38271	aamchowk-rural-municipality	\N	\N
10106	Tyamke Maiyum Rural Municipality	municipality	101	2025-10-07 23:26:03.38271	tyamke-maiyum-rural-municipality	\N	\N
10107	Pauwadungma Rural Municipality	municipality	101	2025-10-07 23:26:03.38271	pauwadungma-rural-municipality	\N	\N
10108	Salpasilichho Rural Municipality	municipality	101	2025-10-07 23:26:03.38271	salpasilichho-rural-municipality	\N	\N
10109	Arun Rural Municipality	municipality	101	2025-10-07 23:26:03.38271	arun-rural-municipality	\N	\N
10201	Dhankuta Municipality	municipality	102	2025-10-07 23:26:03.383368	dhankuta-municipality	\N	\N
10203	Pakhribas Municipality	municipality	102	2025-10-07 23:26:03.383368	pakhribas-municipality	\N	\N
10204	Sangurigadhi Rural Municipality	municipality	102	2025-10-07 23:26:03.383368	sangurigadhi-rural-municipality	\N	\N
10205	Chaubise Rural Municipality	municipality	102	2025-10-07 23:26:03.383368	chaubise-rural-municipality	\N	\N
10206	Shahidbhumi Rural Municipality	municipality	102	2025-10-07 23:26:03.383368	shahidbhumi-rural-municipality	\N	\N
10207	Chhathar Jorpati Rural Municipality	municipality	102	2025-10-07 23:26:03.383368	chhathar-jorpati-rural-municipality	\N	\N
10301	Ilam Municipality	municipality	103	2025-10-07 23:26:03.383929	ilam-municipality	\N	\N
10302	Deumai Municipality	municipality	103	2025-10-07 23:26:03.383929	deumai-municipality	\N	\N
10303	Mai Municipality	municipality	103	2025-10-07 23:26:03.383929	mai-municipality	\N	\N
10304	Suryodaya Municipality	municipality	103	2025-10-07 23:26:03.383929	suryodaya-municipality	\N	\N
10305	Phakphokthum Rural Municipality	municipality	103	2025-10-07 23:26:03.383929	phakphokthum-rural-municipality	\N	\N
10306	Mangsebung Rural Municipality	municipality	103	2025-10-07 23:26:03.383929	mangsebung-rural-municipality	\N	\N
10307	Rong Rural Municipality	municipality	103	2025-10-07 23:26:03.383929	rong-rural-municipality	\N	\N
10308	Sandakpur Rural Municipality	municipality	103	2025-10-07 23:26:03.383929	sandakpur-rural-municipality	\N	\N
10309	Chulachuli Rural Municipality	municipality	103	2025-10-07 23:26:03.383929	chulachuli-rural-municipality	\N	\N
10310	Maijogmai Rural Municipality	municipality	103	2025-10-07 23:26:03.383929	maijogmai-rural-municipality	\N	\N
10401	Bhadrapur Municipality	municipality	104	2025-10-07 23:26:03.384511	bhadrapur-municipality	\N	\N
10402	Mechinagar Municipality	municipality	104	2025-10-07 23:26:03.384511	mechinagar-municipality	\N	\N
10406	Kankai Municipality	municipality	104	2025-10-07 23:26:03.384511	kankai-municipality	\N	\N
10407	Shivasatakshi Municipality	municipality	104	2025-10-07 23:26:03.384511	shivasatakshi-municipality	\N	\N
10408	Kamal Rural Municipality	municipality	104	2025-10-07 23:26:03.384511	kamal-rural-municipality	\N	\N
10409	Gauriganj Rural Municipality	municipality	104	2025-10-07 23:26:03.384511	gauriganj-rural-municipality	\N	\N
10410	Haldibari Rural Municipality	municipality	104	2025-10-07 23:26:03.384511	haldibari-rural-municipality	\N	\N
10411	Jhapa Rural Municipality	municipality	104	2025-10-07 23:26:03.384511	jhapa-rural-municipality	\N	\N
10412	Barhadashi Rural Municipality	municipality	104	2025-10-07 23:26:03.384511	barhadashi-rural-municipality	\N	\N
10413	Buddhashanti Rural Municipality	municipality	104	2025-10-07 23:26:03.384511	buddhashanti-rural-municipality	\N	\N
10414	Kachankawal Rural Municipality	municipality	104	2025-10-07 23:26:03.384511	kachankawal-rural-municipality	\N	\N
10415	Birtamod Municipality	municipality	104	2025-10-07 23:26:03.384511	birtamod-municipality	\N	\N
10501	Diktel Rupakot Majhuwagadhi Municipality	municipality	105	2025-10-07 23:26:03.385246	diktel-rupakot-majhuwagadhi-municipality	\N	\N
10502	Halesi Tuwachung Municipality	municipality	105	2025-10-07 23:26:03.385246	halesi-tuwachung-municipality	\N	\N
10503	Khotehang Rural Municipality	municipality	105	2025-10-07 23:26:03.385246	khotehang-rural-municipality	\N	\N
10504	Diprung Rural Municipality	municipality	105	2025-10-07 23:26:03.385246	diprung-rural-municipality	\N	\N
10505	Aiselukharka Rural Municipality	municipality	105	2025-10-07 23:26:03.385246	aiselukharka-rural-municipality	\N	\N
10506	Jantedhunga Rural Municipality	municipality	105	2025-10-07 23:26:03.385246	jantedhunga-rural-municipality	\N	\N
10507	Kepilasgadhi Rural Municipality	municipality	105	2025-10-07 23:26:03.385246	kepilasgadhi-rural-municipality	\N	\N
10508	Barahapokhari Rural Municipality	municipality	105	2025-10-07 23:26:03.385246	barahapokhari-rural-municipality	\N	\N
10509	Rawabesi Rural Municipality	municipality	105	2025-10-07 23:26:03.385246	rawabesi-rural-municipality	\N	\N
10510	Sakela Rural Municipality	municipality	105	2025-10-07 23:26:03.385246	sakela-rural-municipality	\N	\N
10601	Biratnagar Metropolitan City	municipality	106	2025-10-07 23:26:03.385858	biratnagar-metropolitan-city	\N	\N
10602	Sundarharaicha Municipality	municipality	106	2025-10-07 23:26:03.385858	sundarharaicha-municipality	\N	\N
10603	Belbari Municipality	municipality	106	2025-10-07 23:26:03.385858	belbari-municipality	\N	\N
10604	Pathari Sanischare Municipality	municipality	106	2025-10-07 23:26:03.385858	pathari-sanischare-municipality	\N	\N
10605	Urlabari Municipality	municipality	106	2025-10-07 23:26:03.385858	urlabari-municipality	\N	\N
10606	Rangeli Municipality	municipality	106	2025-10-07 23:26:03.385858	rangeli-municipality	\N	\N
10607	Letang Municipality	municipality	106	2025-10-07 23:26:03.385858	letang-municipality	\N	\N
10608	Sunbarshi Municipality	municipality	106	2025-10-07 23:26:03.385858	sunbarshi-municipality	\N	\N
10609	Budhiganga Rural Municipality	municipality	106	2025-10-07 23:26:03.385858	budhiganga-rural-municipality	\N	\N
10610	Gramthan Rural Municipality	municipality	106	2025-10-07 23:26:03.385858	gramthan-rural-municipality	\N	\N
10611	Jahada Rural Municipality	municipality	106	2025-10-07 23:26:03.385858	jahada-rural-municipality	\N	\N
10612	Kanepokhari Rural Municipality	municipality	106	2025-10-07 23:26:03.385858	kanepokhari-rural-municipality	\N	\N
10613	Katahari Rural Municipality	municipality	106	2025-10-07 23:26:03.385858	katahari-rural-municipality	\N	\N
10614	Kerabari Rural Municipality	municipality	106	2025-10-07 23:26:03.385858	kerabari-rural-municipality	\N	\N
10616	Dhanpalthan Rural Municipality	municipality	106	2025-10-07 23:26:03.385858	dhanpalthan-rural-municipality	\N	\N
10617	Ratuwamai Municipality	municipality	106	2025-10-07 23:26:03.385858	ratuwamai-municipality	\N	\N
10701	Siddhicharan Municipality	municipality	107	2025-10-07 23:26:03.386542	siddhicharan-municipality	\N	\N
10702	Champadevi Rural Municipality	municipality	107	2025-10-07 23:26:03.386542	champadevi-rural-municipality	\N	\N
10703	Chisankhugadhi Rural Municipality	municipality	107	2025-10-07 23:26:03.386542	chisankhugadhi-rural-municipality	\N	\N
10704	Khijidemba Rural Municipality	municipality	107	2025-10-07 23:26:03.386542	khijidemba-rural-municipality	\N	\N
10706	Manebhanjyang Rural Municipality	municipality	107	2025-10-07 23:26:03.386542	manebhanjyang-rural-municipality	\N	\N
10707	Molung Rural Municipality	municipality	107	2025-10-07 23:26:03.386542	molung-rural-municipality	\N	\N
10801	Phidim Municipality	municipality	108	2025-10-07 23:26:03.387061	phidim-municipality	\N	\N
10802	Hilihang Rural Municipality	municipality	108	2025-10-07 23:26:03.387061	hilihang-rural-municipality	\N	\N
10803	Kummayak Rural Municipality	municipality	108	2025-10-07 23:26:03.387061	kummayak-rural-municipality	\N	\N
10805	Phalelung Rural Municipality	municipality	108	2025-10-07 23:26:03.387061	phalelung-rural-municipality	\N	\N
10806	Phalgunanda Rural Municipality	municipality	108	2025-10-07 23:26:03.387061	phalgunanda-rural-municipality	\N	\N
10807	Tumbewa Rural Municipality	municipality	108	2025-10-07 23:26:03.387061	tumbewa-rural-municipality	\N	\N
10808	Yangwarak Rural Municipality	municipality	108	2025-10-07 23:26:03.387061	yangwarak-rural-municipality	\N	\N
10901	Khandbari Municipality	municipality	109	2025-10-07 23:26:03.38749	khandbari-municipality	\N	\N
10902	Chainpur Municipality	municipality	109	2025-10-07 23:26:03.38749	chainpur-municipality	\N	\N
10903	Dharmadevi Municipality	municipality	109	2025-10-07 23:26:03.38749	dharmadevi-municipality	\N	\N
10905	Panchkhapan Municipality	municipality	109	2025-10-07 23:26:03.38749	panchkhapan-municipality	\N	\N
10906	Makalu Rural Municipality	municipality	109	2025-10-07 23:26:03.38749	makalu-rural-municipality	\N	\N
10907	Silichong Rural Municipality	municipality	109	2025-10-07 23:26:03.38749	silichong-rural-municipality	\N	\N
10908	Sabhapokhari Rural Municipality	municipality	109	2025-10-07 23:26:03.38749	sabhapokhari-rural-municipality	\N	\N
10909	Chichila Rural Municipality	municipality	109	2025-10-07 23:26:03.38749	chichila-rural-municipality	\N	\N
10910	Bhotkhola Rural Municipality	municipality	109	2025-10-07 23:26:03.38749	bhotkhola-rural-municipality	\N	\N
11001	Solududhakunda Municipality	municipality	110	2025-10-07 23:26:03.387944	solududhakunda-municipality	\N	\N
11002	Khumbu Pasanglhamu Rural Municipality	municipality	110	2025-10-07 23:26:03.387944	khumbu-pasanglhamu-rural-municipality	\N	\N
11003	Mahakulung Rural Municipality	municipality	110	2025-10-07 23:26:03.387944	mahakulung-rural-municipality	\N	\N
11004	Necha Salyan Rural Municipality	municipality	110	2025-10-07 23:26:03.387944	necha-salyan-rural-municipality	\N	\N
11005	Sotang Rural Municipality	municipality	110	2025-10-07 23:26:03.387944	sotang-rural-municipality	\N	\N
11006	Likhupike Rural Municipality	municipality	110	2025-10-07 23:26:03.387944	likhupike-rural-municipality	\N	\N
11007	Thulung Dudhkoshi Rural Municipality	municipality	110	2025-10-07 23:26:03.387944	thulung-dudhkoshi-rural-municipality	\N	\N
11008	Mapya Dudhkoshi Rural Municipality	municipality	110	2025-10-07 23:26:03.387944	mapya-dudhkoshi-rural-municipality	\N	\N
11101	Itahari Sub-Metropolitan City	municipality	111	2025-10-07 23:26:03.388389	itahari-sub-metropolitan-city	\N	\N
11102	Dharan Sub-Metropolitan City	municipality	111	2025-10-07 23:26:03.388389	dharan-sub-metropolitan-city	\N	\N
11103	Inaruwa Municipality	municipality	111	2025-10-07 23:26:03.388389	inaruwa-municipality	\N	\N
11104	Duhabi Municipality	municipality	111	2025-10-07 23:26:03.388389	duhabi-municipality	\N	\N
11105	Ramdhuni Municipality	municipality	111	2025-10-07 23:26:03.388389	ramdhuni-municipality	\N	\N
11106	Barahachhetra Municipality	municipality	111	2025-10-07 23:26:03.388389	barahachhetra-municipality	\N	\N
11107	Koshi Rural Municipality	municipality	111	2025-10-07 23:26:03.388389	koshi-rural-municipality	\N	\N
11108	Gadhi Rural Municipality	municipality	111	2025-10-07 23:26:03.388389	gadhi-rural-municipality	\N	\N
11109	Barjung Rural Municipality	municipality	111	2025-10-07 23:26:03.388389	barjung-rural-municipality	\N	\N
11110	Bhokraha Rural Municipality	municipality	111	2025-10-07 23:26:03.388389	bhokraha-rural-municipality	\N	\N
11111	Harinagar Rural Municipality	municipality	111	2025-10-07 23:26:03.388389	harinagar-rural-municipality	\N	\N
11112	Dewanganj Rural Municipality	municipality	111	2025-10-07 23:26:03.388389	dewanganj-rural-municipality	\N	\N
11201	Phungling Municipality	municipality	112	2025-10-07 23:26:03.388925	phungling-municipality	\N	\N
11202	Aathrai Triveni Rural Municipality	municipality	112	2025-10-07 23:26:03.388925	aathrai-triveni-rural-municipality	\N	\N
11203	Sidingwa Rural Municipality	municipality	112	2025-10-07 23:26:03.388925	sidingwa-rural-municipality	\N	\N
11204	Phaktanglung Rural Municipality	municipality	112	2025-10-07 23:26:03.388925	phaktanglung-rural-municipality	\N	\N
11205	Meringden Rural Municipality	municipality	112	2025-10-07 23:26:03.388925	meringden-rural-municipality	\N	\N
10615	Miklajung Rural Municipality (Morang)	municipality	106	2025-10-07 23:26:03.385858	miklajung-rural-municipality-morang-	\N	\N
11207	Mikwakhola Rural Municipality	municipality	112	2025-10-07 23:26:03.388925	mikwakhola-rural-municipality	\N	\N
11208	Pathivara Yangwarak Rural Municipality	municipality	112	2025-10-07 23:26:03.388925	pathivara-yangwarak-rural-municipality	\N	\N
11209	Sirijangha Rural Municipality	municipality	112	2025-10-07 23:26:03.388925	sirijangha-rural-municipality	\N	\N
11301	Myanglung Municipality	municipality	113	2025-10-07 23:26:03.389386	myanglung-municipality	\N	\N
11302	Laligurans Municipality	municipality	113	2025-10-07 23:26:03.389386	laligurans-municipality	\N	\N
11303	Aathrai Rural Municipality	municipality	113	2025-10-07 23:26:03.389386	aathrai-rural-municipality	\N	\N
11304	Chhathar Rural Municipality	municipality	113	2025-10-07 23:26:03.389386	chhathar-rural-municipality	\N	\N
11305	Phedap Rural Municipality	municipality	113	2025-10-07 23:26:03.389386	phedap-rural-municipality	\N	\N
11306	Menchhayayem Rural Municipality	municipality	113	2025-10-07 23:26:03.389386	menchhayayem-rural-municipality	\N	\N
11401	Triyuga Municipality	municipality	114	2025-10-07 23:26:03.389764	triyuga-municipality	\N	\N
11402	Katari Municipality	municipality	114	2025-10-07 23:26:03.389764	katari-municipality	\N	\N
11403	Chaudandigadhi Municipality	municipality	114	2025-10-07 23:26:03.389764	chaudandigadhi-municipality	\N	\N
11404	Belaka Municipality	municipality	114	2025-10-07 23:26:03.389764	belaka-municipality	\N	\N
11405	Udayapurgadhi Rural Municipality	municipality	114	2025-10-07 23:26:03.389764	udayapurgadhi-rural-municipality	\N	\N
11406	Rautamai Rural Municipality	municipality	114	2025-10-07 23:26:03.389764	rautamai-rural-municipality	\N	\N
11407	Tapli Rural Municipality	municipality	114	2025-10-07 23:26:03.389764	tapli-rural-municipality	\N	\N
11408	Limchungbung Rural Municipality	municipality	114	2025-10-07 23:26:03.389764	limchungbung-rural-municipality	\N	\N
2	Madhesh Province	province	\N	2025-10-07 23:26:03.391072	madhesh-province	\N	\N
201	Bara	district	2	2025-10-07 23:26:03.39129	bara	\N	\N
202	Dhanusha	district	2	2025-10-07 23:26:03.39129	dhanusha	\N	\N
203	Mahottari	district	2	2025-10-07 23:26:03.39129	mahottari	\N	\N
204	Parsa	district	2	2025-10-07 23:26:03.39129	parsa	\N	\N
205	Rautahat	district	2	2025-10-07 23:26:03.39129	rautahat	\N	\N
206	Saptari	district	2	2025-10-07 23:26:03.39129	saptari	\N	\N
207	Sarlahi	district	2	2025-10-07 23:26:03.39129	sarlahi	\N	\N
208	Siraha	district	2	2025-10-07 23:26:03.39129	siraha	\N	\N
20101	Kalaiya Sub-Metropolitan City	municipality	201	2025-10-07 23:26:03.391754	kalaiya-sub-metropolitan-city	\N	\N
20102	Jeetpur Simara Sub-Metropolitan City	municipality	201	2025-10-07 23:26:03.391754	jeetpur-simara-sub-metropolitan-city	\N	\N
20103	Nijgadh Municipality	municipality	201	2025-10-07 23:26:03.391754	nijgadh-municipality	\N	\N
20104	Kolhabi Municipality	municipality	201	2025-10-07 23:26:03.391754	kolhabi-municipality	\N	\N
20105	Mahagadhimai Municipality	municipality	201	2025-10-07 23:26:03.391754	mahagadhimai-municipality	\N	\N
20106	Simraungadh Municipality	municipality	201	2025-10-07 23:26:03.391754	simraungadh-municipality	\N	\N
20107	Pachrauta Municipality	municipality	201	2025-10-07 23:26:03.391754	pachrauta-municipality	\N	\N
20108	Pheta Rural Municipality	municipality	201	2025-10-07 23:26:03.391754	pheta-rural-municipality	\N	\N
20109	Bishrampur Rural Municipality	municipality	201	2025-10-07 23:26:03.391754	bishrampur-rural-municipality	\N	\N
20110	Prasauni Rural Municipality	municipality	201	2025-10-07 23:26:03.391754	prasauni-rural-municipality	\N	\N
20111	Suvarna Rural Municipality	municipality	201	2025-10-07 23:26:03.391754	suvarna-rural-municipality	\N	\N
20112	Baragadhi Rural Municipality	municipality	201	2025-10-07 23:26:03.391754	baragadhi-rural-municipality	\N	\N
20113	Parwanipur Rural Municipality	municipality	201	2025-10-07 23:26:03.391754	parwanipur-rural-municipality	\N	\N
20114	Adarsh Kotwal Rural Municipality	municipality	201	2025-10-07 23:26:03.391754	adarsh-kotwal-rural-municipality	\N	\N
20115	Karaiyamai Rural Municipality	municipality	201	2025-10-07 23:26:03.391754	karaiyamai-rural-municipality	\N	\N
20116	Devtal Rural Municipality	municipality	201	2025-10-07 23:26:03.391754	devtal-rural-municipality	\N	\N
20201	Janakpur Sub-Metropolitan City	municipality	202	2025-10-07 23:26:03.392582	janakpur-sub-metropolitan-city	\N	\N
20202	Chhireshwarnath Municipality	municipality	202	2025-10-07 23:26:03.392582	chhireshwarnath-municipality	\N	\N
20203	Ganeshman Charnath Municipality	municipality	202	2025-10-07 23:26:03.392582	ganeshman-charnath-municipality	\N	\N
20204	Dhanushadham Municipality	municipality	202	2025-10-07 23:26:03.392582	dhanushadham-municipality	\N	\N
20205	Mithila Municipality	municipality	202	2025-10-07 23:26:03.392582	mithila-municipality	\N	\N
20206	Shahidnagar Municipality	municipality	202	2025-10-07 23:26:03.392582	shahidnagar-municipality	\N	\N
20207	Sabaila Municipality	municipality	202	2025-10-07 23:26:03.392582	sabaila-municipality	\N	\N
20208	Nagarain Municipality	municipality	202	2025-10-07 23:26:03.392582	nagarain-municipality	\N	\N
20209	Kamala Municipality	municipality	202	2025-10-07 23:26:03.392582	kamala-municipality	\N	\N
20210	Bateshwar Rural Municipality	municipality	202	2025-10-07 23:26:03.392582	bateshwar-rural-municipality	\N	\N
20211	Mukhiyapatti Musaharmiya Rural Municipality	municipality	202	2025-10-07 23:26:03.392582	mukhiyapatti-musaharmiya-rural-municipality	\N	\N
20212	Aaurahi Rural Municipality	municipality	202	2025-10-07 23:26:03.392582	aaurahi-rural-municipality	\N	\N
20213	Janak Nandini Rural Municipality	municipality	202	2025-10-07 23:26:03.392582	janak-nandini-rural-municipality	\N	\N
20214	Laxminiya Rural Municipality	municipality	202	2025-10-07 23:26:03.392582	laxminiya-rural-municipality	\N	\N
20215	Hansapur Municipality	municipality	202	2025-10-07 23:26:03.392582	hansapur-municipality	\N	\N
20216	Dhanauji Rural Municipality	municipality	202	2025-10-07 23:26:03.392582	dhanauji-rural-municipality	\N	\N
20217	Mithila Bihari Municipality	municipality	202	2025-10-07 23:26:03.392582	mithila-bihari-municipality	\N	\N
20218	Bideha Municipality	municipality	202	2025-10-07 23:26:03.392582	bideha-municipality	\N	\N
20301	Jaleshwar Municipality	municipality	203	2025-10-07 23:26:03.393361	jaleshwar-municipality	\N	\N
20302	Bardibas Municipality	municipality	203	2025-10-07 23:26:03.393361	bardibas-municipality	\N	\N
20303	Gaushala Municipality	municipality	203	2025-10-07 23:26:03.393361	gaushala-municipality	\N	\N
20304	Loharpatti Municipality	municipality	203	2025-10-07 23:26:03.393361	loharpatti-municipality	\N	\N
20305	Ramgopalpur Municipality	municipality	203	2025-10-07 23:26:03.393361	ramgopalpur-municipality	\N	\N
20306	Manara Shiswa Municipality	municipality	203	2025-10-07 23:26:03.393361	manara-shiswa-municipality	\N	\N
20307	Matihani Municipality	municipality	203	2025-10-07 23:26:03.393361	matihani-municipality	\N	\N
20308	Balwa Municipality	municipality	203	2025-10-07 23:26:03.393361	balwa-municipality	\N	\N
20309	Bhangaha Municipality	municipality	203	2025-10-07 23:26:03.393361	bhangaha-municipality	\N	\N
20311	Ekdara Rural Municipality	municipality	203	2025-10-07 23:26:03.393361	ekdara-rural-municipality	\N	\N
20312	Mahottari Rural Municipality	municipality	203	2025-10-07 23:26:03.393361	mahottari-rural-municipality	\N	\N
20313	Pipra Rural Municipality	municipality	203	2025-10-07 23:26:03.393361	pipra-rural-municipality	\N	\N
20314	Samsi Rural Municipality	municipality	203	2025-10-07 23:26:03.393361	samsi-rural-municipality	\N	\N
20315	Sonama Rural Municipality	municipality	203	2025-10-07 23:26:03.393361	sonama-rural-municipality	\N	\N
20401	Birgunj Metropolitan City	municipality	204	2025-10-07 23:26:03.394093	birgunj-metropolitan-city	\N	\N
20402	Bahudaramai Municipality	municipality	204	2025-10-07 23:26:03.394093	bahudaramai-municipality	\N	\N
20403	Parsagadhi Municipality	municipality	204	2025-10-07 23:26:03.394093	parsagadhi-municipality	\N	\N
20404	Pokhariya Municipality	municipality	204	2025-10-07 23:26:03.394093	pokhariya-municipality	\N	\N
20405	Bindabasini Rural Municipality	municipality	204	2025-10-07 23:26:03.394093	bindabasini-rural-municipality	\N	\N
20406	Dhobini Rural Municipality	municipality	204	2025-10-07 23:26:03.394093	dhobini-rural-municipality	\N	\N
20407	Chhipaharmai Rural Municipality	municipality	204	2025-10-07 23:26:03.394093	chhipaharmai-rural-municipality	\N	\N
20408	Jagarnathpur Rural Municipality	municipality	204	2025-10-07 23:26:03.394093	jagarnathpur-rural-municipality	\N	\N
20409	Jirabhawani Rural Municipality	municipality	204	2025-10-07 23:26:03.394093	jirabhawani-rural-municipality	\N	\N
20410	Kalikamai Rural Municipality	municipality	204	2025-10-07 23:26:03.394093	kalikamai-rural-municipality	\N	\N
20411	Paterwa Sugauli Rural Municipality	municipality	204	2025-10-07 23:26:03.394093	paterwa-sugauli-rural-municipality	\N	\N
20412	Sakhuwa Prasauni Rural Municipality	municipality	204	2025-10-07 23:26:03.394093	sakhuwa-prasauni-rural-municipality	\N	\N
20413	Thori Rural Municipality	municipality	204	2025-10-07 23:26:03.394093	thori-rural-municipality	\N	\N
20414	Pakaha Mainpur Rural Municipality	municipality	204	2025-10-07 23:26:03.394093	pakaha-mainpur-rural-municipality	\N	\N
20501	Chandrapur Municipality	municipality	205	2025-10-07 23:26:03.394754	chandrapur-municipality	\N	\N
20502	Garuda Municipality	municipality	205	2025-10-07 23:26:03.394754	garuda-municipality	\N	\N
20503	Gaur Municipality	municipality	205	2025-10-07 23:26:03.394754	gaur-municipality	\N	\N
20504	Baudhimai Municipality	municipality	205	2025-10-07 23:26:03.394754	baudhimai-municipality	\N	\N
20505	Brindaban Municipality	municipality	205	2025-10-07 23:26:03.394754	brindaban-municipality	\N	\N
20509	Ishnath Municipality	municipality	205	2025-10-07 23:26:03.394754	ishnath-municipality	\N	\N
20510	Katahariya Municipality	municipality	205	2025-10-07 23:26:03.394754	katahariya-municipality	\N	\N
20511	Madhav Narayan Municipality	municipality	205	2025-10-07 23:26:03.394754	madhav-narayan-municipality	\N	\N
20512	Maulapur Municipality	municipality	205	2025-10-07 23:26:03.394754	maulapur-municipality	\N	\N
20513	Paroha Municipality	municipality	205	2025-10-07 23:26:03.394754	paroha-municipality	\N	\N
20514	Phatuwa Bijayapur Municipality	municipality	205	2025-10-07 23:26:03.394754	phatuwa-bijayapur-municipality	\N	\N
20515	Rajdevi Municipality	municipality	205	2025-10-07 23:26:03.394754	rajdevi-municipality	\N	\N
20516	Rajpur Municipality	municipality	205	2025-10-07 23:26:03.394754	rajpur-municipality	\N	\N
20517	Durga Bhagwati Rural Municipality	municipality	205	2025-10-07 23:26:03.394754	durga-bhagwati-rural-municipality	\N	\N
20518	Yamunamai Rural Municipality	municipality	205	2025-10-07 23:26:03.394754	yamunamai-rural-municipality	\N	\N
20601	Rajbiraj Municipality	municipality	206	2025-10-07 23:26:03.395595	rajbiraj-municipality	\N	\N
20602	Bodebarsain Municipality	municipality	206	2025-10-07 23:26:03.395595	bodebarsain-municipality	\N	\N
20603	Dakneshwari Municipality	municipality	206	2025-10-07 23:26:03.395595	dakneshwari-municipality	\N	\N
20604	Hanumannagar Kankalini Municipality	municipality	206	2025-10-07 23:26:03.395595	hanumannagar-kankalini-municipality	\N	\N
20605	Kanchanrup Municipality	municipality	206	2025-10-07 23:26:03.395595	kanchanrup-municipality	\N	\N
20606	Khadak Municipality	municipality	206	2025-10-07 23:26:03.395595	khadak-municipality	\N	\N
20607	Shambhunath Municipality	municipality	206	2025-10-07 23:26:03.395595	shambhunath-municipality	\N	\N
20608	Saptakoshi Municipality	municipality	206	2025-10-07 23:26:03.395595	saptakoshi-municipality	\N	\N
20609	Surunga Municipality	municipality	206	2025-10-07 23:26:03.395595	surunga-municipality	\N	\N
20610	Agnisair Krishna Savaran Rural Municipality	municipality	206	2025-10-07 23:26:03.395595	agnisair-krishna-savaran-rural-municipality	\N	\N
20612	Chhinnamasta Rural Municipality	municipality	206	2025-10-07 23:26:03.395595	chhinnamasta-rural-municipality	\N	\N
20613	Mahadeva Rural Municipality	municipality	206	2025-10-07 23:26:03.395595	mahadeva-rural-municipality	\N	\N
20614	Rajgadh Rural Municipality	municipality	206	2025-10-07 23:26:03.395595	rajgadh-rural-municipality	\N	\N
20615	Rupani Rural Municipality	municipality	206	2025-10-07 23:26:03.395595	rupani-rural-municipality	\N	\N
20616	Tirahut Rural Municipality	municipality	206	2025-10-07 23:26:03.395595	tirahut-rural-municipality	\N	\N
20617	Tilathi Koiladi Rural Municipality	municipality	206	2025-10-07 23:26:03.395595	tilathi-koiladi-rural-municipality	\N	\N
20618	Balan Bihul Rural Municipality	municipality	206	2025-10-07 23:26:03.395595	balan-bihul-rural-municipality	\N	\N
20701	Bagmati Municipality	municipality	207	2025-10-07 23:26:03.396455	bagmati-municipality	\N	\N
20702	Balara Municipality	municipality	207	2025-10-07 23:26:03.396455	balara-municipality	\N	\N
20703	Barahathwa Municipality	municipality	207	2025-10-07 23:26:03.396455	barahathwa-municipality	\N	\N
20704	Godaita Municipality	municipality	207	2025-10-07 23:26:03.396455	godaita-municipality	\N	\N
20705	Haripur Municipality	municipality	207	2025-10-07 23:26:03.396455	haripur-municipality	\N	\N
20706	Haripurwa Municipality	municipality	207	2025-10-07 23:26:03.396455	haripurwa-municipality	\N	\N
20707	Hariwan Municipality	municipality	207	2025-10-07 23:26:03.396455	hariwan-municipality	\N	\N
20708	Ishworpur Municipality	municipality	207	2025-10-07 23:26:03.396455	ishworpur-municipality	\N	\N
20709	Kabilasi Municipality	municipality	207	2025-10-07 23:26:03.396455	kabilasi-municipality	\N	\N
20710	Lalbandi Municipality	municipality	207	2025-10-07 23:26:03.396455	lalbandi-municipality	\N	\N
20711	Malangwa Municipality	municipality	207	2025-10-07 23:26:03.396455	malangwa-municipality	\N	\N
20712	Basbariya Rural Municipality	municipality	207	2025-10-07 23:26:03.396455	basbariya-rural-municipality	\N	\N
20713	Bishnu Rural Municipality	municipality	207	2025-10-07 23:26:03.396455	bishnu-rural-municipality	\N	\N
20714	Brahmapuri Rural Municipality	municipality	207	2025-10-07 23:26:03.396455	brahmapuri-rural-municipality	\N	\N
20715	Chakraghatta Rural Municipality	municipality	207	2025-10-07 23:26:03.396455	chakraghatta-rural-municipality	\N	\N
20716	Chandranagar Rural Municipality	municipality	207	2025-10-07 23:26:03.396455	chandranagar-rural-municipality	\N	\N
20717	Dhankaul Rural Municipality	municipality	207	2025-10-07 23:26:03.396455	dhankaul-rural-municipality	\N	\N
20718	Kaudena Rural Municipality	municipality	207	2025-10-07 23:26:03.396455	kaudena-rural-municipality	\N	\N
20719	Parsa Rural Municipality	municipality	207	2025-10-07 23:26:03.396455	parsa-rural-municipality	\N	\N
20720	Ramnagar Rural Municipality	municipality	207	2025-10-07 23:26:03.396455	ramnagar-rural-municipality	\N	\N
20802	Dhangadhimai Municipality	municipality	208	2025-10-07 23:26:03.397307	dhangadhimai-municipality	\N	\N
20803	Siraha Municipality	municipality	208	2025-10-07 23:26:03.397307	siraha-municipality	\N	\N
20804	Golbazar Municipality	municipality	208	2025-10-07 23:26:03.397307	golbazar-municipality	\N	\N
20805	Mirchaiya Municipality	municipality	208	2025-10-07 23:26:03.397307	mirchaiya-municipality	\N	\N
20806	Kalyanpur Municipality	municipality	208	2025-10-07 23:26:03.397307	kalyanpur-municipality	\N	\N
20807	Karjanha Municipality	municipality	208	2025-10-07 23:26:03.397307	karjanha-municipality	\N	\N
20808	Sukhipur Municipality	municipality	208	2025-10-07 23:26:03.397307	sukhipur-municipality	\N	\N
20809	Bhagwanpur Rural Municipality	municipality	208	2025-10-07 23:26:03.397307	bhagwanpur-rural-municipality	\N	\N
20812	Bariyarpatti Rural Municipality	municipality	208	2025-10-07 23:26:03.397307	bariyarpatti-rural-municipality	\N	\N
20813	Laxmipur Patari Rural Municipality	municipality	208	2025-10-07 23:26:03.397307	laxmipur-patari-rural-municipality	\N	\N
20814	Naraha Rural Municipality	municipality	208	2025-10-07 23:26:03.397307	naraha-rural-municipality	\N	\N
20815	Sakhuwa Nankarkatti Rural Municipality	municipality	208	2025-10-07 23:26:03.397307	sakhuwa-nankarkatti-rural-municipality	\N	\N
20816	Arnama Rural Municipality	municipality	208	2025-10-07 23:26:03.397307	arnama-rural-municipality	\N	\N
20817	Navarajpur Rural Municipality	municipality	208	2025-10-07 23:26:03.397307	navarajpur-rural-municipality	\N	\N
3	Bagmati Province	province	\N	2025-10-07 23:26:03.398054	bagmati-province	\N	\N
301	Kathmandu	district	3	2025-10-07 23:26:03.398315	kathmandu	\N	\N
302	Lalitpur	district	3	2025-10-07 23:26:03.398315	lalitpur	\N	\N
304	Chitwan	district	3	2025-10-07 23:26:03.398315	chitwan	\N	\N
305	Makwanpur	district	3	2025-10-07 23:26:03.398315	makwanpur	\N	\N
306	Dhading	district	3	2025-10-07 23:26:03.398315	dhading	\N	\N
307	Nuwakot	district	3	2025-10-07 23:26:03.398315	nuwakot	\N	\N
308	Rasuwa	district	3	2025-10-07 23:26:03.398315	rasuwa	\N	\N
309	Sindhuli	district	3	2025-10-07 23:26:03.398315	sindhuli	\N	\N
310	Ramechhap	district	3	2025-10-07 23:26:03.398315	ramechhap	\N	\N
311	Dolakha	district	3	2025-10-07 23:26:03.398315	dolakha	\N	\N
312	Sindhupalchok	district	3	2025-10-07 23:26:03.398315	sindhupalchok	\N	\N
313	Kavrepalanchok	district	3	2025-10-07 23:26:03.398315	kavrepalanchok	\N	\N
30101	Kathmandu Metropolitan City	municipality	301	2025-10-07 23:26:03.399033	kathmandu-metropolitan-city	\N	\N
30102	Budhanilkantha Municipality	municipality	301	2025-10-07 23:26:03.399033	budhanilkantha-municipality	\N	\N
30103	Chandragiri Municipality	municipality	301	2025-10-07 23:26:03.399033	chandragiri-municipality	\N	\N
30104	Dakshinkali Municipality	municipality	301	2025-10-07 23:26:03.399033	dakshinkali-municipality	\N	\N
30105	Gokarneshwor Municipality	municipality	301	2025-10-07 23:26:03.399033	gokarneshwor-municipality	\N	\N
30106	Kageshwori Manohara Municipality	municipality	301	2025-10-07 23:26:03.399033	kageshwori-manohara-municipality	\N	\N
30107	Kirtipur Municipality	municipality	301	2025-10-07 23:26:03.399033	kirtipur-municipality	\N	\N
30108	Nagarjun Municipality	municipality	301	2025-10-07 23:26:03.399033	nagarjun-municipality	\N	\N
30109	Shankharapur Municipality	municipality	301	2025-10-07 23:26:03.399033	shankharapur-municipality	\N	\N
30110	Tarakeshwar Municipality	municipality	301	2025-10-07 23:26:03.399033	tarakeshwar-municipality	\N	\N
30111	Tokha Municipality	municipality	301	2025-10-07 23:26:03.399033	tokha-municipality	\N	\N
30201	Lalitpur Metropolitan City	municipality	302	2025-10-07 23:26:03.399696	lalitpur-metropolitan-city	\N	\N
30204	Konjyosom Rural Municipality	municipality	302	2025-10-07 23:26:03.399696	konjyosom-rural-municipality	\N	\N
30303	Madhyapur Thimi Municipality	municipality	303	2025-10-07 23:26:03.400181	madhyapur-thimi-municipality	\N	\N
30304	Suryabinayak Municipality	municipality	303	2025-10-07 23:26:03.400181	suryabinayak-municipality	\N	\N
30401	Bharatpur Metropolitan City	municipality	304	2025-10-07 23:26:03.40064	bharatpur-metropolitan-city	\N	\N
30402	Kalika Municipality	municipality	304	2025-10-07 23:26:03.40064	kalika-municipality	\N	\N
30403	Khairahani Municipality	municipality	304	2025-10-07 23:26:03.40064	khairahani-municipality	\N	\N
30405	Ratnanagar Municipality	municipality	304	2025-10-07 23:26:03.40064	ratnanagar-municipality	\N	\N
30406	Rapti Municipality	municipality	304	2025-10-07 23:26:03.40064	rapti-municipality	\N	\N
30407	Ichchhakamana Rural Municipality	municipality	304	2025-10-07 23:26:03.40064	ichchhakamana-rural-municipality	\N	\N
30501	Hetauda Sub-Metropolitan City	municipality	305	2025-10-07 23:26:03.401161	hetauda-sub-metropolitan-city	\N	\N
30502	Thaha Municipality	municipality	305	2025-10-07 23:26:03.401161	thaha-municipality	\N	\N
30503	Bhimphedi Rural Municipality	municipality	305	2025-10-07 23:26:03.401161	bhimphedi-rural-municipality	\N	\N
30504	Makawanpurgadhi Rural Municipality	municipality	305	2025-10-07 23:26:03.401161	makawanpurgadhi-rural-municipality	\N	\N
30505	Manahari Rural Municipality	municipality	305	2025-10-07 23:26:03.401161	manahari-rural-municipality	\N	\N
30506	Raksirang Rural Municipality	municipality	305	2025-10-07 23:26:03.401161	raksirang-rural-municipality	\N	\N
30507	Bakaiya Rural Municipality	municipality	305	2025-10-07 23:26:03.401161	bakaiya-rural-municipality	\N	\N
30509	Kailash Rural Municipality	municipality	305	2025-10-07 23:26:03.401161	kailash-rural-municipality	\N	\N
30510	Indrasarowar Rural Municipality	municipality	305	2025-10-07 23:26:03.401161	indrasarowar-rural-municipality	\N	\N
30601	Dhading Besi Municipality	municipality	306	2025-10-07 23:26:03.401789	dhading-besi-municipality	\N	\N
30602	Nilkantha Municipality	municipality	306	2025-10-07 23:26:03.401789	nilkantha-municipality	\N	\N
30603	Khaniyabas Rural Municipality	municipality	306	2025-10-07 23:26:03.401789	khaniyabas-rural-municipality	\N	\N
30604	Gajuri Rural Municipality	municipality	306	2025-10-07 23:26:03.401789	gajuri-rural-municipality	\N	\N
30605	Galchi Rural Municipality	municipality	306	2025-10-07 23:26:03.401789	galchi-rural-municipality	\N	\N
30606	Gangajamuna Rural Municipality	municipality	306	2025-10-07 23:26:03.401789	gangajamuna-rural-municipality	\N	\N
30607	Jwalamukhi Rural Municipality	municipality	306	2025-10-07 23:26:03.401789	jwalamukhi-rural-municipality	\N	\N
30608	Netrawati Dabjong Rural Municipality	municipality	306	2025-10-07 23:26:03.401789	netrawati-dabjong-rural-municipality	\N	\N
30609	Benighat Rorang Rural Municipality	municipality	306	2025-10-07 23:26:03.401789	benighat-rorang-rural-municipality	\N	\N
30610	Ruby Valley Rural Municipality	municipality	306	2025-10-07 23:26:03.401789	ruby-valley-rural-municipality	\N	\N
30611	Siddhalek Rural Municipality	municipality	306	2025-10-07 23:26:03.401789	siddhalek-rural-municipality	\N	\N
30612	Thakre Rural Municipality	municipality	306	2025-10-07 23:26:03.401789	thakre-rural-municipality	\N	\N
30613	Tripura Sundari Rural Municipality	municipality	306	2025-10-07 23:26:03.401789	tripura-sundari-rural-municipality	\N	\N
30701	Bidur Municipality	municipality	307	2025-10-07 23:26:03.402783	bidur-municipality	\N	\N
30702	Belkotgadhi Municipality	municipality	307	2025-10-07 23:26:03.402783	belkotgadhi-municipality	\N	\N
30703	Kakani Rural Municipality	municipality	307	2025-10-07 23:26:03.402783	kakani-rural-municipality	\N	\N
30704	Kispang Rural Municipality	municipality	307	2025-10-07 23:26:03.402783	kispang-rural-municipality	\N	\N
30706	Myagang Rural Municipality	municipality	307	2025-10-07 23:26:03.402783	myagang-rural-municipality	\N	\N
30707	Panchakanya Rural Municipality	municipality	307	2025-10-07 23:26:03.402783	panchakanya-rural-municipality	\N	\N
30708	Shivapuri Rural Municipality	municipality	307	2025-10-07 23:26:03.402783	shivapuri-rural-municipality	\N	\N
30709	Dupcheshwor Rural Municipality	municipality	307	2025-10-07 23:26:03.402783	dupcheshwor-rural-municipality	\N	\N
30710	Suryagadhi Rural Municipality	municipality	307	2025-10-07 23:26:03.402783	suryagadhi-rural-municipality	\N	\N
30711	Tadi Rural Municipality	municipality	307	2025-10-07 23:26:03.402783	tadi-rural-municipality	\N	\N
30712	Tarkeshwar Rural Municipality	municipality	307	2025-10-07 23:26:03.402783	tarkeshwar-rural-municipality	\N	\N
30801	Gosaikunda Rural Municipality	municipality	308	2025-10-07 23:26:03.403552	gosaikunda-rural-municipality	\N	\N
30802	Kalika Rural Municipality	municipality	308	2025-10-07 23:26:03.403552	kalika-rural-municipality	\N	\N
30803	Naukunda Rural Municipality	municipality	308	2025-10-07 23:26:03.403552	naukunda-rural-municipality	\N	\N
30804	Parbatikunda Rural Municipality	municipality	308	2025-10-07 23:26:03.403552	parbatikunda-rural-municipality	\N	\N
30805	Uttargaya Rural Municipality	municipality	308	2025-10-07 23:26:03.403552	uttargaya-rural-municipality	\N	\N
30901	Kamalamai Municipality	municipality	309	2025-10-07 23:26:03.404061	kamalamai-municipality	\N	\N
30902	Dudhouli Municipality	municipality	309	2025-10-07 23:26:03.404061	dudhouli-municipality	\N	\N
30903	Golanjor Rural Municipality	municipality	309	2025-10-07 23:26:03.404061	golanjor-rural-municipality	\N	\N
30904	Ghyanglekh Rural Municipality	municipality	309	2025-10-07 23:26:03.404061	ghyanglekh-rural-municipality	\N	\N
30905	Hariharpurgadhi Rural Municipality	municipality	309	2025-10-07 23:26:03.404061	hariharpurgadhi-rural-municipality	\N	\N
30906	Marin Rural Municipality	municipality	309	2025-10-07 23:26:03.404061	marin-rural-municipality	\N	\N
30907	Phikkal Rural Municipality	municipality	309	2025-10-07 23:26:03.404061	phikkal-rural-municipality	\N	\N
30908	Sunkoshi Rural Municipality	municipality	309	2025-10-07 23:26:03.404061	sunkoshi-rural-municipality	\N	\N
30909	Tinpatan Rural Municipality	municipality	309	2025-10-07 23:26:03.404061	tinpatan-rural-municipality	\N	\N
31001	Ramechhap Municipality	municipality	310	2025-10-07 23:26:03.404629	ramechhap-municipality	\N	\N
31002	Manthali Municipality	municipality	310	2025-10-07 23:26:03.404629	manthali-municipality	\N	\N
31003	Umakunda Rural Municipality	municipality	310	2025-10-07 23:26:03.404629	umakunda-rural-municipality	\N	\N
31004	Khandadevi Rural Municipality	municipality	310	2025-10-07 23:26:03.404629	khandadevi-rural-municipality	\N	\N
31005	Likhu Tamakoshi Rural Municipality	municipality	310	2025-10-07 23:26:03.404629	likhu-tamakoshi-rural-municipality	\N	\N
31006	Doramba Rural Municipality	municipality	310	2025-10-07 23:26:03.404629	doramba-rural-municipality	\N	\N
31007	Gokulganga Rural Municipality	municipality	310	2025-10-07 23:26:03.404629	gokulganga-rural-municipality	\N	\N
31008	Sunapati Rural Municipality	municipality	310	2025-10-07 23:26:03.404629	sunapati-rural-municipality	\N	\N
31101	Bhimeshwar Municipality	municipality	311	2025-10-07 23:26:03.405158	bhimeshwar-municipality	\N	\N
31102	Jiri Municipality	municipality	311	2025-10-07 23:26:03.405158	jiri-municipality	\N	\N
31103	Baiteshwor Rural Municipality	municipality	311	2025-10-07 23:26:03.405158	baiteshwor-rural-municipality	\N	\N
31104	Bigu Rural Municipality	municipality	311	2025-10-07 23:26:03.405158	bigu-rural-municipality	\N	\N
31105	Gaurishankar Rural Municipality	municipality	311	2025-10-07 23:26:03.405158	gaurishankar-rural-municipality	\N	\N
31106	Kalinchok Rural Municipality	municipality	311	2025-10-07 23:26:03.405158	kalinchok-rural-municipality	\N	\N
31107	Melung Rural Municipality	municipality	311	2025-10-07 23:26:03.405158	melung-rural-municipality	\N	\N
31108	Sailung Rural Municipality	municipality	311	2025-10-07 23:26:03.405158	sailung-rural-municipality	\N	\N
31109	Tamakoshi Rural Municipality	municipality	311	2025-10-07 23:26:03.405158	tamakoshi-rural-municipality	\N	\N
31201	Chautara Sangachokgadhi Municipality	municipality	312	2025-10-07 23:26:03.405724	chautara-sangachokgadhi-municipality	\N	\N
31202	Barhabise Municipality	municipality	312	2025-10-07 23:26:03.405724	barhabise-municipality	\N	\N
31203	Melamchi Municipality	municipality	312	2025-10-07 23:26:03.405724	melamchi-municipality	\N	\N
31204	Balefi Rural Municipality	municipality	312	2025-10-07 23:26:03.405724	balefi-rural-municipality	\N	\N
31205	Bhotekoshi Rural Municipality	municipality	312	2025-10-07 23:26:03.405724	bhotekoshi-rural-municipality	\N	\N
31206	Helambu Rural Municipality	municipality	312	2025-10-07 23:26:03.405724	helambu-rural-municipality	\N	\N
31207	Indrawati Rural Municipality	municipality	312	2025-10-07 23:26:03.405724	indrawati-rural-municipality	\N	\N
31208	Jugal Rural Municipality	municipality	312	2025-10-07 23:26:03.405724	jugal-rural-municipality	\N	\N
31209	Lisankhu Pakhar Rural Municipality	municipality	312	2025-10-07 23:26:03.405724	lisankhu-pakhar-rural-municipality	\N	\N
31210	Panchpokhari Thangpal Rural Municipality	municipality	312	2025-10-07 23:26:03.405724	panchpokhari-thangpal-rural-municipality	\N	\N
31212	Tripurasundari Rural Municipality	municipality	312	2025-10-07 23:26:03.405724	tripurasundari-rural-municipality	\N	\N
31301	Dhulikhel Municipality	municipality	313	2025-10-07 23:26:03.406454	dhulikhel-municipality	\N	\N
40801	Bhanu Municipality	municipality	408	2025-10-07 23:26:03.412394	bhanu-municipality	\N	\N
30205	Bagmati Rural Municipality (Lalitpur)	municipality	302	2025-10-07 23:26:03.399696	bagmati-rural-municipality-lalitpur-	\N	\N
31304	Panchkhal Municipality	municipality	313	2025-10-07 23:26:03.406454	panchkhal-municipality	\N	\N
31305	Namobuddha Municipality	municipality	313	2025-10-07 23:26:03.406454	namobuddha-municipality	\N	\N
31306	Mandan Deupur Municipality	municipality	313	2025-10-07 23:26:03.406454	mandan-deupur-municipality	\N	\N
31307	Khanikhola Rural Municipality	municipality	313	2025-10-07 23:26:03.406454	khanikhola-rural-municipality	\N	\N
31308	Chauri Deurali Rural Municipality	municipality	313	2025-10-07 23:26:03.406454	chauri-deurali-rural-municipality	\N	\N
31309	Temal Rural Municipality	municipality	313	2025-10-07 23:26:03.406454	temal-rural-municipality	\N	\N
31310	Bethanchok Rural Municipality	municipality	313	2025-10-07 23:26:03.406454	bethanchok-rural-municipality	\N	\N
31311	Bhumlu Rural Municipality	municipality	313	2025-10-07 23:26:03.406454	bhumlu-rural-municipality	\N	\N
31312	Mahabharat Rural Municipality	municipality	313	2025-10-07 23:26:03.406454	mahabharat-rural-municipality	\N	\N
31313	Roshi Rural Municipality	municipality	313	2025-10-07 23:26:03.406454	roshi-rural-municipality	\N	\N
4	Gandaki Province	province	\N	2025-10-07 23:26:03.407277	gandaki-province	\N	\N
401	Gorkha	district	4	2025-10-07 23:26:03.407508	gorkha	\N	\N
402	Lamjung	district	4	2025-10-07 23:26:03.407508	lamjung	\N	\N
403	Kaski	district	4	2025-10-07 23:26:03.407508	kaski	\N	\N
404	Manang	district	4	2025-10-07 23:26:03.407508	manang	\N	\N
405	Mustang	district	4	2025-10-07 23:26:03.407508	mustang	\N	\N
406	Nawalpur	district	4	2025-10-07 23:26:03.407508	nawalpur	\N	\N
407	Syangja	district	4	2025-10-07 23:26:03.407508	syangja	\N	\N
408	Tanahun	district	4	2025-10-07 23:26:03.407508	tanahun	\N	\N
409	Parbat	district	4	2025-10-07 23:26:03.407508	parbat	\N	\N
410	Baglung	district	4	2025-10-07 23:26:03.407508	baglung	\N	\N
411	Myagdi	district	4	2025-10-07 23:26:03.407508	myagdi	\N	\N
40101	Gorkha Municipality	municipality	401	2025-10-07 23:26:03.408264	gorkha-municipality	\N	\N
40102	Palungtar Municipality	municipality	401	2025-10-07 23:26:03.408264	palungtar-municipality	\N	\N
40103	Sulikot Rural Municipality	municipality	401	2025-10-07 23:26:03.408264	sulikot-rural-municipality	\N	\N
40104	Siranchok Rural Municipality	municipality	401	2025-10-07 23:26:03.408264	siranchok-rural-municipality	\N	\N
40105	Ajirkot Rural Municipality	municipality	401	2025-10-07 23:26:03.408264	ajirkot-rural-municipality	\N	\N
40106	Tsum Nubri Rural Municipality	municipality	401	2025-10-07 23:26:03.408264	tsum-nubri-rural-municipality	\N	\N
40107	Dharche Rural Municipality	municipality	401	2025-10-07 23:26:03.408264	dharche-rural-municipality	\N	\N
40108	Bhimsen Thapa Rural Municipality	municipality	401	2025-10-07 23:26:03.408264	bhimsen-thapa-rural-municipality	\N	\N
40109	Sahid Lakhan Rural Municipality	municipality	401	2025-10-07 23:26:03.408264	sahid-lakhan-rural-municipality	\N	\N
40110	Aarughat Rural Municipality	municipality	401	2025-10-07 23:26:03.408264	aarughat-rural-municipality	\N	\N
40111	Gandaki Rural Municipality	municipality	401	2025-10-07 23:26:03.408264	gandaki-rural-municipality	\N	\N
40201	Besisahar Municipality	municipality	402	2025-10-07 23:26:03.408995	besisahar-municipality	\N	\N
40202	Madhya Nepal Municipality	municipality	402	2025-10-07 23:26:03.408995	madhya-nepal-municipality	\N	\N
40203	Rainas Municipality	municipality	402	2025-10-07 23:26:03.408995	rainas-municipality	\N	\N
40204	Sundarbazar Municipality	municipality	402	2025-10-07 23:26:03.408995	sundarbazar-municipality	\N	\N
40205	Kwholasothar Rural Municipality	municipality	402	2025-10-07 23:26:03.408995	kwholasothar-rural-municipality	\N	\N
40206	Dudhpokhari Rural Municipality	municipality	402	2025-10-07 23:26:03.408995	dudhpokhari-rural-municipality	\N	\N
40207	Dordi Rural Municipality	municipality	402	2025-10-07 23:26:03.408995	dordi-rural-municipality	\N	\N
40208	Marsyangdi Rural Municipality	municipality	402	2025-10-07 23:26:03.408995	marsyangdi-rural-municipality	\N	\N
40301	Pokhara Metropolitan City	municipality	403	2025-10-07 23:26:03.409585	pokhara-metropolitan-city	\N	\N
40303	Machhapuchchhre Rural Municipality	municipality	403	2025-10-07 23:26:03.409585	machhapuchchhre-rural-municipality	\N	\N
40305	Rupa Rural Municipality	municipality	403	2025-10-07 23:26:03.409585	rupa-rural-municipality	\N	\N
40401	Chame Rural Municipality	municipality	404	2025-10-07 23:26:03.410026	chame-rural-municipality	\N	\N
40402	Nason Rural Municipality	municipality	404	2025-10-07 23:26:03.410026	nason-rural-municipality	\N	\N
40403	Narpa Bhumi Rural Municipality	municipality	404	2025-10-07 23:26:03.410026	narpa-bhumi-rural-municipality	\N	\N
40404	Manang Ngisyang Rural Municipality	municipality	404	2025-10-07 23:26:03.410026	manang-ngisyang-rural-municipality	\N	\N
40501	Gharapjhong Rural Municipality	municipality	405	2025-10-07 23:26:03.410448	gharapjhong-rural-municipality	\N	\N
40502	Thasang Rural Municipality	municipality	405	2025-10-07 23:26:03.410448	thasang-rural-municipality	\N	\N
40503	Barhagaun Muktichhetra Rural Municipality	municipality	405	2025-10-07 23:26:03.410448	barhagaun-muktichhetra-rural-municipality	\N	\N
40504	Lomanthang Rural Municipality	municipality	405	2025-10-07 23:26:03.410448	lomanthang-rural-municipality	\N	\N
40505	Lo-Ghekar Damodarkunda Rural Municipality	municipality	405	2025-10-07 23:26:03.410448	lo-ghekar-damodarkunda-rural-municipality	\N	\N
40601	Kawasoti Municipality	municipality	406	2025-10-07 23:26:03.411019	kawasoti-municipality	\N	\N
40602	Gaindakot Municipality	municipality	406	2025-10-07 23:26:03.411019	gaindakot-municipality	\N	\N
40603	Devchuli Municipality	municipality	406	2025-10-07 23:26:03.411019	devchuli-municipality	\N	\N
40604	Madhyabindu Municipality	municipality	406	2025-10-07 23:26:03.411019	madhyabindu-municipality	\N	\N
40605	Baudikali Rural Municipality	municipality	406	2025-10-07 23:26:03.411019	baudikali-rural-municipality	\N	\N
40606	Bulingtar Rural Municipality	municipality	406	2025-10-07 23:26:03.411019	bulingtar-rural-municipality	\N	\N
40607	Binayi Tribeni Rural Municipality	municipality	406	2025-10-07 23:26:03.411019	binayi-tribeni-rural-municipality	\N	\N
40608	Hupsekot Rural Municipality	municipality	406	2025-10-07 23:26:03.411019	hupsekot-rural-municipality	\N	\N
40701	Galyang Municipality	municipality	407	2025-10-07 23:26:03.411649	galyang-municipality	\N	\N
40702	Chapakot Municipality	municipality	407	2025-10-07 23:26:03.411649	chapakot-municipality	\N	\N
40703	Putalibazar Municipality	municipality	407	2025-10-07 23:26:03.411649	putalibazar-municipality	\N	\N
40704	Bhirkot Municipality	municipality	407	2025-10-07 23:26:03.411649	bhirkot-municipality	\N	\N
40705	Waling Municipality	municipality	407	2025-10-07 23:26:03.411649	waling-municipality	\N	\N
40706	Arjun Chaupari Rural Municipality	municipality	407	2025-10-07 23:26:03.411649	arjun-chaupari-rural-municipality	\N	\N
40707	Aandhikhola Rural Municipality	municipality	407	2025-10-07 23:26:03.411649	aandhikhola-rural-municipality	\N	\N
40709	Phedikhola Rural Municipality	municipality	407	2025-10-07 23:26:03.411649	phedikhola-rural-municipality	\N	\N
40710	Harinas Rural Municipality	municipality	407	2025-10-07 23:26:03.411649	harinas-rural-municipality	\N	\N
40711	Biruwa Rural Municipality	municipality	407	2025-10-07 23:26:03.411649	biruwa-rural-municipality	\N	\N
40802	Bhimad Municipality	municipality	408	2025-10-07 23:26:03.412394	bhimad-municipality	\N	\N
40803	Byas Municipality	municipality	408	2025-10-07 23:26:03.412394	byas-municipality	\N	\N
40804	Shuklagandaki Municipality	municipality	408	2025-10-07 23:26:03.412394	shuklagandaki-municipality	\N	\N
40805	Anbu Khaireni Rural Municipality	municipality	408	2025-10-07 23:26:03.412394	anbu-khaireni-rural-municipality	\N	\N
40806	Devghat Rural Municipality	municipality	408	2025-10-07 23:26:03.412394	devghat-rural-municipality	\N	\N
40807	Bandipur Rural Municipality	municipality	408	2025-10-07 23:26:03.412394	bandipur-rural-municipality	\N	\N
40808	Rishing Rural Municipality	municipality	408	2025-10-07 23:26:03.412394	rishing-rural-municipality	\N	\N
40809	Ghiring Rural Municipality	municipality	408	2025-10-07 23:26:03.412394	ghiring-rural-municipality	\N	\N
40810	Myagde Rural Municipality	municipality	408	2025-10-07 23:26:03.412394	myagde-rural-municipality	\N	\N
40901	Kushma Municipality	municipality	409	2025-10-07 23:26:03.413085	kushma-municipality	\N	\N
40902	Phalewas Municipality	municipality	409	2025-10-07 23:26:03.413085	phalewas-municipality	\N	\N
40903	Jaljala Rural Municipality	municipality	409	2025-10-07 23:26:03.413085	jaljala-rural-municipality	\N	\N
40904	Paiyun Rural Municipality	municipality	409	2025-10-07 23:26:03.413085	paiyun-rural-municipality	\N	\N
40905	Mahashila Rural Municipality	municipality	409	2025-10-07 23:26:03.413085	mahashila-rural-municipality	\N	\N
40906	Modi Rural Municipality	municipality	409	2025-10-07 23:26:03.413085	modi-rural-municipality	\N	\N
40907	Bihadi Rural Municipality	municipality	409	2025-10-07 23:26:03.413085	bihadi-rural-municipality	\N	\N
41001	Baglung Municipality	municipality	410	2025-10-07 23:26:03.41368	baglung-municipality	\N	\N
41002	Dhorpatan Municipality	municipality	410	2025-10-07 23:26:03.41368	dhorpatan-municipality	\N	\N
41003	Galkot Municipality	municipality	410	2025-10-07 23:26:03.41368	galkot-municipality	\N	\N
41004	Jaimuni Municipality	municipality	410	2025-10-07 23:26:03.41368	jaimuni-municipality	\N	\N
41103	Dhaulagiri Rural Municipality	municipality	411	2025-10-07 23:26:03.414442	dhaulagiri-rural-municipality	\N	\N
41104	Mangala Rural Municipality	municipality	411	2025-10-07 23:26:03.414442	mangala-rural-municipality	\N	\N
41106	Raghuganga Rural Municipality	municipality	411	2025-10-07 23:26:03.414442	raghuganga-rural-municipality	\N	\N
5	Lumbini Province	province	\N	2025-10-07 23:26:03.414951	lumbini-province	\N	\N
501	Gulmi	district	5	2025-10-07 23:26:03.415177	gulmi	\N	\N
502	Palpa	district	5	2025-10-07 23:26:03.415177	palpa	\N	\N
503	Rupandehi	district	5	2025-10-07 23:26:03.415177	rupandehi	\N	\N
504	Kapilvastu	district	5	2025-10-07 23:26:03.415177	kapilvastu	\N	\N
505	Arghakhanchi	district	5	2025-10-07 23:26:03.415177	arghakhanchi	\N	\N
506	Pyuthan	district	5	2025-10-07 23:26:03.415177	pyuthan	\N	\N
507	Rolpa	district	5	2025-10-07 23:26:03.415177	rolpa	\N	\N
508	Eastern Rukum	district	5	2025-10-07 23:26:03.415177	eastern-rukum	\N	\N
509	Banke	district	5	2025-10-07 23:26:03.415177	banke	\N	\N
510	Bardiya	district	5	2025-10-07 23:26:03.415177	bardiya	\N	\N
511	Dang	district	5	2025-10-07 23:26:03.415177	dang	\N	\N
512	Nawalparasi West	district	5	2025-10-07 23:26:03.415177	nawalparasi-west	\N	\N
50102	Resunga Municipality	municipality	501	2025-10-07 23:26:03.416118	resunga-municipality	\N	\N
50103	Isma Rural Municipality	municipality	501	2025-10-07 23:26:03.416118	isma-rural-municipality	\N	\N
50105	Satyawati Rural Municipality	municipality	501	2025-10-07 23:26:03.416118	satyawati-rural-municipality	\N	\N
50106	Chandrakot Rural Municipality	municipality	501	2025-10-07 23:26:03.416118	chandrakot-rural-municipality	\N	\N
50107	Ruru Rural Municipality	municipality	501	2025-10-07 23:26:03.416118	ruru-rural-municipality	\N	\N
50108	Chhatrakot Rural Municipality	municipality	501	2025-10-07 23:26:03.416118	chhatrakot-rural-municipality	\N	\N
50109	Dhurkot Rural Municipality	municipality	501	2025-10-07 23:26:03.416118	dhurkot-rural-municipality	\N	\N
50110	Madane Rural Municipality	municipality	501	2025-10-07 23:26:03.416118	madane-rural-municipality	\N	\N
50112	Gulmi Darbar Rural Municipality	municipality	501	2025-10-07 23:26:03.416118	gulmi-darbar-rural-municipality	\N	\N
50201	Tansen Municipality	municipality	502	2025-10-07 23:26:03.416985	tansen-municipality	\N	\N
50202	Rampur Municipality	municipality	502	2025-10-07 23:26:03.416985	rampur-municipality	\N	\N
50203	Rainadevi Chhahara Rural Municipality	municipality	502	2025-10-07 23:26:03.416985	rainadevi-chhahara-rural-municipality	\N	\N
50204	Ribdikot Rural Municipality	municipality	502	2025-10-07 23:26:03.416985	ribdikot-rural-municipality	\N	\N
50205	Purbakhola Rural Municipality	municipality	502	2025-10-07 23:26:03.416985	purbakhola-rural-municipality	\N	\N
50206	Rambha Rural Municipality	municipality	502	2025-10-07 23:26:03.416985	rambha-rural-municipality	\N	\N
50207	Tinahu Rural Municipality	municipality	502	2025-10-07 23:26:03.416985	tinahu-rural-municipality	\N	\N
50208	Nisdi Rural Municipality	municipality	502	2025-10-07 23:26:03.416985	nisdi-rural-municipality	\N	\N
50209	Mathagadhi Rural Municipality	municipality	502	2025-10-07 23:26:03.416985	mathagadhi-rural-municipality	\N	\N
50210	Bagnaskali Rural Municipality	municipality	502	2025-10-07 23:26:03.416985	bagnaskali-rural-municipality	\N	\N
50301	Butwal Sub-Metropolitan City	municipality	503	2025-10-07 23:26:03.417793	butwal-sub-metropolitan-city	\N	\N
50302	Devdaha Municipality	municipality	503	2025-10-07 23:26:03.417793	devdaha-municipality	\N	\N
50303	Lumbini Sanskritik Municipality	municipality	503	2025-10-07 23:26:03.417793	lumbini-sanskritik-municipality	\N	\N
50304	Sainamaina Municipality	municipality	503	2025-10-07 23:26:03.417793	sainamaina-municipality	\N	\N
50305	Siddharthanagar Municipality	municipality	503	2025-10-07 23:26:03.417793	siddharthanagar-municipality	\N	\N
50306	Tilottama Municipality	municipality	503	2025-10-07 23:26:03.417793	tilottama-municipality	\N	\N
50307	Gaidahawa Rural Municipality	municipality	503	2025-10-07 23:26:03.417793	gaidahawa-rural-municipality	\N	\N
50308	Kanchan Rural Municipality	municipality	503	2025-10-07 23:26:03.417793	kanchan-rural-municipality	\N	\N
50309	Kotahimai Rural Municipality	municipality	503	2025-10-07 23:26:03.417793	kotahimai-rural-municipality	\N	\N
50310	Marchawari Rural Municipality	municipality	503	2025-10-07 23:26:03.417793	marchawari-rural-municipality	\N	\N
50312	Omsatiya Rural Municipality	municipality	503	2025-10-07 23:26:03.417793	omsatiya-rural-municipality	\N	\N
50313	Rohini Rural Municipality	municipality	503	2025-10-07 23:26:03.417793	rohini-rural-municipality	\N	\N
50314	Sammarimai Rural Municipality	municipality	503	2025-10-07 23:26:03.417793	sammarimai-rural-municipality	\N	\N
50315	Siyari Rural Municipality	municipality	503	2025-10-07 23:26:03.417793	siyari-rural-municipality	\N	\N
50401	Kapilvastu Municipality	municipality	504	2025-10-07 23:26:03.418873	kapilvastu-municipality	\N	\N
50402	Banganga Municipality	municipality	504	2025-10-07 23:26:03.418873	banganga-municipality	\N	\N
50403	Buddhabhumi Municipality	municipality	504	2025-10-07 23:26:03.418873	buddhabhumi-municipality	\N	\N
50404	Shivaraj Municipality	municipality	504	2025-10-07 23:26:03.418873	shivaraj-municipality	\N	\N
50405	Krishnanagar Municipality	municipality	504	2025-10-07 23:26:03.418873	krishnanagar-municipality	\N	\N
50406	Maharajgunj Municipality	municipality	504	2025-10-07 23:26:03.418873	maharajgunj-municipality	\N	\N
50408	Yashodhara Rural Municipality	municipality	504	2025-10-07 23:26:03.418873	yashodhara-rural-municipality	\N	\N
50410	Bijayanagar Rural Municipality	municipality	504	2025-10-07 23:26:03.418873	bijayanagar-rural-municipality	\N	\N
50501	Sandhikharka Municipality	municipality	505	2025-10-07 23:26:03.419616	sandhikharka-municipality	\N	\N
50502	Sitganga Municipality	municipality	505	2025-10-07 23:26:03.419616	sitganga-municipality	\N	\N
50503	Bhumikasthan Municipality	municipality	505	2025-10-07 23:26:03.419616	bhumikasthan-municipality	\N	\N
50504	Chhatradev Rural Municipality	municipality	505	2025-10-07 23:26:03.419616	chhatradev-rural-municipality	\N	\N
50505	Panini Rural Municipality	municipality	505	2025-10-07 23:26:03.419616	panini-rural-municipality	\N	\N
50506	Malarani Rural Municipality	municipality	505	2025-10-07 23:26:03.419616	malarani-rural-municipality	\N	\N
50601	Pyuthan Municipality	municipality	506	2025-10-07 23:26:03.420168	pyuthan-municipality	\N	\N
50602	Sworgadwari Municipality	municipality	506	2025-10-07 23:26:03.420168	sworgadwari-municipality	\N	\N
50603	Mandavi Rural Municipality	municipality	506	2025-10-07 23:26:03.420168	mandavi-rural-municipality	\N	\N
50604	Mallarani Rural Municipality	municipality	506	2025-10-07 23:26:03.420168	mallarani-rural-municipality	\N	\N
50605	Sarumarani Rural Municipality	municipality	506	2025-10-07 23:26:03.420168	sarumarani-rural-municipality	\N	\N
50606	Jhimruk Rural Municipality	municipality	506	2025-10-07 23:26:03.420168	jhimruk-rural-municipality	\N	\N
50607	Airawati Rural Municipality	municipality	506	2025-10-07 23:26:03.420168	airawati-rural-municipality	\N	\N
50608	Gaumukhi Rural Municipality	municipality	506	2025-10-07 23:26:03.420168	gaumukhi-rural-municipality	\N	\N
50609	Naubahini Rural Municipality	municipality	506	2025-10-07 23:26:03.420168	naubahini-rural-municipality	\N	\N
50701	Rolpa Municipality	municipality	507	2025-10-07 23:26:03.420905	rolpa-municipality	\N	\N
50702	Runtigadhi Rural Municipality	municipality	507	2025-10-07 23:26:03.420905	runtigadhi-rural-municipality	\N	\N
50703	Triveni Rural Municipality	municipality	507	2025-10-07 23:26:03.420905	triveni-rural-municipality	\N	\N
50704	Sunil Smriti Rural Municipality	municipality	507	2025-10-07 23:26:03.420905	sunil-smriti-rural-municipality	\N	\N
50705	Lungri Rural Municipality	municipality	507	2025-10-07 23:26:03.420905	lungri-rural-municipality	\N	\N
50706	Sunchhahari Rural Municipality	municipality	507	2025-10-07 23:26:03.420905	sunchhahari-rural-municipality	\N	\N
50707	Thawang Rural Municipality	municipality	507	2025-10-07 23:26:03.420905	thawang-rural-municipality	\N	\N
50802	Sisne Rural Municipality	municipality	508	2025-10-07 23:26:03.421677	sisne-rural-municipality	\N	\N
50803	Putha Uttarganga Rural Municipality	municipality	508	2025-10-07 23:26:03.421677	putha-uttarganga-rural-municipality	\N	\N
50901	Nepalgunj Sub-Metropolitan City	municipality	509	2025-10-07 23:26:03.422095	nepalgunj-sub-metropolitan-city	\N	\N
50902	Kohalpur Municipality	municipality	509	2025-10-07 23:26:03.422095	kohalpur-municipality	\N	\N
50903	Rapti Sonari Rural Municipality	municipality	509	2025-10-07 23:26:03.422095	rapti-sonari-rural-municipality	\N	\N
50904	Narainapur Rural Municipality	municipality	509	2025-10-07 23:26:03.422095	narainapur-rural-municipality	\N	\N
50905	Duduwa Rural Municipality	municipality	509	2025-10-07 23:26:03.422095	duduwa-rural-municipality	\N	\N
50907	Khajura Rural Municipality	municipality	509	2025-10-07 23:26:03.422095	khajura-rural-municipality	\N	\N
50908	Baijnath Rural Municipality	municipality	509	2025-10-07 23:26:03.422095	baijnath-rural-municipality	\N	\N
51001	Gulariya Municipality	municipality	510	2025-10-07 23:26:03.422786	gulariya-municipality	\N	\N
51002	Madhuwan Municipality	municipality	510	2025-10-07 23:26:03.422786	madhuwan-municipality	\N	\N
51003	Rajapur Municipality	municipality	510	2025-10-07 23:26:03.422786	rajapur-municipality	\N	\N
51004	Thakurbaba Municipality	municipality	510	2025-10-07 23:26:03.422786	thakurbaba-municipality	\N	\N
51005	Bansagadhi Municipality	municipality	510	2025-10-07 23:26:03.422786	bansagadhi-municipality	\N	\N
51006	Barbardiya Municipality	municipality	510	2025-10-07 23:26:03.422786	barbardiya-municipality	\N	\N
51007	Badhaiyatal Rural Municipality	municipality	510	2025-10-07 23:26:03.422786	badhaiyatal-rural-municipality	\N	\N
51008	Geruwa Rural Municipality	municipality	510	2025-10-07 23:26:03.422786	geruwa-rural-municipality	\N	\N
51101	Ghorahi Sub-Metropolitan City	municipality	511	2025-10-07 23:26:03.423454	ghorahi-sub-metropolitan-city	\N	\N
51102	Tulsipur Sub-Metropolitan City	municipality	511	2025-10-07 23:26:03.423454	tulsipur-sub-metropolitan-city	\N	\N
51103	Lamahi Municipality	municipality	511	2025-10-07 23:26:03.423454	lamahi-municipality	\N	\N
51104	Gadhawa Rural Municipality	municipality	511	2025-10-07 23:26:03.423454	gadhawa-rural-municipality	\N	\N
51105	Rajpur Rural Municipality	municipality	511	2025-10-07 23:26:03.423454	rajpur-rural-municipality	\N	\N
51106	Shantinagar Rural Municipality	municipality	511	2025-10-07 23:26:03.423454	shantinagar-rural-municipality	\N	\N
51107	Rapti Rural Municipality	municipality	511	2025-10-07 23:26:03.423454	rapti-rural-municipality	\N	\N
51108	Banglachuli Rural Municipality	municipality	511	2025-10-07 23:26:03.423454	banglachuli-rural-municipality	\N	\N
51109	Dangisharan Rural Municipality	municipality	511	2025-10-07 23:26:03.423454	dangisharan-rural-municipality	\N	\N
51110	Babai Rural Municipality	municipality	511	2025-10-07 23:26:03.423454	babai-rural-municipality	\N	\N
51201	Bardaghat Municipality	municipality	512	2025-10-07 23:26:03.424237	bardaghat-municipality	\N	\N
51202	Ramgram Municipality	municipality	512	2025-10-07 23:26:03.424237	ramgram-municipality	\N	\N
51203	Sunwal Municipality	municipality	512	2025-10-07 23:26:03.424237	sunwal-municipality	\N	\N
51204	Susta Rural Municipality	municipality	512	2025-10-07 23:26:03.424237	susta-rural-municipality	\N	\N
51205	Palhinandan Rural Municipality	municipality	512	2025-10-07 23:26:03.424237	palhinandan-rural-municipality	\N	\N
51206	Pratappur Rural Municipality	municipality	512	2025-10-07 23:26:03.424237	pratappur-rural-municipality	\N	\N
51207	Sarawal Rural Municipality	municipality	512	2025-10-07 23:26:03.424237	sarawal-rural-municipality	\N	\N
6	Karnali Province	province	\N	2025-10-07 23:26:03.424819	karnali-province	\N	\N
601	Western Rukum	district	6	2025-10-07 23:26:03.425036	western-rukum	\N	\N
602	Salyan	district	6	2025-10-07 23:26:03.425036	salyan	\N	\N
603	Dolpa	district	6	2025-10-07 23:26:03.425036	dolpa	\N	\N
604	Humla	district	6	2025-10-07 23:26:03.425036	humla	\N	\N
605	Jumla	district	6	2025-10-07 23:26:03.425036	jumla	\N	\N
606	Kalikot	district	6	2025-10-07 23:26:03.425036	kalikot	\N	\N
607	Mugu	district	6	2025-10-07 23:26:03.425036	mugu	\N	\N
608	Surkhet	district	6	2025-10-07 23:26:03.425036	surkhet	\N	\N
609	Dailekh	district	6	2025-10-07 23:26:03.425036	dailekh	\N	\N
610	Jajarkot	district	6	2025-10-07 23:26:03.425036	jajarkot	\N	\N
60102	Chaurjahari Municipality	municipality	601	2025-10-07 23:26:03.425904	chaurjahari-municipality	\N	\N
60103	Aathbiskot Municipality	municipality	601	2025-10-07 23:26:03.425904	aathbiskot-municipality	\N	\N
60104	Banphikot Rural Municipality	municipality	601	2025-10-07 23:26:03.425904	banphikot-rural-municipality	\N	\N
60106	Sani Bheri Rural Municipality	municipality	601	2025-10-07 23:26:03.425904	sani-bheri-rural-municipality	\N	\N
60201	Bagchaur Municipality	municipality	602	2025-10-07 23:26:03.42648	bagchaur-municipality	\N	\N
60202	Bangad Kupinde Municipality	municipality	602	2025-10-07 23:26:03.42648	bangad-kupinde-municipality	\N	\N
60203	Shaarda Municipality	municipality	602	2025-10-07 23:26:03.42648	shaarda-municipality	\N	\N
60204	Kalimati Rural Municipality	municipality	602	2025-10-07 23:26:03.42648	kalimati-rural-municipality	\N	\N
60206	Kapurkot Rural Municipality	municipality	602	2025-10-07 23:26:03.42648	kapurkot-rural-municipality	\N	\N
60207	Chhatreshwari Rural Municipality	municipality	602	2025-10-07 23:26:03.42648	chhatreshwari-rural-municipality	\N	\N
60208	Kumakh Rural Municipality	municipality	602	2025-10-07 23:26:03.42648	kumakh-rural-municipality	\N	\N
60209	Siddha Kumakh Rural Municipality	municipality	602	2025-10-07 23:26:03.42648	siddha-kumakh-rural-municipality	\N	\N
60210	Darma Rural Municipality	municipality	602	2025-10-07 23:26:03.42648	darma-rural-municipality	\N	\N
60301	Thuli Bheri Municipality	municipality	603	2025-10-07 23:26:03.427296	thuli-bheri-municipality	\N	\N
60302	Tripurasundari Municipality	municipality	603	2025-10-07 23:26:03.427296	tripurasundari-municipality	\N	\N
60303	Dolpo Buddha Rural Municipality	municipality	603	2025-10-07 23:26:03.427296	dolpo-buddha-rural-municipality	\N	\N
60304	She Phoksundo Rural Municipality	municipality	603	2025-10-07 23:26:03.427296	she-phoksundo-rural-municipality	\N	\N
60305	Jagadulla Rural Municipality	municipality	603	2025-10-07 23:26:03.427296	jagadulla-rural-municipality	\N	\N
60306	Mudkechula Rural Municipality	municipality	603	2025-10-07 23:26:03.427296	mudkechula-rural-municipality	\N	\N
60307	Kaike Rural Municipality	municipality	603	2025-10-07 23:26:03.427296	kaike-rural-municipality	\N	\N
60308	Chharka Tangsong Rural Municipality	municipality	603	2025-10-07 23:26:03.427296	chharka-tangsong-rural-municipality	\N	\N
60401	Simkot Rural Municipality	municipality	604	2025-10-07 23:26:03.428027	simkot-rural-municipality	\N	\N
60402	Namkha Rural Municipality	municipality	604	2025-10-07 23:26:03.428027	namkha-rural-municipality	\N	\N
60403	Kharpunath Rural Municipality	municipality	604	2025-10-07 23:26:03.428027	kharpunath-rural-municipality	\N	\N
60404	Sarkegad Rural Municipality	municipality	604	2025-10-07 23:26:03.428027	sarkegad-rural-municipality	\N	\N
60405	Chankheli Rural Municipality	municipality	604	2025-10-07 23:26:03.428027	chankheli-rural-municipality	\N	\N
60406	Adanchuli Rural Municipality	municipality	604	2025-10-07 23:26:03.428027	adanchuli-rural-municipality	\N	\N
60407	Tanjakot Rural Municipality	municipality	604	2025-10-07 23:26:03.428027	tanjakot-rural-municipality	\N	\N
60501	Chandannath Municipality	municipality	605	2025-10-07 23:26:03.42866	chandannath-municipality	\N	\N
60502	Kanakasundari Rural Municipality	municipality	605	2025-10-07 23:26:03.42866	kanakasundari-rural-municipality	\N	\N
60503	Sinja Rural Municipality	municipality	605	2025-10-07 23:26:03.42866	sinja-rural-municipality	\N	\N
60504	Hima Rural Municipality	municipality	605	2025-10-07 23:26:03.42866	hima-rural-municipality	\N	\N
60505	Tila Rural Municipality	municipality	605	2025-10-07 23:26:03.42866	tila-rural-municipality	\N	\N
60506	Guthichaur Rural Municipality	municipality	605	2025-10-07 23:26:03.42866	guthichaur-rural-municipality	\N	\N
60507	Tatopani Rural Municipality	municipality	605	2025-10-07 23:26:03.42866	tatopani-rural-municipality	\N	\N
60508	Patarasi Rural Municipality	municipality	605	2025-10-07 23:26:03.42866	patarasi-rural-municipality	\N	\N
60601	Khandachakra Municipality	municipality	606	2025-10-07 23:26:03.429401	khandachakra-municipality	\N	\N
60602	Raskot Municipality	municipality	606	2025-10-07 23:26:03.429401	raskot-municipality	\N	\N
60603	Tilagufa Municipality	municipality	606	2025-10-07 23:26:03.429401	tilagufa-municipality	\N	\N
60604	Pachaljharana Rural Municipality	municipality	606	2025-10-07 23:26:03.429401	pachaljharana-rural-municipality	\N	\N
60605	Sanni Triveni Rural Municipality	municipality	606	2025-10-07 23:26:03.429401	sanni-triveni-rural-municipality	\N	\N
60606	Narharinath Rural Municipality	municipality	606	2025-10-07 23:26:03.429401	narharinath-rural-municipality	\N	\N
60607	Shubha Kalika Rural Municipality	municipality	606	2025-10-07 23:26:03.429401	shubha-kalika-rural-municipality	\N	\N
60701	Chhayanath Rara Municipality	municipality	607	2025-10-07 23:26:03.430167	chhayanath-rara-municipality	\N	\N
60702	Mugum Karmarong Rural Municipality	municipality	607	2025-10-07 23:26:03.430167	mugum-karmarong-rural-municipality	\N	\N
60703	Soru Rural Municipality	municipality	607	2025-10-07 23:26:03.430167	soru-rural-municipality	\N	\N
60704	Khatyad Rural Municipality	municipality	607	2025-10-07 23:26:03.430167	khatyad-rural-municipality	\N	\N
60801	Birendranagar Municipality	municipality	608	2025-10-07 23:26:03.430625	birendranagar-municipality	\N	\N
60802	Bheriganga Municipality	municipality	608	2025-10-07 23:26:03.430625	bheriganga-municipality	\N	\N
60803	Gurbhakot Municipality	municipality	608	2025-10-07 23:26:03.430625	gurbhakot-municipality	\N	\N
60804	Panchapuri Municipality	municipality	608	2025-10-07 23:26:03.430625	panchapuri-municipality	\N	\N
60805	Lekbesi Municipality	municipality	608	2025-10-07 23:26:03.430625	lekbesi-municipality	\N	\N
60806	Chaukune Rural Municipality	municipality	608	2025-10-07 23:26:03.430625	chaukune-rural-municipality	\N	\N
60807	Barahatal Rural Municipality	municipality	608	2025-10-07 23:26:03.430625	barahatal-rural-municipality	\N	\N
60808	Chingad Rural Municipality	municipality	608	2025-10-07 23:26:03.430625	chingad-rural-municipality	\N	\N
60809	Simta Rural Municipality	municipality	608	2025-10-07 23:26:03.430625	simta-rural-municipality	\N	\N
60901	Narayan Municipality	municipality	609	2025-10-07 23:26:03.431387	narayan-municipality	\N	\N
60902	Dullu Municipality	municipality	609	2025-10-07 23:26:03.431387	dullu-municipality	\N	\N
60903	Chamunda Bindrasaini Municipality	municipality	609	2025-10-07 23:26:03.431387	chamunda-bindrasaini-municipality	\N	\N
60904	Aathbis Municipality	municipality	609	2025-10-07 23:26:03.431387	aathbis-municipality	\N	\N
60905	Bhagawatimai Rural Municipality	municipality	609	2025-10-07 23:26:03.431387	bhagawatimai-rural-municipality	\N	\N
60906	Gurans Rural Municipality	municipality	609	2025-10-07 23:26:03.431387	gurans-rural-municipality	\N	\N
60907	Dungeshwor Rural Municipality	municipality	609	2025-10-07 23:26:03.431387	dungeshwor-rural-municipality	\N	\N
60908	Naumule Rural Municipality	municipality	609	2025-10-07 23:26:03.431387	naumule-rural-municipality	\N	\N
60909	Mahabu Rural Municipality	municipality	609	2025-10-07 23:26:03.431387	mahabu-rural-municipality	\N	\N
60910	Bhairabi Rural Municipality	municipality	609	2025-10-07 23:26:03.431387	bhairabi-rural-municipality	\N	\N
60911	Thantikandh Rural Municipality	municipality	609	2025-10-07 23:26:03.431387	thantikandh-rural-municipality	\N	\N
61001	Bheri Municipality	municipality	610	2025-10-07 23:26:03.432257	bheri-municipality	\N	\N
61002	Chhedagad Municipality	municipality	610	2025-10-07 23:26:03.432257	chhedagad-municipality	\N	\N
61003	Nalgad Municipality	municipality	610	2025-10-07 23:26:03.432257	nalgad-municipality	\N	\N
61004	Junichande Rural Municipality	municipality	610	2025-10-07 23:26:03.432257	junichande-rural-municipality	\N	\N
61005	Kuse Rural Municipality	municipality	610	2025-10-07 23:26:03.432257	kuse-rural-municipality	\N	\N
61006	Barekot Rural Municipality	municipality	610	2025-10-07 23:26:03.432257	barekot-rural-municipality	\N	\N
61007	Shivalaya Rural Municipality	municipality	610	2025-10-07 23:26:03.432257	shivalaya-rural-municipality	\N	\N
7	Sudurpashchim Province	province	\N	2025-10-07 23:26:03.432916	sudurpashchim-province	\N	\N
701	Kailali	district	7	2025-10-07 23:26:03.433123	kailali	\N	\N
702	Kanchanpur	district	7	2025-10-07 23:26:03.433123	kanchanpur	\N	\N
703	Dadeldhura	district	7	2025-10-07 23:26:03.433123	dadeldhura	\N	\N
704	Baitadi	district	7	2025-10-07 23:26:03.433123	baitadi	\N	\N
705	Doti	district	7	2025-10-07 23:26:03.433123	doti	\N	\N
706	Achham	district	7	2025-10-07 23:26:03.433123	achham	\N	\N
707	Bajhang	district	7	2025-10-07 23:26:03.433123	bajhang	\N	\N
708	Bajura	district	7	2025-10-07 23:26:03.433123	bajura	\N	\N
709	Darchula	district	7	2025-10-07 23:26:03.433123	darchula	\N	\N
70101	Dhangadhi Sub-Metropolitan City	municipality	701	2025-10-07 23:26:03.433955	dhangadhi-sub-metropolitan-city	\N	\N
70102	Tikapur Municipality	municipality	701	2025-10-07 23:26:03.433955	tikapur-municipality	\N	\N
70103	Ghodaghodi Municipality	municipality	701	2025-10-07 23:26:03.433955	ghodaghodi-municipality	\N	\N
70104	Lamkichuha Municipality	municipality	701	2025-10-07 23:26:03.433955	lamkichuha-municipality	\N	\N
70105	Bhajani Municipality	municipality	701	2025-10-07 23:26:03.433955	bhajani-municipality	\N	\N
70107	Gauriganga Municipality	municipality	701	2025-10-07 23:26:03.433955	gauriganga-municipality	\N	\N
70109	Bardagoriya Rural Municipality	municipality	701	2025-10-07 23:26:03.433955	bardagoriya-rural-municipality	\N	\N
70110	Mohanyal Rural Municipality	municipality	701	2025-10-07 23:26:03.433955	mohanyal-rural-municipality	\N	\N
70111	Kailari Rural Municipality	municipality	701	2025-10-07 23:26:03.433955	kailari-rural-municipality	\N	\N
70112	Joshipur Rural Municipality	municipality	701	2025-10-07 23:26:03.433955	joshipur-rural-municipality	\N	\N
70113	Chure Rural Municipality	municipality	701	2025-10-07 23:26:03.433955	chure-rural-municipality	\N	\N
70201	Bhimdatta Municipality	municipality	702	2025-10-07 23:26:03.43505	bhimdatta-municipality	\N	\N
70202	Punarbas Municipality	municipality	702	2025-10-07 23:26:03.43505	punarbas-municipality	\N	\N
70203	Bedkot Municipality	municipality	702	2025-10-07 23:26:03.43505	bedkot-municipality	\N	\N
70205	Shuklaphanta Municipality	municipality	702	2025-10-07 23:26:03.43505	shuklaphanta-municipality	\N	\N
70206	Belauri Municipality	municipality	702	2025-10-07 23:26:03.43505	belauri-municipality	\N	\N
70207	Krishnapur Municipality	municipality	702	2025-10-07 23:26:03.43505	krishnapur-municipality	\N	\N
70208	Beldandi Rural Municipality	municipality	702	2025-10-07 23:26:03.43505	beldandi-rural-municipality	\N	\N
70209	Laljhadi Rural Municipality	municipality	702	2025-10-07 23:26:03.43505	laljhadi-rural-municipality	\N	\N
70301	Amargadhi Municipality	municipality	703	2025-10-07 23:26:03.435843	amargadhi-municipality	\N	\N
70302	Parshuram Municipality	municipality	703	2025-10-07 23:26:03.435843	parshuram-municipality	\N	\N
70303	Aalitaal Rural Municipality	municipality	703	2025-10-07 23:26:03.435843	aalitaal-rural-municipality	\N	\N
70304	Bhageshwar Rural Municipality	municipality	703	2025-10-07 23:26:03.435843	bhageshwar-rural-municipality	\N	\N
70305	Navadurga Rural Municipality	municipality	703	2025-10-07 23:26:03.435843	navadurga-rural-municipality	\N	\N
70306	Ajaymeru Rural Municipality	municipality	703	2025-10-07 23:26:03.435843	ajaymeru-rural-municipality	\N	\N
70307	Ganyapdhura Rural Municipality	municipality	703	2025-10-07 23:26:03.435843	ganyapdhura-rural-municipality	\N	\N
70401	Dasharathchand Municipality	municipality	704	2025-10-07 23:26:03.43665	dasharathchand-municipality	\N	\N
70402	Patan Municipality	municipality	704	2025-10-07 23:26:03.43665	patan-municipality	\N	\N
70403	Melauli Municipality	municipality	704	2025-10-07 23:26:03.43665	melauli-municipality	\N	\N
70404	Purchaudi Municipality	municipality	704	2025-10-07 23:26:03.43665	purchaudi-municipality	\N	\N
70405	Surnaya Rural Municipality	municipality	704	2025-10-07 23:26:03.43665	surnaya-rural-municipality	\N	\N
70406	Sigas Rural Municipality	municipality	704	2025-10-07 23:26:03.43665	sigas-rural-municipality	\N	\N
70407	Shivanath Rural Municipality	municipality	704	2025-10-07 23:26:03.43665	shivanath-rural-municipality	\N	\N
70408	Pancheshwar Rural Municipality	municipality	704	2025-10-07 23:26:03.43665	pancheshwar-rural-municipality	\N	\N
70409	Dogdakedar Rural Municipality	municipality	704	2025-10-07 23:26:03.43665	dogdakedar-rural-municipality	\N	\N
70410	Dilasaini Rural Municipality	municipality	704	2025-10-07 23:26:03.43665	dilasaini-rural-municipality	\N	\N
70501	Dipayal Silgadhi Municipality	municipality	705	2025-10-07 23:26:03.437529	dipayal-silgadhi-municipality	\N	\N
70502	Shikhar Municipality	municipality	705	2025-10-07 23:26:03.437529	shikhar-municipality	\N	\N
70503	Purbichauki Rural Municipality	municipality	705	2025-10-07 23:26:03.437529	purbichauki-rural-municipality	\N	\N
70504	Badikedar Rural Municipality	municipality	705	2025-10-07 23:26:03.437529	badikedar-rural-municipality	\N	\N
70505	Jorayal Rural Municipality	municipality	705	2025-10-07 23:26:03.437529	jorayal-rural-municipality	\N	\N
70506	Sayal Rural Municipality	municipality	705	2025-10-07 23:26:03.437529	sayal-rural-municipality	\N	\N
70507	Aadarsha Rural Municipality	municipality	705	2025-10-07 23:26:03.437529	aadarsha-rural-municipality	\N	\N
70508	K I Singh Rural Municipality	municipality	705	2025-10-07 23:26:03.437529	k-i-singh-rural-municipality	\N	\N
70509	Bogtan Rural Municipality	municipality	705	2025-10-07 23:26:03.437529	bogtan-rural-municipality	\N	\N
70601	Mangalsen Municipality	municipality	706	2025-10-07 23:26:03.43834	mangalsen-municipality	\N	\N
70602	Kamalbazar Municipality	municipality	706	2025-10-07 23:26:03.43834	kamalbazar-municipality	\N	\N
70603	Sanphebagar Municipality	municipality	706	2025-10-07 23:26:03.43834	sanphebagar-municipality	\N	\N
70604	Panchadewal Binayak Municipality	municipality	706	2025-10-07 23:26:03.43834	panchadewal-binayak-municipality	\N	\N
70605	Chaurpati Rural Municipality	municipality	706	2025-10-07 23:26:03.43834	chaurpati-rural-municipality	\N	\N
70607	Bannigadhi Jayagadh Rural Municipality	municipality	706	2025-10-07 23:26:03.43834	bannigadhi-jayagadh-rural-municipality	\N	\N
70608	Ramaroshan Rural Municipality	municipality	706	2025-10-07 23:26:03.43834	ramaroshan-rural-municipality	\N	\N
70609	Dhakari Rural Municipality	municipality	706	2025-10-07 23:26:03.43834	dhakari-rural-municipality	\N	\N
70610	Turmakhand Rural Municipality	municipality	706	2025-10-07 23:26:03.43834	turmakhand-rural-municipality	\N	\N
70701	Jaya Prithvi Municipality	municipality	707	2025-10-07 23:26:03.439254	jaya-prithvi-municipality	\N	\N
70702	Bungal Municipality	municipality	707	2025-10-07 23:26:03.439254	bungal-municipality	\N	\N
70703	Talkot Rural Municipality	municipality	707	2025-10-07 23:26:03.439254	talkot-rural-municipality	\N	\N
70704	Masta Rural Municipality	municipality	707	2025-10-07 23:26:03.439254	masta-rural-municipality	\N	\N
70705	Khaptadchhanna Rural Municipality	municipality	707	2025-10-07 23:26:03.439254	khaptadchhanna-rural-municipality	\N	\N
70706	Thalara Rural Municipality	municipality	707	2025-10-07 23:26:03.439254	thalara-rural-municipality	\N	\N
70707	Bitthadchir Rural Municipality	municipality	707	2025-10-07 23:26:03.439254	bitthadchir-rural-municipality	\N	\N
70708	Surma Rural Municipality	municipality	707	2025-10-07 23:26:03.439254	surma-rural-municipality	\N	\N
70709	Chhabis Pathibhera Rural Municipality	municipality	707	2025-10-07 23:26:03.439254	chhabis-pathibhera-rural-municipality	\N	\N
70710	Durgathali Rural Municipality	municipality	707	2025-10-07 23:26:03.439254	durgathali-rural-municipality	\N	\N
70711	Kedarsyu Rural Municipality	municipality	707	2025-10-07 23:26:03.439254	kedarsyu-rural-municipality	\N	\N
70712	Saipal Rural Municipality	municipality	707	2025-10-07 23:26:03.439254	saipal-rural-municipality	\N	\N
70801	Badimalika Municipality	municipality	708	2025-10-07 23:26:03.440276	badimalika-municipality	\N	\N
70802	Triveni Municipality	municipality	708	2025-10-07 23:26:03.440276	triveni-municipality	\N	\N
70803	Budhiganga Municipality	municipality	708	2025-10-07 23:26:03.440276	budhiganga-municipality	\N	\N
70804	Budhinanda Municipality	municipality	708	2025-10-07 23:26:03.440276	budhinanda-municipality	\N	\N
70805	Gaumul Rural Municipality	municipality	708	2025-10-07 23:26:03.440276	gaumul-rural-municipality	\N	\N
70806	Jagannath Rural Municipality	municipality	708	2025-10-07 23:26:03.440276	jagannath-rural-municipality	\N	\N
70807	Swamikartik Khapar Rural Municipality	municipality	708	2025-10-07 23:26:03.440276	swamikartik-khapar-rural-municipality	\N	\N
70808	Khaptad Chhededaha Rural Municipality	municipality	708	2025-10-07 23:26:03.440276	khaptad-chhededaha-rural-municipality	\N	\N
70809	Himali Rural Municipality	municipality	708	2025-10-07 23:26:03.440276	himali-rural-municipality	\N	\N
70901	Shailyashikhar Municipality	municipality	709	2025-10-07 23:26:03.441109	shailyashikhar-municipality	\N	\N
70903	Malikarjun Rural Municipality	municipality	709	2025-10-07 23:26:03.441109	malikarjun-rural-municipality	\N	\N
70904	Apihimal Rural Municipality	municipality	709	2025-10-07 23:26:03.441109	apihimal-rural-municipality	\N	\N
70905	Duhun Rural Municipality	municipality	709	2025-10-07 23:26:03.441109	duhun-rural-municipality	\N	\N
70906	Naugad Rural Municipality	municipality	709	2025-10-07 23:26:03.441109	naugad-rural-municipality	\N	\N
70907	Marma Rural Municipality	municipality	709	2025-10-07 23:26:03.441109	marma-rural-municipality	\N	\N
70908	Lekam Rural Municipality	municipality	709	2025-10-07 23:26:03.441109	lekam-rural-municipality	\N	\N
70909	Byans Rural Municipality	municipality	709	2025-10-07 23:26:03.441109	byans-rural-municipality	\N	\N
10202	Mahalaxmi Municipality (Dhankuta)	municipality	102	2025-10-07 23:26:03.383368	mahalaxmi-municipality-dhankuta-	\N	\N
10705	Likhu Rural Municipality (Okhaldhunga)	municipality	107	2025-10-07 23:26:03.386542	likhu-rural-municipality-okhaldhunga-	\N	\N
10804	Miklajung Rural Municipality (Panchthar)	municipality	108	2025-10-07 23:26:03.387061	miklajung-rural-municipality-panchthar-	\N	\N
10904	Madi Municipality (Sankhuwasabha)	municipality	109	2025-10-07 23:26:03.38749	madi-municipality-sankhuwasabha-	\N	\N
20310	Aurahi Rural Municipality (Mahottari)	municipality	203	2025-10-07 23:26:03.393361	aurahi-rural-municipality-mahottari-	\N	\N
20611	Bishnupur Rural Municipality (Saptari)	municipality	206	2025-10-07 23:26:03.395595	bishnupur-rural-municipality-saptari-	\N	\N
20810	Aurahi Rural Municipality (Siraha)	municipality	208	2025-10-07 23:26:03.397307	aurahi-rural-municipality-siraha-	\N	\N
20811	Bishnupur Rural Municipality (Siraha)	municipality	208	2025-10-07 23:26:03.397307	bishnupur-rural-municipality-siraha-	\N	\N
30202	Godawari Municipality (Lalitpur)	municipality	302	2025-10-07 23:26:03.399696	godawari-municipality-lalitpur-	\N	\N
30203	Mahalaxmi Municipality (Lalitpur)	municipality	302	2025-10-07 23:26:03.399696	mahalaxmi-municipality-lalitpur-	\N	\N
30404	Madi Municipality (Chitwan)	municipality	304	2025-10-07 23:26:03.40064	madi-municipality-chitwan-	\N	\N
30508	Bagmati Rural Municipality (Makwanpur)	municipality	305	2025-10-07 23:26:03.401161	bagmati-rural-municipality-makwanpur-	\N	\N
30705	Likhu Rural Municipality (Nuwakot)	municipality	307	2025-10-07 23:26:03.402783	likhu-rural-municipality-nuwakot-	\N	\N
40302	Annapurna Rural Municipality (Kaski)	municipality	403	2025-10-07 23:26:03.409585	annapurna-rural-municipality-kaski-	\N	\N
40304	Madi Rural Municipality (Kaski)	municipality	403	2025-10-07 23:26:03.409585	madi-rural-municipality-kaski-	\N	\N
40708	Kaligandaki Rural Municipality (Syangja)	municipality	407	2025-10-07 23:26:03.411649	kaligandaki-rural-municipality-syangja-	\N	\N
41102	Annapurna Rural Municipality (Myagdi)	municipality	411	2025-10-07 23:26:03.414442	annapurna-rural-municipality-myagdi-	\N	\N
41105	Malika Rural Municipality (Myagdi)	municipality	411	2025-10-07 23:26:03.414442	malika-rural-municipality-myagdi-	\N	\N
50101	Musikot Municipality (Gulmi)	municipality	501	2025-10-07 23:26:03.416118	musikot-municipality-gulmi-	\N	\N
50104	Kaligandaki Rural Municipality (Gulmi)	municipality	501	2025-10-07 23:26:03.416118	kaligandaki-rural-municipality-gulmi-	\N	\N
50111	Malika Rural Municipality (Gulmi)	municipality	501	2025-10-07 23:26:03.416118	malika-rural-municipality-gulmi-	\N	\N
50311	Mayadevi Rural Municipality (Rupandehi)	municipality	503	2025-10-07 23:26:03.417793	mayadevi-rural-municipality-rupandehi-	\N	\N
50316	Suddhodhan Rural Municipality (Rupandehi)	municipality	503	2025-10-07 23:26:03.417793	suddhodhan-rural-municipality-rupandehi-	\N	\N
50407	Mayadevi Rural Municipality (Kapilvastu)	municipality	504	2025-10-07 23:26:03.418873	mayadevi-rural-municipality-kapilvastu-	\N	\N
50409	Suddhodhan Rural Municipality (Kapilvastu)	municipality	504	2025-10-07 23:26:03.418873	suddhodhan-rural-municipality-kapilvastu-	\N	\N
50708	Madi Rural Municipality (Rolpa)	municipality	507	2025-10-07 23:26:03.420905	madi-rural-municipality-rolpa-	\N	\N
50906	Janaki Rural Municipality (Banke)	municipality	509	2025-10-07 23:26:03.422095	janaki-rural-municipality-banke-	\N	\N
60101	Musikot Municipality (Western Rukum)	municipality	601	2025-10-07 23:26:03.425904	musikot-municipality-western-rukum-	\N	\N
60105	Tribeni Rural Municipality (Western Rukum)	municipality	601	2025-10-07 23:26:03.425904	tribeni-rural-municipality-western-rukum-	\N	\N
60205	Tribeni Rural Municipality (Salyan)	municipality	602	2025-10-07 23:26:03.42648	tribeni-rural-municipality-salyan-	\N	\N
70106	Godawari Municipality (Kailali)	municipality	701	2025-10-07 23:26:03.433955	godawari-municipality-kailali-	\N	\N
70108	Janaki Rural Municipality (Kailali)	municipality	701	2025-10-07 23:26:03.433955	janaki-rural-municipality-kailali-	\N	\N
70204	Mahakali Municipality (Kanchanpur)	municipality	702	2025-10-07 23:26:03.43505	mahakali-municipality-kanchanpur-	\N	\N
70902	Mahakali Municipality (Darchula)	municipality	709	2025-10-07 23:26:03.441109	mahakali-municipality-darchula-	\N	\N
\.


--
-- Data for Name: message_read_receipts; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.message_read_receipts (id, message_id, user_id, read_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.messages (id, conversation_id, sender_id, content, type, attachment_url, is_edited, edited_at, is_deleted, deleted_at, created_at) FROM stdin;
140	12	63	Hi, Iwant to buy this	text	\N	f	\N	f	\N	2025-12-25 19:30:05.202
141	12	63	tell me price	text	\N	f	\N	f	\N	2025-12-25 19:30:28.667
142	12	60	same as u see	text	\N	f	\N	f	\N	2025-12-25 19:30:58.122
143	13	46	Hi, I want to buy this for my wife's birthday, thora paisa kom koro..	text	\N	f	\N	f	\N	2025-12-26 17:44:56.112
144	13	46	Please did	text	\N	f	\N	f	\N	2025-12-26 17:45:54.175
145	13	62	Thik hey, koi bath nehi	text	\N	f	\N	f	\N	2025-12-26 17:46:28.76
146	13	46	Tahks	text	\N	f	\N	f	\N	2025-12-26 17:46:40.137
147	13	62	jjjj	text	\N	f	\N	f	\N	2026-01-13 18:42:32.787
148	15	62	I want to buy	text	\N	f	\N	f	\N	2026-01-13 18:48:15.153
149	16	62	hi	text	\N	f	\N	f	\N	2026-01-13 18:49:34.711
\.


--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.payment_transactions (id, user_id, payment_type, payment_gateway, amount, transaction_id, reference_id, related_id, status, metadata, created_at, verified_at, payment_url, failure_reason) FROM stdin;
69	62	individual_verification	esewa	700.00	TB_IND_1767979871981_zaiy37	\N	14	pending	"{\\"fullName\\":\\"Sam Tamang\\",\\"durationDays\\":365,\\"verificationRequestId\\":14,\\"orderName\\":\\"Individual Verification - 365 days\\",\\"initiatedAt\\":\\"2026-01-09T17:31:11.984Z\\"}"	2026-01-09 17:31:11.988	\N	/api/payments/esewa/redirect?amount=700&tax_amount=0&total_amount=700&transaction_uuid=TB_IND_1767979871981_zaiy37&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_IND_1767979871981_zaiy37%26paymentType%3Dindividual_verification%26relatedId%3D14&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_IND_1767979871981_zaiy37%26paymentType%3Dindividual_verification%26relatedId%3D14&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=rjGSIPqLyAmbeMxhK1uK8iqCMLKICn8gp7EtlIWi8U0%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
46	47	ad_promotion	esewa	200.00	TB_AD__1765283604783_gxhnni	\N	31	pending	"{\\"adId\\":31,\\"promotionType\\":\\"sticky\\",\\"durationDays\\":7,\\"orderName\\":\\"Promote Ad: iPhone 17 pro max pro 33\\",\\"initiatedAt\\":\\"2025-12-09T12:33:24.795Z\\"}"	2025-12-09 12:33:24.797	\N	/api/payments/esewa/redirect?amount=200&tax_amount=0&total_amount=200&transaction_uuid=TB_AD__1765283604783_gxhnni&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1765283604783_gxhnni%26paymentType%3Dad_promotion%26relatedId%3D31&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1765283604783_gxhnni%26paymentType%3Dad_promotion%26relatedId%3D31&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=%2FcLIMgvlU3k6PXLyFeDafyquVQ4URzJt8a%2BrHeLtcQg%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
47	59	individual_verification	esewa	70.00	TB_IND_1765310178033_qw8905	000D9R5	9	verified	"{\\"fullName\\":\\"Ananda Shahi\\",\\"durationDays\\":30,\\"verificationRequestId\\":9,\\"orderName\\":\\"Individual Verification - 30 days\\",\\"initiatedAt\\":\\"2025-12-09T19:56:18.035Z\\",\\"verifiedAt\\":\\"2025-12-09T19:57:17.752Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_IND_1765310178033_qw8905\\",\\"amount\\":70,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000D9R5\\",\\"verifiedAt\\":\\"2025-12-09T19:57:17.752Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2025-12-09 19:56:18.039	2025-12-09 19:57:17.752	/api/payments/esewa/redirect?amount=70&tax_amount=0&total_amount=70&transaction_uuid=TB_IND_1765310178033_qw8905&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_IND_1765310178033_qw8905%26paymentType%3Dindividual_verification%26relatedId%3D9&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_IND_1765310178033_qw8905%26paymentType%3Dindividual_verification%26relatedId%3D9&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=sVnXli1lVDT25Joq9gey3W9qMkwiQ4M4SVxlSIiTaqE%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
48	59	ad_promotion	esewa	29.00	TB_AD__1765986907670_d6xrsz	\N	34	pending	"{\\"adId\\":34,\\"promotionType\\":\\"sticky\\",\\"durationDays\\":3,\\"orderName\\":\\"Promote Ad: House near Thokha 5 \\",\\"initiatedAt\\":\\"2025-12-17T15:55:07.672Z\\"}"	2025-12-17 15:55:07.675	\N	/api/payments/esewa/redirect?amount=29&tax_amount=0&total_amount=29&transaction_uuid=TB_AD__1765986907670_d6xrsz&product_code=&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1765986907670_d6xrsz%26paymentType%3Dad_promotion%26relatedId%3D34&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1765986907670_d6xrsz%26paymentType%3Dad_promotion%26relatedId%3D34&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=aWq8CIsHH2lBdpRTaXNB9rr%2FkFp99HgP8cPNO%2BjlgRQ%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
49	59	ad_promotion	esewa	90.00	TB_AD__1765988048330_0i5vd8	\N	34	pending	"{\\"adId\\":34,\\"promotionType\\":\\"urgent\\",\\"durationDays\\":7,\\"orderName\\":\\"Promote Ad: House near Thokha 5 \\",\\"initiatedAt\\":\\"2025-12-17T16:14:08.340Z\\"}"	2025-12-17 16:14:08.345	\N	/api/payments/esewa/redirect?amount=90&tax_amount=0&total_amount=90&transaction_uuid=TB_AD__1765988048330_0i5vd8&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1765988048330_0i5vd8%26paymentType%3Dad_promotion%26relatedId%3D34&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1765988048330_0i5vd8%26paymentType%3Dad_promotion%26relatedId%3D34&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=Prj2dbsY2eaXbis%2BF%2F3M78MYXeeMca%2FVghNH7MVBHQQ%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
53	60	individual_verification	esewa	100.00	TB_IND_1766054407155_16twif	000DEHA	11	verified	"{\\"fullName\\":\\"Amit Sharma\\",\\"durationDays\\":30,\\"verificationRequestId\\":11,\\"orderName\\":\\"Individual Verification - 30 days\\",\\"initiatedAt\\":\\"2025-12-18T10:40:07.164Z\\",\\"verifiedAt\\":\\"2025-12-18T10:41:08.707Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_IND_1766054407155_16twif\\",\\"amount\\":100,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DEHA\\",\\"verifiedAt\\":\\"2025-12-18T10:41:08.707Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2025-12-18 10:40:07.165	2025-12-18 10:41:08.707	/api/payments/esewa/redirect?amount=100&tax_amount=0&total_amount=100&transaction_uuid=TB_IND_1766054407155_16twif&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_IND_1766054407155_16twif%26paymentType%3Dindividual_verification%26relatedId%3D11&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_IND_1766054407155_16twif%26paymentType%3Dindividual_verification%26relatedId%3D11&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=%2BkmfkWH%2FPfnguC%2BLLdjb1ZSnMmgVCI8yW2PePBJS6mw%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
50	59	ad_promotion	esewa	112.00	TB_AD__1765988136774_px795w	000DDAU	34	verified	"{\\"adId\\":34,\\"promotionType\\":\\"featured\\",\\"durationDays\\":7,\\"orderName\\":\\"Promote Ad: House near Thokha 5 \\",\\"initiatedAt\\":\\"2025-12-17T16:15:36.782Z\\",\\"verifiedAt\\":\\"2025-12-17T16:16:11.733Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1765988136774_px795w\\",\\"amount\\":112,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DDAU\\",\\"verifiedAt\\":\\"2025-12-17T16:16:11.733Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2025-12-17 16:15:36.783	2025-12-17 16:16:11.733	/api/payments/esewa/redirect?amount=112&tax_amount=0&total_amount=112&transaction_uuid=TB_AD__1765988136774_px795w&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1765988136774_px795w%26paymentType%3Dad_promotion%26relatedId%3D34&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1765988136774_px795w%26paymentType%3Dad_promotion%26relatedId%3D34&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=zZuM86JdDVryIOf5yxusspRtqq7hd9wl8SeqzhaXaWI%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
51	59	ad_promotion	khalti	640.00	TB_AD__1765988207521_wxf1s1	cP49ChWpGG7Qw45WMtceWT	33	verified	"{\\"adId\\":33,\\"promotionType\\":\\"urgent\\",\\"durationDays\\":7,\\"orderName\\":\\"Promote Ad: Car\\",\\"initiatedAt\\":\\"2025-12-17T16:16:47.534Z\\",\\"pidx\\":\\"aTrhDxr4gfBMXTNHWRxYbm\\",\\"expiresAt\\":\\"2025-12-17T22:31:48.835641+05:45\\",\\"verifiedAt\\":\\"2025-12-17T16:17:26.756Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1765988207521_wxf1s1\\",\\"amount\\":640,\\"gateway\\":\\"khalti\\",\\"gatewayTransactionId\\":\\"cP49ChWpGG7Qw45WMtceWT\\",\\"verifiedAt\\":\\"2025-12-17T16:17:26.756Z\\"},\\"khaltiTxnId\\":\\"cP49ChWpGG7Qw45WMtceWT\\",\\"esewaData\\":null}"	2025-12-17 16:16:47.535	2025-12-17 16:17:26.756	https://test-pay.khalti.com/?pidx=aTrhDxr4gfBMXTNHWRxYbm	\N
52	60	individual_verification	esewa	100.00	TB_IND_1766054298265_dccu1f	\N	10	pending	"{\\"fullName\\":\\"Amit Sharma\\",\\"durationDays\\":30,\\"verificationRequestId\\":10,\\"orderName\\":\\"Individual Verification - 30 days\\",\\"initiatedAt\\":\\"2025-12-18T10:38:18.268Z\\"}"	2025-12-18 10:38:18.273	\N	/api/payments/esewa/redirect?amount=100&tax_amount=0&total_amount=100&transaction_uuid=TB_IND_1766054298265_dccu1f&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_IND_1766054298265_dccu1f%26paymentType%3Dindividual_verification%26relatedId%3D10&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_IND_1766054298265_dccu1f%26paymentType%3Dindividual_verification%26relatedId%3D10&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=ywKmZkEjpDqN2pgL2tm6NRAKrmPRA8UQi1XConUl1YE%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
54	62	business_verification	esewa	200.00	TB_BUS_1766059050727_zk983d	000DEQC	15	verified	"{\\"businessName\\":\\"Dija Fashion Shop\\",\\"durationDays\\":30,\\"verificationRequestId\\":15,\\"orderName\\":\\"Business Verification - 30 days\\",\\"initiatedAt\\":\\"2025-12-18T11:57:30.730Z\\",\\"verifiedAt\\":\\"2025-12-18T11:58:11.274Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_BUS_1766059050727_zk983d\\",\\"amount\\":200,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DEQC\\",\\"verifiedAt\\":\\"2025-12-18T11:58:11.274Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2025-12-18 11:57:30.731	2025-12-18 11:58:11.274	/api/payments/esewa/redirect?amount=200&tax_amount=0&total_amount=200&transaction_uuid=TB_BUS_1766059050727_zk983d&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_BUS_1766059050727_zk983d%26paymentType%3Dbusiness_verification%26relatedId%3D15&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_BUS_1766059050727_zk983d%26paymentType%3Dbusiness_verification%26relatedId%3D15&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=VwQzHRpGosqfaUliFiiUb3SMqEmGyI7shtCqfAwX3sI%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
58	62	ad_promotion	esewa	960.00	TB_AD__1766209049576_0tupqo	000DF5W	36	verified	"{\\"adId\\":36,\\"promotionType\\":\\"featured\\",\\"durationDays\\":7,\\"orderName\\":\\"Promote Ad: Bag\\",\\"initiatedAt\\":\\"2025-12-20T05:37:29.579Z\\",\\"verifiedAt\\":\\"2025-12-20T05:38:01.801Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1766209049576_0tupqo\\",\\"amount\\":960,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DF5W\\",\\"verifiedAt\\":\\"2025-12-20T05:38:01.801Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2025-12-20 05:37:29.582	2025-12-20 05:38:01.801	/api/payments/esewa/redirect?amount=960&tax_amount=0&total_amount=960&transaction_uuid=TB_AD__1766209049576_0tupqo&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766209049576_0tupqo%26paymentType%3Dad_promotion%26relatedId%3D36&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766209049576_0tupqo%26paymentType%3Dad_promotion%26relatedId%3D36&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=DNxVc4O3IFlQ0fXVfHVwfcKbegahnddSaX2v6qAokQg%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
59	63	business_verification	esewa	200.00	TB_BUS_1766682243321_yhqusu	000DHI5	16	verified	"{\\"businessName\\":\\"Alina Mobile Store\\",\\"durationDays\\":30,\\"verificationRequestId\\":16,\\"orderName\\":\\"Business Verification - 30 days\\",\\"initiatedAt\\":\\"2025-12-25T17:04:03.327Z\\",\\"verifiedAt\\":\\"2025-12-25T17:04:37.935Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_BUS_1766682243321_yhqusu\\",\\"amount\\":200,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DHI5\\",\\"verifiedAt\\":\\"2025-12-25T17:04:37.935Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2025-12-25 17:04:03.33	2025-12-25 17:04:37.935	/api/payments/esewa/redirect?amount=200&tax_amount=0&total_amount=200&transaction_uuid=TB_BUS_1766682243321_yhqusu&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_BUS_1766682243321_yhqusu%26paymentType%3Dbusiness_verification%26relatedId%3D16&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_BUS_1766682243321_yhqusu%26paymentType%3Dbusiness_verification%26relatedId%3D16&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=Max24LJ%2FATEiSSghjejOZjdNNXuLGK41dM0R8iyaQ50%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
62	62	ad_promotion	esewa	70.00	TB_AD__1766706257052_1rlr3o	000DHJO	54	verified	"{\\"adId\\":54,\\"promotionType\\":\\"sticky\\",\\"durationDays\\":3,\\"orderName\\":\\"Promote Ad: Ramie Shirt with Pockets\\",\\"initiatedAt\\":\\"2025-12-25T23:44:17.055Z\\",\\"verifiedAt\\":\\"2025-12-25T23:44:33.018Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1766706257052_1rlr3o\\",\\"amount\\":70,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DHJO\\",\\"verifiedAt\\":\\"2025-12-25T23:44:33.018Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2025-12-25 23:44:17.056	2025-12-25 23:44:33.018	/api/payments/esewa/redirect?amount=70&tax_amount=0&total_amount=70&transaction_uuid=TB_AD__1766706257052_1rlr3o&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766706257052_1rlr3o%26paymentType%3Dad_promotion%26relatedId%3D54&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766706257052_1rlr3o%26paymentType%3Dad_promotion%26relatedId%3D54&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=3wDUsVgMEuMQM61Hz1BPhdNepWlsQ2BmDoBQExJIOdA%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
60	47	individual_verification	khalti	100.00	TB_IND_1766684057702_a8aby0	5UaSZzUukviLW4EEnNSSNg	12	verified	"{\\"fullName\\":\\"Amit Sharma\\",\\"durationDays\\":30,\\"verificationRequestId\\":12,\\"orderName\\":\\"Individual Verification - 30 days\\",\\"initiatedAt\\":\\"2025-12-25T17:34:17.704Z\\",\\"pidx\\":\\"caVJXq3zLiuuhPZE82CovJ\\",\\"expiresAt\\":\\"2025-12-25T23:49:18.579038+05:45\\",\\"verifiedAt\\":\\"2025-12-25T17:35:02.312Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_IND_1766684057702_a8aby0\\",\\"amount\\":100,\\"gateway\\":\\"khalti\\",\\"gatewayTransactionId\\":\\"5UaSZzUukviLW4EEnNSSNg\\",\\"verifiedAt\\":\\"2025-12-25T17:35:02.312Z\\"},\\"khaltiTxnId\\":\\"5UaSZzUukviLW4EEnNSSNg\\",\\"esewaData\\":null}"	2025-12-25 17:34:17.705	2025-12-25 17:35:02.312	https://test-pay.khalti.com/?pidx=caVJXq3zLiuuhPZE82CovJ	\N
61	62	ad_promotion	esewa	70.00	TB_AD__1766706191640_j14tyd	\N	54	pending	"{\\"adId\\":54,\\"promotionType\\":\\"sticky\\",\\"durationDays\\":3,\\"orderName\\":\\"Promote Ad: Ramie Shirt with Pockets\\",\\"initiatedAt\\":\\"2025-12-25T23:43:11.645Z\\"}"	2025-12-25 23:43:11.648	\N	/api/payments/esewa/redirect?amount=70&tax_amount=0&total_amount=70&transaction_uuid=TB_AD__1766706191640_j14tyd&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766706191640_j14tyd%26paymentType%3Dad_promotion%26relatedId%3D54&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766706191640_j14tyd%26paymentType%3Dad_promotion%26relatedId%3D54&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=HD98nk%2B2lmF6GXnu4ivAG4xIDL%2B7r1kCKiLw6vsaypo%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
63	62	ad_promotion	esewa	300.00	TB_AD__1766710911581_blutkw	000DHJT	57	verified	"{\\"adId\\":57,\\"promotionType\\":\\"urgent\\",\\"durationDays\\":3,\\"orderName\\":\\"Promote Ad: Foil Spot Mini Dress\\",\\"initiatedAt\\":\\"2025-12-26T01:01:51.591Z\\",\\"verifiedAt\\":\\"2025-12-26T01:02:19.868Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1766710911581_blutkw\\",\\"amount\\":300,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DHJT\\",\\"verifiedAt\\":\\"2025-12-26T01:02:19.868Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2025-12-26 01:01:51.617	2025-12-26 01:02:19.868	/api/payments/esewa/redirect?amount=300&tax_amount=0&total_amount=300&transaction_uuid=TB_AD__1766710911581_blutkw&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766710911581_blutkw%26paymentType%3Dad_promotion%26relatedId%3D57&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766710911581_blutkw%26paymentType%3Dad_promotion%26relatedId%3D57&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=tqJqsSnCziKFNheIRKxYtPhICgzqXgdt5DlPGZHR0D0%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
66	47	ad_promotion	khalti	67.00	TB_AD__1766771367186_jyg1a6	gtRvekkahwxoCVxsBbbHG9	78	verified	"{\\"adId\\":78,\\"promotionType\\":\\"sticky\\",\\"durationDays\\":7,\\"orderName\\":\\"Promote Ad: 2013 Kia Optima EX\\",\\"initiatedAt\\":\\"2025-12-26T17:49:27.217Z\\",\\"pidx\\":\\"aHHdwvNHMbNxGGkiMz3534\\",\\"expiresAt\\":\\"2025-12-27T00:04:27.962799+05:45\\",\\"verifiedAt\\":\\"2025-12-26T17:50:59.339Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1766771367186_jyg1a6\\",\\"amount\\":67,\\"gateway\\":\\"khalti\\",\\"gatewayTransactionId\\":\\"gtRvekkahwxoCVxsBbbHG9\\",\\"verifiedAt\\":\\"2025-12-26T17:50:59.339Z\\"},\\"khaltiTxnId\\":\\"gtRvekkahwxoCVxsBbbHG9\\",\\"esewaData\\":null}"	2025-12-26 17:49:27.219	2025-12-26 17:50:59.339	https://test-pay.khalti.com/?pidx=aHHdwvNHMbNxGGkiMz3534	\N
64	62	ad_promotion	esewa	600.00	TB_AD__1766711023301_qnqu5k	000DHJV	55	verified	"{\\"adId\\":55,\\"promotionType\\":\\"featured\\",\\"durationDays\\":3,\\"orderName\\":\\"Promote Ad: Shoulder Straps Fitted Top\\",\\"initiatedAt\\":\\"2025-12-26T01:03:43.304Z\\",\\"verifiedAt\\":\\"2025-12-26T01:04:06.215Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1766711023301_qnqu5k\\",\\"amount\\":600,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DHJV\\",\\"verifiedAt\\":\\"2025-12-26T01:04:06.215Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2025-12-26 01:03:43.305	2025-12-26 01:04:06.215	/api/payments/esewa/redirect?amount=600&tax_amount=0&total_amount=600&transaction_uuid=TB_AD__1766711023301_qnqu5k&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766711023301_qnqu5k%26paymentType%3Dad_promotion%26relatedId%3D55&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766711023301_qnqu5k%26paymentType%3Dad_promotion%26relatedId%3D55&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=YlePMNklbjO7VNa8daoA4s7HUi6DOgW8Y3fa8iV%2FbEU%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
65	46	individual_verification	esewa	700.00	TB_IND_1766768838168_0k2ccf	000DHXM	13	verified	"{\\"fullName\\":\\"Rohit Thapa\\",\\"durationDays\\":365,\\"verificationRequestId\\":13,\\"orderName\\":\\"Individual Verification - 365 days\\",\\"initiatedAt\\":\\"2025-12-26T17:07:18.171Z\\",\\"verifiedAt\\":\\"2025-12-26T17:08:04.088Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_IND_1766768838168_0k2ccf\\",\\"amount\\":700,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DHXM\\",\\"verifiedAt\\":\\"2025-12-26T17:08:04.088Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2025-12-26 17:07:18.179	2025-12-26 17:08:04.088	/api/payments/esewa/redirect?amount=700&tax_amount=0&total_amount=700&transaction_uuid=TB_IND_1766768838168_0k2ccf&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_IND_1766768838168_0k2ccf%26paymentType%3Dindividual_verification%26relatedId%3D13&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_IND_1766768838168_0k2ccf%26paymentType%3Dindividual_verification%26relatedId%3D13&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=J9XX8b5Tt3hjKmcth6N2%2BKrmiR0Ulyz%2Fy0jLxhXxTHk%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
68	60	ad_promotion	esewa	60.00	TB_AD__1766771804153_2j1cii	000DHY4	83	verified	"{\\"adId\\":83,\\"promotionType\\":\\"featured\\",\\"durationDays\\":3,\\"orderName\\":\\"Promote Ad: Beautiful Bungalow For Sale\\",\\"initiatedAt\\":\\"2025-12-26T17:56:44.157Z\\",\\"verifiedAt\\":\\"2025-12-26T17:57:03.816Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1766771804153_2j1cii\\",\\"amount\\":60,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DHY4\\",\\"verifiedAt\\":\\"2025-12-26T17:57:03.816Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2025-12-26 17:56:44.16	2025-12-26 17:57:03.816	/api/payments/esewa/redirect?amount=60&tax_amount=0&total_amount=60&transaction_uuid=TB_AD__1766771804153_2j1cii&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766771804153_2j1cii%26paymentType%3Dad_promotion%26relatedId%3D83&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1766771804153_2j1cii%26paymentType%3Dad_promotion%26relatedId%3D83&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=LdVHdw7wgY%2FEM7HOHLu2e%2B9i8QCFSW%2FUi5Y0JJp0RDM%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
67	47	ad_promotion	khalti	84.00	TB_AD__1766771579101_8tsrd8	4ft4uH7bnkP5tcDG6jmXmQ	81	verified	"{\\"adId\\":81,\\"promotionType\\":\\"urgent\\",\\"durationDays\\":7,\\"orderName\\":\\"Promote Ad: 2023 Land Rover Defender\\",\\"initiatedAt\\":\\"2025-12-26T17:52:59.104Z\\",\\"pidx\\":\\"quLM5sSRhR57VH5BjRr8V5\\",\\"expiresAt\\":\\"2025-12-27T00:08:00.000684+05:45\\",\\"verifiedAt\\":\\"2025-12-26T17:54:02.627Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1766771579101_8tsrd8\\",\\"amount\\":84,\\"gateway\\":\\"khalti\\",\\"gatewayTransactionId\\":\\"4ft4uH7bnkP5tcDG6jmXmQ\\",\\"verifiedAt\\":\\"2025-12-26T17:54:02.627Z\\"},\\"khaltiTxnId\\":\\"4ft4uH7bnkP5tcDG6jmXmQ\\",\\"esewaData\\":null}"	2025-12-26 17:52:59.105	2025-12-26 17:54:02.627	https://test-pay.khalti.com/?pidx=quLM5sSRhR57VH5BjRr8V5	\N
70	62	ad_promotion	esewa	350.00	TB_AD__1768083080869_knuy23	000DRX0	64	verified	"{\\"adId\\":64,\\"promotionType\\":\\"featured\\",\\"durationDays\\":15,\\"orderName\\":\\"Promote Ad: Abstract Print Cotton Blouse\\",\\"initiatedAt\\":\\"2026-01-10T22:11:20.872Z\\",\\"verifiedAt\\":\\"2026-01-10T22:12:08.923Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1768083080869_knuy23\\",\\"amount\\":350,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DRX0\\",\\"verifiedAt\\":\\"2026-01-10T22:12:08.923Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2026-01-10 22:11:20.875	2026-01-10 22:12:08.923	/api/payments/esewa/redirect?amount=350&tax_amount=0&total_amount=350&transaction_uuid=TB_AD__1768083080869_knuy23&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1768083080869_knuy23%26paymentType%3Dad_promotion%26relatedId%3D64&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1768083080869_knuy23%26paymentType%3Dad_promotion%26relatedId%3D64&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=X7Gyj1LDnDvHOIAhXLv%2BY3YRRzimJNfpWD0opmsDw%2BE%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
71	62	ad_promotion	esewa	350.00	TB_AD__1768083308439_kkzu1t	000DRX1	57	verified	"{\\"adId\\":57,\\"promotionType\\":\\"featured\\",\\"durationDays\\":15,\\"orderName\\":\\"Promote Ad: Foil Spot Mini Dress\\",\\"initiatedAt\\":\\"2026-01-10T22:15:08.443Z\\",\\"verifiedAt\\":\\"2026-01-10T22:15:28.772Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1768083308439_kkzu1t\\",\\"amount\\":350,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DRX1\\",\\"verifiedAt\\":\\"2026-01-10T22:15:28.772Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2026-01-10 22:15:08.444	2026-01-10 22:15:28.772	/api/payments/esewa/redirect?amount=350&tax_amount=0&total_amount=350&transaction_uuid=TB_AD__1768083308439_kkzu1t&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1768083308439_kkzu1t%26paymentType%3Dad_promotion%26relatedId%3D57&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1768083308439_kkzu1t%26paymentType%3Dad_promotion%26relatedId%3D57&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=%2FypE81qL8OWqE8sKKzfIYS7ojChtpqO4%2BA0NdT7%2BCmU%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
72	62	ad_promotion	esewa	200.00	TB_AD__1768083389231_j503mc	000DRX2	58	verified	"{\\"adId\\":58,\\"promotionType\\":\\"featured\\",\\"durationDays\\":7,\\"orderName\\":\\"Promote Ad: Sequin Textured Knit A-Line Gown\\",\\"initiatedAt\\":\\"2026-01-10T22:16:29.234Z\\",\\"verifiedAt\\":\\"2026-01-10T22:16:50.494Z\\",\\"gatewayResponse\\":{\\"success\\":true,\\"status\\":\\"completed\\",\\"transactionId\\":\\"TB_AD__1768083389231_j503mc\\",\\"amount\\":200,\\"gateway\\":\\"esewa\\",\\"gatewayTransactionId\\":\\"000DRX2\\",\\"verifiedAt\\":\\"2026-01-10T22:16:50.494Z\\"},\\"khaltiTxnId\\":null,\\"esewaData\\":null}"	2026-01-10 22:16:29.235	2026-01-10 22:16:50.494	/api/payments/esewa/redirect?amount=200&tax_amount=0&total_amount=200&transaction_uuid=TB_AD__1768083389231_j503mc&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1768083389231_j503mc%26paymentType%3Dad_promotion%26relatedId%3D58&failure_url=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fpayments%2Fcallback%3Fgateway%3Desewa%26orderId%3DTB_AD__1768083389231_j503mc%26paymentType%3Dad_promotion%26relatedId%3D58&signed_field_names=total_amount%2Ctransaction_uuid%2Cproduct_code&signature=P9DTwlK548mW3saEK9ifP0z%2FyH1jo3wdwzwp29Y6%2Ffc%3D&formUrl=https%3A%2F%2Frc-epay.esewa.com.np%2Fapi%2Fepay%2Fmain%2Fv2%2Fform	\N
\.


--
-- Data for Name: phone_otps; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.phone_otps (id, phone, otp_code, purpose, attempts, is_used, expires_at, created_at) FROM stdin;
1	9766850410	968773	registration	0	t	2025-12-07 14:29:54.369	2025-12-07 14:19:54.372
2	9766850410	618896	registration	0	t	2025-12-07 14:31:18.847	2025-12-07 14:21:18.849
3	9860090264	326231	registration	0	t	2025-12-07 14:42:51.4	2025-12-07 14:32:51.402
4	9860090264	479414	login	0	f	2025-12-07 14:54:19.462	2025-12-07 14:44:19.464
6	9860090264	946630	password_reset	0	t	2025-12-08 16:19:42.066	2025-12-08 16:09:42.069
7	9860090264	228688	password_reset	0	t	2025-12-08 16:27:35.645	2025-12-08 16:17:35.646
8	9823241785	841582	phone_verification	0	t	2025-12-09 11:23:18.088	2025-12-09 11:13:18.091
9	9843963410	259252	registration	0	t	2025-12-09 19:40:40.797	2025-12-09 19:30:40.806
10	9843963410	844221	registration	0	t	2025-12-09 19:56:32.686	2025-12-09 19:46:32.689
11	9843963410	145222	registration	1	t	2025-12-09 19:57:53.184	2025-12-09 19:47:53.184
12	9843963410	939095	password_reset	0	t	2025-12-17 12:53:01.47	2025-12-17 12:43:01.473
13	9843963410	696955	password_reset	0	t	2025-12-17 12:57:57.128	2025-12-17 12:47:57.129
14	9844463084	700875	registration	0	t	2025-12-18 08:58:11.469	2025-12-18 08:48:11.472
16	9803093361	720930	registration	0	t	2025-12-18 12:01:36.938	2025-12-18 11:51:36.941
17	9841234567	951098	registration	0	t	2025-12-18 12:03:44.816	2025-12-18 11:53:44.816
15	9706657812	276419	registration	0	t	2025-12-18 11:48:02.609	2025-12-18 11:38:02.617
18	9706657812	740290	registration	0	t	2025-12-18 12:04:27.722	2025-12-18 11:54:27.722
19	9803093361	631818	registration	0	t	2025-12-18 12:19:09.367	2025-12-18 12:09:09.368
21	9841234567	557443	login	0	f	2025-12-20 04:38:35.442	2025-12-20 04:28:35.445
20	9702539630	258712	registration	0	t	2025-12-18 12:23:14.123	2025-12-18 12:13:14.123
22	9702539630	791350	registration	0	f	2025-12-26 10:47:25.03	2025-12-26 10:37:25.037
23	9766850410	629757	phone_verification	0	t	2025-12-26 17:13:17.677	2025-12-26 17:03:17.679
24	9823241785	243812	account_deletion	0	f	2025-12-26 18:05:38.807	2025-12-26 17:55:38.807
\.


--
-- Data for Name: promotion_pricing; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.promotion_pricing (id, promotion_type, duration_days, account_type, price, discount_percentage, is_active, created_at, updated_at, pricing_tier) FROM stdin;
51	featured	3	individual	1000.00	0	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
53	featured	3	business	600.00	40	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
54	featured	7	individual	2000.00	0	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
55	featured	7	individual_verified	1600.00	20	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
56	featured	7	business	1200.00	40	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
57	featured	15	individual	3500.00	0	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
58	featured	15	individual_verified	2800.00	20	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
59	featured	15	business	2100.00	40	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
60	urgent	3	individual	500.00	0	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
61	urgent	3	individual_verified	400.00	20	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
62	urgent	3	business	300.00	40	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
63	urgent	7	individual	1000.00	0	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
64	urgent	7	individual_verified	800.00	20	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
65	urgent	7	business	600.00	40	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
66	urgent	15	individual	1750.00	0	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
67	urgent	15	individual_verified	1400.00	20	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
68	urgent	15	business	1050.00	40	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
69	sticky	3	individual	100.00	0	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
70	sticky	3	individual_verified	85.00	15	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
71	sticky	3	business	70.00	30	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
72	sticky	7	individual	200.00	0	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
73	sticky	7	individual_verified	170.00	15	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
74	sticky	7	business	140.00	30	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
75	sticky	15	individual	350.00	0	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
76	sticky	15	individual_verified	297.00	15	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
77	sticky	15	business	245.00	30	t	2025-10-22 11:53:14.980085	2025-10-22 11:53:14.980085	default
52	featured	3	individual_verified	800.00	32	t	2025-10-22 11:53:14.980085	2025-12-10 00:17:00.800404	default
78	featured	7	individual	175.00	15	f	2025-12-17 09:58:30.451	2025-12-17 15:44:26.103146	electronics
79	featured	3	individual	45.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
80	featured	3	individual_verified	45.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
81	featured	3	business	45.00	10	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
83	featured	7	individual_verified	105.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
84	featured	7	business	105.00	10	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
85	featured	14	individual	210.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
86	featured	14	individual_verified	210.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
87	featured	14	business	210.00	10	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
88	urgent	3	individual	36.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
89	urgent	3	individual_verified	36.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
90	urgent	3	business	36.00	10	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
91	urgent	7	individual	84.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
92	urgent	7	individual_verified	84.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
93	urgent	7	business	84.00	10	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
94	urgent	14	individual	168.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
95	urgent	14	individual_verified	168.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
96	urgent	14	business	168.00	10	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
97	sticky	3	individual	30.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
98	sticky	3	individual_verified	30.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
99	sticky	3	business	30.00	10	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
100	sticky	7	individual	70.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
101	sticky	7	individual_verified	70.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
102	sticky	7	business	70.00	10	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
103	sticky	14	individual	140.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
104	sticky	14	individual_verified	140.00	0	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
105	sticky	14	business	140.00	10	t	2025-12-17 15:46:06.192473	2025-12-17 15:46:06.192473	electronics
106	featured	3	individual	60.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
107	featured	3	individual_verified	60.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
108	featured	3	business	60.00	15	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
109	featured	7	individual	140.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
110	featured	7	individual_verified	140.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
111	featured	7	business	140.00	15	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
112	featured	14	individual	280.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
113	featured	14	individual_verified	280.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
114	featured	14	business	280.00	15	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
115	urgent	3	individual	45.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
116	urgent	3	individual_verified	45.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
117	urgent	3	business	45.00	15	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
118	urgent	7	individual	105.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
119	urgent	7	individual_verified	105.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
120	urgent	7	business	105.00	15	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
121	urgent	14	individual	210.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
122	urgent	14	individual_verified	210.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
123	urgent	14	business	210.00	15	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
124	sticky	3	individual	36.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
125	sticky	3	individual_verified	36.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
126	sticky	3	business	36.00	15	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
127	sticky	7	individual	84.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
128	sticky	7	individual_verified	84.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
129	sticky	7	business	84.00	15	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
130	sticky	14	individual	168.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
131	sticky	14	individual_verified	168.00	0	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
132	sticky	14	business	168.00	15	t	2025-12-17 15:46:06.213857	2025-12-17 15:46:06.213857	vehicles
133	featured	3	individual	75.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
134	featured	3	individual_verified	75.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
135	featured	3	business	75.00	20	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
136	featured	7	individual	175.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
137	featured	7	individual_verified	175.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
138	featured	7	business	175.00	20	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
139	featured	14	individual	350.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
140	featured	14	individual_verified	350.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
141	featured	14	business	350.00	20	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
142	urgent	3	individual	60.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
143	urgent	3	individual_verified	60.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
144	urgent	3	business	60.00	20	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
145	urgent	7	individual	140.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
146	urgent	7	individual_verified	140.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
147	urgent	7	business	140.00	20	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
148	urgent	14	individual	280.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
149	urgent	14	individual_verified	280.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
150	urgent	14	business	280.00	20	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
151	sticky	3	individual	45.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
152	sticky	3	individual_verified	45.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
153	sticky	3	business	45.00	20	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
154	sticky	7	individual	105.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
155	sticky	7	individual_verified	105.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
156	sticky	7	business	105.00	20	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
157	sticky	14	individual	210.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
158	sticky	14	individual_verified	210.00	5	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
159	sticky	14	business	210.00	20	t	2025-12-17 15:46:06.214563	2025-12-17 15:46:06.214563	property
\.


--
-- Data for Name: promotional_campaigns; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.promotional_campaigns (id, name, description, discount_percentage, promo_code, banner_text, banner_emoji, start_date, end_date, is_active, applies_to_tiers, applies_to_promotion_types, min_duration_days, max_uses, current_uses, created_by, created_at, updated_at) FROM stdin;
4	NewYear2026	For new year 2026	50	NEWYEAR2026	\N	🎉	2025-12-26 00:00:00	2026-01-15 00:00:00	t	{}	{featured,urgent,sticky}	\N	\N	0	\N	2025-12-26 18:14:54.419	2025-12-26 18:14:54.419
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.refresh_tokens (id, user_id, token, expires_at, created_at, is_revoked, replaced_by) FROM stdin;
1	60	562a6979a7d58dd5875e8835ddf1f5fc64686971241e730cce23e606635d9c76c11510a00aea5faf	2026-01-27 18:34:52.289	2025-12-28 18:34:52.293	f	\N
2	57	856e484c0a760239e5486bf0ebce4eb5a4c9476ab47b9afe54a7438fb4a9daec0368165b3f3edb20	2026-01-27 18:47:06.002	2025-12-28 18:47:06.009	f	\N
3	57	4f32d6795cde7e7858e32d8c251cb420f526be9e588df93b5a612b158e832b56deac034e3d1a2245	2026-01-27 18:49:53.155	2025-12-28 18:49:53.158	f	\N
4	57	bba25a90d6c119b1818e0917bb9e0231b7d4dd475968c0760ee55009a8414d6f2eed1a3df548f1b9	2026-01-27 18:50:11.883	2025-12-28 18:50:11.884	f	\N
5	60	1083791c2ecb38babdcd7654db12c2f9a44068a401b2d5c27c9373d48c834b61bdf99e663b1c8b14	2026-01-27 18:56:18.873	2025-12-28 18:56:18.876	f	\N
6	57	7918f079b9e686fbbb6849f32d2bc6b85f19fd048f5de4d4f56bdaac00681d36881417543c0b7019	2026-01-27 18:56:28.786	2025-12-28 18:56:28.787	f	\N
7	57	05c114c7f5ac2bbcec75764917f128c1941cf3aac8a500a4dfcacc00a1bbd03f7cdc5087b49ed35d	2026-01-27 18:58:38.902	2025-12-28 18:58:38.903	f	\N
8	46	501de88c1f91525a5b13bb5fd1cf0aae8b4e1ced4842622bb259de58590e56268dca4e255ae1fbb1	2026-01-27 18:58:44.542	2025-12-28 18:58:44.543	f	\N
9	57	3d8dc2cca63d22bafed65499a2b8c60206d10c2943e3a2e86f8b78d111fc348a8c74b6d2dedb6a96	2026-01-27 22:24:34.172	2025-12-28 22:24:34.175	f	\N
10	57	fe3d13dbbaacb11f1555b42fc8f546debb65f06ab728cfbd4897273e59b4816cb5c61a78e1fe8e31	2026-01-27 22:31:25.431	2025-12-28 22:31:25.434	f	\N
11	57	3995ac9b1997e2c56e229b551db5f4733c235c8a3ccdeea1bd2854334c0617a7b2e3a17dcc3354d7	2026-01-27 22:35:51.131	2025-12-28 22:35:51.134	f	\N
12	57	8101c111c11aaae48182a1bb361b3937d5361efcb14d7430a9adc503c327b4ecd07589093fd8aa4f	2026-01-27 22:45:45.084	2025-12-28 22:45:45.088	f	\N
13	57	e2ea17e9bfe098033ac31d5a6ecc15dc885ea83d42d07554a4d99a7d44d69d26e252e9c154493094	2026-01-27 23:02:16.509	2025-12-28 23:02:16.513	f	\N
14	60	433ac80c6c2f764c3de7a8da4d5ae562c4aafe15c90bea4ebd8c171fcda3ee76f544cf974e01abec	2026-01-28 00:45:38.586	2025-12-29 00:45:38.591	t	a805a649c274946b7043e6d22e6426a49facad9a90df192203ac01a36bb49d6e94e0d45b58cd9ec7
48	64	54f6f3a3c99f1cff878e13ce5b0d2c8079f1e1b9ec0983973e079816e5d8132442541d2b9169db94	2026-01-31 08:59:13.498	2026-01-01 08:59:13.5	f	\N
49	64	2ac52ce824111d2e7b73c6b136bd205c2ef2894eca2ea9ae1f41a11ed5096c5f90d0a247036ddce7	2026-01-31 09:04:42.794	2026-01-01 09:04:42.797	f	\N
50	65	7e6d513e71fd901d9f06d803fb8d00a445ee448ca1547ea0675ac176f6fd7d61e1a7207c0a0e66b5	2026-01-31 09:04:54.509	2026-01-01 09:04:54.51	f	\N
51	64	a823251e7585226b0848de5ebc0dd7a95f97b9bb5e51c1602f16c12092b36bb2bcb957b6c53c9eee	2026-01-31 09:15:23.919	2026-01-01 09:15:23.92	f	\N
52	64	347f8dd4dc0a01884e40cd7436aa9b7872250b0241713212840d563fda90cab64bba27ed445e50f8	2026-01-31 09:27:20.254	2026-01-01 09:27:20.256	f	\N
53	64	d0eabe4312cd90ac6946b5e469f3d7b7f7b95d4aa81f6d9b2b6822823dd9ac078aee07578cf5caf1	2026-01-31 09:38:27.073	2026-01-01 09:38:27.085	f	\N
54	64	e923e6f1837690e20f4f64dd14ed1cf1891d8b9521a69427b699efcd3e267cb7390c3e8653faa6d6	2026-01-31 09:53:46.545	2026-01-01 09:53:46.55	f	\N
55	64	372132ebccacbac68667e20531cf0d60058ca44244005aa3f4022b8876555e53d1d54a2fc5b8403b	2026-01-31 10:15:22.892	2026-01-01 10:15:22.893	f	\N
15	60	a805a649c274946b7043e6d22e6426a49facad9a90df192203ac01a36bb49d6e94e0d45b58cd9ec7	2026-01-31 08:01:49.924	2026-01-01 08:01:49.934	t	855f917b1b6af7646ddb0a2328208d9eb70be77a1fd83b12f04ecb4f69311e5c37723ff0cfe597f7
56	60	855f917b1b6af7646ddb0a2328208d9eb70be77a1fd83b12f04ecb4f69311e5c37723ff0cfe597f7	2026-02-02 01:56:57.036	2026-01-03 01:56:57.065	f	\N
57	63	143942200f68d612bb3ec4e5ef93630f7ae6967c871037fa60ca0ed5024c37032f68ccfe00e2b03f	2026-02-05 23:33:18.617	2026-01-06 23:33:18.624	f	\N
59	63	0f1e51a22872d17511e1e09d312cfc73a1a94233bc7f99413c82abef97c4297dc9e8b2fced513088	2026-02-05 23:44:23.766	2026-01-06 23:44:23.767	f	\N
60	63	e983ff02b9349f8aefafc36966d8d99eac9bae8fb72a406f8b69c99b35f31d314917a463037ba631	2026-02-07 16:34:23.767	2026-01-08 16:34:23.792	f	\N
58	63	3ee224be7bebd54ee613ed5430e698d7fc0825522e310db1046a78bd1cc19b509657dfa387c074c7	2026-02-05 23:44:06.637	2026-01-06 23:44:06.638	t	47ca21082791baa91786d7568b677bbbd2b03942ef862e0ef8b20b7e8ced2376718c1db83d614b74
63	63	47ca21082791baa91786d7568b677bbbd2b03942ef862e0ef8b20b7e8ced2376718c1db83d614b74	2026-02-08 23:41:34.508	2026-01-09 23:41:34.613	f	\N
64	63	0e6403909f276a82dd76b8c007486191e8059572ef4b05c58dc200ab04c3f7d8c4ed6c1298d7ba6e	2026-02-09 15:07:09.967	2026-01-10 15:07:09.973	f	\N
69	63	c45859705a99bf8f56670016e86e8d7737da934aa94aaf834ad0e45283b6259ce39de05e0241079a	2026-02-10 00:38:23.999	2026-01-11 00:38:24	f	\N
73	60	58a36303f63bcc25dce19d0cabb5eec270e667c4c6c30b02106570b85beced1126887f4b0f1d7d66	2026-02-12 18:51:16.928	2026-01-13 18:51:16.929	f	\N
74	66	782a7fabaa2c02f7291dce85238ca0649640381dc74f531dbbaa52362303311f340f079f249fe9d5	2026-02-12 23:51:51.501	2026-01-13 23:51:51.504	t	2ce087f14a97719c74f73053f9f6f0786b00f65c79e7d573af2362504ead2d714a07880e85a7be86
75	66	2ce087f14a97719c74f73053f9f6f0786b00f65c79e7d573af2362504ead2d714a07880e85a7be86	2026-02-20 04:16:06.418	2026-01-21 04:16:06.437	f	\N
76	60	f27b68ab3c65f0776af90f59320cd4bb7ff9d916f06a6b2de24a50495d3b4564a6c5221f5c749bae	2026-02-20 04:16:28.285	2026-01-21 04:16:28.291	f	\N
77	63	c91ec615d606c05cc25449a652228b55f66d3661bad12813542123e73c4f935d525ba2ef40c78fde	2026-02-20 04:37:25.518	2026-01-21 04:37:25.52	f	\N
78	60	7d4587186ba0921f86aceeac988f0ba9717968b138d6d1733df4dabaf2396ecec15b83c3df2f6ce4	2026-02-20 04:49:42.359	2026-01-21 04:49:42.36	f	\N
79	63	a2d035bb21f01b3ca75cdb030fec43bdd31f91a9d7475e31c956b66d47c86615b80cd4796a436da2	2026-02-20 04:49:48.603	2026-01-21 04:49:48.604	f	\N
80	59	700244c8fc9a31a2e8a6e0083cdddfa09a4b9b3a210882c6316537079be05faab154b6c9f3fe295a	2026-02-20 04:49:57.108	2026-01-21 04:49:57.109	f	\N
81	47	32b6a308c3ef5933fbb11a0847f67b3115a4a419c710f9ab8bb879817027ae43f470676ec5355e70	2026-02-20 04:50:04.952	2026-01-21 04:50:04.953	f	\N
70	63	81b7de8b2347c270577e18cf3f3bb1041d4e6b574a6705c862044e464040eefb6acbe88bfa8628da	2026-02-10 01:38:39.395	2026-01-11 01:38:39.406	t	8c585a5aa55eb0b07ac3316ec1df914b3f2ff1ac064e70633841be8f643671ec7bba783ecceccc45
61	62	1648a0879c7a8380797297b8020dd2d29819e1d469426b83383711929f9b5cb9292f0cb458649b64	2026-02-07 16:34:44.029	2026-01-08 16:34:44.03	t	\N
62	62	a3755a4693fc545b5cb489764ea0e44dbff4c2f2c38b322f23df9e0f908e4f7db034e1f1264906b8	2026-02-08 17:29:54.908	2026-01-09 17:29:54.916	t	\N
65	62	850a4ed801bfce82d2c37cedbd2b43683c9b4f8cfaf154cb96b7a1c5e7919c5618768f2115a09641	2026-02-09 21:54:09.485	2026-01-10 21:54:09.488	t	\N
82	60	31a6b39118ae716266399c0db8385ce918ebd6290229458d572751611ee9a43bac2834c8423bcf55	2026-02-20 04:50:16.252	2026-01-21 04:50:16.253	f	\N
84	63	8c585a5aa55eb0b07ac3316ec1df914b3f2ff1ac064e70633841be8f643671ec7bba783ecceccc45	2026-02-20 07:48:21.434	2026-01-21 07:48:21.445	f	\N
107	64	e0d64cdf693fc8c3d6bddabe1943911e655a319677d212d0df9885b7d8f4b514df4dc32744c95f41	2026-02-24 16:32:22.993	2026-01-25 16:32:23.011	f	\N
108	64	1392c1f8777346d354713c261d616d502f319300db4f50a3f44923353a83bf676fd87847af4e959b	2026-02-24 23:52:19.694	2026-01-25 23:52:19.7	f	\N
66	62	eeb56320d3c403a2d735955e0d834204ce5370546628da29e678d452f556bdda7bd007548fb380e2	2026-02-09 22:08:14.63	2026-01-10 22:08:14.63	t	\N
67	62	2b2303e40cc93593657788c1dce9ce414901c7b012a464f40ce7ad73f3290d28c3e40592f6110f3c	2026-02-10 00:03:03.668	2026-01-11 00:03:03.67	t	\N
68	62	66d9d417ce86bcaf0c3567df283487d1d8dffa2750ab6d416c9d12b80c365708ae115fa73bb37140	2026-02-10 00:24:43.629	2026-01-11 00:24:43.63	t	\N
71	62	42451ba04ef57aa56b56d797a1ab5b2fe296456b90f163eab79606bf9a78f99d8216eb9c8a257ca6	2026-02-12 18:00:06.099	2026-01-13 18:00:06.102	t	\N
72	62	628dfca310f7f21ef2bd0d74b5100ad1f1335799e9965c36a79c719a9fb9ab6f28a64441e65afe2b	2026-02-12 18:39:17.357	2026-01-13 18:39:17.358	t	\N
83	62	602449ed09109c6d86b927b23d9d5a576eba59cebc6e190d14092afbcf25da636fe76f0e0175c554	2026-02-20 04:50:39.266	2026-01-21 04:50:39.267	t	\N
85	62	3c71a0d5b45145fb0114801a77d0c55f9cb3d6e287959fa01b876d9016a6fe61cf6953e922c4fb4a	2026-02-21 03:39:45.727	2026-01-22 03:39:45.735	t	\N
86	62	40a0125e410408a8578545c695edb28b3e548c6d7cb42f44ec2e6d85a369774058cea017401a5a9b	2026-02-21 03:39:57.058	2026-01-22 03:39:57.059	t	\N
87	62	9ba80f97efad0bde8afecf3ee754bab16817f9d6bbd9e09d63308f487518b85080c3466cbe166546	2026-02-21 03:45:04.563	2026-01-22 03:45:04.566	t	\N
88	62	ba7f32b8d8349f6d1365c764e1ac49342a9a05d53f34c9349c35b5822651ea3152884139a0ca423f	2026-02-21 03:58:23.637	2026-01-22 03:58:23.644	t	\N
89	62	1f5ae7adb9bc3fad2b9dbbd6e385d716da1a8ba43981051f6fac0dc5b4a32b5acc87dc1fedd644f8	2026-02-21 04:16:34.806	2026-01-22 04:16:34.81	t	\N
90	62	726caa5f5569a654166b5055d9c9464fd4d37a63caf0849838784bf2b5a68486201d756fdb9dc378	2026-02-21 11:35:44.172	2026-01-22 11:35:44.175	t	\N
91	62	16c622b30793f343183645a895d86c61ff8eac9eedd98c73d01c67c61001998477931149e92503ed	2026-02-21 11:40:25.469	2026-01-22 11:40:25.472	t	\N
92	62	28948580c19f76b4d4e193236eb2dffbff1155a87d6242e8b11018afb4f60c04680a7ff5d42de68c	2026-02-21 11:41:02.102	2026-01-22 11:41:02.103	t	\N
93	62	e8c433b66add024cc29c2c558b3e5286c12cdf49baa47812796c847d00d928ca791269cf545ed6e5	2026-02-21 12:15:30.042	2026-01-22 12:15:30.044	t	\N
94	62	4038b4ff05afdcd4eac8d8524b31fb996f9dba89fd94bedcf54132a8912a5728c0c7d49448c3cfcb	2026-02-21 12:26:47.807	2026-01-22 12:26:47.808	t	\N
95	62	2964b806f4eee1f4fff67fcb06d6df89f5a59042c36b7d81c2ee9e3445c27676a0b2370edd1072ee	2026-02-21 12:41:40.751	2026-01-22 12:41:40.751	t	\N
96	62	e1cfd83b1b0bdb0b7ef88534edcd104eea7e42d0e592c8490f0accb86d03b1b71bb19fde1f5fda2d	2026-02-21 12:54:46.766	2026-01-22 12:54:46.767	t	\N
97	62	b0ec3338c118ff4d6d9b0a94e6dfb3e3342699d0638d0f0945ea60daca2c16801b91a29771b6c100	2026-02-21 12:55:28.271	2026-01-22 12:55:28.273	t	\N
98	62	7f7b770a7e92afffa3ef388599f351edab4f13aed43a601ab1870047e01c81fa9a1805e19e674714	2026-02-21 13:21:02.121	2026-01-22 13:21:02.122	t	\N
99	62	c736c54a36d6d41902e56af0c0db333f2d67eda43b1a0e933224d73952e565c37493192af334966d	2026-02-22 03:23:42.234	2026-01-23 03:23:42.241	t	\N
100	62	01bf971b7be2590acb730c013a02c90f7b9879c7784f84b6820987e960884eb12c932a4261afa67d	2026-02-22 04:02:05.864	2026-01-23 04:02:05.881	t	\N
102	62	ccf8af3c744bd8b8d5d12d62cdebe458d902fef4230c47949170d94c6932f3587fef3f5ac1f586ee	2026-02-23 08:50:44.961	2026-01-24 08:50:44.964	t	30b4eb8eaf2493818d83cc4b6f09cd80eca1fbba3e92337a397a6e44ef8fba01529d11472437b3de
101	62	6af975c5a373beaf0f754d285d26d28ee2209ed138873dcc443e0d33eaa558616fc57aa8003f6c31	2026-02-22 04:13:48.149	2026-01-23 04:13:48.15	t	\N
103	62	f9613b15d0ab4aff94a6a0c2dce26624c99ab141677b4fcee14364f8393832355e9def5427a3da25	2026-02-23 08:53:58.561	2026-01-24 08:53:58.564	t	\N
104	62	fcf83f07011eaeab378b7fe5319d2f1a24860b7a8d97f66901b14932229d7d5747023e83d62928e7	2026-02-23 13:10:34.36	2026-01-24 13:10:34.363	t	\N
105	62	30b4eb8eaf2493818d83cc4b6f09cd80eca1fbba3e92337a397a6e44ef8fba01529d11472437b3de	2026-02-24 15:50:11.31	2026-01-25 15:50:11.66	t	\N
106	62	f599c50833fd0569c2e0a77eafe6872ae6c9500f4c668d45b08033673996abf66f8b9667fc51ecb7	2026-02-24 16:28:51.414	2026-01-25 16:28:51.42	t	\N
109	62	5b67810211901945b32cf48afb136e334d10cfe1a6569a77cb7ac7c71fb63b07bad4cd0d96742858	2026-02-26 14:29:10.774	2026-01-27 14:29:10.781	t	\N
110	62	4b016de524b56b6e9e49e618056a0ba93b93a5470af566ea3aa2361f1c5b98eb756fa4bc0d9610e4	2026-02-26 15:55:02.121	2026-01-27 15:55:02.128	t	\N
111	62	b7a490c470ef7b7d980fa77f40c886a7ffca89e09d921d37c7c6737d0c3cd3215a5fe876cb15739a	2026-02-26 16:33:46.114	2026-01-27 16:33:46.122	t	\N
112	62	2df9d5ce3286fe470d0aaeba736962dfce2ccd0af3133e229568574e3047ef7cb74ff1c744f6756d	2026-02-27 00:27:11.897	2026-01-28 00:27:11.899	t	\N
113	62	e748d7e5a9fec69ef3cb84612c95180e4380f29fc832b8422050f82459ee4c6d85fed89b43b87f75	2026-02-27 01:43:00.111	2026-01-28 01:43:00.114	t	\N
114	62	127ff55f98014609c0491f4b8c84dae1971e0d4eaeef2dce71265bb9acf47e879b0928f32f095a42	2026-02-28 10:47:59.5	2026-01-29 10:47:59.509	t	\N
115	62	9c198ee89160eef7db5785a936307c3ddabcd0e7a2c8ab09864939559f155e8c330b5821295e11a1	2026-02-28 12:54:52.194	2026-01-29 12:54:52.198	t	\N
116	62	163c7ab36ae0da2c9ac4b9971a9b194d565476ed09047efed9627d4b4d621e67574bae8d967289d1	2026-02-28 12:55:07.088	2026-01-29 12:55:07.089	t	\N
117	62	fd67129f6d2a5fba35561a5928ba80de023fce47506809fe3f2ef5c93638105fbb15b9062bd65028	2026-02-28 13:21:42.611	2026-01-29 13:21:42.612	t	\N
118	62	b2d3cca79d56d38e771978ba4a5aea63a9be4528154e77063c80f8d6d5b43a220ccdbddbeb0255de	2026-02-28 13:21:45.272	2026-01-29 13:21:45.272	t	\N
119	62	b3c272bb70a201960f2ab8b70920b38bfb659424da64fe7b70b3520f420f6e9b4c4b89018b2e02a6	2026-02-28 13:21:47.752	2026-01-29 13:21:47.752	t	\N
120	62	997adc76f0bdd1d00c05d6a00ac4110a3ed98db7eeff4bfb5d8800ae2e8120a25403489e360bc835	2026-02-28 18:13:59.764	2026-01-29 18:13:59.77	f	\N
\.


--
-- Data for Name: shop_reports; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.shop_reports (id, shop_id, reporter_id, reason, details, status, admin_notes, created_at, updated_at, resolved_by) FROM stdin;
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.site_settings (id, setting_key, setting_value, setting_type, description, created_at, updated_at) FROM stdin;
2	free_verification_duration_days	180	number	Duration in days for free verification	2025-12-02 10:59:20.162958	2025-12-02 10:59:20.162958
3	free_verification_types	["individual","business"]	json	Types of verification eligible for free promotion	2025-12-02 10:59:20.162958	2025-12-02 10:59:20.162958
1	free_verification_enabled	true	boolean	Enable free 6-month verification for new users	2025-12-02 10:59:20.162958	2025-12-06 17:33:52.070619
4	site_name	Thulo Bazaar	string	\N	2025-12-09 20:05:11.941	2025-12-27 00:11:16.436702
5	site_description	Nepal's Leading Marketplace	string	\N	2025-12-09 20:05:11.95	2025-12-27 00:11:16.461926
24	notify_on_verification_rejected	true	boolean	\N	2025-12-09 20:05:11.989	2025-12-27 00:11:16.776433
25	notify_on_account_suspended	true	boolean	\N	2025-12-09 20:05:11.991	2025-12-27 00:11:16.77856
26	notify_on_ad_approved	true	boolean	\N	2025-12-09 20:05:11.992	2025-12-27 00:11:16.780079
27	notify_on_ad_rejected	true	boolean	\N	2025-12-09 20:05:11.994	2025-12-27 00:11:16.782513
28	sms_business_approved	Congratulations {name}! Your business verification on Thulo Bazaar has been approved. You can now enjoy all business seller benefits.	string	\N	2025-12-09 20:05:11.995	2025-12-27 00:11:16.783974
29	sms_business_rejected	Dear {name}, your business verification on Thulo Bazaar was not approved. Reason: {reason}. Please submit a new request with correct documents.	string	\N	2025-12-09 20:05:11.997	2025-12-27 00:11:16.785287
30	sms_individual_approved	Congratulations {name}! Your identity verification on Thulo Bazaar has been approved.	string	\N	2025-12-09 20:05:11.998	2025-12-27 00:11:16.786708
31	sms_individual_rejected	Dear {name}, your identity verification on Thulo Bazaar was not approved. Reason: {reason}.	string	\N	2025-12-09 20:05:12	2025-12-27 00:11:16.788066
32	sms_account_suspended	Dear {name}, your Thulo Bazaar account has been suspended. Reason: {reason}. Contact support for assistance.	string	\N	2025-12-09 20:05:12.001	2025-12-27 00:11:16.789411
33	sms_account_unsuspended	Good news {name}! Your Thulo Bazaar account has been restored. You can now access all features.	string	\N	2025-12-09 20:05:12.003	2025-12-27 00:11:16.790758
34	sms_ad_approved	Great news {name}! Your ad on Thulo Bazaar has been approved and is now live. (Kayes)	string	\N	2025-12-09 20:05:12.006	2025-12-27 00:11:16.792048
35	sms_ad_rejected	Dear {name}, your ad on Thulo Bazaar was not approved. Reason: {reason}.	string	\N	2025-12-09 20:05:12.008	2025-12-27 00:11:16.810324
36	sms_broadcast_all	Dear {name}, this is an important announcement from Thulo Bazaar. {message}	string	\N	2025-12-09 20:05:12.01	2025-12-27 00:11:16.812325
37	sms_broadcast_regular	Dear {name}, get verified on Thulo Bazaar to unlock more features! {message}	string	\N	2025-12-09 20:05:12.011	2025-12-27 00:11:16.813751
38	sms_broadcast_business	Dear Business Partner {name}, {From Kayes Testing} - Thulo Bazaar 	string	\N	2025-12-09 20:05:12.013	2025-12-27 00:11:16.815237
39	sms_broadcast_individual	Dear Verified Seller {name}, {message} - Thulo Bazaar	string	\N	2025-12-09 20:05:12.015	2025-12-27 00:11:16.816808
6	contact_email	support@thulobazaar.com	string	\N	2025-12-09 20:05:11.952	2025-12-27 00:11:16.49114
7	support_phone	+977-1-1234567	string	\N	2025-12-09 20:05:11.954	2025-12-27 00:11:16.51226
8	maintenance_mode	false	boolean	\N	2025-12-09 20:05:11.955	2025-12-27 00:11:16.529849
9	allow_registration	true	boolean	\N	2025-12-09 20:05:11.957	2025-12-27 00:11:16.562832
10	require_email_verification	true	boolean	\N	2025-12-09 20:05:11.958	2025-12-27 00:11:16.57828
11	max_ads_per_user	50	number	\N	2025-12-09 20:05:11.96	2025-12-27 00:11:16.612925
12	ad_expiry_days	90	number	\N	2025-12-09 20:05:11.961	2025-12-27 00:11:16.627255
13	free_ads_limit	30	number	\N	2025-12-09 20:05:11.972	2025-12-27 00:11:16.66039
14	max_images_per_ad	5	number	\N	2025-12-09 20:05:11.974	2025-12-27 00:11:16.71034
15	smtp_enabled	false	boolean	\N	2025-12-09 20:05:11.975	2025-12-27 00:11:16.712626
16	smtp_host		string	\N	2025-12-09 20:05:11.977	2025-12-27 00:11:16.741568
17	smtp_port	587	number	\N	2025-12-09 20:05:11.978	2025-12-27 00:11:16.762157
18	smtp_user		string	\N	2025-12-09 20:05:11.98	2025-12-27 00:11:16.76525
19	smtp_pass		string	\N	2025-12-09 20:05:11.981	2025-12-27 00:11:16.767784
20	smtp_from_email	noreply@thulobazaar.com	string	\N	2025-12-09 20:05:11.983	2025-12-27 00:11:16.769625
21	smtp_from_name	Thulo Bazaar	string	\N	2025-12-09 20:05:11.984	2025-12-27 00:11:16.771141
22	sms_enabled	true	boolean	\N	2025-12-09 20:05:11.986	2025-12-27 00:11:16.772603
23	notify_on_verification_approved	true	boolean	\N	2025-12-09 20:05:11.988	2025-12-27 00:11:16.773968
\.


--
-- Data for Name: support_messages; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.support_messages (id, ticket_id, sender_id, content, type, attachment_url, is_internal, created_at) FROM stdin;
26	4	47	hjkhkhjkhkj jbj	text	\N	f	2025-12-09 14:35:23.864
27	4	47	hi	text	\N	f	2025-12-09 14:35:28.602
30	4	47	ok	text	\N	f	2025-12-09 14:35:49.847
31	5	60	Please help me	text	\N	f	2026-01-01 08:58:53.723
32	5	64	Hi sir	text	\N	f	2026-01-01 09:00:07.691
33	5	60	jjfdsf	text	\N	f	2026-01-01 09:00:32.968
34	5	60	helop	text	\N	f	2026-01-01 09:00:41.448
35	5	60	So	text	\N	f	2026-01-01 09:04:06.866
36	5	64	Alright	text	\N	t	2026-01-01 09:15:41.147
37	5	64	Hi sirso	text	\N	f	2026-01-01 09:16:02.89
38	5	64	fdgsdgsd	text	\N	t	2026-01-01 09:42:28.744
39	6	60	dsdq	text	\N	f	2026-01-01 10:04:24.871
40	7	60	HabibiHabibiHabibiHabibi	text	\N	f	2026-01-01 10:15:01.416
41	8	60	dfdfg	text	\N	f	2026-01-01 14:42:54.39
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.support_tickets (id, ticket_number, user_id, assigned_to, subject, category, priority, status, created_at, updated_at, resolved_at, closed_at) FROM stdin;
4	TB-MIYOMYC03JDB	47	\N	help	account	urgent	closed	2025-12-09 14:35:23.864	2025-12-09 14:37:07.974	2025-12-09 14:36:10.313	2025-12-09 14:37:07.974
5	TB-MJV7QSU0RLV3	60	\N	I need help	account	high	waiting_on_user	2026-01-01 08:58:53.723	2026-01-01 09:15:41.152	\N	\N
6	TB-MJVA324IRHBT	60	\N	where r u	general	normal	open	2026-01-01 10:04:24.871	2026-01-01 10:04:24.871	\N	\N
7	TB-MJVAGPA2R0RG	60	\N	Habibi	general	normal	open	2026-01-01 10:15:01.416	2026-01-01 10:15:01.416	\N	\N
8	TB-MJVK17ANB5TI	60	\N	Help me	general	normal	open	2026-01-01 14:42:54.39	2026-01-01 14:42:54.39	\N	\N
\.


--
-- Data for Name: typing_indicators; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.typing_indicators (id, conversation_id, user_id, started_at, expires_at) FROM stdin;
\.


--
-- Data for Name: user_favorites; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.user_favorites (id, user_id, ad_id, created_at) FROM stdin;
12	47	31	2025-12-09 11:43:15.402
21	60	64	2025-12-25 23:01:33.303
29	46	84	2025-12-26 18:38:21.862
31	62	68	2026-01-13 18:46:03.232
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.users (id, email, password_hash, full_name, phone, location_id, is_verified, is_active, created_at, updated_at, role, bio, avatar, cover_photo, verified_at, verified_by, is_suspended, suspended_at, suspended_until, suspended_by, suspension_reason, account_type, business_name, business_license_document, business_verification_status, business_verified_at, business_verified_by, business_rejection_reason, business_payment_reference, business_payment_amount, business_category, business_description, business_website, business_phone, business_address, business_subscription_start, business_subscription_end, business_subscription_status, shop_slug, individual_verified, individual_verified_at, individual_verified_by, verified_seller_name, individual_verification_expires_at, business_verification_expires_at, latitude, longitude, formatted_address, google_maps_link, last_login, two_factor_enabled, two_factor_secret, two_factor_backup_codes, custom_shop_slug, oauth_provider, oauth_provider_id, email_verified, phone_verified, phone_verified_at, default_category_id, default_subcategory_id, facebook_url, instagram_url, tiktok_url, deleted_at, deletion_requested_at) FROM stdin;
60	\N	$2b$10$D2VOiXR9v5ZGSsXpWgvmYegP4ViA9hKONt1J8d.Bbftg8WZVadkZm	Amit Sharma	9844463084	71243	f	t	2025-12-18 08:54:41.163	2025-12-25 17:45:50.244	user	\N	avatar-60-1766050775103-293224978.jpg	cover-1766684750239-444027565.jpg	\N	\N	f	\N	\N	\N	\N	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	I am a real estate agent based in Nepal, specializing in buying, selling, and renting properties. Please feel free to contact me for your housing needs.	www.realestate.com	+9779844463084	\N	\N	\N	\N	amit-sharma	f	2025-12-18 11:03:01.414	\N	\N	2026-01-17 11:03:01.414	\N	\N	\N	\N	https://maps.app.goo.gl/Fdmvy9C68S5WveAn7	2026-01-21 04:50:16.237	f	\N	\N	\N	\N	\N	f	t	2025-12-18 08:54:41.161	5	505	facebook.com/dreamlista	Instagram.com/dreamlista	tiktok.com/dreamlista	\N	\N
66	bazaarlista@gmail.com		Thulo Bazar	\N	\N	f	t	2025-12-26 16:55:51.759	2025-12-26 16:55:51.759	user	\N	https://lh3.googleusercontent.com/a/ACg8ocJnNDDLsN5rzAOWe5tJRtPczpj6UhyvrJRVSwuzgb4LOQCEptQ=s96-c	\N	\N	\N	f	\N	\N	\N	\N	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	thulo-bazar-66	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-13 23:51:51.42	f	\N	\N	\N	google	113674680321170016399	f	f	\N	\N	\N	\N	\N	\N	\N	\N
59	\N	$2b$12$qTcDqo9mz9uKgbd5gB31V.Z0UIZ2WK9CTlwB1EOGc6FnR0Rkc90G6	Ananda Shahi	9843963410	71230	f	t	2025-12-09 19:51:40.393	2025-12-17 12:48:49.876	user	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	+9779843963410	\N	\N	\N	\N	ananda-shahi	f	2025-12-09 19:58:04.354	\N	\N	2026-01-08 19:58:04.353	\N	\N	\N	\N	\N	2026-01-21 04:49:57.104	f	\N	\N	\N	\N	\N	f	t	2025-12-09 19:51:40.391	5	505	\N	\N	\N	\N	\N
61	\N	$2b$10$54a0CfA0KZJWCweb5HH05etdIEvk03WZkt5ZIvRL.YIXikIHJq0Ni	Test User	9841234567	\N	f	t	2025-12-18 11:54:04.476	2025-12-18 11:54:04.476	user	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	test-user	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	f	t	2025-12-18 11:54:04.474	\N	\N	\N	\N	\N	\N	\N
46	thulobazaarnepal@gmail.com		Rohit Thapa	9766850410	70101	f	t	2025-12-06 13:05:20.087	2025-12-26 17:03:50.338	user	\N	https://lh3.googleusercontent.com/a/ACg8ocLKNTv6WNz92nJQI_kt4iTpfKH24kiZsosCTUgMykc4vAC_Ir0=s96-c	\N	\N	\N	f	\N	\N	\N	\N	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	I am Rohit thapa	www.myshop.com	+9779766850410	\N	\N	\N	\N	rohit-thapa	t	2025-12-26 17:10:50.616	\N	\N	2026-12-26 17:10:50.616	\N	\N	\N	\N	www.myshop.com	2025-12-28 18:58:44.535	f	\N	\N	\N	google	106003751359129009324	t	t	2025-12-26 17:03:50.338	7	709	https://www.facebook.com/rohit.thapa23	https://www.instagram.com/rohit.thapa23	https://www.tiktok.com/@rohit.thapa23	\N	\N
57	pixelstudiohub4u@gmail.com		Pixel Studio	\N	\N	f	t	2025-12-08 11:31:01.695	2025-12-08 11:31:01.695	user	\N	https://lh3.googleusercontent.com/a/ACg8ocLufpjr5v--b2WM5infXGq8Lkm0XlN3TXGbG1btS1bNOI3b2nQ=s96-c	\N	\N	\N	f	\N	\N	\N	\N	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pixel-studio-57	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-28 23:02:16.466	f	\N	\N	\N	google	111508486034974350630	f	f	\N	\N	\N	\N	\N	\N	\N	\N
47	\N	$2b$12$wpeYvNHE.uxp.c8Kh8I2aOIaO3Vd4804kwk2H0gC4TS9FYQwAHHDC	Parash Thakur	9823241785	40301	f	t	2025-12-07 14:35:29.385	2025-12-26 10:35:32.529	user	\N	avatar-47-1765207981303-64317584.jpg	cover-1766745332507-313701889.jpg	\N	\N	f	\N	\N	\N	\N	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	I am car sales agent in Pokhara	www.mysite.com	+9779823241785	\N	\N	\N	\N	parash-thakur	f	2025-12-25 17:36:27.398	\N	NEW NAME HERE	2026-01-24 17:36:27.398	\N	\N	\N	\N	www.mysite.com	2026-01-21 04:50:04.94	f	\N	\N	parash-thakur	\N	\N	f	t	2025-12-09 11:14:06.931	3	301	https://www.facebook.com/parash_t	https://www.instagram.com/parash_t	https://www.tiktok.com/@parash_t	\N	\N
65	admin@thulobazaar.com	$2b$10$TqtSsWTZ7H.y2TZ/OwjKVeqAWH1pI3sz1DOJy68tYgTiP.VkqlgvG	Super Admin	\N	\N	f	t	2025-12-25 00:15:43.93039	2025-12-25 00:15:43.93039	super_admin	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	super-admin	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-01 09:04:54.497	f	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N
64	editor@thulobazaar.com	$2b$10$J/CWSoGUN9QIuhkc6wSldu.S7xSbKIENqCq3z/0Cbv7ca.uD3uH/2	Bhim Bahadur 	\N	\N	f	t	2025-12-25 00:15:43.93039	2025-12-25 00:15:43.93039	editor	\N	avatar-1767258487023-468627651.jpg	\N	\N	\N	f	\N	\N	\N	\N	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	editor-user	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 23:52:19.625	f	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N
62	\N	$2b$10$.LoWuy5LzR.t0SRuLYwX..TdFhN6w.TXZpXO9GKCKY2M72KTCcqWq	Dija Fashion Shop1	9706657812	71228	f	t	2025-12-18 11:55:40.399	2026-01-29 12:58:21.289	user	\N	avatar-62-1766059434651-684816538.jpg	cover-1766605715217-951914905.jpg	\N	\N	f	\N	\N	\N	\N	business	Dija Fashion Shop	\N	expired	2025-12-18 11:59:42.202	\N	\N	\N	\N	\N	Dija Fashion Shop, a boutique in Nepal's heart, crafting elegant custom couture gowns that define sophistication for the modern woman. Each piece blends artistry with timeless luxury.	www.dijafashionshop.com	+9779706657812	\N	\N	\N	\N	dija-fashion-shop	f	\N	\N	\N	\N	2026-01-17 11:59:42.202	\N	\N	\N	\N	2026-01-29 18:13:59.688	f	\N	\N	dija-fashion-shop12	\N	\N	f	t	2025-12-18 11:55:40.398	8	801	facebook.com/dijafashionshop	Instagram.com/dijafashionshop	tiktok.com/dijafashionshop	\N	\N
63	\N	$2b$10$1/IkzvUhiuu8quNwbZlq5uLUu0G.5ZJlL7X6emAQHn9Z.Am5dBWIq	Alina Mobile Store	9803093361	71211	f	t	2025-12-18 12:11:54.106	2025-12-25 08:42:03.787	user	\N	avatar-1766651694248-190641282.jpg	cover-1766652123712-903505193.jpg	\N	\N	f	\N	\N	\N	\N	business	Alina Mobile Store	\N	expired	2025-12-25 17:22:27.409	\N	\N	\N	\N	\N	We sell all kinds of mobile here. 	www.alinamobilestore.com	+9779803093361	\N	\N	\N	\N	alina-mobile-store	f	\N	\N	\N	\N	2026-01-24 17:22:27.409	\N	\N	\N	www.alinamobilestore.com	2026-01-21 04:49:48.581	f	\N	\N	\N	\N	\N	f	t	2025-12-18 12:11:54.105	1	101	www.facebook.com/alinamobilestore	www.instagram.com/alinamobilestore	\N	\N	\N
\.


--
-- Data for Name: verification_campaigns; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.verification_campaigns (id, name, description, discount_percentage, promo_code, banner_text, banner_emoji, start_date, end_date, is_active, applies_to_types, min_duration_days, max_uses, current_uses, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: verification_pricing; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.verification_pricing (id, verification_type, duration_days, price, discount_percentage, is_active, created_at, updated_at) FROM stdin;
2	individual	90	250.00	0	t	2025-12-02 10:19:50.546419	2025-12-02 20:09:29.56812
3	individual	180	400.00	0	t	2025-12-02 10:19:50.546419	2025-12-02 20:09:29.56812
4	individual	365	700.00	0	t	2025-12-02 10:19:50.546419	2025-12-02 20:09:29.56812
7	business	180	800.00	0	t	2025-12-02 10:19:50.546419	2025-12-02 20:09:29.56812
8	business	365	1400.00	0	t	2025-12-02 10:19:50.546419	2025-12-02 20:09:29.56812
1	individual	30	100.00	30	t	2025-12-02 10:19:50.546419	2025-12-02 20:11:00.901724
5	business	30	200.00	0	t	2025-12-02 10:19:50.546419	2025-12-18 01:33:00.447156
6	business	90	500.00	0	t	2025-12-02 10:19:50.546419	2025-12-18 01:33:06.738578
\.


--
-- Name: ad_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.ad_images_id_seq', 178, true);


--
-- Name: ad_promotions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.ad_promotions_id_seq', 43, true);


--
-- Name: ad_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.ad_reports_id_seq', 8, true);


--
-- Name: ad_review_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.ad_review_history_id_seq', 42, true);


--
-- Name: admin_activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.admin_activity_logs_id_seq', 41, true);


--
-- Name: ads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.ads_id_seq', 94, true);


--
-- Name: announcement_read_receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.announcement_read_receipts_id_seq', 15, true);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.announcements_id_seq', 4, true);


--
-- Name: business_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.business_subscriptions_id_seq', 8, true);


--
-- Name: business_verification_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.business_verification_requests_id_seq', 16, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.categories_id_seq', 1610, true);


--
-- Name: category_pricing_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.category_pricing_tiers_id_seq', 4, true);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 14, true);


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.conversation_participants_id_seq', 32, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.conversations_id_seq', 16, true);


--
-- Name: editor_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.editor_permissions_id_seq', 1, false);


--
-- Name: individual_verification_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.individual_verification_requests_id_seq', 14, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.locations_id_seq', 71252, true);


--
-- Name: message_read_receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.message_read_receipts_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.messages_id_seq', 149, true);


--
-- Name: payment_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.payment_transactions_id_seq', 72, true);


--
-- Name: phone_otps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.phone_otps_id_seq', 24, true);


--
-- Name: promotion_pricing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.promotion_pricing_id_seq', 159, true);


--
-- Name: promotional_campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.promotional_campaigns_id_seq', 4, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 120, true);


--
-- Name: shop_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.shop_reports_id_seq', 4, true);


--
-- Name: site_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.site_settings_id_seq', 219, true);


--
-- Name: support_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.support_messages_id_seq', 41, true);


--
-- Name: support_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.support_tickets_id_seq', 8, true);


--
-- Name: typing_indicators_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.typing_indicators_id_seq', 1020, true);


--
-- Name: user_favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.user_favorites_id_seq', 31, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.users_id_seq', 66, true);


--
-- Name: verification_campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.verification_campaigns_id_seq', 3, true);


--
-- Name: verification_pricing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.verification_pricing_id_seq', 8, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ad_images ad_images_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_images
    ADD CONSTRAINT ad_images_pkey PRIMARY KEY (id);


--
-- Name: ad_promotions ad_promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_promotions
    ADD CONSTRAINT ad_promotions_pkey PRIMARY KEY (id);


--
-- Name: ad_reports ad_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_reports
    ADD CONSTRAINT ad_reports_pkey PRIMARY KEY (id);


--
-- Name: ad_review_history ad_review_history_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_review_history
    ADD CONSTRAINT ad_review_history_pkey PRIMARY KEY (id);


--
-- Name: admin_activity_logs admin_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.admin_activity_logs
    ADD CONSTRAINT admin_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: ads ads_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_pkey PRIMARY KEY (id);


--
-- Name: ads ads_slug_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_slug_key UNIQUE (slug);


--
-- Name: announcement_read_receipts announcement_read_receipts_announcement_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.announcement_read_receipts
    ADD CONSTRAINT announcement_read_receipts_announcement_id_user_id_key UNIQUE (announcement_id, user_id);


--
-- Name: announcement_read_receipts announcement_read_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.announcement_read_receipts
    ADD CONSTRAINT announcement_read_receipts_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: business_subscriptions business_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.business_subscriptions
    ADD CONSTRAINT business_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: business_verification_requests business_verification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.business_verification_requests
    ADD CONSTRAINT business_verification_requests_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: category_pricing_tiers category_pricing_tiers_category_id_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.category_pricing_tiers
    ADD CONSTRAINT category_pricing_tiers_category_id_key UNIQUE (category_id);


--
-- Name: category_pricing_tiers category_pricing_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.category_pricing_tiers
    ADD CONSTRAINT category_pricing_tiers_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants conversation_participants_conversation_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: editor_permissions editor_permissions_editor_id_permission_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.editor_permissions
    ADD CONSTRAINT editor_permissions_editor_id_permission_key UNIQUE (editor_id, permission);


--
-- Name: editor_permissions editor_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.editor_permissions
    ADD CONSTRAINT editor_permissions_pkey PRIMARY KEY (id);


--
-- Name: shop_reports idx_shop_reports_unique; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.shop_reports
    ADD CONSTRAINT idx_shop_reports_unique UNIQUE (shop_id, reporter_id);


--
-- Name: individual_verification_requests individual_verification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.individual_verification_requests
    ADD CONSTRAINT individual_verification_requests_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: locations locations_slug_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_slug_key UNIQUE (slug);


--
-- Name: message_read_receipts message_read_receipts_message_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.message_read_receipts
    ADD CONSTRAINT message_read_receipts_message_id_user_id_key UNIQUE (message_id, user_id);


--
-- Name: message_read_receipts message_read_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.message_read_receipts
    ADD CONSTRAINT message_read_receipts_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_transaction_id_key UNIQUE (transaction_id);


--
-- Name: phone_otps phone_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.phone_otps
    ADD CONSTRAINT phone_otps_pkey PRIMARY KEY (id);


--
-- Name: promotion_pricing promotion_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.promotion_pricing
    ADD CONSTRAINT promotion_pricing_pkey PRIMARY KEY (id);


--
-- Name: promotion_pricing promotion_pricing_type_duration_account_tier_unique; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.promotion_pricing
    ADD CONSTRAINT promotion_pricing_type_duration_account_tier_unique UNIQUE (promotion_type, duration_days, account_type, pricing_tier);


--
-- Name: promotional_campaigns promotional_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.promotional_campaigns
    ADD CONSTRAINT promotional_campaigns_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: shop_reports shop_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.shop_reports
    ADD CONSTRAINT shop_reports_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_ticket_number_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_ticket_number_key UNIQUE (ticket_number);


--
-- Name: typing_indicators typing_indicators_conversation_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.typing_indicators
    ADD CONSTRAINT typing_indicators_conversation_id_user_id_key UNIQUE (conversation_id, user_id);


--
-- Name: typing_indicators typing_indicators_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.typing_indicators
    ADD CONSTRAINT typing_indicators_pkey PRIMARY KEY (id);


--
-- Name: individual_verification_requests unique_user_pending_request; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.individual_verification_requests
    ADD CONSTRAINT unique_user_pending_request UNIQUE (user_id, status);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_user_id_ad_id_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_ad_id_key UNIQUE (user_id, ad_id);


--
-- Name: users users_custom_shop_slug_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_custom_shop_slug_key UNIQUE (custom_shop_slug);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_shop_slug_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_shop_slug_key UNIQUE (shop_slug);


--
-- Name: verification_campaigns verification_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.verification_campaigns
    ADD CONSTRAINT verification_campaigns_pkey PRIMARY KEY (id);


--
-- Name: verification_pricing verification_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.verification_pricing
    ADD CONSTRAINT verification_pricing_pkey PRIMARY KEY (id);


--
-- Name: verification_pricing verification_pricing_verification_type_duration_days_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.verification_pricing
    ADD CONSTRAINT verification_pricing_verification_type_duration_days_key UNIQUE (verification_type, duration_days);


--
-- Name: ad_images_one_primary_per_ad; Type: INDEX; Schema: public; Owner: elw
--

CREATE UNIQUE INDEX ad_images_one_primary_per_ad ON public.ad_images USING btree (ad_id) WHERE (is_primary = true);


--
-- Name: idx_activity_logs_action_type; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_activity_logs_action_type ON public.admin_activity_logs USING btree (action_type);


--
-- Name: idx_activity_logs_admin_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_activity_logs_admin_id ON public.admin_activity_logs USING btree (admin_id);


--
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_activity_logs_created_at ON public.admin_activity_logs USING btree (created_at DESC);


--
-- Name: idx_activity_logs_target; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_activity_logs_target ON public.admin_activity_logs USING btree (target_type, target_id);


--
-- Name: idx_ad_images_ad_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_images_ad_id ON public.ad_images USING btree (ad_id);


--
-- Name: idx_ad_images_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_images_created_at ON public.ad_images USING btree (created_at);


--
-- Name: idx_ad_images_primary; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_images_primary ON public.ad_images USING btree (ad_id, is_primary);


--
-- Name: idx_ad_promotions_active; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_promotions_active ON public.ad_promotions USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_ad_promotions_ad_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_promotions_ad_id ON public.ad_promotions USING btree (ad_id);


--
-- Name: idx_ad_promotions_expires_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_promotions_expires_at ON public.ad_promotions USING btree (expires_at);


--
-- Name: idx_ad_promotions_user_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_promotions_user_id ON public.ad_promotions USING btree (user_id);


--
-- Name: idx_ad_reports_ad_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_reports_ad_id ON public.ad_reports USING btree (ad_id);


--
-- Name: idx_ad_reports_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_reports_created_at ON public.ad_reports USING btree (created_at DESC);


--
-- Name: idx_ad_reports_reporter_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_reports_reporter_id ON public.ad_reports USING btree (reporter_id);


--
-- Name: idx_ad_reports_status; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_reports_status ON public.ad_reports USING btree (status);


--
-- Name: idx_ad_reports_unique; Type: INDEX; Schema: public; Owner: elw
--

CREATE UNIQUE INDEX idx_ad_reports_unique ON public.ad_reports USING btree (ad_id, reporter_id);


--
-- Name: idx_ad_review_history_action; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_review_history_action ON public.ad_review_history USING btree (action);


--
-- Name: idx_ad_review_history_ad_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_review_history_ad_id ON public.ad_review_history USING btree (ad_id);


--
-- Name: idx_ad_review_history_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_review_history_created_at ON public.ad_review_history USING btree (created_at DESC);


--
-- Name: idx_ads_bumped; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_bumped ON public.ads USING btree (is_bumped, bump_expires_at) WHERE (is_bumped = true);


--
-- Name: idx_ads_category_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_category_id ON public.ads USING btree (category_id);


--
-- Name: idx_ads_coordinates; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_coordinates ON public.ads USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));


--
-- Name: idx_ads_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_created_at ON public.ads USING btree (created_at DESC);


--
-- Name: idx_ads_deleted_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_deleted_at ON public.ads USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_ads_featured_until; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_featured_until ON public.ads USING btree (featured_until) WHERE (is_featured = true);


--
-- Name: idx_ads_fulltext_search; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_fulltext_search ON public.ads USING gin (to_tsvector('english'::regconfig, (((title)::text || ' '::text) || description)));


--
-- Name: idx_ads_is_featured; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_is_featured ON public.ads USING btree (is_featured) WHERE (is_featured = true);


--
-- Name: idx_ads_location_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_location_id ON public.ads USING btree (location_id);


--
-- Name: idx_ads_price; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_price ON public.ads USING btree (price);


--
-- Name: idx_ads_promoted_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_promoted_at ON public.ads USING btree (promoted_at DESC) WHERE ((is_featured = true) OR (is_urgent = true) OR (is_sticky = true));


--
-- Name: idx_ads_slug; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_slug ON public.ads USING btree (slug);


--
-- Name: idx_ads_status; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_status ON public.ads USING btree (status) WHERE ((status)::text = 'approved'::text);


--
-- Name: idx_ads_status_category_location; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_status_category_location ON public.ads USING btree (status, category_id, location_id);


--
-- Name: idx_ads_status_created; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_status_created ON public.ads USING btree (status, created_at DESC);


--
-- Name: idx_ads_sticky; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_sticky ON public.ads USING btree (is_sticky, sticky_expires_at) WHERE (is_sticky = true);


--
-- Name: idx_ads_sticky_until; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_sticky_until ON public.ads USING btree (sticky_until) WHERE (is_sticky = true);


--
-- Name: idx_ads_urgent; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_urgent ON public.ads USING btree (is_urgent, urgent_expires_at) WHERE (is_urgent = true);


--
-- Name: idx_ads_urgent_until; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_urgent_until ON public.ads USING btree (urgent_until) WHERE (is_urgent = true);


--
-- Name: idx_ads_user_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_user_id ON public.ads USING btree (user_id);


--
-- Name: idx_ads_view_count; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ads_view_count ON public.ads USING btree (view_count DESC);


--
-- Name: idx_announcement_receipts_announcement; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_announcement_receipts_announcement ON public.announcement_read_receipts USING btree (announcement_id);


--
-- Name: idx_announcement_receipts_user; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_announcement_receipts_user ON public.announcement_read_receipts USING btree (user_id);


--
-- Name: idx_announcements_active_audience; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_announcements_active_audience ON public.announcements USING btree (is_active, target_audience);


--
-- Name: idx_announcements_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_announcements_created_at ON public.announcements USING btree (created_at DESC);


--
-- Name: idx_announcements_created_by; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_announcements_created_by ON public.announcements USING btree (created_by);


--
-- Name: idx_business_requests_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_business_requests_created_at ON public.business_verification_requests USING btree (created_at DESC);


--
-- Name: idx_business_requests_status; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_business_requests_status ON public.business_verification_requests USING btree (status);


--
-- Name: idx_business_requests_user_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_business_requests_user_id ON public.business_verification_requests USING btree (user_id);


--
-- Name: idx_business_subs_end_date; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_business_subs_end_date ON public.business_subscriptions USING btree (end_date);


--
-- Name: idx_business_subs_status; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_business_subs_status ON public.business_subscriptions USING btree (status);


--
-- Name: idx_business_subs_user_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_business_subs_user_id ON public.business_subscriptions USING btree (user_id);


--
-- Name: idx_business_verification_payment; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_business_verification_payment ON public.business_verification_requests USING btree (payment_status);


--
-- Name: idx_categories_name; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_categories_name ON public.categories USING btree (name);


--
-- Name: idx_categories_parent_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_categories_parent_id ON public.categories USING btree (parent_id);


--
-- Name: idx_categories_slug; Type: INDEX; Schema: public; Owner: elw
--

CREATE UNIQUE INDEX idx_categories_slug ON public.categories USING btree (slug);


--
-- Name: idx_contact_messages_ad_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_contact_messages_ad_id ON public.contact_messages USING btree (ad_id);


--
-- Name: idx_contact_messages_buyer_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_contact_messages_buyer_id ON public.contact_messages USING btree (buyer_id);


--
-- Name: idx_contact_messages_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_contact_messages_created_at ON public.contact_messages USING btree (created_at DESC);


--
-- Name: idx_contact_messages_reply_to; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_contact_messages_reply_to ON public.contact_messages USING btree (reply_to_message_id) WHERE (reply_to_message_id IS NOT NULL);


--
-- Name: idx_contact_messages_seller_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_contact_messages_seller_id ON public.contact_messages USING btree (seller_id);


--
-- Name: idx_conversations_ad_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_conversations_ad_id ON public.conversations USING btree (ad_id);


--
-- Name: idx_conversations_last_message; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_conversations_last_message ON public.conversations USING btree (last_message_at DESC);


--
-- Name: idx_editor_permissions_editor_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_editor_permissions_editor_id ON public.editor_permissions USING btree (editor_id);


--
-- Name: idx_individual_verification_payment; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_individual_verification_payment ON public.individual_verification_requests USING btree (payment_status);


--
-- Name: idx_individual_verification_status; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_individual_verification_status ON public.individual_verification_requests USING btree (status);


--
-- Name: idx_individual_verification_user_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_individual_verification_user_id ON public.individual_verification_requests USING btree (user_id);


--
-- Name: idx_locations_coordinates; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_locations_coordinates ON public.locations USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));


--
-- Name: idx_locations_name; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_locations_name ON public.locations USING btree (name);


--
-- Name: idx_locations_parent_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_locations_parent_id ON public.locations USING btree (parent_id);


--
-- Name: idx_locations_slug; Type: INDEX; Schema: public; Owner: elw
--

CREATE UNIQUE INDEX idx_locations_slug ON public.locations USING btree (slug);


--
-- Name: idx_locations_type; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_locations_type ON public.locations USING btree (type);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id, created_at DESC);


--
-- Name: idx_messages_created; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_messages_created ON public.messages USING btree (created_at DESC);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- Name: idx_participants_conversation; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_participants_conversation ON public.conversation_participants USING btree (conversation_id);


--
-- Name: idx_participants_unread; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_participants_unread ON public.conversation_participants USING btree (user_id, last_read_at);


--
-- Name: idx_participants_user; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_participants_user ON public.conversation_participants USING btree (user_id);


--
-- Name: idx_payment_transactions_created; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_payment_transactions_created ON public.payment_transactions USING btree (created_at DESC);


--
-- Name: idx_payment_transactions_gateway; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_payment_transactions_gateway ON public.payment_transactions USING btree (payment_gateway);


--
-- Name: idx_payment_transactions_status; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_payment_transactions_status ON public.payment_transactions USING btree (status);


--
-- Name: idx_payment_transactions_txn_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_payment_transactions_txn_id ON public.payment_transactions USING btree (transaction_id);


--
-- Name: idx_payment_transactions_type; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_payment_transactions_type ON public.payment_transactions USING btree (payment_type);


--
-- Name: idx_payment_transactions_user_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions USING btree (user_id);


--
-- Name: idx_phone_otps_expires; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_phone_otps_expires ON public.phone_otps USING btree (expires_at);


--
-- Name: idx_phone_otps_phone; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_phone_otps_phone ON public.phone_otps USING btree (phone);


--
-- Name: idx_phone_otps_phone_code; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_phone_otps_phone_code ON public.phone_otps USING btree (phone, otp_code);


--
-- Name: idx_promo_campaigns_active; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_promo_campaigns_active ON public.promotional_campaigns USING btree (is_active, start_date, end_date);


--
-- Name: idx_promo_campaigns_code; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_promo_campaigns_code ON public.promotional_campaigns USING btree (promo_code);


--
-- Name: idx_promotion_pricing_type_duration; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_promotion_pricing_type_duration ON public.promotion_pricing USING btree (promotion_type, duration_days);


--
-- Name: idx_receipts_message; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_receipts_message ON public.message_read_receipts USING btree (message_id);


--
-- Name: idx_receipts_user; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_receipts_user ON public.message_read_receipts USING btree (user_id);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_shop_reports_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_shop_reports_created_at ON public.shop_reports USING btree (created_at DESC);


--
-- Name: idx_shop_reports_reporter_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_shop_reports_reporter_id ON public.shop_reports USING btree (reporter_id);


--
-- Name: idx_shop_reports_shop_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_shop_reports_shop_id ON public.shop_reports USING btree (shop_id);


--
-- Name: idx_shop_reports_status; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_shop_reports_status ON public.shop_reports USING btree (status);


--
-- Name: idx_support_messages_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_support_messages_created_at ON public.support_messages USING btree (created_at DESC);


--
-- Name: idx_support_messages_sender_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_support_messages_sender_id ON public.support_messages USING btree (sender_id);


--
-- Name: idx_support_messages_ticket_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_support_messages_ticket_id ON public.support_messages USING btree (ticket_id);


--
-- Name: idx_support_tickets_assigned_to; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets USING btree (assigned_to);


--
-- Name: idx_support_tickets_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_support_tickets_created_at ON public.support_tickets USING btree (created_at DESC);


--
-- Name: idx_support_tickets_priority; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_support_tickets_priority ON public.support_tickets USING btree (priority);


--
-- Name: idx_support_tickets_status; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);


--
-- Name: idx_support_tickets_user_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);


--
-- Name: idx_typing_conversation; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_typing_conversation ON public.typing_indicators USING btree (conversation_id, expires_at);


--
-- Name: idx_unique_ad_report; Type: INDEX; Schema: public; Owner: elw
--

CREATE UNIQUE INDEX idx_unique_ad_report ON public.ad_reports USING btree (ad_id, reporter_id);


--
-- Name: idx_user_favorites_ad_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_user_favorites_ad_id ON public.user_favorites USING btree (ad_id);


--
-- Name: idx_user_favorites_created_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_user_favorites_created_at ON public.user_favorites USING btree (created_at DESC);


--
-- Name: idx_user_favorites_user_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_user_favorites_user_id ON public.user_favorites USING btree (user_id);


--
-- Name: idx_users_business_accounts; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_business_accounts ON public.users USING btree (account_type, business_verification_status) WHERE (((account_type)::text = 'business'::text) AND ((business_verification_status)::text = 'approved'::text));


--
-- Name: idx_users_business_status; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_business_status ON public.users USING btree (business_verification_status) WHERE ((business_verification_status)::text = 'pending'::text);


--
-- Name: idx_users_business_verification_expiry; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_business_verification_expiry ON public.users USING btree (business_verification_expires_at) WHERE ((business_verification_status)::text = 'approved'::text);


--
-- Name: idx_users_coordinates; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_coordinates ON public.users USING btree (latitude, longitude);


--
-- Name: idx_users_custom_shop_slug; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_custom_shop_slug ON public.users USING btree (custom_shop_slug) WHERE (custom_shop_slug IS NOT NULL);


--
-- Name: idx_users_default_category; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_default_category ON public.users USING btree (default_category_id) WHERE (default_category_id IS NOT NULL);


--
-- Name: idx_users_default_subcategory; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_default_subcategory ON public.users USING btree (default_subcategory_id) WHERE (default_subcategory_id IS NOT NULL);


--
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: elw
--

CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (lower((email)::text));


--
-- Name: idx_users_individual_verification_expiry; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_individual_verification_expiry ON public.users USING btree (individual_verification_expires_at) WHERE (individual_verified = true);


--
-- Name: idx_users_individual_verified; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_individual_verified ON public.users USING btree (individual_verified) WHERE (individual_verified = true);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_users_location_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_location_id ON public.users USING btree (location_id);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_shop_slug; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_shop_slug ON public.users USING btree (shop_slug) WHERE (shop_slug IS NOT NULL);


--
-- Name: idx_users_suspended; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_suspended ON public.users USING btree (is_suspended, suspended_until) WHERE (is_suspended = true);


--
-- Name: idx_users_verified; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_verified ON public.users USING btree (is_verified) WHERE (is_verified = true);


--
-- Name: idx_users_verified_seller_name; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_users_verified_seller_name ON public.users USING btree (verified_seller_name) WHERE (individual_verified = true);


--
-- Name: idx_verif_campaigns_active; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_verif_campaigns_active ON public.verification_campaigns USING btree (is_active, start_date, end_date);


--
-- Name: idx_verif_campaigns_code; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_verif_campaigns_code ON public.verification_campaigns USING btree (promo_code);


--
-- Name: idx_verification_pricing_type; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_verification_pricing_type ON public.verification_pricing USING btree (verification_type);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: elw
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: promotion_pricing promotion_pricing_updated_at; Type: TRIGGER; Schema: public; Owner: elw
--

CREATE TRIGGER promotion_pricing_updated_at BEFORE UPDATE ON public.promotion_pricing FOR EACH ROW EXECUTE FUNCTION public.update_promotion_pricing_updated_at();


--
-- Name: site_settings site_settings_updated_at; Type: TRIGGER; Schema: public; Owner: elw
--

CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_site_settings_updated_at();


--
-- Name: users trigger_auto_generate_slug; Type: TRIGGER; Schema: public; Owner: elw
--

CREATE TRIGGER trigger_auto_generate_slug BEFORE INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.auto_generate_user_slug();


--
-- Name: individual_verification_requests trigger_individual_verification_updated_at; Type: TRIGGER; Schema: public; Owner: elw
--

CREATE TRIGGER trigger_individual_verification_updated_at BEFORE UPDATE ON public.individual_verification_requests FOR EACH ROW EXECUTE FUNCTION public.update_individual_verification_updated_at();


--
-- Name: messages update_conversation_on_message; Type: TRIGGER; Schema: public; Owner: elw
--

CREATE TRIGGER update_conversation_on_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();


--
-- Name: verification_pricing verification_pricing_updated_at; Type: TRIGGER; Schema: public; Owner: elw
--

CREATE TRIGGER verification_pricing_updated_at BEFORE UPDATE ON public.verification_pricing FOR EACH ROW EXECUTE FUNCTION public.update_verification_pricing_updated_at();


--
-- Name: ad_images ad_images_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_images
    ADD CONSTRAINT ad_images_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: ad_promotions ad_promotions_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_promotions
    ADD CONSTRAINT ad_promotions_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: ad_promotions ad_promotions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_promotions
    ADD CONSTRAINT ad_promotions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ad_reports ad_reports_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_reports
    ADD CONSTRAINT ad_reports_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: ad_reports ad_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_reports
    ADD CONSTRAINT ad_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: admin_activity_logs admin_activity_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.admin_activity_logs
    ADD CONSTRAINT admin_activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ads ads_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: ads ads_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id);


--
-- Name: ads ads_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: ads ads_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: ads ads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: announcement_read_receipts announcement_read_receipts_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.announcement_read_receipts
    ADD CONSTRAINT announcement_read_receipts_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;


--
-- Name: announcement_read_receipts announcement_read_receipts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.announcement_read_receipts
    ADD CONSTRAINT announcement_read_receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: business_subscriptions business_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.business_subscriptions
    ADD CONSTRAINT business_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: business_verification_requests business_verification_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.business_verification_requests
    ADD CONSTRAINT business_verification_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: business_verification_requests business_verification_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.business_verification_requests
    ADD CONSTRAINT business_verification_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: category_pricing_tiers category_pricing_tiers_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.category_pricing_tiers
    ADD CONSTRAINT category_pricing_tiers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: contact_messages contact_messages_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: contact_messages contact_messages_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contact_messages contact_messages_reply_to_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_reply_to_message_id_fkey FOREIGN KEY (reply_to_message_id) REFERENCES public.contact_messages(id);


--
-- Name: contact_messages contact_messages_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE SET NULL;


--
-- Name: editor_permissions editor_permissions_editor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.editor_permissions
    ADD CONSTRAINT editor_permissions_editor_id_fkey FOREIGN KEY (editor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: editor_permissions editor_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.editor_permissions
    ADD CONSTRAINT editor_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- Name: ad_review_history fk_ad_review_history_ad; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_review_history
    ADD CONSTRAINT fk_ad_review_history_ad FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: ad_review_history fk_ad_review_history_user; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_review_history
    ADD CONSTRAINT fk_ad_review_history_user FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users fk_user_location; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_user_location FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: individual_verification_requests individual_verification_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.individual_verification_requests
    ADD CONSTRAINT individual_verification_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: individual_verification_requests individual_verification_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.individual_verification_requests
    ADD CONSTRAINT individual_verification_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: locations locations_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.locations(id);


--
-- Name: message_read_receipts message_read_receipts_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.message_read_receipts
    ADD CONSTRAINT message_read_receipts_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_read_receipts message_read_receipts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.message_read_receipts
    ADD CONSTRAINT message_read_receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotional_campaigns promotional_campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.promotional_campaigns
    ADD CONSTRAINT promotional_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shop_reports shop_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.shop_reports
    ADD CONSTRAINT shop_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shop_reports shop_reports_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.shop_reports
    ADD CONSTRAINT shop_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: shop_reports shop_reports_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.shop_reports
    ADD CONSTRAINT shop_reports_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: typing_indicators typing_indicators_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.typing_indicators
    ADD CONSTRAINT typing_indicators_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: typing_indicators typing_indicators_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.typing_indicators
    ADD CONSTRAINT typing_indicators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_business_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_business_verified_by_fkey FOREIGN KEY (business_verified_by) REFERENCES public.users(id);


--
-- Name: users users_default_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_default_category_id_fkey FOREIGN KEY (default_category_id) REFERENCES public.categories(id);


--
-- Name: users users_default_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_default_subcategory_id_fkey FOREIGN KEY (default_subcategory_id) REFERENCES public.categories(id);


--
-- Name: users users_individual_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_individual_verified_by_fkey FOREIGN KEY (individual_verified_by) REFERENCES public.users(id);


--
-- Name: users users_suspended_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_suspended_by_fkey FOREIGN KEY (suspended_by) REFERENCES public.users(id);


--
-- Name: users users_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: verification_campaigns verification_campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.verification_campaigns
    ADD CONSTRAINT verification_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: elw
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 8AKYFrJqfHDj1g2a4UdM3FBQcDiiR48XONwPe4pNKaCxSq0asiSZHKKLuZucqVD

