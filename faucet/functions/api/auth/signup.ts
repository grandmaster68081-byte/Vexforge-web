import { allowRate, hashPassword, issueSession, rateKey } from '../_lib/auth';
import type { Env } from '../_lib/env';
import { db } from '../_lib/supabase';
import { error, json } from '../_lib/response';

type CreatedAccount = {
  id: string;
  public_id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!(await allowRate(env, `signup:${await rateKey(request)}`, 5, 3600))) {
    return error('Too many signup attempts. Please try again later.', 429);
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const username = String(body?.username ?? '').trim().toLowerCase();
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return error('Username must be 3–20 characters using letters, numbers or underscores.');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return error('Enter a valid email address.');
  }
  if (password.length < 8 || password.length > 128) {
    return error('Password must be 8–128 characters.');
  }

  const client = db(env);
  const [emailResult, usernameResult] = await Promise.all([
    client.from('accounts').select('id').eq('email', email).limit(1),
    client.from('accounts').select('id').eq('username', username).limit(1),
  ]);
  if (emailResult.error || usernameResult.error) {
    console.error('Kivora signup duplicate check failed', emailResult.error ?? usernameResult.error);
    return error('Account services are temporarily unavailable. Please try again later.', 503);
  }
  if (emailResult.data?.length || usernameResult.data?.length) {
    return error('That email or username is already in use.', 409);
  }

  const passwordData = await hashPassword(password);
  const publicId = crypto.randomUUID().replaceAll('-', '').slice(0, 24);
  const { data: accountData, error: accountError } = await client
    .rpc('create_account_with_wallet', {
      p_public_id: publicId,
      p_username: username,
      p_email: email,
      p_password_hash: passwordData.hash,
      p_password_salt: passwordData.salt,
      p_password_iterations: passwordData.iterations,
    })
    .single();
  const account = accountData as CreatedAccount | null;

  if (accountError || !account) {
    if (accountError?.code === '23505') {
      return error('That email or username is already in use.', 409);
    }
    console.error('Kivora account creation failed', accountError);
    return error('Account services are temporarily unavailable. Please try again later.', 503);
  }

  try {
    const session = await issueSession(env, account.id, request);
    return json({
      user: {
        id: account.id,
        publicId: account.public_id,
        username: account.username,
        email: account.email,
        role: account.role,
      },
    }, 201, session.headers);
  } catch (cause) {
    console.error('Kivora signup session creation failed', cause);
    return error('Your account was created. Please sign in to continue.', 503);
  }
};
