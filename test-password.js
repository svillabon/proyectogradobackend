const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'admin123';
  const storedHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  
  console.log('Testing password:', password);
  console.log('Stored hash:', storedHash);
  
  const isValid = await bcrypt.compare(password, storedHash);
  console.log('Password valid:', isValid);
  
  // Generate new hash
  const newHash = await bcrypt.hash(password, 10);
  console.log('\nNew hash generated:', newHash);
  
  const newTest = await bcrypt.compare(password, newHash);
  console.log('New hash test:', newTest);
}

testPassword();
