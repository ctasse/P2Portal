export function generateCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = 100000 + (array[0] % 900000);
  return String(code);
}

export function isValidCode(input: string): boolean {
  return /^\d{6}$/.test(input);
}

export function isCollisionError(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return (
    msg.includes('id') &&
    (msg.includes('taken') ||
      msg.includes('unavailable') ||
      msg.includes('exist') ||
      msg.includes('already'))
  );
}
