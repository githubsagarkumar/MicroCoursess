const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  console.log('Setting up database...');
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  db.run(
    'INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    ['admin@admin.microcourses.com', adminPassword, 'Admin User', 'admin'],
    function(err) {
      if (err) {
        console.error('Error creating admin user:', err);
      } else {
        console.log('Admin user created successfully');
        console.log('Email: admin@admin.microcourses.com');
        console.log('Password: admin123');
      }
    }
  );

  // Create sample creator user
  const creatorPassword = await bcrypt.hash('creator123', 10);
  
  db.run(
    'INSERT OR IGNORE INTO users (email, password, name, role, creator_status) VALUES (?, ?, ?, ?, ?)',
    ['creator@creator.microcourses.com', creatorPassword, 'Sample Creator', 'creator', 'approved'],
    function(err) {
      if (err) {
        console.error('Error creating creator user:', err);
      } else {
        console.log('Sample creator user created successfully');
        console.log('Email: creator@creator.microcourses.com');
        console.log('Password: creator123');
      }
    }
  );

  // Create sample learner user
  const learnerPassword = await bcrypt.hash('learner123', 10);
  
  db.run(
    'INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    ['learner@learner.microcourses.com', learnerPassword, 'Sample Learner', 'learner'],
    function(err) {
      if (err) {
        console.error('Error creating learner user:', err);
      } else {
        console.log('Sample learner user created successfully');
        console.log('Email: learner@learner.microcourses.com');
        console.log('Password: learner123');
      }
    }
  );

  console.log('\nDatabase setup completed!');
  console.log('\nTest credentials:');
  console.log('Admin: admin@admin.microcourses.com / admin123');
  console.log('Creator: creator@creator.microcourses.com / creator123');
  console.log('Learner: learner@learner.microcourses.com / learner123');
  console.log('\nEmail-based role system:');
  console.log('- @admin.microcourses.com → Admin role');
  console.log('- @creator.microcourses.com → Creator role');
  console.log('- @learner.microcourses.com → Learner role');
  console.log('- Other emails → Learner role (default)');
}

setupDatabase();
