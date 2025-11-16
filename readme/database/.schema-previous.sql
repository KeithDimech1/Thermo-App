--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (6bc9ef8)
-- Dumped by pg_dump version 17.5 (Homebrew)

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
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


--
-- Name: assays_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assays_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


SET default_table_access_method = heap;

--
-- Name: assays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assays (
    id integer DEFAULT nextval('public.assays_id_seq'::regclass) NOT NULL,
    name character varying(300) NOT NULL,
    manufacturer_id integer,
    platform character varying(100),
    methodology character varying(50),
    automation_level character varying(50),
    throughput character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_automation CHECK (((automation_level)::text = ANY ((ARRAY['Fully Automated'::character varying, 'Semi-Automated'::character varying, 'Manual'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT check_methodology CHECK (((methodology)::text = ANY ((ARRAY['CLIA'::character varying, 'ELISA'::character varying, 'PCR'::character varying, 'ECLIA'::character varying, 'CMIA'::character varying, NULL::character varying])::text[])))
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer DEFAULT nextval('public.categories_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: cv_measurements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cv_measurements (
    id integer NOT NULL,
    test_config_id integer NOT NULL,
    cv_lt_10_count integer,
    cv_lt_10_percentage numeric(5,2),
    cv_10_15_count integer,
    cv_10_15_percentage numeric(5,2),
    cv_15_20_count integer,
    cv_15_20_percentage numeric(5,2),
    cv_gt_20_count integer,
    cv_gt_20_percentage numeric(5,2),
    mean_cv numeric(5,2),
    median_cv numeric(5,2),
    std_dev_cv numeric(5,2),
    measurement_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_percentages CHECK ((((cv_lt_10_percentage IS NULL) OR ((cv_lt_10_percentage >= (0)::numeric) AND (cv_lt_10_percentage <= (100)::numeric))) AND ((cv_10_15_percentage IS NULL) OR ((cv_10_15_percentage >= (0)::numeric) AND (cv_10_15_percentage <= (100)::numeric))) AND ((cv_15_20_percentage IS NULL) OR ((cv_15_20_percentage >= (0)::numeric) AND (cv_15_20_percentage <= (100)::numeric))) AND ((cv_gt_20_percentage IS NULL) OR ((cv_gt_20_percentage >= (0)::numeric) AND (cv_gt_20_percentage <= (100)::numeric)))))
);


--
-- Name: cv_measurements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cv_measurements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cv_measurements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cv_measurements_id_seq OWNED BY public.cv_measurements.id;


--
-- Name: manufacturers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.manufacturers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: manufacturers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manufacturers (
    id integer DEFAULT nextval('public.manufacturers_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    country character varying(100),
    website character varying(200),
    total_assays integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: markers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.markers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: markers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markers (
    id integer DEFAULT nextval('public.markers_id_seq'::regclass) NOT NULL,
    name character varying(200) NOT NULL,
    pathogen_id integer,
    category_id integer,
    antibody_type character varying(50),
    marker_type character varying(50),
    clinical_use text,
    interpretation_positive text,
    interpretation_negative text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_antibody_type CHECK (((antibody_type)::text = ANY ((ARRAY['IgG'::character varying, 'IgM'::character varying, 'Antigen'::character varying, 'Antibody (Total)'::character varying, 'Other'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT check_marker_type CHECK (((marker_type)::text = ANY ((ARRAY['Antibody'::character varying, 'Antigen'::character varying, 'Nucleic Acid'::character varying, NULL::character varying])::text[])))
);


--
-- Name: pathogens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pathogens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pathogens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pathogens (
    id integer DEFAULT nextval('public.pathogens_id_seq'::regclass) NOT NULL,
    name character varying(200) NOT NULL,
    category_id integer,
    scientific_name character varying(200),
    transmission_route character varying(100),
    clinical_significance text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: qc_samples_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.qc_samples_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: qc_samples; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qc_samples (
    id integer DEFAULT nextval('public.qc_samples_id_seq'::regclass) NOT NULL,
    name character varying(200) NOT NULL,
    manufacturer character varying(100),
    product_code character varying(50),
    matrix_type character varying(100),
    lot_number character varying(50),
    expiration_date date,
    target_markers text[],
    concentration_level character varying(50),
    certifications text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_matrix_type CHECK (((matrix_type)::text = ANY ((ARRAY['human plasma'::character varying, 'human serum'::character varying, 'synthetic'::character varying, NULL::character varying])::text[])))
);


--
-- Name: test_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_configurations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_configurations (
    id integer DEFAULT nextval('public.test_configurations_id_seq'::regclass) NOT NULL,
    marker_id integer NOT NULL,
    assay_id integer NOT NULL,
    qc_sample_id integer NOT NULL,
    test_type character varying(50) NOT NULL,
    events_examined integer,
    quality_rating character varying(50),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    inclusion_group character varying(50) DEFAULT 'original_curated'::character varying,
    CONSTRAINT check_quality_rating CHECK (((quality_rating)::text = ANY ((ARRAY['excellent'::character varying, 'good'::character varying, 'acceptable'::character varying, 'poor'::character varying, 'unknown'::character varying])::text[]))),
    CONSTRAINT check_test_type CHECK (((test_type)::text = ANY ((ARRAY['serology'::character varying, 'nat'::character varying, 'both'::character varying])::text[])))
);


--
-- Name: vw_manufacturer_performance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_manufacturer_performance AS
 SELECT mfr.id,
    mfr.name,
    count(tc.id) AS total_configs,
    avg(cv.cv_lt_10_percentage) AS avg_cv_lt_10_pct,
    sum(
        CASE
            WHEN ((tc.quality_rating)::text = 'excellent'::text) THEN 1
            ELSE 0
        END) AS excellent_count,
    sum(
        CASE
            WHEN ((tc.quality_rating)::text = 'good'::text) THEN 1
            ELSE 0
        END) AS good_count,
    sum(
        CASE
            WHEN ((tc.quality_rating)::text = 'acceptable'::text) THEN 1
            ELSE 0
        END) AS acceptable_count,
    sum(
        CASE
            WHEN ((tc.quality_rating)::text = 'poor'::text) THEN 1
            ELSE 0
        END) AS poor_count
   FROM (((public.manufacturers mfr
     LEFT JOIN public.assays a ON ((mfr.id = a.manufacturer_id)))
     LEFT JOIN public.test_configurations tc ON ((a.id = tc.assay_id)))
     LEFT JOIN public.cv_measurements cv ON ((tc.id = cv.test_config_id)))
  GROUP BY mfr.id, mfr.name;


--
-- Name: vw_test_config_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_test_config_details AS
 SELECT tc.id AS config_id,
    tc.test_type,
    tc.events_examined,
    tc.quality_rating,
    m.id AS marker_id,
    m.name AS marker_name,
    m.antibody_type,
    p.id AS pathogen_id,
    p.name AS pathogen_name,
    c.id AS category_id,
    c.name AS category_name,
    a.id AS assay_id,
    a.name AS assay_name,
    a.platform,
    a.methodology,
    mfr.id AS manufacturer_id,
    mfr.name AS manufacturer_name,
    qc.id AS qc_sample_id,
    qc.name AS qc_sample_name,
    cv.cv_lt_10_count,
    cv.cv_lt_10_percentage,
    cv.cv_10_15_count,
    cv.cv_10_15_percentage,
    cv.cv_15_20_count,
    cv.cv_15_20_percentage,
    cv.cv_gt_20_count,
    cv.cv_gt_20_percentage,
    cv.mean_cv
   FROM (((((((public.test_configurations tc
     JOIN public.markers m ON ((tc.marker_id = m.id)))
     LEFT JOIN public.pathogens p ON ((m.pathogen_id = p.id)))
     LEFT JOIN public.categories c ON ((m.category_id = c.id)))
     JOIN public.assays a ON ((tc.assay_id = a.id)))
     LEFT JOIN public.manufacturers mfr ON ((a.manufacturer_id = mfr.id)))
     JOIN public.qc_samples qc ON ((tc.qc_sample_id = qc.id)))
     LEFT JOIN public.cv_measurements cv ON ((tc.id = cv.test_config_id)));


--
-- Name: cv_measurements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cv_measurements ALTER COLUMN id SET DEFAULT nextval('public.cv_measurements_id_seq'::regclass);


--
-- Name: assays assays_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assays
    ADD CONSTRAINT assays_name_key UNIQUE (name);


--
-- Name: assays assays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assays
    ADD CONSTRAINT assays_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: cv_measurements cv_measurements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cv_measurements
    ADD CONSTRAINT cv_measurements_pkey PRIMARY KEY (id);


--
-- Name: cv_measurements cv_measurements_test_config_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cv_measurements
    ADD CONSTRAINT cv_measurements_test_config_id_key UNIQUE (test_config_id);


--
-- Name: manufacturers manufacturers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturers
    ADD CONSTRAINT manufacturers_name_key UNIQUE (name);


--
-- Name: manufacturers manufacturers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturers
    ADD CONSTRAINT manufacturers_pkey PRIMARY KEY (id);


--
-- Name: markers markers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markers
    ADD CONSTRAINT markers_name_key UNIQUE (name);


--
-- Name: markers markers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markers
    ADD CONSTRAINT markers_pkey PRIMARY KEY (id);


--
-- Name: pathogens pathogens_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathogens
    ADD CONSTRAINT pathogens_name_key UNIQUE (name);


--
-- Name: pathogens pathogens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathogens
    ADD CONSTRAINT pathogens_pkey PRIMARY KEY (id);


--
-- Name: qc_samples qc_samples_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qc_samples
    ADD CONSTRAINT qc_samples_name_key UNIQUE (name);


--
-- Name: qc_samples qc_samples_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qc_samples
    ADD CONSTRAINT qc_samples_pkey PRIMARY KEY (id);


--
-- Name: test_configurations test_configurations_marker_id_assay_id_qc_sample_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_configurations
    ADD CONSTRAINT test_configurations_marker_id_assay_id_qc_sample_id_key UNIQUE (marker_id, assay_id, qc_sample_id);


--
-- Name: test_configurations test_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_configurations
    ADD CONSTRAINT test_configurations_pkey PRIMARY KEY (id);


--
-- Name: idx_assays_manufacturer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assays_manufacturer ON public.assays USING btree (manufacturer_id);


--
-- Name: idx_assays_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assays_name_trgm ON public.assays USING gin (name public.gin_trgm_ops);


--
-- Name: idx_cv_gt_20_pct; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_gt_20_pct ON public.cv_measurements USING btree (cv_gt_20_percentage);


--
-- Name: idx_cv_lt_10_pct; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_lt_10_pct ON public.cv_measurements USING btree (cv_lt_10_percentage DESC);


--
-- Name: idx_cv_measurements_test_config; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_measurements_test_config ON public.cv_measurements USING btree (test_config_id);


--
-- Name: idx_marker_assay_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marker_assay_lookup ON public.test_configurations USING btree (marker_id, assay_id);


--
-- Name: idx_markers_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_markers_category ON public.markers USING btree (category_id);


--
-- Name: idx_markers_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_markers_name_trgm ON public.markers USING gin (name public.gin_trgm_ops);


--
-- Name: idx_markers_pathogen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_markers_pathogen ON public.markers USING btree (pathogen_id);


--
-- Name: idx_pathogens_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pathogens_category ON public.pathogens USING btree (category_id);


--
-- Name: idx_test_configs_assay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_configs_assay ON public.test_configurations USING btree (assay_id);


--
-- Name: idx_test_configs_marker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_configs_marker ON public.test_configurations USING btree (marker_id);


--
-- Name: idx_test_configs_qc_sample; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_configs_qc_sample ON public.test_configurations USING btree (qc_sample_id);


--
-- Name: idx_test_configs_quality_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_configs_quality_rating ON public.test_configurations USING btree (quality_rating);


--
-- Name: idx_test_configs_test_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_configs_test_type ON public.test_configurations USING btree (test_type);


--
-- Name: idx_test_configurations_inclusion_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_configurations_inclusion_group ON public.test_configurations USING btree (inclusion_group);


--
-- Name: test_configurations update_test_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_test_configs_updated_at BEFORE UPDATE ON public.test_configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assays assays_manufacturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assays
    ADD CONSTRAINT assays_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id);


--
-- Name: cv_measurements cv_measurements_test_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cv_measurements
    ADD CONSTRAINT cv_measurements_test_config_id_fkey FOREIGN KEY (test_config_id) REFERENCES public.test_configurations(id) ON DELETE CASCADE;


--
-- Name: markers markers_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markers
    ADD CONSTRAINT markers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: markers markers_pathogen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markers
    ADD CONSTRAINT markers_pathogen_id_fkey FOREIGN KEY (pathogen_id) REFERENCES public.pathogens(id);


--
-- Name: pathogens pathogens_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathogens
    ADD CONSTRAINT pathogens_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: test_configurations test_configurations_assay_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_configurations
    ADD CONSTRAINT test_configurations_assay_id_fkey FOREIGN KEY (assay_id) REFERENCES public.assays(id);


--
-- Name: test_configurations test_configurations_marker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_configurations
    ADD CONSTRAINT test_configurations_marker_id_fkey FOREIGN KEY (marker_id) REFERENCES public.markers(id);


--
-- Name: test_configurations test_configurations_qc_sample_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_configurations
    ADD CONSTRAINT test_configurations_qc_sample_id_fkey FOREIGN KEY (qc_sample_id) REFERENCES public.qc_samples(id);


--
-- PostgreSQL database dump complete
--

