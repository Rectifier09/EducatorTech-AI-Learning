-- 0007_referral_fk.sql
-- 0006's referred_by FK had no ON DELETE clause (defaults to NO ACTION),
-- which would block deleting a referrer once any row actually references
-- them (Fix 1 in the same pass is what makes that happen for the first
-- time). Re-declare as SET NULL — losing the referrer's identity is the
-- correct behavior once they're gone; the referred user's own row and
-- account are untouched.
alter table public.profiles
  drop constraint if exists profiles_referred_by_fkey,
  add constraint profiles_referred_by_fkey
    foreign key (referred_by) references auth.users(id) on delete set null;
