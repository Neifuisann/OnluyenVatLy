
require('dotenv').config();
const databaseService = require('./lib/services/databaseService');

async function findStudent() {
  try {
    const students = await databaseService.getStudents({ limit: 1000 });
    const target = students.find(s => s.full_name.includes('Đào Huỳnh Gia Huy'));
    if (target) {
      console.log('STUDENT_ID:', target.id);
      console.log('STUDENT_NAME:', target.full_name);
    } else {
      console.log('Student not found');
      // List some students to see what's there
      console.log('Available students:', students.map(s => s.full_name).join(', '));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

findStudent();
