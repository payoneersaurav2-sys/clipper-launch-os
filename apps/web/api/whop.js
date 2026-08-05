export default function handler(req, res) {
  // Whop injects this header into the iframe's initial request
  const token = req.headers['x-whop-user-token'];
  
  if (!token) {
    // If no token, they didn't load this inside Whop, fallback to normal login
    return res.redirect('/login');
  }
  
  // Bounce the token to our React frontend to process
  res.redirect(`/auth/iframe?token=${token}`);
}
