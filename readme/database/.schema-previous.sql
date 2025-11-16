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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE datasets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.datasets IS 'Dataset-level metadata for data organization';


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
-- Name: ft_ages; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE ft_ages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ft_ages IS 'Fission-track age results (FAIR Table 10)';


--
-- Name: COLUMN ft_ages.ft_age_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ft_ages.ft_age_type IS 'Age calculation method: pooled, central, or mixed (mixture modeling)';


--
-- Name: ft_ages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ft_ages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ft_ages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ft_ages_id_seq OWNED BY public.ft_ages.id;


--
-- Name: ft_counts; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE ft_counts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ft_counts IS 'Fission-track count data (FAIR Table 5)';


--
-- Name: COLUMN ft_counts.grain_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ft_counts.grain_id IS 'Grain identifier (sample_id_aggregate for sample-level data)';


--
-- Name: ft_counts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ft_counts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ft_counts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ft_counts_id_seq OWNED BY public.ft_counts.id;


--
-- Name: ft_track_lengths; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE ft_track_lengths; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ft_track_lengths IS 'Fission-track length measurements (FAIR Table 6)';


--
-- Name: COLUMN ft_track_lengths.ft_track_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ft_track_lengths.ft_track_type IS 'Track type: TINT (track-in-track) or TINCLE (track-in-cleavage)';


--
-- Name: ft_track_lengths_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ft_track_lengths_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ft_track_lengths_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ft_track_lengths_id_seq OWNED BY public.ft_track_lengths.id;


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


--
-- Name: VIEW vw_aft_complete; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_aft_complete IS 'Complete AFT data combining ages, lengths, and counts';


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


--
-- Name: VIEW vw_sample_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_sample_summary IS 'Complete sample summary with AFT and AHe data';


--
-- Name: ahe_grain_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ahe_grain_data ALTER COLUMN id SET DEFAULT nextval('public.ahe_grain_data_id_seq'::regclass);


--
-- Name: datasets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datasets ALTER COLUMN id SET DEFAULT nextval('public.datasets_id_seq'::regclass);


--
-- Name: ft_ages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_ages ALTER COLUMN id SET DEFAULT nextval('public.ft_ages_id_seq'::regclass);


--
-- Name: ft_counts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_counts ALTER COLUMN id SET DEFAULT nextval('public.ft_counts_id_seq'::regclass);


--
-- Name: ft_track_lengths id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_track_lengths ALTER COLUMN id SET DEFAULT nextval('public.ft_track_lengths_id_seq'::regclass);


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
-- Name: datasets datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_pkey PRIMARY KEY (id);


--
-- Name: ft_ages ft_ages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_ages
    ADD CONSTRAINT ft_ages_pkey PRIMARY KEY (id);


--
-- Name: ft_ages ft_ages_sample_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_ages
    ADD CONSTRAINT ft_ages_sample_id_key UNIQUE (sample_id);


--
-- Name: ft_counts ft_counts_grain_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_counts
    ADD CONSTRAINT ft_counts_grain_id_key UNIQUE (grain_id);


--
-- Name: ft_counts ft_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_counts
    ADD CONSTRAINT ft_counts_pkey PRIMARY KEY (id);


--
-- Name: ft_track_lengths ft_track_lengths_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_track_lengths
    ADD CONSTRAINT ft_track_lengths_pkey PRIMARY KEY (id);


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
-- Name: idx_ft_ages_central; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_ages_central ON public.ft_ages USING btree (central_age_ma);


--
-- Name: idx_ft_ages_dispersion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_ages_dispersion ON public.ft_ages USING btree (dispersion_pct);


--
-- Name: idx_ft_ages_sample; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_ages_sample ON public.ft_ages USING btree (sample_id);


--
-- Name: idx_ft_counts_dispersion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_counts_dispersion ON public.ft_counts USING btree (disp_pct);


--
-- Name: idx_ft_counts_grain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_counts_grain ON public.ft_counts USING btree (grain_id);


--
-- Name: idx_ft_counts_sample; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_counts_sample ON public.ft_counts USING btree (sample_id);


--
-- Name: idx_ft_lengths_grain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_lengths_grain ON public.ft_track_lengths USING btree (grain_id);


--
-- Name: idx_ft_lengths_mtl; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_lengths_mtl ON public.ft_track_lengths USING btree (mean_track_length_um);


--
-- Name: idx_ft_lengths_sample; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_lengths_sample ON public.ft_track_lengths USING btree (sample_id);


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
-- Name: ft_ages ft_ages_sample_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_ages
    ADD CONSTRAINT ft_ages_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(sample_id) ON DELETE CASCADE;


--
-- Name: ft_counts ft_counts_sample_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_counts
    ADD CONSTRAINT ft_counts_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(sample_id) ON DELETE CASCADE;


--
-- Name: ft_track_lengths ft_track_lengths_sample_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ft_track_lengths
    ADD CONSTRAINT ft_track_lengths_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(sample_id) ON DELETE CASCADE;


--
-- Name: samples samples_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id);


--
-- PostgreSQL database dump complete
--

