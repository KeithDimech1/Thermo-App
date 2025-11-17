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
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_dataset_modified_date(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_dataset_modified_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.last_modified_date = CURRENT_DATE;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_dataset_modified_date() OWNER TO neondb_owner;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ahe_grain_data; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.ahe_grain_data OWNER TO neondb_owner;

--
-- Name: TABLE ahe_grain_data; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.ahe_grain_data IS '(U-Th)/He grain-level results';


--
-- Name: COLUMN ahe_grain_data.terminations; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.ahe_grain_data.terminations IS 'Grain termination count (e.g., 0T, 1T, 2T)';


--
-- Name: COLUMN ahe_grain_data.eu_ppm; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.ahe_grain_data.eu_ppm IS 'Effective uranium (U + 0.235*Th)';


--
-- Name: COLUMN ahe_grain_data.ft; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.ahe_grain_data.ft IS 'Alpha ejection correction factor (Ft)';


--
-- Name: ahe_grain_data_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ahe_grain_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ahe_grain_data_id_seq OWNER TO neondb_owner;

--
-- Name: ahe_grain_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ahe_grain_data_id_seq OWNED BY public.ahe_grain_data.id;


--
-- Name: batches; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.batches OWNER TO neondb_owner;

--
-- Name: TABLE batches; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.batches IS 'Analytical batches linking unknowns to reference materials for QC';


--
-- Name: COLUMN batches.thermal_neutron_dose; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.batches.thermal_neutron_dose IS 'Neutron fluence (neutrons/cm²) for EDM irradiation';


--
-- Name: batches_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.batches_id_seq OWNER TO neondb_owner;

--
-- Name: batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.batches_id_seq OWNED BY public.batches.id;


--
-- Name: datapoint_people_roles; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.datapoint_people_roles OWNER TO neondb_owner;

--
-- Name: TABLE datapoint_people_roles; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.datapoint_people_roles IS 'Links datapoints to people with roles (analyst, technician, etc.)';


--
-- Name: datapoint_people_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.datapoint_people_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.datapoint_people_roles_id_seq OWNER TO neondb_owner;

--
-- Name: datapoint_people_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.datapoint_people_roles_id_seq OWNED BY public.datapoint_people_roles.id;


--
-- Name: datasets; Type: TABLE; Schema: public; Owner: neondb_owner
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.datasets OWNER TO neondb_owner;

--
-- Name: TABLE datasets; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.datasets IS 'Dataset-level metadata for data organization';


--
-- Name: datasets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.datasets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.datasets_id_seq OWNER TO neondb_owner;

--
-- Name: datasets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.datasets_id_seq OWNED BY public.datasets.id;


--
-- Name: ft_ages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ft_ages (
    id integer NOT NULL,
    sample_id character varying(50) NOT NULL,
    age_equation character varying(100),
    ft_age_type character varying(50),
    lambda_d character varying(20),
    lambda_f character varying(20),
    zeta_yr_cm2 numeric(12,6),
    zeta_error_yr_cm2 numeric(12,6),
    dosimeter character varying(50),
    rs_um numeric(8,3),
    q numeric(6,4),
    irradiation_reactor character varying(100),
    n_grains integer,
    pooled_age_ma numeric(10,2),
    pooled_age_error_ma numeric(10,2),
    central_age_ma numeric(10,2),
    central_age_error_ma numeric(10,2),
    dispersion_pct numeric(6,3),
    p_chi2 numeric(8,6),
    age_peak_software character varying(100),
    best_fit_peak_ages_ma numeric(10,2)[],
    best_fit_peak_errors_ma numeric(10,2)[],
    best_fit_peak_grain_pct numeric(6,2)[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_age_type CHECK (((ft_age_type)::text = ANY ((ARRAY['pooled'::character varying, 'central'::character varying, 'mixed'::character varying, NULL::character varying])::text[])))
);


ALTER TABLE public.ft_ages OWNER TO neondb_owner;

--
-- Name: TABLE ft_ages; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.ft_ages IS 'Fission-track age results (FAIR Table 10)';


--
-- Name: COLUMN ft_ages.ft_age_type; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.ft_ages.ft_age_type IS 'Age calculation method: pooled, central, or mixed (mixture modeling)';


--
-- Name: ft_ages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ft_ages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ft_ages_id_seq OWNER TO neondb_owner;

--
-- Name: ft_ages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ft_ages_id_seq OWNED BY public.ft_ages.id;


--
-- Name: ft_binned_length_data; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.ft_binned_length_data OWNER TO neondb_owner;

--
-- Name: TABLE ft_binned_length_data; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.ft_binned_length_data IS 'Fission-track binned length histograms (legacy data format)';


--
-- Name: ft_binned_length_data_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ft_binned_length_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ft_binned_length_data_id_seq OWNER TO neondb_owner;

--
-- Name: ft_binned_length_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ft_binned_length_data_id_seq OWNED BY public.ft_binned_length_data.id;


--
-- Name: ft_count_data; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.ft_count_data OWNER TO neondb_owner;

--
-- Name: TABLE ft_count_data; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.ft_count_data IS 'Fission-track grain-by-grain count data (EarthBank FTCountData sheet)';


--
-- Name: ft_count_data_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ft_count_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ft_count_data_id_seq OWNER TO neondb_owner;

--
-- Name: ft_count_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ft_count_data_id_seq OWNED BY public.ft_count_data.id;


--
-- Name: ft_counts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ft_counts (
    id integer NOT NULL,
    sample_id character varying(50) NOT NULL,
    grain_id character varying(100) NOT NULL,
    ns integer,
    rho_s_cm2 numeric(12,2),
    u_ppm numeric(10,3),
    u_1sigma numeric(10,3),
    th_ppm numeric(10,3),
    th_1sigma numeric(10,3),
    eu_ppm numeric(10,3),
    eu_1sigma numeric(10,3),
    dpar_um numeric(6,3),
    dpar_sd_um numeric(6,3),
    dper_um numeric(6,3),
    dper_sd_um numeric(6,3),
    cl_wt_pct numeric(6,4),
    ecl_apfu numeric(8,4),
    rmr0 numeric(6,4),
    rmr0d numeric(6,4),
    p_chi2_pct numeric(6,3),
    disp_pct numeric(6,3),
    n_grains integer,
    ft_counting_method character varying(50),
    ft_software character varying(100),
    ft_algorithm character varying(50),
    microscope character varying(100),
    objective character varying(50),
    analyst character varying(100),
    laboratory character varying(100),
    analysis_date date,
    sample_mount_id character varying(50),
    etching_conditions character varying(200),
    counting_area_cm2 numeric(10,6),
    ni integer,
    nd integer,
    rho_i_cm2 numeric(12,2),
    rho_d_cm2 numeric(12,2),
    dosimeter character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ft_counts OWNER TO neondb_owner;

--
-- Name: TABLE ft_counts; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.ft_counts IS 'Fission-track count data (FAIR Table 5)';


--
-- Name: COLUMN ft_counts.grain_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.ft_counts.grain_id IS 'Grain identifier (sample_id_aggregate for sample-level data)';


--
-- Name: ft_counts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ft_counts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ft_counts_id_seq OWNER TO neondb_owner;

--
-- Name: ft_counts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ft_counts_id_seq OWNED BY public.ft_counts.id;


--
-- Name: ft_datapoints; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.ft_datapoints OWNER TO neondb_owner;

--
-- Name: TABLE ft_datapoints; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.ft_datapoints IS 'Fission-track analytical sessions (EarthBank FT Datapoints sheet)';


--
-- Name: COLUMN ft_datapoints.datapoint_key; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.ft_datapoints.datapoint_key IS 'User-provided unique identifier for this analytical session';


--
-- Name: COLUMN ft_datapoints.ft_method; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.ft_datapoints.ft_method IS 'EDM, LA-ICP-MS, or Population method';


--
-- Name: ft_datapoints_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ft_datapoints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ft_datapoints_id_seq OWNER TO neondb_owner;

--
-- Name: ft_datapoints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ft_datapoints_id_seq OWNED BY public.ft_datapoints.id;


--
-- Name: ft_single_grain_ages; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.ft_single_grain_ages OWNER TO neondb_owner;

--
-- Name: TABLE ft_single_grain_ages; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.ft_single_grain_ages IS 'Fission-track single grain ages (EarthBank FTSingleGrain sheet)';


--
-- Name: ft_single_grain_ages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ft_single_grain_ages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ft_single_grain_ages_id_seq OWNER TO neondb_owner;

--
-- Name: ft_single_grain_ages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ft_single_grain_ages_id_seq OWNED BY public.ft_single_grain_ages.id;


--
-- Name: ft_track_length_data; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.ft_track_length_data OWNER TO neondb_owner;

--
-- Name: TABLE ft_track_length_data; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.ft_track_length_data IS 'Fission-track individual track measurements (EarthBank FTLengthData sheet)';


--
-- Name: COLUMN ft_track_length_data.track_type; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.ft_track_length_data.track_type IS 'TINT (track-in-track) or TINCLE (track-in-cleavage)';


--
-- Name: ft_track_length_data_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ft_track_length_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ft_track_length_data_id_seq OWNER TO neondb_owner;

--
-- Name: ft_track_length_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ft_track_length_data_id_seq OWNED BY public.ft_track_length_data.id;


--
-- Name: ft_track_lengths; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ft_track_lengths (
    id integer NOT NULL,
    sample_id character varying(50) NOT NULL,
    grain_id character varying(100) NOT NULL,
    n_confined_tracks integer,
    mean_track_length_um numeric(6,3),
    mean_track_length_se_um numeric(6,3),
    mean_track_length_sd_um numeric(6,3),
    dpar_um numeric(6,3),
    dpar_sd_um numeric(6,3),
    dper_um numeric(6,3),
    dper_sd_um numeric(6,3),
    apparent_length_um numeric(6,3),
    true_length_um numeric(6,3),
    angle_to_c_axis_deg numeric(6,2),
    azimuth_deg numeric(6,2),
    dip_deg numeric(6,2),
    corrected_z_depth_um numeric(8,2),
    ft_length_method character varying(50),
    ft_software character varying(100),
    ft_track_type character varying(20),
    microscope character varying(100),
    objective character varying(50),
    analyst character varying(100),
    laboratory character varying(100),
    analysis_date date,
    sample_mount_id character varying(50),
    etching_conditions character varying(200),
    cf252_irradiation boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_track_type CHECK (((ft_track_type)::text = ANY ((ARRAY['TINT'::character varying, 'TINCLE'::character varying, NULL::character varying])::text[])))
);


ALTER TABLE public.ft_track_lengths OWNER TO neondb_owner;

--
-- Name: TABLE ft_track_lengths; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.ft_track_lengths IS 'Fission-track length measurements (FAIR Table 6)';


--
-- Name: COLUMN ft_track_lengths.ft_track_type; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.ft_track_lengths.ft_track_type IS 'Track type: TINT (track-in-track) or TINCLE (track-in-cleavage)';


--
-- Name: ft_track_lengths_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ft_track_lengths_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ft_track_lengths_id_seq OWNER TO neondb_owner;

--
-- Name: ft_track_lengths_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ft_track_lengths_id_seq OWNED BY public.ft_track_lengths.id;


--
-- Name: grains; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.grains OWNER TO neondb_owner;

--
-- Name: TABLE grains; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.grains IS 'Individual grains within mounts (enables cross-method linking)';


--
-- Name: grains_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.grains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grains_id_seq OWNER TO neondb_owner;

--
-- Name: grains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.grains_id_seq OWNED BY public.grains.id;


--
-- Name: he_datapoints; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.he_datapoints OWNER TO neondb_owner;

--
-- Name: TABLE he_datapoints; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.he_datapoints IS '(U-Th)/He analytical sessions (EarthBank He Datapoints sheet)';


--
-- Name: he_datapoints_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.he_datapoints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.he_datapoints_id_seq OWNER TO neondb_owner;

--
-- Name: he_datapoints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.he_datapoints_id_seq OWNED BY public.he_datapoints.id;


--
-- Name: he_whole_grain_data; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.he_whole_grain_data OWNER TO neondb_owner;

--
-- Name: TABLE he_whole_grain_data; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.he_whole_grain_data IS '(U-Th)/He grain-level results (EarthBank HeWholeGrain sheet)';


--
-- Name: COLUMN he_whole_grain_data.eu_ppm; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.he_whole_grain_data.eu_ppm IS 'Effective uranium (U + 0.235*Th)';


--
-- Name: COLUMN he_whole_grain_data.ft; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.he_whole_grain_data.ft IS 'Alpha ejection correction factor (Ft)';


--
-- Name: COLUMN he_whole_grain_data.terminations; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.he_whole_grain_data.terminations IS 'Grain termination count (e.g., 0T, 1T, 2T)';


--
-- Name: he_whole_grain_data_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.he_whole_grain_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.he_whole_grain_data_id_seq OWNER TO neondb_owner;

--
-- Name: he_whole_grain_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.he_whole_grain_data_id_seq OWNED BY public.he_whole_grain_data.id;


--
-- Name: mounts; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.mounts OWNER TO neondb_owner;

--
-- Name: TABLE mounts; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.mounts IS 'Physical epoxy mounts containing grains';


--
-- Name: mounts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.mounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mounts_id_seq OWNER TO neondb_owner;

--
-- Name: mounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mounts_id_seq OWNED BY public.mounts.id;


--
-- Name: people; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.people OWNER TO neondb_owner;

--
-- Name: TABLE people; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.people IS 'Individuals involved in sample collection, analysis, or research';


--
-- Name: COLUMN people.orcid; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.people.orcid IS 'ORCID ID for unique researcher identification (optional)';


--
-- Name: people_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.people_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.people_id_seq OWNER TO neondb_owner;

--
-- Name: people_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.people_id_seq OWNED BY public.people.id;


--
-- Name: reference_materials; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.reference_materials OWNER TO neondb_owner;

--
-- Name: TABLE reference_materials; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.reference_materials IS 'QC standards (Durango, Fish Canyon, etc.) analyzed alongside unknowns';


--
-- Name: COLUMN reference_materials.material_type; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.reference_materials.material_type IS 'primary (age standard) or secondary (lab standard)';


--
-- Name: reference_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reference_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reference_materials_id_seq OWNER TO neondb_owner;

--
-- Name: reference_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reference_materials_id_seq OWNED BY public.reference_materials.id;


--
-- Name: sample_people_roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sample_people_roles (
    id integer NOT NULL,
    sample_id character varying(50) NOT NULL,
    person_id integer NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sample_people_roles OWNER TO neondb_owner;

--
-- Name: TABLE sample_people_roles; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.sample_people_roles IS 'Links samples to people with roles (collector, investigator, etc.)';


--
-- Name: COLUMN sample_people_roles.role; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.sample_people_roles.role IS 'collector, chief_investigator, investigator, analyst, lab_technician, co-author, etc.';


--
-- Name: sample_people_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sample_people_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sample_people_roles_id_seq OWNER TO neondb_owner;

--
-- Name: sample_people_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sample_people_roles_id_seq OWNED BY public.sample_people_roles.id;


--
-- Name: samples; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.samples OWNER TO neondb_owner;

--
-- Name: TABLE samples; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.samples IS 'Geological sample metadata (FAIR Table 4)';


--
-- Name: COLUMN samples.igsn; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.samples.igsn IS 'International Geo Sample Number - global unique identifier';


--
-- Name: COLUMN samples.n_aft_grains; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.samples.n_aft_grains IS 'Number of grains with AFT data';


--
-- Name: COLUMN samples.n_ahe_grains; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.samples.n_ahe_grains IS 'Number of grains with (U-Th)/He data';


--
-- Name: vw_aft_complete; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_aft_complete AS
 SELECT s.sample_id,
    s.sampling_location_information,
    s.latitude,
    s.longitude,
    s.elevation_m,
    fa.central_age_ma,
    fa.central_age_error_ma,
    fa.pooled_age_ma,
    fa.pooled_age_error_ma,
    fa.dispersion_pct,
    fa.p_chi2,
    fa.n_grains,
    ftl.mean_track_length_um,
    ftl.mean_track_length_sd_um,
    ftl.n_confined_tracks,
    fc.ns,
    fc.rho_s_cm2,
    fc.u_ppm,
    fc.eu_ppm,
    fc.dpar_um,
    fc.cl_wt_pct,
    fc.rmr0
   FROM (((public.samples s
     LEFT JOIN public.ft_ages fa ON (((s.sample_id)::text = (fa.sample_id)::text)))
     LEFT JOIN public.ft_track_lengths ftl ON ((((s.sample_id)::text = (ftl.sample_id)::text) AND ((ftl.grain_id)::text ~~ '%_aggregate'::text))))
     LEFT JOIN public.ft_counts fc ON ((((s.sample_id)::text = (fc.sample_id)::text) AND ((fc.grain_id)::text ~~ '%_aggregate'::text))));


ALTER VIEW public.vw_aft_complete OWNER TO neondb_owner;

--
-- Name: VIEW vw_aft_complete; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.vw_aft_complete IS 'Complete AFT data combining ages, lengths, and counts';


--
-- Name: vw_sample_summary; Type: VIEW; Schema: public; Owner: neondb_owner
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
    s.analyst,
    s.analysis_method,
    s.n_aft_grains,
    s.n_ahe_grains,
    fa.central_age_ma AS aft_central_age_ma,
    fa.central_age_error_ma AS aft_age_error_ma,
    fa.dispersion_pct AS aft_dispersion_pct,
    fa.p_chi2 AS aft_p_chi2,
    ftl.mean_track_length_um AS aft_mtl_um,
    ftl.mean_track_length_sd_um AS aft_mtl_sd_um,
    ftl.n_confined_tracks AS aft_n_tracks,
    avg(ahe.corr_age_ma) AS ahe_mean_age_ma,
    stddev(ahe.corr_age_ma) AS ahe_age_sd_ma,
    count(ahe.id) AS ahe_n_grains_measured,
    avg(ahe.eu_ppm) AS ahe_mean_eu_ppm,
    d.dataset_name,
    d.study_area
   FROM ((((public.samples s
     LEFT JOIN public.ft_ages fa ON (((s.sample_id)::text = (fa.sample_id)::text)))
     LEFT JOIN public.ft_track_lengths ftl ON ((((s.sample_id)::text = (ftl.sample_id)::text) AND ((ftl.grain_id)::text ~~ '%_aggregate'::text))))
     LEFT JOIN public.ahe_grain_data ahe ON (((s.sample_id)::text = (ahe.sample_id)::text)))
     LEFT JOIN public.datasets d ON ((s.dataset_id = d.id)))
  GROUP BY s.sample_id, s.igsn, s.latitude, s.longitude, s.elevation_m, s.lithology, s.mineral_type, s.sampling_location_information, s.analyst, s.analysis_method, s.n_aft_grains, s.n_ahe_grains, fa.central_age_ma, fa.central_age_error_ma, fa.dispersion_pct, fa.p_chi2, ftl.mean_track_length_um, ftl.mean_track_length_sd_um, ftl.n_confined_tracks, d.dataset_name, d.study_area;


ALTER VIEW public.vw_sample_summary OWNER TO neondb_owner;

--
-- Name: VIEW vw_sample_summary; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.vw_sample_summary IS 'Complete sample summary with AFT and AHe data';


--
-- Name: ahe_grain_data id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ahe_grain_data ALTER COLUMN id SET DEFAULT nextval('public.ahe_grain_data_id_seq'::regclass);


--
-- Name: batches id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.batches ALTER COLUMN id SET DEFAULT nextval('public.batches_id_seq'::regclass);


--
-- Name: datapoint_people_roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.datapoint_people_roles ALTER COLUMN id SET DEFAULT nextval('public.datapoint_people_roles_id_seq'::regclass);


--
-- Name: datasets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.datasets ALTER COLUMN id SET DEFAULT nextval('public.datasets_id_seq'::regclass);


--
-- Name: ft_ages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_ages ALTER COLUMN id SET DEFAULT nextval('public.ft_ages_id_seq'::regclass);


--
-- Name: ft_binned_length_data id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_binned_length_data ALTER COLUMN id SET DEFAULT nextval('public.ft_binned_length_data_id_seq'::regclass);


--
-- Name: ft_count_data id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_count_data ALTER COLUMN id SET DEFAULT nextval('public.ft_count_data_id_seq'::regclass);


--
-- Name: ft_counts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_counts ALTER COLUMN id SET DEFAULT nextval('public.ft_counts_id_seq'::regclass);


--
-- Name: ft_datapoints id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_datapoints ALTER COLUMN id SET DEFAULT nextval('public.ft_datapoints_id_seq'::regclass);


--
-- Name: ft_single_grain_ages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_single_grain_ages ALTER COLUMN id SET DEFAULT nextval('public.ft_single_grain_ages_id_seq'::regclass);


--
-- Name: ft_track_length_data id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_track_length_data ALTER COLUMN id SET DEFAULT nextval('public.ft_track_length_data_id_seq'::regclass);


--
-- Name: ft_track_lengths id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_track_lengths ALTER COLUMN id SET DEFAULT nextval('public.ft_track_lengths_id_seq'::regclass);


--
-- Name: grains id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.grains ALTER COLUMN id SET DEFAULT nextval('public.grains_id_seq'::regclass);


--
-- Name: he_datapoints id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.he_datapoints ALTER COLUMN id SET DEFAULT nextval('public.he_datapoints_id_seq'::regclass);


--
-- Name: he_whole_grain_data id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.he_whole_grain_data ALTER COLUMN id SET DEFAULT nextval('public.he_whole_grain_data_id_seq'::regclass);


--
-- Name: mounts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mounts ALTER COLUMN id SET DEFAULT nextval('public.mounts_id_seq'::regclass);


--
-- Name: people id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.people ALTER COLUMN id SET DEFAULT nextval('public.people_id_seq'::regclass);


--
-- Name: reference_materials id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_materials ALTER COLUMN id SET DEFAULT nextval('public.reference_materials_id_seq'::regclass);


--
-- Name: sample_people_roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sample_people_roles ALTER COLUMN id SET DEFAULT nextval('public.sample_people_roles_id_seq'::regclass);


--
-- Name: ahe_grain_data ahe_grain_data_lab_no_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ahe_grain_data
    ADD CONSTRAINT ahe_grain_data_lab_no_key UNIQUE (lab_no);


--
-- Name: ahe_grain_data ahe_grain_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ahe_grain_data
    ADD CONSTRAINT ahe_grain_data_pkey PRIMARY KEY (id);


--
-- Name: batches batches_batch_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_batch_name_key UNIQUE (batch_name);


--
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (id);


--
-- Name: datapoint_people_roles datapoint_people_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.datapoint_people_roles
    ADD CONSTRAINT datapoint_people_roles_pkey PRIMARY KEY (id);


--
-- Name: datasets datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_pkey PRIMARY KEY (id);


--
-- Name: ft_ages ft_ages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_ages
    ADD CONSTRAINT ft_ages_pkey PRIMARY KEY (id);


--
-- Name: ft_ages ft_ages_sample_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_ages
    ADD CONSTRAINT ft_ages_sample_id_key UNIQUE (sample_id);


--
-- Name: ft_binned_length_data ft_binned_length_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_binned_length_data
    ADD CONSTRAINT ft_binned_length_data_pkey PRIMARY KEY (id);


--
-- Name: ft_count_data ft_count_data_ft_datapoint_id_grain_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_count_data
    ADD CONSTRAINT ft_count_data_ft_datapoint_id_grain_id_key UNIQUE (ft_datapoint_id, grain_id);


--
-- Name: ft_count_data ft_count_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_count_data
    ADD CONSTRAINT ft_count_data_pkey PRIMARY KEY (id);


--
-- Name: ft_counts ft_counts_grain_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_counts
    ADD CONSTRAINT ft_counts_grain_id_key UNIQUE (grain_id);


--
-- Name: ft_counts ft_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_counts
    ADD CONSTRAINT ft_counts_pkey PRIMARY KEY (id);


--
-- Name: ft_datapoints ft_datapoints_datapoint_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_datapoints
    ADD CONSTRAINT ft_datapoints_datapoint_key_key UNIQUE (datapoint_key);


--
-- Name: ft_datapoints ft_datapoints_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_datapoints
    ADD CONSTRAINT ft_datapoints_pkey PRIMARY KEY (id);


--
-- Name: ft_single_grain_ages ft_single_grain_ages_ft_datapoint_id_grain_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_single_grain_ages
    ADD CONSTRAINT ft_single_grain_ages_ft_datapoint_id_grain_id_key UNIQUE (ft_datapoint_id, grain_id);


--
-- Name: ft_single_grain_ages ft_single_grain_ages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_single_grain_ages
    ADD CONSTRAINT ft_single_grain_ages_pkey PRIMARY KEY (id);


--
-- Name: ft_track_length_data ft_track_length_data_ft_datapoint_id_grain_id_track_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_track_length_data
    ADD CONSTRAINT ft_track_length_data_ft_datapoint_id_grain_id_track_id_key UNIQUE (ft_datapoint_id, grain_id, track_id);


--
-- Name: ft_track_length_data ft_track_length_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_track_length_data
    ADD CONSTRAINT ft_track_length_data_pkey PRIMARY KEY (id);


--
-- Name: ft_track_lengths ft_track_lengths_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_track_lengths
    ADD CONSTRAINT ft_track_lengths_pkey PRIMARY KEY (id);


--
-- Name: grains grains_grain_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.grains
    ADD CONSTRAINT grains_grain_id_key UNIQUE (grain_id);


--
-- Name: grains grains_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.grains
    ADD CONSTRAINT grains_pkey PRIMARY KEY (id);


--
-- Name: he_datapoints he_datapoints_datapoint_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.he_datapoints
    ADD CONSTRAINT he_datapoints_datapoint_key_key UNIQUE (datapoint_key);


--
-- Name: he_datapoints he_datapoints_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.he_datapoints
    ADD CONSTRAINT he_datapoints_pkey PRIMARY KEY (id);


--
-- Name: he_whole_grain_data he_whole_grain_data_lab_no_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.he_whole_grain_data
    ADD CONSTRAINT he_whole_grain_data_lab_no_key UNIQUE (lab_no);


--
-- Name: he_whole_grain_data he_whole_grain_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.he_whole_grain_data
    ADD CONSTRAINT he_whole_grain_data_pkey PRIMARY KEY (id);


--
-- Name: mounts mounts_mount_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mounts
    ADD CONSTRAINT mounts_mount_id_key UNIQUE (mount_id);


--
-- Name: mounts mounts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mounts
    ADD CONSTRAINT mounts_pkey PRIMARY KEY (id);


--
-- Name: people people_orcid_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_orcid_key UNIQUE (orcid);


--
-- Name: people people_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_pkey PRIMARY KEY (id);


--
-- Name: reference_materials reference_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_materials
    ADD CONSTRAINT reference_materials_pkey PRIMARY KEY (id);


--
-- Name: sample_people_roles sample_people_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sample_people_roles
    ADD CONSTRAINT sample_people_roles_pkey PRIMARY KEY (id);


--
-- Name: sample_people_roles sample_people_roles_sample_id_person_id_role_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sample_people_roles
    ADD CONSTRAINT sample_people_roles_sample_id_person_id_role_key UNIQUE (sample_id, person_id, role);


--
-- Name: samples samples_igsn_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_igsn_key UNIQUE (igsn);


--
-- Name: samples samples_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_pkey PRIMARY KEY (sample_id);


--
-- Name: idx_ahe_age; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ahe_age ON public.ahe_grain_data USING btree (corr_age_ma);


--
-- Name: idx_ahe_lab_no; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ahe_lab_no ON public.ahe_grain_data USING btree (lab_no);


--
-- Name: idx_ahe_sample; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ahe_sample ON public.ahe_grain_data USING btree (sample_id);


--
-- Name: idx_batches_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_batches_date ON public.batches USING btree (analysis_date);


--
-- Name: idx_batches_name; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_batches_name ON public.batches USING btree (batch_name);


--
-- Name: idx_datapoint_people_datapoint; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_datapoint_people_datapoint ON public.datapoint_people_roles USING btree (datapoint_id, datapoint_type);


--
-- Name: idx_datapoint_people_person; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_datapoint_people_person ON public.datapoint_people_roles USING btree (person_id);


--
-- Name: idx_ft_ages_central; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_ages_central ON public.ft_ages USING btree (central_age_ma);


--
-- Name: idx_ft_ages_dispersion; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_ages_dispersion ON public.ft_ages USING btree (dispersion_pct);


--
-- Name: idx_ft_ages_sample; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_ages_sample ON public.ft_ages USING btree (sample_id);


--
-- Name: idx_ft_binned_length_datapoint; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_binned_length_datapoint ON public.ft_binned_length_data USING btree (ft_datapoint_id);


--
-- Name: idx_ft_count_data_datapoint; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_count_data_datapoint ON public.ft_count_data USING btree (ft_datapoint_id);


--
-- Name: idx_ft_count_data_grain; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_count_data_grain ON public.ft_count_data USING btree (grain_id);


--
-- Name: idx_ft_counts_dispersion; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_counts_dispersion ON public.ft_counts USING btree (disp_pct);


--
-- Name: idx_ft_counts_grain; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_counts_grain ON public.ft_counts USING btree (grain_id);


--
-- Name: idx_ft_counts_sample; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_counts_sample ON public.ft_counts USING btree (sample_id);


--
-- Name: idx_ft_datapoints_batch; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_datapoints_batch ON public.ft_datapoints USING btree (batch_id);


--
-- Name: idx_ft_datapoints_central_age; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_datapoints_central_age ON public.ft_datapoints USING btree (central_age_ma);


--
-- Name: idx_ft_datapoints_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_datapoints_key ON public.ft_datapoints USING btree (datapoint_key);


--
-- Name: idx_ft_datapoints_sample; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_datapoints_sample ON public.ft_datapoints USING btree (sample_id);


--
-- Name: idx_ft_lengths_grain; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_lengths_grain ON public.ft_track_lengths USING btree (grain_id);


--
-- Name: idx_ft_lengths_mtl; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_lengths_mtl ON public.ft_track_lengths USING btree (mean_track_length_um);


--
-- Name: idx_ft_lengths_sample; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_lengths_sample ON public.ft_track_lengths USING btree (sample_id);


--
-- Name: idx_ft_single_grain_datapoint; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_single_grain_datapoint ON public.ft_single_grain_ages USING btree (ft_datapoint_id);


--
-- Name: idx_ft_single_grain_grain; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_single_grain_grain ON public.ft_single_grain_ages USING btree (grain_id);


--
-- Name: idx_ft_track_length_datapoint; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_track_length_datapoint ON public.ft_track_length_data USING btree (ft_datapoint_id);


--
-- Name: idx_ft_track_length_grain; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_track_length_grain ON public.ft_track_length_data USING btree (grain_id);


--
-- Name: idx_ft_track_length_mtl; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ft_track_length_mtl ON public.ft_track_length_data USING btree (true_length_um);


--
-- Name: idx_grains_grain_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_grains_grain_id ON public.grains USING btree (grain_id);


--
-- Name: idx_grains_mount; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_grains_mount ON public.grains USING btree (mount_id);


--
-- Name: idx_he_datapoints_batch; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_he_datapoints_batch ON public.he_datapoints USING btree (batch_id);


--
-- Name: idx_he_datapoints_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_he_datapoints_key ON public.he_datapoints USING btree (datapoint_key);


--
-- Name: idx_he_datapoints_sample; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_he_datapoints_sample ON public.he_datapoints USING btree (sample_id);


--
-- Name: idx_he_whole_grain_age; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_he_whole_grain_age ON public.he_whole_grain_data USING btree (corr_age_ma);


--
-- Name: idx_he_whole_grain_datapoint; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_he_whole_grain_datapoint ON public.he_whole_grain_data USING btree (he_datapoint_id);


--
-- Name: idx_he_whole_grain_lab_no; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_he_whole_grain_lab_no ON public.he_whole_grain_data USING btree (lab_no);


--
-- Name: idx_mounts_mount_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_mounts_mount_id ON public.mounts USING btree (mount_id);


--
-- Name: idx_mounts_sample; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_mounts_sample ON public.mounts USING btree (sample_id);


--
-- Name: idx_people_name; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_people_name ON public.people USING btree (name);


--
-- Name: idx_people_orcid; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_people_orcid ON public.people USING btree (orcid) WHERE (orcid IS NOT NULL);


--
-- Name: idx_ref_materials_batch; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ref_materials_batch ON public.reference_materials USING btree (batch_id);


--
-- Name: idx_ref_materials_name; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ref_materials_name ON public.reference_materials USING btree (material_name);


--
-- Name: idx_sample_people_person; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sample_people_person ON public.sample_people_roles USING btree (person_id);


--
-- Name: idx_sample_people_sample; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sample_people_sample ON public.sample_people_roles USING btree (sample_id);


--
-- Name: idx_samples_dataset; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_samples_dataset ON public.samples USING btree (dataset_id);


--
-- Name: idx_samples_igsn; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_samples_igsn ON public.samples USING btree (igsn) WHERE (igsn IS NOT NULL);


--
-- Name: idx_samples_location; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_samples_location ON public.samples USING btree (latitude, longitude);


--
-- Name: idx_samples_mineral; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_samples_mineral ON public.samples USING btree (mineral_type);


--
-- Name: samples update_samples_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_samples_updated_at BEFORE UPDATE ON public.samples FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ahe_grain_data ahe_grain_data_sample_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ahe_grain_data
    ADD CONSTRAINT ahe_grain_data_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(sample_id) ON DELETE CASCADE;


--
-- Name: datapoint_people_roles datapoint_people_roles_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.datapoint_people_roles
    ADD CONSTRAINT datapoint_people_roles_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;


--
-- Name: ft_ages ft_ages_sample_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_ages
    ADD CONSTRAINT ft_ages_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(sample_id) ON DELETE CASCADE;


--
-- Name: ft_binned_length_data ft_binned_length_data_ft_datapoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_binned_length_data
    ADD CONSTRAINT ft_binned_length_data_ft_datapoint_id_fkey FOREIGN KEY (ft_datapoint_id) REFERENCES public.ft_datapoints(id) ON DELETE CASCADE;


--
-- Name: ft_count_data ft_count_data_ft_datapoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_count_data
    ADD CONSTRAINT ft_count_data_ft_datapoint_id_fkey FOREIGN KEY (ft_datapoint_id) REFERENCES public.ft_datapoints(id) ON DELETE CASCADE;


--
-- Name: ft_counts ft_counts_sample_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_counts
    ADD CONSTRAINT ft_counts_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(sample_id) ON DELETE CASCADE;


--
-- Name: ft_datapoints ft_datapoints_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_datapoints
    ADD CONSTRAINT ft_datapoints_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: ft_single_grain_ages ft_single_grain_ages_ft_datapoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_single_grain_ages
    ADD CONSTRAINT ft_single_grain_ages_ft_datapoint_id_fkey FOREIGN KEY (ft_datapoint_id) REFERENCES public.ft_datapoints(id) ON DELETE CASCADE;


--
-- Name: ft_track_length_data ft_track_length_data_ft_datapoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_track_length_data
    ADD CONSTRAINT ft_track_length_data_ft_datapoint_id_fkey FOREIGN KEY (ft_datapoint_id) REFERENCES public.ft_datapoints(id) ON DELETE CASCADE;


--
-- Name: ft_track_lengths ft_track_lengths_sample_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ft_track_lengths
    ADD CONSTRAINT ft_track_lengths_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(sample_id) ON DELETE CASCADE;


--
-- Name: grains grains_mount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.grains
    ADD CONSTRAINT grains_mount_id_fkey FOREIGN KEY (mount_id) REFERENCES public.mounts(mount_id) ON DELETE SET NULL;


--
-- Name: he_datapoints he_datapoints_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.he_datapoints
    ADD CONSTRAINT he_datapoints_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: he_whole_grain_data he_whole_grain_data_he_datapoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.he_whole_grain_data
    ADD CONSTRAINT he_whole_grain_data_he_datapoint_id_fkey FOREIGN KEY (he_datapoint_id) REFERENCES public.he_datapoints(id) ON DELETE CASCADE;


--
-- Name: reference_materials reference_materials_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_materials
    ADD CONSTRAINT reference_materials_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;


--
-- Name: sample_people_roles sample_people_roles_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sample_people_roles
    ADD CONSTRAINT sample_people_roles_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;


--
-- Name: samples samples_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

