create extension if not exists "pgjwt" with schema "extensions";


create sequence "public"."sample_id_seq";

create table "public"."sample" (
    "id" bigint not null default nextval('sample_id_seq'::regclass),
    "email" text not null,
    "full_name" text,
    "created_at" timestamp with time zone not null default now()
);


alter sequence "public"."sample_id_seq" owned by "public"."sample"."id";

CREATE UNIQUE INDEX sample_email_key ON public.sample USING btree (email);

CREATE UNIQUE INDEX sample_pkey ON public.sample USING btree (id);

alter table "public"."sample" add constraint "sample_pkey" PRIMARY KEY using index "sample_pkey";

alter table "public"."sample" add constraint "sample_email_key" UNIQUE using index "sample_email_key";

grant delete on table "public"."sample" to "anon";

grant insert on table "public"."sample" to "anon";

grant references on table "public"."sample" to "anon";

grant select on table "public"."sample" to "anon";

grant trigger on table "public"."sample" to "anon";

grant truncate on table "public"."sample" to "anon";

grant update on table "public"."sample" to "anon";

grant delete on table "public"."sample" to "authenticated";

grant insert on table "public"."sample" to "authenticated";

grant references on table "public"."sample" to "authenticated";

grant select on table "public"."sample" to "authenticated";

grant trigger on table "public"."sample" to "authenticated";

grant truncate on table "public"."sample" to "authenticated";

grant update on table "public"."sample" to "authenticated";

grant delete on table "public"."sample" to "service_role";

grant insert on table "public"."sample" to "service_role";

grant references on table "public"."sample" to "service_role";

grant select on table "public"."sample" to "service_role";

grant trigger on table "public"."sample" to "service_role";

grant truncate on table "public"."sample" to "service_role";

grant update on table "public"."sample" to "service_role";


