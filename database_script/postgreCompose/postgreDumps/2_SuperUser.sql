--
-- PostgreSQL database dump
--

-- Dumped from database version 10.12
-- Dumped by pg_dump version 10.12

-- Started on 2020-06-12 09:32:55

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
-- TOC entry 2912 (class 0 OID 31489)
-- Dependencies: 196
-- Data for Name: superusers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.superusers (username, password) FROM stdin;
William	$2b$05$z83JDsaiCjSOEujxOaAKwuUYzu18KJNGBHi9Oq9wOA4mggjCG4gyC
\.


--
-- TOC entry 2913 (class 0 OID 31497)
-- Dependencies: 197
-- Data for Name: project; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project (name, token, tokenexpires, workspaceuid, zdmemail, zdmpassword, superuser) FROM stdin;
\.


--
-- TOC entry 2914 (class 0 OID 31510)
-- Dependencies: 198
-- Data for Name: fleets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fleets (id, name, zdmfleetid, projectname) FROM stdin;
\.


--
-- TOC entry 2922 (class 0 OID 31630)
-- Dependencies: 206
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, projectname) FROM stdin;
\.


--
-- TOC entry 2923 (class 0 OID 31645)
-- Dependencies: 207
-- Data for Name: access; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.access (userid, fleetid) FROM stdin;
\.


--
-- TOC entry 2919 (class 0 OID 31581)
-- Dependencies: 203
-- Data for Name: tagsofvalue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tagsofvalue (id, tag, value, projectname) FROM stdin;
\.


--
-- TOC entry 2921 (class 0 OID 31615)
-- Dependencies: 205
-- Data for Name: alarms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alarms (id, threshold, type, fleetid, tagofvalueid, active) FROM stdin;
\.


--
-- TOC entry 2915 (class 0 OID 31525)
-- Dependencies: 199
-- Data for Name: views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.views (id, name, projectname) FROM stdin;
\.


--
-- TOC entry 2926 (class 0 OID 31683)
-- Dependencies: 210
-- Data for Name: associated; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.associated (tagofvalueid, viewid) FROM stdin;
\.


--
-- TOC entry 2917 (class 0 OID 31555)
-- Dependencies: 201
-- Data for Name: datagroups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.datagroups (id, aggregationfunction, projectname) FROM stdin;
\.


--
-- TOC entry 2918 (class 0 OID 31568)
-- Dependencies: 202
-- Data for Name: data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data (id, aggregationfunction, datagroupid) FROM stdin;
\.


--
-- TOC entry 2920 (class 0 OID 31594)
-- Dependencies: 204
-- Data for Name: composed; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.composed (tagofvalueid, dataid) FROM stdin;
\.


--
-- TOC entry 2916 (class 0 OID 31540)
-- Dependencies: 200
-- Data for Name: enabled; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enabled (fleetid, viewid) FROM stdin;
\.


--
-- TOC entry 2924 (class 0 OID 31660)
-- Dependencies: 208
-- Data for Name: relative; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.relative (datagroupid, viewid) FROM stdin;
\.


--
-- TOC entry 2925 (class 0 OID 31675)
-- Dependencies: 209
-- Data for Name: tokensblacklist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tokensblacklist (id, token, expirationdate) FROM stdin;
\.


-- Completed on 2020-06-12 09:32:55

--
-- PostgreSQL database dump complete
--

