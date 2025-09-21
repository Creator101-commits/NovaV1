--
-- PostgreSQL database dump
--

\restrict KUVveWtNNg13u8Wy7sTOFbMUYzfHuMQu2j5fksXkzVQgyCiUiiatFc0XeLHUuBB

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_summaries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    original_content text,
    summary text NOT NULL,
    summary_type text DEFAULT 'quick'::text,
    file_type text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_summaries OWNER TO postgres;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    class_id character varying,
    google_classroom_id text,
    title text NOT NULL,
    description text,
    due_date timestamp without time zone,
    status text DEFAULT 'pending'::text,
    priority text DEFAULT 'medium'::text,
    is_custom boolean DEFAULT false,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: bell_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bell_schedule (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    period_name text NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    day_of_week integer NOT NULL
);


ALTER TABLE public.bell_schedule OWNER TO postgres;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    google_classroom_id text,
    name text NOT NULL,
    section text,
    description text,
    teacher_name text,
    teacher_email text,
    color text DEFAULT '#42a5f5'::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: flashcards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flashcards (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    class_id character varying,
    front text NOT NULL,
    back text NOT NULL,
    difficulty text DEFAULT 'medium'::text,
    last_reviewed timestamp without time zone,
    review_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.flashcards OWNER TO postgres;

--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.journal_entries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    content text NOT NULL,
    date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.journal_entries OWNER TO postgres;

--
-- Name: mood_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mood_entries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    mood integer NOT NULL,
    notes text,
    date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.mood_entries OWNER TO postgres;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    class_id character varying,
    title text NOT NULL,
    content text NOT NULL,
    category text DEFAULT 'general'::text,
    tags text[],
    is_pinned boolean DEFAULT false NOT NULL,
    color text DEFAULT '#ffffff'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notes OWNER TO postgres;

--
-- Name: pomodoro_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pomodoro_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    duration integer NOT NULL,
    type text DEFAULT 'work'::text,
    completed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pomodoro_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    first_name text,
    last_name text,
    avatar text,
    google_id text,
    google_access_token text,
    google_refresh_token text,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: ai_summaries ai_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_summaries
    ADD CONSTRAINT ai_summaries_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: bell_schedule bell_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bell_schedule
    ADD CONSTRAINT bell_schedule_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: flashcards flashcards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcards
    ADD CONSTRAINT flashcards_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: mood_entries mood_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_entries
    ADD CONSTRAINT mood_entries_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: pomodoro_sessions pomodoro_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_google_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ai_summaries ai_summaries_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_summaries
    ADD CONSTRAINT ai_summaries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: assignments assignments_class_id_classes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_class_id_classes_id_fk FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: assignments assignments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bell_schedule bell_schedule_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bell_schedule
    ADD CONSTRAINT bell_schedule_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: classes classes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: flashcards flashcards_class_id_classes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcards
    ADD CONSTRAINT flashcards_class_id_classes_id_fk FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: flashcards flashcards_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcards
    ADD CONSTRAINT flashcards_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: journal_entries journal_entries_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: mood_entries mood_entries_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_entries
    ADD CONSTRAINT mood_entries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notes notes_class_id_classes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_class_id_classes_id_fk FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: notes notes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: pomodoro_sessions pomodoro_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict KUVveWtNNg13u8Wy7sTOFbMUYzfHuMQu2j5fksXkzVQgyCiUiiatFc0XeLHUuBB

