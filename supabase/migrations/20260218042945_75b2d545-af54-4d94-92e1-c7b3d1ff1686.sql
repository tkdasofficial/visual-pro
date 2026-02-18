
-- PHASE 2: Add cross-reference admin RLS policies (has_role function now exists)

-- Profiles: Admin can view all
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'ceo') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'director') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'support') OR
    public.has_role(auth.uid(), 'analyst')
  );

-- Profiles: Admin can update
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'ceo') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'director') OR
    public.has_role(auth.uid(), 'manager')
  );

-- User Roles: Admin can view
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'ceo') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'director') OR
    public.has_role(auth.uid(), 'manager')
  );

-- User Roles: Admin can insert
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'ceo') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'director') OR
    public.has_role(auth.uid(), 'manager')
  );

-- User Roles: Senior admins can delete
CREATE POLICY "Senior admins can delete roles" ON public.user_roles
  FOR DELETE USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'ceo') OR
    public.has_role(auth.uid(), 'super_admin')
  );

-- Credits: Admins can view
CREATE POLICY "Admins can view all credits" ON public.credits
  FOR SELECT USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'ceo') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'director') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'analyst')
  );

-- Credits: Admins can update
CREATE POLICY "Admins can update all credits" ON public.credits
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'ceo') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- Generation logs: Admins can view
CREATE POLICY "Admins can view all logs" ON public.generation_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'ceo') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'director') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'support') OR
    public.has_role(auth.uid(), 'analyst')
  );

-- Generation logs: Admins can update
CREATE POLICY "Admins can update logs" ON public.generation_logs
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'super_admin')
  );

-- Referrals: Admins can view
CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR SELECT USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'ceo') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'analyst')
  );

-- Audit logs: Admins can view
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'ceo') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'director')
  );

-- Fix the overly permissive audit_logs INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
