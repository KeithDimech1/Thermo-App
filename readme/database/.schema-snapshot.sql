-- Database Schema Snapshot
-- Generated: 2025-11-16T12:21:43.562Z
-- Tables: 8


CREATE TABLE ahe_grain_data (
  id integer NOT NULL DEFAULT nextval('ahe_grain_data_id_seq'::regclass),
  sample_id character varying(50) NOT NULL,
  lab_no character varying(50),
  length_um numeric,
  half_width_um numeric,
  rs_um numeric,
  mass_mg numeric,
  terminations character varying(10),
  u_ppm numeric,
  th_ppm numeric,
  sm_ppm numeric,
  eu_ppm numeric,
  he_ncc numeric,
  uncorr_age_ma numeric,
  corr_age_ma numeric,
  corr_age_1sigma_ma numeric,
  ft numeric,
  std_run character varying(10),
  thermal_model character varying(10),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ahe_grain_data ADD CONSTRAINT ahe_grain_data_pkey PRIMARY KEY (id);

ALTER TABLE ahe_grain_data ADD CONSTRAINT ahe_grain_data_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES samples(sample_id);

CREATE TABLE data_files (
  id integer NOT NULL DEFAULT nextval('data_files_id_seq'::regclass),
  dataset_id integer NOT NULL,
  file_name character varying(200) NOT NULL,
  file_path character varying(500) NOT NULL,
  file_type character varying(50) NOT NULL,
  display_name character varying(200),
  file_size_bytes integer,
  row_count integer,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE data_files ADD CONSTRAINT data_files_pkey PRIMARY KEY (id);

ALTER TABLE data_files ADD CONSTRAINT data_files_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES datasets(id);

CREATE TABLE dataset_files (
  id integer NOT NULL DEFAULT nextval('dataset_files_id_seq'::regclass),
  dataset_id integer NOT NULL,
  file_type character varying(50) NOT NULL,
  file_name character varying(255) NOT NULL,
  file_path text NOT NULL,
  table_name character varying(100),
  file_size integer,
  row_count integer,
  created_at timestamp without time zone DEFAULT now()
);

ALTER TABLE dataset_files ADD CONSTRAINT dataset_files_pkey PRIMARY KEY (id);

ALTER TABLE dataset_files ADD CONSTRAINT dataset_files_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES datasets(id);

CREATE TABLE datasets (
  id integer NOT NULL DEFAULT nextval('datasets_id_seq'::regclass),
  dataset_name character varying(200) NOT NULL,
  description text,
  publication_reference text,
  doi character varying(100),
  study_area character varying(200),
  analyst character varying(100),
  laboratory character varying(200),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  title character varying(500),
  authors text,
  journal character varying(200),
  year integer,
  methods text,
  num_samples integer,
  age_range_min_ma numeric,
  age_range_max_ma numeric,
  collection_date date,
  analysis_methods ARRAY,
  paper_summary text,
  fair_score integer,
  fair_reasoning text,
  key_findings ARRAY,
  extraction_report_url text
);

ALTER TABLE datasets ADD CONSTRAINT datasets_pkey PRIMARY KEY (id);

CREATE TABLE ft_ages (
  id integer NOT NULL DEFAULT nextval('ft_ages_id_seq'::regclass),
  sample_id character varying(50) NOT NULL,
  age_equation character varying(100),
  ft_age_type character varying(50),
  lambda_d character varying(20),
  lambda_f character varying(20),
  zeta_yr_cm2 numeric,
  zeta_error_yr_cm2 numeric,
  dosimeter character varying(50),
  rs_um numeric,
  q numeric,
  irradiation_reactor character varying(100),
  n_grains integer,
  pooled_age_ma numeric,
  pooled_age_error_ma numeric,
  central_age_ma numeric,
  central_age_error_ma numeric,
  dispersion_pct numeric,
  p_chi2 numeric,
  age_peak_software character varying(100),
  best_fit_peak_ages_ma ARRAY,
  best_fit_peak_errors_ma ARRAY,
  best_fit_peak_grain_pct ARRAY,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ft_ages ADD CONSTRAINT ft_ages_pkey PRIMARY KEY (id);

ALTER TABLE ft_ages ADD CONSTRAINT ft_ages_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES samples(sample_id);

CREATE TABLE ft_counts (
  id integer NOT NULL DEFAULT nextval('ft_counts_id_seq'::regclass),
  sample_id character varying(50) NOT NULL,
  grain_id character varying(100) NOT NULL,
  ns integer,
  rho_s_cm2 numeric,
  u_ppm numeric,
  u_1sigma numeric,
  th_ppm numeric,
  th_1sigma numeric,
  eu_ppm numeric,
  eu_1sigma numeric,
  dpar_um numeric,
  dpar_sd_um numeric,
  dper_um numeric,
  dper_sd_um numeric,
  cl_wt_pct numeric,
  ecl_apfu numeric,
  rmr0 numeric,
  rmr0d numeric,
  p_chi2_pct numeric,
  disp_pct numeric,
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
  counting_area_cm2 numeric,
  ni integer,
  nd integer,
  rho_i_cm2 numeric,
  rho_d_cm2 numeric,
  dosimeter character varying(50),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ft_counts ADD CONSTRAINT ft_counts_pkey PRIMARY KEY (id);

ALTER TABLE ft_counts ADD CONSTRAINT ft_counts_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES samples(sample_id);

CREATE TABLE ft_track_lengths (
  id integer NOT NULL DEFAULT nextval('ft_track_lengths_id_seq'::regclass),
  sample_id character varying(50) NOT NULL,
  grain_id character varying(100) NOT NULL,
  n_confined_tracks integer,
  mean_track_length_um numeric,
  mean_track_length_se_um numeric,
  mean_track_length_sd_um numeric,
  dpar_um numeric,
  dpar_sd_um numeric,
  dper_um numeric,
  dper_sd_um numeric,
  apparent_length_um numeric,
  true_length_um numeric,
  angle_to_c_axis_deg numeric,
  azimuth_deg numeric,
  dip_deg numeric,
  corrected_z_depth_um numeric,
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
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ft_track_lengths ADD CONSTRAINT ft_track_lengths_pkey PRIMARY KEY (id);

ALTER TABLE ft_track_lengths ADD CONSTRAINT ft_track_lengths_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES samples(sample_id);

CREATE TABLE samples (
  sample_id character varying(50) NOT NULL,
  dataset_id integer DEFAULT 1,
  igsn character varying(20),
  latitude numeric,
  longitude numeric,
  elevation_m numeric,
  geodetic_datum character varying(20) DEFAULT 'WGS84'::character varying,
  vertical_datum character varying(50) DEFAULT 'mean sea level'::character varying,
  lat_long_precision_m integer,
  lithology character varying(100),
  mineral_type character varying(50),
  sample_kind character varying(100),
  sample_method character varying(100),
  sample_depth_m numeric,
  sampling_location_information text,
  stratigraphic_unit character varying(200),
  chronostratigraphic_unit_age character varying(100),
  sample_age_ma numeric,
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

ALTER TABLE samples ADD CONSTRAINT samples_pkey PRIMARY KEY (sample_id);

ALTER TABLE samples ADD CONSTRAINT samples_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES datasets(id);
