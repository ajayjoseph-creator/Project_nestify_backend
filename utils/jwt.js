import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const tokensecret=process.env.JWT_SECRET
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET, // ✅ use same key here
    { expiresIn: '1d' }
  );
};

console.log('jwt secret :',tokensecret)

export const authentication = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
//   console.log(req.headers.authorization.split(' ')[1],"ghjkl")
  console.log(token,"token aanu tto")
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Verify error:', error);
    res.status(401).json({ message: 'Token invalid' }); 
  }
};