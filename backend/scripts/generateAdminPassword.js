const bcrypt = require('bcryptjs');

// Generate hashed password for default admin
const generateAdminPassword = async () => {
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log('=================================');
  console.log('Default Admin Credentials:');
  console.log('=================================');
  console.log('Username: admin');
  console.log('Email: admin@toysstore.com');
  console.log('Password: admin123');
  console.log('=================================');
  console.log('\nHashed Password for SQL:');
  console.log(hashedPassword);
  console.log('=================================');
  console.log('\nIMPORTANT: Change this password after first login!');
  console.log('=================================');
};

generateAdminPassword();
