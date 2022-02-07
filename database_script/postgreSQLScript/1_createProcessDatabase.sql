-- schema.sql
-- Since we might run the import many times we'll drop if exists
DROP DATABASE IF EXISTS MMI40;

CREATE DATABASE MMI40;

-- Make sure we're using our `MMI40` database
\c MMI40;

CREATE TABLE superusers (
    username text NOT NULL,
    password text NOT NULL,
    PRIMARY KEY (username)
) WITH (OIDS = FALSE);

CREATE TABLE project (
    name text NOT NULL,
    token text NOT NULL,
    tokenexpires bigint NOT NULL,
    workspaceuid text NOT NULL,
    zdmemail text NOT NULL,
    zdmpassword text NOT NULL,
    superuser text NOT NULL,
    PRIMARY KEY (name),
    FOREIGN KEY (superuser) REFERENCES superusers (username) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TABLE fleets (
    id uuid NOT NULL,
    name text,
    zdmfleetid text NOT NULL,
    projectname text NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (zdmfleetid, projectname),
    FOREIGN KEY (projectname) REFERENCES project (name) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TABLE views (
    id uuid NOT NULL,
    name text,
    projectname text NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name, projectname),
    FOREIGN KEY (projectname) REFERENCES project (name) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TABLE enabled (
    fleetid uuid NOT NULL,
    viewid uuid NOT NULL,
    PRIMARY KEY (fleetid, viewid),
    FOREIGN KEY (viewid) REFERENCES views (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID,
    FOREIGN KEY (fleetid) REFERENCES fleets (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TABLE datagroups (
    id uuid NOT NULL,
    aggregationfunction text NOT NULL,
    projectname text NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (projectname) REFERENCES project (name) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TABLE data (
    id uuid NOT NULL,
    aggregationfunction text NOT NULL,
    datagroupid uuid NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (datagroupid) REFERENCES datagroups (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TABLE tagsofvalue (
    id uuid NOT NULL,
    tag text NOT NULL,
    value text NOT NULL,
    projectname text NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (projectname) REFERENCES project (name) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TABLE composed (
    tagofvalueid uuid NOT NULL,
    dataid uuid NOT NULL,
    PRIMARY KEY (tagofvalueid, dataid),
    FOREIGN KEY (tagofvalueid) REFERENCES tagsofvalue (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID,
    FOREIGN KEY (dataid) REFERENCES data (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TYPE alarmtype AS ENUM ('min', 'max');

CREATE TABLE alarms (
    id uuid NOT NULL,
    threshold integer NOT NULL,
    type alarmtype NOT NULL,
    fleetid uuid NOT NULL,
    tagofvalueid uuid NOT NULL,
    active boolean NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (fleetid) REFERENCES fleets (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID,
    FOREIGN KEY (tagofvalueid) REFERENCES tagsofvalue (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TABLE users (
    id uuid NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    projectname text NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (username, projectname),
    FOREIGN KEY (projectname) REFERENCES project (name) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TABLE access (
    userid uuid NOT NULL,
    fleetid uuid NOT NULL,
    PRIMARY KEY (userid, fleetid),
    FOREIGN KEY (userid) REFERENCES users (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID,
    FOREIGN KEY (fleetid) REFERENCES fleets (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TABLE relative (
    datagroupid uuid NOT NULL,
    viewid uuid NOT NULL,
    PRIMARY KEY (datagroupid, viewid),
    FOREIGN KEY (datagroupid) REFERENCES datagroups (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID,
    FOREIGN KEY (viewid) REFERENCES views (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (OIDS = FALSE);

CREATE TABLE tokensblacklist (
    id uuid NOT NULL,
    token text NOT NULL,
    expirationdate bigint NOT NULL,
    PRIMARY KEY (id)
) WITH (OIDS = FALSE);

CREATE TABLE associated (
    tagofvalueid uuid NOT NULL,
    viewid uuid NOT NULL,
    PRIMARY KEY (tagofvalueid, viewid),
    FOREIGN KEY (tagofvalueid) REFERENCES tagsofvalue (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID,
    FOREIGN KEY (viewid) REFERENCES views (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE NOT VALID
) WITH (
    OIDS = FALSE
);