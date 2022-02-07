--
-- PostgreSQL database dump
--

-- Dumped from database version 10.12
-- Dumped by pg_dump version 10.12

-- Started on 2020-06-12 09:32:23

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

--
-- TOC entry 1 (class 3079 OID 12924)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2919 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- TOC entry 632 (class 1247 OID 31610)
-- Name: alarmtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.alarmtype AS ENUM (
    'min',
    'max'
);


ALTER TYPE public.alarmtype OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 207 (class 1259 OID 31645)
-- Name: access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.access (
    userid uuid NOT NULL,
    fleetid uuid NOT NULL
);


ALTER TABLE public.access OWNER TO postgres;

--
-- TOC entry 205 (class 1259 OID 31615)
-- Name: alarms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alarms (
    id uuid NOT NULL,
    threshold integer NOT NULL,
    type public.alarmtype NOT NULL,
    fleetid uuid NOT NULL,
    tagofvalueid uuid NOT NULL,
    active boolean NOT NULL
);


ALTER TABLE public.alarms OWNER TO postgres;

--
-- TOC entry 210 (class 1259 OID 31683)
-- Name: associated; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.associated (
    tagofvalueid uuid NOT NULL,
    viewid uuid NOT NULL
);


ALTER TABLE public.associated OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 31594)
-- Name: composed; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.composed (
    tagofvalueid uuid NOT NULL,
    dataid uuid NOT NULL
);


ALTER TABLE public.composed OWNER TO postgres;

--
-- TOC entry 202 (class 1259 OID 31568)
-- Name: data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data (
    id uuid NOT NULL,
    aggregationfunction text NOT NULL,
    datagroupid uuid NOT NULL
);


ALTER TABLE public.data OWNER TO postgres;

--
-- TOC entry 201 (class 1259 OID 31555)
-- Name: datagroups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.datagroups (
    id uuid NOT NULL,
    aggregationfunction text NOT NULL,
    projectname text NOT NULL
);


ALTER TABLE public.datagroups OWNER TO postgres;

--
-- TOC entry 200 (class 1259 OID 31540)
-- Name: enabled; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enabled (
    fleetid uuid NOT NULL,
    viewid uuid NOT NULL
);


ALTER TABLE public.enabled OWNER TO postgres;

--
-- TOC entry 198 (class 1259 OID 31510)
-- Name: fleets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fleets (
    id uuid NOT NULL,
    name text,
    zdmfleetid text NOT NULL,
    projectname text NOT NULL
);


ALTER TABLE public.fleets OWNER TO postgres;

--
-- TOC entry 197 (class 1259 OID 31497)
-- Name: project; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project (
    name text NOT NULL,
    token text NOT NULL,
    tokenexpires bigint NOT NULL,
    workspaceuid text NOT NULL,
    zdmemail text NOT NULL,
    zdmpassword text NOT NULL,
    superuser text NOT NULL
);


ALTER TABLE public.project OWNER TO postgres;

--
-- TOC entry 208 (class 1259 OID 31660)
-- Name: relative; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.relative (
    datagroupid uuid NOT NULL,
    viewid uuid NOT NULL
);


ALTER TABLE public.relative OWNER TO postgres;

--
-- TOC entry 196 (class 1259 OID 31489)
-- Name: superusers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.superusers (
    username text NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.superusers OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 31581)
-- Name: tagsofvalue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tagsofvalue (
    id uuid NOT NULL,
    tag text NOT NULL,
    value text NOT NULL,
    projectname text NOT NULL
);


ALTER TABLE public.tagsofvalue OWNER TO postgres;

--
-- TOC entry 209 (class 1259 OID 31675)
-- Name: tokensblacklist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tokensblacklist (
    id uuid NOT NULL,
    token text NOT NULL,
    expirationdate bigint NOT NULL
);


ALTER TABLE public.tokensblacklist OWNER TO postgres;

--
-- TOC entry 206 (class 1259 OID 31630)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    projectname text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 199 (class 1259 OID 31525)
-- Name: views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.views (
    id uuid NOT NULL,
    name text,
    projectname text NOT NULL
);


ALTER TABLE public.views OWNER TO postgres;

--
-- TOC entry 2765 (class 2606 OID 31649)
-- Name: access access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access
    ADD CONSTRAINT access_pkey PRIMARY KEY (userid, fleetid);


--
-- TOC entry 2759 (class 2606 OID 31619)
-- Name: alarms alarms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alarms
    ADD CONSTRAINT alarms_pkey PRIMARY KEY (id);


--
-- TOC entry 2771 (class 2606 OID 31687)
-- Name: associated associated_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.associated
    ADD CONSTRAINT associated_pkey PRIMARY KEY (tagofvalueid, viewid);


--
-- TOC entry 2757 (class 2606 OID 31598)
-- Name: composed composed_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.composed
    ADD CONSTRAINT composed_pkey PRIMARY KEY (tagofvalueid, dataid);


--
-- TOC entry 2753 (class 2606 OID 31575)
-- Name: data data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data
    ADD CONSTRAINT data_pkey PRIMARY KEY (id);


--
-- TOC entry 2751 (class 2606 OID 31562)
-- Name: datagroups datagroups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.datagroups
    ADD CONSTRAINT datagroups_pkey PRIMARY KEY (id);


--
-- TOC entry 2749 (class 2606 OID 31544)
-- Name: enabled enabled_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enabled
    ADD CONSTRAINT enabled_pkey PRIMARY KEY (fleetid, viewid);


--
-- TOC entry 2741 (class 2606 OID 31517)
-- Name: fleets fleets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT fleets_pkey PRIMARY KEY (id);


--
-- TOC entry 2743 (class 2606 OID 31519)
-- Name: fleets fleets_zdmfleetid_projectname_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT fleets_zdmfleetid_projectname_key UNIQUE (zdmfleetid, projectname);


--
-- TOC entry 2739 (class 2606 OID 31504)
-- Name: project project_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (name);


--
-- TOC entry 2767 (class 2606 OID 31664)
-- Name: relative relative_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relative
    ADD CONSTRAINT relative_pkey PRIMARY KEY (datagroupid, viewid);


--
-- TOC entry 2737 (class 2606 OID 31496)
-- Name: superusers superusers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.superusers
    ADD CONSTRAINT superusers_pkey PRIMARY KEY (username);


--
-- TOC entry 2755 (class 2606 OID 31588)
-- Name: tagsofvalue tagsofvalue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tagsofvalue
    ADD CONSTRAINT tagsofvalue_pkey PRIMARY KEY (id);


--
-- TOC entry 2769 (class 2606 OID 31682)
-- Name: tokensblacklist tokensblacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokensblacklist
    ADD CONSTRAINT tokensblacklist_pkey PRIMARY KEY (id);


--
-- TOC entry 2761 (class 2606 OID 31637)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 2763 (class 2606 OID 31639)
-- Name: users users_username_projectname_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_projectname_key UNIQUE (username, projectname);


--
-- TOC entry 2745 (class 2606 OID 31534)
-- Name: views views_name_projectname_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.views
    ADD CONSTRAINT views_name_projectname_key UNIQUE (name, projectname);


--
-- TOC entry 2747 (class 2606 OID 31532)
-- Name: views views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.views
    ADD CONSTRAINT views_pkey PRIMARY KEY (id);


--
-- TOC entry 2786 (class 2606 OID 31655)
-- Name: access access_fleetid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access
    ADD CONSTRAINT access_fleetid_fkey FOREIGN KEY (fleetid) REFERENCES public.fleets(id) ON DELETE CASCADE;


--
-- TOC entry 2785 (class 2606 OID 31650)
-- Name: access access_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access
    ADD CONSTRAINT access_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 2782 (class 2606 OID 31620)
-- Name: alarms alarms_fleetid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alarms
    ADD CONSTRAINT alarms_fleetid_fkey FOREIGN KEY (fleetid) REFERENCES public.fleets(id) ON DELETE CASCADE;


--
-- TOC entry 2783 (class 2606 OID 31625)
-- Name: alarms alarms_tagofvalueid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alarms
    ADD CONSTRAINT alarms_tagofvalueid_fkey FOREIGN KEY (tagofvalueid) REFERENCES public.tagsofvalue(id) ON DELETE CASCADE;


--
-- TOC entry 2789 (class 2606 OID 31688)
-- Name: associated associated_tagofvalueid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.associated
    ADD CONSTRAINT associated_tagofvalueid_fkey FOREIGN KEY (tagofvalueid) REFERENCES public.tagsofvalue(id) ON DELETE CASCADE;


--
-- TOC entry 2790 (class 2606 OID 31693)
-- Name: associated associated_viewid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.associated
    ADD CONSTRAINT associated_viewid_fkey FOREIGN KEY (viewid) REFERENCES public.views(id) ON DELETE CASCADE;


--
-- TOC entry 2781 (class 2606 OID 31604)
-- Name: composed composed_dataid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.composed
    ADD CONSTRAINT composed_dataid_fkey FOREIGN KEY (dataid) REFERENCES public.data(id) ON DELETE CASCADE;


--
-- TOC entry 2780 (class 2606 OID 31599)
-- Name: composed composed_tagofvalueid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.composed
    ADD CONSTRAINT composed_tagofvalueid_fkey FOREIGN KEY (tagofvalueid) REFERENCES public.tagsofvalue(id) ON DELETE CASCADE;


--
-- TOC entry 2778 (class 2606 OID 31576)
-- Name: data data_datagroupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data
    ADD CONSTRAINT data_datagroupid_fkey FOREIGN KEY (datagroupid) REFERENCES public.datagroups(id) ON DELETE CASCADE;


--
-- TOC entry 2777 (class 2606 OID 31563)
-- Name: datagroups datagroups_projectname_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.datagroups
    ADD CONSTRAINT datagroups_projectname_fkey FOREIGN KEY (projectname) REFERENCES public.project(name) ON DELETE CASCADE;


--
-- TOC entry 2776 (class 2606 OID 31550)
-- Name: enabled enabled_fleetid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enabled
    ADD CONSTRAINT enabled_fleetid_fkey FOREIGN KEY (fleetid) REFERENCES public.fleets(id) ON DELETE CASCADE;


--
-- TOC entry 2775 (class 2606 OID 31545)
-- Name: enabled enabled_viewid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enabled
    ADD CONSTRAINT enabled_viewid_fkey FOREIGN KEY (viewid) REFERENCES public.views(id) ON DELETE CASCADE;


--
-- TOC entry 2773 (class 2606 OID 31520)
-- Name: fleets fleets_projectname_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT fleets_projectname_fkey FOREIGN KEY (projectname) REFERENCES public.project(name) ON DELETE CASCADE;


--
-- TOC entry 2772 (class 2606 OID 31505)
-- Name: project project_superuser_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_superuser_fkey FOREIGN KEY (superuser) REFERENCES public.superusers(username) ON DELETE CASCADE;


--
-- TOC entry 2787 (class 2606 OID 31665)
-- Name: relative relative_datagroupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relative
    ADD CONSTRAINT relative_datagroupid_fkey FOREIGN KEY (datagroupid) REFERENCES public.datagroups(id) ON DELETE CASCADE;


--
-- TOC entry 2788 (class 2606 OID 31670)
-- Name: relative relative_viewid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relative
    ADD CONSTRAINT relative_viewid_fkey FOREIGN KEY (viewid) REFERENCES public.views(id) ON DELETE CASCADE;


--
-- TOC entry 2779 (class 2606 OID 31589)
-- Name: tagsofvalue tagsofvalue_projectname_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tagsofvalue
    ADD CONSTRAINT tagsofvalue_projectname_fkey FOREIGN KEY (projectname) REFERENCES public.project(name) ON DELETE CASCADE;


--
-- TOC entry 2784 (class 2606 OID 31640)
-- Name: users users_projectname_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_projectname_fkey FOREIGN KEY (projectname) REFERENCES public.project(name) ON DELETE CASCADE;


--
-- TOC entry 2774 (class 2606 OID 31535)
-- Name: views views_projectname_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.views
    ADD CONSTRAINT views_projectname_fkey FOREIGN KEY (projectname) REFERENCES public.project(name) ON DELETE CASCADE;


-- Completed on 2020-06-12 09:32:23

--
-- PostgreSQL database dump complete
--

