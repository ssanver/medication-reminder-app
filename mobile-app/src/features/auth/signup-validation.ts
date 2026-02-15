export type SignUpForm = {
  name: string;
  email: string;
  password: string;
};

export function isSignUpFormValid(form: SignUpForm): boolean {
  const name = form.name.trim();
  const email = form.email.trim();
  const password = form.password;

  if (!name || !email || !password) {
    return false;
  }

  if (!email.includes('@')) {
    return false;
  }

  return password.trim().length >= 6;
}
