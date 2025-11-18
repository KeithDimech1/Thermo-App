--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (aa1f746)
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
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_dataset_modified_date(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_dataset_modified_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.last_modified_date = CURRENT_DATE;
  RETURN NEW;
END;
$$;


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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ahe_grain_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ahe_grain_data (
    id integer NOT NULL,
    sample_id character varying(50) NOT NULL,
    lab_no character varying(50),
    length_um numeric(10,2),
    half_width_um numeric(10,2),
    rs_um numeric(10,2),
    mass_mg numeric(10,6),
    terminations character varying(10),
    u_ppm numeric(10,3),
    th_ppm numeric(10,3),
    sm_ppm numeric(10,3),
    eu_ppm numeric(10,3),
    he_ncc numeric(12,6),
    uncorr_age_ma numeric(10,2),
    corr_age_ma numeric(10,2),
    corr_age_1sigma_ma numeric(10,2),
    ft numeric(6,4),
    std_run character varying(10),
    thermal_model character varying(10),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE ahe_grain_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ahe_grain_data IS '(U-Th)/He grain-level results';


--
-- Name: COLUMN ahe_grain_data.terminations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ahe_grain_data.terminations IS 'Grain termination count (e.g., 0T, 1T, 2T)';


--
-- Name: COLUMN ahe_grain_data.eu_ppm; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ahe_grain_data.eu_ppm IS 'Effective uranium (U + 0.235*Th)';


--
-- Name: COLUMN ahe_grain_data.ft; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ahe_grain_data.ft IS 'Alpha ejection correction factor (Ft)';


--
-- Name: ahe_grain_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ahe_grain_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ahe_grain_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ahe_grain_data_id_seq OWNED BY public.ahe_grain_data.id;


--
-- Name: batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batches (
    id integer NOT NULL,
    batch_name character varying(200) NOT NULL,
    analysis_date date,
    laboratory character varying(200),
    analytical_session character varying(200),
    irradiation_id character varying(100),
    irradiation_reactor character varying(100),
    thermal_neutron_dose numeric(18,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE batches; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.batches IS 'Analytical batches linking unknowns to reference materials for QC';


--
-- Name: COLUMN batches.thermal_neutron_dose; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batches.thermal_neutron_dose IS 'Neutron fluence (neutrons/cm²) for EDM irradiation';


--
-- Name: batches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.batches_id_seq OWNED BY public.batches.id;


--
-- Name: data_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_files (
    id integer NOT NULL,
    dataset_id integer NOT NULL,
    file_name character varying(200) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_type character varying(50) NOT NULL,
    display_name character varying(200),
    file_size_bytes integer,
    row_count integer,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_folder boolean DEFAULT false,
    folder_path character varying(500),
    upload_status character varying(20) DEFAULT 'available'::character varying,
    category character varying(100),
    source_url text,
    upload_notes text
);


--
-- Name: COLUMN data_files.is_folder; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.data_files.is_folder IS 'TRUE if this entry represents a folder (like RAW/ or FAIR/)';


--
-- Name: COLUMN data_files.folder_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.data_files.folder_path IS 'Path to the folder if is_folder=TRUE';


--
-- Name: COLUMN data_files.upload_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.data_files.upload_status IS 'Upload status: available (uploaded/accessible), pending (to be uploaded), not_uploadable (too large/format issue), external_only (reference link only)';


--
-- Name: COLUMN data_files.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.data_files.category IS 'Category for organizing files: supplementary_data, supplementary_figures, supplementary_text, raw_extract, earthbank_template, main_pdf, etc.';


--
-- Name: COLUMN data_files.source_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.data_files.source_url IS 'Original download URL (OSF, Zenodo, etc.) if file was obtained from external repository';


--
-- Name: COLUMN data_files.upload_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.data_files.upload_notes IS 'Notes about upload status, issues, or special handling requirements';


--
-- Name: data_files_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.data_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: data_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.data_files_id_seq OWNED BY public.data_files.id;


--
-- Name: datapoint_people_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.datapoint_people_roles (
    id integer NOT NULL,
    datapoint_id integer NOT NULL,
    datapoint_type character varying(20) NOT NULL,
    person_id integer NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_datapoint_type CHECK (((datapoint_type)::text = ANY ((ARRAY['ft'::character varying, 'he'::character varying, 'upb'::character varying, 'trace'::character varying])::text[])))
);


--
-- Name: TABLE datapoint_people_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.datapoint_people_roles IS 'Links datapoints to people with roles (analyst, technician, etc.)';


--
-- Name: datapoint_people_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.datapoint_people_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: datapoint_people_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.datapoint_people_roles_id_seq OWNED BY public.datapoint_people_roles.id;


--
-- Name: dataset_people_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dataset_people_roles (
    id integer NOT NULL,
    dataset_id integer NOT NULL,
    person_id integer NOT NULL,
    role character varying(50) NOT NULL,
    author_order integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE dataset_people_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dataset_people_roles IS 'Many-to-many relationship between datasets and people (authors, editors, etc.)';


--
-- Name: COLUMN dataset_people_roles.author_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dataset_people_roles.author_order IS 'Position in author list (1 = first author, 2 = second author, etc.)';


--
-- Name: dataset_people_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dataset_people_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dataset_people_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dataset_people_roles_id_seq OWNED BY public.dataset_people_roles.id;


--
-- Name: datasets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.datasets (
    id integer NOT NULL,
    dataset_name character varying(200) NOT NULL,
    description text,
    publication_reference text,
    doi character varying(100),
    study_area character varying(200),
    analyst character varying(100),
    laboratory character varying(200),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    full_citation text,
    publication_year integer,
    publication_journal character varying(200),
    publication_volume_pages character varying(100),
    study_location text,
    pdf_filename character varying(500),
    pdf_url text,
    mineral_analyzed character varying(100),
    sample_count integer,
    age_range_min_ma numeric(10,2),
    age_range_max_ma numeric(10,2),
    authors text[],
    collection_date date,
    analysis_methods text[],
    supplementary_files_url text
);


--
-- Name: TABLE datasets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.datasets IS 'Dataset-level metadata for data organization';


--
-- Name: COLUMN datasets.full_citation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.full_citation IS 'Complete formatted citation for the research paper';


--
-- Name: COLUMN datasets.publication_year; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.publication_year IS 'Year of publication';


--
-- Name: COLUMN datasets.publication_journal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.publication_journal IS 'Journal name';


--
-- Name: COLUMN datasets.publication_volume_pages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.publication_volume_pages IS 'Volume and page numbers (e.g., "187, 105196")';


--
-- Name: COLUMN datasets.study_location; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.study_location IS 'Geographic location of the study (e.g., "Central Basin, Malawi Rift")';


--
-- Name: COLUMN datasets.pdf_filename; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.pdf_filename IS 'Filename of the PDF (stored in project)';


--
-- Name: COLUMN datasets.pdf_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.pdf_url IS 'Public URL to access the PDF (served via Vercel)';


--
-- Name: COLUMN datasets.mineral_analyzed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.mineral_analyzed IS 'Mineral type analyzed (apatite, zircon, etc.)';


--
-- Name: COLUMN datasets.sample_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.sample_count IS 'Total number of samples in dataset';


--
-- Name: COLUMN datasets.age_range_min_ma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.age_range_min_ma IS 'Minimum age in dataset (Ma)';


--
-- Name: COLUMN datasets.age_range_max_ma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.age_range_max_ma IS 'Maximum age in dataset (Ma)';


--
-- Name: COLUMN datasets.supplementary_files_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.datasets.supplementary_files_url IS 'URL to supplementary data repository (OSF, Zenodo, Figshare, etc.)';


--
-- Name: datasets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.datasets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: datasets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.datasets_id_seq OWNED BY public.datasets.id;


--
-- Name: fair_score_breakdown; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fair_score_breakdown (
    id integer NOT NULL,
    dataset_id integer NOT NULL,
    table4_score integer,
    table4_reasoning text,
    table5_score integer,
    table5_reasoning text,
    table6_score integer,
    table6_reasoning text,
    table10_score integer,
    table10_reasoning text,
    findable_score integer,
    findable_reasoning text,
    accessible_score integer,
    accessible_reasoning text,
    interoperable_score integer,
    interoperable_reasoning text,
    reusable_score integer,
    reusable_reasoning text,
    total_score integer,
    grade character varying(2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_total_matches_sum CHECK ((total_score = (((findable_score + accessible_score) + interoperable_score) + reusable_score))),
    CONSTRAINT fair_score_breakdown_accessible_score_check CHECK (((accessible_score >= 0) AND (accessible_score <= 25))),
    CONSTRAINT fair_score_breakdown_findable_score_check CHECK (((findable_score >= 0) AND (findable_score <= 25))),
    CONSTRAINT fair_score_breakdown_interoperable_score_check CHECK (((interoperable_score >= 0) AND (interoperable_score <= 25))),
    CONSTRAINT fair_score_breakdown_reusable_score_check CHECK (((reusable_score >= 0) AND (reusable_score <= 25))),
    CONSTRAINT fair_score_breakdown_table10_score_check CHECK (((table10_score >= 0) AND (table10_score <= 10))),
    CONSTRAINT fair_score_breakdown_table4_score_check CHECK (((table4_score >= 0) AND (table4_score <= 15))),
    CONSTRAINT fair_score_breakdown_table5_score_check CHECK (((table5_score >= 0) AND (table5_score <= 15))),
    CONSTRAINT fair_score_breakdown_table6_score_check CHECK (((table6_score >= 0) AND (table6_score <= 10))),
    CONSTRAINT fair_score_breakdown_total_score_check CHECK (((total_score >= 0) AND (total_score <= 100)))
);


--
-- Name: TABLE fair_score_breakdown; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fair_score_breakdown IS 'Detailed FAIR data compliance assessment breakdown';


--
-- Name: COLUMN fair_score_breakdown.table4_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fair_score_breakdown.table4_score IS 'Kohn et al. (2024) Table 4 score - Geosample Metadata (max 15)';


--
-- Name: COLUMN fair_score_breakdown.table5_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fair_score_breakdown.table5_score IS 'Kohn et al. (2024) Table 5 score - FT Counts (max 15)';


--
-- Name: COLUMN fair_score_breakdown.table6_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fair_score_breakdown.table6_score IS 'Kohn et al. (2024) Table 6 score - Track Lengths (max 10)';


--
-- Name: COLUMN fair_score_breakdown.table10_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fair_score_breakdown.table10_score IS 'Kohn et al. (2024) Table 10 score - Ages (max 10)';


--
-- Name: COLUMN fair_score_breakdown.findable_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fair_score_breakdown.findable_score IS 'FAIR Findable score (max 25)';


--
-- Name: COLUMN fair_score_breakdown.accessible_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fair_score_breakdown.accessible_score IS 'FAIR Accessible score (max 25)';


--
-- Name: COLUMN fair_score_breakdown.interoperable_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fair_score_breakdown.interoperable_score IS 'FAIR Interoperable score (max 25)';


--
-- Name: COLUMN fair_score_breakdown.reusable_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fair_score_breakdown.reusable_score IS 'FAIR Reusable score (max 25)';


--
-- Name: COLUMN fair_score_breakdown.grade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fair_score_breakdown.grade IS 'Letter grade: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)';


--
-- Name: fair_score_breakdown_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fair_score_breakdown_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fair_score_breakdown_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fair_score_breakdown_id_seq OWNED BY public.fair_score_breakdown.id;


--
-- Name: ft_binned_length_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ft_binned_length_data (
    id integer NOT NULL,
    ft_datapoint_id integer NOT NULL,
    mount_id character varying(50),
    etch_duration_seconds integer,
    bin_0_1_um integer,
    bin_1_2_um integer,
    bin_2_3_um integer,
    bin_3_4_um integer,
    bin_4_5_um integer,
    bin_5_6_um integer,
    bin_6_7_um integer,
    bin_7_8_um integer,
    bin_8_9_um integer,
    bin_9_10_um integer,
    bin_10_11_um integer,
    bin_11_12_um integer,
    bin_12_13_um integer,
    bin_13_14_um integer,
    bin_14_15_um integer,
    bin_15_16_um integer,
    bin_16_17_um integer,
    bin_17_18_um integer,
    bin_18_19_um integer,
    bin_19_20_um integer,
    dpar_um numeric(6,3),
    dpar_error_um numeric(6,3),
    n_dpar_measurements integer,
    dper_um numeric(6,3),
    dper_error_um numeric(6,3),
    n_dper_measurements integer,
    dpar_dper_error_type character varying(20),
    comments text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE ft_binned_length_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ft_binned_length_data IS 'Fission-track binned length histograms (legacy data format)';


--
-- Name: ft_binned_length_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ft_binned_length_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ft_binned_length_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ft_binned_length_data_id_seq OWNED BY public.ft_binned_length_data.id;


--
-- Name: ft_count_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ft_count_data (
    id integer NOT NULL,
    ft_datapoint_id integer NOT NULL,
    grain_id character varying(100) NOT NULL,
    counting_area_cm2 numeric(10,6),
    ns integer,
    rho_s_cm2 numeric(12,2),
    ni integer,
    rho_i_cm2 numeric(12,2),
    nd integer,
    rho_d_cm2 numeric(12,2),
    dpar_um numeric(6,3),
    dpar_error_um numeric(6,3),
    n_dpar_measurements integer,
    dper_um numeric(6,3),
    dper_error_um numeric(6,3),
    n_dper_measurements integer,
    dpar_dper_error_type character varying(20),
    comments text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE ft_count_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ft_count_data IS 'Fission-track grain-by-grain count data (EarthBank FTCountData sheet)';


--
-- Name: ft_count_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ft_count_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ft_count_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ft_count_data_id_seq OWNED BY public.ft_count_data.id;


--
-- Name: ft_datapoints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ft_datapoints (
    id integer NOT NULL,
    sample_id character varying(50) NOT NULL,
    datapoint_key character varying(100) NOT NULL,
    batch_id integer,
    laboratory character varying(200),
    analyst_orcid character varying(50),
    analysis_date timestamp without time zone,
    publication_doi character varying(100),
    mineral_type character varying(50),
    ft_method character varying(50),
    ft_software character varying(100),
    ft_algorithm character varying(50),
    u_determination_method character varying(100),
    n_grains integer,
    total_area_cm2 numeric(10,6),
    mean_rho_s numeric(12,2),
    total_ns integer,
    mean_rho_i numeric(12,2),
    total_ni integer,
    mean_rho_d numeric(12,2),
    total_nd integer,
    dosimeter character varying(50),
    mean_u_ppm numeric(10,3),
    sd_u_ppm numeric(10,3),
    mean_dpar_um numeric(6,3),
    se_dpar_um numeric(6,3),
    n_dpar_measurements integer,
    mean_dper_um numeric(6,3),
    se_dper_um numeric(6,3),
    n_dper_measurements integer,
    mean_rmr0 numeric(6,4),
    sd_rmr0 numeric(6,4),
    mean_kappa numeric(6,4),
    sd_kappa numeric(6,4),
    rmr0_equation character varying(100),
    chi_square numeric(12,6),
    p_chi2_pct numeric(6,3),
    dispersion_pct numeric(6,4),
    age_equation character varying(100),
    mean_age_ma numeric(10,2),
    mean_age_error_ma numeric(10,2),
    central_age_ma numeric(10,2),
    central_age_error_ma numeric(10,2),
    pooled_age_ma numeric(10,2),
    pooled_age_error_ma numeric(10,2),
    population_age_ma numeric(10,2),
    population_age_error_ma numeric(10,2),
    age_error_type character varying(20),
    age_comment text,
    mean_track_length_um numeric(6,3),
    se_mean_track_length_um numeric(6,3),
    n_track_measurements integer,
    sd_track_length_um numeric(6,3),
    cf252_irradiation boolean,
    etchant_chemical character varying(100),
    etch_duration_seconds integer,
    etch_temperature_c numeric(5,2),
    zeta_yr_cm2 numeric(12,6),
    zeta_error_yr_cm2 numeric(12,6),
    zeta_error_type character varying(20),
    r_um numeric(8,3),
    lambda_d character varying(30),
    lambda_f character varying(30),
    q_factor numeric(6,4),
    irradiation_reactor character varying(100),
    thermal_neutron_dose numeric(18,2),
    irradiation_batch_id character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE ft_datapoints; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ft_datapoints IS 'Fission-track analytical sessions (EarthBank FT Datapoints sheet)';


--
-- Name: COLUMN ft_datapoints.datapoint_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ft_datapoints.datapoint_key IS 'User-provided unique identifier for this analytical session';


--
-- Name: COLUMN ft_datapoints.ft_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ft_datapoints.ft_method IS 'EDM, LA-ICP-MS, or Population method';


--
-- Name: ft_datapoints_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ft_datapoints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ft_datapoints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ft_datapoints_id_seq OWNED BY public.ft_datapoints.id;


--
-- Name: ft_single_grain_ages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ft_single_grain_ages (
    id integer NOT NULL,
    ft_datapoint_id integer NOT NULL,
    grain_id character varying(100) NOT NULL,
    mount_id character varying(50),
    etch_duration_seconds integer,
    u_ppm numeric(10,3),
    u_ppm_error numeric(10,3),
    u_ca_ratio numeric(10,6),
    u_ca_ratio_error numeric(10,6),
    u_ca_error_type character varying(20),
    rmr0 numeric(6,4),
    kappa numeric(6,4),
    grain_age_ma numeric(10,2),
    grain_age_error_ma numeric(10,2),
    grain_age_error_type character varying(20),
    comments text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE ft_single_grain_ages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ft_single_grain_ages IS 'Fission-track single grain ages (EarthBank FTSingleGrain sheet)';


--
-- Name: ft_single_grain_ages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ft_single_grain_ages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ft_single_grain_ages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ft_single_grain_ages_id_seq OWNED BY public.ft_single_grain_ages.id;


--
-- Name: ft_track_length_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ft_track_length_data (
    id integer NOT NULL,
    ft_datapoint_id integer NOT NULL,
    grain_id character varying(100) NOT NULL,
    track_id character varying(100) NOT NULL,
    track_type character varying(20),
    mount_id character varying(50),
    etch_duration_seconds integer,
    apparent_length_um numeric(6,3),
    corrected_z_depth_um numeric(8,2),
    true_length_um numeric(6,3),
    azimuth_deg numeric(6,2),
    dip_deg numeric(6,2),
    angle_to_c_axis_deg numeric(6,2),
    c_axis_corrected_length_um numeric(6,3),
    dpar_um numeric(6,3),
    dpar_error_um numeric(6,3),
    n_dpar_measurements integer,
    dper_um numeric(6,3),
    dper_error_um numeric(6,3),
    n_dper_measurements integer,
    dpar_dper_error_type character varying(20),
    rmr0 numeric(6,4),
    kappa numeric(6,4),
    comments text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_track_type CHECK (((track_type)::text = ANY ((ARRAY['TINT'::character varying, 'TINCLE'::character varying, 'semi-track'::character varying, NULL::character varying])::text[])))
);


--
-- Name: TABLE ft_track_length_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ft_track_length_data IS 'Fission-track individual track measurements (EarthBank FTLengthData sheet)';


--
-- Name: COLUMN ft_track_length_data.track_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ft_track_length_data.track_type IS 'TINT (track-in-track) or TINCLE (track-in-cleavage)';


--
-- Name: ft_track_length_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ft_track_length_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ft_track_length_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ft_track_length_data_id_seq OWNED BY public.ft_track_length_data.id;


--
-- Name: grains; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grains (
    id integer NOT NULL,
    grain_id character varying(100) NOT NULL,
    mount_id character varying(50),
    grain_identifier character varying(100),
    grain_morphology character varying(50),
    grain_quality character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE grains; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.grains IS 'Individual grains within mounts (enables cross-method linking)';


--
-- Name: grains_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grains_id_seq OWNED BY public.grains.id;


--
-- Name: he_datapoints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.he_datapoints (
    id integer NOT NULL,
    sample_id character varying(50) NOT NULL,
    datapoint_key character varying(100) NOT NULL,
    batch_id integer,
    laboratory character varying(200),
    analyst_orcid character varying(50),
    analysis_date timestamp without time zone,
    publication_doi character varying(100),
    mineral_type character varying(50),
    mount_id character varying(50),
    n_aliquots integer,
    mean_uncorr_age_ma numeric(10,2),
    mean_uncorr_age_error_ma numeric(10,2),
    mean_uncorr_age_error_type character varying(20),
    weighted_mean_uncorr_age_ma numeric(10,2),
    weighted_mean_uncorr_age_error_ma numeric(10,2),
    weighted_mean_uncorr_age_error_type character varying(20),
    mswd_uncorr numeric(8,4),
    conf95_uncorr_ma numeric(10,2),
    chi2_uncorr_pct numeric(6,3),
    iqr_uncorr_ma numeric(10,2),
    mean_corr_age_ma numeric(10,2),
    mean_corr_age_error_ma numeric(10,2),
    mean_corr_age_error_type character varying(20),
    weighted_mean_corr_age_ma numeric(10,2),
    weighted_mean_corr_age_error_ma numeric(10,2),
    weighted_mean_corr_age_error_type character varying(20),
    mswd_corr numeric(8,4),
    conf95_corr_ma numeric(10,2),
    chi2_corr_pct numeric(6,3),
    iqr_corr_ma numeric(10,2),
    uncertainty_description text,
    ablation_pit_volume_method character varying(100),
    ablation_pit_volume_software character varying(100),
    he_measurement_method character varying(100),
    parent_isotope_method character varying(100),
    surface_area_volume_equation character varying(100),
    alpha_stopping_distance_ref character varying(200),
    ft_correction_equation character varying(100),
    esr_sa_v_equation character varying(100),
    esr_ft_equation character varying(100),
    eu_equation character varying(100),
    he_age_approach character varying(100),
    corr_age_method character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE he_datapoints; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.he_datapoints IS '(U-Th)/He analytical sessions (EarthBank He Datapoints sheet)';


--
-- Name: he_datapoints_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.he_datapoints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: he_datapoints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.he_datapoints_id_seq OWNED BY public.he_datapoints.id;


--
-- Name: he_whole_grain_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.he_whole_grain_data (
    id integer NOT NULL,
    he_datapoint_id integer NOT NULL,
    lab_no character varying(50),
    grain_identifier character varying(100),
    aliquot_type character varying(20),
    n_grains_in_aliquot integer,
    crystal_integrity character varying(20),
    grain_morphology character varying(50),
    assumed_geometry character varying(50),
    length_um numeric(10,2),
    length_um_sd numeric(10,2),
    half_width_um numeric(10,2),
    width_um_sd numeric(10,2),
    height_um numeric(10,2),
    height_um_sd numeric(10,2),
    measurement_method character varying(100),
    crystal_faces_measured character varying(200),
    he_ncc numeric(12,6),
    he_measurement_method character varying(100),
    he_extraction_temperature_c numeric(6,2),
    he_extraction_duration_min integer,
    he_extraction_method character varying(100),
    he_blank_ncc numeric(12,6),
    he_blank_error_ncc numeric(12,6),
    u_ppm numeric(10,3),
    u_ppm_error numeric(10,3),
    th_ppm numeric(10,3),
    th_ppm_error numeric(10,3),
    sm_ppm numeric(10,3),
    sm_ppm_error numeric(10,3),
    eu_ppm numeric(10,3),
    u_measurement_method character varying(100),
    u_blank_ppm numeric(10,6),
    th_blank_ppm numeric(10,6),
    sm_blank_ppm numeric(10,6),
    spike_u238_u235_ratio numeric(10,6),
    spike_th232_th229_ratio numeric(10,6),
    mass_mg numeric(10,6),
    surface_area_mm2 numeric(10,6),
    volume_mm3 numeric(10,6),
    sa_v_ratio numeric(10,6),
    rs_um numeric(10,2),
    esr_sa_v_um numeric(10,2),
    esr_ft_um numeric(10,2),
    sa_v_calc_equation character varying(100),
    ft_correction_equation character varying(100),
    alpha_stopping_distance_ref character varying(200),
    uncorr_age_ma numeric(10,2),
    uncorr_age_error_ma numeric(10,2),
    corr_age_ma numeric(10,2),
    corr_age_error_ma numeric(10,2),
    corr_age_1sigma_ma numeric(10,2),
    ft numeric(6,4),
    error_type character varying(20),
    eu_equation character varying(100),
    he_age_approach character varying(100),
    lambda_u238 character varying(30),
    lambda_th232 character varying(30),
    lambda_sm147 character varying(30),
    terminations character varying(10),
    std_run character varying(10),
    thermal_model character varying(10),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE he_whole_grain_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.he_whole_grain_data IS '(U-Th)/He grain-level results (EarthBank HeWholeGrain sheet)';


--
-- Name: COLUMN he_whole_grain_data.eu_ppm; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.he_whole_grain_data.eu_ppm IS 'Effective uranium (U + 0.235*Th)';


--
-- Name: COLUMN he_whole_grain_data.ft; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.he_whole_grain_data.ft IS 'Alpha ejection correction factor (Ft)';


--
-- Name: COLUMN he_whole_grain_data.terminations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.he_whole_grain_data.terminations IS 'Grain termination count (e.g., 0T, 1T, 2T)';


--
-- Name: he_whole_grain_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.he_whole_grain_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: he_whole_grain_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.he_whole_grain_data_id_seq OWNED BY public.he_whole_grain_data.id;


--
-- Name: mounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mounts (
    id integer NOT NULL,
    mount_id character varying(50) NOT NULL,
    mount_name character varying(200),
    mount_date date,
    sample_id character varying(50),
    etchant_chemical character varying(100),
    etch_duration_seconds integer,
    etch_temperature_c numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE mounts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.mounts IS 'Physical epoxy mounts containing grains';


--
-- Name: mounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mounts_id_seq OWNED BY public.mounts.id;


--
-- Name: people; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.people (
    id integer NOT NULL,
    orcid character varying(50),
    name character varying(200) NOT NULL,
    email character varying(200),
    affiliation character varying(300),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_orcid_or_name CHECK (((orcid IS NOT NULL) OR (name IS NOT NULL)))
);


--
-- Name: TABLE people; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.people IS 'Individuals involved in sample collection, analysis, or research';


--
-- Name: COLUMN people.orcid; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.orcid IS 'ORCID ID for unique researcher identification (optional)';


--
-- Name: people_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.people_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: people_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.people_id_seq OWNED BY public.people.id;


--
-- Name: reference_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reference_materials (
    id integer NOT NULL,
    batch_id integer NOT NULL,
    material_name character varying(100) NOT NULL,
    material_type character varying(50),
    expected_age_ma numeric(10,2),
    expected_age_error_ma numeric(10,2),
    measured_age_ma numeric(10,2),
    measured_age_error_ma numeric(10,2),
    parameter_type character varying(50),
    measured_value numeric(15,6),
    expected_value numeric(15,6),
    error numeric(15,6),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE reference_materials; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.reference_materials IS 'QC standards (Durango, Fish Canyon, etc.) analyzed alongside unknowns';


--
-- Name: COLUMN reference_materials.material_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reference_materials.material_type IS 'primary (age standard) or secondary (lab standard)';


--
-- Name: reference_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reference_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reference_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reference_materials_id_seq OWNED BY public.reference_materials.id;


--
-- Name: sample_people_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sample_people_roles (
    id integer NOT NULL,
    sample_id character varying(50) NOT NULL,
    person_id integer NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE sample_people_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sample_people_roles IS 'Links samples to people with roles (collector, investigator, etc.)';


--
-- Name: COLUMN sample_people_roles.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sample_people_roles.role IS 'collector, chief_investigator, investigator, analyst, lab_technician, co-author, etc.';


--
-- Name: sample_people_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sample_people_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sample_people_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sample_people_roles_id_seq OWNED BY public.sample_people_roles.id;


--
-- Name: samples; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.samples (
    sample_id character varying(50) NOT NULL,
    dataset_id integer DEFAULT 1,
    igsn character varying(20),
    latitude numeric(10,7),
    longitude numeric(10,7),
    elevation_m numeric(8,2),
    geodetic_datum character varying(20) DEFAULT 'WGS84'::character varying,
    vertical_datum character varying(50) DEFAULT 'mean sea level'::character varying,
    lat_long_precision_m integer,
    lithology character varying(100),
    mineral_type character varying(50),
    sample_kind character varying(100),
    sample_method character varying(100),
    sample_depth_m numeric(8,2),
    sampling_location_information text,
    stratigraphic_unit character varying(200),
    chronostratigraphic_unit_age character varying(100),
    sample_age_ma numeric(10,2),
    sample_collector character varying(200),
    collection_date date,
    analyst character varying(100),
    analysis_method character varying(100),
    last_known_sample_archive character varying(200),
    associated_references text,
    n_aft_grains integer,
    n_ahe_grains integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE samples; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.samples IS 'Geological sample metadata (FAIR Table 4)';


--
-- Name: COLUMN samples.igsn; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.samples.igsn IS 'International Geo Sample Number - global unique identifier';


--
-- Name: COLUMN samples.n_aft_grains; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.samples.n_aft_grains IS 'Number of grains with AFT data';


--
-- Name: COLUMN samples.n_ahe_grains; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.samples.n_ahe_grains IS 'Number of grains with (U-Th)/He data';


--
-- Name: vw_aft_complete; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_aft_complete AS
 SELECT s.sample_id,
    s.sampling_location_information,
    s.latitude,
    s.longitude,
    s.elevation_m,
    ftd.central_age_ma,
    ftd.central_age_error_ma,
    ftd.pooled_age_ma,
    ftd.pooled_age_error_ma,
    ftd.dispersion_pct,
    ftd.p_chi2_pct,
    ftd.n_grains,
    ftd.mean_track_length_um,
    ftd.sd_track_length_um,
    ftd.n_track_measurements,
    ftd.mean_rho_s,
    ftd.total_ns,
    ftd.mean_u_ppm,
    ftd.mean_dpar_um
   FROM (public.samples s
     LEFT JOIN LATERAL ( SELECT ft_datapoints.id,
            ft_datapoints.sample_id,
            ft_datapoints.datapoint_key,
            ft_datapoints.batch_id,
            ft_datapoints.laboratory,
            ft_datapoints.analyst_orcid,
            ft_datapoints.analysis_date,
            ft_datapoints.publication_doi,
            ft_datapoints.mineral_type,
            ft_datapoints.ft_method,
            ft_datapoints.ft_software,
            ft_datapoints.ft_algorithm,
            ft_datapoints.u_determination_method,
            ft_datapoints.n_grains,
            ft_datapoints.total_area_cm2,
            ft_datapoints.mean_rho_s,
            ft_datapoints.total_ns,
            ft_datapoints.mean_rho_i,
            ft_datapoints.total_ni,
            ft_datapoints.mean_rho_d,
            ft_datapoints.total_nd,
            ft_datapoints.dosimeter,
            ft_datapoints.mean_u_ppm,
            ft_datapoints.sd_u_ppm,
            ft_datapoints.mean_dpar_um,
            ft_datapoints.se_dpar_um,
            ft_datapoints.n_dpar_measurements,
            ft_datapoints.mean_dper_um,
            ft_datapoints.se_dper_um,
            ft_datapoints.n_dper_measurements,
            ft_datapoints.mean_rmr0,
            ft_datapoints.sd_rmr0,
            ft_datapoints.mean_kappa,
            ft_datapoints.sd_kappa,
            ft_datapoints.rmr0_equation,
            ft_datapoints.chi_square,
            ft_datapoints.p_chi2_pct,
            ft_datapoints.dispersion_pct,
            ft_datapoints.age_equation,
            ft_datapoints.mean_age_ma,
            ft_datapoints.mean_age_error_ma,
            ft_datapoints.central_age_ma,
            ft_datapoints.central_age_error_ma,
            ft_datapoints.pooled_age_ma,
            ft_datapoints.pooled_age_error_ma,
            ft_datapoints.population_age_ma,
            ft_datapoints.population_age_error_ma,
            ft_datapoints.age_error_type,
            ft_datapoints.age_comment,
            ft_datapoints.mean_track_length_um,
            ft_datapoints.se_mean_track_length_um,
            ft_datapoints.n_track_measurements,
            ft_datapoints.sd_track_length_um,
            ft_datapoints.cf252_irradiation,
            ft_datapoints.etchant_chemical,
            ft_datapoints.etch_duration_seconds,
            ft_datapoints.etch_temperature_c,
            ft_datapoints.zeta_yr_cm2,
            ft_datapoints.zeta_error_yr_cm2,
            ft_datapoints.zeta_error_type,
            ft_datapoints.r_um,
            ft_datapoints.lambda_d,
            ft_datapoints.lambda_f,
            ft_datapoints.q_factor,
            ft_datapoints.irradiation_reactor,
            ft_datapoints.thermal_neutron_dose,
            ft_datapoints.irradiation_batch_id,
            ft_datapoints.created_at
           FROM public.ft_datapoints
          WHERE ((ft_datapoints.sample_id)::text = (s.sample_id)::text)
          ORDER BY ft_datapoints.analysis_date DESC, ft_datapoints.id DESC
         LIMIT 1) ftd ON (true));


--
-- Name: VIEW vw_aft_complete; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_aft_complete IS 'Complete AFT data from first datapoint per sample (Schema v2 - uses ft_datapoints)';


--
-- Name: vw_sample_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_sample_summary AS
 SELECT s.sample_id,
    s.igsn,
    s.latitude,
    s.longitude,
    s.elevation_m,
    s.lithology,
    s.mineral_type,
    s.sampling_location_information,
    s.n_aft_grains,
    s.n_ahe_grains,
    ( SELECT ft_datapoints.central_age_ma
           FROM public.ft_datapoints
          WHERE ((ft_datapoints.sample_id)::text = (s.sample_id)::text)
          ORDER BY ft_datapoints.analysis_date DESC, ft_datapoints.id DESC
         LIMIT 1) AS aft_central_age_ma,
    ( SELECT ft_datapoints.central_age_error_ma
           FROM public.ft_datapoints
          WHERE ((ft_datapoints.sample_id)::text = (s.sample_id)::text)
          ORDER BY ft_datapoints.analysis_date DESC, ft_datapoints.id DESC
         LIMIT 1) AS aft_age_error_ma,
    ( SELECT ft_datapoints.dispersion_pct
           FROM public.ft_datapoints
          WHERE ((ft_datapoints.sample_id)::text = (s.sample_id)::text)
          ORDER BY ft_datapoints.analysis_date DESC, ft_datapoints.id DESC
         LIMIT 1) AS aft_dispersion_pct,
    ( SELECT ft_datapoints.p_chi2_pct
           FROM public.ft_datapoints
          WHERE ((ft_datapoints.sample_id)::text = (s.sample_id)::text)
          ORDER BY ft_datapoints.analysis_date DESC, ft_datapoints.id DESC
         LIMIT 1) AS aft_p_chi2,
    ( SELECT ft_datapoints.mean_track_length_um
           FROM public.ft_datapoints
          WHERE ((ft_datapoints.sample_id)::text = (s.sample_id)::text)
          ORDER BY ft_datapoints.analysis_date DESC, ft_datapoints.id DESC
         LIMIT 1) AS aft_mtl_um,
    ( SELECT ft_datapoints.sd_track_length_um
           FROM public.ft_datapoints
          WHERE ((ft_datapoints.sample_id)::text = (s.sample_id)::text)
          ORDER BY ft_datapoints.analysis_date DESC, ft_datapoints.id DESC
         LIMIT 1) AS aft_mtl_sd_um,
    ( SELECT ft_datapoints.n_track_measurements
           FROM public.ft_datapoints
          WHERE ((ft_datapoints.sample_id)::text = (s.sample_id)::text)
          ORDER BY ft_datapoints.analysis_date DESC, ft_datapoints.id DESC
         LIMIT 1) AS aft_n_tracks,
    ( SELECT avg(hg.corr_age_ma) AS avg
           FROM (public.he_whole_grain_data hg
             JOIN public.he_datapoints hd ON ((hg.he_datapoint_id = hd.id)))
          WHERE ((hd.sample_id)::text = (s.sample_id)::text)) AS ahe_mean_age_ma,
    ( SELECT stddev(hg.corr_age_ma) AS stddev
           FROM (public.he_whole_grain_data hg
             JOIN public.he_datapoints hd ON ((hg.he_datapoint_id = hd.id)))
          WHERE ((hd.sample_id)::text = (s.sample_id)::text)) AS ahe_age_sd_ma,
    ( SELECT count(hg.id) AS count
           FROM (public.he_whole_grain_data hg
             JOIN public.he_datapoints hd ON ((hg.he_datapoint_id = hd.id)))
          WHERE ((hd.sample_id)::text = (s.sample_id)::text)) AS ahe_n_grains_measured,
    ( SELECT avg(hg.eu_ppm) AS avg
           FROM (public.he_whole_grain_data hg
             JOIN public.he_datapoints hd ON ((hg.he_datapoint_id = hd.id)))
          WHERE ((hd.sample_id)::text = (s.sample_id)::text)) AS ahe_mean_eu_ppm,
    d.dataset_name,
    d.study_area
   FROM (public.samples s
     LEFT JOIN public.datasets d ON ((s.dataset_id = d.id)));


--
-- Name: VIEW vw_sample_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_sample_summary IS 'Sample summary with first datapoint ages (Schema v2 - uses ft_datapoints)';


--
-- Name: ahe_grain_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ahe_grain_data ALTER COLUMN id SET DEFAULT nextval('public.ahe_grain_data_id_seq'::regclass);


--
-- Name: batches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batches ALTER COLUMN id SET DEFAULT nextval('public.batches_id_seq'::regclass);


--
-- Name: data_files id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_files ALTER COLUMN id SET DEFAULT nextval('public.data_files_id_seq'::regclass);


--
-- Name: datapoint_people_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datapoint_people_roles ALTER COLUMN id SET DEFAULT nextval('public.datapoint_people_roles_id_seq'::regclass);


--
-- Name: dataset_people_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dataset_people_roles ALTER COLUMN id SET DEFAULT nextval('public.dataset_people_roles_id_seq'::regclass);


--
-- Name: datasets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datasets ALTER COLUMN id SET DEFAULT nextval('public.datasets_id_seq'::regclass);


--
-- Name: fair_score_breakdown id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fair_score_breakdown ALTER COLUMN id SET DEFAULT nextval('public.fair_score_breakdown_id_seq'::regclass);


--
-- Name: ft_binned_length_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_binned_length_data ALTER COLUMN id SET DEFAULT nextval('public.ft_binned_length_data_id_seq'::regclass);


--
-- Name: ft_count_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_count_data ALTER COLUMN id SET DEFAULT nextval('public.ft_count_data_id_seq'::regclass);


--
-- Name: ft_datapoints id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_datapoints ALTER COLUMN id SET DEFAULT nextval('public.ft_datapoints_id_seq'::regclass);


--
-- Name: ft_single_grain_ages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_single_grain_ages ALTER COLUMN id SET DEFAULT nextval('public.ft_single_grain_ages_id_seq'::regclass);


--
-- Name: ft_track_length_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_track_length_data ALTER COLUMN id SET DEFAULT nextval('public.ft_track_length_data_id_seq'::regclass);


--
-- Name: grains id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grains ALTER COLUMN id SET DEFAULT nextval('public.grains_id_seq'::regclass);


--
-- Name: he_datapoints id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_datapoints ALTER COLUMN id SET DEFAULT nextval('public.he_datapoints_id_seq'::regclass);


--
-- Name: he_whole_grain_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_whole_grain_data ALTER COLUMN id SET DEFAULT nextval('public.he_whole_grain_data_id_seq'::regclass);


--
-- Name: mounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mounts ALTER COLUMN id SET DEFAULT nextval('public.mounts_id_seq'::regclass);


--
-- Name: people id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.people ALTER COLUMN id SET DEFAULT nextval('public.people_id_seq'::regclass);


--
-- Name: reference_materials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_materials ALTER COLUMN id SET DEFAULT nextval('public.reference_materials_id_seq'::regclass);


--
-- Name: sample_people_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sample_people_roles ALTER COLUMN id SET DEFAULT nextval('public.sample_people_roles_id_seq'::regclass);


--
-- Data for Name: ahe_grain_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ahe_grain_data (id, sample_id, lab_no, length_um, half_width_um, rs_um, mass_mg, terminations, u_ppm, th_ppm, sm_ppm, eu_ppm, he_ncc, uncorr_age_ma, corr_age_ma, corr_age_1sigma_ma, ft, std_run, thermal_model, created_at) FROM stdin;
\.


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.batches (id, batch_name, analysis_date, laboratory, analytical_session, irradiation_id, irradiation_reactor, thermal_neutron_dose, created_at) FROM stdin;
1	Malawi-B	2019-01-01	\N	\N	\N	\N	\N	2025-11-17 14:12:01.65361
2	Malawi-C	2019-01-01	\N	\N	\N	\N	\N	2025-11-17 14:12:01.65361
3	Malawi-D	2019-01-01	\N	\N	\N	\N	\N	2025-11-17 14:12:01.65361
4	Malawi-E	2019-01-01	\N	\N	\N	\N	\N	2025-11-17 14:12:01.65361
\.


--
-- Data for Name: data_files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.data_files (id, dataset_id, file_name, file_path, file_type, display_name, file_size_bytes, row_count, description, created_at, updated_at, is_folder, folder_path, upload_status, category, source_url, upload_notes) FROM stdin;
59	5	Samples.xlsx	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Samples/Samples.xlsx	Excel	Samples Metadata	\N	\N	Sample location, lithology, and collection metadata (8 KB)	2025-11-18 03:13:10.831576	2025-11-18 03:13:10.831576	f	\N	available	supplementary_data	https://doi.org/10.58024/AGUM6A344358	\N
43	5	4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf	/data/papers/malawi-rift-2024.pdf	PDF	McMillan et al. (2024) - Full Paper	\N	\N	Complete research article from Journal of Structural Geology	2025-11-17 21:38:51.67441	2025-11-17 21:38:51.67441	f	\N	available	\N	\N	\N
35	5	table1-aft-results.csv	/data/papers/malawi-rift-2024-supplementary/table1-aft-results.csv	RAW	Table 1 - AFT Results	\N	\N	Raw data extracted from paper Table 1 (AFT results summary)	2025-11-17 21:38:51.185443	2025-11-17 21:38:51.185443	f	\N	available	\N	\N	\N
36	5	table2-uthe-results-part1.csv	/data/papers/malawi-rift-2024-supplementary/table2-uthe-results-part1.csv	RAW	Table 2 - (U-Th)/He Results	\N	\N	Raw data extracted from paper Table 2 ((U-Th)/He results)	2025-11-17 21:38:51.185443	2025-11-17 21:38:51.185443	f	\N	available	\N	\N	\N
37	5	tableA2.csv	/data/papers/malawi-rift-2024-supplementary/tableA2.csv	RAW	Table A2 - EPMA Composition	\N	\N	Raw data extracted from Table A2 (detailed EPMA mineral composition)	2025-11-17 21:38:51.185443	2025-11-17 21:38:51.185443	f	\N	available	\N	\N	\N
38	5	tableA3-durango-qc.csv	/data/papers/malawi-rift-2024-supplementary/tableA3-durango-qc.csv	RAW	Table A3 - Durango QC Standards	\N	\N	Quality control data for Durango apatite reference material	2025-11-17 21:38:51.185443	2025-11-17 21:38:51.185443	f	\N	available	\N	\N	\N
44	5	table1_page9.pdf	/data/papers/malawi-rift-2024-supplementary/table1_page9.pdf	PDF	Table 1 Extract (Page 9)	\N	\N	PDF extract of AFT results table from paper	2025-11-17 21:38:51.67441	2025-11-17 21:38:51.67441	f	\N	available	\N	\N	\N
45	5	table2_pages10-11.pdf	/data/papers/malawi-rift-2024-supplementary/table2_pages10-11.pdf	PDF	Table 2 Extract (Pages 10-11)	\N	\N	PDF extract of (U-Th)/He results table from paper	2025-11-17 21:38:51.67441	2025-11-17 21:38:51.67441	f	\N	available	\N	\N	\N
39	5	earthbank_samples_complete.csv	/data/papers/malawi-rift-2024-supplementary/earthbank_samples_complete.csv	EarthBank	Samples (EarthBank Format)	\N	\N	EarthBank-formatted sample data (FAIR compliant)	2025-11-17 21:38:51.432398	2025-11-17 21:38:51.432398	f	\N	available	\N	\N	\N
40	5	earthbank_ft_datapoints_complete.csv	/data/papers/malawi-rift-2024-supplementary/earthbank_ft_datapoints_complete.csv	EarthBank	FT Datapoints (EarthBank Format)	\N	\N	EarthBank-formatted fission-track datapoint data (FAIR compliant)	2025-11-17 21:38:51.432398	2025-11-17 21:38:51.432398	f	\N	available	\N	\N	\N
41	5	earthbank_ft_track_length_data_complete.csv	/data/papers/malawi-rift-2024-supplementary/earthbank_ft_track_length_data_complete.csv	EarthBank	FT Track Lengths (EarthBank Format)	\N	\N	EarthBank-formatted track length data (FAIR compliant)	2025-11-17 21:38:51.432398	2025-11-17 21:38:51.432398	f	\N	available	\N	\N	\N
42	5	earthbank_he_whole_grain_complete.csv	/data/papers/malawi-rift-2024-supplementary/earthbank_he_whole_grain_complete.csv	EarthBank	He Whole Grain Data (EarthBank Format)	\N	\N	EarthBank-formatted (U-Th)/He grain data (FAIR compliant)	2025-11-17 21:38:51.432398	2025-11-17 21:38:51.432398	f	\N	available	\N	\N	\N
51	4	table-s1-summary-zhe-raw.csv	/data/papers/peak-2021/RAW/table-s1-summary-zhe-raw.csv	RAW	Table S1: Summary ZHe Results	\N	\N	Summary ZHe results from Table S1	2025-11-18 03:05:00.694234	2025-11-18 03:05:00.694234	f	\N	available	\N	\N	\N
52	4	table-s2-detailed-zhe-raw.csv	/data/papers/peak-2021/RAW/table-s2-detailed-zhe-raw.csv	RAW	Table S2: Detailed ZHe Data	\N	\N	Detailed ZHe single-grain data from Table S2	2025-11-18 03:05:00.694234	2025-11-18 03:05:00.694234	f	\N	available	\N	\N	\N
53	4	earthbank_samples.csv	/data/papers/peak-2021/FAIR/earthbank_samples.csv	EarthBank	EarthBank Samples	\N	\N	FAIR-compliant sample metadata following EarthBank standards	2025-11-18 03:05:00.941406	2025-11-18 03:05:00.941406	f	\N	available	\N	\N	\N
54	4	earthbank_he_datapoints.csv	/data/papers/peak-2021/FAIR/earthbank_he_datapoints.csv	EarthBank	EarthBank He Datapoints	\N	\N	FAIR-compliant (U-Th)/He datapoint metadata	2025-11-18 03:05:00.941406	2025-11-18 03:05:00.941406	f	\N	available	\N	\N	\N
55	4	earthbank_he_whole_grain_data.csv	/data/papers/peak-2021/FAIR/earthbank_he_whole_grain_data.csv	EarthBank	EarthBank He Grain Data	\N	\N	FAIR-compliant grain-level (U-Th)/He analytical data	2025-11-18 03:05:00.941406	2025-11-18 03:05:00.941406	f	\N	available	\N	\N	\N
49	4	Tables_Peaketal_GrandCanyonPaleotopography.xlsx	/data/papers/peak-2021-supplementary/Tables_Peaketal_GrandCanyonPaleotopography.xlsx	RAW	Supplementary Tables (Excel)	\N	\N	Complete thermochronology data tables from supplementary materials	2025-11-18 02:36:55.758929	2025-11-18 02:36:55.758929	f	\N	available	\N	\N	\N
46	4	Peak_et_al_2021_Geology.pdf	/data/papers/peak-et-al-2021-grand-canyon.pdf	PDF	Peak et al. (2021) - Main Paper	\N	\N	Main publication PDF	2025-11-18 02:36:55.758929	2025-11-18 02:36:55.758929	f	\N	available	\N	\N	\N
47	4	SupplementaryText.pdf	/data/papers/peak-2021-supplementary/SupplementaryText.pdf	PDF	Supplementary Text	\N	\N	Supplementary text	2025-11-18 02:36:55.758929	2025-11-18 02:36:55.758929	f	\N	available	\N	\N	\N
48	4	SupplementaryFigures.pdf	/data/papers/peak-2021-supplementary/SupplementaryFigures.pdf	PDF	Supplementary Figures	\N	\N	Supplementary figures	2025-11-18 02:36:55.758929	2025-11-18 02:36:55.758929	f	\N	available	\N	\N	\N
56	5	Fission Track.xlsx	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Fission Track/Fission Track.xlsx	Excel	Fission Track Supplementary Data	\N	\N	Complete AFT analytical data including single-grain ages, count data, and track length measurements (212 KB)	2025-11-18 03:13:10.137998	2025-11-18 03:13:10.137998	f	\N	available	supplementary_data	https://doi.org/10.58024/AGUM6A344358	\N
57	5	Helium.xlsx	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Helium/Helium.xlsx	Excel	(U-Th)/He Supplementary Data	\N	\N	Complete (U-Th)/He single-grain analytical data with Ft corrections and thermal constraints (28 KB)	2025-11-18 03:13:10.371693	2025-11-18 03:13:10.371693	f	\N	available	supplementary_data	https://doi.org/10.58024/AGUM6A344358	\N
58	5	Geochem.xlsx	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Geochem/Geochem.xlsx	Excel	Geochemistry Supplementary Data	\N	\N	LA-ICP-MS trace element geochemistry data for apatite grains (88 KB)	2025-11-18 03:13:10.601491	2025-11-18 03:13:10.601491	f	\N	available	supplementary_data	https://doi.org/10.58024/AGUM6A344358	\N
50	6	Dusel-Bacon(2015)-AFT-regional-exhumation-subtropical-Eocene-Alaska-CJES.pdf	/data/papers/dusel-bacon-2015-alaska.pdf	PDF	Dusel-Bacon et al. (2015) - Main Paper	\N	\N	Regional exhumation in subtropical Eocene Alaska - Canadian Journal of Earth Sciences	2025-11-18 02:36:56.000728	2025-11-18 02:36:56.000728	f	\N	available	\N	\N	\N
60	5	Thermal History.xlsx	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Thermal History/Thermal History.xlsx	Excel	Thermal History Modeling Results	\N	\N	HeFTy thermal history modeling results and constraints (20 KB)	2025-11-18 03:13:11.067038	2025-11-18 03:13:11.067038	f	\N	available	supplementary_data	https://doi.org/10.58024/AGUM6A344358	\N
61	5	Usisya_SEM_wocolor.xlsx	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Files/SEM Geochem Raw Data/Usisya_SEM_wocolor.xlsx	Excel	SEM Geochemistry Raw Data	\N	\N	Scanning Electron Microscope geochemistry raw measurements (564 KB)	2025-11-18 03:13:11.298662	2025-11-18 03:13:11.298662	f	\N	available	supplementary_data	https://doi.org/10.58024/AGUM6A344358	\N
62	5	Single Grain Age Files	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Files/Single Grain Age Files (Excel)/	Excel	Single Grain Age Files (35 samples)	\N	\N	Individual sample-by-sample Excel files containing grain-by-grain AFT analytical results (MU19-05 through MU19-54, total 1.3 MB)	2025-11-18 03:13:11.528682	2025-11-18 03:13:11.528682	t	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Files/Single Grain Age Files (Excel)/	available	supplementary_data	https://doi.org/10.58024/AGUM6A344358	\N
63	5	Fission Track Shapefile	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Fission Track/shapefile/	Shapefile	Fission Track Geospatial Data	\N	\N	GIS shapefile with AFT sample locations and results (5 files: .shp, .shx, .dbf, .prj, .fix)	2025-11-18 03:13:11.761707	2025-11-18 03:13:11.761707	t	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Fission Track/shapefile/	external_only	supplementary_geospatial	https://doi.org/10.58024/AGUM6A344358	Geospatial format - available for download from AusGeochem but not imported to database
64	5	Helium Shapefile	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Helium/shapefile/	Shapefile	(U-Th)/He Geospatial Data	\N	\N	GIS shapefile with (U-Th)/He sample locations and results (5 files: .shp, .shx, .dbf, .prj, .fix)	2025-11-18 03:13:11.990654	2025-11-18 03:13:11.990654	t	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Helium/shapefile/	external_only	supplementary_geospatial	https://doi.org/10.58024/AGUM6A344358	Geospatial format - available for download from AusGeochem but not imported to database
65	5	Geochem Shapefile	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Geochem/shapefile/	Shapefile	Geochemistry Geospatial Data	\N	\N	GIS shapefile with geochemistry sample locations (5 files: .shp, .shx, .dbf, .prj, .fix)	2025-11-18 03:13:12.237705	2025-11-18 03:13:12.237705	t	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Geochem/shapefile/	external_only	supplementary_geospatial	https://doi.org/10.58024/AGUM6A344358	Geospatial format - available for download from AusGeochem but not imported to database
66	5	Samples Shapefile	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Samples/shapefile/	Shapefile	Sample Locations Geospatial Data	\N	\N	GIS shapefile with all sample locations (5 files: .shp, .shx, .dbf, .prj, .fix)	2025-11-18 03:13:12.467876	2025-11-18 03:13:12.467876	t	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Samples/shapefile/	external_only	supplementary_geospatial	https://doi.org/10.58024/AGUM6A344358	Geospatial format - available for download from AusGeochem but not imported to database
67	5	Thermal History Shapefile	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Thermal History/shapefile/	Shapefile	Thermal History Geospatial Data	\N	\N	GIS shapefile with thermal history modeling results (5 files: .shp, .shx, .dbf, .prj, .fix)	2025-11-18 03:13:12.696812	2025-11-18 03:13:12.696812	t	/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Thermal History/shapefile/	external_only	supplementary_geospatial	https://doi.org/10.58024/AGUM6A344358	Geospatial format - available for download from AusGeochem but not imported to database
68	4	Tables_Peaketal_GrandCanyonPaleotopography.xlsx	/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/Tables_Peaketal_GrandCanyonPaleotopography.xlsx	Excel	Complete ZHe Analytical Data Tables	\N	\N	Primary data file containing all (U-Th)/He analytical results and thermal history modeling data. Includes 12 tables (S1-S12): ZHe summary and detailed data, zonation profiles, thermal modeling constraints, and inverse/forward model results (1.1 MB)	2025-11-18 03:20:32.428385	2025-11-18 03:20:32.428385	f	\N	available	supplementary_data	https://doi.org/10.17605/OSF.IO/D8B2Q	\N
69	4	SupplementaryText.pdf	/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/SupplementaryText.pdf	PDF	Supplementary Methods and Results	\N	\N	Extended methods, thermal history modeling approach, detailed analytical procedures for ZHe and LA-ICP-MS, additional discussion of data interpretations (186 KB)	2025-11-18 03:20:32.666303	2025-11-18 03:20:32.666303	f	\N	available	supplementary_text	https://doi.org/10.17605/OSF.IO/D8B2Q	\N
70	4	SupplementaryFigures.pdf	/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/SupplementaryFigures.pdf	PDF	Supplementary Figures (S1-S5)	\N	\N	Supplementary figures including date vs. radius plots (grain size effects), LA-ICP-MS zonation profiles (U, Th, Sm depth plots), zonation pattern variability, and UGG forward/inverse model results (2.1 MB)	2025-11-18 03:20:33.034593	2025-11-18 03:20:33.034593	f	\N	available	supplementary_figures	https://doi.org/10.17605/OSF.IO/D8B2Q	\N
71	4	LA-ICP-MS Depth Profile Data Files	/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/DepthProfiles_DataFiles/	Text	LA-ICP-MS Depth Profile Raw Data (10 files)	\N	\N	Raw LA-ICP-MS depth profiling data used to generate zonation profiles in Tables S4 and S9. Text files containing depth vs. U, Th, Sm measurements for individual zircon grains. Files: row2-5, row3-4, row4-2, row4-5, row5-7, row6-3, row6-4, row6-6, row6-7, row7-4 (total 650 KB)	2025-11-18 03:20:33.784523	2025-11-18 03:20:33.784523	t	/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/DepthProfiles_DataFiles/	available	supplementary_data	https://doi.org/10.17605/OSF.IO/D8B2Q	\N
72	6	dusel-bacon-2015-aft-data.csv	/data/papers/dusel-bacon-2015/RAW/dusel-bacon-2015-aft-data.csv	RAW	Table 2: AFT Results (Raw)	\N	\N	Raw AFT results extracted from Table 2 of the published paper	2025-11-18 03:22:47.478373	2025-11-18 03:22:47.478373	f	\N	available	\N	\N	\N
73	6	earthbank_samples.csv	/data/papers/dusel-bacon-2015/FAIR/earthbank_samples.csv	EarthBank	EarthBank Samples	\N	\N	FAIR-compliant sample metadata following EarthBank standards	2025-11-18 03:22:47.720032	2025-11-18 03:22:47.720032	f	\N	available	\N	\N	\N
74	6	earthbank_ft_datapoints.csv	/data/papers/dusel-bacon-2015/FAIR/earthbank_ft_datapoints.csv	EarthBank	EarthBank FT Datapoints	\N	\N	FAIR-compliant fission-track datapoint metadata	2025-11-18 03:22:47.720032	2025-11-18 03:22:47.720032	f	\N	available	\N	\N	\N
\.


--
-- Data for Name: datapoint_people_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.datapoint_people_roles (id, datapoint_id, datapoint_type, person_id, role, created_at) FROM stdin;
\.


--
-- Data for Name: dataset_people_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dataset_people_roles (id, dataset_id, person_id, role, author_order, created_at) FROM stdin;
1	4	1	author	1	2025-11-18 03:15:39.999524
2	4	2	author	2	2025-11-18 03:15:39.999524
3	4	3	author	3	2025-11-18 03:15:39.999524
4	4	4	author	4	2025-11-18 03:15:39.999524
5	4	5	author	5	2025-11-18 03:15:39.999524
6	4	6	author	6	2025-11-18 03:15:39.999524
7	5	7	author	1	2025-11-18 03:15:46.20546
8	5	8	author	2	2025-11-18 03:15:46.20546
9	5	9	author	3	2025-11-18 03:15:46.20546
10	5	10	author	4	2025-11-18 03:15:46.20546
11	5	11	author	5	2025-11-18 03:15:46.20546
12	5	12	author	6	2025-11-18 03:15:46.20546
13	6	13	author	1	2025-11-18 03:15:52.365388
14	6	14	author	2	2025-11-18 03:15:52.365388
15	6	15	author	3	2025-11-18 03:15:52.365388
\.


--
-- Data for Name: datasets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.datasets (id, dataset_name, description, publication_reference, doi, study_area, analyst, laboratory, created_at, full_citation, publication_year, publication_journal, publication_volume_pages, study_location, pdf_filename, pdf_url, mineral_analyzed, sample_count, age_range_min_ma, age_range_max_ma, authors, collection_date, analysis_methods, supplementary_files_url) FROM stdin;
4	Grand Canyon Zircon (U-Th)/He Thermochronology	This study presents new zircon (U-Th)/He thermochronology data from the Grand Canyon region to constrain the long-term thermal evolution and exhumation history. The research integrates thermal modeling with existing datasets to reconstruct the cooling history of Grand Canyon rocks, providing insights into the timing and magnitude of exhumation events that shaped this iconic landscape.	\N	10.1130/G49116.1	Grand Canyon, AZ	\N	University of Colorado Boulder	2025-11-17 13:39:15.060616	Peak, B.A., Flowers, R.M., Havranek, R.E., Barnes, J.B., Karlstrom, K.E., Fox, M., 2021. Zircon (U-Th)/He thermochronometric constraints on the long-term thermal evolution of the Grand Canyon region, USA. Geology 49(12), 1539–1543.	2021	Geology	49(12), 1539–1543	Grand Canyon, Arizona, USA	\N	/data/papers/peak-et-al-2021-grand-canyon.pdf	Zircon	\N	\N	\N	{"B.A. Peak","R.M. Flowers","R.E. Havranek","J.B. Barnes","K.E. Karlstrom","M. Fox"}	\N	\N	https://doi.org/10.17605/OSF.IO/D8B2Q
5	Malawi Rift Footwall Exhumation	This landmark 2024 study by McMillan, Boone, and colleagues provides the first successful validation of footwall exhumation modeling as a proxy for normal fault array evolution in extensional basins. Using the Miocene Central Basin of the Malawi Rift as a natural laboratory, the authors demonstrate that along-strike patterns in footwall denudational cooling—constrained by apatite fission-track (AFT) and (U-Th)/He (AHe) thermochronology—closely mirror 4D hangingwall subsidence trends previously documented from seismic reflection and well data.	McMillan, M.E., Boone, S.C., et al., 2024. 4D Fault Evolution in Malawi Rift: Validation of footwall exhumation modeling. Tectonics (in press).	10.1016/j.jsg.2024.105087	Usisya Border Fault System, Malawi Rift Central Basin	\N	University of Melbourne	2025-11-17 14:12:00.742756	McMillan, M.E., Boone, S.C., Mbogoni, G., Castillo, P., Manya, S., Roberts, E.M., Stevens, N.J., Gottfried, M.D., O'Connor, P.M., 2024. 4D fault evolution revealed by footwall exhumation modelling: A natural experiment in the Malawi rift. Journal of Structural Geology 182, 105087.	2024	Journal of Structural Geology	182, 105087	Central Basin, Malawi Rift	\N	/data/papers/malawi-rift-2024.pdf	Apatite	\N	\N	\N	\N	\N	\N	https://doi.org/10.58024/AGUM6A344358
6	East-Central Alaska Eocene Exhumation	Regional Eocene cooling and exhumation in Alaska revealed by 33 apatite fission-track ages. LA-ICP-MS method, analyzed at Apatite to Zircon Inc. (A2Z) by P.B. O'Sullivan.	\N	cjes-2015-0138	\N	\N	\N	2025-11-18 00:34:51.391023	Dusel-Bacon, C., Bacon, C.R., O'Sullivan, P.B., and Day, W.C., 2015. Apatite fission-track evidence for regional exhumation in the subtropical Eocene, block faulting, and localized fluid flow in east-central Alaska. Canadian Journal of Earth Sciences, v. 52.	2015	Canadian Journal of Earth Sciences	\N	Yukon-Tanana Upland, western Fortymile mining district, east-central Alaska, USA	\N	/data/papers/dusel-bacon-2015-alaska.pdf	apatite	33	9.50	73.00	\N	\N	\N	\N
\.


--
-- Data for Name: fair_score_breakdown; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fair_score_breakdown (id, dataset_id, table4_score, table4_reasoning, table5_score, table5_reasoning, table6_score, table6_reasoning, table10_score, table10_reasoning, findable_score, findable_reasoning, accessible_score, accessible_reasoning, interoperable_score, interoperable_reasoning, reusable_score, reusable_reasoning, total_score, grade, created_at, updated_at) FROM stdin;
2	5	15	All required fields present: sample_id (MU19-XX), IGSN (from AusGeochem), lat/lon (Fig 3 + AusGeochem), elevation, mineral (apatite), lithology (granitoid/metamorphic), collector (Malcolm McMillan), collection_date (2019), stratigraphic_unit (Ubendian/Irumide Belt)	13	All core fields present: grain_id (Supplementary Info), Ns, ρs, Dpar, analyst (AutomatedFastTracks), lab (Melbourne), method (LA-ICP-MS), U ppm, counting area. Missing Ni/ρi/Nd/ρd (N/A for LA-ICP-MS method).	\N	\N	8	All core fields present: central_age, dispersion, P(χ²), n_grains, pooled_age, analyst, laboratory. Minor: zeta/λf/λD in methods section but not in table.	24	IGSN assigned (global identifiers), DOI minted (10.58024/AGUM6A344358), lat/lon coordinates provided, published on AusGeochem platform, complete sample metadata. Minor: No explicit link to regional geological map.	25	Data publicly available (no embargo/registration), multiple access methods (AusGeochem web UI + API), open format (CSV/Excel), all tables in paper or SI, no authentication barriers.	23	EarthBank template compatible, Kohn et al. (2024) compliant field names, controlled vocabularies, consistent units, machine-readable metadata. Minor gaps: Some fields require text extraction from methods section, kinetic params not linked to grains.	20	Complete provenance (ORCID for Boone), batch/QC metadata (Durango standard), statistical params complete, kinetic params for modeling, single grain data available, open license (CC BY). Gaps: zeta not in table, no analyst ORCID, no analysis dates, no thermal model paths in dataset.	92	A	2025-11-18 00:40:02.994414	2025-11-18 00:40:02.994414
3	4	8	Basic sample metadata present: sample_id (CP06-XX, UGXX-X, EGC1), lat/lon (in paper Fig 1, not in data tables), elevation (~600-800m), mineral (zircon), lithology (Precambrian granitoid, Neoproterozoic tuff), stratigraphic_unit (Granite Gorge Metamorphic Suite, Walcott Member Tuff). MISSING: IGSN (not assigned), collector (in paper: Peak, B.A.), collection_date (approximate: 2006-era for CP06 samples, archival for UG/EGC samples). Gaps: 7/15 points lost for missing IGSN and metadata not in data tables.	\N	N/A - This dataset contains zircon (U-Th)/He data, not fission-track data.	\N	N/A - This dataset contains zircon (U-Th)/He data, not fission-track data.	9	All core age fields present: grain-level ZHe dates (corrected and uncorrected), 2σ analytical uncertainties, Ft (alpha-ejection correction factors), grain geometry (mass, radius), complete chemistry (U, Th, Sm, eU, He concentrations), analyst (Peak, B.A. in paper), lab (University of Colorado Boulder in paper), method (single-grain ZHe with LA-ICP-MS zonation profiling). Minor gap: analysis_date approximate (~2020, pre-publication), analyst/lab in paper text not in data tables.	10	Moderate findability with significant gaps. ✅ Sample IDs provided (CP06-65, UG90-2, etc.) - clear and unambiguous. ✅ DOI assigned to dataset (OSF: https://doi.org/10.17605/OSF.IO/D8B2Q). ✅ Paper DOI (10.1130/G49116.1). ⚠️ Locations available in paper Figure 1 but not in data tables - requires manual extraction. ❌ NO IGSN assigned - samples not globally findable/traceable (critical gap for FAIR compliance). ❌ Metadata scattered between paper and supplemental files. Lost 15/25 points for missing IGSN and metadata fragmentation.	22	Excellent accessibility with minor gaps. ✅ Data publicly available on OSF (Open Science Framework) - no registration/authentication required. ✅ Paper is Gold Open Access (CC-BY license) - freely accessible. ✅ Data in open formats (Excel/CSV) - machine-readable. ✅ All analytical data in supplemental tables (Table S1: ZHe dates, Table S2: LA-ICP-MS zonation profiles). ⚠️ Some metadata requires extraction from paper text (analyst, lab, lithology descriptions). ⚠️ No embargo period but data predates FAIR best practices. Lost 3/25 points for metadata fragmentation.	23	Excellent interoperability with minor provenance gaps. ✅ EarthBank HeDatapoint template format compatible (mapped to he_datapoints + he_whole_grain_data tables). ✅ Standard field names and controlled vocabularies (zircon, ZHe method, Precambrian granitoid). ✅ Consistent units throughout (ppm for concentrations, Ma for ages, µm for dimensions, nmol/g for He). ✅ Machine-readable metadata (OSF API accessible). ⚠️ Provenance fields (analyst, lab, analysis_date) in paper text, not in structured data tables. ⚠️ Kinetic parameters (zonation profiles) in separate table, requires linking by grain_id. Lost 2/25 points for metadata not in standardized schema format.	15	Good reusability for analytical data, but significant provenance gaps limit full reuse potential. ✅ Complete analytical data: all 50 grains have corrected ages, 2σ uncertainties, raw ages, Ft corrections, full chemistry (U, Th, Sm, eU, He), grain geometry (mass, radius). ✅ All uncertainties propagated (2σ analytical) - enables error analysis. ✅ FT (alpha-ejection) corrections reported - enables age recalculation verification. ✅ LA-ICP-MS zonation profiles available (Table S2) - enables advanced modeling. ✅ Complete methods in SupplementaryText.pdf. ✅ Open license (CC-BY). ❌ NO IGSN - samples not traceable to archives. ❌ NO batch/reference material QC data - no interlaboratory validation possible. ⚠️ Provenance (analyst, lab, date) in paper text, not in data tables. ⚠️ No thermal history model outputs in structured format (HeFTy paths in figures only). Lost 10/25 points for missing IGSN, no QC standards, and incomplete provenance tracking.	70	C	2025-11-18 00:40:54.0533	2025-11-18 00:40:54.0533
1	6	12	Good sample metadata with some gaps. ✅ Complete sample locations (lat/lon/elevation all provided). ✅ Rock types documented (igneous crystallization ages provided). ✅ Lithology (granitoid basement rocks). ✅ Mineral type (apatite). ✅ Sample IDs (33 samples from Yukon-Tanana Upland, Alaska). ❌ NO IGSN assigned to samples (major gap - samples not globally findable). ❌ Collector information not in tables. ❌ Collection date not provided. Lost 3/15 points for missing IGSN, collector, and collection dates.	10	Decent count data but incomplete provenance. ✅ Grain counts provided (2-40 per sample). ✅ Track counts documented (4-201 per sample). ✅ U ppm reported. ✅ Counting method (LA-ICP-MS). ✅ Dpar kinetic parameter included. ⚠️ Analyst/laboratory info in paper text but not tabulated in data tables. ⚠️ Analysis date not in tables. ❌ Missing Ns, Ni, Nd, ρs, ρi, ρd grain-by-grain count data (only summary statistics). Lost 5/15 points for missing grain-level count data and provenance not in tables.	7	Track length data present but limited detail. ✅ Mean track length (MTL) reported for all samples (13.34-14.84 µm range). ✅ Standard deviation provided. ✅ Dpar included (kinetic parameter). ⚠️ Number of confined tracks reported. ❌ Individual track measurements not provided (only summary statistics). ❌ Track type (TINT/TINCLE) not specified. ❌ c-axis angle data not included. Lost 3/10 points for missing individual track data and track classification.	8	Good age data with minor gaps. ✅ Pooled ages reported for all 33 samples (9.5-73.0 Ma range). ✅ Uncertainties provided (±1σ). ✅ Chi-squared (χ²) statistic included. ✅ P(χ²) values reported. ✅ Zeta calibration factor documented. ✅ Age equation specified (external detector method). ⚠️ Decay constants (λf, λD) not explicitly reported in tables (likely in methods text). ⚠️ Analyst/lab in paper, not in age table. Lost 2/10 points for decay constants and provenance not in data tables.	12	Poor findability due to missing critical identifiers. ✅ Sample IDs provided (33 unique sample codes). ✅ Complete geographic coordinates (lat/lon/elevation for all samples). ✅ Paper has DOI (cjes-2015-0138). ⚠️ Published in Canadian Journal of Earth Sciences (paywalled - not open access). ❌ NO IGSN assigned - samples not globally findable or traceable to physical archives. ❌ No data repository DOI (data embedded in paper tables only). ❌ Metadata scattered across paper text and tables (not centralized). Lost 13/25 points primarily for missing IGSN and no open data repository.	10	Very poor accessibility - pre-FAIR era publication. ❌ Paper is paywalled (Canadian Journal of Earth Sciences requires subscription). ❌ No open data repository (OSF, Zenodo, etc.). ❌ Data only in PDF tables (not machine-readable). ⚠️ Manual extraction required to get data into usable format. ⚠️ No supplemental files (all data in main paper tables). ✅ Once extracted, data can be converted to CSV/Excel. Lost 15/25 points for paywall and no open repository.	7	Poor interoperability due to non-standard format and fragmented metadata. ❌ Data in PDF tables only (not structured database format). ❌ Provenance fields (analyst, lab, analysis date) scattered in methods text, not in data tables. ❌ No standard vocabularies or controlled terms used. ⚠️ Units are consistent within paper (Ma, µm, ppm) but not explicitly labeled in all tables. ⚠️ Field names not aligned with Kohn et al. (2024) or EarthBank standards. ✅ Can be mapped to EarthBank templates with manual curation. Lost 18/25 points for non-standard format and metadata fragmentation.	8	Limited reusability due to missing provenance and QC data. ✅ Complete analytical data (ages, uncertainties, track lengths, U ppm, Dpar). ✅ Statistical parameters (χ², P(χ²), dispersion). ✅ Zeta calibration documented. ✅ Sample context (igneous crystallization ages, rock types). ❌ NO IGSN - samples not traceable to physical archives. ❌ NO batch/reference material QC data (no Durango or Fish Canyon standards reported). ❌ Analyst/laboratory/analysis date not in data tables. ❌ No open license specified (pre-CC-BY era). ⚠️ Decay constants λf/λD likely in methods text but not in tables. Lost 17/25 points for missing IGSN, no QC tracking, incomplete provenance, and restrictive copyright.	37	C	2025-11-18 00:34:51.660957	2025-11-18 00:42:50.601258
\.


--
-- Data for Name: ft_binned_length_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ft_binned_length_data (id, ft_datapoint_id, mount_id, etch_duration_seconds, bin_0_1_um, bin_1_2_um, bin_2_3_um, bin_3_4_um, bin_4_5_um, bin_5_6_um, bin_6_7_um, bin_7_8_um, bin_8_9_um, bin_9_10_um, bin_10_11_um, bin_11_12_um, bin_12_13_um, bin_13_14_um, bin_14_15_um, bin_15_16_um, bin_16_17_um, bin_17_18_um, bin_18_19_um, bin_19_20_um, dpar_um, dpar_error_um, n_dpar_measurements, dper_um, dper_error_um, n_dper_measurements, dpar_dper_error_type, comments, created_at) FROM stdin;
\.


--
-- Data for Name: ft_count_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ft_count_data (id, ft_datapoint_id, grain_id, counting_area_cm2, ns, rho_s_cm2, ni, rho_i_cm2, nd, rho_d_cm2, dpar_um, dpar_error_um, n_dpar_measurements, dper_um, dper_error_um, n_dper_measurements, dpar_dper_error_type, comments, created_at) FROM stdin;
\.


--
-- Data for Name: ft_datapoints; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ft_datapoints (id, sample_id, datapoint_key, batch_id, laboratory, analyst_orcid, analysis_date, publication_doi, mineral_type, ft_method, ft_software, ft_algorithm, u_determination_method, n_grains, total_area_cm2, mean_rho_s, total_ns, mean_rho_i, total_ni, mean_rho_d, total_nd, dosimeter, mean_u_ppm, sd_u_ppm, mean_dpar_um, se_dpar_um, n_dpar_measurements, mean_dper_um, se_dper_um, n_dper_measurements, mean_rmr0, sd_rmr0, mean_kappa, sd_kappa, rmr0_equation, chi_square, p_chi2_pct, dispersion_pct, age_equation, mean_age_ma, mean_age_error_ma, central_age_ma, central_age_error_ma, pooled_age_ma, pooled_age_error_ma, population_age_ma, population_age_error_ma, age_error_type, age_comment, mean_track_length_um, se_mean_track_length_um, n_track_measurements, sd_track_length_um, cf252_irradiation, etchant_chemical, etch_duration_seconds, etch_temperature_c, zeta_yr_cm2, zeta_error_yr_cm2, zeta_error_type, r_um, lambda_d, lambda_f, q_factor, irradiation_reactor, thermal_neutron_dose, irradiation_batch_id, created_at) FROM stdin;
2	MU19-06	MU19-06_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	32	\N	3.99	583	\N	\N	\N	\N	\N	7.930	9.700	1.410	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.310	16.4200	\N	\N	\N	110.50	6.20	106.50	7.60	\N	\N	\N	\N	122.000	\N	\N	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:56.356108
3	MU19-08	MU19-08_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	35	\N	11.50	1304	\N	\N	\N	\N	\N	8.880	9.100	1.630	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.080	15.3700	\N	\N	\N	289.60	11.70	281.00	11.80	\N	\N	\N	\N	125.000	\N	\N	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:56.580584
4	MU19-09	MU19-09_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	33	\N	3.68	580	\N	\N	\N	\N	\N	4.250	2.400	1.520	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	33.6200	\N	\N	\N	203.50	15.00	189.00	19.20	\N	\N	\N	\N	10.790	\N	109	1.820	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:56.806087
5	MU19-11	MU19-11_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	30	\N	4.87	361	\N	\N	\N	\N	\N	7.170	9.700	1.370	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	93.340	0.0000	\N	\N	\N	148.30	7.90	144.40	7.20	\N	\N	\N	\N	11.200	\N	108	1.890	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:57.02685
6	MU19-12	MU19-12_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	33	\N	0.98	155	\N	\N	\N	\N	\N	1.260	1.200	2.270	0.300	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.150	44.5900	\N	\N	\N	182.10	21.60	155.10	25.70	\N	\N	\N	\N	11.150	\N	104	1.970	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:57.249766
7	MU19-13	MU19-13_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	32	\N	43.97	2894	\N	\N	\N	\N	\N	44.290	8.200	1.860	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.780	4.7200	\N	\N	\N	216.60	4.60	215.10	4.60	\N	\N	\N	\N	10.960	\N	102	2.020	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:57.474295
8	MU19-14	MU19-14_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	32	\N	14.73	834	\N	\N	\N	\N	\N	13.890	11.100	1.400	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	24.0900	\N	\N	\N	244.50	14.50	230.60	16.30	\N	\N	\N	\N	10.600	\N	106	1.690	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:57.694593
9	MU19-15	MU19-15_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	27	\N	4.30	260	\N	\N	\N	\N	\N	3.610	3.700	1.370	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.070	34.4000	\N	\N	\N	290.60	28.10	258.30	32.50	\N	\N	\N	\N	11.250	\N	117	1.370	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:57.921457
10	MU19-16	MU19-16_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	31	\N	4.98	307	\N	\N	\N	\N	\N	4.870	4.500	1.310	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.520	27.6700	\N	\N	\N	246.80	19.60	222.70	23.20	\N	\N	\N	\N	10.920	\N	112	1.680	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:58.143276
11	MU19-17	MU19-17_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	33	\N	5.34	715	\N	\N	\N	\N	\N	4.270	3.800	1.390	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.030	22.8400	\N	\N	\N	282.10	16.40	273.20	18.30	\N	\N	\N	\N	10.870	\N	103	1.710	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:58.369283
12	MU19-18	MU19-18_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	28	\N	5.10	473	\N	\N	\N	\N	\N	3.440	4.100	1.310	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	75.190	0.0000	\N	\N	\N	324.80	15.40	317.30	16.20	\N	\N	\N	\N	11.280	\N	101	1.230	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:58.591139
13	MU19-20	MU19-20_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	33	\N	5.11	788	\N	\N	\N	\N	\N	4.090	4.700	1.650	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	41.4000	\N	\N	\N	283.10	24.30	269.70	22.00	\N	\N	\N	\N	11.040	\N	104	1.320	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:58.815337
14	MU19-22	MU19-22_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	15	\N	6.08	179	\N	\N	\N	\N	\N	7.300	8.300	1.440	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	70.3700	\N	\N	\N	138.30	29.90	169.70	45.90	\N	\N	\N	\N	11.600	\N	98	1.530	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:59.04045
15	MU19-23	MU19-23_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	33	\N	14.42	1343	\N	\N	\N	\N	\N	19.050	7.400	1.260	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.090	15.3500	\N	\N	\N	166.00	6.80	165.40	6.80	\N	\N	\N	\N	102.000	\N	\N	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:59.266869
16	MU19-24	MU19-24_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	33	\N	2.07	327	\N	\N	\N	\N	\N	5.390	1.900	1.510	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.970	17.0600	\N	\N	\N	85.70	5.60	82.80	5.60	\N	\N	\N	\N	12.440	\N	112	1.910	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:59.491097
17	MU19-25	MU19-25_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	33	\N	4.17	695	\N	\N	\N	\N	\N	6.670	2.600	1.320	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.860	9.7200	\N	\N	\N	138.80	5.90	135.40	6.40	\N	\N	\N	\N	11.970	\N	114	1.910	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:59.713932
18	MU19-26	MU19-26_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	32	\N	27.95	2450	\N	\N	\N	\N	\N	26.390	22.400	1.340	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	15.7700	\N	\N	\N	237.90	8.80	230.20	9.70	\N	\N	\N	\N	11.550	\N	109	2.070	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:59.937143
19	MU19-28	MU19-28_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	24	\N	8.52	383	\N	\N	\N	\N	\N	12.560	4.500	1.500	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.390	15.2000	\N	\N	\N	148.10	9.10	143.90	8.80	\N	\N	\N	\N	11.720	\N	102	2.020	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:00.16117
20	MU19-29	MU19-29_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	20	\N	10.06	186	\N	\N	\N	\N	\N	10.870	3.600	1.340	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	74.370	0.0000	\N	\N	\N	99.70	7.40	95.40	6.30	\N	\N	\N	\N	10.480	\N	100	2.140	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:00.383322
21	MU19-30	MU19-30_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	30	\N	4.23	303	\N	\N	\N	\N	\N	13.330	6.200	1.240	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	91.160	0.0000	\N	\N	\N	71.10	4.10	68.80	3.50	\N	\N	\N	\N	12.050	\N	99	2.140	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:00.607274
22	MU19-33	MU19-33_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	32	\N	11.31	775	\N	\N	\N	\N	\N	14.160	12.600	1.230	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.100	20.6500	\N	\N	\N	179.40	9.60	173.70	10.80	\N	\N	\N	\N	11.190	\N	121	1.920	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:00.833273
23	MU19-34	MU19-34_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	26	\N	11.84	1001	\N	\N	\N	\N	\N	10.100	6.500	1.460	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	20.5500	\N	\N	\N	258.00	14.20	257.00	15.00	\N	\N	\N	\N	11.250	\N	107	1.840	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:01.056112
24	MU19-36	MU19-36_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	32	\N	11.32	1029	\N	\N	\N	\N	\N	12.240	8.600	1.380	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	25.0100	\N	\N	\N	201.00	11.40	199.40	11.70	\N	\N	\N	\N	11.440	\N	103	1.800	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:01.279848
25	MU19-37	MU19-37_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	31	\N	18.73	1929	\N	\N	\N	\N	\N	16.190	8.900	1.670	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	25.4700	\N	\N	\N	264.20	13.90	249.90	14.80	\N	\N	\N	\N	11.470	\N	104	1.950	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:01.506047
26	MU19-39	MU19-39_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	32	\N	8.86	1215	\N	\N	\N	\N	\N	16.760	7.900	1.660	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	28.1600	\N	\N	\N	118.20	6.90	115.90	8.20	\N	\N	\N	\N	11.990	\N	109	1.920	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:01.727609
27	MU19-47	MU19-47_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	33	\N	4.59	418	\N	\N	\N	\N	\N	5.850	3.900	2.090	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.630	8.3700	\N	\N	\N	175.60	9.20	166.10	9.80	\N	\N	\N	\N	12.090	\N	118	2.110	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:01.95201
28	MU19-48	MU19-48_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	13	\N	19.44	629	\N	\N	\N	\N	\N	14.600	7.400	1.550	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.590	16.6300	\N	\N	\N	294.60	19.20	289.20	20.10	\N	\N	\N	\N	25.000	\N	\N	0.400	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:02.176129
29	MU19-49	MU19-49_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	24	\N	17.98	239	\N	\N	\N	\N	\N	7.420	4.700	1.570	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	47.4000	\N	\N	\N	91.40	11.80	90.50	12.00	\N	\N	\N	\N	11.260	\N	108	1.650	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:02.399434
30	MU19-50	MU19-50_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	33	\N	1.13	250	\N	\N	\N	\N	\N	13.320	5.700	1.380	0.100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	59.640	0.0000	\N	\N	\N	18.90	1.20	17.70	1.10	\N	\N	\N	\N	12.350	\N	112	1.650	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:02.623943
31	MU19-51	MU19-51_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	33	\N	1.61	349	\N	\N	\N	\N	\N	16.100	22.400	1.280	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.510	27.4300	\N	\N	\N	24.00	1.90	22.20	1.80	\N	\N	\N	\N	12.220	\N	102	2.060	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:02.849986
32	MU19-52	MU19-52_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	21	\N	11.61	332	\N	\N	\N	\N	\N	14.680	17.200	1.810	0.400	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	46.3600	\N	\N	\N	103.80	13.60	116.40	15.50	\N	\N	\N	\N	10.990	\N	111	1.770	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:03.075329
33	MU19-53	MU19-53_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	24	\N	9.10	277	\N	\N	\N	\N	\N	9.850	13.300	1.550	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.000	63.2300	\N	\N	\N	253.30	39.30	180.60	42.60	\N	\N	\N	\N	11.230	\N	78	1.970	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:03.298402
34	MU19-54	MU19-54_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	36	\N	19.72	93	\N	\N	\N	\N	\N	4.940	2.400	1.340	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	30.590	0.0000	\N	\N	\N	60.80	6.20	43.50	6.50	\N	\N	\N	\N	11.510	\N	47	2.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:03.521521
1	MU19-05	MU19-05_DP001	\N	University of Melbourne	\N	\N	\N	apatite	LA-ICP-MS	\N	\N	\N	22	\N	18.90	149	\N	\N	\N	\N	\N	3.320	6.200	1.600	0.400	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.030	61.3600	\N	\N	\N	245.30	49.20	168.90	57.50	\N	\N	\N	\N	108.000	\N	\N	0.200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:45:56.115979
\.


--
-- Data for Name: ft_single_grain_ages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ft_single_grain_ages (id, ft_datapoint_id, grain_id, mount_id, etch_duration_seconds, u_ppm, u_ppm_error, u_ca_ratio, u_ca_ratio_error, u_ca_error_type, rmr0, kappa, grain_age_ma, grain_age_error_ma, grain_age_error_type, comments, created_at) FROM stdin;
\.


--
-- Data for Name: ft_track_length_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ft_track_length_data (id, ft_datapoint_id, grain_id, track_id, track_type, mount_id, etch_duration_seconds, apparent_length_um, corrected_z_depth_um, true_length_um, azimuth_deg, dip_deg, angle_to_c_axis_deg, c_axis_corrected_length_um, dpar_um, dpar_error_um, n_dpar_measurements, dper_um, dper_error_um, n_dper_measurements, dpar_dper_error_type, rmr0, kappa, comments, created_at) FROM stdin;
2	4	GRAIN_1	TRK_1	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:36.460334
3	4	GRAIN_2	TRK_2	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:36.691272
4	4	GRAIN_3	TRK_3	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:36.91424
5	4	GRAIN_4	TRK_4	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:37.138156
6	4	GRAIN_5	TRK_5	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:37.360132
7	4	GRAIN_6	TRK_6	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:37.583343
8	4	GRAIN_7	TRK_7	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:37.804251
9	4	GRAIN_8	TRK_8	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:38.028972
10	4	GRAIN_9	TRK_9	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:38.251146
11	4	GRAIN_10	TRK_10	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:38.480833
12	4	GRAIN_11	TRK_11	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:38.705847
13	4	GRAIN_12	TRK_12	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:38.929934
14	4	GRAIN_13	TRK_13	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:39.150675
15	4	GRAIN_14	TRK_14	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:39.373048
16	4	GRAIN_15	TRK_15	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:39.5958
17	4	GRAIN_16	TRK_16	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:39.818889
18	4	GRAIN_17	TRK_17	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:40.0436
19	4	GRAIN_18	TRK_18	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:40.267077
20	4	GRAIN_19	TRK_19	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:40.488413
21	4	GRAIN_20	TRK_20	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:40.713043
22	4	GRAIN_21	TRK_21	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:40.937921
23	4	GRAIN_22	TRK_22	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:41.163631
24	4	GRAIN_23	TRK_23	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:41.387644
25	4	GRAIN_24	TRK_24	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:41.61004
26	4	GRAIN_25	TRK_25	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:41.837113
27	4	GRAIN_26	TRK_26	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:42.061178
28	4	GRAIN_27	TRK_27	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:42.285744
29	4	GRAIN_28	TRK_28	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:42.507813
30	4	GRAIN_29	TRK_29	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:42.730231
31	4	GRAIN_30	TRK_30	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:42.952194
32	4	GRAIN_31	TRK_31	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:43.187635
33	4	GRAIN_32	TRK_32	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:43.418957
34	4	GRAIN_33	TRK_33	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:43.642873
35	4	GRAIN_34	TRK_34	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:43.864269
36	4	GRAIN_35	TRK_35	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:44.083835
37	5	GRAIN_36	TRK_36	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:44.302843
38	5	GRAIN_37	TRK_37	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:44.524725
39	5	GRAIN_38	TRK_38	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:44.752539
40	5	GRAIN_39	TRK_39	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:44.974117
41	5	GRAIN_40	TRK_40	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:45.196694
42	5	GRAIN_41	TRK_41	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:45.419256
43	5	GRAIN_42	TRK_42	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:45.643304
44	5	GRAIN_43	TRK_43	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:45.863356
45	5	GRAIN_44	TRK_44	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:46.089802
46	5	GRAIN_45	TRK_45	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:46.315425
47	5	GRAIN_46	TRK_46	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:46.537974
48	5	GRAIN_47	TRK_47	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:46.760401
49	5	GRAIN_48	TRK_48	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:46.987268
50	5	GRAIN_49	TRK_49	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:47.212013
51	5	GRAIN_50	TRK_50	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:47.434681
52	5	GRAIN_51	TRK_51	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:47.658696
53	5	GRAIN_52	TRK_52	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:47.881586
54	5	GRAIN_53	TRK_53	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:48.104274
55	5	GRAIN_54	TRK_54	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:48.327476
56	5	GRAIN_55	TRK_55	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:48.547062
57	5	GRAIN_56	TRK_56	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:48.770008
58	5	GRAIN_57	TRK_57	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:48.99372
59	5	GRAIN_58	TRK_58	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:49.217943
60	5	GRAIN_59	TRK_59	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:49.44227
61	5	GRAIN_60	TRK_60	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:49.664961
62	5	GRAIN_61	TRK_61	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:49.891035
63	5	GRAIN_62	TRK_62	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:50.113893
64	5	GRAIN_63	TRK_63	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:50.33885
65	5	GRAIN_64	TRK_64	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:50.561673
66	5	GRAIN_65	TRK_65	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:50.78492
67	5	GRAIN_66	TRK_66	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:51.008949
68	5	GRAIN_67	TRK_67	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:51.243746
69	5	GRAIN_68	TRK_68	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:51.468833
70	5	GRAIN_69	TRK_69	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:51.694084
71	5	GRAIN_70	TRK_70	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:51.919711
72	6	GRAIN_71	TRK_71	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:52.143613
73	6	GRAIN_72	TRK_72	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:52.368315
74	6	GRAIN_73	TRK_73	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:52.591619
75	6	GRAIN_74	TRK_74	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:52.816301
76	6	GRAIN_75	TRK_75	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:53.042162
77	6	GRAIN_76	TRK_76	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:53.268186
78	6	GRAIN_77	TRK_77	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:53.491529
79	6	GRAIN_78	TRK_78	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:53.715169
80	6	GRAIN_79	TRK_79	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:53.949514
81	6	GRAIN_80	TRK_80	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:54.174607
82	6	GRAIN_81	TRK_81	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:54.399449
83	6	GRAIN_82	TRK_82	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:54.623258
84	6	GRAIN_83	TRK_83	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:54.848476
85	6	GRAIN_84	TRK_84	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:55.073402
86	6	GRAIN_85	TRK_85	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:55.297487
87	6	GRAIN_86	TRK_86	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:55.520831
88	6	GRAIN_87	TRK_87	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:55.74665
89	6	GRAIN_88	TRK_88	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:55.971157
90	6	GRAIN_89	TRK_89	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:56.192707
91	6	GRAIN_90	TRK_90	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:56.416584
92	6	GRAIN_91	TRK_91	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:56.640919
93	6	GRAIN_92	TRK_92	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:56.861378
94	6	GRAIN_93	TRK_93	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:57.084734
95	6	GRAIN_94	TRK_94	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:57.307039
96	6	GRAIN_95	TRK_95	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:57.526302
97	6	GRAIN_96	TRK_96	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:57.748927
98	6	GRAIN_97	TRK_97	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:57.975061
99	6	GRAIN_98	TRK_98	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:58.200001
100	6	GRAIN_99	TRK_99	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:58.421259
101	6	GRAIN_100	TRK_100	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:58.643745
102	6	GRAIN_101	TRK_101	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:58.868912
103	6	GRAIN_102	TRK_102	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:59.093759
104	6	GRAIN_103	TRK_103	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:59.312654
105	6	GRAIN_104	TRK_104	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:59.537782
106	6	GRAIN_105	TRK_105	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:59.763118
107	7	GRAIN_106	TRK_106	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:46:59.987765
108	7	GRAIN_107	TRK_107	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:00.210872
109	7	GRAIN_108	TRK_108	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:00.433282
110	7	GRAIN_109	TRK_109	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:00.65779
111	7	GRAIN_110	TRK_110	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:00.880795
112	7	GRAIN_111	TRK_111	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:01.102912
113	7	GRAIN_112	TRK_112	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:01.326604
114	7	GRAIN_113	TRK_113	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:01.551213
115	7	GRAIN_114	TRK_114	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:01.770803
116	7	GRAIN_115	TRK_115	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:01.995412
117	7	GRAIN_116	TRK_116	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:02.218629
118	7	GRAIN_117	TRK_117	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:02.441627
119	7	GRAIN_118	TRK_118	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:02.660475
120	7	GRAIN_119	TRK_119	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:02.882127
121	7	GRAIN_120	TRK_120	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:03.106916
122	7	GRAIN_121	TRK_121	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:03.331206
123	7	GRAIN_122	TRK_122	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:03.556159
124	7	GRAIN_123	TRK_123	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:03.78216
125	7	GRAIN_124	TRK_124	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:04.002945
126	7	GRAIN_125	TRK_125	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:04.228135
127	7	GRAIN_126	TRK_126	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:04.452246
128	7	GRAIN_127	TRK_127	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:04.676953
129	7	GRAIN_128	TRK_128	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:04.900905
130	7	GRAIN_129	TRK_129	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:05.124255
131	7	GRAIN_130	TRK_130	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:05.346617
132	7	GRAIN_131	TRK_131	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:05.571
133	7	GRAIN_132	TRK_132	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:05.795392
134	7	GRAIN_133	TRK_133	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:06.020192
135	7	GRAIN_134	TRK_134	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:06.245652
136	7	GRAIN_135	TRK_135	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:06.470826
137	7	GRAIN_136	TRK_136	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:06.696301
138	7	GRAIN_137	TRK_137	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:06.919996
139	7	GRAIN_138	TRK_138	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:07.144973
140	7	GRAIN_139	TRK_139	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:07.365242
141	7	GRAIN_140	TRK_140	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:07.590074
142	7	GRAIN_141	TRK_141	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:07.815033
143	8	GRAIN_142	TRK_142	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:08.040031
144	8	GRAIN_143	TRK_143	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:08.264518
145	8	GRAIN_144	TRK_144	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:08.487406
146	8	GRAIN_145	TRK_145	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:08.712933
147	8	GRAIN_146	TRK_146	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:08.940419
148	8	GRAIN_147	TRK_147	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:09.162168
149	8	GRAIN_148	TRK_148	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:09.38372
150	8	GRAIN_149	TRK_149	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:09.604574
151	8	GRAIN_150	TRK_150	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:09.826094
152	8	GRAIN_151	TRK_151	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:10.054149
153	8	GRAIN_152	TRK_152	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:10.278264
154	8	GRAIN_153	TRK_153	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:10.50449
155	8	GRAIN_154	TRK_154	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:10.72901
156	8	GRAIN_155	TRK_155	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:10.953741
157	8	GRAIN_156	TRK_156	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:11.178593
158	8	GRAIN_157	TRK_157	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:11.403735
159	8	GRAIN_158	TRK_158	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:11.627026
160	8	GRAIN_159	TRK_159	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:11.850211
161	8	GRAIN_160	TRK_160	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:12.073804
162	8	GRAIN_161	TRK_161	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:12.297155
163	8	GRAIN_162	TRK_162	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:12.520515
164	8	GRAIN_163	TRK_163	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:12.742623
165	8	GRAIN_164	TRK_164	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:12.965188
166	8	GRAIN_165	TRK_165	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:13.187557
167	8	GRAIN_166	TRK_166	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:13.411383
168	8	GRAIN_167	TRK_167	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:13.635892
169	8	GRAIN_168	TRK_168	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:13.860794
170	8	GRAIN_169	TRK_169	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:14.085203
171	8	GRAIN_170	TRK_170	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:14.309702
172	8	GRAIN_171	TRK_171	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:14.532301
173	8	GRAIN_172	TRK_172	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:14.757347
174	8	GRAIN_173	TRK_173	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:14.981532
175	8	GRAIN_174	TRK_174	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:15.203369
176	8	GRAIN_175	TRK_175	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:15.425293
177	8	GRAIN_176	TRK_176	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:15.65134
178	9	GRAIN_177	TRK_177	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:15.87614
179	9	GRAIN_178	TRK_178	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:16.100303
180	9	GRAIN_179	TRK_179	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:16.324928
181	9	GRAIN_180	TRK_180	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:16.548107
182	9	GRAIN_181	TRK_181	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:16.77201
183	9	GRAIN_182	TRK_182	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:16.99533
184	9	GRAIN_183	TRK_183	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:17.220111
185	9	GRAIN_184	TRK_184	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:17.442297
186	9	GRAIN_185	TRK_185	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:17.662247
187	9	GRAIN_186	TRK_186	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:17.886222
188	9	GRAIN_187	TRK_187	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:18.106928
189	9	GRAIN_188	TRK_188	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:18.331843
190	9	GRAIN_189	TRK_189	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:18.5555
191	9	GRAIN_190	TRK_190	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:18.7809
192	9	GRAIN_191	TRK_191	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:19.005055
193	9	GRAIN_192	TRK_192	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:19.226902
194	9	GRAIN_193	TRK_193	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:19.445876
195	9	GRAIN_194	TRK_194	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:19.668175
196	9	GRAIN_195	TRK_195	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:19.893175
197	9	GRAIN_196	TRK_196	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:20.117128
198	9	GRAIN_197	TRK_197	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:20.342206
199	9	GRAIN_198	TRK_198	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:20.566427
200	9	GRAIN_199	TRK_199	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:20.790145
201	9	GRAIN_200	TRK_200	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:21.013837
202	9	GRAIN_201	TRK_201	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:21.238519
203	9	GRAIN_202	TRK_202	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:21.463146
204	9	GRAIN_203	TRK_203	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:21.681925
205	9	GRAIN_204	TRK_204	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:21.9049
206	9	GRAIN_205	TRK_205	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:22.133107
207	9	GRAIN_206	TRK_206	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:22.355427
208	9	GRAIN_207	TRK_207	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:22.579288
209	9	GRAIN_208	TRK_208	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:22.802651
210	10	GRAIN_209	TRK_209	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:23.027178
211	10	GRAIN_210	TRK_210	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:23.247599
212	10	GRAIN_211	TRK_211	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:23.47198
213	10	GRAIN_212	TRK_212	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:23.69219
214	10	GRAIN_213	TRK_213	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:23.916277
215	10	GRAIN_214	TRK_214	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:24.14282
216	10	GRAIN_215	TRK_215	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:24.370373
217	10	GRAIN_216	TRK_216	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:24.595991
218	10	GRAIN_217	TRK_217	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:24.81975
219	10	GRAIN_218	TRK_218	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:25.045225
220	10	GRAIN_219	TRK_219	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:25.267407
221	10	GRAIN_220	TRK_220	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:25.492087
222	10	GRAIN_221	TRK_221	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:25.716083
223	10	GRAIN_222	TRK_222	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:25.940671
224	10	GRAIN_223	TRK_223	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:26.16531
225	10	GRAIN_224	TRK_224	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:26.388709
226	10	GRAIN_225	TRK_225	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:26.614072
227	10	GRAIN_226	TRK_226	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:26.836593
228	10	GRAIN_227	TRK_227	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:27.058784
229	10	GRAIN_228	TRK_228	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:27.284172
230	10	GRAIN_229	TRK_229	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:27.506873
231	10	GRAIN_230	TRK_230	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:27.730989
232	10	GRAIN_231	TRK_231	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:27.954356
233	10	GRAIN_232	TRK_232	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:28.176861
234	10	GRAIN_233	TRK_233	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:28.400395
235	10	GRAIN_234	TRK_234	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:28.623752
236	10	GRAIN_235	TRK_235	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:28.847689
237	10	GRAIN_236	TRK_236	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:29.069934
238	10	GRAIN_237	TRK_237	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:29.29524
239	10	GRAIN_238	TRK_238	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:29.519627
240	10	GRAIN_239	TRK_239	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:29.741713
241	10	GRAIN_240	TRK_240	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:29.965644
242	10	GRAIN_241	TRK_241	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:30.188372
243	10	GRAIN_242	TRK_242	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:30.408458
244	10	GRAIN_243	TRK_243	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:30.629176
245	11	GRAIN_244	TRK_244	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:30.852731
246	11	GRAIN_245	TRK_245	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:31.076588
247	11	GRAIN_246	TRK_246	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:33.030239
248	11	GRAIN_247	TRK_247	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:33.2538
249	11	GRAIN_248	TRK_248	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:33.473461
250	11	GRAIN_249	TRK_249	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:33.697229
251	11	GRAIN_250	TRK_250	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:33.92255
252	11	GRAIN_251	TRK_251	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:34.146534
253	11	GRAIN_252	TRK_252	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:34.371236
254	11	GRAIN_253	TRK_253	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:34.594798
255	11	GRAIN_254	TRK_254	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:34.819311
256	11	GRAIN_255	TRK_255	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:35.042714
257	11	GRAIN_256	TRK_256	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:35.269298
258	11	GRAIN_257	TRK_257	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:35.494634
259	11	GRAIN_258	TRK_258	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:35.715322
260	11	GRAIN_259	TRK_259	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:35.939388
261	11	GRAIN_260	TRK_260	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:36.160335
262	11	GRAIN_261	TRK_261	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:36.385815
263	11	GRAIN_262	TRK_262	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:36.608712
264	11	GRAIN_263	TRK_263	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:36.838384
265	11	GRAIN_264	TRK_264	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:37.061411
266	11	GRAIN_265	TRK_265	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:37.285928
267	11	GRAIN_266	TRK_266	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:37.506058
268	11	GRAIN_267	TRK_267	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:37.726939
269	11	GRAIN_268	TRK_268	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:37.952254
270	11	GRAIN_269	TRK_269	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:38.174168
271	11	GRAIN_270	TRK_270	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:38.398564
272	11	GRAIN_271	TRK_271	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:38.624116
273	11	GRAIN_272	TRK_272	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:38.848885
274	11	GRAIN_273	TRK_273	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:39.072311
275	11	GRAIN_274	TRK_274	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:39.296266
276	11	GRAIN_275	TRK_275	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:39.519825
277	11	GRAIN_276	TRK_276	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:39.745119
278	11	GRAIN_277	TRK_277	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:39.968935
279	11	GRAIN_278	TRK_278	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:40.19314
280	12	GRAIN_279	TRK_279	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:40.417608
281	12	GRAIN_280	TRK_280	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:40.639062
282	12	GRAIN_281	TRK_281	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:40.860944
283	12	GRAIN_282	TRK_282	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:41.084088
284	12	GRAIN_283	TRK_283	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:41.307712
285	12	GRAIN_284	TRK_284	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:41.531418
286	12	GRAIN_285	TRK_285	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:41.753886
287	12	GRAIN_286	TRK_286	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:41.973315
288	12	GRAIN_287	TRK_287	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:42.197284
289	12	GRAIN_288	TRK_288	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:42.421343
290	12	GRAIN_289	TRK_289	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:42.643889
291	12	GRAIN_290	TRK_290	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:42.863927
292	12	GRAIN_291	TRK_291	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:43.088002
293	12	GRAIN_292	TRK_292	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:43.361572
294	12	GRAIN_293	TRK_293	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:43.802526
295	12	GRAIN_294	TRK_294	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:44.02738
296	12	GRAIN_295	TRK_295	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:44.249371
297	12	GRAIN_296	TRK_296	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:44.473362
298	12	GRAIN_297	TRK_297	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:44.693701
299	12	GRAIN_298	TRK_298	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:44.917427
300	12	GRAIN_299	TRK_299	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:45.142133
301	12	GRAIN_300	TRK_300	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:45.366234
302	12	GRAIN_301	TRK_301	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:45.590131
303	12	GRAIN_302	TRK_302	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:45.815063
304	12	GRAIN_303	TRK_303	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:46.040864
305	12	GRAIN_304	TRK_304	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:46.264075
306	12	GRAIN_305	TRK_305	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:46.48807
307	12	GRAIN_306	TRK_306	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:46.712095
308	12	GRAIN_307	TRK_307	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:46.933964
309	12	GRAIN_308	TRK_308	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:47.158881
310	12	GRAIN_309	TRK_309	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:47.380648
311	12	GRAIN_310	TRK_310	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:47.602932
312	12	GRAIN_311	TRK_311	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:47.824961
313	12	GRAIN_312	TRK_312	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:48.050458
314	12	GRAIN_313	TRK_313	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:48.274491
315	13	GRAIN_314	TRK_314	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:48.497273
316	13	GRAIN_315	TRK_315	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:48.719687
317	13	GRAIN_316	TRK_316	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:48.943775
318	13	GRAIN_317	TRK_317	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:49.166714
319	13	GRAIN_318	TRK_318	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:49.391707
320	13	GRAIN_319	TRK_319	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:49.616198
321	13	GRAIN_320	TRK_320	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:49.839821
322	13	GRAIN_321	TRK_321	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:50.064369
323	13	GRAIN_322	TRK_322	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:50.288312
324	13	GRAIN_323	TRK_323	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:50.511941
325	13	GRAIN_324	TRK_324	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:50.733981
326	13	GRAIN_325	TRK_325	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:50.959267
327	13	GRAIN_326	TRK_326	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:51.182543
328	13	GRAIN_327	TRK_327	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:51.402109
329	13	GRAIN_328	TRK_328	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:51.625462
330	13	GRAIN_329	TRK_329	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:51.849461
331	13	GRAIN_330	TRK_330	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:52.074549
332	13	GRAIN_331	TRK_331	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:52.299319
333	13	GRAIN_332	TRK_332	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:52.523246
334	13	GRAIN_333	TRK_333	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:52.747949
335	13	GRAIN_334	TRK_334	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:52.971189
336	13	GRAIN_335	TRK_335	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:53.196046
337	13	GRAIN_336	TRK_336	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:53.42141
338	13	GRAIN_337	TRK_337	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:53.682127
339	13	GRAIN_338	TRK_338	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:54.019139
340	13	GRAIN_339	TRK_339	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:54.351247
341	13	GRAIN_340	TRK_340	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:54.706812
342	13	GRAIN_341	TRK_341	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:55.036628
343	13	GRAIN_342	TRK_342	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:55.370607
344	13	GRAIN_343	TRK_343	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:55.706956
345	13	GRAIN_344	TRK_344	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:56.03565
346	13	GRAIN_345	TRK_345	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:56.290518
347	13	GRAIN_346	TRK_346	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:56.621681
348	13	GRAIN_347	TRK_347	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:57.018878
349	13	GRAIN_348	TRK_348	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:57.360474
350	14	GRAIN_349	TRK_349	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:57.709815
351	14	GRAIN_350	TRK_350	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:58.072564
352	14	GRAIN_351	TRK_351	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:58.41979
353	14	GRAIN_352	TRK_352	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:58.774917
354	14	GRAIN_353	TRK_353	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:59.096144
355	14	GRAIN_354	TRK_354	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:59.452407
356	14	GRAIN_355	TRK_355	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:59.677826
357	14	GRAIN_356	TRK_356	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:47:59.901267
358	14	GRAIN_357	TRK_357	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:00.126559
359	14	GRAIN_358	TRK_358	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:00.351112
360	14	GRAIN_359	TRK_359	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:00.576462
361	14	GRAIN_360	TRK_360	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:00.799816
362	14	GRAIN_361	TRK_361	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:01.031861
363	14	GRAIN_362	TRK_362	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:01.256253
364	14	GRAIN_363	TRK_363	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:01.47919
365	14	GRAIN_364	TRK_364	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:01.702033
366	14	GRAIN_365	TRK_365	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:01.926448
367	14	GRAIN_366	TRK_366	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:02.150268
368	14	GRAIN_367	TRK_367	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:02.382036
369	14	GRAIN_368	TRK_368	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:02.602725
370	14	GRAIN_369	TRK_369	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:02.829617
371	14	GRAIN_370	TRK_370	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:03.065495
372	14	GRAIN_371	TRK_371	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:03.289726
373	14	GRAIN_372	TRK_372	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:03.514137
374	14	GRAIN_373	TRK_373	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:03.738843
375	14	GRAIN_374	TRK_374	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:03.959604
376	14	GRAIN_375	TRK_375	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:04.1819
377	16	GRAIN_376	TRK_376	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:04.406217
378	16	GRAIN_377	TRK_377	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:04.631112
379	16	GRAIN_378	TRK_378	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:04.855632
380	16	GRAIN_379	TRK_379	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:05.077614
381	16	GRAIN_380	TRK_380	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:05.304925
382	16	GRAIN_381	TRK_381	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:05.529578
383	16	GRAIN_382	TRK_382	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:05.753565
384	16	GRAIN_383	TRK_383	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:05.974724
385	16	GRAIN_384	TRK_384	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:06.19962
386	16	GRAIN_385	TRK_385	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:06.424968
387	16	GRAIN_386	TRK_386	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:06.645729
388	16	GRAIN_387	TRK_387	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:06.867684
389	16	GRAIN_388	TRK_388	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:07.091907
390	16	GRAIN_389	TRK_389	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:07.313904
391	16	GRAIN_390	TRK_390	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:07.538521
392	16	GRAIN_391	TRK_391	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:07.765886
393	16	GRAIN_392	TRK_392	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:07.993321
394	16	GRAIN_393	TRK_393	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:08.217827
395	16	GRAIN_394	TRK_394	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:08.441679
396	16	GRAIN_395	TRK_395	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:08.668317
397	16	GRAIN_396	TRK_396	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:08.893719
398	16	GRAIN_397	TRK_397	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:09.125247
399	16	GRAIN_398	TRK_398	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:09.345006
400	16	GRAIN_399	TRK_399	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:09.567779
401	16	GRAIN_400	TRK_400	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:09.792327
402	16	GRAIN_401	TRK_401	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:10.015642
403	16	GRAIN_402	TRK_402	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:10.238356
404	16	GRAIN_403	TRK_403	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:10.461108
405	16	GRAIN_404	TRK_404	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:10.685824
406	16	GRAIN_405	TRK_405	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:10.910283
407	16	GRAIN_406	TRK_406	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:11.133715
408	16	GRAIN_407	TRK_407	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:11.35778
409	16	GRAIN_408	TRK_408	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:11.582413
410	16	GRAIN_409	TRK_409	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:11.808339
411	16	GRAIN_410	TRK_410	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:12.031783
412	17	GRAIN_411	TRK_411	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:12.25059
413	17	GRAIN_412	TRK_412	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:12.474531
414	17	GRAIN_413	TRK_413	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:12.697844
415	17	GRAIN_414	TRK_414	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:12.923361
416	17	GRAIN_415	TRK_415	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:13.147979
417	17	GRAIN_416	TRK_416	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:13.369882
418	17	GRAIN_417	TRK_417	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:13.593168
419	17	GRAIN_418	TRK_418	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:13.815365
420	17	GRAIN_419	TRK_419	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:14.039599
421	17	GRAIN_420	TRK_420	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:14.262045
422	17	GRAIN_421	TRK_421	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:14.486096
423	17	GRAIN_422	TRK_422	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:14.711292
424	17	GRAIN_423	TRK_423	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:14.935421
425	17	GRAIN_424	TRK_424	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:15.159996
426	17	GRAIN_425	TRK_425	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:15.384067
427	17	GRAIN_426	TRK_426	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:15.608152
428	17	GRAIN_427	TRK_427	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:15.828853
429	17	GRAIN_428	TRK_428	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:16.052051
430	17	GRAIN_429	TRK_429	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:16.276872
431	17	GRAIN_430	TRK_430	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:16.500457
432	17	GRAIN_431	TRK_431	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:16.725665
433	17	GRAIN_432	TRK_432	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:16.950998
434	17	GRAIN_433	TRK_433	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:17.17687
435	17	GRAIN_434	TRK_434	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:17.40084
436	17	GRAIN_435	TRK_435	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:17.624148
437	17	GRAIN_436	TRK_436	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:17.84518
438	17	GRAIN_437	TRK_437	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:18.068867
439	17	GRAIN_438	TRK_438	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:18.289049
440	17	GRAIN_439	TRK_439	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:18.509682
441	17	GRAIN_440	TRK_440	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:18.732956
442	17	GRAIN_441	TRK_441	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:18.954538
443	17	GRAIN_442	TRK_442	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:19.179104
444	17	GRAIN_443	TRK_443	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:19.401875
445	17	GRAIN_444	TRK_444	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:19.626477
446	17	GRAIN_445	TRK_445	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:19.85245
447	18	GRAIN_446	TRK_446	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:20.090683
448	18	GRAIN_447	TRK_447	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:20.312935
449	18	GRAIN_448	TRK_448	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:20.538925
450	18	GRAIN_449	TRK_449	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:20.763611
451	18	GRAIN_450	TRK_450	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:21.008298
452	18	GRAIN_451	TRK_451	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:21.233258
453	18	GRAIN_452	TRK_452	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:21.458773
454	18	GRAIN_453	TRK_453	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:21.684478
455	18	GRAIN_454	TRK_454	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:21.930548
456	18	GRAIN_455	TRK_455	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:22.237947
457	18	GRAIN_456	TRK_456	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:22.547096
458	18	GRAIN_457	TRK_457	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:22.772559
459	18	GRAIN_458	TRK_458	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:22.996584
460	18	GRAIN_459	TRK_459	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:23.221659
461	18	GRAIN_460	TRK_460	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:23.446382
462	18	GRAIN_461	TRK_461	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:23.670417
463	18	GRAIN_462	TRK_462	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:23.892606
464	18	GRAIN_463	TRK_463	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:24.118562
465	18	GRAIN_464	TRK_464	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:24.340708
466	18	GRAIN_465	TRK_465	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:24.565202
467	18	GRAIN_466	TRK_466	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:24.790517
468	18	GRAIN_467	TRK_467	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:25.014175
469	18	GRAIN_468	TRK_468	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:25.235875
470	18	GRAIN_469	TRK_469	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:25.461338
471	18	GRAIN_470	TRK_470	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:25.719288
472	18	GRAIN_471	TRK_471	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:26.030515
473	18	GRAIN_472	TRK_472	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:26.255188
474	18	GRAIN_473	TRK_473	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:26.478518
475	18	GRAIN_474	TRK_474	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:26.7026
476	18	GRAIN_475	TRK_475	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:26.948366
477	18	GRAIN_476	TRK_476	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:27.227303
478	18	GRAIN_477	TRK_477	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:27.451102
479	18	GRAIN_478	TRK_478	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:27.727089
480	18	GRAIN_479	TRK_479	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:27.952789
481	18	GRAIN_480	TRK_480	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:28.176806
482	19	GRAIN_481	TRK_481	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:28.401478
483	19	GRAIN_482	TRK_482	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:28.625318
484	19	GRAIN_483	TRK_483	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:28.850959
485	19	GRAIN_484	TRK_484	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:29.076054
486	19	GRAIN_485	TRK_485	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:29.297077
487	19	GRAIN_486	TRK_486	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:29.521688
488	19	GRAIN_487	TRK_487	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:29.746857
489	19	GRAIN_488	TRK_488	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:29.966884
490	19	GRAIN_489	TRK_489	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:30.191721
491	19	GRAIN_490	TRK_490	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:30.416933
492	19	GRAIN_491	TRK_491	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:30.641586
493	19	GRAIN_492	TRK_492	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:30.941563
494	19	GRAIN_493	TRK_493	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:31.162246
495	19	GRAIN_494	TRK_494	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:31.38566
496	19	GRAIN_495	TRK_495	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:31.610601
497	19	GRAIN_496	TRK_496	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:31.83568
498	19	GRAIN_497	TRK_497	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:32.061272
499	19	GRAIN_498	TRK_498	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:32.286269
500	19	GRAIN_499	TRK_499	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:32.51157
501	19	GRAIN_500	TRK_500	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:32.730313
502	19	GRAIN_501	TRK_501	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:32.951232
503	19	GRAIN_502	TRK_502	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:33.175884
504	19	GRAIN_503	TRK_503	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:33.401244
505	19	GRAIN_504	TRK_504	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:33.626565
506	19	GRAIN_505	TRK_505	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:33.850796
507	19	GRAIN_506	TRK_506	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:34.074685
508	19	GRAIN_507	TRK_507	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:34.299261
509	19	GRAIN_508	TRK_508	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:34.522967
510	19	GRAIN_509	TRK_509	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:34.743311
511	19	GRAIN_510	TRK_510	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:34.969427
512	20	GRAIN_511	TRK_511	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:35.194514
513	20	GRAIN_512	TRK_512	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:35.420008
514	20	GRAIN_513	TRK_513	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:35.644837
515	20	GRAIN_514	TRK_514	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:35.868594
516	20	GRAIN_515	TRK_515	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:36.091219
517	20	GRAIN_516	TRK_516	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:36.317883
518	20	GRAIN_517	TRK_517	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:36.539013
519	20	GRAIN_518	TRK_518	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:36.761764
520	20	GRAIN_519	TRK_519	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:36.982622
521	20	GRAIN_520	TRK_520	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:37.205095
522	20	GRAIN_521	TRK_521	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:37.430267
523	20	GRAIN_522	TRK_522	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:37.655632
524	20	GRAIN_523	TRK_523	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:37.880116
525	20	GRAIN_524	TRK_524	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:38.104058
526	20	GRAIN_525	TRK_525	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:38.328804
527	20	GRAIN_526	TRK_526	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:38.550059
528	20	GRAIN_527	TRK_527	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:38.774777
529	20	GRAIN_528	TRK_528	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:39.004345
530	20	GRAIN_529	TRK_529	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:39.228833
531	20	GRAIN_530	TRK_530	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:39.454146
532	20	GRAIN_531	TRK_531	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:39.680051
533	20	GRAIN_532	TRK_532	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:39.905511
534	20	GRAIN_533	TRK_533	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:40.125445
535	20	GRAIN_534	TRK_534	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:40.350061
536	20	GRAIN_535	TRK_535	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:40.572967
537	20	GRAIN_536	TRK_536	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:40.797361
538	20	GRAIN_537	TRK_537	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:41.022145
539	20	GRAIN_538	TRK_538	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:41.252063
540	20	GRAIN_539	TRK_539	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:41.476698
541	21	GRAIN_540	TRK_540	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:41.699323
542	21	GRAIN_541	TRK_541	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:41.92401
543	21	GRAIN_542	TRK_542	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:42.151221
544	21	GRAIN_543	TRK_543	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:42.375249
545	21	GRAIN_544	TRK_544	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:42.599519
546	21	GRAIN_545	TRK_545	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:42.825243
547	21	GRAIN_546	TRK_546	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:43.050723
548	21	GRAIN_547	TRK_547	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:43.275224
549	21	GRAIN_548	TRK_548	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:43.4986
550	21	GRAIN_549	TRK_549	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:43.720969
551	21	GRAIN_550	TRK_550	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:43.948943
552	21	GRAIN_551	TRK_551	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:44.173414
553	21	GRAIN_552	TRK_552	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:44.399977
554	21	GRAIN_553	TRK_553	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:44.619785
555	21	GRAIN_554	TRK_554	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:44.845178
556	21	GRAIN_555	TRK_555	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:45.069988
557	21	GRAIN_556	TRK_556	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:45.295394
558	21	GRAIN_557	TRK_557	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:45.537601
559	21	GRAIN_558	TRK_558	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:45.790691
560	21	GRAIN_559	TRK_559	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:46.016471
561	21	GRAIN_560	TRK_560	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:46.239798
562	21	GRAIN_561	TRK_561	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:46.466355
563	21	GRAIN_562	TRK_562	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:46.690553
564	21	GRAIN_563	TRK_563	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:46.960109
565	21	GRAIN_564	TRK_564	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:47.18312
566	21	GRAIN_565	TRK_565	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:47.405662
567	21	GRAIN_566	TRK_566	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:47.628749
568	21	GRAIN_567	TRK_567	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:47.849973
569	21	GRAIN_568	TRK_568	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:48.073881
570	21	GRAIN_569	TRK_569	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:48.302004
571	21	GRAIN_570	TRK_570	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:48.523768
572	21	GRAIN_571	TRK_571	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:48.750457
573	21	GRAIN_572	TRK_572	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:48.971019
574	21	GRAIN_573	TRK_573	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:49.193884
575	21	GRAIN_574	TRK_574	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:49.417074
576	22	GRAIN_575	TRK_575	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:49.639213
577	22	GRAIN_576	TRK_576	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:49.865416
578	22	GRAIN_577	TRK_577	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:50.093217
579	22	GRAIN_578	TRK_578	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:50.318463
580	22	GRAIN_579	TRK_579	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:50.603343
581	22	GRAIN_580	TRK_580	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:50.824861
582	22	GRAIN_581	TRK_581	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:51.0508
583	22	GRAIN_582	TRK_582	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:51.273528
584	22	GRAIN_583	TRK_583	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:51.498783
585	22	GRAIN_584	TRK_584	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:51.722804
586	22	GRAIN_585	TRK_585	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:51.946366
587	22	GRAIN_586	TRK_586	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:52.172235
588	22	GRAIN_587	TRK_587	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:52.398748
589	22	GRAIN_588	TRK_588	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:52.624061
590	22	GRAIN_589	TRK_589	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:52.848205
591	22	GRAIN_590	TRK_590	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:53.070773
592	22	GRAIN_591	TRK_591	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:53.294927
593	22	GRAIN_592	TRK_592	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:53.520159
594	22	GRAIN_593	TRK_593	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:53.744083
595	22	GRAIN_594	TRK_594	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:53.968672
596	22	GRAIN_595	TRK_595	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:54.19202
597	22	GRAIN_596	TRK_596	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:54.413608
598	22	GRAIN_597	TRK_597	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:54.63886
599	22	GRAIN_598	TRK_598	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:54.86244
600	22	GRAIN_599	TRK_599	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:55.08701
601	22	GRAIN_600	TRK_600	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:55.312479
602	22	GRAIN_601	TRK_601	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:55.536879
603	22	GRAIN_602	TRK_602	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:55.762109
604	22	GRAIN_603	TRK_603	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:55.9841
605	22	GRAIN_604	TRK_604	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:56.208914
606	22	GRAIN_605	TRK_605	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:56.433716
607	22	GRAIN_606	TRK_606	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:56.658325
608	22	GRAIN_607	TRK_607	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:56.884188
609	22	GRAIN_608	TRK_608	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:57.106751
610	22	GRAIN_609	TRK_609	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:57.386133
611	23	GRAIN_610	TRK_610	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:57.609269
612	23	GRAIN_611	TRK_611	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:57.833346
613	23	GRAIN_612	TRK_612	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:58.055349
614	23	GRAIN_613	TRK_613	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:58.280031
615	23	GRAIN_614	TRK_614	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:58.503314
616	23	GRAIN_615	TRK_615	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:58.729314
617	23	GRAIN_616	TRK_616	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:58.952013
618	23	GRAIN_617	TRK_617	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:59.175269
619	23	GRAIN_618	TRK_618	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:59.441687
620	23	GRAIN_619	TRK_619	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:59.665908
621	23	GRAIN_620	TRK_620	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:48:59.891572
622	23	GRAIN_621	TRK_621	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:00.115292
623	23	GRAIN_622	TRK_622	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:00.433032
624	23	GRAIN_623	TRK_623	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:00.686452
625	23	GRAIN_624	TRK_624	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:00.910668
626	23	GRAIN_625	TRK_625	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:01.135289
627	23	GRAIN_626	TRK_626	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:01.358533
628	23	GRAIN_627	TRK_627	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:01.584386
629	23	GRAIN_628	TRK_628	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:01.805156
630	23	GRAIN_629	TRK_629	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:02.028826
631	23	GRAIN_630	TRK_630	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:02.249513
632	23	GRAIN_631	TRK_631	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:02.478585
633	23	GRAIN_632	TRK_632	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:02.703359
634	23	GRAIN_633	TRK_633	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:02.927264
635	23	GRAIN_634	TRK_634	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:03.1506
636	23	GRAIN_635	TRK_635	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:03.374514
637	23	GRAIN_636	TRK_636	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:03.599976
638	23	GRAIN_637	TRK_637	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:03.825421
639	23	GRAIN_638	TRK_638	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:04.050511
640	23	GRAIN_639	TRK_639	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:04.273669
641	23	GRAIN_640	TRK_640	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:04.497902
642	23	GRAIN_641	TRK_641	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:04.723988
643	23	GRAIN_642	TRK_642	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:04.945249
644	23	GRAIN_643	TRK_643	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:05.170649
645	23	GRAIN_644	TRK_644	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:05.395916
646	24	GRAIN_645	TRK_645	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:05.619226
647	24	GRAIN_646	TRK_646	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:05.843296
648	24	GRAIN_647	TRK_647	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:06.069983
649	24	GRAIN_648	TRK_648	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:06.295248
650	24	GRAIN_649	TRK_649	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:06.51974
651	24	GRAIN_650	TRK_650	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:06.782795
652	24	GRAIN_651	TRK_651	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:07.008491
653	24	GRAIN_652	TRK_652	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:07.264014
654	24	GRAIN_653	TRK_653	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:07.487365
655	24	GRAIN_654	TRK_654	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:07.71504
656	24	GRAIN_655	TRK_655	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:07.939329
657	24	GRAIN_656	TRK_656	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:08.164609
658	24	GRAIN_657	TRK_657	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:08.391253
659	24	GRAIN_658	TRK_658	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:08.617164
660	24	GRAIN_659	TRK_659	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:08.842599
661	24	GRAIN_660	TRK_660	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:09.067304
662	24	GRAIN_661	TRK_661	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:09.292745
663	24	GRAIN_662	TRK_662	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:09.516531
664	24	GRAIN_663	TRK_663	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:09.753593
665	24	GRAIN_664	TRK_664	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:09.978232
666	24	GRAIN_665	TRK_665	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:10.201245
667	24	GRAIN_666	TRK_666	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:10.425342
668	24	GRAIN_667	TRK_667	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:10.650898
669	24	GRAIN_668	TRK_668	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:10.873947
670	24	GRAIN_669	TRK_669	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:11.099001
671	24	GRAIN_670	TRK_670	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:11.320381
672	24	GRAIN_671	TRK_671	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:11.544158
673	24	GRAIN_672	TRK_672	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:11.767776
674	24	GRAIN_673	TRK_673	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:11.992376
675	24	GRAIN_674	TRK_674	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:12.216079
676	24	GRAIN_675	TRK_675	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:12.440384
677	24	GRAIN_676	TRK_676	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:12.662757
678	24	GRAIN_677	TRK_677	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:12.882022
679	24	GRAIN_678	TRK_678	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:13.10667
680	25	GRAIN_679	TRK_679	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:13.329504
681	25	GRAIN_680	TRK_680	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:13.555201
682	25	GRAIN_681	TRK_681	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:13.778596
683	25	GRAIN_682	TRK_682	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:14.003292
684	25	GRAIN_683	TRK_683	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:14.224003
685	25	GRAIN_684	TRK_684	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:14.44662
686	25	GRAIN_685	TRK_685	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:14.671404
687	25	GRAIN_686	TRK_686	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:14.895569
688	25	GRAIN_687	TRK_687	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:15.120064
689	25	GRAIN_688	TRK_688	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:15.345348
690	25	GRAIN_689	TRK_689	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:15.569519
691	25	GRAIN_690	TRK_690	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:15.795276
692	25	GRAIN_691	TRK_691	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:16.022014
693	25	GRAIN_692	TRK_692	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:16.244732
694	25	GRAIN_693	TRK_693	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:16.469989
695	25	GRAIN_694	TRK_694	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:16.69531
696	25	GRAIN_695	TRK_695	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:16.918127
697	25	GRAIN_696	TRK_696	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:17.143293
698	25	GRAIN_697	TRK_697	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:17.364141
699	25	GRAIN_698	TRK_698	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:17.584258
700	25	GRAIN_699	TRK_699	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:17.810073
701	25	GRAIN_700	TRK_700	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:18.034127
702	25	GRAIN_701	TRK_701	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:18.257957
703	25	GRAIN_702	TRK_702	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:18.48221
704	25	GRAIN_703	TRK_703	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:18.707074
705	25	GRAIN_704	TRK_704	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:18.931511
706	25	GRAIN_705	TRK_705	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:19.15617
707	25	GRAIN_706	TRK_706	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:19.37625
708	25	GRAIN_707	TRK_707	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:19.601602
709	25	GRAIN_708	TRK_708	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:19.826236
710	25	GRAIN_709	TRK_709	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:20.050924
711	25	GRAIN_710	TRK_710	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:20.27496
712	26	GRAIN_711	TRK_711	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:20.49866
713	26	GRAIN_712	TRK_712	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:20.722407
714	26	GRAIN_713	TRK_713	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:20.947577
715	26	GRAIN_714	TRK_714	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:21.171241
716	26	GRAIN_715	TRK_715	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:21.390606
717	26	GRAIN_716	TRK_716	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:21.614472
718	26	GRAIN_717	TRK_717	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:21.839735
719	26	GRAIN_718	TRK_718	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:22.063053
720	26	GRAIN_719	TRK_719	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:22.286319
721	26	GRAIN_720	TRK_720	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:22.517118
722	26	GRAIN_721	TRK_721	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:22.738494
723	26	GRAIN_722	TRK_722	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:22.961783
724	26	GRAIN_723	TRK_723	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:23.187806
725	26	GRAIN_724	TRK_724	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:23.467691
726	26	GRAIN_725	TRK_725	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:23.692034
727	26	GRAIN_726	TRK_726	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:23.916626
728	26	GRAIN_727	TRK_727	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:24.139814
729	26	GRAIN_728	TRK_728	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:24.364208
730	26	GRAIN_729	TRK_729	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:24.586185
731	26	GRAIN_730	TRK_730	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:24.810906
732	26	GRAIN_731	TRK_731	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:25.03487
733	26	GRAIN_732	TRK_732	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:25.258781
734	26	GRAIN_733	TRK_733	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:25.482353
735	26	GRAIN_734	TRK_734	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:25.708154
736	26	GRAIN_735	TRK_735	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:25.933088
737	26	GRAIN_736	TRK_736	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:26.157983
738	26	GRAIN_737	TRK_737	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:26.382743
739	26	GRAIN_738	TRK_738	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:26.605853
740	26	GRAIN_739	TRK_739	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:26.830998
741	26	GRAIN_740	TRK_740	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:27.056068
742	26	GRAIN_741	TRK_741	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:27.280756
743	26	GRAIN_742	TRK_742	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:27.501506
744	26	GRAIN_743	TRK_743	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:27.724797
745	26	GRAIN_744	TRK_744	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:27.949533
746	26	GRAIN_745	TRK_745	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:28.174799
747	27	GRAIN_746	TRK_746	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:28.400339
748	27	GRAIN_747	TRK_747	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:28.624854
749	27	GRAIN_748	TRK_748	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:28.848125
750	27	GRAIN_749	TRK_749	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:29.072904
751	27	GRAIN_750	TRK_750	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:29.295089
752	27	GRAIN_751	TRK_751	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:29.518563
753	27	GRAIN_752	TRK_752	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:29.741016
754	27	GRAIN_753	TRK_753	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:29.965686
755	27	GRAIN_754	TRK_754	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:30.18922
756	27	GRAIN_755	TRK_755	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:30.412695
757	27	GRAIN_756	TRK_756	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:30.637014
758	27	GRAIN_757	TRK_757	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:30.863087
759	27	GRAIN_758	TRK_758	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:31.089
760	27	GRAIN_759	TRK_759	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:31.31364
761	27	GRAIN_760	TRK_760	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:31.536926
762	27	GRAIN_761	TRK_761	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:31.760982
763	27	GRAIN_762	TRK_762	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:31.982487
764	27	GRAIN_763	TRK_763	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:32.206357
765	27	GRAIN_764	TRK_764	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:32.431829
766	27	GRAIN_765	TRK_765	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:32.655131
767	27	GRAIN_766	TRK_766	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:32.878075
768	27	GRAIN_767	TRK_767	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:33.102401
769	27	GRAIN_768	TRK_768	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:33.324679
770	27	GRAIN_769	TRK_769	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:33.548461
771	27	GRAIN_770	TRK_770	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:33.772541
772	27	GRAIN_771	TRK_771	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:33.99475
773	27	GRAIN_772	TRK_772	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:34.218492
774	27	GRAIN_773	TRK_773	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:34.44262
775	27	GRAIN_774	TRK_774	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:34.667174
776	27	GRAIN_775	TRK_775	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:34.891181
777	27	GRAIN_776	TRK_776	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:35.117835
778	27	GRAIN_777	TRK_777	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:35.343283
779	27	GRAIN_778	TRK_778	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:35.570168
780	29	GRAIN_779	TRK_779	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:35.803711
781	29	GRAIN_780	TRK_780	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:36.02767
782	29	GRAIN_781	TRK_781	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:36.251716
783	29	GRAIN_782	TRK_782	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:36.47781
784	29	GRAIN_783	TRK_783	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:36.703792
785	29	GRAIN_784	TRK_784	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:36.928387
786	29	GRAIN_785	TRK_785	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:37.151686
787	29	GRAIN_786	TRK_786	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:37.377791
788	29	GRAIN_787	TRK_787	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:37.602209
789	29	GRAIN_788	TRK_788	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:37.824924
790	29	GRAIN_789	TRK_789	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:38.048938
791	29	GRAIN_790	TRK_790	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:38.274465
792	29	GRAIN_791	TRK_791	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:38.501024
793	29	GRAIN_792	TRK_792	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:38.726062
794	29	GRAIN_793	TRK_793	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:38.949847
795	29	GRAIN_794	TRK_794	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:39.172886
796	29	GRAIN_795	TRK_795	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:39.393879
797	29	GRAIN_796	TRK_796	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:39.618317
798	29	GRAIN_797	TRK_797	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:39.840646
799	29	GRAIN_798	TRK_798	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:40.066378
800	29	GRAIN_799	TRK_799	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:40.292945
801	29	GRAIN_800	TRK_800	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:40.517654
802	29	GRAIN_801	TRK_801	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:40.743138
803	29	GRAIN_802	TRK_802	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:40.964849
804	29	GRAIN_803	TRK_803	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:41.189759
805	29	GRAIN_804	TRK_804	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:41.410896
806	29	GRAIN_805	TRK_805	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:41.634026
807	29	GRAIN_806	TRK_806	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:41.856463
808	29	GRAIN_807	TRK_807	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:42.081102
809	29	GRAIN_808	TRK_808	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:42.306491
810	29	GRAIN_809	TRK_809	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:42.530546
811	29	GRAIN_810	TRK_810	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:42.752276
812	30	GRAIN_811	TRK_811	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:42.977167
813	30	GRAIN_812	TRK_812	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:43.201471
814	30	GRAIN_813	TRK_813	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:43.425155
815	30	GRAIN_814	TRK_814	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:43.64866
816	30	GRAIN_815	TRK_815	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:43.873225
817	30	GRAIN_816	TRK_816	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:44.09723
818	30	GRAIN_817	TRK_817	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:44.321342
819	30	GRAIN_818	TRK_818	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:44.54531
820	30	GRAIN_819	TRK_819	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:44.772101
821	30	GRAIN_820	TRK_820	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:44.997173
822	30	GRAIN_821	TRK_821	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:45.222504
823	30	GRAIN_822	TRK_822	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:45.447148
824	30	GRAIN_823	TRK_823	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:45.670576
825	30	GRAIN_824	TRK_824	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:45.895099
826	30	GRAIN_825	TRK_825	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:46.119205
827	30	GRAIN_826	TRK_826	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:46.340944
828	30	GRAIN_827	TRK_827	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:46.566049
829	30	GRAIN_828	TRK_828	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:46.790801
830	30	GRAIN_829	TRK_829	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:47.013971
831	30	GRAIN_830	TRK_830	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:47.239494
832	30	GRAIN_831	TRK_831	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:47.464035
833	30	GRAIN_832	TRK_832	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:47.690015
834	30	GRAIN_833	TRK_833	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:47.914681
835	30	GRAIN_834	TRK_834	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:48.140636
836	30	GRAIN_835	TRK_835	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:48.360588
837	30	GRAIN_836	TRK_836	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:48.583464
838	30	GRAIN_837	TRK_837	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:48.806185
839	30	GRAIN_838	TRK_838	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:49.028565
840	30	GRAIN_839	TRK_839	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:49.682452
841	30	GRAIN_840	TRK_840	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:49.905711
842	30	GRAIN_841	TRK_841	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:50.129841
843	30	GRAIN_842	TRK_842	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:50.354411
844	30	GRAIN_843	TRK_843	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:50.580706
845	30	GRAIN_844	TRK_844	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:50.802829
846	30	GRAIN_845	TRK_845	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:51.070806
847	31	GRAIN_846	TRK_846	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:51.295781
848	31	GRAIN_847	TRK_847	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:51.519727
849	31	GRAIN_848	TRK_848	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:51.743828
850	31	GRAIN_849	TRK_849	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:51.968887
851	31	GRAIN_850	TRK_850	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:52.200924
852	31	GRAIN_851	TRK_851	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:52.426903
853	31	GRAIN_852	TRK_852	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:52.652122
854	31	GRAIN_853	TRK_853	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:52.883159
855	31	GRAIN_854	TRK_854	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:53.106091
856	31	GRAIN_855	TRK_855	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:53.375392
857	31	GRAIN_856	TRK_856	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:53.59679
858	31	GRAIN_857	TRK_857	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:53.822673
859	31	GRAIN_858	TRK_858	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:54.042851
860	31	GRAIN_859	TRK_859	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:54.268068
861	31	GRAIN_860	TRK_860	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:54.492319
862	31	GRAIN_861	TRK_861	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:54.71812
863	31	GRAIN_862	TRK_862	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:54.940497
864	31	GRAIN_863	TRK_863	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:55.161598
865	31	GRAIN_864	TRK_864	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:55.380993
866	31	GRAIN_865	TRK_865	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:55.605601
867	31	GRAIN_866	TRK_866	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:55.829532
868	31	GRAIN_867	TRK_867	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:56.054907
869	31	GRAIN_868	TRK_868	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:56.279811
870	31	GRAIN_869	TRK_869	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:56.501144
871	31	GRAIN_870	TRK_870	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:56.722496
872	31	GRAIN_871	TRK_871	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:56.947751
873	31	GRAIN_872	TRK_872	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:57.172452
874	31	GRAIN_873	TRK_873	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:57.396729
875	31	GRAIN_874	TRK_874	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:57.620325
876	31	GRAIN_875	TRK_875	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:57.844141
877	31	GRAIN_876	TRK_876	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:58.068383
878	31	GRAIN_877	TRK_877	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:58.294146
879	31	GRAIN_878	TRK_878	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:58.517161
880	31	GRAIN_879	TRK_879	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:58.739201
881	31	GRAIN_880	TRK_880	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:59.028174
882	32	GRAIN_881	TRK_881	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:59.253372
883	32	GRAIN_882	TRK_882	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:59.476675
884	32	GRAIN_883	TRK_883	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:59.701264
885	32	GRAIN_884	TRK_884	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:49:59.925876
886	32	GRAIN_885	TRK_885	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:00.147305
887	32	GRAIN_886	TRK_886	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:00.370788
888	32	GRAIN_887	TRK_887	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:00.596092
889	32	GRAIN_888	TRK_888	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:00.819372
890	32	GRAIN_889	TRK_889	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:01.044357
891	32	GRAIN_890	TRK_890	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:01.275296
892	32	GRAIN_891	TRK_891	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:01.497986
893	32	GRAIN_892	TRK_892	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:01.721993
894	32	GRAIN_893	TRK_893	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:01.944202
895	32	GRAIN_894	TRK_894	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:02.168025
896	32	GRAIN_895	TRK_895	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:02.392669
897	32	GRAIN_896	TRK_896	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:02.614041
898	32	GRAIN_897	TRK_897	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:02.837466
899	32	GRAIN_898	TRK_898	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:03.060758
900	32	GRAIN_899	TRK_899	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:03.284126
901	32	GRAIN_900	TRK_900	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:03.507674
902	32	GRAIN_901	TRK_901	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:03.732683
903	32	GRAIN_902	TRK_902	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:03.956126
904	32	GRAIN_903	TRK_903	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:04.180284
905	32	GRAIN_904	TRK_904	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:04.404833
906	32	GRAIN_905	TRK_905	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:04.640057
907	32	GRAIN_906	TRK_906	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:04.863964
908	32	GRAIN_907	TRK_907	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:05.089995
909	33	GRAIN_908	TRK_908	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:05.355754
910	33	GRAIN_909	TRK_909	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:05.662173
911	33	GRAIN_910	TRK_910	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:05.884999
912	33	GRAIN_911	TRK_911	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:06.108394
913	33	GRAIN_912	TRK_912	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:06.336205
914	33	GRAIN_913	TRK_913	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:06.585879
915	33	GRAIN_914	TRK_914	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:06.893885
916	33	GRAIN_915	TRK_915	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:07.117196
917	33	GRAIN_916	TRK_916	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:07.34063
918	33	GRAIN_917	TRK_917	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:07.567213
919	33	GRAIN_918	TRK_918	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:07.791565
920	33	GRAIN_919	TRK_919	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:08.016217
921	33	GRAIN_920	TRK_920	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:08.237452
922	33	GRAIN_921	TRK_921	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:08.462609
923	33	GRAIN_922	TRK_922	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:08.723957
924	33	GRAIN_923	TRK_923	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:08.94963
925	33	GRAIN_924	TRK_924	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:09.172774
926	33	GRAIN_925	TRK_925	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:09.397296
927	33	GRAIN_926	TRK_926	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:09.621352
928	33	GRAIN_927	TRK_927	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:09.84404
929	33	GRAIN_928	TRK_928	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:10.071564
930	33	GRAIN_929	TRK_929	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:10.296019
931	33	GRAIN_930	TRK_930	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:10.521911
932	33	GRAIN_931	TRK_931	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:10.747288
933	33	GRAIN_932	TRK_932	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:10.971146
934	33	GRAIN_933	TRK_933	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:11.195993
935	33	GRAIN_934	TRK_934	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:11.423144
936	33	GRAIN_935	TRK_935	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:11.646833
937	33	GRAIN_936	TRK_936	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:11.902004
938	33	GRAIN_937	TRK_937	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:12.126018
939	33	GRAIN_938	TRK_938	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:12.351397
940	34	GRAIN_939	TRK_939	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:12.626574
941	34	GRAIN_940	TRK_940	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:12.851778
942	34	GRAIN_941	TRK_941	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:13.107582
943	34	GRAIN_942	TRK_942	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:13.331173
944	34	GRAIN_943	TRK_943	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:13.555944
945	34	GRAIN_944	TRK_944	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:13.781198
946	34	GRAIN_945	TRK_945	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:14.005957
947	34	GRAIN_946	TRK_946	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:14.229878
948	34	GRAIN_947	TRK_947	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:14.452335
949	34	GRAIN_948	TRK_948	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:14.677315
950	34	GRAIN_949	TRK_949	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:14.903226
951	34	GRAIN_950	TRK_950	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:15.129743
952	34	GRAIN_951	TRK_951	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:15.358403
953	34	GRAIN_952	TRK_952	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:15.582511
954	34	GRAIN_953	TRK_953	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:15.806406
955	34	GRAIN_954	TRK_954	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:16.031195
956	34	GRAIN_955	TRK_955	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:16.257682
957	34	GRAIN_956	TRK_956	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:16.484393
958	34	GRAIN_957	TRK_957	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:16.708527
959	34	GRAIN_958	TRK_958	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:16.93435
960	34	GRAIN_959	TRK_959	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:17.161427
961	34	GRAIN_960	TRK_960	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:17.386293
962	34	GRAIN_961	TRK_961	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:17.643079
963	34	GRAIN_962	TRK_962	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:17.950804
964	34	GRAIN_963	TRK_963	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:18.173289
965	34	GRAIN_964	TRK_964	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:18.397734
966	34	GRAIN_965	TRK_965	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:18.621687
967	34	GRAIN_966	TRK_966	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:18.871828
968	34	GRAIN_967	TRK_967	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:19.096571
969	34	GRAIN_968	TRK_968	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:19.323862
970	34	GRAIN_969	TRK_969	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:19.549866
971	34	GRAIN_970	TRK_970	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:19.778302
972	34	GRAIN_971	TRK_971	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:20.005008
973	34	GRAIN_972	TRK_972	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:20.22779
974	34	GRAIN_973	TRK_973	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:20.452966
975	34	GRAIN_974	TRK_974	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:20.677821
976	34	GRAIN_975	TRK_975	confined	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 18:50:20.92193
\.


--
-- Data for Name: grains; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.grains (id, grain_id, mount_id, grain_identifier, grain_morphology, grain_quality, created_at) FROM stdin;
\.


--
-- Data for Name: he_datapoints; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.he_datapoints (id, sample_id, datapoint_key, batch_id, laboratory, analyst_orcid, analysis_date, publication_doi, mineral_type, mount_id, n_aliquots, mean_uncorr_age_ma, mean_uncorr_age_error_ma, mean_uncorr_age_error_type, weighted_mean_uncorr_age_ma, weighted_mean_uncorr_age_error_ma, weighted_mean_uncorr_age_error_type, mswd_uncorr, conf95_uncorr_ma, chi2_uncorr_pct, iqr_uncorr_ma, mean_corr_age_ma, mean_corr_age_error_ma, mean_corr_age_error_type, weighted_mean_corr_age_ma, weighted_mean_corr_age_error_ma, weighted_mean_corr_age_error_type, mswd_corr, conf95_corr_ma, chi2_corr_pct, iqr_corr_ma, uncertainty_description, ablation_pit_volume_method, ablation_pit_volume_software, he_measurement_method, parent_isotope_method, surface_area_volume_equation, alpha_stopping_distance_ref, ft_correction_equation, esr_sa_v_equation, esr_ft_equation, eu_equation, he_age_approach, corr_age_method, created_at) FROM stdin;
8	CP06	CP06_ZHe_01	\N	University of Colorado Boulder	Peak, B.A.	2020-01-01 00:00:00	\N	zircon	\N	6	164.03	\N	\N	\N	\N	\N	\N	\N	\N	\N	261.64	192.26	1s	\N	\N	\N	\N	\N	\N	\N	ZHe with LA-ICP-MS zonation profiling	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
9	CP06-52	CP06-52_ZHe_01	\N	University of Colorado Boulder	Peak, B.A.	2020-01-01 00:00:00	\N	zircon	\N	11	452.03	\N	\N	\N	\N	\N	\N	\N	\N	\N	626.28	177.31	1s	\N	\N	\N	\N	\N	\N	\N	ZHe with LA-ICP-MS zonation profiling	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
10	CP06-65	CP06-65_ZHe_01	\N	University of Colorado Boulder	Peak, B.A.	2020-01-01 00:00:00	\N	zircon	\N	7	430.94	\N	\N	\N	\N	\N	\N	\N	\N	\N	554.77	152.34	1s	\N	\N	\N	\N	\N	\N	\N	ZHe with LA-ICP-MS zonation profiling	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
11	CP06-69	CP06-69_ZHe_01	\N	University of Colorado Boulder	Peak, B.A.	2020-01-01 00:00:00	\N	zircon	\N	5	92.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	136.68	75.90	1s	\N	\N	\N	\N	\N	\N	\N	ZHe with LA-ICP-MS zonation profiling	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
12	CP06-72	CP06-72_ZHe_01	\N	University of Colorado Boulder	Peak, B.A.	2020-01-01 00:00:00	\N	zircon	\N	7	166.91	\N	\N	\N	\N	\N	\N	\N	\N	\N	253.98	122.92	1s	\N	\N	\N	\N	\N	\N	\N	ZHe with LA-ICP-MS zonation profiling	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
13	UG90-2	UG90-2_ZHe_01	\N	University of Colorado Boulder	Peak, B.A.	2020-01-01 00:00:00	\N	zircon	\N	8	365.64	\N	\N	\N	\N	\N	\N	\N	\N	\N	509.57	157.51	1s	\N	\N	\N	\N	\N	\N	\N	ZHe with LA-ICP-MS zonation profiling	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
14	UG96-1	UG96-1_ZHe_01	\N	University of Colorado Boulder	Peak, B.A.	2020-01-01 00:00:00	\N	zircon	\N	6	152.73	\N	\N	\N	\N	\N	\N	\N	\N	\N	228.19	82.93	1s	\N	\N	\N	\N	\N	\N	\N	ZHe with LA-ICP-MS zonation profiling	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
\.


--
-- Data for Name: he_whole_grain_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.he_whole_grain_data (id, he_datapoint_id, lab_no, grain_identifier, aliquot_type, n_grains_in_aliquot, crystal_integrity, grain_morphology, assumed_geometry, length_um, length_um_sd, half_width_um, width_um_sd, height_um, height_um_sd, measurement_method, crystal_faces_measured, he_ncc, he_measurement_method, he_extraction_temperature_c, he_extraction_duration_min, he_extraction_method, he_blank_ncc, he_blank_error_ncc, u_ppm, u_ppm_error, th_ppm, th_ppm_error, sm_ppm, sm_ppm_error, eu_ppm, u_measurement_method, u_blank_ppm, th_blank_ppm, sm_blank_ppm, spike_u238_u235_ratio, spike_th232_th229_ratio, mass_mg, surface_area_mm2, volume_mm3, sa_v_ratio, rs_um, esr_sa_v_um, esr_ft_um, sa_v_calc_equation, ft_correction_equation, alpha_stopping_distance_ref, uncorr_age_ma, uncorr_age_error_ma, corr_age_ma, corr_age_error_ma, corr_age_1sigma_ma, ft, error_type, eu_equation, he_age_approach, lambda_u238, lambda_th232, lambda_sm147, terminations, std_run, thermal_model, created_at) FROM stdin;
1	10	CP06-65_bp_z01	CP06-65_bp_z01	single	1	\N	\N	\N	197.85	\N	89.20	\N	\N	\N	\N	\N	107.141040	\N	\N	\N	\N	\N	\N	341.097	3.027	101.292	1.150	15.887	1.330	365.173	\N	\N	\N	\N	\N	\N	4.330591	\N	\N	\N	51.72	\N	\N	\N	\N	\N	534.32	2.25	681.82	\N	5.83	0.7728	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
2	10	CP06-65_bp_z02	CP06-65_bp_z02	single	1	\N	\N	\N	115.92	\N	69.32	\N	\N	\N	\N	\N	31.361527	\N	\N	\N	\N	\N	\N	491.523	8.843	129.536	2.740	76.816	3.557	522.380	\N	\N	\N	\N	\N	\N	1.320591	\N	\N	\N	37.25	\N	\N	\N	\N	\N	364.29	3.05	521.88	\N	8.73	0.6879	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
3	10	CP06-65_bp_z03	CP06-65_bp_z03	single	1	\N	\N	\N	199.15	\N	92.82	\N	\N	\N	\N	\N	77.853352	\N	\N	\N	\N	\N	\N	155.435	2.926	57.050	2.710	4.051	0.794	168.989	\N	\N	\N	\N	\N	\N	6.001002	\N	\N	\N	59.97	\N	\N	\N	\N	\N	601.89	5.33	739.70	\N	13.25	0.8032	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
4	10	CP06-65_bp_z04	CP06-65_bp_z04	single	1	\N	\N	\N	189.80	\N	69.62	\N	\N	\N	\N	\N	73.241806	\N	\N	\N	\N	\N	\N	410.520	25.603	109.890	10.456	22.682	35.505	436.646	\N	\N	\N	\N	\N	\N	2.999670	\N	\N	\N	44.73	\N	\N	\N	\N	\N	444.70	12.73	593.88	\N	34.65	0.7384	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
5	10	CP06-65_bp_z05	CP06-65_bp_z05	single	1	\N	\N	\N	170.14	\N	78.93	\N	\N	\N	\N	\N	82.041296	\N	\N	\N	\N	\N	\N	360.647	19.567	98.899	8.111	41.634	18.903	384.185	\N	\N	\N	\N	\N	\N	3.756657	\N	\N	\N	51.61	\N	\N	\N	\N	\N	451.78	11.24	577.98	\N	29.03	0.7725	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
6	10	CP06-65_bp_z06	CP06-65_bp_z06	single	1	\N	\N	\N	249.60	\N	80.53	\N	\N	\N	\N	\N	110.091343	\N	\N	\N	\N	\N	\N	301.668	8.474	96.938	3.470	25.618	4.224	324.721	\N	\N	\N	\N	\N	\N	6.725216	\N	\N	\N	57.75	\N	\N	\N	\N	\N	402.64	5.21	501.25	\N	13.15	0.7960	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
7	10	CP06-65_bp_z07	CP06-65_bp_z07	single	1	\N	\N	\N	205.18	\N	117.92	\N	\N	\N	\N	\N	143.327880	\N	\N	\N	\N	\N	\N	764.019	20.973	190.687	2.588	132.345	6.607	809.466	\N	\N	\N	\N	\N	\N	6.629502	\N	\N	\N	61.71	\N	\N	\N	\N	\N	216.97	2.75	266.87	\N	6.77	0.8093	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
8	11	CP06-69_bp_z01	CP06-69_bp_z01	single	1	\N	\N	\N	96.13	\N	51.69	\N	\N	\N	\N	\N	6.203484	\N	\N	\N	\N	\N	\N	1498.401	50.484	511.385	13.580	0.000	0.000	1619.855	\N	\N	\N	\N	\N	\N	0.731583	\N	\N	\N	30.79	\N	\N	\N	\N	\N	43.21	0.66	68.95	\N	2.09	0.6252	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
9	11	CP06-69_bp_z02	CP06-69_bp_z02	single	1	\N	\N	\N	110.90	\N	56.99	\N	\N	\N	\N	\N	30.358236	\N	\N	\N	\N	\N	\N	1196.845	26.534	362.117	9.593	0.000	0.000	1282.848	\N	\N	\N	\N	\N	\N	1.142739	\N	\N	\N	35.72	\N	\N	\N	\N	\N	168.99	1.75	248.69	\N	5.12	0.6747	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
10	11	CP06-69_bp_z03	CP06-69_bp_z03	single	1	\N	\N	\N	132.50	\N	77.55	\N	\N	\N	\N	\N	25.901896	\N	\N	\N	\N	\N	\N	1908.212	32.557	204.429	4.193	0.000	0.000	1956.764	\N	\N	\N	\N	\N	\N	2.002255	\N	\N	\N	42.76	\N	\N	\N	\N	\N	54.50	0.45	74.72	\N	1.21	0.7281	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
11	11	CP06-69_bp_z04	CP06-69_bp_z04	single	1	\N	\N	\N	98.37	\N	58.60	\N	\N	\N	\N	\N	12.964719	\N	\N	\N	\N	\N	\N	1061.638	37.297	257.292	11.232	0.000	0.000	1122.745	\N	\N	\N	\N	\N	\N	0.831090	\N	\N	\N	32.24	\N	\N	\N	\N	\N	113.94	1.85	176.45	\N	5.65	0.6421	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
12	11	CP06-69_bp_z05	CP06-69_bp_z05	single	1	\N	\N	\N	162.17	\N	77.06	\N	\N	\N	\N	\N	38.315452	\N	\N	\N	\N	\N	\N	1544.754	25.889	297.497	7.871	0.000	0.000	1615.409	\N	\N	\N	\N	\N	\N	2.346376	\N	\N	\N	42.12	\N	\N	\N	\N	\N	83.12	0.67	114.59	\N	1.85	0.7234	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
13	8	CP06_70_bp_z01	CP06_70_bp_z01	single	1	\N	\N	\N	161.76	\N	45.29	\N	\N	\N	\N	\N	35.257284	\N	\N	\N	\N	\N	\N	639.282	24.062	168.717	4.244	58.886	7.954	679.423	\N	\N	\N	\N	\N	\N	1.433859	\N	\N	\N	32.48	\N	\N	\N	\N	\N	291.97	5.05	446.72	\N	15.48	0.6444	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
14	8	CP06_70_bp_z02*	CP06_70_bp_z02*	single	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	326.031	6.218	189.517	2.532	6.463	3.126	371.049	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	42.96	\N	\N	\N	\N	\N	96.20	0.84	132.18	\N	2.31	0.7255	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
15	8	CP06_70_bp_z03	CP06_70_bp_z03	single	1	\N	\N	\N	116.20	\N	44.67	\N	\N	\N	\N	\N	12.519535	\N	\N	\N	\N	\N	\N	487.098	10.229	183.374	6.191	21.120	5.173	530.674	\N	\N	\N	\N	\N	\N	0.595104	\N	\N	\N	25.81	\N	\N	\N	\N	\N	319.18	3.07	559.57	\N	10.72	0.5581	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
16	8	CP06_70_bp_z04	CP06_70_bp_z04	single	1	\N	\N	\N	162.77	\N	58.95	\N	\N	\N	\N	\N	20.357340	\N	\N	\N	\N	\N	\N	958.435	13.842	133.277	1.255	169.518	11.507	990.292	\N	\N	\N	\N	\N	\N	2.449624	\N	\N	\N	40.85	\N	\N	\N	\N	\N	69.09	0.47	96.31	\N	1.31	0.7156	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
17	8	CP06_70_bp_z05	CP06_70_bp_z05	single	1	\N	\N	\N	118.70	\N	38.97	\N	\N	\N	\N	\N	10.178346	\N	\N	\N	\N	\N	\N	1239.169	21.835	275.252	14.247	192.640	12.818	1304.773	\N	\N	\N	\N	\N	\N	0.657703	\N	\N	\N	27.18	\N	\N	\N	\N	\N	97.41	0.81	166.75	\N	2.79	0.5805	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
18	8	CP06_70_bp_z06	CP06_70_bp_z06	single	1	\N	\N	\N	120.85	\N	50.21	\N	\N	\N	\N	\N	11.947339	\N	\N	\N	\N	\N	\N	794.198	14.864	240.168	7.102	148.439	16.292	851.416	\N	\N	\N	\N	\N	\N	1.043503	\N	\N	\N	33.29	\N	\N	\N	\N	\N	110.32	0.95	168.28	\N	2.89	0.6522	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
19	12	CP06-72_bp_z01	CP06-72_bp_z01	single	1	\N	\N	\N	130.32	\N	46.38	\N	\N	\N	\N	\N	6.375638	\N	\N	\N	\N	\N	\N	486.727	7.474	77.382	2.544	11.807	4.640	505.120	\N	\N	\N	\N	\N	\N	0.845551	\N	\N	\N	27.65	\N	\N	\N	\N	\N	122.30	0.91	206.45	\N	2.99	0.5879	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
20	12	CP06-72_bp_z02	CP06-72_bp_z02	single	1	\N	\N	\N	139.47	\N	63.43	\N	\N	\N	\N	\N	56.861806	\N	\N	\N	\N	\N	\N	859.681	10.231	1134.595	7.166	231.329	5.218	1129.425	\N	\N	\N	\N	\N	\N	1.773116	\N	\N	\N	37.18	\N	\N	\N	\N	\N	231.02	1.21	337.22	\N	3.46	0.6792	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
21	12	CP06-72_bp_z03	CP06-72_bp_z03	single	1	\N	\N	\N	130.83	\N	62.99	\N	\N	\N	\N	\N	40.052156	\N	\N	\N	\N	\N	\N	596.602	8.400	96.710	1.592	11.176	3.108	619.584	\N	\N	\N	\N	\N	\N	1.602175	\N	\N	\N	36.34	\N	\N	\N	\N	\N	324.36	2.19	469.60	\N	6.27	0.6815	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
22	12	CP06-72_bp_z04	CP06-72_bp_z04	single	1	\N	\N	\N	120.65	\N	44.07	\N	\N	\N	\N	\N	14.670977	\N	\N	\N	\N	\N	\N	1035.130	18.818	101.996	1.974	47.304	16.826	1059.410	\N	\N	\N	\N	\N	\N	0.757177	\N	\N	\N	26.98	\N	\N	\N	\N	\N	149.45	1.32	255.50	\N	4.42	0.5793	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
23	12	CP06-72_bp_z05*	CP06-72_bp_z05*	single	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	688.419	24.844	1040.469	23.438	36.614	17.270	935.574	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.91	\N	\N	\N	\N	\N	43.18	0.58	74.48	\N	1.88	0.5784	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
24	12	CP06-72_bp_z06	CP06-72_bp_z06	single	1	\N	\N	\N	116.43	\N	54.16	\N	\N	\N	\N	\N	22.118577	\N	\N	\N	\N	\N	\N	1225.456	27.255	226.461	6.262	27.962	8.941	1279.274	\N	\N	\N	\N	\N	\N	0.972931	\N	\N	\N	32.76	\N	\N	\N	\N	\N	145.30	1.53	222.61	\N	4.69	0.6482	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
25	12	CP06-72_bp_z07	CP06-72_bp_z07	single	1	\N	\N	\N	151.44	\N	65.59	\N	\N	\N	\N	\N	45.657704	\N	\N	\N	\N	\N	\N	982.241	13.405	212.777	5.246	66.036	6.025	1032.855	\N	\N	\N	\N	\N	\N	2.364775	\N	\N	\N	41.11	\N	\N	\N	\N	\N	152.74	1.03	212.02	\N	2.84	0.7166	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
26	13	UG90-2_bp_z01	UG90-2_bp_z01	single	1	\N	\N	\N	150.21	\N	41.19	\N	\N	\N	\N	\N	44.685792	\N	\N	\N	\N	\N	\N	938.981	10.696	218.759	6.860	9.099	4.098	990.947	\N	\N	\N	\N	\N	\N	1.106533	\N	\N	\N	31.06	\N	\N	\N	\N	\N	327.63	1.92	511.74	\N	6.09	0.6295	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
27	13	UG90-2_bp_z02	UG90-2_bp_z02	single	1	\N	\N	\N	150.24	\N	76.72	\N	\N	\N	\N	\N	71.658493	\N	\N	\N	\N	\N	\N	555.909	7.099	130.867	2.018	9.305	1.833	587.001	\N	\N	\N	\N	\N	\N	1.919947	\N	\N	\N	39.53	\N	\N	\N	\N	\N	502.74	3.07	699.44	\N	8.57	0.7055	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
28	13	UG90-2_bp_z03	UG90-2_bp_z03	single	1	\N	\N	\N	125.93	\N	48.03	\N	\N	\N	\N	\N	32.930181	\N	\N	\N	\N	\N	\N	891.924	13.521	213.942	4.468	12.104	3.081	942.749	\N	\N	\N	\N	\N	\N	1.164218	\N	\N	\N	34.16	\N	\N	\N	\N	\N	243.13	1.72	363.67	\N	5.19	0.6613	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
29	13	UG90-2_bp_z04	UG90-2_bp_z04	single	1	\N	\N	\N	125.55	\N	84.98	\N	\N	\N	\N	\N	85.043104	\N	\N	\N	\N	\N	\N	502.176	19.171	166.226	4.813	9.737	1.935	541.666	\N	\N	\N	\N	\N	\N	2.306637	\N	\N	\N	45.83	\N	\N	\N	\N	\N	536.82	9.30	709.81	\N	24.50	0.7441	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
30	13	UG90-2_bp_z05	UG90-2_bp_z05	single	1	\N	\N	\N	153.76	\N	53.69	\N	\N	\N	\N	\N	35.476636	\N	\N	\N	\N	\N	\N	454.835	16.388	129.051	4.404	46.290	14.363	485.540	\N	\N	\N	\N	\N	\N	1.403957	\N	\N	\N	32.49	\N	\N	\N	\N	\N	415.09	6.84	631.36	\N	20.75	0.6443	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
31	13	UG90-2_bp_z06	UG90-2_bp_z06	single	1	\N	\N	\N	169.17	\N	65.90	\N	\N	\N	\N	\N	88.929488	\N	\N	\N	\N	\N	\N	864.595	12.650	240.404	3.622	25.481	2.893	921.721	\N	\N	\N	\N	\N	\N	2.619373	\N	\N	\N	43.96	\N	\N	\N	\N	\N	297.04	2.06	400.93	\N	5.65	0.7339	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
32	13	UG90-2_bp_z07	UG90-2_bp_z07	single	1	\N	\N	\N	157.48	\N	62.19	\N	\N	\N	\N	\N	56.438167	\N	\N	\N	\N	\N	\N	760.538	9.674	244.683	8.604	52.027	3.681	818.713	\N	\N	\N	\N	\N	\N	2.640433	\N	\N	\N	42.59	\N	\N	\N	\N	\N	212.22	1.32	290.59	\N	3.58	0.7252	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
33	13	UG90-2_bp_z08	UG90-2_bp_z08	single	1	\N	\N	\N	216.36	\N	114.05	\N	\N	\N	\N	\N	274.282220	\N	\N	\N	\N	\N	\N	614.561	14.379	183.067	1.622	21.153	1.142	658.064	\N	\N	\N	\N	\N	\N	8.534155	\N	\N	\N	67.97	\N	\N	\N	\N	\N	390.47	4.17	469.06	\N	10.09	0.8265	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
34	14	UG96-1_bp_z01	UG96-1_bp_z01	single	1	\N	\N	\N	162.30	\N	55.50	\N	\N	\N	\N	\N	8.262014	\N	\N	\N	\N	\N	\N	468.011	11.008	171.386	5.831	0.000	0.000	508.715	\N	\N	\N	\N	\N	\N	1.092915	\N	\N	\N	28.81	\N	\N	\N	\N	\N	121.80	1.31	201.29	\N	4.19	0.6009	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
35	14	UG96-1_bp_z02	UG96-1_bp_z02	single	1	\N	\N	\N	114.70	\N	57.00	\N	\N	\N	\N	\N	7.378857	\N	\N	\N	\N	\N	\N	500.061	7.409	119.793	1.753	0.000	0.000	528.512	\N	\N	\N	\N	\N	\N	1.079068	\N	\N	\N	31.88	\N	\N	\N	\N	\N	106.18	0.74	165.45	\N	2.24	0.6384	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
36	14	UG96-1_bp_z03	UG96-1_bp_z03	single	1	\N	\N	\N	108.60	\N	34.60	\N	\N	\N	\N	\N	4.114721	\N	\N	\N	\N	\N	\N	573.511	5.732	143.920	4.321	0.000	0.000	607.692	\N	\N	\N	\N	\N	\N	0.661126	\N	\N	\N	27.74	\N	\N	\N	\N	\N	84.22	0.42	142.47	\N	1.37	0.5881	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
37	14	UG96-1_bp_z04	UG96-1_bp_z04	single	1	\N	\N	\N	156.40	\N	54.10	\N	\N	\N	\N	\N	8.543542	\N	\N	\N	\N	\N	\N	236.568	3.940	91.753	1.361	0.000	0.000	258.359	\N	\N	\N	\N	\N	\N	1.717837	\N	\N	\N	35.55	\N	\N	\N	\N	\N	157.28	1.21	232.37	\N	3.56	0.6724	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
38	14	UG96-1_bp_z05	UG96-1_bp_z05	single	1	\N	\N	\N	251.30	\N	89.70	\N	\N	\N	\N	\N	57.441034	\N	\N	\N	\N	\N	\N	346.329	4.112	108.203	1.953	0.000	0.000	372.027	\N	\N	\N	\N	\N	\N	6.295307	\N	\N	\N	55.91	\N	\N	\N	\N	\N	199.59	1.13	251.65	\N	2.88	0.7895	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
39	14	UG96-1_bp_z06	UG96-1_bp_z06	single	1	\N	\N	\N	141.70	\N	48.20	\N	\N	\N	\N	\N	7.742137	\N	\N	\N	\N	\N	\N	191.282	6.876	83.937	2.104	0.000	0.000	211.217	\N	\N	\N	\N	\N	\N	1.201445	\N	\N	\N	33.25	\N	\N	\N	\N	\N	247.30	3.94	375.89	\N	12.14	0.6505	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
40	9	CP06-52_bp_z01	CP06-52_bp_z01	single	1	\N	\N	\N	172.06	\N	59.74	\N	\N	\N	\N	\N	55.997652	\N	\N	\N	\N	\N	\N	340.851	9.010	301.877	4.537	25.834	1.928	412.578	\N	\N	\N	\N	\N	\N	2.154719	\N	\N	\N	40.12	\N	\N	\N	\N	\N	500.29	5.47	697.84	\N	15.56	0.7046	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
41	9	CP06-52_bp_z02*	CP06-52_bp_z02*	single	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	424.306	3.278	357.165	6.162	24.920	2.517	509.162	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	35.35	\N	\N	\N	\N	\N	557.51	2.13	816.88	\N	6.04	0.6668	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
42	9	CP06-52_bp_z03*	CP06-52_bp_z03*	single	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	677.547	10.263	615.874	9.177	30.355	12.751	823.854	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.04	\N	\N	\N	\N	\N	94.89	0.61	213.96	\N	2.24	0.4392	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
43	9	CP06-52_bp_z04	CP06-52_bp_z04	single	1	\N	\N	\N	136.56	\N	54.84	\N	\N	\N	\N	\N	101.242351	\N	\N	\N	\N	\N	\N	1322.639	35.243	602.917	14.972	29.295	5.709	1465.867	\N	\N	\N	\N	\N	\N	1.278046	\N	\N	\N	34.63	\N	\N	\N	\N	\N	430.83	5.08	637.16	\N	15.31	0.6635	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
44	9	CP06-52_bp_z05	CP06-52_bp_z05	single	1	\N	\N	\N	184.83	\N	51.04	\N	\N	\N	\N	\N	77.360773	\N	\N	\N	\N	\N	\N	562.217	9.609	424.642	9.066	30.642	1.351	663.107	\N	\N	\N	\N	\N	\N	1.684891	\N	\N	\N	34.61	\N	\N	\N	\N	\N	547.22	4.06	808.88	\N	12.33	0.6607	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
45	9	CP06-52_bp_z06*	CP06-52_bp_z06*	single	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	528.818	8.511	297.317	1.918	18.401	3.687	599.453	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	54.69	\N	\N	\N	\N	\N	514.60	3.61	648.98	\N	9.16	0.7833	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
46	9	CP06-52_bp_z07*	CP06-52_bp_z07*	single	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	706.319	21.171	248.990	4.218	27.564	4.029	765.487	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	56.12	\N	\N	\N	\N	\N	354.87	4.79	445.53	\N	12.02	0.7900	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
47	9	CP06-52_bp_z08*	CP06-52_bp_z08*	single	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	627.449	7.346	343.977	3.677	24.781	2.052	709.173	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	51.33	\N	\N	\N	\N	\N	394.35	2.13	507.36	\N	5.42	0.7694	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
48	9	CP06-52_bp_z09	CP06-52_bp_z09	single	1	\N	\N	\N	167.80	\N	76.60	\N	\N	\N	\N	\N	53.393960	\N	\N	\N	\N	\N	\N	230.613	3.951	182.329	5.513	0.000	0.000	273.916	\N	\N	\N	\N	\N	\N	3.112664	\N	\N	\N	47.62	\N	\N	\N	\N	\N	497.25	3.78	653.58	\N	10.08	0.7503	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
49	9	CP06-52_bp_z10	CP06-52_bp_z10	single	1	\N	\N	\N	138.50	\N	88.70	\N	\N	\N	\N	\N	46.317279	\N	\N	\N	\N	\N	\N	260.145	4.228	185.458	6.029	0.000	0.000	304.191	\N	\N	\N	\N	\N	\N	2.249550	\N	\N	\N	43.56	\N	\N	\N	\N	\N	535.35	3.93	722.83	\N	10.56	0.7282	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
50	9	CP06-52_bp_z11	CP06-52_bp_z11	single	1	\N	\N	\N	108.90	\N	85.70	\N	\N	\N	\N	\N	45.321905	\N	\N	\N	\N	\N	\N	233.437	3.872	211.858	3.208	0.000	0.000	283.753	\N	\N	\N	\N	\N	\N	2.318231	\N	\N	\N	43.77	\N	\N	\N	\N	\N	545.14	4.06	736.07	\N	10.73	0.7282	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616
\.


--
-- Data for Name: mounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mounts (id, mount_id, mount_name, mount_date, sample_id, etchant_chemical, etch_duration_seconds, etch_temperature_c, created_at) FROM stdin;
\.


--
-- Data for Name: people; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.people (id, orcid, name, email, affiliation, created_at) FROM stdin;
1	\N	B.A. Peak	\N	\N	2025-11-18 03:15:39.999524
2	\N	R.M. Flowers	\N	\N	2025-11-18 03:15:39.999524
3	\N	R.E. Havranek	\N	\N	2025-11-18 03:15:39.999524
4	\N	J.B. Barnes	\N	\N	2025-11-18 03:15:39.999524
5	\N	K.E. Karlstrom	\N	\N	2025-11-18 03:15:39.999524
6	\N	M. Fox	\N	\N	2025-11-18 03:15:39.999524
7	\N	McMillan, M.E.	\N	\N	2025-11-18 03:15:46.20546
8	\N	Boone, S.C.	\N	\N	2025-11-18 03:15:46.20546
9	\N	Roberts, E.M.	\N	\N	2025-11-18 03:15:46.20546
10	\N	Stevens, N.J.	\N	\N	2025-11-18 03:15:46.20546
11	\N	Gottfried, M.D.	\N	\N	2025-11-18 03:15:46.20546
12	\N	O'Connor, P.M.	\N	\N	2025-11-18 03:15:46.20546
13	\N	Bacon, C.R.	\N	\N	2025-11-18 03:15:52.365388
14	\N	O'Sullivan, P.B.	\N	\N	2025-11-18 03:15:52.365388
15	\N	Day, W.C.	\N	\N	2025-11-18 03:15:52.365388
\.


--
-- Data for Name: reference_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reference_materials (id, batch_id, material_name, material_type, expected_age_ma, expected_age_error_ma, measured_age_ma, measured_age_error_ma, parameter_type, measured_value, expected_value, error, created_at) FROM stdin;
1	1	Durango	apatite	31.44	0.18	31.20	1.90	\N	\N	\N	\N	2025-11-17 14:12:36.408539
2	2	Durango	apatite	31.44	0.18	31.60	2.00	\N	\N	\N	\N	2025-11-17 14:12:36.408539
3	3	Durango	apatite	31.44	0.18	31.50	2.00	\N	\N	\N	\N	2025-11-17 14:12:36.408539
4	4	Durango	apatite	31.44	0.18	31.70	2.00	\N	\N	\N	\N	2025-11-17 14:12:36.408539
\.


--
-- Data for Name: sample_people_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sample_people_roles (id, sample_id, person_id, role, created_at) FROM stdin;
\.


--
-- Data for Name: samples; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.samples (sample_id, dataset_id, igsn, latitude, longitude, elevation_m, geodetic_datum, vertical_datum, lat_long_precision_m, lithology, mineral_type, sample_kind, sample_method, sample_depth_m, sampling_location_information, stratigraphic_unit, chronostratigraphic_unit_age, sample_age_ma, sample_collector, collection_date, analyst, analysis_method, last_known_sample_archive, associated_references, n_aft_grains, n_ahe_grains, created_at, updated_at) FROM stdin;
MU19-17	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	33	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:14.20288
MU19-24	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	33	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:15.334856
MU19-25	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	33	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:15.602599
MU19-26	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	32	0	2025-11-17 18:45:24.307726	2025-11-17 18:51:15.82665
MU19-29	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	0	2025-11-17 18:45:24.755225	2025-11-17 18:51:16.340282
MU19-30	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	0	2025-11-17 18:45:24.97989	2025-11-17 18:51:16.627079
CP06	4	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	zircon	in situ rock	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616	2025-11-17 13:50:27.078157
CP06-52	4	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	zircon	in situ rock	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616	2025-11-17 13:50:27.078157
CP06-65	4	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	zircon	in situ rock	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616	2025-11-17 13:50:27.078157
CP06-69	4	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	zircon	in situ rock	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616	2025-11-17 13:50:27.078157
CP06-72	4	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	zircon	in situ rock	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616	2025-11-17 13:50:27.078157
UG90-2	4	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	zircon	in situ rock	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616	2025-11-17 13:50:27.078157
UG96-1	4	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	zircon	in situ rock	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:39:15.060616	2025-11-17 13:50:27.078157
MU19-33	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	32	0	2025-11-17 18:45:25.201063	2025-11-17 18:51:16.849223
MU19-36	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	32	0	2025-11-17 18:45:25.646566	2025-11-17 18:51:17.297784
MU19-37	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	31	0	2025-11-17 18:45:25.868093	2025-11-17 18:51:17.551241
MU19-39	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	32	0	2025-11-17 18:45:26.087478	2025-11-17 18:51:17.854531
MU19-47	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	33	0	2025-11-17 18:45:26.310098	2025-11-17 18:51:18.077188
MU19-48	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13	0	2025-11-17 18:45:26.532342	2025-11-17 18:51:18.300585
MU19-49	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	0	2025-11-17 18:45:26.756793	2025-11-17 18:51:18.52412
MU19-12	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	33	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:13.076679
MU19-18	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	28	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:14.426353
MU19-20	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	33	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:14.647662
MU19-22	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	0	2025-11-17 18:45:23.415661	2025-11-17 18:51:14.888
MU19-28	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	0	2025-11-17 18:45:24.530066	2025-11-17 18:51:16.114881
MU19-34	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	0	2025-11-17 18:45:25.421522	2025-11-17 18:51:17.07232
MU19-50	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	33	0	2025-11-17 18:45:26.980735	2025-11-17 18:51:18.77676
MU19-51	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	33	0	2025-11-17 18:45:27.204141	2025-11-17 18:51:19.040896
MU19-52	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21	0	2025-11-17 18:45:27.426856	2025-11-17 18:51:19.261562
MU19-53	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	0	2025-11-17 18:45:27.645897	2025-11-17 18:51:19.486144
MU19-54	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	36	0	2025-11-17 18:45:27.867399	2025-11-17 18:51:19.709188
13	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
15	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
MU19-05	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	0	2025-11-17 18:45:20.503293	2025-11-17 18:51:11.915812
MU19-06	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	32	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:12.134784
MU19-08	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	35	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:12.355708
MU19-09	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	33	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:12.63053
MU19-11	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	0	2025-11-17 18:45:21.415211	2025-11-17 18:51:12.852891
MU19-13	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	32	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:13.299566
MU19-14	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	32	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:13.521763
MU19-15	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	27	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:13.758607
MU19-16	5	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	31	0	2025-11-17 14:13:46.11328	2025-11-17 18:51:13.980133
MU19-23	5	\N	-13.5000000	34.8000000	\N	WGS84	mean sea level	\N	Precambrian basement	apatite	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	33	0	2025-11-17 18:45:23.635659	2025-11-17 18:51:15.110225
20	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
21	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
22	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
24	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
26	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
27	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
28	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
30	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
31	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
32	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
33	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
35	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
36	6	\N	\N	\N	\N	WGS84	mean sea level	\N	\N	apatite	\N	\N	\N	\N	\N	\N	\N	\N	2019-01-01	\N	\N	\N	\N	\N	\N	2025-11-17 14:13:46.11328	2025-11-18 03:19:40.536257
\.


--
-- Name: ahe_grain_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ahe_grain_data_id_seq', 1, false);


--
-- Name: batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.batches_id_seq', 4, true);


--
-- Name: data_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.data_files_id_seq', 74, true);


--
-- Name: datapoint_people_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.datapoint_people_roles_id_seq', 1, false);


--
-- Name: dataset_people_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dataset_people_roles_id_seq', 15, true);


--
-- Name: datasets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.datasets_id_seq', 6, true);


--
-- Name: fair_score_breakdown_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fair_score_breakdown_id_seq', 3, true);


--
-- Name: ft_binned_length_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ft_binned_length_data_id_seq', 1, false);


--
-- Name: ft_count_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ft_count_data_id_seq', 1, false);


--
-- Name: ft_datapoints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ft_datapoints_id_seq', 102, true);


--
-- Name: ft_single_grain_ages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ft_single_grain_ages_id_seq', 1, false);


--
-- Name: ft_track_length_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ft_track_length_data_id_seq', 1951, true);


--
-- Name: grains_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.grains_id_seq', 1, false);


--
-- Name: he_datapoints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.he_datapoints_id_seq', 29, true);


--
-- Name: he_whole_grain_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.he_whole_grain_data_id_seq', 150, true);


--
-- Name: mounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mounts_id_seq', 1, false);


--
-- Name: people_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.people_id_seq', 15, true);


--
-- Name: reference_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reference_materials_id_seq', 4, true);


--
-- Name: sample_people_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sample_people_roles_id_seq', 1, false);


--
-- Name: ahe_grain_data ahe_grain_data_lab_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ahe_grain_data
    ADD CONSTRAINT ahe_grain_data_lab_no_key UNIQUE (lab_no);


--
-- Name: ahe_grain_data ahe_grain_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ahe_grain_data
    ADD CONSTRAINT ahe_grain_data_pkey PRIMARY KEY (id);


--
-- Name: batches batches_batch_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_batch_name_key UNIQUE (batch_name);


--
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (id);


--
-- Name: data_files data_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_files
    ADD CONSTRAINT data_files_pkey PRIMARY KEY (id);


--
-- Name: datapoint_people_roles datapoint_people_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datapoint_people_roles
    ADD CONSTRAINT datapoint_people_roles_pkey PRIMARY KEY (id);


--
-- Name: dataset_people_roles dataset_people_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dataset_people_roles
    ADD CONSTRAINT dataset_people_roles_pkey PRIMARY KEY (id);


--
-- Name: datasets datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_pkey PRIMARY KEY (id);


--
-- Name: fair_score_breakdown fair_score_breakdown_dataset_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fair_score_breakdown
    ADD CONSTRAINT fair_score_breakdown_dataset_id_key UNIQUE (dataset_id);


--
-- Name: fair_score_breakdown fair_score_breakdown_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fair_score_breakdown
    ADD CONSTRAINT fair_score_breakdown_pkey PRIMARY KEY (id);


--
-- Name: ft_binned_length_data ft_binned_length_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_binned_length_data
    ADD CONSTRAINT ft_binned_length_data_pkey PRIMARY KEY (id);


--
-- Name: ft_count_data ft_count_data_ft_datapoint_id_grain_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_count_data
    ADD CONSTRAINT ft_count_data_ft_datapoint_id_grain_id_key UNIQUE (ft_datapoint_id, grain_id);


--
-- Name: ft_count_data ft_count_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_count_data
    ADD CONSTRAINT ft_count_data_pkey PRIMARY KEY (id);


--
-- Name: ft_datapoints ft_datapoints_datapoint_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_datapoints
    ADD CONSTRAINT ft_datapoints_datapoint_key_key UNIQUE (datapoint_key);


--
-- Name: ft_datapoints ft_datapoints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_datapoints
    ADD CONSTRAINT ft_datapoints_pkey PRIMARY KEY (id);


--
-- Name: ft_single_grain_ages ft_single_grain_ages_ft_datapoint_id_grain_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_single_grain_ages
    ADD CONSTRAINT ft_single_grain_ages_ft_datapoint_id_grain_id_key UNIQUE (ft_datapoint_id, grain_id);


--
-- Name: ft_single_grain_ages ft_single_grain_ages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_single_grain_ages
    ADD CONSTRAINT ft_single_grain_ages_pkey PRIMARY KEY (id);


--
-- Name: ft_track_length_data ft_track_length_data_ft_datapoint_id_grain_id_track_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_track_length_data
    ADD CONSTRAINT ft_track_length_data_ft_datapoint_id_grain_id_track_id_key UNIQUE (ft_datapoint_id, grain_id, track_id);


--
-- Name: ft_track_length_data ft_track_length_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_track_length_data
    ADD CONSTRAINT ft_track_length_data_pkey PRIMARY KEY (id);


--
-- Name: grains grains_grain_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grains
    ADD CONSTRAINT grains_grain_id_key UNIQUE (grain_id);


--
-- Name: grains grains_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grains
    ADD CONSTRAINT grains_pkey PRIMARY KEY (id);


--
-- Name: he_datapoints he_datapoints_datapoint_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_datapoints
    ADD CONSTRAINT he_datapoints_datapoint_key_key UNIQUE (datapoint_key);


--
-- Name: he_datapoints he_datapoints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_datapoints
    ADD CONSTRAINT he_datapoints_pkey PRIMARY KEY (id);


--
-- Name: he_whole_grain_data he_whole_grain_data_lab_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_whole_grain_data
    ADD CONSTRAINT he_whole_grain_data_lab_no_key UNIQUE (lab_no);


--
-- Name: he_whole_grain_data he_whole_grain_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_whole_grain_data
    ADD CONSTRAINT he_whole_grain_data_pkey PRIMARY KEY (id);


--
-- Name: mounts mounts_mount_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mounts
    ADD CONSTRAINT mounts_mount_id_key UNIQUE (mount_id);


--
-- Name: mounts mounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mounts
    ADD CONSTRAINT mounts_pkey PRIMARY KEY (id);


--
-- Name: people people_orcid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_orcid_key UNIQUE (orcid);


--
-- Name: people people_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_pkey PRIMARY KEY (id);


--
-- Name: reference_materials reference_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_materials
    ADD CONSTRAINT reference_materials_pkey PRIMARY KEY (id);


--
-- Name: sample_people_roles sample_people_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sample_people_roles
    ADD CONSTRAINT sample_people_roles_pkey PRIMARY KEY (id);


--
-- Name: sample_people_roles sample_people_roles_sample_id_person_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sample_people_roles
    ADD CONSTRAINT sample_people_roles_sample_id_person_id_role_key UNIQUE (sample_id, person_id, role);


--
-- Name: samples samples_igsn_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_igsn_key UNIQUE (igsn);


--
-- Name: samples samples_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_pkey PRIMARY KEY (sample_id);


--
-- Name: dataset_people_roles unique_dataset_person_role; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dataset_people_roles
    ADD CONSTRAINT unique_dataset_person_role UNIQUE (dataset_id, person_id, role);


--
-- Name: idx_ahe_age; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ahe_age ON public.ahe_grain_data USING btree (corr_age_ma);


--
-- Name: idx_ahe_lab_no; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ahe_lab_no ON public.ahe_grain_data USING btree (lab_no);


--
-- Name: idx_ahe_sample; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ahe_sample ON public.ahe_grain_data USING btree (sample_id);


--
-- Name: idx_batches_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batches_date ON public.batches USING btree (analysis_date);


--
-- Name: idx_batches_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batches_name ON public.batches USING btree (batch_name);


--
-- Name: idx_data_files_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_files_category ON public.data_files USING btree (category);


--
-- Name: idx_data_files_dataset; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_files_dataset ON public.data_files USING btree (dataset_id);


--
-- Name: idx_data_files_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_files_type ON public.data_files USING btree (file_type);


--
-- Name: idx_data_files_upload_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_files_upload_status ON public.data_files USING btree (upload_status);


--
-- Name: idx_datapoint_people_datapoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datapoint_people_datapoint ON public.datapoint_people_roles USING btree (datapoint_id, datapoint_type);


--
-- Name: idx_datapoint_people_person; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datapoint_people_person ON public.datapoint_people_roles USING btree (person_id);


--
-- Name: idx_dataset_people_dataset; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dataset_people_dataset ON public.dataset_people_roles USING btree (dataset_id);


--
-- Name: idx_dataset_people_person; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dataset_people_person ON public.dataset_people_roles USING btree (person_id);


--
-- Name: idx_dataset_people_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dataset_people_role ON public.dataset_people_roles USING btree (role);


--
-- Name: idx_fair_breakdown_dataset; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fair_breakdown_dataset ON public.fair_score_breakdown USING btree (dataset_id);


--
-- Name: idx_fair_breakdown_grade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fair_breakdown_grade ON public.fair_score_breakdown USING btree (grade);


--
-- Name: idx_ft_binned_length_datapoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_binned_length_datapoint ON public.ft_binned_length_data USING btree (ft_datapoint_id);


--
-- Name: idx_ft_count_data_datapoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_count_data_datapoint ON public.ft_count_data USING btree (ft_datapoint_id);


--
-- Name: idx_ft_count_data_grain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_count_data_grain ON public.ft_count_data USING btree (grain_id);


--
-- Name: idx_ft_datapoints_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_datapoints_batch ON public.ft_datapoints USING btree (batch_id);


--
-- Name: idx_ft_datapoints_central_age; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_datapoints_central_age ON public.ft_datapoints USING btree (central_age_ma);


--
-- Name: idx_ft_datapoints_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_datapoints_key ON public.ft_datapoints USING btree (datapoint_key);


--
-- Name: idx_ft_datapoints_sample; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_datapoints_sample ON public.ft_datapoints USING btree (sample_id);


--
-- Name: idx_ft_single_grain_datapoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_single_grain_datapoint ON public.ft_single_grain_ages USING btree (ft_datapoint_id);


--
-- Name: idx_ft_single_grain_grain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_single_grain_grain ON public.ft_single_grain_ages USING btree (grain_id);


--
-- Name: idx_ft_track_length_datapoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_track_length_datapoint ON public.ft_track_length_data USING btree (ft_datapoint_id);


--
-- Name: idx_ft_track_length_grain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_track_length_grain ON public.ft_track_length_data USING btree (grain_id);


--
-- Name: idx_ft_track_length_mtl; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_track_length_mtl ON public.ft_track_length_data USING btree (true_length_um);


--
-- Name: idx_grains_grain_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_grains_grain_id ON public.grains USING btree (grain_id);


--
-- Name: idx_grains_mount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_grains_mount ON public.grains USING btree (mount_id);


--
-- Name: idx_he_datapoints_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_datapoints_batch ON public.he_datapoints USING btree (batch_id);


--
-- Name: idx_he_datapoints_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_datapoints_key ON public.he_datapoints USING btree (datapoint_key);


--
-- Name: idx_he_datapoints_sample; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_datapoints_sample ON public.he_datapoints USING btree (sample_id);


--
-- Name: idx_he_whole_grain_age; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_whole_grain_age ON public.he_whole_grain_data USING btree (corr_age_ma);


--
-- Name: idx_he_whole_grain_datapoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_whole_grain_datapoint ON public.he_whole_grain_data USING btree (he_datapoint_id);


--
-- Name: idx_he_whole_grain_lab_no; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_whole_grain_lab_no ON public.he_whole_grain_data USING btree (lab_no);


--
-- Name: idx_mounts_mount_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mounts_mount_id ON public.mounts USING btree (mount_id);


--
-- Name: idx_mounts_sample; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mounts_sample ON public.mounts USING btree (sample_id);


--
-- Name: idx_people_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_people_name ON public.people USING btree (name);


--
-- Name: idx_people_orcid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_people_orcid ON public.people USING btree (orcid) WHERE (orcid IS NOT NULL);


--
-- Name: idx_ref_materials_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ref_materials_batch ON public.reference_materials USING btree (batch_id);


--
-- Name: idx_ref_materials_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ref_materials_name ON public.reference_materials USING btree (material_name);


--
-- Name: idx_sample_people_person; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sample_people_person ON public.sample_people_roles USING btree (person_id);


--
-- Name: idx_sample_people_sample; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sample_people_sample ON public.sample_people_roles USING btree (sample_id);


--
-- Name: idx_samples_dataset; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_samples_dataset ON public.samples USING btree (dataset_id);


--
-- Name: idx_samples_igsn; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_samples_igsn ON public.samples USING btree (igsn) WHERE (igsn IS NOT NULL);


--
-- Name: idx_samples_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_samples_location ON public.samples USING btree (latitude, longitude);


--
-- Name: idx_samples_mineral; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_samples_mineral ON public.samples USING btree (mineral_type);


--
-- Name: samples update_samples_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_samples_updated_at BEFORE UPDATE ON public.samples FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ahe_grain_data ahe_grain_data_sample_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ahe_grain_data
    ADD CONSTRAINT ahe_grain_data_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(sample_id) ON DELETE CASCADE;


--
-- Name: data_files data_files_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_files
    ADD CONSTRAINT data_files_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE CASCADE;


--
-- Name: datapoint_people_roles datapoint_people_roles_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datapoint_people_roles
    ADD CONSTRAINT datapoint_people_roles_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;


--
-- Name: fair_score_breakdown fair_score_breakdown_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fair_score_breakdown
    ADD CONSTRAINT fair_score_breakdown_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE CASCADE;


--
-- Name: dataset_people_roles fk_dataset_people_dataset; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dataset_people_roles
    ADD CONSTRAINT fk_dataset_people_dataset FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE CASCADE;


--
-- Name: dataset_people_roles fk_dataset_people_person; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dataset_people_roles
    ADD CONSTRAINT fk_dataset_people_person FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;


--
-- Name: ft_binned_length_data ft_binned_length_data_ft_datapoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_binned_length_data
    ADD CONSTRAINT ft_binned_length_data_ft_datapoint_id_fkey FOREIGN KEY (ft_datapoint_id) REFERENCES public.ft_datapoints(id) ON DELETE CASCADE;


--
-- Name: ft_count_data ft_count_data_ft_datapoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_count_data
    ADD CONSTRAINT ft_count_data_ft_datapoint_id_fkey FOREIGN KEY (ft_datapoint_id) REFERENCES public.ft_datapoints(id) ON DELETE CASCADE;


--
-- Name: ft_datapoints ft_datapoints_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_datapoints
    ADD CONSTRAINT ft_datapoints_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: ft_single_grain_ages ft_single_grain_ages_ft_datapoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_single_grain_ages
    ADD CONSTRAINT ft_single_grain_ages_ft_datapoint_id_fkey FOREIGN KEY (ft_datapoint_id) REFERENCES public.ft_datapoints(id) ON DELETE CASCADE;


--
-- Name: ft_track_length_data ft_track_length_data_ft_datapoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_track_length_data
    ADD CONSTRAINT ft_track_length_data_ft_datapoint_id_fkey FOREIGN KEY (ft_datapoint_id) REFERENCES public.ft_datapoints(id) ON DELETE CASCADE;


--
-- Name: grains grains_mount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grains
    ADD CONSTRAINT grains_mount_id_fkey FOREIGN KEY (mount_id) REFERENCES public.mounts(mount_id) ON DELETE SET NULL;


--
-- Name: he_datapoints he_datapoints_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_datapoints
    ADD CONSTRAINT he_datapoints_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: he_whole_grain_data he_whole_grain_data_he_datapoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_whole_grain_data
    ADD CONSTRAINT he_whole_grain_data_he_datapoint_id_fkey FOREIGN KEY (he_datapoint_id) REFERENCES public.he_datapoints(id) ON DELETE CASCADE;


--
-- Name: reference_materials reference_materials_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_materials
    ADD CONSTRAINT reference_materials_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;


--
-- Name: sample_people_roles sample_people_roles_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sample_people_roles
    ADD CONSTRAINT sample_people_roles_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;


--
-- Name: samples samples_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id);


--
-- PostgreSQL database dump complete
--

