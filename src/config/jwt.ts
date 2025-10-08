const jwtConfig = {
  secret: process.env.JWT_SECRET_KEY || "secret_key", 
  expiresIn: "1h", 
};

export default jwtConfig;
