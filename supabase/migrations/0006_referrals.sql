-- 0006_referrals.sql
-- Referral attribution: each user can have their own shareable code, and
-- at most one referrer. Both nullable — null referral_code means "hasn't
-- opened the Share UI yet"; null referred_by means "signed up organically".
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references auth.users(id);
