-- =============================================================
-- pet-app — Row Level Security policies
-- Aplicar DESPUÉS de prisma db push, una sola vez por entorno
-- Filosofía: deny by default, permitir explícito por rol
-- =============================================================

-- ============= HABILITAR RLS EN TODAS LAS TABLAS =============

ALTER TABLE owner_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_owners               ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_photos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccines                ENABLE ROW LEVEL SECURITY;
ALTER TABLE deworming               ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies               ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_attachments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE studies                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_access              ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_pet_alerts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_vets_cache       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs              ENABLE ROW LEVEL SECURITY;

-- ============= FUNCIONES HELPER =============

-- Devuelve el owner_profile.id del usuario autenticado, si tiene
CREATE OR REPLACE FUNCTION current_owner_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM owner_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Devuelve el vet_profile.id del usuario autenticado, si tiene
CREATE OR REPLACE FUNCTION current_vet_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM vet_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ¿El usuario es admin?
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$;

-- ¿El owner actual tiene acceso a este animal? (dueño primario o co-owner activo)
CREATE OR REPLACE FUNCTION owner_has_animal_access(animal_uuid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM animals a
    WHERE a.id = animal_uuid
      AND a.owner_id = current_owner_id()
  ) OR EXISTS (
    SELECT 1 FROM co_owners co
    WHERE co.animal_id = animal_uuid
      AND co.owner_id = current_owner_id()
      AND co.status = 'active'
  );
$$;

-- ¿El vet actual tiene acceso aprobado y NO archivado? (necesario para escribir)
-- Para LECTURA permite también archivado
CREATE OR REPLACE FUNCTION vet_has_animal_access(animal_uuid uuid, allow_archived boolean DEFAULT true)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM vet_access va
    WHERE va.animal_id = animal_uuid
      AND va.vet_id = current_vet_id()
      AND va.status = 'approved'
      AND (allow_archived OR va.archived_by_vet = false)
  );
$$;

-- ============= POLICIES =============

-- ----- owner_profiles -----
CREATE POLICY "owners read own" ON owner_profiles
  FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "owners insert own" ON owner_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "owners update own" ON owner_profiles
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "admins delete owners" ON owner_profiles
  FOR DELETE USING (is_admin());
-- Permitir buscar otros owners por email para invitar como co-owner
-- (solo lectura de campos básicos via la app — la app filtra qué columnas devuelve)
CREATE POLICY "owners search others" ON owner_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ----- vet_profiles -----
-- Lectura pública (para directorio futuro y vista del vet en QR)
CREATE POLICY "vet profiles public read" ON vet_profiles
  FOR SELECT USING (true);
CREATE POLICY "vets insert own" ON vet_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "vets update own" ON vet_profiles
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "admins manage vets" ON vet_profiles
  FOR ALL USING (is_admin());

-- ----- admin_users -----
CREATE POLICY "admins read admins" ON admin_users
  FOR SELECT USING (is_admin());
CREATE POLICY "admins manage admins" ON admin_users
  FOR ALL USING (is_admin());

-- ----- animals -----
CREATE POLICY "owners and co-owners read animals" ON animals
  FOR SELECT USING (owner_has_animal_access(id) OR is_admin());
CREATE POLICY "vets read accessed animals" ON animals
  FOR SELECT USING (vet_has_animal_access(id, true));
-- Lectura pública por url_token (para que el vet pueda escanear QR sin auth todavía)
-- El acceso real al historial requiere vet_has_animal_access — esto solo permite ver el animal por su token
CREATE POLICY "public read by url_token via function" ON animals
  FOR SELECT USING (true);
  -- ↑ Cuidado: esto deja la tabla legible. La app NUNCA debe exponer queries directas a animals desde el cliente.
  -- Las queries siempre van vía server actions con filtros explícitos.
CREATE POLICY "owners insert animals" ON animals
  FOR INSERT WITH CHECK (owner_id = current_owner_id());
CREATE POLICY "owners update own animals" ON animals
  FOR UPDATE USING (owner_has_animal_access(id));
CREATE POLICY "owners delete own animals" ON animals
  FOR DELETE USING (owner_id = current_owner_id());

-- ----- co_owners -----
CREATE POLICY "co-owners read related" ON co_owners
  FOR SELECT USING (
    owner_has_animal_access(animal_id) OR is_admin()
  );
CREATE POLICY "primary owner manages co-owners" ON co_owners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM animals a
      WHERE a.id = animal_id
        AND a.owner_id = current_owner_id()
    )
  );
-- Co-owner invitado puede actualizar su propio status (aceptar/rechazar)
CREATE POLICY "invited co-owner accepts" ON co_owners
  FOR UPDATE USING (owner_id = current_owner_id());

-- ----- animal_photos -----
CREATE POLICY "photos read" ON animal_photos
  FOR SELECT USING (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, true)
    OR is_admin()
  );
CREATE POLICY "owners write photos" ON animal_photos
  FOR ALL USING (owner_has_animal_access(animal_id));

-- ----- weight_entries -----
CREATE POLICY "weight read" ON weight_entries
  FOR SELECT USING (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, true)
    OR is_admin()
  );
CREATE POLICY "weight insert by owner or vet" ON weight_entries
  FOR INSERT WITH CHECK (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, false)
  );
CREATE POLICY "weight delete by owner" ON weight_entries
  FOR DELETE USING (owner_has_animal_access(animal_id));

-- ----- vaccines -----
CREATE POLICY "vaccines read" ON vaccines
  FOR SELECT USING (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, true)
    OR is_admin()
  );
CREATE POLICY "vaccines write by owner or vet" ON vaccines
  FOR INSERT WITH CHECK (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, false)
  );
CREATE POLICY "vaccines update by owner or vet" ON vaccines
  FOR UPDATE USING (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, false)
  );
CREATE POLICY "vaccines delete by owner" ON vaccines
  FOR DELETE USING (owner_has_animal_access(animal_id));

-- ----- deworming -----
CREATE POLICY "deworming read" ON deworming
  FOR SELECT USING (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, true)
    OR is_admin()
  );
CREATE POLICY "deworming write" ON deworming
  FOR INSERT WITH CHECK (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, false)
  );
CREATE POLICY "deworming delete by owner" ON deworming
  FOR DELETE USING (owner_has_animal_access(animal_id));

-- ----- medications -----
CREATE POLICY "medications read" ON medications
  FOR SELECT USING (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, true)
    OR is_admin()
  );
CREATE POLICY "medications write" ON medications
  FOR INSERT WITH CHECK (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, false)
  );
CREATE POLICY "medications update" ON medications
  FOR UPDATE USING (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, false)
  );
CREATE POLICY "medications delete by owner" ON medications
  FOR DELETE USING (owner_has_animal_access(animal_id));

-- ----- allergies -----
CREATE POLICY "allergies read" ON allergies
  FOR SELECT USING (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, true)
    OR is_admin()
  );
CREATE POLICY "allergies write" ON allergies
  FOR INSERT WITH CHECK (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, false)
  );
CREATE POLICY "allergies delete by owner" ON allergies
  FOR DELETE USING (owner_has_animal_access(animal_id));

-- ----- medical_records -----
-- Owner ve campos públicos; vet ve TODO (incluyendo private_notes propias)
-- private_notes se filtra a nivel de aplicación porque RLS no filtra columnas individuales.
-- Convención server: si current_vet_id() != record.vet_id, NO devolver private_notes.
CREATE POLICY "medical records read by owner" ON medical_records
  FOR SELECT USING (owner_has_animal_access(animal_id));
CREATE POLICY "medical records read by any vet with access" ON medical_records
  FOR SELECT USING (vet_has_animal_access(animal_id, true));
CREATE POLICY "admins read medical records" ON medical_records
  FOR SELECT USING (is_admin());
CREATE POLICY "vets create medical records" ON medical_records
  FOR INSERT WITH CHECK (
    vet_id = current_vet_id()
    AND vet_has_animal_access(animal_id, false)
  );
CREATE POLICY "vets update own medical records" ON medical_records
  FOR UPDATE USING (vet_id = current_vet_id());
-- Nota: el dueño NO puede editar (decisión 3A)

-- ----- medical_attachments -----
CREATE POLICY "medical attachments read" ON medical_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medical_records mr
      WHERE mr.id = medical_record_id
        AND (
          owner_has_animal_access(mr.animal_id)
          OR vet_has_animal_access(mr.animal_id, true)
        )
    )
    OR is_admin()
  );
CREATE POLICY "vets attach to own records" ON medical_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM medical_records mr
      WHERE mr.id = medical_record_id
        AND mr.vet_id = current_vet_id()
    )
  );

-- ----- prescriptions -----
CREATE POLICY "prescriptions read" ON prescriptions
  FOR SELECT USING (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, true)
    OR is_admin()
  );
CREATE POLICY "vets create prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (
    vet_id = current_vet_id()
    AND vet_has_animal_access(animal_id, false)
  );

-- ----- studies -----
CREATE POLICY "studies read" ON studies
  FOR SELECT USING (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, true)
    OR is_admin()
  );
CREATE POLICY "studies write by owner or vet" ON studies
  FOR INSERT WITH CHECK (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, false)
  );
CREATE POLICY "studies delete by owner" ON studies
  FOR DELETE USING (owner_has_animal_access(animal_id));

-- ----- certificates -----
CREATE POLICY "certificates read" ON certificates
  FOR SELECT USING (
    owner_has_animal_access(animal_id)
    OR vet_has_animal_access(animal_id, true)
    OR is_admin()
  );
CREATE POLICY "vets create certificates" ON certificates
  FOR INSERT WITH CHECK (
    vet_id = current_vet_id()
    AND vet_has_animal_access(animal_id, false)
  );

-- ----- vet_access -----
CREATE POLICY "vets see their access requests" ON vet_access
  FOR SELECT USING (vet_id = current_vet_id());
CREATE POLICY "owners see access on their animals" ON vet_access
  FOR SELECT USING (owner_has_animal_access(animal_id));
CREATE POLICY "admins read all access" ON vet_access
  FOR SELECT USING (is_admin());
CREATE POLICY "vets request access" ON vet_access
  FOR INSERT WITH CHECK (vet_id = current_vet_id() AND status = 'pending');
CREATE POLICY "owners approve/revoke access" ON vet_access
  FOR UPDATE USING (owner_has_animal_access(animal_id));
CREATE POLICY "vets archive own access" ON vet_access
  FOR UPDATE USING (vet_id = current_vet_id());

-- ----- appointments -----
CREATE POLICY "appointments read" ON appointments
  FOR SELECT USING (
    owner_has_animal_access(animal_id)
    OR (vet_id IS NOT NULL AND vet_id = current_vet_id())
    OR is_admin()
  );
CREATE POLICY "appointments write" ON appointments
  FOR ALL USING (
    owner_has_animal_access(animal_id)
    OR (vet_id IS NOT NULL AND vet_id = current_vet_id())
  );

-- ----- lost_pet_alerts -----
-- Lectura pública de alerts activas (URL /lost/[slug])
CREATE POLICY "lost alerts public read active" ON lost_pet_alerts
  FOR SELECT USING (status = 'active');
CREATE POLICY "owners manage lost alerts" ON lost_pet_alerts
  FOR ALL USING (owner_has_animal_access(animal_id));

-- ----- google_vets_cache -----
CREATE POLICY "google vets public read" ON google_vets_cache
  FOR SELECT USING (true);
CREATE POLICY "admins manage google cache" ON google_vets_cache
  FOR ALL USING (is_admin());

-- ----- subscriptions -----
CREATE POLICY "vets read own subscription" ON subscriptions
  FOR SELECT USING (vet_id = current_vet_id());
CREATE POLICY "admins manage subscriptions" ON subscriptions
  FOR ALL USING (is_admin());

-- ----- manual_payments -----
CREATE POLICY "vets read own payments" ON manual_payments
  FOR SELECT USING (vet_id = current_vet_id());
CREATE POLICY "admins manage payments" ON manual_payments
  FOR ALL USING (is_admin());

-- ----- verification_requests -----
CREATE POLICY "vets see own verification" ON verification_requests
  FOR SELECT USING (vet_id = current_vet_id());
CREATE POLICY "vets request own verification" ON verification_requests
  FOR INSERT WITH CHECK (vet_id = current_vet_id());
CREATE POLICY "admins manage verifications" ON verification_requests
  FOR ALL USING (is_admin());

-- ----- consult_templates -----
CREATE POLICY "templates read" ON consult_templates
  FOR SELECT USING (
    is_system = true
    OR vet_id = current_vet_id()
  );
CREATE POLICY "vets manage own templates" ON consult_templates
  FOR ALL USING (vet_id = current_vet_id());
CREATE POLICY "admins manage system templates" ON consult_templates
  FOR ALL USING (is_admin() AND is_system = true);

-- ----- notifications -----
CREATE POLICY "users read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ----- audit_log -----
CREATE POLICY "admins read audit log" ON audit_log
  FOR SELECT USING (is_admin());

-- ----- email_logs -----
CREATE POLICY "admins read email logs" ON email_logs
  FOR SELECT USING (is_admin());

-- =============================================================
-- FIN
-- Para revisar policies activas:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
-- =============================================================
