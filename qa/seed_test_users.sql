-- Create test users for all 4 tiers
-- 1. Free tier
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  'test.free@creatoros.com',
  crypt('TestFree123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Free Tester"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
VALUES (
  '11111111-1111-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000001',
  'test.free@creatoros.com',
  'email',
  '{"sub":"11111111-0000-0000-0000-000000000001","email":"test.free@creatoros.com"}'::jsonb,
  NOW(), NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, subscription_tier, membership_status, full_name)
VALUES ('11111111-0000-0000-0000-000000000001', 'free', 'inactive', 'Free Tester')
ON CONFLICT (id) DO UPDATE SET subscription_tier='free', membership_status='inactive', full_name='Free Tester';

-- 2. Creator tier
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  '22222222-0000-0000-0000-000000000002',
  'test.creator@creatoros.com',
  crypt('TestCreator123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Creator Tester"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
VALUES (
  '22222222-2222-0000-0000-000000000002',
  '22222222-0000-0000-0000-000000000002',
  'test.creator@creatoros.com',
  'email',
  '{"sub":"22222222-0000-0000-0000-000000000002","email":"test.creator@creatoros.com"}'::jsonb,
  NOW(), NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, subscription_tier, membership_status, full_name)
VALUES ('22222222-0000-0000-0000-000000000002', 'creator', 'active', 'Creator Tester')
ON CONFLICT (id) DO UPDATE SET subscription_tier='creator', membership_status='active', full_name='Creator Tester';

-- 3. Pro tier
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  '33333333-0000-0000-0000-000000000003',
  'test.pro@creatoros.com',
  crypt('TestPro123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Pro Tester"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
VALUES (
  '33333333-3333-0000-0000-000000000003',
  '33333333-0000-0000-0000-000000000003',
  'test.pro@creatoros.com',
  'email',
  '{"sub":"33333333-0000-0000-0000-000000000003","email":"test.pro@creatoros.com"}'::jsonb,
  NOW(), NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, subscription_tier, membership_status, full_name)
VALUES ('33333333-0000-0000-0000-000000000003', 'pro', 'active', 'Pro Tester')
ON CONFLICT (id) DO UPDATE SET subscription_tier='pro', membership_status='active', full_name='Pro Tester';

-- 4. Agency tier
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  '44444444-0000-0000-0000-000000000004',
  'test.agency@creatoros.com',
  crypt('TestAgency123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Agency Tester"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
VALUES (
  '44444444-4444-0000-0000-000000000004',
  '44444444-0000-0000-0000-000000000004',
  'test.agency@creatoros.com',
  'email',
  '{"sub":"44444444-0000-0000-0000-000000000004","email":"test.agency@creatoros.com"}'::jsonb,
  NOW(), NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, subscription_tier, membership_status, full_name)
VALUES ('44444444-0000-0000-0000-000000000004', 'agency', 'active', 'Agency Tester')
ON CONFLICT (id) DO UPDATE SET subscription_tier='agency', membership_status='active', full_name='Agency Tester';
