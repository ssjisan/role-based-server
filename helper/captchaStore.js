const captchaStore = new Map();

/**
 * Generate new captcha
 */
function createCaptcha() {
  // Two digit numbers only (10-99)
  const num1 = Math.floor(Math.random() * 9) + 1;
  const num2 = Math.floor(Math.random() * 90) + 10;

  const answer = num1 + num2;

  const id = Math.random().toString(36).substring(2, 10);

  captchaStore.set(id, {
    answer,
    expiresAt: Date.now() + 3 * 60 * 1000, // 3 minutes
  });

  return {
    id,
    question: `${num1} + ${num2} = ?`,
  };
}

/**
 * Verify captcha
 */
function verifyCaptcha(id, userAnswer) {
  const data = captchaStore.get(id);

  if (!data) return false;

  // Check expiry
  if (Date.now() > data.expiresAt) {
    captchaStore.delete(id);
    return false;
  }

  const isValid = Number(userAnswer) === data.answer;

  // One-time use (important for security)
  captchaStore.delete(id);

  return isValid;
}

module.exports = {
  createCaptcha,
  verifyCaptcha,
};
